"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CardThemeBg } from "@/components/CardThemeBg";

type Reaction = { emoji: string; count: number };

type UserProfile = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  profileTheme: string;
  currentStreak: number;
  longestStreak: number;
  sharedCount: number;
  memberSince: string;
  bio: string | null;
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  isViewerAdmin: boolean;
  isSuspended: boolean;
  suspendReason: string | null;
  reactions: Reaction[];
  myReactions: string[];
  medals: string[];
  isPrivate: boolean;
  displayedMedal: string | null;
  pinnedNotes: { id: string; title: string; text: string; mood: number | null; date: string; theme: string | null; color: string | null; isLocked: boolean; ts: number; shareId: string | null }[];
};

const NOTE_THEMES: Record<string, { label: string; emoji: string; bg: string; accent: string; dark?: boolean }> = {
  cinta:     { label: 'Cinta', emoji: '🌹', bg: '#FFF0F5', accent: '#D4607A' },
  alam:      { label: 'Alam', emoji: '🌿', bg: '#EEFAF3', accent: '#3D8B5C' },
  mimpi:     { label: 'Mimpi', emoji: '🌙', bg: '#F5F0FF', accent: '#7B5EA7' },
  langit:    { label: 'Langit', emoji: '☁️', bg: '#EDF6FF', accent: '#3D7FBF' },
  nostalgia: { label: 'Nostalgia', emoji: '🍂', bg: '#FBF3E8', accent: '#A07035' },
  laut:      { label: 'Laut', emoji: '🌊', bg: '#EDF9F8', accent: '#2E8B8B' },
  galaksi:   { label: 'Galaksi', emoji: '✨', bg: '#F1F0F8', accent: '#6558B0' },
  pagi:      { label: 'Pagi', emoji: '🌅', bg: '#FFFBEE', accent: '#D4853C' },
  salju:     { label: 'Salju', emoji: '❄️', bg: '#F2F8FC', accent: '#4A8DBF' },
  hutan:     { label: 'Hutan', emoji: '🌲', bg: '#EDF4EE', accent: '#2D6B45' },
  gunung:    { label: 'Gunung', emoji: '🏔️', bg: '#F5F3ED', accent: '#7A6545' },
  bunga:     { label: 'Bunga', emoji: '🌸', bg: '#FDF4FA', accent: '#C05898' },
  aurora:    { label: 'Aurora', emoji: '🌌', bg: '#0E1C1B', accent: '#4AADA8', dark: true },
  kota_malam:{ label: 'Kota Malam', emoji: '🌃', bg: '#0A0E14', accent: '#F0D090', dark: true },
  kucing:    { label: 'Kucing', emoji: '🐱', bg: '#FAF7F4', accent: '#C28B68' },
  notebook:  { label: 'Notebook', emoji: '📓', bg: '#FFFAEC', accent: '#9B7A38' },
  eid:           { label: 'Eid', emoji: '🌙', bg: '#F3FBF5', accent: '#2E7D52' },
  bawah_laut:    { label: 'Bawah Laut', emoji: '🐠', bg: '#020C14', accent: '#00E5CC', dark: true },
  lavender_field:{ label: 'Padang Lavender', emoji: '🌷', bg: '#F4F0FA', accent: '#7C4DCC' },
};

const NOTE_COLORS: Record<string, { bg: string; border: string }> = {
  blush: { bg: '#FEF2F2', border: '#FAD8D8' },
  sage: { bg: '#F2F7F3', border: '#DCEADF' },
  sky: { bg: '#F1F5FD', border: '#DBE6F8' },
  lavender: { bg: '#F5F2FD', border: '#E6DCF8' },
  sand: { bg: '#FBF5E9', border: '#EFE2C8' },
  mint: { bg: '#F0FAF5', border: '#C8E6D9' },
  peach: { bg: '#FEF6F2', border: '#FAD5C3' },
  sunshine: { bg: '#FFFBF2', border: '#FDE4B3' },
  ocean: { bg: '#F2FBFB', border: '#C9E8E8' },
  rosewood: { bg: '#FBF2F6', border: '#E6C8D3' },
};

const stripHtml = (html: string) => {
  const clean = html
    .split("\n")
    .filter(l => !l.startsWith("[IMAGE:") && !l.startsWith("[GALLERY:") && !/^--x?\s/.test(l) && !l.startsWith("[TABLE:") && !l.startsWith("[LINK:"))
    .map(l => l.replace(/<br\s*\/?>/gi," ").replace(/<div[^>]*>/gi," ").replace(/<\/div>/gi," ").replace(/<\/div>/gi," ").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  
  // Re-inject the zettelkasten styling but clean the brackets
  return clean.replace(/\[\[(.*?)\]\]/g, '<span class="note-link">$1</span>');
};

const MOODS = [
  { emoji: "☀️", color: "#D4A24E", soft: "#FFF8ED", border: "#F0D9A8", bg: "linear-gradient(135deg,#FFFAF0,#FFF0D4)", pageBg: "linear-gradient(180deg,#FFFAF2 0%,#FAF6F0 40%)" },
  { emoji: "🍃", color: "#7A9E7E", soft: "#F0F7F1", border: "#C2D9C5", bg: "linear-gradient(135deg,#F5FAF5,#E6F2E8)", pageBg: "linear-gradient(180deg,#F4FAF5 0%,#FAF6F0 40%)" },
  { emoji: "🌧️", color: "#7B8FA1", soft: "#EFF3F7", border: "#B8C8D4", bg: "linear-gradient(135deg,#F2F6FA,#E4ECF2)", pageBg: "linear-gradient(180deg,#F0F4F8 0%,#FAF6F0 40%)" },
  { emoji: "🔥", color: "#B5705A", soft: "#FBF0EC", border: "#DDB8A8", bg: "linear-gradient(135deg,#FDF4F0,#F7E4DC)", pageBg: "linear-gradient(180deg,#FBF2EE 0%,#FAF6F0 40%)" },
  { emoji: "🌙", color: "#8E7BA8", soft: "#F4F0F8", border: "#C8BBD8", bg: "linear-gradient(135deg,#F8F4FC,#EDE4F5)", pageBg: "linear-gradient(180deg,#F6F2FA 0%,#FAF6F0 40%)" },
  { emoji: "🌊", color: "#6B8E9E", soft: "#EDF4F7", border: "#B0CCD6", bg: "linear-gradient(135deg,#F0F7FA,#E0EDF2)", pageBg: "linear-gradient(180deg,#EEF5F8 0%,#FAF6F0 40%)" },
  { emoji: "🤩", color: "#D96C4A", soft: "#FCF0EC", border: "#E8B5A2", bg: "linear-gradient(135deg,#FDF4F0,#F7E4DB)", pageBg: "linear-gradient(180deg,#FDF2EE 0%,#FAF6F0 40%)" },
  { emoji: "🔋", color: "#9A8C9E", soft: "#F5F3F6", border: "#C8BCCC", bg: "linear-gradient(135deg,#F8F6F9,#EDEBF0)", pageBg: "linear-gradient(180deg,#F6F4F8 0%,#FAF6F0 40%)" },
  { emoji: "💫", color: "#DEB841", soft: "#FDF8ED", border: "#EAD59A", bg: "linear-gradient(135deg,#FFFAF0,#FFF2D4)", pageBg: "linear-gradient(180deg,#FFF9F0 0%,#FAF6F0 40%)" },
  { emoji: "🌀", color: "#6C7A9C", soft: "#EFF1F6", border: "#B8C1D4", bg: "linear-gradient(135deg,#F2F4F9,#E4E8F2)", pageBg: "linear-gradient(180deg,#F0F2F8 0%,#FAF6F0 40%)" },
  { emoji: "💡", color: "#54A6A6", soft: "#EEF7F7", border: "#A8D1D1", bg: "linear-gradient(135deg,#F0FAFA,#E0F4F4)", pageBg: "linear-gradient(180deg,#EEF8F8 0%,#FAF6F0 40%)" },
];

const THEMES: Record<string, { bg: string; accent: string; soft: string; ink: string; ink2: string; ink3: string; surface: string; line: string; hero1: string; hero2: string }> = {
  cocoa:    { bg:"#FAF6F0", accent:"#C4956A", soft:"#EBDACB", ink:"#2E2520", ink2:"#8C7E73", ink3:"#BEB3A8", surface:"#FFFFFF", line:"#EDE7DF", hero1:"#E8C9A8", hero2:"#C4956A" },
  sage:     { bg:"#F2F6F2", accent:"#5A8A6A", soft:"#C8DFD0", ink:"#1E2E22", ink2:"#6A8070", ink3:"#A0B8A8", surface:"#FFFFFF", line:"#D8EAE0", hero1:"#A8CFBA", hero2:"#5A8A6A" },
  rose:     { bg:"#FBF2F4", accent:"#C4607A", soft:"#F0CCDA", ink:"#2E1822", ink2:"#8C6070", ink3:"#C0A0A8", surface:"#FFFFFF", line:"#F0D8E0", hero1:"#EDAABB", hero2:"#C4607A" },
  ocean:    { bg:"#F0F5FA", accent:"#3D7FBF", soft:"#C8DDEF", ink:"#1A2A38", ink2:"#507090", ink3:"#90B0C8", surface:"#FFFFFF", line:"#D0E4F2", hero1:"#90B8D8", hero2:"#3D7FBF" },
  lavender: { bg:"#F4F2F8", accent:"#7A5A90", soft:"#D8CCEC", ink:"#22183A", ink2:"#6A5878", ink3:"#A898B8", surface:"#FFFFFF", line:"#E2D8F0", hero1:"#C0AADC", hero2:"#7A5A90" },
  golden:   { bg:"#FAF7F0", accent:"#B5902A", soft:"#EAD898", ink:"#2A2010", ink2:"#807050", ink3:"#B8A870", surface:"#FFFFFF", line:"#EDE4C0", hero1:"#DFC070", hero2:"#B5902A" },
  slate:    { bg:"#F4F5F6", accent:"#607080", soft:"#C8D4DC", ink:"#1A2228", ink2:"#607080", ink3:"#9AAAB8", surface:"#FFFFFF", line:"#D8E0E8", hero1:"#A8B8C8", hero2:"#607080" },
  midnight: { bg:"#1A1820", accent:"#9A8FE0", soft:"#2A2840", ink:"#E8E6F8", ink2:"#A098C8", ink3:"#6860A0", surface:"#26243A", line:"#36344E", hero1:"#3A3660", hero2:"#9A8FE0" },
};

const MEDALS = [
  { id: "pioneer", label: "Pionir", icon: "🌱" },
  { id: "writer", label: "Penulis", icon: "✍️" },
  { id: "chronicler", label: "Kronikus", icon: "📜" },
  { id: "legend", label: "Legenda", icon: "👑" },
  { id: "streak3", label: "Tanpa Henti", icon: "🔥" },
  { id: "streak7", label: "Konsisten", icon: "⚡" },
  { id: "streak30", label: "Tak Terkalahkan", icon: "💎" },
  { id: "word500", label: "Ahli Kata", icon: "🚀" },
  { id: "word1000", label: "Filosof", icon: "🧠" },
  { id: "locked", label: "Penjaga Rahasia", icon: "🛡️" },
  { id: "labeled", label: "Terorganisir", icon: "🏷️" },
  { id: "moody", label: "Ekspresif", icon: "🎭" },
  { id: "sticker_expert", label: "Dekorator", icon: "🎨" },
  { id: "social", label: "Sosial", icon: "🌍" },
  { id: "migrator", label: "Petualang Data", icon: "📦" },
  { id: "admin", label: "Admin", icon: "🛡️" },
];

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reactingOn, setReactingOn] = useState<string | null>(null);
  const [unpinning, setUnpinning] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [showAvatar, setShowAvatar] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [suspendConfirm, setSuspendConfirm] = useState(false);
  const [suspendError, setSuspendError] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendNote, setSuspendNote] = useState("");
  const [sharedNotes, setSharedNotes] = useState<{ id: string; title: string; shareId: string; isModerated: boolean; ts: number }[] | null>(null);
  const [sharedNotesLoading, setSharedNotesLoading] = useState(false);
  const [moderatingNote, setModeratingNote] = useState<string | null>(null);

  const SUSPEND_REASONS = [
    "Melanggar ketentuan layanan",
    "Konten tidak pantas atau berbahaya",
    "Spam atau penyalahgunaan",
    "Perilaku mengganggu pengguna lain",
    "Laporan dari pengguna",
    "Permintaan pengguna sendiri",
    "Lainnya",
  ];

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(d => {
        if (d) {
          setUser(d);
          setLoading(false);
          if (d.isOwner || d.isViewerAdmin) {
            fetch("/api/csrf").then(r => r.json()).then(({ token }) => setCsrfToken(token)).catch(() => {});
          }
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  const unpinNote = useCallback(async (noteId: string) => {
    if (unpinning) return;
    setUnpinning(noteId);
    setUser(prev => !prev ? prev : { ...prev, pinnedNotes: prev.pinnedNotes.filter(n => n.id !== noteId) });
    try {
      await fetch("/api/notes/profile-pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ noteId, pin: false }),
      });
    } catch {
      // revert on failure - refetch
      fetch(`/api/users/${id}`).then(r => r.json()).then(d => { if (d) setUser(d); });
    }
    setUnpinning(null);
  }, [unpinning, csrfToken, id]);

  const react = useCallback(async (emoji: string) => {
    if (!user || reactingOn || user.myReactions.length > 0) return;
    setReactingOn(emoji);
    setUser(prev => !prev ? prev : {
      ...prev, myReactions: [emoji],
      reactions: prev.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r),
    });
    try {
      const res = await fetch(`/api/users/${id}/react`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setUser(prev => !prev ? prev : {
        ...prev, myReactions: [],
        reactions: prev.reactions.map(r => r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1) } : r),
      });
    }
    setReactingOn(null);
  }, [user, id, reactingOn]);

  const suspend = useCallback(async (shouldSuspend: boolean) => {
    setSuspendLoading(true);
    setSuspendError("");
    try {
      const res = await fetch("/api/admin/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({
          userId: id,
          suspend: shouldSuspend,
          reason: shouldSuspend ? suspendReason : undefined,
          note: shouldSuspend ? suspendNote : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSuspendError(d.error || "Gagal memproses.");
        return;
      }
      setUser(prev => !prev ? prev : {
        ...prev,
        isSuspended: shouldSuspend,
        suspendReason: shouldSuspend ? suspendReason : null,
      });
      setSuspendConfirm(false);
      setSuspendReason("");
      setSuspendNote("");
    } catch {
      setSuspendError("Terjadi kesalahan jaringan.");
    } finally {
      setSuspendLoading(false);
    }
  }, [id, csrfToken, suspendReason, suspendNote]);

  const loadSharedNotes = useCallback(async () => {
    if (sharedNotes !== null) return;
    setSharedNotesLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/notes`);
      if (res.ok) setSharedNotes(await res.json());
    } catch {}
    setSharedNotesLoading(false);
  }, [id, sharedNotes]);

  const moderateNote = useCallback(async (noteId: string, hide: boolean) => {
    setModeratingNote(noteId);
    try {
      const res = await fetch("/api/admin/notes/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ noteId, hide }),
      });
      if (res.ok) {
        setSharedNotes(prev => prev
          ? prev.map(n => n.id === noteId ? { ...n, isModerated: hide } : n)
          : prev
        );
      }
    } catch {}
    setModeratingNote(null);
  }, [csrfToken]);

  const t = THEMES[user?.profileTheme ?? "cocoa"] ?? THEMES.cocoa;
  const memberYear = user ? new Date(user.memberSince).getFullYear() : null;
  const totalReactions = user?.reactions?.reduce((s, r) => s + r.count, 0) ?? 0;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${t.bg};color:${t.ink};font-family:'Lora',serif}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .au{animation:fadeUp .5s cubic-bezier(.23,1,.32,1) both}
    .au2{animation:fadeUp .5s .1s cubic-bezier(.23,1,.32,1) both}
    .au3{animation:fadeUp .5s .18s cubic-bezier(.23,1,.32,1) both}
    .au4{animation:fadeUp .5s .26s cubic-bezier(.23,1,.32,1) both}
    .rb{display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:50px;border:1.5px solid ${t.line};background:${t.surface};cursor:pointer;transition:all .18s;font-family:'Lora',serif;font-size:.88rem;color:${t.ink2};-webkit-tap-highlight-color:transparent}
    .rb:hover{border-color:${t.accent}60;background:${t.soft}50;transform:translateY(-2px);box-shadow:0 4px 16px ${t.accent}18}
    .rb.active{border-color:${t.accent};background:${t.accent}15;color:${t.ink};font-weight:600}
    .rb.popping{animation:pop .3s cubic-bezier(.23,1,.32,1) both}
    .card{border-radius:20px;background:${t.surface};border:1px solid ${t.line};padding:24px}
    .ecard{padding:18px 22px;border-radius:14px;background:var(--surface);border:1px solid var(--line);cursor:pointer;transition:transform .25s cubic-bezier(.23,1,.32,1),box-shadow .25s cubic-bezier(.23,1,.32,1),border-color .2s ease;position:relative;overflow:hidden;content-visibility:auto;contain-intrinsic-size:0 120px}
    .ecard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--card-accent,var(--accent-soft));border-radius:14px 0 0 14px;transition:width .25s ease}
    .ecard:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(46,37,32,.08);border-color:var(--card-border,var(--accent-soft))}
    .ecard:hover::before{width:5px}
    @media(min-width:700px){
      .stats-grid{grid-template-columns:repeat(4,1fr)!important}
      .bottom-grid{grid-template-columns:1fr 1fr!important}
      .hero-inner{max-width:1100px;margin:0 auto;padding:0 40px}
      .content{max-width:1100px;margin:0 auto;padding:0 40px 80px}
      .avatar-wrap{width:112px!important;height:112px!important}
      .avatar-wrap span{font-size:3.2rem!important}
      .hero-h{height:220px!important}
      .name-h1{font-size:2.4rem!important}
      .avatar-wrap{width:112px!important;height:112px!important}
      .avatar-wrap span{font-size:3.2rem!important}
    }
    .note-link { color: ${t.accent}; border-bottom: 1px dotted ${t.accent}80; font-weight: 500; }
  `;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#FAF6F0", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #EBDACB", borderTopColor:"#C4956A", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }}/>
        <p style={{ fontFamily:"'Lora',serif", fontSize:".84rem", color:"#BEB3A8" }}>Memuat profil...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:"100vh", background:"#FAF6F0", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", padding:32 }}>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem", color:"#2E2520", marginBottom:8 }}>Pengguna tidak ditemukan</p>
        <button onClick={() => router.back()} style={{ fontFamily:"'Lora',serif", fontSize:".84rem", color:"#C4956A", background:"none", border:"none", cursor:"pointer" }}>← Kembali</button>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <>
      <style>{css}</style>

      {/* ── Hero Banner ── */}
      <div className="hero-h" style={{ position:"relative", height:180, background:`linear-gradient(135deg, ${t.hero1} 0%, ${t.hero2} 100%)`, overflow:"hidden" }}>
        {/* decorative blobs */}
        <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,.12)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-40, left:"30%", width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,.08)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:20, left:"60%", width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,.07)", pointerEvents:"none" }}/>

        {/* back button */}
        <div className="hero-inner" style={{ position:"relative", zIndex:2, paddingTop:20, paddingLeft:20 }}>
          <button onClick={() => router.back()}
            style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(255,255,255,.22)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,.3)", borderRadius:50, padding:"7px 14px", cursor:"pointer", fontFamily:"'Lora',serif", fontSize:".8rem", color:"#fff" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Kembali
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ background:t.bg, minHeight:"calc(100vh - 180px)" }}>
        <div className="content" style={{ padding:"0 20px 80px" }}>

          {/* ── Identity: avatar di atas, nama di bawah ── */}
          <div className="au" style={{ marginTop:-45, marginBottom:24 }}>
            {/* Avatar */}
            <div className="avatar-wrap" onClick={() => user.image && setShowAvatar(true)}
              style={{ width:90, height:90, borderRadius:"50%", background:t.soft, border:`4px solid ${t.bg}`, boxShadow:`0 8px 32px ${t.accent}30`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", cursor: user.image ? "zoom-in" : "default", position:"relative" }}>
              {user.image
                ? <img src={user.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.4rem", color:t.accent, fontWeight:300, lineHeight:1 }}>{(user.name||"?")[0].toUpperCase()}</span>
              }
            </div>

            {/* Name + meta di bawah avatar */}
            <div style={{ marginTop:14 }}>
              <h1 className="name-h1" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", fontWeight:500, color:t.ink, lineHeight:1.1 }}>{user.name || "Pengguna"}</h1>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginTop:8 }}>
                {user.username && <span style={{ fontFamily:"'Lora',serif", fontSize:".8rem", color:t.accent, fontWeight:600 }}>@{user.username}</span>}
                {/* Displayed Medal Role */}
                {(() => {
                  const m = MEDALS.find(x => x.id === user.displayedMedal);
                  if (!m) return null;
                  const isAdm = m.id === "admin";
                  return (
                    <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:isAdm?"#FFEDED":`${t.accent}14`, border:isAdm?"1px solid #FFCDCD":`1px solid ${t.accent}25`, borderRadius:50, padding:"3px 10px" }}>
                      <span style={{ fontSize:".95rem", lineHeight:1 }}>{m.icon}</span>
                      <span style={{ fontFamily:"'Lora',serif", fontSize:".65rem", color:isAdm?"#FF4D4D":t.accent, fontWeight:700, letterSpacing:".05em", textTransform:"uppercase" }}>{m.label}</span>
                    </div>
                  );
                })()}
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10, flexWrap:"wrap" }}>
                {user.username && memberYear && <span style={{ fontFamily:"'Lora',serif", fontSize:".75rem", color:t.ink3 }}>Bergabung {memberYear}</span>}
                {totalReactions > 0 && (
                  <>
                    <span style={{ color:t.line, fontSize:".7rem" }}>·</span>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                      {user.reactions.filter(r=>r.count>0).slice(0,3).map(r=>(
                        <span key={r.emoji} style={{ fontSize:".85rem" }}>{r.emoji}</span>
                      ))}
                      <span style={{ fontFamily:"'Lora',serif", fontSize:".75rem", color:t.ink3 }}>{totalReactions}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Bio & Social Links */}
              {user.bio && (
                <p style={{ fontFamily:"'Lora',serif", fontSize:".85rem", color:t.ink, marginTop:12, lineHeight:1.5, opacity:.9 }}>{user.bio}</p>
              )}
              
              {(user.instagram || user.twitter || user.tiktok) && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14 }}>
                  {user.instagram && (
                    <a href={`https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer" style={{ width:32, height:32, borderRadius:8, background:`${t.accent}12`, display:"flex", alignItems:"center", justifyContent:"center", color:t.accent, transition:"opacity .2s" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    </a>
                  )}
                  {user.twitter && (
                    <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" style={{ width:32, height:32, borderRadius:8, background:`${t.accent}12`, display:"flex", alignItems:"center", justifyContent:"center", color:t.accent, transition:"opacity .2s" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                    </a>
                  )}
                  {user.tiktok && (
                    <a href={`https://tiktok.com/@${user.tiktok}`} target="_blank" rel="noopener noreferrer" style={{ width:32, height:32, borderRadius:8, background:`${t.accent}12`, display:"flex", alignItems:"center", justifyContent:"center", color:t.accent, transition:"opacity .2s" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {user.isPrivate && !user.isOwner ? (
            <div className="au2" style={{ marginTop: 20 }}>
              <div className="card" style={{ textAlign: "center", padding: "60px 20px", background: `linear-gradient(180deg, ${t.surface} 0%, ${t.bg} 100%)` }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${t.accent}12`, display: "flex", alignItems:"center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", fontWeight: 600, color: t.ink, marginBottom: 12 }}>Akun Ini Privat</h2>
                <p style={{ fontFamily: "'Lora',serif", fontSize: ".9rem", color: t.ink3, maxWidth: 300, margin: "0 auto", lineHeight: 1.6 }}>
                  Hanya pemilik akun yang dapat melihat isi profil lengkap dan catatan yang dipin.
                </p>
              </div>
            </div>
          ) : (
            <>
          {/* ── Stats grid (2 col mobile, 4 col desktop) ── */}
          <div className="stats-grid au2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            {[
              { label:"Streak Aktif", val:user.currentStreak, unit:"hari berturut", icon:<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>, highlight: user.currentStreak > 0 },
              { label:"Streak Terbaik", val:user.longestStreak, unit:"hari terpanjang", icon:<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>, highlight: user.longestStreak > 0 },
              { label:"Catatan Dibagikan", val:user.sharedCount, unit:"publik", icon:<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></>, highlight: user.sharedCount > 0 },
              { label:"Total Reaksi", val:totalReactions, unit:"dari pembaca", icon:<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>, highlight: totalReactions > 0 },
            ].map(({ label, val, unit, icon, highlight }) => (
              <div key={label} className="card" style={{ position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-20, right:-20, width:70, height:70, borderRadius:"50%", background:`${t.accent}08`, pointerEvents:"none" }}/>
                <div style={{ width:32, height:32, borderRadius:9, background:`${t.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                </div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.2rem", fontWeight:500, color: highlight ? t.accent : t.ink3, lineHeight:1 }}>{val}</p>
                <p style={{ fontFamily:"'Lora',serif", fontSize:".7rem", color:t.ink3, marginTop:4, lineHeight:1.4 }}>{unit}</p>
                <p style={{ fontFamily:"'Lora',serif", fontSize:".65rem", color:t.ink3, opacity:.7, marginTop:2, textTransform:"uppercase", letterSpacing:".05em" }}>{label}</p>
              </div>
            ))}
          </div>


          {/* ── Bottom: shared notes info + reactions side by side on desktop ── */}
          <div className="bottom-grid au3" style={{ display:"grid", gridTemplateColumns:"1fr", gap:12 }}>

            {/* Reactions card */}
            <div className="card au4">
              {user.isOwner ? (
                <>
                  <p style={{ fontFamily:"'Lora',serif", fontSize:".68rem", color:t.ink3, fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", marginBottom:16 }}>Reaksi yang Kamu Dapat</p>
                  {totalReactions === 0 ? (
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".85rem", color:t.ink3, fontStyle:"italic" }}>Belum ada reaksi dari pembaca.</p>
                  ) : (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {user.reactions.filter(r => r.count > 0).map(r => (
                        <div key={r.emoji} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:50, border:`1.5px solid ${t.accent}35`, background:`${t.accent}10` }}>
                          <span style={{ fontSize:"1.15rem", lineHeight:1 }}>{r.emoji}</span>
                          <span style={{ fontFamily:"'Lora',serif", fontSize:".88rem", fontWeight:600, color:t.ink }}>{r.count}</span>
                        </div>
                      ))}
                      <div style={{ display:"flex", alignItems:"center", padding:"10px 18px", borderRadius:50, background:t.soft }}>
                        <span style={{ fontFamily:"'Lora',serif", fontSize:".8rem", color:t.ink2 }}>{totalReactions} total</span>
                      </div>
                    </div>
                  )}
                </>
              ) : user.myReactions.length > 0 ? (
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <span style={{ fontSize:"2rem", lineHeight:1 }}>{user.myReactions[0]}</span>
                  <div>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".88rem", color:t.ink, fontWeight:500 }}>Reaksimu sudah terkirim!</p>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".75rem", color:t.ink3, marginTop:3 }}>{totalReactions} reaksi total dari semua pembaca</p>
                  </div>
                </div>
              ) : !user.isLoggedIn ? (
                <div style={{ position:"relative", minHeight:120, display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  {/* Blurred reaction buttons */}
                  <div style={{ filter:"blur(4px)", pointerEvents:"none", userSelect:"none" }}>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".68rem", color:t.ink3, fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Beri Reaksi</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {["👍","❤️","🔥","✨","🎉"].map(e => (
                        <div key={e} className="rb" style={{ cursor:"default" }}>
                          <span style={{ fontSize:"1.1rem", lineHeight:1 }}>{e}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Login overlay */}
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".84rem", color:t.ink, fontWeight:500, margin:0, textAlign:"center" }}>Masuk untuk memberi reaksi</p>
                    <a href="/" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 20px", borderRadius:50, background:t.accent, color:"#fff", fontFamily:"'Lora',serif", fontSize:".8rem", fontWeight:600, textDecoration:"none", transition:"opacity .18s" }}>
                      Masuk
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ fontFamily:"'Lora',serif", fontSize:".68rem", color:t.ink3, fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Beri Reaksi untuk {user.name?.split(" ")[0] || "Pengguna"}</p>
                  <p style={{ fontFamily:"'Lora',serif", fontSize:".78rem", color:t.ink3, marginBottom:16, lineHeight:1.5 }}>Kamu bisa memberi satu reaksi untuk profil ini.</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {user.reactions.map(r => (
                      <button key={r.emoji} className={`rb${reactingOn===r.emoji?" popping":""}`} onClick={() => react(r.emoji)} disabled={!!reactingOn}>
                        <span style={{ fontSize:"1.1rem", lineHeight:1 }}>{r.emoji}</span>
                        {r.count > 0 && <span style={{ fontSize:".8rem", fontWeight:500, minWidth:12 }}>{r.count}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Pinned notes card */}
            {(user.pinnedNotes.length > 0 || user.isOwner) && (
              <div className="card au4" style={{ marginTop: 12 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                  <p style={{ fontFamily:"'Lora',serif", fontSize:".68rem", color:t.ink3, fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", margin:0 }}>
                    📌 Catatan Dipin {user.pinnedNotes.length > 0 && <span style={{ color:t.accent }}>({user.pinnedNotes.length}/3)</span>}
                  </p>
                </div>
                {user.pinnedNotes.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"24px 0" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={t.ink3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:10, opacity:.5 }}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".84rem", color:t.ink3, fontStyle:"italic", margin:0 }}>Belum ada catatan yang dipin.</p>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".74rem", color:t.ink3, opacity:.7, marginTop:6 }}>Pin catatan lewat menu ••• di halaman utama.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {user.pinnedNotes.map(n => {
                      const eTheme = NOTE_THEMES[n.theme||""] ? { id: n.theme, ...NOTE_THEMES[n.theme||""] } : null;
                      const eColor = n.color ? NOTE_COLORS[n.color] : null;
                      const mMood = n.mood != null ? MOODS[n.mood] : null;
                      const isDarkCard = eTheme?.dark;
                      const hasLightBgAssigned = !!(eTheme || eColor || mMood);
                      const dInk = isDarkCard ? "#E8F8F6" : hasLightBgAssigned ? "#000000" : t.ink;
                      const dInk2 = isDarkCard ? "rgba(168,228,222,.90)" : hasLightBgAssigned ? "#111111" : t.ink2;
                      const isUnpinning = unpinning === n.id;
                      return (
                        <div key={n.id} style={{ position:"relative" }}>
                          <div className="ecard" onClick={() => { if (!n.isLocked) router.push(`/share/${n.shareId || n.id}`); }} style={{ "--card-accent": eTheme?.accent || eColor?.border || mMood?.color || t.accent, "--card-border": eTheme?.accent || eColor?.border || mMood?.border || t.line, background: eTheme?.bg || eColor?.bg || mMood?.bg || t.surface, opacity: isUnpinning ? .5 : 1, transition:"opacity .2s", cursor: n.isLocked ? "default" : "pointer" } as any}>
                            {eTheme && <CardThemeBg themeId={eTheme.id as string} accent={eTheme.accent}/>}
                            {n.isLocked && <div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",background:"rgba(255,255,255,.2)",backdropFilter:"blur(3px)",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>}
                            <div className={n.isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                                <span style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:eTheme?.accent || dInk2}}>{n.date}</span>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  {eTheme && !n.isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 5px",borderRadius:5,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                                  {n.mood != null && <span style={{fontSize:".85rem"}}>{MOODS[n.mood]?.emoji}</span>}
                                </div>
                              </div>
                              {(n.title || n.isLocked) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.04rem",fontWeight:500,color:dInk,marginBottom:3}}>{n.title || "Tanpa Judul"}</p>}
                              <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:dInk2,lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" as const,margin:0}} dangerouslySetInnerHTML={{ __html: n.isLocked ? "Konten terkunci." : stripHtml(n.text) }} />
                            </div>
                          </div>
                          {user.isOwner && (
                            <button
                              onClick={() => unpinNote(n.id)}
                              disabled={isUnpinning}
                              title="Lepas dari profil"
                              style={{ position:"absolute", top:10, right:10, zIndex:10, width:28, height:28, borderRadius:"50%", background: isDarkCard ? "rgba(0,0,0,.4)" : "rgba(255,255,255,.85)", backdropFilter:"blur(4px)", border:`1px solid ${t.line}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .18s" }}
                            >
                              {isUnpinning
                                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.ink3} strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .7s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.ink2} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              }
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Admin Panel ── */}
          {user.isViewerAdmin && !user.isOwner && (
            <div className="au4" style={{ marginTop: 16 }}>
              <div className="card" style={{ border: "1.5px solid #FFCDCD", background: "#FFF8F8" }}>
                <p style={{ fontFamily:"'Lora',serif", fontSize:".68rem", color:"#B85050", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>
                  🛡️ Panel Admin
                </p>

                {user.isSuspended ? (
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:"1.1rem" }}>🚫</span>
                      <div>
                        <p style={{ fontFamily:"'Lora',serif", fontSize:".84rem", color:"#B85050", fontWeight:500, margin:0 }}>Akun ini sedang di-suspend</p>
                        <p style={{ fontFamily:"'Lora',serif", fontSize:".74rem", color:"#D09090", margin:"3px 0 0" }}>User tidak bisa login sampai di-unsuspend.</p>
                      </div>
                    </div>
                    {user.suspendReason && (
                      <div style={{ background:"rgba(255,205,205,.12)", border:"1px solid #FFCDCD", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
                        <p style={{ fontFamily:"'Lora',serif", fontSize:".7rem", color:"#B85050", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 4px" }}>Alasan</p>
                        <p style={{ fontFamily:"'Lora',serif", fontSize:".82rem", color:"#6A4040", margin:0 }}>{user.suspendReason}</p>
                      </div>
                    )}
                    {suspendConfirm ? (
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => suspend(false)} disabled={suspendLoading} style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:"#5A8A6A", color:"#fff", fontFamily:"'Lora',serif", fontSize:".82rem", cursor:suspendLoading?"not-allowed":"pointer", opacity:suspendLoading?0.6:1 }}>
                          {suspendLoading ? "Memproses..." : "Ya, Unsuspend"}
                        </button>
                        <button onClick={() => { setSuspendConfirm(false); setSuspendError(""); }} disabled={suspendLoading} style={{ flex:1, padding:"9px", borderRadius:9, border:"1px solid #DDD", background:"transparent", color:"#888", fontFamily:"'Lora',serif", fontSize:".82rem", cursor:"pointer" }}>Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => setSuspendConfirm(true)} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"#5A8A6A", color:"#fff", fontFamily:"'Lora',serif", fontSize:".84rem", cursor:"pointer" }}>
                        Unsuspend User
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".84rem", color:"#6A4040", margin:"0 0 12px", lineHeight:1.55 }}>
                      Suspend akun ini untuk memblokir user dari login dan menggunakan aplikasi.
                    </p>
                    {suspendConfirm ? (
                      <div style={{ borderRadius:10, border:"1px solid #FFCDCD", padding:"14px", background:"rgba(255,205,205,.08)", marginBottom:8 }}>
                        <p style={{ fontFamily:"'Lora',serif", fontSize:".82rem", color:"#6A4040", margin:"0 0 12px", lineHeight:1.5 }}>
                          Suspend <strong>{user.name}</strong>? Sesi aktif mereka akan langsung tidak valid.
                        </p>

                        {/* Reason picker */}
                        <p style={{ fontFamily:"'Lora',serif", fontSize:".72rem", color:"#B85050", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 8px" }}>Alasan (wajib)</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                          {SUSPEND_REASONS.map(r => (
                            <label key={r} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                              <input
                                type="radio"
                                name="suspendReason"
                                value={r}
                                checked={suspendReason === r}
                                onChange={() => setSuspendReason(r)}
                                style={{ accentColor:"#B85050" }}
                              />
                              <span style={{ fontFamily:"'Lora',serif", fontSize:".81rem", color:"#6A4040" }}>{r}</span>
                            </label>
                          ))}
                        </div>

                        {/* Internal note */}
                        <p style={{ fontFamily:"'Lora',serif", fontSize:".72rem", color:"#B85050", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 6px" }}>Catatan Internal (tidak ditampilkan ke user)</p>
                        <textarea
                          value={suspendNote}
                          onChange={e => setSuspendNote(e.target.value)}
                          placeholder="Tambahkan konteks internal jika perlu..."
                          rows={3}
                          style={{ width:"100%", borderRadius:8, border:"1px solid #FFCDCD", padding:"8px 10px", fontFamily:"'Lora',serif", fontSize:".81rem", color:"#6A4040", background:"#FFF8F8", resize:"vertical", outline:"none", marginBottom:12, boxSizing:"border-box" }}
                        />

                        <div style={{ display:"flex", gap:8 }}>
                          <button
                            onClick={() => suspend(true)}
                            disabled={suspendLoading || !suspendReason}
                            style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:"#B85050", color:"#fff", fontFamily:"'Lora',serif", fontSize:".82rem", cursor:(suspendLoading||!suspendReason)?"not-allowed":"pointer", opacity:(suspendLoading||!suspendReason)?0.5:1 }}
                          >
                            {suspendLoading ? "Memproses..." : "Ya, Suspend"}
                          </button>
                          <button onClick={() => { setSuspendConfirm(false); setSuspendError(""); setSuspendReason(""); setSuspendNote(""); }} disabled={suspendLoading} style={{ flex:1, padding:"9px", borderRadius:9, border:"1px solid #DDD", background:"transparent", color:"#888", fontFamily:"'Lora',serif", fontSize:".82rem", cursor:"pointer" }}>Batal</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setSuspendConfirm(true)} style={{ padding:"9px 20px", borderRadius:9, border:"1.5px solid #FFCDCD", background:"transparent", color:"#B85050", fontFamily:"'Lora',serif", fontSize:".84rem", cursor:"pointer" }}>
                        Suspend User
                      </button>
                    )}
                  </div>
                )}

                {suspendError && (
                  <p style={{ fontFamily:"'Lora',serif", fontSize:".78rem", color:"#B85050", marginTop:10, margin:"10px 0 0" }}>{suspendError}</p>
                )}

                {/* ── Shared notes moderation ── */}
                <div style={{ marginTop:16, borderTop:"1px solid #FFCDCD", paddingTop:14 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".72rem", color:"#B85050", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", margin:0 }}>
                      Catatan yang Dibagikan
                    </p>
                    {sharedNotes === null && (
                      <button
                        onClick={loadSharedNotes}
                        disabled={sharedNotesLoading}
                        style={{ fontFamily:"'Lora',serif", fontSize:".75rem", color:"#B85050", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", opacity:sharedNotesLoading?0.5:1 }}
                      >
                        {sharedNotesLoading ? "Memuat..." : "Muat"}
                      </button>
                    )}
                  </div>

                  {sharedNotes !== null && sharedNotes.length === 0 && (
                    <p style={{ fontFamily:"'Lora',serif", fontSize:".8rem", color:"#C0A0A0", margin:0 }}>Tidak ada catatan yang dibagikan.</p>
                  )}

                  {sharedNotes !== null && sharedNotes.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {sharedNotes.map(n => (
                        <div key={n.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, border:`1px solid ${n.isModerated ? "#FFCDCD" : "#EDE7DF"}`, background:n.isModerated ? "rgba(255,205,205,.08)" : "#FAFAFA" }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontFamily:"'Lora',serif", fontSize:".82rem", color: n.isModerated ? "#B85050" : "#2E2520", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {n.title}
                            </p>
                            {n.isModerated && (
                              <p style={{ fontFamily:"'Lora',serif", fontSize:".68rem", color:"#B85050", margin:"2px 0 0", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>Disembunyikan</p>
                            )}
                          </div>
                          <button
                            onClick={() => moderateNote(n.id, !n.isModerated)}
                            disabled={moderatingNote === n.id}
                            style={{ flexShrink:0, padding:"5px 12px", borderRadius:7, border:"none", background: n.isModerated ? "#5A8A6A" : "#B85050", color:"#fff", fontFamily:"'Lora',serif", fontSize:".75rem", cursor:moderatingNote===n.id?"not-allowed":"pointer", opacity:moderatingNote===n.id?0.5:1 }}
                          >
                            {moderatingNote === n.id ? "..." : n.isModerated ? "Aktifkan" : "Sembunyikan"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
            </>
          )}

        </div>
      </div>

      {/* ── Avatar Lightbox ── */}
      {showAvatar && user.image && (
        <div onClick={() => setShowAvatar(false)}
          style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,.85)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out", backdropFilter:"blur(8px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position:"relative", width:"min(85vw,480px)", height:"min(85vw,480px)" }}>
            <img src={user.image} alt={user.name||""} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%", boxShadow:"0 24px 80px rgba(0,0,0,.6)", display:"block", border:"4px solid rgba(255,255,255,.1)" }}/>
            <button onClick={() => setShowAvatar(false)}
              style={{ position:"absolute", top:-14, right:-14, width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,.15)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,.2)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}