// НАБОР ФОРМАТА «ВЫЖИВАНИЕ»: шрифты, две палитры (день/ночь), HUD-плашки с выносками, служебные надписи (моно),
// красная лента-акцент, таймер, бумажная карточка-список, караоке-субтитры, живая камера, переходы, зерно.
// ПРАВИЛА REMOTION: движение только через useCurrentFrame + interpolate/spring; без CSS-анимаций и setTimeout;
// без backdrop-filter; координаты рамок/плашек — целые пиксели; случайность — только random("сид").
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as mont } from "@remotion/google-fonts/Montserrat";
import { loadFont as mono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as osw } from "@remotion/google-fonts/Oswald";
import { loadFont as cav } from "@remotion/google-fonts/Caveat";

export const F = {
  black: mont("normal", { weights: ["800", "900"], subsets: ["cyrillic", "latin"] }).fontFamily,   // субтитры, обложка
  mono: mono("normal", { weights: ["400", "700"], subsets: ["cyrillic", "latin"] }).fontFamily,    // «ДЕНЬ 1 — 18:04», таймеры
  cond: osw("normal", { weights: ["700"], subsets: ["cyrillic", "latin"] }).fontFamily,            // заголовки плашек
  hand: cav("normal", { weights: ["700"], subsets: ["cyrillic", "latin"] }).fontFamily,            // записи в блокноте
};
export const FPS = 30, W = 1080, H = 1920;
export const useT = () => useCurrentFrame() / FPS;
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);                       // единственная «плавность» формата
export const ez = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
export const px = (v: number) => Math.round(v);                            // целые пиксели для рамок и плашек

// ------------------------------------------------------------------ две палитры
export const DAY = { sky1: "#DFDEC6", sky2: "#ADC0C2", field: "#788856", grass: "#505D36", olive: "#3B3D24", barn: "#A8322A", paper: "#F6F2E7", ink: "#2A2A22" };
export const NIGHT = { bg1: "#0B0F1A", bg2: "#121A2B", line: "#3B8EEA", window: "#FFB84D", danger: "#E53935", ok: "#3DDC84", text: "#E8EEF8" };
export const TONE = { good: NIGHT.ok, res: "#F5C518", danger: NIGHT.danger, info: NIGHT.line };
export type Tone = keyof typeof TONE;

// ------------------------------------------------------------------ появление (spring, damping 14–20) и каскад
export const useIn = (at: number, delay = 0) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return spring({ frame: f - Math.round((at + delay) * fps), fps, config: { damping: 16, stiffness: 170 } });
};

// ------------------------------------------------------------------ HUD-плашка: иконка + ЗАГОЛОВОК + подпись, рамка в цвет смысла, выноска к объекту
export const Hud: React.FC<{ x: number; y: number; at: number; until?: number; title: string; sub?: string; tone?: Tone; icon?: React.ReactNode; to?: [number, number]; w?: number }> =
  ({ x, y, at, until = 1e9, title, sub, tone = "info", icon, to, w = 420 }) => {
    const t = useT(); const s = useIn(at);
    const out = 1 - ez(t, until, until + 0.25);
    if (s <= 0.001 || out <= 0) return null;
    const c = TONE[tone]; const X = px(x), Y = px(y);
    return (<>
      {to ? <svg width={W} height={H} style={{ position: "absolute", opacity: s * out }}>
        <line x1={X + w / 2} y1={Y + 60} x2={px(to[0])} y2={px(to[1])} stroke={c} strokeWidth={3} strokeDasharray="8 8" />
        <circle cx={px(to[0])} cy={px(to[1])} r={7} fill={c} /></svg> : null}
      <div style={{ position: "absolute", left: X, top: Y, width: w, display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderRadius: 14,
        background: "rgba(11,15,26,0.88)", border: `2px solid ${c}`, boxShadow: `0 0 18px ${c}55`, opacity: s * out, transform: `scale(${0.94 + 0.06 * s})` }}>
        {icon ? <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div> : null}
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: F.cond, fontWeight: 700, fontSize: 40, color: "#fff", letterSpacing: 1 }}>{title}</div>
          {sub ? <div style={{ fontFamily: F.mono, fontSize: 34, color: c, marginTop: 8 }}>{sub}</div> : null}
        </div>
      </div>
    </>);
  };

// ------------------------------------------------------------------ служебная надпись моноширинным: «ДЕНЬ 1 — 18:04», «ПЛАН: ВНИЗ → НА УЛИЦУ»
export const Mono: React.FC<{ x: number; y: number; at: number; text: string; color?: string; size?: number }> = ({ x, y, at, text, color = NIGHT.text, size = 40 }) => {
  const f = useCurrentFrame(); const s = useIn(at);
  if (s <= 0.001) return null;
  const n = Math.min(text.length, Math.floor((f / FPS - at) * 40));          // «печатается» по буквам
  return <div style={{ position: "absolute", left: px(x), top: px(y), fontFamily: F.mono, fontWeight: 700, fontSize: size, color, letterSpacing: 2 }}>
    {text.slice(0, Math.max(0, n))}<span style={{ opacity: (f % 16) < 8 ? 1 : 0 }}>▌</span></div>;
};

// ------------------------------------------------------------------ красная диагональная лента-акцент (1–2 раза за ролик)
export const Ribbon: React.FC<{ at: number; until: number; text: string; y?: number }> = ({ at, until, text, y = 700 }) => {
  const t = useT(); const k = ez(t, at, at + 0.3) * (1 - ez(t, until, until + 0.2));
  if (k <= 0) return null;
  return <div style={{ position: "absolute", left: -100, right: -100, top: px(y), height: 130, background: NIGHT.danger, transform: `rotate(-8deg) translateX(${(1 - k) * -1300}px)`,
    display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
    <span style={{ fontFamily: F.black, fontWeight: 900, fontSize: 72, color: "#fff", lineHeight: 1 }}>{text}</span></div>;
};

// ------------------------------------------------------------------ таймер в красной рамке («04:29 ОСТ.»); диапазоны чисел — всегда сразу целиком
export const Timer: React.FC<{ x: number; y: number; at: number; from: number; to: number; dur: number; label?: string }> = ({ x, y, at, from, to, dur, label = "ОСТ." }) => {
  const t = useT(); const s = useIn(at);
  if (s <= 0.001) return null;
  const v = Math.max(0, Math.round(interpolate(t, [at, at + dur], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  return <div style={{ position: "absolute", left: px(x), top: px(y), padding: "14px 24px", border: `3px solid ${NIGHT.danger}`, borderRadius: 10, background: "rgba(11,15,26,0.9)",
    fontFamily: F.mono, fontWeight: 700, fontSize: 56, color: NIGHT.danger, opacity: s, boxShadow: `0 0 22px ${NIGHT.danger}66`, lineHeight: 1 }}>
    {String(Math.floor(v / 60)).padStart(2, "0")}:{String(v % 60).padStart(2, "0")} <span style={{ fontSize: 36 }}>{label}</span></div>;
};

// ------------------------------------------------------------------ бумажная карточка-список (блокнот): строки появляются каскадом, полоски-шкалы
export const PaperList: React.FC<{ x: number; y: number; at: number; title: string; rows: { icon?: string; name: string; val: string; fill: number }[]; w?: number }> = ({ x, y, at, title, rows, w = 620 }) => {
  const s = useIn(at);
  if (s <= 0.001) return null;
  return <div style={{ position: "absolute", left: px(x), top: px(y), width: w, padding: "30px 34px", background: DAY.paper, borderRadius: 6, transform: `rotate(-2deg) scale(${0.94 + 0.06 * s})`, opacity: s,
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)", backgroundImage: "repeating-linear-gradient(transparent 0 58px, #c9d6e8 58px 60px)" }}>
    <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 56, color: DAY.ink, lineHeight: 1 }}>{title}</div>
    {rows.map((r, i) => <Row key={i} r={r} at={at} i={i} />)}
  </div>;
};
const Row: React.FC<{ r: { icon?: string; name: string; val: string; fill: number }; at: number; i: number }> = ({ r, at, i }) => {
  const s = useIn(at, 0.2 + i * 0.1);
  return <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, opacity: s }}>
    <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 44, color: DAY.ink, width: 250, lineHeight: 1 }}>{r.icon ?? ""} {r.name}</div>
    <div style={{ flex: 1, height: 18, background: "#d9d2c0", borderRadius: 9 }}><div style={{ width: `${r.fill * 100 * s}%`, height: 18, borderRadius: 9, background: r.fill < 0.3 ? NIGHT.danger : DAY.field }} /></div>
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: DAY.ink, width: 150, textAlign: "right" }}>{r.val}</div>
  </div>;
};

// ------------------------------------------------------------------ живая камера: наезд 2–5% за сцену + параллакс слоёв
export const Cam: React.FC<{ t0: number; t1: number; push?: number; children: React.ReactNode }> = ({ t0, t1, push = 0.04, children }) => {
  const t = useT(); const k = interpolate(t, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${1 + push * k})` }}>{children}</AbsoluteFill>;
};
export const Layer: React.FC<{ depth: number; t0: number; t1: number; dx?: number; children: React.ReactNode }> = ({ depth, t0, t1, dx = 40, children }) => {
  const t = useT(); const k = interpolate(t, [t0, t1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `translateX(${-dx * depth * k}px)` }}>{children}</AbsoluteFill>;
};

// ------------------------------------------------------------------ переходы (не повторять один и тот же два раза подряд; «свет гаснет» — не больше 3 раз)
export type Tr = "cut" | "zoom" | "wipe" | "lightsOut";
export const Transition: React.FC<{ at: number; kind: Tr }> = ({ at, kind }) => {
  const t = useT();
  if (kind === "cut") return null;
  if (kind === "lightsOut") { const k = 1 - Math.abs(interpolate(t, [at - 0.3, at, at + 0.3], [-1, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    return k > 0 ? <AbsoluteFill style={{ background: "#000", opacity: k * 0.95 }} /> : null; }
  if (kind === "wipe") { const k = interpolate(t, [at - 0.25, at + 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
    return k > 0 && k < 1 ? <AbsoluteFill style={{ background: NIGHT.bg1, clipPath: `polygon(${k * 140 - 40}% 0, ${k * 140}% 0, ${k * 140 - 20}% 100%, ${k * 140 - 60}% 100%)` }} /> : null; }
  return null;   // "zoom" — делается сменой крупности камеры в самих сценах
};

// ------------------------------------------------------------------ КАРАОКЕ-СУБТИТРЫ: белый капс, 2 строки по 2–4 слова, центр, ~62% высоты,
// несказанные слова — белые 50%, слово белеет в момент звучания; максимум одно цветное слово (жёлтое — важно, красное — опасность);
// появление 0,94→1 за ~140 мс; старая фраза уходит сразу; зона 56–74% высоты свободна от плашек.
type Wd = { text: string; start: number; end: number };
export const phrases = (groups: { words: Wd[] }[]) => {
  const all = groups.flatMap((g) => g.words); const out: Wd[][] = []; let cur: Wd[] = [];
  all.forEach((w, i) => { cur.push(w); const nx = all[i + 1];
    if (/[.,!?…:—]$/.test(w.text) || cur.length >= 7 || !nx || nx.start - w.start > 24) { out.push(cur); cur = []; } });
  return out;
};
export const Captions: React.FC<{ P: Wd[][]; color?: Record<string, "res" | "danger"> }> = ({ P, color = {} }) => {
  const f = useCurrentFrame();
  const i = P.findIndex((l, k) => f >= l[0].start - 1 && f < (P[k + 1]?.[0].start ?? l[l.length - 1].end + 18) - 1);
  if (i < 0) return null;
  const g = P[i]; const sc = interpolate(f - g[0].start, [0, 4], [0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]/gu, "");
  const half = Math.ceil(g.length / 2); let used = false;
  const word = (w: Wd, k: number) => {
    const on = f >= w.start; const cw = !used && color[norm(w.text)]; if (cw) used = true;
    const col = cw ? (cw === "danger" ? NIGHT.danger : "#F5C518") : "#fff";
    return <span key={k} style={{ display: "inline-block", margin: "0 10px", color: on ? col : "rgba(255,255,255,0.5)" }}>{w.text.toUpperCase()}</span>;
  };
  return <AbsoluteFill style={{ alignItems: "center" }}>
    <div style={{ position: "absolute", top: px(H * 0.6), width: 960, textAlign: "center", fontFamily: F.black, fontWeight: 900, fontSize: 70, lineHeight: 1.1,
      transform: `scale(${sc})`, textShadow: "0 3px 14px rgba(0,0,0,0.7)", WebkitTextStroke: "3px rgba(0,0,0,0.55)", paintOrder: "stroke fill" }}>
      <div>{g.slice(0, half).map(word)}</div><div>{g.slice(half).map((w, k) => word(w, k + half))}</div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ зерно 2–3% (с сидом) и дымка дальнего плана
export const Grain: React.FC<{ o?: number }> = ({ o = 0.03 }) => {
  const f = useCurrentFrame();
  return <svg width={W} height={H} style={{ position: "absolute", opacity: o * 3, mixBlendMode: "overlay" }}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(random("g" + Math.floor(f / 2)) * 1000)} /></filter>
    <rect width={W} height={H} filter="url(#grain)" /></svg>;
};
export const Haze: React.FC<{ color?: string; from?: number; to?: number }> = ({ color = "#ffffff", from = 0.35, to = 0.6 }) =>
  <AbsoluteFill style={{ background: `linear-gradient(${color}00 ${from * 100}%, ${color}33 ${((from + to) / 2) * 100}%, ${color}00 ${to * 100}%)` }} />;
