// ФИРМЕННЫЙ НАБОР рубрики «А что если…»: шрифты, палитры D (бумажная диорама) и A (неон), изометрия,
// блоки-предметы, кольца, камера, бирка, плашки, субтитры, зерно. Время везде — секунды ГОЛОСА.
import React from "react";
import { AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as geo } from "@remotion/google-fonts/Geologica";
import { loadFont as unb } from "@remotion/google-fonts/Unbounded";
import { loadFont as man } from "@remotion/google-fonts/Manrope";

export const G = geo("normal", { weights: ["500", "800"], subsets: ["cyrillic", "latin"] }).fontFamily;   // D: всё
export const U = unb("normal", { weights: ["500", "800"], subsets: ["cyrillic", "latin"] }).fontFamily;   // A: заголовки, субтитры
export const M = man("normal", { weights: ["600", "800"], subsets: ["cyrillic", "latin"] }).fontFamily;   // A: бирка, подписи
export const FPS = 30, W = 1080, H = 1920;
export const useT = () => useCurrentFrame() / FPS;
export const ez = (t: number, a: number, b: number, f = Easing.inOut(Easing.cubic)) => (t <= a ? 0 : t >= b ? 1 : f((t - a) / (b - a)));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ------------------------------------------------------------------ палитры
export const D = { bg: "radial-gradient(circle at 50% 45%, #235a63 0%, #173f48 50%, #0d2a31 100%)",
  wallL: "#efe2c8", wallR: "#e3d2b2", floor: "#d8c3a0", cream: "#f7efe0", teal: "#2a7f8a", tealD: "#1f6670", tealDD: "#185158",
  coral: "#ff7a59", coralD: "#e2603f", mustard: "#f2b134", mustD: "#d99a22", rose: "#e85d75", ink: "#1d2a33", leaf: "#2f8a5a", leaf2: "#3d9a6a",
  edge: "rgba(29,42,51,0.18)", glow: "#f2b134", glow2: "#e85d75" };
export const A = { bg: "radial-gradient(circle at 50% 42%, #18204a 0%, #0a0e22 48%, #04060f 100%)",
  wallL: "#1a2250", wallR: "#141b42", floor: "#0e1330", edge: "rgba(140,170,255,0.25)", rim: "#3a4a9a", obj: "#2b356f", objL: "#20285a", objR: "#1a2150",
  glow: "#3cf2ff", glow2: "#ff3fa4", window: "#ffcf6a", leaf: "#2fd39a", warm: "#ff9a3c", text: "#ffffff" };
export type Mode = "D" | "A";

// ------------------------------------------------------------------ фильтры (вставить один раз в каждый <svg> сцены)
export const Defs: React.FC = () => (
  <defs>
    <filter id="pD" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="-6" dy="12" stdDeviation="8" floodColor="#0b1a1f" floodOpacity="0.35" /></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="28" /></filter>
  </defs>
);

// ------------------------------------------------------------------ изометрия: makeIso(масштаб, центрX, центрY)
export type V3 = [number, number, number];
export const makeIso = (S = 62, CX = 580, CY = 820) => {
  const iso = (x: number, y: number, z: number): [number, number] => [CX + (x - y) * 0.866 * S, CY + (x + y) * 0.5 * S - z * S];
  const pts = (p: V3[]) => p.map((q) => iso(...q).join(",")).join(" ");
  // горизонтальное кольцо радиуса r вокруг (cx, cy) на высоте z
  const ring = (cx: number, cy: number, z: number, r: number) => { const a: string[] = [];
    for (let i = 0; i <= 64; i++) { const t = (i / 64) * Math.PI * 2; a.push(iso(cx + Math.cos(t) * r, cy + Math.sin(t) * r, z).join(",")); }
    return "M" + a.join(" L"); };
  // блок-предмет: x,y,z — угол, w,d,h — размеры; top/l/r — цвета граней
  const Cube: React.FC<{ x: number; y: number; z: number; w: number; d: number; h: number; top: string; l: string; r: string; edge?: string; shadow?: boolean }> =
    ({ x, y, z, w, d, h, top, l, r, edge = D.edge, shadow = false }) => (<g strokeLinejoin="round" filter={shadow ? "url(#pD)" : undefined}>
      <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={l} stroke={edge} strokeWidth={1.5} />
      <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={r} stroke={edge} strokeWidth={1.5} />
      <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={top} stroke={edge} strokeWidth={1.5} />
    </g>);
  // комната в разрезе 10×10×7: пол + левая (x=0) и правая (y=0) стены; в D — со срезами бумаги сверху
  const Room: React.FC<{ mode: Mode; wallL?: string; wallR?: string; floor?: string }> = ({ mode, wallL, wallR, floor }) => {
    const P = mode === "D" ? D : A;
    return (<g filter={mode === "D" ? "url(#pD)" : undefined}>
      <polygon points={pts([[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0]])} fill={floor ?? P.floor} />
      <polygon points={pts([[0, 0, 0], [0, 10, 0], [0, 10, 7], [0, 0, 7]])} fill={wallL ?? P.wallL} />
      <polygon points={pts([[0, 0, 0], [10, 0, 0], [10, 0, 7], [0, 0, 7]])} fill={wallR ?? P.wallR} />
      {mode === "D" ? (<>
        <polygon points={pts([[-0.35, -0.35, 7], [10, -0.35, 7], [10, 0, 7], [0, 0, 7], [0, 10, 7], [-0.35, 10, 7]])} fill={D.cream} stroke={D.edge} strokeWidth={2} />
        <polygon points={pts([[10, -0.35, 0], [10, 0, 0], [10, 0, 7], [10, -0.35, 7]])} fill={D.mustD} />
        <polygon points={pts([[-0.35, 10, 0], [0, 10, 0], [0, 10, 7], [-0.35, 10, 7]])} fill={D.mustD} />
      </>) : <polyline points={pts([[0, 10, 7], [0, 0, 7], [10, 0, 7]])} fill="none" stroke={A.rim} strokeWidth={3} />}
    </g>);
  };
  const roomClip = pts([[0, 0, 0], [10, 0, 0], [10, 0, 7], [0, 0, 7], [0, 10, 7], [0, 10, 0], [10, 10, 0]]);
  return { iso, pts, ring, Cube, Room, roomClip };
};

// живые кольца сигнала/звука/тепла вокруг точки (cx,cy) на нескольких высотах
export const Waves: React.FC<{ I: ReturnType<typeof makeIso>; cx: number; cy: number; z?: number[]; color: string; t: number; speed?: number; max?: number; n?: number; clip?: boolean; id?: string }> =
  ({ I, cx, cy, z = [3], color, t, speed = 1.5, max = 7.5, n = 6, clip = true, id = "w" }) => (<>
    {clip ? <defs><clipPath id={"clip" + id}><polygon points={I.roomClip} /></clipPath></defs> : null}
    <g clipPath={clip ? `url(#clip${id})` : undefined} filter="url(#glow)">
      {z.map((zz, zi) => Array.from({ length: n }, (_, k) => { const r = ((k * (max / n) + t * speed) % max) + 0.5;
        const main = zi === Math.floor(z.length / 2);
        return <path key={zi + "_" + k} d={I.ring(cx, cy, zz, r)} fill="none" stroke={color} strokeWidth={main ? 6 : 3} opacity={(main ? 0.95 : 0.45) * (1 - r / (max + 0.7))} />; }))}
    </g></>);

// ------------------------------------------------------------------ фон сцены, зерно, виньетка
export const Stage: React.FC<{ mode: Mode; children: React.ReactNode; top?: number }> = ({ mode, children, top = 70 }) => (
  <AbsoluteFill style={{ background: mode === "D" ? D.bg : A.bg }}>
    <svg width={W} height={H} style={{ position: "absolute", top }}><Defs />{children}</svg>
  </AbsoluteFill>
);
export const Finish: React.FC<{ mode: Mode }> = ({ mode }) => {
  const f = useCurrentFrame();
  return (<>
    <svg width={W} height={H} style={{ position: "absolute", opacity: mode === "D" ? 0.16 : 0.09, mixBlendMode: (mode === "D" ? "multiply" : "overlay") as any }}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 24} /></filter>
      <rect width={W} height={H} filter="url(#grain)" /></svg>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 58%, rgba(0,0,0,${mode === "D" ? 0.35 : 0.6}) 100%)` }} />
  </>);
};

// ------------------------------------------------------------------ камера: дрейф по ключам [сек, масштаб, x, y] + «посадка» после склейки
export const Cam: React.FC<{ t0: number; keys: [number, number, number, number][]; children: React.ReactNode }> = ({ t0, keys, children }) => {
  const t = useT();
  let [s, x, y] = [keys[0][1], keys[0][2], keys[0][3]];
  for (let i = 1; i < keys.length; i++) if (t >= keys[i - 1][0]) { const k = ez(t, keys[i - 1][0], keys[i][0]);
    s = lerp(keys[i - 1][1], keys[i][1], k); x = lerp(keys[i - 1][2], keys[i][2], k); y = lerp(keys[i - 1][3], keys[i][3], k); }
  const z = Math.max(1, s) * (1 + 0.06 * Math.exp(-(t - t0) * 7));
  const mx = (W * (z - 1)) / (2 * z), my = (H * (z - 1)) / (2 * z);                 // края кадра не открываются
  x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
  return <AbsoluteFill style={{ transform: `scale(${z}) translate(${-x}px, ${-y}px)` }}>{children}</AbsoluteFill>;
};

// ------------------------------------------------------------------ бирка рубрики + вопрос (первые секунды ролика)
export const Title: React.FC<{ mode: Mode; question: string; until?: number }> = ({ mode, question, until = 3.2 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 160 } }), out = 1 - ez(t, until, until + 0.4);
  if (out <= 0) return null;
  const tag = mode === "D"
    ? { background: D.mustard, color: D.ink, fontFamily: G, letterSpacing: 6, padding: "14px 26px", transform: "rotate(-2deg)", boxShadow: "0 8px 0 rgba(0,0,0,0.25)" }
    : { color: A.glow, fontFamily: M, letterSpacing: 10 };
  return (<div style={{ position: "absolute", left: 80, top: 140, opacity: s * out, transform: `translateY(${(1 - s) * -30}px)` }}>
    <div style={{ display: "inline-block", fontWeight: 800, fontSize: 30, ...tag }}>А ЧТО ЕСЛИ…</div>
    <div style={{ marginTop: 26, fontFamily: mode === "D" ? G : U, fontWeight: 800, fontSize: mode === "D" ? 92 : 84, lineHeight: 1.02, width: 920,
      color: mode === "D" ? D.cream : A.text }}>{question}</div>
  </div>);
};

// ------------------------------------------------------------------ плашка-факт: D — бумажная карточка, A — тёмная с неоновой полосой
export const Card: React.FC<{ mode: Mode; x: number; y: number; label: string; value: string; at: number; w?: number; accent?: string }> = ({ mode, x, y, label, value, at, w = 560, accent }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame: f - Math.round(at * fps), fps, config: { damping: 13, stiffness: 170 } });
  if (s <= 0.001) return null;
  const acc = accent ?? (mode === "D" ? D.rose : A.glow);
  return mode === "D" ? (
    <div style={{ position: "absolute", left: x, top: y, width: w, padding: "24px 30px", background: D.cream, color: D.ink, fontFamily: G,
      boxShadow: "-6px 14px 0 rgba(0,0,0,0.22)", transform: `rotate(${lerp(-8, -1.5, s)}deg) scale(${s})`, transformOrigin: "0 0" }}>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color: acc }}>{label}</div>
      <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{value}</div>
    </div>) : (
    <div style={{ position: "absolute", left: x, top: y, width: w, padding: "24px 32px 26px 46px", background: "rgba(10,14,30,0.86)", borderRadius: 18,
      boxShadow: "0 18px 40px rgba(0,0,0,0.45)", opacity: s, transform: `translateX(${(1 - s) * -60}px)`, fontFamily: M }}>
      <div style={{ position: "absolute", left: 16, top: 22, bottom: 22, width: 8, borderRadius: 4, background: acc, boxShadow: `0 0 18px ${acc}` }} />
      <div style={{ color: acc, fontSize: 28, fontWeight: 600, letterSpacing: 5 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 72, fontWeight: 800, fontFamily: U }}>{value}</div>
    </div>);
};

// ------------------------------------------------------------------ субтитры: 2 строки; сказанное — в полную силу, будущее — 30–35%
type Wd = { text: string; start: number; end: number };
export const lines = (groups: { words: Wd[] }[]) => {
  const W2 = groups.flatMap((g) => g.words); const out: Wd[][] = []; let cur: Wd[] = [];
  W2.forEach((w, i) => { cur.push(w); const len = cur.reduce((s, x) => s + x.text.length + 1, 0); const nx = W2[i + 1];
    if (/[.,!?…:]$/.test(w.text) || len > 22 || cur.length >= 4 || !nx || nx.start - w.start > 24) { out.push(cur); cur = []; } });
  return out;
};
// accentWords — слова (в нижнем регистре, без знаков), которые подсвечиваются акцентом
export const Captions: React.FC<{ L: Wd[][]; mode: (sec: number) => Mode; accentWords?: string[] }> = ({ L, mode, accentWords = [] }) => {
  const f = useCurrentFrame();
  const g = L.find((l, i) => f >= l[0].start - 2 && f < (L[i + 1]?.[0].start ?? l[l.length - 1].end + 20) - 2);
  if (!g) return null;
  const m = mode(f / FPS);
  const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]/gu, "");
  const word = (w: Wd, i: number) => {
    const on = f >= w.start, acc = on && accentWords.includes(norm(w.text));
    const pop = on ? 1 + 0.1 * Math.exp(-(f - w.start) / 3) : 1;
    if (m === "D") return <span key={i} style={{ display: "inline-block", margin: "0 8px", transform: `scale(${pop})`, opacity: on ? 1 : 0.3,
      background: acc ? D.rose : "transparent", color: acc ? D.cream : D.ink, padding: acc ? "0 12px" : 0 }}>{w.text}</span>;
    return <span key={i} style={{ display: "inline-block", margin: "0 10px", transform: `scale(${pop})`, color: acc ? A.glow2 : "#fff", opacity: on ? 1 : 0.35,
      textShadow: acc ? `0 0 24px ${A.glow2}` : "0 4px 0 rgba(0,0,0,0.5)", textTransform: "uppercase" }}>{w.text}</span>;
  };
  return m === "D" ? (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1480, padding: "24px 26px", background: D.cream, transform: "rotate(-1.2deg)",
      boxShadow: "0 14px 0 rgba(0,0,0,0.25)", textAlign: "center", fontFamily: G, fontWeight: 800, fontSize: 60, lineHeight: 1.18 }}>{g.map(word)}</div>
  ) : (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1440, textAlign: "center", fontFamily: U, fontWeight: 800, fontSize: 56, lineHeight: 1.22 }}>{g.map(word)}</div>
  );
};
