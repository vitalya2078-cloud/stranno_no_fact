# Синтез звукового слоя для плоского E01 (без внешних сэмплов — всё процедурно, лицензий не нужно).
#   python3 tools/sfx_flat.py  → public/sfx.wav (48 кГц, стерео)
# Время — в секундах голоса, те же моменты, что в src/Flat.tsx.
import numpy as np, wave
from scipy.signal import butter, sosfilt

SR = 48000
TOTAL = 1406 / 30
rng = np.random.default_rng(7)
L = np.zeros(int(TOTAL * SR) + SR); R = np.zeros_like(L)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype="band", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, btype="low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, btype="high", fs=SR, output="sos"), x)
def tt(d): return np.arange(int(d * SR)) / SR
def norm(x, peak): m = np.max(np.abs(x)) or 1; return x / m * peak
def put(t, x, g=1.0, pan=0.0):
    i = int(t * SR); n = min(len(x), len(L) - i)
    if n <= 0: return
    L[i:i + n] += x[:n] * g * (1 - max(0, pan)); R[i:i + n] += x[:n] * g * (1 + min(0, pan))

# ---------------------------------------------------------------- события
def whoosh(d=0.45):
    t = tt(d); n = rng.standard_normal(len(t)); env = np.sin(np.pi * t / d) ** 2
    out = np.zeros_like(n); seg = 256
    for i in range(0, len(n), seg):                         # полоса едет вверх-вниз
        f = 400 + 2600 * np.sin(np.pi * i / len(n)); out[i:i + seg] = bp(n[i:i + seg + 512], f * 0.6, min(f * 1.6, 20000))[:len(out[i:i + seg])]
    return norm(out * env, 0.55)
def pop(f=900):
    t = tt(0.12); return norm(np.sin(2 * np.pi * (f + 600 * np.exp(-t * 40)) * t) * np.exp(-t * 35), 0.5)
def boom(d=1.6):
    t = tt(d); s = np.sin(2 * np.pi * (38 + 70 * np.exp(-t * 6)) * t) * np.exp(-t * 2.2)
    s += lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 5) * 0.8
    return norm(s, 0.9)
def riser(d=0.6, f0=150, f1=1800):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * 0.4 + bp(rng.standard_normal(len(t)), 300, 4000) * 0.3
    return norm(s * (t / d) ** 2, 0.6)
def click():
    t = tt(0.06); return norm(hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 120) + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90), 0.7)
def thud():
    t = tt(0.5); return norm(np.sin(2 * np.pi * (55 + 40 * np.exp(-t * 20)) * t) * np.exp(-t * 7), 0.8)
def tick(f=2400):
    t = tt(0.04); return norm(np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 200) * 0.4, 0.35)
def beep(f=1760, d=0.18):
    t = tt(d); return norm(np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * np.minimum(1, (d - t) * 60) * np.minimum(1, t * 200), 0.25)
def scribble(d=0.45):
    t = tt(d); n = bp(rng.standard_normal(len(t)), 1500, 6000); am = 0.5 + 0.5 * np.sin(2 * np.pi * 9 * t) ** 2
    return norm(n * am * np.sin(np.pi * t / d), 0.35)
def squish(d=0.9):
    t = tt(d); f = 500 * (0.25) ** (t / d) + 120; ph = 2 * np.pi * np.cumsum(f) / SR
    return norm((np.sin(ph) + 0.5 * np.sin(2 * ph)) * np.sin(np.pi * t / d) * (1 + 0.3 * np.sin(2 * np.pi * 22 * t)), 0.45)
def slap():
    t = tt(0.2); return norm(bp(rng.standard_normal(len(t)), 300, 3000) * np.exp(-t * 40), 0.6)
def crackle(d=1.8):
    s = np.zeros(int(d * SR))
    for _ in range(140):
        i = rng.integers(0, len(s) - 400); k = tt(400 / SR)
        s[i:i + 400] += hp(rng.standard_normal(400), 4000) * np.exp(-k * 300) * rng.uniform(0.2, 1)
    return norm(s * np.linspace(0.4, 1, len(s)), 0.4)
def hum(d=1.4, f=70):
    t = tt(d); return norm((np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t)) * np.sin(np.pi * t / d) * (0.7 + 0.3 * np.sin(2 * np.pi * 3 * t)), 0.45)
def swirl(d=2.0):
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros_like(n); seg = 512
    for i in range(0, len(n), seg):
        f = 200 + 2400 * (i / len(n)) ** 2; out[i:i + seg] = bp(n[i:i + seg + 512], f, f * 2.2)[:len(out[i:i + seg])]
    return norm(out * (0.5 + 0.5 * np.sin(2 * np.pi * 4 * t)) * np.minimum(1, t * 2), 0.5)
def chime():
    t = tt(1.2); return norm(sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(1318, 3), (1976, 4), (2637, 6)]), 0.3)

# ---------------------------------------------------------------- фоны (тихо, под голосом)
def bed(t0, t1, kind):
    d = t1 - t0; t = tt(d); fade = np.minimum(1, np.minimum(t / 0.3, (d - t) / 0.3))
    n = rng.standard_normal(len(t))
    if kind == "space":    # низкий гул + «дыхание»
        s = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.5 * t + np.sin(2 * np.pi * 0.2 * t))) * 0.5 + lp(n, 200) * 0.6
        s = norm(s, 0.10)
    elif kind == "day":    # мягкий ветер + птицы
        s = norm(lp(n, 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t)), 0.06)
        for k in range(int(d * 1.3)):
            st = rng.uniform(0, max(0.1, d - 0.4)); i = int(st * SR); c = tt(0.25)
            chirp = np.sin(2 * np.pi * (3000 + 1500 * np.sin(2 * np.pi * 12 * c)) * c) * np.exp(-c * 14) * 0.05
            s[i:i + len(c)] += chirp[:len(s) - i]
    elif kind == "night":  # холодный ветер с порывами
        s = norm(bp(n, 150, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.25 * t) ** 2), 0.11)
    else:                  # кухня: тихий холодильник
        s = norm(np.sin(2 * np.pi * 100 * t) * 0.3 + lp(n, 300) * 0.4, 0.04)
    put(t0, s * fade, 1.0)

for a, b, k in [(0, 5.1, "space"), (5.1, 11.8, "day"), (11.8, 15.7, "space"), (15.7, 16.6, "day"), (16.6, 18.3, "night"), (18.3, 23.1, "space"),
                (23.1, 28.0, "room"), (28.0, 34.0, "room"), (34.0, 35.9, "space"), (35.9, 40.2, "room"), (40.2, TOTAL, "night")]:
    bed(a, b, k)

for c in [5.1, 11.8, 15.7, 18.3, 21.1, 23.1, 28.0, 34.0, 35.9, 40.2, 45.0]:   # склейки
    put(c - 0.22, whoosh(), 0.8, pan=rng.uniform(-0.3, 0.3))
put(1.75, riser(0.6), 0.8); put(2.35, boom(), 1.0)                              # Солнце схлопывается
for p in [4.0, 7.5, 12.0, 15.7, 19.6, 34.2, 34.9, 43.2]: put(p, pop(), 0.8)     # плашки
for i in range(16): put(7.7 + i * 0.1, tick(2600), 0.6)                          # счётчик диаметра
for i in range(int((15.6 - 12.2) / 0.25)): put(12.2 + i * 0.25, tick(2000), 0.55) # таймер света
put(16.6, click(), 1.0); put(16.62, thud(), 0.9)                                 # «щёлк» — выключили свет
put(21.1, swirl(2.0), 0.8)                                                       # засасывание
put(23.6, squish(1.0), 0.9); put(25.8, scribble(), 0.9); put(25.85, beep(), 0.8)  # арбуз → вишня, маркер, весы
put(26.6, hum(1.4), 0.8)                                                         # «и тянуть — тоже»
for p in [29.2, 29.6]: put(p, scribble(0.3), 0.7)                                 # строки на планшете
for p in [30.6, 31.4]: put(p, tick(3200), 1.0); put(p + 0.02, pop(1400), 0.5)    # галочки
put(33.0, scribble(), 0.9)                                                       # обвели «ТА ЖЕ»
put(34.2, hum(1.2, 55), 0.9)                                                     # опасная зона
put(38.2, squish(1.5), 0.9); put(39.7, slap(), 0.9)                              # Земля → вишня, листок
put(43.0, crackle(1.8), 0.9)                                                     # мороз
put(45.0, whoosh(0.5), 0.7); put(45.5, chime(), 0.8)                             # свитер

st = np.stack([L, R], 1)[: int(TOTAL * SR)]
st = norm(st, 0.89)
with wave.open("public/sfx.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("public/sfx.wav", round(len(st) / SR, 2), "с")
