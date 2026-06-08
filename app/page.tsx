"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import PromptPanel from "@/components/PromptPanel";
import PreviewPanel from "@/components/PreviewPanel";
import Header from "@/components/Header";
import Modal from "@/components/Modal";

// Tip koji opisuje rezultat generiranja: HTML sadržaj i statistika tokena
export interface GenerationResult {
  html: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export default function Home() {
  // Trenutni tekst koji korisnik upisuje kao opis željene stranice
  const [prompt, setPrompt] = useState("");
  // Označava je li generiranje u tijeku (koristi se za prikaz loadera)
  const [isGenerating, setIsGenerating] = useState(false);
  // Posljednji generirani rezultat (HTML + tokeni)
  const [result, setResult] = useState<GenerationResult | null>(null);
  // Poruka greške ako generiranje ne uspije
  const [error, setError] = useState<string | null>(null);
  // Poruka za modal kad model detektira zahtjev izvan scopea aplikacije
  const [scopeMessage, setScopeMessage] = useState<string | null>(null);
  // Trajanje posljednjeg generiranja u sekundama
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  // Edit mode — aktivan nakon prvog generiranja; prompt se tada šalje kao modifikacija
  const [editMode, setEditMode] = useState(false);
  // Indeks history itema koji se trenutno prikazuje/modificira (null = novi, još nije spreman)
  const [activeHistoryIndex, setActiveHistoryIndex] = useState<number | null>(null);
  // Lista svih prethodnih generiranja — inicijalno prazna, popunit će se iz localStorage
  const [history, setHistory] = useState<
    { prompt: string; result: GenerationResult; timestamp: Date }[]
  >([]);
  // Flag koji sprječava snimanje u localStorage dok početno učitavanje nije završeno.
  // Bez ovoga, useEffect za snimanje bi se pokrenuo s history=[] i obrisao spremljene podatke.
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Pri mountanju komponente učitavamo povijest iz localStorage-a
  useEffect(() => {
    try {
      const saved = localStorage.getItem("generation-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        // timestamp je u JSON-u pohranjen kao string — pretvaramo ga natrag u Date objekt
        const restored = parsed.map((item: {
          prompt: string;
          result: GenerationResult;
          timestamp: string;
        }) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(restored);
      }
    } catch {
      // Ako je localStorage oštećen, ignoriramo i počinjemo s praznom poviješću
      localStorage.removeItem("generation-history");
    } finally {
      // Tek sad dopuštamo snimanje — history je ili učitan ili je potvrđeno da ga nema
      setHistoryLoaded(true);
    }
  }, []);

  // Svaki put kad se history promijeni, sinkroniziramo ga s localStorage-om.
  // Preskačemo dok historyLoaded nije true kako ne bismo prepisali podatke s praznom listom.
  useEffect(() => {
    if (!historyLoaded) return;
    try {
      localStorage.setItem("generation-history", JSON.stringify(history));
    } catch {
      // localStorage je pun (QuotaExceededError) — zadržavamo samo zadnjih 5 generiranja
      try {
        localStorage.setItem(
          "generation-history",
          JSON.stringify(history.slice(0, 5))
        );
      } catch {
        // Ni to ne uspijeva — odustajemo tiho
      }
    }
  }, [history, historyLoaded]);

  // Briše cijelu povijest iz state-a i localStorage-a
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("generation-history");
  }, []);

  // Referenca na AbortController — omogućuje otkazivanje aktivnog HTTP zahtjeva
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ref koji uvijek drži aktualnu vrijednost result-a — koristi se u handleExportHTML
  // kako bi se izbjegao stale closure problem s useCallback
  const resultRef = useRef(result);
  useEffect(() => { resultRef.current = result; }, [result]);

  // Glavna funkcija koja šalje prompt na API i čita streaming odgovor
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    // Ako postoji prethodni zahtjev koji još nije završio, otkazujemo ga
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setError(null);
    setGenerationTime(null);

    // Bilježimo trenutak početka generiranja
    const startTime = Date.now();

    try {
      // U edit modu šaljemo i postojeći HTML kako bi model znao što modificirati
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          existingHtml: editMode ? resultRef.current?.html : undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Greška pri generiranju");
      }

      if (!response.body) throw new Error("Nema tijela odgovora");

      // Čitamo streaming odgovor chunk po chunk dok ne primimo cijeli HTML
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Dekodiramo primljeni chunk i dodajemo ga akumuliranom tekstu
        accumulated += decoder.decode(value, { stream: true });

        // Provjeravamo je li API signalizirao grešku posebnim markerom
        if (accumulated.includes("\x00ERROR\x00")) {
          const idx = accumulated.indexOf("\x00ERROR\x00");
          throw new Error(accumulated.substring(idx + "\x00ERROR\x00".length));
        }

        // Kada primimo marker završetka, parsiramo HTML i podatke o tokenima
        if (accumulated.includes("\x00DONE\x00")) {
          const idx = accumulated.indexOf("\x00DONE\x00");
          const rawHtml = accumulated.substring(0, idx);
          const usageJson = accumulated.substring(idx + "\x00DONE\x00".length);

          // Uklanjamo eventualne markdown code block oznake koje model može dodati
          const cleanHtml = rawHtml
            .replace(/^```html\s*/im, "")
            .replace(/^```\s*/im, "")
            .replace(/\s*```\s*$/im, "")
            .trim();

          // Provjeravamo je li model signalizirao da je zahtjev izvan scopea.
          // U tom slučaju prikazujemo modal umjesto HTML pregleda.
          if (cleanHtml.startsWith("IZVAN_SCOPEA:")) {
            setScopeMessage(cleanHtml.replace(/^IZVAN_SCOPEA:\s*/, "").trim());
            break;
          }

          const genResult: GenerationResult = {
            html: cleanHtml,
            usage: JSON.parse(usageJson),
          };

          // Računamo koliko je sekundi trajalo generiranje
          setGenerationTime((Date.now() - startTime) / 1000);

          setResult(genResult);
          setEditMode(true);
          setPrompt("");

          if (editMode && activeHistoryIndex !== null) {
            // Modifikacija — ažuriramo postojeći history item, ne dodajemo novi
            setHistory((prev) =>
              prev.map((item, i) =>
                i === activeHistoryIndex ? { ...item, result: genResult } : item
              )
            );
          } else {
            // Novo generiranje — dodajemo na početak, novi item je na indeksu 0
            setHistory((prev) => [
              { prompt, result: genResult, timestamp: new Date() },
              ...prev,
            ]);
            setActiveHistoryIndex(0);
          }
          break;
        }
      }
    } catch (err: unknown) {
      // AbortError znači da je korisnik pokrenuo novo generiranje — ignoriramo
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Nepoznata greška");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating]);

  // Sprema generirani HTML kao .html datoteku na korisnikov uređaj.
  // Koristi resultRef umjesto result iz closurea kako bi uvijek imao aktualnu vrijednost.
  // application/octet-stream zaobilazi Chrome-ovu blokadu downloada .html datoteka s localhoste
  const handleExportHTML = useCallback(() => {
    const html = resultRef.current?.html;
    if (!html) return;

    const blob = new Blob([html], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-page-${Date.now()}.html`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }, []);

  // Izlazi iz edit moda i resetira stanje za generiranje nove stranice
  const handleNewPage = useCallback(() => {
    setEditMode(false);
    setActiveHistoryIndex(null);
    setPrompt("");
    setResult(null);
    setGenerationTime(null);
    setError(null);
  }, []);

  // Učitava odabrani unos iz povijesti — ulazi u edit mode za tu stranicu
  const handleLoadFromHistory = useCallback(
    (index: number) => {
      const item = history[index];
      setResult(item.result);
      setEditMode(true);
      setActiveHistoryIndex(index);
      setPrompt("");
      setGenerationTime(null);
      setError(null);
    },
    [history]
  );

  return (
    // Cijela aplikacija zauzima visinu viewporta, bez skrolanja na razini stranice
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      {/* Modal za prikaz poruke kad je zahtjev izvan scopea alata */}
      <Modal
        isOpen={!!scopeMessage}
        onClose={() => setScopeMessage(null)}
        title="Izvan opsega"
      >
        {scopeMessage}
      </Modal>

      <main className="flex-1 flex overflow-hidden">
        {/* Lijevi panel — unos prompta, gumbi, primjeri i povijest */}
        <PromptPanel
          prompt={prompt}
          setPrompt={setPrompt}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          onNewPage={handleNewPage}
          editMode={editMode}
          activeHistoryIndex={activeHistoryIndex}
          hasResult={!!result}
          history={history}
          onLoadFromHistory={handleLoadFromHistory}
          onClearHistory={handleClearHistory}
          error={error}
          usage={result?.usage}
          generationTime={generationTime}
        />

        {/* Desni panel — preview generirane stranice u iframeu */}
        <PreviewPanel
          html={result?.html || null}
          isGenerating={isGenerating}
          onExport={handleExportHTML}
        />
      </main>
    </div>
  );
}
