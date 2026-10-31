// ЭСКИЗ «Чистый тёмный»: шапка 1920×768 + аватарка 1500×1500 по референсу владельца (структура: водяной знак, градиентное название,
// слоган, две мини-плашки, справа дуга + предмет), в тёмной гамме и с нашим бумажным «?».
import React from "react";
import { AbsoluteFill } from "remotion";
import { A, D, G } from "./brand";

const BG = "#0f181c", BG2 = "#16242a";
const GRAD = `linear-gradient(90deg, ${D.mustard} 0%, ${D.coral} 100%)`;
const gradText: React.CSSProperties = { background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };

const PaperQ: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const depth = Math.round(size * 0.06);
  const base: React.CSSProperties = { position: "absolute", left: 0, top: 0, fontFamily: G, fontWeight: 800, fontSize: size, lineHeight: 1 };
  return (<div style={{ position: "absolute", left: x, top: y, width: size * 0.62, height: size }}>
    <div style={{ position: "absolute", left: -size * 0.3, top: 0, width: size * 1.2, height: size, borderRadius: "50%",
      background: `radial-gradient(circle, ${D.mustard}40 0%, ${A.glow}18 45%, transparent 70%)`, filter: `blur(${size * 0.05}px)` }} />
    <div style={{ ...base, color: "#000", opacity: 0.45, transform: `translate(${-depth * 1.6}px, ${depth * 2.6}px)`, filter: `blur(${size * 0.025}px)` }}>?</div>
    {Array.from({ length: depth }, (_, i) => <div key={i} style={{ ...base, color: i > depth * 0.6 ? D.mustD : "#b9801a", transform: `translate(${-(depth - i)}px, ${depth - i}px)` }}>?</div>)}
    <div style={{ ...base, color: D.mustard }}>?</div>
    <div style={{ ...base, color: "transparent", WebkitTextStroke: `${size * 0.008}px rgba(255,255,255,0.35)` }}>?</div>
  </div>);
};
const Feature: React.FC<{ icon: React.ReactNode; text: [string, string] }> = ({ icon, text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ width: 54, height: 54 }}>{icon}</div>
    <div style={{ fontFamily: G, fontWeight: 500, fontSize: 26, lineHeight: 1.15, color: "rgba(247,239,224,0.85)" }}>{text[0]}<br />{text[1]}</div>
  </div>);
const IconCube = () => (<svg width={54} height={54} viewBox="0 0 54 54"><defs><linearGradient id="ic" x1="0" x2="1"><stop offset="0" stopColor={D.mustard} /><stop offset="1" stopColor={D.coral} /></linearGradient></defs>
  <polygon points="27,4 50,16 27,28 4,16" fill="url(#ic)" /><polygon points="4,16 27,28 27,52 4,40" fill={D.coralD} /><polygon points="50,16 27,28 27,52 50,40" fill={D.mustD} /></svg>);
const IconCheck = () => (<svg width={54} height={54} viewBox="0 0 54 54"><defs><linearGradient id="ic2" x1="0" x2="1"><stop offset="0" stopColor={D.mustard} /><stop offset="1" stopColor={D.coral} /></linearGradient></defs>
  <circle cx={27} cy={27} r={24} fill="none" stroke="url(#ic2)" strokeWidth={5} /><path d="M16,28 l8,8 l15,-17" fill="none" stroke="url(#ic2)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>);

export const CoverClean: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(120deg, ${BG} 0%, ${BG2} 60%, ${BG} 100%)`, overflow: "hidden" }}>
    {/* мягкие крупные круги и водяной знак */}
    <div style={{ position: "absolute", left: -260, top: -380, width: 900, height: 900, borderRadius: "50%", background: "rgba(255,255,255,0.025)" }} />
    <div style={{ position: "absolute", right: -300, bottom: -520, width: 1100, height: 1100, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
    <div style={{ position: "absolute", left: 330, top: 150, fontFamily: G, fontWeight: 800, fontSize: 470, lineHeight: 1, color: "rgba(255,255,255,0.035)", letterSpacing: -10 }}>ЕСЛИ</div>
    {/* текстовый блок */}
    <div style={{ position: "absolute", left: 360, top: 200, fontFamily: G }}>
      <div style={{ fontWeight: 800, fontSize: 118, lineHeight: 1, letterSpacing: -1 }}><span style={gradText}>А что </span><span style={{ color: D.cream }}>если…</span></div>
      <div style={{ color: "rgba(247,239,224,0.9)", fontWeight: 500, fontSize: 38, lineHeight: 1.25, marginTop: 24 }}>Безумные вопросы о нашем мире —<br />и честные ответы в коротких роликах</div>
      <div style={{ display: "flex", gap: 56, marginTop: 34 }}>
        <Feature icon={<IconCube />} text={["Одна гипотеза —", "один ролик"]} />
        <Feature icon={<IconCheck />} text={["Фантазия и факты —", "честно"]} />
      </div>
    </div>
    {/* дуга + бумажный «?» */}
    <svg width={1920} height={768} style={{ position: "absolute" }}>
      <defs><linearGradient id="arc" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={D.mustard} /><stop offset="1" stopColor={D.coral} /></linearGradient></defs>
      <path d="M1270,800 A250,250 0 0 1 1770,800" fill="none" stroke="url(#arc)" strokeWidth={70} />
      <circle cx={1790} cy={120} r={60} fill="none" stroke="url(#arc)" strokeWidth={26} opacity={0.9} />
    </svg>
    <PaperQ x={1390} y={170} size={430} />
  </AbsoluteFill>
);

export const AvatarClean: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${BG2} 0%, ${BG} 70%)`, justifyContent: "center", alignItems: "center" }}>
    <div style={{ position: "absolute", left: 700, top: 120, fontFamily: G, fontWeight: 800, fontSize: 1300, lineHeight: 1, color: "rgba(255,255,255,0.035)" }}>?</div>
    <div style={{ fontFamily: G, fontWeight: 800, fontSize: 330, lineHeight: 0.95, textAlign: "left", marginLeft: -40 }}>
      <div style={gradText}>А что</div><div style={{ color: D.cream }}>если?</div>
    </div>
  </AbsoluteFill>
);
