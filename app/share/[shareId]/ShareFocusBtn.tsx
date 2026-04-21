"use client";

import { useState, useEffect } from "react";

export default function ShareFocusBtn({ accent }: { accent: string }) {
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    const root = document.getElementById("sp-root");
    if (!root) return;
    if (focus) {
      root.classList.add("sp-focus");
    } else {
      root.classList.remove("sp-focus");
    }
  }, [focus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && focus) setFocus(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focus]);

  if (focus) {
    return (
      <button
        onClick={() => setFocus(false)}
        style={{
          position: "fixed", top: 18, right: 20, zIndex: 500,
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px",
          background: "rgba(255,255,255,.85)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(0,0,0,.1)",
          borderRadius: 10, cursor: "pointer",
          fontFamily: "'Lora',serif", fontSize: ".75rem",
          color: "#5A5048", opacity: 0.7,
          transition: "opacity .2s",
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3"/>
        </svg>
        Keluar Fokus
      </button>
    );
  }

  return (
    <button
      onClick={() => setFocus(true)}
      title="Mode Fokus (Esc untuk keluar)"
      style={{
        position: "fixed", bottom: 28, right: 24, zIndex: 500,
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 16px",
        background: "rgba(255,255,255,.75)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${accent}40`,
        borderRadius: 20, cursor: "pointer",
        fontFamily: "'Lora',serif", fontSize: ".75rem",
        color: accent, opacity: 0.65,
        transition: "opacity .2s, box-shadow .2s",
        boxShadow: "0 2px 10px rgba(0,0,0,.07)",
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "0.65"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,.07)"; }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M16 21h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
      </svg>
      Fokus
    </button>
  );
}
