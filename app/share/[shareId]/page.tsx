import { decrypt } from "@/lib/encryption";
import ShareMusicPlayer from "./ShareMusicPlayer";
import { calcReadingTime } from "@/lib/note-utils";
import { Metadata, Viewport } from "next";
import ShareBlocks from "./ShareBlocks";
import { prisma } from "@/lib/prisma";
import ShareRevokeClient from "./ShareRevokeClient";

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  // @ts-ignore
  const note = await prisma.note.findFirst({ where: { OR: [{ shareId }, { id: shareId, isProfilePinned: true }] } as any });
  if (!note || (note as any).isLocked || (note as any).isModerated) {
    return { title: "Catatanku", description: "Baca catatan di Catatanku." };
  }
  const title = decrypt(note.title || "");
  const rawText = decrypt(note.text || "");
  const description = (rawText || "")
    .split("\n")
    .filter((l: string) => !l.startsWith("[IMAGE:") && !l.startsWith("[GALLERY:") && !/^--x?\s/.test(l))
    .map((l: string) => l.replace(/<br\s*\/?>/gi," ").replace(/<div[^>]*>/gi," ").replace(/<\/div>/gi," ").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const rt = calcReadingTime(rawText);
  const rtText = `${rt} mnt baca`;

  return {
    title: title ? `${title} — ${rtText} — Catatanku` : `Catatanku — ${rtText}`,
    description: description || "Baca catatan di Catatanku.",
    openGraph: {
      title: title ? `${title} — ${rtText}` : `Catatanku — ${rtText}`,
      description: description || "Baca catatan di Catatanku.",
      type: "article",
      siteName: "Catatanku",
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} — ${rtText}` : `Catatanku — ${rtText}`,
      description: description || "Baca catatan di Catatanku.",
    },
  };
}

export async function generateViewport({ params }: { params: Promise<{ shareId: string }> }): Promise<Viewport> {
  const { shareId } = await params;
  // @ts-ignore
  const note = await prisma.note.findFirst({ where: { OR: [{ shareId }, { id: shareId, isProfilePinned: true }] } as any });
  if (!note || (note as any).isLocked || (note as any).isModerated) {
    return { themeColor: "#FAF6F0" };
  }
  const themeKey = (note as any).theme as string || '';
  const theme = themeKey ? NOTE_THEMES[themeKey] : null;
  const c = theme ?? (NOTE_COLORS[(note as any).color || ''] || NOTE_COLORS['']);
  return { themeColor: c.bg };
}

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS_SHORT = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MOODS = [
  { emoji: "☀️", label: "Bahagia", color: "#D4A24E" },
  { emoji: "🍃", label: "Tenang", color: "#7A9E7E" },
  { emoji: "🌧️", label: "Sedih", color: "#7B8FA1" },
  { emoji: "🔥", label: "Marah", color: "#B5705A" },
  { emoji: "🌙", label: "Rindu", color: "#8E7BA8" },
  { emoji: "🌊", label: "Cemas", color: "#6B8E9E" },
];
const NOTE_COLORS: Record<string, { bg: string; accent: string }> = {
  '': { bg: '#FAF6F0', accent: '#C4956A' },
  blush: { bg: '#FEF2F2', accent: '#C27070' },
  sage: { bg: '#F2F7F3', accent: '#6B9E78' },
  sky: { bg: '#F1F5FD', accent: '#5B8DD9' },
  lavender: { bg: '#F5F2FD', accent: '#8B68C6' },
  sand: { bg: '#FBF5E9', accent: '#B5944A' },
};
const NOTE_FONT_MAP: Record<string, string> = {
  '':             "'Lora', serif",
  cormorant:      "'Cormorant Garamond', serif",
  playfair:       "'Playfair Display', serif",
  merriweather:   "'Merriweather', serif",
  garamond:       "'EB Garamond', serif",
  crimson:        "'Crimson Pro', serif",
  nunito:         "'Nunito', sans-serif",
  inter:          "'Inter', sans-serif",
  poppins:        "'Poppins', sans-serif",
  raleway:        "'Raleway', sans-serif",
  dmsans:         "'DM Sans', sans-serif",
};

const NOTE_THEMES: Record<string, { bg: string; accent: string; svg: string; dark?: boolean }> = {
  cinta:     { bg: '#FFF0F5', accent: '#D4607A', svg: 'cinta' },
  alam:      { bg: '#EEFAF3', accent: '#3D8B5C', svg: 'alam' },
  mimpi:     { bg: '#F5F0FF', accent: '#7B5EA7', svg: 'mimpi' },
  langit:    { bg: '#EDF6FF', accent: '#3D7FBF', svg: 'langit' },
  nostalgia: { bg: '#FBF3E8', accent: '#A07035', svg: 'nostalgia' },
  laut:      { bg: '#EDF9F8', accent: '#2E8B8B', svg: 'laut' },
  galaksi:   { bg: '#F1F0F8', accent: '#6558B0', svg: 'galaksi' },
  pagi:      { bg: '#FFFBEE', accent: '#D4853C', svg: 'pagi' },
  salju:     { bg: '#F2F8FC', accent: '#4A8DBF', svg: 'salju' },
  hutan:     { bg: '#EDF4EE', accent: '#2D6B45', svg: 'hutan' },
  gunung:    { bg: '#F5F3ED', accent: '#7A6545', svg: 'gunung' },
  bunga:     { bg: '#FDF4FA', accent: '#C05898', svg: 'bunga' },
  aurora:    { bg: '#0E1C1B', accent: '#4AADA8', svg: 'aurora', dark: true },
  kota_malam: { bg: '#0A0E14', accent: '#F0D090', svg: 'kota_malam', dark: true },
  kucing:    { bg: '#FAF7F4', accent: '#C28B68', svg: 'kucing' },
  notebook:  { bg: '#FFFAEC', accent: '#9B7A38', svg: 'notebook' },
  eid:       { bg: '#F3FBF5', accent: '#2E7D52', svg: 'eid' },
};

function ThemeSvg({ themeId, accent }: { themeId: string; accent: string }) {
  const s = { position:"fixed" as const, top:0, left:0, width:"100%", height:"100%", pointerEvents:"none" as const, zIndex:0, overflow:"hidden" as const };
  if (themeId==='cinta') return (
    <svg style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[30,60,1],[320,40,1.4],[180,150,.7],[50,300,1.1],[360,280,.8],[200,450,1.3],[80,550,.6],[340,500,1],[150,680,.9],[290,730,1.2]].map(([x,y,sc]:number[],i)=>(
        <path key={i} d="M0,-6C0,-10-7,-10-7,-5C-7,0 0,7 0,9C0,7 7,0 7,-5C7,-10 0,-10 0,-6Z" transform={`translate(${x},${y})scale(${sc})`}/>
      ))}
    </svg>
  );
  if (themeId==='alam') return (
    <svg style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[40,80,0,1],[310,55,-30,1.2],[90,250,20,.8],[350,290,10,1.1],[200,430,-20,.9],[65,500,30,1.3],[300,600,-15,.7],[160,720,12,1]].map(([x,y,r,sc]:number[],i)=>(
        <g key={i} transform={`translate(${x},${y})rotate(${r})scale(${sc})`}>
          <path d="M0,-14C8,-7 10,2 0,16C-10,2-8,-7 0,-14Z"/>
          <line x1="0" y1="-2" x2="0" y2="14" stroke={accent} strokeWidth="1.2"/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='mimpi') return (
    <svg style={{...s,opacity:.11}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[50,50,7],[320,75,5],[170,180,9],[75,330,6],[355,260,8],[210,430,5],[95,555,7],[330,510,6],[150,680,8],[280,730,5]].map(([x,y,r]:number[],i)=>(
        <polygon key={i} points={`0,-${r} ${r*.3},-${r*.3} ${r},0 ${r*.3},${r*.3} 0,${r} -${r*.3},${r*.3} -${r},0 -${r*.3},-${r*.3}`} transform={`translate(${x},${y})`}/>
      ))}
    </svg>
  );
  if (themeId==='langit') return (
    <svg style={{...s,opacity:.09}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[55,80,1],[280,120,1.2],[150,280,.8],[330,340,1.1],[80,490,1.3],[240,560,.9],[360,700,1]].map(([x,y,sc]:number[],i)=>(
        <g key={i} transform={`translate(${x},${y})scale(${sc})`}>
          <circle cx="0" cy="0" r="14"/><circle cx="20" cy="-4" r="11"/><circle cx="-20" cy="-4" r="9"/><circle cx="8" cy="-13" r="9"/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='nostalgia') return (
    <svg style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[40,60,10,1],[305,50,-15,1.2],[155,200,5,.8],[335,275,-20,1.1],[85,425,15,.9],[275,450,-10,1.3],[145,605,20,.7],[320,705,-5,1]].map(([x,y,r,sc]:number[],i)=>(
        <path key={i} d="M0,-10L3,-5L8,-7L5,-2L9,2L5,2L6,8L2,5L0,10L-2,5L-6,8L-5,2L-9,2L-5,-2L-8,-7L-3,-5Z" transform={`translate(${x},${y})rotate(${r})scale(${sc})`}/>
      ))}
    </svg>
  );
  if (themeId==='laut') return (
    <svg style={{...s,opacity:.09}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round">
      {[0,70,140,210,280,350,420,490,560,630,700].map((y:number,i:number)=>(
        <path key={i} d={`M-10,${y}C70,${y-22} 130,${y+22} 200,${y}C270,${y-22} 330,${y+22} 410,${y}`}/>
      ))}
    </svg>
  );
  if (themeId==='galaksi') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <ellipse cx="260" cy="210" rx="155" ry="56" transform="rotate(-22 260 210)" stroke={accent} strokeWidth="1.2" opacity=".1"/>
      <ellipse cx="260" cy="210" rx="105" ry="38" transform="rotate(42 260 210)" stroke={accent} strokeWidth=".8" opacity=".08"/>
      <ellipse cx="85" cy="620" rx="120" ry="44" transform="rotate(20 85 620)" stroke={accent} strokeWidth="1" opacity=".09"/>
      <ellipse cx="365" cy="740" rx="80" ry="28" transform="rotate(-12 365 740)" stroke={accent} strokeWidth=".8" opacity=".07"/>
      {[[55,75,1.8,.52],[325,55,1.5,.46],[185,135,1,.43],[78,248,2.2,.46],[358,278,1.5,.48],[198,388,1.8,.46],[38,458,1.5,.5],[305,418,1,.42],[158,528,2,.47],[375,558,1.5,.44],[88,648,1.8,.5],[248,708,1.5,.48],[148,768,1,.42],[28,325,1,.42],[362,400,1.5,.44],[218,485,1,.4],[130,185,1.5,.5],[290,555,1,.4],[342,162,1.2,.43],[102,742,1,.4]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill={accent} opacity={op}/>
      ))}
      {[[205,178,6,.28],[335,500,5,.25],[68,385,4.5,.22],[282,700,5.5,.25],[172,290,4,.2]].map(([x,y,sz,op]:number[],i)=>(
        <path key={`sp${i}`} fill={accent} opacity={op} d={`M${x},${y-sz}L${x+sz*.28},${y-sz*.28}L${x+sz},${y}L${x+sz*.28},${y+sz*.28}L${x},${y+sz}L${x-sz*.28},${y+sz*.28}L${x-sz},${y}L${x-sz*.28},${y-sz*.28}Z`}/>
      ))}
      <circle cx="318" cy="148" r="12" fill={accent} opacity=".13"/>
      <ellipse cx="318" cy="148" rx="24" ry="7.5" stroke={accent} strokeWidth="1.5" opacity=".12"/>
      <circle cx="52" cy="595" r="8" fill={accent} opacity=".11"/>
      <ellipse cx="52" cy="595" rx="17" ry="5.5" stroke={accent} strokeWidth="1.2" opacity=".1"/>
    </svg>
  );
  if (themeId==='pagi') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <circle cx="355" cy="85" r="52" fill={accent} opacity=".08"/>
      <circle cx="355" cy="85" r="38" fill={accent} opacity=".07"/>
      <circle cx="355" cy="85" r="26" fill={accent} opacity=".1"/>
      {Array.from({length:14},(_,i)=>{const a=(i*25.7-10)*Math.PI/180;const r1=62,r2=115;return <line key={i} x1={355+Math.cos(a)*r1} y1={85+Math.sin(a)*r1} x2={355+Math.cos(a)*r2} y2={85+Math.sin(a)*r2} stroke={accent} strokeWidth="1.5" opacity=".12" strokeLinecap="round"/>;}).filter(Boolean)}
      {[[80,185,1],[185,145,1.1],[245,205,.9],[130,305,1],[315,245,.85],[205,365,.9],[62,425,1],[285,385,.9],[152,488,.85],[322,465,1]].map(([x,y,sc]:number[],i)=>(
        <g key={i} transform={`translate(${x},${y})scale(${sc})`} stroke={accent} strokeWidth="1.3" strokeLinecap="round" opacity=".28">
          <path d="M-10,0Q-5,-6 0,-2.5Q5,-6 10,0"/>
        </g>
      ))}
      {[[55,608,3.5,.11],[148,658,4,.09],[245,628,3.5,.11],[348,672,4,.09],[102,725,3,.09],[305,745,3.5,.09]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`b${i}`} cx={x} cy={y} r={r} fill={accent} opacity={op}/>
      ))}
    </svg>
  );
  if (themeId==='salju') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" stroke={accent} strokeLinecap="round" fill="none">
      {[[58,78,17,.13],[332,118,13,.11],[182,242,19,.12],[52,382,15,.11],[322,342,21,.12],[142,525,17,.11],[362,522,14,.1],[82,662,19,.12],[262,682,15,.1],[202,762,17,.11],[380,762,13,.09],[160,152,11,.1],[290,458,12,.09]].map(([cx,cy,sz,op]:number[],i)=>{
        const spokes=[0,60,120,180,240,300];const bLen=sz*.32;
        return (
          <g key={i} opacity={op} transform={`translate(${cx},${cy})`} strokeWidth="1.1">
            {spokes.map((ang,j)=>{const r=ang*Math.PI/180;const cos=Math.cos(r),sin=Math.sin(r);const bx=cos*sz*.46,by=sin*sz*.46;const br1=(ang+60)*Math.PI/180,br2=(ang-60)*Math.PI/180;return(<g key={j}><line x1="0" y1="0" x2={cos*sz} y2={sin*sz}/><line x1={bx} y1={by} x2={bx+Math.cos(br1)*bLen} y2={by+Math.sin(br1)*bLen}/><line x1={bx} y1={by} x2={bx+Math.cos(br2)*bLen} y2={by+Math.sin(br2)*bLen}/></g>);})}
            <circle cx="0" cy="0" r="1.8" fill={accent} stroke="none"/>
          </g>
        );
      })}
      {[[120,168,2.5,.18],[272,205,2,.16],[28,462,2,.16],[252,442,2,.16],[172,605,2.5,.16]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`d${i}`} cx={x} cy={y} r={r} fill={accent} stroke="none" opacity={op}/>
      ))}
    </svg>
  );
  if (themeId==='hutan') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <circle cx="72" cy="88" r="32" opacity=".06"/><circle cx="72" cy="88" r="20" opacity=".05"/><circle cx="72" cy="88" r="11" opacity=".06"/>
      {[[152,38,1.2,.38],[255,25,1,.35],[325,50,1.3,.4],[388,32,1,.35],[32,118,1,.3],[198,65,1.2,.36],[305,145,1,.3],[372,110,1.2,.36]].map(([x,y,r,op]:number[],i)=>(<circle key={`st${i}`} cx={x} cy={y} r={r} opacity={op}/>))}
      {[[35,800,500,58,.05],[110,800,492,48,.05],[190,800,505,60,.05],[268,800,498,52,.05],[342,800,488,46,.05],[398,800,495,50,.05]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`far${i}`} opacity={op}><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${base} ${Number(x)+Number(w)/2},${base}`}/><polygon points={`${x},${Number(bot)+h*.32} ${Number(x)-Number(w)*.44},${Number(bot)+h*.72} ${Number(x)+Number(w)*.44},${Number(bot)+h*.72}`}/></g>);})}
      {[[52,800,445,72,.08],[138,800,438,64,.08],[218,800,448,75,.08],[298,800,440,68,.08],[378,800,435,60,.08]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`mid${i}`} opacity={op}><rect x={Number(x)-Number(w)*.075} y={Number(bot)+h*.82} width={Number(w)*.15} height={h*.2}/><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${Number(bot)+h*.55} ${Number(x)+Number(w)/2},${Number(bot)+h*.55}`}/><polygon points={`${x},${Number(bot)+h*.28} ${Number(x)-Number(w)*.46},${Number(bot)+h*.72} ${Number(x)+Number(w)*.46},${Number(bot)+h*.72}`}/><polygon points={`${x},${Number(bot)+h*.52} ${Number(x)-Number(w)*.38},${Number(bot)+h*.88} ${Number(x)+Number(w)*.38},${Number(bot)+h*.88}`}/></g>);})}
      {[[18,800,375,88,.13],[100,800,362,98,.13],[192,800,378,92,.13],[278,800,368,96,.13],[368,800,372,84,.12]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`fg${i}`} opacity={op}><rect x={Number(x)-Number(w)*.08} y={Number(bot)+h*.8} width={Number(w)*.16} height={h*.22}/><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${Number(bot)+h*.42} ${Number(x)+Number(w)/2},${Number(bot)+h*.42}`}/><polygon points={`${x},${Number(bot)+h*.22} ${Number(x)-Number(w)*.48},${Number(bot)+h*.58} ${Number(x)+Number(w)*.48},${Number(bot)+h*.58}`}/><polygon points={`${x},${Number(bot)+h*.42} ${Number(x)-Number(w)*.42},${Number(bot)+h*.72} ${Number(x)+Number(w)*.42},${Number(bot)+h*.72}`}/><polygon points={`${x},${Number(bot)+h*.6} ${Number(x)-Number(w)*.34},${Number(bot)+h*.85} ${Number(x)+Number(w)*.34},${Number(bot)+h*.85}`}/></g>);})}
      <path d="M-20,758 C80,740 180,752 280,745 C360,738 408,748 430,742 L430,800 L-20,800Z" opacity=".06"/>
      <path d="M-20,778 C90,768 188,775 288,769 C368,764 412,772 430,768 L430,800 L-20,800Z" opacity=".05"/>
      {[[68,622,2.2,.22],[145,645,1.8,.18],[225,628,2,.2],[308,652,1.8,.18],[385,622,1.6,.18],[105,698,1.8,.2],[258,715,2,.2],[342,702,1.6,.18]].map(([x,y,r,op]:number[],i)=>(<circle key={`ff${i}`} cx={x} cy={y} r={r} opacity={op}/>))}
      {[[55,158,-22,1.1],[278,140,14,1.25],[148,265,30,.95],[355,225,-18,1.05],[108,382,22,.9],[282,360,-12,.95]].map(([x,y,rot,sc]:number[],i)=>(<g key={`lf${i}`} transform={`translate(${x},${y})rotate(${rot})scale(${sc})`} opacity=".10"><path d="M0,-18C10,-9 12,2 0,20C-12,2-10,-9 0,-18Z"/><line x1="0" y1="-2" x2="0" y2="18" stroke={accent} strokeWidth="1" fill="none"/></g>))}
    </svg>
  );
  if (themeId==='aurora') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <defs><style>{`
        @keyframes au-tw{0%,100%{opacity:.22}50%{opacity:.72}}
        @keyframes au-tw2{0%,100%{opacity:.10}50%{opacity:.45}}
        @keyframes au-sp{0%,100%{opacity:.18;transform:scale(1)}50%{opacity:.65;transform:scale(1.35)}}
        @keyframes au-b1{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}
        @keyframes au-b2{0%,100%{transform:translateY(0)}50%{transform:translateY(18px)}}
        @keyframes au-b3{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes au-b4{0%,100%{transform:translateY(0)}50%{transform:translateY(20px)}}
        @keyframes au-b5{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes au-shoot{0%,80%,100%{opacity:0;transform:translate(0,0)}82%{opacity:1}90%{opacity:0;transform:translate(62px,31px)}}
        @keyframes au-moon{0%,100%{opacity:.5}50%{opacity:.75}}
        .aus1{animation:au-tw 2.8s ease-in-out infinite}.aus2{animation:au-tw 3.5s ease-in-out infinite .7s}.aus3{animation:au-tw 2.2s ease-in-out infinite 1.2s}.aus4{animation:au-tw 4.1s ease-in-out infinite .4s}.aus5{animation:au-tw 3.0s ease-in-out infinite 1.9s}.aus6{animation:au-tw 2.6s ease-in-out infinite .9s}.aus7{animation:au-tw 3.8s ease-in-out infinite .2s}.aus8{animation:au-tw 2.4s ease-in-out infinite 1.5s}.aus9{animation:au-tw 3.2s ease-in-out infinite .6s}.aus10{animation:au-tw 2.0s ease-in-out infinite 1.8s}.aus11{animation:au-tw 2.9s ease-in-out infinite .3s}.aus12{animation:au-tw 3.6s ease-in-out infinite 1.0s}.aus13{animation:au-tw2 2.7s ease-in-out infinite 1.4s}.aus14{animation:au-tw2 4.0s ease-in-out infinite .5s}.aus15{animation:au-tw2 2.5s ease-in-out infinite 2.2s}.aus16{animation:au-tw 3.1s ease-in-out infinite .8s}.aus17{animation:au-tw2 2.3s ease-in-out infinite 1.6s}.aus18{animation:au-tw 4.5s ease-in-out infinite .1s}.aus19{animation:au-tw2 3.3s ease-in-out infinite 2.0s}.aus20{animation:au-tw 2.1s ease-in-out infinite 1.1s}.aus21{animation:au-tw2 3.7s ease-in-out infinite .6s}.aus22{animation:au-tw 2.6s ease-in-out infinite 1.3s}.aus23{animation:au-tw2 4.3s ease-in-out infinite .2s}.aus24{animation:au-tw 3.4s ease-in-out infinite 1.7s}.aus25{animation:au-tw2 2.8s ease-in-out infinite 2.4s}
        .ausp1{animation:au-sp 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.ausp2{animation:au-sp 4.2s ease-in-out infinite .8s;transform-box:fill-box;transform-origin:center}.ausp3{animation:au-sp 2.9s ease-in-out infinite 1.5s;transform-box:fill-box;transform-origin:center}.ausp4{animation:au-sp 5.0s ease-in-out infinite .3s;transform-box:fill-box;transform-origin:center}.ausp5{animation:au-sp 3.8s ease-in-out infinite 2.1s;transform-box:fill-box;transform-origin:center}.ausp6{animation:au-sp 4.6s ease-in-out infinite 1.0s;transform-box:fill-box;transform-origin:center}.ausp7{animation:au-sp 3.2s ease-in-out infinite 2.8s;transform-box:fill-box;transform-origin:center}.ausp8{animation:au-sp 4.8s ease-in-out infinite .5s;transform-box:fill-box;transform-origin:center}.ausp9{animation:au-sp 3.6s ease-in-out infinite 1.8s;transform-box:fill-box;transform-origin:center}.ausp10{animation:au-sp 5.2s ease-in-out infinite 3.2s;transform-box:fill-box;transform-origin:center}
        .aub1{animation:au-b1 8s ease-in-out infinite}.aub2{animation:au-b2 10s ease-in-out infinite 1.2s}.aub3{animation:au-b3 12s ease-in-out infinite 2.5s}.aub4{animation:au-b4 9s ease-in-out infinite 1.8s}.aub5{animation:au-b5 11s ease-in-out infinite .6s}
        .au-shoot{animation:au-shoot 13s ease-in-out infinite 4s}.au-moon{animation:au-moon 5s ease-in-out infinite}
      `}</style></defs>
      <g className="au-moon"><circle cx="355" cy="52" r="22" fill="#C8E8E5"/><circle cx="364" cy="47" r="17" fill="#0E1C1B"/></g>
      <g className="au-shoot"><line x1="90" y1="65" x2="132" y2="87" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="90" cy="65" r="2" fill="#fff"/></g>
      {([[28,32,1.2,'aus1'],[72,18,1,'aus2'],[145,42,1.4,'aus3'],[188,22,1,'aus4'],[252,38,1.5,'aus5'],[325,15,1,'aus6'],[402,48,1.2,'aus7'],[48,68,1,'aus8'],[122,55,1.2,'aus9'],[175,78,1,'aus10'],[215,58,1.4,'aus11'],[285,70,1,'aus12'],[62,112,1,'aus13'],[298,95,1.2,'aus14'],[152,105,1,'aus15'],[338,82,1.2,'aus16'],[18,155,1,'aus17'],[388,135,1.1,'aus18'],[238,128,1,'aus19'],[102,145,1.2,'aus20'],[312,162,1,'aus21'],[58,178,1,'aus22'],[178,168,1.1,'aus23'],[268,145,1,'aus24'],[378,175,1,'aus25'],[45,380,1.1,'aus1'],[185,425,1,'aus3'],[320,398,1.2,'aus5'],[92,510,1,'aus7'],[248,488,1.3,'aus2'],[368,545,1,'aus4'],[128,582,1.1,'aus6'],[285,618,1,'aus8'],[52,648,1.2,'aus9'],[388,675,1,'aus3'],[165,698,1.1,'aus1'],[302,722,1,'aus5'],[78,752,1.2,'aus7'],[218,768,1,'aus2'],[348,785,1.1,'aus4']] as [number,number,number,string][]).map(([cx,cy,r,cls],i)=>(
        <circle key={`s${i}`} className={cls} cx={cx} cy={cy} r={r} fill="#fff"/>
      ))}
      <path className="ausp1" d="M0,-3.5L.5,-.5 3.5,0 .5,.5 0,3.5 -.5,.5 -3.5,0 -.5,-.5Z" transform="translate(132,28)" fill="#fff"/>
      <path className="ausp2" d="M0,-4.5L.65,-.65 4.5,0 .65,.65 0,4.5 -.65,.65 -4.5,0 -.65,-.65Z" transform="translate(208,45)" fill="#fff"/>
      <path className="ausp3" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(318,35)" fill="#fff"/>
      <path className="ausp4" d="M0,-4L.6,-.6 4,0 .6,.6 0,4 -.6,.6 -4,0 -.6,-.6Z" transform="translate(42,92)" fill="#fff"/>
      <path className="ausp5" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(258,108)" fill="#fff"/>
      <path className="ausp6" d="M0,-3.5L.5,-.5 3.5,0 .5,.5 0,3.5 -.5,.5 -3.5,0 -.5,-.5Z" transform="translate(385,62)" fill="#fff"/>
      <path className="ausp7" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(112,420)" fill="#fff"/>
      <path className="ausp8" d="M0,-3.5L.5,-.5 3.5,0 .5,.5 0,3.5 -.5,.5 -3.5,0 -.5,-.5Z" transform="translate(342,558)" fill="#fff"/>
      <path className="ausp9" d="M0,-4L.6,-.6 4,0 .6,.6 0,4 -.6,.6 -4,0 -.6,-.6Z" transform="translate(68,688)" fill="#fff"/>
      <path className="ausp10" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(278,745)" fill="#fff"/>
      <path className="aub1" d="M-20,88 C60,55 145,118 235,72 C312,32 378,78 430,58 L430,118 C378,138 312,92 235,132 C145,178 60,115 -20,148Z" fill="#7EC8A4" opacity=".28"/>
      <path className="aub2" d="M-20,175 C72,140 165,198 258,150 C338,108 395,152 430,132 L430,188 C395,208 338,164 258,208 C165,256 72,198 -20,233Z" fill="#9B7BD4" opacity=".22"/>
      <path className="aub3" d="M-20,272 C82,238 172,292 265,245 C348,202 398,245 430,228 L430,282 C398,298 348,255 265,298 C172,345 82,292 -20,326Z" fill="#5CB8B2" opacity=".18"/>
      <path className="aub4" d="M-20,375 C92,342 178,394 272,348 C355,305 402,348 430,332 L430,382 C402,398 355,355 272,398 C178,444 92,392 -20,425Z" fill="#A87ED4" opacity=".14"/>
      <path className="aub5" d="M-20,478 C98,445 182,495 278,450 C360,410 405,450 430,435 L430,480 C405,495 360,455 278,498 C182,543 98,493 -20,525Z" fill={accent} opacity=".11"/>
      <path d="M-20,525 C80,512 180,520 280,514 C360,508 405,518 430,512" stroke={accent} strokeWidth="2.5" fill="none" opacity=".18" strokeLinecap="round"/>
      <path d="M-20,540 C80,528 180,535 280,530 C360,524 405,533 430,528" stroke={accent} strokeWidth="1.2" fill="none" opacity=".12" strokeLinecap="round"/>
    </svg>
  );
  if (themeId==='kota_malam') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" fill="none">
      <defs><style>{`
        @keyframes km-tw { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes km-wi { 0%, 100% { opacity: 0.12; } 50% { opacity: 0.35; } }
        @keyframes km-bl { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes km-sh { 0% { transform: translate(-100px, -100px); opacity: 0; } 5% { opacity: 1; } 10% { transform: translate(400px, 400px); opacity: 0; } 100% { opacity: 0; } }
        @keyframes km-cl { from { transform: translateX(-100px); } to { transform: translateX(500px); } }
        @keyframes km-tr { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
        @keyframes km-pl { 0% { transform: translate(-50px, 80px); } 100% { transform: translate(450px, 120px); } }
        @keyframes km-pl-bl { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        .km-s { animation: km-tw var(--d) infinite; }
        .km-w { animation: km-wi var(--d) infinite; }
        .km-b { animation: km-bl 1.2s step-end infinite; }
        .km-shoot { animation: km-sh 14s linear infinite; }
        .km-cloud { animation: km-cl var(--d) linear infinite; }
        .km-traffic { stroke-dasharray: 4 10; animation: km-tr 2s linear infinite; }
        .km-plane { animation: km-pl 45s linear infinite; }
        .km-plane-bl { animation: km-pl-bl 0.8s infinite; }
      `}</style></defs>
      <rect width="400" height="800" fill="url(#km-sky-grad)"/>
      <defs>
        <linearGradient id="km-sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020408"/><stop offset="100%" stopColor="#050912"/>
        </linearGradient>
      </defs>
      {[...Array(80)].map((_, i) => (
        <circle key={i} className="km-s" cx={(i*137)%400} cy={(i*83)%600} r={0.4+(i%3)*0.4} fill={accent} style={{"--d":`${2.5+i%4}s`} as any} opacity={0.2+(i%4)*0.1}/>
      ))}
      <path className="km-shoot" d="M0,0 L40,40" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0"/>
      <g className="km-plane"><circle r="1" fill="#fff" className="km-plane-bl"/><line x1="-4" y1="0" x2="4" y2="0" stroke="#fff" strokeWidth="0.5" opacity=".3"/></g>
      {[[10,150,90],[180,100,110],[320,250,95]].map(([x,y,d],i)=>(
        <g key={i} className="km-cloud" style={{"--d":`${d}s`} as any} opacity=".04" transform={`translate(${x},${y})`}>
          <circle cx="0" cy="0" r="22" fill={accent}/><circle cx="20" cy="-8" r="28" fill={accent}/><circle cx="45" cy="0" r="22" fill={accent}/>
        </g>
      ))}
      <g transform="translate(340, 70)" opacity=".15"><circle r="25" fill={accent}/><circle cx="10" cy="-5" r="22" fill="#05080E"/></g>
      <g opacity=".35" transform="translate(0, 630)"><path d="M0,80 L30,60 L60,85 L90,55 L130,85 L170,45 L210,90 L250,55 L290,85 L340,40 L400,90 V170 H0 Z" fill="#030509"/></g>
      <g transform="translate(0, 560)">
        {/* Apartment 1 */}
        <rect x="0" y="80" width="60" height="160" fill="#030509" opacity=".8"/>
        {[0,1,2,3].map(j=><g key={j} transform={`translate(0, ${j*35})`}>
          <rect x="10" y={100} width="15" height="12" rx="1.5" fill={accent} className="km-w" style={{"--d":"3s"} as any}/>
          <rect x="8" y={112} width="22" height="2" fill="#080C15"/>
          <rect x="8" y={108} width="1" height="4" fill="#080C15"/><rect x="19" y={108} width="1" height="4" fill="#080C15"/><rect x="30" y={108} width="1" height="4" fill="#080C15"/>
        </g>)}
        {/* Apartment 2 */}
        <rect x="68" y="40" width="65" height="200" fill="#04070C" opacity=".8"/>
        {[0,1,2,3,4,5].map(j=><g key={j} transform={`translate(0, ${j*30})`}>
          <rect x="78" y="60" width="12" height="14" rx="2" fill={accent} className="km-w" style={{"--d":"2.5s"} as any}/>
          <rect x="108" y="60" width="12" height="14" rx="2" fill={accent} className="km-w" style={{"--d":"4s"} as any}/>
          {j%2===0 && <rect x="118" y={65} width="8" height="6" fill="#050910"/>}
        </g>)}
        {/* Apartment 3 */}
        <rect x="140" y="100" width="80" height="140" fill="#030509" opacity=".8"/><rect x="180" y="70" width="4" height="30" fill="#030509"/><circle cx="182" cy="65" r="1.5" fill="#f00" className="km-b"/>
        {[0,1,2,3].map(r=><rect key={r} x="150" y={115+r*30} width="60" height="2" fill={accent} opacity=".1"/>)}
        {/* Apartment 4 */}
        <rect x="228" y="60" width="90" height="180" fill="#04070C" opacity=".8"/>
        {[0,1,2,3,4].map(j=><g key={j} transform={`translate(0, ${j*32})`}>
          <rect x="238" y={80} width="70" height="2" fill="#05080C" opacity=".8"/>
          <rect x="245" y={70} width="10" height="10" fill={accent} className="km-w" style={{"--d":"3.5s"} as any}/><rect x="285" y={70} width="10" height="10" fill={accent} className="km-w" style={{"--d":"2.2s"} as any}/>
        </g>)}
        <rect x="325" y="90" width="45" height="150" fill="#020304"/>
        <rect x="375" y="50" width="35" height="190" fill="#030509"/>
      </g>
      <g transform="translate(0, 760)">
        <line x1="0" y1="0" x2="400" y2="0" stroke="#fbbf24" strokeWidth="1.5" className="km-traffic" style={{"--d":"1s"} as any} opacity=".4"/>
        <line x1="0" y1="6" x2="400" y2="6" stroke="#f87171" strokeWidth="1.2" className="km-traffic" style={{"--d":"1.5s"} as any} opacity=".3"/>
      </g>
      <rect x="0" y="720" width="400" height="80" fill="url(#km-glow-sh)"/>
      <defs><linearGradient id="km-glow-sh" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={accent} stopOpacity=".15"/><stop offset="100%" stopColor={accent} stopOpacity="0"/></linearGradient></defs>
    </svg>
  );
  if (themeId==='kucing') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <defs><style>{`
        @keyframes kc-pulse{0%,100%{transform:scale(.85)}50%{transform:scale(1.0)}}
        @keyframes kc-blink{0%,88%,100%{transform:scaleY(1)}93%,97%{transform:scaleY(.08)}}
        @keyframes kc-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes kc-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
        @keyframes kc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .kcp1{animation:kc-pulse 2.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.kcp2{animation:kc-pulse 3.4s ease-in-out infinite .5s;transform-box:fill-box;transform-origin:center}.kcp3{animation:kc-pulse 2.5s ease-in-out infinite 1.1s;transform-box:fill-box;transform-origin:center}.kcp4{animation:kc-pulse 3.8s ease-in-out infinite .3s;transform-box:fill-box;transform-origin:center}.kcp5{animation:kc-pulse 2.2s ease-in-out infinite 1.5s;transform-box:fill-box;transform-origin:center}
        .kceye{animation:kc-blink 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.kceye2{animation:kc-blink 4s ease-in-out infinite .2s;transform-box:fill-box;transform-origin:center}.kceye3{animation:kc-blink 5s ease-in-out infinite 1.5s;transform-box:fill-box;transform-origin:center}.kceye4{animation:kc-blink 5s ease-in-out infinite 1.7s;transform-box:fill-box;transform-origin:center}
        .kcspin{animation:kc-spin 8s linear infinite;transform-box:fill-box;transform-origin:center}.kcspin2{animation:kc-spin 12s linear infinite reverse;transform-box:fill-box;transform-origin:center}
        .kcsway{animation:kc-sway 3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.kcsway2{animation:kc-sway 3.8s ease-in-out infinite .6s;transform-box:fill-box;transform-origin:center}
        .kcfloat1{animation:kc-float 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.kcfloat2{animation:kc-float 4.2s ease-in-out infinite .7s;transform-box:fill-box;transform-origin:center}.kcfloat3{animation:kc-float 2.8s ease-in-out infinite 1.4s;transform-box:fill-box;transform-origin:center}.kcfloat4{animation:kc-float 3.2s ease-in-out infinite .3s;transform-box:fill-box;transform-origin:center}
      `}</style></defs>
      {([[62,82,18,.12],[342,125,-22,.10],[128,228,12,.11],[282,318,-18,.10],[52,428,20,.11],[362,488,-15,.10],[148,568,15,.11],[308,648,-20,.10],[78,728,18,.09],[372,748,-12,.09],[218,162,-10,.10],[198,408,14,.09]] as number[][]).map(([x,y,rot,op],i)=>(
        <g key={`paw${i}`} transform={`translate(${x},${y})rotate(${rot})`} opacity={op} fill={accent}><g className={`kcp${(i%5)+1}`}><ellipse cx="0" cy="6" rx="8" ry="7"/><circle cx="-7.5" cy="-3" r="3.8"/><circle cx="-2.5" cy="-9.2" r="3.8"/><circle cx="2.5" cy="-9.2" r="3.8"/><circle cx="7.5" cy="-3" r="3.8"/></g></g>
      ))}
      <g transform="translate(82,312)" opacity=".10" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round"><circle cx="0" cy="2" r="27"/><polygon points="-18,-22 -10,-40 -2,-22" fill={accent} stroke="none" opacity=".8"/><polygon points="18,-22 10,-40 2,-22" fill={accent} stroke="none" opacity=".8"/><ellipse className="kceye" cx="-8" cy="-1" rx="4" ry="5" fill={accent} stroke="none" opacity=".6"/><ellipse className="kceye2" cx="8" cy="-1" rx="4" ry="5" fill={accent} stroke="none" opacity=".6"/><polygon points="0,8 -3,13 3,13" fill={accent} stroke="none" opacity=".6"/><line x1="-26" y1="7" x2="-14" y2="9"/><line x1="-26" y1="12" x2="-14" y2="12"/><line x1="26" y1="7" x2="14" y2="9"/><line x1="26" y1="12" x2="14" y2="12"/></g>
      <g transform="translate(328,565)" opacity=".09" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round"><circle cx="0" cy="2" r="27"/><polygon points="-18,-22 -10,-40 -2,-22" fill={accent} stroke="none" opacity=".8"/><polygon points="18,-22 10,-40 2,-22" fill={accent} stroke="none" opacity=".8"/><ellipse className="kceye3" cx="-8" cy="-1" rx="4" ry="5" fill={accent} stroke="none" opacity=".6"/><ellipse className="kceye4" cx="8" cy="-1" rx="4" ry="5" fill={accent} stroke="none" opacity=".6"/><polygon points="0,8 -3,13 3,13" fill={accent} stroke="none" opacity=".6"/><line x1="-26" y1="7" x2="-14" y2="9"/><line x1="-26" y1="12" x2="-14" y2="12"/><line x1="26" y1="7" x2="14" y2="9"/><line x1="26" y1="12" x2="14" y2="12"/></g>
      <g transform="translate(252,215)"><g className="kcsway" opacity=".09" fill={accent}><ellipse cx="-8" cy="0" rx="19" ry="9"/><polygon points="11,-10 22,0 11,10"/><line x1="-26" y1="0" x2="11" y2="0" stroke={accent} strokeWidth="1.4" fill="none"/>{([-18,-10,-2,6] as number[]).map(rx=>(<g key={rx}><line x1={rx} y1="0" x2={rx-3} y2="-7" stroke={accent} strokeWidth="1.3" fill="none"/><line x1={rx} y1="0" x2={rx-3} y2="7" stroke={accent} strokeWidth="1.3" fill="none"/></g>))}<circle cx="-23" cy="-4" r="2.8"/></g></g>
      <g transform="translate(142,468) scale(-1,1)"><g className="kcsway2" opacity=".08" fill={accent}><ellipse cx="-8" cy="0" rx="19" ry="9"/><polygon points="11,-10 22,0 11,10"/><line x1="-26" y1="0" x2="11" y2="0" stroke={accent} strokeWidth="1.4" fill="none"/>{([-18,-10,-2,6] as number[]).map(rx=>(<g key={rx}><line x1={rx} y1="0" x2={rx-3} y2="-7" stroke={accent} strokeWidth="1.3" fill="none"/><line x1={rx} y1="0" x2={rx-3} y2="7" stroke={accent} strokeWidth="1.3" fill="none"/></g>))}<circle cx="-23" cy="-4" r="2.8"/></g></g>
      <g transform="translate(318,228)"><g className="kcspin" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity=".09"><circle cx="0" cy="0" r="19"/><path d="M-19,0 C-12,-15 12,-15 19,0 C12,15 -12,15 -19,0"/><path d="M0,-19 C15,-12 15,12 0,19 C-15,12 -15,-12 0,-19"/><path d="M-15,-12 C-2,-5 10,8 15,12"/><path d="M15,-12 C2,-5 -10,8 -15,12"/></g></g>
      <g transform="translate(68,562)"><g className="kcspin2" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity=".08"><circle cx="0" cy="0" r="19"/><path d="M-19,0 C-12,-15 12,-15 19,0 C12,15 -12,15 -19,0"/><path d="M0,-19 C15,-12 15,12 0,19 C-15,12 -15,-12 0,-19"/><path d="M-15,-12 C-2,-5 10,8 15,12"/><path d="M15,-12 C2,-5 -10,8 -15,12"/></g></g>
      <g transform="translate(195,88) scale(.68)"><path className="kcfloat1" d="M0,-5C0,-9-7,-9-7,-4C-7,0 0,7 0,9C0,7 7,0 7,-4C7,-9 0,-9 0,-5Z" fill={accent} opacity=".12"/></g>
      <g transform="translate(358,368) scale(.58)"><path className="kcfloat2" d="M0,-5C0,-9-7,-9-7,-4C-7,0 0,7 0,9C0,7 7,0 7,-4C7,-9 0,-9 0,-5Z" fill={accent} opacity=".10"/></g>
      <g transform="translate(38,255) scale(.62)"><path className="kcfloat3" d="M0,-5C0,-9-7,-9-7,-4C-7,0 0,7 0,9C0,7 7,0 7,-4C7,-9 0,-9 0,-5Z" fill={accent} opacity=".10"/></g>
      <g transform="translate(290,728) scale(.55)"><path className="kcfloat4" d="M0,-5C0,-9-7,-9-7,-4C-7,0 0,7 0,9C0,7 7,0 7,-4C7,-9 0,-9 0,-5Z" fill={accent} opacity=".09"/></g>
    </svg>
  );
  if (themeId==='gunung') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <polygon points="-10,590 55,405 115,458 178,358 248,435 318,375 398,498 415,590" opacity=".07"/>
      <polygon points="-10,655 42,528 98,572 158,465 218,502 278,422 340,482 398,558 415,655" opacity=".09"/>
      <polygon points="-10,725 48,608 92,645 152,545 212,592 260,515 302,562 368,618 415,682 415,725" opacity=".11"/>
      <polygon points="178,358 165,392 195,392" fill="white" opacity=".3"/>
      <polygon points="248,435 238,465 260,465" fill="white" opacity=".25"/>
      <polygon points="55,405 43,440 70,440" fill="white" opacity=".22"/>
      {[[52,62,1.8,.5],[162,42,2,.46],[282,72,1.5,.48],[372,52,2,.46],[102,132,1.5,.43],[242,112,2,.46],[332,152,1.5,.41],[32,202,1,.39],[382,202,1.5,.41]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} opacity={op}/>
      ))}
      {[[28,725,48],[118,725,40],[318,725,45],[382,725,36]].map(([x,base,w]:number[],i)=>(
        <g key={`t${i}`} opacity=".13">
          <polygon points={`${x},${Number(base)-52} ${Number(x)-Number(w)/2},${base} ${Number(x)+Number(w)/2},${base}`}/>
          <polygon points={`${x},${Number(base)-80} ${Number(x)-Number(w)*.38},${Number(base)-32} ${Number(x)+Number(w)*.38},${Number(base)-32}`}/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='bunga') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[52,82,18,1.2],[322,62,16,1],[182,205,20,1.3],[72,355,17,1.1],[342,305,22,1.2],[162,508,18,1],[292,485,15,.95],[82,648,20,1.2],[352,628,17,1],[212,725,18,1.1],[32,505,13,.92]].map(([cx,cy,sz,sc]:number[],i)=>(
        <g key={i} transform={`translate(${cx},${cy})scale(${sc})`} opacity=".12">
          {[0,72,144,216,288].map((ang,j)=>{const r=ang*Math.PI/180;const px=Math.cos(r)*sz*.52,py=Math.sin(r)*sz*.52;return <ellipse key={j} cx={px} cy={py} rx={sz*.55} ry={sz*.26} transform={`rotate(${ang} ${px} ${py})`}/>;}).filter(Boolean)}
          <circle cx="0" cy="0" r={sz*.2}/>
        </g>
      ))}
      {[[118,145,-28,.9],[258,165,22,1.1],[82,445,17,.88],[312,425,-22,1],[152,645,12,.9]].map(([x,y,rot,sc]:number[],i)=>(
        <g key={`l${i}`} transform={`translate(${x},${y})rotate(${rot})scale(${sc})`} opacity=".11">
          <path d="M0,-18C9,-9 11,2 0,20C-11,2-9,-9 0,-18Z"/>
        </g>
      ))}
      {[[198,125,3,.2],[102,265,2.5,.18],[362,455,3,.2],[62,578,2.5,.18],[282,585,3,.2],[172,762,2.5,.18]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`d${i}`} cx={x} cy={y} r={r} opacity={op}/>
      ))}
    </svg>
  );
  if (themeId==='notebook') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:27},(_,i)=>(
        <line key={`rl${i}`} x1="0" y1={56+i*28} x2="400" y2={56+i*28} stroke="#C8A96A" strokeWidth={i===0?"1.5":".8"} opacity={i===0?".22":".13"}/>
      ))}
      <line x1="58" y1="0" x2="58" y2="800" stroke="#E87070" strokeWidth="1.2" opacity=".18"/>
      {([120,400,680] as number[]).map(y=>(
        <circle key={y} cx="22" cy={y} r="9" fill="none" stroke="#C5A97A" strokeWidth="1.5" opacity=".22"/>
      ))}
      {([[95,125],[340,85],[178,280],[82,445],[318,365],[145,608],[298,528],[85,728],[355,680]] as number[][]).map(([x,y],i)=>(
        <g key={`nbs${i}`} transform={`translate(${x},${y})`} opacity=".13" fill={accent}><path d="M0,-5.5L.8,-.8 5.5,0 .8,.8 0,5.5 -.8,.8 -5.5,0 -.8,-.8Z"/></g>
      ))}
      {([[128,198],[362,318],[72,568],[285,728]] as number[][]).map(([x,y],i)=>(
        <g key={`nbh${i}`} transform={`translate(${x},${y})`}><path d="M0,-4C0,-7-5,-7-5,-3C-5,0 0,5 0,7C0,5 5,0 5,-3C5,-7 0,-7 0,-4Z" fill={accent} opacity=".12"/></g>
      ))}
      {([[245,158],[105,388],[348,488]] as number[][]).map(([x,y],i)=>(
        <g key={`nba${i}`} transform={`translate(${x},${y})`} opacity=".11" stroke={accent} strokeWidth="1.5" strokeLinecap="round" fill="none"><line x1="-10" y1="0" x2="8" y2="0"/><polyline points="2,-4 8,0 2,4"/></g>
      ))}
      {([[195,345],[332,628]] as number[][]).map(([x,y],i)=>(
        <g key={`nbc${i}`} transform={`translate(${x},${y})`} opacity=".11" stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none"><polyline points="-5,0 -1,5 7,-5"/></g>
      ))}
      <g transform="translate(225,505)" fill="none" stroke={accent} strokeWidth="1.3" strokeLinecap="round" opacity=".11"><path d="M0,-13C7,-13 13,-7 13,0C13,8 6,14 0,14C-8,14 -15,7 -15,0C-15,-9 -8,-17 0,-17"/><circle cx="0" cy="0" r="5"/></g>
    </svg>
  );
  if (themeId==='eid') return (
    <svg style={{ position:"absolute" as const, top:0, left:0, width:"100%", height:"100%", pointerEvents:"none" as const, zIndex:0, overflow:"hidden" as const, opacity:1 }} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <style>{`@keyframes eid-tw{0%,100%{opacity:.05}50%{opacity:.22}}@keyframes eid-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}@keyframes eid-glow{0%,100%{opacity:.25}50%{opacity:.7}}@keyframes eid-bulb{0%,100%{opacity:.32}50%{opacity:.85}}`}</style>
        <filter id="eid-sf" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>
        <pattern id="eid-kpat" patternUnits="userSpaceOnUse" width="6" height="6"><line x1="0" y1="0" x2="6" y2="6" stroke={accent} strokeWidth=".55" opacity=".8"/><line x1="6" y1="0" x2="0" y2="6" stroke={accent} strokeWidth=".55" opacity=".8"/></pattern>
      </defs>
      {/* Crescent moon */}
      <g transform="translate(352,145)" opacity=".2"><circle r="30" fill={accent}/><circle cx="10" cy="-7" r="26" fill="#F3FBF5"/></g>
      {/* Twinkling 6-point stars */}
      {([[40,135,4.5],[115,118,3.5],[200,145,5.5],[52,215,3.5],[162,200,4.5],[325,185,3],[88,318,4],[252,288,5],[378,278,3.5],[28,480,4],[172,448,3.5],[342,418,4],[78,638,3.5],[222,598,4.5],[362,578,3],[138,728,3.5],[302,718,5]] as number[][]).map(([cx,cy,R]:number[],i:number)=>{
        const pts=Array.from({length:12},(_:unknown,j:number)=>{const a=(j*30-90)*Math.PI/180;const rr=j%2===0?R:R*.42;return`${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`;}).join(' ');
        return <polygon key={`es${i}`} points={pts} fill={accent} style={{animation:`eid-tw ${2.5+i*.32}s ease-in-out ${i*.17}s infinite`}} opacity=".16"/>;
      })}
      {/* String lights row 1 */}
      <path d="M-2,112 Q40,137 80,122 Q120,107 160,134 Q200,160 240,140 Q280,120 320,144 Q360,167 402,150" stroke={accent} strokeWidth="1" opacity=".22" fill="none"/>
      {([[0,117,'#C94B20'],[40,132,accent],[80,124,'#D4920A'],[120,114,'#C94B20'],[160,137,accent],[200,157,'#D4920A'],[240,140,'#C94B20'],[280,122,accent],[320,144,'#D4920A'],[360,164,'#C94B20'],[400,150,accent]] as [number,number,string][]).map(([bx,by,bc],i:number)=>(
        <g key={`b1${i}`}><ellipse cx={bx} cy={by+7} rx="3" ry="4.5" fill={bc} style={{animation:`eid-bulb ${1.6+i*.4}s ease-in-out ${i*.22}s infinite`}} opacity=".62"/><ellipse cx={bx} cy={by+7} rx="5.5" ry="7" fill={bc} filter="url(#eid-sf)" opacity=".18" style={{animation:`eid-bulb ${1.6+i*.4}s ease-in-out ${i*.22}s infinite`}}/></g>
      ))}
      {/* String lights row 2 */}
      <path d="M-2,240 Q40,265 80,250 Q120,233 160,260 Q200,287 240,267 Q280,247 320,271 Q360,295 402,277" stroke={accent} strokeWidth="1" opacity=".2" fill="none"/>
      {([[0,245,accent],[40,263,'#D4920A'],[80,252,'#C94B20'],[120,237,accent],[160,263,'#D4920A'],[200,283,'#C94B20'],[240,267,accent],[280,247,'#D4920A'],[320,271,'#C94B20'],[360,293,accent],[400,277,'#D4920A']] as [number,number,string][]).map(([bx,by,bc],i:number)=>(
        <g key={`b2${i}`}><ellipse cx={bx} cy={by+7} rx="3" ry="4.5" fill={bc} style={{animation:`eid-bulb ${1.8+i*.38}s ease-in-out ${i*.28+.5}s infinite`}} opacity=".55"/><ellipse cx={bx} cy={by+7} rx="5.5" ry="7" fill={bc} filter="url(#eid-sf)" opacity=".16" style={{animation:`eid-bulb ${1.8+i*.38}s ease-in-out ${i*.28+.5}s infinite`}}/></g>
      ))}
      {/* Swaying lanterns */}
      {([[80,120,13,38,'4s',0],[200,108,11,32,'5.5s',1],[330,125,12,36,'3.8s',-1],[55,348,10,28,'4.5s',2],[295,335,11,30,'5s',-2]] as [number,number,number,number,string,number][]).map(([cx,cy,hw,h,dur,di]:any,i:number)=>{
        const lc:string=['#C94B20','#D4920A',accent][i%3];
        const del=`${Math.abs(di)*.55}s`;
        const by=22+h/2;
        return (
          <g key={`el${i}`} transform={`translate(${cx},${cy})`}>
            <g style={{transformBox:'fill-box',transformOrigin:'50% 0%',animation:`eid-sway ${dur} ease-in-out ${del} infinite`} as any}>
              <line x1="0" y1="0" x2="0" y2="18" stroke={lc} strokeWidth="1" opacity=".28"/>
              <rect x={-hw*.8} y={18} width={hw*1.6} height="5" rx="2" fill={lc} opacity=".22"/>
              <rect x={-hw} y={22} width={hw*2} height={h} rx={hw*.35} fill={lc} opacity=".13"/>
              <rect x={-hw} y={22} width={hw*2} height={h} rx={hw*.35} stroke={lc} strokeWidth="1.2" fill="none" opacity=".22"/>
              <ellipse cx="0" cy={by} rx={hw*.55} ry={h*.3} fill={lc} filter="url(#eid-sf)" style={{animation:`eid-glow ${dur} ease-in-out ${del} infinite`} as any} opacity=".28"/>
              <line x1={-hw*.9} y1={22+h/3} x2={hw*.9} y2={22+h/3} stroke={lc} strokeWidth=".7" opacity=".22"/>
              <line x1={-hw*.9} y1={22+h*2/3} x2={hw*.9} y2={22+h*2/3} stroke={lc} strokeWidth=".7" opacity=".22"/>
              <rect x={-hw*.8} y={22+h} width={hw*1.6} height="4" rx="2" fill={lc} opacity=".2"/>
              {Array.from({length:7},(_:unknown,k:number)=>{const fx=-hw*.75+k*(hw*1.5/6);return <line key={k} x1={fx} y1={22+h+4} x2={fx+(k%2===0?1:-1)} y2={22+h+14} stroke={lc} strokeWidth=".9" opacity=".22"/>;})}</g></g>
        );
      })}
      {/* Ketupat */}
      {([[38,310,18],[375,280,15],[108,535,16],[345,510,14],[192,705,15]] as number[][]).map(([cx,cy,r]:number[],i:number)=>{
        const d=`${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}`;
        return (<g key={`ktp${i}`}><polygon points={d} fill="url(#eid-kpat)" opacity=".18"/><polygon points={d} fill={accent} opacity=".05"/><polygon points={d} stroke={accent} strokeWidth="1" fill="none" opacity=".18"/></g>);
      })}
      {/* Mosque silhouette */}
      <g transform="translate(0,622)" opacity=".07" fill={accent}>
        <rect x="75" y="68" width="250" height="130" rx="2"/>
        <ellipse cx="200" cy="68" rx="58" ry="38"/><ellipse cx="118" cy="85" rx="33" ry="21"/><ellipse cx="282" cy="85" rx="33" ry="21"/>
        <rect x="38" y="22" width="22" height="148" rx="3"/><ellipse cx="49" cy="22" rx="11" ry="7"/><line x1="49" y1="8" x2="49" y2="22" stroke={accent} strokeWidth="2.5"/>
        <rect x="340" y="22" width="22" height="148" rx="3"/><ellipse cx="351" cy="22" rx="11" ry="7"/><line x1="351" y1="8" x2="351" y2="22" stroke={accent} strokeWidth="2.5"/>
        <rect x="95" y="98" width="15" height="22" rx="7.5"/><rect x="125" y="98" width="15" height="22" rx="7.5"/>
        <rect x="188" y="90" width="24" height="28" rx="12"/><rect x="260" y="98" width="15" height="22" rx="7.5"/><rect x="290" y="98" width="15" height="22" rx="7.5"/>
      </g>
      {/* Sparkles */}
      {([[155,105],[300,135],[30,380],[375,368],[198,405],[62,698],[348,692]] as number[][]).map(([cx,cy]:number[],i:number)=>(
        <g key={`sp${i}`} transform={`translate(${cx},${cy})`} style={{animation:`eid-tw ${3+i*.45}s ease-in-out ${i*.38}s infinite`} as any} opacity=".15">
          <line x1="0" y1="-5" x2="0" y2="5" stroke={accent} strokeWidth=".9"/>
          <line x1="-5" y1="0" x2="5" y2="0" stroke={accent} strokeWidth=".9"/>
          <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke={accent} strokeWidth=".6"/>
          <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke={accent} strokeWidth=".6"/>
        </g>
      ))}
    </svg>
  );
  return null;
}

function fullD(s: string) {
  const d = new Date(s + "T00:00:00");
  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAF6F0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Lora',serif", position: "relative", overflow: "hidden", padding: "40px 24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Lora:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes nfFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes nfFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes nfPulse{0%,100%{opacity:.35}50%{opacity:.6}}
        .nf-blob1{position:absolute;top:10%;right:12%;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,#EDD5BB44,transparent 70%);animation:nfPulse 5s ease infinite;pointer-events:none}
        .nf-blob2{position:absolute;bottom:12%;left:10%;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,#D9C4B033,transparent 70%);animation:nfPulse 5s ease 2s infinite;pointer-events:none}
        .nf-icon{animation:nfFloat 3.8s ease-in-out infinite}
        .nf-a1{animation:nfFadeUp .8s cubic-bezier(.16,1,.3,1) .05s both}
        .nf-a2{animation:nfFadeUp .8s cubic-bezier(.16,1,.3,1) .18s both}
        .nf-a3{animation:nfFadeUp .8s cubic-bezier(.16,1,.3,1) .3s both}
        .nf-a4{animation:nfFadeUp .8s cubic-bezier(.16,1,.3,1) .42s both}
        .nf-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:#C4956A;color:#fff;border:none;border-radius:12px;font-family:'Lora',serif;font-size:.9rem;cursor:pointer;text-decoration:none;transition:all .2s;font-weight:500;letter-spacing:.01em}
        .nf-btn-primary:hover{background:#B5835A;transform:translateY(-1px);box-shadow:0 6px 20px rgba(196,149,106,.35)}
        .nf-btn-secondary{display:inline-flex;align-items:center;gap:7px;padding:11px 24px;background:transparent;color:#8C7E73;border:1px solid #EDE7DF;border-radius:12px;font-family:'Lora',serif;font-size:.9rem;cursor:pointer;text-decoration:none;transition:all .2s}
        .nf-btn-secondary:hover{border-color:#C4956A;color:#C4956A;background:#FBF7F2}
      `}</style>

      {/* Ambient blobs */}
      <div className="nf-blob1"/>
      <div className="nf-blob2"/>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 480 }}>

        {/* Floating broken-link icon */}
        <div className="nf-icon" style={{ marginBottom: 36 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C4956A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .75 }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="9" y1="15" x2="15" y2="15" strokeDasharray="2 2"/>
            <line x1="9" y1="11" x2="13" y2="11" strokeDasharray="2 2"/>
            <circle cx="18" cy="18" r="4" fill="#FAF6F0" stroke="#EDE7DF" strokeWidth="1.5"/>
            <line x1="16.5" y1="18" x2="19.5" y2="18" stroke="#BEB3A8" strokeWidth="1.5"/>
            <line x1="18" y1="16.5" x2="18" y2="19.5" stroke="#BEB3A8" strokeWidth="1.5"/>
            <line x1="16.8" y1="16.8" x2="19.2" y2="19.2" stroke="#C27054" strokeWidth="1.5"/>
            <line x1="19.2" y1="16.8" x2="16.8" y2="19.2" stroke="#C27054" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Wordmark */}
        <p className="nf-a1" style={{ fontFamily: "'Lora',serif", fontSize: ".72rem", color: "#C4956A", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, marginBottom: 16 }}>Catatanku</p>

        {/* Heading */}
        <h1 className="nf-a2" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.9rem,5vw,2.6rem)", fontWeight: 300, color: "#2E2520", lineHeight: 1.2, marginBottom: 14 }}>
          Catatan Tidak Ditemukan
        </h1>

        {/* Divider */}
        <div className="nf-a2" style={{ width: 36, height: 2, borderRadius: 1, background: "#EDE7DF", marginBottom: 18 }}/>

        {/* Subtitle */}
        <p className="nf-a3" style={{ fontFamily: "'Lora',serif", fontSize: ".92rem", color: "#8C7E73", lineHeight: 1.75, marginBottom: 36 }}>
          Tautan ini tidak valid, kadaluarsa,<br/>atau catatan telah dihapus oleh penulisnya.
        </p>

        {/* CTAs */}
        <div className="nf-a4" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/" className="nf-btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10"/></svg>
            Buat Catatanmu
          </a>
          <a href="javascript:history.back()" className="nf-btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Kembali
          </a>
        </div>

        {/* Footer note */}
        <p className="nf-a4" style={{ fontFamily: "'Lora',serif", fontSize: ".72rem", color: "#C4B8B0", marginTop: 48, letterSpacing: ".03em" }}>
          Ruang ceritamu ada di sini.
        </p>
      </div>
    </div>
  );
}

function LockedPage({ bg, accent, themeKey, theme }: { bg: string; accent: string; themeKey: string; theme: any }) {
  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Lora',serif", position: "relative", overflow: "hidden", padding: "40px 24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Lora:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes lkFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes lkFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .lk-icon{animation:lkFloat 3.5s ease-in-out infinite}
        .lk-a1{animation:lkFadeUp .7s cubic-bezier(.16,1,.3,1) .05s both}
        .lk-a2{animation:lkFadeUp .7s cubic-bezier(.16,1,.3,1) .18s both}
        .lk-a3{animation:lkFadeUp .7s cubic-bezier(.16,1,.3,1) .3s both}
        .lk-btn{display:inline-flex;align-items:center;gap:7px;padding:11px 24px;color:#8C7E73;border:1px solid rgba(0,0,0,0.1);border-radius:12px;font-family:'Lora',serif;font-size:.88rem;cursor:pointer;text-decoration:none;transition:all .2s;background:rgba(255,255,255,.5)}
        .lk-btn:hover{border-color:${accent};color:${accent};background:rgba(255,255,255,.8)}
      `}</style>
      {themeKey && <ThemeSvg themeId={themeKey} accent={accent}/>}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: 400 }}>
        <div className="lk-icon" style={{ marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(255,255,255,.7)", border: "1px solid rgba(0,0,0,.07)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(0,0,0,.06)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
        </div>
        <p className="lk-a1" style={{ fontFamily: "'Lora',serif", fontSize: ".7rem", color: accent, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>Catatanku</p>
        <h1 className="lk-a1" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.7rem,4vw,2.2rem)", fontWeight: 300, color: "#2E2520", lineHeight: 1.25, marginBottom: 12 }}>Catatan Terkunci</h1>
        <div className="lk-a1" style={{ width: 32, height: 2, borderRadius: 1, background: accent, opacity: .35, marginBottom: 16 }}/>
        <p className="lk-a2" style={{ fontSize: ".9rem", color: "#8C7E73", lineHeight: 1.7, marginBottom: 32 }}>Catatan ini dilindungi kata sandi<br/>dan tidak dapat dibagikan secara publik.</p>
        <a href="javascript:history.back()" className="lk-btn lk-a3">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Kembali
        </a>
      </div>
    </div>
  );
}

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  // @ts-ignore
  const note = await prisma.note.findFirst({ where: { OR: [{ shareId }, { id: shareId, isProfilePinned: true }] } as any });
  if (!note || (note as any).isModerated) return <NotFoundPage />;

  const themeKey = (note as any).theme as string || '';
  const theme = themeKey ? NOTE_THEMES[themeKey] : null;
  const c = theme ?? (NOTE_COLORS[(note as any).color || ''] || NOTE_COLORS['']);
  const isDark = !!(theme?.dark);
  const mood = note.mood != null ? MOODS[note.mood] : null;

  // Resolve linked notes (Zettelkasten) for the public view
  const otherShared = await (prisma.note.findMany as any)({
    where: {
      userId: note.userId,
      shareId: { not: null },
      isLocked: false,
      isModerated: false,
    },
    select: { title: true, shareId: true }
  });

  const titleMap: Record<string, string> = {};
  otherShared.forEach((n: any) => {
    const decTitle = decrypt(n.title || "").toLowerCase().trim();
    if (n.shareId && decTitle) {
      titleMap[decTitle] = n.shareId;
    }
  });

  if ((note as any).isLocked) {
    return <LockedPage bg={c.bg} accent={c.accent} themeKey={themeKey} theme={theme} />;
  }

  const title = decrypt(note.title || '');
  const text = decrypt(note.text || '');
  const fontFamily = NOTE_FONT_MAP[(note as any).font || ''] || "'Lora', serif";

  const VALID_S = new Set(['sm','md','lg','full']);
  const VALID_A = new Set(['left','center','right']);

  type SBlock =
    | { type: 'text'; content: string }
    | { type: 'todo'; content: string; done: boolean }
    | { type: 'image'; url: string; size?: string; align?: string }
    | { type: 'gallery'; cols: number; urls: string[] }
    | { type: 'link'; url: string; title?: string; description?: string; image?: string; favicon?: string }
    | { type: 'table'; rows: string[][] };

  const decCell = (s: string) => s.replace(/\{\{P\}\}/g, '|').replace(/\{\{N\}\}/g, '\n');

  const pre = text
    .replace(/<div[^>]*>(\[(?:IMAGE|GALLERY):[^\]]+\])<\/div>/gi, '\n$1\n')
    .replace(/([^\n])(\[(?:IMAGE|GALLERY):[^\]]+\])/g, '$1\n$2')
    .replace(/(\[(?:IMAGE|GALLERY):[^\]]+\])(?=[^\n])/g, '$1\n');
  const blocks: SBlock[] = [];
  let buf: string[] = [];
  for (const line of pre.split('\n')) {
    if (line.startsWith('[IMAGE:') && line.endsWith(']')) {
      if (buf.length) { blocks.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const parts = line.slice(7, -1).split('|');
      let align: string|undefined; let size: string|undefined;
      if (parts.length > 1 && VALID_A.has(parts[parts.length-1])) align = parts.pop();
      if (parts.length > 1 && VALID_S.has(parts[parts.length-1])) size = parts.pop();
      blocks.push({ type: 'image', url: parts.join('|'), size, align });
    } else if (line.startsWith('[GALLERY:') && line.endsWith(']')) {
      if (buf.length) { blocks.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const inner = line.slice(9, -1).split('|');
      blocks.push({ type: 'gallery', cols: parseInt(inner[0]) === 3 ? 3 : 2, urls: inner.slice(1) });
    } else if (line.startsWith('[LINK:') && line.endsWith(']')) {
      if (buf.length) { blocks.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const parts = line.slice(6, -1).split('|');
      blocks.push({ type: 'link', url: parts[0]||'', title: decCell(parts[1]||''), description: decCell(parts[2]||''), image: decCell(parts[3]||''), favicon: decCell(parts[4]||'') });
    } else if (line.startsWith('[TABLE:') && line.endsWith(']')) {
      if (buf.length) { blocks.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const inner = line.slice(7, -1);
      const pipeIdx = inner.indexOf('|');
      const dim = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
      const [rStr, cStr] = dim.split('x');
      const rows = Math.max(1, parseInt(rStr)||1), cols = Math.max(1, parseInt(cStr)||1);
      const cells = pipeIdx === -1 ? [] : inner.slice(pipeIdx + 1).split('|').map(decCell);
      const tableRows: string[][] = [];
      for (let r = 0; r < rows; r++) tableRows.push(Array.from({ length: cols }, (_, c) => cells[r * cols + c] ?? ''));
      blocks.push({ type: 'table', rows: tableRows });
    } else if (/^--x?\s/.test(line) || line === '--' || line === '--x') {
      if (buf.length) { blocks.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      blocks.push({ type: 'todo', done: line.startsWith('--x'), content: line.replace(/^--x?\s?/, '') });
    } else {
      buf.push(line);
    }
  }
  if (buf.length) blocks.push({ type: 'text', content: buf.join('\n') });

  return (
    <div style={{ minHeight: "100vh", background: c.bg, position: "relative", color: themeKey==='kota_malam' ? '#FFFFFF' : isDark ? "rgba(228,248,246,.92)" : undefined }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Lora:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Merriweather:ital,wght@0,300;0,400;1,300;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=Nunito:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500&family=Poppins:ital,wght@0,400;0,500;1,400&family=Raleway:ital,wght@0,400;0,500;1,400&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* ── Layout ── */
        .sp-layout{
          display:grid;
          grid-template-columns:220px 1fr;
          min-height:100vh;
          position:relative;
          z-index:1;
        }

        /* ── Aside ── */
        .sp-aside{
          border-right:1px solid rgba(0,0,0,.07);
          background:rgba(255,255,255,.22);
        }
        .sp-aside-inner{
          position:sticky;
          top:0;
          height:100vh;
          padding:40px 24px 36px 28px;
          display:flex;
          flex-direction:column;
        }
        .sp-brand{
          font-family:'Cormorant Garamond',serif;
          font-size:1.15rem;
          font-weight:300;
          color:${c.accent};
          letter-spacing:.07em;
          margin-bottom:14px;
        }
        .sp-aside-bar{
          width:20px;height:2px;border-radius:1px;
          background:${c.accent};opacity:.45;
          margin-bottom:22px;
        }
        .sp-aside-date{
          font-family:'Lora',serif;
          font-size:.78rem;
          color:#6B6056;
          line-height:1.55;
          display:block;
          margin-bottom:10px;
          letter-spacing:.01em;
        }
        .sp-mood{
          display:inline-flex;align-items:center;gap:6px;
          padding:4px 11px;border-radius:20px;
          background:rgba(0,0,0,.055);
          font-family:'Lora',serif;font-size:.75rem;color:#5A5048;
          width:fit-content;
        }
        .sp-spacer{flex:1}
        .sp-tagline{
          font-family:'Cormorant Garamond',serif;
          font-style:italic;
          font-size:.92rem;
          color:${c.accent};
          opacity:.55;
          line-height:1.6;
          margin-bottom:18px;
        }
        .sp-cta{
          display:inline-flex;align-items:center;gap:6px;
          font-family:'Lora',serif;font-size:.75rem;
          color:${c.accent};text-decoration:none;
          opacity:.7;transition:opacity .2s;
          letter-spacing:.01em;
        }
        .sp-cta:hover{opacity:1}
        .sp-aside-footer{
          padding:24px 24px 40px 28px;
        }

        /* ── Main ── */
        .sp-main{
          min-width:0;
        }
        .sp-main-inner{
          max-width:680px;
          margin:0 auto;
          padding:48px 40px 80px;
        }
        .sp-accent-bar{
          width:28px;height:2px;border-radius:1px;
          background:${c.accent};opacity:.5;margin-bottom:20px;
        }
        .sp-title{
          font-family:${fontFamily};
          font-size:clamp(1.7rem,2.8vw,2.4rem);
          font-weight:400;
          color:#1C1814;
          line-height:1.22;
          letter-spacing:-.01em;
          margin-bottom:28px;
        }

        /* ── Mobile footer (hidden desktop) ── */
        .sp-footer-mob{
          display:none;
          margin-top:56px;padding-top:20px;
          border-top:1px solid rgba(0,0,0,.08);
          align-items:center;gap:8px;
        }

        /* ── Animations ── */
        @keyframes spFade{
          from{opacity:0}
          to{opacity:1}
        }
        .sp-a{animation:spFade .65s cubic-bezier(.16,1,.3,1) both}
        .sp-a1{animation-delay:.04s}
        .sp-a2{animation-delay:.14s}
        .sp-a3{animation-delay:.24s}
        .sp-a4{animation-delay:.34s}

        /* ── Mobile ── */
        @media(max-width:768px){
          .sp-layout{
            display:block;
          }
          .sp-aside{
            border-right:none;
            border-bottom:none;
            background:transparent;
          }
          .sp-aside-inner{
            position:relative;
            height:auto;
            padding:28px 20px 20px;
            flex-direction:row;
            align-items:center;
            flex-wrap:wrap;
            gap:0;
          }
          .sp-aside-bar{display:none}
          .sp-spacer{display:none}
          .sp-tagline{display:none}
          .sp-brand{
            font-size:1rem;
            margin-bottom:0;
            margin-right:12px;
          }
          .sp-aside-date{
            margin-bottom:0;
            margin-right:10px;
            font-size:.75rem;
          }
          .sp-aside-top-sep{
            display:block;
            width:100%;
            height:1px;
            background:rgba(0,0,0,.07);
            margin-top:14px;
          }
          .sp-cta{display:none}
          .sp-aside-footer{display:none}
          .sp-main-inner{padding:24px 20px 56px}
          .sp-footer-mob{display:flex}
          .sp-title{font-size:clamp(1.45rem,5vw,1.9rem)}
        }
        ${isDark?`
        .sp-title{color:${themeKey==='kota_malam'?'#FFFFFF':'rgba(228,248,246,.92)'}}
        .sp-aside-date{color:${themeKey==='kota_malam'?'rgba(255,255,255,.75)':'rgba(160,218,214,.72)'}}
        .sp-mood{color:${themeKey==='kota_malam'?'rgba(255,255,255,.85)':'rgba(200,240,238,.78)'};background:rgba(255,255,255,.08)}
        .sp-aside{background:rgba(255,255,255,.05);border-right:1px solid rgba(255,255,255,.08)}
        .sp-footer-mob{border-top:1px solid rgba(255,255,255,.10)}
        .sp-aside-top-sep{background:rgba(255,255,255,.10)!important}
        `:""}
        /* ── Focus mode ── */
        #sp-root.sp-focus .sp-aside{display:none!important}
        #sp-root.sp-focus .sp-layout{display:block}
        #sp-root.sp-focus .sp-main-inner{max-width:680px;padding:60px 40px 120px}
        @media(max-width:600px){#sp-root.sp-focus .sp-main-inner{padding:48px 22px 120px}}
        @keyframes spFocusIn{from{opacity:0}to{opacity:1}}
        #sp-root.sp-focus{animation:spFocusIn .3s ease both}
      `}</style>

      {theme && <ThemeSvg themeId={themeKey} accent={theme.accent}/>}
      {/* <ShareFocusBtn accent={c.accent}/> */}

      <div id="sp-root" className="sp-layout" style={{position:"relative",zIndex:1}}>

        {/* ── Left aside ── */}
        <aside className="sp-aside sp-a sp-a1">
          <div className="sp-aside-inner">
            <div className="sp-brand">Catatanku</div>
            <div className="sp-aside-bar"/>
              <span className="sp-aside-date">
                {fullD(note.date)}
                <span style={{opacity:.5,margin:"0 6px"}}>·</span>
                {calcReadingTime(text)} mnt baca
              </span>
            {mood && (
              <div className="sp-mood">
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </div>
            )}
            {(note as any).isImported && (
              <div className="sp-mood" style={{marginTop:8,marginRight:8,background:isDark?"rgba(255,255,255,0.08)":"rgba(196,149,106,.06)",border:isDark?`1px solid ${c.accent}40`:"1px solid rgba(196,149,106,.12)",color:isDark?c.accent:"#8C7E73"}}>
                <span style={{fontSize:".75rem"}}>📦</span>
                <span style={{fontWeight:500,fontSize:".7rem"}}>Catatan Impor</span>
              </div>
            )}
            {(note as any).songId && (note as any).shareMusic !== false && (
              <ShareMusicPlayer
                songId={(note as any).songId}
                previewUrl={(note as any).songPreview || ""}
                artwork={(note as any).songArtwork || ""}
                title={(note as any).songTitle || "Lagu"}
              />
            )}
            {/* Mobile: thin line below header row */}
            <div className="sp-aside-top-sep"/>
            <div className="sp-spacer"/>
            <p className="sp-tagline">Ruang ceritamu<br/>ada di sini.</p>
            <a href="/" className="sp-cta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10"/>
              </svg>
              Buat catatanmu sendiri
            </a>
          </div>
        </aside>

        {/* ── Right main content ── */}
        <main className="sp-main">
          <div className="sp-main-inner">
            <ShareRevokeClient shareId={shareId} isOneTime={!!(note as any).isOneTime}/>
            <div className="sp-accent-bar sp-a sp-a1"/>
            {title && <h1 className="sp-title sp-a sp-a2">{title}</h1>}
            <div className="sp-a sp-a3">
              <ShareBlocks blocks={blocks} accent={c.accent} fontFamily={fontFamily} isDark={isDark} themeId={themeKey} titleMap={titleMap}/>
            </div>

            {/* Mobile-only footer */}
            <div className="sp-footer-mob">
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", color:"#BEB3A8" }}>Catatanku</span>
              <span style={{ color:"#EDE7DF" }}>·</span>
              <a href="/" style={{ fontFamily:"'Lora',serif", fontSize:".78rem", color:c.accent, textDecoration:"none" }}>Buat catatanmu sendiri</a>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
