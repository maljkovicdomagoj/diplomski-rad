"use client";

import { useState } from "react";
import {
  Pen,
  Clock,
  Zap,
  ArrowRight,
  FileText,
  Inbox,
  AlertCircle,
  Trash2,
  Pencil,
  PlusCircle,
} from "lucide-react";

// Tip jednog unosa u povijesti generiranja
interface HistoryItem {
  prompt: string;
  title?: string;
  result: { html: string; usage: { input_tokens: number; output_tokens: number } };
  timestamp: Date;
}

// Props koje prima lijevi panel od roditeljske komponente (page.tsx)
interface PromptPanelProps {
  prompt: string;
  setPrompt: (val: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onNewPage: () => void;
  editMode: boolean;
  activeHistoryIndex: number | null;
  hasResult: boolean;
  history: HistoryItem[];
  onLoadFromHistory: (index: number) => void;
  onClearHistory: () => void;
  error: string | null;
  usage?: { input_tokens: number; output_tokens: number };
  generationTime: number | null;
}

// Izvlači kratak naslov iz punog prompta uklanjanjem boilerplate fraza
function extractTitle(prompt: string): string {
  const cleaned = prompt.trim()
    .replace(/^(napravi|izradi|generiraj|stvori)\s+/i, "")
    .replace(/^(landing page za|web stranicu za|stranicu za|portfolio za)\s*/i, "")
    .replace(/^(landing page|web stranica|stranica|portfolio stranica)\s+(za\s+)?/i, "")
    .replace(/^za\s+/i, "")
    .replace(/\s*'[^']*'/g, "")
    .replace(/\s*"[^"]*"/g, "")
    .trim();

  if (cleaned.length <= 30) return cleaned;
  const cut = cleaned.substring(0, 30);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 8 ? cut.substring(0, lastSpace) : cut).trim();
}

// Unaprijed definirani primjeri prompta koje korisnik može jednim klikom učitati
const EXAMPLE_PROMPTS = [
  "Napravi landing page za frizerski salon 'Elegance' s online rezervacijom termina",
  "Landing page za fitness teretanu s cjenikom i rasporedom treninga",
  "Web stranica za pizzeriju s jelovnikom i mogućnošću narudžbe",
  "Landing page za startup koji razvija AI chatbot za korisničku podršku",
  "Portfolio stranica za fotografa vjenčanja s galerijom radova",
  "Landing page za online tečaj programiranja u Pythonu",
];

export default function PromptPanel({
  prompt,
  setPrompt,
  isGenerating,
  onGenerate,
  onNewPage,
  editMode,
  activeHistoryIndex,
  hasResult,
  history,
  onLoadFromHistory,
  onClearHistory,
  error,
  usage,
  generationTime,
}: PromptPanelProps) {
  // Kontrolira koji tab je aktivan: false = Prompt, true = Povijest
  const [showHistory, setShowHistory] = useState(false);
  // Prati je li textarea u fokusu (za crveni border efekt)
  const [focusedTextarea, setFocusedTextarea] = useState(false);
  // Indeks primjera prompta nad kojim se nalazi kursor (hover efekt)
  const [hoveredExample, setHoveredExample] = useState<number | null>(null);
  // Indeks stavke povijesti nad kojom se nalazi kursor (hover efekt)
  const [hoveredHistory, setHoveredHistory] = useState<number | null>(null);

  // Tipkovnička prečica: Ctrl+Enter ili Cmd+Enter pokreće generiranje
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onGenerate();
    }
  };

  // Gumb za generiranje je onemogućen ako nema teksta ili je generiranje već u tijeku
  const isDisabled = isGenerating || !prompt.trim();

  return (
    <div
      style={{
        width: "420px",
        minWidth: "420px",
        borderRight: "1px solid var(--border)",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab traka: prebacivanje između pogleda za unos i pogleda povijesti */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          background: "var(--bg-secondary)",
        }}
      >
        {([
          { id: false, icon: <Pen size={14} />, label: "Prompt" },
          {
            id: true,
            icon: <Clock size={14} />,
            label: `Povijest${history.length > 0 ? ` (${history.length})` : ""}`,
          },
        ] as const).map(({ id, icon, label }) => {
          const active = showHistory === id;
          return (
            <button
              key={String(id)}
              onClick={() => setShowHistory(id)}
              style={{
                flex: 1,
                padding: "11px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                background: "transparent",
                // Aktivni tab dobiva crvenu boju teksta i donji border
                color: active ? "var(--accent)" : "var(--text-muted)",
                border: "none",
                borderBottom: active
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* Pogled za unos prompta */}
      {!showHistory ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            gap: "14px",
            overflowY: "auto",
          }}
        >
          {/* Edit mode banner — prikazuje se kad je stranica već generirana */}
          {editMode && (
            <div
              style={{
                padding: "10px 12px",
                background: "var(--accent-glow)",
                border: "1px solid rgba(229, 62, 62, 0.2)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Pencil size={13} strokeWidth={2} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                Modificiranje stranice
              </span>
            </div>
          )}

          {/* Tekstualno polje za unos opisa željene landing stranice */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "8px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {editMode ? "Opis izmjene" : "Opis stranice"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocusedTextarea(true)}
              onBlur={() => setFocusedTextarea(false)}
              placeholder={editMode
                ? "Opišite što želite promijeniti...\n\nnpr. 'Promijeni pricing sekciju na 3 plana', 'Dodaj sekciju s recenzijama', 'Promijeni boju pozadine hero sekcije u tamno plavu'"
                : "Opišite stranicu koju želite generirati...\n\nnpr. 'Napravi landing page za frizerski salon s modernim dizajnom, sekcijom za usluge, cjenikom i kontakt formom'"
              }
              style={{
                width: "100%",
                height: "200px",
                padding: "13px 14px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13.5px",
                lineHeight: "1.65",
                background: "var(--bg-primary)",
                // Crveni border i glow efekt kad je textarea u fokusu
                border: focusedTextarea
                  ? "2px solid var(--accent)"
                  : "1.5px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: focusedTextarea
                  ? "0 0 0 3px var(--accent-glow)"
                  : "none",
              }}
            />
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "5px",
              }}
            >
              Ctrl + Enter za brzo generiranje
            </p>
          </div>

          {/* Primarni CTA gumb — crveni gradijent, aktivan samo kad postoji tekst */}
          <button
            onClick={onGenerate}
            disabled={isDisabled}
            style={{
              width: "100%",
              padding: "13px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              background: isDisabled
                ? "var(--bg-tertiary)"
                : "linear-gradient(135deg, #E53E3E 0%, #C53030 100%)",
              color: isDisabled ? "var(--text-muted)" : "white",
              border: "none",
              borderRadius: "10px",
              cursor: isDisabled ? "not-allowed" : "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: isDisabled
                ? "none"
                : "0 2px 8px rgba(229, 62, 62, 0.3)",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(229, 62, 62, 0.38)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isDisabled
                ? "none"
                : "0 2px 8px rgba(229, 62, 62, 0.3)";
            }}
          >
            {/* Spinner za prikaz učitavanja, inače ikona munje */}
            {isGenerating ? (
              <>
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.75s linear infinite",
                    flexShrink: 0,
                  }}
                />
                Generiram stranicu...
              </>
            ) : (
              <>
                {editMode ? <Pencil size={15} strokeWidth={2.2} /> : <Zap size={15} strokeWidth={2.2} />}
                {editMode ? "Primijeni izmjenu" : "Generiraj stranicu"}
              </>
            )}
          </button>


          {/* Prikaz poruke greške ako generiranje nije uspjelo */}
          {error && (
            <div
              style={{
                padding: "11px 14px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                background: "rgba(197, 48, 48, 0.06)",
                border: "1px solid rgba(197, 48, 48, 0.25)",
                borderRadius: "10px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "var(--error)",
                lineHeight: "1.5",
              }}
            >
              <AlertCircle size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: "1px" }} />
              {error}
            </div>
          )}

          {/* Kartica s brojem utrošenih tokena i vremenom generiranja — prikazuje se nakon generiranja */}
          {usage && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              {[
                { label: "Input", value: usage.input_tokens, unit: "tokena" },
                { label: "Output", value: usage.output_tokens, unit: "tokena" },
              ].map(({ label, value, unit }) => (
                <div key={label}>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {value.toLocaleString()}{" "}
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
                      {unit}
                    </span>
                  </span>
                </div>
              ))}

              {/* Vrijeme generiranja — odvaja se tankom linijom od token podataka */}
              {generationTime !== null && (
                <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    Vrijeme
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {generationTime.toFixed(1)}{" "}
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>
                      s
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Gumb "Nova stranica" ispod statistike i vremena */}
          {editMode && (
            <button
              onClick={onNewPage}
              style={{
                width: "100%",
                padding: "11px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-tertiary)";
                e.currentTarget.style.borderColor = "var(--border-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-secondary)";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <PlusCircle size={14} strokeWidth={2} />
              Nova stranica
            </button>
          )}

          {/* Lista primjera prompta — sakrivena u edit modu */}
          {!editMode && <div>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "10.5px",
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: "9px",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Primjeri
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {EXAMPLE_PROMPTS.map((example, i) => {
                const hovered = hoveredExample === i;
                return (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    onMouseEnter={() => setHoveredExample(i)}
                    onMouseLeave={() => setHoveredExample(null)}
                    style={{
                      padding: "9px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "12.5px",
                      lineHeight: "1.45",
                      background: hovered ? "var(--accent-glow)" : "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      // Na hover: lijevi border postaje crven, signalizirajući interaktivnost
                      borderLeft: hovered ? "3px solid var(--accent)" : "3px solid transparent",
                      borderRadius: "8px",
                      color: hovered ? "var(--text-primary)" : "var(--text-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s, border-left-color 0.15s, color 0.15s",
                    }}
                  >
                    <span style={{ flex: 1 }}>{example}</span>
                    {/* Strelica se pojavljuje samo na hover — hint za klik */}
                    <ArrowRight
                      size={12}
                      strokeWidth={2}
                      style={{
                        flexShrink: 0,
                        color: "var(--accent)",
                        opacity: hovered ? 1 : 0,
                        transition: "opacity 0.15s",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>}
        </div>
      ) : (
        /* Pogled povijesti — lista svih generiranja u trenutnoj sesiji */
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {history.length === 0 ? (
            // Prazno stanje — prikazuje se dok korisnik još nije ništa generirao
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 24px",
                gap: "12px",
                textAlign: "center",
              }}
            >
              <Inbox size={44} strokeWidth={1.4} style={{ opacity: 0.35, color: "var(--text-muted)" }} />
              <div>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    margin: "0 0 5px 0",
                  }}
                >
                  Još nema generiranih stranica
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    margin: 0,
                    color: "var(--text-muted)",
                  }}
                >
                  Povijest će se pojaviti ovdje.
                </p>
              </div>
            </div>
          ) : (
            // Lista prethodnih generiranja — klikom se učitava stari prompt i rezultat
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {/* Gumb za brisanje cijele povijesti */}
              <button
                onClick={onClearHistory}
                style={{
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                  marginBottom: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--error)";
                  e.currentTarget.style.color = "var(--error)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Trash2 size={13} strokeWidth={1.8} />
                Obriši povijest
              </button>
              {history.map((item, i) => {
                const hovered = hoveredHistory === i;
                const isActive = activeHistoryIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onLoadFromHistory(i);
                      setShowHistory(false);
                    }}
                    onMouseEnter={() => setHoveredHistory(i)}
                    onMouseLeave={() => setHoveredHistory(null)}
                    style={{
                      padding: "13px 14px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      background: isActive
                        ? "var(--accent-glow-strong)"
                        : hovered
                        ? "var(--accent-glow)"
                        : "var(--bg-secondary)",
                      border: isActive
                        ? "1px solid rgba(229,62,62,0.3)"
                        : "1px solid var(--border)",
                      borderLeft: isActive || hovered
                        ? "3px solid var(--accent)"
                        : "3px solid transparent",
                      borderRadius: "10px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s, border-left-color 0.15s",
                    }}
                  >
                    <FileText
                      size={15}
                      strokeWidth={1.8}
                      style={{
                        flexShrink: 0,
                        marginTop: "2px",
                        color: isActive || hovered ? "var(--accent)" : "var(--text-muted)",
                        transition: "color 0.15s",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Kratki naslov izvučen iz prompta ili generirani naslov */}
                      <p
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          margin: "0 0 3px 0",
                          lineHeight: "1.3",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title || extractTitle(item.prompt)}
                      </p>
                      {/* Metadata: vrijeme i broj tokena */}
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          margin: 0,
                        }}
                      >
                        {item.timestamp.toLocaleTimeString("hr-HR")} —{" "}
                        {item.result.usage.output_tokens.toLocaleString()} tokena
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
