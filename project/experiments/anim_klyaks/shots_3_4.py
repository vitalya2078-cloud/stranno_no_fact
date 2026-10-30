"""Кадры 3–4 пилота: чернила растекаются по бланку → Клякс-лужица открывает глаза → «Опять ты.» / (Марк з/к) «Мы знакомы?»
→ крупно: «Раз триста — сейчас спросишь, где кофе.»
Запуск: python3 -I shots_3_4.py <fonts_dir> <tools_dir> <assets_S01E01_dir> <lines_dir> <asr_model_dir> <out_dir>
lines_dir: kly01.wav, mark04.wav, kly02.wav (готовые реплики). Глаза-веки и рот Клякса рисуются кодом поверх CH-02."""
import sys, math, subprocess, numpy as np, cv2, soundfile as sf, librosa
from PIL import Image, ImageDraw, ImageFont
fontdir, tools, adir, ldir, asr, out = sys.argv[1:7]
sys.path.insert(0, tools)
from voicelib import pitch_report, SR
from lipsync import visemes
from loudness import normalize, measure
from emphasis import words, emphasize
W,H,FPS=1080,1920,30
# ---------- реплики и логическое ударение ----------
LINES=[("kly01","Опять ты.",["опять"],[]),("mark04","Мы знакомы?",[],[]),
       ("kly02","Раз триста — сейчас спросишь, где кофе.",["триста","кофе"],["раз","сейчас","спросишь","где"])]
aud={}
for n,txt,em,fl in LINES:
    a,sr=sf.read(f"{ldir}/{n}.wav",dtype="float32"); a=a if a.ndim==1 else a.mean(1)
    if em or fl: a=emphasize(a,sr,words(a,sr,txt,asr),emph=em,flatten=fl,st=2.5,stretch=1.1,keep=0.6)
    a=librosa.effects.trim(librosa.resample(a,orig_sr=sr,target_sr=SR),top_db=40)[0]
    aud[n]=a/np.sqrt(np.mean(a[np.abs(a)>1e-4]**2))*10**(-20/20); print(n,f"{len(aud[n])/SR:.2f} c",pitch_report(aud[n]))
# таймлайн (с): кадр 3 — разлив и пробуждение, затем реплики; кадр 4 — крупный план
SPILL=(0.45,1.5); MORPH=(1.45,1.85); OPEN=(2.05,2.3)
T={"kly01":2.6}; T["mark04"]=T["kly01"]+len(aud["kly01"])/SR+0.35
CUT=T["mark04"]+len(aud["mark04"])/SR+0.45
T["kly02"]=CUT+0.3; TOTAL=T["kly02"]+len(aud["kly02"])/SR+0.8
mix=np.zeros(int(TOTAL*SR)+SR,np.float32)
for n,t0 in T.items(): i=int(t0*SR); mix[i:i+len(aud[n])]+=aud[n]
mix=mix[:int(TOTAL*SR)]; mix=mix/np.max(np.abs(mix))*0.89; sf.write(f"{out}/shots34.wav",mix,SR)
loud=normalize(f"{out}/shots34.wav",f"{out}/shots34_norm.wav")
VIS={n:visemes(aud[n],SR,FPS,scale=1.17 if n.startswith("kly") else 1.0) for n in ("kly01","kly02")}
def kly_talk(tt):
    for n in ("kly01","kly02"):
        i=int(round((tt-T[n])*FPS))
        if 0<=i<len(VIS[n]): return VIS[n][i]
    return ["X",0.0]
# ---------- картинки ----------
bg=cv2.imread(f"{adir}/BG-02/bg02_desk_top.png")                       # 864×1536
pud=cv2.imread(f"{adir}/CH-02/ch02_puddle.png"); ph,pw=pud.shape[:2]
def cutout(img,bgc=214):
    h,w=img.shape[:2]; m=np.zeros((h+2,w+2),np.uint8)
    for p in [(x,0) for x in range(0,w,20)]+[(x,h-1) for x in range(0,w,20)]+[(0,y) for y in range(0,h,20)]+[(w-1,y) for y in range(0,h,20)]:
        if m[p[1]+1,p[0]+1]==0 and abs(int(img[p[1],p[0]].mean())-bgc)<14:
            cv2.floodFill(img.copy(),m,p,0,(8,8,8),(8,8,8),cv2.FLOODFILL_MASK_ONLY|(255<<8)|8)
    return cv2.GaussianBlur(cv2.erode(255-m[1:-1,1:-1],np.ones((3,3),np.uint8)),(3,3),0)
PA=cutout(pud)
hsv=cv2.cvtColor(pud,cv2.COLOR_BGR2HSV)
BODY=np.median(pud[(hsv[...,2]<60)&(PA>200)],axis=0)                    # цвет чернил
EYES=[(628,478,92,72),(925,452,92,74)]                                   # центр и полуоси глаз (вместе с нарисованным веком)
MOUTH=(778,560); EW=174                                                  # центр ухмылки
# ---------- Клякс: веки и рот кодом ----------
RIM=(230,120,170)   # BGR, фиолетовый контур
def draw_kly(lid, vis):
    """lid: 0 — глаза открыты как на картинке, 1 — закрыты. vis: форма рта по звуку."""
    img=pud.copy()
    for cx,cy,rx,ry in EYES:
        if lid>0.02:
            m=np.zeros(img.shape[:2],np.uint8); cv2.ellipse(m,(cx,cy),(rx+6,ry+8),0,0,360,255,-1)
            cut=int(cy-ry-8+(2*ry+16)*lid); m[cut:,:]=0
            img[m>0]=BODY
            if lid<0.98: cv2.ellipse(img,(cx,cut),(rx+2,10),0,0,180,RIM,5,cv2.LINE_AA)
            else: cv2.ellipse(img,(cx,cy+4),(rx-10,18),0,0,180,RIM,7,cv2.LINE_AA)     # закрытый глаз — дуга
    shp,op=vis
    if shp!="X":
        w,h={"B":(0.34,0.07),"C":(0.44,0.12+0.05*op),"D":(0.4,0.2+0.08*op),"E":(0.28,0.19),"F":(0.18,0.15)}[shp]
        ax,ay=int(w*EW/2),int(h*EW/2)
        cv2.ellipse(img,MOUTH,(ax,ay),-3,0,360,(40,10,36),-1,cv2.LINE_AA); cv2.ellipse(img,MOUTH,(ax,ay),-3,0,360,RIM,5,cv2.LINE_AA)
        if shp=="D": cv2.ellipse(img,(MOUTH[0],MOUTH[1]+ay//2),(ax//2,ay//3),0,0,360,(110,70,190),-1,cv2.LINE_AA)
    return img
# ---------- разлив чернил ----------
INK0=(410,372); PUD_C=(412,700); PUD_S=0.32        # из-под чернильницы — к центру будущей лужицы (координаты BG-02)
rng=np.random.default_rng(7); PH=rng.random(6)*6.28
def blob(u, t):
    """Капли и лужа чернил по ходу разлива u∈[0,1]: ручей к бланку, затем растекание."""
    m=np.zeros(bg.shape[:2],np.uint8)
    tip=(INK0[0]+(PUD_C[0]-INK0[0])*min(u*1.6,1), INK0[1]+(PUD_C[1]-INK0[1])*min(u*1.6,1))
    cv2.line(m,INK0,(int(tip[0]),int(tip[1])),255,int(18+10*u))
    R=max(0.0,(u-0.35)/0.65)
    if R>0:
        th=np.linspace(0,2*np.pi,90); rx=180*R*PUD_S/0.32; ry=95*R*PUD_S/0.32
        r=1+sum(0.08*math.sin(k*1.0*th_+PH[k]+0.5*t) for k in range(2,6) for th_ in [0])
        pts=np.stack([PUD_C[0]+rx*(1+0.07*np.sin(3*th+PH[0])+0.05*np.sin(5*th+PH[1]))*np.cos(th),
                      PUD_C[1]+ry*(1+0.07*np.sin(4*th+PH[2])+0.05*np.sin(6*th+PH[3]))*np.sin(th)],-1).astype(np.int32)
        cv2.fillPoly(m,[pts],255)
    return cv2.GaussianBlur(m,(0,0),1.5)
def comp_bg_shot3(t):
    img=bg.astype(np.float32)
    if t>=SPILL[0]:
        u=min(1,(t-SPILL[0])/(SPILL[1]-SPILL[0])); m=(blob(u,t)/255.0)[...,None]
        fade=1-min(1,max(0,(t-MORPH[0])/(MORPH[1]-MORPH[0])))
        img=img*(1-m*fade)+BODY*m*fade
        rim=cv2.Canny((m[...,0]*255).astype(np.uint8),50,150)>0; img[rim]=img[rim]*(1-0.6*fade)+np.array(RIM)*0.6*fade
    return img
def place_kly(img, k_bgr, alpha, center, scale, sq=1.0):
    kh,kw=k_bgr.shape[:2]; sw,sh=int(kw*scale/sq**0.5),int(kh*scale*sq)
    k=cv2.resize(k_bgr,(sw,sh),interpolation=cv2.INTER_AREA); a=cv2.resize(alpha,(sw,sh),interpolation=cv2.INTER_AREA)/255.0
    # якорь — центр тела лужицы (не центр картинки)
    ox=int(center[0]-(752/kw)*sw); oy=int(center[1]-(485/kh)*sh)
    x0,y0=max(0,ox),max(0,oy); x1,y1=min(img.shape[1],ox+sw),min(img.shape[0],oy+sh)
    if x1<=x0 or y1<=y0: return img
    kk=k[y0-oy:y1-oy,x0-ox:x1-ox].astype(np.float32); aa=a[y0-oy:y1-oy,x0-ox:x1-ox][...,None]
    img[y0:y1,x0:x1]=img[y0:y1,x0:x1]*(1-aa)+kk*aa; return img
def lid_at(t):
    if t<OPEN[0]: return 1.0
    if t<OPEN[1]: return 1-(t-OPEN[0])/(OPEN[1]-OPEN[0])
    for b in (T["mark04"]+0.4, T["kly02"]+1.6):          # моргания
        if b<=t<b+0.16: return 1.0 if t<b+0.08 else 0.5
    return 0.0
# ---------- кадр ----------
sub_f=ImageFont.truetype(f"{fontdir}/PTSans-Bold.ttf",66); lab_f=ImageFont.truetype(f"{fontdir}/PTMono.ttf",32)
SUBS=[(T[n],T[n]+len(aud[n])/SR,txt) for n,txt,_,_ in LINES]
BG_CLOSE=cv2.GaussianBlur(cv2.resize(bg,None,fx=3,fy=3,interpolation=cv2.INTER_CUBIC),(0,0),6)   # фон крупного плана — в расфокусе
ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
  "-i",f"{out}/shots34_norm.wav","-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p",
  "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",f"{out}/shots34.mp4"],stdin=subprocess.PIPE)
for i in range(int(TOTAL*FPS)):
    t=i/FPS; v=kly_talk(t); talk=0.05*v[1] if v[0]!="X" else 0.0
    sq=1+0.015*math.sin(2*math.pi*0.5*t)+talk                         # дыхание + «пружинит» на словах
    if t<CUT:   # ---- кадр 3: стол сверху ----
        img=comp_bg_shot3(t)
        if t>=MORPH[0]:
            k=draw_kly(lid_at(t),v); a=PA.astype(np.float32)*min(1,(t-MORPH[0])/(MORPH[1]-MORPH[0]))
            bounce=1+0.06*math.exp(-((t-T["mark04"]-0.25)/0.12)**2)   # подпрыгивает на «Мы знакомы?»
            img=place_kly(img,k,a.astype(np.uint8),PUD_C,PUD_S,sq*bounce)
        frame=cv2.resize(np.clip(img,0,255).astype(np.uint8),(W,H),interpolation=cv2.INTER_CUBIC)
        shake=6*math.exp(-((t-SPILL[0])/0.07)**2)*math.sin(t*90)         # толчок: Марк задел чернильницу
        z=1+0.05*t/CUT; cw,ch=int(W/z),int(H/z); cx=(W-cw)//2+int(shake); cy=int((H-ch)*0.45)
        frame=cv2.resize(frame[cy:cy+ch,cx:cx+cw],(W,H),interpolation=cv2.INTER_CUBIC)
    else:       # ---- кадр 4: крупно ----
        u=(t-CUT)/(TOTAL-CUT); Z=3*(1+0.06*u)                          # медленный наезд
        big=cv2.resize(bg,None,fx=Z/3,fy=Z/3) if False else BG_CLOSE
        cxp,cyp=int(PUD_C[0]*3),int(PUD_C[1]*3); x0=cxp-W//2; y0=cyp-int(H*0.42)
        img=big[y0:y0+H,x0:x0+W].astype(np.float32)
        k=draw_kly(lid_at(t),v); sway=0.02*math.sin(2*math.pi*0.35*t)
        img=place_kly(img,k,PA,(W//2+int(30*sway*10),int(H*0.42)),0.75*(1+0.06*u),sq)
        frame=np.clip(img,0,255).astype(np.uint8)
    pil=Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)); d=ImageDraw.Draw(pil)
    cur=[s for s in SUBS if s[0]-0.05<=t<=s[1]+0.15]
    if cur:
        d.text((W/2,1300),cur[-1][2],font=sub_f,fill=(245,238,220),anchor="mm",stroke_width=5,stroke_fill=(10,8,20))
    d.text((50,H-110),"ТЕСТ · кадры 3–4 · Клякс",font=lab_f,fill=(120,110,150)); d.text((50,H-68),f"рот: {v[0]}  {t:4.1f} c",font=lab_f,fill=(120,110,150))
    ff.stdin.write(pil.tobytes())
ff.stdin.close()
if ff.wait(): sys.exit("ffmpeg завершился с ошибкой")
print(f"длительность {TOTAL:.2f} c; громкость {loud['normalization_type']}, лимитер {loud['limiter_db']} дБ; mp4 {measure(out+'/shots34.mp4')}")
