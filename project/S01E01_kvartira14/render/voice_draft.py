"""Синтез всех реплик пилота и черновой ролик «озвучка + субтитры + тайминг кадров».
Запуск: python3 -I voice_draft.py <vosk_model_dir> <fonts_dir> <tools_dir> <episode_dir>"""
import sys, json, subprocess, numpy as np, soundfile as sf, librosa
vosk_p, fontdir, tools, ep = sys.argv[1:5]
sys.path.insert(0, tools)
from stresslib import Stress
from voicelib import VoskVoice, expand_range, door, f0_range_st, SR
from vosk_tts import Model, Synth
from PIL import Image, ImageDraw, ImageFont
D=json.load(open(f"{ep}/03_audio/voice/voice_direction.json",encoding="utf-8"))
vm=Model(model_path=vosk_p); V=VoskVoice(Synth(vm),Stress(vm))
def role_of(lid): return lid.split("_")[0]
lines_out={}
for L in D["lines"]:
    cfg=D["voices"][role_of(L["id"])]
    post=(lambda a,s=cfg["pitch_st"]: librosa.effects.pitch_shift(a,sr=SR,n_steps=s)) if cfg["pitch_st"] else None
    chunks=[]; phr=[]; t=0.0
    for item in L["phrases"]:
        if isinstance(item,(int,float)):
            chunks.append(np.zeros(int(item*SR),np.float32)); t+=item; continue
        text,rate=item
        a=V.best(text,cfg["speaker_id"],rate,n=cfg["takes"],post=post); cl=V.last_info["clean"]
        if cfg["expand"]: a=expand_range(a,cfg["expand"])
        phr.append((t,t+len(a)/SR,text)); t+=len(a)/SR; chunks.append(a)
    a=np.concatenate(chunks)
    if cfg["post"]=="door": a=door(a)
    rms=np.sqrt(np.mean(a[np.abs(a)>1e-4]**2)); a=a/rms*10**(-20/20)*10**(L.get("gain_db",0)/20)
    sf.write(f"{ep}/03_audio/voice/S01E01_{L['id']}_v1.wav",a,SR)
    lines_out[L["id"]]=dict(audio=a,phr=phr,shot=L["shot"],no_subs=L.get("no_subs",False),clean=cl)
# раскладка по кадрам
t=0.0; track=[]; subs=[]; shot_times={}; gap=D["turn_gap"]
def put(a,at):
    track.append((at,a))
for sh in sorted(D["shots"],key=int):
    s=D["shots"][sh]; st=t; t+=s["pre"]
    ids=[k for k,v in lines_out.items() if v["shot"]==int(sh)]
    for i,lid in enumerate(ids):
        if i: t+=gap
        v=lines_out[lid]; put(v["audio"],t)
        for a0,a1,txt in v["phr"]:
            subs.append(dict(start=t+a0,end=t+a1,text=txt.replace("...","…"),typed=v["no_subs"]))
        t+=len(v["audio"])/SR
    t+=s["post"]; shot_times[sh]=(st,t)
total=t
mix=np.zeros(int(total*SR)+SR,np.float32)
for at,a in track: i=int(at*SR); mix[i:i+len(a)]+=a
mix=mix[:int(total*SR)]; mix=mix/np.max(np.abs(mix))*0.89
sf.write(f"{ep}/05_previews/voice_draft_v1.wav",mix,SR)
json.dump(dict(total=total,shots=shot_times,subs=subs),open(f"{ep}/05_previews/voice_draft_v1_timing.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
# видео
W,H,FPS=1080,1920,30
sub_f=ImageFont.truetype(f"{fontdir}/PTSans-Bold.ttf",66); lab_f=ImageFont.truetype(f"{fontdir}/PTMono.ttf",38)
mono=ImageFont.truetype(f"{fontdir}/PTMono.ttf",54); title_f=ImageFont.truetype(f"{fontdir}/PTMono.ttf",72)
def wrap(d,txt,f,w=900):
    out,cur=[], ""
    for word in txt.split():
        n=(cur+" "+word).strip()
        if d.textlength(n,font=f)>w and cur: out.append(cur); cur=word
        else: cur=n
    return out+[cur]
ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
  "-i",f"{ep}/05_previews/voice_draft_v1.wav","-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
  "-af","loudnorm=I=-14:TP=-1.5:LRA=11","-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",
  f"{ep}/05_previews/S01E01_voice_draft_v1.mp4"],stdin=subprocess.PIPE)
N=int(total*FPS)
for i in range(N):
    tt=i/FPS; img=Image.new("RGB",(W,H),(24,19,46)); d=ImageDraw.Draw(img)
    sh=next(k for k,(a,b) in shot_times.items() if a<=tt<b) if tt<total else "12"
    d.text((60,90),f"КАДР {sh}",font=lab_f,fill=(255,190,70)); 
    for j,ln in enumerate(wrap(d,D["shots"][sh]["desc"],lab_f,960)): d.text((60,145+j*48),ln,font=lab_f,fill=(120,200,200))
    d.text((60,H-110),f"{tt:5.1f} c / {total:.1f} c   черновая озвучка, без картинки и эффектов",font=lab_f,fill=(90,85,120))
    if sh=="12":
        d.text((W/2,H/2),"Дело № 001 закрыто",font=title_f,fill=(240,232,214),anchor="mm")
    # машинописный лист (кадр 7)
    typed=[s for s in subs if s["typed"] and s["start"]<=tt]
    if typed and sh=="7":
        d.rectangle([110,560,970,1060],fill=(236,228,206))
        y=620
        for s in typed:
            frac=min(1,(tt-s["start"])/max(0.01,s["end"]-s["start"]))
            shown=s["text"][:int(len(s["text"])*frac)]
            for ln in wrap(d,shown,mono,780): d.text((150,y),ln,font=mono,fill=(40,30,50)); y+=72
    cur=[s for s in subs if not s["typed"] and s["start"]-0.05<=tt<=s["end"]+0.15]
    if cur:
        lns=wrap(d,cur[-1]["text"],sub_f,900)[:2]; lh=84; bottom=1380; y0=bottom-lh*len(lns)
        for j,ln in enumerate(lns):
            d.text((W/2,y0+j*lh+lh/2),ln,font=sub_f,fill=(245,238,220),anchor="mm",stroke_width=5,stroke_fill=(10,8,20))
    ff.stdin.write(img.tobytes())
ff.stdin.close(); ff.wait()
plan={"1":4,"2":4,"3":5.5,"4":7,"5":10,"6":3,"7":6,"8":4.5,"9":3,"10":2.5,"11":4.5,"12":1.5}
print(f"{'кадр':>4} {'план':>6} {'факт':>6}  начало")
for k,(a,b) in shot_times.items(): print(f"{k:>4} {plan[k]:6.1f} {b-a:6.1f}  {a:6.1f}")
print(f"ИТОГО: план 55.5 c, факт {total:.1f} c")
from voicelib import pitch_report
for k,v in lines_out.items(): print(f"  {k:8} {len(v['audio'])/SR:5.2f} c  отчёт {pitch_report(v["audio"])}  чистых дублей {v.get('clean','?')}")
