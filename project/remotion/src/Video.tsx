// ТЕСТ стиля «Дела Бюро»: 3D-кабинет скилла, Марк-стенд из картинок, Клякс 3D из кода, камера в движении.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { FPS, Scene3D, Room, Box, Clock, Shelf, Desk, Plant, Sign, bonkAt, useSec } from "./kit";
import { MarkStand, Klyaks, KlyState, ease, springOut } from "./bureau";

// ночной кабинет Бюро: тёмно-фиолетовые стены, тёплый свет настольной лампы
const DeskLamp: React.FC<{ p: [number, number, number] }> = ({ p }) => (
  <group position={p}>
    <Box p={[0, 0.02, 0]} s={[0.18, 0.04, 0.14]} c="#2f5a3a" />
    <Box p={[0, 0.2, -0.02]} s={[0.025, 0.36, 0.025]} c="#2f5a3a" line={false} />
    <Box p={[0.08, 0.38, 0.0]} s={[0.22, 0.09, 0.16]} c="#3f7a4b" rot={[0, 0, -0.35]} />
    <pointLight position={[0.12, 0.3, 0.08]} intensity={2.0} decay={1.8} color="#ffbe6a" castShadow />
  </group>
);
const Office: React.FC = () => {
  const sec = useSec();
  return (<>
    <Room wall="#2c2448" wain="#211a38" floor="#3a2826" ceil="#17122a" window={false} />
    <Clock p={[0.1, 2.2, -1.94]} r={0.24} hh={11} mm={59} scale={bonkAt(sec, 3.1, 0.25)} />
    <Shelf p={[-2.1, 0, -1.75]} w={1.1} h={2.0} /><Shelf p={[2.1, 0, -1.75]} w={1.1} h={2.0} />
    <Sign p={[-1.05, 1.75, -1.94]} w={0.62} h={0.3} text="БЮРО" bg="#3a2d5c" fg="#ffcf7a" glow={0.3} />
    <Plant p={[2.6, 0, -0.6]} h={0.7} />
    <Desk p={[0, 0, -0.2]} w={1.6} />
    <DeskLamp p={[-0.6, 0.775, -0.35]} />
    <Box p={[0.55, 0.81, -0.3]} s={[0.12, 0.1, 0.12]} c="#efe9dd" />
    <Box p={[0.05, 0.785, 0.0]} s={[0.42, 0.012, 0.3]} c="#f1e7cf" r={0.9} />
  </>);
};

// Клякс: лужица на бланке → открывает глаза → вытягивается в каплю → прыгает к краю стола → ехидничает
const kly = (t: number): KlyState => {
  const deskY = 0.79;
  const pop = ease(1.4, 1.75, t), hop = ease(2.0, 2.55, t);
  const x = 0.05 + 0.32 * hop, z = 0.0 + 0.12 * hop;
  const arc = Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 2.0) / 0.55))) * 0.28;
  let sy = 1 + springOut(t, 1.75, 0.45) + springOut(t, 2.55, -0.4) + 0.02 * Math.sin(t * 3);
  if (t > 2.0 && t < 2.55) sy = 1.25;                                // в полёте вытянут
  const talk = t > 3.3 && t < 4.6 ? 0.5 + 0.5 * Math.abs(Math.sin(t * 19)) : 0;
  return {
    p: [x, deskY + arc, z], sy, puddle: 1 - pop,
    lid: t < 0.8 ? 1 : t < 1.0 ? 1 - (t - 0.8) / 0.2 : (t > 4.9 && t < 5.05 ? 1 : 0),
    mouth: talk, smug: ease(2.7, 3.0, t), rotY: 0.15 + 0.45 * hop, look: t > 2.6 ? -0.6 : 0.3,   // лицом к камере
  };
};
const markPick = (t: number) => {
  if (t > 2.9 && t < 3.0) return "mark_blink.png";
  if (t >= 2.6) return "mark_surprised.png";
  return "mark_base.png";
};

const SHOTS = [
  { t0: 0, t1: 6, el: (
    <Scene3D t0={0} light="night" bg="#120e22"
      cam={[[0, [0.6, 1.6, 1.3], [0.05, 0.8, -0.1], 62], [1.4, [0.5, 1.25, 1.05], [0.05, 0.85, -0.1], 58],
            [2.6, [1.15, 1.2, 1.25], [0.0, 1.0, -0.45], 64], [4.4, [0.95, 1.1, 1.0], [0.05, 1.0, -0.45], 60],
            [6, [0.85, 0.98, 0.7], [0.3, 0.9, -0.02], 50]]}
      focus={[0.35, 0.9, -0.1]}>
      <Office />
      <MarkStand p={[-0.15, 0.42, -0.85]} h={1.42} pick={markPick} bonk={[2.6]} />
      <Klyaks state={kly} />
    </Scene3D>) },
];
export const TOTAL = Math.round(SHOTS[SHOTS.length - 1].t1 * FPS);
export const Video: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    {SHOTS.map((s, i) => <Sequence key={i} from={Math.round(s.t0 * FPS)} durationInFrames={Math.round((s.t1 - s.t0) * FPS)}>{s.el}</Sequence>)}
  </AbsoluteFill>
);
