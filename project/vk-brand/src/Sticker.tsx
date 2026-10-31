// ЭСКИЗ Т2+Т3: шапка 1920×768 — заголовок + бумажный «?» + стикеры-вопросы; аватарка 1500×1500 — бумажный «?».
import React from "react";
import { AbsoluteFill } from "remotion";
import { A, D, G } from "./brand";

const BG = "radial-gradient(ellipse at 55% 50%, #235a63 0%, #173f48 55%, #0d2a31 100%)";
const Grain: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} style={{ position: "absolute", opacity: 0.14, mixBlendMode: "multiply" }}>
    <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={5} /></filter><rect width={w} height={h} filter="url(#gr)" /></svg>);

// объёмный бумажный «?»: слои-выдавливание + лицевая грань + свечение за ним
const PaperQ: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const depth = Math.round(size * 0.06);
  const base: React.CSSProperties = { position: "absolute", left: 0, top: 0, fontFamily: G, fontWeight: 800, fontSize: size, lineHeight: 1 };
  return (<div style={{ position: "absolute", left: x, top: y, width: size * 0.62, height: size }}>
    <div style={{ position: "absolute", left: -size * 0.25, top: size * 0.05, width: size * 1.1, height: size * 0.95, borderRadius: "50%",
      background: `radial-gradient(circle, ${A.glow}55 0%, ${D.mustard}33 40%, transparent 70%)`, filter: `blur(${size * 0.06}px)` }} />
    <div style={{ ...base, color: "#0b1a1f", opacity: 0.35, transform: `translate(${-depth * 1.6}px, ${depth * 2.6}px)`, filter: `blur(${size * 0.025}px)` }}>?</div>
    {Array.from({ length: depth }, (_, i) => <div key={i} style={{ ...base, color: i > depth * 0.6 ? D.mustD : "#b9801a", transform: `translate(${-(depth - i)}px, ${depth - i}px)` }}>?</div>)}
    <div style={{ ...base, color: D.mustard }}>?</div>
    <div style={{ ...base, color: "transparent", WebkitTextStroke: `${size * 0.008}px rgba(255,255,255,0.35)` }}>?</div>
  </div>);
};

const Sticker: React.FC<{ x: number; y: number; r: number; text: string; bg: string; fg: string; w?: number; fs?: number }> = ({ x, y, r, text, bg, fg, w = 300, fs = 34 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, padding: "22px 24px 26px", background: bg, color: fg, fontFamily: G, fontWeight: 800, fontSize: fs,
    lineHeight: 1.1, transform: `rotate(${r}deg)`, boxShadow: "-8px 14px 0 rgba(0,0,0,0.25)" }}>
    <div style={{ position: "absolute", left: "50%", top: -14, width: 90, height: 28, marginLeft: -45, background: "rgba(247,239,224,0.55)", transform: `rotate(${-r * 0.6}deg)` }} />
    {text}</div>
);

export const CoverStickers: React.FC = () => (
  <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
    {/* стикеры-вопросы по краям */}
    <Sticker x={40} y={60} r={-7} text="…Луны не стало?" bg={D.cream} fg={D.ink} w={260} />
    <Sticker x={60} y={520} r={5} text="…люди не спали?" bg={D.coral} fg={D.cream} w={270} />
    <Sticker x={1560} y={50} r={6} text="…деньги исчезли?" bg={D.teal} fg={D.cream} w={290} />
    <Sticker x={1620} y={330} r={-5} text="…время пошло назад?" bg={D.cream} fg={D.ink} w={270} />
    <Sticker x={1560} y={590} r={4} text="…кошки заговорили?" bg={D.rose} fg={D.cream} w={290} />
    {/* заголовок */}
    <div style={{ position: "absolute", left: 340, top: 195, fontFamily: G }}>
      <div style={{ color: D.cream, fontWeight: 800, fontSize: 132, lineHeight: 1, letterSpacing: -1, textShadow: "-6px 10px 0 rgba(0,0,0,0.22)" }}>А что если…</div>
      <div style={{ color: D.mustard, fontWeight: 800, fontSize: 46, marginTop: 22 }}>Безумные вопросы. Честные ответы.</div>
      <div style={{ display: "inline-block", marginTop: 24, background: "rgba(247,239,224,0.12)", border: "2px dashed rgba(247,239,224,0.45)", color: D.cream,
        fontWeight: 500, fontSize: 30, padding: "10px 22px", borderRadius: 10 }}>Предлагай свой вопрос в комментариях</div>
    </div>
    <PaperQ x={1330} y={170} size={420} />
    <Grain w={1920} h={768} />
  </AbsoluteFill>
);

export const AvatarQ: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <PaperQ x={500} y={240} size={1000} />
    <Grain w={1500} h={1500} />
  </AbsoluteFill>
);
