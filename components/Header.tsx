"use client";

import { Bot } from "lucide-react";

// Gornja navigacijska traka visine 56px s logom i nazivom aplikacije
export default function Header() {
  return (
    <header
      style={{
        height: "56px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Logo kvadrat s crvenim gradijentom i robot ikonom */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #E53E3E, #FC8181)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Bot size={18} strokeWidth={2} color="white" />
        </div>

        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            margin: 0,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
          }}
        >
          Webica
        </h1>
      </div>
    </header>
  );
}
