"""Черновой ролик «озвучка + субтитры + тайминг кадров» из готовых WAV. Синтеза здесь нет.
Запуск: python3 -I render_preview.py <fonts_dir> <tools_dir> <episode_dir> [--use ID=N ...] [--tag NAME]
Версия реплики — "take" из voice_direction.json; --use KLY_07=2 подменяет её только в этом черновике.
Результат: 05_previews/<EP>_voice_draft_<tag>.mp4, voice_draft_<tag>.wav, voice_draft_<tag>_timing.json."""
import sys, os, json, argparse, subprocess, tempfile, numpy as np, soundfile as sf
ap=argparse.ArgumentParser()
ap.add_argument("fonts"); ap.add_argument("tools"); ap.add_argument("ep")
ap.add_argument("--use",action="append",default=[],metavar="ID=N")
ap.add_argument("--tag",default="current")
A=ap.parse_args(); fontdir, ep = A.fonts, A.ep
sys.path.insert(0, A.tools)
from loudness import normalize, measure
from PIL import Image, ImageDraw, ImageFont
SR=48000
VD=f"{ep}/03_audio/voice"; PV=f"{ep}/05_previews"; EP=os.path.basename(os.path.normpath(ep)).split("_")[0]
D=json.load(open(f"{VD}/voice_direction.json",encoding="utf-8"))
use={k:int(v) for k,v in (u.split("=") for u in A.use)}
unknown=set(use)-{L["id"] for L in D["lines"]}
if unknown: sys.exit(f"нет таких реплик: {sorted(unknown)}")
lines_out={}
for L in D["lines"]:
    lid=L["id"]; n=use.get(lid,L.get("take",1)); base=f"{VD}/{EP}_{lid}_v{n}"
    a,sr=sf.read(base+".wav",dtype="float32"); assert sr==SR, (base,sr)
    meta=json.load(open(base+".json",encoding="utf-8"))
    lines_out[lid]=dict(audio=a,phr=meta["phrases"],shot=L["shot"],no_subs=L.get("no_subs",False),ver=n)
# раскладка по кадрам
t=0.0; track=[]; subs=[]; shot_times={}; gap=D["turn_gap"]
for sh in sorted(D["shots"],key=int):
    s=D["shots"][sh]; st=t; t+=s["pre"]
    ids=[k for k,v in lines_out.items() if v["shot"]==int(sh)]
    for i,lid in enumerate(ids):
        if i: t+=gap
        v=lines_out[lid]; track.append((t,v["audio"]))
        for a0,a1,txt in v["phr"]:
            subs.append(dict(start=t+a0,end=t+a1,text=txt.replace("...","…"),typed=v["no_subs"],line=lid,ver=v["ver"]))
        t+=len(v["audio"])/SR
    t+=s["post"]; shot_times[sh]=(st,t)
total=t
mix=np.zeros(int(total*SR)+SR,np.float32)
for at,a in track: i=int(at*SR); mix[i:i+len(a)]+=a
mix=mix[:int(total*SR)]; mix=mix/np.max(np.abs(mix))*0.89
wav=f"{PV}/voice_draft_{A.tag}.wav"; sf.write(wav,mix,SR)
json.dump(dict(total=total,takes={k:v["ver"] for k,v in lines_out.items()},shots=shot_times,subs=subs),
          open(f"{PV}/voice_draft_{A.tag}_timing.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
tmp=tempfile.mkdtemp(); norm=f"{tmp}/norm.wav"; loud=normalize(wav,norm)
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
mp4=f"{PV}/{EP}_voice_draft_{A.tag}.mp4"
ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
  "-i",norm,"-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
  "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",mp4],stdin=subprocess.PIPE)
N=int(total*FPS)
for i in range(N):
    tt=i/FPS; img=Image.new("RGB",(W,H),(24,19,46)); d=ImageDraw.Draw(img)
    sh=next(k for k,(a,b) in shot_times.items() if a<=tt<b) if tt<total else "12"
    d.text((60,90),f"КАДР {sh}",font=lab_f,fill=(255,190,70))
    desc=wrap(d,D["shots"][sh]["desc"],lab_f,960)
    for j,ln in enumerate(desc): d.text((60,145+j*48),ln,font=lab_f,fill=(120,200,200))
    speaking=[s for s in subs if s["start"]-0.05<=tt<=s["end"]+0.15]
    if speaking:
        s=speaking[-1]; d.text((60,145+len(desc)*48+12),f"{s['line']} · v{s['ver']}",font=lab_f,fill=(90,85,120))
    d.text((60,H-110),f"{tt:4.1f} / {total:.1f} c · черновик {A.tag}",font=lab_f,fill=(90,85,120))
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
ff.stdin.close()
if ff.wait(): sys.exit("ffmpeg завершился с ошибкой")
plan={"1":4,"2":4,"3":5.5,"4":7,"5":10,"6":3,"7":6,"8":4.5,"9":3,"10":2.5,"11":4.5,"12":1.5}
print(f"{'кадр':>4} {'план':>6} {'факт':>6}  начало")
for k,(a,b) in shot_times.items(): print(f"{k:>4} {plan[k]:6.1f} {b-a:6.1f}  {a:6.1f}")
print(f"ИТОГО: план {sum(plan.values()):.1f} c, факт {total:.1f} c")
print("версии не по voice_direction:", {k:v for k,v in use.items()} or "нет")
print(f"громкость: режим {loud["normalization_type"]}, лимитер срезал пики до {loud["limiter_db"]} дБ; mp4 {measure(mp4)}")
