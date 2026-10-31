// Монтажный план: субтитры (слова СЦЕНАРИЯ ← время из whisper через выравнивание; ошибки распознавания
// в субтитры не попадают) + громкости. Звуковых эффектов нет — только голос и музыка.
//   node tools/plan.mjs   (читает script/voice.txt, audio/words.json, script/edit.json)
import fs from "node:fs";

const FPS = 30;
const P = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const raw = fs.readFileSync("script/voice.txt", "utf8");
const words = P("audio/words.json").filter((w) => w.t.replace(/[^\p{L}\p{N}]/gu, ""));
const cfg = fs.existsSync("script/edit.json") ? P("script/edit.json") : {};
const norm = (w) => w.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}]/gu, "");
// текст для субтитров: без тегов эмоций [..], без кавычек; числа можно писать цифрами в voice_display.txt
const disp = fs.existsSync("script/voice_display.txt") ? fs.readFileSync("script/voice_display.txt", "utf8") : raw;
const paras = disp.replace(/\[[^\]]+\]\s*/g, "").replace(/[«»"]/g, "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const mine = [];
paras.forEach((p, pi) => p.replace(/\s[—–-]\s/g, " ").split(/\s+/).filter(Boolean).forEach((w) => mine.push({ text: w, para: pi })));

const sim = (a, b) => {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  let k = 0; while (k < Math.min(a.length, b.length) && a[k] === b[k]) k++;
  return k >= 3 || (k >= 2 && Math.min(a.length, b.length) <= 3) ? 0.7 : 0;
};
const n = mine.length, m = words.length;
const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
const B = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
for (let i = 1; i <= n; i++) { D[i][0] = -0.4 * i; B[i][0] = 1; }
for (let j = 1; j <= m; j++) { D[0][j] = -0.4 * j; B[0][j] = 2; }
for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
  const s = sim(mine[i - 1].text, words[j - 1].t);
  const c = [D[i - 1][j - 1] + (s > 0 ? s : -0.6), D[i - 1][j] - 0.4, D[i][j - 1] - 0.4];
  const k = c.indexOf(Math.max(...c)); D[i][j] = c[k]; B[i][j] = k;
}
const at = new Array(n).fill(null);
for (let i = n, j = m; i > 0 || j > 0;) {
  const k = B[i][j];
  if (i > 0 && j > 0 && k === 0) { if (sim(mine[i - 1].text, words[j - 1].t) > 0) at[i - 1] = words[j - 1].s; i--; j--; }
  else if (i > 0 && (j === 0 || k === 1)) i--; else j--;
}
const endT = words.length ? words[words.length - 1].e ?? words[words.length - 1].s + 0.6 : 10;
for (let i = 0; i < n; i++) if (at[i] == null) {
  let a = i - 1; while (a >= 0 && at[a] == null) a--;
  let b = i + 1; while (b < n && at[b] == null) b++;
  const ta = a >= 0 ? at[a] : 0, tb = b < n ? at[b] : endT;
  at[i] = ta + ((tb - ta) * (i - a)) / (b - a);
}
const W = mine.map((w, i) => ({ text: w.text, start: Math.round(at[i] * FPS), end: Math.round((i + 1 < n ? at[i + 1] : at[i] + 0.6) * FPS) }));
const groups = [];
let cur = [];
W.forEach((w, k) => {
  cur.push(w);
  const len = cur.reduce((s, x) => s + x.text.length, 0);
  if (/[.,:!?…]$/.test(w.text) || cur.length >= 3 || len > 13 || k === W.length - 1 || mine[k + 1]?.para !== mine[k].para) {
    groups.push({ text: cur.map((x) => x.text).join(" "), start: cur[0].start, end: Math.min(cur[cur.length - 1].end, cur[0].start + 75), words: cur });
    cur = [];
  }
});
const total = Math.round((endT + (cfg.tail ?? 0.7)) * FPS);
const plan = {
  fps: FPS, total,
  video: cfg.video ?? "video.mp4", voice: cfg.voice ?? "voice.mp3", music: cfg.music === false ? null : "music.wav",
  mix: { voice: 1.0, music: cfg.music_volume ?? 0.11 },   // голос ВСЕГДА громче музыки
  caption: { size: 92, stroke: 16, bottom: 600, highlight: cfg.highlight ?? null },
  groups,
};
fs.writeFileSync("src/plan.json", JSON.stringify(plan, null, 1));
console.log(`план: ${(total / FPS).toFixed(1)} с, ${groups.length} групп субтитров`);
console.log(groups.slice(0, 6).map((g) => `${(g.start / FPS).toFixed(1)} «${g.text}»`).join(" | "));
