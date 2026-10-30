// Ведущий канала — чернильный дух (по картинке владельца), векторное 2D из кода (SVG).
// Голова-капля с завитком, хвост-дымка, огромные янтарные глаза, бровки, маленький рот, румянец, ручка, парящие капли,
// знак «?», который превращается в «!». Всё параметризовано: эмоция, жест, взгляд, моргание, речь, время.
import React from "react";

export type InkyExpr = "neutral" | "think" | "surprised" | "smug" | "happy" | "scared" | "shock" | "sad";
export type InkyHand = "chin" | "point" | "wave" | "down" | "up";
export type InkyPose = { t: number; expr: InkyExpr; hand: InkyHand; look?: [number, number]; blink?: number; talk?: number;
  mark?: number /* 0 — «?», 1 — «!» */; showMark?: boolean; squash?: number };

const C = { dark: "#1b0a3b", mid: "#4a1e8a", light: "#a23ad8", rim: "#c27bff", eye: "#ffc12e", eyeRing: "#e2860c", pupil: "#3b1a0b", blush: "#ff6fa8", mark: "#ffc12e" };
const EXPR: Record<InkyExpr, { eye: number; pupil: number; lid: number; brow: [number, number]; mouth: string; blush: number; shake?: number }> = {
  neutral:   { eye: 1.0,  pupil: 1.0,  lid: 0.0,  brow: [0, 0],      mouth: "smile", blush: 0.25 },
  think:     { eye: 1.0,  pupil: 0.95, lid: 0.08, brow: [0.25, -0.15], mouth: "hmm",  blush: 0.35 },
  surprised: { eye: 1.06, pupil: 0.75, lid: 0.0,  brow: [0.5, 0.5],  mouth: "o",     blush: 0.3 },
  smug:      { eye: 0.95, pupil: 1.0,  lid: 0.42, brow: [-0.2, 0.15], mouth: "smirk", blush: 0.2 },
  happy:     { eye: 1.0,  pupil: 1.05, lid: 0.0,  brow: [0.25, 0.25], mouth: "grin", blush: 0.55 },
  scared:    { eye: 1.06, pupil: 0.6,  lid: 0.0,  brow: [0.6, 0.6],  mouth: "wobble", blush: 0.1, shake: 1 },
  shock:     { eye: 1.1,  pupil: 0.5,  lid: 0.0,  brow: [0.8, 0.8],  mouth: "open",  blush: 0.0, shake: 1.5 },
  sad:       { eye: 1.0,  pupil: 1.1,  lid: 0.25, brow: [-0.4, -0.4], mouth: "frown", blush: 0.15 },
};

// голова-капля с завитком: контур замкнутый, чуть «дышит»
const headPath = (t: number, sq: number) => {
  const w = Math.sin(t * 2.2) * 3, s = sq;
  return `M 112 ${262 * s} C 92 ${200 * s}, 120 ${140 * s}, 178 ${128 * s}
    C 160 ${108 * s}, 160 ${84 * s}, ${182 + w} ${70 * s} C ${200 + w} ${60 * s}, ${222 + w} ${66 * s}, ${214 + w} ${80 * s}
    C ${206 + w} ${92 * s}, 190 ${88 * s}, 194 ${104 * s} C 198 ${118 * s}, 212 ${122 * s}, 226 ${126 * s}
    C 290 ${138 * s}, 318 ${196 * s}, 302 ${262 * s} C 290 ${312 * s}, 240 ${336 * s}, 206 ${336 * s}
    C 160 ${336 * s}, 124 ${310 * s}, 112 ${262 * s} Z`;
};
// хвост-дымка: две кромки с бегущей волной
const tailPath = (t: number, sq: number) => {
  const a = (k: number) => Math.sin(t * 2.6 - k) * 16;
  return `M 150 ${318 * sq} C ${126 + a(0)} 360, ${190 + a(1)} 388, ${146 + a(1.5)} 420
    C ${110 + a(2.2)} 446, ${150 + a(2.8)} 474, ${132 + a(3.3)} 492 C ${170 + a(2.8)} 476, ${178 + a(2.2)} 446, ${196 + a(1.5)} 420
    C ${226 + a(1)} 386, ${204 + a(0.5)} 352, 246 ${326 * sq} Z`;
};
const drop = (x: number, y: number, s: number, r: number) =>
  `M ${x} ${y - 14 * s} C ${x + 9 * s} ${y - 4 * s}, ${x + 9 * s} ${y + 8 * s}, ${x} ${y + 9 * s} C ${x - 9 * s} ${y + 8 * s}, ${x - 9 * s} ${y - 4 * s}, ${x} ${y - 14 * s} Z`;

const Eye: React.FC<{ cx: number; cy: number; r: number; e: (typeof EXPR)["neutral"]; look: [number, number]; blink: number; side: number }> =
  ({ cx, cy, r, e, look, blink, side }) => {
    const R = r * e.eye, pr = R * 0.56 * e.pupil, px = cx + look[0] * R * 0.28, py = cy + look[1] * R * 0.25;
    const lid = Math.max(e.lid, blink);
    const id = `eclip${side}${Math.round(cx)}`;
    return (<g>
      <clipPath id={id}><ellipse cx={cx} cy={cy} rx={R} ry={R * 1.05} /></clipPath>
      <ellipse cx={cx} cy={cy} rx={R + 4} ry={R * 1.05 + 4} fill={C.eyeRing} />
      <ellipse cx={cx} cy={cy} rx={R} ry={R * 1.05} fill={C.eye} />
      <g clipPath={`url(#${id})`}>
        <ellipse cx={px} cy={py} rx={pr} ry={pr * 1.12} fill={C.pupil} />
        <circle cx={px - pr * 0.38} cy={py - pr * 0.45} r={pr * 0.34} fill="#fff" />
        <circle cx={px + pr * 0.35} cy={py + pr * 0.35} r={pr * 0.13} fill="#fff" opacity={0.85} />
        {/* веко сверху (цвета тела): ехидство, сон, моргание */}
        {lid > 0.01 ? <rect x={cx - R - 6} y={cy - R * 1.1 - 6} width={R * 2 + 12} height={(R * 2.2 + 6) * lid + 6} fill={C.mid} /> : null}
        {lid > 0.01 ? <line x1={cx - R} x2={cx + R} y1={cy - R * 1.1 + (R * 2.2) * lid} y2={cy - R * 1.1 + (R * 2.2) * lid - side * 4 * e.lid} stroke={C.dark} strokeWidth={4} strokeLinecap="round" /> : null}
      </g>
    </g>);
  };

export const Inky: React.FC<{ pose: InkyPose; x?: number; y?: number; scale?: number }> = ({ pose, x = 0, y = 0, scale = 1 }) => {
  const { t } = pose, e = EXPR[pose.expr];
  const sq = pose.squash ?? 1;
  const float = Math.sin(t * 1.8) * 6, tilt = Math.sin(t * 1.1) * 2.5;
  const shake = e.shake ? Math.sin(t * 60) * 1.6 * e.shake : 0;
  const look = pose.look ?? [0, 0], blink = pose.blink ?? 0, talk = pose.talk ?? 0;
  const eyeY = 234 * sq;
  // рот
  const mx = 210, my = 298 * sq;
  let mouth: React.ReactNode;
  if (talk > 0.15) mouth = <ellipse cx={mx} cy={my + 2} rx={9 + 5 * talk} ry={4 + 9 * talk} fill="#1a0a33" />;
  else if (e.mouth === "smile") mouth = <path d={`M ${mx - 10} ${my} Q ${mx} ${my + 8} ${mx + 10} ${my}`} stroke={C.dark} strokeWidth={4} fill="none" strokeLinecap="round" />;
  else if (e.mouth === "hmm") mouth = <path d={`M ${mx - 7} ${my + 2} Q ${mx} ${my - 3} ${mx + 7} ${my + 2}`} stroke={C.dark} strokeWidth={4} fill="none" strokeLinecap="round" />;
  else if (e.mouth === "o") mouth = <ellipse cx={mx} cy={my + 2} rx={7} ry={9} fill="#1a0a33" />;
  else if (e.mouth === "smirk") mouth = <path d={`M ${mx - 12} ${my + 2} Q ${mx + 2} ${my + 8} ${mx + 14} ${my - 6}`} stroke={C.dark} strokeWidth={4} fill="none" strokeLinecap="round" />;
  else if (e.mouth === "grin") mouth = <path d={`M ${mx - 16} ${my - 2} Q ${mx} ${my + 20} ${mx + 16} ${my - 2} Z`} fill="#1a0a33" />;
  else if (e.mouth === "wobble") mouth = <path d={`M ${mx - 12} ${my} q 4 -5 8 0 q 4 5 8 0 q 4 -5 8 0`} stroke={C.dark} strokeWidth={4} fill="none" strokeLinecap="round" />;
  else if (e.mouth === "open") mouth = <ellipse cx={mx} cy={my + 4} rx={12} ry={16} fill="#1a0a33" />;
  else mouth = <path d={`M ${mx - 10} ${my + 6} Q ${mx} ${my - 3} ${mx + 10} ${my + 6}`} stroke={C.dark} strokeWidth={4} fill="none" strokeLinecap="round" />;
  // рука
  const hand = pose.hand;
  const handPath = hand === "chin" ? `M 268 ${300 * sq} C 262 ${330 * sq}, 246 ${346 * sq}, 226 ${340 * sq} C 208 ${334 * sq}, 210 ${318 * sq}, 222 ${312 * sq} C 216 ${300 * sq}, 222 ${292 * sq}, 230 ${300 * sq} C 236 ${308 * sq}, 246 ${308 * sq}, 252 ${296 * sq} Z`
    : hand === "point" ? `M 292 ${250 * sq} C 330 ${232 * sq}, 356 ${214 * sq}, 372 ${206 * sq} C 380 ${202 * sq}, 384 ${212 * sq}, 376 ${216 * sq} C 352 ${232 * sq}, 330 ${254 * sq}, 300 ${272 * sq} Z`
    : hand === "wave" ? `M 290 ${250 * sq} C 318 ${222 * sq}, ${330 + Math.sin(t * 9) * 10} ${190 * sq}, ${336 + Math.sin(t * 9) * 12} ${168 * sq} C ${344 + Math.sin(t * 9) * 12} ${156 * sq}, ${356 + Math.sin(t * 9) * 12} ${166 * sq}, ${350 + Math.sin(t * 9) * 10} ${178 * sq} C 340 ${206 * sq}, 322 ${246 * sq}, 300 ${270 * sq} Z`
    : hand === "up" ? `M 292 ${244 * sq} C 316 ${214 * sq}, 322 ${184 * sq}, 318 ${160 * sq} C 316 ${148 * sq}, 330 ${148 * sq}, 330 ${160 * sq} C 334 ${190 * sq}, 322 ${230 * sq}, 300 ${266 * sq} Z`
    : null;
  const mk = Math.min(1, Math.max(0, pose.mark ?? 0));
  const markBounce = 1 + 0.25 * Math.max(0, Math.sin(Math.min(1, mk) * Math.PI));
  return (
    <g transform={`translate(${x},${y + float}) scale(${scale}) rotate(${tilt + shake}, 210, 260)`}>
      <defs>
        {/* как у референса: пурпурный блик сверху → фиолетовый → почти чёрный к краям и вниз */}
        <radialGradient id="inkBody" cx="52%" cy="22%" r="80%">
          <stop offset="0%" stopColor="#b347e6" /><stop offset="28%" stopColor="#7a2cc4" /><stop offset="58%" stopColor={C.mid} /><stop offset="100%" stopColor={C.dark} />
        </radialGradient>
        <linearGradient id="inkTail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a1e8a" /><stop offset="55%" stopColor="#2a0f5a" /><stop offset="100%" stopColor="#12062a" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="inkDrop" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#9a3ad6" /><stop offset="100%" stopColor={C.dark} /></radialGradient>
        <filter id="inkGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={C.rim} floodOpacity="0.55" />
        </filter>
        <filter id="markGlow"><feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ffd56a" floodOpacity="0.9" /></filter>
      </defs>
      {/* парящие капли */}
      {[[96, 170, 0.9, 0], [334, 300, 0.7, 1.3], [118, 360, 0.6, 2.2], [70, 260, 0.75, 3.1], [300, 110, 0.55, 4]].map(([dx, dy, s, ph], i) => (
        <path key={i} d={drop(dx + Math.sin(t * 1.4 + ph) * 6, dy + Math.cos(t * 1.7 + ph) * 8, s, 0)} fill="url(#inkDrop)" stroke={C.dark} strokeWidth={2} />
      ))}
      <g filter="url(#inkGlow)">
        <path d={tailPath(t, sq)} fill="url(#inkTail)" stroke={C.dark} strokeWidth={4} strokeLinejoin="round" />
        <path d={headPath(t, sq)} fill="url(#inkBody)" stroke={C.dark} strokeWidth={4} strokeLinejoin="round" />
      </g>
      {/* блик и бровки */}
      <path d={`M 140 ${190 * sq} Q 150 ${160 * sq} 176 ${150 * sq}`} stroke={C.rim} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.7} />
      {[-1, 1].map((s) => {
        const bx = s < 0 ? 170 : 252, by = (s < 0 ? 174 : 166) * sq - e.brow[s < 0 ? 0 : 1] * 14 - (e.eye - 1) * 40;
        return <path key={s} d={`M ${bx - 16} ${by + 4 + s * e.brow[0] * 2} Q ${bx} ${by - 6} ${bx + 16} ${by + 4 - s * e.brow[1] * 2}`} stroke={C.rim} strokeWidth={6} strokeLinecap="round" fill="none" />;
      })}
      <Eye cx={172} cy={eyeY} r={43} e={e} look={look} blink={blink} side={-1} />
      <Eye cx={250} cy={eyeY - 4} r={45} e={e} look={look} blink={blink} side={1} />
      <ellipse cx={210} cy={288 * sq} rx={30} ry={10} fill={C.blush} opacity={e.blush} />
      {mouth}
      {handPath ? <path d={handPath} fill="url(#inkDrop)" stroke={C.dark} strokeWidth={4} strokeLinejoin="round" /> : null}
      {pose.showMark !== false ? (
        <g transform={`translate(${360 + Math.sin(t * 2) * 4}, ${120 + Math.cos(t * 2.3) * 5}) scale(${markBounce}) rotate(${(1 - mk) * 12})`} filter="url(#markGlow)">
          <text x={0} y={0} fontSize={110} fontWeight={900} fontFamily="Arial Black, Arial, sans-serif" textAnchor="middle" fill={C.mark}
            stroke="#b8650a" strokeWidth={5} paintOrder="stroke" opacity={1 - mk}>?</text>
          <text x={0} y={0} fontSize={120} fontWeight={900} fontFamily="Arial Black, Arial, sans-serif" textAnchor="middle" fill={C.mark}
            stroke="#b8650a" strokeWidth={5} paintOrder="stroke" opacity={mk}>!</text>
        </g>) : null}
    </g>
  );
};
