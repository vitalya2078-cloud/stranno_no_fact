// ТЕСТ СТИЛЯ (7 с): кинематографичный 2D-космос — снимки NASA, свечение, частицы, ударная волна, тряска, зерно, виньетка;
// ведущий — картинка владельца (перекладка: парение, наклоны, сжатие, реакции).
import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { fontFamily } from "./font";

export const STYLE_TOTAL = 7 * 30;
const ez = (t: number, a: number, b: number, f = Easing.inOut(Easing.cubic)) => (t <= a ? 0 : t >= b ? 1 : f((t - a) / (b - a)));
const TC = 2.6;   // момент схлопывания Солнца

// ---------- звёзды в 3 слоя (параллакс), мерцание
const starLayer = (seed: number, n: number) => { let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({ x: r() * 1400 - 160, y: r() * 2300 - 190, r: 0.6 + r() * 1.8, ph: r() * 6.28 })); };
const LAYERS = [starLayer(3, 260), starLayer(7, 120), starLayer(13, 40)];
const Stars: React.FC<{ t: number; cx: number; cy: number }> = ({ t, cx, cy }) => (
  <svg width={1080} height={1920} style={{ position: "absolute" }}>
    {LAYERS.map((L, k) => (
      <g key={k} transform={`translate(${-cx * (0.15 + k * 0.25)}, ${-cy * (0.15 + k * 0.25)})`}>
        {L.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r * (1 + k * 0.6)} fill="#fff" opacity={(0.35 + 0.4 * Math.abs(Math.sin(t * (0.8 + k) + p.ph))) * (0.6 + k * 0.2)} />)}
      </g>))}
  </svg>
);
// ---------- туманность: шумовая текстура SVG (без картинок), медленный дрейф
const Nebula: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.85 }}>
    <filter id="neb" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.0024" numOctaves={5} seed={4} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.28  0 0 0 0 0.06  0 0 0 0 0.55  0 0 0 2.6 -1.25" />
    </filter>
    <filter id="neb2" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.002 0.0012" numOctaves={4} seed={9} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.45  0 0 0 0 0.55  0 0 0 2.2 -1.15" />
    </filter>
    <rect x={-200 + t * 6} y={-200} width={1500} height={2400} filter="url(#neb)" />
    <rect x={-300 - t * 4} y={-100 + t * 3} width={1500} height={2400} filter="url(#neb2)" />
  </svg>
);
// ---------- диск аккреции: частицы по эллиптическим орбитам, горячее ближе к центру
const DISK = (() => { let s = 21; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 420 }, () => ({ rad: 1.25 + Math.pow(r(), 1.7) * 2.6, ph: r() * 6.28, sz: 0.6 + r() * 2.2, sp: 0.7 + r() * 0.6 })); })();
const BlackHole: React.FC<{ t: number; x: number; y: number; R: number; show: number }> = ({ t, x, y, R, show }) => {
  if (show <= 0) return null;
  const back = DISK.map((p, i) => { const a = p.ph + t * p.sp * (2.2 / p.rad);
    return { i, px: x + Math.cos(a) * p.rad * R, py: y + Math.sin(a) * p.rad * R * 0.28, front: Math.sin(a) > 0, p }; });
  const hot = (rad: number) => (rad < 1.8 ? "#fff3c4" : rad < 2.6 ? "#ffb347" : "#ff6a2a");
  const dots = (front: boolean) => back.filter((d) => d.front === front).map((d) =>
    <circle key={d.i} cx={d.px} cy={d.py} r={d.p.sz * (R / 40)} fill={hot(d.p.rad)} opacity={0.85} />);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", opacity: show }}>
      <defs><filter id="glowBH" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={R * 0.18} /></filter>
        <radialGradient id="lens"><stop offset="55%" stopColor="#000" stopOpacity={0} /><stop offset="70%" stopColor="#ffb347" stopOpacity={0.9} /><stop offset="100%" stopColor="#ff6a2a" stopOpacity={0} /></radialGradient></defs>
      <g filter="url(#glowBH)">{dots(false)}</g>{dots(false)}
      <circle cx={x} cy={y} r={R * 1.6} fill="url(#lens)" />
      <circle cx={x} cy={y} r={R} fill="#000" />
      <circle cx={x} cy={y} r={R * 1.08} fill="none" stroke="#ffe7a8" strokeWidth={R * 0.06} opacity={0.9} />
      <g filter="url(#glowBH)">{dots(true)}</g>{dots(true)}
    </svg>
  );
};

export const StyleTest: React.FC = () => {
  const f = useCurrentFrame(); const t = f / 30; const { fps } = useVideoConfig();
  const col = ez(t, TC, TC + 0.35, Easing.in(Easing.cubic));            // схлопывание
  const after = t - TC;
  const shake = after > 0 ? 26 * Math.exp(-after * 4) : 0;
  const sx = Math.sin(t * 61) * shake, sy = Math.cos(t * 47) * shake;
  // камера: медленный наезд → рывок на схлопывании → отъезд, чтобы показать орбиту
  const zoom = interpolate(t, [0, TC, TC + 0.15, 7], [1.15, 1.32, 1.45, 1.0], { extrapolateRight: "clamp" });
  const camX = 0, camY = interpolate(t, [0, 7], [-40, 30]);
  const SX = 540, SY = 760;                                              // Солнце в «мире»
  const sunR = interpolate(col, [0, 1], [230, 6]);
  const flash = after > 0 ? Math.exp(-after * 9) : 0;
  const ring = after > 0 ? after * 1500 : 0;
  // Земля на орбите
  const ang = t * 0.75 + 0.6, ex = SX + Math.cos(ang) * 420, ey = SY + Math.sin(ang) * 140, front = Math.sin(ang) > 0;
  const earthR = front ? 46 : 36;
  // ведущий: реакция на схлопывание — подпрыгивает и сжимается
  const jump = after > 0 ? Math.exp(-after * 3.5) * Math.sin(after * 14) : 0;
  const hostY = 1420 + Math.sin(t * 1.8) * 10 - 60 * Math.max(0, jump);
  const sq = 1 + 0.12 * jump;
  const mark = ez(t, TC + 0.9, TC + 1.2);
  // кинетический заголовок
  const words = ["ЗЕМЛЯ", "ДАЖЕ", "НЕ", "СДВИНЕТСЯ"];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #12082a 0%, #05030f 70%)", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px,${sy}px)` }}>
        <AbsoluteFill style={{ transform: `scale(${zoom}) translate(${-camX}px,${-camY}px)`, transformOrigin: `${SX}px ${SY}px` }}>
          <Nebula t={t} />
          <Stars t={t} cx={camX} cy={camY} />
          {/* орбита */}
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <ellipse cx={SX} cy={SY} rx={420} ry={140} fill="none" stroke="#9fd8ff" strokeOpacity={0.25} strokeWidth={3} strokeDasharray="10 14" />
          </svg>
          {!front ? <Img src={staticFile("earth.png")} style={{ position: "absolute", left: ex - earthR, top: ey - earthR, width: earthR * 2, height: earthR * 2, filter: `brightness(${1 - 0.7 * col})` }} /> : null}
          {/* Солнце: снимок NASA + слои свечения + вращающаяся корона */}
          {col < 1 ? (<>
            <div style={{ position: "absolute", left: SX - sunR * 2.6, top: SY - sunR * 2.6, width: sunR * 5.2, height: sunR * 5.2, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,200,90,0.55) 0%, rgba(255,120,30,0.18) 40%, rgba(0,0,0,0) 70%)" }} />
            <div style={{ position: "absolute", left: SX - sunR * 1.7, top: SY - sunR * 1.7, width: sunR * 3.4, height: sunR * 3.4, borderRadius: "50%", opacity: 0.55,
              background: `repeating-conic-gradient(from ${t * 14}deg, rgba(255,210,120,0.0) 0deg 8deg, rgba(255,210,120,0.35) 10deg 12deg)`,
              WebkitMaskImage: "radial-gradient(circle, transparent 38%, black 45%, transparent 70%)" }} />
            <Img src={staticFile("sun.png")} style={{ position: "absolute", left: SX - sunR * 1.12, top: SY - sunR * 1.12, width: sunR * 2.24, height: sunR * 2.24,
              transform: `rotate(${t * 3}deg)`, filter: `brightness(${1.25 + 0.15 * Math.sin(t * 3)}) saturate(1.3)` }} />
          </>) : null}
          <BlackHole t={t} x={SX} y={SY} R={68} show={ez(t, TC + 0.2, TC + 0.7)} />
          {front ? <Img src={staticFile("earth.png")} style={{ position: "absolute", left: ex - earthR, top: ey - earthR, width: earthR * 2, height: earthR * 2, filter: `brightness(${1 - 0.7 * col})` }} /> : null}
          {/* ударная волна */}
          {after > 0 && after < 1.2 ? (
            <svg width={1080} height={1920} style={{ position: "absolute" }}>
              <circle cx={SX} cy={SY} r={ring} fill="none" stroke="#fff" strokeOpacity={Math.max(0, 0.8 - after * 0.7)} strokeWidth={30 * Math.exp(-after * 2)} />
              <circle cx={SX} cy={SY} r={ring * 0.7} fill="none" stroke="#7fe6ff" strokeOpacity={Math.max(0, 0.6 - after * 0.6)} strokeWidth={14} />
            </svg>) : null}
        </AbsoluteFill>
      </AbsoluteFill>
      {/* кинетический заголовок: слова выпрыгивают по одному */}
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1090, gap: 0, flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start", padding: "1090px 60px 0" }}>
        {words.map((w, i) => {
          const s = spring({ frame: f - Math.round((TC + 0.55 + i * 0.22) * fps), fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
          return <span key={w} style={{ fontFamily, fontSize: 104, color: i === 3 ? "#ffc12e" : "#fff", margin: "0 14px", lineHeight: 1.1,
            transform: `scale(${s}) translateY(${(1 - s) * 40}px)`, opacity: s, WebkitTextStroke: "14px #000", paintOrder: "stroke fill", display: "inline-block",
            textShadow: "0 8px 0 rgba(0,0,0,0.5)" }}>{w}</span>;
        })}
      </AbsoluteFill>
      {/* ведущий: картинка владельца, перекладка */}
      <div style={{ position: "absolute", left: 40, top: hostY, width: 470, height: 466, transformOrigin: "50% 90%",
        transform: `rotate(${Math.sin(t * 1.3) * 4 + jump * 8}deg) scale(${1 / Math.sqrt(sq)}, ${sq})` }}>
        <Img src={staticFile("host.png")} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ position: "absolute", left: 395, top: hostY + 10, fontFamily, fontSize: 140, color: "#ffc12e", WebkitTextStroke: "8px #7a3d00", paintOrder: "stroke fill",
        transform: `rotate(${(1 - mark) * 14}deg) scale(${1 + 0.4 * Math.sin(mark * Math.PI)})`, textShadow: "0 0 30px rgba(255,190,60,0.8)" }}>{mark < 0.5 ? "?" : "!"}</div>
      {/* вспышка, зерно, виньетка */}
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.9 }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 30} /></filter>
        <rect width={1080} height={1920} filter="url(#grain)" />
      </svg>
      <Audio src={staticFile("style_sfx.wav")} />
    </AbsoluteFill>
  );
};
