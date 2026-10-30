"""«Живое» звучание синтезированной реплики: голос в маленькой комнате, а не в пустоте.
room(): короткая реверберация (синтетический импульс небольшого помещения, ~0,3 с) с малой долей + едва слышный фон комнаты."""
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
def _ir(sr, rt=0.3, seed=3):
    """Импульс комнаты: ранние отражения + экспоненциально затухающий шум, мягче на верхах."""
    rng=np.random.default_rng(seed); n=int(sr*rt*1.5); t=np.arange(n)/sr
    tail=rng.standard_normal(n)*np.exp(-6.9*t/rt)
    tail=sosfilt(butter(2,5000,btype="low",fs=sr,output="sos"),tail)
    ir=np.zeros(n); ir[0]=1.0
    for d,g in ((0.007,0.35),(0.013,0.25),(0.021,0.18),(0.029,0.12)): ir[int(d*sr)]+=g
    ir[int(0.01*sr):]+=0.25*tail[:n-int(0.01*sr)]
    return ir/np.max(np.abs(ir))
def room(a, sr, wet=0.12, rt=0.3, noise_db=-58.0, seed=3):
    """wet — доля отражений; noise_db — уровень фона комнаты относительно пика реплики."""
    a=a.astype(np.float64); peak=np.max(np.abs(a)) or 1.0
    rev=fftconvolve(a,_ir(sr,rt,seed))[:len(a)+int(rt*sr)]
    out=np.concatenate([a,np.zeros(len(rev)-len(a))])*(1-wet)+rev/np.max(np.abs(rev))*peak*wet
    rng=np.random.default_rng(seed+1); hum=sosfilt(butter(2,[80,1200],btype="band",fs=sr,output="sos"),rng.standard_normal(len(out)))
    out+=hum/np.max(np.abs(hum))*peak*10**(noise_db/20)
    return (out/np.max(np.abs(out))*peak).astype(np.float32)
