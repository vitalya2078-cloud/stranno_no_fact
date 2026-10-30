"""Тест кадра 2 с эмоциями: спокойное чтение → удивление → растерянность.
Запуск: python3 -I mark_emotions.py <vosk_model_dir> <fonts_dir> <tools_dir> <assets_CH-01_dir> <out_dir> [vosk:<speaker_id> | wav:<dir>]
wav:<dir> — готовые фразы другого синтезатора: <dir>/p0.wav, p1.wav, p2.wav (по одной на фразу PHR).
Наборы картинок: «основа» (base + глаза закрыты + рты + удивление для верха лица) и «растерянность» (своя поза + свои рты)."""
import sys, os, math, subprocess, numpy as np, cv2, soundfile as sf, librosa
from PIL import Image, ImageDraw, ImageFont
vosk_p, fontdir, tools, adir, out = sys.argv[1:6]; vsrc = sys.argv[6] if len(sys.argv)>6 else "vosk:3"
sys.path.insert(0, tools); sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voicelib import pitch_report, SR
from lipsync import visemes
from loudness import normalize, measure
from folder_props import decorate
W,H,FPS=1080,1920,30
CLEAN=__import__('os').environ.get('CLEAN')=='1'   # без служебных подписей (для монтажа)
# ---------- голос: фразы и эмоция кадра для каждой ----------
PHR=[("Жалоба: в Бюро не наступает полночь.",1.0,"calm"),("Заявитель — Бюро.",0.95,"surprised"),("Странно... Я здесь первый день.",0.88,"puzzled")]
GAPS=[0.35,0.9]
if vsrc.startswith("vosk:"):
    from stresslib import Stress; from voicelib import VoskVoice; from vosk_tts import Model, Synth
    vm=Model(model_path=vosk_p); V=VoskVoice(Synth(vm),Stress(vm)); spk=int(vsrc[5:])
    parts=[V.best(t,spk,r,n=10) for t,r,_ in PHR]
else:
    def load(p):
        w,sr=sf.read(p,dtype="float32"); w=w if w.ndim==1 else w.mean(1)
        return librosa.effects.trim(librosa.resample(w,orig_sr=sr,target_sr=SR),top_db=40)[0]
    parts=[load(f"{vsrc[4:]}/p{i}.wav") for i in range(len(PHR))]
chunks=[]; phr=[]; t=0.0
for i,(a,(txt,_,emo)) in enumerate(zip(parts,PHR)):
    phr.append((t,t+len(a)/SR,txt,emo)); chunks.append(a); t+=len(a)/SR
    print(txt, f"{len(a)/SR:.2f} c", pitch_report(a))
    if i<len(GAPS): chunks.append(np.zeros(int(GAPS[i]*SR),np.float32)); t+=GAPS[i]
voice=np.concatenate(chunks); voice=voice/np.sqrt(np.mean(voice[np.abs(voice)>1e-4]**2))*10**(-20/20)
T0=0.5; TOTAL=T0+len(voice)/SR+1.0
mix=np.zeros(int(TOTAL*SR),np.float32); mix[int(T0*SR):int(T0*SR)+len(voice)]=voice
mix=mix/np.max(np.abs(mix))*0.89; sf.write(f"{out}/mark_emotions.wav",mix,SR)
loud=normalize(f"{out}/mark_emotions.wav",f"{out}/mark_emotions_norm.wav")
vis=visemes(voice,SR,FPS)
def viseme_at(tt):
    i=int(round((tt-T0)*FPS)); return vis[i] if 0<=i<len(vis) else ["X",0.0]
P=[(T0+s,T0+e) for s,e,_,_ in phr]
# ---------- картинки и совмещение ----------
rd=lambda n: cv2.imread(f"{adir}/ch01_{n}.png")
base=decorate(rd("base"),f"{fontdir}/PTMono.ttf"); h0,w0=base.shape[:2]
def align(src,dst,box):
    sift=cv2.SIFT_create(4000); g=lambda im: cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
    mask=np.zeros(dst.shape[:2],np.uint8); x0,y0,x1,y1=box; mask[y0:y1,x0:x1]=255
    kd,dd=sift.detectAndCompute(g(dst),mask); ks,ds=sift.detectAndCompute(g(src),None)
    good=[m for m,n in cv2.BFMatcher().knnMatch(ds,dd,k=2) if m.distance<0.7*n.distance]
    M,inl=cv2.estimateAffinePartial2D(np.float32([ks[m.queryIdx].pt for m in good]),np.float32([kd[m.trainIdx].pt for m in good]),
                                      method=cv2.RANSAC,ransacReprojThreshold=2)
    print("совмещение: пар", len(good), "надёжных", int(inl.sum()))
    return cv2.warpAffine(src,M,(dst.shape[1],dst.shape[0]),flags=cv2.INTER_CUBIC,borderValue=(197,197,197))
FACE=(250,300,750,800); BODY=(0,880,w0,h0)
closed=align(rd("eyes_closed"),base,FACE); surpr=align(rd("surprised"),base,FACE)
M_BASE={k:align(rd(f"mouth_{k}"),base,FACE) for k in ("open_small","a","o")}
puz=decorate(align(rd("puzzled"),base,BODY),f"{fontdir}/PTMono.ttf")   # поза другая: совмещаем по телу и папке
M_PUZ={k:align(rd(f"puzzled_mouth_{k}"),puz,FACE) for k in ("open_small","a","o")}
LOOK=align(rd("puzzled_look"),puz,FACE)                    # растерянность, но взгляд в камеру: берём только глаза
SHAPE2MOUTH={"B":"open_small","C":"open_small","D":"a","E":"o","F":"o"}
# удивление: рот не закрывается до будничной линии — в паузах изумлённое «о», на гласных раскрыт шире
SURPRISE_MOUTH={"X":"o","B":"o","C":"a","D":"a","E":"o","F":"o"}
def soft(ell):
    m=np.zeros((h0,w0),np.float32)
    for e in ell: cv2.ellipse(m,e[:2],e[2:4],e[4] if len(e)>4 else 0,0,360,1.0,-1)
    return cv2.GaussianBlur(m,(0,0),6)[...,None]
EYES=soft([(372,557,48,36),(507,545,50,34)])
BROWS_EYES=soft([(370,535,66,64),(505,523,68,62)])         # удивление: глаза и брови
def mouth_center(a,b):
    d=cv2.GaussianBlur(cv2.absdiff(a,b).max(-1).astype(np.float32),(0,0),4); y0,y1,x0,x1=400,850,250,750
    sub=d[y0:y1,x0:x1]; yy,xx=np.unravel_index(np.argmax(sub),sub.shape); return (int(xx+x0),int(yy+y0))
MC_BASE=(466,650); MC_PUZ=mouth_center(puz,M_PUZ["a"]); print("центр рта, растерянность:",MC_PUZ)
MM_BASE=soft([(*MC_BASE,52,36,-4)]); MM_PUZ=soft([(*MC_PUZ,56,40)])
def cutout(img):
    ff=img.copy(); m=np.zeros((h0+2,w0+2),np.uint8)
    seeds=[(x,0) for x in range(0,w0,15)]+[(x,h0-1) for x in range(0,w0,15)]+[(0,y) for y in range(0,h0,15)]+[(w0-1,y) for y in range(0,h0,15)]
    for p in seeds:
        if m[p[1]+1,p[0]+1]==0 and np.abs(img[p[1],p[0]].astype(int)-[197,197,197]).max()<14:
            cv2.floodFill(ff,m,p,(0,0,0),(6,6,6),(6,6,6),cv2.FLOODFILL_MASK_ONLY|(255<<8)|8)
    a=cv2.erode(255-m[1:-1,1:-1],np.ones((3,3),np.uint8),iterations=1)
    return cv2.GaussianBlur(a,(3,3),0)
A_BASE=cutout(base); A_PUZ=cutout(puz)
gx=np.linspace(0,1,w0,dtype=np.float32)[None,:,None]
SHADE=np.concatenate([1.0-0.30*gx, 0.97-0.32*gx, 0.95-0.18*gx],-1)
# ---------- состояние лица по времени ----------
def ramp(tt,a,b): return float(np.clip((tt-a)/(b-a),0,1))
def face_state(tt):
    """(вес удивления 0..1, вес позы «растерянность» 0..1)."""
    s_on=P[1][0]-0.12; s_off=P[1][1]+0.45
    surprise=ramp(tt,s_on,s_on+0.1)*(1-ramp(tt,s_off,s_off+0.15))
    puzzle=ramp(tt,P[1][1]+0.5,P[1][1]+0.57)            # поднимает голову в паузе: почти мгновенно, чтобы не было двоения
    return surprise,puzzle
EYES_PUZ=soft([(400,527,40,30),(545,490,44,31)])           # глаза растерянной позы, без бровей
def look_amt(tt):
    """На «…первый день» (последние ~45% фразы) переводит взгляд в камеру за 2 кадра."""
    t_look=P[2][0]+0.55*(P[2][1]-P[2][0]); return ramp(tt,t_look,t_look+2/FPS)
BLINKS=[0.25,(P[0][0]+P[0][1])/2+0.3]     # не ближе 0,3 с к смене эмоции, иначе глаза двоятся
def blink_amt(tt):
    for b in BLINKS:
        if b<=tt<b+0.16: return 1.0 if tt<b+0.10 else 0.5
    return 0.0
def compose(tt):
    v=viseme_at(tt); surprise,puzzle=face_state(tt)
    img=base.astype(np.float32)
    bl=blink_amt(tt)
    if bl: img=img*(1-EYES*bl)+closed*EYES*bl
    if surprise: img=img*(1-BROWS_EYES*surprise)+surpr*BROWS_EYES*surprise
    if surprise>0.5: img=img*(1-MM_BASE)+M_BASE[SURPRISE_MOUTH[v[0]]]*MM_BASE
    elif v[0]!="X": img=img*(1-MM_BASE)+M_BASE[SHAPE2MOUTH[v[0]]]*MM_BASE
    alpha=A_BASE.astype(np.float32)
    if puzzle:
        q=puz.astype(np.float32)
        lk=look_amt(tt)
        if lk: q=q*(1-EYES_PUZ*lk)+LOOK*EYES_PUZ*lk           # брови и рот остаются растерянными
        if v[0]!="X": q=q*(1-MM_PUZ)+M_PUZ[SHAPE2MOUTH[v[0]]]*MM_PUZ
        img=img*(1-puzzle)+q*puzzle; alpha=alpha*(1-puzzle)+A_PUZ*puzzle
    return np.clip(img,0,255).astype(np.uint8), alpha.astype(np.uint8), v
# ---------- взгляд: содержимое разреза глаза сдвигается целиком (без растяжения), края — цветом белка ----------
EYE_BASE=[(375,560,30,22),(508,538,36,23)]; EYE_PUZ=[(400,527,33,24),(545,490,37,26)]   # разрез глаза (белок)
def _eye_masks(eyes):
    out=[]
    for cx,cy,rx,ry in eyes:
        m=np.zeros((h0,w0),np.float32); cv2.ellipse(m,(cx,cy),(rx,ry),0,0,360,1.0,-1)
        hard=m.copy(); soft=cv2.GaussianBlur(cv2.erode(m,np.ones((3,3),np.uint8)),(0,0),1.2)
        out.append((cx,cy,rx,ry,hard,soft))
    return out
def gaze_shift(img, eyes, dx, dy):
    """Двигается только радужка: находим её (компактное тёмное пятно в разрезе, тонкие линии век отсеиваются),
    закрашиваем место цветом белка и кладём радужку со сдвигом — только внутри разреза (белок + радужка)."""
    if abs(dx)<0.3 and abs(dy)<0.3: return img
    res=img.copy(); k7=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7))
    for cx,cy,rx,ry,hard,soft in eyes:
        x0,y0,x1,y1=cx-rx-14,cy-ry-14,cx+rx+14,cy+ry+14
        loc=img[y0:y1,x0:x1]; ell=cv2.dilate((hard[y0:y1,x0:x1]>0).astype(np.uint8),np.ones((5,5),np.uint8))
        hsv=cv2.cvtColor(loc,cv2.COLOR_BGR2HSV)
        sclera=((hsv[...,2]>185)&(hsv[...,1]<80)&(ell>0)).astype(np.uint8)
        cand=(((hsv[...,2]<160)&(sclera==0)&(ell>0))).astype(np.uint8)
        cand=cv2.morphologyEx(cand,cv2.MORPH_OPEN,k7)       # тонкие линии век и ресниц уходят
        n,lab,st,_=cv2.connectedComponentsWithStats(cand)
        if n<2 or sclera.sum()<20: continue                 # глаз закрыт или радужка не найдена — не трогаем
        iris=(lab==1+np.argmax(st[1:,cv2.CC_STAT_AREA])).astype(np.uint8)
        if iris.sum()<80: continue
        iris=cv2.dilate(iris,np.ones((3,3),np.uint8))
        opening=cv2.morphologyEx(((sclera|iris)>0).astype(np.uint8),cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
        scol=np.median(loc[sclera>0],axis=0)
        bg=loc.astype(np.float32).copy(); bg[iris>0]=scol                       # место радужки — белок
        M=np.float32([[1,0,dx],[0,1,dy]]); w,h=x1-x0,y1-y0
        mov=cv2.warpAffine(loc.astype(np.float32),M,(w,h)); mm=cv2.warpAffine(iris.astype(np.float32),M,(w,h))
        a=cv2.GaussianBlur(mm*opening,(0,0),0.8)[...,None]                       # радужка уходит под веко
        o=cv2.GaussianBlur(opening.astype(np.float32),(0,0),0.8)[...,None]
        new=bg*(1-a)+mov*a
        res[y0:y1,x0:x1]=np.clip(loc*(1-o)+new*o,0,255).astype(np.uint8)
    return res
def gaze(tt):
    """Куда смотрит Марк (сдвиг радужки в пикселях картинки)."""
    if tt<P[1][0]-0.12:                                   # читает: глаза бегут по строке и возвращаются к началу следующей
        ph=((tt-0.2)*0.85)%1.0; return (-5+10*min(ph/0.85,1.0) if ph<0.85 else 5-10*(ph-0.85)/0.15, 1.5)
    if tt<P[1][1]+0.5: return (0.0,-3.0)                  # удивление: взгляд вскидывается от папки
    if tt<(P[2][0]+P[2][1])/2: return (1.5*math.sin(tt*3.0),0.0)    # растерянность: смотрит в сторону, думает
    return (-6.0,2.5)                                     # «…первый день»: переводит взгляд к зрителю
GZ=[0.0,0.0]
GAZE_CODE=False   # сдвиг радужки кодом даёт артефакты у век; взгляд — нарисованными вариантами (как рты)
# ---------- голова: мягкий поворот вокруг шеи ----------
PIV=(500,770); yy,xx=np.mgrid[0:h0,0:w0].astype(np.float32)
wgt=np.clip((815-yy)/(815-725),0,1); wgt=wgt*wgt*(3-2*wgt)
def head_warp(img, ang_deg, dy):
    a=np.deg2rad(ang_deg)*wgt; c,s=np.cos(a),np.sin(a); X=xx-PIV[0]; Y=yy-PIV[1]+dy*wgt
    return cv2.remap(img,(PIV[0]+c*X+s*Y).astype(np.float32),(PIV[1]-s*X+c*Y).astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
def env(tt,a,b,r=0.25):
    if tt<a-r or tt>b+r: return 0.0
    u=min(1,(tt-a+r)/r) if tt<a else (1 if tt<=b else 1-(tt-b)/r); return u*u*(3-2*u)
def pose(tt):
    ang=0.5*math.sin(2*math.pi*0.23*tt); dy=0.0
    dy+=2.0*math.sin(2*math.pi*0.9*tt)*env(tt,*P[0],0.2)                          # чтение: кивки
    jolt=env(tt,P[1][0]-0.12,P[1][0]+0.05,0.08)                                     # удивление: короткий рывок назад
    dy+=-16*jolt-6*env(tt,P[1][0],P[1][1]+0.4); ang+=-2.0*env(tt,P[1][0],P[1][1]+0.4)
    ang+=4.0*env(tt,P[2][0]-0.2,P[2][1]+0.5,0.5)                                    # растерянность: медленный наклон набок
    ang+=0.8*math.sin(2*math.pi*0.6*tt)*env(tt,P[2][0],P[2][1],0.3)                  # и лёгкое покачивание, пока думает
    return ang,dy
EM_BASE=_eye_masks(EYE_BASE); EM_PUZ=_eye_masks(EYE_PUZ)
def background():
    bg=Image.open(f"{adir}/../BG-01/bg01_office.png").convert("RGB")
    k=max(W/bg.width,H/bg.height)*1.4; bg=bg.resize((int(bg.width*k)+1,int(bg.height*k)+1),Image.LANCZOS)
    x0=int((bg.width-W)*0.45); y0=bg.height-H; bg=bg.crop((x0,y0,x0+W,y0+H))
    return Image.fromarray((cv2.GaussianBlur(np.asarray(bg),(0,0),2.2).astype(np.float32)*0.82).astype(np.uint8))
BG=background()
sub_f=ImageFont.truetype(f"{fontdir}/PTSans-Bold.ttf",66); lab_f=ImageFont.truetype(f"{fontdir}/PTMono.ttf",32)
def wrap(d,txt,f,w=900):
    o,c=[],""
    for word in txt.split():
        n=(c+" "+word).strip()
        if d.textlength(n,font=f)>w and c: o.append(c); c=word
        else: c=n
    return o+[c]
SC=1.12; FW,FH=int(w0*SC),int(h0*SC)
SUB_BOTTOM=1160      # выше папки: наклейка «ДЕЛО № 001» — улика, субтитр её не закрывает
ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
  "-i",f"{out}/mark_emotions_norm.wav","-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p",
  "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",f"{out}/mark_emotions.mp4"],stdin=subprocess.PIPE)
for i in range(int(TOTAL*FPS)):
    tt=i/FPS; img,alpha,v=compose(tt); ang,dy=pose(tt)
    gx_,gy_=gaze(tt) if GAZE_CODE else (0.0,0.0); GZ[0]+=(gx_-GZ[0])*0.45; GZ[1]+=(gy_-GZ[1])*0.45
    img=gaze_shift(img, EM_PUZ if face_state(tt)[1]>0.5 else EM_BASE, GZ[0], GZ[1])
    img=np.clip(img*SHADE,0,255).astype(np.uint8)
    rgba=head_warp(np.dstack([cv2.cvtColor(img,cv2.COLOR_BGR2RGB),alpha]),ang,dy)
    breath=1+0.006*math.sin(2*math.pi*0.25*tt)
    fig=Image.fromarray(rgba,"RGBA").resize((FW,int(FH*breath)),Image.BICUBIC)
    frame=BG.copy(); frame.paste(fig,((W-FW)//2+30,H-fig.height+40),fig)
    tp=P[1][1]+0.5; pop=0.025*math.exp(-((tt-tp-0.05)/0.08)**2)                    # толчок камеры на смене позы
    z=1+0.04*tt/TOTAL+0.03*env(tt,P[2][0],TOTAL,0.6)+pop                          # наезд усиливается на растерянности
    cw,ch=int(W/z),int(H/z); frame=frame.crop(((W-cw)//2,int((H-ch)*0.3),(W-cw)//2+cw,int((H-ch)*0.3)+ch)).resize((W,H),Image.BICUBIC)
    d=ImageDraw.Draw(frame)
    cur=[x for s,e,x,_ in phr if T0+s-0.05<=tt<=T0+e+0.15]
    if cur:
        lns=wrap(d,cur[-1],sub_f)[:2]; lh=84; y0=SUB_BOTTOM-lh*len(lns)
        for j,ln in enumerate(lns): d.text((W/2,y0+j*lh+lh/2),ln,font=sub_f,fill=(245,238,220),anchor="mm",stroke_width=5,stroke_fill=(10,8,20))
    if not CLEAN: d.text((50,H-110),f"ТЕСТ · Марк, кадр 2 · эмоции · голос {vsrc.split(':')[0]}",font=lab_f,fill=(120,110,150))
    if not CLEAN: d.text((50,H-68),f"рот: {v[0]}  {tt:4.1f} c",font=lab_f,fill=(120,110,150))
    ff.stdin.write(frame.tobytes())
ff.stdin.close()
if ff.wait(): sys.exit("ffmpeg завершился с ошибкой")
print(f"длительность {TOTAL:.2f} c; громкость {loud['normalization_type']}, лимитер {loud['limiter_db']} дБ; mp4 {measure(out+'/mark_emotions.mp4')}")
