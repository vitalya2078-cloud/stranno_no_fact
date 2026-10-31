// ОФОРМЛЕНИЕ ГРУППЫ ВК «А что если…»: аватар 1500×1500, обложка 1920×768, живая обложка 1080×1920 (10 с, петля).
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { A, D, Defs, G, Mode, ez, makeIso } from "./brand";

const useT = () => useCurrentFrame() / 30;
const Grain: React.FC<{ w: number; h: number; o?: number }> = ({ w, h, o = 0.14 }) => (
  <svg width={w} height={h} style={{ position: "absolute", opacity: o, mixBlendMode: "multiply" }}>
    <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={3} /></filter><rect width={w} height={h} filter="url(#gr)" /></svg>);

// мини-диорама: комната с роутером, котом и кольцами (D) или неоновый квартал (A); t — время для анимации
const Diorama: React.FC<{ S: number; cx: number; cy: number; mode: Mode; t: number; id: string }> = ({ S, cx, cy, mode, t, id }) => {
  const I = makeIso(S, cx, cy); const { iso, Cube } = I; const P = mode === "D" ? D : A;
  const rings = (x: number, y: number, z: number, col: string, max = 8, n = 5) => (<g clipPath={`url(#c${id})`} filter="url(#glow)">
    {Array.from({ length: n }, (_, k) => { const r = ((k * (max / n) + t * 1.4) % max) + 0.5; const d = I.ring(x, y, z, r);
      return <g key={k}>{mode === "D" ? <path d={d} fill="none" stroke="#b5700f" strokeWidth={S * 0.14} opacity={0.4 * (1 - 0.3 * r / max)} /> : null}
        <path d={d} fill="none" stroke={col} strokeWidth={S * 0.09} opacity={0.95 * (1 - 0.3 * r / max)} /></g>; })}</g>);
  if (mode === "A") return (<g>
    <defs><clipPath id={`c${id}`}><polygon points={I.pts([[-1, 11, 0], [-1, 11, 9], [-1, -1, 9], [11, -1, 9], [11, -1, 0], [11, 11, 0]])} /></clipPath></defs>
    <polygon points={I.pts([[-1, -1, 0], [11, -1, 0], [11, 11, 0], [-1, 11, 0]])} fill="#0b1030" />
    {[[0, 0, 3], [3, 0, 5], [6, 0, 2.4], [0, 3, 4], [6, 3, 4.6], [0, 6, 2], [3, 6, 3.2], [6, 6, 2.6]].map(([x, y, h], i) => (<g key={i}>
      <Cube x={x} y={y} z={0} w={2.2} d={2.2} h={h} top="#1f2858" l="#151c45" r="#10163a" edge={A.edge} />
      {Array.from({ length: Math.floor(h / 0.8) }, (_, k) => <polygon key={k} points={I.pts([[x + 0.4, y + 2.2, 0.4 + k * 0.8], [x + 0.9, y + 2.2, 0.4 + k * 0.8], [x + 0.9, y + 2.2, 0.75 + k * 0.8], [x + 0.4, y + 2.2, 0.75 + k * 0.8]])} fill={(i + k) % 3 ? A.window : "#22305c"} />)}
    </g>))}
    {rings(4.1, 4.1, 1.2, A.glow, 7, 4)}{rings(1.1, 7.1, 2.4, A.glow2, 5, 3)}
  </g>);
  const [catX, catY] = iso(1.2, 4.6, 2.92);
  return (<g>
    <defs><clipPath id={`c${id}`}><polygon points={I.roomClip} /></clipPath></defs>
    <I.Room mode="D" />
    <g filter="url(#pD)"><polygon points={I.pts([[5.6, 0, 2.6], [9, 0, 2.6], [9, 0, 5.8], [5.6, 0, 5.8]])} fill={D.teal} /></g>
    <polygon points={I.pts([[5.8, 0, 2.8], [8.8, 0, 2.8], [8.8, 0, 5.6], [5.8, 0, 5.6]])} fill={D.tealDD} />
    {Array.from({ length: 8 }, (_, i) => { const x = 6.1 + (i % 4) * 0.7, z = 3.2 + Math.floor(i / 4) * 0.9;
      return <polygon key={i} points={I.pts([[x, 0, z], [x + 0.25, 0, z], [x + 0.25, 0, z + 0.3], [x, 0, z + 0.3]])} fill={i % 3 ? D.mustard : "#22525c"} />; })}
    <g filter="url(#pD)"><polygon points={I.pts([[3, 3.5, 0.02], [8, 3.5, 0.02], [8, 8.5, 0.02], [3, 8.5, 0.02]])} fill={D.coral} /></g>
    <Cube x={5.2} y={0.2} z={0} w={4.4} d={3.2} h={1.1} top={D.teal} l={D.tealD} r={D.tealDD} shadow />
    <Cube x={5.4} y={0.4} z={1.1} w={4.0} d={2.8} h={0.35} top={D.cream} l="#e6dccb" r="#d6cbb8" shadow />
    <Cube x={0.2} y={3.6} z={0} w={1.8} d={2.4} h={2.6} top={D.mustard} l={D.mustD} r="#c4861a" shadow />
    <Cube x={0.6} y={3.9} z={2.6} w={1.2} d={1.4} h={0.32} top={D.ink} l="#152028" r="#0f171d" shadow />
    <g transform={`translate(${catX},${catY - S * 0.5}) scale(${S / 58})`} filter="url(#pD)">
      <ellipse cx={0} cy={6} rx={80} ry={42} fill={D.coralD} /><ellipse cx={-6} cy={-6} rx={64} ry={31} fill={D.coral} />
      <circle cx={58} cy={-20} r={31} fill={D.coral} /><path d="M40,-46 l7,-26 l15,20z M70,-48 l13,-22 l5,26z" fill={D.coral} />
      <path d="M47,-20 q7,6 15,0 M67,-22 q7,6 15,0" fill="none" stroke={D.ink} strokeWidth={4} strokeLinecap="round" />
      <path d="M-78,18 q-36,12 -27,54 q5,18 23,11" fill="none" stroke={D.coralD} strokeWidth={18} strokeLinecap="round" />
    </g>
    {rings(1.2, 4.6, 3.0, D.glow, 9, 5)}
  </g>);
};

// ===================================================================== АВАТАР 1500×1500 (ВК показывает кругом — всё важное внутри круга)
export const Avatar: React.FC = () => (
  <AbsoluteFill style={{ background: D.bg }}>
    <svg width={1500} height={1500} style={{ position: "absolute" }}><Defs />
      <circle cx={750} cy={750} r={600} fill={D.mustard} opacity={0.12} filter="url(#soft)" />
      <Diorama S={70} cx={770} cy={700} mode="D" t={1.3} id="av" />
    </svg>
    {/* фирменный знак: «?!» на бумажной бирке */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center" }}>
      <div style={{ background: D.mustard, color: D.ink, fontFamily: G, fontWeight: 800, fontSize: 150, lineHeight: 1, padding: "18px 60px 26px",
        transform: "rotate(-3deg)", boxShadow: "-10px 18px 0 rgba(0,0,0,0.28)" }}>что если?</div>
    </div>
    <Grain w={1500} h={1500} />
  </AbsoluteFill>
);

// ===================================================================== ОБЛОЖКА 1920×768 (безопасная зона по центру ~1280×350)
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #235a63 0%, #173f48 55%, #0d2a31 100%)" }}>
    <svg width={1920} height={768} style={{ position: "absolute" }}><Defs />
      <Diorama S={26} cx={235} cy={360} mode="D" t={2.1} id="cl" />
      <Diorama S={24} cx={1740} cy={390} mode="A" t={1.0} id="cr" />
    </svg>
    <div style={{ position: "absolute", left: 0, right: 0, top: 205, textAlign: "center", fontFamily: G }}>
      <div style={{ display: "inline-block", background: D.mustard, color: D.ink, fontWeight: 800, fontSize: 34, letterSpacing: 7, padding: "12px 26px",
        transform: "rotate(-2deg)", boxShadow: "-6px 10px 0 rgba(0,0,0,0.25)" }}>А ЧТО ЕСЛИ…</div>
      <div style={{ color: D.cream, fontWeight: 800, fontSize: 92, lineHeight: 1.0, marginTop: 26 }}>Безумные вопросы.</div>
      <div style={{ color: D.mustard, fontWeight: 800, fontSize: 92, lineHeight: 1.0, marginTop: 6 }}>Честные ответы.</div>
      <div style={{ color: "rgba(247,239,224,0.75)", fontWeight: 500, fontSize: 30, marginTop: 22 }}>Короткие ролики о мире, который мог бы быть другим</div>
    </div>
    <Grain w={1920} h={768} />
  </AbsoluteFill>
);

// ===================================================================== ЖИВАЯ ОБЛОЖКА 1080×1920, 10 с, петля
const QS = ["Wi-Fi было бы видно?", "Солнце стало чёрной дырой?", "мир работал бы иначе?"];
export const LiveCover: React.FC = () => {
  const t = useT(); const f = useCurrentFrame();
  const qi = Math.floor(t / (10 / 3)) % 3, qt = t % (10 / 3);
  const k = ez(qt, 0, 0.4, Easing.out(Easing.back(1.4))) * (1 - ez(qt, 3.0, 3.3));
  const night = qi === 1;
  return (
    <AbsoluteFill style={{ background: night ? A.bg : D.bg }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}><Defs />
        <g transform={`translate(0,${Math.sin(t * 0.63) * 12})`}>
          <Diorama S={62} cx={560} cy={1060} mode={night ? "A" : "D"} t={t} id="lc" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 80, top: 260, fontFamily: G }}>
        <div style={{ display: "inline-block", background: D.mustard, color: D.ink, fontWeight: 800, fontSize: 34, letterSpacing: 7, padding: "14px 28px",
          transform: "rotate(-2deg)", boxShadow: "-6px 10px 0 rgba(0,0,0,0.25)" }}>А ЧТО ЕСЛИ…</div>
        <div style={{ color: night ? "#fff" : D.cream, fontWeight: 800, fontSize: 88, lineHeight: 1.02, width: 920, marginTop: 28,
          opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>…{QS[qi]}</div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: night ? 0.09 : 0.14, mixBlendMode: (night ? "overlay" : "multiply") as any }}>
        <filter id="gl"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 24} /></filter><rect width={1080} height={1920} filter="url(#gl)" /></svg>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, transparent 60%, rgba(0,0,0,0.4) 100%)" }} />
    </AbsoluteFill>
  );
};
