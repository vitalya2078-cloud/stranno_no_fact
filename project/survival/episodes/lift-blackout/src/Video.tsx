// РОЛИК: сцены по таймингам голоса (секунды голоса). Пример-заготовка: ночная схема «разрез дома» + плашки + таймер + лента + список.
// Для нового ролика меняются SCENES и сами сцены; герой и собака — из channel/ (SVG-риги), когда они утверждены.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import plan from "./plan.json";
import { Cam, Captions, DAY, F, FPS, Grain, Hud, Mono, NIGHT, PaperList, Ribbon, Timer, Transition, Tr, phrases, useT } from "./kit";

// пример схемы: разрез дома, этажи, окно героя светится
const HouseCut: React.FC = () => {
  const t = useT();
  return (<AbsoluteFill style={{ background: `linear-gradient(${NIGHT.bg1}, ${NIGHT.bg2})` }}>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {Array.from({ length: 10 }, (_, i) => (<g key={i}>
        <rect x={290} y={300 + i * 70} width={500} height={64} fill="none" stroke={NIGHT.line} strokeWidth={3} />
        <rect x={330} y={312 + i * 70} width={60} height={40} fill={i === 2 ? NIGHT.window : "#1a2440"} opacity={i === 2 ? 0.7 + 0.3 * Math.sin(t * 3) : 1} />
      </g>))}
    </svg>
  </AbsoluteFill>);
};

type Scene = { t0: number; t1: number; el: React.ReactNode; over?: React.ReactNode; tr?: Tr };
const END = plan.total / FPS;
const SCENES: Scene[] = [
  { t0: 0, t1: END, el: <HouseCut />, over: <>
    <Mono x={60} y={120} at={0.2} text="ДЕНЬ 1 — 18:04" />
    <Hud x={600} y={180} at={1.0} title="20 ЭТАЖ" sub="высота 60 м" tone="res" to={[360, 470]} />
    <Timer x={60} y={240} at={2.0} from={269} to={0} dur={20} />
    <PaperList x={230} y={1400 - 700} at={4.0} title="Запасы" rows={[{ icon: "💧", name: "Вода", val: "12 дн", fill: 0.6 }, { icon: "🕯", name: "Свечи", val: "3 шт", fill: 0.2 }]} />
    <Ribbon at={7} until={9} text="ЛЕСТНИЦА = ЛОВУШКА" />
  </> },
];
const P = phrases(plan.groups);
export const TOTAL = plan.total;
export const Video: React.FC = () => {
  const f = useCurrentFrame();
  const i = SCENES.findIndex((x) => f >= Math.round(x.t0 * FPS) && f < Math.round(x.t1 * FPS));
  const s = SCENES[Math.max(0, i)];
  return (<AbsoluteFill style={{ background: NIGHT.bg1, overflow: "hidden" }}>
    <Cam t0={s.t0} t1={s.t1}>{s.el}</Cam>
    {s.over}
    {SCENES.slice(1).map((x, k) => <Transition key={k} at={x.t0} kind={x.tr ?? "cut"} />)}
    <Captions P={P} color={{}} />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>);
};
