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

function renderInline(raw: string, titleMap: Record<string, string> = {}): React.ReactNode {
  const hasMarkup = raw.includes('**') || raw.includes('_') || raw.includes('<u>') ||
    raw.includes('~~') || raw.includes('`') || raw.includes('[') || raw.includes('[[');
  if (!hasMarkup) return raw;
  const parts: React.ReactNode[] = [];
  const re = /\[\[(.+?)\]\]|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|~~(.+?)~~|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|_(.+?)_|<u>(.+?)<\/u>/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) parts.push(raw.slice(last, m.index));
    if (m[1] !== undefined) {
      const title = m[1];
      const sid = titleMap[title.toLowerCase().trim()];
      parts.push(sid ? <a key={m.index} href={`/share/${sid}`} className="note-link clickable">{title}</a> : <span key={m.index} className="note-link">{title}</span>);
    }
    else if (m[2] !== undefined) parts.push(<strong key={m.index}><em>{m[2]}</em></strong>);
    else if (m[3] !== undefined) parts.push(<strong key={m.index} style={{fontWeight:700}}>{m[3]}</strong>);
    else if (m[4] !== undefined) parts.push(<s key={m.index} style={{opacity:0.6}}>{m[4]}</s>);
    else if (m[5] !== undefined) parts.push(<code key={m.index} style={{background:'var(--surface2,rgba(0,0,0,0.06))',borderRadius:4,padding:'1px 5px',fontFamily:'monospace',fontSize:'0.88em'}}>{m[5]}</code>);
    else if (m[6] !== undefined) parts.push(<a key={m.index} href={m[7]} target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)',textDecoration:'underline'}}>{m[6]}</a>);
    else if (m[8] !== undefined) parts.push(<em key={m.index} style={{fontStyle:'italic'}}>{m[8]}</em>);
    else parts.push(<u key={m.index}>{m[9]}</u>);
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push(raw.slice(last));
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return <>{parts}</>;
}

export default function ShareBlocks({ blocks, accent, titleMap = {}, fontFamily = "'Lora', serif", isDark = false, themeId }: { blocks: SBlock[]; accent: string; titleMap?: Record<string, string>; fontFamily?: string; isDark?: boolean; themeId?: string }) {
  const isKM = themeId === 'kota_malam';
  const inkColor = isKM ? "#FFFFFF" : isDark ? "rgba(228,248,246,.92)" : "#2E2520";
  const ink2Color = isKM ? "rgba(255,255,255,.85)" : isDark ? "rgba(168,228,222,.90)" : "#8C7E73";
  const ink3Color = isKM ? "rgba(255,255,255,.60)" : isDark ? "rgba(100,178,173,.55)" : "#BEB3A8";
  const dividerColor = isKM ? "rgba(255,255,255,.12)" : isDark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,0.07)";
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const grayColor = isDark ? 'rgba(255,255,255,0.45)' : '#999';
  const grayBorder = isDark ? 'rgba(255,255,255,0.3)' : '#ccc';

  return (
    <>
      <style>{`
        .rich-read h1{font-size:1.7rem;font-weight:700;margin-top:1.2em;margin-bottom:.2em;line-height:1.25}
        .rich-read h2{font-size:1.4rem;font-weight:700;margin-top:1em;margin-bottom:.2em;line-height:1.3}
        .rich-read h3{font-size:1.15rem;font-weight:700;margin-top:.9em;margin-bottom:.15em;line-height:1.35}
        .rich-read h4{font-size:1.05rem;font-weight:700;margin-top:.8em;margin-bottom:.1em;line-height:1.4}
        .rich-read strong{font-weight:700}
        .rich-read em{font-style:italic}
        .rich-read div{min-height:1.2em}
        .note-link { color: ${grayColor}; border-bottom: 1.5px dotted ${grayBorder}; cursor: default; transition: all 0.2s; font-weight: 500; text-decoration: none; }
        .note-link.clickable { color: ${accent}; border-bottom-color: ${accent}80; cursor: pointer; }
        .note-link.clickable:hover { background: ${accent}15; border-bottom-style: solid; }
      `}</style>
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
                {renderInline(blk.content, titleMap)}
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
        if (/<(?:div|br|strong|em|span|u)\b/i.test(blk.content)) {
          return (
            <div
              key={bi}
              className="rich-read"
              style={{ fontFamily, fontSize: "1.05rem", lineHeight: 2.1, color: inkColor }}
              dangerouslySetInnerHTML={{ __html: blk.content.replace(/\[\[(.*?)\]\]/g, (match, title) => {
                const sid = titleMap[title.toLowerCase().trim()];
                return sid ? `<a href="/share/${sid}" class="note-link clickable">${title}</a>` : `<span class="note-link">${title}</span>`;
              }) }}
            />
          );
        }
        return (
          <div key={bi} className="rich-read">
            {blk.content.split("\n").map((line, li) => {
              if (!line) return <div key={`${bi}-${li}`} style={{ height: "1.1rem" }} />;
              const { align, text } = parseLineStyle(line);
              const bMatch = text.match(/^(\s*)([-*•])\s(.*)/);
              const nMatch = text.match(/^(\s*)(\d+)\.\s(.*)/);
              const hMatch = text.match(/^(\s*)(#+)\s(.*)/);
              if (hMatch) {
                const level = Math.min(6, hMatch[2].length);
                const Tag = `h${level}` as any;
                return <Tag key={`${bi}-${li}`} style={{ fontFamily, color: inkColor, textAlign: align, wordBreak: "break-word" }}>{renderInline(hMatch[3], titleMap)}</Tag>;
              }
              if (bMatch) {
                return (
                  <div key={`${bi}-${li}`} style={{ display: "flex", gap: 8, textAlign: align, marginBottom: 4 }}>
                    <span style={{ opacity: 0.45, flexShrink: 0 }}>{bMatch[2]}</span>
                    <span style={{ flex: 1 }}>{renderInline(bMatch[3], titleMap)}</span>
                  </div>
                );
              }
              if (nMatch) {
                return (
                  <div key={`${bi}-${li}`} style={{ display: "flex", gap: 8, textAlign: align, marginBottom: 4 }}>
                    <span style={{ opacity: 0.45, flexShrink: 0, minWidth: "1.2em" }}>{nMatch[2]}.</span>
                    <span style={{ flex: 1 }}>{renderInline(nMatch[3], titleMap)}</span>
                  </div>
                );
              }
              return (
                <p
                  key={`${bi}-${li}`}
                  style={{ fontFamily, fontSize: "1.05rem", lineHeight: 2.1, color: inkColor, marginBottom: 0, textAlign: align }}
                >
                  {renderInline(text, titleMap)}
                </p>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
