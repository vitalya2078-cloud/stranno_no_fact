// ЭПИЗОД 1 «Блэкаут × лифт». Время — секунды голоса (после atempo 1.08).
// Композиция кадра: верх 0–1050 — схемы/плашки; 1075–1420 — зона субтитров (пусто); низ 1440–1920 — кабина с героями.
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import plan from "./plan.json";
import { Captions, DAY, EASE, F, FPS, Grain, Hud, Mono, NIGHT, Ribbon, Transition, Tr, ez, insertPauses, phrases, useT } from "./kit";

// паузы, вставленные в голос по просьбе владельца: после «тока нет» (0,4 с) и после «он так устроен» (0,25 с)
insertPauses([[23.36, 0.4], [24.40, 0.25]]);
import { SANYA } from "./rig";
import { Bublik2, DOG_POSES, dogWalk, Hero2, POSES, walkPose, WALK_SPEED_PER_CYCLE } from "./rig2";

const W = 1080;
const TAIL = 2.2;                                   // завершающая картинка после последней фразы (решение владельца)
export const TOTAL = plan.total + Math.round(TAIL * FPS);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ===================================================================== СХЕМА: разрез дома и шахты (ночь)
const Shaft: React.FC<{ cabY: number; gap?: number; ropes?: number; vents?: number; dim?: number }> = ({ cabY, gap = 0, ropes = -1, vents = 0, dim = 0 }) => {
  const t = useT();
  const floors = Array.from({ length: 9 }, (_, i) => 200 + i * 100);
  return (<svg width={W} height={1100} style={{ position: "absolute", top: 0 }}>
    {floors.map((y, i) => (<g key={i}>
      <line x1={120} y1={y} x2={430} y2={y} stroke={NIGHT.line} strokeWidth={3} opacity={0.7} />
      <line x1={650} y1={y} x2={960} y2={y} stroke={NIGHT.line} strokeWidth={3} opacity={0.7} />
      <text x={150} y={y - 14} fontFamily={F.mono} fontWeight={700} fontSize={34} fill={NIGHT.line} opacity={0.8}>{11 - i}</text>
      {[0, 1].map((k) => <rect key={k} x={200 + k * 120 + (k ? 0 : 40)} y={y - 70} width={70} height={44} fill={dim ? "#141C30" : (i + k) % 3 ? "#1B2644" : NIGHT.window} opacity={dim ? 1 : 0.9} />)}
    </g>))}
    {/* шахта и машинное помещение */}
    <rect x={430} y={110} width={220} height={900} fill="#0E1424" stroke={NIGHT.line} strokeWidth={4} />
    <rect x={430} y={60} width={220} height={60} fill="#16203A" stroke={NIGHT.line} strokeWidth={4} />
    <circle cx={540} cy={90} r={22} fill="none" stroke={NIGHT.line} strokeWidth={4} />
    {/* направляющие */}
    <line x1={448} y1={120} x2={448} y2={1010} stroke="#5D6B8A" strokeWidth={6} /><line x1={632} y1={120} x2={632} y2={1010} stroke="#5D6B8A" strokeWidth={6} />
    {/* канаты */}
    {[510, 530, 550, 570].map((x, i) => <line key={i} x1={x} y1={112} x2={x} y2={cabY} stroke={ropes === i ? NIGHT.ok : ropes >= 4 ? NIGHT.ok : "#9AA6BF"} strokeWidth={ropes === i || ropes >= 4 ? 6 : 3} />)}
    {/* кабина */}
    <rect x={460} y={cabY} width={160} height={150} rx={6} fill="#26324F" stroke={NIGHT.text} strokeWidth={4} />
    <rect x={505} y={cabY + 30} width={70} height={90} fill={dim ? "#0B0F1A" : "#FFD9A0"} opacity={dim ? 1 : 0.5} />
    {vents > 0 ? [0, 1, 2].map((k) => <g key={k} opacity={vents}><rect x={470} y={cabY + 12 + k * 6} width={30} height={3} fill={NIGHT.text} />
      <path d={`M${440 - ((t * 60 + k * 20) % 60)},${cabY + 60 + k * 26} h40 l-10,-8 m10,8 l-10,8`} fill="none" stroke={NIGHT.ok} strokeWidth={4} /></g>) : null}
    {/* щель и стрелка в шахту */}
    {gap > 0 ? <g opacity={gap}>
      <rect x={620} y={cabY + 150} width={30} height={160} fill="#000" stroke={NIGHT.danger} strokeWidth={4} strokeDasharray="10 8" />
      <path d={`M635,${cabY + 180} v${100 + 20 * Math.sin(t * 6)} m-16,-18 l16,18 l16,-18`} fill="none" stroke={NIGHT.danger} strokeWidth={6} />
    </g> : null}
  </svg>);
};

// ===================================================================== СХЕМА: лебёдка с тормозом (ток → 0, колодки зажаты)
const Winch: React.FC<{ at: number }> = ({ at }) => {
  const t = useT(); const k = ez(t, at, at + 0.6);
  return (<svg width={W} height={1100} style={{ position: "absolute", top: 0 }}>
    <rect x={140} y={300} width={800} height={600} rx={20} fill="#0E1424" stroke={NIGHT.line} strokeWidth={4} />
    <rect x={200} y={460} width={220} height={180} rx={14} fill="#1B2644" stroke={NIGHT.line} strokeWidth={4} />
    <text x={310} y={560} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={36} fill={NIGHT.text}>МОТОР</text>
    <line x1={420} y1={550} x2={520} y2={550} stroke={NIGHT.line} strokeWidth={10} />
    <circle cx={640} cy={550} r={120} fill="#16203A" stroke={NIGHT.text} strokeWidth={5} />
    <circle cx={640} cy={550} r={22} fill={NIGHT.text} />
    {[0, 1, 2, 3].map((i) => <line key={i} x1={560 + i * 50} y1={670} x2={560 + i * 50} y2={900} stroke="#9AA6BF" strokeWidth={4} />)}
    {/* колодки тормоза: при k=1 прижаты к барабану */}
    <rect x={lerp(450, 498, k)} y={500} width={24} height={100} rx={6} fill={k > 0.9 ? NIGHT.ok : NIGHT.window} />
    <rect x={lerp(806, 758, k)} y={500} width={24} height={100} rx={6} fill={k > 0.9 ? NIGHT.ok : NIGHT.window} />
    {[0, 1].map((i) => <path key={i} d={i ? `M${lerp(830, 782, k)},550 h${lerp(70, 118, k)}` : `M${lerp(450, 498, k)},550 h${-lerp(70, 118, k)}`} stroke={NIGHT.text} strokeWidth={6} />)}
    {/* значок питания: ток пропал */}
    <g transform="translate(310,380)" opacity={1 - 0.6 * k}><circle r={36} fill="none" stroke={k > 0.5 ? NIGHT.danger : NIGHT.window} strokeWidth={6} />
      <path d="M0,-30 v28" stroke={k > 0.5 ? NIGHT.danger : NIGHT.window} strokeWidth={6} strokeLinecap="round" /></g>
  </svg>);
};

// ===================================================================== СХЕМА: ловители — клинья вцепляются в направляющую
const Catchers: React.FC<{ at: number }> = ({ at }) => {
  const t = useT(); const k = ez(t, at, at + 0.5); const slide = (1 - k) * Math.max(0, Math.min(1, (t - at + 1.5) / 1.5)) * 60;
  return (<svg width={W} height={1100} style={{ position: "absolute", top: 0 }}>
    <rect x={500} y={150} width={80} height={850} fill="#5D6B8A" stroke={NIGHT.text} strokeWidth={4} />
    <rect x={520} y={150} width={40} height={850} fill="#7A88A8" />
    <g transform={`translate(0,${slide})`}>
      <rect x={300} y={480} width={480} height={160} rx={12} fill="#26324F" stroke={NIGHT.text} strokeWidth={4} />
      <path d={`M${lerp(420, 470, k)},500 l30,0 l0,120 l-30,0 l-20,-60z`} fill={k > 0.9 ? NIGHT.ok : NIGHT.window} />
      <path d={`M${lerp(660, 610, k)},500 l-30,0 l0,120 l30,0 l20,-60z`} fill={k > 0.9 ? NIGHT.ok : NIGHT.window} />
      {k > 0.9 ? [0, 1, 2].map((i) => <line key={i} x1={485} y1={510 + i * 50} x2={500} y2={510 + i * 50} stroke={NIGHT.ok} strokeWidth={4} />) : null}
    </g>
  </svg>);
};

// ===================================================================== КАБИНА изнутри (низ кадра): свет, двери, табло, герои
const Cabin: React.FC<{ light: "on" | "dark" | "phone" | "open"; doors?: number; shake?: number; floor?: string; hero: React.ReactNode }> = ({ light, doors = 0, shake = 0, floor = "7", hero }) => {
  const t = useT(); const sx = shake * Math.sin(t * 70) * 10;
  const bg = light === "on" ? "#3A4566" : light === "open" ? "#2C3757" : "#121A2B";
  return (<div style={{ position: "absolute", left: 40, top: 1440, width: 1000, height: 480, overflow: "hidden", borderRadius: 18, transform: `translateX(${sx}px)`,
    background: bg, boxShadow: "inset 0 0 0 4px #5D6B8A" }}>
    <svg width={1000} height={480} style={{ position: "absolute" }}>
      {/* двери (слева), щель между створками */}
      <rect x={30} y={30} width={300} height={450} fill={light === "on" ? "#56648A" : "#1E2843"} />
      <rect x={30 + 150 - doors * 60} y={30} width={doors * 120} height={450} fill={light === "open" ? "#FFE9A8" : "#000"} opacity={light === "open" ? 0.9 : 1} />
      <line x1={180} y1={30} x2={180} y2={480} stroke="#0B0F1A" strokeWidth={4} opacity={doors > 0 ? 0 : 1} />
      {/* табло и панель кнопок */}
      <rect x={380} y={40} width={110} height={56} rx={8} fill="#0B0F1A" />
      <text x={435} y={82} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={40} fill={light === "dark" || light === "phone" ? "#3a2020" : NIGHT.danger}>{floor}</text>
      <rect x={900} y={120} width={60} height={200} rx={8} fill="#2A3350" />
      {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={930} cy={145 + i * 28} r={9} fill={light === "on" ? "#C9D3E8" : "#3A4566"} />)}
      <circle cx={930} cy={300} r={12} fill="#F5C518" />
      {/* аварийный свет / свет телефона */}
      {light === "phone" ? <circle cx={560} cy={300} r={260} fill="#BFE6FF" opacity={0.12} /> : null}
      {light === "dark" ? <rect width={1000} height={480} fill="#000" opacity={0.35} /> : null}
      {light === "open" ? <path d="M180,30 L700,480 L-200,480z" fill="#FFE9A8" opacity={0.18} /> : null}
    </svg>
    <svg width={1000} height={480} style={{ position: "absolute" }}>{hero}</svg>
  </div>);
};

// ===================================================================== ПЛАН из 5 пунктов (блокнот, пункты появляются по словам)
const STEPS: [number, string][] = [[39.5, "Кнопка связи → адрес"], [43.9, "Не жать всё подряд"], [47.1, "Яркость телефона ↓"], [51.8, "Сесть на пол"], [57.2, "Соседи → аварийка"]];
const Plan: React.FC = () => {
  const t = useT(); const s = ez(t, 38.9, 39.4);
  if (s <= 0) return null;
  return (<div style={{ position: "absolute", left: 90, top: 150, width: 900, padding: "36px 44px 28px", background: DAY.paper, borderRadius: 8, transform: `rotate(-1.5deg) scale(${0.94 + 0.06 * s})`,
    opacity: s, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", backgroundImage: "repeating-linear-gradient(transparent 0 76px, #c9d6e8 76px 78px)" }}>
    <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 70, color: DAY.ink, lineHeight: 1 }}>План, если застрял</div>
    {STEPS.map(([at, txt], i) => { const k = ez(t, at, at + 0.35); const done = t > (STEPS[i + 1]?.[0] ?? 63.6);
      return <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 18, opacity: k, transform: `translateX(${(1 - k) * 30}px)`, lineHeight: 1 }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, background: done ? NIGHT.ok : "#F5C518", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F.black, fontWeight: 900, fontSize: 34, color: DAY.ink }}>{done ? "✓" : i + 1}</div>
        <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 56, color: DAY.ink }}>{txt}</div></div>; })}
  </div>);
};

// ===================================================================== телефон крупно: заряд (одиночное число — можно прокрутить)
const Phone: React.FC<{ from: number; to: number; at: number }> = ({ from, to, at }) => {
  const t = useT(); const v = Math.round(interpolate(t, [at, at + 0.8], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }));
  return (<div style={{ position: "absolute", left: 340, top: 250, width: 400, height: 760, borderRadius: 56, background: "#111", border: "8px solid #2A2A2A", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
    <div style={{ position: "absolute", inset: 24, borderRadius: 36, background: "linear-gradient(#1B2644, #0B0F1A)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 200, height: 92, border: "6px solid #E8EEF8", borderRadius: 14, position: "relative" }}>
        <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: `${(v / 100) * 176}px`, background: v < 10 ? NIGHT.danger : "#F5C518", borderRadius: 6 }} />
        <div style={{ position: "absolute", right: -20, top: 26, width: 12, height: 28, background: "#E8EEF8", borderRadius: 3 }} /></div>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 96, color: v < 10 ? NIGHT.danger : "#E8EEF8", marginTop: 30 }}>{v}%</div>
    </div></div>);
};

// ===================================================================== СЦЕНЫ
type Scene = { t0: number; t1: number; el: React.ReactNode; tr?: Tr };
const HeroAt: React.FC<{ pose: any; x?: number; dog?: any; dx?: number; flip?: boolean }> = ({ pose, x = 560, dog, dx = 800, flip = false }) => { const t = useT();
  return <><Hero2 look={SANYA} pose={pose} x={x} y={460} s={0.62} t={t} flip={flip} />{dog ? <Bublik2 pose={dog} x={dx} y={462} s={0.55} flip t={t} /> : null}</>; };

const S1 = () => { const t = useT(); return <><Shaft cabY={lerp(560, 520, ez(t, 0, 3))} />
  <Hud x={660} y={360} at={0.4} title="КАБИНА" sub="держится" tone="good" to={[620, 600]} w={360} />
  <Cabin light="on" floor="7" hero={<HeroAt pose={{ ...POSES.stand, view: "side" }} dog={DOG_POSES.stand} />} /></>; };
const S2 = () => { const t = useT(); return <><Shaft cabY={lerp(560, 470, ez(t, 3.1, 5.6))} />
  <Mono x={60} y={110} at={3.2} text="ДЕНЬ 1 — 19:42" />
  <Cabin light="on" floor={t < 4.4 ? "7" : "8"} hero={<HeroAt pose={{ ...POSES.phone, view: "side", prop: "none", armF: [30, 80], mouth: "smile" }} dog={DOG_POSES.alert} />} /></>; };
const S3 = () => { const t = useT(); const stop = ez(t, 6.4, 7.6); return <><Shaft cabY={lerp(470, 445, stop)} dim={1} />
  <Hud x={660} y={330} at={7.8} title="СТОП" sub="между 8 и 9" tone="danger" to={[620, 520]} w={360} />
  <Cabin light="dark" shake={t > 6.4 && t < 7.4 ? 1 : 0} floor="8" hero={<HeroAt pose={{ ...POSES.overShoulder, mouth: "o" }} dog={{ ...DOG_POSES.alert, earUp: 1 }} />} /></>; };
const S4 = () => { const t = useT(); return <><Shaft cabY={445} dim={1} />
  <Cabin light="phone" doors={ez(t, 12.1, 13.2) * 0.6} floor="8" hero={<HeroAt x={470} flip pose={{ ...POSES.point, mouth: "flat", look: 1, armF: [70, 10] }} dog={DOG_POSES.alert} dx={780} />} /></>; };
const S5 = () => { const t = useT(); return <><Shaft cabY={445} dim={1} gap={ez(t, 13.9, 14.4)} />
  <Ribbon at={14.3} until={16.8} text="ЩЕЛЬ = ЛОВУШКА" y={760} />
  <Cabin light="phone" doors={0.6} floor="8" hero={<HeroAt x={520} pose={{ ...POSES.stand, view: "side", brows: 0.8, mouth: "worried" }} dog={DOG_POSES.sniff} dx={800} />} /></>; };
const DarkCabin = () => <Cabin light="phone" floor="8" hero={<HeroAt pose={{ ...POSES.stand, view: "side", look: 0.3 }} dog={DOG_POSES.alert} />} />;
const S6 = () => <><Winch at={20.6} /><DarkCabin /><Hud x={150} y={150} at={20.7} title="ТОК: 0" sub="тормоз зажат" tone="good" w={420} />
  <Mono x={600} y={180} at={18.0} text="ЛЕБЁДКА" /></>;
const S7 = () => <><Catchers at={26.8} /><DarkCabin /><Hud x={90} y={150} at={27.1} title="ЛОВИТЕЛИ" sub="клинья держат" tone="good" to={[460, 560]} w={420} /></>;
const S8 = () => { const t = useT(); const r = t < 30.8 ? -1 : t < 31.3 ? Math.floor((t - 30.8) / 0.125) : 4;
  return <><Shaft cabY={445} dim={1} ropes={r} /><Hud x={660} y={180} at={30.9} title="КАНАТЫ" sub="несколько" tone="good" to={[570, 300]} w={360} />
    <Mono x={60} y={1000} at={31.9} text="ЗАЛОЖЕНО ПРИ ПРОЕКТЕ" color={NIGHT.ok} size={38} /><DarkCabin /></>; };
const S9 = () => { const t = useT(); return <><Shaft cabY={445} dim={1} vents={ez(t, 35.9, 36.6)} />
  <Hud x={660} y={330} at={37.0} title="ВОЗДУХ" sub="хватит" tone="good" to={[460, 500]} w={360} /><DarkCabin /></>; };
const S10 = () => { const t = useT();
  const pose = t < 51.8 ? { ...POSES.phone, view: "side" as const } : POSES.crouch;
  const dog = t < 55.3 ? DOG_POSES.alert : DOG_POSES.lie;
  return <><Plan />
    {t > 57.2 && t < 63.6 ? <Hud x={560} y={840} at={58.4} title="АВАРИЙКА" sub="звонят соседи" tone="res" w={440} /> : null}
    <Cabin light="phone" floor="8" hero={<HeroAt pose={pose} dog={dog} />} /></>; };
const S11 = () => { const t = useT(); const o = ez(t, 65.0, 66.2); return <>
  <Mono x={60} y={110} at={63.8} text="ДЕНЬ 1 — 20:22" />
  <Hud x={120} y={300} at={65.2} title="ЛИФТЁР" sub="ключ снаружи" tone="good" w={420} />
  <Cabin light={o > 0.2 ? "open" : "phone"} doors={o} floor="8" hero={<HeroAt pose={{ ...POSES.stand, view: "side", mouth: "smile", look: -0.5 }} dog={{ ...DOG_POSES.stand, tail: 1.6 }} />} /></>; };
const S12 = () => <AbsoluteFill style={{ background: `linear-gradient(${NIGHT.bg1}, ${NIGHT.bg2})` }}><div style={{ position: "absolute", left: 0, top: -60, width: 1080, height: 1100 }}><Phone from={12} to={9} at={70.6} /></div>
  <Hud x={60} y={110} at={69.0} title="ЛИФТ" sub="не упал" tone="good" w={360} /><Hud x={660} y={110} at={70.0} title="ЗАРЯД" sub="упал" tone="danger" w={360} />
  <Cabin light="open" doors={1} floor="8" hero={<HeroAt pose={{ ...POSES.phone, view: "side", mouth: "smile" }} dog={{ ...DOG_POSES.stand, tail: 1.6 }} />} /></AbsoluteFill>;
const S13 = () => { const t = useT(); const CYC = 1.1, s = 0.62, v = (WALK_SPEED_PER_CYCLE * s) / CYC; const x = 300 + (t - 71.8) * v;
  return <AbsoluteFill style={{ background: `linear-gradient(${NIGHT.bg1}, #1B2644)` }}>
    <svg width={W} height={1920} style={{ position: "absolute" }}>
      <rect x={0} y={1700} width={W} height={220} fill="#2C3757" />
      <rect x={120} y={1260} width={300} height={440} fill="#FFE9A8" opacity={0.85} /><path d="M120,1700 L420,1700 L760,1920 L-220,1920z" fill="#FFE9A8" opacity={0.15} />
      {x < 560 ? <><Hero2 look={SANYA} pose={walkPose(((t - 71.8) / CYC) % 1, { mouth: "smile" })} x={x} y={1760} s={s} t={t} />
        <Bublik2 pose={dogWalk(((t - 71.8) / 0.55) % 1)} x={x + 230} y={1765} s={0.55} t={t} /></>
        : <><Hero2 look={SANYA} pose={{ ...POSES.stand, view: "q34", mouth: "smile", look: -0.6 }} x={560} y={1760} s={s} t={t} />
        <Bublik2 pose={DOG_POSES.sit} x={800} y={1765} s={0.55} t={t} /></>}
    </svg>
    <Mono x={60} y={110} at={71.9} text="ДЕНЬ 1 — 20:25" />
    <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 84, color: "#F5C518", lineHeight: 1.05,
      opacity: ez(t, 74.3, 74.8) }}>А ТЫ БЫ ЧТО<br />СДЕЛАЛ ПЕРВЫМ?</div>
  </AbsoluteFill>; };

const SCENES: Scene[] = [
  { t0: 0, t1: 3.1, el: <S1 /> }, { t0: 3.1, t1: 5.7, el: <S2 />, tr: "cut" }, { t0: 5.7, t1: 9.8, el: <S3 />, tr: "lightsOut" },
  { t0: 9.8, t1: 13.8, el: <S4 />, tr: "cut" }, { t0: 13.8, t1: 17.6, el: <S5 />, tr: "zoom" }, { t0: 17.6, t1: 24.5, el: <S6 />, tr: "wipe" },
  { t0: 24.5, t1: 30.2, el: <S7 />, tr: "cut" }, { t0: 30.2, t1: 35.6, el: <S8 />, tr: "wipe" }, { t0: 35.6, t1: 38.8, el: <S9 />, tr: "cut" },
  { t0: 38.8, t1: 63.7, el: <S10 />, tr: "wipe" }, { t0: 63.7, t1: 68.8, el: <S11 />, tr: "cut" }, { t0: 68.8, t1: 71.8, el: <S12 />, tr: "zoom" },
  { t0: 71.8, t1: 999, el: <S13 />, tr: "wipe" },
];
const P = phrases(plan.groups);
export const Video: React.FC = () => {
  const t = useT();
  const s = SCENES.find((x) => t >= x.t0 && t < x.t1) ?? SCENES[SCENES.length - 1];
  const k = interpolate(t, [s.t0, Math.min(s.t1, s.t0 + 8)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (<AbsoluteFill style={{ background: `linear-gradient(${NIGHT.bg1}, ${NIGHT.bg2})`, overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: `scale(${1 + 0.03 * k + (s.tr === "zoom" ? 0.06 * Math.exp(-(t - s.t0) * 5) : 0)})` }}>{s.el}</AbsoluteFill>
    {SCENES.slice(1).map((x, i) => <Transition key={i} at={x.t0} kind={x.tr ?? "cut"} />)}
    <Captions P={P} color={{ упадет: "res", шахту: "danger", тормоз: "res", ловители: "res", воздуха: "res", диспетчером: "res", двери: "danger", яркость: "res", пол: "res", аварийную: "res", лифтер: "res", заряд: "danger", первым: "res" }} />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>);
};
