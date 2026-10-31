// РОЛИК «Если Солнце станет чёрной дырой»: шоты по таймингам голоса + голос + музыка + субтитры. Всё время — в секундах ГОЛОСА.
// Локации: балкон (день / ночь), кухня, кабинет соседки. Герои: «ты» (синий) и соседка-астроном (розовая, с бейджем).
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import plan from "./plan.json";
import { FPS, Scene3D, Room, Box, Sign, Clock, Plant, Lamp, Desk, Chair, Shelf, Monitor, Doodle, Actor, pointKeys, bonkAt, useSec, HIP, HEAD_Z } from "./kit";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin", "cyrillic"] });
type V3 = [number, number, number];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ===================================================================== реквизит
const Ball: React.FC<{ p: V3; r: number; c: string; e?: string; ei?: number; scale?: number }> = ({ p, r, c, e, ei = 0, scale = 1 }) => (
  <mesh position={p} scale={scale} castShadow><sphereGeometry args={[r, 32, 20]} />
    <meshStandardMaterial color={c} roughness={0.5} emissive={e ?? "#000"} emissiveIntensity={ei} /></mesh>
);
const Glow: React.FC<{ p: V3; r: number; c: [number, number, number]; scale?: number; seg?: number }> = ({ p, r, c, scale = 1 }) => (
  <mesh position={p} scale={scale}><circleGeometry args={[r, 40]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>
);

// город вдали: дома-коробки, ночью горят окна
const HOUSES = [[-5.5, 3.2, "#8d939b"], [-3.8, 4.6, "#b5653a"], [-2.2, 2.6, "#c9ccd1"], [-0.6, 5.2, "#7a8fa6"], [1.0, 3.4, "#d07a3a"],
  [2.6, 4.2, "#8d939b"], [4.2, 2.8, "#b9c0c8"], [5.8, 3.8, "#7a4a2c"]] as const;
const City: React.FC<{ night: boolean }> = ({ night }) => (<>
  {HOUSES.map(([x, h, c], i) => (
    <group key={i}>
      <Box p={[x, h / 2 - 0.6, -6 - (i % 3) * 0.6]} s={[1.3, h, 1]} c={night ? "#1d2440" : c} line={false} />
      {[0.4, 1.2, 2.0].filter((z) => z < h - 0.9).map((z, k) => (
        <mesh key={k} position={[x + (k % 2 ? 0.3 : -0.3), z, -5.49 - (i % 3) * 0.6]}><planeGeometry args={[0.28, 0.3]} />
          <meshBasicMaterial color={night ? ((i + k) % 3 ? [1.4, 1.1, 0.5] : "#2a3050") : "#cfe3f2"} toneMapped={!night} /></mesh>))}
    </group>))}
</>);

// звёзды на ночном небе
const STARS = Array.from({ length: 90 }, (_, i) => [((i * 7919) % 220) / 10 - 11, ((i * 104729) % 110) / 10 + 2, ((i * 31) % 7) / 100 + 0.02] as const);
const NightSky: React.FC = () => (<>{STARS.map(([x, y, r], i) => <Glow key={i} p={[x, y, -8.9]} r={r} c={[1.6, 1.6, 1.8]} />)}</>);

// снег (финал)
const SNOW = Array.from({ length: 140 }, (_, i) => [((i * 7919) % 70) / 10 - 3.5, ((i * 3571) % 40) / 10 - 2, (i * 0.37) % 3.2] as const);
const Snow: React.FC = () => {
  const sec = useSec();
  return (<>{SNOW.map(([x, z, ph], i) => {
    const y = 3.2 - ((sec * 0.55 + ph) % 3.2);
    return <mesh key={i} position={[x + Math.sin(sec * 1.3 + i) * 0.08, y, z]}><sphereGeometry args={[0.018, 6, 4]} /><meshBasicMaterial color={[1.3, 1.3, 1.4]} toneMapped={false} /></mesh>;
  })}</>);
};

// телевизор на балконе: показывает новости (Солнце сжимается) или схему орбиты
const TV: React.FC<{ mode: "sun" | "orbit" }> = ({ mode }) => {
  const sec = useSec();
  const k = mode === "sun" ? interpolate(sec, [7.6, 9.3], [1, 0.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const a = sec * 1.6;
  return (
    <group position={[1.45, 0, -1.4]} rotation={[0, -0.35, 0]}>
      <Box p={[0, 0.35, 0]} s={[0.55, 0.7, 0.4]} c="#7a4a2c" />
      <Box p={[0, 1.04, 0]} s={[1.0, 0.62, 0.06]} c="#2a2d33" />
      <mesh position={[0, 1.04, 0.032]}><planeGeometry args={[0.92, 0.54]} /><meshBasicMaterial color={mode === "sun" ? "#1d3f7a" : "#0b1022"} /></mesh>
      {mode === "sun" ? (<>
        <Glow p={[0, 1.08, 0.036]} r={0.17} c={[2.2, 1.7, 0.6]} scale={k} />
        {sec > 9.3 ? <group position={[0, 0.86, 0.04]} scale={bonkAt(sec, 9.3, 0.4)}><Sign p={[0, 0, 0]} w={0.34} h={0.11} text="6 КМ" bg="#d64545" fg="#ffffff" glow={0.6} /></group> : null}
        <Sign p={[0, 1.28, 0.04]} w={0.5} h={0.07} text="НОВОСТИ" bg="#15151a" fg="#f2c230" glow={0.6} />
      </>) : (<>
        <mesh position={[0, 1.04, 0.036]}><ringGeometry args={[0.2, 0.207, 48]} /><meshBasicMaterial color="#9fd8ff" /></mesh>
        <mesh position={[0, 1.04, 0.037]}><ringGeometry args={[0.04, 0.055, 32]} /><meshBasicMaterial color={[2.2, 1.2, 0.4]} toneMapped={false} /></mesh>
        <mesh position={[0, 1.04, 0.038]}><circleGeometry args={[0.04, 32]} /><meshBasicMaterial color="#000" /></mesh>
        <Glow p={[Math.cos(a) * 0.2, 1.04 + Math.sin(a) * 0.2, 0.039]} r={0.028} c={[0.5, 1.1, 2.0]} />
      </>)}
    </group>
  );
};

// часы-табло на столбике: обычное время → обратный отсчёт 8:20 → 0:00
const Timer: React.FC<{ mode: "time" | "count" | "zero" }> = ({ mode }) => {
  const sec = useSec();
  let text = "12:00";
  if (mode === "count") { const left = Math.round(500 * clamp01(1 - (sec - 12.1) / (15.5 - 12.1))); text = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; }
  if (mode === "zero") text = "0:00";
  return (<>
    <Box p={[-1.35, 0.85, -1.6]} s={[0.08, 1.7, 0.08]} c="#5d6670" />
    <group position={[-1.35, 1.85, -1.56]} scale={mode === "count" ? bonkAt(sec, 12.1, 0.3) : 1}>
      <Box p={[0, 0, -0.03]} s={[0.96, 0.44, 0.05]} c="#2a2d33" />
      <Sign p={[0, 0, 0]} w={0.88} h={0.36} text={text} bg="#15151a" fg={mode === "time" ? "#47f0d8" : "#ff3b2f"} glow={1.2} />
    </group>
  </>);
};

// БАЛКОН: пол-плитка, парапет с перилами, стол с чаем, стул, растения, бельё, город и небо
const Balcony: React.FC<{ night?: boolean; sun?: number; tv?: "sun" | "orbit"; timer?: "time" | "count" | "zero"; snow?: boolean }> =
  ({ night = false, sun = 1, tv = "sun", timer = "time", snow = false }) => {
    const sec = useSec();
    return (<>
      <mesh position={[0, 3, -9]}><planeGeometry args={[34, 18]} /><meshBasicMaterial color={night ? "#0b1030" : "#9fd0ff"} /></mesh>
      {night ? <NightSky /> : (<>
        <Glow p={[2.6, 4.0, -8.6]} r={2.2} c={[1.2, 1.05, 0.75]} scale={sun} />
        <Glow p={[2.6, 4.0, -8.5]} r={1.0} c={[3, 2.5, 1.3]} scale={sun * bonkAt(sec, 2.3, 0.25) * bonkAt(sec, 12.8, 0.2)} />
      </>)}
      <City night={night} />
      <Box p={[0, -0.05, 0]} s={[6, 0.1, 4]} c={night ? "#6f6a7e" : "#d9c7a8"} line={false} r={0.8} />
      <Box p={[0, 0.5, -1.9]} s={[6, 1.0, 0.12]} c="#e9e2cf" />
      <Box p={[0, 1.08, -1.9]} s={[6.1, 0.06, 0.16]} c="#7a4a2c" />
      <Box p={[2.95, 1.5, 0]} s={[0.1, 3, 4]} c="#c96f4a" r={0.85} />
      <Box p={[2.89, 1.25, -0.3]} s={[0.04, 2.1, 0.9]} c="#4f7aa6" />
      {/* верёвка с бельём */}
      <Box p={[0.3, 2.3, -1.75]} s={[5.2, 0.015, 0.015]} c="#efe6d2" line={false} />
      {[[-2.3, "#d64545"], [-1.75, "#f2c230"], [-1.2, "#2f9e9a"]].map(([x, c], i) =>
        <Box key={i} p={[x as number, 2.05 + Math.sin(sec * 2 + i) * 0.01, -1.75]} s={[0.38, 0.5, 0.02]} c={c as string} rot={[0, 0, Math.sin(sec * 1.6 + i) * 0.04]} />)}
      {/* стол с чаем */}
      <Box p={[0.15, 0.36, -0.55]} s={[0.08, 0.72, 0.08]} c="#5d6670" />
      <Box p={[0.15, 0.74, -0.55]} s={[0.7, 0.04, 0.55]} c="#b8784a" />
      <Box p={[0.05, 0.84, -0.6]} s={[0.18, 0.16, 0.14]} c="#efe6d2" />
      <Box p={[0.16, 0.86, -0.6]} s={[0.08, 0.03, 0.03]} c="#efe6d2" line={false} />
      <Box p={[0.32, 0.8, -0.45]} s={[0.08, 0.09, 0.08]} c="#d64545" />
      <Box p={[-0.1, 0.8, -0.42]} s={[0.08, 0.09, 0.08]} c="#2f6fd6" />
      <Chair p={[-2.2, 0, -1.2]} rotY={0.5} c="#f2c230" />
      <Plant p={[-2.6, 0, -1.55]} h={0.8} /><Plant p={[2.5, 0, 0.6]} />
      <TV mode={tv} />
      <Timer mode={timer} />
      {snow ? <Snow /> : null}
      {night ? <pointLight position={[0.2, 2.4, -0.2]} intensity={2.5} decay={1.4} color="#9fb4ff" /> : null}
    </>);
  };

// КУХНЯ: стол с весами, арбуз → вишня; холодильник, шкафчики, плита, постер
const Kitchen: React.FC<{ globe?: boolean }> = ({ globe = false }) => {
  const sec = useSec();
  const k = globe ? 1 : interpolate(sec, [23.5, 24.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const melon = new THREE.Color("#2f7d3a").lerp(new THREE.Color("#c0182a"), k);
  const g = globe ? interpolate(sec, [38.1, 39.7], [1, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (<>
    <Room wall="#e8b04a" wain="#b5653a" floor="#6b4a3a" sky="#bfe0ff" />
    <Box p={[-2.4, 0.9, -1.6]} s={[0.7, 1.8, 0.6]} c="#f6f3ea" r={0.4} />
    <Box p={[-2.12, 1.1, -1.28]} s={[0.04, 0.4, 0.04]} c="#8d939b" metal={0.6} />
    <Box p={[0.9, 2.2, -1.8]} s={[1.8, 0.6, 0.35]} c="#3f8a4b" />
    <Box p={[1.9, 0.45, -1.65]} s={[0.8, 0.9, 0.6]} c="#c9ccd1" metal={0.3} />
    <Box p={[1.8, 0.98, -1.65]} s={[0.22, 0.18, 0.2]} c="#d64545" />
    <Sign p={[-0.9, 1.6, -1.99]} w={0.8} h={0.5} text="АРБУЗЫ" bg="#2f7d3a" fg="#ffffff" glow={0.15} />
    <Clock p={[0.2, 2.35, -1.99]} hh={12} mm={10} />
    <Plant p={[2.65, 0, -1.4]} h={0.8} /><Lamp p={[0, 2.97, -0.4]} />
    {/* стол и весы */}
    <Box p={[0, 0.74, -0.75]} s={[0.9, 0.05, 0.75]} c="#efe6d2" />
    {[[-0.38, -0.42], [0.38, -0.42], [-0.38, -1.08], [0.38, -1.08]].map(([x, z], i) => <Box key={i} p={[x, 0.36, z]} s={[0.06, 0.72, 0.06]} c="#7a4a2c" />)}
    <Box p={[0.15, 0.81, -0.75]} s={[0.46, 0.09, 0.4]} c="#c9ccd1" metal={0.4} r={0.4} />
    <Box p={[0.15, 0.87, -0.75]} s={[0.4, 0.02, 0.34]} c="#e9e2cf" />
    <group position={[0.15, 0.81, -0.545]} scale={bonkAt(sec, 25.8, 0.3)}><Sign p={[0, 0, 0]} w={0.28} h={0.07} text="10 КГ" bg="#15151a" fg="#47f0d8" glow={1} /></group>
    {!globe ? (
      <Ball p={[0.15, 0.88 + 0.17 * (1 - 0.85 * k), -0.75]} r={0.17} c={`#${melon.getHexString()}`} scale={1 - 0.85 * k} />
    ) : (<>
      <Ball p={[-0.3, 0.8, -0.7]} r={0.026} c="#c0182a" />
      <Ball p={[0.15, 0.88 + 0.17 * g, -0.75]} r={0.17} c="#2f6fd6" e="#1b3a8a" ei={0.2} scale={g} />
      <Ball p={[0.15 + 0.06 * g, 0.88 + 0.17 * g + 0.07 * g, -0.75 + 0.12 * g]} r={0.06} c="#3f8a4b" scale={g} />
      {sec > 39.7 ? <group position={[-0.05, 1.2, -0.9]} scale={bonkAt(sec, 39.7, 0.4)}><Sign p={[0, 0, 0]} w={0.42} h={0.14} text="≈ 9 ММ" bg="#f2c230" fg="#15151a" glow={0.5} /></group> : null}
    </>)}
    {!globe && k > 0.95 ? <Box p={[0.15, 0.93, -0.75]} s={[0.006, 0.04, 0.006]} c="#3f8a4b" line={false} /> : null}
  </>);
};

// КАБИНЕТ СОСЕДКИ: модель орбиты на столе, постеры МАССА / РАССТОЯНИЕ, красная зона «вблизи»
const Study: React.FC = () => {
  const sec = useSec();
  const a = sec * 1.1;
  const zone = sec > 34.0 ? bonkAt(sec, 34.0, 0.5) : 0;
  return (<>
    <Room wall="#2f4f7a" wain="#24395a" floor="#6b4a3a" ceil="#d9d4c8" window={false} />
    <Shelf p={[-2.3, 0, -1.75]} /><Plant p={[2.6, 0, -1.5]} h={0.9} />
    <Clock p={[2.2, 2.4, -1.99]} hh={12} mm={30} />
    <group position={[-0.7, 2.0, -1.98]} scale={bonkAt(sec, 29.3, 0.3) * bonkAt(sec, 30.6, 0.3)}><Sign p={[0, 0, 0]} w={0.8} h={0.3} text="МАССА" bg="#f2c230" fg="#15151a" glow={0.2} /></group>
    <group position={[0.75, 2.0, -1.98]} scale={bonkAt(sec, 29.7, 0.3) * bonkAt(sec, 31.4, 0.3)}><Sign p={[0, 0, 0]} w={1.05} h={0.3} text="РАССТОЯНИЕ" bg="#2f9e9a" fg="#ffffff" glow={0.2} /></group>
    {sec > 32.8 ? <group position={[0, 1.6, -1.98]} scale={bonkAt(sec, 32.8, 0.4)}><Sign p={[0, 0, 0]} w={1.2} h={0.32} text="= ОРБИТА" bg="#efe6d2" fg="#15151a" glow={0.2} /></group> : null}
    <Desk p={[0, 0, -1.1]} w={1.2} />
    <Monitor p={[-0.35, 0.775, -1.25]} rotY={0.3} screen="#13505a" />
    {/* модель: чёрная дыра с горячим кольцом, орбита и Земля */}
    <Box p={[0.15, 0.8, -1.0]} s={[0.3, 0.05, 0.3]} c="#2a2d33" />
    <Box p={[0.15, 0.9, -1.0]} s={[0.02, 0.2, 0.02]} c="#8d939b" line={false} />
    <Ball p={[0.15, 1.05, -1.0]} r={0.07} c="#000000" />
    <mesh position={[0.15, 1.05, -1.0]} rotation={[Math.PI / 2 - 0.25, 0, 0]}><torusGeometry args={[0.11, 0.018, 12, 48]} /><meshBasicMaterial color={[2.4, 1.2, 0.4]} toneMapped={false} /></mesh>
    <mesh position={[0.15, 1.05, -1.0]} rotation={[Math.PI / 2 - 0.25, 0, 0]}><torusGeometry args={[0.45, 0.004, 6, 96]} /><meshBasicMaterial color="#9fd8ff" /></mesh>
    <group position={[0.15, 1.05, -1.0]} rotation={[-0.25, 0, 0]}>
      <Ball p={[Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45]} r={0.045} c="#2f6fd6" e="#1b3a8a" ei={0.3} />
    </group>
    <mesh position={[0.15, 1.05, -1.0]} rotation={[Math.PI / 2 - 0.25, 0, 0]} scale={zone}><torusGeometry args={[0.2, 0.012, 8, 64]} /><meshBasicMaterial color={[2.4, 0.3, 0.3]} toneMapped={false} /></mesh>
    <Chair p={[-1.6, 0, -1.2]} rotY={0.6} c="#d64545" />
  </>);
};

// ===================================================================== герои
const TY_LOOK = { body: "#4a90d9", hair: "spiky" as const };
const SOS_LOOK = { body: "#d65a7a", hair: "long" as const, lanyard: true };
const UP_F: [number, number] = [-0.42, HIP + 0.55], UP_B: [number, number] = [0.42, HIP + 0.55];

// Шот 1–2 (0–11.8): балкон, день. «Ты» у стола, соседка у телевизора.
const TY_A: Actor = { pos: [-0.45, 0, -0.95], seed: 1, look: TY_LOOK,
  expr: [[0, "grin"], [1.0, "neutral"], [2.3, "shock"], [3.2, "realize"], [4.1, "smug"],
    [5.1, "grin"], [6.3, "proud"], [7.7, "smug"], [9.3, "blank"], [10.4, "laugh"], [11.0, "grin"]],
  handB: [[0, 0.2, HIP + 0.06], [6.1, 0.2, HIP + 0.06], [6.3, 0.34, HIP + 0.4], [7.2, 0.34, HIP + 0.4], [7.45, 0.2, HIP + 0.06]] };
const SOS_A: Actor = { pos: [0.55, 0, -1.05], seed: 2, look: SOS_LOOK,
  expr: [[0, "proud"], [1.5, "nervous"], [2.3, "shock"], [3.6, "blank"], [4.1, "grin"],
    [5.1, "smug"], [7.3, "realize"], [8.4, "nervous"], [9.3, "shock"], [10.4, "nervous"], [11.2, "stern"]],
  handB: pointKeys(8.4, 0.9, 0.5, 1.6, "b") };

// Шот 3 (11.8–15.7): табло отсчитывает 8:20 → 0:00. «Ты» загорает, соседка в ужасе тычет в табло.
const TY_B: Actor = { pos: [-0.45, 0, -0.95], seed: 1, look: TY_LOOK,
  expr: [[11.8, "proud"], [12.8, "grin"], [13.9, "smug"], [14.5, "laugh"], [15.2, "proud"]],
  lean: [[11.8, 0, 0], [12.4, -0.12, 0], [15.2, -0.12, 0], [15.6, 0, 0]],
  handF: [[11.8, -0.2, HIP + 0.06], [12.3, -0.36, HEAD_Z + 0.1], [15.2, -0.36, HEAD_Z + 0.1], [15.6, -0.2, HIP + 0.06]],
  handB: [[11.8, 0.2, HIP + 0.06], [12.3, 0.36, HEAD_Z + 0.1], [15.2, 0.36, HEAD_Z + 0.1], [15.6, 0.2, HIP + 0.06]] };
const SOS_B: Actor = { pos: [0.55, 0, -1.0], seed: 2, look: SOS_LOOK,
  expr: [[11.8, "nervous"], [12.8, "realize"], [13.6, "nervous"], [14.5, "shock"], [15.2, "nervous"]],
  handF: pointKeys(12.5, -0.9, 0.6, 2.4, "f") };

// Шот 4а (15.7–16.6): «А потом —». Шот 4б (16.6–23.1): ночь, на ТВ — орбита. «Как? Чёрная дыра же всё засасывает!» — «ты».
const TY_C: Actor = { pos: [-0.45, 0, -0.95], seed: 1, look: TY_LOOK,
  expr: [[15.7, "proud"], [16.0, "nervous"], [16.6, "shock"], [17.4, "blank"], [18.5, "realize"], [19.8, "blank"], [20.4, "shock"], [21.6, "nervous"], [22.2, "shock"]],
  handF: [[15.7, -0.2, HIP + 0.06], [20.3, -0.2, HIP + 0.06], [20.5, ...UP_F], [22.8, ...UP_F], [23.0, -0.2, HIP + 0.06]],
  handB: [[15.7, 0.2, HIP + 0.06], [20.3, 0.2, HIP + 0.06], [20.5, ...UP_B], [22.8, ...UP_B], [23.0, 0.2, HIP + 0.06]],
  talk: [[20.4, 20.9], [21.1, 23.0]] };
const SOS_C: Actor = { pos: [0.55, 0, -1.0], seed: 2, look: SOS_LOOK,
  expr: [[15.7, "nervous"], [16.6, "shock"], [17.4, "blank"], [18.3, "realize"], [19.3, "grin"], [20.4, "smug"], [21.6, "holdlaugh"], [22.6, "smug"]],
  handB: pointKeys(18.9, 0.9, 0.5, 1.4, "b") };

// Шот 5 (23.1–28.0): кухня, арбуз сжимается в вишню, весы — те же 10 кг.
const TY_D: Actor = { pos: [-0.8, 0, -0.8], seed: 1, look: TY_LOOK,
  expr: [[23.1, "stern"], [24.5, "realize"], [25.3, "blank"], [25.8, "shock"], [26.6, "realize"], [27.3, "grin"]],
  handB: [[23.1, 0.2, HIP + 0.06], [23.4, 0.45, HIP + 0.42], [24.5, 0.3, HIP + 0.36], [24.8, 0.2, HIP + 0.06]],
  handF: [[23.1, -0.2, HIP + 0.06], [23.4, -0.05, HIP + 0.5], [24.5, 0.05, HIP + 0.4], [24.8, -0.2, HIP + 0.06]] };
const SOS_D: Actor = { pos: [0.8, 0, -0.85], seed: 2, look: SOS_LOOK,
  expr: [[23.1, "grin"], [24.5, "smug"], [25.8, "proud"], [26.6, "smug"], [27.3, "grin"]],
  handF: pointKeys(25.8, -0.8, 0.2, 1.0, "f") };

// Шот 6 (28.0–35.9): кабинет, модель орбиты. Соседка объясняет, красная зона — «только вблизи».
const TY_E: Actor = { pos: [-0.85, 0, -0.9], seed: 1, look: TY_LOOK,
  expr: [[28.0, "blank"], [29.3, "realize"], [30.6, "nervous"], [31.4, "blank"], [32.8, "grin"], [34.0, "shock"], [35.3, "proud"]],
  handB: pointKeys(32.8, 0.8, 0.3, 0.9, "b") };
const SOS_E: Actor = { pos: [0.85, 0, -0.95], seed: 2, look: SOS_LOOK,
  expr: [[28.0, "proud"], [29.3, "smug"], [30.6, "grin"], [31.4, "smug"], [32.8, "proud"], [34.0, "stern"], [35.3, "smug"]],
  handF: [...pointKeys(28.6, -0.8, 0.3, 1.2, "f").slice(0, -1), ...pointKeys(34.0, -0.8, 0.2, 1.3, "f").slice(1)] };

// Шот 7 (35.9–40.2): кухня, глобус сжимается до вишни (≈ 9 мм).
const TY_F: Actor = { pos: [-0.8, 0, -0.8], seed: 1, look: TY_LOOK,
  expr: [[35.9, "grin"], [36.6, "realize"], [37.2, "nervous"], [38.1, "shock"], [39.7, "blank"]],
  handF: [[35.9, -0.2, HIP + 0.06], [38.0, -0.2, HIP + 0.06], [38.2, ...UP_F], [39.6, ...UP_F], [39.9, -0.2, HIP + 0.06]],
  handB: [[35.9, 0.2, HIP + 0.06], [38.0, 0.2, HIP + 0.06], [38.2, ...UP_B], [39.6, ...UP_B], [39.9, 0.2, HIP + 0.06]] };
const SOS_F: Actor = { pos: [0.8, 0, -0.85], seed: 2, look: SOS_LOOK,
  expr: [[35.9, "smug"], [37.2, "proud"], [38.8, "grin"], [39.7, "laugh"]],
  handF: pointKeys(36.6, -0.8, 0.3, 1.2, "f") };

// Шот 8 (40.2–46.9): ночь, снег, холодно. «Возьми свитер» — «ты» уже в красном свитере.
const TY_G: Actor = { pos: [-0.45, 0, -0.95], seed: 1, look: TY_LOOK, hidden: [[45.6, 99]],
  expr: [[40.2, "grin"], [41.5, "proud"], [42.4, "realize"], [43.2, "nervous"], [44.2, "shock"], [45.0, "nervous"]],
  handF: [[40.2, -0.2, HIP + 0.06], [43.0, -0.2, HIP + 0.06], [43.3, 0.08, HIP + 0.42], [45.6, 0.08, HIP + 0.42]],
  handB: [[40.2, 0.2, HIP + 0.06], [43.0, 0.2, HIP + 0.06], [43.3, -0.08, HIP + 0.46], [45.6, -0.08, HIP + 0.46]] };
const TY_SWEATER: Actor = { pos: [-0.45, 0, -0.95], seed: 1, look: { body: "#c0392b", hair: "spiky", tie: "#efe6d2" }, hidden: [[0, 45.6]],
  expr: [[45.6, "proud"], [46.2, "laugh"]], handB: [[45.6, 0.2, HIP + 0.06], [45.9, 0.42, HIP + 0.55], [46.9, 0.42, HIP + 0.55]] };
const SOS_G: Actor = { pos: [0.55, 0, -1.0], seed: 2, look: SOS_LOOK,
  expr: [[40.2, "smug"], [41.5, "proud"], [42.4, "stern"], [43.2, "nervous"], [44.2, "shock"], [45.0, "grin"], [45.6, "laugh"]],
  handF: pointKeys(45.0, -0.9, 0.4, 1.4, "f") };

const both = (a: Actor[]) => a.map((x, i) => <Doodle key={i} a={x} />);

// ===================================================================== ШОТЫ (начало = первое слово абзаца)
const SHOTS: { t0: number; t1: number; el: React.ReactNode }[] = [
  { t0: 0.0, t1: 5.1, el: (
    <Scene3D t0={0} bg="#9fd0ff" cam={[[0, [0.2, 1.35, 1.7], [0.3, 0.95, -2], 76], [5.1, [0.05, 1.3, 1.4], [0.2, 0.95, -2], 76]]} focus={[-0.2, 1.2, -1.0]}>
      <Balcony />{both([TY_A, SOS_A])}
    </Scene3D>) },
  { t0: 5.1, t1: 11.8, el: (
    <Scene3D t0={5.1} bg="#9fd0ff" cam={[[5.1, [-0.2, 1.3, 1.6], [0.5, 0.95, -1.2], 76], [11.8, [0.0, 1.27, 1.35], [0.5, 0.95, -1.2], 76]]} focus={[0.2, 1.2, -1.0]}>
      <Balcony />{both([TY_A, SOS_A])}
    </Scene3D>) },
  { t0: 11.8, t1: 15.7, el: (
    <Scene3D t0={11.8} bg="#9fd0ff" cam={[[11.8, [0.5, 1.32, 1.6], [-0.4, 0.95, -1.2], 76], [15.7, [0.3, 1.28, 1.35], [-0.4, 0.95, -1.2], 76]]} focus={[0.2, 1.2, -1.0]}>
      <Balcony timer="count" />{both([TY_B, SOS_B])}
    </Scene3D>) },
  { t0: 15.7, t1: 16.6, el: (
    <Scene3D t0={15.7} bg="#9fd0ff" cam={[[15.7, [0.05, 1.3, 1.3], [0.05, 0.95, -1.2], 72], [16.6, [0.05, 1.28, 1.1], [0.05, 0.95, -1.2], 72]]} focus={[-0.2, 1.2, -1.0]}>
      <Balcony timer="zero" />{both([TY_C, SOS_C])}
    </Scene3D>) },
  { t0: 16.6, t1: 23.1, el: (
    <Scene3D t0={16.6} light="night" bg="#0b1030" cam={[[16.6, [-0.2, 1.32, 1.7], [0.4, 0.95, -1.6], 76], [23.1, [0.0, 1.27, 1.4], [0.4, 0.95, -1.6], 76]]} focus={[-0.2, 1.2, -1.0]}>
      <Balcony night tv="orbit" timer="zero" />{both([TY_C, SOS_C])}
    </Scene3D>) },
  { t0: 23.1, t1: 28.0, el: (
    <Scene3D t0={23.1} cam={[[23.1, [0.3, 1.32, 1.6], [0, 0.78, -1.0], 76], [28.0, [0.05, 1.28, 1.35], [0, 0.78, -1.0], 76]]} focus={[0.15, 1.0, -0.75]}>
      <Kitchen />{both([TY_D, SOS_D])}
    </Scene3D>) },
  { t0: 28.0, t1: 35.9, el: (
    <Scene3D t0={28.0} cam={[[28.0, [-0.2, 1.35, 1.8], [0.05, 1.0, -1.5], 76], [35.9, [0.1, 1.28, 1.5], [0.05, 1.0, -1.5], 76]]} focus={[0.15, 1.05, -1.0]}>
      <Study />{both([TY_E, SOS_E])}
    </Scene3D>) },
  { t0: 35.9, t1: 40.2, el: (
    <Scene3D t0={35.9} cam={[[35.9, [-0.3, 1.3, 1.6], [0.0, 0.78, -1.0], 76], [40.2, [-0.05, 1.27, 1.35], [0.0, 0.78, -1.0], 76]]} focus={[0.15, 1.0, -0.75]}>
      <Kitchen globe />{both([TY_F, SOS_F])}
    </Scene3D>) },
  { t0: 40.2, t1: plan.total / FPS, el: (
    <Scene3D t0={40.2} light="night" bg="#0b1030" cam={[[40.2, [0.4, 1.33, 1.7], [0.1, 0.95, -1.6], 76], [47, [0.15, 1.27, 1.4], [0.1, 0.95, -1.6], 76]]} focus={[-0.2, 1.2, -1.0]}>
      <Balcony night tv="orbit" timer="zero" snow />{both([TY_G, TY_SWEATER, SOS_G])}
    </Scene3D>) },
];

// ===================================================================== субтитры (как в эталоне)
const Caption: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = plan.groups.find((x) => f >= x.start && f < Math.max(x.end, x.start + 6));
  if (!g) return null;
  const s = spring({ frame: f - g.start, fps, config: { damping: 11, stiffness: 240, mass: 0.55 } });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 600 }}>
      <div style={{ fontFamily, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: "white", textAlign: "center", maxWidth: 920,
        transform: `scale(${interpolate(s, [0, 1], [0.72, 1])})`, WebkitTextStroke: "16px black", paintOrder: "stroke fill",
        textShadow: "0 6px 0 rgba(0,0,0,0.55)" }}>{g.text}</div>
    </AbsoluteFill>
  );
};

export const TOTAL = plan.total;
export const Video: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {SHOTS.map((s, i) => (
        <Sequence key={i} from={Math.round(s.t0 * FPS)} durationInFrames={Math.round((s.t1 - s.t0) * FPS)}>{s.el}</Sequence>
      ))}
      <Audio src={staticFile(plan.voice)} />
      <Audio src={staticFile("music.wav")} loop
        volume={(f) => interpolate(f, [0, 20, durationInFrames - 45, durationInFrames], [0, 0.11, 0.11, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Caption />
    </AbsoluteFill>
  );
};
