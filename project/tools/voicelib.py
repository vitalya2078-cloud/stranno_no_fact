import numpy as np, librosa, parselmouth
from parselmouth.praat import call
from scipy.signal import butter, sosfilt
SR=48000
def _f0(a, sr=SR):
    p=parselmouth.Sound(a.astype(np.float64), sr).to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=700)
    return p.selected_array["frequency"]
def pitch_report(a, sr=SR, jump=6.0, band=9.0, gap=10):
    """Скачки тона (в т.ч. через паузы < gap кадров), доля кадров вне ±band полутонов от медианы, надёжный размах."""
    f=_f0(a,sr); v=np.where(f>0)[0]
    if v.size<10: return dict(jumps=0,outside=0.0,range=0.0)
    med=np.median(f[v]); st=12*np.log2(f[v]/med)
    jumps=sum(1 for i in range(1,len(v)) if v[i]-v[i-1]<=gap and abs(st[i]-st[i-1])>jump)
    inside=st[np.abs(st)<=band]; outside=1-inside.size/st.size
    rng=float(np.percentile(inside,90)-np.percentile(inside,10)) if inside.size>=10 else 0.0
    return dict(jumps=jumps,outside=round(float(outside),3),range=round(rng,1))
def f0_range_st(a, sr=SR): return pitch_report(a,sr)["range"]
def pitch_jumps(a, sr=SR): return pitch_report(a,sr)["jumps"]
def expand_range(a, factor, sr=SR):
    snd=parselmouth.Sound(a.astype(np.float64), sr)
    man=call(snd,"To Manipulation",0.01,70,700)
    pt=call(man,"Extract pitch tier")
    pitch=snd.to_pitch(time_step=0.01,pitch_floor=70,pitch_ceiling=700)
    med=call(pitch,"Get quantile",0,0,0.5,"Hertz")
    call(pt,"Formula",f"{med}*exp({factor}*ln(self/{med}))")
    call([pt,man],"Replace pitch tier")
    out=call(man,"Get resynthesis (overlap-add)")
    return out.values[0].astype(np.float32)
def door(a, sr=SR):
    sos=butter(4,[180,2600],btype="band",fs=sr,output="sos"); y=sosfilt(sos,a)
    # короткое «комнатное» эхо
    d=int(0.035*sr); y2=y.copy(); y2[d:]+=0.25*y[:-d]
    return (y2/np.max(np.abs(y2))*np.max(np.abs(a))).astype(np.float32)
class VoskVoice:
    def __init__(self, synth, stress): self.s=synth; self.st=stress
    def take(self, text, spk, rate, noise=None, dnoise=None):
        a=self.s.synth_audio(self.st.vosk(text), speaker_id=spk, speech_rate=rate, noise_level=noise, duration_noise_level=dnoise).astype(np.float32)/32768.0
        a=librosa.resample(a,orig_sr=22050,target_sr=SR)
        return librosa.effects.trim(a,top_db=40)[0]
    def best(self, text, spk, rate, n=6, noise=0.9, dnoise=0.9, post=None):
        takes=[self.take(text,spk,rate,noise,dnoise) for _ in range(n)]
        if post: takes=[post(t) for t in takes]
        L=np.array([len(t) for t in takes]); med=np.median(L)
        ok=[t for t in takes if abs(len(t)-med)<=0.2*med] or takes
        rep=[(t,pitch_report(t)) for t in ok]
        clean=[t for t,r in rep if r["jumps"]==0 and r["outside"]<=0.02]
        pool=clean or [t for t,_ in sorted(rep,key=lambda x:(x[1]["jumps"],x[1]["outside"]))[:2]]
        self.last_info=dict(takes=len(takes),clean=len(clean))
        return sorted(pool,key=f0_range_st,reverse=True)[0]
