// Лист персонажа Бипа: герой-кадр и ряд эмоций (для утверждения владельцем).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Scene3D } from "./kit";
import { Bip, BipFace, Stars } from "./bip";
const FACES: BipFace[] = ["neutral", "happy", "wide", "smug", "heart", "error", "angry", "sleepy"];
export const BipSheet: React.FC = () => {
  const f = useCurrentFrame();
  if (f === 0) return (   // герой-кадр: три четверти, планета позади
    <Scene3D t0={0} light="night" bg="#070a18" cam={[[0, [1.3, 0.45, 2.6], [0, 0.05, 0], 40]]} focus={[0, 0, 0]}>
      <Stars />
      <mesh position={[-1.4, -0.9, -3.5]}><sphereGeometry args={[1.6, 64, 48]} /><meshStandardMaterial color="#c9874a" roughness={0.9} /></mesh>
      <ambientLight intensity={0.4} /><directionalLight position={[2, 2, 3]} intensity={2.2} color="#fff1dc" />
      <Bip state={() => ({ p: [0, 0, 0], rot: [0.1, 0.45, 0.05], face: "smug", talk: 0, wings: 0.4, thrust: 0.7 })} />
    </Scene3D>);
  return (   // эмоции: 8 Бипов в два ряда
    <Scene3D t0={0} light="night" bg="#070a18" cam={[[0, [0, -0.1, 6.4], [0, -0.1, 0], 40]]} focus={[0, 0, 0]}>
      <Stars /><ambientLight intensity={0.6} /><directionalLight position={[1, 2, 4]} intensity={2.4} color="#fff1dc" />
      {FACES.map((fc, i) => <Bip key={fc} state={() => ({ p: [((i % 2) - 0.5) * 1.35, 1.55 - Math.floor(i / 2) * 1.12, 0], rot: [0, 0.35 * ((i % 2) ? -1 : 1), 0], face: fc, talk: 0, wings: 0.9, thrust: 0, scale: 0.62 })} />)}
    </Scene3D>);
};
