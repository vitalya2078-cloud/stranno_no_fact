// ЭТАП 4: листы персонажей, тест ходьбы, пробные кадры «день» и «ночь», 5-секундный тест караоке.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Captions, DAY, F, Grain, Haze, Hud, Mono, NIGHT, Timer } from "./kit";
import { LEV, Look, Pose, SANYA, TIMUR } from "./rig";
import { Bublik2 as Bublik, DOG_POSES, dogWalk, Hero2 as Hero, POSES, WALK_SPEED_PER_CYCLE, walkPose } from "./rig2";

const useT = () => useCurrentFrame() / 30;
const Lbl: React.FC<{ x: number; y: number; text: string; c?: string; size?: number }> = ({ x, y, text, c = DAY.ink, size = 34 }) =>
  <div style={{ position: "absolute", left: x - 160, top: y, width: 320, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: size, color: c }}>{text}</div>;

// ------------------------------------------------------------------ лист героя: 3 вида + 8 поз
const POSE_LIST: [string, string][] = [["sit", "сидит"], ["walk", "идёт"], ["crouch", "присел"], ["phone", "телефон"], ["overShoulder", "через плечо"], ["point", "указывает"], ["write", "пишет"], ["lamp", "фонарь"]];
const HeroSheet: React.FC<{ look: Look }> = ({ look }) => {
  const t = useT();
  return (<AbsoluteFill style={{ background: DAY.paper }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 64, color: DAY.ink }}>{look.name.toUpperCase()}</div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {([["front", 190], ["side", 540], ["q34", 890]] as const).map(([v, x]) => <Hero key={v} look={look} pose={{ ...POSES.stand, view: v }} x={x} y={720} s={0.95} t={t} />)}
      <line x1={60} y1={830} x2={1020} y2={830} stroke="#C9C0A8" strokeWidth={3} />
      {POSE_LIST.map(([k], i) => { const x = 140 + (i % 4) * 267, y = 1270 + Math.floor(i / 4) * 520;
        const p: Pose = k === "walk" ? walkPose((t * 0.9) % 1) : POSES[k];
        return <Hero key={k} look={look} pose={p} x={x} y={y} s={0.62} t={t + i} />; })}
    </svg>
    {["анфас", "профиль", "3/4"].map((l, i) => <Lbl key={l} x={190 + i * 350} y={760} text={l} />)}
    {POSE_LIST.map(([, l], i) => <Lbl key={l} x={140 + (i % 4) * 267} y={1300 + Math.floor(i / 4) * 520} text={l} size={30} />)}
  </AbsoluteFill>);
};
export const SheetTimur = () => <HeroSheet look={TIMUR} />;
export const SheetLev = () => <HeroSheet look={LEV} />;
export const SheetSanya = () => <HeroSheet look={SANYA} />;

// ------------------------------------------------------------------ лист собаки
export const SheetDog: React.FC = () => {
  const t = useT();
  const items: [string, React.ReactNode][] = [
    ["стоит", <Bublik pose={DOG_POSES.stand} x={0} y={0} t={t} />], ["идёт", <Bublik pose={dogWalk((t * 1.4) % 1)} x={0} y={0} t={t} />],
    ["сидит", <Bublik pose={DOG_POSES.sit} x={0} y={0} t={t} />], ["лежит", <Bublik pose={DOG_POSES.lie} x={0} y={0} t={t} />],
    ["нюхает", <Bublik pose={DOG_POSES.sniff} x={0} y={0} t={t} />], ["насторожился", <Bublik pose={DOG_POSES.alert} x={0} y={0} t={t} />]];
  return (<AbsoluteFill style={{ background: DAY.paper }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 64, color: DAY.ink }}>БУБЛИК</div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {items.map(([, el], i) => <g key={i} transform={`translate(${290 + (i % 2) * 500},${520 + Math.floor(i / 2) * 520}) scale(1.25)`}>{el}</g>)}
    </svg>
    {items.map(([l], i) => <Lbl key={l} x={290 + (i % 2) * 500} y={560 + Math.floor(i / 2) * 520} text={l} />)}
  </AbsoluteFill>);
};

// ------------------------------------------------------------------ тест ходьбы: стопы не скользят (тело едет со скоростью шага)
export const WalkTest: React.FC = () => {
  const t = useT(); const CYC = 1.1;                       // секунд на цикл (2 шага)
  const s = 0.62, v = (WALK_SPEED_PER_CYCLE * s) / CYC;
  const x = -150 + ((t * v) % 1400);
  return (<AbsoluteFill style={{ background: `linear-gradient(${DAY.sky1}, ${DAY.sky2} 55%, ${DAY.field} 55%)` }}>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {Array.from({ length: 20 }, (_, i) => <rect key={i} x={i * 60} y={1180} width={4} height={14} fill={DAY.grass} />)}
      <Hero look={TIMUR} pose={walkPose((t / CYC) % 1)} x={x} y={1180} s={s} t={t} />
      <Bublik pose={dogWalk((t / 0.55) % 1)} x={x - 230} y={1185} s={0.62} t={t} />
    </svg>
    <Mono x={60} y={120} at={0} text="ТЕСТ ХОДЬБЫ" color={DAY.ink} />
  </AbsoluteFill>);
};

// ------------------------------------------------------------------ ДЕНЬ: ферма (палитра DAY)
export const FrameDay: React.FC = () => {
  const t = useT();
  return (<AbsoluteFill style={{ background: `linear-gradient(${DAY.sky1}, ${DAY.sky2} 46%)` }}>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs><filter id="b6"><feGaussianBlur stdDeviation="6" /></filter><filter id="b14"><feGaussianBlur stdDeviation="14" /></filter></defs>
      {/* дальние холмы в дымке */}
      <path d="M0,880 q200,-90 420,-30 t520,-40 t260,20 V1100 H0z" fill="#9FB0A0" filter="url(#b6)" />
      <path d="M0,960 q260,-80 540,-10 t540,-20 V1150 H0z" fill={DAY.field} opacity={0.85} />
      {/* амбар */}
      <g transform="translate(640,760)">
        <path d="M0,200 V60 l120,-80 l120,80 V200z" fill={DAY.barn} stroke={DAY.olive} strokeWidth={3} />
        <path d="M-12,64 l132,-90 l132,90" fill="none" stroke={DAY.paper} strokeWidth={10} strokeLinejoin="round" />
        <rect x={80} y={110} width={80} height={90} fill={DAY.olive} /><path d="M80,110 l80,90 M160,110 l-80,90" stroke={DAY.paper} strokeWidth={6} />
        <rect x={100} y={40} width={40} height={30} fill={DAY.paper} />
      </g>
      {/* поле, трава, забор */}
      <rect x={0} y={1060} width={1080} height={860} fill={DAY.field} />
      <path d="M0,1060 q540,-30 1080,0 V1120 H0z" fill={DAY.grass} opacity={0.6} />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={40 + i * 90} y={1000} width={14} height={90} rx={4} fill={DAY.olive} />)}
      <rect x={30} y={1020} width={1020} height={10} fill={DAY.olive} /><rect x={30} y={1055} width={1020} height={10} fill={DAY.olive} />
      {/* дерево */}
      <g transform="translate(150,1020)"><rect x={-10} y={-160} width={20} height={160} rx={8} fill={DAY.olive} />
        <circle cx={0} cy={-200} r={90} fill={DAY.grass} /><circle cx={-60} cy={-160} r={60} fill="#5d6b40" /><circle cx={60} cy={-170} r={64} fill="#5d6b40" /></g>
      <Hero look={LEV} pose={{ ...POSES.point, look: 1 }} x={380} y={1360} s={0.9} t={t} />
      <Bublik pose={DOG_POSES.sit} x={700} y={1370} s={0.8} t={t} />
      {/* размытый передний план */}
      <g filter="url(#b14)">{Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${i * 80},1920 q20,-180 40,-260 q10,90 30,260z`} fill={DAY.olive} />)}</g>
    </svg>
    <Haze color="#ffffff" from={0.4} to={0.58} />
    <Mono x={60} y={110} at={0} text="ДЕНЬ 1 — 09:12" color={DAY.ink} />
    <Hud x={560} y={190} at={0} title="КОЛОДЕЦ" sub="вода: 30 м" tone="good" to={[900, 990]} w={430} />
    <Grain o={0.025} />
  </AbsoluteFill>);
};

// ------------------------------------------------------------------ НОЧЬ: блэкаут, разрез дома (палитра NIGHT)
export const FrameNight: React.FC = () => {
  const t = useT();
  return (<AbsoluteFill style={{ background: `linear-gradient(${NIGHT.bg1}, ${NIGHT.bg2})` }}>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {/* разрез дома: этажи линиями схемы, одно тёплое окно */}
      {Array.from({ length: 9 }, (_, i) => (<g key={i}>
        <rect x={120} y={160 + i * 110} width={840} height={104} fill="none" stroke={NIGHT.line} strokeWidth={2} opacity={0.6} />
        {[0, 1, 2, 3].map((k) => <rect key={k} x={170 + k * 200} y={190 + i * 110} width={110} height={52} fill={i === 6 && k === 1 ? NIGHT.window : "#16203A"} opacity={i === 6 && k === 1 ? 0.85 + 0.15 * Math.sin(t * 3) : 1} />)}
      </g>))}
      <rect x={120} y={1150} width={840} height={8} fill={NIGHT.line} opacity={0.6} />
      {/* интерьер «нашего» этажа крупно */}
      <rect x={60} y={1160} width={960} height={760} fill="#141C30" />
      <circle cx={380} cy={1700} r={230} fill={NIGHT.window} opacity={0.1} />
      <Hero look={SANYA} pose={POSES.lamp} x={300} y={1880} s={0.6} t={t} />
      <Bublik pose={DOG_POSES.alert} x={720} y={1885} s={0.6} t={t} />
      <line x1={420} y1={1010} x2={420} y2={1160} stroke={NIGHT.window} strokeWidth={3} strokeDasharray="8 8" />
    </svg>
    <Mono x={60} y={70} at={0} text="НОЧЬ — 23:40" />
    <Hud x={560} y={930} at={0} title="ВОДА В ТРУБАХ" sub="давление падает" tone="danger" w={450} />
    <Timer x={60} y={950} at={0} from={269} to={0} dur={270} />
    <Grain o={0.03} />
  </AbsoluteFill>);
};

// ------------------------------------------------------------------ 5-секундный тест караоке (синтетические тайминги слов)
const TXT = "Если свет пропал на месяц, а ты на двадцатом этаже — не беги вниз.".split(" ");
const WORDS = TXT.map((w, i) => ({ text: w, start: 6 + i * 11, end: 6 + i * 11 + 10 }));
const P = [WORDS.slice(0, 7), WORDS.slice(7)];
export const KaraokeTest: React.FC = () => (<AbsoluteFill>
  <FrameNight />
  <Captions P={P} color={{ вниз: "danger", месяц: "res" }} />
</AbsoluteFill>);
