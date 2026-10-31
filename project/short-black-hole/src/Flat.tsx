// ПЛОСКИЙ ВАРИАНТ E01 «Если Солнце станет чёрной дырой»: без персонажей, векторные сцены-предметы
// (балкон, космос, весы, планшет, термометр, свитер), информационные плашки, дрейф камеры, снег.
// Субтитры — 2 строки капсом, произнесённые слова белые, будущие — серые. Время — в секундах голоса.
import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import plan from "./plan.json";

const { fontFamily } = loadFont("normal", { weights: ["600", "700", "900"], subsets: ["latin", "cyrillic"] });
const FPS = 30;
export const FLAT_TOTAL = plan.total;
const W = 1080, H = 1920;
const ez = (t: number, a: number, b: number, f = Easing.inOut(Easing.cubic)) => (t <= a ? 0 : t >= b ? 1 : f((t - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const useT = () => useCurrentFrame() / FPS;            // секунда голоса (сцены живут в общей шкале)

// ===================================================================== камера: дрейф + «посадка» после склейки
const Cam: React.FC<{ t0: number; keys: [number, number, number, number][]; children: React.ReactNode }> = ({ t0, keys, children }) => {
  const t = useT();
  let [s, x, y] = [keys[0][1], keys[0][2], keys[0][3]];
  for (let i = 1; i < keys.length; i++) if (t >= keys[i - 1][0]) {
    const k = ez(t, keys[i - 1][0], keys[i][0]);
    s = lerp(keys[i - 1][1], keys[i][1], k); x = lerp(keys[i - 1][2], keys[i][2], k); y = lerp(keys[i - 1][3], keys[i][3], k);
  }
  const land = 1 + 0.06 * Math.exp(-(t - t0) * 7);       // сцена «садится» после склейки
  s = Math.max(1, s);                                      // не открывать края кадра
  const mx = (W * (s * land - 1)) / (2 * s * land), my = (H * (s * land - 1)) / (2 * s * land);
  x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
  return (
    <AbsoluteFill style={{ transform: `scale(${s * land}) translate(${-x}px, ${-y}px)`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
  );
};

// ===================================================================== общие элементы
const rnd = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const STAR = (() => { const r = rnd(5); return Array.from({ length: 160 }, () => ({ x: r() * 1300 - 110, y: r() * 2200 - 140, s: 0.8 + r() * 2.2, p: r() * 6 })); })();
const Stars: React.FC = () => { const t = useT();
  return <g>{STAR.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={0.35 + 0.35 * Math.sin(t * 1.5 + s.p)} />)}</g>; };
const SNOW = (() => { const r = rnd(9); return Array.from({ length: 90 }, () => ({ x: r() * 1200 - 60, y: r() * 2000, s: 2 + r() * 5, v: 40 + r() * 70, p: r() * 6 })); })();
const Snow: React.FC<{ n?: number }> = ({ n = 90 }) => { const t = useT();
  return <svg width={W} height={H} style={{ position: "absolute" }}>{SNOW.slice(0, n).map((s, i) =>
    <circle key={i} cx={s.x + Math.sin(t * 0.8 + s.p) * 30} cy={(s.y + t * s.v) % 2000 - 40} r={s.s} fill="#eef6ff" opacity={0.75} />)}</svg>; };

// инфо-плашка как в примере: тёмная, полоска слева, мелкая подпись + крупное значение
const Panel: React.FC<{ x: number; y: number; label: string; value: string; at: number; color?: string; w?: number }> = ({ x, y, label, value, at, color = "#4fb3ff", w = 620 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 14, stiffness: 180 } });
  if (s <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, padding: "26px 34px 28px 46px", background: "rgba(10,14,24,0.88)", borderRadius: 18,
      boxShadow: "0 18px 40px rgba(0,0,0,0.45)", opacity: s, transform: `translateX(${(1 - s) * -60}px)`, fontFamily }}>
      <div style={{ position: "absolute", left: 16, top: 22, bottom: 22, width: 8, borderRadius: 4, background: color }} />
      <div style={{ color, fontSize: 30, fontWeight: 600, letterSpacing: 5 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 76, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
};

// красный «маркерный» круг, обводящий цель
const RedCircle: React.FC<{ cx: number; cy: number; rx: number; ry: number; at: number }> = ({ cx, cy, rx, ry, at }) => {
  const t = useT(); const k = ez(t, at, at + 0.45, Easing.out(Easing.cubic));
  if (k <= 0) return null;
  const L = 2 * Math.PI * Math.max(rx, ry) * 1.1;
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#d6262b" strokeWidth={9} strokeLinecap="round"
    strokeDasharray={L} strokeDashoffset={L * (1 - k)} transform={`rotate(-8 ${cx} ${cy})`} />;
};

// ===================================================================== КОСМОС: Солнце / чёрная дыра, Земля на орбите
const Earth: React.FC<{ x: number; y: number; r: number; light?: number }> = ({ x, y, r, light = 1 }) => (
  <g transform={`translate(${x},${y})`}>
    <defs>
      <radialGradient id="eOcean" cx="35%" cy="35%"><stop offset="0%" stopColor="#5fb4ff" /><stop offset="100%" stopColor="#1d4fa8" /></radialGradient>
      <clipPath id="eClip"><circle r={r} /></clipPath>
      <linearGradient id="eShade" x1="0" x2="1"><stop offset="0.45" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#05081a" stopOpacity={0.75} /></linearGradient>
    </defs>
    <circle r={r * 1.18} fill="#7fc4ff" opacity={0.18 * light} />
    <circle r={r} fill="url(#eOcean)" />
    <g clipPath="url(#eClip)" fill="#3fa35a">
      <path d={`M${-r * 0.7},${-r * 0.3} q${r * 0.3},${-r * 0.5} ${r * 0.7},${-r * 0.2} t${r * 0.2},${r * 0.5} q${-r * 0.4},${r * 0.3} ${-r * 0.8},${r * 0.1}z`} />
      <path d={`M${r * 0.1},${r * 0.2} q${r * 0.4},${-r * 0.1} ${r * 0.6},${r * 0.3} t${-r * 0.2},${r * 0.5} q${-r * 0.3},0 ${-r * 0.4},${-r * 0.3}z`} />
      <rect x={-r} y={-r} width={2 * r} height={2 * r} fill="url(#eShade)" />
      <rect x={-r} y={-r} width={2 * r} height={2 * r} fill="#05081a" opacity={1 - light} />
    </g>
  </g>
);
const Sun: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => { const t = useT();
  return (<g transform={`translate(${x},${y})`}>
    <defs><radialGradient id="sunG"><stop offset="0%" stopColor="#fff6d0" /><stop offset="60%" stopColor="#ffc94a" /><stop offset="100%" stopColor="#ff9a1f" /></radialGradient>
      <radialGradient id="sunHalo"><stop offset="0%" stopColor="#ffd36a" stopOpacity={0.55} /><stop offset="100%" stopColor="#ffd36a" stopOpacity={0} /></radialGradient></defs>
    <circle r={r * 2.4} fill="url(#sunHalo)" />
    {Array.from({ length: 16 }, (_, i) => <rect key={i} x={-4} y={r * 1.15} width={8} height={r * 0.35} rx={4} fill="#ffc94a" opacity={0.5}
      transform={`rotate(${i * 22.5 + t * 6})`} />)}
    <circle r={r} fill="url(#sunG)" />
  </g>); };
const BlackHole: React.FC<{ x: number; y: number; r: number; danger?: number }> = ({ x, y, r, danger = 0 }) => { const t = useT();
  return (<g transform={`translate(${x},${y})`}>
    <defs><radialGradient id="bhGlow"><stop offset="40%" stopColor="#ff9a3a" stopOpacity={0.6} /><stop offset="100%" stopColor="#ff6a1a" stopOpacity={0} /></radialGradient>
      <filter id="bhBlur"><feGaussianBlur stdDeviation={r * 0.08} /></filter></defs>
    <circle r={r * 2.6} fill="url(#bhGlow)" />
    {danger > 0 ? <circle r={r * 1.9} fill="#d6262b" opacity={0.25 * danger} stroke="#ff4a4a" strokeWidth={6} strokeDasharray="18 12" strokeOpacity={danger} /> : null}
    <g filter="url(#bhBlur)">
      <ellipse rx={r * 2.3} ry={r * 0.55} fill="none" stroke="#ffb347" strokeWidth={r * 0.32} />
      <ellipse rx={r * 1.7} ry={r * 0.4} fill="none" stroke="#fff1c2" strokeWidth={r * 0.14} />
    </g>
    {Array.from({ length: 22 }, (_, i) => { const a = i * 0.9 + t * (1.6 + (i % 4) * 0.3); const rr = r * (1.4 + (i % 5) * 0.2);
      return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr * 0.24} r={3 + (i % 3)} fill="#ffe2a0" opacity={Math.sin(a) > 0 ? 0.95 : 0.4} />; })}
    <circle r={r} fill="#000" />
    <circle r={r * 1.04} fill="none" stroke="#ffe7a8" strokeWidth={4} opacity={0.9} />
    <ellipse cy={-r * 0.02} rx={r * 1.6} ry={r * 0.16} fill="none" stroke="#ffb347" strokeWidth={r * 0.12} clipPath="none" opacity={0.9}
      transform={`translate(0,${r * 0.05})`} style={{ mixBlendMode: "screen" }} />
  </g>); };

// mode: hook (Солнце → дыра), light (свет в пути), orbit (та же орбита), suck (крупно дыра), near (опасно только вблизи)
const Space: React.FC<{ mode: "hook" | "light" | "orbit" | "suck" | "near" }> = ({ mode }) => {
  const t = useT();
  const CX = 540, CY = 900, RX = 400, RY = 150;
  const col = mode === "hook" ? ez(t, 2.3, 2.65, Easing.in(Easing.cubic)) : 1;
  const flash = mode === "hook" && t > 2.55 ? Math.exp(-(t - 2.6) * 6) : 0;
  const a = t * 0.55 + 0.4;
  const ex = CX + Math.cos(a) * RX, ey = CY + Math.sin(a) * RY, front = Math.sin(a) > 0;
  const earthR = front ? 46 : 36;
  const light = mode === "hook" ? 1 - 0.35 * col : mode === "orbit" ? 0.35 : 1;
  const orbitGlow = mode === "orbit" ? ez(t, 19.3, 19.9) : mode === "hook" ? ez(t, 3.6, 4.2) : 0;
  const earthEl = <Earth x={ex} y={ey} r={earthR} light={light} />;
  return (<>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1a2350 0%, #0a0f26 55%, #04060f 100%)" }} />
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <Stars />
      {mode === "suck" || mode === "near" || mode === "light" ? null : (<>
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#9fd8ff" strokeOpacity={0.35 + 0.5 * orbitGlow} strokeWidth={3 + 5 * orbitGlow} strokeDasharray="14 14" />
        {!front ? earthEl : null}
        {col < 1 ? <Sun x={CX} y={CY} r={lerp(190, 8, col)} /> : null}
        {col > 0.6 ? <BlackHole x={CX} y={CY} r={lerp(10, 38, ez(t, 2.5, 2.9))} /> : null}
        {front ? earthEl : null}
      </>)}
      {mode === "light" ? (<>
        {/* луч света от места, где было Солнце, к Земле справа */}
        <BlackHole x={200} y={900} r={38} />
        <line x1={240} y1={900} x2={850} y2={900} stroke="#ffe7a8" strokeOpacity={0.25} strokeWidth={6} strokeDasharray="4 18" />
        {Array.from({ length: 6 }, (_, i) => { const p = ((t - 11.8) * 0.28 + i / 6) % 1; const x = lerp(260, 830, p);
          return <g key={i}><circle cx={x} cy={900} r={14} fill="#fff1c2" /><circle cx={x} cy={900} r={34} fill="#ffd36a" opacity={0.25} /></g>; })}
        <Earth x={900} y={900} r={64} />
      </>) : null}
      {mode === "suck" ? (<>
        {Array.from({ length: 40 }, (_, i) => { const ph = (((t - 21.1) * 0.45 + i / 40) % 1); const rr = lerp(520, 70, ph); const ang = i * 2.4 + ph * 7;
          return <circle key={i} cx={540 + Math.cos(ang) * rr} cy={900 + Math.sin(ang) * rr * 0.45} r={lerp(9, 2, ph)} fill={i % 3 ? "#ffd38a" : "#9fd8ff"} opacity={1 - ph * 0.6} />; })}
        <BlackHole x={540} y={900} r={130} />
      </>) : null}
      {mode === "near" ? (<>
        <BlackHole x={540} y={820} r={90} danger={ez(t, 34.2, 34.6)} />
        <Earth x={930} y={1180} r={30} />
        <line x1={600} y1={870} x2={905} y2={1160} stroke="#9fd8ff" strokeOpacity={0.5} strokeWidth={3} strokeDasharray="10 10" />
      </>) : null}
    </svg>
    <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.9 }} />
  </>);
};

// ===================================================================== БАЛКОН: небо, город, перила, кружка
const CITY = (() => { const r = rnd(3); const far = [], near = [];
  for (let x = -120; x < 1240; x += 70 + r() * 70) far.push({ x, w: 60 + r() * 80, h: 260 + r() * 420 });
  for (let x = -100; x < 1240; x += 110 + r() * 90) near.push({ x, w: 100 + r() * 110, h: 180 + r() * 360, win: r() });
  return { far, near }; })();
const Balcony: React.FC<{ night: number; sunR?: number; frost?: number; steam?: number }> = ({ night, sunR = 150, frost = 0, steam = 1 }) => {
  const t = useT();
  const dayTop = "#f7b267", dayBot = "#ffe3b0", nTop = "#070c22", nBot = "#1d2a55";
  const mix = (a: string, b: string) => { const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], night))).join(",")})`; };
  const ground = 1250;
  return (<>
    <AbsoluteFill style={{ background: `linear-gradient(${mix(dayTop, nTop)}, ${mix(dayBot, nBot)})` }} />
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {night > 0.5 ? <g opacity={night}><Stars /></g> : null}
      {night < 1 ? <g opacity={1 - night}><Sun x={760} y={520} r={sunR} /></g> : null}
      {CITY.far.map((b, i) => <rect key={i} x={b.x} y={ground - b.h - 80} width={b.w} height={b.h + 80} fill={night > 0.5 ? "#18204a" : "#e3a17a"} opacity={0.85} />)}
      {CITY.near.map((b, i) => (<g key={i}>
        <rect x={b.x} y={ground - b.h} width={b.w} height={b.h} fill={night > 0.5 ? "#0f1533" : "#b7684f"} />
        {Array.from({ length: Math.floor(b.h / 60) }, (_, k) => [0, 1].map((c) => (
          <rect key={k + "_" + c} x={b.x + 16 + c * (b.w / 2)} y={ground - b.h + 24 + k * 60} width={b.w / 2 - 30} height={30} rx={3}
            fill={night > 0.5 ? ((k + c + i) % 3 ? "#ffcf6a" : "#26305e") : "#f5d0a8"} opacity={night > 0.5 ? 0.95 : 0.55} />)))}
      </g>))}
      {/* перила балкона */}
      <rect x={0} y={1180} width={W} height={26} rx={6} fill={night > 0.5 ? "#2b3150" : "#6a3b2c"} />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={20 + i * 92} y={1206} width={16} height={330} fill={night > 0.5 ? "#232843" : "#5a3125"} />)}
      <rect x={0} y={1520} width={W} height={400} fill={night > 0.5 ? "#2a2f4a" : "#c98e6a"} />
      <rect x={0} y={1520} width={W} height={16} fill={night > 0.5 ? "#3a4166" : "#e2a983"} />
      {/* столик и кружка */}
      <rect x={560} y={1560} width={560} height={40} rx={12} fill={night > 0.5 ? "#47506f" : "#f2e2c8"} />
      <g transform="translate(760,1395)">
        <path d="M150,40 q70,0 70,55 t-70,55" fill="none" stroke={night > 0.5 ? "#c7d2ea" : "#ffffff"} strokeWidth={22} />
        <rect x={0} y={0} width={170} height={170} rx={26} fill={night > 0.5 ? "#c7d2ea" : "#ffffff"} />
        <rect x={0} y={60} width={170} height={36} fill="#d6262b" />
        <ellipse cx={85} cy={8} rx={78} ry={14} fill="#6b3a1f" opacity={1 - frost} />
        <ellipse cx={85} cy={8} rx={78} ry={14} fill="#dff3ff" opacity={frost} />
        {steam > 0 ? [0, 1, 2].map((i) => <path key={i} d={`M${45 + i * 40},-10 q-22,-50 0,-90 t0,-90`} fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round"
          opacity={steam * (0.35 + 0.25 * Math.sin(t * 3 + i))} transform={`translate(${Math.sin(t * 2 + i) * 8},${-((t * 40 + i * 30) % 40)})`} />) : null}
        {frost > 0 ? <path d="M10,0 l20,30 l15,-25 l20,35 l15,-30 l25,32 l20,-28 l30,30 l15,-44" fill="none" stroke="#e8f6ff" strokeWidth={6} opacity={frost} /> : null}
      </g>
    </svg>
  </>);
};

// ===================================================================== КУХНЯ: весы, арбуз → вишня, Земля → вишня
const Melon: React.FC<{ r: number; k: number }> = ({ r, k }) => {   // k: 0 арбуз → 1 вишня
  const c = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(",")})`;
  return (<g>
    <circle r={r} fill={c([47, 125, 58], [192, 24, 42])} />
    {k < 0.7 ? [-0.55, -0.2, 0.15, 0.5].map((x, i) => <path key={i} d={`M${x * r},${-r * 0.95} q${r * 0.25},${r * 0.95} 0,${r * 1.9}`} fill="none" stroke="#1f5a2a" strokeWidth={r * 0.12} opacity={1 - k / 0.7} />) : null}
    <ellipse cx={-r * 0.35} cy={-r * 0.4} rx={r * 0.25} ry={r * 0.15} fill="#fff" opacity={0.35} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.4})`} />
    {k > 0.8 ? <path d={`M0,${-r} q${r * 0.4},${-r * 1.2} ${r * 1.1},${-r * 1.6}`} fill="none" stroke="#3f8a4b" strokeWidth={r * 0.12} strokeLinecap="round" /> : null}
  </g>);
};
const Kitchen: React.FC<{ globe?: boolean }> = ({ globe = false }) => {
  const t = useT();
  const k = globe ? 1 : ez(t, 23.6, 24.6, Easing.inOut(Easing.back(1.4)));
  const g = globe ? ez(t, 38.2, 39.7, Easing.inOut(Easing.cubic)) : 0;
  const pull = !globe && t > 26.6 ? ez(t, 26.6, 27.0) : 0;
  const plateY = 1180;
  return (<>
    <AbsoluteFill style={{ background: "linear-gradient(#d99a5e, #b9773f 70%)" }} />
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {/* плитка-фартук и полка */}
      {Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, c) =>
        <rect key={r + "_" + c} x={c * 160 + (r % 2) * 80 - 80} y={620 + r * 90} width={150} height={80} rx={6} fill="#e8b47a" opacity={0.55} />))}
      <rect x={0} y={1290} width={W} height={630} fill="#6b3f22" />
      <rect x={0} y={1290} width={W} height={28} fill="#8a5432" />
      <rect x={60} y={300} width={420} height={22} rx={6} fill="#6b3f22" />
      <rect x={90} y={200} width={70} height={100} rx={10} fill="#efe6d2" /><rect x={180} y={230} width={60} height={70} rx={10} fill="#d6262b" />
      <rect x={260} y={170} width={56} height={130} rx={12} fill="#3f8a4b" />
      {/* весы */}
      <rect x={260} y={1190} width={560} height={110} rx={28} fill="#c9ccd1" />
      <rect x={260} y={1190} width={560} height={26} rx={12} fill="#e4e7ea" />
      <rect x={330} y={plateY - 18} width={420} height={22} rx={10} fill="#eef0f2" />
      <rect x={420} y={1228} width={240} height={58} rx={10} fill="#141a20" />
      <text x={540} y={1272} textAnchor="middle" fontFamily={fontFamily} fontWeight={700} fontSize={44} fill="#47f0d8">{globe ? "6·10²⁴ кг" : "10,0 кг"}</text>
      {!globe ? <RedCircle cx={540} cy={1257} rx={170} ry={70} at={25.8} /> : null}
      {/* арбуз → вишня */}
      {!globe ? (<g transform={`translate(540,${plateY - 18 - lerp(170, 26, k)})`}>
        {pull > 0 ? [0, 1, 2].map((i) => <circle key={i} r={lerp(60, 200, ((t * 0.8 + i / 3) % 1))} fill="none" stroke="#fff" strokeWidth={4}
          opacity={pull * (1 - ((t * 0.8 + i / 3) % 1)) * 0.7} />) : null}
        <Melon r={lerp(170, 26, k)} k={k} />
      </g>) : (<>
        <g transform={`translate(330,${plateY - 18 - 26})`}><Melon r={26} k={1} /></g>
        <g transform={`translate(${lerp(600, 470, g)},${plateY - 18 - lerp(170, 24, g)})`}><Earth x={0} y={0} r={lerp(170, 24, g)} /></g>
      </>)}
    </svg>
    {globe && t > 39.7 ? <Note at={39.7} /> : null}
  </>);
};
// листок-заявка как в примере
const Note: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 12, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", left: 250, top: 260, width: 600, padding: "60px 50px", background: "#f1e6c6", fontFamily, color: "#1b1d22",
      boxShadow: "0 24px 50px rgba(0,0,0,0.35)", transform: `rotate(${lerp(-12, 3, s)}deg) scale(${s})` }}>
      <div style={{ position: "absolute", left: 230, top: -18, width: 140, height: 40, background: "rgba(180,200,170,0.85)" }} />
      <div style={{ fontSize: 40, fontWeight: 700, borderBottom: "4px solid #1b1d22", paddingBottom: 14 }}>ЗЕМЛЯ — ЧЁРНАЯ ДЫРА</div>
      <div style={{ fontSize: 34, fontWeight: 600, marginTop: 26, color: "#4a4d55" }}>Нужный радиус:</div>
      <div style={{ fontSize: 92, fontWeight: 900 }}>≈ 9 мм</div>
      <div style={{ fontSize: 30, fontWeight: 600, color: "#6a6d75" }}>Как вишня</div>
    </div>
  );
};

// ===================================================================== ПЛАНШЕТ: от чего зависит притяжение
const Clipboard: React.FC = () => {
  const t = useT();
  const row = (y: number, name: string, at: number, ok: number) => {
    const a = ez(t, at, at + 0.3), b = ez(t, ok, ok + 0.3);
    return (<g opacity={a} transform={`translate(${(1 - a) * 30},0)`}>
      <text x={230} y={y} fontFamily={fontFamily} fontWeight={700} fontSize={48} fill="#1b1d22">{name}</text>
      <line x1={230} y1={y + 26} x2={850} y2={y + 26} stroke="#9a9ca3" strokeWidth={3} />
      <g opacity={b} transform={`translate(0,${(1 - b) * -20})`}>
        <text x={850} y={y} textAnchor="end" fontFamily={fontFamily} fontWeight={700} fontSize={44} fill="#2f6fd6">{name === "МАССА" ? "та же ✓" : "то же ✓"}</text>
      </g>
    </g>);
  };
  return (<>
    <AbsoluteFill style={{ background: "linear-gradient(#c88a52, #9c6332)" }} />
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <rect x={130} y={330} width={820} height={1060} rx={26} fill="#5a3a22" />
      <rect x={170} y={380} width={740} height={970} fill="#f7f1e2" />
      <rect x={420} y={300} width={240} height={90} rx={18} fill="#8d939b" />
      <text x={540} y={500} textAnchor="middle" fontFamily={fontFamily} fontWeight={700} fontSize={46} fill="#1b1d22">ПРИТЯЖЕНИЕ</text>
      <text x={540} y={560} textAnchor="middle" fontFamily={fontFamily} fontWeight={600} fontSize={32} fill="#5a5d65" letterSpacing={3}>ЗАВИСИТ ОТ</text>
      {row(720, "МАССА", 29.2, 30.6)}
      {row(860, "РАССТОЯНИЕ", 29.6, 31.4)}
      <g opacity={ez(t, 32.7, 33.0)}>
        <text x={230} y={1080} fontFamily={fontFamily} fontWeight={600} fontSize={36} fill="#5a5d65">ЗНАЧИТ, ОРБИТА:</text>
        <text x={540} y={1210} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={96} fill="#1b1d22">ТА ЖЕ</text>
      </g>
      <RedCircle cx={540} cy={1180} rx={250} ry={95} at={33.0} />
    </svg>
  </>);
};

// ===================================================================== ХОЛОД и СВИТЕР
const Thermo: React.FC = () => {
  const t = useT(); const lvl = lerp(0.62, 0.06, ez(t, 43.0, 44.8));
  return (<svg width={W} height={H} style={{ position: "absolute" }}>
    <g transform="translate(120,300)">
      <rect x={0} y={0} width={150} height={700} rx={75} fill="#e9eef5" opacity={0.95} />
      <rect x={55} y={60} width={40} height={520} rx={20} fill="#c7d2ea" />
      <rect x={55} y={60 + 520 * (1 - lvl)} width={40} height={520 * lvl} rx={20} fill="#d6262b" />
      <circle cx={75} cy={610} r={52} fill="#d6262b" />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={100} y={80 + i * 58} width={i % 2 ? 18 : 30} height={5} fill="#7a8090" />)}
    </g>
  </svg>);
};
const Sweater: React.FC = () => {
  const t = useT(); const s = ez(t, 45.0, 45.5, Easing.out(Easing.back(1.6)));
  return (<>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #2b3866, #0d1330 75%)" }} />
    <Snow n={60} />
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <g transform={`translate(540,${lerp(-500, 820, s)}) rotate(${Math.sin(t * 2.2) * 3 * s})`}>
        <path d="M-150,-300 q150,-90 300,0" fill="none" stroke="#c9ccd1" strokeWidth={14} />
        <path d="M0,-390 v-40 a30,30 0 1 1 30,-30" fill="none" stroke="#c9ccd1" strokeWidth={12} />
        <path d="M-130,-300 l-200,120 l60,170 l90,-50 v420 h360 v-420 l90,50 l60,-170 l-200,-120 q-130,90 -260,0z" fill="#c0392b" />
        <path d="M-130,-300 q130,90 260,0" fill="none" stroke="#962c20" strokeWidth={26} />
        {[-60, 60, 180].map((y, i) => <g key={i}>
          <rect x={-180} y={y} width={360} height={30} fill="#efe6d2" />
          {Array.from({ length: 9 }, (_, k) => <path key={k} d={`M${-170 + k * 40},${y + 50} l20,-14 l20,14 l-20,14z`} fill="#efe6d2" opacity={i === 1 ? 1 : 0} />)}
        </g>)}
        <rect x={-180} y={330} width={360} height={30} fill="#962c20" />
      </g>
    </svg>
  </>);
};

// ===================================================================== СЦЕНЫ (склейки по словам)
type Scene = { t0: number; t1: number; cam: [number, number, number, number][]; el: React.ReactNode; panels?: React.ReactNode };
const Countdown: React.FC = () => { const t = useT(); const left = Math.round(500 * (1 - ez(t, 12.2, 15.9, (x) => x)));
  return <Panel x={60} y={150} label="СВЕТ В ПУТИ" value={`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`} at={12.0} color="#ffc94a" w={520} />; };
const SunSize: React.FC = () => { const t = useT(); const k = ez(t, 7.7, 9.3, (x) => x);
  const v = Math.round(Math.exp(lerp(Math.log(1392000), Math.log(6), k)));
  return <Panel x={60} y={150} label="ДИАМЕТР СОЛНЦА" value={`${v.toLocaleString("ru-RU")} км`} at={7.5} color={k >= 1 ? "#ff5a5a" : "#ffc94a"} w={700} />; };

const SCENES: Scene[] = [
  { t0: 0, t1: 5.1, cam: [[0, 1.12, 0, -40], [2.3, 1.2, 0, 0], [2.6, 1.32, 0, 0], [5.1, 1.0, 0, 30]], el: <Space mode="hook" />,
    panels: <Panel x={60} y={150} label="ОРБИТА ЗЕМЛИ" value="БЕЗ ИЗМЕНЕНИЙ" at={4.0} color="#47f0d8" w={760} /> },
  { t0: 5.1, t1: 11.8, cam: [[5.1, 1.35, 120, 560], [6.6, 1.15, 40, 240], [7.3, 1.05, 60, -180], [10.1, 1.08, 40, -160], [11.8, 1.3, 120, 480]],
    el: <Balcony night={0} />, panels: <SunSize /> },
  { t0: 11.8, t1: 15.7, cam: [[11.8, 1.05, -40, 0], [15.7, 1.12, 60, 0]], el: <Space mode="light" />, panels: <Countdown /> },
  { t0: 15.7, t1: 18.3, cam: [[15.7, 1.05, 40, -120], [16.6, 1.08, 40, -110], [18.3, 1.14, 40, -60]], el: <BalconyClick />,
    panels: <Panel x={60} y={150} label="СВЕТ В ПУТИ" value="0:00" at={15.7} color="#ff5a5a" w={520} /> },
  { t0: 18.3, t1: 21.1, cam: [[18.3, 1.0, 0, 0], [20.4, 1.08, 0, 0], [21.1, 1.12, 0, 0]], el: <Space mode="orbit" />,
    panels: <Panel x={60} y={150} label="ОРБИТА ЗЕМЛИ" value="ТА ЖЕ" at={19.6} color="#47f0d8" w={520} /> },
  { t0: 21.1, t1: 23.1, cam: [[21.1, 1.0, 0, 0], [23.1, 1.18, 0, 0]], el: <Space mode="suck" /> },
  { t0: 23.1, t1: 28.0, cam: [[23.1, 1.15, 0, 120], [25.0, 1.05, 0, 80], [28.0, 1.1, 0, 120]], el: <Kitchen /> },
  { t0: 28.0, t1: 34.0, cam: [[28.0, 1.0, 0, -40], [34.0, 1.08, 0, 40]], el: <Clipboard /> },
  { t0: 34.0, t1: 35.9, cam: [[34.0, 1.0, 0, 0], [35.3, 1.05, 0, -40], [35.9, 1.35, 0, -60]], el: <Space mode="near" />,
    panels: <><Panel x={60} y={150} label="ОПАСНАЯ ЗОНА" value="≈ 3 км" at={34.2} color="#ff5a5a" w={520} />
      <Panel x={60} y={360} label="ДО ЗЕМЛИ" value="150 млн км" at={34.9} color="#4fb3ff" w={680} /></> },
  { t0: 35.9, t1: 40.2, cam: [[35.9, 1.05, 0, 40], [39.5, 1.1, 0, 0], [40.2, 1.1, 0, -60]], el: <Kitchen globe /> },
  { t0: 40.2, t1: 45.0, cam: [[40.2, 1.06, -20, -40], [42.4, 1.1, -40, 60], [45.0, 1.15, -60, 160]],
    el: <ColdBalcony />,
    panels: <Panel x={340} y={150} label="ТЕМПЕРАТУРА" value="ПАДАЕТ" at={43.2} color="#4fb3ff" w={620} /> },
  { t0: 45.0, t1: plan.total / FPS, cam: [[45.0, 1.0, 0, 0], [47, 1.08, 0, -30]], el: <Sweater /> },
];
function ColdBalcony() { const t = useT();
  return <><Balcony night={1} frost={ez(t, 43.0, 44.5)} steam={0} /><Snow /><Thermo /></>; }
function BalconyClick() { const t = useT(); const n = t >= 16.6 ? 1 : 0;
  return <><Balcony night={n} steam={1} /><AbsoluteFill style={{ background: "#000", opacity: t >= 16.6 ? 0.5 * Math.exp(-(t - 16.6) * 1.5) : 0 }} /></>; }

// ===================================================================== субтитры: 2 строки, слова «заливаются» по мере произнесения
type Wd = { text: string; start: number; end: number };
const WORDS: Wd[] = plan.groups.flatMap((g) => g.words);
const LINES: Wd[][] = (() => {   // группы до ~22 символов, разрыв на точке/вопросе/восклицании
  const out: Wd[][] = []; let cur: Wd[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const len = cur.reduce((s, x) => s + x.text.length + 1, 0);
    const next = WORDS[i + 1];
    if (/[.,!?…:]$/.test(w.text) || len > 17 || cur.length >= 3 || !next || (next.start - w.start > 24)) { out.push(cur); cur = []; }
  });
  return out;
})();
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const g = LINES.find((l, i) => f >= l[0].start - 2 && f < (LINES[i + 1]?.[0].start ?? l[l.length - 1].end + 20) - 2);
  if (!g) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 520 }}>
      <div style={{ fontFamily, fontWeight: 900, fontSize: 86, lineHeight: 1.08, textAlign: "center", maxWidth: 860, textTransform: "uppercase" }}>
        {g.map((w, i) => {
          const on = f >= w.start;
          const pop = on ? 1 + 0.12 * Math.exp(-(f - w.start) / 3) : 1;
          return <span key={i} style={{ display: "inline-block", margin: "0 12px", color: on ? "#fff" : "rgba(200,206,214,0.55)", transform: `scale(${pop})`,
            WebkitTextStroke: on ? "14px #000" : "14px rgba(0,0,0,0.25)", paintOrder: "stroke fill", textShadow: on ? "0 6px 0 rgba(0,0,0,0.5)" : "none" }}>{w.text}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Flat: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const f = useCurrentFrame();   // сцены без Sequence: время везде абсолютное (секунды голоса)
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {SCENES.filter((s) => f >= Math.round(s.t0 * FPS) && f < Math.round(s.t1 * FPS)).map((s) => <Shot key={s.t0} s={s} />)}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, transparent 60%, rgba(0,0,0,0.45) 100%)" }} />
      <Captions />
      <Audio src={staticFile(plan.voice)} />
      <Audio src={staticFile("music.wav")} loop
        volume={(f) => interpolate(f, [0, 20, durationInFrames - 45, durationInFrames], [0, 0.11, 0.11, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};
const Shot: React.FC<{ s: Scene }> = ({ s }) => (
  <AbsoluteFill><Cam t0={s.t0} keys={s.cam}>{s.el}</Cam>{s.panels}</AbsoluteFill>
);
