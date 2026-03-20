"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS_SHORT = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MOODS = [
  { emoji: "☀️", label: "Bahagia", color: "#D4A24E", soft: "#FFF8ED", border: "#F0D9A8", bg: "linear-gradient(135deg,#FFFAF0,#FFF0D4)", pageBg: "linear-gradient(180deg,#FFFAF2 0%,#FAF6F0 40%)" },
  { emoji: "🍃", label: "Tenang",  color: "#7A9E7E", soft: "#F0F7F1", border: "#C2D9C5", bg: "linear-gradient(135deg,#F5FAF5,#E6F2E8)", pageBg: "linear-gradient(180deg,#F4FAF5 0%,#FAF6F0 40%)" },
  { emoji: "🌧️", label: "Sedih",   color: "#7B8FA1", soft: "#EFF3F7", border: "#B8C8D4", bg: "linear-gradient(135deg,#F2F6FA,#E4ECF2)", pageBg: "linear-gradient(180deg,#F0F4F8 0%,#FAF6F0 40%)" },
  { emoji: "🔥", label: "Marah",   color: "#B5705A", soft: "#FBF0EC", border: "#DDB8A8", bg: "linear-gradient(135deg,#FDF4F0,#F7E4DC)", pageBg: "linear-gradient(180deg,#FBF2EE 0%,#FAF6F0 40%)" },
  { emoji: "🌙", label: "Rindu",   color: "#8E7BA8", soft: "#F4F0F8", border: "#C8BBD8", bg: "linear-gradient(135deg,#F8F4FC,#EDE4F5)", pageBg: "linear-gradient(180deg,#F6F2FA 0%,#FAF6F0 40%)" },
  { emoji: "🌊", label: "Cemas",   color: "#6B8E9E", soft: "#EDF4F7", border: "#B0CCD6", bg: "linear-gradient(135deg,#F0F7FA,#E0EDF2)", pageBg: "linear-gradient(180deg,#EEF5F8 0%,#FAF6F0 40%)" },
];

const STICKER_CATS = [
  { label: "Alam", stickers: ["🌸","🌺","🌻","🌷","🍂","🍁","🌿","🪻","🌾","☘️","🌵","🪷","🍀","🌳","⭐","🌈","🦋","🐝","🐞","🕊️"] },
  { label: "Makanan", stickers: ["🍵","☕","🧋","🍰","🍩","🍪","🍫","🎂","🍜","🍣","🥐","🍕","🧁","🍿","🥤","🫖","🍦","🥞","🫧","🍡"] },
  { label: "Aktivitas", stickers: ["📖","🎵","🎨","✏️","🎧","📷","🎸","🎹","🏃","🧘","🚶","🎮","💻","📝","🎬","🎤","📚","🪴","🧶","🎯"] },
  { label: "Perasaan", stickers: ["💛","💜","💙","🤍","🖤","❤️‍🔥","💫","✨","🫶","🤗","😊","😢","😤","🥺","😴","🤔","💭","💬","🫠","🥰"] },
  { label: "Cuaca", stickers: ["🌤️","⛅","🌦️","🌧️","⛈️","🌩️","❄️","🌬️","🌫️","🌪️","☀️","🌙","🌕","💧","🔥","🌊","🏔️","🌅","🌄","🌃"] },
  { label: "Objek", stickers: ["🎀","🧸","🕯️","💐","🎁","📮","🔮","🪞","🎈","🏠","✈️","🚗","🛏️","🪑","💡","🔑","⏰","📱","💌","🎪"] },
];

const NOTE_FONTS = [
  { id: '',             label: 'Lora',         sample: 'Aa', family: "'Lora', serif",                desc: 'Klasik & elegan' },
  { id: 'cormorant',    label: 'Cormorant',    sample: 'Aa', family: "'Cormorant Garamond', serif",  desc: 'Sastra & tipis' },
  { id: 'playfair',     label: 'Playfair',     sample: 'Aa', family: "'Playfair Display', serif",    desc: 'Editorial & tegas' },
  { id: 'merriweather', label: 'Merriweather', sample: 'Aa', family: "'Merriweather', serif",        desc: 'Padat & nyaman' },
  { id: 'garamond',     label: 'EB Garamond',  sample: 'Aa', family: "'EB Garamond', serif",         desc: 'Klasik sastra' },
  { id: 'crimson',      label: 'Crimson Pro',  sample: 'Aa', family: "'Crimson Pro', serif",         desc: 'Elegan & tipis' },
  { id: 'nunito',       label: 'Nunito',       sample: 'Aa', family: "'Nunito', sans-serif",          desc: 'Ramah & bulat' },
  { id: 'inter',        label: 'Inter',        sample: 'Aa', family: "'Inter', sans-serif",           desc: 'Bersih & modern' },
  { id: 'poppins',      label: 'Poppins',      sample: 'Aa', family: "'Poppins', sans-serif",         desc: 'Bulat & modern' },
  { id: 'raleway',      label: 'Raleway',      sample: 'Aa', family: "'Raleway', sans-serif",         desc: 'Elegan display' },
  { id: 'dmsans',       label: 'DM Sans',      sample: 'Aa', family: "'DM Sans', sans-serif",         desc: 'Minimalis bersih' },
];

const NOTE_COLORS = [
  { id: '', label: 'Alami', dot: '#EDE7DF', bg: '', border: '', accent: '' },
  { id: 'blush', label: 'Mawar', dot: '#F9CECE', bg: '#FEF2F2', border: '#F9CECE', accent: '#C27070' },
  { id: 'sage', label: 'Sage', dot: '#C9DED0', bg: '#F2F7F3', border: '#C9DED0', accent: '#6B9E78' },
  { id: 'sky', label: 'Langit', dot: '#C3D6F5', bg: '#F1F5FD', border: '#C3D6F5', accent: '#5B8DD9' },
  { id: 'lavender', label: 'Lavender', dot: '#D9CBF5', bg: '#F5F2FD', border: '#D9CBF5', accent: '#8B68C6' },
  { id: 'sand', label: 'Pasir', dot: '#E8D9B0', bg: '#FBF5E9', border: '#E8D9B0', accent: '#B5944A' },
];

const NOTE_THEMES = [
  { id: 'cinta',     label: 'Cinta',     emoji: '🌹', desc: 'Penuh kasih sayang', bg: '#FFF0F5', accent: '#D4607A' },
  { id: 'alam',      label: 'Alam',      emoji: '🌿', desc: 'Segar dan tenang',   bg: '#EEFAF3', accent: '#3D8B5C' },
  { id: 'mimpi',     label: 'Mimpi',     emoji: '🌙', desc: 'Indah dan magis',    bg: '#F5F0FF', accent: '#7B5EA7' },
  { id: 'langit',    label: 'Langit',    emoji: '☁️', desc: 'Luas dan bebas',     bg: '#EDF6FF', accent: '#3D7FBF' },
  { id: 'nostalgia', label: 'Nostalgia', emoji: '🍂', desc: 'Hangat dan berkesan',bg: '#FBF3E8', accent: '#A07035' },
  { id: 'laut',      label: 'Laut',      emoji: '🌊', desc: 'Dalam dan damai',    bg: '#EDF9F8', accent: '#2E8B8B' },
  { id: 'galaksi',  label: 'Galaksi',  emoji: '✨', desc: 'Megah dan misterius',     bg: '#F1F0F8', accent: '#6558B0' },
  { id: 'pagi',     label: 'Pagi',     emoji: '🌅', desc: 'Cerah dan bersemangat',   bg: '#FFFBEE', accent: '#D4853C' },
  { id: 'salju',    label: 'Salju',    emoji: '❄️', desc: 'Sejuk dan murni',          bg: '#F2F8FC', accent: '#4A8DBF' },
  { id: 'hutan',    label: 'Hutan',    emoji: '🌲', desc: 'Rimbun dan damai',        bg: '#EDF4EE', accent: '#2D6B45' },
  { id: 'gunung',   label: 'Gunung',   emoji: '🏔️', desc: 'Kokoh dan menginspirasi', bg: '#F5F3ED', accent: '#7A6545' },
  { id: 'bunga',    label: 'Bunga',    emoji: '🌸', desc: 'Lembut dan menawan',      bg: '#FDF4FA', accent: '#C05898' },
  { id: 'aurora',   label: 'Aurora',   emoji: '🌌', desc: 'Cahaya utara yang magis', bg: '#0E1C1B', accent: '#4AADA8', dark: true },
  { id: 'kota_malam', label: 'Kota Malam', emoji: '🌃', desc: 'Suasana kota yang hidup di malam hari', bg: '#020408', accent: '#F0D090', dark: true },
  { id: 'kucing',   label: 'Kucing',   emoji: '🐱', desc: 'Lucu dan menggemaskan',   bg: '#FAF7F4', accent: '#C28B68' },
  { id: 'notebook', label: 'Notebook', emoji: '📓', desc: 'Bergaris hangat seperti buku catatan', bg: '#FFFAEC', accent: '#9B7A38' },
];

function ThemeBg({ themeId, accent }: { themeId: string; accent: string }) {
  if (!themeId) return null;
  const s: any = { position:"fixed",top:0,left:0,width:"100vw",height:"100vh",pointerEvents:"none",zIndex:0,overflow:"hidden" };
  if (themeId==='cinta') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[30,60,1],[320,40,1.4],[180,150,.7],[50,300,1.1],[360,280,.8],[200,450,1.3],[80,550,.6],[340,500,1],[150,680,.9],[290,730,1.2],[240,200,.5],[360,650,.7]].map(([x,y,sc],i)=>(
        <path key={i} d="M0,-6C0,-10-7,-10-7,-5C-7,0 0,7 0,9C0,7 7,0 7,-5C7,-10 0,-10 0,-6Z" transform={`translate(${x},${y})scale(${sc})`}/>
      ))}
    </svg>
  );
  if (themeId==='alam') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[40,80,0,1],[310,55,-30,1.2],[90,250,20,.8],[350,290,10,1.1],[200,430,-20,.9],[65,500,30,1.3],[300,600,-15,.7],[160,720,12,1],[240,160,-10,.6],[380,440,25,.9]].map(([x,y,r,sc],i)=>(
        <g key={i} transform={`translate(${x},${y})rotate(${r})scale(${sc})`}>
          <path d="M0,-14C8,-7 10,2 0,16C-10,2-8,-7 0,-14Z"/>
          <line x1="0" y1="-2" x2="0" y2="14" stroke={accent} strokeWidth="1.2" fill="none"/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='mimpi') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.11}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[50,50,7],[320,75,5],[170,180,9],[75,330,6],[355,260,8],[210,430,5],[95,555,7],[330,510,6],[150,680,8],[280,730,5],[240,110,4],[370,400,6],[130,460,4]].map(([x,y,r],i)=>(
        <polygon key={i} points={`0,-${r} ${r*.3},-${r*.3} ${r},0 ${r*.3},${r*.3} 0,${r} -${r*.3},${r*.3} -${r},0 -${r*.3},-${r*.3}`} transform={`translate(${x},${y})`}/>
      ))}
      {[[100,120,3],[300,350,2.5],[200,600,3],[370,180,2],[60,680,2.5]].map(([x,y,r],i)=>(
        <circle key={`c${i}`} cx={x} cy={y} r={r}/>
      ))}
    </svg>
  );
  if (themeId==='langit') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.09}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[55,80,1],[280,120,1.2],[150,280,.8],[330,340,1.1],[80,490,1.3],[240,560,.9],[360,700,1],[170,680,.7]].map(([x,y,sc],i)=>(
        <g key={i} transform={`translate(${x},${y})scale(${sc})`}>
          <circle cx="0" cy="0" r="14"/>
          <circle cx="20" cy="-4" r="11"/>
          <circle cx="-20" cy="-4" r="9"/>
          <circle cx="8" cy="-13" r="9"/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='nostalgia') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[40,60,10,1],[305,50,-15,1.2],[155,200,5,.8],[335,275,-20,1.1],[85,425,15,.9],[275,450,-10,1.3],[145,605,20,.7],[320,705,-5,1],[210,320,-8,.8],[380,560,12,.9]].map(([x,y,r,sc],i)=>(
        <path key={i} d="M0,-10L3,-5L8,-7L5,-2L9,2L5,2L6,8L2,5L0,10L-2,5L-6,8L-5,2L-9,2L-5,-2L-8,-7L-3,-5Z" transform={`translate(${x},${y})rotate(${r})scale(${sc})`}/>
      ))}
    </svg>
  );
  if (themeId==='laut') return (
    <svg className="theme-bg-svg" style={{...s,opacity:.09}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round">
      {[0,70,140,210,280,350,420,490,560,630,700,770].map((y,i)=>(
        <path key={i} d={`M-10,${y}C70,${y-22} 130,${y+22} 200,${y}C270,${y-22} 330,${y+22} 410,${y}`}/>
      ))}
    </svg>
  );
  if (themeId==='galaksi') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <ellipse cx="260" cy="210" rx="155" ry="56" transform="rotate(-22 260 210)" stroke={accent} strokeWidth="1.2" opacity=".1"/>
      <ellipse cx="260" cy="210" rx="105" ry="38" transform="rotate(42 260 210)" stroke={accent} strokeWidth=".8" opacity=".08"/>
      <ellipse cx="85" cy="620" rx="120" ry="44" transform="rotate(20 85 620)" stroke={accent} strokeWidth="1" opacity=".09"/>
      <ellipse cx="365" cy="740" rx="80" ry="28" transform="rotate(-12 365 740)" stroke={accent} strokeWidth=".8" opacity=".07"/>
      {[[55,75,1.8,.52],[325,55,1.5,.46],[185,135,1,.43],[78,248,2.2,.46],[358,278,1.5,.48],[198,388,1.8,.46],[38,458,1.5,.5],[305,418,1,.42],[158,528,2,.47],[375,558,1.5,.44],[88,648,1.8,.5],[248,708,1.5,.48],[148,768,1,.42],[28,325,1,.42],[362,400,1.5,.44],[218,485,1,.4],[130,185,1.5,.5],[290,555,1,.4],[342,162,1.2,.43],[102,742,1,.4],[210,58,1.3,.45],[60,490,1,.4],[380,480,1.2,.42]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill={accent} opacity={op}/>
      ))}
      {[[205,178,6,.28],[335,500,5,.25],[68,385,4.5,.22],[282,700,5.5,.25],[172,290,4,.2],[310,640,5,.22]].map(([x,y,sz,op]:number[],i)=>(
        <path key={`sp${i}`} fill={accent} opacity={op} d={`M${x},${y-sz}L${x+sz*.28},${y-sz*.28}L${x+sz},${y}L${x+sz*.28},${y+sz*.28}L${x},${y+sz}L${x-sz*.28},${y+sz*.28}L${x-sz},${y}L${x-sz*.28},${y-sz*.28}Z`}/>
      ))}
      <circle cx="318" cy="148" r="12" fill={accent} opacity=".13"/>
      <ellipse cx="318" cy="148" rx="24" ry="7.5" stroke={accent} strokeWidth="1.5" opacity=".12"/>
      <circle cx="52" cy="595" r="8" fill={accent} opacity=".11"/>
      <ellipse cx="52" cy="595" rx="17" ry="5.5" stroke={accent} strokeWidth="1.2" opacity=".1"/>
    </svg>
  );
  if (themeId==='pagi') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill="none">
      <circle cx="355" cy="85" r="52" fill={accent} opacity=".08"/>
      <circle cx="355" cy="85" r="38" fill={accent} opacity=".07"/>
      <circle cx="355" cy="85" r="26" fill={accent} opacity=".1"/>
      {Array.from({length:14},(_,i)=>{const a=(i*25.7-10)*Math.PI/180;const r1=62,r2=115;return <line key={i} x1={355+Math.cos(a)*r1} y1={85+Math.sin(a)*r1} x2={355+Math.cos(a)*r2} y2={85+Math.sin(a)*r2} stroke={accent} strokeWidth="1.5" opacity=".12" strokeLinecap="round"/>;}).filter(Boolean)}
      {[[80,185,1],[185,145,1.1],[245,205,.9],[130,305,1],[315,245,.85],[205,365,.9],[62,425,1],[285,385,.9],[152,488,.85],[322,465,1],[100,555,.9],[248,530,.95]].map(([x,y,sc]:number[],i)=>(
        <g key={i} transform={`translate(${x},${y})scale(${sc})`} stroke={accent} strokeWidth="1.3" strokeLinecap="round" opacity=".28">
          <path d="M-10,0Q-5,-6 0,-2.5Q5,-6 10,0"/>
        </g>
      ))}
      {[[55,608,3.5,.11],[148,658,4,.09],[245,628,3.5,.11],[348,672,4,.09],[102,725,3,.09],[305,745,3.5,.09]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`b${i}`} cx={x} cy={y} r={r} fill={accent} opacity={op}/>
      ))}
      <path d="M-20,760 Q100,720 200,750 Q300,780 420,748" stroke={accent} strokeWidth="1" opacity=".12" strokeLinecap="round"/>
    </svg>
  );
  if (themeId==='salju') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" stroke={accent} strokeLinecap="round" fill="none">
      {[[58,78,17,.13],[332,118,13,.11],[182,242,19,.12],[52,382,15,.11],[322,342,21,.12],[142,525,17,.11],[362,522,14,.1],[82,662,19,.12],[262,682,15,.1],[202,762,17,.11],[380,762,13,.09],[160,152,11,.1],[290,458,12,.09],[30,598,10,.09]].map(([cx,cy,sz,op]:number[],i)=>{
        const spokes=[0,60,120,180,240,300];
        const bLen=sz*.32;
        return (
          <g key={i} opacity={op} transform={`translate(${cx},${cy})`} strokeWidth="1.1">
            {spokes.map((ang,j)=>{const r=ang*Math.PI/180;const cos=Math.cos(r),sin=Math.sin(r);const bx=cos*sz*.46,by=sin*sz*.46;const br1=(ang+60)*Math.PI/180,br2=(ang-60)*Math.PI/180;return(<g key={j}><line x1="0" y1="0" x2={cos*sz} y2={sin*sz}/><line x1={bx} y1={by} x2={bx+Math.cos(br1)*bLen} y2={by+Math.sin(br1)*bLen}/><line x1={bx} y1={by} x2={bx+Math.cos(br2)*bLen} y2={by+Math.sin(br2)*bLen}/></g>);})}
            <circle cx="0" cy="0" r="1.8" fill={accent} stroke="none"/>
          </g>
        );
      })}
      {[[120,168,2.5,.18],[272,205,2,.16],[398,305,2.5,.16],[28,462,2,.16],[252,442,2,.16],[172,605,2.5,.16],[312,602,2,.15]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`d${i}`} cx={x} cy={y} r={r} fill={accent} stroke="none" opacity={op}/>
      ))}
    </svg>
  );
  if (themeId==='hutan') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <circle cx="72" cy="88" r="32" opacity=".06"/><circle cx="72" cy="88" r="20" opacity=".05"/><circle cx="72" cy="88" r="11" opacity=".06"/>
      {[[152,38,1.2,.38],[255,25,1,.35],[325,50,1.3,.4],[388,32,1,.35],[32,118,1,.3],[198,65,1.2,.36],[305,145,1,.3],[372,110,1.2,.36]].map(([x,y,r,op]:number[],i)=>(<circle key={`st${i}`} cx={x} cy={y} r={r} opacity={op}/>))}
      {[[35,800,500,58,.05],[110,800,492,48,.05],[190,800,505,60,.05],[268,800,498,52,.05],[342,800,488,46,.05],[398,800,495,50,.05]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`far${i}`} opacity={op}><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${base} ${Number(x)+Number(w)/2},${base}`}/><polygon points={`${x},${Number(bot)+h*.32} ${Number(x)-Number(w)*.44},${Number(bot)+h*.72} ${Number(x)+Number(w)*.44},${Number(bot)+h*.72}`}/></g>);})}
      {[[52,800,445,72,.08],[138,800,438,64,.08],[218,800,448,75,.08],[298,800,440,68,.08],[378,800,435,60,.08]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`mid${i}`} opacity={op}><rect x={Number(x)-Number(w)*.075} y={Number(bot)+h*.82} width={Number(w)*.15} height={h*.2}/><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${Number(bot)+h*.55} ${Number(x)+Number(w)/2},${Number(bot)+h*.55}`}/><polygon points={`${x},${Number(bot)+h*.28} ${Number(x)-Number(w)*.46},${Number(bot)+h*.72} ${Number(x)+Number(w)*.46},${Number(bot)+h*.72}`}/><polygon points={`${x},${Number(bot)+h*.52} ${Number(x)-Number(w)*.38},${Number(bot)+h*.88} ${Number(x)+Number(w)*.38},${Number(bot)+h*.88}`}/></g>);})}
      {[[18,800,375,88,.13],[100,800,362,98,.13],[192,800,378,92,.13],[278,800,368,96,.13],[368,800,372,84,.12]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={`fg${i}`} opacity={op}><rect x={Number(x)-Number(w)*.08} y={Number(bot)+h*.8} width={Number(w)*.16} height={h*.22}/><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${Number(bot)+h*.42} ${Number(x)+Number(w)/2},${Number(bot)+h*.42}`}/><polygon points={`${x},${Number(bot)+h*.22} ${Number(x)-Number(w)*.48},${Number(bot)+h*.58} ${Number(x)+Number(w)*.48},${Number(bot)+h*.58}`}/><polygon points={`${x},${Number(bot)+h*.42} ${Number(x)-Number(w)*.42},${Number(bot)+h*.72} ${Number(x)+Number(w)*.42},${Number(bot)+h*.72}`}/><polygon points={`${x},${Number(bot)+h*.6} ${Number(x)-Number(w)*.34},${Number(bot)+h*.85} ${Number(x)+Number(w)*.34},${Number(bot)+h*.85}`}/></g>);})}
      <path d="M-20,758 C80,740 180,752 280,745 C360,738 408,748 430,742 L430,800 L-20,800Z" opacity=".06"/>
      <path d="M-20,778 C90,768 188,775 288,769 C368,764 412,772 430,768 L430,800 L-20,800Z" opacity=".05"/>
      {[[68,622,2.2,.22],[145,645,1.8,.18],[225,628,2,.2],[308,652,1.8,.18],[385,622,1.6,.18],[105,698,1.8,.2],[258,715,2,.2],[342,702,1.6,.18],[188,668,1.4,.16]].map(([x,y,r,op]:number[],i)=>(<circle key={`ff${i}`} cx={x} cy={y} r={r} opacity={op}/>))}
      {[[55,158,-22,1.1],[278,140,14,1.25],[148,265,30,.95],[355,225,-18,1.05],[108,382,22,.9],[282,360,-12,.95],[195,482,18,1]].map(([x,y,rot,sc]:number[],i)=>(<g key={`lf${i}`} transform={`translate(${x},${y})rotate(${rot})scale(${sc})`} opacity=".10"><path d="M0,-18C10,-9 12,2 0,20C-12,2-10,-9 0,-18Z"/><line x1="0" y1="-2" x2="0" y2="18" stroke={accent} strokeWidth="1" fill="none"/></g>))}
    </svg>
  );
  if (themeId==='aurora') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
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
  if (themeId==='kucing') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
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
      {([[62,82,18,.12],[342,125,-22,.10],[128,228,12,.11],[282,318,-18,.10],[52,428,20,.11],[362,488,-15,.10],[148,568,15,.11],[308,648,-20,.10],[78,728,18,.09],[372,748,-12,.09],[218,162,-10,.10],[198,408,14,.09],[108,658,10,.10]] as number[][]).map(([x,y,rot,op],i)=>(
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
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <polygon points="-10,590 55,405 115,458 178,358 248,435 318,375 398,498 415,590" opacity=".07"/>
      <polygon points="-10,655 42,528 98,572 158,465 218,502 278,422 340,482 398,558 415,655" opacity=".09"/>
      <polygon points="-10,725 48,608 92,645 152,545 212,592 260,515 302,562 368,618 415,682 415,725" opacity=".11"/>
      <polygon points="178,358 165,392 195,392" fill="white" opacity=".3"/>
      <polygon points="248,435 238,465 260,465" fill="white" opacity=".25"/>
      <polygon points="55,405 43,440 70,440" fill="white" opacity=".22"/>
      <polygon points="278,422 266,458 292,458" fill="white" opacity=".22"/>
      {[[52,62,1.8,.5],[162,42,2,.46],[282,72,1.5,.48],[372,52,2,.46],[102,132,1.5,.43],[242,112,2,.46],[332,152,1.5,.41],[32,202,1,.39],[382,202,1.5,.41],[152,88,1.2,.44],[218,165,1,.4],[298,228,1.3,.42]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} opacity={op}/>
      ))}
      {[[28,725,48],[118,725,40],[318,725,45],[382,725,36]].map(([x,base,w]:number[],i)=>(
        <g key={`t${i}`} opacity=".13">
          <polygon points={`${x},${Number(base)-52} ${Number(x)-Number(w)/2},${base} ${Number(x)+Number(w)/2},${base}`}/>
          <polygon points={`${x},${Number(base)-80} ${Number(x)-Number(w)*.38},${Number(base)-32} ${Number(x)+Number(w)*.38},${Number(base)-32}`}/>
        </g>
      ))}
      <path d="-10,728 L415,728" stroke={accent} strokeWidth="1" opacity=".08" fill="none"/>
    </svg>
  );
  if (themeId==='bunga') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[52,82,18,1.2],[322,62,16,1],[182,205,20,1.3],[72,355,17,1.1],[342,305,22,1.2],[162,508,18,1],[292,485,15,.95],[82,648,20,1.2],[352,628,17,1],[212,725,18,1.1],[32,505,13,.92],[248,162,14,1],[118,428,15,.95]].map(([cx,cy,sz,sc]:number[],i)=>(
        <g key={i} transform={`translate(${cx},${cy})scale(${sc})`} opacity=".12">
          {[0,72,144,216,288].map((ang,j)=>{const r=ang*Math.PI/180;const px=Math.cos(r)*sz*.52,py=Math.sin(r)*sz*.52;return <ellipse key={j} cx={px} cy={py} rx={sz*.55} ry={sz*.26} transform={`rotate(${ang} ${px} ${py})`}/>;}).filter(Boolean)}
          <circle cx="0" cy="0" r={sz*.2}/>
        </g>
      ))}
      {[[118,145,-28,.9],[258,165,22,1.1],[82,445,17,.88],[312,425,-22,1],[152,645,12,.9],[355,708,-18,.88]].map(([x,y,rot,sc]:number[],i)=>(
        <g key={`l${i}`} transform={`translate(${x},${y})rotate(${rot})scale(${sc})`} opacity=".11">
          <path d="M0,-18C9,-9 11,2 0,20C-11,2-9,-9 0,-18Z"/>
        </g>
      ))}
      {[[198,125,3,.2],[102,265,2.5,.18],[362,455,3,.2],[62,578,2.5,.18],[282,585,3,.2],[172,762,2.5,.18],[312,248,2,.17]].map(([x,y,r,op]:number[],i)=>(
        <circle key={`d${i}`} cx={x} cy={y} r={r} opacity={op}/>
      ))}
    </svg>
  );
  if (themeId==='notebook') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
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
  if (themeId==='kota_malam') return (
    <svg className="theme-bg-svg" style={{...s,opacity:1}} viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" fill="none">
      <defs><style>{`
        @keyframes km-tw { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
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
        <g key={i} className="km-cloud" style={{"--d":`${d}s`} as any} opacity=".015" transform={`translate(${x},${y})`}>
          <circle cx="0" cy="0" r="22" fill={accent}/><circle cx="20" cy="-8" r="28" fill={accent}/><circle cx="45" cy="0" r="22" fill={accent}/>
        </g>
      ))}
      <g transform="translate(340, 70)" opacity=".15"><circle r="25" fill={accent}/><circle cx="10" cy="-5" r="22" fill="#05080E"/></g>
      <g opacity=".35" transform="translate(0, 630)"><path d="M0,80 L30,60 L60,85 L90,55 L130,85 L170,45 L210,90 L250,55 L290,85 L340,40 L400,90 V170 H0 Z" fill="#030509"/></g>
      <g transform="translate(0, 560)">
        {/* Apartment 1: Compact with balconies */}
        <rect x="0" y="80" width="60" height="160" fill="#030509" opacity=".8"/>
        {[0,1,2,3].map(j=><g key={j} transform={`translate(0, ${j*35})`}>
          <rect x="10" y={100} width="15" height="10" rx="1" fill={accent} className="km-w" style={{"--d":"3s"} as any}/>
          <rect x="8" y={112} width="20" height="2" fill="#080C15"/> {/* balcony floor */}
          <rect x="8" y={108} width="1" height="4" fill="#080C15"/> {/* railing */}
          <rect x="18" y={108} width="1" height="4" fill="#080C15"/>
          <rect x="28" y={108} width="1" height="4" fill="#080C15"/>
        </g>)}
        {/* Apartment 2: Tall with side AC units */}
        <rect x="65" y="40" width="65" height="200" fill="#04070C" opacity=".8"/>
        {[0,1,2,3,4,5].map(j=><g key={j} transform={`translate(0, ${j*30})`}>
          <rect x="75" y="60" width="10" height="12" rx="1.5" fill={accent} className="km-w" style={{"--d":"2.5s"} as any}/>
          <rect x="105" y="60" width="10" height="12" rx="1.5" fill={accent} className="km-w" style={{"--d":"4s"} as any}/>
          {j%2===0 && <rect x="116" y={65} width="6" height="5" fill="#050910"/>} {/* AC Unit */}
        </g>)}
        {/* Apartment 3: Rooftop detail */}
        <rect x="135" y="100" width="80" height="140" fill="#030509" opacity=".8"/>
        <rect x="145" y="85" width="20" height="15" fill="#0C1423"/> {/* roof structure */}
        <rect x="175" y="70" width="4" height="30" fill="#0C1423"/> {/* antenna */}
        <circle cx="177" cy="65" r="1.5" fill="#f00" className="km-b"/>
        {[0,1,2,3].map(r=>(
          <g key={r} transform={`translate(0,${r*30})`}>
            {[0,1,2].map(c=>(<rect key={c} x={145+c*22} y={115} width="12" height="8" rx="1" fill={accent} className="km-w" style={{"--d":`${3+c}s`} as any}/>))}
          </g>
        ))}
        {/* Apartment 4: Wide balcony complex */}
        <rect x="220" y="60" width="90" height="180" fill="#04070C" opacity=".8"/>
        {[0,1,2,3,4].map(j=><g key={j} transform={`translate(0, ${j*32})`}>
          <rect x="230" y={80} width="70" height="2" fill="#05080C" opacity=".8"/> {/* long balcony */}
          <rect x="235" y={70} width="8" height="10" fill={accent} className="km-w" style={{"--d":"3.5s"} as any}/>
          <rect x="255" y={70} width="8" height="10" fill={accent} className="km-w" style={{"--d":"2.2s"} as any}/>
          <rect x="275" y={70} width="8" height="10" fill={accent} className="km-w" style={{"--d":"3.8s"} as any}/>
        </g>)}
        {/* Building 5: Plain block with side windows */}
        <rect x="315" y="90" width="45" height="150" fill="#020304"/>
        {[0,1,2,3,4].map(j=><rect key={j} x="345" y={110+j*25} width="5" height="4" fill={accent} opacity=".15"/>)}
        {/* Building 6: Edge building */}
        <rect x="365" y="50" width="35" height="190" fill="#030509"/>
        {[0,1,2,3,4,5,6].map(j=><rect key={j} x="375" y={70+j*24} width="15" height="3" fill={accent} className="km-w" style={{"--d":`${2+j%3}s`} as any}/>)}
      </g>
      <g transform="translate(0, 760)">
        <line x1="0" y1="0" x2="400" y2="0" stroke="#fbbf24" strokeWidth="1.5" className="km-traffic" style={{"--d":"1s"} as any} opacity=".4"/>
        <line x1="0" y1="6" x2="400" y2="6" stroke="#f87171" strokeWidth="1.2" className="km-traffic" style={{"--d":"1.5s"} as any} opacity=".3"/>
      </g>
      <rect x="0" y="720" width="400" height="80" fill="url(#km-glow-v2)"/>
      <defs>
        <linearGradient id="km-glow-v2" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity=".05"/><stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
  return null;
}

function CardThemeBg({ themeId, accent }: { themeId: string; accent: string }) {
  if (!themeId) return null;
  const s: any = { position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,overflow:"hidden" };
  if (themeId==='cinta') return (
    <svg style={{...s,opacity:.13}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <path d="M0,-5C0,-9-6,-9-6,-4C-6,0 0,6 0,8C0,6 6,0 6,-4C6,-9 0,-9 0,-5Z" transform="translate(18,18)scale(1.1)"/>
      <path d="M0,-5C0,-9-6,-9-6,-4C-6,0 0,6 0,8C0,6 6,0 6,-4C6,-9 0,-9 0,-5Z" transform="translate(270,22)scale(1.4)"/>
      <path d="M0,-5C0,-9-6,-9-6,-4C-6,0 0,6 0,8C0,6 6,0 6,-4C6,-9 0,-9 0,-5Z" transform="translate(285,120)scale(1)"/>
      <path d="M0,-5C0,-9-6,-9-6,-4C-6,0 0,6 0,8C0,6 6,0 6,-4C6,-9 0,-9 0,-5Z" transform="translate(14,130)scale(.8)"/>
      <path d="M0,-5C0,-9-6,-9-6,-4C-6,0 0,6 0,8C0,6 6,0 6,-4C6,-9 0,-9 0,-5Z" transform="translate(150,10)scale(.65)"/>
      <path d="M0,-5C0,-9-6,-9-6,-4C-6,0 0,6 0,8C0,6 6,0 6,-4C6,-9 0,-9 0,-5Z" transform="translate(240,140)scale(.7)"/>
    </svg>
  );
  if (themeId==='alam') return (
    <svg style={{...s,opacity:.13}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <g transform="translate(22,20)rotate(-20)scale(1.1)"><path d="M0,-12C7,-6 8,2 0,14C-8,2-7,-6 0,-12Z"/><line x1="0" y1="0" x2="0" y2="13" stroke={accent} strokeWidth="1.1"/></g>
      <g transform="translate(10,130)rotate(15)scale(.9)"><path d="M0,-12C7,-6 8,2 0,14C-8,2-7,-6 0,-12Z"/><line x1="0" y1="0" x2="0" y2="13" stroke={accent} strokeWidth="1.1"/></g>
      <g transform="translate(270,15)rotate(20)scale(1.2)"><path d="M0,-12C7,-6 8,2 0,14C-8,2-7,-6 0,-12Z"/><line x1="0" y1="0" x2="0" y2="13" stroke={accent} strokeWidth="1.1"/></g>
      <g transform="translate(285,125)rotate(-10)scale(.85)"><path d="M0,-12C7,-6 8,2 0,14C-8,2-7,-6 0,-12Z"/><line x1="0" y1="0" x2="0" y2="13" stroke={accent} strokeWidth="1.1"/></g>
      <g transform="translate(150,138)rotate(5)scale(.7)"><path d="M0,-12C7,-6 8,2 0,14C-8,2-7,-6 0,-12Z"/></g>
    </svg>
  );
  if (themeId==='mimpi') return (
    <svg style={{...s,opacity:.14}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[20,20,6],[280,18,5],[290,130,6],[15,132,4],[150,12,4],[260,75,3],[40,75,3],[150,140,5]].map(([x,y,r]:number[],i)=>(
        <polygon key={i} points={`0,-${r} ${r*.3},-${r*.3} ${r},0 ${r*.3},${r*.3} 0,${r} -${r*.3},${r*.3} -${r},0 -${r*.3},-${r*.3}`} transform={`translate(${x},${y})`}/>
      ))}
      {[[80,15,2],[220,22,2],[55,140,2],[240,135,2]].map(([x,y,r]:number[],i)=>(
        <circle key={`d${i}`} cx={x} cy={y} r={r}/>
      ))}
    </svg>
  );
  if (themeId==='langit') return (
    <svg style={{...s,opacity:.11}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <g transform="translate(28,22)scale(.8)"><circle cx="0" cy="0" r="14"/><circle cx="18" cy="-4" r="11"/><circle cx="-18" cy="-4" r="9"/><circle cx="7" cy="-12" r="8"/></g>
      <g transform="translate(255,20)scale(.9)"><circle cx="0" cy="0" r="14"/><circle cx="18" cy="-4" r="11"/><circle cx="-18" cy="-4" r="9"/><circle cx="7" cy="-12" r="8"/></g>
      <g transform="translate(150,135)scale(.7)"><circle cx="0" cy="0" r="14"/><circle cx="18" cy="-4" r="11"/><circle cx="-18" cy="-4" r="9"/></g>
    </svg>
  );
  if (themeId==='nostalgia') return (
    <svg style={{...s,opacity:.13}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <path d="M0,-8L2,-4L6,-5L4,-1L7,2L4,1L5,6L1,4L0,8L-1,4L-5,6L-4,1L-7,2L-4,-1L-6,-5L-2,-4Z" transform="translate(20,20)rotate(10)scale(1.1)"/>
      <path d="M0,-8L2,-4L6,-5L4,-1L7,2L4,1L5,6L1,4L0,8L-1,4L-5,6L-4,1L-7,2L-4,-1L-6,-5L-2,-4Z" transform="translate(278,18)rotate(-15)scale(1.3)"/>
      <path d="M0,-8L2,-4L6,-5L4,-1L7,2L4,1L5,6L1,4L0,8L-1,4L-5,6L-4,1L-7,2L-4,-1L-6,-5L-2,-4Z" transform="translate(15,132)rotate(20)scale(.9)"/>
      <path d="M0,-8L2,-4L6,-5L4,-1L7,2L4,1L5,6L1,4L0,8L-1,4L-5,6L-4,1L-7,2L-4,-1L-6,-5L-2,-4Z" transform="translate(282,130)rotate(-8)scale(1)"/>
      <path d="M0,-8L2,-4L6,-5L4,-1L7,2L4,1L5,6L1,4L0,8L-1,4L-5,6L-4,1L-7,2L-4,-1L-6,-5L-2,-4Z" transform="translate(150,8)rotate(5)scale(.7)"/>
    </svg>
  );
  if (themeId==='laut') return (
    <svg style={{...s,opacity:.11}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
      <path d="M-10,120C50,102 100,138 150,120C200,102 250,138 310,120"/>
      <path d="M-10,135C50,117 100,153 150,135C200,117 250,153 310,135"/>
      <path d="M-10,15C50,-3 100,33 150,15C200,-3 250,33 310,15"/>
      <path d="M-10,28C50,10 100,46 150,28C200,10 250,46 310,28"/>
    </svg>
  );
  if (themeId==='galaksi') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill="none">
      <ellipse cx="258" cy="22" rx="80" ry="28" transform="rotate(-18 258 22)" stroke={accent} strokeWidth=".9" opacity=".12"/>
      <ellipse cx="18" cy="130" rx="65" ry="22" transform="rotate(22 18 130)" stroke={accent} strokeWidth=".8" opacity=".1"/>
      {[[18,18,1.5,.5],[278,14,2,.46],[285,128,1.5,.5],[12,132,1.8,.46],[150,8,1.2,.44],[262,78,1,.42],[38,78,1.2,.42],[150,140,1.5,.44],[100,40,1,.4],[220,125,1,.4]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill={accent} opacity={op}/>
      ))}
      <path fill={accent} opacity=".25" d="M150,2L151.8,6.6L156.5,6.9L153,10L154,14.6L150,12L146,14.6L147,10L143.5,6.9L148.2,6.6Z"/>
      <circle cx="278" cy="20" r="7" fill={accent} opacity=".12"/>
      <ellipse cx="278" cy="20" rx="14" ry="4.5" stroke={accent} strokeWidth="1" opacity=".1"/>
    </svg>
  );
  if (themeId==='pagi') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill="none">
      <circle cx="268" cy="22" r="28" fill={accent} opacity=".08"/>
      <circle cx="268" cy="22" r="18" fill={accent} opacity=".09"/>
      {Array.from({length:10},(_,i)=>{const a=(i*36-10)*Math.PI/180;return <line key={i} x1={268+Math.cos(a)*32} y1={22+Math.sin(a)*32} x2={268+Math.cos(a)*52} y2={22+Math.sin(a)*52} stroke={accent} strokeWidth="1.2" opacity=".14" strokeLinecap="round"/>;}).filter(Boolean)}
      {[[45,55,1],[120,40,1.1],[180,62,.95],[80,88,.9],[220,75,.95]].map(([x,y,sc]:number[],i)=>(
        <g key={i} transform={`translate(${x},${y})scale(${sc})`} stroke={accent} strokeWidth="1.1" strokeLinecap="round" opacity=".28">
          <path d="M-8,0Q-4,-5 0,-2Q4,-5 8,0"/>
        </g>
      ))}
      <path d="M-10,135 Q75,118 150,132 Q225,145 310,130" stroke={accent} strokeWidth="1" opacity=".12" strokeLinecap="round"/>
    </svg>
  );
  if (themeId==='salju') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" stroke={accent} strokeLinecap="round" fill="none">
      {[[20,18,12,.13],[278,16,11,.11],[285,128,13,.12],[14,130,10,.11],[150,10,10,.1],[262,78,9,.1],[40,78,9,.09],[150,138,11,.11]].map(([cx,cy,sz,op]:number[],i)=>{
        return (
          <g key={i} opacity={op} transform={`translate(${cx},${cy})`} strokeWidth="1">
            {[0,60,120,180,240,300].map((ang,j)=>{const r=ang*Math.PI/180;const cos=Math.cos(r),sin=Math.sin(r);const bx=cos*sz*.46,by=sin*sz*.46;const bLen=sz*.3;const br1=(ang+60)*Math.PI/180,br2=(ang-60)*Math.PI/180;return(<g key={j}><line x1="0" y1="0" x2={cos*sz} y2={sin*sz}/><line x1={bx} y1={by} x2={bx+Math.cos(br1)*bLen} y2={by+Math.sin(br1)*bLen}/><line x1={bx} y1={by} x2={bx+Math.cos(br2)*bLen} y2={by+Math.sin(br2)*bLen}/></g>);})}
            <circle cx="0" cy="0" r="1.5" fill={accent} stroke="none"/>
          </g>
        );
      })}
    </svg>
  );
  if (themeId==='hutan') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <path d="M-10,118 L12,88 L28,100 L52,72 L75,88 L100,60 L124,78 L150,48 L174,68 L200,42 L224,62 L252,38 L278,58 L310,35 L310,122Z" opacity=".08"/>
      {[[18,150,80,36,.12],[78,150,75,32,.11],[148,150,82,38,.12],[218,150,78,34,.11],[280,150,72,28,.10]].map(([x,base,bot,w,op]:number[],i)=>{const h=Number(base)-Number(bot);return(<g key={i} opacity={op}><rect x={Number(x)-Number(w)*.075} y={Number(bot)+h*.78} width={Number(w)*.15} height={h*.24}/><polygon points={`${x},${bot} ${Number(x)-Number(w)/2},${Number(bot)+h*.42} ${Number(x)+Number(w)/2},${Number(bot)+h*.42}`}/><polygon points={`${x},${Number(bot)+h*.24} ${Number(x)-Number(w)*.46},${Number(bot)+h*.62} ${Number(x)+Number(w)*.46},${Number(bot)+h*.62}`}/><polygon points={`${x},${Number(bot)+h*.45} ${Number(x)-Number(w)*.38},${Number(bot)+h*.84} ${Number(x)+Number(w)*.38},${Number(bot)+h*.84}`}/></g>);})}
      <circle cx="22" cy="18" r="10" opacity=".07"/><circle cx="22" cy="18" r="6" opacity=".06"/>
      {[[65,12,1,.38],[128,8,1.2,.4],[208,14,1,.36],[272,10,1.2,.38],[285,105,1,.3],[12,100,1,.3]].map(([x,y,r,op]:number[],i)=>(<circle key={`st${i}`} cx={x} cy={y} r={r} opacity={op}/>))}
      {[[55,115,1.6,.2],[128,122,1.4,.18],[205,118,1.6,.2],[278,125,1.4,.18]].map(([x,y,r,op]:number[],i)=>(<circle key={`ff${i}`} cx={x} cy={y} r={r} opacity={op}/>))}
    </svg>
  );
  if (themeId==='aurora') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
      <defs><style>{`
        @keyframes cau-tw{0%,100%{opacity:.22}50%{opacity:.72}}
        @keyframes cau-sp{0%,100%{opacity:.18;transform:scale(1)}50%{opacity:.65;transform:scale(1.35)}}
        @keyframes cau-b1{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes cau-b2{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
        @keyframes cau-b3{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .caus1{animation:cau-tw 2.8s ease-in-out infinite}.caus2{animation:cau-tw 3.5s ease-in-out infinite .7s}.caus3{animation:cau-tw 2.2s ease-in-out infinite 1.2s}.caus4{animation:cau-tw 4.1s ease-in-out infinite .4s}.caus5{animation:cau-tw 3.0s ease-in-out infinite 1.9s}.caus6{animation:cau-tw 2.6s ease-in-out infinite .9s}.caus7{animation:cau-tw 3.8s ease-in-out infinite .2s}.caus8{animation:cau-tw 2.4s ease-in-out infinite 1.5s}.caus9{animation:cau-tw 3.2s ease-in-out infinite .6s}.caus10{animation:cau-tw 2.0s ease-in-out infinite 1.8s}.caus11{animation:cau-tw 2.9s ease-in-out infinite .3s}.caus12{animation:cau-tw 3.6s ease-in-out infinite 1.0s}
        .causp1{animation:cau-sp 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.causp2{animation:cau-sp 4.2s ease-in-out infinite .8s;transform-box:fill-box;transform-origin:center}.causp3{animation:cau-sp 2.9s ease-in-out infinite 1.5s;transform-box:fill-box;transform-origin:center}.causp4{animation:cau-sp 5.0s ease-in-out infinite .3s;transform-box:fill-box;transform-origin:center}
        .caub1{animation:cau-b1 8s ease-in-out infinite}.caub2{animation:cau-b2 10s ease-in-out infinite 1.2s}.caub3{animation:cau-b3 12s ease-in-out infinite 2.5s}
      `}</style></defs>
      <circle className="caus1" cx="15" cy="12" r="1.2" fill="#fff"/><circle className="caus2" cx="80" cy="8" r="1" fill="#fff"/><circle className="caus3" cx="145" cy="15" r="1.3" fill="#fff"/><circle className="caus4" cx="215" cy="10" r="1" fill="#fff"/><circle className="caus5" cx="275" cy="14" r="1.2" fill="#fff"/><circle className="caus6" cx="52" cy="36" r="1" fill="#fff"/><circle className="caus7" cx="178" cy="32" r="1.2" fill="#fff"/><circle className="caus8" cx="260" cy="40" r="1" fill="#fff"/><circle className="caus9" cx="35" cy="58" r="1" fill="#fff"/><circle className="caus10" cx="120" cy="62" r="1.1" fill="#fff"/><circle className="caus11" cx="235" cy="55" r="1" fill="#fff"/><circle className="caus12" cx="288" cy="68" r="1" fill="#fff"/>
      <path className="causp1" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(42,22)" fill="#fff"/>
      <path className="causp2" d="M0,-3.5L.5,-.5 3.5,0 .5,.5 0,3.5 -.5,.5 -3.5,0 -.5,-.5Z" transform="translate(188,18)" fill="#fff"/>
      <path className="causp3" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(258,48)" fill="#fff"/>
      <path className="causp4" d="M0,-3L.45,-.45 3,0 .45,.45 0,3 -.45,.45 -3,0 -.45,-.45Z" transform="translate(108,55)" fill="#fff"/>
      <path className="caub1" d="M-10,38 C35,22 80,52 135,32 C185,14 232,38 310,28 L310,58 C232,68 185,44 135,62 C80,82 35,52 -10,68Z" fill="#7EC8A4" opacity=".28"/>
      <path className="caub2" d="M-10,72 C38,55 85,80 138,62 C190,45 238,68 310,58 L310,88 C238,98 190,75 138,92 C85,110 38,85 -10,102Z" fill="#9B7BD4" opacity=".22"/>
      <path className="caub3" d="M-10,108 C40,92 88,115 142,98 C195,82 242,105 310,95 L310,122 C242,132 195,109 142,125 C88,142 40,119 -10,135Z" fill="#5CB8B2" opacity=".17"/>
    </svg>
  );
  if (themeId==='kucing') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
      <defs><style>{`
        @keyframes ckc-pulse{0%,100%{transform:scale(.75)}50%{transform:scale(.92)}}
        @keyframes ckc-blink{0%,88%,100%{transform:scaleY(1)}93%,97%{transform:scaleY(.08)}}
        @keyframes ckc-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .ckcp1{animation:ckc-pulse 2.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.ckcp2{animation:ckc-pulse 3.4s ease-in-out infinite .5s;transform-box:fill-box;transform-origin:center}.ckcp3{animation:ckc-pulse 2.5s ease-in-out infinite 1.1s;transform-box:fill-box;transform-origin:center}.ckcp4{animation:ckc-pulse 3.8s ease-in-out infinite .3s;transform-box:fill-box;transform-origin:center}
        .ckceye{animation:ckc-blink 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.ckceye2{animation:ckc-blink 4s ease-in-out infinite .2s;transform-box:fill-box;transform-origin:center}
        .ckspin{animation:ckc-spin 8s linear infinite;transform-box:fill-box;transform-origin:center}
      `}</style></defs>
      {([[20,20,15,.12],[278,18,-20,.10],[12,132,18,.10],[282,130,-15,.10],[148,10,10,.10],[268,82,-12,.09],[40,80,15,.09]] as number[][]).map(([x,y,rot,op],i)=>(
        <g key={`paw${i}`} transform={`translate(${x},${y})rotate(${rot})`} opacity={op} fill={accent}><g className={`ckcp${(i%4)+1}`}><ellipse cx="0" cy="6" rx="8" ry="7"/><circle cx="-7.5" cy="-3" r="3.8"/><circle cx="-2.5" cy="-9.2" r="3.8"/><circle cx="2.5" cy="-9.2" r="3.8"/><circle cx="7.5" cy="-3" r="3.8"/></g></g>
      ))}
      <g transform="translate(148,80)" opacity=".10" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round"><circle cx="0" cy="2" r="20"/><polygon points="-13,-16 -7,-30 -1,-16" fill={accent} stroke="none" opacity=".8"/><polygon points="13,-16 7,-30 1,-16" fill={accent} stroke="none" opacity=".8"/><ellipse className="ckceye" cx="-6" cy="-1" rx="3" ry="3.5" fill={accent} stroke="none" opacity=".5"/><ellipse className="ckceye2" cx="6" cy="-1" rx="3" ry="3.5" fill={accent} stroke="none" opacity=".5"/><line x1="-20" y1="6" x2="-10" y2="8"/><line x1="20" y1="6" x2="10" y2="8"/></g>
      <g transform="translate(245,75)"><g className="ckspin" fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity=".08"><circle cx="0" cy="0" r="14"/><path d="M-14,0 C-9,-11 9,-11 14,0 C9,11 -9,11 -14,0"/><path d="M0,-14 C11,-9 11,9 0,14 C-11,9 -11,-9 0,-14"/></g></g>
    </svg>
  );
  if (themeId==='gunung') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill={accent}>
      <polygon points="-10,110 38,58 72,80 108,38 148,65 188,28 228,55 268,42 310,72 310,110" opacity=".08"/>
      <polygon points="-10,132 30,95 62,112 98,72 135,92 172,55 208,78 245,62 280,85 310,105 310,132" opacity=".1"/>
      <polygon points="108,38 100,62 118,62" fill="white" opacity=".28"/>
      <polygon points="188,28 178,55 200,55" fill="white" opacity=".25"/>
      {[[15,15,1.5,.5],[280,12,1.8,.46],[290,135,1.5,.5],[12,138,1.8,.46],[150,8,1.2,.44],[240,68,1,.42],[68,68,1,.42]].map(([x,y,r,op]:number[],i)=>(
        <circle key={i} cx={x} cy={y} r={r} opacity={op}/>
      ))}
    </svg>
  );
  if (themeId==='bunga') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill={accent}>
      {[[18,18,14,1.1],[278,18,13,1],[285,128,15,1.1],[14,130,12,.95],[150,10,11,.9],[260,78,10,.9],[42,78,10,.9],[150,140,13,1]].map(([cx,cy,sz,sc]:number[],i)=>(
        <g key={i} transform={`translate(${cx},${cy})scale(${sc})`} opacity=".13">
          {[0,72,144,216,288].map((ang,j)=>{const r=ang*Math.PI/180;const px=Math.cos(r)*sz*.52,py=Math.sin(r)*sz*.52;return <ellipse key={j} cx={px} cy={py} rx={sz*.52} ry={sz*.24} transform={`rotate(${ang} ${px} ${py})`}/>;}).filter(Boolean)}
          <circle cx="0" cy="0" r={sz*.18}/>
        </g>
      ))}
      {[[80,14,1.4,.12],[225,132,1.4,.12],[14,82,1.2,.1],[288,72,1.2,.1]].map(([x,y,r,op]:number[],i)=>(
        <g key={`l${i}`} transform={`translate(${x},${y})rotate(${i%2===0?-20:20})`} opacity={op}>
          <path d="M0,-10C5,-5 6,1 0,11C-6,1-5,-5 0,-10Z"/>
        </g>
      ))}
    </svg>
  );
  if (themeId==='notebook') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:7},(_,i)=>(
        <line key={`crl${i}`} x1="0" y1={24+i*22} x2="300" y2={24+i*22} stroke="#C8A96A" strokeWidth=".8" opacity=".15"/>
      ))}
      <line x1="42" y1="0" x2="42" y2="150" stroke="#E87070" strokeWidth="1" opacity=".17"/>
      {([38,112] as number[]).map(y=>(
        <circle key={y} cx="16" cy={y} r="7" fill="none" stroke="#C5A97A" strokeWidth="1.2" opacity=".22"/>
      ))}
      {([[68,18],[248,12],[130,135],[285,128]] as number[][]).map(([x,y],i)=>(
        <g key={`cnbs${i}`} transform={`translate(${x},${y})`} opacity=".12" fill={accent}><path d="M0,-4.5L.6,-.6 4.5,0 .6,.6 0,4.5 -.6,.6 -4.5,0 -.6,-.6Z"/></g>
      ))}
      {([[290,40],[55,120]] as number[][]).map(([x,y],i)=>(
        <g key={`cnbh${i}`} transform={`translate(${x},${y})`}><path d="M0,-3C0,-5-4,-5-4,-2C-4,0 0,4 0,5C0,4 4,0 4,-2C4,-5 0,-5 0,-3Z" fill={accent} opacity=".12"/></g>
      ))}
      <g transform="translate(200,130)" opacity=".11" stroke={accent} strokeWidth="1.2" strokeLinecap="round" fill="none"><line x1="-8" y1="0" x2="6" y2="0"/><polyline points="1,-3 6,0 1,3"/></g>
      <g transform="translate(168,18)" opacity=".11" stroke={accent} strokeWidth="1.5" strokeLinecap="round" fill="none"><polyline points="-4,0 -1,4 5,-4"/></g>
    </svg>
  );
  if (themeId==='kota_malam') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMax slice" fill="none">
      <defs><style>{`
        @keyframes ckm-wi { 0%,100% { opacity: .12; } 50% { opacity: .35; } }
        .ckm-w { animation: ckm-wi var(--d) infinite; }
      `}</style></defs>
      {[...Array(12)].map((_,i)=><circle key={i} cx={(i*89)%300} cy={(i*53)%100} r={0.5+(i%2)*0.3} fill={accent} className="ckm-w" style={{"--d":`${2+i%3}s`} as any} opacity=".2"/>)}
      <circle cx="260" cy="22" r="10" fill={accent} opacity=".1"/><circle cx="268" cy="16" r="9" fill="#020408"/>
      <g transform="translate(0, 100) scale(.6)" opacity=".7">
        <rect x="10" y="40" width="50" height="120" fill="#04070C"/>
        <rect x="8" y="70" width="15" height="2" fill="#010204"/>
        <rect x="20" y="65" width="8" height="6" fill={accent} className="ckm-w" style={{"--d":"2.4s"} as any}/>
        <rect x="80" y="0" width="40" height="160" fill="#030509"/><path d="M80,0 Q100,-25 120,0 Z" fill="#030509"/>
        <rect x="91" y="20" width="8" height="10" fill={accent} className="ckm-w" style={{"--d":"3s"} as any}/>
        <rect x="130" y="60" width="60" height="100" fill="#020305"/>
        <rect x="135" y="80" width="12" height="8" fill={accent} className="ckm-w" style={{"--d":"1.8s"} as any}/>
        <rect x="200" y="20" width="50" height="140" fill="#04070C"/><rect x="215" y="-10" width="20" height="30" fill="#04070C"/>
        <rect x="220" y="40" width="10" height="12" fill={accent} className="ckm-w" style={{"--d":"4.2s"} as any}/>
        <rect x="260" y="50" width="60" height="110" fill="#020406"/>
        <rect x="230" y="80" width="50" height="2" fill="#010204"/>
      </g>
      <line x1="0" y1="145" x2="300" y2="145" stroke="#fbbf24" strokeWidth="1" opacity=".4"/>
    </svg>
  );
  return null;
}

const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

const PROMPTS = [
  "Apa yang membuatmu tersenyum hari ini?",
  "Ceritakan satu hal kecil yang membuatmu bersyukur.",
  "Bagaimana perasaanmu saat ini, sungguh-sungguh?",
  "Apa yang ingin kamu katakan pada dirimu sendiri?",
  "Tuliskan satu hal yang ingin kamu ingat dari hari ini.",
  "Siapa yang ada di pikiranmu hari ini?",
  "Apa yang kamu pelajari tentang dirimu hari ini?",
  "Jika hari ini punya warna, warna apa?",
];
const getPrompt = (ds: string) => PROMPTS[ds.split("-").reduce((a,b) => a + parseInt(b), 0) % PROMPTS.length];

const Ic = ({ d, size = 18, sw = 1.5, color }: { d: string; size?: number; sw?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);
const IC = {
  back: "M19 12H5M12 19l-7-7 7-7",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M12 5l7 7-7 7",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
  search: "M11 11m-7 0a7 7 0 1014 0 7 7 0 10-14 0M21 21l-4.35-4.35",
  chevL: "M15 6l-6 6 6 6",
  chevR: "M9 6l6 6-6 6",
  cal: "M3 7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7zM3 10h18M8 2v4M16 2v4",
  sticker: "M14.5 13.5c1.5 0 2.5-1 2.5-2.5V7M9.5 13.5C8 13.5 7 12.5 7 11V7M12 15v4m-3 0h6",
  x: "M18 6L6 18M6 6l12 12",
  lock: "M12 11v4m0 0h.01M7 10h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2zM9 10V7a3 3 0 016 0v3",
  unlock: "M12 11v4m0 0h.01M7 10h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2zM9 10V5a3 3 0 013-3 3 3 0 013 3",
  pin: "M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  share: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
};

const timeStr = (ts: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};

const stickerPositions = (count: number) => {
  const positions: any[] = [];
  const seed = [12,67,34,89,45,23,78,56,91,8,73,42,61,17,85,39,54,70,26,95];
  for (let i = 0; i < count; i++) {
    const s = seed[i % seed.length];
    positions.push({ top:(s*3+i*17)%80+5, left:(s*7+i*23)%75+10, rot:((s+i*13)%60)-30, scale:0.9+(s%4)*0.15 });
  }
  return positions;
};

function DownloadModal({ onTxt, onPdf, onCancel }: { onTxt: () => void, onPdf: () => void, onCancel: () => void }) {
  const [closing, setClosing] = useState(false);
  const handleCancel = () => { setClosing(true); setTimeout(onCancel, 200); };
  return (
    <div className="modal-bg" onClick={handleCancel} style={{zIndex:1100}}>
      <div className={`modal ${closing?'modal-closing':''}`} onClick={e=>e.stopPropagation()} style={{maxWidth:340,padding:"32px 24px",textAlign:"center"}}>
        <div style={{width:54,height:54,borderRadius:"50%",background:"rgba(196,149,106,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <Ic d={IC.download} size={24} color="var(--accent)"/>
        </div>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.45rem",color:"var(--ink)",marginBottom:10,fontWeight:500}}>Unduh Catatan</h3>
        <p style={{fontFamily:"'Lora',serif",fontSize:".88rem",color:"var(--ink2)",lineHeight:1.6,marginBottom:28}}>Pilih format berkas untuk menyimpan catatan ini ke perangkatmu.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
          <button className="gb" onClick={onTxt} style={{justifyContent:"center",padding:"14px",borderRadius:12,background:"var(--surface)",border:"1.5px solid var(--line)",fontSize:".9rem",gap:10,width:"100%"}}>
            <Ic d={IC.dots} size={16} color="var(--ink2)"/> Catatan Teks (.txt)
          </button>
          <button className="gb" onClick={onPdf} style={{justifyContent:"center",padding:"14px",borderRadius:12,background:"var(--accent)",color:"#fff",border:"none",fontSize:".9rem",gap:10,width:"100%",boxShadow:"0 4px 12px rgba(196,149,106,0.25)"}}>
            <Ic d={IC.edit} size={16} color="#fff"/> Dokumen PDF (.pdf)
          </button>
        </div>
        <button onClick={handleCancel} style={{background:"none",border:"none",color:"var(--ink3)",fontSize:".8rem",fontFamily:"'Lora',serif",cursor:"pointer",textDecoration:"underline"}}>Batal</button>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ───
function DeleteModal({ entry, onConfirm, onCancel }: { entry: any; onConfirm: () => void; onCancel: () => void }) {
  const [closing, setClosing] = useState(false);
  const m = entry?.mood != null ? MOODS[entry.mood] : null;
  const dateObj = entry?.date ? new Date(entry.date + "T00:00:00") : new Date();

  const handleCancel = () => {
    setClosing(true);
    setTimeout(onCancel, 200);
  };
  const handleConfirm = () => {
    setClosing(true);
    setTimeout(onConfirm, 200);
  };

  return (
    <div className="modal-bg" onClick={handleCancel}>
      <div className={`modal${closing ? ' modal-closing' : ''}`} onClick={e=>e.stopPropagation()}>
        {/* Top accent — mood colored or default warm */}
        <div style={{
          height: 3,
          background: m ? `linear-gradient(90deg, ${m.color}, ${m.border})` : "linear-gradient(90deg, var(--accent), var(--accent-soft))",
        }} />

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #FEF5F1, #FDF0EA)",
            border: "1px solid #F0D5CA",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, margin: "0 auto 20px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" opacity=".5" />
            </svg>
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.4rem", fontWeight: 500,
            color: "var(--ink)", marginBottom: 8, lineHeight: 1.3,
          }}>
            Hapus catatan ini?
          </h3>

          <p style={{
            fontFamily: "'Lora', serif",
            fontSize: ".88rem", color: "var(--ink2)",
            lineHeight: 1.6, marginBottom: 20,
          }}>
            Catatan ini akan hilang selamanya dan tidak bisa dikembalikan.
          </p>

          {/* Entry preview card */}
          {entry && (entry.title || entry.text) && (
            <div style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: m?.bg || "var(--bg)",
              border: `1px solid ${m?.border || "var(--line)"}`,
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Left accent bar */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                background: m?.color || "var(--accent-soft)",
                borderRadius: "12px 0 0 12px",
              }} />

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontFamily: "'Lora', serif", fontSize: ".7rem",
                  color: m?.color || "var(--ink3)",
                }}>
                  {dateObj.getDate()} {MONTHS[dateObj.getMonth()]}
                </span>
                {m && <span style={{ fontSize: ".8rem" }}>{m.emoji}</span>}
                {entry.stickers?.length > 0 && (
                  <span style={{ fontSize: ".6rem", opacity: .6 }}>
                    {entry.stickers.slice(0, 3).join("")}
                  </span>
                )}
              </div>

              {entry.title && (
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: ".98rem", fontWeight: 500,
                  color: "var(--ink)", marginBottom: 3,
                  lineHeight: 1.3,
                }}>
                  {entry.title}
                </p>
              )}
              {entry.text && (
                <p style={{
                  fontFamily: "'Lora', serif",
                  fontSize: ".78rem", color: "var(--ink2)",
                  lineHeight: 1.5,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                }}>
                  {getPreviewText(entry.text)}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleCancel}
              style={{
                flex: 1, padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid var(--line)",
                background: "var(--surface)",
                color: "var(--ink2)",
                fontFamily: "'Lora', serif",
                fontSize: ".88rem", fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink3)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink2)"; }}
            >
              Simpan
            </button>
            <button
              onClick={handleConfirm}
              style={{
                flex: 1, padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #E8C4B8",
                background: "linear-gradient(135deg, #C27054, #B5624A)",
                color: "#fff",
                fontFamily: "'Lora', serif",
                fontSize: ".88rem", fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s",
                boxShadow: "0 2px 8px rgba(194, 112, 84, 0.2)",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(194, 112, 84, 0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(194, 112, 84, 0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteManyModal({ count, hasLocked, onConfirm, onCancel }: { count: number; hasLocked: boolean; onConfirm: () => void; onCancel: () => void }) {
  const [closing, setClosing] = useState(false);
  const handleCancel = () => { setClosing(true); setTimeout(onCancel, 200); };
  const handleConfirm = () => { setClosing(true); setTimeout(onConfirm, 200); };
  return (
    <div className="modal-bg" onClick={handleCancel}>
      <div className={`modal${closing ? ' modal-closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #C04040, #E06060)" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FEF5F1", border: "1px solid #F0D5CA", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6" opacity=".5"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 500, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
            Hapus {count} catatan?
          </h3>
          <p style={{ fontFamily: "'Lora', serif", fontSize: ".88rem", color: "var(--ink2)", lineHeight: 1.6, marginBottom: hasLocked ? 16 : 24, textAlign: "center" }}>
            Semua catatan yang dipilih akan hilang selamanya dan tidak bisa dikembalikan.
          </p>
          {hasLocked && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#FEF5F1", border: "1px solid #F0D5CA", marginBottom: 24 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ fontFamily: "'Lora', serif", fontSize: ".78rem", color: "#B5705A", margin: 0, lineHeight: 1.5 }}>Termasuk catatan yang terkunci. Identitas sudah diverifikasi.</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCancel} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink2)", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer" }}>Batal</button>
            <button onClick={handleConfirm} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E8C4B8", background: "linear-gradient(135deg, #C27054, #B5624A)", color: "#fff", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", boxShadow: "0 2px 8px rgba(194,112,84,.2)" }}>Hapus Semua</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [closing, setClosing] = useState(false);
  const handleCancel = () => { setClosing(true); setTimeout(onCancel, 200); };
  const handleConfirm = () => { setClosing(true); setTimeout(onConfirm, 200); };
  return (
    <div className="modal-bg" onClick={handleCancel}>
      <div className={`modal${closing ? ' modal-closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--accent-soft))" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #FEF5F1, #FDF0EA)",
            border: "1px solid #F0D5CA",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B5705A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 500, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
            Logout?
          </h3>
          <p style={{ fontFamily: "'Lora', serif", fontSize: ".88rem", color: "var(--ink2)", lineHeight: 1.6, marginBottom: 24, textAlign: "center" }}>
            Kamu akan keluar dari akun ini.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCancel} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink2)", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink3)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink2)"; }}>
              Batal
            </button>
            <button onClick={handleConfirm} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E8C4B8", background: "linear-gradient(135deg, #C27054, #B5624A)", color: "#fff", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", transition: "all .2s", boxShadow: "0 2px 8px rgba(194, 112, 84, 0.2)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(194, 112, 84, 0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(194, 112, 84, 0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotifPermissionModal({ onAllow, onLater }: { onAllow: () => void; onLater: () => void }) {
  const [closing, setClosing] = useState(false);
  const handleLater = () => { setClosing(true); setTimeout(onLater, 200); };
  const handleAllow = () => { setClosing(true); setTimeout(onAllow, 200); };
  return (
    <div className="modal-bg" onClick={handleLater}>
      <div className={`modal${closing ? ' modal-closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent), var(--accent-soft))" }} />
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #FFF8ED, #FFF0D4)",
            border: "1px solid #F0D9A8",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4956A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 500, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3, textAlign: "center" }}>
            Aktifkan Pengingat Streak
          </h3>
          <p style={{ fontFamily: "'Lora', serif", fontSize: ".88rem", color: "var(--ink2)", lineHeight: 1.7, marginBottom: 24, textAlign: "center" }}>
            Izinkan notifikasi agar kami bisa mengingatkanmu menulis setiap hari dan menjaga streakmu tetap hidup 🔥
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleLater} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink2)", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink3)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink2)"; }}>
              Nanti
            </button>
            <button onClick={handleAllow} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E8D9A8", background: "linear-gradient(135deg, #C4956A, #B5844A)", color: "#fff", fontFamily: "'Lora', serif", fontSize: ".88rem", fontWeight: 500, cursor: "pointer", transition: "all .2s", boxShadow: "0 2px 8px rgba(196,149,106,0.25)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(196,149,106,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(196,149,106,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Izinkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StickerPicker({ stickers = [], onToggle, onClose }: { stickers: string[]; onToggle: (s: string) => void; onClose: () => void }) {
  const [cat, setCat] = useState(0);
  return (
    <div style={{
      background:"var(--surface)",border:"1px solid var(--line)",borderRadius:16,
      padding:"16px 18px",boxShadow:"0 8px 32px rgba(46,37,32,0.1)",
      animation:"fadeUp .3s ease both",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:"var(--ink)",fontWeight:500}}>Stiker & Dekorasi</span>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink3)",display:"flex"}}>
          <Ic d={IC.x} size={16} sw={1.8}/>
        </button>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {STICKER_CATS.map((c,i) => (
          <button key={i} onClick={()=>setCat(i)}
            style={{
              padding:"5px 12px",borderRadius:16,border:"1px solid",whiteSpace:"nowrap",
              borderColor: cat===i ? "var(--accent)" : "var(--line)",
              background: cat===i ? "var(--accent-soft)" : "transparent",
              color: cat===i ? "var(--accent)" : "var(--ink2)",
              fontFamily:"'Lora',serif",fontSize:".72rem",cursor:"pointer",transition:"all .2s",
            }}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {STICKER_CATS[cat].stickers.map((s,i) => {
          const active = stickers.includes(s);
          return (
            <button key={i} onClick={()=>onToggle(s)}
              style={{
                width:38,height:38,borderRadius:10,border:"1.5px solid",
                borderColor: active ? "var(--accent)" : "transparent",
                background: active ? "var(--accent-soft)" : "transparent",
                fontSize:"1.25rem",cursor:"pointer",transition:"all .15s",
                display:"flex",alignItems:"center",justifyContent:"center",
                transform: active ? "scale(1.1)" : "scale(1)",
              }}>
              {s}
            </button>
          );
        })}
      </div>
      {stickers.length > 0 && (
        <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid var(--line)"}}>
          <p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",marginBottom:8}}>Terpilih ({stickers.length})</p>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {stickers.map((s,i) => (
              <button key={i} onClick={()=>onToggle(s)}
                style={{
                  width:32,height:32,borderRadius:8,border:"1px solid var(--line)",
                  background:"var(--surface)",fontSize:"1.05rem",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StickerDisplay({ stickers = [] }: { stickers: string[] }) {
  if (!stickers.length) return null;
  const positions = stickerPositions(stickers.length);
  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {stickers.map((s, i) => {
        const p = positions[i];
        return (
          <span key={i} style={{
            position:"absolute", top:`${p.top}%`, left:`${p.left}%`,
            transform:`rotate(${p.rot}deg) scale(${p.scale})`,
            fontSize:"1.6rem", opacity:.18,
            animation:`fadeUp .6s ease ${.1+i*.08}s both`,
            userSelect:"none",
          }}>{s}</span>
        );
      })}
    </div>
  );
}

function BottomSheet({ onClose, title, children }: { onClose: () => void; title?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const dragY = useRef(0);

  // Touch handlers attached ONLY to the handle pill — avoids conflicts with inner scroll
  const onHandleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // prevent scroll while dragging handle
    startY.current = e.touches[0].clientY;
    dragY.current = 0;
    if (ref.current) {
      ref.current.style.transition = "none";
      ref.current.style.willChange = "transform";
    }
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    dragY.current = dy;
    if (ref.current) ref.current.style.transform = `translateY(${dy}px)`;
  };
  const onHandleTouchEnd = () => {
    if (!ref.current) return;
    ref.current.style.willChange = "auto";
    if (dragY.current > 80) {
      // snap to close with animation
      ref.current.style.transition = "transform .26s cubic-bezier(.4,0,1,1)";
      ref.current.style.transform = "translateY(110%)";
      setTimeout(onClose, 260);
    } else {
      // snap back with spring
      ref.current.style.transition = "transform .32s cubic-bezier(.16,1,.3,1)";
      ref.current.style.transform = "translateY(0)";
    }
  };

  return (
    <>
      <div className="asheet-bg" onClick={onClose}/>
      <div ref={ref} className="asheet">
        {/* Handle — larger tap area (32px), visual pill in center */}
        <div
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          style={{ padding: "14px 0 10px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "grab", touchAction: "none", userSelect: "none" }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--line)" }}/>
        </div>
        {title && <p className="asheet-title">{title}</p>}
        {children}
      </div>
    </>
  );
}

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.error) setError("Email atau password salah.");
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (res.ok) { await signIn("credentials", { email, password, redirect: false }); }
        else { setError(data.error || "Pendaftaran gagal."); }
      }
    } catch (err) { setError("Terjadi kesalahan. Coba lagi."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:20, fontFamily:"'Lora',serif" }}>
      <div style={{ width:"100%", maxWidth:400, background:"var(--surface)", padding:40, borderRadius:24, boxShadow:"var(--shadow)", border:"1px solid var(--line)" }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2.4rem", textAlign:"center", marginBottom:8, color:"var(--ink)" }}>Catatanku</h1>
        <p style={{ textAlign:"center", color:"var(--ink2)", fontSize:".9rem", marginBottom:32 }}>
          {isLogin ? "Selamat datang kembali." : "Mulai perjalanan menulismu."}
        </p>
        <form onSubmit={handleSubmit} style={{display:"flex", flexDirection:"column", gap:16}}>
          {!isLogin && <input type="text" placeholder="Nama Lengkap" value={name} onChange={e=>setName(e.target.value)} required style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", outline:"none" }}/>}
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", outline:"none" }}/>
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required style={{ padding:"12px 16px", borderRadius:12, border:"1px solid var(--line)", background:"var(--bg)", fontFamily:"'Lora',serif", outline:"none" }}/>
          {error && <p style={{color:"#C27054", fontSize:".8rem", textAlign:"center"}}>{error}</p>}
          <button type="submit" disabled={loading} style={{ padding:"14px", borderRadius:12, border:"none", background:"var(--accent)", color:"#fff", fontFamily:"'Lora',serif", fontWeight:600, cursor:"pointer", marginTop:8, transition:"opacity .2s" }}>
            {loading ? "Memproses..." : (isLogin ? "Masuk" : "Daftar")}
          </button>
        </form>
        <p style={{textAlign:"center", marginTop:24, fontSize:".85rem", color:"var(--ink2)"}}>
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button onClick={()=>setIsLogin(!isLogin)} style={{background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontWeight:600}}>
            {isLogin ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  );
}

function UnlockModal({ onUnlock, onClose, error, setError, title = "Verifikasi Identitas", description = "Masukkan kata sandi akunmu untuk membuka catatan ini.", actionLabel = "Buka Catatan", accentColor }: { onUnlock: (p: string) => void; onClose: () => void; error: string; setError: (s: string) => void; title?: string; description?: string; actionLabel?: string; accentColor?: string }) {
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);
  useEffect(() => { if (error) setLoading(false); }, [error]);

  const handleSubmit = () => {
    if (!p.trim()) { setError("Kata sandi tidak boleh kosong."); return; }
    setLoading(true);
    setError("");
    onUnlock(p);
  };

  const btnBg = accentColor || "var(--accent)";

  return (
    <div className="modal-bg">
      <div className="modal" style={{padding: 0, overflow: "hidden", textAlign: "left"}}>
        <div style={{height: 4, background: accentColor ? `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` : "linear-gradient(90deg, var(--accent), var(--accent-soft))"}}/>
        <div style={{padding: "24px 28px 28px"}}>
          <div style={{width: 48, height: 48, borderRadius: 14, background: accentColor ? `${accentColor}18` : "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: accentColor || "var(--accent)"}}>
            <Ic d={IC.lock} size={24} sw={2}/>
          </div>

          <h2 style={{fontFamily: "'Cormorant Garamond',serif", fontSize: "1.6rem", fontWeight: 600, color: "var(--ink)", marginBottom: 6}}>{title}</h2>
          <p style={{fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", lineHeight: 1.65, marginBottom: 28}}>{description}</p>

          {/* Password input */}
          <div style={{position: "relative", marginBottom: 12}}>
            <input
              ref={inputRef}
              type="password"
              value={p}
              onChange={e => { setP(e.target.value); if (error) setError(""); }}
              placeholder="Kata sandi..."
              onKeyDown={e => e.key === "Enter" && !loading && handleSubmit()}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12,
                border: `1.5px solid ${error ? "#D4856A" : "var(--line)"}`,
                fontSize: ".9rem", background: "var(--surface)",
                fontFamily: "'Lora',serif", color: "var(--ink)",
                outline: "none", boxSizing: "border-box",
                transition: "border-color .2s",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 16}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C27054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{color: "#C27054", fontSize: ".78rem", fontFamily: "'Lora',serif", margin: 0}}>{error}</p>
            </div>
          )}

          {/* Buttons */}
          <button
            className="gb" onClick={handleSubmit} disabled={loading}
            style={{width: "100%", padding: "13px", borderRadius: 12, background: btnBg, color: "#fff", fontWeight: 600, fontSize: ".9rem", fontFamily: "'Lora',serif", marginBottom: 10, opacity: loading ? 0.7 : 1, transition: "opacity .2s"}}>
            {loading ? "Memverifikasi..." : actionLabel}
          </button>
          <button className="gb" onClick={onClose} style={{width: "100%", padding: "10px", borderRadius: 12, fontSize: ".82rem", color: "var(--ink3)", fontFamily: "'Lora',serif"}}>
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ shareId, isLocked, onClose, onShare, onRevoke }: { shareId: string|null; isLocked?: boolean; onClose: () => void; onShare: () => void; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' && shareId ? `${window.location.origin}/share/${shareId}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: "hidden", textAlign: "left" }}>
        <div style={{ height: 4, background: "linear-gradient(90deg, var(--accent), var(--accent-soft))" }} />
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 20px", color: "var(--accent)" }}>
            <Ic d={IC.share} size={22} sw={2} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.5rem", fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Bagikan Catatan</h2>
          <p style={{ fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", lineHeight: 1.65, marginBottom: 24 }}>
            {isLocked ? "Catatan yang terkunci tidak bisa dibagikan secara publik." : shareId ? "Siapapun dengan tautan ini dapat membaca catatan ini." : "Buat tautan publik untuk berbagi catatan ini."}
          </p>
          {isLocked ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--line)", marginBottom: 8 }}>
              <Ic d={IC.lock} size={16} color="var(--ink3)"/>
              <p style={{ fontFamily: "'Lora',serif", fontSize: ".82rem", color: "var(--ink3)", margin: 0, lineHeight: 1.5 }}>Lepas kunci catatan terlebih dahulu untuk bisa membagikannya.</p>
            </div>
          ) : shareId ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--line)", fontFamily: "'Lora',serif", fontSize: ".78rem", color: "var(--ink2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</div>
                <button onClick={copyLink} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: copied ? "var(--accent)" : "var(--accent-soft)", color: copied ? "#fff" : "var(--accent)", fontFamily: "'Lora',serif", fontSize: ".84rem", cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap", fontWeight: 500 }}>
                  {copied ? "✓ Tersalin" : "Salin"}
                </button>
              </div>
              <button onClick={onRevoke} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1px solid #F0D5CA", background: "transparent", color: "#B5705A", fontFamily: "'Lora',serif", fontSize: ".84rem", cursor: "pointer", marginBottom: 8 }}>Hapus Tautan</button>
            </>
          ) : (
            <button onClick={onShare} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "'Lora',serif", fontSize: ".9rem", fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>Buat Tautan Publik</button>
          )}
          <button className="gb" onClick={onClose} style={{ width: "100%", padding: "10px", borderRadius: 12, fontSize: ".82rem", color: "var(--ink3)" }}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

const toggleTodoLine = (text: string, lineIdx: number): string => {
  const lines = text.split('\n');
  const line = lines[lineIdx];
  if (line.startsWith('--x ')) lines[lineIdx] = '-- ' + line.slice(4);
  else if (line === '--x') lines[lineIdx] = '--';
  else if (line.startsWith('-- ')) lines[lineIdx] = '--x ' + line.slice(3);
  else if (line === '--') lines[lineIdx] = '--x';
  return lines.join('\n');
};

type Block =
  | { type: 'text'; content: string }
  | { type: 'todo'; content: string; done: boolean }
  | { type: 'image'; url: string; size?: 'sm' | 'md' | 'lg' | 'full'; align?: 'left' | 'center' | 'right' }
  | { type: 'gallery'; cols: 2 | 3; urls: string[] }
  | { type: 'link'; url: string; title?: string; description?: string; image?: string; favicon?: string }
  | { type: 'table'; rows: string[][] };

const VALID_SIZES = new Set(['sm','md','lg','full']);
const VALID_ALIGNS = new Set(['left','center','right']);

const parseBlocks = (raw: string): Block[] => {
  // Pre-process: ensure [IMAGE:] and [GALLERY:] markers are always on their own line.
  // Handles: <div>[IMAGE:url]</div>, text<div>[IMAGE:]</div>more, and other embedded cases.
  const pre = (raw || '')
    .replace(/<div[^>]*>(\[(?:IMAGE|GALLERY):[^\]]+\])<\/div>/gi, '\n$1\n')
    .replace(/([^\n])(\[(?:IMAGE|GALLERY):[^\]]+\])/g, '$1\n$2')
    .replace(/(\[(?:IMAGE|GALLERY):[^\]]+\])(?=[^\n])/g, '$1\n');
  const lines = pre.split('\n');
  const out: Block[] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (line.startsWith('[IMAGE:') && line.endsWith(']')) {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const parts = line.slice(7, -1).split('|');
      let align: 'left'|'center'|'right'|undefined;
      let size: 'sm'|'md'|'lg'|'full'|undefined;
      if (parts.length > 1 && VALID_ALIGNS.has(parts[parts.length - 1])) align = parts.pop() as any;
      if (parts.length > 1 && VALID_SIZES.has(parts[parts.length - 1])) size = parts.pop() as any;
      out.push({ type: 'image', url: parts.join('|'), size, align });
    } else if (line.startsWith('[GALLERY:') && line.endsWith(']')) {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const inner = line.slice(9, -1);
      const parts = inner.split('|');
      const cols = (parseInt(parts[0]) === 3 ? 3 : 2) as 2 | 3;
      out.push({ type: 'gallery', cols, urls: parts.slice(1) });
    } else if (line.startsWith('[LINK:') && line.endsWith(']')) {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const parts = line.slice(6, -1).split('|');
      out.push({ type: 'link', url: parts[0]||'', title: decCell(parts[1]||''), description: decCell(parts[2]||''), image: decCell(parts[3]||''), favicon: decCell(parts[4]||'') });
    } else if (line.startsWith('[TABLE:') && line.endsWith(']')) {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      const inner = line.slice(7, -1);
      const pipeIdx = inner.indexOf('|');
      const dim = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
      const [rStr, cStr] = dim.split('x');
      const rows = Math.max(1, parseInt(rStr)||1), cols = Math.max(1, parseInt(cStr)||1);
      const cells = pipeIdx === -1 ? [] : inner.slice(pipeIdx + 1).split('|').map(decCell);
      const tableRows: string[][] = [];
      for (let r = 0; r < rows; r++) tableRows.push(Array.from({ length: cols }, (_, c) => cells[r * cols + c] ?? ''));
      out.push({ type: 'table', rows: tableRows });
    } else if (/^--x?\s/.test(line) || line === '--' || line === '--x') {
      if (buf.length) { out.push({ type: 'text', content: buf.join('\n') }); buf = []; }
      out.push({ type: 'todo', done: line.startsWith('--x'), content: line.replace(/^--x?\s?/, '') });
    } else {
      buf.push(line);
    }
  }
  if (buf.length) out.push({ type: 'text', content: buf.join('\n') });
  if (!out.length) out.push({ type: 'text', content: '' });
  return out;
};

const encCell = (s: string) => s.replace(/\|/g, '{{P}}').replace(/\n/g, '{{N}}');
const decCell = (s: string) => s.replace(/\{\{P\}\}/g, '|').replace(/\{\{N\}\}/g, '\n');

const blocksToText = (blocks: Block[]): string =>
  blocks.map(b =>
    b.type === 'todo' ? (b.done ? '--x ' : '-- ') + b.content :
    b.type === 'image' ? `[IMAGE:${b.url}${b.size ? '|' + b.size : ''}${b.align ? '|' + b.align : ''}]` :
    b.type === 'gallery' ? `[GALLERY:${b.cols}|${b.urls.join('|')}]` :
    b.type === 'link' ? `[LINK:${b.url}|${encCell(b.title||'')}|${encCell(b.description||'')}|${encCell(b.image||'')}|${encCell(b.favicon||'')}]` :
    b.type === 'table' ? `[TABLE:${b.rows.length}x${b.rows[0]?.length||0}|${b.rows.flat().map(encCell).join('|')}]` :
    b.content
  ).join('\n');

const stripHtml = (html: string) => html
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/\s+/g, ' ')
  .trim();
const getLinkImage = (text: string): string => {
  for (const l of (text || '').split('\n')) {
    if (l.startsWith('[LINK:') && l.endsWith(']')) {
      const parts = l.slice(6, -1).split('|');
      const img = decCell(parts[3] || '');
      if (img) return img;
    }
  }
  return '';
};

const getPreviewText = (text: string) =>
  (text || '').split('\n').map(l => {
    if (l.startsWith('[IMAGE:') || l.startsWith('[GALLERY:')) return '';
    if (l.startsWith('[LINK:') && l.endsWith(']')) {
      const parts = l.slice(6, -1).split('|');
      return decCell(parts[1] || '') || parts[0] || '';
    }
    if (l.startsWith('[TABLE:') && l.endsWith(']')) {
      const pipeIdx = l.indexOf('|', 7);
      if (pipeIdx === -1) return '';
      return l.slice(pipeIdx + 1).split('|').slice(0, 5).map(decCell).filter(Boolean).join('  ·  ');
    }
    return stripHtml(l);
  }).filter(Boolean).join('\n');

// ── Inline formatting + line alignment helpers ──────────────────────
function parseLineStyle(line: string): { align: 'left'|'center'|'right'; text: string } {
  if (line.startsWith('::::')) return { align: 'right', text: line.slice(4) };
  if (line.startsWith(':::'))  return { align: 'center', text: line.slice(3) };
  return { align: 'left', text: line };
}

function renderInline(raw: string): React.ReactNode {
  if (!raw.includes('**') && !raw.includes('_')) return raw;
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|_(.+?)_/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) parts.push(raw.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={m.index} style={{fontWeight:700}}>{m[1]}</strong>);
    else parts.push(<em key={m.index} style={{fontStyle:'italic'}}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push(raw.slice(last));
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return <>{parts}</>;
}

function AlignIcon({ align }: { align: 'left'|'center'|'right'|'justify' }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const };
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
      <line {...s} x1="0" y1="1.5" x2="15" y2="1.5"/>
      {align === 'left'    && <><line {...s} x1="0" y1="6"   x2="11" y2="6"/><line {...s} x1="0" y1="10.5" x2="8"  y2="10.5"/></>}
      {align === 'center'  && <><line {...s} x1="2" y1="6"   x2="13" y2="6"/><line {...s} x1="3.5" y1="10.5" x2="11.5" y2="10.5"/></>}
      {align === 'right'   && <><line {...s} x1="4" y1="6"   x2="15" y2="6"/><line {...s} x1="7"   y1="10.5" x2="15" y2="10.5"/></>}
      {align === 'justify' && <><line {...s} x1="0" y1="6"   x2="15" y2="6"/><line {...s} x1="0" y1="10.5" x2="15" y2="10.5"/></>}
    </svg>
  );
}

// Deterministic dummy text — same result for same (words, seed)
const makeDummy = (words: number, seed: string): string => {
  const ch = 'abcdefghijklmnopqrstuvwxyz';
  let n = seed.split('').reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) | 0, 1);
  const rng = () => { n = (Math.imul(n, 1664525) + 1013904223) | 0; return (n >>> 0) / 0x100000000; };
  return Array.from({ length: Math.max(1, words) }, () =>
    Array.from({ length: 3 + Math.floor(rng() * 7) }, () => ch[Math.floor(rng() * 26)]).join('')
  ).join(' ');
};

type PendingMode =
  | { mode: 'insert'; at: number }
  | { mode: 'replace'; at: number }
  | { mode: 'gallery-add'; at: number }
  | { mode: 'gallery-replace'; at: number; idx: number }
  | { mode: 'gallery-new'; at: number };

function LiveEditor({ text, onChange, onUploadImage, placeholder, autoFocus, fontSize: fz = 1.05, fontFamily: ff = "'Lora', serif" }: { text: string; onChange: (t: string) => void; onUploadImage: (file: File) => Promise<string>; placeholder?: string; autoFocus?: boolean; fontSize?: number; fontFamily?: string }) {
  const blocks = parseBlocks(text);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingAt, setUploadingAt] = useState<number | null>(null);
  const pendingMode = useRef<PendingMode | null>(null);
  const savedSplitRef = useRef<{ at: number; before: string; after: string } | null>(null);
  const historyRef = useRef<string[]>([text]);
  const historyPosRef = useRef<number>(0);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusedIdx, setFocusedIdx] = useState<number>(0);
  const [fmtState, setFmtState] = useState<{ bold: boolean; italic: boolean; align: 'left'|'center'|'right'|'justify' }>({ bold: false, italic: false, align: 'left' });
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  const fetchLinkPreview = (url: string, currentBlocks: Block[]) => {
    setLinkLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/notes/link-preview?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const meta = await res.json();
          const nb = parseBlocks(blocksToText(currentBlocks));
          const li = nb.findIndex(b => b.type === 'link' && b.url === url);
          if (li !== -1) { nb[li] = { type: 'link', ...meta }; emit(nb); }
        }
      } finally { setLinkLoading(false); }
    })();
  };

  const syncFmt = () => {
    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const center = document.queryCommandState('justifyCenter');
      const right = document.queryCommandState('justifyRight');
      const justify = document.queryCommandState('justifyFull');
      setFmtState({ bold, italic, align: center ? 'center' : right ? 'right' : justify ? 'justify' : 'left' });
    } catch(_) {}
  };

  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Browser kamu tidak mendukung voice-to-text.\nCoba pakai Chrome atau Edge.'); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'id-ID';
    rec.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (!final) return;
      const fi = focusedIdx;
      const el = refs.current[fi] as HTMLDivElement;
      if (!el || blocks[fi]?.type !== 'text') return;
      el.focus();
      // Place cursor at end if nothing selected
      const sel = window.getSelection();
      if (sel && sel.rangeCount === 0) {
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      document.execCommand('insertText', false, final + ' ');
      captureHtml(fi);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const sanitizeCeHtml = (html: string): string => {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // Strip unwanted inline styles, keep only font-weight, font-style, text-align
    tmp.querySelectorAll<HTMLElement>('[style]').forEach(el => {
      const { fontWeight, fontStyle, textAlign } = el.style;
      el.removeAttribute('style');
      if (fontWeight === 'bold' || parseInt(fontWeight) >= 700) el.style.fontWeight = 'bold';
      if (fontStyle === 'italic') el.style.fontStyle = 'italic';
      if (textAlign && textAlign !== 'left' && textAlign !== 'start') el.style.textAlign = textAlign;
    });
    // Unwrap semantically empty spans (no remaining style)
    tmp.querySelectorAll('span').forEach(span => {
      if (!span.getAttribute('style')) span.replaceWith(...Array.from(span.childNodes));
    });
    return tmp.innerHTML;
  };

  // Convert legacy plain-text content (with \n line breaks) to HTML divs for contenteditable
  const normalizePlainToHtml = (content: string): string => {
    if (/<(?:div|br|strong|em|span)\b/i.test(content)) return content; // already HTML
    return content.split('\n').map(line => {
      const { align, text } = parseLineStyle(line);
      const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/_(.+?)_/g,'<em>$1</em>');
      if (align !== 'left') return `<div style="text-align:${align}">${escaped || '<br>'}</div>`;
      return `<div>${escaped || '<br>'}</div>`;
    }).join('');
  };

  const captureHtml = (fi: number) => {
    const el = refs.current[fi] as HTMLDivElement;
    if (!el) return;
    const html = sanitizeCeHtml(el.innerHTML);
    el.setAttribute('data-last', html);
    const nb = [...blocks]; nb[fi] = { type: 'text', content: html }; emit(nb);
  };

  const applyInline = (cmd: 'bold'|'italic') => {
    const fi = focusedIdx;
    if (blocks[fi]?.type !== 'text') return;
    const el = refs.current[fi] as HTMLDivElement;
    if (!el) return;
    document.execCommand(cmd, false);
    captureHtml(fi);
    syncFmt();
  };

  const applyTextAlign = (align: 'left'|'center'|'right'|'justify') => {
    const fi = focusedIdx;
    if (blocks[fi]?.type !== 'text') return;
    const el = refs.current[fi] as HTMLDivElement;
    if (!el) return;
    const cmd = align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : align === 'justify' ? 'justifyFull' : 'justifyLeft';
    const already = align === 'center' ? document.queryCommandState('justifyCenter')
                  : align === 'right'  ? document.queryCommandState('justifyRight')
                  : align === 'justify' ? document.queryCommandState('justifyFull')
                  : document.queryCommandState('justifyLeft');
    document.execCommand(already && align !== 'left' ? 'justifyLeft' : cmd, false);
    captureHtml(fi);
    syncFmt();
  };

  const focusAt = (idx: number) => setTimeout(() => (refs.current[idx] as HTMLElement)?.focus(), 10);

  const pushHistory = (t: string, immediate: boolean) => {
    const commit = () => {
      if (historyRef.current[historyPosRef.current] === t) return;
      historyRef.current = historyRef.current.slice(0, historyPosRef.current + 1);
      historyRef.current.push(t);
      if (historyRef.current.length > 100) { historyRef.current.shift(); }
      historyPosRef.current = historyRef.current.length - 1;
    };
    if (immediate) {
      if (historyTimerRef.current) { clearTimeout(historyTimerRef.current); historyTimerRef.current = null; }
      commit();
    } else {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
      historyTimerRef.current = setTimeout(commit, 600);
    }
  };
  const undoHistory = () => {
    if (historyPosRef.current <= 0) return;
    historyPosRef.current--;
    onChange(historyRef.current[historyPosRef.current]);
  };
  // debounce=true for text typing, false for block ops
  const emit = (nb: Block[], debounce = false) => {
    if (!nb.length) nb.push({ type: 'text', content: '' });
    const t = blocksToText(nb);
    pushHistory(t, !debounce);
    onChange(t);
  };
  const del = (i: number) => { const nb = blocks.filter((_, j) => j !== i); emit(nb); };
  const move = (i: number, dir: -1 | 1) => { if (i + dir < 0 || i + dir >= blocks.length) return; const nb = [...blocks]; [nb[i], nb[i + dir]] = [nb[i + dir], nb[i]]; emit(nb); };

  // Smart move for image/gallery: steps one paragraph at a time through adjacent text blocks
  const moveMedia = (i: number, dir: -1 | 1) => {
    const adjIdx = i + dir;
    if (adjIdx < 0 || adjIdx >= blocks.length) return;
    const adj = blocks[adjIdx];
    if (adj.type !== 'text') { move(i, dir); return; }

    const content = adj.content;
    const isHtml = /<(?:div|br|strong|em|span)\b/i.test(content);
    const SEP_HTML = '<div><br></div>';
    let splitBefore = "", splitAfter = "", found = false;

    if (dir === -1) {
      // Moving UP → split at LAST paragraph break; keep separator with the "before" half
      if (isHtml) {
        const idx = content.lastIndexOf(SEP_HTML);
        if (idx !== -1) { splitBefore = content.slice(0, idx + SEP_HTML.length); splitAfter = content.slice(idx + SEP_HTML.length); found = true; }
      } else {
        const idx = content.lastIndexOf('\n\n');
        if (idx !== -1) { splitBefore = content.slice(0, idx + 2); splitAfter = content.slice(idx + 2); found = true; }
      }
    } else {
      // Moving DOWN → split at FIRST paragraph break; keep separator with the "after" half
      if (isHtml) {
        const idx = content.indexOf(SEP_HTML);
        if (idx !== -1) { splitBefore = content.slice(0, idx); splitAfter = content.slice(idx); found = true; }
      } else {
        const idx = content.indexOf('\n\n');
        if (idx !== -1) { splitBefore = content.slice(0, idx); splitAfter = content.slice(idx); found = true; }
      }
    }

    if (!found) { move(i, dir); return; }

    const nb = [...blocks];
    const media = nb[i];
    const start = Math.min(i, adjIdx);
    const newBlocks: Block[] = [];
    if (splitBefore) newBlocks.push({ type: 'text', content: splitBefore });
    newBlocks.push(media);
    if (splitAfter) newBlocks.push({ type: 'text', content: splitAfter });
    nb.splice(start, 2, ...newBlocks);
    emit(nb);
  };
  const triggerImageAt = (afterIdx: number) => { pendingMode.current = { mode: 'insert', at: afterIdx }; fileRef.current?.click(); };
  const triggerImageReplace = (idx: number) => { pendingMode.current = { mode: 'replace', at: idx }; fileRef.current?.click(); };
  const triggerGalleryAdd = (at: number) => { pendingMode.current = { mode: 'gallery-add', at }; fileRef.current?.click(); };
  const triggerGalleryNew = (at: number) => { pendingMode.current = { mode: 'gallery-new', at }; fileRef.current?.click(); };
  const setSize = (i: number, size: 'sm' | 'md' | 'lg' | 'full') => {
    const nb = [...blocks];
    if (nb[i].type === 'image') nb[i] = { ...nb[i] as any, size };
    emit(nb);
  };
  const setAlign = (i: number, align: 'left' | 'center' | 'right') => {
    const nb = [...blocks];
    if (nb[i].type === 'image') nb[i] = { ...nb[i] as any, align };
    emit(nb);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const pm = pendingMode.current; e.target.value = ''; pendingMode.current = null;
    if (!pm) return;
    setUploadingAt(pm.at);
    try {
      const url = await onUploadImage(file);
      const nb = [...blocks];
      if (pm.mode === 'insert') {
        const split = savedSplitRef.current;
        savedSplitRef.current = null;
        if (split && split.at === pm.at && blocks[pm.at]?.type === 'text') {
          nb[pm.at] = { type: 'text', content: split.before };
          nb.splice(pm.at + 1, 0, { type: 'image', url });
          nb.splice(pm.at + 2, 0, { type: 'text', content: split.after });
        } else {
          nb.splice(pm.at + 1, 0, { type: 'image', url });
          if (!nb[pm.at + 2] || nb[pm.at + 2].type !== 'text') nb.splice(pm.at + 2, 0, { type: 'text', content: '' });
        }
      } else if (pm.mode === 'replace') {
        nb[pm.at] = { ...nb[pm.at] as any, url };
      } else if (pm.mode === 'gallery-add') {
        const g = nb[pm.at];
        if (g.type === 'gallery') nb[pm.at] = { ...g, urls: [...g.urls, url] };
      } else if (pm.mode === 'gallery-replace') {
        const g = nb[pm.at];
        if (g.type === 'gallery') { const urls = [...g.urls]; urls[pm.idx] = url; nb[pm.at] = { ...g, urls }; }
      } else if (pm.mode === 'gallery-new') {
        nb.splice(pm.at + 1, 0, { type: 'gallery', cols: 2, urls: [url] });
        if (!nb[pm.at + 2] || nb[pm.at + 2].type !== 'text') nb.splice(pm.at + 2, 0, { type: 'text', content: '' });
      }
      emit(nb);
    } catch { /* upload failed silently */ }
    finally { setUploadingAt(null); }
  };

  const handlePasteImage = async (file: File, atIdx: number) => {
    setUploadingAt(atIdx);
    try {
      const url = await onUploadImage(file);
      const nb = [...blocks];
      const split = savedSplitRef.current; savedSplitRef.current = null;
      if (split && split.at === atIdx && nb[atIdx]?.type === 'text') {
        nb[atIdx] = { type: 'text', content: split.before };
        nb.splice(atIdx + 1, 0, { type: 'image', url });
        nb.splice(atIdx + 2, 0, { type: 'text', content: split.after });
      } else {
        nb.splice(atIdx + 1, 0, { type: 'image', url });
        if (!nb[atIdx + 2] || nb[atIdx + 2].type !== 'text') nb.splice(atIdx + 2, 0, { type: 'text', content: '' });
      }
      emit(nb);
    } catch { } finally { setUploadingAt(null); }
  };

  const captureSplit = (i: number) => {
    const sel = window.getSelection();
    const el = refs.current[i] as HTMLDivElement | null;
    if (sel && sel.rangeCount > 0 && el) {
      const selRange = sel.getRangeAt(0);
      if (el.contains(selRange.commonAncestorContainer)) {
        try {
          const beforeRange = document.createRange();
          beforeRange.setStart(el, 0); beforeRange.setEnd(selRange.startContainer, selRange.startOffset);
          const tmpBefore = document.createElement('div'); tmpBefore.appendChild(beforeRange.cloneContents());
          const afterRange = document.createRange();
          afterRange.setStart(selRange.endContainer, selRange.endOffset); afterRange.setEnd(el, el.childNodes.length);
          const tmpAfter = document.createElement('div'); tmpAfter.appendChild(afterRange.cloneContents());
          savedSplitRef.current = { at: i, before: sanitizeCeHtml(tmpBefore.innerHTML), after: sanitizeCeHtml(tmpAfter.innerHTML) };
          return;
        } catch { }
      }
    }
    savedSplitRef.current = null;
  };

  const BlockControls = ({ i }: { i: number }) => (
    <div style={{ display: 'flex', gap: 2, opacity: 0, transition: 'opacity .15s' }} className="blk-ctrl">
      <button onClick={() => move(i, -1)} disabled={i === 0} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink3)', padding: '2px 4px', fontSize: '.72rem', borderRadius: 4 }}>↑</button>
      <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink3)', padding: '2px 4px', fontSize: '.72rem', borderRadius: 4 }}>↓</button>
      <button onClick={() => del(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#C27054', padding: '2px 4px', fontSize: '.72rem', borderRadius: 4 }}>✕</button>
    </div>
  );

  const fmtBtn: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink2)', padding: '4px 8px', borderRadius: 6, transition: 'background .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 };

  return (
    <div>
      <style>{`.blk-ctrl{opacity:0!important}.blk-wrap:hover .blk-ctrl{opacity:1!important}.img-blk:hover .blk-ctrl{opacity:1!important}.fmt-btn:hover{background:var(--line)!important}[contenteditable]:empty:not(:focus)::before{content:attr(data-placeholder);color:var(--ink3);font-style:italic;pointer-events:none}.rich-read strong{font-weight:700}.rich-read em{font-style:italic}.rich-read div{min-height:1.2em}@media(max-width:680px){.blk-ce{padding-right:0!important}}@keyframes mic-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.2)}}`}</style>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {/* ── Formatting toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12, padding: '3px 6px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--line)', width: 'fit-content', flexWrap: 'wrap' as const }}>
        <button className="fmt-btn" title="Tebal (Ctrl+B)"
          onMouseDown={e => e.preventDefault()} onClick={() => applyInline('bold')}
          style={{ ...fmtBtn, fontFamily: "'Lora',serif", fontSize: '.85rem', fontWeight: 700,
            background: fmtState.bold ? 'var(--accent-soft)' : 'none',
            color: fmtState.bold ? 'var(--accent)' : 'var(--ink2)' }}>B</button>
        <button className="fmt-btn" title="Miring (Ctrl+I)"
          onMouseDown={e => e.preventDefault()} onClick={() => applyInline('italic')}
          style={{ ...fmtBtn, fontFamily: "'Lora',serif", fontSize: '.85rem', fontStyle: 'italic',
            background: fmtState.italic ? 'var(--accent-soft)' : 'none',
            color: fmtState.italic ? 'var(--accent)' : 'var(--ink2)' }}>I</button>
        <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 3px' }} />
        {(['left','center','right','justify'] as const).map(al => (
          <button key={al} className="fmt-btn"
            title={al === 'left' ? 'Rata kiri (Ctrl+L)' : al === 'center' ? 'Tengah (Ctrl+E)' : al === 'right' ? 'Rata kanan (Ctrl+R)' : 'Rata kanan-kiri (Ctrl+J)'}
            onMouseDown={e => e.preventDefault()} onClick={() => applyTextAlign(al)}
            style={{ ...fmtBtn,
              background: fmtState.align === al ? 'var(--accent-soft)' : 'none',
              color: fmtState.align === al ? 'var(--accent)' : 'var(--ink2)' }}>
            <AlignIcon align={al} />
          </button>
        ))}
        <div style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 3px' }} />
        <button className="fmt-btn" title={isRecording ? 'Stop recording' : 'Voice to text'}
          onMouseDown={e => e.preventDefault()} onClick={toggleVoice}
          style={{ ...fmtBtn, fontSize: '1rem', padding: '3px 7px',
            background: isRecording ? 'var(--accent-soft)' : 'none',
            color: isRecording ? 'var(--accent)' : 'var(--ink2)',
            animation: isRecording ? 'mic-pulse 1.2s ease-in-out infinite' : 'none' }}>
          🎙️
        </button>
      </div>

      {blocks.map((block, i) => {
        if (block.type === 'image') {
          const imgSize = block.size || 'full';
          const imgAlign = block.align || 'left';
          const sizeW: Record<string, string> = { sm: '40%', md: '65%', lg: '85%', full: '100%' };
          const marginMap: Record<string, string> = { left: '0 auto 0 0', center: '0 auto', right: '0 0 0 auto' };
          const btnBase: React.CSSProperties = { padding: '3px 7px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.68rem', fontWeight: 600, transition: 'background .15s' };
          return (
            <div key={`${i}-img`} className="img-blk" style={{ margin: '12px 0' }}>
              <div style={{ position: 'relative', display: 'block', width: sizeW[imgSize], margin: marginMap[imgAlign], borderRadius: 12, overflow: 'hidden', background: 'var(--line)' }}>
                <img src={block.url} alt="" style={{ width: '100%', display: 'block', borderRadius: 12, maxHeight: 480, objectFit: 'cover' }} />
                <div className="blk-ctrl" style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                  <button onClick={() => moveMedia(i, -1)} disabled={i === 0} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                  <button onClick={() => moveMedia(i, 1)} disabled={i === blocks.length - 1} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                  <button onClick={() => del(i)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(180,60,40,.7)', color: '#fff', cursor: 'pointer', fontSize: '.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div className="blk-ctrl" style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => triggerImageReplace(i)} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(0,0,0,.4)', color: '#fff', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.7rem' }}>📷 Ganti</button>
                  {/* Size */}
                  <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,.35)', borderRadius: 7, padding: '2px 3px' }}>
                    {(['sm','md','lg','full'] as const).map(sz => (
                      <button key={sz} onClick={() => setSize(i, sz)} style={{ ...btnBase, background: imgSize === sz ? 'rgba(255,255,255,.85)' : 'transparent', color: imgSize === sz ? '#333' : '#ddd' }}>
                        {sz === 'sm' ? 'S' : sz === 'md' ? 'M' : sz === 'lg' ? 'L' : '⬛'}
                      </button>
                    ))}
                  </div>
                  {/* Align — only useful when not full width */}
                  {imgSize !== 'full' && (
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,.35)', borderRadius: 7, padding: '2px 3px' }}>
                      {(['left','center','right'] as const).map(al => (
                        <button key={al} onClick={() => setAlign(i, al)} style={{ ...btnBase, background: imgAlign === al ? 'rgba(255,255,255,.85)' : 'transparent', color: imgAlign === al ? '#333' : '#ddd' }}>
                          {al === 'left' ? '⇤' : al === 'center' ? '↔' : '⇥'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
        if (block.type === 'gallery') {
          const g = block;
          const colsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: `repeat(${g.cols}, 1fr)`, gap: 6, borderRadius: 12, overflow: 'hidden' };
          const btnTiny: React.CSSProperties = { width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,.5)', color: '#fff', cursor: 'pointer', fontSize: '.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' };
          const btnPill: React.CSSProperties = { padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '.68rem', fontWeight: 600 };
          return (
            <div key={`${i}-gallery`} className="img-blk" style={{ margin: '12px 0' }}>
              <div style={colsStyle}>
                {g.urls.map((url, j) => (
                  <div key={j} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'var(--line)' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div className="blk-ctrl" style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 3 }}>
                      <button onClick={() => { pendingMode.current = { mode: 'gallery-replace', at: i, idx: j }; fileRef.current?.click(); }} style={btnTiny} title="Ganti foto">↺</button>
                      <button onClick={() => { const urls = g.urls.filter((_,k)=>k!==j); const nb=[...blocks]; nb[i]={...g,urls}; emit(nb); }} style={{ ...btnTiny, background: 'rgba(180,60,40,.6)' }} title="Hapus foto">✕</button>
                    </div>
                  </div>
                ))}
                {uploadingAt === i && (
                  <div style={{ borderRadius: 8, background: 'var(--line)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Lora',serif", fontSize: '.7rem', color: 'var(--ink3)' }}>...</span>
                  </div>
                )}
                <button onClick={() => triggerGalleryAdd(i)} style={{ borderRadius: 8, background: 'var(--line)', aspectRatio: '1', border: '1.5px dashed var(--ink3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', fontSize: '1.2rem' }}>+</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 3, background: 'var(--line)', borderRadius: 7, padding: '3px 4px' }}>
                  {([2,3] as const).map(c => (
                    <button key={c} onClick={() => { const nb=[...blocks]; nb[i]={...g,cols:c}; emit(nb); }} style={{ ...btnPill, background: g.cols===c ? 'var(--accent)' : 'transparent', color: g.cols===c ? '#fff' : 'var(--ink3)' }}>{c} kolom</button>
                  ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button onClick={() => moveMedia(i, -1)} disabled={i===0} style={{ ...btnTiny, background: 'var(--line)', color: 'var(--ink3)' }}>↑</button>
                  <button onClick={() => moveMedia(i, 1)} disabled={i===blocks.length-1} style={{ ...btnTiny, background: 'var(--line)', color: 'var(--ink3)' }}>↓</button>
                  <button onClick={() => del(i)} style={{ ...btnTiny, background: 'rgba(180,60,40,.12)', color: '#C27054' }}>✕</button>
                </div>
              </div>
            </div>
          );
        }
        if (block.type === 'todo') {
          return (
            <div key={`${i}-todo`} className="blk-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
              <button onClick={() => { const nb = [...blocks]; nb[i] = { ...block, done: !block.done }; emit(nb); }} style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: `2px solid ${block.done ? 'var(--accent)' : 'var(--ink3)'}`, background: block.done ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                {block.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
              <input ref={el => { refs.current[i] = el; }} value={block.content}
                onFocus={() => setFocusedIdx(i)}
                onChange={e => { const nb = [...blocks]; nb[i] = { ...block, content: e.target.value }; emit(nb); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); const nb = [...blocks]; nb.splice(i + 1, 0, { type: 'todo', done: false, content: '' }); emit(nb); focusAt(i + 1); }
                  if (e.key === 'Backspace' && !block.content) { e.preventDefault(); const nb = blocks.filter((_, j) => j !== i); emit(nb); focusAt(Math.max(0, i - 1)); }
                }}
                style={{ flex: 1, fontFamily: ff, fontSize: `${fz}rem`, lineHeight: 2.1, color: block.done ? 'var(--ink3)' : 'var(--ink)', textDecoration: block.done ? 'line-through' : 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0 }}
              />
              <BlockControls i={i} />
            </div>
          );
        }
        // link preview block
        if (block.type === 'link') {
          let hostname = '';
          try { hostname = new URL(block.url).hostname; } catch(_) {}
          return (
            <div key={`${i}-link`} className="img-blk" style={{ margin: '10px 0', position: 'relative' }}>
              <a href={block.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg)', textDecoration: 'none', color: 'inherit', transition: 'box-shadow .2s', overflow: 'hidden' }}>
                {block.image && (
                  <img src={block.image} alt="" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    {block.favicon && <img src={block.favicon} alt="" style={{ width: 13, height: 13, borderRadius: 2, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <span style={{ fontSize: '.68rem', color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hostname}</span>
                  </div>
                  <div style={{ fontFamily: ff, fontSize: '.88rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.title || block.url}</div>
                  {block.description && <div style={{ fontSize: '.76rem', color: 'var(--ink2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{block.description}</div>}
                </div>
              </a>
              <div className="blk-ctrl" style={{ position: 'absolute', top: 6, right: 6 }}>
                <button onClick={() => del(i)} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(180,60,40,.7)', color: '#fff', cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>
          );
        }
        // table block
        if (block.type === 'table') {
          const updateCell = (r: number, c: number, val: string) => {
            const nb = [...blocks];
            const newRows = block.rows.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? val : cell));
            nb[i] = { type: 'table', rows: newRows };
            emit(nb);
          };
          const addRow = () => { const nb = [...blocks]; nb[i] = { type: 'table', rows: [...block.rows, Array(block.rows[0]?.length||1).fill('')] }; emit(nb); };
          const addCol = () => { const nb = [...blocks]; nb[i] = { type: 'table', rows: block.rows.map(r => [...r, '']) }; emit(nb); };
          const delRow = (r: number) => { if (block.rows.length <= 1) return; const nb = [...blocks]; nb[i] = { type: 'table', rows: block.rows.filter((_,ri) => ri !== r) }; emit(nb); };
          const delCol = (c: number) => { if ((block.rows[0]?.length||0) <= 1) return; const nb = [...blocks]; nb[i] = { type: 'table', rows: block.rows.map(r => r.filter((_,ci) => ci !== c)) }; emit(nb); };
          const cols = block.rows[0]?.length || 1;
          return (
            <div key={`${i}-table`} className="img-blk" style={{ margin: '10px 0', overflowX: 'auto', position: 'relative' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: ff, fontSize: `${fz * 0.9}rem` }}>
                <tbody>
                  {block.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c} style={{ border: '1px solid var(--line)', padding: 0, minWidth: 100, position: 'relative', verticalAlign: 'top' }}>
                          <textarea
                            value={cell}
                            rows={1}
                            onChange={e => updateCell(r, c, e.target.value)}
                            ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                            onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }}
                            style={{ width: '100%', padding: '7px 8px', border: 'none', outline: 'none', background: r === 0 ? 'var(--bg)' : 'transparent', fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--ink)', fontWeight: r === 0 ? 600 : 400, boxSizing: 'border-box' as const, resize: 'none', overflow: 'hidden', lineHeight: '1.6', display: 'block', minHeight: 34 }}
                          />
                          {r === 0 && (
                            <button onClick={() => delCol(c)} className="blk-ctrl" title="Hapus kolom" style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 4, border: 'none', background: 'rgba(180,60,40,.65)', color: '#fff', cursor: 'pointer', fontSize: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                          )}
                        </td>
                      ))}
                      <td style={{ border: 'none', padding: '0 4px' }}>
                        <button onClick={() => delRow(r)} className="blk-ctrl" title="Hapus baris" style={{ width: 18, height: 18, borderRadius: 5, border: 'none', background: 'rgba(180,60,40,.55)', color: '#fff', cursor: 'pointer', fontSize: '.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button onClick={addRow} style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 7, padding: '3px 10px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.7rem', color: 'var(--ink3)' }}>+ Baris</button>
                <button onClick={addCol} style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 7, padding: '3px 10px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.7rem', color: 'var(--ink3)' }}>+ Kolom</button>
                <button onClick={() => del(i)} style={{ border: '1px dashed rgba(180,60,40,.4)', background: 'none', borderRadius: 7, padding: '3px 10px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.7rem', color: 'rgba(180,60,40,.7)' }}>Hapus tabel</button>
              </div>
              {/* Click area to add a text block below the table */}
              <div
                onClick={() => {
                  const nextBlock = blocks[i + 1];
                  if (nextBlock?.type === 'text') { focusAt(i + 1); return; }
                  const nb = [...blocks];
                  nb.splice(i + 1, 0, { type: 'text', content: '' });
                  emit(nb);
                  setTimeout(() => focusAt(i + 1), 30);
                }}
                style={{ marginTop: 2, height: 36, cursor: 'text', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 4 }}
              />
            </div>
          );
        }
        // text block
        return (
          <div key={`${i}-text`} className="blk-wrap" style={{ position: 'relative' }}>
            <div
              ref={el => {
                refs.current[i] = el;
                if (el && el.getAttribute('data-last') !== block.content) {
                  const normalized = normalizePlainToHtml(block.content || '');
                  el.innerHTML = normalized;
                  el.setAttribute('data-last', block.content || '');
                  if (autoFocus && i === 0) { setTimeout(() => { el.focus(); const r = document.createRange(); const s = window.getSelection(); r.selectNodeContents(el); r.collapse(false); s?.removeAllRanges(); s?.addRange(r); }, 30); }
                }
              }}
              contentEditable
              suppressContentEditableWarning
              data-placeholder={i === 0 ? placeholder : ''}
              onFocus={() => { setFocusedIdx(i); syncFmt(); }}
              onKeyUp={syncFmt}
              onSelect={syncFmt}
              onKeyDown={e => {
                if (e.ctrlKey || e.metaKey) {
                  if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); undoHistory(); return; }
                  if (e.key === 'b' || e.key === 'B') { e.preventDefault(); applyInline('bold'); }
                  else if (e.key === 'i' || e.key === 'I') { e.preventDefault(); applyInline('italic'); }
                  else if (e.key === 'l' || e.key === 'L') { e.preventDefault(); applyTextAlign('left'); }
                  else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); applyTextAlign('center'); }
                  else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); applyTextAlign('right'); }
                  else if (e.key === 'j' || e.key === 'J') { e.preventDefault(); applyTextAlign('justify'); }
                }
              }}
              onPaste={e => {
                const items = Array.from(e.clipboardData?.items || []);
                // 1. image paste
                const imgItem = items.find(it => it.type.startsWith('image/'));
                if (imgItem) {
                  e.preventDefault();
                  const file = imgItem.getAsFile();
                  if (!file) return;
                  captureSplit(i);
                  handlePasteImage(file, i);
                  return;
                }
                // 2. URL paste → link preview (check BEFORE html, using sync getData)
                const plainText = e.clipboardData?.getData('text/plain') || '';
                const trimmed = plainText.trim();
                let isUrl = false;
                try { const u = new URL(trimmed); isUrl = u.protocol === 'http:' || u.protocol === 'https:'; } catch(_) {}
                if (isUrl) {
                  e.preventDefault();
                  captureSplit(i);
                  const split = savedSplitRef.current; savedSplitRef.current = null;
                  const placeholder: Block = { type: 'link', url: trimmed, title: trimmed, description: '', image: '', favicon: '' };
                  const nb3 = [...blocks];
                  if (split && split.at === i && nb3[i]?.type === 'text') {
                    nb3[i] = { type: 'text', content: split.before };
                    nb3.splice(i + 1, 0, placeholder);
                    const afterContent = split.after.replace(/<br\s*\/?>/gi, '').trim();
                    if (afterContent) nb3.splice(i + 2, 0, { type: 'text', content: split.after });
                  } else {
                    nb3.splice(i + 1, 0, placeholder);
                  }
                  emit(nb3);
                  fetchLinkPreview(trimmed, nb3);
                  return;
                }
                // 3. HTML table paste (sync getData)
                const htmlContent = e.clipboardData?.getData('text/html') || '';
                if (htmlContent) {
                  const div = document.createElement('div');
                  div.innerHTML = htmlContent;
                  const table = div.querySelector('table');
                  if (table) {
                    e.preventDefault();
                    const tableRows: string[][] = [];
                    table.querySelectorAll('tr').forEach(tr => {
                      const cells: string[] = [];
                      tr.querySelectorAll('td, th').forEach(td => cells.push(td.textContent?.trim() || ''));
                      if (cells.length) tableRows.push(cells);
                    });
                    if (tableRows.length) {
                      const maxCols = Math.max(...tableRows.map(r => r.length));
                      const normalized = tableRows.map(r => { while (r.length < maxCols) r.push(''); return r; });
                      captureSplit(i);
                      const nb2 = [...blocks];
                      nb2.splice(i + 1, 0, { type: 'table', rows: normalized });
                      emit(nb2);
                    }
                    return;
                  }
                }
              }}
              onInput={e => {
                const el = e.currentTarget;
                const html = sanitizeCeHtml(el.innerHTML);
                el.setAttribute('data-last', html);
                const nb = [...blocks]; nb[i] = { type: 'text', content: html }; emit(nb, true);
              }}
              onBlur={e => {
                const plain = (e.currentTarget.textContent || '').trim();
                let isUrl = false;
                try { const u = new URL(plain); isUrl = u.protocol === 'http:' || u.protocol === 'https:'; } catch(_) {}
                if (isUrl) {
                  const placeholder: Block = { type: 'link', url: plain, title: plain, description: '', image: '', favicon: '' };
                  const nb = [...blocks];
                  nb[i] = placeholder;
                  emit(nb);
                  fetchLinkPreview(plain, nb);
                }
              }}
              className="blk-ce"
              style={{ width: '100%', outline: 'none', background: 'transparent', fontFamily: ff, fontSize: `${fz}rem`, lineHeight: 2.1, color: 'var(--ink)', minHeight: block.content && block.content !== '<br>' ? undefined : '220px', wordBreak: 'break-word', paddingRight: blocks.length > 1 ? 72 : 0 }}
            />
            {blocks.length > 1 && (
              <div style={{ position: 'absolute', top: 6, right: 0, display: 'flex', gap: 2, alignItems: 'center' }}>
                <BlockControls i={i} />
              </div>
            )}
            {/* Insert media below this text block */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              {uploadingAt === i ? (
                <span style={{ fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', padding: '3px 0' }}>Mengunggah…</span>
              ) : linkLoading ? (
                <span style={{ fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', padding: '3px 0' }}>Mengambil preview…</span>
              ) : (
                <>
                  <button
                    onMouseDown={() => captureSplit(i)}
                    onClick={() => triggerImageAt(i)}
                    style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                    📷 Foto
                  </button>
                  <button onClick={() => triggerGalleryNew(i)} style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                    ⊞ Grid
                  </button>
                  <button onClick={() => { captureSplit(i); const nb = [...blocks]; nb.splice(i + 1, 0, { type: 'table', rows: [['','',''],['','','']] }); emit(nb); }} style={{ border: '1px dashed var(--line)', background: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Lora',serif", fontSize: '.72rem', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                    ⊟ Tabel
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────── Streak Components ───────────────

const STREAK_MILESTONES = [
  { days: 3,   badge: "🌱", label: "Mulai tumbuh" },
  { days: 7,   badge: "⭐", label: "1 minggu!" },
  { days: 14,  badge: "🔥", label: "2 minggu!" },
  { days: 30,  badge: "💎", label: "1 bulan!" },
  { days: 100, badge: "👑", label: "100 hari!" },
];

function getMilestone(days: number) {
  return [...STREAK_MILESTONES].reverse().find(m => days >= m.days) || null;
}

function FlameSVG({ status, size = 52 }: { status: "active" | "at_risk" | "broken"; size?: number }) {
  const isActive = status === "active";
  const isBroken = status === "broken";
  const outerTop  = isBroken ? "#9DB3C4" : isActive ? "#FF4500" : "#E07830";
  const outerMid  = isBroken ? "#B0C4CE" : isActive ? "#FF8C00" : "#E89040";
  const outerBot  = isBroken ? "#CDD9E0" : isActive ? "#FFD700" : "#F5C060";
  const innerTop  = isBroken ? "#B8CACF" : isActive ? "#FFD700" : "#FADA82";
  const innerBot  = isBroken ? "#DCE8EC" : isActive ? "#FFF8B0" : "#FFF0C0";
  const glowFilter = isBroken
    ? "none"
    : isActive
    ? `drop-shadow(0 0 ${Math.round(size * 0.12)}px rgba(255,140,0,.55))`
    : `drop-shadow(0 0 ${Math.round(size * 0.08)}px rgba(255,160,40,.4))`;
  const animStyle: React.CSSProperties = isBroken ? {} : {
    animation: "flameFlicker 3.2s ease-in-out infinite, flamePulse 2.4s ease-in-out infinite",
  };
  return (
    <svg
      width={size}
      height={Math.round(size * 1.3)}
      viewBox="0 0 40 52"
      fill="none"
      style={{ filter: glowFilter, transformOrigin: "center bottom", flexShrink: 0, ...animStyle }}
    >
      <defs>
        <linearGradient id="sg-outer" x1="20" y1="4" x2="20" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={outerTop} />
          <stop offset="50%"  stopColor={outerMid} />
          <stop offset="100%" stopColor={outerBot} />
        </linearGradient>
        <linearGradient id="sg-inner" x1="20" y1="18" x2="20" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={innerTop} />
          <stop offset="100%" stopColor={innerBot} />
        </linearGradient>
      </defs>
      {/* Outer flame */}
      <path
        d="M20 4 C14 8 7 16 8 26 C9 33 14 40 17 44 C18 46 19 48 20 48 C21 48 22 46 23 44 C26 40 31 33 32 26 C33 16 26 8 20 4Z"
        fill="url(#sg-outer)"
      />
      {/* Base ellipse for 3D feel */}
      <ellipse cx="20" cy="47" rx="7" ry="2.5" fill={outerBot} opacity="0.35" />
      {/* Inner flame */}
      <path
        d="M20 18 C17 22 15 27 16 33 C17 37 18.5 41 20 46 C21.5 41 23 37 24 33 C25 27 23 22 20 18Z"
        fill="url(#sg-inner)"
        opacity="0.88"
      />
      {/* Bright core highlight */}
      <ellipse cx="19.5" cy="36" rx="2.2" ry="4.5" fill="white" opacity={isBroken ? "0" : "0.2"} />
    </svg>
  );
}

function MilestoneBurst() {
  const particles = ["✨", "⭐", "✨", "🌟", "✨", "⭐", "✨", "🌟"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, overflow: "visible", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {particles.map((p, i) => {
        const angle = (i / particles.length) * 360;
        return (
          <span key={i} style={{
            position: "absolute",
            fontSize: i % 2 === 0 ? "1rem" : ".75rem",
            animation: `sparkle 1.8s cubic-bezier(.16,1,.3,1) ${i * 0.08}s both`,
            transform: `rotate(${angle}deg) translateY(-20px)`,
            transformOrigin: "center",
          }}>{p}</span>
        );
      })}
    </div>
  );
}


// ─────────────────────────────────────────────────

export default function DiaryApp() {
  const { data: session, status } = useSession();
  const today = new Date();
  const todayStr = fmtDate(today);
  const [entries, setEntries] = useState<Record<string, any>>({});
  const csrfRef = useRef<string>("");
  const [selId, setSelId] = useState<string | null>(null);
  const [view, setView] = useState("home");
  const [cM, setCM] = useState(today.getMonth());
  const [cY, setCY] = useState(today.getFullYear());
  const [anim, setAnim] = useState("pg-in");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeTag, setActiveTag] = useState<string|null>(null);
  const [tagInput, setTagInput] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [unlockError, setUnlockError] = useState("");
  const [showUnlock, setShowUnlock] = useState(false);
  const [pendingNav, setPendingNav] = useState<any>(null);
  const [showShare, setShowShare] = useState(false);
  const [fontSize, setFontSize] = useState(1); // 0=small, 1=normal, 2=large
  const [lightboxUrl, setLightboxUrl] = useState<string|null>(null);
  const [showMobActions, setShowMobActions] = useState(false);
  const [showDeskMenu, setShowDeskMenu] = useState(false);
  const [showMobStyle, setShowMobStyle] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string|null>(null);
  const [dropPos, setDropPos] = useState({top:0,left:0,right:0});
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ── Streak ──
  const [streak, setStreak] = useState<{
    currentStreak: number; longestStreak: number;
    status: "active" | "at_risk" | "broken";
  } | null>(null);
  const [streakLoaded, setStreakLoaded] = useState(false);
  const [displayedStreak, setDisplayedStreak] = useState(0);
  const [showMilestoneBurst, setShowMilestoneBurst] = useState(false);
  const prevStreakRef = useRef(0);

  const handleUnlock = async (password: string) => {
    setUnlockError("");
    if (!password.trim() || !pendingNav?.id) return;
    try {
      const res = await fetch("/api/notes/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pendingNav.id, password }),
      });
      const data = await res.json();
      if (data.verified && data.id) {
        const updated = { ...entries[data.id], ...data };
        const nextEntries = { ...entries, [data.id]: updated };
        setEntries(nextEntries);
        localStorage.setItem("catatanku_entries", JSON.stringify(nextEntries));
        setUnlockedIds(prev => [...prev, data.id]);
        setShowUnlock(false);
        setUnlockError("");
        nav(pendingNav.v, pendingNav.id);
        setPendingNav(null);
      } else if (res.status === 401 && data.error === "Unauthorized") {
        setUnlockError("Sesi habis, coba login ulang.");
      } else if (data.error === "No password set") {
        setUnlockError("Akun belum punya password.");
      } else {
        setUnlockError("Kata sandi salah.");
      }
    } catch {
      setUnlockError("Gagal memverifikasi.");
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkVerifyDelete, setBulkVerifyDelete] = useState(false);
  const [bulkVerifyError, setBulkVerifyError] = useState("");
  const [showLogout, setShowLogout] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [verifyDeleteError, setVerifyDeleteError] = useState("");

  const requestDelete = (e: any) => {
    if (e.isLocked && !unlockedIds.includes(e.id)) {
      setPendingDelete(e);
    } else {
      setDeleteTarget(e);
    }
  };

  const handleVerifyDelete = async (password: string) => {
    setVerifyDeleteError("");
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.verified) {
        setDeleteTarget(pendingDelete);
        setPendingDelete(null);
      } else {
        setVerifyDeleteError("Kata sandi salah.");
      }
    } catch { setVerifyDeleteError("Gagal memverifikasi."); }
  };
  const tRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout|null>(null);
  const lastSavedWordsRef = useRef<number>(0);
  const entriesRef = useRef(entries);
  useEffect(() => { entriesRef.current = entries; }, [entries]);
  useEffect(() => {
    const saved = localStorage.getItem("catatanku_fontsize");
    if (saved !== null) setFontSize(Number(saved));
  }, []);
  const changeFontSize = (dir: number) => {
    const next = Math.max(0, Math.min(2, fontSize + dir));
    setFontSize(next);
    localStorage.setItem("catatanku_fontsize", String(next));
  };
  useEffect(() => {
    let color = "#FAF6F0"; // Default to var(--bg)
    if ((view === "write" || view === "read") && selId && entries[selId]) {
      const e = entries[selId];
      const theme = e.theme ? NOTE_THEMES.find(t => t.id === e.theme) : null;
      const nCol = !theme && e.color ? NOTE_COLORS.find(c => c.id === e.color) : null;
      const mood = (!theme && !nCol && e.mood != null) ? MOODS[e.mood] : null;
      color = theme?.bg || nCol?.bg || mood?.soft || "#FAF6F0";
    }
    
    // Imperatively update meta tag
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }, [view, selId, entries]);

  const fontSizeRem = [0.95, 1.05, 1.18][fontSize];
  const fontLineH = [2.0, 2.2, 2.4][fontSize];

  useEffect(() => {
    if (status === "authenticated") {
      (async () => {
        try {
          const csrfRes = await fetch("/api/csrf");
          if (csrfRes.ok) { const { token } = await csrfRes.json(); csrfRef.current = token; }
          const res = await fetch("/api/notes");
          const cloudData = await res.json();
          const cloud: Record<string, any> = {};
          if (Array.isArray(cloudData)) cloudData.forEach((e: any) => cloud[e.id] = e);

          const localStr = localStorage.getItem("catatanku_entries");
          const local: Record<string, any> = localStr ? JSON.parse(localStr) : {};

          // Cloud is source of truth — only keep local data for notes that exist in DB
          // If a note is only in local (DB save failed), don't render it
          const merged: Record<string, any> = { ...cloud };
          Object.keys(local).forEach(id => {
            if (cloud[id] && local[id].ts > cloud[id].ts) merged[id] = local[id];
          });

          setEntries(merged);
          localStorage.setItem("catatanku_entries", JSON.stringify(merged));
        } catch(e) {}
        // Fetch streak
        try {
          const sr = await fetch(`/api/streak?today=${todayStr}`);
          if (sr.ok) {
            const sd = await sr.json();
            setStreak(sd);
            setStreakLoaded(true);
            const target: number = sd.currentStreak;
            const prev = prevStreakRef.current;
            if (target > prev) {
              let cur = prev;
              const steps = Math.min(target - prev, 30);
              const iv = setInterval(() => {
                cur++;
                setDisplayedStreak(cur);
                if (cur >= target) { clearInterval(iv); }
              }, Math.max(600 / steps, 20));
            } else {
              setDisplayedStreak(target);
            }
            prevStreakRef.current = target;
            const milestones = [3, 7, 14, 30, 100];
            if (milestones.includes(target) && sd.status === "active") {
              setShowMilestoneBurst(true);
              setTimeout(() => setShowMilestoneBurst(false), 2200);
            }
          }
        } catch(e) {}
        setLoaded(true);
      })();
    } else if (status === "unauthenticated") {
      setLoaded(true);
    }
  }, [status]);

  const syncCloud = useCallback(async (n: Record<string, any>, updatedNote?: any, force = false) => {
    if (!updatedNote) return;
    const { id } = updatedNote;
    // Strip HTML tags/entities before checking emptiness (contenteditable can store <div><br></div>)
    const realText = (updatedNote.text || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    const realTitle = (updatedNote.title || '').trim();
    const hasContent = !!realText || !!realTitle || !!updatedNote.isLocked;

    // Auto-delete if both text and title are empty
    if (!hasContent) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (!force) {
        saveTimeoutRef.current = setTimeout(() => {
          const cur = entriesRef.current[id];
          if (!cur) return;
          const curText = (cur.text || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
          const curTitle = (cur.title || '').trim();
          if (curText || curTitle || cur.isLocked) return; // has content now, skip delete
          syncCloud(entriesRef.current, cur, true);
        }, 3000);
        return;
      }
      try { await fetch(`/api/notes?id=${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfRef.current } }); } catch(e) {}
      lastSavedWordsRef.current = 0;
      return;
    }

    // Debounce cloud sync for text (15s) or force immediate (navigation/stickers)
    const words = ((updatedNote.title || "") + " " + stripHtml(updatedNote.text || "")).trim().split(/\s+/).filter(Boolean).length;
    const wordDiff = Math.abs(words - lastSavedWordsRef.current);

    if (!force && wordDiff < 10) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (!entriesRef.current[id]) return;
        syncCloud(entriesRef.current, updatedNote, true);
      }, 15000);
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    lastSavedWordsRef.current = words;
    setSaving(true);
    try {
      await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfRef.current }, body: JSON.stringify(updatedNote) });
      // Refresh streak after save
      try {
        const sr = await fetch(`/api/streak?today=${todayStr}`);
        if (sr.ok) {
          const sd = await sr.json();
          setStreak(sd);
          setStreakLoaded(true);
          const target: number = sd.currentStreak;
          if (target !== prevStreakRef.current) {
            setDisplayedStreak(target);
            prevStreakRef.current = target;
            const milestones = [3, 7, 14, 30, 100];
            if (milestones.includes(target) && sd.status === "active") {
              setShowMilestoneBurst(true);
              setTimeout(() => setShowMilestoneBurst(false), 2200);
            }
          }
        }
      } catch(e) {}
    } catch(e) {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [todayStr]);

  const nav = (v: string, id?: any) => {
    if ((v === "read" || v === "write") && id && entries[id]?.isLocked && !unlockedIds.includes(id)) {
      setPendingNav({ v, id });
      setShowUnlock(true);
      return;
    }
    // If we're leaving the write view, force a sync of the current entry
    if (view === "write" && selId && entries[selId]) {
      syncCloud(entries, entries[selId], true);
    }
    setAnim("pg-out");
    setTimeout(() => {
      if (id !== undefined) setSelId(id);
      setView(v); setShowSearch(false); setQ(""); setShowStickers(false);
      setAnim("pg-in");
      window.scrollTo({ top: 0, behavior: "instant" as any });
      if (v === "home") {
        fetch(`/api/streak?today=${todayStr}`)
          .then(r => r.ok ? r.json() : null)
          .then(sd => {
            if (!sd) return;
            setStreak(sd);
            setStreakLoaded(true);
            setDisplayedStreak(sd.currentStreak);
            prevStreakRef.current = sd.currentStreak;
          })
          .catch(() => {});
      }
    }, 200);
  };

  const newEntry = (date: string) => {
    const id = uid();
    const fresh = { id, date, title:"", text:"", mood:null, stickers:[], ts: Date.now(), isPinned: false, color: '', theme: '', shareId: null };
    const nextEntries = { ...entries, [id]: fresh };
    setEntries(nextEntries);
    localStorage.setItem("catatanku_entries", JSON.stringify(nextEntries));
    lastSavedWordsRef.current = 0;
    nav("write", id);
  };

  const entry = selId ? (entries[selId] || null) : null;
  const upd = (f: string, v: any) => {
    if (!selId) return;
    const updatedNote = { ...entries[selId], [f]: v, ts: Date.now() };
    const nextEntries = { ...entries, [selId]: updatedNote };
    setEntries(nextEntries);
    localStorage.setItem("catatanku_entries", JSON.stringify(nextEntries));
    
    // Cloud sync logic: immediate for mood/stickers, debounced for title/text
    const isImmediate = f !== "text" && f !== "title";
    syncCloud(nextEntries, updatedNote, isImmediate);
  };
  const toggleSticker = (s: string) => {
    if (!selId) return;
    const cur = entry?.stickers || [];
    const next = cur.includes(s) ? cur.filter((x: string)=>x!==s) : [...cur, s];
    upd("stickers", next);
  };

  const doDelete = async (id: string) => {
    if (saveTimeoutRef.current) { clearTimeout(saveTimeoutRef.current); saveTimeoutRef.current = null; }
    const nextEntries = { ...entries }; delete nextEntries[id];
    setEntries(nextEntries);
    localStorage.setItem("catatanku_entries", JSON.stringify(nextEntries));
    
    try { await fetch(`/api/notes?id=${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfRef.current } }); } catch(e) {}
    setDeleteTarget(null);
    // Refresh streak after delete
    try {
      const sr = await fetch(`/api/streak?today=${todayStr}`);
      if (sr.ok) { const sd = await sr.json(); setStreak(sd); setDisplayedStreak(sd.currentStreak); prevStreakRef.current = sd.currentStreak; }
    } catch(e) {}
    if (id === selId) nav("home");
  };

  const doDeleteMany = async (ids: string[]) => {
    const nextEntries = { ...entries };
    ids.forEach(id => delete nextEntries[id]);
    setEntries(nextEntries);
    localStorage.setItem("catatanku_entries", JSON.stringify(nextEntries));
    await Promise.all(ids.map(id => fetch(`/api/notes?id=${id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfRef.current } }).catch(() => {})));
    setSelectedIds(new Set());
    setSelectMode(false);
    try {
      const sr = await fetch(`/api/streak?today=${todayStr}`);
      if (sr.ok) { const sd = await sr.json(); setStreak(sd); setDisplayedStreak(sd.currentStreak); prevStreakRef.current = sd.currentStreak; }
    } catch(e) {}
  };

  const getCleanText = (e: any) => {
    const mood = e.mood != null ? MOODS[e.mood] : null;
    const blocks = parseBlocks(e.text || "");
    const bodyText = blocks.map(b => {
      if (b.type === 'text') {
        const divProcessed = b.content
          .replace(/<div[^>]*>/gi, '\n')
          .replace(/<\/div>/gi, '')
          .replace(/<br\s*\/?>/gi, '\n');
        return stripHtml(divProcessed);
      }
      if (b.type === 'todo') return (b.done ? '[x] ' : '[ ] ') + b.content;
      if (b.type === 'image') return `[Gambar: ${b.url}]`;
      if (b.type === 'gallery') return `[Galeri: ${b.urls.length} foto]`;
      if (b.type === 'link') {
        const t = b.title || 'Link';
        return `${t}: ${b.url}`;
      }
      if (b.type === 'table') {
        return b.rows.map(row => row.join(' | ')).join('\n');
      }
      return '';
    }).filter(v => v.trim()).join('\n\n');

    return [
      e.title || 'Tanpa Judul',
      fullD(e.date) + (timeStr(e.ts) ? ' · ' + timeStr(e.ts) : ''),
      mood ? `Perasaan: ${mood.label} ${mood.emoji}` : '',
      '',
      bodyText
    ].filter(s => s !== null).join('\n');
  };

  const exportNote = (e: any) => {
    const content = getCleanText(e);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = e.title || `catatan-${e.date}`;
    a.href = url; a.download = `${fileName}.txt`; a.click();
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  const exportPDF = () => {
    setShowDownloadModal(false);
    const oldTitle = document.title;
    const noteTitle = entry?.title || `catatan-${entry?.date || 'download'}`;
    document.title = noteTitle;
    setTimeout(() => {
      window.print();
      document.title = oldTitle;
    }, 150);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/notes/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload gagal");
    const data = await res.json();
    return data.url;
  };

  const handleShare = async () => {
    if (!selId) return;
    const res = await fetch('/api/notes/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selId, enable: true }) });
    const data = await res.json();
    if (data.shareId) upd('shareId', data.shareId);
  };

  const handleRevoke = async () => {
    if (!selId) return;
    await fetch('/api/notes/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selId, enable: false }) });
    upd('shareId', null);
  };

  // Lifecycle sync: ensure data is pushed on close/hide
  useEffect(() => {
    const handleSync = () => {
      if (view === "write" && selId && entriesRef.current[selId]) {
        syncCloud(entriesRef.current, entriesRef.current[selId], true);
      }
    };
    window.addEventListener("beforeunload", handleSync);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleSync();
    });
    return () => {
      window.removeEventListener("beforeunload", handleSync);
    };
  }, [view, selId, syncCloud]);

  const hasContent = (e: any) => {
    const t = (e.text || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    return !!t || !!(e.title || '').trim() || !!e.isLocked;
  };
  const allSorted = Object.values(entries).filter((e: any)=>hasContent(e)).sort((a: any, b: any)=>{
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.ts||0)-(a.ts||0);
  });
  const total = allSorted.length;
  const byDate: Record<string, any[]> = {};
  Object.values(entries).forEach((e: any) => { if(!hasContent(e)) return; if(!byDate[e.date]) byDate[e.date]=[]; byDate[e.date].push(e); });
  Object.keys(byDate).forEach(d => byDate[d].sort((a: any,b: any)=>(b.ts||0)-(a.ts||0)));
  const todayEntries = byDate[todayStr] || [];
  const hasDate = (ds: string) => (byDate[ds]?.length || 0) > 0;
  const dateMood = (ds: string) => { const l=byDate[ds]; if(!l?.length) return null; return l[0].mood!=null?MOODS[l[0].mood]:null; };
  const entryMood = (e: any) => e.mood!=null ? MOODS[e.mood] : null;

  const hr = today.getHours();
  const greet = hr<5?"Selamat Malam":hr<12?"Selamat Pagi":hr<17?"Selamat Siang":hr<19?"Selamat Sore":"Selamat Malam";
  const fullD = (s: any) => { const d=new Date(s+"T00:00:00"); return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const shortD = (s: any) => { const d=new Date(s+"T00:00:00"); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };

  const tagCounts: Record<string,number> = {};
  allSorted.forEach((e:any) => (e.tags||[]).forEach((t:string) => { tagCounts[t]=(tagCounts[t]||0)+1; }));
  const allTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).map(([tag,count])=>({tag,count}));

  const filtered = allSorted.filter((e: any) => {
    const lq = q.trim().toLowerCase();
    const matchQ = !lq || e.title?.toLowerCase().includes(lq) || getPreviewText(e.text||'').toLowerCase().includes(lq) || (e.tags||[]).some((t:string)=>t.toLowerCase().includes(lq));
    const matchTag = !activeTag || (e.tags||[]).includes(activeTag);
    return matchQ && matchTag;
  });

  const entryFontFamily = (e: any) => NOTE_FONTS.find(f=>f.id===(e?.font||''))?.family || "'Lora', serif";

  const addTag = (raw: string) => {
    if (!selId || !entry) return;
    const tag = raw.replace(/^#+/,'').trim().toLowerCase().replace(/\s+/g,'-');
    if (!tag || tag.length > 30) return;
    const cur: string[] = entry.tags || [];
    if (cur.includes(tag) || cur.length >= 10) return;
    upd("tags", [...cur, tag]);
  };
  const removeTag = (tag: string) => {
    if (!selId || !entry) return;
    upd("tags", (entry.tags||[]).filter((t:string)=>t!==tag));
  };

  useEffect(() => {
    if(tRef.current && view==="write") { tRef.current.style.height="auto"; tRef.current.style.height=tRef.current.scrollHeight+"px"; }
  }, [entry?.text, view]);

  // FCM push notification — show custom prompt first, then call browser API
  useEffect(() => {
    if (!session?.user) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") {
      // Already decided — if granted, just refresh token silently
      if (Notification.permission === "granted") {
        import("@/lib/firebase-client").then(({ requestNotificationToken }) => {
          requestNotificationToken().then(token => {
            if (!token) return;
            fetch("/api/notifications/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => {});
          });
        });
      }
      return;
    }
    // Only show once — check localStorage flag
    if (localStorage.getItem("catatanku_notif_asked")) return;
    // Small delay so it doesn't pop up immediately on page load
    const t = setTimeout(() => setShowNotifPrompt(true), 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const handleNotifAllow = () => {
    setShowNotifPrompt(false);
    localStorage.setItem("catatanku_notif_asked", "1");
    import("@/lib/firebase-client").then(({ requestNotificationToken }) => {
      requestNotificationToken().then(token => {
        if (!token) return;
        fetch("/api/notifications/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => {});
      });
    });
  };

  const handleNotifLater = () => {
    setShowNotifPrompt(false);
    localStorage.setItem("catatanku_notif_asked", "1");
  };

  const readMood = entry?.mood!=null ? MOODS[entry.mood] : null;
  const readNoteColor = entry?.color ? NOTE_COLORS.find(c => c.id === entry.color) : null;
  const readNoteTheme = entry?.theme ? NOTE_THEMES.find(t => t.id === entry.theme) : null;

  const monthEntries = Object.values(entries).filter((e: any) => {
    const d=new Date(e.date+"T00:00:00");
    return d.getMonth()===cM && d.getFullYear()===cY && e.text?.trim();
  });
  const moodCounts: Record<number, number> = {};
  monthEntries.forEach((e: any) => { if(e.mood!=null) moodCounts[e.mood]=(moodCounts[e.mood]||0)+1; });

  if(!loaded) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#FAF6F0",fontFamily:"'Cormorant Garamond',serif",overflow:"hidden",position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Lora:wght@400&display=swap');
        @keyframes ldFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ldFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes ldDot{0%,80%,100%{opacity:.18;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}
        @keyframes ldLine{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes ldBgPulse{0%,100%{opacity:.4}50%{opacity:.65}}
      `}</style>

      {/* Soft ambient blobs */}
      <div style={{position:"absolute",top:"12%",right:"18%",width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,#EDD5BB55,transparent 70%)",animation:"ldBgPulse 4s ease infinite",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"14%",left:"14%",width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,#D9C4B044,transparent 70%)",animation:"ldBgPulse 4s ease 1.5s infinite",pointerEvents:"none"}}/>

      {/* Floating icon */}
      <div style={{marginBottom:28,animation:"ldFloat 3.2s ease-in-out infinite",opacity:.85}}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#C4956A" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      </div>

      {/* Wordmark */}
      <h1 style={{fontSize:"clamp(2rem,6vw,3rem)",fontWeight:300,color:"#2E2520",letterSpacing:"-.01em",lineHeight:1,margin:"0 0 10px",animation:"ldFadeUp .9s cubic-bezier(.16,1,.3,1) both"}}>
        Catatanku
      </h1>

      {/* Accent line */}
      <div style={{width:36,height:2,borderRadius:1,background:"#C4956A",marginBottom:12,transformOrigin:"left",animation:"ldLine .8s cubic-bezier(.16,1,.3,1) .35s both"}}/>

      {/* Tagline */}
      <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"#BEB3A8",letterSpacing:".07em",marginBottom:44,animation:"ldFadeUp .9s cubic-bezier(.16,1,.3,1) .2s both"}}>
        Ruang ceritamu
      </p>

      {/* Staggered dots */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#C4956A",animation:`ldDot 1.5s ease ${i*.18}s infinite`}}/>
        ))}
      </div>
    </div>
  );

  if (status === "unauthenticated") return <AuthForm />;

  return (
    <div style={{minHeight:"100vh",background:(view==="read"||view==="write")?(readNoteTheme?.bg||readNoteColor?.bg||readMood?.pageBg||"var(--bg)"):"var(--bg)",color:"var(--ink)",transition:"background .5s ease",position:"relative"}}>
      {(view==="read"||view==="write") && readNoteTheme && <ThemeBg themeId={readNoteTheme.id} accent={readNoteTheme.accent}/>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Merriweather:ital,wght@0,300;0,400;1,300;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=Nunito:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500&family=Poppins:ital,wght@0,400;0,500;1,400&family=Raleway:ital,wght@0,400;0,500;1,400&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');
        :root{--bg:#FAF6F0;--surface:#FFFFFF;--header-bg:rgba(250,246,240,0.93);--ink:#2E2520;--ink2:#8C7E73;--ink3:#BEB3A8;--accent:#C4956A;--accent-soft:#EBDACB;--line:#EDE7DF;--shadow:0 2px 20px rgba(46,37,32,0.05);--radius:14px;--scroll-thumb:${(view==="read"||view==="write")&&readNoteTheme?readNoteTheme.accent:"#C4956A"};--scroll-track:${(view==="read"||view==="write")&&readNoteTheme?readNoteTheme.bg+"cc":"#EBDACB"};--scroll-thumb-hover:${(view==="read"||view==="write")&&readNoteTheme?readNoteTheme.accent+"cc":"#a87550"}}
        ${(view==="read"||view==="write") && readNoteTheme?.id==='kota_malam' ? `:root{--bg:#020408;--ink:#FFFFFF;--ink2:rgba(255,255,255,.85);--ink3:rgba(255,255,255,.60);--surface:rgba(5,8,13,0.98);--header-bg:rgba(2,4,8,0.92);--line:rgba(240,208,144,.12);--accent-soft:rgba(240,208,144,0.15)}` : (view==="read"||view==="write")&&(readNoteTheme as any)?.dark?`:root{--bg:#0E1C1B;--ink:#E8F8F6;--ink2:rgba(168,228,222,.90);--ink3:rgba(110,188,182,.72);--surface:rgba(20,35,34,0.96);--header-bg:rgba(10,20,19,0.88);--line:rgba(255,255,255,.12);--accent-soft:rgba(196,149,106,0.2)}`:""}

        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        body{background:var(--bg);overflow-x:hidden}
        .pg-in{animation:pgIn .45s cubic-bezier(.23,1,.32,1) both}
        .pg-out{animation:pgOut .2s ease both}
        @media print {
          @page { margin: 0; }
          body { background: ${(view==="read"||view==="write")?(readNoteTheme?.bg||readNoteColor?.bg||readMood?.soft||"white"):"white"} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; }
          .no-print, header, .desk-header, .mob-nav, .mob-nav-new, button, .ddrop, .asheet-row, .desk-selesai-fab { display: none !important; }
          .read-layout { margin: 0 !important; padding: 48px 40px !important; width: 100% !important; min-height: 0 !important; position: relative !important; z-index: 1 !important; background: transparent !important; }
          .shell { padding: 0 !important; margin: 0 !important; min-height: 0 !important; background: transparent !important; position: relative !important; z-index: 1 !important; }
          .read-layout > * { animation: none !important; transform: none !important; }
          
          .theme-bg-svg { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 0 !important; opacity: 0.15 !important; display: block !important; }
        }
        @keyframes pgIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pgOut{from{opacity:1}to{opacity:0;transform:translateY(-6px)}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalBgIn{from{opacity:0}to{opacity:1}}
        @keyframes modalBgOut{from{opacity:1}to{opacity:0}}
        @keyframes modalIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes modalOut{from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(.98) translateY(-4px)}}
        @keyframes flameFlicker{0%,100%{transform:scaleX(1) scaleY(1) rotate(0deg)}20%{transform:scaleX(.96) scaleY(1.04) rotate(-1.5deg)}40%{transform:scaleX(1.03) scaleY(.97) rotate(1deg)}60%{transform:scaleX(.97) scaleY(1.03) rotate(-1deg)}80%{transform:scaleX(1.02) scaleY(.98) rotate(.8deg)}}
        @keyframes flamePulse{0%,100%{filter:drop-shadow(0 0 4px rgba(255,140,0,.35))}50%{filter:drop-shadow(0 0 11px rgba(255,140,0,.65))}}
        @keyframes streakAtRisk{0%,100%{box-shadow:0 0 0 0 rgba(255,140,0,0)}50%{box-shadow:0 0 0 6px rgba(255,140,0,.18)}}
        @keyframes sparkle{0%{opacity:1;transform:scale(0) translateY(0) rotate(0deg)}60%{opacity:1;transform:scale(1.2) translateY(-28px) rotate(120deg)}100%{opacity:0;transform:scale(.5) translateY(-48px) rotate(240deg)}}
        @keyframes milestoneGlow{0%,100%{box-shadow:0 4px 16px rgba(196,149,106,.15)}50%{box-shadow:0 4px 32px rgba(255,165,0,.45)}}
        .s1{animation:fadeUp .5s ease .04s both}.s2{animation:fadeUp .5s ease .1s both}.s3{animation:fadeUp .5s ease .18s both}.s4{animation:fadeUp .5s ease .27s both}.s5{animation:fadeUp .5s ease .36s both}
        .gb{background:none;border:none;cursor:pointer;color:var(--ink2);font-family:'Lora',serif;font-size:.86rem;transition:color .2s;display:inline-flex;align-items:center;gap:6px}
        .gb:hover{color:var(--ink)}
        .ecard{padding:18px 22px;border-radius:var(--radius);background:var(--surface);border:1px solid var(--line);cursor:pointer;transition:all .3s cubic-bezier(.23,1,.32,1);position:relative;overflow:hidden}
        .ecard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--card-accent,var(--accent-soft));border-radius:var(--radius) 0 0 var(--radius);transition:width .3s ease}
        .ecard:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(46,37,32,.09);border-color:var(--card-border,var(--accent-soft))}
        .ecard:hover::before{width:5px}
        .cal-day{width:40px;height:40px;border:none;background:none;border-radius:50%;font-family:'Lora',serif;font-size:.86rem;color:var(--ink);cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;position:relative}
        .cal-day:hover{background:var(--accent-soft)}
        .fab{position:fixed;bottom:28px;right:28px;width:56px;height:56px;border-radius:50%;border:none;background:var(--accent);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 28px rgba(196,149,106,.3);transition:all .3s;z-index:50}
        .fab:hover{transform:scale(1.08) rotate(90deg);box-shadow:0 8px 32px rgba(196,149,106,.42)}
        .mood-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px 6px 10px;border-radius:24px;font-family:'Lora',serif;font-size:.8rem;transition:all .25s ease;cursor:pointer;border:1px solid var(--line);background:var(--surface)}
        .mood-chip:hover{transform:scale(1.05)}
        textarea{width:100%;border:none;outline:none;resize:none;background:transparent;font-family:'Lora',serif;font-size:1.05rem;line-height:2.1;color:var(--ink);min-height:260px}
        textarea::placeholder{color:var(--ink3);font-style:italic}
        input[type="text"]{width:100%;border:none;outline:none;background:transparent;font-family:'Cormorant Garamond',serif;color:var(--ink)}
        input[type="text"]::placeholder{color:var(--ink3)}
        .toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-8px);font-family:'Lora',serif;font-size:.78rem;color:var(--accent);opacity:0;transition:opacity .3s,transform .3s cubic-bezier(.23,1,.32,1);pointer-events:none;z-index:400;background:var(--surface);padding:6px 18px;border-radius:24px;border:1px solid var(--accent-soft);letter-spacing:.02em;box-shadow:0 4px 16px rgba(196,149,106,.18)}
        .toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
        .search-bar{width:100%;padding:12px 16px 12px 42px;border:1px solid var(--line);border-radius:12px;background:var(--surface);font-family:'Lora',serif;font-size:.9rem;color:var(--ink);outline:none;transition:border-color .2s}
        .search-bar:focus{border-color:var(--accent-soft)}
        .tag-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-family:'Lora',serif;font-size:.68rem;background:var(--accent-soft);color:var(--accent);border:1px solid var(--line);cursor:pointer;transition:all .12s;white-space:nowrap;line-height:1.6}
        .tag-chip:hover{background:rgba(196,149,106,.22)}
        .tag-chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
        .tag-filter-row{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px;scrollbar-width:none}
        .tag-filter-row::-webkit-scrollbar{display:none}
        .tag-input{width:100%;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);font-family:'Lora',serif;font-size:.78rem;color:var(--ink);outline:none;transition:border-color .2s}
        .tag-input:focus{border-color:var(--accent)}
        .desk-search-wrap{display:none}
        @media(min-width:768px){.desk-search-wrap{display:block;position:relative;flex:1;max-width:320px}}
        .line-h{height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent)}
        .shell{padding:28px 24px 100px}
        .home-hero{display:flex;flex-direction:column;gap:24px;margin-bottom:36px}
        .home-grid{display:grid;grid-template-columns:1fr;gap:12px}
        .write-layout{display:flex;flex-direction:column}
        .write-sidebar{margin-bottom:28px}
        .write-main{flex:1}
        .read-layout{max-width:640px;position:relative}
        .cal-layout{display:flex;flex-direction:column;gap:28px}
        .cal-grid-wrap{flex:1}
        .cal-sidebar{display:none}
        .list-grid{display:grid;grid-template-columns:1fr;gap:10px}
        .mood-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .mood-grid .mood-chip{justify-content:center;padding:10px 8px;font-size:.78rem}
        .mood-col{display:none;flex-direction:column;gap:8px}
        .mood-col .mood-chip{justify-content:flex-start}
        .today-count{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;font-family:'Lora',serif;font-size:.65rem;font-weight:600;background:var(--accent-soft);color:var(--accent)}
        .del-icon{padding:4;opacity:.25;transition:opacity .2s,color .2s;color:var(--ink3)}
        .del-icon:hover{opacity:1;color:#C27054}
        .locked-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);z-index:2;border-radius:inherit}
        .modal-bg{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(46,37,32,0.38);z-index:2000;animation:modalBgIn .18s ease both;contain:strict;transform:translateZ(0)}
        .modal{background:var(--surface);width:100%;max-width:360px;border-radius:24px;box-shadow:0 12px 40px rgba(46,37,32,0.14);animation:modalIn .28s cubic-bezier(.16,1,.3,1) both;border:1px solid var(--line);padding:40px 32px;position:relative;text-align:center;will-change:transform,opacity}
        .modal-closing{animation:modalOut .18s cubic-bezier(.4,0,1,1) both!important}
        .blur-card{filter:blur(10px);pointer-events:none;user-select:none}
        @media(min-width:768px){
          .shell{padding:102px 48px 100px;max-width:1200px;margin:0 auto}
          .home-hero{flex-direction:row;align-items:flex-start;gap:48px}
          .home-hero-left{flex:1}.home-hero-right{width:380px;flex-shrink:0}
          .home-grid{grid-template-columns:repeat(3,1fr);gap:16px}
          .write-layout{flex-direction:column;gap:0}
          .write-sidebar{display:none!important}
          .write-main{flex:1;max-width:720px;width:100%}
          .mood-grid{display:none}.mood-col{display:flex}
          .read-layout{max-width:720px;margin:0 auto}
          .cal-layout{flex-direction:row;gap:40px}
          .cal-sidebar{display:block;width:240px;flex-shrink:0}
          .list-grid{grid-template-columns:repeat(2,1fr);gap:16px}
        }
        @media(min-width:1024px){
          .shell{padding:108px 64px 100px;max-width:1200px}
          .home-grid{grid-template-columns:repeat(3,1fr);gap:18px}
          .list-grid{grid-template-columns:repeat(3,1fr);gap:18px}
        }
        @media(min-width:1280px){
          .shell{padding:108px 80px 100px;max-width:1440px}
          .home-grid{grid-template-columns:repeat(4,1fr);gap:18px}
          .list-grid{grid-template-columns:repeat(4,1fr);gap:16px}
          .home-hero-right{width:420px}
        }
        @media(max-width:480px){
          .cal-day{width:36px;height:36px;font-size:.8rem}
          .shell{padding:20px 16px 100px}
          .mood-grid{grid-template-columns:repeat(3,1fr);gap:6px}
          .mood-grid .mood-chip{padding:8px 6px;font-size:.74rem;gap:4px}
        }
        /* ── Mobile helpers ─── */
        .desk-only{display:none!important}
        @media(min-width:768px){.desk-only{display:flex!important}}
        .desk-selesai-fab{position:fixed;bottom:28px;right:28px;z-index:300;align-items:center;gap:9px;padding:13px 28px;border-radius:14px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-family:'Lora',serif;font-size:.9rem;font-weight:500;letter-spacing:.01em;box-shadow:0 6px 24px rgba(196,149,106,.38);transition:all .25s cubic-bezier(.23,1,.32,1)}
        .mob-only{display:flex!important}
        @media(min-width:768px){.mob-only{display:none!important}}
        /* ── Mobile bottom nav ─── */
        .mob-nav{position:fixed;bottom:0;left:0;right:0;height:62px;background:var(--surface);border-top:1px solid var(--line);z-index:200;display:flex;justify-content:space-around;align-items:center;padding:0 4px;padding-bottom:env(safe-area-inset-bottom,0px)}
        @media(min-width:768px){.mob-nav{display:none}}
        .mob-nav-btn{display:flex;flex-direction:column;align-items:center;gap:2px;border:none;background:none;cursor:pointer;padding:8px 14px;border-radius:12px;color:var(--ink3);transition:all .15s;-webkit-tap-highlight-color:transparent;min-width:52px}
        .mob-nav-btn.act{color:var(--accent)}
        .mob-nav-btn .mlbl{font-family:'Lora',serif;font-size:.58rem;line-height:1;transition:color .15s}
        .mob-nav-new{width:46px;height:46px;border-radius:50%;background:var(--accent);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(196,149,106,.35);-webkit-tap-highlight-color:transparent;flex-shrink:0;transition:transform .15s}
        .mob-nav-new:active{transform:scale(.93)}
        @media(max-width:767px){
          .shell{padding-bottom:82px!important}
          .write-sidebar{display:none!important}
          .fab{display:none!important}
          .blk-ctrl{opacity:1!important}
        }
        /* ── Multi-select bar ── */
        .sel-bar{position:fixed;left:16px;right:16px;bottom:calc(62px + env(safe-area-inset-bottom,0px) + 10px);z-index:210;display:flex;align-items:stretch;background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,.14),0 2px 8px rgba(0,0,0,.07);animation:fadeUp .2s ease both;overflow:hidden}
        .sel-bar-count{font-family:'Lora',serif;font-size:.82rem;color:var(--ink2);padding:13px 16px;flex:1;display:flex;align-items:center;justify-content:center}
        .sel-bar-div{width:1px;background:var(--line);flex-shrink:0}
        .sel-bar-btn{font-family:'Lora',serif;font-size:.8rem;padding:13px 16px;border:none;background:none;color:var(--ink2);cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent;flex:1}
        .sel-bar-btn:hover{background:var(--bg)}
        .sel-bar-del{font-family:'Lora',serif;font-size:.8rem;padding:13px 16px;border:none;background:#C04040;color:#fff;cursor:pointer;font-weight:600;transition:background .12s;-webkit-tap-highlight-color:transparent;flex:1}
        .sel-bar-del:hover{background:#A83535}
        @media(min-width:768px){.sel-bar{left:0;right:0;transform:none;width:max-content;min-width:360px;margin:0 auto;bottom:32px;border-radius:32px}}
        /* ── Action / Style bottom sheet ─── */
        .asheet-bg{position:fixed;inset:0;background:rgba(46,37,32,.22);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:899}
        .asheet{position:fixed;left:0;right:0;bottom:0;background:var(--surface);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:22px 22px 0 0;padding:0 0 max(28px,env(safe-area-inset-bottom,28px));z-index:900;animation:slideUp .3s cubic-bezier(.16,1,.3,1) both;box-shadow:0 -12px 48px rgba(46,37,32,.12)}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .asheet-title{font-family:'Lora',serif;font-size:.72rem;color:var(--ink3);text-transform:uppercase;letter-spacing:.08em;padding:8px 22px 12px;font-weight:500}
        .asheet-row{display:flex;align-items:center;gap:14px;width:100%;padding:15px 22px;border:none;background:none;cursor:pointer;font-family:'Lora',serif;font-size:.9rem;color:var(--ink);text-align:left;-webkit-tap-highlight-color:transparent;transition:background .1s}
        .asheet-row:active{background:var(--bg)}
        .asheet-sep{height:1px;background:var(--line);margin:4px 0}
        .asheet-danger{color:#B5705A!important}
        /* ── Write toolbar (desktop) ── */
        .write-toolbar{display:none}
        @media(min-width:768px){
          .write-toolbar{display:flex;align-items:center;gap:2px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding:8px 0;margin-bottom:28px}
        }
        .wtbtn{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border:none;background:none;cursor:pointer;font-family:'Lora',serif;font-size:.78rem;color:var(--ink2);border-radius:8px;transition:all .15s;white-space:nowrap;flex-shrink:0}
        .wtbtn:hover{background:rgba(196,149,106,.1);color:var(--ink)}
        .wtbtn.wact{color:var(--accent);background:rgba(196,149,106,.12)}
        .wtbtn:disabled{opacity:.35;cursor:default}
        .wdrop-wrap{flex-shrink:0}
        .wdrop{position:fixed;min-width:200px;max-height:340px;overflow-y:auto;background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--line);border-radius:14px;box-shadow:0 8px 36px rgba(46,37,32,.12);z-index:500;padding:10px;animation:fadeUp .18s ease both}
        .wdrop::-webkit-scrollbar{width:4px}
        .wdrop::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px}
        .wdrop-label{font-family:'Lora',serif;font-size:.65rem;color:var(--ink3);letter-spacing:.06em;text-transform:uppercase;padding:2px 6px 6px;display:block}
        /* ── Desktop sticky header ── */
        .desk-header{display:none}
        @media(min-width:768px){
          .desk-header{display:flex;position:fixed;top:0;left:0;right:0;height:62px;background:var(--header-bg);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid var(--line);z-index:200;align-items:center;padding:0 48px}
        }
        @media(min-width:1024px){.desk-header{padding:0 64px}}
        @media(min-width:1280px){.desk-header{padding:0 80px}}
        .desk-header-inner{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:1440px;margin:0 auto;gap:16px}
        .desk-tab{display:flex;align-items:center;gap:6px;padding:7px 13px;border:none;background:none;cursor:pointer;font-family:'Lora',serif;font-size:.82rem;color:var(--ink2);border-radius:10px;transition:all .15s;letter-spacing:.01em;white-space:nowrap}
        .desk-tab:hover{color:var(--ink);background:rgba(196,149,106,.1)}
        .desk-tab.act{color:var(--accent);background:rgba(196,149,106,.14);font-weight:500}
        .desk-hdr-sep{width:1px;height:18px;background:var(--line);flex-shrink:0}
        /* ── Desktop dropdown menu ── */
        .ddrop{position:relative;display:inline-flex}
        .ddrop-btn{display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--line);border-radius:9px;background:var(--surface);cursor:pointer;font-family:'Lora',serif;font-size:.8rem;color:var(--ink2);transition:all .15s;white-space:nowrap}
        .ddrop-btn:hover{border-color:var(--accent-soft);color:var(--ink);background:var(--bg)}
        .ddrop-menu{position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--line);border-radius:13px;box-shadow:0 8px 32px rgba(46,37,32,.12);min-width:200px;padding:6px;z-index:300;animation:ddIn .18s cubic-bezier(.16,1,.3,1) both}
        @keyframes ddIn{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .ddrop-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 13px;border:none;background:none;cursor:pointer;font-family:'Lora',serif;font-size:.84rem;color:var(--ink);border-radius:8px;transition:background .12s;text-align:left;white-space:nowrap}
        .ddrop-item:hover{background:var(--bg)}
        .ddrop-item.active{color:var(--accent)}
        .ddrop-item.danger{color:#B5705A}
        .ddrop-item.danger:hover{background:#FEF5F1}
        .ddrop-sep{height:1px;background:var(--line);margin:4px 6px}
        /* ── Desktop home stats ── */
        .home-stats{display:none}
        @media(min-width:768px){.home-stats{display:flex;gap:32px;margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}}
        .stat-item{display:flex;flex-direction:column;gap:2px}
        .stat-val{font-family:'Cormorant Garamond',serif;font-size:1.9rem;font-weight:300;color:var(--ink);line-height:1}
        .stat-lbl{font-family:'Lora',serif;font-size:.7rem;color:var(--ink3);letter-spacing:.04em}
      `}</style>

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          entry={deleteTarget}
          onConfirm={() => doDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {/* Logout Modal */}
      {showLogout && (
        <LogoutModal
          onConfirm={() => signOut()}
          onCancel={() => setShowLogout(false)}
        />
      )}
      {showNotifPrompt && (
        <NotifPermissionModal
          onAllow={handleNotifAllow}
          onLater={handleNotifLater}
        />
      )}
      {pendingDelete && (
        <UnlockModal
          onUnlock={handleVerifyDelete}
          onClose={() => { setPendingDelete(null); setVerifyDeleteError(""); }}
          error={verifyDeleteError}
          setError={setVerifyDeleteError}
          title="Konfirmasi Penghapusan"
          description="Catatan ini terkunci. Masukkan kata sandi untuk melanjutkan penghapusan."
          actionLabel="Lanjutkan"
          accentColor="#B5705A"
        />
      )}
      {bulkVerifyDelete && (
        <UnlockModal
          onUnlock={async (password) => {
            setBulkVerifyError("");
            try {
              const res = await fetch("/api/auth/verify-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
              const data = await res.json();
              if (data.verified) { setBulkVerifyDelete(false); setBulkDeleteConfirm(true); }
              else setBulkVerifyError("Kata sandi salah.");
            } catch { setBulkVerifyError("Gagal memverifikasi."); }
          }}
          onClose={() => { setBulkVerifyDelete(false); setBulkVerifyError(""); }}
          error={bulkVerifyError}
          setError={setBulkVerifyError}
          title="Verifikasi Identitas"
          description="Beberapa catatan yang dipilih terkunci. Masukkan kata sandi untuk melanjutkan."
          actionLabel="Verifikasi"
          accentColor="#B5705A"
        />
      )}
      {bulkDeleteConfirm && (
        <DeleteManyModal
          count={selectedIds.size}
          hasLocked={Array.from(selectedIds).some(id => entries[id]?.isLocked)}
          onConfirm={() => { setBulkDeleteConfirm(false); doDeleteMany(Array.from(selectedIds)); }}
          onCancel={() => setBulkDeleteConfirm(false)}
        />
      )}

      {lightboxUrl && (
        <div onClick={()=>setLightboxUrl(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,cursor:"zoom-out"}}>
          <img src={lightboxUrl} alt="" style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:12,objectFit:"contain",boxShadow:"0 8px 60px rgba(0,0,0,.5)"}} onClick={e=>e.stopPropagation()}/>
          <button onClick={()=>setLightboxUrl(null)} style={{position:"absolute",top:16,right:16,width:36,height:36,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:"1.1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      )}
      <div className={`toast ${saved?"on":""}`}>✓ Tersimpan</div>
      {showUnlock && pendingNav && (
        <UnlockModal onUnlock={(pass) => handleUnlock(pass)} onClose={() => {setShowUnlock(false); setPendingNav(null);}} error={unlockError} setError={setUnlockError}/>
      )}
      {showShare && entry && (
        <ShareModal shareId={entry.shareId||null} isLocked={!!entry.isLocked} onClose={()=>setShowShare(false)} onShare={handleShare} onRevoke={handleRevoke}/>
      )}
      {showDownloadModal && entry && (
        <DownloadModal onTxt={() => exportNote(entry)} onPdf={exportPDF} onCancel={() => setShowDownloadModal(false)} />
      )}

      {/* ── Desktop sticky header ── */}
      <header className="desk-header">
        <div className="desk-header-inner">
          {/* Brand */}
          <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0,cursor:"default"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",flexShrink:0}}/>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:300,color:"var(--ink)",letterSpacing:"-.01em"}}>Catatanku</span>
          </div>
          {/* Center nav */}
          <div style={{display:"flex",gap:2,alignItems:"center"}}>
            <button className={`desk-tab ${view==="home"?"act":""}`} onClick={()=>nav("home")}><Ic d={IC.home} size={14} sw={1.4}/>Beranda</button>
            <button className={`desk-tab ${view==="list"?"act":""}`} onClick={()=>nav("list")}><Ic d={IC.search} size={14} sw={1.4}/>Daftar</button>
            <button className={`desk-tab ${view==="calendar"||view==="dayview"?"act":""}`} onClick={()=>nav("calendar")}><Ic d={IC.cal} size={14} sw={1.4}/>Kalender</button>
          </div>
          {/* Right: context dropdown + edit button + sign out */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {(view==="write"||view==="read") && entry && (<>
              {view==="read" && (
                <button className="gb" onClick={()=>nav("write",selId)} style={{padding:"6px 14px",borderRadius:9,background:"var(--accent)",color:"#fff",fontSize:".8rem",gap:6,fontFamily:"'Lora',serif",border:"none"}}>
                  <Ic d={IC.edit} size={13} color="#fff"/>Edit
                </button>
              )}
              {/* Dropdown */}
              <div className="ddrop">
                {showDeskMenu && <div style={{position:"fixed",inset:0,zIndex:299}} onClick={()=>setShowDeskMenu(false)}/>}
                <button className="ddrop-btn" onClick={()=>setShowDeskMenu(v=>!v)}>
                  <Ic d={IC.dots} size={15} sw={2}/>Lainnya
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3.5l3 3 3-3"/></svg>
                </button>
                {showDeskMenu && (
                  <div className="ddrop-menu">
                    <button className={`ddrop-item ${entry.isPinned?"active":""}`} onClick={()=>{upd("isPinned",!entry.isPinned);setShowDeskMenu(false);}}>
                      <Ic d={IC.pin} size={16} sw={entry.isPinned?2.2:1.6} color={entry.isPinned?"var(--accent)":"var(--ink2)"}/>
                      {entry.isPinned?"Lepas Pin":"Pin Catatan"}
                    </button>
                    <button className={`ddrop-item ${entry.isLocked?"active":""}`} onClick={()=>{upd("isLocked",!entry.isLocked);setShowDeskMenu(false);}}>
                      <Ic d={entry.isLocked?IC.lock:IC.unlock} size={16} sw={1.6} color={entry.isLocked?"var(--accent)":"var(--ink2)"}/>
                      {entry.isLocked?"Lepas Kunci":"Kunci Catatan"}
                    </button>
                    <button className={`ddrop-item ${entry.shareId?"active":""}`} onClick={()=>{setShowDeskMenu(false);if(!entry.isLocked)setShowShare(true);}} style={{opacity:entry.isLocked?.45:1,cursor:entry.isLocked?"not-allowed":"pointer"}}>
                      <Ic d={IC.share} size={16} sw={1.6} color={entry.shareId?"var(--accent)":"var(--ink2)"}/>
                      Bagikan{entry.isLocked?" (Terkunci)":""}
                    </button>
                    <button className="ddrop-item" onClick={()=>{setShowDownloadModal(true);setShowDeskMenu(false);}}>
                      <Ic d={IC.download} size={16} sw={1.6} color="var(--ink2)"/>Unduh
                    </button>
                    <div className="ddrop-sep"/>
                    <button className="ddrop-item danger" onClick={()=>{setShowDeskMenu(false);requestDelete(entry);}}>
                      <Ic d={IC.trash} size={16} sw={1.6} color="#B5705A"/>Hapus Catatan
                    </button>
                  </div>
                )}
              </div>
              <div className="desk-hdr-sep"/>
            </>)}
            <button className="gb" onClick={()=>setShowLogout(true)} style={{fontSize:".8rem",gap:5,padding:"4px 8px"}}><Ic d={IC.x} size={13} sw={1.8}/>Logout</button>
          </div>
        </div>
      </header>

      <div className={`shell ${anim}`}>

        {/* ════════ HOME ════════ */}
        {view==="home" && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
            <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",letterSpacing:".05em"}}>{fullD(todayStr)}</p>
            <button className="mob-only gb" onClick={()=>setShowLogout(true)} style={{fontSize:".8rem"}}><Ic d={IC.x} size={14}/> Logout</button>
          </div>

          <div className="home-hero s2">
            <div className="home-hero-left">
              <div style={{display:"flex",gap:16,alignItems:"stretch",marginBottom:16}}>
                <div style={{width:2,borderRadius:1,background:"linear-gradient(180deg,var(--accent),var(--accent-soft),transparent)",flexShrink:0}}/>
                <div>
                  <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(2.4rem,4vw,3.4rem)",fontWeight:300,lineHeight:1.1,color:"var(--ink)",marginBottom:8}}>{greet}</h1>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".9rem",color:"var(--ink2)",lineHeight:1.7}}>
                    {total===0?"Mulailah menulis ceritamu hari ini.":`${total} catatan telah kamu simpan.`}
                  </p>
                  {streakLoaded && streak && (() => {
                    const m = getMilestone(streak.currentStreak);
                    const isAct = streak.status==="active";
                    const isRisk = streak.status==="at_risk";
                    const isBrk = streak.status==="broken";
                    return (
                      <div style={{position:"relative",display:"inline-block",marginTop:10}}>
                        {showMilestoneBurst && <MilestoneBurst/>}
                        <div style={{
                          display:"inline-flex",alignItems:"center",gap:6,
                          padding:"4px 10px 4px 6px",borderRadius:24,
                          background:isBrk?"transparent":isRisk?"#FFFDF5":"rgba(196,149,106,.08)",
                          border:`1px solid ${isBrk?"var(--line)":isRisk?"#F0D090":"var(--accent-soft)"}`,
                          animation:isRisk?"streakAtRisk 2.2s ease-in-out infinite":undefined,
                          transition:"all .4s ease",
                        }}>
                          <FlameSVG status={streak.status} size={16}/>
                          <span style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isBrk?"var(--ink3)":isRisk?"#D4853C":"var(--accent)",lineHeight:1}}>
                            {isBrk&&streak.currentStreak===0?"mulai streak hari ini":`${displayedStreak} hari berturut-turut`}
                          </span>
                          {isRisk&&<span style={{fontSize:".7rem",lineHeight:1}}>⚡</span>}
                          {m&&!isBrk&&<span style={{fontSize:".7rem",lineHeight:1}}>{m.badge}</span>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {total>0 && (() => {
                const todayObj = new Date(todayStr+"T00:00:00");
                const thisMonthCount = allSorted.filter((e:any)=>{const d=new Date(e.date+"T00:00:00");return d.getMonth()===todayObj.getMonth()&&d.getFullYear()===todayObj.getFullYear();}).length;
                const moodTally:Record<number,number>={};
                allSorted.forEach((e:any)=>{if(e.mood!=null)moodTally[e.mood]=(moodTally[e.mood]||0)+1;});
                const topMoodIdx = Object.keys(moodTally).length ? parseInt(Object.entries(moodTally).sort((a,b)=>(b[1] as number)-(a[1] as number))[0][0]) : null;
                const topMood = topMoodIdx!=null ? MOODS[topMoodIdx] : null;
                return (
                  <div className="home-stats">
                    <div className="stat-item">
                      <span className="stat-val">{total}</span>
                      <span className="stat-lbl">catatan total</span>
                    </div>
                    <div style={{width:1,height:36,background:"var(--line)",alignSelf:"center"}}/>
                    <div className="stat-item">
                      <span className="stat-val">{thisMonthCount}</span>
                      <span className="stat-lbl">bulan ini</span>
                    </div>
                    {topMood && <><div style={{width:1,height:36,background:"var(--line)",alignSelf:"center"}}/>
                    <div className="stat-item">
                      <span className="stat-val" style={{fontSize:"1.5rem"}}>{topMood.emoji}</span>
                      <span className="stat-lbl">suasana dominan</span>
                    </div></>}
                  </div>
                );
              })()}
            </div>

            <div className="home-hero-right">
              {todayEntries.length===0 ? (
                <div className="ecard" onClick={()=>newEntry(todayStr)} style={{"--card-accent":"var(--accent)","--card-border":"var(--accent-soft)",background:"linear-gradient(135deg,#FFFCF7,#FFF5EA)",padding:"22px 24px"} as any}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--accent)",letterSpacing:".12em",textTransform:"uppercase",fontWeight:600,marginBottom:12}}>Tulis Hari Ini</p>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.25rem",fontWeight:300,fontStyle:"italic",color:"var(--ink)",lineHeight:1.5,marginBottom:16}}>{getPrompt(todayStr)}</p>
                  <div style={{display:"flex",alignItems:"center",gap:6,color:"var(--accent)",fontFamily:"'Lora',serif",fontSize:".8rem"}}>Mulai menulis <Ic d={IC.arrow} size={13} sw={2}/></div>
                </div>
              ) : (
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--accent)",letterSpacing:".1em",textTransform:"uppercase",fontWeight:600}}>Hari Ini</span>
                      <span className="today-count">{todayEntries.length}</span>
                    </div>
                    <button className="gb" onClick={()=>newEntry(todayStr)} style={{fontSize:".8rem",color:"var(--accent)"}}><Ic d={IC.plus} size={14} sw={2}/> Tulis lagi</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {todayEntries.map((e: any) => {
                      const m=entryMood(e);
                      const eTheme = e.theme ? NOTE_THEMES.find((t:any)=>t.id===e.theme) : null;
                      const isLocked = e.isLocked && !unlockedIds.includes(e.id);
                      return (
                        <div key={e.id} className="ecard" onClick={() => nav("read",e.id)} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent)","--card-border":eTheme?.accent||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.border:null)||m?.border||"var(--accent-soft)",background:eTheme?.bg||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.bg:null)||m?.bg||"var(--surface)",padding:"16px 20px",position:"relative",...((eTheme as any)?.dark?{"--ink":"#E8F8F6","--ink2":"rgba(168,228,222,.90)","--ink3":"rgba(110,188,182,.72)"}:{"--ink":"#2E2520","--ink2":"#8C7E73","--ink3":"#BEB3A8"})} as any}>
                           {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                           {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={20} color="var(--accent)"/></div>}
                           {e.isPinned && !isLocked && <div style={{position:"absolute",top:10,right:10,zIndex:3,color:"var(--accent)",opacity:.7}}><Ic d={IC.pin} size={12} sw={2}/></div>}
                           <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                             <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                               <div style={{display:"flex",alignItems:"center",gap:6}}>
                                 <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{timeStr(e.ts)}</span>
                                 {e.stickers?.length>0 && <span style={{fontSize:".7rem",opacity:.7}}>{e.stickers.slice(0,3).join("")}</span>}
                               </div>
                               <div style={{display:"flex",alignItems:"center",gap:5}}>
                                 {eTheme && !isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",padding:"1px 6px",borderRadius:6,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                                 {m && <span style={{fontSize:".88rem"}}>{m.emoji}</span>}
                               </div>
                             </div>
                             {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.08rem",fontWeight:500,color:"var(--ink)",marginBottom:3}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                             {isLocked
                               ? <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const}}>{makeDummy(Math.min(e.textWords||12,20),e.id+'x')}</p>
                               : (()=>{
                                   const lines=(e.text||'').split('\n').filter((l:string)=>/^--x?\s|^--x?$/.test(l));
                                   if(lines.length>0){const done=lines.filter((l:string)=>l.startsWith('--x')).length;return(<div>{lines.slice(0,3).map((l:string,i:number)=>{const isDone=l.startsWith('--x');return(<p key={i} style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:isDone?"var(--ink3)":"var(--ink2)",lineHeight:1.5,display:"flex",alignItems:"center",gap:5,textDecoration:isDone?"line-through":"none"}}><span style={{fontSize:".5rem",color:"var(--accent)",flexShrink:0}}>●</span>{l.replace(/^--x?\s?/,'')}</p>)})}<p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",marginTop:3}}>{done}/{lines.length} selesai</p></div>);}
                                   const ogImg = getLinkImage(e.text||'');
                                   const hasLinkB=(e.text||'').includes('[LINK:');
                                   const lColor=eTheme?.accent||"#C4952A";
                                   return <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:hasLinkB?lColor:"var(--ink2)",lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,flex:1}}>{getPreviewText(e.text||'')}</p>{ogImg&&<img src={ogImg} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:8,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>;
                                 })()
                             }
                           </div>
                         </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {allSorted.filter((e: any)=>e.date!==todayStr).length>0 && (
            <div className="s3">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:18}}>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:500,color:"var(--ink)"}}>Catatan Sebelumnya</h2>
                {allSorted.length>10 && <button className="gb" onClick={()=>nav("list")} style={{fontSize:".8rem"}}>Lihat semua <Ic d={IC.chevR} size={11} sw={2}/></button>}
              </div>
              <div className="home-grid">
                {allSorted.filter((e: any)=>e.date!==todayStr).slice(0,9).map((e: any,i: number) => {
                  const m=entryMood(e); const isLong=(e.text||"").length>120;
                  const eTheme = e.theme ? NOTE_THEMES.find((t:any)=>t.id===e.theme) : null;
                  const sameDay=(byDate[e.date]||[]).length;
                  const isLocked = e.isLocked && !unlockedIds.includes(e.id);
                  return (
                    <div key={e.id} className="ecard" onClick={() => nav("read",e.id)} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent-soft)","--card-border":eTheme?.accent||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.border:null)||m?.border||"var(--line)",background:eTheme?.bg||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.bg:null)||m?.bg||"var(--surface)",animation:`fadeUp .45s ease ${.18+i*.05}s both`,position:"relative",...((eTheme as any)?.dark?{"--ink":"#E8F8F6","--ink2":"rgba(168,228,222,.90)","--ink3":"rgba(110,188,182,.72)"}:{"--ink":"#2E2520","--ink2":"#8C7E73","--ink3":"#BEB3A8"})} as any}>
                       {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                       {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={18} color="var(--accent)"/></div>}
                       {e.isPinned && !isLocked && <div style={{position:"absolute",top:10,right:10,zIndex:3,color:"var(--accent)",opacity:.7}}><Ic d={IC.pin} size={12} sw={2}/></div>}
                       <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                         <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isLong?10:6}}>
                           <div style={{display:"flex",alignItems:"center",gap:6}}>
                             <span style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:eTheme?.accent||m?.color||"var(--ink2)"}}>{shortD(e.date)}</span>
                             {sameDay>1 && <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:"var(--ink3)",background:"var(--line)",borderRadius:8,padding:"1px 6px"}}>{timeStr(e.ts)}</span>}
                           </div>
                           <div style={{display:"flex",alignItems:"center",gap:6}}>
                             {eTheme && !isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 5px",borderRadius:5,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                             {e.stickers?.length>0 && <span style={{fontSize:".65rem",opacity:.6}}>{e.stickers.slice(0,2).join("")}</span>}
                             {m && <span style={{fontSize:".85rem"}}>{m.emoji}</span>}
                             <button className="gb del-icon" onClick={ev=>{ev.stopPropagation();requestDelete(e)}}><Ic d={IC.trash} size={13}/></button>
                           </div>
                         </div>
                         {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isLong?"1.06rem":"1rem",fontWeight:500,color:"var(--ink)",marginBottom:4,lineHeight:1.3}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                         {isLocked
                           ? <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:isLong?4:2,WebkitBoxOrient:"vertical" as const}}>{makeDummy(Math.min(e.textWords||12,30),e.id+'x')}</p>
                           : (()=>{
                               const lines=(e.text||'').split('\n').filter((l:string)=>/^--x?\s|^--x?$/.test(l));
                               if(lines.length>0){const done=lines.filter((l:string)=>l.startsWith('--x')).length;return(<div>{lines.slice(0,3).map((l:string,i:number)=>{const isDone=l.startsWith('--x');return(<p key={i} style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:isDone?"var(--ink3)":"var(--ink2)",lineHeight:1.5,display:"flex",alignItems:"center",gap:5,textDecoration:isDone?"line-through":"none"}}><span style={{fontSize:".5rem",color:"var(--accent)",flexShrink:0}}>●</span>{l.replace(/^--x?\s?/,'')}</p>)})}<p style={{fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink3)",marginTop:3}}>{done}/{lines.length} selesai</p></div>);}
                               const ogImg2=getLinkImage(e.text||'');
                               const hasLinkC=(e.text||'').includes('[LINK:');
                               const lColorC=eTheme?.accent||"#C4952A";
                               return <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:hasLinkC?lColorC:"var(--ink2)",lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:isLong?4:2,WebkitBoxOrient:"vertical" as const,flex:1}}>{getPreviewText(e.text||'')}</p>{ogImg2&&<img src={ogImg2} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:8,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>;
                             })()
                         }
                       </div>
                     </div>
                  );
                })}
              </div>
            </div>
          )}

          {total===0 && (
            <div className="s4" style={{padding:"56px 0",maxWidth:400}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"4.5rem",lineHeight:1,color:"var(--accent-soft)",marginBottom:-12,userSelect:"none"}}>"</div>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",fontStyle:"italic",color:"var(--ink3)",lineHeight:1.7}}>Menulis adalah cara terindah<br/>untuk berbicara dengan diri sendiri.</p>
            </div>
          )}
        </div>)}

        {/* ════════ WRITE ════════ */}
        {view==="write" && entry && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
            <button className="gb" onClick={()=>entry.text?.trim()?nav("read",selId):nav("home")}><Ic d={IC.back} size={17}/>Kembali</button>
            <button className="mob-only gb" onClick={()=>setShowMobActions(true)} style={{padding:"6px 8px"}}><Ic d={IC.dots} size={22} sw={2.5}/></button>
          </div>

          {/* ── Write Toolbar (desktop only) ── */}
          {(() => {
            const wc = (entry.text||"").trim().split(/\s+/).filter(Boolean).length;
            const curMood = entry.mood!=null ? MOODS[entry.mood] : null;
            const curColor = entry.color ? NOTE_COLORS.find((c:any)=>c.id===entry.color) : null;
            const curTheme = entry.theme ? NOTE_THEMES.find((t:any)=>t.id===entry.theme) : null;
            const curFont = entry.font ? NOTE_FONTS.find((f:any)=>f.id===entry.font) : null;
            const chevron = <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3.5l3 3 3-3"/></svg>;
            const close = ()=>setOpenDropdown(null);
            const openDrop = (e: React.MouseEvent<HTMLButtonElement>, key: string) => {
              if (openDropdown===key) { close(); return; }
              const r = e.currentTarget.getBoundingClientRect();
              setDropPos({top: r.bottom+6, left: r.left, right: r.right});
              setOpenDropdown(key);
            };
            return (
              <div className="write-toolbar">
                {openDropdown && <div style={{position:"fixed",inset:0,zIndex:499}} onClick={close}/>}
                {/* Date */}
                <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",flexShrink:0,padding:"0 8px 0 4px"}}>
                  {DAYS_SHORT[new Date(entry.date+"T00:00:00").getDay()]}, {new Date(entry.date+"T00:00:00").getDate()} {MONTHS[new Date(entry.date+"T00:00:00").getMonth()]}
                </span>
                <div style={{width:1,height:14,background:"var(--line)",flexShrink:0,margin:"0 4px"}}/>
                {/* Mood */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${curMood?" wact":""}`} onClick={e=>openDrop(e,"mood")}>
                    <span style={{fontSize:".95rem"}}>{curMood?curMood.emoji:"😊"}</span>{curMood?curMood.label:"Perasaan"}{chevron}
                  </button>
                  {openDropdown==="mood" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:170}}>
                      <span className="wdrop-label">Perasaan</span>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {MOODS.map((m,i)=>(
                          <button key={i} className="mood-chip" onClick={()=>{upd("mood",entry.mood===i?null:i);close();}} style={{border:entry.mood===i?`1.5px solid ${m.color}`:"1px solid transparent",background:entry.mood===i?m.bg:"transparent",color:entry.mood===i?m.color:"var(--ink2)",justifyContent:"flex-start",fontWeight:entry.mood===i?500:400}}>
                            <span style={{fontSize:".95rem"}}>{m.emoji}</span>{m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Color */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${curColor?" wact":""}`} onClick={e=>openDrop(e,"color")}>
                    {curColor
                      ? <span style={{width:12,height:12,borderRadius:"50%",background:curColor.bg,border:"1.5px solid var(--accent-soft)",display:"inline-block",flexShrink:0}}/>
                      : <span style={{fontSize:".85rem"}}>🎨</span>}
                    Warna{chevron}
                  </button>
                  {openDropdown==="color" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:180}}>
                      <span className="wdrop-label">Warna</span>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"2px 2px 4px"}}>
                        {NOTE_COLORS.map((c:any)=>(
                          <button key={c.id} title={c.label} onClick={()=>{upd("color",c.id===entry.color?"":c.id);close();}} style={{width:28,height:28,borderRadius:"50%",border:`2.5px solid ${entry.color===c.id?(c.accent||"var(--accent)"):"transparent"}`,background:c.bg||"#FAF6F0",cursor:"pointer",boxShadow:`0 0 0 1px ${entry.color===c.id?"var(--line)":"transparent"}`,transition:"all .15s"}}/>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Theme */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${curTheme?" wact":""}`} onClick={e=>openDrop(e,"theme")}>
                    <span style={{fontSize:".85rem"}}>{curTheme?curTheme.emoji:"🌿"}</span>{curTheme?curTheme.label:"Tema"}{chevron}
                  </button>
                  {openDropdown==="theme" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:220}}>
                      <span className="wdrop-label">Tema Halaman</span>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {NOTE_THEMES.map((t:any)=>{
                          const isAct=entry.theme===t.id;
                          return (
                            <button key={t.id} onClick={()=>{upd("theme",isAct?"":t.id);close();}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:9,border:`1.5px solid ${isAct?t.accent:"transparent"}`,background:isAct?t.bg:"transparent",cursor:"pointer",transition:"all .12s",textAlign:"left" as const}}>
                              <span style={{fontSize:".9rem"}}>{t.emoji}</span>
                              <div>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isAct?t.accent:"var(--ink2)",fontWeight:isAct?600:400,lineHeight:1.2}}>{t.label}</p>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",lineHeight:1.2}}>{t.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {/* Font */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${curFont?" wact":""}`} onClick={e=>openDrop(e,"font")}>
                    <span style={{fontFamily:curFont?.family||"inherit",fontSize:".9rem",fontWeight:500}}>Aa</span>{curFont?curFont.label:"Font"}{chevron}
                  </button>
                  {openDropdown==="font" && (
                    <div className="wdrop" style={{top:dropPos.top,left:dropPos.left,minWidth:210}}>
                      <span className="wdrop-label">Font</span>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {NOTE_FONTS.map((f:any)=>{
                          const isAct=(entry.font||"")===f.id;
                          return (
                            <button key={f.id} onClick={()=>{upd("font",f.id);close();}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 9px",borderRadius:9,border:`1.5px solid ${isAct?"var(--accent)":"transparent"}`,background:isAct?"var(--accent-soft)":"transparent",cursor:"pointer",transition:"all .12s",textAlign:"left" as const}}>
                              <span style={{fontFamily:f.family,fontSize:"1.1rem",fontWeight:500,color:isAct?"var(--accent)":"var(--ink)",width:26,textAlign:"center" as const,flexShrink:0}}>{f.sample}</span>
                              <div>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isAct?"var(--accent)":"var(--ink2)",fontWeight:isAct?600:400,lineHeight:1.2}}>{f.label}</p>
                                <p style={{fontFamily:"'Lora',serif",fontSize:".65rem",color:"var(--ink3)",lineHeight:1.2}}>{f.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {/* Tags */}
                <div className="wdrop-wrap">
                  <button className={`wtbtn${(entry.tags||[]).length>0?" wact":""}`} onClick={e=>openDrop(e,"tags")}>
                    <span style={{fontSize:".85rem"}}>🏷️</span>
                    {(entry.tags||[]).length>0?`${(entry.tags||[]).length} label`:"Label"}{chevron}
                  </button>
                  {openDropdown==="tags" && (
                    <div className="wdrop" style={{top:dropPos.top,left:Math.max(8,dropPos.right-244),minWidth:240}}>
                      <span className="wdrop-label">Label</span>
                      {(entry.tags||[]).length>0 && (
                        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                          {(entry.tags||[]).map((t:string)=>(
                            <span key={t} className="tag-chip" onClick={()=>removeTag(t)}>#{t} ×</span>
                          ))}
                        </div>
                      )}
                      <input className="tag-input" placeholder="+ tambah label, Enter" value={tagInput}
                        onChange={(e:any)=>setTagInput(e.target.value)}
                        onKeyDown={(e:any)=>{if(e.key==="Enter"||e.key===","){e.preventDefault();addTag(tagInput);setTagInput("");}}}
                        style={{marginBottom:4}}
                        autoFocus
                      />
                      {tagInput.trim() && allTags.filter(({tag}:any)=>tag.includes(tagInput.replace(/^#+/,"").toLowerCase())&&!(entry.tags||[]).includes(tag)).slice(0,4).map(({tag}:any)=>(
                        <div key={tag} style={{padding:"4px 8px",cursor:"pointer",fontSize:".76rem",fontFamily:"'Lora',serif",color:"var(--ink2)",borderRadius:6,transition:"background .1s"}} onClick={()=>{addTag(tag);setTagInput("");}}
                          onMouseEnter={(e:any)=>e.currentTarget.style.background="var(--bg)"}
                          onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}>#{tag}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{flex:1}}/>
                {/* Right: word count + font size + sticker + done */}
                <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",padding:"0 6px",flexShrink:0}}>{wc} kata</span>
                <div style={{width:1,height:14,background:"var(--line)",flexShrink:0,margin:"0 2px"}}/>
                <button className="wtbtn" onClick={()=>changeFontSize(-1)} disabled={fontSize===0} style={{fontSize:".72rem",padding:"4px 8px",opacity:fontSize===0?.35:1}}>A−</button>
                <button className="wtbtn" onClick={()=>changeFontSize(1)} disabled={fontSize===2} style={{fontSize:".82rem",padding:"4px 8px",opacity:fontSize===2?.35:1}}>A+</button>
                <button className={`wtbtn${showStickers?" wact":""}`} onClick={()=>setShowStickers(!showStickers)} style={{gap:4}}>
                  <Ic d={IC.sticker} size={14} sw={1.4}/>Stiker{entry.stickers?.length?` (${entry.stickers.length})`:""}
                </button>
                {entry.text?.trim() && (
                  <button className="wtbtn wact" onClick={()=>nav("read",selId)} style={{fontWeight:500,marginLeft:4}}>
                    Selesai ✓
                  </button>
                )}
              </div>
            );
          })()}

          <div className="write-layout">
            <div className="write-sidebar s2">
              <div style={{marginBottom:28}}>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"3rem",fontWeight:300,color:"var(--ink)",lineHeight:1}}>{new Date(entry.date+"T00:00:00").getDate()}</p>
                <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",marginTop:4}}>{MONTHS[new Date(entry.date+"T00:00:00").getMonth()]} {new Date(entry.date+"T00:00:00").getFullYear()}</p>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink3)",marginTop:2}}>{DAYS_SHORT[new Date(entry.date+"T00:00:00").getDay()]}{timeStr(entry.ts) && ` · ${timeStr(entry.ts)}`}</p>
              </div>
              <div style={{marginBottom:20}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Warna</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {NOTE_COLORS.map(c=>(
                    <button key={c.id} title={c.label} onClick={()=>upd("color",c.id)} style={{width:26,height:26,borderRadius:"50%",border:`2.5px solid ${entry.color===c.id?(c.accent||"var(--accent)"):"transparent"}`,background:c.bg||"#FAF6F0",cursor:"pointer",boxShadow:`0 0 0 1px ${entry.color===c.id?"var(--line)":"transparent"}`,transition:"all .15s"}}/>
                  ))}
                </div>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginTop:14,marginBottom:8,letterSpacing:".04em"}}>Tema</p>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {NOTE_THEMES.map(t=>{
                    const isActive = entry.theme===t.id;
                    return (
                      <button key={t.id} onClick={()=>upd("theme", isActive ? '' : t.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:9,border:`1.5px solid ${isActive?t.accent:"var(--line)"}`,background:isActive?t.bg:"transparent",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                        <span style={{fontSize:".95rem"}}>{t.emoji}</span>
                        <div>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isActive?t.accent:"var(--ink2)",fontWeight:isActive?600:400,lineHeight:1.2}}>{t.label}</p>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",lineHeight:1.2}}>{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Font</p>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {NOTE_FONTS.map(f=>{
                    const isActive=(entry.font||'')===f.id;
                    return (
                      <button key={f.id} onClick={()=>upd("font",f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:9,border:`1.5px solid ${isActive?"var(--accent)":"var(--line)"}`,background:isActive?"var(--accent-soft)":"transparent",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                        <span style={{fontFamily:f.family,fontSize:"1.1rem",fontWeight:500,color:isActive?"var(--accent)":"var(--ink)",width:28,textAlign:"center",flexShrink:0}}>{f.sample}</span>
                        <div>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:isActive?"var(--accent)":"var(--ink2)",fontWeight:isActive?600:400,lineHeight:1.2}}>{f.label}</p>
                          <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",lineHeight:1.2}}>{f.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mood-col">
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Perasaan</p>
                {MOODS.map((m,i) => (
                  <button key={i} className="mood-chip" onClick={()=>upd("mood",entry.mood===i?null:i)} style={{border:entry.mood===i?`1.5px solid ${m.color}`:undefined,background:entry.mood===i?m.bg:undefined,color:entry.mood===i?m.color:"var(--ink2)",fontWeight:entry.mood===i?500:400,justifyContent:"flex-start"}}><span style={{fontSize:"1rem"}}>{m.emoji}</span>{m.label}</button>
                ))}
              </div>
              <div style={{marginTop:20}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Label</p>
                {(entry.tags||[]).length > 0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                    {(entry.tags||[]).map((t:string) => (
                      <span key={t} className="tag-chip" onClick={()=>removeTag(t)}>#{t} ×</span>
                    ))}
                  </div>
                )}
                <input className="tag-input" placeholder="+ tambah label, Enter" value={tagInput}
                  onChange={(e:any)=>setTagInput(e.target.value)}
                  onKeyDown={(e:any)=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(tagInput);setTagInput('');}}}
                />
                {tagInput.trim() && allTags.filter(({tag})=>tag.includes(tagInput.replace(/^#+/,'').toLowerCase())&&!(entry.tags||[]).includes(tag)).slice(0,5).map(({tag})=>(
                  <div key={tag} style={{padding:"4px 10px",cursor:"pointer",fontSize:".76rem",fontFamily:"'Lora',serif",color:"var(--ink2)",borderRadius:6,transition:"background .1s"}} onClick={()=>{addTag(tag);setTagInput('');}}
                    onMouseEnter={(e:any)=>e.currentTarget.style.background="var(--bg)"}
                    onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}>#{tag}</div>
                ))}
              </div>
            </div>

            <div className="write-main s3">
              {/* Mobile: compact date (sidebar is hidden on mobile) */}
              <div className="mob-only" style={{alignItems:"center",gap:8,marginBottom:20,paddingBottom:16,borderBottom:"1px solid var(--line)"}}>
                <div style={{flex:1}}>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.55rem",fontWeight:300,color:"var(--ink)",lineHeight:1}}>{new Date(entry.date+"T00:00:00").getDate()}</p>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",marginTop:2}}>{MONTHS[new Date(entry.date+"T00:00:00").getMonth()]} {new Date(entry.date+"T00:00:00").getFullYear()} · {DAYS_SHORT[new Date(entry.date+"T00:00:00").getDay()]}{timeStr(entry.ts)?` · ${timeStr(entry.ts)}`:""}</p>
                </div>
                <button className="gb" onClick={()=>setShowMobStyle(true)} style={{padding:"7px 14px",borderRadius:20,border:"1px solid var(--line)",background:"var(--surface)",fontSize:".78rem",color:"var(--ink2)",gap:5}}>
                  🎨 Gaya
                </button>
              </div>
              <div style={{marginBottom:24}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink2)",marginBottom:10,letterSpacing:".04em"}}>Bagaimana perasaanmu?</p>
                <div className="mood-grid">
                  {MOODS.map((m,i) => (
                    <button key={i} className="mood-chip" onClick={()=>upd("mood",entry.mood===i?null:i)} style={{border:entry.mood===i?`1.5px solid ${m.color}`:undefined,background:entry.mood===i?m.bg:undefined,color:entry.mood===i?m.color:"var(--ink2)",fontWeight:entry.mood===i?500:400}}><span style={{fontSize:"1rem"}}>{m.emoji}</span>{m.label}</button>
                  ))}
                </div>
              </div>

              <input type="text" value={entry.title||""} onChange={(e: any)=>upd("title",e.target.value)} placeholder="Judul (opsional)" style={{fontSize:"1.8rem",fontWeight:400,padding:"4px 0",letterSpacing:"-0.02em",marginBottom:8,fontFamily:entryFontFamily(entry)}}/>
              <div className="line-h" style={{marginBottom:16}}/>

              {entry.stickers?.length > 0 && (
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:16}}>
                  {entry.stickers.map((s: string,i: number) => (
                    <span key={i} onClick={()=>toggleSticker(s)} style={{fontSize:"1.3rem",cursor:"pointer",transition:"transform .15s",padding:2,borderRadius:6,background:"var(--accent-soft)",display:"inline-flex"}}>{s}</span>
                  ))}
                </div>
              )}

              <LiveEditor text={entry.text||""} onChange={t=>upd("text",t)} onUploadImage={uploadImage} placeholder={getPrompt(entry.date)} autoFocus fontSize={fontSizeRem} fontFamily={entryFontFamily(entry)}/>

              <div className="mob-only" style={{marginTop:20,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontFamily:"'Lora',serif",fontSize:".73rem",color:"var(--ink3)"}}>{getPreviewText(entry.text||"").trim().split(/\s+/).filter(Boolean).length} kata</span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <button className="gb" onClick={()=>changeFontSize(-1)} disabled={fontSize===0} style={{fontSize:".7rem",padding:"2px 6px",opacity:fontSize===0?.4:1}}>A−</button>
                    <button className="gb" onClick={()=>changeFontSize(1)} disabled={fontSize===2} style={{fontSize:".85rem",padding:"2px 6px",opacity:fontSize===2?.4:1}}>A+</button>
                  </div>
                  <button className="gb" onClick={()=>setShowStickers(!showStickers)} style={{fontSize:".8rem",color:showStickers?"var(--accent)":"var(--ink2)"}}><Ic d={IC.sticker} size={16} sw={1.4}/>Stiker{entry.stickers?.length?` (${entry.stickers.length})`:""}</button>
                </div>
                {entry.text?.trim() && <button className="gb" onClick={()=>nav("read",selId)} style={{color:"var(--accent)",fontWeight:500,fontSize:".84rem"}}>Selesai ✓</button>}
              </div>
              {/* Desktop fixed finish button rendered via portal below */}

              {showStickers && (
                <div style={{marginTop:16}}>
                  <StickerPicker stickers={entry.stickers||[]} onToggle={toggleSticker} onClose={()=>setShowStickers(false)}/>
                </div>
              )}
            </div>
          </div>
        </div>)}

        {/* ════════ DESKTOP FIXED SELESAI BUTTON ════════ */}
        {view==="write" && entry?.text?.trim() && (
          <button
            className="desk-only desk-selesai-fab"
            onClick={()=>nav("read",selId)}
            onMouseEnter={e=>{const b=e.currentTarget;b.style.transform="translateY(-3px) scale(1.03)";b.style.boxShadow="0 14px 36px rgba(196,149,106,.55)";}}
            onMouseLeave={e=>{const b=e.currentTarget;b.style.transform="";b.style.boxShadow="0 6px 24px rgba(196,149,106,.38)";}}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Selesai
          </button>
        )}

        {/* ════════ READ ════════ */}
        {view==="read" && entry && (<div>
          <div className="s1 no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:40}}>
            <button className="gb" onClick={()=>nav("home")}><Ic d={IC.back} size={17}/>Beranda</button>
            <button className="mob-only gb" onClick={()=>setShowMobActions(true)} style={{padding:"6px 8px"}}><Ic d={IC.dots} size={22} sw={2.5}/></button>
          </div>

          <div className="read-layout" ref={exportRef} data-export-root>
            {entry.stickers?.length > 0 && <StickerDisplay stickers={entry.stickers}/>}
            <div style={{position:"relative",zIndex:1}}>
              <div className="s2" style={{width:40,height:2,borderRadius:1,background:readMood?.color||"var(--accent-soft)",marginBottom:20,transition:"background .5s"}}/>
              <div className="s2" style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <p style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:readMood?.color||"var(--ink2)",letterSpacing:".04em"}}>{fullD(entry.date)}</p>
                {timeStr(entry.ts) && <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>· {timeStr(entry.ts)}</span>}
              </div>
              <div className="s3" style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:20}}>
                {readMood && <span className="mood-chip" style={{border:`1px solid ${readMood.border}`,background:readMood.bg,color:readMood.color,cursor:"default"}}><span style={{fontSize:".95rem"}}>{readMood.emoji}</span>{readMood.label}</span>}
                {entry.stickers?.length > 0 && <div style={{display:"flex",gap:3}}>{entry.stickers.map((s: string,i: number) => <span key={i} style={{fontSize:"1.2rem",padding:2}}>{s}</span>)}</div>}
              </div>
              {(entry.tags||[]).length > 0 && (
                <div className="s3" style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                  {(entry.tags||[]).map((t:string)=>(
                    <span key={t} className="tag-chip" style={{cursor:"default"}}>#{t}</span>
                  ))}
                </div>
              )}
              {entry.title && <h1 className="s3" style={{fontFamily:entryFontFamily(entry),fontSize:"clamp(2rem,4vw,2.8rem)",fontWeight:400,color:"var(--ink)",marginBottom:28,lineHeight:1.2,maxWidth:"90%"}}>{entry.title}</h1>}
              {(() => {
                const text = entry.text || '';
                if (!text) return <div className="s4"><span style={{color:"var(--ink3)",fontStyle:"italic",fontFamily:"'Lora',serif",fontSize:"1rem"}}>Catatan ini masih kosong.</span></div>;
                const rBlocks = parseBlocks(text);
                const todoBlocks = rBlocks.filter(b => b.type === 'todo');
                const doneCount = todoBlocks.filter(b => b.type === 'todo' && b.done).length;
                const hasTodos = todoBlocks.length > 0;
                const sizeW: Record<string,string> = { sm:'40%', md:'65%', lg:'85%', full:'100%' };
                return (
                  <div className="s4">
                    {hasTodos && (
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                        <div style={{flex:1,height:3,borderRadius:3,background:"var(--line)",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.round(doneCount/todoBlocks.length*100)}%`,background:readMood?.color||"var(--accent)",borderRadius:3,transition:"width .4s ease"}}/>
                        </div>
                        <span style={{fontFamily:"'Lora',serif",fontSize:".75rem",color:"var(--ink3)",whiteSpace:"nowrap"}}>{doneCount}/{todoBlocks.length} selesai</span>
                      </div>
                    )}
                    {rBlocks.map((blk, bi) => {
                      if (blk.type === 'image') {
                        const w = sizeW[blk.size||'full'] || '100%';
                        return (
                          <div key={bi} style={{margin:"16px 0",width:w,marginTop:16,marginBottom:16,...(blk.align==='center'?{marginLeft:'auto',marginRight:'auto'}:blk.align==='right'?{marginLeft:'auto',marginRight:0}:{}),borderRadius:12,overflow:"hidden",cursor:"zoom-in"}} onClick={()=>setLightboxUrl(blk.url)}>
                            <img src={blk.url} alt="" style={{width:"100%",display:"block",borderRadius:12,maxHeight:520,objectFit:"cover"}}/>
                          </div>
                        );
                      }
                      if (blk.type === 'gallery') {
                        return (
                          <div key={bi} style={{margin:"16px 0",display:"grid",gridTemplateColumns:`repeat(${blk.cols},1fr)`,gap:6,borderRadius:12,overflow:"hidden"}}>
                            {blk.urls.map((url,j) => (
                              <div key={j} style={{aspectRatio:"1",borderRadius:8,overflow:"hidden",cursor:"zoom-in"}} onClick={()=>setLightboxUrl(url)}>
                                <img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (blk.type === 'todo') {
                        const accentColor = readMood?.color || 'var(--accent)';
                        // find original line index for toggleTodoLine
                        const rawLines = text.split('\n');
                        const rawLineIdx = rawLines.findIndex((l: any,li: number) => {
                          let seen = 0;
                          for (let k = 0; k <= li; k++) if (/^--x?\s|^--$|^--x$/.test(rawLines[k])) seen++;
                          return seen === rBlocks.slice(0, bi+1).filter(b=>b.type==='todo').length && /^--x?\s|^--$|^--x$/.test(rawLines[li]);
                        });
                        return (
                          <div key={bi} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:"1px solid var(--line)"}}>
                            <button onClick={()=>upd('text', toggleTodoLine(entry.text, rawLineIdx))} style={{flexShrink:0,width:22,height:22,borderRadius:"50%",border:`2px solid ${blk.done?accentColor:"var(--ink3)"}`,background:blk.done?accentColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .2s"}}>
                              {blk.done && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </button>
                            <span style={{fontFamily:entryFontFamily(entry),fontSize:`${fontSizeRem}rem`,lineHeight:1.7,color:blk.done?"var(--ink3)":"var(--ink)",textDecoration:blk.done?"line-through":"none",flex:1}}>{renderInline(blk.content)}</span>
                          </div>
                        );
                      }
                      if (blk.type === 'link') {
                        let hostname = '';
                        try { hostname = new URL(blk.url).hostname; } catch(_) {}
                        return (
                          <div key={bi} style={{margin:"12px 0"}}>
                            <a href={blk.url} target="_blank" rel="noopener noreferrer"
                              style={{display:"flex",gap:12,padding:"12px 14px",borderRadius:12,border:"1px solid var(--line)",background:"var(--bg)",textDecoration:"none",color:"inherit",overflow:"hidden"}}>
                              {blk.image && <img src={blk.image} alt="" style={{width:72,height:72,objectFit:"cover",borderRadius:8,flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                                  {blk.favicon && <img src={blk.favicon} alt="" style={{width:13,height:13,borderRadius:2,flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>}
                                  <span style={{fontSize:".68rem",color:"var(--ink3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hostname}</span>
                                </div>
                                <div style={{fontFamily:entryFontFamily(entry),fontSize:".88rem",fontWeight:600,color:"var(--ink)",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{blk.title||blk.url}</div>
                                {blk.description && <div style={{fontSize:".76rem",color:"var(--ink2)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{blk.description}</div>}
                              </div>
                            </a>
                          </div>
                        );
                      }
                      if (blk.type === 'table') {
                        const cols = blk.rows[0]?.length || 1;
                        return (
                          <div key={bi} style={{margin:"12px 0",overflowX:"auto"}}>
                            <table style={{borderCollapse:"collapse",width:"100%",fontFamily:entryFontFamily(entry),fontSize:`${fontSizeRem*0.9}rem`}}>
                              <tbody>
                                {blk.rows.map((row,r) => (
                                  <tr key={r}>
                                    {row.map((cell,c) => (
                                      <td key={c} style={{border:"1px solid var(--line)",padding:"7px 10px",color:"var(--ink)",fontWeight:r===0?600:400,background:r===0?"var(--bg)":"transparent",minWidth:60}}>{cell}</td>
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
                        return <div key={bi} className="rich-read" style={{fontFamily:entryFontFamily(entry),fontSize:`${fontSizeRem}rem`,lineHeight:fontLineH,color:"var(--ink)",wordBreak:"break-word"}} dangerouslySetInnerHTML={{__html:blk.content}}/>;
                      }
                      return blk.content.split('\n').map((line, li) => {
                        if (!line) return <div key={`${bi}-${li}`} style={{height:"1.1rem"}}/>;
                        const {align, text} = parseLineStyle(line);
                        return <p key={`${bi}-${li}`} style={{fontFamily:entryFontFamily(entry),fontSize:`${fontSizeRem}rem`,lineHeight:fontLineH,color:"var(--ink)",wordBreak:"break-word",textAlign:align as any}}>{renderInline(text)}</p>;
                      });
                    })}
                  </div>
                );
              })()}
              {entry.text && (
                <div className="s5" style={{marginTop:48}}>
                  <div className="line-h" style={{marginBottom:16}}/>
                  <div className="no-print" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{getPreviewText(entry.text||"").trim().split(/\s+/).filter(Boolean).length} kata</p>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button className="gb" onClick={()=>changeFontSize(-1)} disabled={fontSize===0} style={{fontSize:".7rem",padding:"2px 6px",opacity:fontSize===0?.4:1}}>A−</button>
                      <button className="gb" onClick={()=>changeFontSize(1)} disabled={fontSize===2} style={{fontSize:".85rem",padding:"2px 6px",opacity:fontSize===2?.4:1}}>A+</button>
                    </div>
                  </div>
                </div>
              )}
              {(byDate[entry.date]||[]).filter((e: any)=>e.id!==selId && e.text?.trim()).length>0 && (
                <div className="s5 no-print" style={{marginTop:24}}>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:"var(--ink3)",marginBottom:12,letterSpacing:".04em"}}>Catatan lain di hari yang sama</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {(byDate[entry.date]||[]).filter((e: any)=>e.id!==selId && e.text?.trim()).map((e: any) => {
                      const m=entryMood(e);
                      const eTheme=e.theme?NOTE_THEMES.find((t:any)=>t.id===e.theme):null;
                      const eColor=e.color?NOTE_COLORS.find((c:any)=>c.id===e.color):null;
                      const isLocked = e.isLocked && !unlockedIds.includes(e.id);
                      return (
                        <div key={e.id} className="ecard" onClick={() => nav("read",e.id)} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent-soft)","--card-border":eTheme?.accent||m?.border||"var(--line)",background:eTheme?.bg||eColor?.bg||m?.bg||"var(--surface)",padding:"14px 18px",position:"relative",...((eTheme as any)?.dark?{"--ink":"#E8F8F6","--ink2":"rgba(168,228,222,.90)","--ink3":"rgba(110,188,182,.72)"}:{"--ink":"#2E2520","--ink2":"#8C7E73","--ink3":"#BEB3A8"})} as any}>
                          {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                           {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={16} color="var(--accent)"/></div>}
                           <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                             <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                               <div style={{display:"flex",alignItems:"center",gap:6}}>
                                 <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{timeStr(e.ts)}</span>
                                 {e.stickers?.length>0 && <span style={{fontSize:".6rem"}}>{e.stickers.slice(0,3).join("")}</span>}
                               </div>
                               {m && <span style={{fontSize:".82rem"}}>{m.emoji}</span>}
                             </div>
                             {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:".98rem",fontWeight:500,color:"var(--ink)",marginBottom:2}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                             {(()=>{const ogI=!isLocked&&getLinkImage(e.text||'');return(<div style={{display:"flex",gap:8,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink2)",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const,flex:1}}>{isLocked?makeDummy(Math.min(e.textWords||12,20),e.id+'x'):getPreviewText(e.text||'')}</p>{ogI&&<img src={ogI} alt="" style={{width:46,height:46,objectFit:"cover",borderRadius:7,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>);})()}
                           </div>
                         </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>)}

        {/* ════════ CALENDAR ════════ */}
        {view==="calendar" && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:36}}>
            <button className="mob-only gb" onClick={()=>nav("home")}><Ic d={IC.back} size={17}/>Beranda</button>
            <h2 className="desk-only" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:400,color:"var(--ink)"}}>Kalender</h2>
          </div>
          <div className="cal-layout">
            <div className="cal-grid-wrap">
              <div className="s2" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
                <button className="gb" onClick={()=>{if(cM===0){setCM(11);setCY(cY-1)}else setCM(cM-1)}}><Ic d={IC.chevL} size={18} sw={1.8}/></button>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:500,color:"var(--ink)"}}>{MONTHS[cM]} {cY}</span>
                <button className="gb" onClick={()=>{if(cM===11){setCM(0);setCY(cY+1)}else setCM(cM+1)}}><Ic d={IC.chevR} size={18} sw={1.8}/></button>
              </div>
              <div className="s3" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
                {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",letterSpacing:".08em",padding:"6px 0"}}>{d}</div>)}
              </div>
              <div className="s4" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,justifyItems:"center"}}>
                {Array.from({length:firstDay(cY,cM)}).map((_,i)=><div key={`e${i}`}/>)}
                {Array.from({length:daysInMonth(cY,cM)}).map((_,i)=>{
                  const day=i+1;
                  const ds=`${cY}-${String(cM+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const has=hasDate(ds); const isT=ds===todayStr; const m=dateMood(ds);
                  const cnt=(byDate[ds]||[]).length;
                  return (
                    <button key={day} className="cal-day"
                      onClick={()=>{ if(has&&cnt===1)nav("read",(byDate[ds]||[])[0].id); else if(has)nav("dayview",ds); else newEntry(ds); }}
                      style={{background:has?(m?.soft||"var(--accent-soft)"):"none",fontWeight:has?600:400,border:isT?"1.5px solid var(--accent)":"1.5px solid transparent",color:has&&m?m.color:"var(--ink)"}}>
                      {day}
                      {has&&<span style={{position:"absolute",bottom:2,width:4,height:4,borderRadius:"50%",background:m?.color||"var(--accent)"}}/>}
                      {cnt>1&&<span style={{position:"absolute",top:1,right:1,fontSize:".5rem",color:m?.color||"var(--accent)",fontWeight:700}}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{marginTop:28,display:"flex",flexWrap:"wrap",gap:14,justifyContent:"center"}}>
                {MOODS.map((m,i)=><span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:"'Lora',serif",fontSize:".7rem",color:"var(--ink2)"}}><span style={{width:8,height:8,borderRadius:"50%",background:m.color,display:"inline-block"}}/>{m.label}</span>)}
              </div>
            </div>
            <div className="cal-sidebar s5">
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontWeight:500,color:"var(--ink)",marginBottom:16}}>Bulan Ini</h3>
              <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink2)",marginBottom:20,lineHeight:1.6}}>{monthEntries.length} catatan</p>
              {Object.keys(moodCounts).length>0 && (
                <div>
                  <p style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)",letterSpacing:".05em",marginBottom:12}}>Suasana hati</p>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {Object.entries(moodCounts).sort((a,b)=>(b[1] as number)-(a[1] as number)).map(([mi,count])=>{
                      const m=MOODS[parseInt(mi)]; const pct=Math.round(((count as number)/monthEntries.length)*100);
                      return (<div key={mi}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <span style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink2)",display:"flex",alignItems:"center",gap:6}}><span>{m.emoji}</span>{m.label}</span>
                          <span style={{fontFamily:"'Lora',serif",fontSize:".72rem",color:"var(--ink3)"}}>{count as number}×</span>
                        </div>
                        <div style={{height:4,borderRadius:2,background:"var(--line)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:m.color,width:`${pct}%`,transition:"width .5s ease"}}/></div>
                      </div>);
                    })}
                  </div>
                </div>
              )}
              {monthEntries.length===0 && <p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",fontStyle:"italic"}}>Belum ada catatan.</p>}
            </div>
          </div>
        </div>)}

        {/* ════════ DAY VIEW ════════ */}
        {view==="dayview" && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
            <button className="gb" onClick={()=>nav("calendar")}><Ic d={IC.back} size={17}/>Kalender</button>
            <button className="gb" onClick={()=>newEntry(selId as any)} style={{color:"var(--accent)",fontSize:".82rem"}}><Ic d={IC.plus} size={14} sw={2}/> Tulis lagi</button>
          </div>
          <h2 className="s2" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.6rem",fontWeight:400,color:"var(--ink)",marginBottom:6}}>{fullD(selId)}</h2>
          <p className="s2" style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:"var(--ink3)",marginBottom:24}}>{(byDate[selId as any]||[]).length} catatan</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(byDate[selId as any]||[]).map((e: any,i: number)=>{
              const m=entryMood(e);
              const eTheme = e.theme ? NOTE_THEMES.find((t:any)=>t.id===e.theme) : null;
              const isLocked = e.isLocked && !unlockedIds.includes(e.id);
              return (
                <div key={e.id} className="ecard" onClick={() => nav("read",e.id)} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent-soft)","--card-border":eTheme?.accent||m?.border||"var(--line)",background:eTheme?.bg||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.bg:null)||m?.bg||"var(--surface)",animation:`fadeUp .4s ease ${i*.06}s both`,position:"relative",...((eTheme as any)?.dark?{"--ink":"#E8F8F6","--ink2":"rgba(168,228,222,.90)","--ink3":"rgba(110,188,182,.72)"}:{"--ink":"#2E2520","--ink2":"#8C7E73","--ink3":"#BEB3A8"})} as any}>
                   {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                   {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={18} color="var(--accent)"/></div>}
                   {(()=>{const isDarkCard=(eTheme as any)?.dark;const dInk=isDarkCard?"#E8F8F6":"var(--ink)";const dInk2=isDarkCard?"rgba(168,228,222,.90)":"var(--ink2)";const dInk3=isDarkCard?"rgba(110,188,182,.72)":"var(--ink3)";const hasLinkD=!isLocked&&(e.text||'').includes('[LINK:');const lColorD=eTheme?.accent||"#C4952A";return(
                   <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                       <div style={{display:"flex",alignItems:"center",gap:8}}>
                         <span style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:dInk3}}>{timeStr(e.ts)}</span>
                         {e.stickers?.length>0 && <span style={{fontSize:".7rem",opacity:.7}}>{e.stickers.slice(0,4).join("")}</span>}
                       </div>
                       <div style={{display:"flex",alignItems:"center",gap:8}}>
                         {eTheme && !isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".65rem",padding:"1px 6px",borderRadius:6,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                         {m && <span className="mood-chip" style={{border:`1px solid ${m.border}`,background:m.bg,color:m.color,cursor:"default",padding:"3px 10px 3px 7px",fontSize:".72rem"}}><span style={{fontSize:".85rem"}}>{m.emoji}</span>{m.label}</span>}
                         <button className="gb del-icon" onClick={ev=>{ev.stopPropagation();requestDelete(e)}}><Ic d={IC.trash} size={13}/></button>
                       </div>
                     </div>
                     {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:500,color:dInk,marginBottom:6}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                     {(()=>{const ogI=!isLocked&&getLinkImage(e.text||'');return(<div style={{display:"flex",gap:10,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".86rem",color:hasLinkD?lColorD:dInk2,lineHeight:1.65,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:4,WebkitBoxOrient:"vertical" as const,flex:1}}>{isLocked?makeDummy(Math.min(e.textWords||15,35),e.id+'x'):getPreviewText(e.text||'')}</p>{ogI&&<img src={ogI} alt="" style={{width:58,height:58,objectFit:"cover",borderRadius:8,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>);})()}
                   </div>);})()}
                 </div>
              );
            })}
          </div>
        </div>)}

        {/* ════════ LIST ════════ */}
        {view==="list" && (<div>
          <div className="s1" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <button className="mob-only gb" onClick={()=>nav("home")}><Ic d={IC.back} size={17}/></button>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontWeight:400,color:"var(--ink)"}}>Semua Catatan</h2>
              <button onClick={()=>{setSelectMode(s=>!s);setSelectedIds(new Set());}} style={{fontFamily:"'Lora',serif",fontSize:".74rem",padding:"4px 12px",borderRadius:20,border:`1px solid ${selectMode?"var(--accent)":"var(--line)"}`,background:selectMode?"var(--accent)":"transparent",color:selectMode?"#fff":"var(--ink2)",cursor:"pointer",transition:"all .18s"}}>{selectMode?"Batal":"Pilih"}</button>
            </div>
            {/* Desktop: always-visible search */}
            <div className="desk-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="1.5" strokeLinecap="round" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><path d={IC.search}/></svg>
              <input className="search-bar" type="text" value={q} onChange={(e:any)=>setQ(e.target.value)} placeholder="Cari judul, isi, atau label..." style={{paddingLeft:42}}/>
            </div>
            {/* Mobile: toggle button */}
            <button className="mob-only gb" onClick={()=>setShowSearch(!showSearch)} style={{color:showSearch?"var(--accent)":"var(--ink2)"}}><Ic d={IC.search} size={17}/></button>
          </div>
          {/* Mobile: toggle search bar */}
          {showSearch && (
            <div className="mob-only" style={{position:"relative",marginBottom:16,animation:"fadeUp .3s ease both"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="1.5" strokeLinecap="round" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}><path d={IC.search}/></svg>
              <input className="search-bar" type="text" value={q} onChange={(e:any)=>setQ(e.target.value)} placeholder="Cari judul, isi, atau label..." autoFocus/>
            </div>
          )}
          {/* Tag filter row */}
          {allTags.length > 0 && (
            <div className="tag-filter-row">
              {activeTag && <span className="tag-chip active" onClick={()=>setActiveTag(null)}>× semua</span>}
              {allTags.map(({tag,count})=>(
                <span key={tag} className={`tag-chip ${activeTag===tag?"active":""}`} onClick={()=>setActiveTag(activeTag===tag?null:tag)}>
                  #{tag} <span style={{opacity:.6,fontSize:".6rem"}}>{count}</span>
                </span>
              ))}
            </div>
          )}
          <p className="s2" style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:"var(--ink3)",marginBottom:20}}>{filtered.length} catatan{(q.trim()||activeTag)?" ditemukan":""}</p>
          <div className="list-grid">
            {filtered.map((e: any,i: number)=>{
              const m=entryMood(e); const sameDay=(byDate[e.date]||[]).length;
              const eTheme = e.theme ? NOTE_THEMES.find((t:any)=>t.id===e.theme) : null;
              const isLocked = e.isLocked && !unlockedIds.includes(e.id);
              const isDarkCard=(eTheme as any)?.dark;
              const dInk=isDarkCard?"#E8F8F6":"var(--ink)";
              const dInk2=isDarkCard?"rgba(168,228,222,.90)":"var(--ink2)";
              const dInk3=isDarkCard?"rgba(110,188,182,.72)":"var(--ink3)";
              const hasLink=!isLocked&&(e.text||'').includes('[LINK:');
              const linkColor=eTheme?.accent||"#C4952A";
              const isSelected=selectedIds.has(e.id);
              return (
                <div key={e.id} className="ecard" onClick={() => {
                  if(selectMode){const s=new Set(selectedIds);s.has(e.id)?s.delete(e.id):s.add(e.id);setSelectedIds(s);}
                  else nav("read",e.id);
                }} style={{"--card-accent":eTheme?.accent||m?.color||"var(--accent-soft)","--card-border":eTheme?.accent||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.border:null)||m?.border||"var(--line)",background:eTheme?.bg||(e.color?NOTE_COLORS.find((c:any)=>c.id===e.color)?.bg:null)||m?.bg||"var(--surface)",animation:`fadeUp .4s ease ${i*.03}s both`,position:"relative",outline:isSelected?"2.5px solid var(--accent)":"none",outlineOffset:"-2px",transition:"outline .12s"} as any}>
                   {eTheme && <CardThemeBg themeId={eTheme.id} accent={eTheme.accent}/>}
                   {isLocked && <div className="locked-overlay"><Ic d={IC.lock} size={18} color="var(--accent)"/></div>}
                   {selectMode && (
                     <div style={{position:"absolute",top:10,left:10,zIndex:4,width:20,height:20,borderRadius:"50%",border:`2px solid ${isSelected?"var(--accent)":"rgba(128,128,128,.5)"}`,background:isSelected?"var(--accent)":"rgba(255,255,255,.85)",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                       {isSelected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                     </div>
                   )}
                   {!selectMode && e.isPinned && !isLocked && <div style={{position:"absolute",top:10,right:10,zIndex:3,color:"var(--accent)",opacity:.7}}><Ic d={IC.pin} size={12} sw={2}/></div>}
                   <div className={isLocked?"blur-card":""} style={{position:"relative",zIndex:1}}>
                     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                       <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:selectMode?28:0,transition:"padding .12s"}}>
                         <span style={{fontFamily:"'Lora',serif",fontSize:".76rem",color:eTheme?.accent||m?.color||dInk2}}>{shortD(e.date)}</span>
                         {sameDay>1 && <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:dInk3,background:"var(--line)",borderRadius:8,padding:"1px 6px"}}>{timeStr(e.ts)}</span>}
                       </div>
                       <div style={{display:"flex",alignItems:"center",gap:6}}>
                         {eTheme && !isLocked && <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",padding:"1px 5px",borderRadius:5,background:`${eTheme.accent}1A`,color:eTheme.accent,fontWeight:500,border:`1px solid ${eTheme.accent}30`}}>{eTheme.emoji} {eTheme.label}</span>}
                         {e.stickers?.length>0 && <span style={{fontSize:".6rem",opacity:.6}}>{e.stickers.slice(0,2).join("")}</span>}
                         {m&&<span style={{fontSize:".85rem"}}>{m.emoji}</span>}
                         {!selectMode && <button className="gb del-icon" onClick={ev=>{ev.stopPropagation();requestDelete(e)}}><Ic d={IC.trash} size={13}/></button>}
                       </div>
                     </div>
                     {(e.title||(isLocked&&e.titleWords>0)) && <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.04rem",fontWeight:500,color:dInk,marginBottom:3}}>{isLocked?makeDummy(e.titleWords||3,e.id+'t'):e.title}</p>}
                     {(()=>{const ogI=!isLocked&&getLinkImage(e.text||'');return(<div style={{display:"flex",gap:10,alignItems:"flex-start"}}><p style={{fontFamily:"'Lora',serif",fontSize:".82rem",color:hasLink?linkColor:dInk2,lineHeight:1.55,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" as const,flex:1}}>{isLocked?makeDummy(Math.min(e.textWords||12,25),e.id+'x'):getPreviewText(e.text||'')}</p>{ogI&&<img src={ogI} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:8,flexShrink:0,boxShadow:'0 0 0 1px rgba(128,128,128,.18),0 2px 6px rgba(0,0,0,.12)'}} onError={ev=>{(ev.target as HTMLImageElement).style.display='none'}}/>}</div>);})()}
                     {(e.tags||[]).length > 0 && !isLocked && (
                       <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>
                         {(e.tags||[]).slice(0,3).map((t:string)=>(
                           <span key={t} className="tag-chip" style={{fontSize:".62rem",padding:"1px 6px",cursor:"default"}}>#{t}</span>
                         ))}
                         {(e.tags||[]).length > 3 && <span style={{fontFamily:"'Lora',serif",fontSize:".62rem",color:"var(--ink3)"}}>+{(e.tags||[]).length-3}</span>}
                       </div>
                     )}
                   </div>
                 </div>
              );
            })}
          </div>
          {filtered.length===0 && <div style={{padding:"48px 0"}}><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.08rem",fontStyle:"italic",color:"var(--ink3)"}}>{(q.trim()||activeTag)?`Tidak ada catatan${activeTag?` dengan label #${activeTag}`:""}${q.trim()?" yang cocok":""}.`:"Belum ada catatan."}</p></div>}
        </div>)}
      </div>

      {/* ── Multi-select delete bar ── */}
      {selectMode && selectedIds.size > 0 && (
        <div className="sel-bar">
          <span className="sel-bar-count">{selectedIds.size} dipilih</span>
          <div className="sel-bar-div"/>
          <button className="sel-bar-btn" onClick={()=>{const all=filtered.map((e:any)=>e.id);setSelectedIds(new Set(all));}}>Pilih Semua</button>
          <div className="sel-bar-div"/>
          <button className="sel-bar-del" onClick={()=>{
            const hasLocked = Array.from(selectedIds).some(id => {
              const n = entries[id]; return n?.isLocked && !unlockedIds.includes(id);
            });
            if (hasLocked) { setBulkVerifyDelete(true); } else { setBulkDeleteConfirm(true); }
          }}>Hapus {selectedIds.size}</button>
        </div>
      )}

      {/* FAB — desktop only (hidden on mobile via CSS) */}
      {(view==="home"||view==="calendar"||view==="list") && !selectMode && (
        <button className="fab" onClick={()=>newEntry(todayStr)}><Ic d={IC.plus} size={22} sw={2}/></button>
      )}

      {/* ── Mobile bottom nav ── */}
      {(view==="home"||view==="list"||view==="calendar") && (
        <nav className="mob-nav">
          <button className={`mob-nav-btn ${view==="home"?"act":""}`} onClick={()=>nav("home")}>
            <Ic d={IC.home} size={20} sw={1.6} color={view==="home"?"var(--accent)":"var(--ink3)"}/>
            <span className="mlbl">Beranda</span>
          </button>
          <button className={`mob-nav-btn ${view==="list"?"act":""}`} onClick={()=>nav("list")}>
            <Ic d={IC.search} size={20} sw={1.5} color={view==="list"?"var(--accent)":"var(--ink3)"}/>
            <span className="mlbl">Cari</span>
          </button>
          <button className="mob-nav-new" onClick={()=>newEntry(todayStr)} aria-label="Tulis catatan baru">
            <Ic d={IC.plus} size={22} sw={2.2} color="#fff"/>
          </button>
          <button className={`mob-nav-btn ${view==="calendar"?"act":""}`} onClick={()=>nav("calendar")}>
            <Ic d={IC.cal} size={20} sw={1.5} color={view==="calendar"?"var(--accent)":"var(--ink3)"}/>
            <span className="mlbl">Kalender</span>
          </button>
          <button className="mob-nav-btn" onClick={()=>setShowLogout(true)}>
            <Ic d={IC.x} size={18} sw={1.5} color="var(--ink3)"/>
            <span className="mlbl">Logout</span>
          </button>
        </nav>
      )}

      {/* ── Mobile action sheet (write & read views) ── */}
      {showMobActions && (view==="write"||view==="read") && entry && (
        <BottomSheet onClose={()=>setShowMobActions(false)} title="Aksi">
            <button className="asheet-row" onClick={()=>{upd("isPinned",!entry.isPinned);setShowMobActions(false);}}>
              <Ic d={IC.pin} size={20} sw={1.8} color={entry.isPinned?"var(--accent)":"var(--ink2)"}/>
              <span style={{color:entry.isPinned?"var(--accent)":"var(--ink)"}}>{entry.isPinned?"Lepas Pin":"Pin Catatan"}</span>
            </button>
            <button className="asheet-row" onClick={()=>{setShowMobActions(false);if(!entry.isLocked)setShowShare(true);}} style={{opacity:entry.isLocked?.45:1,cursor:entry.isLocked?"not-allowed":"pointer"}}>
              <Ic d={IC.share} size={20} sw={1.8} color={entry.shareId?"var(--accent)":"var(--ink2)"}/>
              <span style={{color:entry.shareId?"var(--accent)":"var(--ink)"}}>Bagikan{entry.isLocked?" (Catatan Terkunci)":""}</span>
            </button>
            <button className="asheet-row" onClick={()=>{setShowDownloadModal(true);setShowMobActions(false);}}>
              <Ic d={IC.download} size={20} sw={1.8} color="var(--ink2)"/>
              <span>Unduh</span>
            </button>
            <button className="asheet-row" onClick={()=>{upd("isLocked",!entry.isLocked);setShowMobActions(false);}}>
              <Ic d={entry.isLocked?IC.lock:IC.unlock} size={20} sw={1.8} color={entry.isLocked?"var(--accent)":"var(--ink2)"}/>
              <span style={{color:entry.isLocked?"var(--accent)":"var(--ink)"}}>{entry.isLocked?"Lepas Kunci":"Kunci Catatan"}</span>
            </button>
            {view==="read" && (
              <button className="asheet-row" onClick={()=>{setShowMobActions(false);nav("write",selId);}}>
                <Ic d={IC.edit} size={20} sw={1.8} color="var(--ink2)"/>
                <span>Edit Catatan</span>
              </button>
            )}
            <div className="asheet-sep"/>
            <button className="asheet-row asheet-danger" onClick={()=>{setShowMobActions(false);requestDelete(entry);}}>
              <Ic d={IC.trash} size={20} sw={1.8} color="#B5705A"/>
              <span>Hapus Catatan</span>
            </button>
        </BottomSheet>
      )}

      {/* ── Mobile style sheet (write view: color + theme) ── */}
      {showMobStyle && view==="write" && entry && (
        <BottomSheet onClose={()=>setShowMobStyle(false)}>
          <div style={{padding:"0 20px 8px",overflowY:"auto",maxHeight:"65vh"}}>
              <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Warna Catatan</p>
              <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
                {NOTE_COLORS.map(c=>(
                  <button key={c.id} title={c.label} onClick={()=>upd("color",c.id)}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",padding:4}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:c.bg||"#FAF6F0",border:`2.5px solid ${entry.color===c.id?(c.accent||"var(--accent)"):"var(--line)"}`,boxShadow:entry.color===c.id?`0 0 0 3px ${c.accent||"var(--accent)"}30`:"none",transition:"all .15s"}}/>
                    <span style={{fontFamily:"'Lora',serif",fontSize:".6rem",color:entry.color===c.id?(c.accent||"var(--accent)"):"var(--ink3)",whiteSpace:"nowrap"}}>{c.label}</span>
                  </button>
                ))}
              </div>
              <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Tema Catatan</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
                {NOTE_THEMES.map(t=>{
                  const isActive=entry.theme===t.id;
                  return (
                    <button key={t.id} onClick={()=>upd("theme",isActive?'':t.id)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${isActive?t.accent:"var(--line)"}`,background:isActive?t.bg:"var(--surface)",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                      <span style={{fontSize:"1.2rem"}}>{t.emoji}</span>
                      <div>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".8rem",color:isActive?t.accent:"var(--ink)",fontWeight:isActive?600:400,lineHeight:1.2}}>{t.label}</p>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".68rem",color:"var(--ink3)",lineHeight:1.2}}>{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Font</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
                {NOTE_FONTS.map(f=>{
                  const isActive=(entry.font||'')===f.id;
                  return (
                    <button key={f.id} onClick={()=>upd("font",f.id)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${isActive?"var(--accent)":"var(--line)"}`,background:isActive?"var(--accent-soft)":"var(--surface)",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                      <span style={{fontFamily:f.family,fontSize:"1.2rem",fontWeight:500,color:isActive?"var(--accent)":"var(--ink)",flexShrink:0}}>{f.sample}</span>
                      <div>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".78rem",color:isActive?"var(--accent)":"var(--ink)",fontWeight:isActive?600:400,lineHeight:1.2}}>{f.label}</p>
                        <p style={{fontFamily:"'Lora',serif",fontSize:".66rem",color:"var(--ink3)",lineHeight:1.2}}>{f.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p style={{fontFamily:"'Lora',serif",fontSize:".74rem",color:"var(--ink2)",marginBottom:12,letterSpacing:".04em",fontWeight:500}}>Label</p>
              {(entry.tags||[]).length > 0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                  {(entry.tags||[]).map((t:string) => (
                    <span key={t} className="tag-chip" onClick={()=>removeTag(t)}>#{t} ×</span>
                  ))}
                </div>
              )}
              <input className="tag-input" placeholder="+ tambah label, Enter" value={tagInput}
                onChange={(e:any)=>setTagInput(e.target.value)}
                onKeyDown={(e:any)=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(tagInput);setTagInput('');}}}
                style={{marginBottom:8}}
              />
          </div>
        </BottomSheet>
      )}
    </div>
  );
}