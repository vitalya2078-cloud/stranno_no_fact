// Персонаж-дудл на Canvas 2D — порт kit/chars.py: тот же дизайн и та же мимика.
// Локальные координаты в метрах: x вправо, z вверх, 0 = пол. Плоскость PLANE_W × PLANE_H.
export type Look = { body: string; hair: "bowl" | "spiky" | "long" | "slick"; tie?: string; lanyard?: boolean };
export type Pose = {
  expr: string; blink: boolean; bonk: number; breathe: number; lookX?: number; talk?: number;
  lean?: number; tilt?: number; squash?: number; hip?: number;
  handF?: [number, number]; handB?: [number, number]; bendF?: number; bendB?: number;
};

const INK = "#2a1d1a";
export const PLANE_W = 1.4, PLANE_H = 2.1;
export const CW = 560, CH = Math.round((CW * PLANE_H) / PLANE_W);
const K = CW / PLANE_W;
const X = (x: number) => CW / 2 + x * K;
const Y = (z: number) => CH - z * K;
const R0 = 0.27, W = 0.27, H = 0.36, HIP = 0.4;

const EXPR: Record<string, { eyes: string; brow: [number, number]; mouth: [string, number]; sweat?: boolean; cheeks?: boolean; shake?: boolean; look?: number }> = {
  neutral: { eyes: "oval", brow: [0, 0], mouth: ["flat", 0] },
  smug: { eyes: "lid", brow: [0.25, 0.015], mouth: ["smirk", 0.6] },
  proud: { eyes: "happy", brow: [0.2, 0.02], mouth: ["grin", 0.8] },
  grin: { eyes: "oval", brow: [-0.15, 0], mouth: ["grin", 1] },
  laugh: { eyes: "happy", brow: [0.25, 0.03], mouth: ["open", 0.85], shake: true },
  nervous: { eyes: "wide", brow: [0.4, 0.03], mouth: ["squiggle", 0], sweat: true, look: -0.35 },
  shock: { eyes: "wide", brow: [0.55, 0.06], mouth: ["open", 0.95], sweat: true, shake: true },
  realize: { eyes: "wide", brow: [0.45, 0.05], mouth: ["o", 0.7] },
  blank: { eyes: "lid", brow: [0, -0.01], mouth: ["o", 0.3] },
  holdlaugh: { eyes: "squeeze", brow: [0.3, 0], mouth: ["pressed", 0], cheeks: true, shake: true },
  stern: { eyes: "lid", brow: [-0.45, -0.02], mouth: ["flat", -0.2] },
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k)).join(",")})`;
};

export function drawDoodle(ctx: CanvasRenderingContext2D, look: Look, p: Pose, rnd: () => number) {
  ctx.clearRect(0, 0, CW, CH);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const E = EXPR[p.expr] ?? EXPR.neutral;
  const sq = (p.squash ?? 1) * (1 + p.breathe) * (1 - 0.07 * p.bonk);
  const hip = (p.hip ?? HIP);
  const lean = p.lean ?? 0;
  const bh = H * sq, bw = W / Math.sqrt(sq);
  // точка на теле (x,z от таза) → локальные координаты с наклоном
  const B = (x: number, z: number): [number, number] => {
    const c = Math.cos(lean), s = Math.sin(lean);
    return [x * c + z * s, hip - x * s + z * c];
  };
  const stroke = (w: number, col = INK) => { ctx.strokeStyle = col; ctx.lineWidth = w * K; };
  // тень
  ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(X(0), Y(0.01), W * 0.85 * K, 0.03 * K, 0, 0, Math.PI * 2); ctx.fill();
  const limb = (a: [number, number], b: [number, number], bend: number) => {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const cx = (a[0] + b[0]) / 2 - dz * bend, cz = (a[1] + b[1]) / 2 + dx * bend;
    stroke(0.032); ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.quadraticCurveTo(X(cx), Y(cz), X(b[0]), Y(b[1])); ctx.stroke();
  };
  const hand = (h: [number, number]) => {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(X(h[0]), Y(h[1]), 0.05 * K, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(X(h[0] - 0.017), Y(h[1] + 0.017), 0.009 * K, 0.006 * K, 0.6, 0, Math.PI * 2); ctx.fill();
  };
  // ноги
  for (const s of [1, -1]) {
    limb(B(s * W * 0.2, 0.05), [s * 0.08, 0.03], s * 0.04);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(X(s * 0.08 + 0.015), Y(0.022), 0.05 * K, 0.026 * K, 0, 0, Math.PI * 2); ctx.fill();
  }
  const shB = B(W * 0.44, bh * 0.7), shF = B(-W * 0.44, bh * 0.7);
  const hB = p.handB ?? [W * 0.75, HIP + 0.06], hF = p.handF ?? [-W * 0.75, HIP + 0.06];
  limb(shB, hB, p.bendB ?? -0.12); hand(hB);
  // тело
  ctx.save();
  const o = B(0, 0); ctx.translate(X(o[0]), Y(o[1])); ctx.rotate(lean);
  const body = () => { ctx.beginPath(); ctx.roundRect(-bw / 2 * K, -bh * K, bw * K, bh * K, bw * 0.45 * K); };
  ctx.fillStyle = look.body; body(); ctx.fill();
  ctx.save(); body(); ctx.clip(); ctx.fillStyle = shade(look.body, 0.62); ctx.fillRect(bw * 0.2 * K, -bh * K, bw * K, bh * K); ctx.restore();
  stroke(0.028); body(); ctx.stroke();
  ctx.fillStyle = "#f7f7f2"; stroke(0.01);
  ctx.beginPath(); ctx.moveTo(-W * 0.2 * K, -bh * K); ctx.lineTo(0, -bh * 0.62 * K); ctx.lineTo(W * 0.2 * K, -bh * K); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (look.tie) {
    ctx.fillStyle = look.tie; ctx.beginPath(); ctx.moveTo(-W * 0.035 * K, -bh * 0.95 * K); ctx.lineTo(W * 0.035 * K, -bh * 0.95 * K);
    ctx.lineTo(W * 0.05 * K, -bh * 0.55 * K); ctx.lineTo(0, -bh * 0.48 * K); ctx.lineTo(-W * 0.05 * K, -bh * 0.55 * K); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if (look.lanyard) {
    stroke(0.018, "#2f6fd6"); ctx.beginPath(); ctx.moveTo(-W * 0.16 * K, -bh * 0.98 * K); ctx.lineTo(-W * 0.2 * K, -bh * 0.44 * K); ctx.stroke();
    ctx.fillStyle = "#fff"; stroke(0.008); ctx.fillRect(-W * 0.3 * K, -bh * 0.44 * K, W * 0.2 * K, bh * 0.22 * K); ctx.strokeRect(-W * 0.3 * K, -bh * 0.44 * K, W * 0.2 * K, bh * 0.22 * K);
  }
  stroke(0.008); ctx.beginPath(); ctx.moveTo(W * 0.12 * K, -bh * 0.5 * K); ctx.lineTo(W * 0.36 * K, -bh * 0.5 * K); ctx.stroke();
  ctx.restore();
  // голова
  const top = B(0, bh + R0 * 0.78);
  const hr = R0 * (1 + 0.14 * p.bonk);
  const shk = E.shake ? (rnd() - 0.5) * 0.012 : 0;
  ctx.save();
  ctx.translate(X(top[0] + shk), Y(top[1] + shk)); ctx.rotate(lean * 0.7 + (p.tilt ?? 0) + 0.06 * p.bonk);
  const r = hr * K;
  ctx.fillStyle = "#f5f1ea"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "#d8d2c8"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.arc(-r * 0.1, -r * 0.08, r * 0.82, 0, Math.PI * 2, true); ctx.fill("evenodd");
  ctx.restore();
  stroke(0.028); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  // волосы (чёлка выше бровей)
  ctx.fillStyle = "#1b1615"; ctx.beginPath(); ctx.arc(0, 0, r * 1.05, Math.PI, Math.PI * 2);
  const fr = look.hair === "slick" ? 0.55 : 0.46;
  ctx.lineTo(r * 0.85, -r * (fr - 0.04)); ctx.lineTo(r * 0.45, -r * (fr + 0.02)); ctx.lineTo(-r * 0.2, -r * (fr + 0.06)); ctx.lineTo(-r * 0.8, -r * fr);
  ctx.closePath(); ctx.fill(); stroke(0.022); ctx.stroke();
  ctx.fillStyle = "#1b1615";
  if (look.hair === "spiky") for (let i = 0; i < 6; i++) { const a = Math.PI * (1.08 + i * 0.17);
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.9); ctx.lineTo(Math.cos(a + 0.08) * r * 1.28, Math.sin(a + 0.08) * r * 1.22); ctx.lineTo(Math.cos(a + 0.17) * r, Math.sin(a + 0.17) * r * 0.9); ctx.fill(); }
  if (look.hair === "long") { ctx.fillRect(-r * 1.06, -r * 0.1, r * 0.22, r * 1.15); ctx.fillRect(r * 0.84, -r * 0.1, r * 0.22, r * 1.15); }
  stroke(0.012, "#ffffff"); ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.2, r * 0.75, Math.PI * 1.25, Math.PI * 1.5); ctx.stroke();
  // глаза
  let eyes = E.eyes;
  if (p.blink && ["oval", "wide", "lid"].includes(eyes)) eyes = "closed";
  const lx = ((p.lookX ?? 0) + (E.look ? 0 : 0)) * r;
  const [bt, bhh] = E.brow;
  for (const s of [-1, 1]) {
    const ex = s * r * 0.34, ey = -r * 0.02;
    ctx.fillStyle = INK;
    if (eyes === "oval") {
      ctx.beginPath(); ctx.ellipse(ex + lx * 0.06, ey, r * 0.095, r * 0.13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(ex + lx * 0.06 - r * 0.03, ey - r * 0.05, r * 0.03, r * 0.035, 0, 0, Math.PI * 2); ctx.fill();
    } else if (eyes === "wide") {
      ctx.fillStyle = "#fff"; stroke(0.016); ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.19, r * 0.15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(ex + lx * 0.09, ey + (E.look ?? 0) * -r * 0.1, r * 0.045, r * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    } else if (eyes === "lid") {
      ctx.beginPath(); ctx.ellipse(ex + lx * 0.05, ey + r * 0.02, r * 0.09, r * 0.08, 0, 0, Math.PI * 2); ctx.fill();
      stroke(0.018); ctx.beginPath(); ctx.moveTo(ex - r * 0.14, ey - r * 0.045); ctx.lineTo(ex + r * 0.14, ey - r * 0.045); ctx.stroke();
    } else if (eyes === "happy") {
      stroke(0.022); ctx.beginPath(); ctx.arc(ex, ey + r * 0.07, r * 0.12, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (eyes === "closed") {
      stroke(0.018); ctx.beginPath(); ctx.arc(ex, ey - r * 0.08, r * 0.11, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    } else if (eyes === "squeeze") {
      stroke(0.022); ctx.beginPath(); ctx.moveTo(ex - s * r * 0.13, ey - r * 0.08); ctx.lineTo(ex + s * r * 0.09, ey); ctx.lineTo(ex - s * r * 0.13, ey + r * 0.08); ctx.stroke();
    }
    const by = ey - r * 0.27 - bhh * r * 2 - (eyes === "wide" ? 0.04 * r : 0);
    const inner = ex - s * r * 0.13, outer = ex + s * r * 0.15;
    stroke(0.028); ctx.beginPath(); ctx.moveTo(outer, by + bt * r * 0.07); ctx.lineTo((inner + outer) / 2, by - r * 0.02); ctx.lineTo(inner, by - bt * r * 0.14); ctx.stroke();
  }
  if (E.cheeks) { ctx.fillStyle = "#f0b3a4"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.55, r * 0.3, r * 0.2, r * 0.14, 0, 0, Math.PI * 2); ctx.fill(); } }
  // рот
  let [mt, mp] = E.mouth;
  const tk = p.talk ?? 0;
  if (tk > 0.15 && ["flat", "smirk", "squiggle", "pressed"].includes(mt)) { mt = "open"; mp = 0.4 + 0.6 * tk; }
  const my = r * 0.45, mx = lx * 0.04;
  stroke(0.018);
  if (mt === "flat") { ctx.beginPath(); ctx.moveTo(mx - r * 0.17, my); ctx.quadraticCurveTo(mx, my - mp * r * 0.12, mx + r * 0.17, my); ctx.stroke(); }
  else if (mt === "smirk") { ctx.beginPath(); ctx.moveTo(mx - r * 0.14, my); ctx.quadraticCurveTo(mx + r * 0.05, my + r * 0.12, mx + r * 0.22, my - r * 0.08); ctx.stroke(); }
  else if (mt === "squiggle") { ctx.beginPath(); for (let i = 0; i <= 16; i++) { const x = -r * 0.22 + (i / 16) * r * 0.44; const yy = my + Math.sin((x / r) * 20) * r * 0.045; i ? ctx.lineTo(mx + x, yy) : ctx.moveTo(mx + x, yy); } ctx.stroke(); }
  else if (mt === "pressed") { stroke(0.022); ctx.beginPath(); ctx.moveTo(mx - r * 0.13, my); ctx.lineTo(mx + r * 0.13, my); ctx.stroke(); }
  else if (mt === "o") { ctx.fillStyle = "#5e1f22"; ctx.beginPath(); ctx.ellipse(mx, my, r * 0.07 * (0.7 + mp), r * 0.09 * (0.7 + mp), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  else if (mt === "grin") {
    const mw = r * 0.36;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(mx - mw, my - r * 0.05); ctx.quadraticCurveTo(mx, my + r * 0.36 * mp, mx + mw, my - r * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
    stroke(0.008); for (const k of [-0.5, -0.17, 0.17, 0.5]) { ctx.beginPath(); ctx.moveTo(mx + k * mw, my - r * 0.04); ctx.lineTo(mx + k * mw * 0.95, my + r * 0.13 * mp); ctx.stroke(); }
  } else if (mt === "open") {
    const mw = r * 0.24, mh = r * 0.08 + r * 0.24 * mp;
    ctx.fillStyle = "#5e1f22"; ctx.beginPath(); ctx.moveTo(mx - mw, my - r * 0.05); ctx.quadraticCurveTo(mx, my - r * 0.05 + mh * 1.9, mx + mw, my - r * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d66a6c"; ctx.beginPath(); ctx.ellipse(mx, my + mh * 0.6, mw * 0.5, mh * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    stroke(0.024, "#fff"); ctx.beginPath(); ctx.moveTo(mx - mw * 0.75, my - r * 0.025); ctx.lineTo(mx + mw * 0.75, my - r * 0.025); ctx.stroke();
  }
  if (E.sweat) { ctx.fillStyle = "#c9e6ff"; stroke(0.01, "#3d7fd0"); ctx.beginPath(); ctx.moveTo(r * 0.98, -r * 0.5); ctx.quadraticCurveTo(r * 1.1, -r * 0.25, r * 0.98, -r * 0.18); ctx.quadraticCurveTo(r * 0.86, -r * 0.25, r * 0.98, -r * 0.5); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  // передняя рука поверх
  limb(shF, hF, p.bendF ?? 0.12); hand(hF);
}
