// ЭСКИЗ М2 «Приоткрытая дверь»: аватарка 1500×1500 и шапка 1920×768 (только бирка «А ЧТО ЕСЛИ…»).
// Бумажная дверь (стиль D) стоит сама по себе, из щели — неоновый мир (стиль A) и полоса света по полу.
import React from "react";
import { AbsoluteFill } from "remotion";
import { A, D, Defs, G, makeIso } from "./brand";

const Grain: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} style={{ position: "absolute", opacity: 0.14, mixBlendMode: "multiply" }}>
    <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={5} /></filter><rect width={w} height={h} filter="url(#gr)" /></svg>);

// дверь в плоскости x=X0, проём y∈[4,6], z∈[0,4]; петли у y=4; open — угол створки (рад); L — длина полосы света
const DoorScene: React.FC<{ S: number; cx: number; cy: number; open?: number; L?: number; id: string }> = ({ S, cx, cy, open = 1.0, L = 9, id }) => {
  const I = makeIso(S, cx, cy); const { iso, pts, Cube } = I; const X0 = 5;
  const ex = X0 + 2 * Math.sin(open), ey = 4 + 2 * Math.cos(open);           // свободный край створки
  const a = iso(X0, 5, 0), b = iso(X0 + L, 5, 0);
  return (<g>
    <defs>
      <linearGradient id={`beam${id}`} gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}>
        <stop offset="0" stopColor={A.glow} stopOpacity={0.75} /><stop offset="0.5" stopColor={A.glow} stopOpacity={0.25} /><stop offset="1" stopColor={A.glow} stopOpacity={0} /></linearGradient>
      <linearGradient id={`world${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0a0e22" /><stop offset="0.6" stopColor="#1b1f5a" /><stop offset="1" stopColor="#ff3fa4" /></linearGradient>
      <clipPath id={`open${id}`}><polygon points={pts([[X0, 4, 0], [X0, 6, 0], [X0, 6, 4], [X0, 4, 4]])} /></clipPath>
    </defs>
    {/* тень двери на полу */}
    <polygon points={pts([[X0 - 0.4, 3.6, 0], [X0 - 1.6, 3.6, 0], [X0 - 1.6, 6.7, 0], [X0 - 0.4, 6.7, 0]])} fill="#0b1a1f" opacity={0.35} filter="url(#soft)" />
    {/* полоса света по полу: от проёма вдаль */}
    <polygon points={pts([[X0, 4.1, 0], [X0, 6, 0], [X0 + L, 6 + L * 0.35, 0], [X0 + L, 4.1 - L * 0.12, 0]])} fill={`url(#beam${id})`} filter="url(#glow)" />
    {/* проём: за дверью другой мир — ночной неон */}
    <polygon points={pts([[X0, 4, 0], [X0, 6, 0], [X0, 6, 4], [X0, 4, 4]])} fill={`url(#world${id})`} />
    <g clipPath={`url(#open${id})`}>
      {Array.from({ length: 14 }, (_, i) => { const [sx, sy] = iso(X0, 4.15 + ((i * 37) % 17) / 10, 1.4 + ((i * 53) % 25) / 10);
        return <circle key={i} cx={sx} cy={sy} r={S * (0.03 + (i % 3) * 0.015)} fill="#fff" opacity={0.85} />; })}
      {(() => { const [px, py] = iso(X0, 5.3, 2.8); return <><circle cx={px} cy={py} r={S * 0.42} fill={A.glow} opacity={0.25} filter="url(#glow)" /><circle cx={px} cy={py} r={S * 0.26} fill="none" stroke={A.glow} strokeWidth={S * 0.05} filter="url(#glow)" /></>; })()}
      <polygon points={pts([[X0, 4, 0], [X0, 6, 0], [X0, 6, 0.9], [X0, 4, 1.2]])} fill="#ff3fa4" opacity={0.55} filter="url(#glow)" />
    </g>
    {/* коробка: косяки и перемычка — бумага */}
    <Cube x={X0 - 0.3} y={3.7} z={0} w={0.3} d={0.3} h={4.3} top={D.cream} l="#e6dccb" r="#d6cbb8" shadow />
    <Cube x={X0 - 0.3} y={6} z={0} w={0.3} d={0.3} h={4.3} top={D.cream} l="#e6dccb" r="#d6cbb8" shadow />
    <Cube x={X0 - 0.3} y={3.7} z={4} w={0.3} d={2.6} h={0.3} top={D.cream} l="#e6dccb" r="#d6cbb8" shadow />
    {/* створка: приоткрыта к зрителю, внутренняя сторона подсвечена неоном */}
    <g filter="url(#pD)">
      <polygon points={pts([[X0, 4, 0], [ex, ey, 0], [ex, ey, 4], [X0, 4, 4]])} fill={D.coral} />
      <polygon points={pts([[X0 + (ex - X0) * 0.15, 4 + (ey - 4) * 0.15, 0.4], [X0 + (ex - X0) * 0.85, 4 + (ey - 4) * 0.85, 0.4], [X0 + (ex - X0) * 0.85, 4 + (ey - 4) * 0.85, 1.8], [X0 + (ex - X0) * 0.15, 4 + (ey - 4) * 0.15, 1.8]])} fill="none" stroke={D.coralD} strokeWidth={S * 0.05} />
      <polygon points={pts([[X0 + (ex - X0) * 0.15, 4 + (ey - 4) * 0.15, 2.2], [X0 + (ex - X0) * 0.85, 4 + (ey - 4) * 0.85, 2.2], [X0 + (ex - X0) * 0.85, 4 + (ey - 4) * 0.85, 3.6], [X0 + (ex - X0) * 0.15, 4 + (ey - 4) * 0.15, 3.6]])} fill="none" stroke={D.coralD} strokeWidth={S * 0.05} />
    </g>
    {(() => { const [kx, ky] = iso(X0 + (ex - X0) * 0.9, 4 + (ey - 4) * 0.9, 2.0); return <circle cx={kx} cy={ky} r={S * 0.09} fill={D.mustard} />; })()}
    {/* неоновый отсвет на кромке створки */}
    <line x1={iso(ex, ey, 0)[0]} y1={iso(ex, ey, 0)[1]} x2={iso(ex, ey, 4)[0]} y2={iso(ex, ey, 4)[1]} stroke={A.glow} strokeWidth={S * 0.06} filter="url(#glow)" />
  </g>);
};

export const AvatarDoor: React.FC = () => (
  <AbsoluteFill style={{ background: D.bg }}>
    <svg width={1500} height={1500} style={{ position: "absolute" }}><Defs />
      <circle cx={750} cy={780} r={520} fill={A.glow} opacity={0.08} filter="url(#soft)" />
      <DoorScene S={140} cx={690} cy={330} L={5} id="av" />
    </svg>
    <Grain w={1500} h={1500} />
  </AbsoluteFill>
);

export const CoverDoor: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 40% 55%, #235a63 0%, #173f48 55%, #0d2a31 100%)" }}>
    <svg width={1920} height={768} style={{ position: "absolute" }}><Defs />
      <DoorScene S={84} cx={470} cy={20} L={14} id="cv" />
    </svg>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
      <div style={{ background: D.mustard, color: D.ink, fontFamily: G, fontWeight: 800, fontSize: 88, letterSpacing: 10, padding: "20px 46px 26px",
        transform: "translateX(230px) rotate(-2deg)", boxShadow: "-10px 16px 0 rgba(0,0,0,0.28)" }}>А ЧТО ЕСЛИ…</div>
    </div>
    <Grain w={1920} h={768} />
  </AbsoluteFill>
);
