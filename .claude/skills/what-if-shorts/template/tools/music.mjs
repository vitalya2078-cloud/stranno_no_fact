// Процедурная фоновая музыка (без внешних файлов и лицензий — можно монетизировать). Звуковых эффектов нет.
//   node tools/music.mjs <durationSec> [playful|tense|calm]   → public/music.wav
import fs from "node:fs";
import path from "node:path";

const SR = 44100;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MOODS = {
  playful: { bpm: 118, root: 60, prog: [[0, "maj"], [-3, "min"], [-7, "maj"], [-5, "maj"]], pad: 0.18, pluck: 0.45, bass: 0.3, kick: 0.35, hat: 0.25, bright: 0.8 },
  tense: { bpm: 96, root: 50, prog: [[0, "min"], [-2, "maj"], [-4, "maj"], [-5, "maj"]], pad: 0.3, pluck: 0.3, bass: 0.4, kick: 0.4, hat: 0.2, bright: 0.45 },
  calm: { bpm: 84, root: 55, prog: [[0, "maj"], [-3, "min"], [-5, "maj"], [-7, "maj"]], pad: 0.3, pluck: 0.4, bass: 0.18, kick: 0, hat: 0, bright: 0.7 },
};
const chord = (root, type) => (type === "min" ? [0, 3, 7, 10] : [0, 4, 7, 11]).map((x) => root + x);

export const writeWav = (file, floatChannels) => {
  const len = floatChannels[0].length, ch = floatChannels.length;
  const buf = Buffer.alloc(44 + len * ch * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + len * ch * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * ch * 2, 28); buf.writeUInt16LE(ch * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(len * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, floatChannels[c][i])) * 32767), o); o += 2; }
  fs.writeFileSync(file, buf);
};

const music = (mood, dur) => {
  const m = MOODS[mood] ?? MOODS.playful;
  const n = Math.floor(dur * SR), L = new Float32Array(n), R = new Float32Array(n);
  const beat = 60 / m.bpm, bar = beat * 4;
  let seed = 12345;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  let lpL = 0, lpR = 0;
  const alpha = 0.02 + m.bright * 0.08;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const [off, type] = m.prog[Math.floor(t / bar) % m.prog.length];
    const notes = chord(m.root + off, type);
    let s = 0;
    if (m.pad) { let p = 0; for (const nn of notes) for (const det of [-0.4, 0, 0.4]) { const ph = (t * (midi(nn) + det)) % 1; p += (2 * ph - 1) * 0.08; } s += p * m.pad * (0.8 + 0.2 * Math.sin(t * 0.7)); }
    if (m.bass) { const f = midi(m.root + off - 12); const g = Math.pow(0.5, (t % beat) / 0.35); s += (Math.sin(2 * Math.PI * f * t) * 0.8 + Math.sin(4 * Math.PI * f * t) * 0.15) * m.bass * (0.6 + 0.4 * g); }
    if (m.pluck) { const st = beat / 2, k = Math.floor(t / st), tt = t - k * st; const f = midi(notes[[0, 2, 1, 3, 2, 0, 3, 1][k % 8]] + 12); s += (2 * Math.abs(2 * ((t * f) % 1) - 1) - 1) * Math.exp(-tt * (6 + m.bright * 6)) * m.pluck * 0.5; }
    if (m.kick) { const tt = t % beat; s += Math.sin(2 * Math.PI * (48 * Math.exp(-tt * 30) + 48) * tt) * Math.exp(-tt * 12) * m.kick * 0.9; }
    if (m.hat) { const st = beat / 2, tt = t % st; if (Math.floor(t / st) % 2 === 1) s += (rnd() * 2 - 1) * Math.exp(-tt * 60) * m.hat * 0.5; }
    lpL += alpha * (s - lpL); lpR += alpha * 1.05 * (s - lpR);
    const fade = Math.min(1, t / 1.5, (dur - t) / 2.5);
    L[i] = lpL * fade; R[i] = lpR * fade;
  }
  const d1 = Math.floor(0.231 * SR), d2 = Math.floor(0.347 * SR);
  for (let i = 0; i < n; i++) { if (i >= d1) L[i] += R[i - d1] * 0.28; if (i >= d2) R[i] += L[i - d2] * 0.28; }
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = 0.45 / (peak || 1); for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  return [L, R];
};

const [, , a, b] = process.argv;
fs.mkdirSync("public", { recursive: true });
writeWav("public/music.wav", music(b ?? "playful", Number(a ?? 65)));
console.log("music -> public/music.wav");
