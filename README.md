# AI Landing Page Generator

> Diplomski rad — Generiranje web stranica pomoću velikih jezičnih modela (LLM)

Aplikacija koja koristi Claude Sonnet 4 API za generiranje kompletnih landing stranica iz tekstualnog opisa na prirodnom jeziku.

## ✨ Značajke

- **Generiranje iz opisa** — Upišite opis stranice na hrvatskom ili engleskom, AI generira kompletan HTML/CSS/JS
- **Live preview** — Prikaz generirane stranice u realnom vremenu unutar iframe-a
- **Responzivni prikaz** — Prebacivanje između Desktop, Tablet i Mobile prikaza
- **Pregled koda** — Mogućnost pregleda generiranog HTML koda
- **Izvoz** — Preuzimanje generirane stranice kao .html datoteke
- **Povijest** — Pregled svih prethodnih generacija u sesiji

## 🛠️ Tehnologije

- **Next.js 14** — React framework s App Routerom
- **TypeScript** — Statičko tipiziranje
- **Anthropic Claude API** — Claude Sonnet 4 za generiranje koda
- **Tailwind CSS** — Utility-first CSS framework

## 🚀 Pokretanje

### Preduvjeti

- Node.js 18+
- npm ili yarn
- Anthropic API ključ ([console.anthropic.com](https://console.anthropic.com/))

### Instalacija

```bash
# 1. Kloniraj repozitorij
git clone <repo-url>
cd ai-landing-generator

# 2. Instaliraj dependencije
npm install

# 3. Konfiguriraj API ključ
cp .env.example .env.local
# Uredi .env.local i dodaj svoj ANTHROPIC_API_KEY

# 4. Pokreni development server
npm run dev
```

Aplikacija će biti dostupna na [http://localhost:3000](http://localhost:3000).

### Deploy na Vercel

```bash
# Instaliraj Vercel CLI
npm i -g vercel

# Deploy
vercel

# Dodaj environment variable na Vercel dashboardu:
# ANTHROPIC_API_KEY=sk-ant-...
```

## 📐 Arhitektura

```
ai-landing-generator/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # API ruta — poziva Claude API
│   ├── globals.css               # Globalni stilovi
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Glavna stranica
├── components/
│   ├── Header.tsx                # Header s logom i meta info
│   ├── PromptPanel.tsx           # Lijevi panel — unos prompta
│   └── PreviewPanel.tsx          # Desni panel — preview/kod
├── .env.local                    # API ključ (nije u gitu)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔄 Tok rada

1. Korisnik unosi tekstualni opis željene stranice
2. Frontend šalje POST zahtjev na `/api/generate`
3. Backend prosljeđuje prompt Claude Sonnet 4 modelu s detaljnim system promptom
4. Claude generira kompletan HTML dokument s inline CSS-om i JavaScriptom
5. Frontend prikazuje rezultat u sandboxed iframe-u
6. Korisnik može pregledati kod, promijeniti viewport ili preuzeti HTML

## 📊 Za diplomski rad

Aplikacija demonstrira:
- Sposobnost LLM-a da generira funkcionalan, responzivan web kod
- Kvalitetu AI-generiranog koda u usporedbi s ručno pisanim
- Pristupačnost AI alata za ne-programere
- Potencijal za ubrzanje procesa web razvoja

## 📝 Licenca

Ovaj projekt je izrađen kao dio diplomskog rada.
