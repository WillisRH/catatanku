"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        background: "var(--bg, #282C34)",
        color: "var(--ink, #ABB2BF)",
      }}
    >
      <div style={{ fontSize: "4rem" }}>📴</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ink, #ABB2BF)" }}>
        Kamu sedang offline
      </h1>
      <p style={{ maxWidth: "360px", color: "var(--ink2, #828997)", lineHeight: 1.6 }}>
        Tidak ada koneksi internet. Halaman yang pernah kamu buka sebelumnya masih bisa diakses.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "0.5rem",
          padding: "0.625rem 1.5rem",
          borderRadius: "8px",
          border: "none",
          background: "var(--accent, #61AFEF)",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.95rem",
        }}
      >
        Coba lagi
      </button>
    </div>
  );
}
