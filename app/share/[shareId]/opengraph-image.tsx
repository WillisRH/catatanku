import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export const alt = "Catatanku";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS_SHORT = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MOODS = [
  { emoji: "☀️", label: "Bahagia", color: "#D4A24E" },
  { emoji: "🍃", label: "Tenang",  color: "#7A9E7E" },
  { emoji: "🌧️", label: "Sedih",   color: "#7B8FA1" },
  { emoji: "🔥", label: "Marah",   color: "#B5705A" },
  { emoji: "🌙", label: "Rindu",   color: "#8E7BA8" },
  { emoji: "🌊", label: "Cemas",   color: "#6B8E9E" },
];
const NOTE_COLORS: Record<string, { bg: string; accent: string }> = {
  "":        { bg: "#FAF6F0", accent: "#C4956A" },
  blush:     { bg: "#FEF2F2", accent: "#C27070" },
  sage:      { bg: "#F2F7F3", accent: "#6B9E78" },
  sky:       { bg: "#F1F5FD", accent: "#5B8DD9" },
  lavender:  { bg: "#F5F2FD", accent: "#8B68C6" },
  sand:      { bg: "#FBF5E9", accent: "#B5944A" },
};
const NOTE_THEMES: Record<string, { bg: string; accent: string; label: string }> = {
  cinta:     { bg: "#FFF0F5", accent: "#D4607A", label: "🌹" },
  alam:      { bg: "#EEFAF3", accent: "#3D8B5C", label: "🌿" },
  mimpi:     { bg: "#F5F0FF", accent: "#7B5EA7", label: "🌙" },
  langit:    { bg: "#EDF6FF", accent: "#3D7FBF", label: "☁️" },
  nostalgia: { bg: "#FBF3E8", accent: "#A07035", label: "🍂" },
  laut:      { bg: "#EDF9F8", accent: "#2E8B8B", label: "🌊" },
  galaksi:   { bg: '#F1F0F8', accent: '#6558B0', label: '✨' },
  pagi:      { bg: '#FFFBEE', accent: '#D4853C', label: '🌅' },
  salju:     { bg: '#F2F8FC', accent: '#4A8DBF', label: '❄️' },
  hutan:     { bg: '#EDF4EE', accent: '#2D6B45', label: '🌲' },
  gunung:    { bg: '#F5F3ED', accent: '#7A6545', label: '🏔️' },
  bunga:     { bg: '#FDF4FA', accent: '#C05898', label: '🌸' },
};

// Theme SVGs — rendered at 1200×630, positioned in the right half as decoration
function ThemeOgSvg({ themeId, accent }: { themeId: string; accent: string }) {
  const s = {
    position: "absolute" as const,
    top: 0, right: 0,
    width: 600, height: 630,
    overflow: "hidden" as const,
    pointerEvents: "none" as const,
  };

  if (themeId === "cinta") return (
    <svg style={{ ...s, opacity: 0.13 }} viewBox="0 0 600 630" fill={accent}>
      {([
        [480,80,2.2],[380,180,1.4],[540,280,1.8],[420,400,2.6],[310,310,1.1],
        [560,500,1.6],[470,580,2],[350,520,1.3],[580,160,1],[290,470,1.8],
        [510,360,1.5],[440,240,1],[330,130,1.6],[490,460,1.2],[360,600,2],
      ] as number[][]).map(([x,y,sc],i) => (
        <path key={i}
          d="M0,-9C0,-15-10.5,-15-10.5,-7.5C-10.5,0 0,10.5 0,13.5C0,10.5 10.5,0 10.5,-7.5C10.5,-15 0,-15 0,-9Z"
          transform={`translate(${x},${y})scale(${sc})`}
        />
      ))}
    </svg>
  );

  if (themeId === "alam") return (
    <svg style={{ ...s, opacity: 0.12 }} viewBox="0 0 600 630" fill={accent}>
      {([
        [460,60,0,1.8],[380,160,-25,2.2],[540,200,15,1.5],[420,320,-10,2],
        [310,270,20,1.4],[560,420,-20,1.8],[470,500,10,1.6],[350,560,-15,2.2],
        [510,100,30,1.3],[290,420,5,1.7],[550,320,-8,1.4],[390,450,18,2],
        [480,600,-12,1.6],[330,200,25,1.2],[440,380,-5,1.9],
      ] as number[][]).map(([x,y,r,sc],i) => (
        <g key={i} transform={`translate(${x},${y})rotate(${r})scale(${sc})`}>
          <path d="M0,-18C10,-9 13,3 0,21C-13,3-10,-9 0,-18Z"/>
          <line x1="0" y1="-3" x2="0" y2="18" stroke={accent} strokeWidth="1.5" fill="none"/>
        </g>
      ))}
    </svg>
  );

  if (themeId === "mimpi") return (
    <svg style={{ ...s, opacity: 0.14 }} viewBox="0 0 600 630" fill={accent}>
      {([
        [460,80,10],[380,200,7],[540,160,12],[420,340,8],[310,280,13],
        [560,460,9],[470,560,11],[350,500,7],[510,300,10],[290,400,8],
        [540,80,5],[390,460,12],[480,200,7],[330,140,9],[440,620,11],
      ] as number[][]).map(([x,y,r],i) => (
        <polygon key={i}
          points={`0,-${r} ${r*.35},-${r*.35} ${r},0 ${r*.35},${r*.35} 0,${r} -${r*.35},${r*.35} -${r},0 -${r*.35},-${r*.35}`}
          transform={`translate(${x},${y})`}
        />
      ))}
      {([
        [490,130,4],[360,360,3],[510,500,4],[420,260,3],[330,560,4],
      ] as number[][]).map(([x,y,r],i) => (
        <circle key={`c${i}`} cx={x} cy={y} r={r}/>
      ))}
    </svg>
  );

  if (themeId === "langit") return (
    <svg style={{ ...s, opacity: 0.11 }} viewBox="0 0 600 630" fill={accent}>
      {([
        [440,80,1.8],[540,200,2.2],[360,200,1.4],[500,340,2],
        [420,460,1.6],[560,520,1.8],[310,380,1.2],[480,580,2.2],
        [350,100,1.5],[530,380,1.4],[400,280,1.8],
      ] as number[][]).map(([x,y,sc],i) => (
        <g key={i} transform={`translate(${x},${y})scale(${sc})`}>
          <circle cx="0" cy="0" r="18"/>
          <circle cx="26" cy="-5" r="14"/>
          <circle cx="-26" cy="-5" r="11"/>
          <circle cx="10" cy="-17" r="12"/>
        </g>
      ))}
    </svg>
  );

  if (themeId === "nostalgia") return (
    <svg style={{ ...s, opacity: 0.13 }} viewBox="0 0 600 630" fill={accent}>
      {([
        [460,80,12,1.8],[380,200,-18,2.2],[540,180,8,1.5],[420,340,-15,2],
        [310,260,20,1.4],[560,440,-10,1.8],[470,540,15,2],[350,500,-20,1.6],
        [510,120,5,1.3],[290,400,-8,1.7],[540,300,18,1.5],[390,460,-5,2.2],
        [480,600,10,1.6],[330,160,-12,1.4],[440,380,22,1.9],
      ] as number[][]).map(([x,y,r,sc],i) => (
        <path key={i}
          d="M0,-13L3.5,-6.5L10,-9L6,-2.5L11.5,2.5L6.5,2.5L7.5,10.5L2.5,6.5L0,13L-2.5,6.5L-7.5,10.5L-6.5,2.5L-11.5,2.5L-6,-2.5L-10,-9L-3.5,-6.5Z"
          transform={`translate(${x},${y})rotate(${r})scale(${sc})`}
        />
      ))}
    </svg>
  );

  if (themeId === "laut") return (
    <svg style={{ ...s, opacity: 0.12 }} viewBox="0 0 600 630" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round">
      {[0,55,110,165,220,275,330,385,440,495,550,605].map((y,i) => (
        <path key={i} d={`M280,${y}C340,${y-28} 400,${y+28} 460,${y}C520,${y-28} 580,${y+28} 640,${y}`}/>
      ))}
    </svg>
  );
  if (themeId === "galaksi") return (
    <svg style={{ ...s, opacity: 1 }} viewBox="0 0 600 630" fill="none">
      <ellipse cx="420" cy="140" rx="180" ry="62" transform="rotate(-18 420 140)" stroke={accent} strokeWidth="1.5" opacity=".1"/>
      <ellipse cx="420" cy="140" rx="118" ry="42" transform="rotate(40 420 140)" stroke={accent} strokeWidth="1" opacity=".08"/>
      <ellipse cx="120" cy="480" rx="140" ry="52" transform="rotate(22 120 480)" stroke={accent} strokeWidth="1.2" opacity=".09"/>
      {[[320,60,2,.5],[480,40,1.5,.46],[560,120,2,.48],[380,200,1.5,.44],[200,180,2,.46],[500,260,1.5,.44],[260,340,2,.46],[440,380,1.5,.42],[520,460,2,.48],[300,480,1.5,.44],[160,520,2,.46],[420,560,1.5,.42],[100,580,2,.5],[560,580,1.5,.44],[340,580,1,.4],[480,160,1,.4]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill={accent} opacity={op}/>
      ))}
      {[[480,80,7,.28],[320,320,6,.25],[560,420,5,.22],[380,520,6,.25]].map(([x,y,sz,op]:number[],i)=>(
        <path key={`sp${i}`} fill={accent} opacity={op} d={`M${x},${y-sz}L${x+sz*.28},${y-sz*.28}L${x+sz},${y}L${x+sz*.28},${y+sz*.28}L${x},${y+sz}L${x-sz*.28},${y+sz*.28}L${x-sz},${y}L${x-sz*.28},${y-sz*.28}Z`}/>
      ))}
      <circle cx="520" cy="90" r="14" fill={accent} opacity=".13"/>
      <ellipse cx="520" cy="90" rx="28" ry="9" stroke={accent} strokeWidth="1.8" opacity=".12"/>
      <circle cx="180" cy="500" r="10" fill={accent} opacity=".11"/>
      <ellipse cx="180" cy="500" rx="20" ry="6.5" stroke={accent} strokeWidth="1.4" opacity=".1"/>
    </svg>
  );
  if (themeId === "pagi") return (
    <svg style={{ ...s, opacity: 1 }} viewBox="0 0 600 630" fill="none">
      <circle cx="540" cy="100" r="75" fill={accent} opacity=".08"/>
      <circle cx="540" cy="100" r="55" fill={accent} opacity=".07"/>
      <circle cx="540" cy="100" r="38" fill={accent} opacity=".1"/>
      {Array.from({length:14},(_,i)=>{const a=(i*25.7-10)*Math.PI/180;const r1=88,r2=145;return <line key={i} x1={540+Math.cos(a)*r1} y1={100+Math.sin(a)*r1} x2={540+Math.cos(a)*r2} y2={100+Math.sin(a)*r2} stroke={accent} strokeWidth="2" opacity=".12" strokeLinecap="round"/>;}).filter(Boolean)}
      {[[280,200,1.2],[380,150,1.3],[460,220,1.1],[320,300,1.2],[440,310,1.1],[300,400,1.2],[420,400,1.1],[350,480,1.2],[480,450,1.1]].map(([x,y,sc]:number[],i)=>(
        <g key={i} transform={`translate(${x},${y})scale(${sc})`} stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity=".28">
          <path d="M-12,0Q-6,-7 0,-3Q6,-7 12,0"/>
        </g>
      ))}
      <path d="M260,580 Q360,555 460,572 Q520,560 610,570" stroke={accent} strokeWidth="1.2" opacity=".12" strokeLinecap="round"/>
    </svg>
  );
  if (themeId === "salju") return (
    <svg style={{ ...s, opacity: 1 }} viewBox="0 0 600 630" fill="none" stroke={accent} strokeLinecap="round">
      {[[300,60,22,.13],[480,100,18,.11],[380,200,24,.12],[200,240,20,.11],[540,280,22,.12],[300,380,26,.12],[460,420,18,.1],[200,460,22,.12],[380,520,20,.1],[300,580,22,.11],[500,560,16,.09],[180,560,18,.1]].map(([cx,cy,sz,op]:number[],i)=>{
        const bLen=sz*.32;
        return (
          <g key={i} opacity={op} transform={`translate(${cx},${cy})`} strokeWidth="1.3">
            {[0,60,120,180,240,300].map((ang,j)=>{const r=ang*Math.PI/180;const cos=Math.cos(r),sin=Math.sin(r);const bx=cos*sz*.46,by=sin*sz*.46;const br1=(ang+60)*Math.PI/180,br2=(ang-60)*Math.PI/180;return(<g key={j}><line x1="0" y1="0" x2={cos*sz} y2={sin*sz}/><line x1={bx} y1={by} x2={bx+Math.cos(br1)*bLen} y2={by+Math.sin(br1)*bLen}/><line x1={bx} y1={by} x2={bx+Math.cos(br2)*bLen} y2={by+Math.sin(br2)*bLen}/></g>);})}
            <circle cx="0" cy="0" r="2.2" fill={accent} stroke="none"/>
          </g>
        );
      })}
    </svg>
  );
  if (themeId === "hutan") return (
    <svg style={{ ...s, opacity: 1 }} viewBox="0 0 600 630" fill={accent}>
      <path d="M260,490 L290,440 L318,460 L350,415 L382,438 L415,398 L445,422 L478,382 L510,408 L545,368 L580,392 L610,370 L610,495Z" opacity=".07"/>
      {[[285,630,430,115,3,.11],[365,630,415,98,3,.1],[445,630,440,118,3,.11],[530,630,420,105,3,.1],[605,630,410,88,3,.09]].map(([x,base,bot,w,_,op]:number[],i)=>{
        const h=Number(base)-Number(bot);
        return (
          <g key={i} opacity={op}>
            <rect x={Number(x)-Number(w)*.065} y={Number(bot)-8} width={Number(w)*.13} height={10}/>
            {[0,1,2].map(l=>{const ly=Number(bot)-l*(h/3.2);const lw=Number(w)*(.42+l*.2);const lh=h/3;return <polygon key={l} points={`${x},${ly-lh} ${Number(x)-lw/2},${ly} ${Number(x)+lw/2},${ly}`}/>;}).reverse()}
          </g>
        );
      })}
      {[[310,180,-22,1.2],[450,150,14,1.4],[340,300,28,1.1],[500,260,-18,1.2],[290,400,20,1]].map(([x,y,rot,sc]:number[],i)=>(
        <g key={`l${i}`} transform={`translate(${x},${y})rotate(${rot})scale(${sc})`} opacity=".12">
          <path d="M0,-18C9,-9 12,2 0,20C-12,2-9,-9 0,-18Z"/>
          <line x1="0" y1="-2" x2="0" y2="18" stroke={accent} strokeWidth="1.2" fill="none"/>
        </g>
      ))}
    </svg>
  );
  if (themeId === "gunung") return (
    <svg style={{ ...s, opacity: 1 }} viewBox="0 0 600 630" fill={accent}>
      <polygon points="260,450 320,290 385,340 445,240 510,320 570,270 630,380 630,450" opacity=".07"/>
      <polygon points="260,530 300,415 358,450 415,350 470,390 525,315 580,360 630,420 630,530" opacity=".09"/>
      <polygon points="260,600 295,498 345,530 395,440 450,475 505,400 555,440 605,510 630,560 630,600" opacity=".11"/>
      <polygon points="445,240 432,278 460,278" fill="white" opacity=".3"/>
      <polygon points="510,320 498,358 524,358" fill="white" opacity=".25"/>
      <polygon points="320,290 308,328 334,328" fill="white" opacity=".22"/>
      {[[300,48,2,.5],[420,32,1.8,.46],[520,58,2,.48],[590,42,1.5,.46],[360,108,1.5,.44],[480,98,2,.46],[560,138,1.5,.42],[280,168,1.2,.42]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} opacity={op}/>
      ))}
      {[[278,600,55],[368,600,48],[520,600,52],[595,600,42]].map(([x,base,w]:number[],i)=>(
        <g key={`t${i}`} opacity=".13">
          <polygon points={`${x},${Number(base)-62} ${Number(x)-Number(w)/2},${base} ${Number(x)+Number(w)/2},${base}`}/>
          <polygon points={`${x},${Number(base)-95} ${Number(x)-Number(w)*.38},${Number(base)-38} ${Number(x)+Number(w)*.38},${Number(base)-38}`}/>
        </g>
      ))}
    </svg>
  );
  if (themeId === "bunga") return (
    <svg style={{ ...s, opacity: 1 }} viewBox="0 0 600 630" fill={accent}>
      {[[310,60,22,1.2],[500,50,20,1],[390,180,26,1.3],[280,280,22,1.1],[540,220,28,1.2],[350,400,22,1],[480,380,19,.95],[300,530,26,1.2],[540,510,22,1],[420,590,24,1.1],[260,460,17,.92]].map(([cx,cy,sz,sc]:number[],i)=>(
        <g key={i} transform={`translate(${cx},${cy})scale(${sc})`} opacity=".12">
          {[0,72,144,216,288].map((ang,j)=>{const r=ang*Math.PI/180;const px=Math.cos(r)*sz*.52,py=Math.sin(r)*sz*.52;return <ellipse key={j} cx={px} cy={py} rx={sz*.55} ry={sz*.26} transform={`rotate(${ang} ${px} ${py})`}/>;}).filter(Boolean)}
          <circle cx="0" cy="0" r={sz*.2}/>
        </g>
      ))}
      {[[360,130,-28,1.1],[500,150,22,1.2],[290,360,18,.95],[480,340,-22,1.1],[340,550,15,.95]].map(([x,y,rot,sc]:number[],i)=>(
        <g key={`l${i}`} transform={`translate(${x},${y})rotate(${rot})scale(${sc})`} opacity=".11">
          <path d="M0,-22C11,-11 14,2.5 0,25C-14,2.5-11,-11 0,-22Z"/>
        </g>
      ))}
      {[[440,100,4,.2],[300,200,3.5,.18],[560,360,4,.2],[280,460,3.5,.18],[460,500,4,.2]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`d${i}`} cx={x} cy={y} r={r} opacity={op}/>
      ))}
    </svg>
  );

  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<div[^>]*>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

function getPreview(text: string, maxLen = 220): string {
  return (text || "")
    .split("\n")
    .filter(l => !l.startsWith("[IMAGE:") && !l.startsWith("[GALLERY:") && !/^--x?\s|^--x?$/.test(l))
    .map(stripHtml)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export default async function OGImage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  // @ts-ignore
  const note = await prisma.note.findUnique({ where: { shareId } as any });

  const fallback = (
    <div style={{ width: "100%", height: "100%", background: "#FAF6F0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
      <span style={{ color: "#8C7E73", fontSize: 28 }}>Catatanku</span>
    </div>
  );

  if (!note) return new ImageResponse(fallback, size);

  const themeKey = (note as any).theme as string || "";
  const theme = themeKey ? NOTE_THEMES[themeKey] : null;
  const c = theme ?? (NOTE_COLORS[(note as any).color || ""] || NOTE_COLORS[""]);
  const mood = note.mood != null ? MOODS[note.mood] : null;
  const isLocked = (note as any).isLocked;

  const title = isLocked ? "" : decrypt(note.title || "");
  const rawText = isLocked ? "" : decrypt(note.text || "");
  const preview = getPreview(rawText, 200);

  const d = new Date(note.date + "T00:00:00");
  const dateStr = `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: c.bg,
        display: "flex",
        position: "relative",
        fontFamily: "Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Theme SVG decoration (right half) */}
      {themeKey && <ThemeOgSvg themeId={themeKey} accent={c.accent} />}

      {/* Soft right-side tint when no theme */}
      {!themeKey && (
        <div style={{
          position: "absolute", right: 0, top: 0,
          width: 480, height: "100%",
          background: `${c.accent}10`,
          display: "flex",
        }} />
      )}

      {/* Left accent bar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 10, height: "100%", background: c.accent, display: "flex" }} />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: "100%", height: "100%",
          padding: "68px 100px 60px 88px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Date + mood */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 20, color: "#8C7E73", letterSpacing: "0.04em" }}>{dateStr}</span>
            {mood && (
              <>
                <span style={{ color: "#C8BCB4", fontSize: 20 }}>·</span>
                <span style={{ fontSize: 20, color: mood.color }}>{mood.emoji} {mood.label}</span>
              </>
            )}
            {theme && (
              <>
                <span style={{ color: "#C8BCB4", fontSize: 20 }}>·</span>
                <span style={{ fontSize: 20 }}>{theme.label}</span>
              </>
            )}
          </div>

          {isLocked ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <span style={{ fontSize: 60 }}>🔒</span>
              <span style={{ fontSize: 30, color: "#8C7E73" }}>Catatan ini dilindungi kata sandi</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ width: 52, height: 4, borderRadius: 2, background: c.accent, display: "flex" }} />

              {title ? (
                <div style={{
                  fontSize: title.length > 50 ? 46 : title.length > 30 ? 56 : 66,
                  color: "#2E2520",
                  fontWeight: 400,
                  lineHeight: 1.2,
                  maxWidth: 700,
                  display: "flex",
                }}>
                  {title.length > 80 ? title.slice(0, 80) + "…" : title}
                </div>
              ) : (
                <div style={{ fontSize: 36, color: "#8C7E73", fontStyle: "italic", display: "flex" }}>{dateStr}</div>
              )}

              {preview && (
                <div style={{
                  fontSize: 22,
                  color: "#6B6059",
                  lineHeight: 1.75,
                  maxWidth: 640,
                  display: "flex",
                }}>
                  {preview.length >= 200 ? preview.slice(0, 197) + "…" : preview}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.accent, display: "flex" }} />
          <span style={{ fontSize: 22, color: c.accent, letterSpacing: "0.06em" }}>Catatanku</span>
        </div>
      </div>
    </div>,
    size
  );
}
