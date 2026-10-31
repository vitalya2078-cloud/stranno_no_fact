// «А что если бы Wi-Fi было видно?» — сцены-диорамы по таймингам голоса (стиль D, ночь/техника — A).
// Время — секунды ГОЛОСА (абзацы: 0.1, 5.3, 14.8, 21.0, 31.3, 37.7, 45.0, 57.1, 65.8, 73.0).
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import plan from "./plan.json";
import { A, Captions, Cam, Card, D, FPS, Finish, G, M, Mode, Stage, Title, U, Waves, ez, lerp, lines, makeIso, useT } from "./brand";

const QUESTION = "Wi-Fi было бы видно?";
const ACCENT = ["ворует", "светит", "ярче", "тень", "дыра", "вспыхивает", "призраков", "маяк", "соседу", "кота"];
const I = makeIso(58, 560, 760);
const { iso, pts, Cube } = I;

// ===================================================================== общие предметы
const Cat: React.FC<{ x: number; y: number; z: number; mode: Mode; s?: number }> = ({ x, y, z, mode, s = 1 }) => {
  const t = useT(); const [cx, cy] = iso(x, y, z); const c1 = mode === "D" ? D.coralD : "#ff8a2a", c2 = mode === "D" ? D.coral : "#ffb15e";
  const br = 1 + 0.03 * Math.sin(t * 2.2);
  return (<g transform={`translate(${cx},${cy - 30 * s}) scale(${s})`} filter={mode === "D" ? "url(#pD)" : undefined}>
    <ellipse cx={0} cy={6} rx={80} ry={42 * br} fill={c1} /><ellipse cx={-6} cy={-6} rx={64} ry={31 * br} fill={c2} />
    <circle cx={58} cy={-20} r={31} fill={c2} /><path d="M40,-46 l7,-26 l15,20z M70,-48 l13,-22 l5,26z" fill={c2} />
    <path d="M47,-20 q7,6 15,0 M67,-22 q7,6 15,0" fill="none" stroke={D.ink} strokeWidth={4} strokeLinecap="round" />
    <path d={`M-78,18 q-36,${10 + 4 * Math.sin(t * 1.5)} -27,54 q5,18 23,11`} fill="none" stroke={c1} strokeWidth={18} strokeLinecap="round" />
  </g>);
};
const Router: React.FC<{ mode: Mode; x?: number; y?: number; z?: number }> = ({ mode, x = 0.6, y = 3.9, z = 2.6 }) => {
  const t = useT();
  return (<>
    <Cube x={x} y={y} z={z} w={1.2} d={1.4} h={0.32} top={mode === "D" ? D.ink : "#e8ecff"} l={mode === "D" ? "#152028" : "#b9c2ee"} r={mode === "D" ? "#0f171d" : "#9aa4d6"} shadow={mode === "D"} edge={mode === "D" ? D.edge : A.edge} />
    {[-0.4, 0.4].map((d, i) => { const [x1, y1] = iso(x + 0.3, y + 0.7 + d, z + 0.32), [x2, y2] = iso(x + 0.3, y + 0.7 + d, z + 1.3);
      return <line key={i} x1={x1} y1={y1} x2={x2 + (i ? 9 : -9)} y2={y2} stroke={mode === "D" ? D.ink : "#cfd5f0"} strokeWidth={7} strokeLinecap="round" />; })}
    {[0, 0.3, 0.6].map((a, i) => { const [px, py] = iso(x + 1.2, y + 0.3 + a, z + 0.16);
      return <circle key={i} cx={px} cy={py} r={4} fill={mode === "D" ? D.mustard : A.glow} opacity={0.5 + 0.5 * Math.sin(t * 8 + i * 2)} filter="url(#glow)" />; })}
  </>);
};
const Plant: React.FC<{ x: number; y: number; mode: Mode }> = ({ x, y, mode }) => {
  const [px, py] = iso(x + 0.5, y + 0.5, 1.0);
  return (<g filter={mode === "D" ? "url(#pD)" : undefined}>
    <Cube x={x} y={y} z={0} w={1} d={1} h={1} top={mode === "D" ? D.coral : "#3a2a5a"} l={mode === "D" ? D.coralD : "#2b1f46"} r={mode === "D" ? "#c94f32" : "#24193c"} />
    {[-2, -1, 0, 1, 2].map((i) => <ellipse key={i} cx={px + i * 15} cy={py - 46} rx={13} ry={46} fill={mode === "D" ? (i % 2 ? D.leaf2 : D.leaf) : A.leaf}
      opacity={mode === "D" ? 1 : 0.75} transform={`rotate(${i * 18} ${px} ${py})`} />)}
  </g>);
};
// окно на правой стене (y=0): день — рассвет, ночь — город
const Window: React.FC<{ mode: Mode; night?: boolean; x0?: number }> = ({ mode, night = mode === "A", x0 = 5.6 }) => (<>
  <g filter={mode === "D" ? "url(#pD)" : undefined}><polygon points={pts([[x0, 0, 2.6], [x0 + 3.4, 0, 2.6], [x0 + 3.4, 0, 5.8], [x0, 0, 5.8]])} fill={mode === "D" ? D.teal : "#070a1c"} stroke={mode === "A" ? A.rim : "none"} strokeWidth={4} /></g>
  <polygon points={pts([[x0 + 0.2, 0, 2.8], [x0 + 3.2, 0, 2.8], [x0 + 3.2, 0, 5.6], [x0 + 0.2, 0, 5.6]])} fill={night ? (mode === "D" ? D.tealDD : "#070a1c") : "#ffd9a0"} />
  {!night ? <circle cx={iso(x0 + 2.4, 0, 4.6)[0]} cy={iso(x0 + 2.4, 0, 4.6)[1]} r={26} fill="#fff3d6" /> : null}
  {Array.from({ length: 12 }, (_, i) => { const x = x0 + 0.4 + (i % 4) * 0.7, z = 3 + Math.floor(i / 4) * 0.7;
    return <polygon key={i} points={pts([[x, 0, z], [x + 0.22, 0, z], [x + 0.22, 0, z + 0.25], [x, 0, z + 0.25]])} fill={night ? (i % 3 ? (mode === "D" ? D.mustard : A.window) : "#22305c") : "#e9b77a"} opacity={night ? 1 : 0.6} />; })}
</>);
const Bed: React.FC<{ mode: Mode; glowPillow?: number }> = ({ mode, glowPillow = 0 }) => {
  const P = mode === "D";
  return (<>
    <Cube x={5.2} y={0.2} z={0} w={4.4} d={3.2} h={1.1} top={P ? D.teal : "#232c63"} l={P ? D.tealD : "#1a2150"} r={P ? D.tealDD : "#141a40"} shadow={P} edge={P ? D.edge : A.edge} />
    <Cube x={5.4} y={0.4} z={1.1} w={4.0} d={2.8} h={0.35} top={P ? D.cream : "#d9def5"} l={P ? "#e6dccb" : "#aab3dc"} r={P ? "#d6cbb8" : "#8d96c4"} shadow={P} edge={P ? D.edge : A.edge} />
    <Cube x={5.8} y={0.5} z={1.45} w={1.6} d={1.0} h={0.45} top="#ffffff" l={P ? "#ece6da" : "#cfd5f0"} r={P ? "#ddd5c6" : "#b5bde3"} shadow={P} edge={P ? D.edge : A.edge} />
    {glowPillow > 0 ? <ellipse cx={iso(6.6, 1.0, 1.9)[0]} cy={iso(6.6, 1.0, 1.9)[1]} rx={110} ry={60} fill={D.rose} opacity={0.45 * glowPillow} filter="url(#soft)" /> : null}
  </>);
};

// ===================================================================== СЦЕНЫ
// 1. Хук: дом в разрезе — 4 квартиры, у каждой свой цвет сигнала, тонкий луч тянется к соседу
const House: React.FC = () => {
  const t = useT();
  const cols = [A.glow, A.glow2, D.mustard, "#7dff9a"];
  const flats: [number, number][] = [[0, 0], [5, 0], [0, 5], [5, 5]];
  return (<Stage mode="A">
    {[3.4, 0].map((z, fi) => flats.map(([x, y], k) => {
      const c = cols[(k + fi) % 4];
      return (<g key={fi + "_" + k}>
        <Cube x={x} y={y} z={z} w={4.6} d={4.6} h={0.25} top="#1a2250" l="#11173a" r="#0d1230" edge={A.edge} />
        <Cube x={x + 0.6} y={y + 1.6} z={z + 0.25} w={0.8} d={1} h={0.25} top="#e8ecff" l="#b9c2ee" r="#9aa4d6" edge={A.edge} />
        <g filter="url(#glow)">{[0, 1, 2, 3].map((j) => { const r = ((j * 0.8 + t * 1.3 + k * 0.3) % 3.2) + 0.3;
          return <path key={j} d={I.ring(x + 1, y + 2.1, z + 0.6, r)} fill="none" stroke={c} strokeWidth={4} opacity={1 - r / 3.6} />; })}</g>
      </g>);
    }))}
    {(() => { const a = iso(1, 2.1, 4.0), b = iso(6, 7.1, 0.6), k = ez(t, 3.6, 4.6);
      return <line x1={a[0]} y1={a[1]} x2={lerp(a[0], b[0], k)} y2={lerp(a[1], b[1], k)} stroke={A.glow} strokeWidth={5} filter="url(#glow)" />; })()}
  </Stage>);
};
// 2–3. Спальня утром (D): кольца из коридора, кот на роутере; затем сквозь стену — розовый сигнал соседа
const Bedroom: React.FC<{ mode: Mode; neighbor?: boolean; beam?: number }> = ({ mode, neighbor = false, beam = 0 }) => {
  const t = useT();
  const P = mode === "D" ? D : A;
  const nb = neighbor ? ez(t, 15.6, 16.6) : mode === "A" ? 0.6 : 0;
  return (<Stage mode={mode}>
    <I.Room mode={mode} />
    <Window mode={mode} />
    {/* дверь в коридор на левой стене */}
    <polygon points={pts([[0, 6.6, 0], [0, 8.6, 0], [0, 8.6, 4.4], [0, 6.6, 4.4]])} fill={mode === "D" ? D.tealD : "#0b1030"} stroke={mode === "D" ? D.ink : A.rim} strokeOpacity={0.3} strokeWidth={3} />
    <g filter={mode === "D" ? "url(#pD)" : undefined}><polygon points={pts([[3, 3.5, 0.02], [8, 3.5, 0.02], [8, 8.5, 0.02], [3, 8.5, 0.02]])} fill={mode === "D" ? D.coral : "#151c45"} /></g>
    {mode === "D" ? <polygon points={pts([[3.4, 3.9, 0.04], [7.6, 3.9, 0.04], [7.6, 8.1, 0.04], [3.4, 8.1, 0.04]])} fill="none" stroke={D.cream} strokeWidth={4} strokeDasharray="10 10" /> : null}
    <Bed mode={mode} glowPillow={neighbor ? ez(t, 17.9, 18.6) : 0} />
    <Cube x={0.2} y={3.6} z={0} w={1.8} d={2.4} h={2.6} top={mode === "D" ? D.mustard : A.obj} l={mode === "D" ? D.mustD : A.objL} r={mode === "D" ? "#c4861a" : A.objR} shadow={mode === "D"} edge={P.edge} />
    <Plant x={0.4} y={8.2} mode={mode} />
    {nb > 0 ? <g opacity={nb}><Waves I={I} cx={6.5} cy={-2.5} z={[1.8, 3.6]} color={P.glow2} t={t} speed={1.3} max={8} n={6} id={"nb" + mode} /></g> : null}
    <Router mode={mode} />
    <Cat x={1.2} y={4.6} z={2.92} mode={mode} />
    <Waves I={I} cx={1.2} cy={4.6} z={[1.4, 3.0, 4.6]} color={P.glow} t={t} id={"me" + mode} />
    {beam > 0 ? (() => { const a = iso(1.2, 4.6, 3.3), b = iso(9.5, 0, 3.3), k = beam;
      return (<g filter="url(#glow)">
        <line x1={a[0]} y1={a[1]} x2={lerp(a[0], b[0], k)} y2={lerp(a[1], b[1], k)} stroke="#ffffff" strokeWidth={6} />
        <line x1={a[0]} y1={a[1]} x2={lerp(a[0], b[0], k)} y2={lerp(a[1], b[1], k)} stroke={A.glow} strokeWidth={14} opacity={0.5} />
        {k >= 1 ? <circle cx={b[0]} cy={b[1]} r={22 + 6 * Math.sin(t * 8)} fill={A.glow} opacity={0.8} /> : null}
      </g>); })() : null}
  </Stage>);
};
// 4а. Кухня: холодильник отбрасывает «тень» сигнала, волны отскакивают от металла
const Kitchen: React.FC<{ micro?: boolean }> = ({ micro = false }) => {
  const t = useT();
  const flash = micro ? Math.max(0, Math.exp(-(t - 33.4) * 2.5)) * (t >= 33.4 ? 1 : 0) : 0;
  const frozen = micro && t >= 36.0;
  return (<Stage mode="D">
    <I.Room mode="D" wallL="#f1e4c6" wallR="#e6d4b0" />
    {/* фартук-плитка на правой стене */}
    {Array.from({ length: 14 }, (_, i) => { const x = 2.8 + (i % 7) * 0.55, z = 2.3 + Math.floor(i / 7) * 0.5;
      return <polygon key={i} points={pts([[x, 0, z], [x + 0.5, 0, z], [x + 0.5, 0, z + 0.45], [x, 0, z + 0.45]])} fill="#f7efe0" stroke={D.edge} strokeWidth={1.5} />; })}
    {/* тень за холодильником на стене и полу */}
    {!micro ? <polygon points={pts([[7.2, 0, 0], [10, 0, 0], [10, 0, 6.2], [7.2, 0, 5.6]])} fill={D.ink} opacity={0.5 * ez(t, 21.6, 22.7)} /> : null}
    <Cube x={2.6} y={0.3} z={0} w={4.2} d={1.6} h={2.0} top={D.teal} l={D.tealD} r={D.tealDD} shadow />
    <Cube x={7.0} y={0.3} z={0} w={2.2} d={2.0} h={5.4} top="#f4f6f8" l="#dde3e8" r="#c7cfd6" shadow />
    {[1.6, 3.6].map((z, i) => { const [x1, y1] = iso(7.3, 2.3, z), [x2, y2] = iso(7.3, 2.3, z + 1.1); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8d939b" strokeWidth={6} strokeLinecap="round" />; })}
    {/* микроволновка и пицца */}
    <Cube x={3.0} y={0.4} z={2.0} w={1.9} d={1.3} h={1.1} top="#3a4450" l="#2a323b" r="#20272e" shadow />
    <polygon points={pts([[3.2, 1.7, 2.15], [4.4, 1.7, 2.15], [4.4, 1.7, 2.95], [3.2, 1.7, 2.95]])} fill={micro && t > 31.6 ? "#ffcf6a" : "#141a20"} opacity={micro && t > 31.6 ? 0.9 : 1} />
    <Cube x={5.2} y={0.6} z={2.0} w={0.9} d={0.7} h={0.9} top={D.coral} l={D.coralD} r="#c94f32" shadow />
    {/* стол с телефоном */}
    <Cube x={4.6} y={5.4} z={0} w={3.0} d={2.4} h={1.6} top={D.cream} l="#e6dccb" r="#d6cbb8" shadow />
    <Cube x={5.6} y={6.0} z={1.6} w={1.0} d={0.6} h={0.06} top={D.ink} l={D.ink} r={D.ink} />
    {micro ? (() => { const c = iso(6.1, 6.3, 1.68);
      return frozen ? <g transform={`translate(${c[0]},${c[1]})`}><circle r={13} fill="none" stroke="#fff" strokeWidth={4} strokeDasharray="20 60" transform={`rotate(${t * 400})`} /></g>
        : <path d={`M${c[0] - 7},${c[1] - 9} l16,9 l-16,9z`} fill="#fff" />; })() : null}
    <Plant x={8.6} y={8.6} mode="D" />
    {/* сигнал из коридора слева + отражённые дуги от холодильника */}
    <Waves I={I} cx={-1.5} cy={6.5} z={[1.6, 3.2, 4.8]} color={D.glow} t={t} max={9} n={7} id="k" />
    {!micro && t > 23.2 ? <g filter="url(#glow)">{[0, 1, 2].map((k) => { const r = ((k * 0.9 + (t - 23.2) * 1.5) % 2.7) + 0.2;
      const a: string[] = []; for (let i = 0; i <= 20; i++) { const th = Math.PI * 0.5 + (i / 20) * Math.PI * 0.9; a.push(iso(7.0 + Math.cos(th) * r * 0.4, 2.6 + Math.sin(th) * r, 3.2).join(",")); }
      return <path key={k} d={"M" + a.join(" L")} fill="none" stroke={D.rose} strokeWidth={5} opacity={1 - r / 3} />; })}</g> : null}
    {/* вспышка микроволновки */}
    {micro && t > 31.6 ? <g filter="url(#glow)">{[0, 1, 2, 3].map((k) => { const r = ((k * 0.7 + t * 2.6) % 2.8) + 0.2;
      return <path key={k} d={I.ring(3.95, 1.05, 2.55, r * (1 + 2 * flash))} fill="none" stroke="#fff6d0" strokeWidth={6 + 10 * flash} opacity={(1 - r / 3) * (0.5 + 0.5 * flash)} />; })}</g> : null}
    {flash > 0 ? <rect x={-100} y={-100} width={1300} height={2200} fill="#fff6d0" opacity={0.75 * flash} /> : null}
  </Stage>);
};
// 4б. Лифт (A): металлическая кабина в шахте, волны вокруг, внутри — темнота
const Lift: React.FC = () => {
  const t = useT();
  return (<Stage mode="A">
    {[0, 3.6].map((z, i) => <Cube key={i} x={0} y={0} z={z} w={10} d={10} h={0.2} top="#1a2250" l="#11173a" r="#0d1230" edge={A.edge} />)}
    {[[2.5, 2.5], [7.3, 2.5], [2.5, 7.3], [7.3, 7.3]].map(([x, y], i) => <Cube key={i} x={x} y={y} z={0} w={0.2} d={0.2} h={8} top="#3a4a9a" l="#2a3570" r="#222c5c" edge={A.edge} />)}
    <Waves I={I} cx={-1} cy={9} z={[1.5, 3.2, 5]} color={A.glow} t={t} clip={false} max={10} n={8} id="lift" />
    {(() => { const z = 1.2 + 1.2 * Math.sin((t - 25.8) * 0.8);
      return (<>
        <Cube x={2.7} y={2.7} z={z} w={4.6} d={4.6} h={4.2} top="#9aa4d6" l="#6f7aa8" r="#596391" edge="rgba(255,255,255,0.3)" />
        <polygon points={pts([[3.4, 7.3, z + 0.4], [6.6, 7.3, z + 0.4], [6.6, 7.3, z + 3.6], [3.4, 7.3, z + 3.6]])} fill="#05070f" />
        <line x1={iso(5, 7.3, z + 0.4)[0]} y1={iso(5, 7.3, z + 0.4)[1]} x2={iso(5, 7.3, z + 3.6)[0]} y2={iso(5, 7.3, z + 3.6)[1]} stroke="#6f7aa8" strokeWidth={3} />
        {[0, 1, 2].map((k) => { const [px, py] = iso(5, 7.3, z + 1.6 + k * 0.3); return <circle key={k} cx={px} cy={py} r={4 + k * 3} fill="none" stroke="#ff5a5a" strokeWidth={3} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 3 + k))} />; })}
      </>); })()}
  </Stage>);
};
// 6. Объяснение: две волны почти одной частоты + «перфоратор против шёпота»
const Explain: React.FC = () => {
  const t = useT();
  const wave = (y: number, amp: number, len: number, ph: number, col: string, w: number) => {
    const a: string[] = []; for (let x = 120; x <= 960; x += 6) a.push(`${x},${y + Math.sin((x / len) * Math.PI * 2 + ph) * amp}`);
    return <polyline points={a.join(" ")} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" filter="url(#glow)" />; };
  const drill = ez(t, 41.9, 42.4);
  return (<AbsoluteFill style={{ background: D.bg }}>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="pD" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="-6" dy="12" stdDeviation="8" floodColor="#0b1a1f" floodOpacity="0.35" /></filter></defs>
      <rect x={80} y={380} width={920} height={560} rx={8} fill={D.cream} filter="url(#pD)" transform="rotate(-1.5 540 660)" />
      <text x={130} y={470} fontFamily={G} fontWeight={800} fontSize={40} fill={D.ink}>Wi-Fi</text>
      {wave(560, 50, 130, -t * 6, D.mustard, 9)}
      <text x={130} y={720} fontFamily={G} fontWeight={800} fontSize={40} fill={D.ink}>Микроволновка</text>
      <g opacity={ez(t, 37.8, 38.4)}>{wave(810, 50 + 30 * Math.sin(t * 9), 127, -t * 6.2, D.rose, 9)}</g>
      {/* перфоратор против шёпота */}
      <g opacity={drill} transform={`translate(0,${(1 - drill) * 40})`}>
        <rect x={80} y={1010} width={920} height={360} rx={8} fill={D.cream} filter="url(#pD)" transform="rotate(1.2 540 1190)" />
        <g transform={`translate(${260 + Math.sin(t * 60) * 4},1190)`} filter="url(#pD)">
          <rect x={-110} y={-50} width={180} height={90} rx={22} fill={D.coral} /><rect x={70} y={-14} width={90} height={22} fill="#8d939b" />
          <rect x={-70} y={30} width={60} height={110} rx={14} fill={D.coralD} />
        </g>
        {[0, 1, 2, 3].map((k) => <path key={k} d={`M420,${1120 + k * 40} l40,-20 l40,40 l40,-40 l40,40 l40,-40 l40,20`} fill="none" stroke={D.ink} strokeWidth={6} strokeOpacity={0.4 + 0.6 * Math.abs(Math.sin(t * 20 + k))} />)}
        <text x={760} y={1290} fontFamily={G} fontWeight={800} fontSize={34} fill={D.ink} opacity={0.35}>…шёпот</text>
      </g>
    </svg>
  </AbsoluteFill>);
};
// 7. Вечеринка: гости — тёмные «призраки» в светящемся тумане, аквариум — кусок ночи
const GHOSTS: [number, number][] = [[3.2, 3.2], [4.8, 5.6], [6.6, 3.8], [3.6, 7.6], [7.4, 6.8]];
const Party: React.FC = () => {
  const t = useT();
  const fog = ez(t, 45.2, 46.0);
  return (<Stage mode="D">
    <I.Room mode="D" />
    <Window mode="D" night />
    <Cube x={0.3} y={1.0} z={0} w={1.8} d={4.6} h={1.3} top={D.teal} l={D.tealD} r={D.tealDD} shadow />
    <Cube x={0.3} y={1.0} z={1.3} w={0.5} d={4.6} h={1.1} top={D.teal} l={D.tealD} r={D.tealDD} shadow />
    {/* аквариум на тумбе: тёмная вода, рыбки */}
    <Cube x={0.3} y={7.0} z={0} w={1.6} d={2.4} h={1.6} top={D.mustard} l={D.mustD} r="#c4861a" shadow />
    <Cube x={0.4} y={7.1} z={1.6} w={1.4} d={2.2} h={1.6} top="#0d2a31" l="#123842" r="#0f2f37" edge="rgba(159,216,255,0.6)" />
    {[0, 1].map((k) => { const [fx, fy] = iso(1.1, 7.6 + ((t * 0.5 + k * 0.7) % 1.6), 2.2 + k * 0.5);
      return <path key={k} d={`M${fx},${fy} q12,-8 24,0 q-12,8 -24,0 l-10,-7 l0,14z`} fill={D.coral} />; })}
    {t > 54.2 ? <ellipse cx={iso(1.1, 8.2, 2.4)[0]} cy={iso(1.1, 8.2, 2.4)[1]} rx={150 * ez(t, 54.2, 54.9)} ry={110 * ez(t, 54.2, 54.9)} fill="#0b1a1f" opacity={0.55} /> : null}
    <Router mode="D" x={8.2} y={8.4} z={0} />
    <g opacity={fog}><Waves I={I} cx={8.8} cy={9.1} z={[0.8, 2.2, 3.6]} color={D.glow} t={t} max={10} n={8} id="party" /></g>
    <ellipse cx={iso(5, 5, 2)[0]} cy={iso(5, 5, 2)[1]} rx={420} ry={260} fill={D.mustard} opacity={0.18 * fog} filter="url(#soft)" />
    {/* призраки-гости: тёмные силуэты-тени, не персонажи */}
    {GHOSTS.map(([x, y], i) => { const [gx, gy] = iso(x, y, 0); const sw = Math.sin(t * 1.2 + i) * 6; const k = ez(t, 50.0 + i * 0.15, 50.6 + i * 0.15);
      return (<g key={i} opacity={0.75 * k} transform={`translate(${gx + sw},${gy})`}>
        <ellipse cx={0} cy={0} rx={46} ry={16} fill="#0b1a1f" opacity={0.35} />
        <path d="M-34,0 v-120 a34,34 0 0 1 68,0 v120 q-17,-14 -34,0 q-17,-14 -34,0z" fill={D.ink} />
        <circle cx={0} cy={-170} r={30} fill={D.ink} />
      </g>); })}
  </Stage>);
};
// 8. Ночной город (A): сигналы разных цветов переливаются, кафе горит маяком, к нему тянутся огоньки
const BLOCKS = (() => { const b: [number, number, number][] = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (!(i === 2 && j === 2)) b.push([i * 2.6, j * 2.6, 1.2 + ((i * 7 + j * 3) % 5) * 0.8]); return b; })();
const City: React.FC = () => {
  const t = useT();
  const cols = [A.glow, A.glow2, "#7dff9a", D.mustard];
  const beacon = ez(t, 61.0, 61.6);
  return (<Stage mode="A" top={-160}>
    <polygon points={pts([[-1, -1, 0], [11, -1, 0], [11, 11, 0], [-1, 11, 0]])} fill="#0b1030" />
    {BLOCKS.map(([x, y, h], i) => (<g key={i}>
      <Cube x={x} y={y} z={0} w={1.8} d={1.8} h={h} top="#1f2858" l="#151c45" r="#10163a" edge={A.edge} />
      {Array.from({ length: Math.floor(h / 0.7) }, (_, k) => { const z = 0.4 + k * 0.7;
        return <polygon key={k} points={pts([[x + 0.3, y + 1.8, z], [x + 0.7, y + 1.8, z], [x + 0.7, y + 1.8, z + 0.3], [x + 0.3, y + 1.8, z + 0.3]])} fill={(i + k) % 3 ? A.window : "#22305c"} />; })}
    </g>))}
    <g filter="url(#glow)">{BLOCKS.filter((_, i) => i % 3 === 0).map(([x, y, h], i) => [0, 1, 2].map((k) => { const r = ((k * 1.1 + t * 1.2 + i * 0.4) % 3.3) + 0.3;
      return <path key={i + "_" + k} d={I.ring(x + 0.9, y + 0.9, h + 0.3, r)} fill="none" stroke={cols[i % 4]} strokeWidth={4} opacity={0.8 * (1 - r / 3.6)} />; }))}</g>
    {/* кафе с бесплатным Wi-Fi */}
    <Cube x={5.4} y={5.4} z={0} w={1.8} d={1.8} h={1.0} top="#3a2a5a" l="#2b1f46" r="#24193c" edge={A.edge} />
    {(() => { const [sx, sy] = iso(6.3, 7.2, 1.35); return (<g transform={`translate(${sx},${sy})`}>
      <rect x={-78} y={-24} width={156} height={44} rx={10} fill="#0b1030" stroke={D.mustard} strokeWidth={3} />
      <text x={0} y={8} textAnchor="middle" fontFamily={M} fontWeight={800} fontSize={24} fill={D.mustard} filter="url(#glow)">FREE Wi-Fi</text></g>); })()}
    <g filter="url(#glow)" opacity={0.3 + 0.7 * beacon}>{[0, 1, 2, 3, 4].map((k) => { const r = ((k * 1.2 + t * 2) % 6) + 0.4;
      return <path key={k} d={I.ring(6.3, 6.3, 1.2, r)} fill="none" stroke={D.mustard} strokeWidth={4 + 6 * beacon} opacity={1 - r / 6.4} />; })}</g>
    {/* огоньки-прохожие тянутся к кафе */}
    {Array.from({ length: 14 }, (_, i) => { const a = i * 0.45, R0 = 6 + (i % 4); const k = ez(t, 63.5 + (i % 5) * 0.1, 65.6);
      const r = lerp(R0, 1.4, k); const [px, py] = iso(6.3 + Math.cos(a) * r, 6.3 + Math.sin(a) * r, 0.05);
      return <circle key={i} cx={px} cy={py} r={6} fill="#fff6d0" filter="url(#glow)" opacity={t > 63.3 ? 1 : 0.4} />; })}
  </Stage>);
};

// ===================================================================== СЦЕНЫ (начало = первое слово абзаца)
type Scene = { t0: number; t1: number; mode: Mode; cam: [number, number, number, number][]; el: React.ReactNode; over?: React.ReactNode };
const END = plan.total / FPS;
const SCENES: Scene[] = [
  { t0: 0, t1: 5.3, mode: "A", cam: [[0, 1.0, 0, 120], [5.3, 1.18, 0, 60]], el: <House /> },
  { t0: 5.3, t1: 14.8, mode: "D", cam: [[5.3, 1.25, 150, -80], [9.0, 1.12, 60, -40], [12.6, 1.2, -180, -60], [14.8, 1.3, -230, -80]], el: <Bedroom mode="D" />,
    over: <Card mode="D" x={560} y={1120} w={440} label="ШИРИНА ВОЛНЫ" value="≈ 12 см" at={9.7} /> },
  { t0: 14.8, t1: 21.0, mode: "D", cam: [[14.8, 1.05, 0, 0], [17.9, 1.2, 140, 40], [21.0, 1.3, 180, 60]], el: <Bedroom mode="D" neighbor />,
    over: <><Card mode="D" x={70} y={170} w={420} label="СОСЕД" value="▮▮▮▮▮" at={19.6} /><Card mode="D" x={70} y={380} w={420} label="ТЫ" value="▮▮▯▯▯" at={19.9} accent={D.tealD} /></> },
  { t0: 21.0, t1: 25.8, mode: "D", cam: [[21.0, 1.05, -40, 0], [23.2, 1.15, 160, -40], [25.8, 1.22, 200, -60]], el: <Kitchen />,
    over: <Card mode="D" x={70} y={170} w={460} label="МЕТАЛЛ" value="отражает" at={23.2} /> },
  { t0: 25.8, t1: 31.3, mode: "A", cam: [[25.8, 1.0, 0, 0], [28.4, 1.12, 0, -60], [31.3, 1.2, 0, -80]], el: <Lift />,
    over: <Card mode="A" x={70} y={170} w={560} label="СВЯЗЬ В ЛИФТЕ" value="0 делений" at={30.0} accent={A.glow2} /> },
  { t0: 31.3, t1: 37.7, mode: "D", cam: [[31.3, 1.2, -60, -80], [33.4, 1.3, -80, -100], [36.0, 1.25, 80, 60], [37.7, 1.32, 100, 80]], el: <Kitchen micro /> },
  { t0: 37.7, t1: 45.0, mode: "D", cam: [[37.7, 1.0, 0, 0], [45.0, 1.06, 0, 30]], el: <Explain />,
    over: <Card mode="D" x={560} y={160} w={440} label="ЧАСТОТА" value="≈ 2,4 ГГц" at={39.3} /> },
  { t0: 45.0, t1: 57.1, mode: "D", cam: [[45.0, 1.05, 0, 0], [50.0, 1.12, 40, 20], [54.2, 1.3, -230, 20], [57.1, 1.35, -260, 30]], el: <Party />,
    over: <Card mode="D" x={560} y={170} w={440} label="ВОДА" value="глушит" at={48.9} /> },
  { t0: 57.1, t1: 65.8, mode: "A", cam: [[57.1, 1.0, 0, 0], [61.0, 1.12, 40, 40], [65.8, 1.25, 60, 60]], el: <City /> },
  { t0: 65.8, t1: 73.0, mode: "A", cam: [[65.8, 1.05, 0, 0], [68.2, 1.1, 0, 0], [73.0, 1.2, 160, -40]], el: <BedroomBeam />,
    over: <Card mode="A" x={70} y={170} w={560} label="ПОДКЛЮЧЕНО" value="сосед" at={72.2} accent={A.glow2} /> },
  { t0: 73.0, t1: END, mode: "D", cam: [[73.0, 1.25, -200, -60], [END, 1.45, -260, -90]], el: <Bedroom mode="D" />,
    over: <Card mode="D" x={520} y={180} w={480} label="ТВОЙ ПАРОЛЬ" value="Барсик" at={75.3} /> },
];
function BedroomBeam() { const t = useT(); return <Bedroom mode="A" beam={ez(t, 68.2, 71.2, (x) => x)} />; }
const modeAt = (sec: number) => (SCENES.find((s) => sec >= s.t0 && sec < s.t1) ?? SCENES[SCENES.length - 1]).mode;
const L = lines(plan.groups);

export const TOTAL = plan.total;
export const Video: React.FC = () => {
  const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  const s = SCENES.find((x) => f >= Math.round(x.t0 * FPS) && f < Math.round(x.t1 * FPS)) ?? SCENES[SCENES.length - 1];
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Cam t0={s.t0} keys={s.cam}>{s.el}</Cam>
      {s.over}
      <Title mode="A" question={QUESTION} until={4.9} />
      <Finish mode={s.mode} />
      <Captions L={L} mode={modeAt} accentWords={ACCENT} />
      <Audio src={staticFile(plan.voice)} />
      <Audio src={staticFile("music.wav")} loop volume={(fr) => interpolate(fr, [0, 20, durationInFrames - 45, durationInFrames], [0, 0.22, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio src={staticFile("sfx.wav")} volume={0.45} />
    </AbsoluteFill>
  );
};
