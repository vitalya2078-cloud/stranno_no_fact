// СТИЛЕВОЙ КАДР D2 «мягкая диорама»: улица на закате — скруглённые формы, градиенты на гранях, мягкие тени,
// много деталей (деревья, клумбы, коты, птицы, вывески), эффекты (лучи, боке, листья, пар, размытие дали, свечение).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Geologica";
import { makeIso } from "./brand";

const G = loadFont("normal", { weights: ["800"], subsets: ["cyrillic", "latin"] }).fontFamily;
const I = makeIso(66, 500, 960);
const { iso, pts } = I;
type V3 = [number, number, number];
const useT = () => useCurrentFrame() / 30;
const shade = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))));
  return `rgb(${c.join(",")})`; };

// мягкий блок: грани с градиентом, скруглённые рёбра (обводка цветом грани с круглым соединением), блик по верхнему ребру
let gid = 0;
const SoftBox: React.FC<{ x: number; y: number; z: number; w: number; d: number; h: number; c: string; r?: number; shadow?: boolean }> = ({ x, y, z, w, d, h, c, r = 10, shadow = true }) => {
  const id = `sb${gid++}`;
  const top = pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]);
  const left = pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]);
  const right = pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]);
  const [sx, sy] = iso(x + w / 2, y + d / 2, 0);
  return (<g>
    <defs>
      <linearGradient id={id + "l"} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={shade(c, 0.92)} /><stop offset="1" stopColor={shade(c, 0.72)} /></linearGradient>
      <linearGradient id={id + "r"} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={shade(c, 0.78)} /><stop offset="1" stopColor={shade(c, 0.58)} /></linearGradient>
      <linearGradient id={id + "t"} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={shade(c, 1.22)} /><stop offset="1" stopColor={shade(c, 1.05)} /></linearGradient>
    </defs>
    {shadow && z < 0.05 ? <ellipse cx={sx} cy={sy + 8} rx={(w + d) * 30} ry={(w + d) * 13} fill="#5a2a3a" opacity={0.22} filter="url(#blur8)" /> : null}
    <polygon points={left} fill={`url(#${id}l)`} stroke={`url(#${id}l)`} strokeWidth={r} strokeLinejoin="round" />
    <polygon points={right} fill={`url(#${id}r)`} stroke={`url(#${id}r)`} strokeWidth={r} strokeLinejoin="round" />
    <polygon points={top} fill={`url(#${id}t)`} stroke={`url(#${id}t)`} strokeWidth={r} strokeLinejoin="round" />
    <polyline points={pts([[x, y + d, z + h], [x + w, y + d, z + h], [x + w, y, z + h]])} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </g>);
};
// двускатная крыша (мягкая)
const Roof: React.FC<{ x: number; y: number; z: number; w: number; d: number; h: number; c: string }> = ({ x, y, z, w, d, h, c }) => (<g strokeLinejoin="round">
  <polygon points={pts([[x - 0.15, y + d + 0.15, z], [x + w + 0.15, y + d + 0.15, z], [x + w + 0.15, y + d / 2, z + h], [x - 0.15, y + d / 2, z + h]])} fill={shade(c, 1.0)} stroke={shade(c, 1.0)} strokeWidth={10} />
  <polygon points={pts([[x + w + 0.15, y - 0.15, z], [x + w + 0.15, y + d + 0.15, z], [x + w + 0.15, y + d / 2, z + h]])} fill={shade(c, 0.7)} stroke={shade(c, 0.7)} strokeWidth={10} />
  {Array.from({ length: 5 }, (_, i) => { const k = (i + 1) / 6; return <line key={i} x1={iso(x, y + d + 0.15 - k * (d / 2 + 0.15), z + k * h)[0]} y1={iso(x, y + d + 0.15 - k * (d / 2 + 0.15), z + k * h)[1]}
    x2={iso(x + w, y + d + 0.15 - k * (d / 2 + 0.15), z + k * h)[0]} y2={iso(x + w, y + d + 0.15 - k * (d / 2 + 0.15), z + k * h)[1]} stroke={shade(c, 0.85)} strokeWidth={3} strokeLinecap="round" />; })}
</g>);
// окно на фасаде (плоскость y = y0+d): тёплый свет, шторки, иногда цветы
const Win: React.FC<{ x: number; y: number; z: number; t: number; flowers?: boolean; i: number }> = ({ x, y, z, t, flowers, i }) => {
  const on = 0.75 + 0.25 * Math.sin(t * 1.3 + i);
  return (<g>
    <polygon points={pts([[x, y, z], [x + 0.7, y, z], [x + 0.7, y, z + 0.8], [x, y, z + 0.8]])} fill="#fff1c9" stroke="#7a4a3a" strokeWidth={5} strokeLinejoin="round" opacity={on} />
    <polygon points={pts([[x, y, z + 0.8], [x + 0.25, y, z + 0.8], [x + 0.12, y, z + 0.2], [x, y, z + 0.2]])} fill="#f08a8a" opacity={0.85} />
    <polygon points={pts([[x + 0.7, y, z + 0.8], [x + 0.45, y, z + 0.8], [x + 0.58, y, z + 0.2], [x + 0.7, y, z + 0.2]])} fill="#f08a8a" opacity={0.85} />
    {flowers ? (<>
      <polygon points={pts([[x - 0.05, y, z - 0.18], [x + 0.75, y, z - 0.18], [x + 0.75, y, z - 0.02], [x - 0.05, y, z - 0.02]])} fill="#8a5a3c" stroke="#8a5a3c" strokeWidth={4} strokeLinejoin="round" />
      {[0.1, 0.3, 0.5, 0.65].map((k, j) => { const [fx, fy] = iso(x + k, y, z + 0.02); return <circle key={j} cx={fx} cy={fy} r={7} fill={["#ff6b8a", "#ffd166", "#ff9f5a", "#c77dff"][j]} />; })}
    </>) : null}
  </g>);
};
const Tree: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => {
  const [bx, by] = iso(x, y, 0); const sw = Math.sin(t * 1.2 + x) * 4;
  return (<g transform={`translate(${bx},${by})`}>
    <ellipse cx={0} cy={6} rx={60 * s} ry={22 * s} fill="#5a2a3a" opacity={0.2} filter="url(#blur8)" />
    <rect x={-7 * s} y={-90 * s} width={14 * s} height={92 * s} rx={7 * s} fill="#8a5a3c" />
    <g transform={`translate(${sw},0)`}>
      {[[-34, -110, 46], [30, -116, 44], [0, -150, 54], [-14, -96, 40], [22, -92, 38]].map(([cx, cy, r], i) =>
        <circle key={i} cx={cx * s} cy={cy * s} r={r * s} fill={i === 2 ? "#7cc47a" : i % 2 ? "#5fae6a" : "#6dba70"} />)}
      <circle cx={-14 * s} cy={-162 * s} r={20 * s} fill="#a5dc8f" opacity={0.7} />
    </g>
  </g>);
};
const Bush: React.FC<{ x: number; y: number; t: number }> = ({ x, y }) => { const [bx, by] = iso(x, y, 0);
  return (<g transform={`translate(${bx},${by})`}><circle cx={-16} cy={-14} r={20} fill="#5fae6a" /><circle cx={12} cy={-16} r={22} fill="#6dba70" /><circle cx={0} cy={-28} r={18} fill="#7cc47a" />
    {[[-14, -24], [10, -30], [4, -12]].map(([fx, fy], i) => <circle key={i} cx={fx} cy={fy} r={5} fill={["#ff6b8a", "#ffd166", "#fff"][i]} />)}</g>); };
const Lamp: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => { const [bx, by] = iso(x, y, 0);
  return (<g transform={`translate(${bx},${by})`}>
    <rect x={-5} y={-190} width={10} height={190} rx={5} fill="#3a2f4a" />
    <circle cx={0} cy={-200} r={70} fill="#ffd27a" opacity={0.18 + 0.05 * Math.sin(t * 3)} filter="url(#blur16)" />
    <circle cx={0} cy={-200} r={18} fill="#fff1c9" /><rect x={-16} y={-224} width={32} height={10} rx={5} fill="#3a2f4a" />
  </g>); };
// паровоз: мягкие формы, пар клубами
const Loco: React.FC<{ x: number; t: number }> = ({ x, t }) => (<g>
  {Array.from({ length: 6 }, (_, i) => { const p = (t * 0.5 + i / 6) % 1; const [sx, sy] = iso(x + 2.6 + p * 1.5, 5.0, 2.9 + p * 3.2);
    return <circle key={i} cx={sx} cy={sy} r={16 + p * 50} fill="#fff" opacity={0.8 * (1 - p)} filter="url(#blur4)" />; })}
  <SoftBox x={x - 1.3} y={4.35} z={0.35} w={1.4} d={1.4} h={2.3} c="#e8705a" />
  <SoftBox x={x} y={4.45} z={0.35} w={3.4} d={1.2} h={1.35} c="#3e4a6a" r={18} />
  <SoftBox x={x + 2.4} y={4.8} z={1.7} w={0.5} d={0.5} h={0.9} c="#3e4a6a" />
  <SoftBox x={x + 3.3} y={4.55} z={0.25} w={0.35} d={1.0} h={0.35} c="#f2b134" />
  {[x + 0.2, x + 1.4, x + 2.6].map((wx, i) => { const p: string[] = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2; p.push(iso(wx + Math.cos(a) * 0.5, 5.7, 0.5 + Math.sin(a) * 0.5).join(",")); }
    const [cx, cy] = iso(wx, 5.7, 0.5); const a = t * -3;
    return <g key={i}><path d={"M" + p.join(" L")} fill="#2b2f45" stroke="#e8705a" strokeWidth={7} />
      <line x1={cx + Math.cos(a) * 22} y1={cy + Math.sin(a) * 22} x2={cx - Math.cos(a) * 22} y2={cy - Math.sin(a) * 22} stroke="#e8705a" strokeWidth={4} strokeLinecap="round" /></g>; })}
  {(() => { const [hx, hy] = iso(x + 3.65, 5.05, 0.9); return <circle cx={hx} cy={hy} r={36} fill="#fff1c9" opacity={0.5} filter="url(#blur8)" />; })()}
</g>);

// ===================================================================== СЦЕНА
const HOUSES: [number, number, string, string][] = [[-2.6, 3.0, "#f4a76a", "#c8524a"], [0.8, 3.8, "#f6d27a", "#7a5aa0"], [4.2, 2.6, "#8fc7c2", "#d6604f"], [7.2, 3.4, "#f3e3cc", "#5a8ac0"], [10.4, 3.0, "#e98aa0", "#5a6aa0"]];
export const SoftStreet: React.FC = () => {
  const t = useT(); gid = 0;
  const tx = 3.2 + Math.sin(t * 0.4) * 0.3;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#ffb38a 0%, #f79fa3 38%, #c39ad8 70%, #8f86c9 100%)", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <filter id="blur4"><feGaussianBlur stdDeviation="4" /></filter><filter id="blur8"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id="blur16"><feGaussianBlur stdDeviation="16" /></filter><filter id="blur30"><feGaussianBlur stdDeviation="30" /></filter>
          <radialGradient id="sun"><stop offset="0" stopColor="#fff6dc" /><stop offset="0.35" stopColor="#ffd59a" stopOpacity={0.9} /><stop offset="1" stopColor="#ffb38a" stopOpacity={0} /></radialGradient>
          <linearGradient id="island" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a8746a" /><stop offset="1" stopColor="#6a4060" /></linearGradient>
        </defs>
        {/* солнце, лучи, облака (даль размыта) */}
        <circle cx={760} cy={430} r={520} fill="url(#sun)" />
        <g opacity={0.18} transform={`rotate(${t * 2} 760 430)`}>{Array.from({ length: 12 }, (_, i) =>
          <polygon key={i} points="760,430 1900,370 1900,490" fill="#fff6dc" transform={`rotate(${i * 30} 760 430)`} filter="url(#blur16)" />)}</g>
        {[[180, 300, 1.2], [860, 220, 0.9], [520, 520, 1.4], [80, 640, 0.8]].map(([x, y, s], i) => <g key={i} filter="url(#blur4)" opacity={0.9}
          transform={`translate(${((x + t * (8 + i * 4)) % 1300) - 110},${y}) scale(${s})`}>
          <ellipse cx={0} cy={0} rx={110} ry={34} fill="#fff4ee" /><ellipse cx={-40} cy={-22} rx={60} ry={40} fill="#fff4ee" /><ellipse cx={34} cy={-28} rx={70} ry={48} fill="#fff4ee" /></g>)}
        {/* дальний силуэт города — размыт */}
        <g filter="url(#blur4)" opacity={0.45}>{Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 85 - 20} y={760 - ((i * 53) % 5) * 40 - 60} width={70} height={420} rx={10} fill="#a77fb5" />)}</g>
        {/* остров-основа */}
        <polygon points={pts([[-5, -1.5, -1.2], [15, -1.5, -1.2], [15, 9, -1.2], [-5, 9, -1.2]])} fill="url(#island)" />
        <polygon points={pts([[-5, 9, -1.2], [15, 9, -1.2], [15, 9, 0], [-5, 9, 0]])} fill="#9a6070" stroke="#9a6070" strokeWidth={16} strokeLinejoin="round" />
        <polygon points={pts([[15, -1.5, -1.2], [15, 9, -1.2], [15, 9, 0], [15, -1.5, 0]])} fill="#7a4a60" stroke="#7a4a60" strokeWidth={16} strokeLinejoin="round" />
        <polygon points={pts([[-5, -1.5, 0], [15, -1.5, 0], [15, 9, 0], [-5, 9, 0]])} fill="#8cc97e" stroke="#8cc97e" strokeWidth={16} strokeLinejoin="round" />
        {/* тротуар, дорога с разметкой */}
        <polygon points={pts([[-5, 3.1, 0.02], [15, 3.1, 0.02], [15, 4.2, 0.02], [-5, 4.2, 0.02]])} fill="#f3e3cc" stroke="#f3e3cc" strokeWidth={10} strokeLinejoin="round" />
        <polygon points={pts([[-5, 4.2, 0.03], [15, 4.2, 0.03], [15, 6.8, 0.03], [-5, 6.8, 0.03]])} fill="#8e8aa8" stroke="#8e8aa8" strokeWidth={10} strokeLinejoin="round" />
        {Array.from({ length: 9 }, (_, i) => <polygon key={i} points={pts([[-4 + i * 2.2, 5.45, 0.04], [-3 + i * 2.2, 5.45, 0.04], [-3 + i * 2.2, 5.55, 0.04], [-4 + i * 2.2, 5.55, 0.04]])} fill="#fff6e6" stroke="#fff6e6" strokeWidth={6} strokeLinejoin="round" />)}
        {/* дома: мягкие блоки, крыши, окна с шторами и цветами, навес и вывеска */}
        {HOUSES.map(([x, h, c, rc], i) => (<g key={i}>
          <SoftBox x={x} y={0} z={0} w={2.8} d={2.8} h={h} c={c} r={14} />
          <Roof x={x} y={0} z={h} w={2.8} d={2.8} h={1.2} c={rc} />
          {Array.from({ length: Math.floor((h - 0.4) / 1.15) * 2 }, (_, k) => <Win key={k} x={x + 0.4 + (k % 2) * 1.3} y={2.8} z={0.55 + Math.floor(k / 2) * 1.15} t={t} i={i * 7 + k} flowers={(k + i) % 3 === 0} />)}
        </g>))}
        {/* навес булочной */}
        {Array.from({ length: 6 }, (_, k) => <polygon key={k} points={pts([[4.4 + k * 0.4, 2.8, 1.5], [4.8 + k * 0.4, 2.8, 1.5], [4.8 + k * 0.4, 3.4, 1.2], [4.4 + k * 0.4, 3.4, 1.2]])}
          fill={k % 2 ? "#fff6e6" : "#e8705a"} stroke={k % 2 ? "#fff6e6" : "#e8705a"} strokeWidth={4} strokeLinejoin="round" />)}
        {(() => { const [sx, sy] = iso(5.6, 2.8, 2.05); return <g transform={`translate(${sx},${sy}) skewY(26.5)`}><rect x={-70} y={-24} width={140} height={44} rx={14} fill="#5a3a5a" />
          <text x={0} y={9} textAnchor="middle" fontFamily={G} fontWeight={800} fontSize={26} fill="#ffd27a">ХЛЕБ</text></g>; })()}
        {/* кот на подоконнике */}
        {(() => { const [cx, cy] = iso(8.0, 2.85, 1.35); return <g transform={`translate(${cx},${cy})`}><ellipse cx={0} cy={0} rx={22} ry={13} fill="#3a2f4a" /><circle cx={16} cy={-12} r={11} fill="#3a2f4a" />
          <path d="M9,-20 l3,-10 l6,8z M18,-21 l6,-8 l2,10z" fill="#3a2f4a" /><path d={`M-20,4 q-18,${-10 + 6 * Math.sin(t * 3)} -14,-24`} fill="none" stroke="#3a2f4a" strokeWidth={6} strokeLinecap="round" /></g>; })()}
        {/* провода с птицами между фонарями */}
        {(() => { const a = iso(1.4, 3.6, 3.3), b = iso(9.4, 3.6, 3.3); const my = (a[1] + b[1]) / 2 + 60;
          return <g><path d={`M${a[0]},${a[1] - 50} Q${(a[0] + b[0]) / 2},${my} ${b[0]},${b[1] - 50}`} fill="none" stroke="#3a2f4a" strokeWidth={2.5} />
            {[0.35, 0.45, 0.62].map((p, i) => { const x = a[0] + (b[0] - a[0]) * p, y = (1 - p) * (1 - p) * (a[1] - 50) + 2 * (1 - p) * p * my + p * p * (b[1] - 50);
              return <g key={i} transform={`translate(${x},${y - 10 + (i === 1 ? Math.sin(t * 6) * 2 : 0)})`}><ellipse cx={0} cy={0} rx={11} ry={8} fill="#4a3f5a" /><circle cx={8} cy={-6} r={6} fill="#4a3f5a" /><path d="M13,-6 l6,1 l-6,2z" fill="#f2b134" /></g>; })}</g>; })()}
        {/* фонари, деревья, кусты, лавка */}
        <Lamp x={1.4} y={3.6} t={t} /><Lamp x={9.4} y={3.6} t={t} />
        <Tree x={-0.6} y={3.5} t={t} /><Tree x={6.6} y={3.55} t={t} s={0.9} /><Tree x={12.8} y={3.5} t={t} s={1.1} />
        <Bush x={3.0} y={3.7} t={t} /><Bush x={10.6} y={3.75} t={t} /><Bush x={-2.2} y={3.75} t={t} />
        <SoftBox x={7.6} y={3.4} z={0.3} w={1.2} d={0.35} h={0.12} c="#c8824a" r={6} /><SoftBox x={7.6} y={3.3} z={0.42} w={1.2} d={0.1} h={0.35} c="#c8824a" r={6} />
        {/* паровоз и бирка */}
        <Loco x={tx} t={t} />
        {(() => { const [px, py] = iso(2.4, 4.1, 4.5); const sw = Math.sin(t * 2.4) * 3; return <g transform={`translate(${px},${py}) rotate(${sw})`}>
          <line x1={0} y1={0} x2={0} y2={-46} stroke="#3a2f4a" strokeWidth={3} />
          <rect x={-104} y={-118} width={208} height={72} rx={18} fill="#ffd27a" /><circle cx={-82} cy={-82} r={6} fill="#c8824a" />
          <text x={8} y={-70} textAnchor="middle" fontFamily={G} fontWeight={800} fontSize={40} fill="#3a2f4a">МАШИНА</text></g>; })()}
        {/* листья и золотая пыль (боке) */}
        {Array.from({ length: 10 }, (_, i) => { const p = (t * 0.12 + i / 10) % 1; const x = (i * 131) % 1080 + Math.sin(t + i) * 40, y = p * 1500 + 300;
          return <ellipse key={i} cx={x} cy={y} rx={9} ry={5} fill={i % 2 ? "#f2a14a" : "#e8705a"} transform={`rotate(${t * 90 + i * 40} ${x} ${y})`} opacity={0.85} />; })}
        {Array.from({ length: 26 }, (_, i) => { const x = (i * 197) % 1080, y = 500 + ((i * 331) % 1100) + Math.sin(t * 0.8 + i) * 18;
          return <circle key={i} cx={x} cy={y} r={3 + (i % 4) * 3} fill="#fff1c9" opacity={0.25 + 0.2 * Math.sin(t * 2 + i)} filter="url(#blur4)" />; })}
      </svg>
      {/* тёплая виньетка и лёгкое зерно */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 35%, transparent 50%, rgba(90,40,70,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};
