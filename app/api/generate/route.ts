import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Inicijalizacija Anthropic klijenta — API ključ se čita iz .env.local datoteke
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Sistemska uputa za generiranje nove landing stranice
const SYSTEM_PROMPT = `Ti si stručni web dizajner i developer. Tvoj zadatak je generirati kompletne, vizualno atraktivne landing stranice na temelju korisnikovog opisa.

PRAVILA:
1. Vrati ISKLJUČIVO čisti HTML kod — bez markdown blokova, bez \`\`\`html oznaka, bez objašnjenja.
2. Generiraj ISKLJUČIVO:
   - jednu glavnu landing/home stranicu
   - opcionalno jednu dodatnu podstranicu ako je stvarno potrebna
3. Koristi INLINE CSS unutar <style> taga u <head> sekciji.
4. Koristi moderne CSS tehnike: flexbox, grid, gradients, shadows, transitions.
5. Stranica MORA biti responzivna (mobile-first pristup s media queries).
6. Za slike koristi ISKLJUČIVO root-relativnu putanju prema našem API-ju u formatu /api/images?q={ključna_riječ}&w={širina}&h={visina} — npr. za frizera: /api/images?q=hairdresser,salon&w=800&h=500 — uvijek odaberi ključne riječi koje odgovaraju temi stranice (npr. gym,fitness za teretanu, pizza,restaurant za pizzeriju, wedding,photography za fotografa). NIKAD ne koristi placehold.co ni slične servise koji vraćaju samo tekst.
7. Dodaj hover efekte na gumbe i kartice.
8. Koristi Google Fonts za tipografiju (uključi <link> u <head>).
9. Stranica mora imati profesionalan izgled s dobrom hijerarhijom sadržaja.
10. Generiraj sadržaj na HRVATSKOM jeziku osim ako korisnik ne traži drugačije.
11. Uključi smislene sekcije: hero, features/usluge, about, testimonials, CTA, footer.
12. Koristi semantičke HTML5 elemente (header, nav, main, section, footer).
13. Dodaj smooth scroll ponašanje i basic interaktivnost s vanilla JavaScript.
14. SVE mora biti u JEDNOM HTML dokumentu — HTML, CSS i JS zajedno.
15. NE koristi eksterne CSS frameworke (Bootstrap, Tailwind CDN itd.).
17. U <title> tagu u <head> sekciji uvijek navedi kratak, jasan i opisni naslov generirane stranice na hrvatskom jeziku (npr. "Osobni trener za žene" ili "Frizerski salon Elegance"), koji najbolje opisuje svrhu stranice (maksimalno 4-5 riječi).

16. VALIDACIJA SCOPEA — Ako korisnik traži nešto što NIJE jednostranična landing stranica (npr. višestranična web aplikacija, login/registracija, baza podataka, igra, dashboard s autentikacijom, e-commerce s košaricom i narudžbama, chat aplikacija, admin panel, SaaS platforma ili bilo što što zahtijeva backend logiku ili više stranica), NE generiraj HTML. Umjesto toga odgovori ISKLJUČIVO ovim formatom:
IZVAN_SCOPEA: [Ljubazna poruka na hrvatskom koja objašnjava da alat generira samo jednostranične landing stranice. Navedi što konkretno nije u scopeu, te predloži kako preformulirati zahtjev — npr. "Možeš zatražiti landing stranicu koja PRIKAZUJE vaše usluge, s kontakt formom i CTA gumbima, neka poruka ne bude duža od tri rečenice"]

Tvoj output mora početi s <!DOCTYPE html> i završiti s </html>.`;

// Sistemska uputa za modificiranje postojeće landing stranice
const EDIT_SYSTEM_PROMPT = `Ti si web developer koji precizno modificira postojeće HTML landing stranice prema uputama korisnika.

PRAVILA:
1. Vrati ISKLJUČIVO kompletni modificirani HTML dokument — ne samo promijenjeni dio.
2. Implementiraj TOČNO traženu promjenu — ne mijenjaj ništa što nije eksplicitno navedeno.
3. Zadrži sve stilove, boje, fontove, Google Fonts linkove, slike i ostale sekcije kakve jesu.
4. Za nove slike koristi /api/images?q={ključna_riječ}&w={širina}&h={visina} konzistentno s postojećim stilom.
5. Zadrži responzivnost i sve postojeće JavaScript funkcionalnosti.
6. Output mora početi s <!DOCTYPE html> i završiti s </html> — bez markdown oznaka ili objašnjenja.`;

// Posebni markeri kojima API signalizira kraj streaminga ili grešku
// Koriste null byte (\x00) kako bi bili jedinstveni i ne bi se pojavili u HTML-u
const DONE_MARKER = "\x00DONE\x00";
const ERROR_MARKER = "\x00ERROR\x00";

export async function POST(request: NextRequest) {
  try {
    // Parsiramo tijelo zahtjeva — existingHtml je prisutan samo u edit modu
    const { prompt, existingHtml } = await request.json();
    const isEditMode = typeof existingHtml === "string" && existingHtml.length > 0;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt je obavezan." },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY nije konfiguriran." },
        { status: 500 }
      );
    }

    const encoder = new TextEncoder();

    // Kreiramo ReadableStream koji će podatke slati klijentu u realnom vremenu.
    // Streaming je neophodan jer generiranje dugačkog HTML-a može trajati dulje
    // od standardnog HTTP timeout limita za jednokratne odgovore.
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // U edit modu šaljemo postojeći HTML zajedno s uputom za izmjenu
          const userMessage = isEditMode
            ? `Evo postojeće landing stranice:\n\n${existingHtml}\n\n---\n\nNapravi sljedeću izmjenu: ${prompt}`
            : `Generiraj landing stranicu za sljedeći opis:\n\n${prompt}`;

          // Pokrećemo streaming poziv prema Claude API-ju
          const messageStream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 30000,
            system: isEditMode ? EDIT_SYSTEM_PROMPT : SYSTEM_PROMPT,
            messages: [{ role: "user", content: userMessage }],
          });

          // Svaki text_delta event sadrži novi isječak generiranog HTML-a —
          // odmah ga šaljemo klijentu bez čekanja na cijeli odgovor
          for await (const event of messageStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          // Nakon što model završi, dohvaćamo statistiku tokena i šaljemo je
          // klijentu zajedno s markerom koji označava kraj streaminga
          const finalMessage = await messageStream.finalMessage();
          controller.enqueue(
            encoder.encode(DONE_MARKER + JSON.stringify(finalMessage.usage))
          );
          controller.close();
        } catch (err) {
          // U slučaju greške šaljemo ERROR marker s porukom pa zatvaramo stream
          const msg = err instanceof Error ? err.message : "Streaming greška";
          controller.enqueue(encoder.encode(ERROR_MARKER + msg));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Nepoznata greška";
    return NextResponse.json(
      { error: `Greška pri generiranju: ${errorMessage}` },
      { status: 500 }
    );
  }
}
