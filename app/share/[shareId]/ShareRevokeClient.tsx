"use client";

import { useEffect, useState } from "react";

export default function ShareRevokeClient({ shareId, isOneTime }: { shareId: string; isOneTime: boolean }) {
  const [revoked, setRevoked] = useState(false);

  useEffect(() => {
    if (isOneTime && shareId) {
      // Small delay to ensure they see the content first
      const t = setTimeout(() => {
        fetch("/api/notes/share/viewed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareId })
        }).then(r => {
          if (r.ok) setRevoked(true);
        }).catch(() => {});
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [isOneTime, shareId]);

  if (!isOneTime) return null;

  return (
    <div style={{ padding: "16px 20px", borderRadius: 16, background: "rgba(196,149,106,0.08)", border: "1.5px dashed var(--accent)", marginBottom: 32, display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ fontSize: "1.5rem", marginTop: 2 }}>👁️</div>
      <div>
        <p style={{ fontFamily: "'Lora',serif", fontSize: ".92rem", color: "var(--ink)", fontWeight: 600, margin: "0 0 4px" }}>Catatan Sekali Lihat</p>
        <p style={{ fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", margin: 0, lineHeight: 1.5 }}>
          Halaman ini hanya bisa dibuka satu kali. Tautan ini {revoked ? "telah hangus" : "akan hangus"} setelah kamu menutup tab ini.
        </p>
      </div>
    </div>
  );
}
