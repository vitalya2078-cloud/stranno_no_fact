// СТИЛЕВЫЕ КАДРЫ рубрики «А что если…»: одна сцена (роутер с котом, кольца Wi-Fi, сигнал соседа сквозь стену)
// в трёх вариантах фирменного стиля: A — неоновая диорама, B — бумажная аппликация, C — тёмный глянец.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont as unb } from "@remotion/google-fonts/Unbounded";
import { loadFont as man } from "@remotion/google-fonts/Manrope";
import { loadFont as geo } from "@remotion/google-fonts/Geologica";
import { loadFont as pfd } from "@remotion/google-fonts/PlayfairDisplay";

const U = unb("normal", { weights: ["500", "800"], subsets: ["cyrillic", "latin"] }).fontFamily;
const M = man("normal", { weights: ["600", "800"], subsets: ["cyrillic", "latin"] }).fontFamily;
const G = geo("normal", { weights: ["500", "800"], subsets: ["cyrillic", "latin"] }).fontFamily;
const P = pfd("italic", { weights: ["600"], subsets: ["cyrillic", "latin"] }).fontFamily;
const W = 1080, H = 1920;
const useT = () => useCurrentFrame() / 30;
const Grain: React.FC<{ o?: number; blend?: string }> = ({ o = 0.08, blend = "overlay" }) => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} style={{ position: "absolute", opacity: o, mixBlendMode: blend as any }}>
    <filter id={"gr" + blend}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 24} /></filter>
    <rect width={W} height={H} filter={`url(#gr${blend})`} /></svg>;
};

// ===================================================================== A. НЕОНОВАЯ ДИОРАМА (изометрия)
const S = 62, CX = 580, CY = 820;
const iso = (x: number, y: number, z: number): [number, number] => [CX + (x - y) * 0.866 * S, CY + (x + y) * 0.5 * S - z * S];
const pts = (p: [number, number, number][]) => p.map((q) => iso(...q).join(",")).join(" ");
const Cube: React.FC<{ x: number; y: number; z: number; w: number; d: number; h: number; top: string; l: string; r: string; edge?: string }> =
  ({ x, y, z, w, d, h, top, l, r, edge = "rgba(140,170,255,0.25)" }) => (<g strokeLinejoin="round">
    <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={l} stroke={edge} strokeWidth={1.5} />
    <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={r} stroke={edge} strokeWidth={1.5} />
    <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={top} stroke={edge} strokeWidth={1.5} />
  </g>);
const ring = (cx: number, cy: number, z: number, r: number) => {
  const a: string[] = []; for (let i = 0; i <= 64; i++) { const t = (i / 64) * Math.PI * 2; a.push(iso(cx + Math.cos(t) * r, cy + Math.sin(t) * r, z).join(",")); }
  return "M" + a.join(" L");
};
export const StyleA: React.FC = () => {
  const t = useT();
  const RX = 1.2, RY = 4.6, RZ = 3.05;                 // роутер
  const roomClip = pts([[0, 0, 0], [10, 0, 0], [10, 0, 7], [0, 0, 7], [0, 10, 7], [0, 10, 0], [10, 10, 0], [10, 0, 0]]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #18204a 0%, #0a0e22 48%, #04060f 100%)" }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <filter id="glowA" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="softA"><feGaussianBlur stdDeviation="22" /></filter>
          <clipPath id="roomA"><polygon points={pts([[0, 0, 0], [10, 0, 0], [10, 0, 7], [0, 0, 7], [0, 10, 7], [0, 10, 0], [10, 10, 0]])} /></clipPath>
          <linearGradient id="wallL" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1a2250" /><stop offset="1" stopColor="#11173a" /></linearGradient>
          <linearGradient id="wallR" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#141b42" /><stop offset="1" stopColor="#0d1230" /></linearGradient>
        </defs>
        {/* комната: пол, левая и правая стены */}
        <polygon points={pts([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]])} fill="#0e1330" />
        <polygon points={pts([[0, 0, 0], [0, 10, 0], [0, 10, 7], [0, 0, 7]])} fill="url(#wallL)" />
        <polygon points={pts([[0, 0, 0], [10, 0, 0], [10, 0, 7], [0, 0, 7]])} fill="url(#wallR)" />
        <polyline points={pts([[0, 10, 7], [0, 0, 7], [10, 0, 7]])} fill="none" stroke="#3a4a9a" strokeWidth={3} />
        <polyline points={pts([[0, 0, 0], [0, 0, 7]])} fill="none" stroke="#2a3570" strokeWidth={2} />
        {/* окно с ночным городом на правой стене */}
        <polygon points={pts([[5.6, 0, 2.6], [9, 0, 2.6], [9, 0, 5.8], [5.6, 0, 5.8]])} fill="#070a1c" stroke="#3a4a9a" strokeWidth={4} />
        {Array.from({ length: 18 }, (_, i) => { const x = 5.8 + (i % 6) * 0.52, z = 2.9 + Math.floor(i / 6) * 0.5 + ((i * 7) % 3) * 0.08;
          return <polygon key={i} points={pts([[x, 0, z], [x + 0.18, 0, z], [x + 0.18, 0, z + 0.22], [x, 0, z + 0.22]])} fill={i % 4 ? "#ffcf6a" : "#26305e"} opacity={0.85} />; })}
        {/* ковёр, кровать с подушкой, тумба, растение */}
        <polygon points={pts([[3, 3.5, 0.01], [8, 3.5, 0.01], [8, 8.5, 0.01], [3, 8.5, 0.01]])} fill="#151c45" stroke="#2a3570" strokeWidth={2} />
        <Cube x={5.2} y={0.2} z={0} w={4.4} d={3.2} h={1.1} top="#232c63" l="#1a2150" r="#141a40" />
        <Cube x={5.4} y={0.4} z={1.1} w={4.0} d={2.8} h={0.35} top="#d9def5" l="#aab3dc" r="#8d96c4" />
        <Cube x={5.8} y={0.5} z={1.45} w={1.6} d={1.0} h={0.45} top="#ffffff" l="#cfd5f0" r="#b5bde3" />
        <Cube x={0.2} y={3.6} z={0} w={1.8} d={2.4} h={2.6} top="#2b356f" l="#20285a" r="#1a2150" />
        <Cube x={0.4} y={8.2} z={0} w={1.0} d={1.0} h={1.0} top="#3a2a5a" l="#2b1f46" r="#24193c" />
        {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={iso(0.9, 8.7, 1.8)[0] + (i - 2) * 18} cy={iso(0.9, 8.7, 1.8)[1] - Math.abs(i - 2) * -8} rx={14} ry={48} fill="#2fd39a" opacity={0.75}
          transform={`rotate(${(i - 2) * 18} ${iso(0.9, 8.7, 1.8)[0]} ${iso(0.9, 8.7, 1.4)[1]})`} />)}
        {/* сигнал соседа сквозь стену — малиновый */}
        <g clipPath="url(#roomA)" filter="url(#glowA)">
          {[1, 2, 3, 4, 5].map((k) => { const r = ((k * 1.5 + t * 1.2) % 7.5) + 0.5;
            return <path key={k} d={ring(4.2, -1.5, 2.2, r)} fill="none" stroke="#ff3fa4" strokeWidth={4} opacity={0.75 * (1 - r / 8)} />; })}
        </g>
        {/* роутер и кот */}
        <Cube x={RX - 0.6} y={RY - 0.7} z={2.6} w={1.2} d={1.4} h={0.32} top="#e8ecff" l="#b9c2ee" r="#9aa4d6" />
        {[-0.4, 0.4].map((d, i) => { const [x1, y1] = iso(RX - 0.3, RY + d, 2.92), [x2, y2] = iso(RX - 0.3, RY + d, 3.9);
          return <line key={i} x1={x1} y1={y1} x2={x2 + (i ? 10 : -10)} y2={y2} stroke="#cfd5f0" strokeWidth={7} strokeLinecap="round" />; })}
        {[[-0.1, 0], [0.2, 0.3], [0.5, 0.6]].map(([a, b], i) => <circle key={i} cx={iso(RX + 0.6, RY - 0.4 + a, 2.75)[0]} cy={iso(RX + 0.6, RY - 0.4 + a, 2.75)[1]} r={4} fill="#3cf2ff" filter="url(#glowA)" />)}
        {(() => { const [cx, cy] = iso(RX, RY, 3.0); return (<g transform={`translate(${cx},${cy - 34})`}>
          <ellipse cx={0} cy={6} rx={88} ry={46} fill="#ff9a3c" />
          <ellipse cx={-6} cy={-6} rx={70} ry={34} fill="#ffb15e" />
          <circle cx={64} cy={-22} r={34} fill="#ff9a3c" />
          <path d="M44,-50 l8,-28 l16,22z M76,-52 l14,-24 l6,28z" fill="#ff9a3c" />
          <path d="M52,-22 q8,6 16,0 M74,-24 q8,6 16,0" fill="none" stroke="#5a2a10" strokeWidth={4} strokeLinecap="round" />
          <path d="M-86,20 q-40,10 -30,60 q6,20 26,12" fill="none" stroke="#ff9a3c" strokeWidth={20} strokeLinecap="round" />
          <ellipse cx={0} cy={-10} rx={90} ry={44} fill="none" stroke="#3cf2ff" strokeOpacity={0.35} strokeWidth={3} />
        </g>); })()}
        {/* кольца нашего Wi-Fi — голубые, в трёх уровнях высоты */}
        <g clipPath="url(#roomA)" filter="url(#glowA)">
          {[1.4, 3.0, 4.6].map((z, zi) => [0, 1, 2, 3, 4, 5].map((k) => { const r = ((k * 1.25 + t * 1.5) % 7.5) + 0.6;
            return <path key={zi + "_" + k} d={ring(RX, RY, z, r)} fill="none" stroke="#3cf2ff" strokeWidth={zi === 1 ? 5 : 3}
              opacity={(zi === 1 ? 0.9 : 0.4) * (1 - r / 8.2)} />; }))}
        </g>
        <ellipse cx={iso(RX, RY, 3)[0]} cy={iso(RX, RY, 3)[1]} rx={220} ry={120} fill="#3cf2ff" opacity={0.12} filter="url(#softA)" />
      </svg>
      {/* типографика бренда */}
      <div style={{ position: "absolute", left: 80, top: 150, fontFamily: M, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: "#3cf2ff" }}>А ЧТО ЕСЛИ…</div>
      <div style={{ position: "absolute", left: 76, top: 200, fontFamily: U, fontWeight: 800, fontSize: 84, lineHeight: 1.05, color: "#fff", width: 900 }}>
        WI-FI БЫЛО<br />БЫ ВИДНО</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1430, textAlign: "center", fontFamily: U, fontWeight: 800, fontSize: 54, lineHeight: 1.2, color: "#fff" }}>
        <span>РОУТЕР СОСЕДА </span><span style={{ color: "#ff3fa4", textShadow: "0 0 24px rgba(255,63,164,0.8)" }}>СВЕТИТ</span>
        <br /><span style={{ color: "rgba(255,255,255,0.35)" }}>ТЕБЕ В ПОДУШКУ</span></div>
      <Grain o={0.09} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};

// ===================================================================== B. БУМАЖНАЯ АППЛИКАЦИЯ (слои с тенями)
const PB = { ink: "#1d2a33", cream: "#f4ead8", sand: "#e9d6b4", teal: "#2a7f8a", deep: "#173f48", coral: "#ff7a59", mustard: "#f2b134", rose: "#e85d75" };
export const StyleB: React.FC = () => {
  const t = useT();
  const sh = "url(#paperSh)";
  const rings = (cx: number, cy: number, col: string[], n: number, max: number, start: number, end: number, ph: number) =>
    Array.from({ length: n }, (_, k) => { const r = ((k / n + t * 0.18 + ph) % 1) * max + 40;
      return <path key={k} d={`M${cx + Math.cos(start) * r},${cy + Math.sin(start) * r} A${r},${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ${cx + Math.cos(end) * r},${cy + Math.sin(end) * r}`}
        fill="none" stroke={col[k % col.length]} strokeWidth={26} strokeLinecap="round" filter={sh} opacity={1 - (r - 40) / max * 0.6} />; });
  return (
    <AbsoluteFill style={{ background: PB.deep }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <filter id="paperSh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#0b1a1f" floodOpacity="0.45" /></filter>
          <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={3} seed={3} /><feDisplacementMap in="SourceGraphic" scale="10" /></filter>
        </defs>
        {/* задняя стена-лист и пол */}
        <rect x={70} y={470} width={940} height={980} rx={10} fill={PB.cream} filter={sh} />
        <rect x={70} y={1230} width={940} height={220} fill={PB.sand} filter={sh} />
        {/* окно */}
        <rect x={600} y={560} width={330} height={400} rx={8} fill={PB.teal} filter={sh} />
        <rect x={620} y={580} width={290} height={360} fill={PB.deep} />
        {[0, 1, 2].map((i) => <rect key={i} x={640 + i * 90} y={780 - i * 60} width={70} height={160 + i * 60} fill="#22525c" />)}
        {Array.from({ length: 9 }, (_, i) => <rect key={i} x={652 + (i % 3) * 90} y={810 - (i % 3) * 60 + Math.floor(i / 3) * 40} width={16} height={18} fill={PB.mustard} />)}
        <circle cx={860} cy={640} r={34} fill={PB.cream} />
        {/* дыра в стене слева, из неё — сигнал соседа (розовые дуги) */}
        <path d="M70,640 q40,-20 60,30 t-10,90 q-30,40 -50,20z" fill={PB.deep} filter="url(#rough)" />
        <g>{rings(70, 720, [PB.rose, PB.coral], 5, 520, -1.0, 1.0, 0.3)}</g>
        {/* консоль, роутер, кот */}
        <rect x={200} y={1040} width={360} height={200} rx={14} fill={PB.teal} filter={sh} />
        <rect x={230} y={1240} width={26} height={110} fill={PB.ink} /><rect x={505} y={1240} width={26} height={110} fill={PB.ink} />
        <g>{rings(380, 990, [PB.mustard, PB.coral], 6, 560, Math.PI * 1.05, Math.PI * 1.95, 0)}</g>
        <rect x={290} y={975} width={180} height={65} rx={14} fill={PB.ink} filter={sh} />
        <rect x={310} y={900} width={14} height={90} rx={7} fill={PB.ink} /><rect x={436} y={900} width={14} height={90} rx={7} fill={PB.ink} />
        {[0, 1, 2].map((i) => <circle key={i} cx={330 + i * 28} cy={1008} r={6} fill={PB.mustard} />)}
        <g filter={sh} transform="translate(380,950)">
          <path d="M-110,20 q-10,-60 60,-70 q90,-10 120,40 q20,40 -20,50 z" fill={PB.coral} />
          <circle cx={60} cy={-50} r={42} fill={PB.coral} />
          <path d="M30,-80 l10,-36 l22,28z M70,-86 l20,-30 l8,36z" fill={PB.coral} />
          <path d="M40,-50 q9,7 18,0 M68,-52 q9,7 18,0" fill="none" stroke={PB.ink} strokeWidth={5} strokeLinecap="round" />
          <path d="M-110,20 q-50,10 -40,60" fill="none" stroke={PB.coral} strokeWidth={22} strokeLinecap="round" />
        </g>
        {/* растение */}
        <g filter={sh}><rect x={820} y={1150} width={110} height={110} rx={10} fill={PB.mustard} />
          {[-40, -15, 10, 35].map((a, i) => <ellipse key={i} cx={875 + a * 1.2} cy={1080} rx={24} ry={80} fill={i % 2 ? "#3d9a6a" : "#2f8a5a"} transform={`rotate(${a} 875 1150)`} />)}</g>
      </svg>
      <div style={{ position: "absolute", left: 80, top: 140, display: "inline-block", padding: "14px 26px", background: PB.mustard, color: PB.ink,
        fontFamily: G, fontWeight: 800, fontSize: 30, letterSpacing: 6, transform: "rotate(-2deg)", boxShadow: "0 8px 0 rgba(0,0,0,0.25)" }}>А ЧТО ЕСЛИ…</div>
      <div style={{ position: "absolute", left: 80, top: 230, fontFamily: G, fontWeight: 800, fontSize: 92, lineHeight: 1.0, color: PB.cream }}>Wi-Fi было<br />бы видно?</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 1500, padding: "26px 30px", background: PB.cream, transform: "rotate(-1.2deg)",
        boxShadow: "0 14px 0 rgba(0,0,0,0.25)", textAlign: "center", fontFamily: G, fontWeight: 800, fontSize: 60, lineHeight: 1.15, color: PB.ink }}>
        Роутер соседа <span style={{ background: PB.rose, color: PB.cream, padding: "0 12px" }}>светит</span><br /><span style={{ opacity: 0.3 }}>тебе в подушку</span></div>
      <Grain o={0.16} blend="multiply" />
    </AbsoluteFill>
  );
};

// ===================================================================== C. ТЁМНЫЙ ГЛЯНЕЦ (минимализм, один герой-объект)
export const StyleC: React.FC = () => {
  const t = useT();
  const GOLD = "#e8c98a";
  const cx = 540, cy = 1060;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 52%, #26262e 0%, #0d0d11 50%, #050506 100%)" }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="body" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3a3a44" /><stop offset="0.5" stopColor="#15151b" /><stop offset="1" stopColor="#060608" /></linearGradient>
          <linearGradient id="spec" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity={0} /><stop offset="0.5" stopColor="#fff" stopOpacity={0.55} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></linearGradient>
          <linearGradient id="floorFade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#050506" stopOpacity={1} /></linearGradient>
          <filter id="glowC" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bokeh"><feGaussianBlur stdDeviation="5" /></filter>
          <radialGradient id="catRim"><stop offset="0.7" stopColor="#000" /><stop offset="1" stopColor={GOLD} /></radialGradient>
        </defs>
        {/* пылинки-боке */}
        {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 397) % 1080} cy={300 + ((i * 211) % 1300) + Math.sin(t + i) * 10} r={6 + (i % 4) * 5}
          fill={GOLD} opacity={0.08 + (i % 3) * 0.05} filter="url(#bokeh)" />)}
        {/* кольца — тонкие золотые линии, эллипсы в перспективе */}
        <g filter="url(#glowC)">
          {Array.from({ length: 7 }, (_, k) => { const p = (k / 7 + t * 0.12) % 1; const r = 140 + p * 760;
            return <ellipse key={k} cx={cx} cy={cy - 10} rx={r} ry={r * 0.28} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={(1 - p) * 0.9} />; })}
          {Array.from({ length: 4 }, (_, k) => { const p = (k / 4 + t * 0.12 + 0.1) % 1; const r = 120 + p * 520;
            return <path key={k} d={`M${cx - r},${cy - 60} A${r},${r} 0 0 1 ${cx + r},${cy - 60}`} fill="none" stroke={GOLD} strokeWidth={1.5} opacity={(1 - p) * 0.5} />; })}
        </g>
        {/* глянцевый пол-отражение */}
        <g opacity={0.25} transform={`translate(0,${2 * (cy + 70)}) scale(1,-1)`}>
          <rect x={cx - 230} y={cy} width={460} height={70} rx={22} fill="url(#body)" />
        </g>
        {/* роутер-герой */}
        <rect x={cx - 150} y={cy - 210} width={16} height={160} rx={8} fill="#1d1d24" stroke="#444" strokeWidth={1} transform={`rotate(-8 ${cx - 142} ${cy - 50})`} />
        <rect x={cx + 134} y={cy - 210} width={16} height={160} rx={8} fill="#1d1d24" stroke="#444" strokeWidth={1} transform={`rotate(8 ${cx + 142} ${cy - 50})`} />
        <rect x={cx - 230} y={cy} width={460} height={70} rx={22} fill="url(#body)" />
        <rect x={cx - 230} y={cy} width={460} height={70} rx={22} fill="none" stroke="#5a5a66" strokeWidth={1.5} />
        <rect x={cx - 200} y={cy + 6} width={400} height={6} rx={3} fill="url(#spec)" />
        {[0, 1, 2, 3].map((i) => <circle key={i} cx={cx - 60 + i * 40} cy={cy + 44} r={5} fill={GOLD} filter="url(#glowC)" />)}
        {/* кот — чёрный силуэт с золотым контровым светом */}
        <g transform={`translate(${cx - 10},${cy - 6})`}>
          <path d="M-170,0 q-10,-80 90,-95 q120,-14 160,40 q24,40 -10,55 z" fill="#050506" stroke={GOLD} strokeWidth={2.5} strokeOpacity={0.8} />
          <circle cx={92} cy={-78} r={50} fill="#050506" stroke={GOLD} strokeWidth={2.5} strokeOpacity={0.8} />
          <path d="M56,-116 l12,-44 l26,34z M104,-122 l24,-38 l8,44z" fill="#050506" stroke={GOLD} strokeWidth={2.5} strokeOpacity={0.8} />
          <path d="M70,-78 q10,8 20,0 M100,-80 q10,8 20,0" fill="none" stroke={GOLD} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
          <path d="M-170,0 q-70,6 -60,-60" fill="none" stroke="#050506" strokeWidth={24} strokeLinecap="round" />
          <path d="M-170,-12 q-58,4 -50,-52" fill="none" stroke={GOLD} strokeWidth={2} opacity={0.6} />
        </g>
        {/* тёплый свет соседа — луч справа сквозь «стену» */}
        <rect x={980} y={0} width={4} height={H} fill={GOLD} opacity={0.15} />
        <g filter="url(#glowC)" opacity={0.8}>
          {[0, 1, 2].map((k) => { const p = (k / 3 + t * 0.15) % 1; const r = 60 + p * 420;
            return <path key={k} d={`M982,${620 - r} A${r},${r} 0 0 0 982,${620 + r}`} fill="none" stroke="#ff8a5c" strokeWidth={3} opacity={1 - p} />; })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center" }}>
        <div style={{ fontFamily: P, fontStyle: "italic", fontWeight: 600, fontSize: 64, color: GOLD }}>а что если…</div>
        <div style={{ fontFamily: M, fontWeight: 800, fontSize: 64, letterSpacing: 6, color: "#f4f1ea", marginTop: 6 }}>WI-FI БЫЛО БЫ ВИДНО</div>
        <div style={{ width: 80, height: 2, background: GOLD, margin: "26px auto 0" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1450, textAlign: "center", fontFamily: M, fontWeight: 800, fontSize: 60, lineHeight: 1.2, color: "#f4f1ea", letterSpacing: 1 }}>
        РОУТЕР СОСЕДА <span style={{ color: GOLD }}>СВЕТИТ</span><br /><span style={{ opacity: 0.3 }}>ТЕБЕ В ПОДУШКУ</span></div>
      <Grain o={0.07} />
    </AbsoluteFill>
  );
};

// ===================================================================== D. ГИБРИД: бумажная диорама с подсветкой (изометрия A + бумага B)
export const StyleD: React.FC = () => {
  const t = useT();
  const RX = 1.2, RY = 4.6;
  const C = { wallL: "#efe2c8", wallR: "#e3d2b2", floor: "#d8c3a0", teal: "#2a7f8a", tealD: "#1f6670", tealDD: "#185158", coral: "#ff7a59", coralD: "#e2603f",
    mustard: "#f2b134", mustD: "#d99a22", ink: "#1d2a33", rose: "#e85d75", cream: "#f7efe0" };
  const edge = "rgba(29,42,51,0.18)";
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #235a63 0%, #173f48 50%, #0d2a31 100%)" }}>
      <svg width={W} height={H} style={{ position: "absolute", top: 70 }}>
        <defs>
          <filter id="pD" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="-6" dy="12" stdDeviation="8" floodColor="#0b1a1f" floodOpacity="0.35" /></filter>
          <filter id="glowD" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="softD"><feGaussianBlur stdDeviation="30" /></filter>
          <clipPath id="roomD"><polygon points={pts([[0, 0, 0], [10, 0, 0], [10, 0, 7], [0, 0, 7], [0, 10, 7], [0, 10, 0], [10, 10, 0]])} /></clipPath>
        </defs>
        {/* бумажная «коробка» комнаты: толстые срезы стен видны сверху */}
        <g filter="url(#pD)">
          <polygon points={pts([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]])} fill={C.floor} />
          <polygon points={pts([[0, 0, 0], [0, 10, 0], [0, 10, 7], [0, 0, 7]])} fill={C.wallL} />
          <polygon points={pts([[0, 0, 0], [10, 0, 0], [10, 0, 7], [0, 0, 7]])} fill={C.wallR} />
          <polygon points={pts([[-0.35, -0.35, 7], [10, -0.35, 7], [10, 0, 7], [0, 0, 7], [0, 10, 7], [-0.35, 10, 7]])} fill={C.cream} stroke={edge} strokeWidth={2} />
          <polygon points={pts([[10, -0.35, 0], [10, 0, 0], [10, 0, 7], [10, -0.35, 7]])} fill={C.mustD} />
          <polygon points={pts([[-0.35, 10, 0], [0, 10, 0], [0, 10, 7], [-0.35, 10, 7]])} fill={C.mustD} />
        </g>
        {/* окно с ночным городом */}
        <g filter="url(#pD)"><polygon points={pts([[5.6, 0, 2.6], [9, 0, 2.6], [9, 0, 5.8], [5.6, 0, 5.8]])} fill={C.teal} /></g>
        <polygon points={pts([[5.8, 0, 2.8], [8.8, 0, 2.8], [8.8, 0, 5.6], [5.8, 0, 5.6]])} fill={C.tealDD} />
        {Array.from({ length: 12 }, (_, i) => { const x = 6 + (i % 4) * 0.7, z = 3 + Math.floor(i / 4) * 0.7;
          return <polygon key={i} points={pts([[x, 0, z], [x + 0.22, 0, z], [x + 0.22, 0, z + 0.25], [x, 0, z + 0.25]])} fill={i % 3 ? C.mustard : "#22525c"} filter={i % 3 ? "url(#glowD)" : undefined} />; })}
        {/* ковёр, кровать, тумба, растение — бумажные блоки с тенями */}
        <g filter="url(#pD)">
          <polygon points={pts([[3, 3.5, 0.02], [8, 3.5, 0.02], [8, 8.5, 0.02], [3, 8.5, 0.02]])} fill={C.coral} />
          <polygon points={pts([[3.4, 3.9, 0.04], [7.6, 3.9, 0.04], [7.6, 8.1, 0.04], [3.4, 8.1, 0.04]])} fill="none" stroke={C.cream} strokeWidth={4} strokeDasharray="10 10" />
        </g>
        <g filter="url(#pD)"><Cube x={5.2} y={0.2} z={0} w={4.4} d={3.2} h={1.1} top={C.teal} l={C.tealD} r={C.tealDD} edge={edge} /></g>
        <g filter="url(#pD)"><Cube x={5.4} y={0.4} z={1.1} w={4.0} d={2.8} h={0.35} top={C.cream} l="#e6dccb" r="#d6cbb8" edge={edge} /></g>
        <g filter="url(#pD)"><Cube x={5.8} y={0.5} z={1.45} w={1.6} d={1.0} h={0.45} top="#ffffff" l="#ece6da" r="#ddd5c6" edge={edge} /></g>
        <g filter="url(#pD)"><Cube x={0.2} y={3.6} z={0} w={1.8} d={2.4} h={2.6} top={C.mustard} l={C.mustD} r="#c4861a" edge={edge} /></g>
        <g filter="url(#pD)"><Cube x={0.4} y={8.2} z={0} w={1.0} d={1.0} h={1.0} top={C.coral} l={C.coralD} r="#c94f32" edge={edge} />
          {[-2, -1, 0, 1, 2].map((i) => { const [x, y] = iso(0.9, 8.7, 1.0); return <ellipse key={i} cx={x + i * 16} cy={y - 50} rx={14} ry={50} fill={i % 2 ? "#3d9a6a" : "#2f8a5a"} transform={`rotate(${i * 18} ${x} ${y})`} />; })}</g>
        {/* сигнал соседа — розовый, сквозь стену */}
        <g clipPath="url(#roomD)" filter="url(#glowD)">
          {[1, 2, 3, 4, 5].map((k) => { const r = ((k * 1.5 + t * 1.2) % 7.5) + 0.5;
            return <path key={k} d={ring(4.2, -1.5, 2.2, r)} fill="none" stroke={C.rose} strokeWidth={6} opacity={0.85 * (1 - r / 8)} />; })}
        </g>
        {/* роутер и кот */}
        <g filter="url(#pD)"><Cube x={RX - 0.6} y={RY - 0.7} z={2.6} w={1.2} d={1.4} h={0.32} top={C.ink} l="#152028" r="#0f171d" edge={edge} /></g>
        {[-0.4, 0.4].map((d, i) => { const [x1, y1] = iso(RX - 0.3, RY + d, 2.92), [x2, y2] = iso(RX - 0.3, RY + d, 3.9);
          return <line key={i} x1={x1} y1={y1} x2={x2 + (i ? 10 : -10)} y2={y2} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />; })}
        {[0, 0.3, 0.6].map((a, i) => <circle key={i} cx={iso(RX + 0.6, RY - 0.4 + a, 2.75)[0]} cy={iso(RX + 0.6, RY - 0.4 + a, 2.75)[1]} r={4.5} fill={C.mustard} filter="url(#glowD)" />)}
        {(() => { const [cx, cy] = iso(RX, RY, 3.0); return (<g transform={`translate(${cx},${cy - 34})`} filter="url(#pD)">
          <ellipse cx={0} cy={6} rx={88} ry={46} fill={C.coralD} />
          <ellipse cx={-6} cy={-6} rx={70} ry={34} fill={C.coral} />
          <circle cx={64} cy={-22} r={34} fill={C.coral} />
          <path d="M44,-50 l8,-28 l16,22z M76,-52 l14,-24 l6,28z" fill={C.coral} />
          <path d="M52,-22 q8,6 16,0 M74,-24 q8,6 16,0" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          <path d="M-86,20 q-40,10 -30,60 q6,20 26,12" fill="none" stroke={C.coralD} strokeWidth={20} strokeLinecap="round" />
        </g>); })()}
        {/* наш Wi-Fi — тёплые горчичные кольца со свечением */}
        <g clipPath="url(#roomD)" filter="url(#glowD)">
          {[1.4, 3.0, 4.6].map((z, zi) => [0, 1, 2, 3, 4, 5].map((k) => { const r = ((k * 1.25 + t * 1.5) % 7.5) + 0.6;
            return <path key={zi + "_" + k} d={ring(RX, RY, z, r)} fill="none" stroke={zi === 1 ? C.mustard : "#ffd27a"} strokeWidth={zi === 1 ? 6 : 3}
              opacity={(zi === 1 ? 0.95 : 0.45) * (1 - r / 8.2)} />; }))}
        </g>
        <ellipse cx={iso(RX, RY, 3)[0]} cy={iso(RX, RY, 3)[1]} rx={240} ry={130} fill={C.mustard} opacity={0.16} filter="url(#softD)" />
      </svg>
      <div style={{ position: "absolute", left: 80, top: 140, display: "inline-block", padding: "14px 26px", background: C.mustard, color: C.ink,
        fontFamily: G, fontWeight: 800, fontSize: 30, letterSpacing: 6, transform: "rotate(-2deg)", boxShadow: "0 8px 0 rgba(0,0,0,0.25)" }}>А ЧТО ЕСЛИ…</div>
      <div style={{ position: "absolute", left: 80, top: 230, fontFamily: G, fontWeight: 800, fontSize: 92, lineHeight: 1.0, color: C.cream }}>Wi-Fi было<br />бы видно?</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 1500, padding: "26px 30px", background: C.cream, transform: "rotate(-1.2deg)",
        boxShadow: "0 14px 0 rgba(0,0,0,0.25)", textAlign: "center", fontFamily: G, fontWeight: 800, fontSize: 60, lineHeight: 1.15, color: C.ink }}>
        Роутер соседа <span style={{ background: C.rose, color: C.cream, padding: "0 12px" }}>светит</span><br /><span style={{ opacity: 0.3 }}>тебе в подушку</span></div>
      <Grain o={0.16} blend="multiply" />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, transparent 60%, rgba(0,0,0,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};
