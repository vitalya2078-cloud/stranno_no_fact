// Набор для сцен в стиле «дудлы в 3D» на three.js внутри Remotion.
// Всё в метрах: x вправо, y вверх, z к камере. Задняя стена комнаты при z = −d/2.
import React, { createContext, useContext, useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, DepthOfField, Bloom, Vignette } from "@react-three/postprocessing";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { CH, CW, PLANE_H, PLANE_W, drawDoodle, Look, Pose } from "./doodle";

export const FPS = 30;
export const LINE = "#20180f";
type V3 = [number, number, number];

// ------------------------------------------------------------------ время шота
// Каждый шот получает t0 — секунду голоса, с которой он начинается. sec() = текущая секунда ГОЛОСА.
const ShotCtx = createContext<{ t0: number; cam: THREE.Vector3 }>({ t0: 0, cam: new THREE.Vector3() });
export const useSec = () => { const f = useCurrentFrame(); const { t0 } = useContext(ShotCtx); return t0 + f / FPS; };

// ------------------------------------------------------------------ обводка рёбер (как Line Art)
let lineMat: LineMaterial | null = null;
const getLineMat = (w: number, h: number) => {
  if (!lineMat) lineMat = new LineMaterial({ color: LINE, linewidth: 3.2, worldUnits: false });
  lineMat.resolution.set(w, h);
  return lineMat;
};

export const Box: React.FC<{ p: V3; s: V3; c: string; r?: number; rot?: V3; e?: string; ei?: number; metal?: number;
  line?: boolean; shadow?: boolean; map?: THREE.Texture | null }> =
  ({ p, s, c, r = 0.75, rot = [0, 0, 0], e, ei = 0, metal = 0, line = true, shadow = true, map = null }) => {
    const { size } = useThree();
    const edges = useMemo(() => {
      if (!line) return null;
      const eg = new THREE.EdgesGeometry(new THREE.BoxGeometry(...s));
      return new LineSegments2(new LineSegmentsGeometry().setPositions(eg.attributes.position.array as Float32Array), getLineMat(size.width, size.height));
    }, [line, s[0], s[1], s[2]]);
    return (
      <group position={p} rotation={rot}>
        <mesh castShadow={shadow} receiveShadow>
          <boxGeometry args={s} />
          <meshStandardMaterial color={c} roughness={r} metalness={metal} emissive={e ?? "#000"} emissiveIntensity={ei} map={map} />
        </mesh>
        {edges ? <primitive object={edges} /> : null}
      </group>
    );
  };

// ------------------------------------------------------------------ текстуры из Canvas (надписи, часы)
export const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
export const label = (txt: string, bg: string, fg: string, w = 512, h = 176, sz = 110) => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `900 ${sz}px Arial Black, Arial, sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2 + 4);
});

// Плоская табличка/вывеска/постер на стене (смотрит на камеру, +z). glow — подсветка.
export const Sign: React.FC<{ p: V3; w: number; h: number; text: string; bg: string; fg: string; glow?: number; rotY?: number; sz?: number }> =
  ({ p, w, h, text, bg, fg, glow = 0.25, rotY = 0, sz }) => {
    const tex = useMemo(() => label(text, bg, fg, 512, Math.round((512 * h) / w), sz ?? Math.min(110, Math.round(((512 * h) / w) * 0.6))), [text, bg, fg, w, h]);
    return <mesh position={p} rotation={[0, rotY, 0]}><planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={glow} /></mesh>;
  };

// Настенные часы: hh:mm. bonk — масштаб всей группы (НЕ только циферблата).
export const Clock: React.FC<{ p: V3; r?: number; hh?: number; mm?: number; scale?: number }> = ({ p, r = 0.17, hh = 10, mm = 10, scale = 1 }) => {
  const tex = useMemo(() => canvasTex(256, 256, (g) => {
    g.fillStyle = "#fbf7ea"; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#1d1f23"; g.lineWidth = 14; g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.lineWidth = i % 3 ? 4 : 8; g.beginPath();
      g.moveTo(128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92); g.lineTo(128 + Math.sin(a) * 106, 128 - Math.cos(a) * 106); g.stroke(); }
    g.font = "900 30px Arial"; g.fillStyle = "#1d1f23"; g.textAlign = "center"; g.textBaseline = "middle";
    [["12", 0], ["3", 3], ["6", 6], ["9", 9]].forEach(([n, i]) => { const a = ((i as number) * Math.PI) / 6; g.fillText(n as string, 128 + Math.sin(a) * 70, 128 - Math.cos(a) * 70); });
    const ha = (((hh % 12) + mm / 60) / 12) * Math.PI * 2, ma = (mm / 60) * Math.PI * 2;
    g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(ha) * 55, 128 - Math.cos(ha) * 55); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(ma) * 85, 128 - Math.cos(ma) * 85); g.stroke();
  }), [hh, mm]);
  return <mesh position={p} scale={[scale, scale, 1]}><circleGeometry args={[r, 40]} />
    <meshStandardMaterial map={tex} emissive="#fff7e0" emissiveMap={tex} emissiveIntensity={0.35} /></mesh>;
};

// ------------------------------------------------------------------ реквизит
export const Desk: React.FC<{ p: V3; rotY?: number; w?: number }> = ({ p, rotY = 0, w = 1.4 }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <Box p={[0, 0.75, 0]} s={[w, 0.05, 0.7]} c="#b8784a" r={0.6} />
    {[-1, 1].map((s) => <Box key={s} p={[s * (w / 2 - 0.2), 0.37, 0]} s={[0.36, 0.72, 0.63]} c="#7a4a2c" />)}
    {[-1, 1].flatMap((s) => [0.2, 0.45, 0.65].map((z) => <Box key={s + "" + z} p={[s * (w / 2 - 0.2), z, 0.33]} s={[0.12, 0.025, 0.02]} c="#c9ccd1" metal={0.8} r={0.3} line={false} />))}
  </group>
);
export const Chair: React.FC<{ p: V3; rotY?: number; c?: string }> = ({ p, rotY = 0, c = "#2f9e9a" }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <Box p={[0, 0.48, 0]} s={[0.48, 0.08, 0.46]} c={c} /><Box p={[0, 0.85, -0.22]} s={[0.48, 0.6, 0.07]} c={c} />
    <Box p={[0, 0.24, 0]} s={[0.07, 0.44, 0.07]} c="#2a2d33" /><Box p={[0, 0.03, 0]} s={[0.5, 0.05, 0.5]} c="#2a2d33" />
  </group>
);
export const Shelf: React.FC<{ p: V3; rotY?: number; w?: number; h?: number }> = ({ p, rotY = 0, w = 1.0, h = 1.8 }) => {
  const cols = ["#d64545", "#2f6fd6", "#f2c230", "#3f8a4b", "#2f9e9a", "#e46b2b", "#efe6d2"];
  const books: JSX.Element[] = [];
  for (let k = 0; k < 4; k++) { let x = -w / 2 + 0.06, i = 0; while (x < w / 2 - 0.1) {
    const bw = 0.04 + ((k * 7 + i * 13) % 6) * 0.01, bh = 0.22 + ((k * 5 + i * 3) % 5) * 0.03;
    books.push(<Box key={k + "_" + i} p={[x + bw / 2, 0.05 + (k * h) / 4 + bh / 2 + 0.015, 0]} s={[bw, bh, 0.24]} c={cols[(k + i) % 7]} line={bh > 0.3} />);
    x += bw + 0.005; i++; } }
  return (<group position={p} rotation={[0, rotY, 0]}>
    {[-1, 1].map((s) => <Box key={s} p={[(s * w) / 2, h / 2, 0]} s={[0.04, h, 0.32]} c="#7a4a2c" />)}
    {[0, 1, 2, 3].map((k) => <Box key={k} p={[0, 0.05 + (k * h) / 4, 0]} s={[w, 0.03, 0.32]} c="#7a4a2c" />)}{books}
  </group>);
};
export const Plant: React.FC<{ p: V3; h?: number }> = ({ p, h = 0.6 }) => (
  <group position={p}>
    <Box p={[0, 0.15, 0]} s={[0.26, 0.3, 0.26]} c="#b5653a" />
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[Math.cos(i) * 0.07, 0.3 + h * 0.4, Math.sin(i) * 0.07]} rotation={[Math.sin(i) * 0.45, i, Math.cos(i) * 0.45]} castShadow>
      <boxGeometry args={[0.07, h * 0.8, 0.02]} /><meshStandardMaterial color="#3f8a4b" /></mesh>)}
  </group>
);
export const Bench: React.FC<{ p: V3; rotY?: number; c?: string; w?: number }> = ({ p, rotY = 0, c = "#d07a3a", w = 1.6 }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <Box p={[0, 0.45, 0]} s={[w, 0.06, 0.45]} c={c} r={0.6} /><Box p={[0, 0.75, -0.22]} s={[w, 0.4, 0.06]} c={c} r={0.6} />
    {[-1, 1].map((s) => <Box key={s} p={[(s * (w - 0.2)) / 2, 0.22, 0]} s={[0.06, 0.44, 0.4]} c="#8d939b" />)}
  </group>
);
export const Monitor: React.FC<{ p: V3; rotY?: number; screen?: string }> = ({ p, rotY = 0, screen = "#3d7bd6" }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <Box p={[0, 0.32, 0]} s={[0.55, 0.34, 0.04]} c="#2a2d33" />
    <mesh position={[0, 0.32, 0.022]}><planeGeometry args={[0.5, 0.29]} /><meshBasicMaterial color={new THREE.Color(screen).multiplyScalar(1.4)} toneMapped={false} /></mesh>
    <Box p={[0, 0.1, -0.03]} s={[0.05, 0.2, 0.05]} c="#2a2d33" /><Box p={[0, 0.01, -0.02]} s={[0.25, 0.02, 0.18]} c="#2a2d33" />
  </group>
);
// Зеркало — СТИЛИЗОВАННОЕ (светлое стекло + блики). Настоящее отражение = тёмная «дыра».
export const Mirror: React.FC<{ p: V3; w?: number; h?: number; scale?: number }> = ({ p, w = 0.8, h = 1.2, scale = 1 }) => (
  <group position={p} scale={[scale, scale, scale]}>
    <Box p={[0, 0, 0]} s={[w + 0.1, h + 0.1, 0.05]} c="#c8a24a" r={0.35} metal={0.5} />
    <mesh position={[0, 0, 0.03]}><planeGeometry args={[w, h]} /><meshStandardMaterial color="#cfe3f2" emissive="#e8f4ff" emissiveIntensity={0.4} roughness={0.15} /></mesh>
    {[-0.12, 0.05].map((dx, i) => <mesh key={i} position={[dx * w * 4, 0.05, 0.035]} rotation={[0, 0, 0.45]}><planeGeometry args={[i ? 0.035 : 0.08, h * 0.85]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.75} /></mesh>)}
  </group>
);
export const Door: React.FC<{ p: V3; c?: string; number?: string }> = ({ p, c = "#4f7aa6", number }) => (
  <group position={p}>
    <Box p={[0, 1.05, 0]} s={[0.95, 2.1, 0.06]} c={c} r={0.4} />
    <Box p={[-0.52, 1.08, 0]} s={[0.08, 2.16, 0.1]} c="#8d939b" /><Box p={[0.52, 1.08, 0]} s={[0.08, 2.16, 0.1]} c="#8d939b" /><Box p={[0, 2.18, 0]} s={[1.12, 0.08, 0.1]} c="#8d939b" />
    <Box p={[0.33, 1.0, 0.06]} s={[0.18, 0.04, 0.05]} c="#c9ccd1" metal={0.8} r={0.3} />
    {number ? <Sign p={[-0.75, 1.6, 0.02]} w={0.3} h={0.16} text={number} bg="#f6f3ea" fg="#222" glow={0.1} /> : null}
  </group>
);
export const Lamp: React.FC<{ p: V3; len?: number; glow?: number }> = ({ p, len = 1.4, glow = 1.02 }) => (
  <mesh position={p}><boxGeometry args={[len, 0.04, 0.16]} /><meshBasicMaterial color={[glow, glow * 0.96, glow * 0.88]} toneMapped={false} /></mesh>
);

// Комната: пол, потолок, задняя и боковые стены (с рёбрами-обводкой), панель снизу, окно слева (небо-плоскость).
export const Room: React.FC<{ w?: number; d?: number; h?: number; wall?: string; floor?: string; wain?: string; ceil?: string; window?: boolean; sky?: string }> =
  ({ w = 6, d = 4, h = 3, wall = "#4f8f95", floor = "#2f4fa8", wain = "#3f7479", ceil = "#d9d4c8", window = true, sky = "#bfe0ff" }) => {
    const L = -w / 2, B = -d / 2;
    return (<>
      <Box p={[0, -0.05, 0]} s={[w, 0.1, d]} c={floor} line={false} r={0.8} />
      <Box p={[0, h + 0.05, 0]} s={[w, 0.1, d]} c={ceil} />
      <Box p={[0, h / 2, B - 0.05]} s={[w, h, 0.1]} c={wall} r={0.85} />
      <Box p={[-L + 0.05, h / 2, 0]} s={[0.1, h, d]} c={wall} r={0.85} />
      {window ? (<>
        <Box p={[L - 0.05, h / 2, B + (d / 2 - 0.7) / 2]} s={[0.1, h, d / 2 - 0.7]} c={wall} />
        <Box p={[L - 0.05, h / 2, (1.1 + d / 2) / 2]} s={[0.1, h, d / 2 - 1.1]} c={wall} />
        <Box p={[L - 0.05, 0.475, 0.2]} s={[0.1, 0.95, 1.8]} c={wall} />
        <Box p={[L - 0.05, (2.35 + h) / 2, 0.2]} s={[0.1, h - 2.35, 1.8]} c={wall} />
        <mesh position={[L - 1.6, 1.6, 0.2]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[5, 4]} /><meshBasicMaterial color={sky} /></mesh>
      </>) : <Box p={[L - 0.05, h / 2, 0]} s={[0.1, h, d]} c={wall} />}
      <Box p={[0, 0.45, B + 0.02]} s={[w, 0.9, 0.04]} c={wain} />
      <Box p={[-L - 0.02, 0.45, 0]} s={[0.04, 0.9, d]} c={wain} />
      <Box p={[0, 0.92, B + 0.05]} s={[w, 0.04, 0.05]} c="#e9e2cf" />
    </>);
  };

// ------------------------------------------------------------------ персонажи
type Key = [number, number, number];   // [секунда голоса, x, z] — точка руки в метрах (x вправо, z вверх от пола)
export const HIP = 0.4;
export const REST_F: [number, number] = [-0.2, HIP + 0.06], REST_B: [number, number] = [0.2, HIP + 0.06];
export const HEAD_Z = HIP + 0.36 + 0.27 * 0.78;                       // центр головы
const track = (t: number, keys: Key[]): [number, number] => {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const a = keys[i - 1], b = keys[i];
    const k = Easing.out(Easing.back(1.8))((t - a[0]) / Math.max(1e-6, b[0] - a[0]));   // выброс с перелётом
    return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
export type Actor = {
  pos: V3; look: Look; seed: number;
  expr: [number, string][];                 // [[секунда, эмоция], ...] — бонк на каждой смене
  handF?: Key[]; handB?: Key[]; lean?: Key[]; talk?: [number, number][]; walk?: Key[]; hidden?: [number, number][];
};
// Жест «указать» в сторону (dx, dz) от плеча: замах → выброс → удержание → возврат.
export const pointKeys = (t: number, dx: number, dz: number, hold = 1.0, side: "f" | "b" = "f"): Key[] => {
  const rest = side === "f" ? REST_F : REST_B, sh = side === "f" ? -0.12 : 0.12;
  return [[t - 0.35, ...rest], [t - 0.12, sh * 0.2, HEAD_Z + 0.15], [t, sh + dx * 0.6, HIP + 0.25 + dz * 0.6], [t + hold, sh + dx * 0.6, HIP + 0.25 + dz * 0.6], [t + hold + 0.25, ...rest]];
};

export const Doodle: React.FC<{ a: Actor }> = ({ a }) => {
  const sec = useSec();
  const { cam } = useContext(ShotCtx);
  const { canvas, tex } = useMemo(() => {
    const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { canvas: cv, tex: t };
  }, []);
  const f2 = Math.floor(sec * FPS / 2) * 2;                              // по двойкам
  const t = f2 / FPS;
  if (a.hidden?.some(([s, e]) => t >= s && t < e)) return null;
  let ex = a.expr[0][1], tc = -10;
  for (const [tt, e] of a.expr) if (t >= tt) { ex = e; tc = tt; }
  const tb = (t - tc) * FPS;
  const bonk = tc > -10 && tb >= 0 ? Math.exp(-tb / 3.5) * Math.cos(tb * 1.25) : 0;
  let sd = a.seed * 9301 + f2 * 49297; const rnd = () => ((sd = (sd * 233280 + 49297) % 233280) / 233280);
  const dart = Math.sin(t * 1.7 + a.seed * 2) > 0.6 ? 0.9 : Math.sin(t * 1.3 + a.seed) < -0.7 ? -0.9 : 0;
  const talking = a.talk?.some(([s, e]) => t >= s && t < e);
  const pose: Pose = {
    expr: ex, blink: (f2 + a.seed * 37) % 79 < 3, bonk, breathe: Math.sin(f2 / 14) * 0.012, lookX: dart,
    talk: talking ? 0.25 + 0.75 * Math.abs(Math.sin(t * FPS * Math.PI / 3.5)) : 0,
    handF: a.handF ? track(t, a.handF) : REST_F, handB: a.handB ? track(t, a.handB) : REST_B,
    lean: a.lean ? track(t, a.lean)[0] : 0, tilt: Math.sin(t * 1.1 + a.seed) * 0.03,
  };
  drawDoodle(canvas.getContext("2d")!, a.look, pose, rnd);
  tex.needsUpdate = true;
  const pos = a.walk ? (() => { const [x, z] = track(t, a.walk!); return [x, a.pos[1], z] as V3; })() : a.pos;
  const yaw = Math.atan2(cam.x - pos[0], cam.z - pos[2]);
  return (
    <mesh position={[pos[0], pos[1] + PLANE_H / 2, pos[2]]} rotation={[0, yaw, 0]} receiveShadow>
      <planeGeometry args={[PLANE_W, PLANE_H]} />
      <meshLambertMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.5} transparent alphaTest={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
};

// ------------------------------------------------------------------ камера и сцена
export type CamKey = [number, V3, V3, number?];   // [секунда, позиция, куда смотрит, fov]
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const camAt = (t: number, keys: CamKey[]) => {
  if (t <= keys[0][0]) return keys[0];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = Easing.inOut(Easing.ease)((t - a[0]) / (b[0] - a[0]));
    return [t, lerp3(a[1], b[1], k), lerp3(a[2], b[2], k), (a[3] ?? 74) + ((b[3] ?? 74) - (a[3] ?? 74)) * k] as CamKey;
  }
  return keys[keys.length - 1];
};
const CamRig: React.FC<{ pos: THREE.Vector3; look: THREE.Vector3; fov: number }> = ({ pos, look, fov }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.copy(pos); c.lookAt(look); c.fov = fov; c.near = 0.05; c.far = 25;   // far=25 — иначе размытие не работает
  c.updateProjectionMatrix();
  return null;
};

export type LightPreset = "day" | "night" | "studio";
const Lights: React.FC<{ preset: LightPreset; windowX: number }> = ({ preset, windowX }) => (
  preset === "day" ? (<>
    <hemisphereLight args={["#d6e6ff", "#3a3a5a", 0.9]} />
    <directionalLight position={[windowX - 3, 4.5, 1.5]} intensity={2.6} color="#ffd9a8" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      shadow-radius={8} shadow-bias={-0.0005} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
    <directionalLight position={[3, 2.5, 5]} intensity={0.7} color="#cfe0ff" />
    <pointLight position={[0.4, 2.75, -0.3]} intensity={5} decay={1.4} color="#fff0d8" />
  </>) : preset === "night" ? (<>
    <hemisphereLight args={["#5a6fb0", "#0c1430", 0.5]} />
    <directionalLight position={[windowX - 3, 4, 1]} intensity={1.4} color="#7d95ff" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-radius={8}
      shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
    <pointLight position={[0.5, 1.6, 0.4]} intensity={7} decay={1.3} color="#ffc477" castShadow />
  </>) : (<>
    <hemisphereLight args={["#cfd8ff", "#141a33", 0.5]} />
    <spotLight position={[-1, 6, 2]} angle={0.5} penumbra={0.6} intensity={60} decay={1} color="#ff8a7a" castShadow />
    <spotLight position={[1.5, 6, 2]} angle={0.5} penumbra={0.6} intensity={60} decay={1} color="#7af0ff" castShadow />
  </>)
);

// Сцена-шот: камера по ключам (в секундах голоса), свет-пресет, постобработка (размытие фона, свечение, виньетка).
export const Scene3D: React.FC<{ t0: number; cam: CamKey[]; focus: V3; light?: LightPreset; bg?: string; windowX?: number; children: React.ReactNode }> =
  ({ t0, cam, focus, light = "day", bg = "#9fbfe0", windowX = -3, children }) => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();
    const t = t0 + frame / FPS;
    const [, p, l, fov] = camAt(t, cam);
    const pos = new THREE.Vector3(...p);
    pos.x += Math.sin(frame / 23) * 0.012; pos.y += Math.sin(frame / 17) * 0.008;   // «ручная» камера
    return (
      <ShotCtx.Provider value={{ t0, cam: pos }}>
        <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }}
          gl={{ toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.25, antialias: false }} style={{ backgroundColor: bg }}>
          <ShotCtx.Provider value={{ t0, cam: pos }}>
            <CamRig pos={pos} look={new THREE.Vector3(...l)} fov={fov ?? 74} />
            <Lights preset={light} windowX={windowX} />
            {children}
            <EffectComposer multisampling={4}>
              <DepthOfField target={focus} focalLength={0.012} bokehScale={7} height={1080} />
              <Bloom luminanceThreshold={1.0} intensity={0.35} mipmapBlur />
              <Vignette eskil={false} offset={0.25} darkness={0.45} />
            </EffectComposer>
          </ShotCtx.Provider>
        </ThreeCanvas>
      </ShotCtx.Provider>
    );
  };

// «Бонк» предмета на ударном слове: масштаб 1→1.35→0.85→1.
export const bonkAt = (sec: number, t: number, amt = 0.35) => {
  const tb = (sec - t) * FPS;
  return tb > 0 ? 1 + amt * Math.exp(-tb / 3.5) * Math.cos(tb * 1.25) : 1;
};
