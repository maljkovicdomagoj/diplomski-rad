"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Generička modalna komponenta s overlay-em i fixed pozicioniranjem.
// Zatvara se klikom na overlay, pritiskom Escape tipke ili klikom na gumb za zatvaranje.
export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Zatvaranje modala pritiskom tipke Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Sprječavamo scroll ispod otvorenog modala
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // Tamni overlay koji prekriva cijeli ekran
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* Bijela kartica — stopPropagation sprječava zatvaranje klikom unutar kartice */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "28px",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          position: "relative",
        }}
      >
        {/* Gumb za zatvaranje u gornjem desnom kutu */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--text-muted)",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-secondary)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <X size={15} strokeWidth={2} />
        </button>

        {/* Ikona upozorenja */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "rgba(229, 62, 62, 0.08)",
            border: "1px solid rgba(229, 62, 62, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <AlertTriangle size={22} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
        </div>

        {/* Naslov */}
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 10px 0",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>

        {/* Sadržaj koji prima roditelj (poruka, forma, itd.) */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13.5px",
            lineHeight: "1.65",
            color: "var(--text-secondary)",
            marginBottom: "22px",
          }}
        >
          {children}
        </div>

        {/* Gumb za zatvaranje */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "11px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            background: "linear-gradient(135deg, #E53E3E 0%, #C53030 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            letterSpacing: "-0.01em",
            boxShadow: "0 2px 8px rgba(229, 62, 62, 0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(229, 62, 62, 0.38)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(229, 62, 62, 0.3)";
          }}
        >
          Razumijem
        </button>
      </div>
    </div>
  );
}
