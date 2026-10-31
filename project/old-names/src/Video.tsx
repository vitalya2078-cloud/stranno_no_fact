// «А что если бы ты сказал это сто лет назад?» — как привычные вещи назывались раньше. Стиль D, исландский кадр — A.
// Абзацы (с): 0.0 хук, 5.6 «машина», 16.0 самокат, 23.3 костотряс, 29.6 вертолёт, 38.7 вопрос, 42.7 короче, 52.5 tölva, 60.2 мокроступы, 67.3 кнопка.
import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import plan from "./plan.json";
import { A, Captions, Cam, Card, D, FPS, Finish, G, M, Mode, Stage, Title, U, ez, lerp, lines, makeIso, useT } from "./brand";

const QUESTION = "ты сказал это сто лет назад?";
const ACCENT = ["машине", "поезд", "самоходом", "мотором", "самокате", "костотрясом", "геликоптер", "вертолёт", "короче", "тёльва", "мокроступы", "паровозом"];
const I = makeIso(64, 470, 560);
const { iso, pts, Cube } = I;

// ===================================================================== бирка на объекте (бумажная, с ниткой)
const Tag: React.FC<{ x: number; y: number; z: number; text: string; at: number; until?: number; color?: string; dark?: boolean; fs?: number }> =
  ({ x, y, z, text, at, until = 999, color = D.mustard, dark = true, fs = 34 }) => {
    const f = useCurrentFrame(); const t = f / FPS;
    if (t < at || t >= until) return null;
    const s = spring({ frame: f - Math.round(at * FPS), fps: FPS, config: { damping: 11, stiffness: 200 } });
    const [px, py] = iso(x, y, z); const sw = Math.sin(t * 2.4 + x) * 3;
    return (<g transform={`translate(${px},${py}) rotate(${sw}) scale(${s})`}>
      <line x1={0} y1={0} x2={0} y2={-46} stroke={D.ink} strokeWidth={3} />
      <g filter="url(#pD)"><rect x={-text.length * fs * 0.33 - 18} y={-46 - fs - 24} width={text.length * fs * 0.66 + 36} height={fs + 26} rx={6} fill={color} /></g>
      <text x={0} y={-46 - 20} textAnchor="middle" fontFamily={G} fontWeight={800} fontSize={fs} fill={dark ? D.ink : D.cream}>{text}</text>
    </g>);
  };
// колесо в вертикальной плоскости вдоль оси x (вращается)
const Wheel: React.FC<{ x: number; y: number; r: number; t: number; c?: string; spokes?: boolean }> = ({ x, y, r, t, c = D.ink, spokes = true }) => {
  const p: string[] = []; for (let i = 0; i <= 32; i++) { const a = (i / 32) * Math.PI * 2; p.push(iso(x + Math.cos(a) * r, y, r + Math.sin(a) * r).join(",")); }
  const [cx, cy] = iso(x, y, r);
  return (<g>
    <path d={"M" + p.join(" L")} fill="none" stroke={c} strokeWidth={Math.max(4, r * 7)} />
    {spokes ? [0, 1, 2, 3].map((k) => { const a = t * -4 + (k * Math.PI) / 4; const [ex, ey] = iso(x + Math.cos(a) * r, y, r + Math.sin(a) * r), [fx, fy] = iso(x - Math.cos(a) * r, y, r - Math.sin(a) * r);
      return <line key={k} x1={ex} y1={ey} x2={fx} y2={fy} stroke={c} strokeWidth={2.5} opacity={0.7} />; }) : null}
    <circle cx={cx} cy={cy} r={4} fill={c} />
  </g>);
};

// ===================================================================== транспорт (x — положение вдоль улицы)
const Train: React.FC<{ x: number; t: number }> = ({ x, t }) => (<g>
  {[0, 1, 2].map((i) => { const [sx, sy] = iso(x + 2.6, 5, 2.6 + i * 0.7 + ((t * 1.2 + i * 0.33) % 1) * 0.8);
    return <circle key={i} cx={sx - i * 10} cy={sy} r={22 + i * 10} fill="#f1ece2" opacity={0.85 - i * 0.2} filter="url(#pD)" />; })}
  <Cube x={x} y={4.4} z={0.5} w={3.4} d={1.2} h={1.3} top="#2b3640" l="#1d2a33" r="#152028" shadow />
  <Cube x={x - 1.2} y={4.3} z={0.5} w={1.3} d={1.4} h={2.2} top={D.coral} l={D.coralD} r="#c94f32" shadow />
  <Cube x={x + 2.4} y={4.75} z={1.8} w={0.5} d={0.5} h={0.9} top="#2b3640" l="#1d2a33" r="#152028" />
  <Cube x={x + 3.3} y={4.5} z={0.3} w={0.4} d={1.0} h={0.4} top={D.mustard} l={D.mustD} r="#c4861a" />
  {[x + 0.2, x + 1.4, x + 2.6].map((wx, i) => <Wheel key={i} x={wx} y={5.65} r={0.5} t={t} c={D.coralD} />)}
</g>);
const Car: React.FC<{ x: number; t: number }> = ({ x, t }) => (<g>
  <Cube x={x} y={4.4} z={0.5} w={2.6} d={1.2} h={0.7} top={D.teal} l={D.tealD} r={D.tealDD} shadow />
  <Cube x={x + 0.2} y={4.5} z={1.2} w={1.3} d={1.0} h={0.8} top={D.cream} l="#e6dccb" r="#d6cbb8" shadow />
  <Cube x={x + 2.3} y={4.5} z={0.9} w={0.3} d={1.0} h={0.3} top={D.mustard} l={D.mustD} r="#c4861a" />
  {[x + 0.4, x + 2.1].map((wx, i) => <Wheel key={i} x={wx} y={5.65} r={0.45} t={t} />)}
</g>);
// велосипед «паук»: большое переднее колесо, маленькое заднее
const Bike: React.FC<{ x: number; t: number; shake?: number }> = ({ x, t, shake = 0 }) => {
  const dz = shake * Math.sin(t * 60) * 0.12;
  return (<g transform={`translate(0,${-dz * 46})`}>
    <Wheel x={x + 1.4} y={5.2} r={1.1} t={t} c={D.ink} />
    <Wheel x={x} y={5.2} r={0.35} t={t * 3} c={D.ink} />
    {(() => { const a = iso(x, 5.2, 0.7), b = iso(x + 1.3, 5.2, 2.5), c = iso(x + 1.4, 5.2, 1.1);
      return <path d={`M${a[0]},${a[1]} Q${a[0] + 10},${b[1] - 10} ${b[0]},${b[1]} L${c[0]},${c[1]}`} fill="none" stroke={D.coralD} strokeWidth={7} strokeLinecap="round" />; })()}
    {(() => { const [sx, sy] = iso(x + 1.15, 5.2, 2.55); return <ellipse cx={sx} cy={sy} rx={18} ry={7} fill={D.ink} />; })()}
    {shake > 0 ? [0, 1, 2].map((k) => { const [lx, ly] = iso(x + 1.4, 5.2, 0.1); return <path key={k} d={`M${lx - 40 - k * 16},${ly + 6} l8,-10 l8,10 l8,-10`} fill="none" stroke={D.ink} strokeWidth={3} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 20 + k))} />; }) : null}
  </g>);
};

// ===================================================================== УЛИЦА (D): дорога, тротуар, дома с окнами, фонари
const HOUSES: [number, number, string, string, string][] = [[-3, 3.4, D.coral, D.coralD, "#c94f32"], [0.2, 4.4, D.mustard, D.mustD, "#c4861a"], [3.6, 3.0, D.teal, D.tealD, D.tealDD],
  [6.4, 4.0, "#efe2c8", "#e3d2b2", "#d6c3a0"], [9.8, 3.6, D.rose, "#c94a60", "#b13f55"]];
const Street: React.FC<{ children?: React.ReactNode; cobble?: boolean }> = ({ children, cobble = false }) => (<Stage mode="D">
  <polygon points={pts([[-6, 3.2, 0], [16, 3.2, 0], [16, 4.2, 0], [-6, 4.2, 0]])} fill="#e9dcc4" />
  <polygon points={pts([[-6, 4.2, 0], [16, 4.2, 0], [16, 6.6, 0], [-6, 6.6, 0]])} fill={cobble ? "#b9a88c" : "#8b9aa0"} />
  {cobble ? Array.from({ length: 60 }, (_, i) => { const x = -5 + (i % 20) * 1.05, y = 4.4 + Math.floor(i / 20) * 0.75;
    return <polygon key={i} points={pts([[x, y, 0.01], [x + 0.85, y, 0.01], [x + 0.85, y + 0.6, 0.01], [x, y + 0.6, 0.01]])} fill="#cdbd9f" stroke="#9c8b70" strokeWidth={1.5} />; })
    : Array.from({ length: 10 }, (_, i) => <polygon key={i} points={pts([[-5 + i * 2.2, 5.35, 0.01], [-4 + i * 2.2, 5.35, 0.01], [-4 + i * 2.2, 5.45, 0.01], [-5 + i * 2.2, 5.45, 0.01]])} fill="#f1ece2" />)}
  {HOUSES.map(([x, h, t, l, r], i) => (<g key={i}>
    <Cube x={x} y={0} z={0} w={3.0} d={3.0} h={h} top={t} l={l} r={r} shadow />
    {Array.from({ length: Math.floor(h / 1.1) * 2 }, (_, k) => { const wx = x + 0.45 + (k % 2) * 1.3, wz = 0.6 + Math.floor(k / 2) * 1.1;
      return <polygon key={k} points={pts([[wx, 3.0, wz], [wx + 0.8, 3.0, wz], [wx + 0.8, 3.0, wz + 0.6], [wx, 3.0, wz + 0.6]])} fill="#fff6d8" stroke={D.ink} strokeOpacity={0.25} strokeWidth={2} />; })}
  </g>))}
  {[1.9, 8.6].map((x, i) => (<g key={i}>
    <Cube x={x} y={3.5} z={0} w={0.12} d={0.12} h={3.2} top={D.ink} l={D.ink} r={D.ink} />
    <circle cx={iso(x + 0.06, 3.56, 3.3)[0]} cy={iso(x + 0.06, 3.56, 3.3)[1]} r={13} fill={D.mustard} filter="url(#glow)" />
  </g>))}
  {children}
</Stage>);

// ===================================================================== СЦЕНЫ
export const S1: React.FC<{ end?: boolean }> = ({ end = false }) => {
  const t = useT(); const t0 = end ? 70.3 : 3.4;
  const tx = lerp(15, 3.2, ez(t, t0, t0 + 1.7, (x) => 1 - Math.pow(1 - x, 3)));
  return <Street><Train x={tx} t={t} /><Tag x={2.0} y={4.0} z={4.6} text="МАШИНА" at={end ? 67.3 : 2.4} fs={40} /></Street>;
};
const S2: React.FC = () => {
  const t = useT();
  const carTag = t < 12.4 ? "МАШИНА" : t < 13.0 ? "САМОХОД" : t < 15.2 ? "САМОБЕГЛАЯ КОЛЯСКА" : "МОТОР";
  return (<Street>
    <Train x={6.6} t={t} /><Car x={1.6} t={t} /><Bike x={-2.4} t={t} />
    <Tag x={8.4} y={4.6} z={3.6} text="МАШИНА" at={8.2} />
    <Tag x={2.9} y={4.6} z={2.4} text={carTag} at={8.8} fs={carTag.length > 12 ? 28 : 34} color={t >= 12.4 ? D.cream : D.mustard} key={carTag} />
    <Tag x={-1.0} y={4.6} z={2.8} text="МАШИНА" at={10.1} />
  </Street>);
};
const S3: React.FC = () => {
  const t = useT(); const bx = lerp(14, 3.4, ez(t, 19.3, 21.0, (x) => 1 - Math.pow(1 - x, 3)));
  return <Street><Bike x={bx} t={t} /><Tag x={bx + 1.4} y={5.2} z={2.8} text="САМОКАТ" at={20.4} /></Street>;
};
const S4: React.FC = () => { const t = useT(); return <Street cobble><Bike x={3.4} t={t} shake={t > 23.6 ? 1 : 0.4} /></Street>; };
const Heli: React.FC = () => {
  const t = useT(); const [cx, cy] = [560, 860 + Math.sin(t * 2) * 14];
  const tag = t < 32.9 ? "ГЕЛИКОПТЕР" : "ВЕРТОЛЁТ";
  return (<AbsoluteFill style={{ background: "linear-gradient(#bfe3e4, #f3e7cf)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs><filter id="pD" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="-6" dy="12" stdDeviation="8" floodColor="#0b1a1f" floodOpacity="0.3" /></filter></defs>
      {[[160, 420, 1], [820, 330, 0.8], [700, 1250, 1.1]].map(([x, y, s], i) => <g key={i} transform={`translate(${x + Math.sin(t * 0.3 + i) * 20},${y}) scale(${s})`} filter="url(#pD)">
        <ellipse cx={0} cy={0} rx={90} ry={34} fill="#fff" /><ellipse cx={-40} cy={-18} rx={50} ry={34} fill="#fff" /><ellipse cx={30} cy={-24} rx={56} ry={40} fill="#fff" /></g>)}
      <g transform={`translate(${cx},${cy})`} filter="url(#pD)">
        <path d="M60,-10 L330,-30 L340,0 L80,40z" fill={D.tealD} /><rect x={318} y={-90} width={18} height={90} rx={8} fill={D.tealDD} />
        <ellipse cx={0} cy={10} rx={170} ry={110} fill={D.teal} />
        <path d="M-150,-10 a140,95 0 0 1 140,-80 v120 h-140z" fill="#cfe9ec" opacity={0.9} />
        <rect x={-110} y={110} width={260} height={14} rx={7} fill={D.ink} /><rect x={-60} y={80} width={10} height={36} fill={D.ink} /><rect x={80} y={80} width={10} height={36} fill={D.ink} />
        <rect x={-8} y={-130} width={16} height={40} fill={D.ink} />
        <g transform={`translate(0,-132) scale(1,0.18) rotate(${t * 900})`}><rect x={-330} y={-12} width={660} height={24} rx={12} fill={D.ink} /><rect x={-12} y={-330} width={24} height={660} rx={12} fill={D.ink} /></g>
      </g>
      <g transform={`translate(${cx + 90},${cy - 230}) rotate(-4)`} key={tag}>
        <g filter="url(#pD)"><rect x={-tag.length * 15 - 24} y={-56} width={tag.length * 30 + 48} height={74} rx={8} fill={t < 32.9 ? D.cream : D.mustard} /></g>
        <text x={0} y={-6} textAnchor="middle" fontFamily={G} fontWeight={800} fontSize={44} fill={D.ink}>{tag}</text>
        {t >= 32.9 && t < 33.6 ? <rect x={-200} y={-70} width={400} height={100} fill="#fff" opacity={1 - (t - 32.9) / 0.7} /> : null}
      </g>
    </svg>
  </AbsoluteFill>);
};
// вопрос: бирки разлетаются вокруг большого «?»
const Question: React.FC = () => {
  const t = useT(); const k = ez(t, 38.8, 39.6, (x) => 1 - Math.pow(1 - x, 3));
  const words = ["САМОХОД", "МОТОР", "ГЕЛИКОПТЕР", "САМОКАТ", "КОСТОТРЯС", "МАШИНА"];
  return (<AbsoluteFill style={{ background: D.bg }}>
    {words.map((w, i) => { const a = (i / words.length) * Math.PI * 2 + 0.4; const r = lerp(40, 330, k);
      return <div key={w} style={{ position: "absolute", left: 540 + Math.cos(a) * r - 140, top: 840 + Math.sin(a) * r * 1.3, width: 280, textAlign: "center", fontFamily: G, fontWeight: 800,
        fontSize: 36, background: i % 2 ? D.cream : D.mustard, color: D.ink, padding: "12px 0", transform: `rotate(${(i % 3 - 1) * 8 + Math.sin(t + i) * 3}deg)`, boxShadow: "-6px 10px 0 rgba(0,0,0,0.25)" }}>{w}</div>; })}
    <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: G, fontWeight: 800, fontSize: 360, lineHeight: 1, color: D.cream,
      transform: `scale(${0.6 + 0.4 * k})`, textShadow: `-14px 22px 0 rgba(0,0,0,0.25), 0 0 60px ${D.mustard}` }}>?</div>
  </AbsoluteFill>);
};
// короче побеждает: пары «длинное ✗ — короткое ✓»
const Shorter: React.FC = () => {
  const t = useT();
  const pair = (y: number, long: string, short: string, at: number) => {
    const a = ez(t, at, at + 0.35), b = ez(t, at + 0.7, at + 1.0);
    return (<div style={{ position: "absolute", left: 70, right: 70, top: y, opacity: a, transform: `translateY(${(1 - a) * 30}px)`, fontFamily: G, fontWeight: 800 }}>
      <div style={{ display: "inline-block", background: D.cream, color: D.ink, fontSize: 40, padding: "16px 24px", transform: "rotate(-2deg)", boxShadow: "-6px 10px 0 rgba(0,0,0,0.25)", position: "relative" }}>
        {long}<div style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 8, background: D.rose, transform: `scaleX(${b}) rotate(-3deg)`, transformOrigin: "0 50%" }} /></div>
      <div style={{ display: "inline-block", marginLeft: 26, marginTop: 24, background: D.mustard, color: D.ink, fontSize: 64, padding: "14px 30px", transform: `rotate(2deg) scale(${0.8 + 0.2 * b})`,
        boxShadow: "-6px 10px 0 rgba(0,0,0,0.25)" }}>{short} ✓</div>
    </div>);
  };
  return (<AbsoluteFill style={{ background: D.bg }}>
    {pair(300, "ГЕЛИКОПТЕР", "ВЕРТОЛЁТ", 45.6)}
    {pair(680, "САМОДВИЖУЩИЙСЯ ЭКИПАЖ", "МОТОР", 47.5)}
    {t > 50.3 ? <div style={{ position: "absolute", left: 0, right: 0, top: 1110, textAlign: "center", fontFamily: G, fontWeight: 800, fontSize: 64, color: D.cream,
      opacity: ez(t, 50.3, 50.7) }}>ЯЗЫК ЛЕНИВ — КАК И МЫ</div> : null}
  </AbsoluteFill>);
};
// Исландия (A): неоновый компьютер на столе
const Iceland: React.FC = () => {
  const t = useT();
  return (<Stage mode="A">
    <I.Room mode="A" />
    <Cube x={2.5} y={2.5} z={0} w={5} d={3} h={2.2} top="#2b356f" l="#20285a" r="#1a2150" edge={A.edge} />
    <Cube x={4.0} y={2.9} z={2.2} w={0.5} d={1.8} h={2.6} top="#e8ecff" l="#b9c2ee" r="#9aa4d6" edge={A.edge} />
    <polygon points={pts([[4.5, 3.05, 2.4], [4.5, 4.55, 2.4], [4.5, 4.55, 4.6], [4.5, 3.05, 4.6]])} fill="#0b1030" />
    <polygon points={pts([[4.5, 3.05, 2.4], [4.5, 4.55, 2.4], [4.5, 4.55, 4.6], [4.5, 3.05, 4.6]])} fill={A.glow} opacity={0.25 + 0.1 * Math.sin(t * 4)} filter="url(#glow)" />
    {[0, 1, 2, 3].map((k) => { const [x1, y1] = iso(4.5, 3.3, 4.2 - k * 0.45), [x2, y2] = iso(4.5, 3.3 + 0.6 + (k % 2) * 0.5, 4.2 - k * 0.45);
      return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={A.glow} strokeWidth={5} filter="url(#glow)" />; })}
    <Cube x={5.4} y={3.2} z={2.2} w={1.6} d={1.6} h={0.1} top="#1f2858" l="#151c45" r="#10163a" edge={A.edge} />
    {/* снежинки — Исландия */}
    {Array.from({ length: 24 }, (_, i) => { const [sx, sy] = iso(((i * 37) % 10), ((i * 53) % 10), 7 - ((t * 0.8 + i * 0.3) % 7)); return <circle key={i} cx={sx} cy={sy} r={3} fill="#e8f6ff" opacity={0.7} />; })}
  </Stage>);
};
const Galoshes: React.FC = () => {
  const t = useT(); const cross = ez(t, 63.9, 64.4);
  return (<AbsoluteFill style={{ background: D.bg }}>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs><filter id="pD" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="-6" dy="12" stdDeviation="8" floodColor="#0b1a1f" floodOpacity="0.35" /></filter></defs>
      <rect x={120} y={600} width={840} height={700} rx={8} fill={D.cream} filter="url(#pD)" transform="rotate(-1.5 540 950)" />
      {[0, 1].map((i) => <g key={i} transform={`translate(${330 + i * 290},${1020 + i * 30}) rotate(${-8 + i * 12})`} filter="url(#pD)">
        <path d="M-150,40 q-10,-90 70,-110 q60,-14 120,30 q60,40 110,46 q30,6 26,40 q-4,30 -40,30 h-270 q-20,0 -16,-36z" fill="#1d2a33" />
        <path d="M-120,10 q60,-60 130,-20" fill="none" stroke="#3a4a55" strokeWidth={10} strokeLinecap="round" />
        <path d="M-150,62 h330" stroke="#b5452f" strokeWidth={12} /></g>)}
    </svg>
    <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", opacity: ez(t, 60.5, 60.9) }}>
      <div style={{ position: "relative", background: D.mustard, color: D.ink, fontFamily: G, fontWeight: 800, fontSize: 64, padding: "16px 36px", transform: "rotate(-3deg)", boxShadow: "-8px 12px 0 rgba(0,0,0,0.25)" }}>
        МОКРОСТУПЫ
        <div style={{ position: "absolute", left: -16, right: -16, top: "48%", height: 12, background: D.rose, transform: `scaleX(${cross}) rotate(-4deg)`, transformOrigin: "0 50%" }} />
      </div>
    </div>
  </AbsoluteFill>);
};

// ===================================================================== СЦЕНЫ (начало = первое слово абзаца)
type Scene = { t0: number; t1: number; mode: Mode; cam: [number, number, number, number][]; el: React.ReactNode; over?: React.ReactNode };
const END = plan.total / FPS;
const SCENES: Scene[] = [
  { t0: 0, t1: 5.6, mode: "D", cam: [[0, 1.0, 0, 60], [5.6, 1.12, 60, 60]], el: <S1 /> },
  { t0: 5.6, t1: 16.0, mode: "D", cam: [[5.6, 1.0, 0, 40], [11.0, 1.12, -80, 40], [16.0, 1.2, -60, 40]], el: <S2 /> },
  { t0: 16.0, t1: 23.3, mode: "D", cam: [[16.0, 1.05, 60, 40], [23.3, 1.18, 40, 60]], el: <S3 /> },
  { t0: 23.3, t1: 29.6, mode: "D", cam: [[23.3, 1.25, 20, 80], [29.6, 1.35, 20, 100]], el: <S4 />,
    over: <><Card mode="D" x={70} y={170} w={520} label="ПРОЗВИЩЕ" value="костотряс" at={23.6} /><Card mode="D" x={500} y={1150} w={480} label="РЕЗИНОВЫЕ ШИНЫ" value="только с 1880-х" at={25.7} accent={D.tealD} /></> },
  { t0: 29.6, t1: 38.7, mode: "D", cam: [[29.6, 1.0, 0, 0], [38.7, 1.1, 0, -40]], el: <Heli />,
    over: <><Card mode="D" x={70} y={170} w={360} label="ГОД" value="1929" at={34.7} /><Card mode="D" x={480} y={1150} w={500} label="АВТОР СЛОВА" value="Н. Камов" at={37.6} accent={D.tealD} /></> },
  { t0: 38.7, t1: 42.7, mode: "D", cam: [[38.7, 1.0, 0, 0], [42.7, 1.08, 0, 0]], el: <Question /> },
  { t0: 42.7, t1: 52.5, mode: "D", cam: [[42.7, 1.0, 0, 0], [52.5, 1.05, 0, 20]], el: <Shorter /> },
  { t0: 52.5, t1: 60.2, mode: "A", cam: [[52.5, 1.0, 0, 0], [60.2, 1.15, 20, -20]], el: <Iceland />,
    over: <><Card mode="A" x={70} y={170} w={560} label="КОМПЬЮТЕР" value="tölva" at={57.2} /><Card mode="A" x={70} y={1100} w={940} label="ОТ СЛОВ" value="число + прорицательница" at={58.4} accent={A.glow2} /></> },
  { t0: 60.2, t1: 67.3, mode: "D", cam: [[60.2, 1.0, 0, 0], [67.3, 1.1, 0, 30]], el: <Galoshes />,
    over: <Card mode="D" x={560} y={1130} w={360} label="ЭТО" value="МИФ" at={64.4} /> },
  { t0: 67.3, t1: END, mode: "D", cam: [[67.3, 1.05, 0, 60], [END, 1.15, 60, 60]], el: <S1 end /> },
];
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
      <Title mode="D" question={QUESTION} until={2.2} />
      <Finish mode={s.mode} />
      <Captions L={L} mode={modeAt} accentWords={ACCENT} />
      <Audio src={staticFile(plan.voice)} />
      <Audio src={staticFile("music.wav")} loop volume={(fr) => interpolate(fr, [0, 20, durationInFrames - 45, durationInFrames], [0, 0.22, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio src={staticFile("sfx.wav")} volume={0.45} />
    </AbsoluteFill>
  );
};
