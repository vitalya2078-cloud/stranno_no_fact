"""Ролик-сравнение вариантов одной реплики: каждый вариант с крупной подписью на экране, между ними пауза.
Запуск: python3 -I line_variants.py <vosk_model_dir> <fonts_dir> <tools_dir> <variants.json> <out_dir> [фон.png]
variants.json: {"title": "...", "variants": [{"label": "А", "note": "...", "phrases": [["текст", темп], пауза, ...],
                 "speaker_id": 4, "pitch_st": 0, "expand": null, "post": null, "takes": 10}]}"""
import sys, json, subprocess, numpy as np, soundfile as sf, librosa
from PIL import Image, ImageDraw, ImageFont, ImageFilter
vosk_p, fontdir, tools, vfile, out = sys.argv[1:6]; bgfile = sys.argv[6] if len(sys.argv)>6 else None
sys.path.insert(0, tools)
from stresslib import Stress
from voicelib import VoskVoice, expand_range, door, pitch_report, SR
from loudness import normalize, measure
from vosk_tts import Model, Synth
CFG=json.load(open(vfile,encoding="utf-8"))
vm=Model(model_path=vosk_p); V=VoskVoice(Synth(vm),Stress(vm))
GAP=1.2; segs=[]; t=0.8
for v in CFG["variants"]:
    post=(lambda a,s=v.get("pitch_st",0): librosa.effects.pitch_shift(a,sr=SR,n_steps=s)) if v.get("pitch_st") else None
    ch=[]; texts=[]
    for it in v["phrases"]:
        if isinstance(it,(int,float)): ch.append(np.zeros(int(it*SR),np.float32)); continue
        a=V.best(it[0],v["speaker_id"],it[1],n=v.get("takes",10),post=post)
        if v.get("expand"): a=expand_range(a,v["expand"])
        ch.append(a); texts.append(it[0])
    a=np.concatenate(ch)
    if v.get("post")=="door": a=door(a)
    a=a/np.sqrt(np.mean(a[np.abs(a)>1e-4]**2))*10**(-20/20)
    print(v["label"], " ".join(texts), f"{len(a)/SR:.2f} c", pitch_report(a), "чистых", V.last_info["clean"])
    segs.append((t,a,v,"  ".join(texts))); t+=0.6+len(a)/SR+GAP     # 0,6 с подпись видна до начала звука
TOTAL=t
mix=np.zeros(int(TOTAL*SR)+SR,np.float32)
for st,a,_,_ in segs: i=int((st+0.6)*SR); mix[i:i+len(a)]+=a
mix=mix[:int(TOTAL*SR)]; mix=mix/np.max(np.abs(mix))*0.89
sf.write(f"{out}/variants.wav",mix,SR); loud=normalize(f"{out}/variants.wav",f"{out}/variants_norm.wav")
W,H,FPS=1080,1920,30
big=ImageFont.truetype(f"{fontdir}/PTSans-Bold.ttf",150); sub=ImageFont.truetype(f"{fontdir}/PTSans-Bold.ttf",64)
small=ImageFont.truetype(f"{fontdir}/PTMono.ttf",40)
if bgfile:
    bg=Image.open(bgfile).convert("RGB"); k=max(W/bg.width,H/bg.height)
    bg=bg.resize((int(bg.width*k)+1,int(bg.height*k)+1)).crop((0,0,W,H)).filter(ImageFilter.GaussianBlur(8))
    bg=Image.eval(bg,lambda x:int(x*0.45))
else: bg=Image.new("RGB",(W,H),(24,19,46))
def wrap(d,txt,f,w=920):
    o,c=[],""
    for word in txt.split():
        n=(c+" "+word).strip()
        if d.textlength(n,font=f)>w and c: o.append(c); c=word
        else: c=n
    return o+[c]
ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
  "-i",f"{out}/variants_norm.wav","-c:v","libx264","-preset","veryfast","-crf","22","-pix_fmt","yuv420p",
  "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",f"{out}/variants.mp4"],stdin=subprocess.PIPE)
for i in range(int(TOTAL*FPS)):
    tt=i/FPS; fr=bg.copy(); d=ImageDraw.Draw(fr)
    for j,ln in enumerate(wrap(d,CFG["title"],small)): d.text((W/2,200+j*52),ln,font=small,fill=(170,160,200),anchor="mm")
    cur=[s for s in segs if s[0]<=tt]
    if cur:
        st,a,v,txt=cur[-1]
        d.text((W/2,700),f"Вариант {v['label']}",font=big,fill=(255,190,70),anchor="mm")
        for j,ln in enumerate(wrap(d,v.get("note",""),small)): d.text((W/2,820+j*52),ln,font=small,fill=(120,200,200),anchor="mm")
        if st+0.55<=tt<=st+0.6+len(a)/SR+0.2:
            for j,ln in enumerate(wrap(d,txt,sub)): d.text((W/2,1250+j*84),ln,font=sub,fill=(245,238,220),anchor="mm",stroke_width=5,stroke_fill=(10,8,20))
    ff.stdin.write(fr.tobytes())
ff.stdin.close()
if ff.wait(): sys.exit("ffmpeg завершился с ошибкой")
print(f"длительность {TOTAL:.1f} c; громкость {loud['normalization_type']}, лимитер {loud['limiter_db']} дБ; mp4 {measure(out+'/variants.mp4')}")
