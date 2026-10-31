// Сравнение «было → стало» и листы v2 (живые персонажи без шарниров).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DAY, F } from "./kit";
import { Bublik, DOG_POSES as D1, Hero, POSES as P1, TIMUR, LEV, SANYA, Look } from "./rig";
import { Bublik2, DOG_POSES as D2, dogWalk, Hero2, POSES as P2, walkPose } from "./rig2";

const useT = () => useCurrentFrame() / 30;
const L: React.FC<{ x: number; y: number; t: string; size?: number }> = ({ x, y, t, size = 30 }) =>
  <div style={{ position: "absolute", left: x - 170, top: y, width: 340, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: size, color: DAY.ink }}>{t}</div>;

export const Compare: React.FC = () => {
  const t = useT();
  const cols: [string, number][] = [["стоит 3/4", 150], ["профиль", 410], ["присел", 670], ["сидит", 930]];
  const keys = ["stand", "side", "crouch", "sit"];
  const p1 = (k: string) => k === "side" ? { ...P1.stand, view: "side" as const } : P1[k];
  const p2 = (k: string) => k === "side" ? { ...P2.stand, view: "side" as const } : P2[k];
  return (<AbsoluteFill style={{ background: DAY.paper }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 30, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 52, color: DAY.ink }}>БЫЛО → СТАЛО</div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {keys.map((k, i) => <Hero key={"a" + k} look={TIMUR} pose={p1(k)} x={cols[i][1]} y={560} s={0.62} t={t} />)}
      {keys.map((k, i) => <Hero2 key={"b" + k} look={TIMUR} pose={p2(k)} x={cols[i][1]} y={1060} s={0.62} t={t} />)}
      <line x1={40} y1={1120} x2={1040} y2={1120} stroke="#C9C0A8" strokeWidth={3} />
      <g transform="translate(150,1440) scale(0.75)"><Bublik pose={D1.stand} x={0} y={0} t={t} /></g>
      <g transform="translate(150,1800) scale(0.75)"><Bublik2 pose={D2.stand} x={0} y={0} t={t} /></g>
      <g transform="translate(540,1440) scale(0.75)"><Bublik pose={D1.sit} x={0} y={0} t={t} /></g>
      <g transform="translate(540,1800) scale(0.75)"><Bublik2 pose={D2.sit} x={0} y={0} t={t} /></g>
      <g transform="translate(900,1440) scale(0.75)"><Bublik pose={D1.alert} x={0} y={0} t={t} /></g>
      <g transform="translate(900,1800) scale(0.75)"><Bublik2 pose={D2.alert} x={0} y={0} t={t} /></g>
    </svg>
    <L x={540} y={90} t="БЫЛО (v1)" size={34} /><L x={540} y={600} t="СТАЛО (v2)" size={34} />
    {cols.map(([n, x]) => <L key={n} x={x} y={1080} t={n} size={26} />)}
    <L x={150} y={1820} t="стоит" size={26} /><L x={540} y={1820} t="сидит" size={26} /><L x={900} y={1820} t="насторожился" size={26} />
  </AbsoluteFill>);
};

const POSE_LIST: [string, string][] = [["sit", "сидит"], ["walk", "идёт"], ["crouch", "присел"], ["phone", "телефон"], ["overShoulder", "через плечо"], ["point", "указывает"], ["write", "пишет"], ["lamp", "фонарь"]];
const Sheet2: React.FC<{ look: Look }> = ({ look }) => {
  const t = useT();
  return (<AbsoluteFill style={{ background: DAY.paper }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 64, color: DAY.ink }}>{look.name.toUpperCase()}</div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {([["front", 190], ["side", 540], ["q34", 890]] as const).map(([v, x]) => <Hero2 key={v} look={look} pose={{ ...P2.stand, view: v }} x={x} y={720} s={0.95} t={t} />)}
      <line x1={60} y1={830} x2={1020} y2={830} stroke="#C9C0A8" strokeWidth={3} />
      {POSE_LIST.map(([k], i) => <Hero2 key={k} look={look} pose={k === "walk" ? walkPose((t * 0.9) % 1) : P2[k]} x={140 + (i % 4) * 267} y={1270 + Math.floor(i / 4) * 520} s={0.62} t={t + i} />)}
    </svg>
    {["анфас", "профиль", "3/4"].map((l, i) => <L key={l} x={190 + i * 350} y={760} t={l} size={34} />)}
    {POSE_LIST.map(([, l], i) => <L key={l} x={140 + (i % 4) * 267} y={1300 + Math.floor(i / 4) * 520} t={l} />)}
  </AbsoluteFill>);
};
export const Sheet2Timur = () => <Sheet2 look={TIMUR} />;
export const Sheet2Lev = () => <Sheet2 look={LEV} />;
export const Sheet2Sanya = () => <Sheet2 look={SANYA} />;
export const Sheet2Dog: React.FC = () => {
  const t = useT();
  const items: [string, React.ReactNode][] = [["стоит", <Bublik2 pose={D2.stand} x={0} y={0} t={t} />], ["идёт", <Bublik2 pose={dogWalk((t * 1.4) % 1)} x={0} y={0} t={t} />],
    ["сидит", <Bublik2 pose={D2.sit} x={0} y={0} t={t} />], ["лежит", <Bublik2 pose={D2.lie} x={0} y={0} t={t} />],
    ["нюхает", <Bublik2 pose={D2.sniff} x={0} y={0} t={t} />], ["насторожился", <Bublik2 pose={D2.alert} x={0} y={0} t={t} />]];
  return (<AbsoluteFill style={{ background: DAY.paper }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 64, color: DAY.ink }}>БУБЛИК</div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {items.map(([, el], i) => <g key={i} transform={`translate(${280 + (i % 2) * 500},${540 + Math.floor(i / 2) * 520}) scale(1.2)`}>{el}</g>)}
    </svg>
    {items.map(([l], i) => <L key={l} x={280 + (i % 2) * 500} y={580 + Math.floor(i / 2) * 520} t={l} size={34} />)}
  </AbsoluteFill>);
};
