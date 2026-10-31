// ЭСКИЗЫ персонажей канала «План Б»: 3 героя (Тимур, Лёва, Саня) и 3 собаки (Бублик, корги, метис хаски).
// Стиль формата: плоские формы, мягкие тени, тонкая линия в тон, круглая голова ≈ 1/3 роста, тёплый контровой свет.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DAY, F } from "./kit";

const SKIN = "#F1C7A0", SKIN_D = "#C9946C";
const shade = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16);
  return `rgb(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.min(255, v * k))).join(",")})`; };

type HeroP = { hoodie: string; cap: string; jeans?: string; detail: "tape" | "pack" | "radio"; brows?: number };
const Hero: React.FC<HeroP & { x: number; y: number; t: number }> = ({ x, y, t, hoodie, cap, jeans = "#3B4A6B", detail, brows = 0 }) => {
  const ln = (c: string) => ({ stroke: shade(c, 0.62), strokeWidth: 3, strokeLinejoin: "round" as const });
  const br = Math.sin(t * 2) * 2; const blink = (Math.floor(t * 30) % 110) < 4;
  return (<g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={6} rx={95} ry={16} fill="#000" opacity={0.15} />
    {detail === "pack" ? <rect x={-70} y={-330} width={140} height={170} rx={30} fill="#C0392B" {...ln("#C0392B")} /> : null}
    {/* ноги и ботинки */}
    <rect x={-48} y={-170} width={42} height={160} rx={18} fill={jeans} {...ln(jeans)} />
    <rect x={6} y={-170} width={42} height={160} rx={18} fill={shade(jeans, 0.9)} {...ln(jeans)} />
    <rect x={-58} y={-24} width={56} height={28} rx={12} fill="#5A3B28" {...ln("#5A3B28")} />
    <rect x={2} y={-24} width={56} height={28} rx={12} fill="#5A3B28" {...ln("#5A3B28")} />
    {/* корпус-худи с карманом и шнурками */}
    <rect x={-72} y={-360 + br} width={144} height={210 - br} rx={44} fill={hoodie} {...ln(hoodie)} />
    <path d={`M-40,${-220 + br} h80 v36 q-40,14 -80,0z`} fill={shade(hoodie, 0.85)} />
    <line x1={-14} y1={-350 + br} x2={-16} y2={-300 + br} stroke="#eee" strokeWidth={4} strokeLinecap="round" />
    <line x1={14} y1={-350 + br} x2={16} y2={-300 + br} stroke="#eee" strokeWidth={4} strokeLinecap="round" />
    {/* руки */}
    <rect x={-104} y={-346 + br} width={38} height={150} rx={19} fill={shade(hoodie, 0.9)} {...ln(hoodie)} transform={`rotate(8 -85 ${-340 + br})`} />
    <rect x={66} y={-346 + br} width={38} height={150} rx={19} fill={shade(hoodie, 0.9)} {...ln(hoodie)} transform={`rotate(-8 85 ${-340 + br})`} />
    <circle cx={-106} cy={-196 + br} r={20} fill={SKIN} {...ln(SKIN)} /><circle cx={106} cy={-196 + br} r={20} fill={SKIN} {...ln(SKIN)} />
    {/* деталь героя */}
    {detail === "tape" ? (<g>
      <circle cx={56} cy={-180} r={22} fill="none" stroke="#2F6FD6" strokeWidth={14} /><circle cx={56} cy={-180} r={22} fill="none" {...ln("#2F6FD6")} strokeWidth={2} />
      <rect x={-64} y={-196} width={14} height={40} rx={4} fill="#9AA3AD" {...ln("#9AA3AD")} /><circle cx={-57} cy={-200} r={8} fill="none" stroke="#C0392B" strokeWidth={4} />
    </g>) : null}
    {detail === "pack" ? (<g>
      <rect x={-56} y={-356 + br} width={14} height={170} rx={7} fill="#962D22" /><rect x={42} y={-356 + br} width={14} height={170} rx={7} fill="#962D22" />
      <rect x={38} y={-300 + br} width={22} height={34} rx={6} fill="#2A2A22" /><circle cx={49} cy={-306 + br} r={10} fill="#FFE9A8" />
      <circle cx={49} cy={-306 + br} r={26} fill="#FFE9A8" opacity={0.35} />
    </g>) : null}
    {detail === "radio" ? (<g>
      <rect x={-102} y={-320 + br} width={36} height={14} fill="#E8F2FF" opacity={0.9} /><rect x={66} y={-320 + br} width={36} height={14} fill="#E8F2FF" opacity={0.9} />
      <rect x={-66} y={-396 + br} width={30} height={52} rx={6} fill="#2A2A22" /><rect x={-58} y={-428 + br} width={6} height={34} rx={3} fill="#2A2A22" />
      <circle cx={-51} cy={-380 + br} r={5} fill={(Math.floor(t * 2) % 2) ? "#3DDC84" : "#1F6B44"} />
    </g>) : null}
    {/* голова ≈ треть роста: круг, уши, лицо минимальное, щетина точками, кепка */}
    <g transform={`translate(0,${-470 + br})`}>
      <circle cx={-92} cy={10} r={18} fill={SKIN} {...ln(SKIN)} /><circle cx={92} cy={10} r={18} fill={SKIN} {...ln(SKIN)} />
      <circle cx={0} cy={0} r={95} fill={SKIN} {...ln(SKIN)} />
      <path d="M-70,-50 a95,95 0 0 1 145,10" fill="none" stroke="#FFD9A0" strokeWidth={6} opacity={0.8} />
      {blink ? <><line x1={-38} y1={8} x2={-22} y2={8} stroke="#2A2A22" strokeWidth={5} strokeLinecap="round" /><line x1={22} y1={8} x2={38} y2={8} stroke="#2A2A22" strokeWidth={5} strokeLinecap="round" /></>
        : <><circle cx={-30} cy={8} r={8} fill="#2A2A22" /><circle cx={30} cy={8} r={8} fill="#2A2A22" /></>}
      <path d={`M-46,${-22 - brows} q16,-10 30,-2 M16,${-24 + brows} q16,-8 30,2`} fill="none" stroke="#3A2A1E" strokeWidth={7} strokeLinecap="round" />
      <path d="M-16,44 q16,8 32,0" fill="none" stroke="#7A3B2E" strokeWidth={5} strokeLinecap="round" />
      {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={-50 + (i % 8) * 14} cy={52 + Math.floor(i / 8) * 12 + Math.abs((i % 8) - 3.5) * -3} r={2} fill={SKIN_D} />)}
      <path d="M-92,-20 a92,82 0 0 1 184,0 z" fill={cap} {...ln(cap)} />
      <path d="M-20,-24 q90,-10 130,16 q-60,10 -130,4z" fill={shade(cap, 0.85)} {...ln(cap)} />
      <circle cx={0} cy={-100} r={8} fill={shade(cap, 0.8)} />
    </g>
  </g>);
};

type DogP = { body: string; belly: string; kind: "bublik" | "corgi" | "husky" };
const Dog: React.FC<DogP & { x: number; y: number; t: number }> = ({ x, y, t, body, belly, kind }) => {
  const ln = { stroke: shade(body, 0.6), strokeWidth: 3, strokeLinejoin: "round" as const };
  const leg = kind === "corgi" ? 34 : 70; const wag = Math.sin(t * 9) * 12; const br = Math.sin(t * 3) * 2;
  const blink = (Math.floor(t * 30) % 95) < 4;
  return (<g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={4} rx={130} ry={14} fill="#000" opacity={0.15} />
    {[-80, -50, 50, 80].map((lx, i) => <rect key={i} x={lx - 12} y={-leg - 6} width={24} height={leg + 6} rx={12} fill={i % 2 ? shade(body, 0.9) : body} {...ln} />)}
    {/* хвост */}
    {kind === "bublik" ? <path d={`M-110,${-leg - 50} q-40,${-30 + wag} -10,-60 q30,-10 20,20`} fill="none" stroke={body} strokeWidth={22} strokeLinecap="round" /> : null}
    {kind === "corgi" ? <ellipse cx={-118} cy={-leg - 46 + wag * 0.2} rx={16} ry={12} fill={body} {...ln} /> : null}
    {kind === "husky" ? <path d={`M-110,${-leg - 40} q-60,${-40 + wag} -20,-90 q20,10 26,60z`} fill={body} {...ln} /> : null}
    {/* корпус */}
    <ellipse cx={0} cy={-leg - 40 + br} rx={120} ry={kind === "corgi" ? 50 : 56} fill={body} {...ln} />
    <ellipse cx={30} cy={-leg - 22 + br} rx={70} ry={26} fill={belly} />
    {/* голова */}
    <g transform={`translate(115,${-leg - 100 + br})`}>
      {kind === "bublik" ? (<><path d="M-40,-38 l-16,-52 l36,30z" fill={shade(body, 0.85)} {...ln} /><path d="M24,-46 q34,-6 30,44 q-14,-4 -24,-24z" fill={shade(body, 0.8)} {...ln} /></>) : null}
      {kind === "corgi" ? (<><path d="M-44,-34 l-16,-70 l44,40z" fill={body} {...ln} /><path d="M20,-44 l30,-64 l12,62z" fill={body} {...ln} /></>) : null}
      {kind === "husky" ? (<><path d="M-40,-36 l-8,-60 l34,36z" fill={body} {...ln} /><path d="M18,-44 l22,-56 l12,54z" fill={body} {...ln} /></>) : null}
      <circle cx={0} cy={0} r={58} fill={body} {...ln} />
      {kind === "husky" ? <path d="M-30,-10 q30,-30 60,0 q-10,50 -30,54 q-20,-4 -30,-54z" fill={belly} /> : null}
      {kind === "corgi" ? <path d="M-10,-40 q10,30 0,60 q20,10 40,-6 q-10,-30 -20,-56z" fill={belly} /> : null}
      <ellipse cx={46} cy={18} rx={34} ry={24} fill={belly} {...ln} /><ellipse cx={74} cy={10} rx={11} ry={8} fill="#2A2A22" />
      {blink ? <line x1={4} y1={-6} x2={20} y2={-6} stroke="#2A2A22" strokeWidth={5} strokeLinecap="round" />
        : <circle cx={12} cy={-6} r={8} fill={kind === "husky" ? "#5BB8F0" : "#2A2A22"} stroke="#2A2A22" strokeWidth={kind === "husky" ? 3 : 0} />}
      <path d="M44,38 q12,8 22,0" fill="none" stroke="#7A3B2E" strokeWidth={4} strokeLinecap="round" />
      <path d="M50,40 q6,20 14,4" fill="#E57373" />
    </g>
  </g>);
};

const Label: React.FC<{ x: number; y: number; name: string; sub: string }> = ({ x, y, name, sub }) => (
  <div style={{ position: "absolute", left: x - 170, top: y, width: 340, textAlign: "center", lineHeight: 1.1 }}>
    <div style={{ fontFamily: F.black, fontWeight: 900, fontSize: 40, color: DAY.ink }}>{name}</div>
    <div style={{ fontFamily: F.mono, fontSize: 24, color: "#5a5a4a", marginTop: 6 }}>{sub}</div>
  </div>);

export const Concepts: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (<AbsoluteFill style={{ background: `linear-gradient(${DAY.sky1}, ${DAY.paper})` }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 56, color: DAY.ink }}>ПЛАН Б · ГЕРОИ</div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <Hero x={190} y={760} t={t} hoodie="#24365E" cap="#E3A325" detail="tape" />
      <Hero x={540} y={760} t={t + 1} hoodie="#6B7A3A" cap="#8E2B2B" detail="pack" brows={3} />
      <Hero x={890} y={760} t={t + 2} hoodie="#8A8F98" cap="#C8352A" detail="radio" brows={-2} />
      <Dog x={190} y={1640} t={t} body="#D9893A" belly="#F6E2C4" kind="bublik" />
      <Dog x={520} y={1640} t={t + 1} body="#E08A3C" belly="#FFFFFF" kind="corgi" />
      <Dog x={860} y={1640} t={t + 2} body="#8C96A3" belly="#F2F4F7" kind="husky" />
    </svg>
    <Label x={190} y={790} name="1. ТИМУР" sub="изолента + мультитул" />
    <Label x={540} y={790} name="2. ЛЁВА" sub="рюкзак + фонарик" />
    <Label x={890} y={790} name="3. САНЯ" sub="рация + светоотраж." />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1010, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 56, color: DAY.ink }}>СОБАКИ</div>
    <Label x={210} y={1670} name="А. БУБЛИК" sub="рыжая дворняга" />
    <Label x={540} y={1670} name="Б. КОРГИ" sub="рыже-белый" />
    <Label x={870} y={1670} name="В. ХАСКИ-МЕТИС" sub="серо-белый" />
  </AbsoluteFill>);
};
