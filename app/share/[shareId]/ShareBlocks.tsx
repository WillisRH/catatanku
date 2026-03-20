"use client";

import { useState } from "react";

type SBlock =
  | { type: "text"; content: string }
  | { type: "todo"; content: string; done: boolean }
  | { type: "image"; url: string; size?: string; align?: string }
  | { type: "gallery"; cols: number; urls: string[] }
  | { type: "link"; url: string; title?: string; description?: string; image?: string; favicon?: string }
  | { type: "table"; rows: string[][] };

const szW: Record<string, string> = { sm: "40%", md: "65%", lg: "85%", full: "100%" };

function parseLineStyle(line: string): { align: "left" | "center" | "right"; text: string } {
  if (line.startsWith("::::")) return { align: "right", text: line.slice(4) };
  if (line.startsWith(":::"))  return { align: "center", text: line.slice(3) };
  return { align: "left", text: line };
}

function renderInline(raw: string): React.ReactNode {
  if (!raw.includes("**") && !raw.includes("_")) return raw;
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|_(.+?)_/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) parts.push(raw.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={m.index} style={{ fontWeight: 700 }}>{m[1]}</strong>);
    else parts.push(<em key={m.index} style={{ fontStyle: "italic" }}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push(raw.slice(last));
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return <>{parts}</>;
}

export default function ShareBlocks({ blocks, accent, fontFamily = "'Lora', serif", isDark = false, themeId }: { blocks: SBlock[]; accent: string; fontFamily?: string; isDark?: boolean; themeId?: string }) {
  const isKM = themeId === 'kota_malam';
  const inkColor = isKM ? "#FFFFFF" : isDark ? "rgba(228,248,246,.92)" : "#2E2520";
  const ink2Color = isKM ? "rgba(255,255,255,.85)" : isDark ? "rgba(168,228,222,.90)" : "#8C7E73";
  const ink3Color = isKM ? "rgba(255,255,255,.60)" : isDark ? "rgba(100,178,173,.55)" : "#BEB3A8";
  const dividerColor = isKM ? "rgba(255,255,255,.12)" : isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,0.07)";
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out", padding: 24,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "100%", maxHeight: "90vh",
              borderRadius: 16, objectFit: "contain",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
              cursor: "default",
            }}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: "fixed", top: 20, right: 24,
              background: "rgba(255,255,255,0.12)", border: "none",
              color: "#fff", fontSize: "1.4rem", width: 40, height: 40,
              borderRadius: "50%", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >✕</button>
        </div>
      )}

      {blocks.map((blk, bi) => {
        if (blk.type === "image") {
          const w = szW[blk.size || "full"] || "100%";
          const mg = blk.align === "center" ? "20px auto" : blk.align === "right" ? "20px 0 20px auto" : "20px 0";
          return (
            <div
              key={bi}
              onClick={() => setLightboxUrl(blk.url)}
              style={{ margin: mg, width: w, borderRadius: 14, overflow: "hidden", cursor: "zoom-in" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blk.url} alt="" style={{ width: "100%", display: "block", borderRadius: 14, maxHeight: 520, objectFit: "cover" }} />
            </div>
          );
        }
        if (blk.type === "gallery") {
          return (
            <div
              key={bi}
              style={{
                margin: "20px 0",
                display: "grid",
                gridTemplateColumns: `repeat(${blk.cols},1fr)`,
                gap: 6,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {blk.urls.map((url, j) => (
                <div
                  key={j}
                  onClick={() => setLightboxUrl(url)}
                  style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", cursor: "zoom-in" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          );
        }
        if (blk.type === "todo") {
          return (
            <div key={bi} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${dividerColor}` }}>
              <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", border: `2px solid ${blk.done ? accent : ink3Color}`, background: blk.done ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {blk.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontFamily, fontSize: "1rem", lineHeight: 1.7, color: blk.done ? ink2Color : inkColor, textDecoration: blk.done ? "line-through" : "none" }}>
                {renderInline(blk.content)}
              </span>
            </div>
          );
        }
        if (blk.type === "link") {
          let hostname = "";
          try { hostname = new URL(blk.url).hostname; } catch(_) {}
          return (
            <div key={bi} style={{ margin: "12px 0" }}>
              <a href={blk.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${dividerColor}`, background: "rgba(255,255,255,.06)", textDecoration: "none", color: "inherit", overflow: "hidden" }}>
                {blk.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={blk.image} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    {blk.favicon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={blk.favicon} alt="" style={{ width: 13, height: 13, borderRadius: 2, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <span style={{ fontSize: ".68rem", color: ink3Color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hostname}</span>
                  </div>
                  <div style={{ fontFamily, fontSize: ".88rem", fontWeight: 600, color: inkColor, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{blk.title || blk.url}</div>
                  {blk.description && (
                    <div style={{ fontSize: ".76rem", color: ink2Color, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{blk.description}</div>
                  )}
                </div>
              </a>
            </div>
          );
        }
        if (blk.type === "table") {
          return (
            <div key={bi} style={{ margin: "12px 0", overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontFamily, fontSize: "1rem" }}>
                <tbody>
                  {blk.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} style={{ border: `1px solid ${dividerColor}`, padding: "7px 10px", color: inkColor, fontWeight: r === 0 ? 600 : 400, background: r === 0 ? "rgba(255,255,255,.04)" : "transparent", minWidth: 60 }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        // text block — HTML (new) or plain markdown (legacy)
        if (/<(?:div|br|strong|em|span)\b/i.test(blk.content)) {
          return (
            <div
              key={bi}
              className="rich-read"
              style={{ fontFamily, fontSize: "1.05rem", lineHeight: 2.1, color: inkColor }}
              dangerouslySetInnerHTML={{ __html: blk.content }}
            />
          );
        }
        return blk.content.split("\n").map((line, li) => {
          if (!line) return <div key={`${bi}-${li}`} style={{ height: "1rem" }} />;
          const { align, text } = parseLineStyle(line);
          return (
            <p
              key={`${bi}-${li}`}
              style={{ fontFamily, fontSize: "1.05rem", lineHeight: 2.1, color: inkColor, marginBottom: 0, textAlign: align }}
            >
              {renderInline(text)}
            </p>
          );
        });
      })}
    </>
  );
}
