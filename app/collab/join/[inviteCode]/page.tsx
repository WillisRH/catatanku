"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

type Preview = {
  noteId: string;
  title: string;
  ownerName: string;
  ownerImage: string | null;
  memberCount: number;
  collabPaused: boolean;
  isBanned: boolean;
};

function Avatar({ src, name, size = 52 }: { src?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (src) {
    return (
      <img src={src} alt={name} style={{
        width: size, height: size, borderRadius: "50%",
        objectFit: "cover", border: "2px solid var(--accent-soft)",
        flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--accent)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="collab-join-spinner"
      style={{ width: 16, height: 16, display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SkeletonBlock({ w, h, radius = 6 }: { w: string; h: number; radius?: number }) {
  return (
    <div className="collab-skeleton" style={{
      width: w, height: h, borderRadius: radius,
      background: "var(--line)", opacity: 0.6,
    }} />
  );
}

export default function CollabJoinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const inviteCode = params?.inviteCode as string;

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=/collab/join/${inviteCode}`);
      return;
    }
    if (status !== "authenticated") return;
    fetch(`/api/collab/join/${inviteCode}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => { setPreview(d); setLoading(false); })
      .catch(() => { setError("Tautan undangan tidak valid atau sudah kedaluwarsa."); setLoading(false); });
  }, [status, inviteCode, router]);

  const join = async () => {
    setJoining(true);
    try {
      const r = await fetch(`/api/collab/join/${inviteCode}`, { method: "POST" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setJoined(true);
      const ch = supabase.channel(`collab:${d.noteId}`);
      ch.subscribe(s => {
        if (s !== "SUBSCRIBED") return;
        ch.send({
          type: "broadcast", event: "member-joined",
          payload: { member: { userId: d.userId, name: d.name, image: d.image, role: "editor", online: true } },
        }).finally(() => supabase.removeChannel(ch));
      });
      setTimeout(() => router.replace(`/?note=${d.noteId}&view=write`), 1200);
    } catch {
      setError("Gagal bergabung. Coba lagi.");
      setJoining(false);
    }
  };

  const isLoading = status === "loading" || loading;

  return (
    <div suppressHydrationWarning style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg, #FAF6F0)", padding: "24px",
    }}>
      <div className="collab-join-card" style={{
        background: "var(--surface, #fff)", borderRadius: 20,
        padding: "40px 32px", width: "min(420px, 100%)",
        boxShadow: "var(--shadow, 0 8px 40px rgba(0,0,0,.10))",
        border: "1px solid var(--line, #ece8e2)", textAlign: "center",
      }}>

        {/* Loading skeleton */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div className="collab-skeleton" style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--line)", opacity: 0.6,
            }} />
            <SkeletonBlock w="60%" h={18} radius={8} />
            <SkeletonBlock w="40%" h={13} />
            <SkeletonBlock w="30%" h={11} />
            <div style={{ height: 8 }} />
            <SkeletonBlock w="100%" h={44} radius={12} />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && !joined && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--accent-soft)", marginBottom: 4,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
            }}>🔗</div>
            <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Tautan Tidak Valid</p>
            <p style={{ fontSize: ".85rem", color: "var(--ink2)", margin: "4px 0 24px", lineHeight: 1.5 }}>{error}</p>
            <button onClick={() => router.replace("/")} className="collab-join-btn" style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none",
              background: "var(--accent)", color: "#fff", fontSize: ".9rem",
              fontWeight: 600, cursor: "pointer",
            }}>Ke Beranda</button>
          </div>
        )}

        {/* Banned */}
        {!isLoading && !error && preview?.isBanned && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "#fdecea", marginBottom: 4,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
            }}>🚫</div>
            <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "#c62828", margin: 0 }}>Akses Ditolak</p>
            <p style={{ fontSize: ".85rem", color: "var(--ink2)", margin: "4px 0 24px", lineHeight: 1.5 }}>
              Kamu telah diblokir dari kolaborasi ini oleh pemilik catatan.
            </p>
            <button onClick={() => router.replace("/")} className="collab-join-btn" style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none",
              background: "var(--accent)", color: "#fff", fontSize: ".9rem",
              fontWeight: 600, cursor: "pointer",
            }}>Ke Beranda</button>
          </div>
        )}

        {/* Success */}
        {joined && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 4 }}>🎉</div>
            <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Berhasil Bergabung!</p>
            <p style={{ fontSize: ".85rem", color: "var(--ink2)", margin: 0 }}>Mengarahkan ke catatan…</p>
          </div>
        )}

        {/* Normal invite */}
        {!isLoading && !error && preview && !preview.isBanned && !joined && (
          <>
            <p style={{
              display: "inline-block", fontSize: ".7rem", fontWeight: 600,
              letterSpacing: ".08em", textTransform: "uppercase",
              color: "var(--accent)", background: "var(--accent-soft)",
              borderRadius: 99, padding: "3px 12px", marginBottom: 24,
            }}>
              Undangan Kolaborasi
            </p>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Avatar src={preview.ownerImage} name={preview.ownerName} />
              <p style={{ fontSize: ".82rem", color: "var(--ink2)", margin: 0 }}>
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>{preview.ownerName}</span>
                {" "}mengundangmu untuk berkolaborasi
              </p>
            </div>

            <div style={{
              background: "var(--accent-soft)", borderRadius: 12,
              padding: "14px 18px", marginBottom: 16,
            }}>
              <p style={{
                fontSize: ".72rem", color: "var(--accent)", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 4px",
              }}>Catatan</p>
              <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", margin: 0, wordBreak: "break-word" }}>
                {preview.title || "Tanpa Judul"}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20 }}>
              <span style={{ fontSize: ".95rem" }}>👥</span>
              <p style={{ fontSize: ".82rem", color: "var(--ink2)", margin: 0 }}>
                {preview.memberCount} anggota sudah bergabung
              </p>
            </div>

            {preview.collabPaused && (
              <div style={{
                background: "#fff8e1", borderRadius: 10, padding: "10px 14px",
                marginBottom: 20, border: "1px solid #ffe082",
                display: "flex", gap: 8, alignItems: "flex-start", textAlign: "left",
              }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>⏸️</span>
                <p style={{ fontSize: ".78rem", color: "#e65100", margin: 0, lineHeight: 1.5 }}>
                  Kolaborasi sedang dijeda oleh pemilik. Kamu tetap bisa bergabung, tapi belum bisa mengedit saat ini.
                </p>
              </div>
            )}

            <button onClick={join} disabled={joining} className="collab-join-btn" style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              background: "var(--accent)", color: "#fff", fontSize: ".92rem",
              fontWeight: 600, cursor: joining ? "not-allowed" : "pointer",
              opacity: joining ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {joining ? <><Spinner /> Bergabung…</> : "✏️ Bergabung sekarang"}
            </button>

            <button onClick={() => router.replace("/")} className="collab-cancel-btn" style={{
              marginTop: 10, width: "100%", padding: "11px", borderRadius: 12,
              border: "1px solid var(--line)", background: "transparent",
              fontSize: ".85rem", color: "var(--ink2)", cursor: "pointer",
            }}>
              Batal
            </button>
          </>
        )}
      </div>

      {!isLoading && (
        <p style={{ marginTop: 20, fontSize: ".75rem", color: "var(--ink3)", opacity: 0.7 }}>
          catatanku · kolaborasi real-time
        </p>
      )}
    </div>
  );
}
