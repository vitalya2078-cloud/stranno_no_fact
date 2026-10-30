// Герои «Дел Бюро» в 3D-сцене скилла: Марк — «стенд» из картинок (рот/моргание/эмоции сменой текстуры),
// Клякс — 3D-капля из кода (глянцевые чернила, фиолетовый ободок, светящиеся янтарные глаза), двигается без картинок.
import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender, staticFile } from "remotion";
import { Easing } from "remotion";
import { useSec } from "./kit";

type V3 = [number, number, number];
// ---------------------------------------------------------------- текстуры из public/ (ждём загрузки перед кадром)
const cache: Record<string, THREE.Texture> = {};
export const useTex = (name: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(cache[name] ?? null);
  useMemo(() => {
    if (cache[name]) return;
    const h = delayRender("tex " + name);
    new THREE.TextureLoader().load(staticFile(name), (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache[name] = t; setTex(t); continueRender(h);
    }, undefined, () => continueRender(h));
  }, [name]);
  return tex;
};

// ---------------------------------------------------------------- Марк-стенд
// frames: имя картинки по секунде голоса; всегда повёрнут к камере только по Y (как дудл скилла).
export const MarkStand: React.FC<{ p: V3; h: number; pick: (t: number) => string; bonk?: number[]; dim?: number }> = ({ p, h, pick, bonk = [], dim = 0.9 }) => {
  const t = useSec();
  const names = ["mark_base.png", "mark_blink.png", "mark_surprised.png", "mark_m_open_small.png", "mark_m_a.png", "mark_m_o.png"];
  const texs = names.map((n) => useTex(n));
  const tex = texs[names.indexOf(pick(t))] ?? texs[0];
  const w = h * (940 / 1672);
  let s = 1;
  for (const b of bonk) { const k = (t - b) * 30; if (k > 0) s *= 1 + 0.06 * Math.exp(-k / 3.5) * Math.cos(k * 1.25); }
  const breathe = 1 + 0.006 * Math.sin(t * 1.6);
  return (
    <mesh position={[p[0], p[1] + (h * s * breathe) / 2, p[2]]} scale={[s, s * breathe, 1]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex ?? undefined} transparent alphaTest={0.5} toneMapped={false} color={[dim, dim, dim]} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ---------------------------------------------------------------- Клякс 3D
// Состояние по секунде: позиция, сжатие (sy<1 — расплющен, >1 — вытянут), «лужица» (0..1), веки (0..1), рот (0..1), взгляд.
export type KlyState = { p: V3; sy: number; puddle: number; lid: number; mouth: number; smug: number; rotY: number; look: number };
const INK = "#160f26", RIM = "#8b5cff", EYE = "#ffbf2e";
const dropGeometry = () => {
  const g = new THREE.SphereGeometry(1, 64, 48), pos = g.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const up = Math.max(0, v.y);                                  // верх сужается в кончик капли
    const k = 1 - Math.pow(up, 1.6) * 0.82;
    v.x *= k; v.z *= k; if (v.y > 0) v.y *= 1 + 0.55 * Math.pow(up, 2);
    if (v.y < 0) v.y *= 0.82;                                     // низ чуть приплюснут — сидит на поверхности
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
};
export const Klyaks: React.FC<{ state: (t: number) => KlyState; r?: number }> = ({ state, r = 0.13 }) => {
  const t = useSec();
  const st = state(t);
  const geo = useMemo(dropGeometry, []);
  const sx = 1 / Math.sqrt(Math.max(0.2, st.sy)) * (1 + 1.2 * st.puddle), sy = st.sy * (1 - 0.82 * st.puddle);
  const eyeY = r * (0.25 - 0.05 * st.puddle), eyeZ = r * 0.86, ex = r * 0.38;
  const lid = Math.min(1, st.lid);
  const drops = [0, 1, 2, 3].map((i) => {
    const a = t * (0.6 + i * 0.13) + i * 1.7;
    return [Math.cos(a) * r * (1.8 + 0.2 * i), r * (0.6 + 0.5 * Math.sin(a * 1.3 + i)), Math.sin(a) * r * 1.1] as V3;
  });
  return (
    <group position={st.p} rotation={[0, st.rotY, 0]}>
      <group scale={[sx, sy, sx]} position={[0, r * 0.82 * sy, 0]}>
        <mesh geometry={geo} scale={[r, r, r]} castShadow>
          <meshStandardMaterial color={INK} roughness={0.18} metalness={0.15} emissive="#2a1650" emissiveIntensity={0.35} />
        </mesh>
        {/* ободок-контур: обратные грани чуть крупнее (как обводка в рисунке) */}
        <mesh geometry={geo} scale={[r * 1.06, r * 1.05, r * 1.06]}>
          <meshBasicMaterial color={RIM} side={THREE.BackSide} toneMapped={false} />
        </mesh>
        {/* блик */}
        <mesh position={[-r * 0.38, r * 0.45, r * 0.7]} rotation={[0, 0, 0.6]} scale={[r * 0.12, r * 0.28, r * 0.05]}>
          <sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#b9a3ff" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>
      {/* глаза поверх тела (не растягиваются вместе с ним — читаются при любом сжатии) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * ex * (1 + 0.6 * st.puddle), r * 0.82 * sy + eyeY * sy * 1.4, eyeZ * (1 + 0.3 * st.puddle)]}>
          <mesh scale={[r * 0.3, r * 0.34 * (1 - 0.92 * lid), r * 0.12]}>
            <sphereGeometry args={[1, 24, 16]} /><meshBasicMaterial color={EYE} toneMapped={false} />
          </mesh>
          {lid < 0.85 ? (<>
            <mesh position={[st.look * r * 0.08, -r * 0.02, r * 0.06]} scale={[r * 0.13, r * 0.16 * (1 - lid), r * 0.08]}>
              <sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#3a1c0c" />
            </mesh>
            <mesh position={[st.look * r * 0.08 - r * 0.05, r * 0.06, r * 0.12]} scale={[r * 0.045, r * 0.045, r * 0.02]}>
              <sphereGeometry args={[1, 10, 8]} /><meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          </>) : null}
          {/* ехидное веко: тёмная «шапочка» той же формы, опускается на верх глаза и чуть наклонена */}
          {st.smug > 0 ? (
            <mesh position={[0, r * 0.34 * (1.02 - 0.45 * st.smug), r * 0.07]} rotation={[0, 0, -s * 0.22 * st.smug]} scale={[r * 0.33, r * 0.2, r * 0.13]}>
              <sphereGeometry args={[1, 24, 16]} /><meshBasicMaterial color={INK} />
            </mesh>) : null}
        </group>
      ))}
      {/* рот: ухмылка-дуга или открытый овал на словах */}
      <group position={[r * 0.08, r * 0.82 * sy - r * 0.18 * sy, r * 0.93]}>
        {st.mouth > 0.12 ? (
          <mesh scale={[r * 0.22, r * (0.06 + 0.16 * st.mouth), r * 0.05]}>
            <sphereGeometry args={[1, 20, 12]} /><meshBasicMaterial color="#3d0d2c" />
          </mesh>
        ) : (
          <mesh rotation={[0, 0, Math.PI + 0.25 * st.smug]}>
            <torusGeometry args={[r * 0.2, r * 0.025, 8, 24, Math.PI * 0.75]} /><meshBasicMaterial color={RIM} toneMapped={false} />
          </mesh>
        )}
      </group>
      {/* парящие капли вокруг (как на листе персонажа) */}
      {drops.map((d, i) => (
        <mesh key={i} position={[d[0], d[1] + r * 0.6, d[2]]} scale={r * (0.09 + 0.03 * (i % 2))}>
          <sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color={INK} roughness={0.2} emissive={RIM} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
};

// Помощники анимации
export const ease = (a: number, b: number, t: number, f = Easing.inOut(Easing.ease)) => (t <= a ? 0 : t >= b ? 1 : f((t - a) / (b - a)));
export const springOut = (t: number, t0: number, amt = 0.35, decay = 0.18) => (t < t0 ? 0 : amt * Math.exp(-(t - t0) / decay) * Math.cos((t - t0) * 22));
