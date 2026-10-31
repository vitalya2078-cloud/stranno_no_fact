// РИГИ v2 «живые»: без видимых шарниров. Конечности — одна плавная сужающаяся форма (рукав/штанина) с манжетой,
// кисть-варежка с большим пальцем, ботинок с подошвой; худи — силуэтом с капюшоном; кепка — цельная, с тенью козырька;
// живость: дыхание грудью, перенос веса, запаздывание головы, бегающий взгляд, моргание.
// Углы как в v1: 0 — конечность вниз, «+» — вперёд (в сторону взгляда). Виды: front / q34 / side.
import React from "react";
import { Look, Pose, POSES as P1, walkPose, WALK_SPEED_PER_CYCLE, shade } from "./rig";
export { walkPose, WALK_SPEED_PER_CYCLE };
export type { Look, Pose };
export type Pose2 = Pose & { custom?: "crouch" };

const SKIN = "#F1C7A0", SKIN_D = "#D9A47E", BOOT = "#5A3B28", SOLE = "#2E2219", RIM = "#FFD9A0", INK = "#2A2A22";
const R = Math.PI / 180;
type Pt = [number, number];
const seg = (p: Pt, len: number, a: number): Pt => [p[0] + len * Math.sin(a * R), p[1] + len * Math.cos(a * R)];
const nrm = (a: Pt, b: Pt): Pt => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
const add = (p: Pt, n: Pt, k: number): Pt => [p[0] + n[0] * k, p[1] + n[1] * k];
// плавная сужающаяся форма через три точки (плечо→локоть→кисть): без «шариков» на суставах
export const limbPath = (p0: Pt, p1: Pt, p2: Pt, w0: number, w1: number, w2: number) => {
  const n1 = nrm(p0, p1), n2 = nrm(p1, p2); const nm: Pt = [(n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2]; const lm = Math.hypot(nm[0], nm[1]) || 1;
  const m: Pt = [nm[0] / lm, nm[1] / lm];
  const a = add(p0, n1, w0 / 2), b = add(p1, m, w1 / 2 / Math.max(0.6, lm)), c = add(p2, n2, w2 / 2);
  const a2 = add(p0, n1, -w0 / 2), b2 = add(p1, m, -w1 / 2 / Math.max(0.6, lm)), c2 = add(p2, n2, -w2 / 2);
  const f = (p: Pt) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  return `M${f(a)} Q${f(b)} ${f(c)} A${w2 / 2},${w2 / 2} 0 0 1 ${f(c2)} Q${f(b2)} ${f(a2)} A${w0 / 2},${w0 / 2} 0 0 1 ${f(a)}z`;
};

// ------------------------------------------------------------------ позы v2 (сложные — подобраны заново)
export const POSES: Record<string, Pose2> = {
  ...P1,
  crouch: { view: "side", custom: "crouch", head: -6, look: 0.8, armF: [0, 0], armB: [0, 0], legF: [0, 0], legB: [0, 0], brows: 0.5, mouth: "flat" } as Pose2,
  sit: { view: "side", sit: true, drop: 64, lean: -2, armF: [30, -70], armB: [22, -64], legF: [92, -96], legB: [86, -90], mouth: "smile", head: 4, look: 0.6 },
};

export const Hero2: React.FC<{ look: Look; pose: Pose; x: number; y: number; s?: number; flip?: boolean; t?: number }> = ({ look, pose, x, y, s = 1, flip = false, t = 0 }) => {
  const v = pose.view, side = v === "side", front = v === "front";
  const breathe = Math.sin(t * 2.1);                                   // дыхание
  const sway = side ? 0 : Math.sin(t * 0.9) * 3;                       // перенос веса
  // авто-земля: считаем ноги без опускания и опускаем таз так, чтобы нижняя стопа стояла на земле (кроме «сидит»)
  const ground = (() => { if (pose.sit) return pose.drop ?? 0; const h0 = -168;
    const a1 = seg(seg([0, h0], 86, pose.legF[0]), 80, pose.legF[0] + pose.legF[1]), a2 = seg(seg([0, h0], 86, pose.legB[0]), 80, pose.legB[0] + pose.legB[1]);
    return -Math.max(a1[1], a2[1]) - 2 + Math.min(0, pose.drop ?? 0); })();
  const drop = ground;
  const blink = ((t * 30) % 113) < 4;
  const sacc = Math.sin(t * 0.7) > 0.85 ? 0.5 : Math.sin(t * 1.1) < -0.9 ? -0.4 : 0;   // глаза иногда «бегают»
  const ol = (c: string) => shade(c, 0.58);
  const hipY = -168 + drop, shY = -338 + drop + breathe * 1.2;
  const lean = pose.lean ?? 0;
  const lx = (yy: number) => (hipY - yy) * Math.sin(lean * R);           // смещение корпуса при наклоне
  // суставы
  const hipF: Pt = [side ? 8 : 26, hipY], hipB: Pt = [side ? -8 : -26, hipY];
  const shF: Pt = [(side ? 8 : v === "q34" ? 62 : 66) + lx(shY) + sway, shY], shB: Pt = [(side ? -8 : v === "q34" ? -56 : -66) + lx(shY) + sway, shY];
  const ang = (a: number, outward: boolean) => front ? (outward ? 1 : -1) * (Math.abs(a) * 0.45 + 7) : a;
  const legA = (l: [number, number], o: boolean): [number, number] => front ? [ang(l[0] * 0.5, o), l[1]] : l;
  const lF = legA(pose.legF, true), lB = legA(pose.legB, false);
  const kF = seg(hipF, 86, lF[0]), aF = seg(kF, 80, lF[0] + lF[1]);
  const kB = seg(hipB, 86, lB[0]), aB = seg(kB, 80, lB[0] + lB[1]);
  const armAF = [ang(pose.armF[0] + (front ? 0 : lean), true), pose.armF[1]], armAB = [ang(pose.armB[0] + (front ? 0 : lean), false), pose.armB[1]];
  const eF = seg(shF, 84, armAF[0]), wF = seg(eF, 74, armAF[0] + armAF[1]);
  const eB = seg(shB, 84, armAB[0]), wB = seg(eB, 74, armAB[0] + armAB[1]);
  const hoodie = look.hoodie, hoodieB = shade(hoodie, 0.8), jeans = look.jeans, jeansB = shade(jeans, 0.82);

  const leg = (h: Pt, k: Pt, a: Pt, c: string, back: boolean) => {
    const dir = side || v === "q34" ? 1 : 0;
    return (<g>
      <path d={limbPath(h, k, a, 50, 42, 38)} fill={c} stroke={ol(jeans)} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${k[0] - 10},${k[1] - 4} q8,6 18,2`} fill="none" stroke={ol(jeans)} strokeWidth={2.5} opacity={0.6} strokeLinecap="round" />
      {/* ботинок с подошвой, носок вперёд */}
      <g transform={`translate(${a[0]},${a[1]})`}>
        <path d={dir ? "M-20,-10 q0,-14 16,-14 h10 q14,0 18,10 l14,6 q10,4 8,14 h-66z" : "M-24,-12 q0,-14 24,-14 q24,0 24,14 v14 h-48z"} fill={back ? shade(BOOT, 0.82) : BOOT} stroke={ol(BOOT)} strokeWidth={3} strokeLinejoin="round" />
        <rect x={dir ? -22 : -26} y={4} width={dir ? 70 : 52} height={8} rx={4} fill={SOLE} />
      </g>
    </g>);
  };
  const arm = (sh: Pt, e: Pt, w: Pt, c: string, back: boolean) => {
    const d = Math.atan2(w[0] - e[0], w[1] - e[1]) / R;                     // направление предплечья
    return (<g>
      <path d={limbPath(sh, e, w, 44, 38, 32)} fill={c} stroke={ol(hoodie)} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${e[0] - 8},${e[1] - 6} q6,8 16,4`} fill="none" stroke={ol(hoodie)} strokeWidth={2.5} opacity={0.55} strokeLinecap="round" />
      {/* манжета и кисть-варежка с большим пальцем */}
      <g transform={`translate(${w[0]},${w[1]}) rotate(${-d})`}>
        <rect x={-18} y={-8} width={36} height={14} rx={6} fill={shade(c, 0.88)} stroke={ol(hoodie)} strokeWidth={2.5} />
        <ellipse cx={0} cy={18} rx={16} ry={20} fill={back ? shade(SKIN, 0.93) : SKIN} stroke={ol(SKIN)} strokeWidth={3} />
        <ellipse cx={side ? 13 : -13} cy={10} rx={7} ry={11} fill={back ? shade(SKIN, 0.93) : SKIN} stroke={ol(SKIN)} strokeWidth={2.5} transform={`rotate(${side ? -30 : 30} ${side ? 13 : -13} 10)`} />
      </g>
    </g>);
  };
  const prop = (w: Pt, kind: string | undefined) => {
    if (kind === "phone") return <g transform={`translate(${w[0]},${w[1] - 6})`}><rect x={-14} y={-44} width={30} height={52} rx={6} fill={INK} /><rect x={-10} y={-39} width={22} height={38} rx={3} fill="#7FD3FF" />
      <circle cx={6} cy={-50} r={9} fill="#E53935" /></g>;
    if (kind === "lamp") return <g transform={`translate(${w[0]},${w[1] + 14})`}><rect x={-6} y={-12} width={42} height={22} rx={7} fill={INK} /><circle cx={38} cy={-1} r={10} fill="#FFE9A8" />
      <path d="M40,-10 L270,-70 L270,70 L40,8z" fill="#FFE9A8" opacity={0.22} /></g>;
    if (kind === "notebook") return <g transform={`translate(${w[0]},${w[1]}) rotate(-12)`}><rect x={-30} y={-30} width={62} height={78} rx={4} fill="#F6F2E7" stroke="#B8AE96" strokeWidth={3} />
      {[0, 1, 2].map((i) => <line key={i} x1={-18} y1={-12 + i * 16} x2={18} y2={-14 + i * 16} stroke="#9FB3CF" strokeWidth={3} />)}</g>;
    return null;
  };
  // корпус-худи силуэтом: покатые плечи, расширение к низу, резинка
  const tw = side ? 104 : v === "q34" ? 134 : 146, cx = (side ? 0 : v === "q34" ? 4 : 0) + sway;
  const top = shY - 18 - breathe, bot = hipY + 14;
  const torso = `M${cx - tw * 0.42},${top + 10} Q${cx},${top - 14} ${cx + tw * 0.42},${top + 10} Q${cx + tw * 0.52},${top + 40} ${cx + tw * 0.5},${bot - 22}
    L${cx + tw * 0.5},${bot} L${cx - tw * 0.5},${bot} L${cx - tw * 0.5},${bot - 22} Q${cx - tw * 0.52},${top + 40} ${cx - tw * 0.42},${top + 10}z`;
  // голова (запаздывает за корпусом)
  const lag = Math.sin(t * 2.1 - 0.6) * 1.5;
  const hx = cx + lx(shY - 130) + (side ? 8 : 0), hy = shY - 134 + lag;
  const ht = pose.head ?? 0, lk = ((pose.look ?? 0) + sacc) * 6, bro = pose.brows ?? 0;
  const eyes = side ? [44] : v === "q34" ? [-6, 44] : [-30, 30];
  const mx = side ? 54 : v === "q34" ? 24 : 0, mouth = pose.mouth ?? "flat";
  const talk = mouth === "talk" ? 4 + 5 * Math.abs(Math.sin(t * 14)) : 0;
  const cap = look.cap, capD = shade(cap, 0.78);
  // цельная кепка: купол + козырёк одним силуэтом
  const capPath = side ? "M-92,-14 C-96,-80 -40,-112 8,-108 C60,-104 92,-70 92,-26 L96,-22 C130,-24 156,-14 162,-4 C150,6 110,4 86,-2 L-92,-6z"
    : v === "q34" ? "M-92,-14 C-96,-82 -36,-112 10,-108 C62,-104 94,-72 92,-24 C120,-28 150,-18 154,-8 C140,4 100,4 70,-2 L-92,-6z"
    : "M-94,-12 C-96,-82 -44,-112 0,-112 C44,-112 96,-82 94,-12 C70,-2 40,6 0,6 C-40,6 -70,-2 -94,-12z";
  const capBand = side ? "M-92,-14 L92,-24" : v === "q34" ? "M-92,-14 Q0,-28 92,-22" : "M-90,-14 Q0,-34 90,-14";

  const headEl = (<>
    <g transform={`translate(${hx},${hy}) rotate(${ht + (side ? 0 : Math.sin(t * 0.8) * 1.5)})`}>
      <defs><clipPath id={`hc${look.name}${v}`}><circle cx={0} cy={0} r={94} /></clipPath></defs>
      {!side ? <ellipse cx={v === "q34" ? -90 : -92} cy={14} rx={15} ry={19} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} /> : null}
      {front ? <ellipse cx={92} cy={14} rx={15} ry={19} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} /> : null}
      <circle cx={0} cy={0} r={95} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} />
      <g clipPath={`url(#hc${look.name}${v})`}>
        <ellipse cx={side ? 50 : v === "q34" ? 36 : 0} cy={-20} rx={120} ry={14} fill="#000" opacity={0.08} />
        <circle cx={-30} cy={20} r={95} fill="#000" opacity={0.05} />
      </g>
      {side ? <g><ellipse cx={-28} cy={20} rx={14} ry={19} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} /><path d="M-31,12 q7,8 0,16" fill="none" stroke={SKIN_D} strokeWidth={3} strokeLinecap="round" /></g> : null}
      {side || v === "q34" ? <path d={side ? "M92,6 q14,10 0,20" : "M62,10 q10,10 -2,18"} fill={SKIN} stroke={ol(SKIN)} strokeWidth={3} strokeLinecap="round" /> : null}
      {/* щёки, глаза-овалы с бликом, брови, рот, щетина */}
      {eyes.map((e, i) => <ellipse key={"c" + i} cx={e + (side ? -6 : 0)} cy={34} rx={14} ry={8} fill="#F08A7A" opacity={0.25} />)}
      {eyes.map((e, i) => blink ? <path key={i} d={`M${e - 9 + lk},10 q9,5 18,0`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        : <g key={i}><ellipse cx={e + lk} cy={8} rx={v === "q34" && i === 0 ? 7 : 8} ry={10} fill={INK} /><circle cx={e + lk + 2.5} cy={4} r={2.6} fill="#fff" /></g>)}
      {eyes.map((e, i) => <path key={"b" + i} d={`M${e - 15},${-18 - bro * 8} q15,${-9 - bro * 5} 30,${bro * 3}`} fill="none" stroke="#3A2A1E" strokeWidth={7} strokeLinecap="round" />)}
      {mouth === "smile" ? <path d={`M${mx - 18},40 q18,16 36,0`} fill="none" stroke="#7A3B2E" strokeWidth={5} strokeLinecap="round" /> : null}
      {mouth === "flat" ? <path d={`M${mx - 14},44 q14,4 28,0`} fill="none" stroke="#7A3B2E" strokeWidth={5} strokeLinecap="round" /> : null}
      {mouth === "worried" ? <path d={`M${mx - 16},48 q16,-8 32,0`} fill="none" stroke="#7A3B2E" strokeWidth={5} strokeLinecap="round" /> : null}
      {mouth === "o" ? <ellipse cx={mx} cy={46} rx={8} ry={10} fill="#7A3B2E" /> : null}
      {mouth === "talk" ? <ellipse cx={mx} cy={44} rx={12} ry={talk} fill="#7A3B2E" /> : null}
      {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={mx - 40 + (i % 7) * 13} cy={58 + Math.floor(i / 7) * 10} r={2} fill={SKIN_D} />)}
      {/* цельная кепка */}
      <path d={capPath} fill={cap} stroke={ol(cap)} strokeWidth={3} strokeLinejoin="round" />
      <path d={side ? "M96,-22 C130,-24 156,-14 162,-4 C150,6 110,4 86,-2z" : v === "q34" ? "M92,-24 C120,-28 150,-18 154,-8 C140,4 100,4 70,-2z" : "M-94,-12 C-70,-2 -40,6 0,6 C40,6 70,-2 94,-12 C60,-20 -60,-20 -94,-12z"}
        fill={capD} />
      <path d={capBand} fill="none" stroke={capD} strokeWidth={5} />
      <path d={side ? "M-40,-90 C-10,-104 30,-100 56,-80" : "M-50,-86 C-20,-104 30,-104 56,-84"} fill="none" stroke="#fff" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
      <circle cx={side ? 6 : 0} cy={-109} r={7} fill={capD} />
    </g>
  </>);
  const nearLeg = leg(hipF, kF, aF, jeans, false), farLeg = leg(hipB, kB, aB, jeansB, true);
  const nearArm = arm(shF, eF, wF, shade(hoodie, 0.96), false), farArm = arm(shB, eB, wB, hoodieB, true);
  const kneesFront = pose.sit || ground > 50;                  // присел/сидит: колени перед корпусом
  if ((pose as Pose2).custom === "crouch") {
    const HX = 54, HY = -352 + breathe;
    const j = jeans, jB = jeansB, h = hoodie;
    const legSide = (hip: Pt, knee: Pt, ank: Pt, c: string, back: boolean) => (<g>
      <path d={limbPath(hip, [(hip[0] + knee[0]) / 2, (hip[1] + knee[1]) / 2 - 6], knee, 56, 50, 46)} fill={c} stroke={ol(j)} strokeWidth={3} strokeLinejoin="round" />
      <path d={limbPath(knee, [(knee[0] + ank[0]) / 2 + 4, (knee[1] + ank[1]) / 2], ank, 46, 42, 38)} fill={c} stroke={ol(j)} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${knee[0] - 16},${knee[1] + 10} q10,8 22,2`} fill="none" stroke={ol(j)} strokeWidth={2.5} opacity={0.6} strokeLinecap="round" />
      <g transform={`translate(${ank[0]},${ank[1] + 8})`}><path d="M-20,-10 q0,-14 16,-14 h10 q14,0 18,10 l14,6 q10,4 8,14 h-66z" fill={back ? shade(BOOT, 0.82) : BOOT} stroke={ol(BOOT)} strokeWidth={3} strokeLinejoin="round" />
        <rect x={-22} y={4} width={70} height={8} rx={4} fill={SOLE} /></g>
    </g>);
    return (<g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
      <ellipse cx={10} cy={8} rx={110} ry={16} fill="#000" opacity={0.16} />
      {look.detail === "pack" ? <path d="M-120,-210 q-14,80 6,150 h60 v-170z" fill="#C0392B" stroke={ol("#C0392B")} strokeWidth={3} /> : null}
      {legSide([-34, -66], [70, -150], [30, -22], jB, true)}
      {arm([0, -246 + breathe], [44, -190], [84, -152], hoodieB, true)}
      {/* округлая спина, худи */}
      <path d={`M-96,-44 C-118,-130 -92,-236 -10,-268 C30,-280 70,-262 76,-236 C84,-196 60,-140 30,-96 L10,-44z`} fill={h} stroke={ol(h)} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M-96,-60 C-112,-130 -90,-220 -26,-254`} fill="none" stroke={RIM} strokeWidth={5} opacity={0.6} strokeLinecap="round" transform="translate(4,0)" />
      <rect x={-98} y={-62} width={110} height={20} rx={8} fill={shade(h, 0.86)} stroke={ol(h)} strokeWidth={2.5} />
      <path d="M-40,-268 q50,-34 96,4 q-10,20 -48,20 q-38,0 -48,-24z" fill={shade(h, 0.86)} stroke={ol(h)} strokeWidth={3} />
      {look.detail === "tape" ? <g><circle cx={-20} cy={-54} r={18} fill="none" stroke="#2F6FD6" strokeWidth={11} /><rect x={-74} y={-72} width={12} height={32} rx={4} fill="#9AA3AD" /></g> : null}
      {look.detail === "radio" ? <g><rect x={-40} y={-300} width={28} height={46} rx={6} fill={INK} /><rect x={-33} y={-328} width={6} height={30} rx={3} fill={INK} /></g> : null}
      {legSide([-30, -62], [86, -156], [44, -20], j, false)}
      {headEl && <g transform={`translate(${HX - hx},${HY - hy})`}>{headEl}</g>}
      {/* ближняя рука лежит на колене, кисть свисает */}
      {arm([12, -244 + breathe], [70, -196], [110, -150], shade(h, 0.96), false)}
    </g>);
  }
  return (<g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <ellipse cx={0} cy={8} rx={104} ry={16} fill="#000" opacity={0.16} />
    {pose.sit ? <g><rect x={-86} y={-104} width={150} height={106} rx={10} fill="#8A6A44" stroke="#5E4630" strokeWidth={3} />
      <path d="M-86,-70 h150 M-86,-36 h150" stroke="#5E4630" strokeWidth={3} /></g> : null}
    {look.detail === "pack" && !front ? <path d={`M${cx - tw / 2 - 46 + lx(shY)},${shY + 6} q-6,70 4,150 h70 v-160z`} fill="#C0392B" stroke={ol("#C0392B")} strokeWidth={3} /> : null}
    {farLeg}{farArm}{prop(wB, pose.propHand === "B" ? pose.prop : undefined)}
    {!kneesFront ? nearLeg : null}
    <g transform={`rotate(${lean} ${cx} ${hipY})`}>
      {look.detail === "pack" && front ? <rect x={cx - 62} y={top + 4} width={124} height={150} rx={26} fill="#C0392B" stroke={ol("#C0392B")} strokeWidth={3} /> : null}
      {/* капюшон за шеей */}
      <path d={`M${cx - 52},${top + 4} q52,-40 104,0 q-10,22 -52,22 q-42,0 -52,-22z`} fill={shade(hoodie, 0.86)} stroke={ol(hoodie)} strokeWidth={3} />
      <rect x={cx - 18 + (side ? 6 : 0)} y={top - 24} width={36} height={30} rx={10} fill={SKIN_D} />
      <path d={torso} fill={hoodie} stroke={ol(hoodie)} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${cx + tw * 0.18},${top + 18} Q${cx + tw * 0.46},${top + 60} ${cx + tw * 0.44},${bot - 24} L${cx + tw * 0.46},${bot - 4} L${cx + tw * 0.2},${bot - 4}z`} fill="#000" opacity={0.09} />
      <rect x={cx - tw * 0.5} y={bot - 18} width={tw} height={18} rx={6} fill={shade(hoodie, 0.86)} stroke={ol(hoodie)} strokeWidth={2.5} />
      {!side ? <path d={`M${cx - 38},${bot - 70} h76 v30 q-38,12 -76,0z`} fill={shade(hoodie, 0.86)} stroke={ol(hoodie)} strokeWidth={2} />
        : <path d={`M${cx + 6},${bot - 70} h40 v30 q-20,10 -40,0z`} fill={shade(hoodie, 0.86)} stroke={ol(hoodie)} strokeWidth={2} />}
      {!side ? <><path d={`M${cx - 12},${top + 8} q-2,26 -4,50`} stroke="#eee" strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d={`M${cx + 12},${top + 8} q2,26 4,50`} stroke="#eee" strokeWidth={4} fill="none" strokeLinecap="round" /></> : null}
      <path d={`M${cx + tw * 0.44},${top + 30} q8,${(bot - top) * 0.4} 2,${(bot - top) * 0.75}`} fill="none" stroke={RIM} strokeWidth={5} opacity={0.7} strokeLinecap="round" />
      {look.detail === "tape" ? <g><circle cx={cx + (side ? 20 : 48)} cy={bot - 4} r={19} fill="none" stroke="#2F6FD6" strokeWidth={12} /><circle cx={cx + (side ? 20 : 48)} cy={bot - 4} r={19} fill="none" stroke="#1E4E9E" strokeWidth={2} />
        <rect x={cx - (side ? 30 : 60)} y={bot - 22} width={13} height={36} rx={4} fill="#9AA3AD" stroke="#6B737C" strokeWidth={2} /></g> : null}
      {look.detail === "pack" ? <g><path d={`M${cx - (side ? 4 : 48)},${top + 2} q-4,60 2,${bot - top - 30}`} stroke="#962D22" strokeWidth={13} fill="none" strokeLinecap="round" />
        {!side ? <path d={`M${cx + 48},${top + 2} q4,60 -2,${bot - top - 30}`} stroke="#962D22" strokeWidth={13} fill="none" strokeLinecap="round" /> : null}
        <rect x={cx + (side ? -6 : 34)} y={top + 46} width={20} height={30} rx={5} fill={INK} /><circle cx={cx + (side ? 4 : 44)} cy={top + 42} r={9} fill="#FFE9A8" />
        <circle cx={cx + (side ? 4 : 44)} cy={top + 42} r={24} fill="#FFE9A8" opacity={0.3} /></g> : null}
      {look.detail === "radio" ? <g><rect x={cx - tw * 0.5 + 4} y={top + 72} width={tw - 8} height={12} fill="#E8F2FF" opacity={0.85} />
        <rect x={cx + (side ? -12 : -62)} y={top - 30} width={28} height={46} rx={6} fill={INK} /><rect x={cx + (side ? -5 : -55)} y={top - 58} width={6} height={30} rx={3} fill={INK} />
        <circle cx={cx + (side ? 2 : -48)} cy={top - 14} r={5} fill={(Math.floor(t * 2) % 2) ? "#3DDC84" : "#1F6B44"} /></g> : null}
    </g>
    {kneesFront ? nearLeg : null}
    {headEl}
    {nearArm}{prop(wF, pose.propHand !== "B" ? pose.prop : undefined)}
  </g>);
};

// ------------------------------------------------------------------ БУБЛИК v2: цельный силуэт, плавные лапы, ухо не закрывает глаз
export type DogPose = { legs: [number, number][]; head?: number; tail?: number; earUp?: number; mouth?: "closed" | "pant"; sit?: boolean; lie?: boolean; drop?: number };
export const DOG_POSES: Record<string, DogPose> = {
  stand: { legs: [[4, 0], [-4, 0], [4, 0], [-4, 0]] },
  sit: { sit: true, legs: [[0, 0], [0, 0], [0, 0], [0, 0]], head: -10 },
  lie: { lie: true, drop: 62, legs: [[84, -6], [76, -6], [86, -10], [78, -10]], head: 6 },
  sniff: { legs: [[8, 0], [-2, 0], [6, 0], [-6, 0]], head: 32, earUp: 0.2 },
  alert: { legs: [[2, 0], [-6, 0], [6, 0], [-4, 0]], head: -14, earUp: 1, tail: 0.3 },
};
export const dogWalk = (phase: number): DogPose => {
  const l = (p: number): [number, number] => { const q = ((p % 1) + 1) % 1; return q < 0.5 ? [22 - 88 * q, 0] : [-22 + 44 * (0.5 - 0.5 * Math.cos(Math.PI * (q - 0.5) * 2)), -42 * Math.sin(Math.PI * (q - 0.5) * 2)]; };
  return { legs: [l(phase), l(phase + 0.5), l(phase + 0.5), l(phase)], mouth: "pant", drop: -3 * Math.abs(Math.cos(2 * Math.PI * phase)) };
};
const DB = "#D9893A", DD = "#B8692A", DL = "#F6E2C4";
export const Bublik2: React.FC<{ pose: DogPose; x: number; y: number; s?: number; flip?: boolean; t?: number }> = ({ pose, x, y, s = 1, flip = false, t = 0 }) => {
  const ol = shade(DB, 0.56); const br = Math.sin(t * 3.2) * 2;
  const wagT = Math.sin(t * 10 - 0.5) * (16 + 10 * (pose.tail ?? 1));          // хвост чуть запаздывает
  const blink = ((t * 30) % 97) < 4; const drop = pose.drop ?? 0;
  const by = -112 + drop;
  if (pose.sit) {                                                              // сидит: отдельно нарисованная поза
    return (<g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
      <ellipse cx={0} cy={6} rx={110} ry={14} fill="#000" opacity={0.15} />
      <g transform={`translate(-70,-40) rotate(${wagT * 0.6})`}><path d="M0,0 q-40,-10 -40,-50 q4,-30 30,-22" fill="none" stroke={ol} strokeWidth={28} strokeLinecap="round" /><path d="M0,0 q-40,-10 -40,-50 q4,-30 30,-22" fill="none" stroke={DB} strokeWidth={22} strokeLinecap="round" /></g>
      <path d={`M-80,0 C-110,-40 -90,-120 -30,-150 C10,-180 60,-190 74,-150 C86,-110 70,-40 60,0z`} fill={DB} stroke={ol} strokeWidth={3} />
      <path d="M20,-150 C50,-160 66,-120 60,-60 C50,-40 30,-40 24,-60z" fill={DL} />
      <ellipse cx={-50} cy={-6} rx={56} ry={16} fill={DD} stroke={ol} strokeWidth={3} />
      {[30, 54].map((lx, i) => <g key={i}><path d={limbPath([lx, -90], [lx + 2, -45], [lx + 4, -8], 26, 22, 20)} fill={i ? DB : shade(DB, 0.85)} stroke={ol} strokeWidth={3} />
        <ellipse cx={lx + 12} cy={-2} rx={17} ry={9} fill={DL} stroke={ol} strokeWidth={3} /></g>)}
      <DogHead x={60} y={-196 + br} rot={pose.head ?? 0} ear={pose.earUp ?? 0} blink={blink} pant={false} t={t} />
    </g>);
  }
  // лапы: плавные формы
  const legX = [76, 56, -70, -92]; const near = [true, false, true, false];
  const legs = legX.map((lx, i) => {
    const [a1, a2] = pose.legs[i]; const top: Pt = [lx, by + 26];
    const k = seg(top, 46, a1), e = seg(k, 42, a1 + a2); const c = near[i] ? DB : shade(DB, 0.84);
    return { near: near[i], el: <g key={i}><path d={limbPath(top, k, e, i < 2 ? 30 : 36, 22, 20)} fill={c} stroke={ol} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={e[0] + 9} cy={e[1] + 2} rx={17} ry={9} fill={near[i] ? DL : shade(DL, 0.86)} stroke={ol} strokeWidth={3} /></g> };
  });
  const hx = 112, hy = by - 70 + (pose.head ?? 0) * 0.9;
  return (<g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <ellipse cx={0} cy={6} rx={132} ry={14} fill="#000" opacity={0.15} />
    {legs.filter((l) => !l.near).map((l) => l.el)}
    <g transform={`translate(-118,${by - 18}) rotate(${wagT})`}>
      <path d="M0,0 q-38,-28 -10,-62 q30,-12 22,22" fill="none" stroke={ol} strokeWidth={28} strokeLinecap="round" />
      <path d="M0,0 q-38,-28 -10,-62 q30,-12 22,22" fill="none" stroke={DB} strokeWidth={22} strokeLinecap="round" />
    </g>
    {/* цельное тело: холка, спина, круп, живот, грудь и шея */}
    <path d={`M-128,${by + 6} C-132,${by - 40} -96,${by - 52} -40,${by - 50} C20,${by - 48} 60,${by - 60} 92,${by - 84 + br * 0.4} L120,${by - 60}
      C120,${by - 20} 104,${by + 30} 72,${by + 38} C20,${by + 46 + br} -40,${by + 46 + br} -90,${by + 40} C-120,${by + 36} -128,${by + 22} -128,${by + 6}z`} fill={DB} stroke={ol} strokeWidth={3} strokeLinejoin="round" />
    <path d={`M70,${by - 50} C100,${by - 40} 104,${by + 10} 70,${by + 34} C50,${by + 20} 46,${by - 20} 70,${by - 50}z`} fill={DL} />
    <path d={`M-90,${by - 40} C-40,${by - 56} 20,${by - 50} 60,${by - 62}`} fill="none" stroke={RIM} strokeWidth={5} opacity={0.6} strokeLinecap="round" />
    {legs.filter((l) => l.near).map((l) => l.el)}
    <DogHead x={hx} y={hy} rot={pose.head ?? 0} ear={pose.earUp ?? 0} blink={blink} pant={pose.mouth === "pant"} t={t} />
  </g>);
};
const DogHead: React.FC<{ x: number; y: number; rot: number; ear: number; blink: boolean; pant: boolean; t: number }> = ({ x, y, rot, ear, blink, pant, t }) => {
  const ol = shade(DB, 0.56); const flick = Math.sin(t * 0.9) > 0.92 ? -8 : 0;     // ухо иногда дёргается
  return (<g transform={`translate(${x},${y}) rotate(${rot})`}>
    {/* торчащее ухо — сверху-сзади */}
    <path d={`M-34,-30 C-44,${-70 - 12 * ear} -36,${-92 - 12 * ear} -22,${-96 - 12 * ear} C-8,-80 0,-52 -4,-40z`} fill={DD} stroke={ol} strokeWidth={3} strokeLinejoin="round" transform={`rotate(${flick} -20 -40)`} />
    <ellipse cx={0} cy={0} rx={58} ry={54} fill={DB} stroke={ol} strokeWidth={3} />
    {/* морда */}
    <path d="M18,-8 C46,-20 86,-10 92,10 C96,30 70,42 40,40 C24,38 14,24 18,-8z" fill={DL} stroke={ol} strokeWidth={3} strokeLinejoin="round" />
    <ellipse cx={88} cy={6} rx={12} ry={9} fill={INK} /><circle cx={92} cy={3} r={3} fill="#fff" opacity={0.6} />
    {/* висячее ухо — назад и вниз, за глазом, не закрывает его */}
    <path d={`M-30,-34 C-62,${-30 + ear * 10} -70,${6 - ear * 20} -56,${28 - ear * 30} C-44,${30 - ear * 30} -34,${6 - ear * 10} -20,-20z`} fill={DD} stroke={ol} strokeWidth={3} strokeLinejoin="round" />
    {blink ? <path d="M6,-14 q10,6 20,0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      : <g><ellipse cx={16} cy={-14} rx={8} ry={10} fill={INK} /><circle cx={19} cy={-18} r={3} fill="#fff" /></g>}
    <path d="M2,-34 q14,-8 28,-2" fill="none" stroke={shade(DB, 0.5)} strokeWidth={4} strokeLinecap="round" />
    {pant ? <><path d="M40,38 q20,12 40,-2 q-14,4 -40,2z" fill="#7A3B2E" /><path d={`M52,42 q8,${18 + 4 * Math.sin(t * 12)} 18,2`} fill="#E57373" /></>
      : <path d="M44,38 q16,8 32,-2" fill="none" stroke="#7A3B2E" strokeWidth={4} strokeLinecap="round" />}
  </g>);
};
