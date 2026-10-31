// РОЛИК: сцены-диорамы по таймингам голоса + бирка/вопрос + плашки + субтитры + голос/музыка/звуки.
// Для нового ролика меняются QUESTION, ACCENT, сцены (компоненты ниже) и массив SCENES. Время — секунды ГОЛОСА.
import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import plan from "./plan.json";
import { A, Captions, Cam, Card, D, FPS, Finish, Mode, Stage, Title, Waves, lines, makeIso, useT } from "./brand";

const QUESTION = "Wi-Fi было бы видно?";
const ACCENT = ["светит", "ворует"];                 // слова-акценты в субтитрах (нижний регистр, без знаков)
const I = makeIso(62, 580, 820);                     // изометрия: масштаб, центр

// ===================================================================== СЦЕНЫ (пример: комната с роутером — днём в D, ночью в A)
const RoomScene: React.FC<{ mode: Mode }> = ({ mode }) => {
  const t = useT();
  const P = mode === "D" ? D : A;
  const top = mode === "D" ? D.mustard : A.obj, l = mode === "D" ? D.mustD : A.objL, r = mode === "D" ? "#c4861a" : A.objR;
  return (
    <Stage mode={mode}>
      <I.Room mode={mode} />
      <I.Cube x={5.2} y={0.2} z={0} w={4.4} d={3.2} h={1.1} top={mode === "D" ? D.teal : "#232c63"} l={mode === "D" ? D.tealD : "#1a2150"} r={mode === "D" ? D.tealDD : "#141a40"} edge={P.edge} shadow={mode === "D"} />
      <I.Cube x={0.2} y={3.6} z={0} w={1.8} d={2.4} h={2.6} top={top} l={l} r={r} edge={P.edge} shadow={mode === "D"} />
      <I.Cube x={0.6} y={3.9} z={2.6} w={1.2} d={1.4} h={0.32} top={mode === "D" ? D.ink : "#e8ecff"} l={mode === "D" ? "#152028" : "#b9c2ee"} r={mode === "D" ? "#0f171d" : "#9aa4d6"} edge={P.edge} shadow={mode === "D"} />
      <Waves I={I} cx={1.2} cy={4.6} z={[1.4, 3.0, 4.6]} color={P.glow} t={t} id={mode} />
    </Stage>
  );
};

type Scene = { t0: number; t1: number; mode: Mode; cam: [number, number, number, number][]; el: React.ReactNode; over?: React.ReactNode };
const END = plan.total / FPS;
const SCENES: Scene[] = [
  { t0: 0, t1: END / 2, mode: "D", cam: [[0, 1.05, 0, 0], [END / 2, 1.15, 40, 60]], el: <RoomScene mode="D" />,
    over: <Card mode="D" x={80} y={1180} label="ДЛИНА ВОЛНЫ" value="≈ 12 см" at={2.5} /> },
  { t0: END / 2, t1: END, mode: "A", cam: [[END / 2, 1.0, 0, 0], [END, 1.12, -40, 40]], el: <RoomScene mode="A" />,
    over: <Card mode="A" x={80} y={150} label="СОСЕД" value="5 делений" at={END / 2 + 1} /> },
];
const modeAt = (sec: number) => (SCENES.find((s) => sec >= s.t0 && sec < s.t1) ?? SCENES[SCENES.length - 1]).mode;
const L = lines(plan.groups);

export const TOTAL = plan.total;
export const Video: React.FC = () => {
  const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  const s = SCENES.find((x) => f >= Math.round(x.t0 * FPS) && f < Math.round(x.t1 * FPS)) ?? SCENES[SCENES.length - 1];
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Cam t0={s.t0} keys={s.cam}>{s.el}</Cam>
      {s.over}
      <Title mode={SCENES[0].mode} question={QUESTION} />
      <Finish mode={s.mode} />
      <Captions L={L} mode={modeAt} accentWords={ACCENT} />
      <Audio src={staticFile(plan.voice)} />
      <Audio src={staticFile("music.wav")} loop volume={(fr) => interpolate(fr, [0, 20, durationInFrames - 45, durationInFrames], [0, 0.22, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Audio src={staticFile("sfx.wav")} volume={0.45} />
    </AbsoluteFill>
  );
};
