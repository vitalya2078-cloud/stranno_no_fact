"""Двухпроходная нормализация громкости ffmpeg loudnorm и контрольный замер.
Внутренняя норма проекта: около −14 LUFS, истинный пик ≤ −1 dBTP."""
import json, re, subprocess
I, TP, LRA = -14.0, -1.5, 11.0
def _stats(stderr):
    return json.loads(stderr[stderr.rindex("{"):stderr.rindex("}")+1])
def _measure_ln(src, pre, base):
    p=subprocess.run(["ffmpeg","-hide_banner","-nostats","-i",src,"-af",pre+base+":print_format=json","-f","null","-"],
                     capture_output=True,text=True,check=True)
    return _stats(p.stderr)
def normalize(src, dst, i=I, tp=TP, lra=LRA, sr=48000):
    """Проход 1 — замер, проход 2 — применение с measured_* (linear=true). Возвращает замер после обработки.
    Если линейное усиление до цели выводит пик выше tp, loudnorm сам переходит в динамический режим и недобирает
    громкость. Поэтому сначала поднимаем уровень и срезаем пики лимитером, затем делаем линейный проход."""
    base=f"loudnorm=I={i}:TP={tp}:LRA={lra}"
    m=_measure_ln(src,"",base); pre=""; gain=0.0; src_tp=float(m["input_tp"])
    # лимитер срезает часть громкости, поэтому усиление перед ним подбираем за несколько замеров
    for _ in range(8):
        miss=i-float(m["input_i"])
        if float(m["input_tp"])+miss<=tp: break
        gain+=miss
        # запас 1 дБ под межвыборочные пики; ресемплинг ×4, чтобы лимитер видел их
        pre=(f"aresample={sr*4},volume={gain:.2f}dB,"
             f"alimiter=limit={10**((tp-1)/20):.4f}:attack=5:release=50:level=disabled,aresample={sr},")
        m=_measure_ln(src,pre,base)
    af=(f"{pre}{base}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
        f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
    p=subprocess.run(["ffmpeg","-y","-hide_banner","-nostats","-i",src,"-af",af,"-ar",str(sr),"-c:a","pcm_s24le",dst],
                     capture_output=True,text=True,check=True)
    r=_stats(p.stderr)
    # насколько срезаны самые громкие пики: усиление минус фактический подъём пика
    r["limiter_db"]=round(gain-(tp-1-src_tp),1) if pre else 0.0
    return r
def measure(path):
    """Интегральная громкость (LUFS) и истинный пик (dBTP) по ebur128."""
    p=subprocess.run(["ffmpeg","-hide_banner","-nostats","-i",path,"-af","ebur128=peak=true","-f","null","-"],
                     capture_output=True,text=True,check=True)
    s=p.stderr[p.stderr.rindex("Summary:"):]
    return dict(I=float(re.search(r"I:\s+(-?[\d.]+) LUFS",s).group(1)),
                TP=float(re.search(r"Peak:\s+(-?[\d.]+) dBFS",s).group(1)))
