"""Синтезированные звуки пилота (без сторонних библиотек звуков — права чистые).
Всё моно 48 кГц, float32, пик ≈ 1; громкость задаётся при сведении."""
import numpy as np
from scipy.signal import butter, sosfilt
SR=48000
_rng=np.random.default_rng(11)
def _env(n, a=0.002, d=0.08):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/d)
def _bp(x, lo, hi, order=2): return sosfilt(butter(order,[lo,hi],btype="band",fs=SR,output="sos"),x)
def _norm(x): return (x/(np.max(np.abs(x)) or 1)).astype(np.float32)
def tick(hard=1.0):
    """Тиканье настенных часов: короткий щелчок с деревянным резонансом."""
    n=int(0.06*SR); x=_rng.standard_normal(n)*_env(n,0.0005,0.004)
    t=np.arange(n)/SR; body=np.sin(2*np.pi*2300*t)*_env(n,0.0005,0.012)+0.5*np.sin(2*np.pi*1150*t)*_env(n,0.0005,0.02)
    return _norm(_bp(x,1500,7000)*0.6+body*hard)
def ratchet_back():
    """Стрелка дёргается и щёлкает назад: щелчок, короткое «тррк» и обратный щелчок — звучит неправильно."""
    parts=[tick(1.2)]
    for k in range(5): parts+= [np.zeros(int(0.012*SR)), tick(0.5)*(0.6-0.08*k)]
    parts+=[np.zeros(int(0.05*SR)), tick(1.4)[::-1]]
    return _norm(np.concatenate(parts))
def bell(dur=2.4, f0=392.0):
    """Один удар часов: негармонические обертоны с разным затуханием."""
    n=int(dur*SR); t=np.arange(n)/SR; x=np.zeros(n)
    for r,a,d in ((0.5,0.5,1.6),(1.0,1.0,1.1),(1.19,0.6,0.8),(1.56,0.45,0.6),(2.0,0.35,0.45),(2.74,0.25,0.3),(3.76,0.15,0.2)):
        x+=a*np.sin(2*np.pi*f0*r*t+_rng.random()*6)*np.exp(-t/d)
    x[:int(0.004*SR)]*=np.linspace(0,1,int(0.004*SR))
    return _norm(x)
def splash():
    """Опрокинутая чернильница: стук стекла о дерево + тихий плеск."""
    n=int(0.5*SR); knock=_bp(_rng.standard_normal(n),300,2500)*_env(n,0.001,0.03)
    t=np.arange(n)/SR; glass=np.sin(2*np.pi*3100*t)*_env(n,0.001,0.05)*0.4
    m=int(0.9*SR); slosh=_bp(_rng.standard_normal(m),400,2200)*np.sin(np.pi*np.arange(m)/m)**2*(0.5+0.5*np.sin(2*np.pi*7*np.arange(m)/SR))
    out=np.zeros(int(1.4*SR)); out[:n]+=knock+glass; out[int(0.12*SR):int(0.12*SR)+m]+=0.35*slosh
    return _norm(out)
def blink_wet():
    """Влажное «моргание» — очень тихий короткий щелчок-чмок."""
    n=int(0.08*SR); t=np.arange(n)/SR; f=900+2500*t/0.08
    return _norm(np.sin(2*np.pi*np.cumsum(f)/SR)*_env(n,0.003,0.02))
def pen_scratch(dur=1.2):
    """Скрип пера: полосовой шум с неровной амплитудой по штрихам."""
    n=int(dur*SR); x=_bp(_rng.standard_normal(n),2500,8000,3)
    strokes=np.clip(np.sin(2*np.pi*5.5*np.arange(n)/SR+_rng.random()*3),0,1)**0.6
    return _norm(x*strokes*(0.6+0.4*_rng.random(n)))
def paper(dur=0.6):
    """Шорох бумаги/страницы."""
    n=int(dur*SR); x=_bp(_rng.standard_normal(n),800,6000)
    e=np.sin(np.pi*np.arange(n)/n)**1.5*(0.5+0.5*_rng.random(n)); return _norm(x*e)
def room_tone(dur):
    """Тон ночного кабинета: тёплый низкий шум + едва слышный далёкий гул."""
    n=int(dur*SR); b=np.cumsum(_rng.standard_normal(n)); b-=np.convolve(b,np.ones(4800)/4800,"same")
    t=np.arange(n)/SR; hum=0.15*np.sin(2*np.pi*50*t)+0.07*np.sin(2*np.pi*100*t)
    return _norm(sosfilt(butter(2,600,btype="low",fs=SR,output="sos"),b)/np.std(b)+hum)
def lamp_buzz(dur, crackle=True):
    """Гул лампы 100 Гц с гармониками; crackle — редкие потрескивания."""
    n=int(dur*SR); t=np.arange(n)/SR
    x=sum(a*np.sin(2*np.pi*100*k*t) for k,a in ((1,1),(2,0.5),(3,0.3),(5,0.15)))*0.4
    if crackle:
        for s in _rng.uniform(0,dur,int(dur*0.8)):
            i=int(s*SR); m=min(int(0.03*SR),n-i); x[i:i+m]+=_rng.standard_normal(m)*_env(m,0.0005,0.006)*2
    return _norm(x)
