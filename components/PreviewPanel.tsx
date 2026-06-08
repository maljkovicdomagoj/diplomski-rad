"use client";

import { useState } from "react";
import { Monitor, Tablet, Smartphone, Code2, Globe, Download } from "lucide-react";

interface PreviewPanelProps {
  html: string | null;
  isGenerating: boolean;
  onExport: () => void;
}

// Tri moguća načina prikaza pregleda stranice
type ViewMode = "desktop" | "tablet" | "mobile";

// Širina iframea za svaki viewport mod
const VIEW_SIZES: Record<ViewMode, { width: string; label: string }> = {
  desktop: { width: "100%", label: "Desktop" },
  tablet: { width: "768px", label: "Tablet" },
  mobile: { width: "375px", label: "Mobile" },
};

// Lucide ikone za gumbe za odabir viewporta
const VIEW_ICONS: Record<ViewMode, React.ReactNode> = {
  desktop: <Monitor size={14} strokeWidth={1.8} />,
  tablet: <Tablet size={14} strokeWidth={1.8} />,
  mobile: <Smartphone size={14} strokeWidth={1.8} />,
};

export default function PreviewPanel({ html, isGenerating, onExport }: PreviewPanelProps) {
  // Trenutno odabrani viewport mod (utječe na širinu iframea)
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  // Prebacivanje između vizualnog pregleda i prikaza sirovog HTML koda
  const [showCode, setShowCode] = useState(false);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-secondary)",
        overflow: "hidden",
      }}
    >
      {/* Alatna traka s gumbima za odabir viewporta i toggle za kod */}
      <div
        style={{
          height: "44px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          flexShrink: 0,
          background: "var(--bg-primary)",
        }}
      >
        {/* Grupirani gumbi za odabir viewporta — Desktop / Tablet / Mobile */}
        <div
          style={{
            display: "flex",
            gap: "3px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "3px",
          }}
        >
          {(Object.keys(VIEW_SIZES) as ViewMode[]).map((mode) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "5px 11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  // Aktivni mod dobiva bijelu pozadinu i laganu sjenu (pill efekt)
                  background: active ? "var(--bg-primary)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  border: active ? "1px solid var(--border)" : "1px solid transparent",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {VIEW_ICONS[mode]}
                {VIEW_SIZES[mode].label}
              </button>
            );
          })}
        </div>

        {/* Desna strana toolbara — gumbi za kod i preuzimanje, vidljivi samo kad postoji HTML */}
        {html && (
          <div style={{ display: "flex", gap: "6px" }}>
            {/* Toggle između vizualnog pregleda i sirovog HTML koda */}
            <button
              onClick={() => setShowCode(!showCode)}
              style={{
                padding: "5px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                background: showCode ? "var(--accent-glow)" : "transparent",
                color: showCode ? "var(--accent)" : "var(--text-muted)",
                border: showCode
                  ? "1px solid rgba(229, 62, 62, 0.3)"
                  : "1px solid var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Code2 size={13} strokeWidth={1.8} />
              Kod
            </button>

            {/* Preuzimanje generiranog HTML-a kao datoteke */}
            <button
              onClick={onExport}
              style={{
                padding: "5px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <Download size={13} strokeWidth={1.8} />
              Preuzmi HTML
            </button>
          </div>
        )}
      </div>

      {/* Glavni sadržajni prostor — prikazuje jedno od tri stanja */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          // Tablet i mobile modovi dobivaju padding kako bi iframe bio vidljivo odijeljen
          padding: viewMode !== "desktop" ? "24px" : "0",
          background: "var(--bg-secondary)",
        }}
      >
        {/* STANJE 1: Generiranje je u tijeku — spinner + skeleton blokovi */}
        {isGenerating ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
              gap: "20px",
              padding: "40px",
            }}
          >
            {/* Animirani spinner s crvenim gornjim rubom */}
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 0.75s linear infinite",
                flexShrink: 0,
              }}
            />
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: "0 0 6px 0",
                  letterSpacing: "-0.01em",
                }}
              >
                Generiram landing stranicu...
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Claude analizira vaš opis i piše HTML, CSS i JavaScript
              </p>
            </div>
            {/* Skeleton blokovi simuliraju izgled stranice koja se gradi */}
            <div
              style={{
                width: "100%",
                maxWidth: "560px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div className="loading-shimmer" style={{ height: "36px", borderRadius: "8px", width: "55%" }} />
              <div className="loading-shimmer" style={{ height: "18px", borderRadius: "6px", width: "80%" }} />
              <div className="loading-shimmer" style={{ height: "18px", borderRadius: "6px", width: "65%" }} />
              <div style={{ height: "12px" }} />
              <div className="loading-shimmer" style={{ height: "110px", borderRadius: "10px" }} />
              <div style={{ display: "flex", gap: "10px" }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="loading-shimmer" style={{ height: "72px", borderRadius: "8px", flex: 1 }} />
                ))}
              </div>
            </div>
          </div>
        ) : html ? (
          // STANJE 2: Postoji generirani HTML
          showCode ? (
            // Prikaz sirovog HTML koda u monospace fontu
            <pre
              style={{
                width: "100%",
                height: "100%",
                margin: 0,
                padding: "20px 24px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                lineHeight: "1.7",
                color: "var(--text-secondary)",
                background: "var(--bg-secondary)",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {html}
            </pre>
          ) : (
            // Vizualni preview unutar iframea — sandbox atribut sprečava komunikaciju s roditeljskom stranicom
            <div
              style={{
                width: VIEW_SIZES[viewMode].width,
                height: "100%",
                maxWidth: "100%",
                transition: "width 0.25s ease",
                // Tablet i mobile dobivaju zaobljene rubove i sjenu za dojam uređaja
                border: viewMode !== "desktop" ? "1px solid var(--border)" : "none",
                borderRadius: viewMode !== "desktop" ? "12px" : "0",
                overflow: "hidden",
                boxShadow: viewMode !== "desktop" ? "0 8px 40px rgba(0,0,0,0.1)" : "none",
                background: "white",
              }}
            >
              <iframe
                srcDoc={html}
                title="Generirani preview"
                style={{ width: "100%", height: "100%", border: "none", background: "white" }}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          )
        ) : (
          // STANJE 3: Prazno stanje — korisnik još nije generirao stranicu
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
              gap: "14px",
            }}
          >
            {/* Globe ikona kao vizualni placeholder */}
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "18px",
                background: "var(--bg-primary)",
                border: "1.5px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Globe size={32} strokeWidth={1.3} style={{ color: "var(--text-muted)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  margin: "0 0 6px 0",
                  letterSpacing: "-0.01em",
                }}
              >
                Ovdje će se prikazati vaša stranica
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Opišite stranicu s lijeve strane i kliknite &quot;Generiraj&quot;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
