// Бип — ведущий канала: маленький потрёпанный космический зонд, 3D из кода (картинки не нужны).
// Корпус — светлый с янтарными полосами и заплаткой-скотчем; вместо лица — экран с пиксельными эмоциями (бирюзовое свечение);
// сверху тарелка-антенна с мигающим огоньком; по бокам солнечные крылья; снизу два сопла с огоньками.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Box, canvasTex, useSec } from "./kit";

type V3 = [number, number, number];
export type BipFace = "neutral" | "happy" | "wide" | "smug" | "sleepy" | "heart" | "error" | "dizzy" | "angry" | "wink";
const C = { body: "#e9e4da", body2: "#c9c2b5", amber: "#f2a33a", screen: "#0c1424", glow: "#47f0d8", dark: "#2a2d38", panel: "#2b4f9e", tape: "#9a9a94" };

// пиксельное лицо: сетка 16×10, каждый «пиксель» — квадрат с мягким свечением
const FACES: Record<BipFace, string[]> = {
  neutral: ["................","...##......##...","...##......##...","...##......##...","................","................","......####......","................","................","................"],
  happy:   ["................","..#..#....#..#..","...##......##...","................","................",".....#....#.....","......####......","................","................","................"],
  wide:    ["..####....####..","..#..#....#..#..","..#.##....#.##..","..####....####..","................","................",".......##.......",".......##.......","................","................"],
  smug:    ["................","..####....####..","...##......##...","................","................","..........#.....",".....######.....","................","................","................"],
  sleepy:  ["................","................","..####....####..","................","................","................","......####......","................","...........z....","..........z.....".replace(/z/g,"#")],
  heart:   ["..##.##..##.##..",".#######.#######",".#######.#######","..#####...#####.","...###.....###..","....#.......#...","................","......####......","................","................"],
  error:   ["................","..#..#....#..#..","...##......##...","...##......##...","..#..#....#..#..","................",".....######.....","....#......#....","................","................"],
  dizzy:   ["................","..###......###..","..#.#......#.#..","..##........##..","................","................","....#.#.#.#.....","................","................","................"],
  angry:   ["..#..........#..","...#........#...","...##......##...","...##......##...","................","................","......####......",".....#....#.....","................","................"],
  wink:    ["................","...##...........","...##.....####..","...##...........","................",".....#....#.....","......####......","................","................","................"],
};
const faceTex = (f: BipFace, talk: number) => canvasTex(320, 200, (g) => {
  g.fillStyle = C.screen; g.fillRect(0, 0, 320, 200);
  const rows = FACES[f].map((r) => r.split(""));
  if (talk > 0.15) { rows[6] = "................".split(""); rows[7] = "................".split("");
    const w = 2 + Math.round(talk * 3); for (let x = 8 - w; x < 8 + w; x++) { rows[6][x] = "#"; if (talk > 0.5) rows[7][x] = "#"; } }
  g.shadowColor = C.glow; g.shadowBlur = 14; g.fillStyle = C.glow;
  rows.forEach((r, y) => r.forEach((c, x) => { if (c === "#") g.fillRect(16 + x * 18, 10 + y * 18, 15, 15); }));
  g.shadowBlur = 0; g.fillStyle = "rgba(255,255,255,0.06)"; for (let y = 0; y < 200; y += 4) g.fillRect(0, y, 320, 1);   // строки экрана
});

export type BipState = { p: V3; rot: V3; face: BipFace; talk: number; wings: number; thrust: number; scale?: number };
export const Bip: React.FC<{ state: (t: number) => BipState }> = ({ state }) => {
  const t = useSec(); const s = state(t);
  const talkQ = Math.round(s.talk * 3) / 3;
  const tex = useMemo(() => faceTex(s.face, talkQ), [s.face, talkQ]);
  const bob = Math.sin(t * 2.1) * 0.025, sway = Math.sin(t * 1.3) * 0.05;
  const blink = Math.sin(t * 6) > 0.2 ? 3 : 0.3;
  const wa = 0.15 + 0.6 * s.wings;
  return (
    <group position={[s.p[0], s.p[1] + bob, s.p[2]]} rotation={[s.rot[0], s.rot[1] + sway * 0.3, s.rot[2] + sway * 0.4]} scale={s.scale ?? 1}>
      {/* корпус */}
      <Box p={[0, 0, 0]} s={[0.5, 0.4, 0.42]} c={C.body} r={0.45} metal={0.2} />
      <Box p={[0, 0.17, 0]} s={[0.52, 0.05, 0.44]} c={C.amber} r={0.5} />
      <Box p={[0, -0.17, 0]} s={[0.52, 0.05, 0.44]} c={C.amber} r={0.5} />
      {/* заплатка-скотч крестом: зонд «видавший виды» */}
      <Box p={[0.2, 0.06, -0.212]} s={[0.12, 0.03, 0.005]} c={C.tape} rot={[0, 0, 0.7]} line={false} />
      <Box p={[0.2, 0.06, -0.212]} s={[0.12, 0.03, 0.005]} c={C.tape} rot={[0, 0, -0.7]} line={false} />
      {/* экран-лицо */}
      <Box p={[0, 0, 0.212]} s={[0.4, 0.28, 0.02]} c={C.dark} />
      <mesh position={[0, 0, 0.224]}><planeGeometry args={[0.36, 0.225]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      {/* антенна-тарелка */}
      <Box p={[0, 0.27, -0.05]} s={[0.03, 0.12, 0.03]} c={C.dark} line={false} />
      <mesh position={[0, 0.36, -0.05]} rotation={[-0.5, t * 0.6, 0]}>
        <sphereGeometry args={[0.13, 24, 12, 0, Math.PI * 2, 0, 0.9]} /><meshStandardMaterial color={C.body} side={THREE.DoubleSide} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.42, -0.02]}><sphereGeometry args={[0.022, 12, 8]} /><meshBasicMaterial color={[blink, blink * 0.55, 0.1]} toneMapped={false} /></mesh>
      {/* солнечные крылья (машут, когда эмоции) */}
      {[-1, 1].map((d) => (
        <group key={d} position={[d * 0.27, 0.02, 0]} rotation={[0, 0, d * -wa * 0.4 + d * Math.sin(t * 5) * 0.08 * s.wings]}>
          <Box p={[d * 0.06, 0, 0]} s={[0.1, 0.025, 0.025]} c={C.dark} line={false} />
          <group position={[d * 0.29, 0, 0]}>
            <Box p={[0, 0, 0]} s={[0.4, 0.015, 0.24]} c={C.panel} r={0.3} metal={0.4} />
            {[-0.1, 0, 0.1].map((x) => <Box key={x} p={[x, 0.009, 0]} s={[0.006, 0.004, 0.24]} c="#9fc0ff" line={false} />)}
          </group>
        </group>
      ))}
      {/* сопла и огоньки тяги */}
      {[-0.12, 0.12].map((x) => (
        <group key={x} position={[x, -0.23, 0]}>
          <mesh><cylinderGeometry args={[0.04, 0.06, 0.07, 16]} /><meshStandardMaterial color={C.dark} metalness={0.6} roughness={0.4} /></mesh>
          {s.thrust > 0.05 ? (
            <mesh position={[0, -0.05 - 0.06 * s.thrust, 0]} scale={[1, 1 + s.thrust * (1.2 + 0.4 * Math.sin(t * 40)), 1]}>
              <coneGeometry args={[0.04, 0.12, 12]} /><meshBasicMaterial color={[1.6, 0.8, 0.3]} transparent opacity={0.85} toneMapped={false} />
            </mesh>) : null}
        </group>
      ))}
    </group>
  );
};

// Звёздное небо: точки на большой сфере + пара туманностей-пятен
export const Stars: React.FC<{ n?: number; r?: number }> = ({ n = 1400, r = 18 }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) { const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, q = Math.sqrt(1 - u * u);
      a[i * 3] = r * q * Math.cos(th); a[i * 3 + 1] = r * u; a[i * 3 + 2] = r * q * Math.sin(th); }
    g.setAttribute("position", new THREE.BufferAttribute(a, 3)); return g;
  }, [n, r]);
  return (<>
    <points geometry={geo}><pointsMaterial color="#ffffff" size={0.05} sizeAttenuation toneMapped={false} /></points>
    <mesh position={[-6, 4, -14]}><circleGeometry args={[5, 32]} /><meshBasicMaterial color="#3b1f6e" transparent opacity={0.35} /></mesh>
    <mesh position={[7, -3, -15]}><circleGeometry args={[6, 32]} /><meshBasicMaterial color="#13505a" transparent opacity={0.3} /></mesh>
  </>);
};
