"use client";
import { useEffect, useRef, useState } from "react";

export default function ShareMusicPlayer({ songId, previewUrl, artwork, title }: { songId: string; previewUrl: string; artwork: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const isYouTube = songId?.startsWith("yt_");
  const videoId = isYouTube ? songId.replace("yt_", "") : "";

  useEffect(() => {
    if (isYouTube) { setPlaying(true); return; } // iframe autoplays
    const a = audioRef.current;
    if (!a) return;
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [isYouTube]);

  const toggle = () => {
    if (isYouTube) {
      const func = playing ? "pauseVideo" : "playVideo";
      ytIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
      setPlaying(!playing);
    } else {
      const a = audioRef.current;
      if (!a) return;
      if (playing) { a.pause(); setPlaying(false); }
      else { a.play().then(() => setPlaying(true)).catch(() => {}); }
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.2)", marginTop: 20, minWidth: 0, overflow: "hidden" }}>
      {isYouTube
        ? <iframe ref={ytIframeRef} src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1`} allow="autoplay; encrypted-media" style={{ width: 0, height: 0, border: "none", position: "absolute" }} />
        : <audio ref={audioRef} src={previewUrl} loop preload="auto" />
      }
      {artwork && <img src={artwork} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
      <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Lora',serif", fontSize: ".72rem", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: .85 }}>{title}</p>
        <p style={{ fontFamily: "'Lora',serif", fontSize: ".6rem", margin: 0, opacity: .5 }}>{isYouTube ? "YouTube · berulang" : "30 detik · berulang"}</p>
      </div>
      <button onClick={toggle} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", flexShrink: 0, color: "inherit" }}>
        {playing ? "⏸" : "▶"}
      </button>
    </div>
  );
}
