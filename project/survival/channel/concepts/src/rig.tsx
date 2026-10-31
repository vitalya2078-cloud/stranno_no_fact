// РИГИ КАНАЛА «План Б»: герой (Тимур / Лёва / Саня) и собака Бублик.
// Герой: голова, корпус, плечо→предплечье→кисть, бедро→голень→стопа — прямая кинематика по углам; мимика (глаза, брови, рот) отдельно.
// Углы в градусах: 0 — конечность смотрит вниз, «+» — вперёд (в сторону взгляда). Виды: front (анфас), q34 (3/4), side (профиль, смотрит вправо).
// Ходьба: walkPose(phase) — опорная стопа движется назад линейно, тело едет со скоростью WALK_SPEED → стопы не скользят.
import React from "react";

// ------------------------------------------------------------------ внешность героев (из style.md)
export type Look = { name: string; hoodie: string; cap: string; jeans: string; detail: "tape" | "pack" | "radio" };
export const TIMUR: Look = { name: "Тимур", hoodie: "#24365E", cap: "#E3A325", jeans: "#3B4A6B", detail: "tape" };
export const LEV: Look = { name: "Лёва", hoodie: "#6B7A3A", cap: "#8E2B2B", jeans: "#3B4A6B", detail: "pack" };
export const SANYA: Look = { name: "Саня", hoodie: "#8A8F98", cap: "#C8352A", jeans: "#33405E", detail: "radio" };
const SKIN = "#F1C7A0", SKIN_D = "#C9946C", BOOT = "#5A3B28", RIM = "#FFD9A0", INK = "#2A2A22";
export const shade = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16);
  return `rgb(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(Math.max(0, Math.min(255, v * k)))).join(",")})`; };
const R = Math.PI / 180;
const seg = (x: number, y: number, len: number, a: number): [number, number] => [x + len * Math.sin(a * R), y + len * Math.cos(a * R)];

// ------------------------------------------------------------------ поза
export type View = "front" | "q34" | "side";
export type Mouth = "flat" | "smile" | "o" | "worried" | "talk";
export type Prop = "none" | "phone" | "lamp" | "pen" | "notebook";
export type Pose = {
  view: View; lean?: number; drop?: number; head?: number; look?: number; brows?: number; mouth?: Mouth;
  armF: [number, number]; armB: [number, number]; legF: [number, number]; legB: [number, number];
  prop?: Prop; propHand?: "F" | "B"; sit?: boolean;
};
export const POSES: Record<string, Pose> = {
  stand: { view: "q34", armF: [6, 8], armB: [-6, 8], legF: [2, 0], legB: [-2, 0] },
  sit: { view: "side", sit: true, drop: 70, lean: -4, armF: [40, 50], armB: [30, 60], legF: [90, -90], legB: [84, -86], mouth: "flat" },
  crouch: { view: "side", drop: 66, lean: 18, head: -6, armF: [40, 60], armB: [25, 70], legF: [70, -120], legB: [40, -100], brows: 0.4, look: 0.5 },
  phone: { view: "q34", armF: [40, 115], armB: [-4, 8], legF: [3, 0], legB: [-3, 0], head: 14, look: 0.6, prop: "phone", propHand: "F", brows: 0.6, mouth: "worried" },
  overShoulder: { view: "side", lean: -2, head: -24, look: -1, armF: [4, 10], armB: [-8, 10], legF: [6, 0], legB: [-6, 0], brows: 0.8, mouth: "o" },
  point: { view: "side", armF: [100, 0], armB: [-10, 12], legF: [10, 0], legB: [-8, 0], head: -6, look: 1, brows: 0.3, mouth: "talk" },
  write: { view: "q34", head: 16, look: 0.4, armF: [35, 95], armB: [25, 100], legF: [3, 0], legB: [-3, 0], prop: "notebook", propHand: "B", mouth: "flat", brows: -0.3 },
  lamp: { view: "side", armF: [80, 10], armB: [-6, 10], legF: [8, 0], legB: [-6, 0], head: -4, look: 1, prop: "lamp", propHand: "F", brows: 0.2 },
};
export const WALK_STRIDE = 0.42;                      // половина размаха бедра, рад
const LEG = 165;                                     // бедро 85 + голень 80
export const WALK_SPEED_PER_CYCLE = 2 * 2 * LEG * Math.sin(WALK_STRIDE); // путь за цикл (2 шага), px при масштабе 1
// phase ∈ [0,1): 0–0.5 правая (передняя) нога в опоре, 0.5–1 — левая
export const walkPose = (phase: number, base: Partial<Pose> = {}): Pose => {
  const leg = (p: number): [number, number] => {
    const q = ((p % 1) + 1) % 1;
    if (q < 0.5) { const fx = LEG * Math.sin(WALK_STRIDE) * (1 - 4 * q); return [Math.asin(fx / LEG) / R, 0]; }   // опора: стопа назад по прямой
    const s = (q - 0.5) / 0.5;                                                                                     // перенос: вперёд, колено сгибается
    return [(-WALK_STRIDE + 2 * WALK_STRIDE * (0.5 - 0.5 * Math.cos(Math.PI * s))) / R, -60 * Math.sin(Math.PI * s)];
  };
  const lf = leg(phase), lb = leg(phase + 0.5);
  return { view: "side", armF: [-lf[0] * 0.8, 14], armB: [-lb[0] * 0.8, 14], legF: lf, legB: lb,
    drop: -6 * Math.abs(Math.cos(2 * Math.PI * phase)), look: 0.6, ...base };
};

// ------------------------------------------------------------------ ГЕРОЙ
export const Hero: React.FC<{ look: Look; pose: Pose; x: number; y: number; s?: number; flip?: boolean; t?: number }> = ({ look, pose, x, y, s = 1, flip = false, t = 0 }) => {
  const v = pose.view; const side = v === "side"; const front = v === "front";
  const drop = pose.drop ?? 0; const br = Math.sin(t * 2.1) * 2.2;                   // дыхание
  const blink = ((t * 30) % 113) < 4;
  const ol = (c: string) => shade(c, 0.6);
  const hipY = -170 + drop, shY = -335 + drop + br * 0.5;
  // корпус наклоняется вокруг таза
  const lean = pose.lean ?? 0;
  const tx = (yy: number) => (yy - hipY) * Math.sin(-lean * R) * -1;              // смещение по x на высоте yy
  // суставы
  const hipXF = side ? 6 : 27, hipXB = side ? -6 : -27;
  const shXF = side ? 10 : v === "q34" ? 70 : 76, shXB = side ? -10 : v === "q34" ? -64 : -76;
  const limb = (x0: number, y0: number, a1: number, a2: number, l1: number, l2: number) => {
    const k = seg(x0, y0, l1, a1); const e = seg(k[0], k[1], l2, a1 + a2); return { k, e };
  };
  // в анфас «вперёд» = в стороны: правая рука/нога (+x) наружу при +угле, левая — зеркально
  const legF = limb(hipXF, hipY, front ? pose.legF[0] * 0.25 + 2 : pose.legF[0], pose.legF[1], 85, 80);
  const legB = limb(hipXB, hipY, front ? -pose.legB[0] * 0.25 - 2 : pose.legB[0], pose.legB[1], 85, 80);
  const armF = limb(shXF + tx(shY), shY, front ? Math.abs(pose.armF[0]) * 0.5 + 6 : pose.armF[0] + lean, pose.armF[1], 85, 75);
  const armB = limb(shXB + tx(shY), shY, front ? -Math.abs(pose.armB[0]) * 0.5 - 6 : pose.armB[0] + lean, pose.armB[1], 85, 75);
  const stroke = (l: { k: [number, number]; e: [number, number] }, x0: number, y0: number, c: string, w: number) => (<g>
    <polyline points={`${x0},${y0} ${l.k[0]},${l.k[1]} ${l.e[0]},${l.e[1]}`} fill="none" stroke={ol(c)} strokeWidth={w + 6} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={`${x0},${y0} ${l.k[0]},${l.k[1]} ${l.e[0]},${l.e[1]}`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </g>);
  const boot = (e: [number, number], back: boolean) => side || v === "q34"
    ? <ellipse cx={e[0] + 14} cy={e[1] + 4} rx={34} ry={15} fill={back ? shade(BOOT, 0.8) : BOOT} stroke={ol(BOOT)} strokeWidth={3} />
    : <ellipse cx={e[0]} cy={e[1] + 6} rx={26} ry={15} fill={BOOT} stroke={ol(BOOT)} strokeWidth={3} />;
  const hand = (e: [number, number], back: boolean) => <circle cx={e[0]} cy={e[1]} r={19} fill={back ? shade(SKIN, 0.92) : SKIN} stroke={ol(SKIN)} strokeWidth={3} />;
  const propAt = (e: [number, number]) => {
    const p = pose.prop ?? "none";
    if (p === "phone") return <g><rect x={e[0] - 14} y={e[1] - 44} width={30} height={52} rx={6} fill={INK} /><rect x={e[0] - 10} y={e[1] - 39} width={22} height={38} rx={3} fill="#7FD3FF" />
      <circle cx={e[0] + 4} cy={e[1] - 52} r={9} fill="#E53935" /></g>;
    if (p === "lamp") return <g><rect x={e[0] - 4} y={e[1] - 14} width={40} height={22} rx={6} fill={INK} /><circle cx={e[0] + 38} cy={e[1] - 3} r={10} fill="#FFE9A8" />
      <path d={`M${e[0] + 40},${e[1] - 12} L${e[0] + 260},${e[1] - 70} L${e[0] + 260},${e[1] + 70} L${e[0] + 40},${e[1] + 6}z`} fill="#FFE9A8" opacity={0.25} /></g>;
    if (p === "notebook") return <g><rect x={e[0] - 30} y={e[1] - 40} width={62} height={78} rx={4} fill="#F6F2E7" stroke="#B8AE96" strokeWidth={3} transform={`rotate(-12 ${e[0]} ${e[1]})`} />
      {[0, 1, 2].map((i) => <line key={i} x1={e[0] - 18} y1={e[1] - 22 + i * 16} x2={e[0] + 18} y2={e[1] - 26 + i * 16} stroke="#9FB3CF" strokeWidth={3} />)}</g>;
    return null;
  };
  const pf = pose.prop && pose.prop !== "none" ? (pose.propHand === "B" ? armB.e : armF.e) : null;
  // торс
  const tw = side ? 100 : v === "q34" ? 132 : 144;
  const tcx = side ? 0 : v === "q34" ? 4 : 0;
  const torsoTop = shY - 22, torsoH = hipY - torsoTop + 22;
  // голова
  const headX = tcx + tx(shY - 120) + (side ? 6 : 0), headY = shY - 132;
  const ht = (pose.head ?? 0) + (side ? 0 : 0);
  const lookX = (pose.look ?? 0) * 6;
  const ex = side ? [44] : v === "q34" ? [-10, 42] : [-30, 30];
  const bro = pose.brows ?? 0;
  const mouth = pose.mouth ?? "flat"; const mx = side ? 52 : v === "q34" ? 20 : 0;
  const talkO = mouth === "talk" ? 4 + 4 * Math.abs(Math.sin(t * 14)) : 0;
  const body = (
    <g>
      {/* дальняя рука и нога — темнее, за корпусом */}
      {look.detail === "pack" && !front ? <rect x={tcx - tw / 2 - 40 + tx(shY)} y={shY - 4} width={70} height={150} rx={22} fill="#C0392B" stroke={ol("#C0392B")} strokeWidth={3} /> : null}
      {stroke(legB, hipXB, hipY, shade(look.jeans, 0.82), 40)}{boot(legB.e, true)}
      {stroke(armB, shXB + tx(shY), shY, shade(look.hoodie, 0.78), 36)}{hand(armB.e, true)}
      {pose.propHand === "B" && pf ? propAt(pf) : null}
      {stroke(legF, hipXF, hipY, look.jeans, 42)}{boot(legF.e, false)}
      {/* корпус-худи */}
      <g transform={`rotate(${lean} ${tcx} ${hipY})`}>
        {look.detail === "pack" && front ? <rect x={-64} y={shY - 6} width={128} height={150} rx={26} fill="#C0392B" stroke={ol("#C0392B")} strokeWidth={3} /> : null}
        <rect x={tcx - tw / 2} y={torsoTop} width={tw} height={torsoH} rx={side ? 40 : 44} fill={look.hoodie} stroke={ol(look.hoodie)} strokeWidth={3} />
        <rect x={tcx - tw / 2 + tw * 0.62} y={torsoTop + 10} width={tw * 0.3} height={torsoH - 20} rx={14} fill="#000" opacity={0.08} />
        {!side ? <path d={`M${tcx - 40},${hipY - 60} h80 v34 q-40,14 -80,0z`} fill={shade(look.hoodie, 0.85)} /> : <path d={`M${tcx + 8},${hipY - 60} h40 v34 q-20,10 -40,0z`} fill={shade(look.hoodie, 0.85)} />}
        {!side ? <><line x1={tcx - 14} y1={torsoTop + 10} x2={tcx - 16} y2={torsoTop + 58} stroke="#eee" strokeWidth={4} strokeLinecap="round" />
          <line x1={tcx + 14} y1={torsoTop + 10} x2={tcx + 16} y2={torsoTop + 58} stroke="#eee" strokeWidth={4} strokeLinecap="round" /></> : null}
        <path d={`M${tcx + tw / 2 - 6},${torsoTop + 30} q8,${torsoH * 0.4} 0,${torsoH * 0.8}`} fill="none" stroke={RIM} strokeWidth={5} opacity={0.7} strokeLinecap="round" />
        {/* детали */}
        {look.detail === "tape" ? <g><circle cx={tcx + (side ? 18 : 50)} cy={hipY - 8} r={20} fill="none" stroke="#2F6FD6" strokeWidth={13} />
          <rect x={tcx - (side ? 30 : 62)} y={hipY - 26} width={13} height={38} rx={4} fill="#9AA3AD" stroke={ol("#9AA3AD")} strokeWidth={2} /></g> : null}
        {look.detail === "pack" ? <g><rect x={tcx - (side ? 6 : 52)} y={torsoTop + 4} width={13} height={torsoH - 30} rx={6} fill="#962D22" />
          {!side ? <rect x={tcx + 40} y={torsoTop + 4} width={13} height={torsoH - 30} rx={6} fill="#962D22" /> : null}
          <rect x={tcx + (side ? -2 : 36)} y={torsoTop + 50} width={20} height={30} rx={5} fill={INK} /><circle cx={tcx + (side ? 8 : 46)} cy={torsoTop + 46} r={9} fill="#FFE9A8" />
          <circle cx={tcx + (side ? 8 : 46)} cy={torsoTop + 46} r={24} fill="#FFE9A8" opacity={0.3} /></g> : null}
        {look.detail === "radio" ? <g><rect x={tcx - tw / 2 + 4} y={torsoTop + 70} width={tw - 8} height={12} fill="#E8F2FF" opacity={0.85} />
          <rect x={tcx + (side ? -10 : -60)} y={torsoTop - 34} width={28} height={48} rx={6} fill={INK} /><rect x={tcx + (side ? -3 : -53)} y={torsoTop - 64} width={6} height={32} rx={3} fill={INK} />
          <circle cx={tcx + (side ? 4 : -46)} cy={torsoTop - 18} r={5} fill={(Math.floor(t * 2) % 2) ? "#3DDC84" : "#1F6B44"} /></g> : null}
      </g>
      {/* голова ≈ треть роста */}
      <g transform={`translate(${headX},${headY}) rotate(${ht})`}>
        {!side ? <circle cx={v === "q34" ? -90 : -92} cy={12} r={18} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} /> : null}
        {front ? <circle cx={92} cy={10} r={18} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} /> : null}
        <circle cx={0} cy={0} r={95} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} />
        {side ? <g><ellipse cx={-30} cy={18} rx={15} ry={20} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} /><path d="M-34,10 q8,8 0,18" fill="none" stroke={SKIN_D} strokeWidth={3} strokeLinecap="round" /></g> : null}
        {side ? <path d="M92,4 q14,8 2,18" fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} /> : null}
        <path d="M60,-60 a95,95 0 0 1 30,70" fill="none" stroke={RIM} strokeWidth={6} opacity={0.85} strokeLinecap="round" />
        {ex.map((e, i) => blink ? <line key={i} x1={e - 8 + lookX} y1={8} x2={e + 8 + lookX} y2={8} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          : <circle key={i} cx={e + lookX} cy={8} r={v === "q34" && i === 0 ? 7 : 8} fill={INK} />)}
        {ex.map((e, i) => <path key={"b" + i} d={`M${e - 16},${-20 - bro * 8 + (i === 0 ? -bro * 2 : 0)} q16,${-10 - bro * 6} 32,${bro * 4}`} fill="none" stroke="#3A2A1E" strokeWidth={7} strokeLinecap="round" />)}
        {mouth === "smile" ? <path d={`M${mx - 18},40 q18,16 36,0`} fill="none" stroke="#7A3B2E" strokeWidth={5} strokeLinecap="round" /> : null}
        {mouth === "flat" ? <path d={`M${mx - 14},44 q14,4 28,0`} fill="none" stroke="#7A3B2E" strokeWidth={5} strokeLinecap="round" /> : null}
        {mouth === "worried" ? <path d={`M${mx - 16},48 q16,-8 32,0`} fill="none" stroke="#7A3B2E" strokeWidth={5} strokeLinecap="round" /> : null}
        {mouth === "o" ? <ellipse cx={mx} cy={46} rx={8} ry={10} fill="#7A3B2E" /> : null}
        {mouth === "talk" ? <ellipse cx={mx} cy={44} rx={12} ry={talkO} fill="#7A3B2E" /> : null}
        {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={mx - 40 + (i % 7) * 13} cy={56 + Math.floor(i / 7) * 11} r={2} fill={SKIN_D} />)}
        {/* кепка: в профиль и 3/4 козырёк вперёд */}
        <path d="M-92,-20 a92,82 0 0 1 184,0 z" fill={look.cap} stroke={ol(look.cap)} strokeWidth={3} />
        {front ? <path d="M-74,-22 q74,-26 148,0 q-74,22 -148,0z" fill={shade(look.cap, 0.85)} stroke={ol(look.cap)} strokeWidth={3} />
          : <path d={`M${side ? 40 : -10},-24 q90,-10 ${side ? 100 : 130},14 q-60,12 -${side ? 100 : 130},6z`} fill={shade(look.cap, 0.85)} stroke={ol(look.cap)} strokeWidth={3} />}
        <circle cx={side ? -10 : 0} cy={-100} r={8} fill={shade(look.cap, 0.8)} />
      </g>
      {/* ближняя рука — поверх */}
      {stroke(armF, shXF + tx(shY), shY, shade(look.hoodie, 0.95), 38)}{hand(armF.e, false)}
      {pose.propHand !== "B" && pf ? propAt(pf) : null}
    </g>
  );
  return (<g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <ellipse cx={0} cy={6} rx={100} ry={16} fill="#000" opacity={0.16} />
    {pose.sit ? <g><rect x={-80} y={-110} width={150} height={112} rx={10} fill="#8A6A44" stroke="#5E4630" strokeWidth={3} />
      <line x1={-80} y1={-74} x2={70} y2={-74} stroke="#5E4630" strokeWidth={3} /><line x1={-80} y1={-38} x2={70} y2={-38} stroke="#5E4630" strokeWidth={3} /></g> : null}
    {body}
  </g>);
};

// ------------------------------------------------------------------ СОБАКА БУБЛИК (профиль, смотрит вправо)
export type DogPose = { legs: [number, number][]; head?: number; tail?: number; earUp?: number; mouth?: "closed" | "pant"; sit?: boolean; lie?: boolean; drop?: number };
export const DOG_POSES: Record<string, DogPose> = {
  stand: { legs: [[4, 0], [-4, 0], [4, 0], [-4, 0]] },
  sit: { sit: true, legs: [[0, 0], [0, 0], [80, -150], [70, -140]], head: -12 },
  lie: { lie: true, drop: 60, legs: [[80, -10], [70, -10], [80, -100], [70, -100]], head: 8 },
  sniff: { legs: [[8, 0], [-2, 0], [6, 0], [-6, 0]], head: 30, earUp: 0.3 },
  alert: { legs: [[2, 0], [-6, 0], [6, 0], [-4, 0]], head: -14, earUp: 1, tail: 0.3 },
};
export const dogWalk = (phase: number): DogPose => {
  const l = (p: number): [number, number] => { const q = ((p % 1) + 1) % 1; return q < 0.5 ? [22 - 88 * q, 0] : [-22 + 44 * (0.5 - 0.5 * Math.cos(Math.PI * (q - 0.5) * 2)), -40 * Math.sin(Math.PI * (q - 0.5) * 2)]; };
  return { legs: [l(phase), l(phase + 0.5), l(phase + 0.5), l(phase)], mouth: "pant", drop: -3 * Math.abs(Math.cos(2 * Math.PI * phase)) };
};
const DB = "#D9893A", DL = "#F6E2C4";
export const Bublik: React.FC<{ pose: DogPose; x: number; y: number; s?: number; flip?: boolean; t?: number }> = ({ pose, x, y, s = 1, flip = false, t = 0 }) => {
  const ol = shade(DB, 0.58); const br = Math.sin(t * 3.2) * 2; const wag = Math.sin(t * 10) * (14 + 10 * (pose.tail ?? 1));
  const blink = ((t * 30) % 97) < 4; const drop = pose.drop ?? 0;
  const bodyY = -110 + drop + (pose.sit ? 20 : 0);
  const legPos = [[78, true], [58, false], [-70, true], [-90, false]] as const;
  const rot = (px: number, py: number, deg: number, cx: number, cy: number): [number, number] => {
    const c = Math.cos(deg * R), sn = Math.sin(deg * R); return [cx + (px - cx) * c - (py - cy) * sn, cy + (px - cx) * sn + (py - cy) * c]; };
  const legs = legPos.map(([lx, near], i) => {
    const [a1, a2] = pose.legs[i]; let top: [number, number] = [lx, bodyY + 30];
    let k = seg(top[0], top[1], 44, a1), e = seg(k[0], k[1], 40, a1 + a2);
    if (pose.sit) {
      top = rot(lx, bodyY + 30, -24, -60, bodyY + 30);
      if (i < 2) { e = [top[0] + 6, -4]; k = [(top[0] + e[0]) / 2, (top[1] + e[1]) / 2]; }          // передние — прямые до земли
      else { k = [top[0] + 40, -30]; e = [top[0] + 70, -6]; }                                         // задние — поджаты
    }
    const c = near ? DB : shade(DB, 0.82);
    return { near, el: <g key={i}><polyline points={`${top[0]},${top[1]} ${k[0]},${k[1]} ${e[0]},${e[1]}`} fill="none" stroke={ol} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${top[0]},${top[1]} ${k[0]},${k[1]} ${e[0]},${e[1]}`} fill="none" stroke={c} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={e[0] + 8} cy={e[1] + 2} rx={16} ry={9} fill={near ? DL : shade(DL, 0.85)} stroke={ol} strokeWidth={3} /></g> };
  });
  const hx = 104, hy = bodyY - 50 + (pose.head ?? 0) * 0.8;
  return (<g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <ellipse cx={0} cy={4} rx={130} ry={14} fill="#000" opacity={0.15} />
    {legs.filter((l) => !l.near).map((l) => l.el)}
    {/* хвост бубликом */}
    <g transform={`translate(-112,${bodyY - 20}) rotate(${wag})`}>
      <path d="M0,0 q-36,-30 -8,-62 q30,-12 22,22" fill="none" stroke={ol} strokeWidth={28} strokeLinecap="round" />
      <path d="M0,0 q-36,-30 -8,-62 q30,-12 22,22" fill="none" stroke={DB} strokeWidth={22} strokeLinecap="round" />
    </g>
    {/* корпус, светлая грудь */}
    <g transform={`rotate(${pose.sit ? -24 : 0} -60 ${bodyY + 30})`}>
      <ellipse cx={0} cy={bodyY + br * 0.5} rx={122} ry={54 + br} fill={DB} stroke={ol} strokeWidth={3} />
      <ellipse cx={60} cy={bodyY + 20} rx={56} ry={28} fill={DL} />
      <path d="M-60,-30 q60,-30 120,-6" transform={`translate(0,${bodyY})`} fill="none" stroke="#FFD9A0" strokeWidth={5} opacity={0.7} strokeLinecap="round" />
    </g>
    {legs.filter((l) => l.near).map((l) => l.el)}
    {/* голова: одно ухо торчит, другое висит */}
    <g transform={`translate(${hx},${hy}) rotate(${pose.head ?? 0})`}>
      <path d={`M-30,-34 l${-14},${-52 - 10 * (pose.earUp ?? 0)} l36,30z`} fill={shade(DB, 0.85)} stroke={ol} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={0} cy={0} r={56} fill={DB} stroke={ol} strokeWidth={3} />
      <path d={`M22,-44 q${34 - 10 * (pose.earUp ?? 0)},${-6 - 20 * (pose.earUp ?? 0)} 30,${44 - 30 * (pose.earUp ?? 0)} q-14,-4 -24,-24z`} fill={shade(DB, 0.78)} stroke={ol} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={44} cy={16} rx={34} ry={24} fill={DL} stroke={ol} strokeWidth={3} />
      <ellipse cx={72} cy={8} rx={11} ry={8} fill={INK} />
      {blink ? <line x1={4} y1={-8} x2={20} y2={-8} stroke={INK} strokeWidth={5} strokeLinecap="round" /> : <><circle cx={12} cy={-8} r={8} fill={INK} /><circle cx={15} cy={-11} r={2.5} fill="#fff" /></>}
      <path d="M-8,-30 q12,-8 24,-2" fill="none" stroke={shade(DB, 0.5)} strokeWidth={4} strokeLinecap="round" />
      {pose.mouth === "pant" ? <><path d="M40,34 q14,12 28,0" fill="#7A3B2E" /><path d={`M48,38 q6,${18 + 4 * Math.sin(t * 12)} 14,2`} fill="#E57373" /></>
        : <path d="M42,36 q12,8 22,0" fill="none" stroke="#7A3B2E" strokeWidth={4} strokeLinecap="round" />}
    </g>
  </g>);
};
