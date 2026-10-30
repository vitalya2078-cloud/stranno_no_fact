// E01 «Если Солнце станет чёрной дырой» — минималистичное 2D (SVG), камера в движении, ведущий — чернильный дух.
import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { fontFamily } from "./font";
import T from "./e01_timing.json";
import { Inky, InkyExpr, InkyHand } from "./inky";

export const E01_TOTAL = Math.round(T.total * 30);
const P = T.paras.map((p) => p.t0);                         // начала абзацев (с)
const W = (pi: number, k: number) => (T.paras[pi].words[k] ? T.paras[pi].words[k][1] : T.paras[pi].t0);   // время k-го слова абзаца
const BG = "#0b0e24", AMBER = "#ffc12e", TEAL = "#3fe0d0", BLUE = "#3d7bff", INK = "#26114f";
const ez = (t: number, a: number, b: number, f = Easing.inOut(Easing.cubic)) => (t <= a ? 0 : t >= b ? 1 : f((t - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const pop = (t: number, t0: number) => (t < t0 ? 0 : 1 + 0.35 * Math.exp(-(t - t0) * 7) * Math.cos((t - t0) * 22));   // «бонк»-появление

// ---------------------------------------------------------------- элементы
const Stars: React.FC<{ t: number }> = ({ t }) => {
  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return <g>{Array.from({ length: 140 }, (_, i) => { const x = r() * 1080, y = r() * 1920, z = 0.6 + r() * 1.6;
    return <circle key={i} cx={x} cy={y} r={z} fill="#fff" opacity={0.25 + 0.35 * Math.abs(Math.sin(t * (0.6 + r()) + i))} />; })}</g>;
};
const Sun: React.FC<{ x: number; y: number; r: number; dark: number; t: number }> = ({ x, y, r, dark, t }) => (
  <g>
    <circle cx={x} cy={y} r={r * 1.6} fill={AMBER} opacity={0.12 * (1 - dark)} />
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + t * 0.3;
      return <line key={i} x1={x + Math.cos(a) * r * 1.15} y1={y + Math.sin(a) * r * 1.15} x2={x + Math.cos(a) * r * 1.42} y2={y + Math.sin(a) * r * 1.42}
        stroke={AMBER} strokeWidth={r * 0.09} strokeLinecap="round" opacity={1 - dark} />; })}
    <circle cx={x} cy={y} r={r} fill={AMBER} opacity={1 - dark} />
    <circle cx={x} cy={y} r={r * 0.75} fill="#ffe08a" opacity={(1 - dark) * 0.6} />
  </g>
);
const BlackHole: React.FC<{ x: number; y: number; r: number; t: number; show: number }> = ({ x, y, r, t, show }) => (
  <g opacity={show}>
    <ellipse cx={x} cy={y} rx={r * 2.4} ry={r * 0.8} fill="none" stroke={TEAL} strokeWidth={r * 0.35} opacity={0.5} transform={`rotate(${-12 + Math.sin(t) * 2}, ${x}, ${y})`} />
    <circle cx={x} cy={y} r={r * 1.25} fill="none" stroke={TEAL} strokeWidth={r * 0.12} opacity={0.9} />
    <circle cx={x} cy={y} r={r} fill="#000" />
  </g>
);
const Earth: React.FC<{ x: number; y: number; r: number; lit?: number }> = ({ x, y, r, lit = 1 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={lit > 0.5 ? BLUE : "#1d2a4f"} />
    <path d={`M ${x - r * 0.5} ${y - r * 0.4} q ${r * 0.3} ${-r * 0.3} ${r * 0.6} 0 q ${r * 0.2} ${r * 0.4} ${-r * 0.2} ${r * 0.5} z`} fill={lit > 0.5 ? "#3ccf6a" : "#1e4030"} />
    <path d={`M ${x + r * 0.2} ${y + r * 0.2} q ${r * 0.4} 0 ${r * 0.5} ${r * 0.35} q ${-r * 0.3} ${r * 0.2} ${-r * 0.5} 0 z`} fill={lit > 0.5 ? "#3ccf6a" : "#1e4030"} />
  </g>
);
const Label: React.FC<{ x: number; y: number; text: string; s: number; color?: string; size?: number }> = ({ x, y, text, s, color = "#fff", size = 70 }) =>
  s > 0 ? <text x={x} y={y} fontSize={size} fontFamily={fontFamily} fontWeight={900} fill={color} textAnchor="middle" stroke={BG} strokeWidth={10} paintOrder="stroke"
    transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>{text}</text> : null;

// камера: масштаб и центр кадра во времени (плавно), плюс «ручной» дрейф
const camAt = (t: number, keys: [number, number, number, number][]) => {   // [сек, zoom, cx, cy]
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { a = keys[i - 1]; b = keys[i]; break; }
  const k = a === b ? 1 : ez(t, a[0], b[0]);
  return { z: lerp(a[1], b[1], k), x: lerp(a[2], b[2], k) + Math.sin(t * 0.7) * 6, y: lerp(a[3], b[3], k) + Math.cos(t * 0.5) * 6 };
};
const World: React.FC<{ t: number; cam: [number, number, number, number][]; children: React.ReactNode }> = ({ t, cam, children }) => {
  const c = camAt(t, cam);
  // ведущий (Host) не двигается вместе с камерой: он живёт в экранных координатах, внизу кадра
  const all = React.Children.toArray(children) as React.ReactElement[];
  const hosts = all.filter((ch) => ch && (ch as any).type === Host), rest = all.filter((ch) => !(ch && (ch as any).type === Host));
  return (<g>
    <g transform={`translate(540,700) scale(${c.z}) translate(${-c.x},${-c.y})`}>{rest}</g>
    {hosts.map((h, i) => React.cloneElement(h as any, { key: i, x: 40, y: 1235, s: 0.8 }))}
  </g>);
};

// ведущий: эмоция, жест, речь по огибающей голоса
const talkAt = (f: number) => (T.env[f] ?? 0);
const Host: React.FC<{ t: number; f: number; x: number; y: number; s: number; expr: InkyExpr; hand: InkyHand; look?: [number, number]; mark?: number; showMark?: boolean; talk?: boolean }> =
  ({ t, f, x, y, s, expr, hand, look, mark = 0, showMark = true, talk = true }) => {
    const blink = (Math.floor(t * 30) % 97) < 4 ? 1 : 0;
    return <Inky pose={{ t, expr, hand, look, blink, talk: talk ? talkAt(f) : 0, mark, showMark }} x={x} y={y} scale={s} />;
  };

// ---------------------------------------------------------------- шоты
const Shot: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  // 0. Хук: Солнце схлопывается в чёрную дыру, Земля продолжает кружить
  if (t < P[1]) {
    const tc = W(0, 6), col = ez(t, tc, tc + 0.35);
    const ang = t * 0.9;
    return (<World t={t} cam={[[0, 1.7, 540, 760], [tc, 1.2, 540, 820], [P[1], 0.95, 540, 900]]}>
      <Stars t={t} />
      <ellipse cx={540} cy={820} rx={360} ry={130} fill="none" stroke="#ffffff33" strokeWidth={4} strokeDasharray="14 14" />
      <Sun x={540} y={820} r={lerp(150, 12, col)} dark={col} t={t} />
      <BlackHole x={540} y={820} r={lerp(10, 34, col)} t={t} show={col} />
      <Earth x={540 + Math.cos(ang) * 360} y={820 + Math.sin(ang) * 130} r={34} />
      <Host t={t} f={f} x={370} y={1340} s={0.85} expr={col > 0.5 ? "shock" : "think"} hand={col > 0.5 ? "up" : "chin"} look={[-0.2, -0.8]} />
    </World>);
  }
  // 1. Чай на балконе, Солнце сжимается до 6 км
  if (t < P[2]) {
    const ts = W(1, 7), sh = ez(t, ts, ts + 0.6);
    return (<World t={t} cam={[[P[1], 1.25, 540, 1250], [ts - 0.2, 1.1, 540, 1150], [P[2], 1.55, 720, 560]]}>
      <Stars t={t} />
      <Sun x={720} y={560} r={lerp(170, 18, sh)} dark={0} t={t} />
      <Label x={720} y={700} text="6 км" s={pop(t, W(1, 9))} color={AMBER} size={80} />
      
      <Host t={t} f={f} x={300} y={1300} s={0.98} expr={t < W(1, 12) ? "happy" : "neutral"} hand="chin" look={[0.6, -0.6]} showMark={false} />
      {/* кружка чая у руки */}
      <g transform={`translate(${-9999},${0})`}>
        <rect x={0} y={0} width={70} height={66} rx={10} fill="#efe6d4" stroke={INK} strokeWidth={5} />
        <path d="M 70 14 q 26 4 0 34" stroke={INK} strokeWidth={6} fill="none" />
        {[0, 1, 2].map((i) => <path key={i} d={`M ${16 + i * 18} -8 q 6 -14 0 -28`} stroke="#ffffff88" strokeWidth={4} fill="none" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
      </g>
    </World>);
  }
  // 2. Свет летит 8 минут
  if (t < P[3]) {
    const k = ez(t, P[2] + 0.2, P[3] - 0.2, Easing.linear);
    const secs = Math.round(lerp(0, 500, k)), mm = Math.floor(secs / 60), ss = secs % 60;
    const lx = lerp(160, 920, k);
    return (<World t={t} cam={[[P[2], 1.35, 300, 960], [P[3], 1.35, 780, 960]]}>
      <Stars t={t} />
      <Sun x={130} y={960} r={22} dark={0} t={t} />
      <Earth x={950} y={960} r={34} />
      <line x1={160} y1={960} x2={lx} y2={960} stroke={AMBER} strokeWidth={10} strokeLinecap="round" />
      <circle cx={lx} cy={960} r={18} fill="#fff2b8" />
      <Label x={lx} y={880} text={`${mm}:${String(ss).padStart(2, "0")}`} s={1} color="#fff" size={64} />
    </World>);
  }
  // 3. Щёлк — темнота, Земля летит дальше. «Как?»
  if (t < P[4]) {
    const tk = W(3, 2), dark = ez(t, tk, tk + 0.08), ang = t * 0.7;
    const flash = t > tk && t < tk + 0.12 ? 1 : 0;
    const tq = W(3, 10);
    return (<g>
      <World t={t} cam={[[P[3], 1.0, 540, 900], [tk, 1.0, 540, 900], [P[4], 0.85, 540, 900]]}>
        <Stars t={t} />
        <ellipse cx={540} cy={820} rx={360} ry={130} fill="none" stroke={dark ? "#3fe0d055" : "#ffffff33"} strokeWidth={4} strokeDasharray="14 14" />
        <Sun x={540} y={820} r={12} dark={dark} t={t} />
        <BlackHole x={540} y={820} r={34} t={t} show={dark} />
        <Earth x={540 + Math.cos(ang) * 360} y={820 + Math.sin(ang) * 130} r={34} lit={1 - dark} />
        <Host t={t} f={f} x={370} y={1320} s={0.85} expr={t > tq ? "think" : dark ? "shock" : "neutral"} hand={t > tq ? "chin" : "up"} look={[0, -0.6]} />
        <Label x={540} y={560} text="Как?" s={pop(t, tq)} color={AMBER} size={130} />
      </World>
      {flash ? <rect width={1080} height={1920} fill="#fff" opacity={0.85} /> : null}
    </g>);
  }
  // 4. Арбуз → вишня, весы ровно
  if (t < P[5]) {
    const tw = W(4, 3), k = ez(t, tw - 0.1, tw + 0.5);
    const r = lerp(150, 34, k), tilt = Math.sin(t * 3) * 3 * (1 - ez(t, tw + 0.6, tw + 1.5));
    return (<World t={t} cam={[[P[4], 1.1, 540, 1000], [P[5], 1.3, 540, 960]]}>
      <Stars t={t} />
      <g transform={`rotate(${tilt}, 540, 1100)`}>
        <rect x={200} y={1090} width={680} height={20} rx={10} fill="#c9c2b5" />
        <rect x={250} y={1110} width={160} height={14} rx={7} fill="#8a8476" /><rect x={670} y={1110} width={160} height={14} rx={7} fill="#8a8476" />
        <g transform={`translate(330, ${1090 - r})`}>
          <circle r={r} fill={k < 0.5 ? "#2e9e47" : "#c4153a"} />
          {k < 0.5 ? [-0.5, 0, 0.5].map((d) => <path key={d} d={`M ${d * r} ${-r * 0.95} Q ${d * r * 1.4} 0 ${d * r} ${r * 0.95}`} stroke="#1c6b2e" strokeWidth={10} fill="none" />)
            : <path d={`M 0 ${-r} q 10 -40 40 -50`} stroke="#3c7a2a" strokeWidth={6} fill="none" />}
        </g>
        <g transform="translate(750, 1040)"><rect x={-50} y={-50} width={100} height={50} rx={8} fill="#7a7466" /><Label x={0} y={-12} text="10 кг" s={1} size={30} /></g>
      </g>
      <rect x={530} y={1110} width={20} height={300} fill="#8a8476" />
      <Label x={540} y={720} text="вес тот же" s={pop(t, W(4, 8))} color={TEAL} size={80} />
    </World>);
  }
  // 5. Масса + расстояние = орбита; «засасывает» только вблизи
  if (t < P[6]) {
    const tz = W(5, 15), ang = t * 0.7;
    return (<World t={t} cam={[[P[5], 0.95, 540, 900], [tz - 0.3, 1.0, 540, 880], [P[6], 2.6, 540, 820]]}>
      <Stars t={t} />
      <ellipse cx={540} cy={820} rx={360} ry={130} fill="none" stroke="#3fe0d055" strokeWidth={4} strokeDasharray="14 14" />
      <BlackHole x={540} y={820} r={34} t={t} show={1} />
      <circle cx={540} cy={820} r={62 + Math.sin(t * 6) * 4} fill="none" stroke="#ff4d6d" strokeWidth={5} strokeDasharray="8 8" opacity={ez(t, tz - 0.4, tz)} />
      <Earth x={540 + Math.cos(ang) * 360} y={820 + Math.sin(ang) * 130} r={34} lit={0} />
      <Label x={540} y={560} text="масса" s={pop(t, W(5, 3))} color={AMBER} size={74} />
      <Label x={540} y={1120} text="расстояние" s={pop(t, W(5, 5))} color={TEAL} size={74} />
      <Host t={t} f={f} x={680} y={1370} s={0.77} expr="smug" hand="point" look={[-0.6, -0.4]} showMark={false} />
    </World>);
  }
  // 6. Земля → вишня. Момент факта: «?» → «!»
  if (t < P[7]) {
    const tc = W(6, 11), k = ez(t, tc - 0.3, tc + 0.4), mark = ez(t, tc, tc + 0.25);
    return (<World t={t} cam={[[P[6], 1.0, 540, 900], [tc, 1.25, 540, 860], [P[7], 1.4, 540, 880]]}>
      <Stars t={t} />
      {k < 0.98 ? <Earth x={540} y={760} r={lerp(220, 22, k)} /> : null}
      {k > 0.6 ? <g transform="translate(540,760)"><circle r={22} fill="#c4153a" /><path d="M 0 -22 q 8 -30 30 -38" stroke="#3c7a2a" strokeWidth={5} fill="none" /></g> : null}
      <Label x={540} y={880} text="≈ 9 мм" s={pop(t, tc + 0.2)} color={AMBER} size={90} />
      <Host t={t} f={f} x={340} y={1270} s={0.89} expr={mark > 0.5 ? "surprised" : "think"} hand={mark > 0.5 ? "up" : "chin"} look={[0.3, -0.7]} mark={mark} />
    </World>);
  }
  // 7. Финал: темно и холодно — «Возьми свитер»
  const tf = W(7, 11), cold = ez(t, P[7] + 1.5, P[7] + 3.5);
  return (<World t={t} cam={[[P[7], 1.4, 540, 900], [T.total, 1.0, 540, 980]]}>
    <Stars t={t} />
    <Earth x={540} y={640} r={120} lit={0} />
    <g transform="translate(860, 900)">
      <rect x={-22} y={-200} width={44} height={260} rx={22} fill="#e9e4da" />
      <rect x={-12} y={lerp(-140, 20, cold)} width={24} height={lerp(170, 30, cold)} rx={12} fill="#3d7bff" />
      <circle cx={0} cy={70} r={40} fill="#3d7bff" />
    </g>
    <Host t={t} f={f} x={280} y={1250} s={0.98} expr={t > tf ? "smug" : "sad"} hand={t > tf ? "point" : "down"} look={[0.5, 0]} showMark={false} />
  </World>);
};

// ---------------------------------------------------------------- субтитры (как в скилле)
const Caption: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig(); const t = f / fps;
  const g = T.caps.find((c) => t >= c.s && t < Math.max(c.e, c.s + 0.2));
  if (!g) return null;
  const s = spring({ frame: f - Math.round(g.s * fps), fps, config: { damping: 11, stiffness: 240, mass: 0.55 } });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 690 }}>
      <div style={{ fontFamily, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: "white", textAlign: "center", maxWidth: 920,
        transform: `scale(${interpolate(s, [0, 1], [0.72, 1])})`, WebkitTextStroke: "16px black", paintOrder: "stroke fill", textShadow: "0 6px 0 rgba(0,0,0,0.55)" }}>{g.text}</div>
    </AbsoluteFill>
  );
};

export const E01: React.FC = () => {
  const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig(); const t = f / 30;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}><Shot t={t} f={f} /></svg>
      <Caption f={f} />
      <Audio src={staticFile("e01_voice.wav")} />
      <Audio src={staticFile("music.wav")} volume={(fr) => interpolate(fr, [0, 20, durationInFrames - 45, durationInFrames], [0, 0.08, 0.08, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};
