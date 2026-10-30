"""Формы рта по звуку реплики — без внешних программ.
Форманты (Praat) говорят, насколько открыт рот (F1) и округлены ли губы (F2), громкость — говорит ли персонаж вообще.
Формы (как в классической мультипликации):
  X — рот закрыт (пауза), B — чуть приоткрыт (согласные), C — средне открыт, растянут (э, и, е),
  D — широко открыт (а), E — округлён (о), F — трубочкой (у)."""
import numpy as np, parselmouth
def visemes(a, sr, fps=30, scale=1.0, floor_db=-32.0):
    """a — моно-сигнал реплики; scale — множитель частот формант (у голоса со сдвигом тона вверх форманты выше:
    +3 тона ≈ 1,19). Возвращает список (форма, открытость 0..1) на каждый кадр видео."""
    snd=parselmouth.Sound(a.astype(np.float64),sr)
    pitch=snd.to_pitch(time_step=0.01,pitch_floor=70,pitch_ceiling=900)
    form=snd.to_formant_burg(time_step=0.01,max_number_of_formants=5,maximum_formant=5500*scale)
    n=int(len(a)/sr*fps)+1; hop=sr//fps
    rms=np.array([np.sqrt(np.mean(a[max(0,i*hop-hop//2):i*hop+hop//2+1]**2)+1e-12) for i in range(n)])
    db=20*np.log10(rms/rms.max())
    out=[]
    for i in range(n):
        t=i/fps
        if db[i]<floor_db: out.append(["X",0.0]); continue
        voiced=pitch.get_value_at_time(t)==pitch.get_value_at_time(t)  # не NaN
        f1=form.get_value_at_time(1,t); f2=form.get_value_at_time(2,t)
        loud=float(np.clip((db[i]-floor_db)/(-floor_db-6),0,1))
        if not voiced or f1!=f1 or f2!=f2: out.append(["B",0.3*loud]); continue
        f1/=scale; f2/=scale
        op=float(np.clip((f1-300)/(750-300),0,1))*0.7+loud*0.3
        if f2<1250: shape="F" if f1<450 else "E"
        elif op>0.62: shape="D"
        elif op>0.3: shape="C"
        else: shape="B"
        out.append([shape,op])
    # сглаживание: одиночный кадр формы заменяется соседней, чтобы рот не «дребезжал»
    for i in range(1,n-1):
        if out[i][0]!=out[i-1][0] and out[i][0]!=out[i+1][0]: out[i][0]=out[i-1][0]
    return out
