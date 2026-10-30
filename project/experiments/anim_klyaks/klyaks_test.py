"""Тест перекладочной анимации: Клякс-заглушка (рисунок кодом) говорит реплику с формами рта по звуку.
Запуск: python3 -I klyaks_test.py <vosk_model_dir> <fonts_dir> <tools_dir> <out_dir>
Это не финальный дизайн: настоящий Клякс будет слоями из утверждённого листа персонажа."""
import sys, json, math, subprocess, numpy as np, soundfile as sf, librosa
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
vosk_p, fontdir, tools, out = sys.argv[1:5]
sys.path.insert(0, tools)
from stresslib import Stress
from voicelib import VoskVoice, expand_range, pitch_report, SR
from lipsync import visemes
from loudness import normalize, measure
from vosk_tts import Model, Synth
W,H,FPS=1080,1920,30
# ---------- голос: настройки Клякса из CHARACTERS.md (female_2, +3 тона, интонация ×1,5) ----------
vm=Model(model_path=vosk_p); V=VoskVoice(Synth(vm),Stress(vm))
post=lambda a: librosa.effects.pitch_shift(a,sr=SR,n_steps=3)
PHR=[("Раз триста.",1.05),("Сейчас спросишь, где кофе.",1.1)]
aud=[]
for text,rate in PHR:
    a=V.best(text,2,rate,n=12,post=post); a=expand_range(a,1.5)   # 12 дублей: в тесте важнее найти чистый
    aud.append(a/np.sqrt(np.mean(a[np.abs(a)>1e-4]**2))*10**(-20/20))
    print(text, f"{len(aud[-1])/SR:.2f} c", pitch_report(aud[-1]), "чистых дублей", V.last_info["clean"])
# ---------- таймлайн ----------
T1=0.7; E1=T1+len(aud[0])/SR
M0=E1+0.15; M1=M0+0.55                    # превращение лужица -> капля
T2=M1+0.2; E2=T2+len(aud[1])/SR; TOTAL=E2+1.2
mix=np.zeros(int(TOTAL*SR)+SR,np.float32)
for at,a in ((T1,aud[0]),(T2,aud[1])): i=int(at*SR); mix[i:i+len(a)]+=a
mix=mix[:int(TOTAL*SR)]; mix=mix/np.max(np.abs(mix))*0.89
sf.write(f"{out}/klyaks_test.wav",mix,SR); loud=normalize(f"{out}/klyaks_test.wav",f"{out}/klyaks_test_norm.wav")
vis=[(T1,visemes(aud[0],SR,FPS,scale=2**(3/12))),(T2,visemes(aud[1],SR,FPS,scale=2**(3/12)))]
json.dump({"phrases":[[T1,E1,PHR[0][0]],[T2,E2,PHR[1][0]]],"visemes":[[t,v] for t,v in vis]},
          open(f"{out}/klyaks_test_timing.json","w",encoding="utf-8"),ensure_ascii=False)
def viseme_at(t):
    for t0,v in vis:
        i=int(round((t-t0)*FPS))
        if 0<=i<len(v): return v[i]
    return ["X",0.0]
# ---------- фон-заглушка: стена, стол, лист бумаги, кружка, свет лампы ----------
def background():
    img=Image.new("RGB",(W,H)); px=np.zeros((H,W,3),np.float32)
    y=np.arange(H)[:,None]; x=np.arange(W)[None,:]
    wall=np.stack([22+0*y+0*x,17+0*y+0*x,40+0*y+0*x],-1).astype(np.float32)
    desk=np.stack([45+0*y+0*x,30+0*y+0*x,32+0*y+0*x],-1).astype(np.float32)
    px[:]=np.where((y<980)[...,None],wall,desk)
    glow=np.exp(-(((x-540)/430.0)**2+((y-1180)/300.0)**2))[...,None]
    px+=glow*np.array([150,95,35],np.float32)
    img=Image.fromarray(np.clip(px,0,255).astype(np.uint8)); d=ImageDraw.Draw(img)
    d.line([(0,980),(W,980)],fill=(70,48,45),width=6)
    d.polygon([(230,1060),(830,1040),(920,1330),(150,1350)],fill=(214,200,170))       # бланк
    for k in range(5):                                                                 # пустые строки бланка
        yy=1110+k*45; d.line([(250-k*15,yy),(830+k*15,yy-5)],fill=(185,170,145),width=3)
    d.ellipse([845,1010,995,1050],fill=(40,30,40)); d.rectangle([845,880,995,1030],fill=(232,226,214))  # кружка
    d.ellipse([845,860,995,900],fill=(250,246,236)); d.ellipse([862,868,978,894],fill=(60,45,40))
    d.arc([975,910,1045,990],-80,80,fill=(232,226,214),width=14)
    return img
BG=background()
# ---------- Клякс ----------
BODY=(20,15,32); RIM=(165,105,255); MOUTH_IN=(62,16,46); MOUTH_LN=(170,125,230)
N=200; TH=np.linspace(0,2*np.pi,N,endpoint=False)        # угол от вертикали вверх, по часовой
def ease(u): u=min(max(u,0),1); return u*u*(3-2*u)
def shape_points(m, t, sx, sy):
    """m: 0 — лужица, 1 — капля. Локальные единицы: дно в y=0, радиус капли 1."""
    rd=1+0.95*np.maximum(0,np.cos(TH))**8      # высокая степень — острый кончик капли
    dx,dy=rd*np.sin(TH),-1-rd*np.cos(TH)
    ax,by=2.4,0.26
    rp=1/np.sqrt((np.sin(TH)/ax)**2+(np.cos(TH)/by)**2)*(1+0.07*np.sin(3*TH+1)+0.05*np.sin(5*TH+2))
    px_,py_=rp*np.sin(TH),-0.2-rp*np.cos(TH)
    x=px_+(dx-px_)*m; y=py_+(dy-py_)*m
    wob=1+0.02*np.sin(2*TH+2.1*t)+0.015*np.sin(3*TH-2.9*t)
    cy=-1*m-0.2*(1-m); x=x*wob; y=cy+(y-cy)*wob
    return x*sx, np.minimum(y*sy,0)
def lerp(a,b,m): return a+(b-a)*m
def draw_klyaks(t, m, sx, sy, blink, lid, gaze, vis, mstate):
    S=2; R=150*S; P=1400; ox,oy=P//2,int(P*0.86)          # холст 2x с запасом на вытягивание, дно капли в (ox,oy)
    lay=Image.new("RGBA",(P,P),(0,0,0,0))
    x,y=shape_points(m,t,sx,sy); pts=list(zip(ox+x*R,oy+y*R))
    mask=Image.new("L",(P,P),0); ImageDraw.Draw(mask).polygon(pts,fill=255)
    glow=mask.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(18))
    lay.paste(Image.new("RGBA",(P,P),RIM+(255,)),(0,0),glow.point(lambda v:int(v*0.55)))
    d=ImageDraw.Draw(lay); d.polygon(pts,fill=BODY+(255,))
    d.line(pts+[pts[0]],fill=RIM+(255,),width=5,joint="curve")
    hx,hy=lerp(-0.5,-0.42,m),lerp(-0.32,-1.55,m)                          # блик
    d.ellipse([ox+(hx-0.13)*R*sx,oy+(hy-0.07)*R*sy,ox+(hx+0.13)*R*sx,oy+(hy+0.07)*R*sy],fill=(120,100,170,120))
    # глаза
    ey=lerp(-0.36,-1.2,m); ex=lerp(0.48,0.4,m); er=0.27*R; ery=0.32*R*max(blink,0.08)
    for side in (-1,1):
        cx,cy=ox+side*ex*R*sx,oy+ey*R*sy
        g=Image.new("L",(P,P),0); ImageDraw.Draw(g).ellipse([cx-er*1.5,cy-ery*1.5,cx+er*1.5,cy+ery*1.5],fill=150)
        lay.alpha_composite(Image.composite(Image.new("RGBA",(P,P),(255,170,40,255)),Image.new("RGBA",(P,P),(0,0,0,0)),g.filter(ImageFilter.GaussianBlur(22))))
        d=ImageDraw.Draw(lay)
        d.ellipse([cx-er,cy-ery,cx+er,cy+ery],fill=(255,186,55,255))
        d.ellipse([cx-er*0.6,cy-ery*0.6,cx+er*0.6,cy+ery*0.6],fill=(255,222,120,255))
        if blink>0.3:
            gx,gy=cx+gaze[0]*er*0.45,cy+gaze[1]*ery*0.35; pr=er*0.33; pry=ery*0.42
            d.ellipse([gx-pr,gy-pry,gx+pr,gy+pry],fill=(28,16,36,255))
            d.ellipse([gx-pr*0.75,gy-pry*0.75,gx-pr*0.3,gy-pry*0.3],fill=(255,250,235,255))
        # веко: прикрывает верх глаза, у правого чуть ниже — ехидство
        L=lid*(1.15 if side==1 else 0.85)
        if L>0 and blink>0.3:
            cut=cy-ery+2*ery*L; tilt=side*ery*0.25*L
            lm=Image.new("L",(P,P),0); ImageDraw.Draw(lm).polygon([(cx-er-8,cy-ery-8),(cx+er+8,cy-ery-8),(cx+er+8,cut+tilt),(cx-er-8,cut-tilt)],fill=255)
            em=Image.new("L",(P,P),0); ImageDraw.Draw(em).ellipse([cx-er-3,cy-ery-3,cx+er+3,cy+ery+3],fill=255)
            lay.paste(Image.new("RGBA",(P,P),BODY+(255,)),(0,0),ImageChops.multiply(lm,em))   # веко только внутри глаза
            hw=er*math.sqrt(max(0.0,1-((cut-cy)/ery)**2)); d=ImageDraw.Draw(lay)
            d.line([(cx-hw,cut-tilt*hw/er),(cx+hw,cut+tilt*hw/er)],fill=RIM+(255,),width=5)
    # рот: размеры плавно догоняют целевую форму
    shp,op=vis
    tgt={"X":(0.40,0.0),"B":(0.22,0.06),"C":(0.32,0.10+0.06*op),"D":(0.30,0.16+0.12*op),"E":(0.22,0.18),"F":(0.13,0.13)}[shp]
    mstate[0]+= (tgt[0]-mstate[0])*0.6; mstate[1]+=(tgt[1]-mstate[1])*0.6
    mw,mh=mstate[0]*R*sx*1.35,mstate[1]*R*sy*1.35; mx,my=ox+0.04*R,oy+lerp(-0.13,-0.62,m)*R*sy
    if mh<0.03*R:      # закрытый рот — кривая ухмылка, правый угол выше
        a=[(mx-mw/2+mw*k/12, my+math.sin(math.pi*k/12)*0.05*R-(k/12)*0.06*R) for k in range(13)]
        d.line(a,fill=MOUTH_LN+(255,),width=7,joint="curve")
    else:
        d.ellipse([mx-mw/2,my-mh/2,mx+mw/2,my+mh/2],fill=MOUTH_IN+(255,),outline=MOUTH_LN+(255,),width=5)
        if mh>0.12*R: d.ellipse([mx-mw*0.25,my+mh*0.05,mx+mw*0.25,my+mh/2-3],fill=(170,60,95,255))
    lay=lay.resize((P//S,P//S),Image.LANCZOS)
    return lay,(ox//S,oy//S)
# ---------- кадры ----------
sub_f=ImageFont.truetype(f"{fontdir}/PTSans-Bold.ttf",66); lab_f=ImageFont.truetype(f"{fontdir}/PTMono.ttf",34)
ANCHOR=(530,1215)
blinks=[0.25,M1+0.05,E2+0.55]
ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
  "-i",f"{out}/klyaks_test_norm.wav","-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p",
  "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",f"{out}/klyaks_anim_test.mp4"],stdin=subprocess.PIPE)
mstate=[0.4,0.0]
for i in range(int(TOTAL*FPS)):
    t=i/FPS
    u=(t-M0)/(M1-M0); m=ease(u)
    # дыхание + растяжение при превращении + затухающее покачивание после
    breath=0.018*math.sin(2*math.pi*0.55*t)
    stretch=0.22*math.sin(math.pi*min(max(u,0),1)) if 0<u<1 else 0
    settle=0.08*math.exp(-6*(t-M1))*math.sin(18*(t-M1)) if t>M1 else 0
    v=viseme_at(t); talk=0.03*v[1]
    sy=1+breath+stretch+settle+talk; sx=1/(sy**0.7)
    blink=1.0 if t>0.45 else ease((t-0.15)/0.3)                 # глаза открываются в лужице
    for b in blinks[1:]:
        if b<=t<b+0.18: blink=min(blink,abs(t-b-0.09)/0.09)
    lid=0.35 if t>T1-0.2 else 0.0
    gaze=(0.0,0.1)
    if t>E2-0.7: gaze=(min(1,(t-E2+0.7)/0.15)*0.9,0.05)          # на «кофе» косится на кружку
    k,(ax,ay)=draw_klyaks(t,m,sx,sy,blink,lid,gaze,v,mstate)
    frame=BG.copy(); d=ImageDraw.Draw(frame)
    shw=int(lerp(260,120,m)); d.ellipse([ANCHOR[0]-shw,ANCHOR[1]-14,ANCHOR[0]+shw,ANCHOR[1]+14],fill=(150,135,110))
    frame.paste(k,(ANCHOR[0]-ax,ANCHOR[1]-ay),k)
    # лёгкий наезд камеры
    z=1+0.05*t/TOTAL; cw,ch=int(W/z),int(H/z); frame=frame.crop(((W-cw)//2,int((H-ch)*0.55),(W-cw)//2+cw,int((H-ch)*0.55)+ch)).resize((W,H),Image.BICUBIC)
    d=ImageDraw.Draw(frame)
    for s0,s1,txt in ((T1,E1,PHR[0][0]),(T2,E2,PHR[1][0])):
        if s0-0.05<=t<=s1+0.15:
            d.text((W/2,1338),txt,font=sub_f,fill=(245,238,220),anchor="mm",stroke_width=5,stroke_fill=(10,8,20))
    d.text((60,H-120),"ТЕСТ АНИМАЦИИ · Клякс-заглушка, нарисован кодом",font=lab_f,fill=(110,100,140))
    d.text((60,H-75),f"рот: {v[0]}   {t:4.1f} c",font=lab_f,fill=(110,100,140))
    ff.stdin.write(frame.tobytes())
ff.stdin.close()
if ff.wait(): sys.exit("ffmpeg завершился с ошибкой")
print(f"длительность {TOTAL:.2f} c; громкость {loud['normalization_type']}, лимитер {loud['limiter_db']} дБ; mp4 {measure(out+'/klyaks_anim_test.mp4')}")
from collections import Counter
print("формы рта:", [dict(Counter(s for s,_ in v)) for _,v in vis])
