"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#FAF6F0", fontFamily: "'Cormorant Garamond', serif",
      overflow: "hidden", position: "relative", padding: "0 24px", textAlign: "center"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        @keyframes ndFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ndFloat { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-12px) rotate(2deg); } }
        @keyframes ndBgPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.65; transform: scale(1.1); } }
        @keyframes ndLine { from { scale: 0; } to { scale: 1; } }
      `}</style>

      {/* Ambient background decoration */}
      <div style={{ position: "absolute", top: "10%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #EDD5BB44, transparent 70%)", animation: "ndBgPulse 6s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, #D9C4B033, transparent 70%)", animation: "ndBgPulse 6s ease-in-out 2s infinite", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Decorative central icon */}
        <div style={{ marginBottom: 40, animation: "ndFloat 4s ease-in-out infinite", opacity: 0.8 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C4956A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <circle cx="12" cy="14" r="3" opacity="0.6" />
            <line x1="12" y1="17" x2="12" y2="17.01" strokeWidth="2" />
          </svg>
        </div>

        {/* 404 Headline */}
        <h1 style={{ fontSize: "5rem", fontWeight: 300, fontStyle: "italic", color: "#C4956A", margin: "0 0 16px", lineHeight: 0.9, animation: "ndFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
          404
        </h1>

        <h2 style={{ fontSize: "1.8rem", fontWeight: 400, color: "#2E2520", margin: "0 0 12px", animation: "ndFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}>
          Halaman Tidak Ditemukan
        </h2>

        {/* Decorative divider */}
        <div style={{ width: 40, height: 2, borderRadius: 1, background: "#C4956A", marginBottom: 24, animation: "ndLine 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both" }} />

        <p style={{ fontFamily: "'Lora', serif", fontSize: "0.95rem", color: "#8C7E73", lineHeight: 1.7, maxWidth: 320, marginBottom: 48, animation: "ndFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both" }}>
          Sepertinya cerita yang kamu cari telah hilang di antara lembaran-lembaran diary.
        </p>

        {/* CTA Button */}
        <Link href="/" style={{ textDecoration: "none", animation: "ndFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both" }}>
          <div
            style={{
              padding: "14px 32px", borderRadius: 14, background: "linear-gradient(135deg, #C27054, #B5624A)",
              color: "#fff", fontFamily: "'Lora', serif", fontSize: "0.9rem", fontWeight: 500,
              cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 16px rgba(194, 112, 84, 0.25)",
              display: "flex", alignItems: "center", gap: 10
            }}
            onMouseEnter={e => {
              const b = e.currentTarget;
              b.style.transform = "translateY(-2px)";
              b.style.boxShadow = "0 8px 24px rgba(194, 112, 84, 0.35)";
            }}
            onMouseLeave={e => {
              const b = e.currentTarget;
              b.style.transform = "translateY(0)";
              b.style.boxShadow = "0 4px 16px rgba(194, 112, 84, 0.25)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Kembali ke Beranda
          </div>
        </Link>
      </div>

      {/* Bottom watermark */}
      <div style={{ position: "absolute", bottom: 40, fontFamily: "'Lora', serif", fontSize: "0.75rem", color: "#BEB3A8", letterSpacing: "0.05em", animation: "ndFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both" }}>
        CATATANKU · DIARY DIGITAL
      </div>
    </div>
  );
}
