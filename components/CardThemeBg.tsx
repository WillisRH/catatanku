import { memo } from 'react';
export const CardThemeBg = memo(function CardThemeBg({ themeId, accent }: { themeId: string; accent: string }) {
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
      {Array.from({length:10},(_,i)=>{const a=(i*36-10)*Math.PI/180;const r1=32,r2=52;return <line key={i} x1={268+Math.cos(a)*r1} y1={22+Math.sin(a)*r1} x2={268+Math.cos(a)*r2} y2={22+Math.sin(a)*r2} stroke={accent} strokeWidth="1.2" opacity=".14" strokeLinecap="round"/>;}).filter(Boolean)}
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
        @keyframes cau-sp{0%,100%{opacity:.18;transform:scale(1)}50%{transform:scale(1.35)}}
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
        <g key={`l${i}`} transform={`translate(${x},${y})rotate(${i%2===0?-20:20})`} opacity=".11">
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
  if (themeId==='eid') return (
    <svg style={{...s,opacity:1}} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <style>{`@keyframes eid-tw{0%,100%{opacity:.05}50%{opacity:.22}}@keyframes eid-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}@keyframes eid-bulb{0%,100%{opacity:.32}50%{opacity:.85}}`}</style>
        <filter id="eid-csf" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2"/></filter>
        <pattern id="eid-ckpat" patternUnits="userSpaceOnUse" width="5" height="5"><line x1="0" y1="0" x2="5" y2="5" stroke={accent} strokeWidth=".5" opacity=".8"/><line x1="5" y1="0" x2="0" y2="5" stroke={accent} strokeWidth=".5" opacity=".8"/></pattern>
      </defs>
      {/* Crescent */}
      <g transform="translate(276,24)" opacity=".18"><circle r="18" fill={accent}/><circle cx="6" cy="-4" r="15" fill="#F3FBF5"/></g>
      {/* Stars */}
      {([[20,18,3.5],[78,12,3],[148,22,4],[222,15,3],[55,80,3.5],[145,90,4],[238,75,3],[285,95,3.5],[18,120,3],[108,130,3.5],[200,125,3]] as number[][]).map(([cx,cy,R],i)=>{
        const pts=Array.from({length:12},(_,j)=>{const a=(j*30-90)*Math.PI/180;const rr=j%2===0?R:R*.42;return`${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`;}).join(' ');
        return <polygon key={`cs${i}`} points={pts} fill={accent} style={{animation:`eid-tw ${2.5+i*.3}s ease-in-out ${i*.18}s infinite`}} opacity=".15"/>;
      })}
      {/* String lights */}
      <path d="M-2,28 Q40,48 80,35 Q120,22 160,42 Q200,62 240,48 Q270,36 302,50" stroke={accent} strokeWidth=".9" opacity=".2" fill="none"/>
      {([[0,30,'#C94B20'],[40,46,accent],[80,36,'#D4920A'],[120,24,'#C94B20'],[160,44,accent],[200,62,'#D4920A'],[240,49,'#C94B20'],[280,38,accent],[300,51,'#D4920A']] as [number,number,string][]).map(([bx,by,bc],i)=>(
        <g key={`cb${i}`}><ellipse cx={bx} cy={by+5} rx="2.5" ry="3.5" fill={bc} style={{animation:`eid-bulb ${1.6+i*.4}s ease-in-out ${i*.22}s infinite`}} opacity=".62"/><ellipse cx={bx} cy={by+5} rx="4" ry="5.5" fill={bc} filter="url(#eid-csf)" opacity=".18" style={{animation:`eid-bulb ${1.6+i*.4}s ease-in-out ${i*.22}s infinite`}}/></g>
      ))}
      {/* Swaying lanterns */}
      {([[60,38,8,22,'3.8s',0],[150,30,7,18,'5s',1],[250,40,8,22,'4.5s',-1]] as [number,number,number,number,string,number][]).map(([cx,cy,hw,h,dur,di],i)=>{
        const lc=['#C94B20','#D4920A',accent][i%3];
        const del=`${Math.abs(di)*.5}s`;
        const by=14+h/2;
        return (
          <g key={`cl${i}`} transform={`translate(${cx},${cy})`}>
            <g style={{transformBox:'fill-box',transformOrigin:'50% 0%',animation:`eid-sway ${dur} ease-in-out ${del} infinite`} as any}>
              <line x1="0" y1="0" x2="0" y2="12" stroke={lc} strokeWidth=".8" opacity=".28"/>
              <rect x={-hw*.8} y={12} width={hw*1.6} height="3.5" rx="1.5" fill={lc} opacity=".22"/>
              <rect x={-hw} y={15} width={hw*2} height={h} rx={hw*.35} fill={lc} opacity=".13"/>
              <rect x={-hw} y={15} width={hw*2} height={h} rx={hw*.35} stroke={lc} strokeWidth="1" fill="none" opacity=".22"/>
              <line x1={-hw*.85} y1={15+h/2} x2={hw*.85} y2={15+h/2} stroke={lc} strokeWidth=".6" opacity=".22"/>
              <rect x={-hw*.8} y={15+h} width={hw*1.6} height="3" rx="1.5" fill={lc} opacity=".18"/>
              {Array.from({length:5},(_,k)=>{const fx=-hw*.7+k*(hw*1.4/4);return <line key={k} x1={fx} y1={15+h+3} x2={fx} y2={15+h+9} stroke={lc} strokeWidth=".8" opacity=".2"/>;})}</g></g>
        );
      })}
      {/* Ketupat */}
      {([[25,100,12],[145,118,10],[268,108,11]] as number[][]).map(([cx,cy,r],i)=>{
        const d=`${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}`;
        return (<g key={`ck${i}`}><polygon points={d} fill="url(#eid-ckpat)" opacity=".18"/><polygon points={d} fill={accent} opacity=".05"/><polygon points={d} stroke={accent} strokeWidth=".9" fill="none" opacity=".18"/></g>);
      })}
    </svg>
  );
  return null;
});