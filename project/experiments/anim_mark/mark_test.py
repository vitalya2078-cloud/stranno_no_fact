"""Тест перекладочной анимации Марка на настоящих картинках (кадр 2 пилота).
Запуск: python3 -I mark_test.py <vosk_model_dir> <fonts_dir> <tools_dir> <assets_CH-01_dir> <out_dir>
Из двух картинок владельца (глаза открыты / закрыты) собирается моргание; рот дорисовывается по звуку;
голова поворачивается мягкой деформацией вокруг шеи. Фон — заглушка."""
import sys, math, subprocess, numpy as np, cv2, soundfile as sf
from PIL import Image, ImageDraw, ImageFont
vosk_p, fontdir, tools, adir, out = sys.argv[1:6]
sys.path.insert(0, tools)
from stresslib import Stress
from voicelib import VoskVoice, pitch_report, SR
from lipsync import visemes
from loudness import normalize, measure
from vosk_tts import Model, Synth
W,H,FPS=1080,1920,30
# ---------- голос Марка (текущий утверждённый: male_1, без обработки) ----------
vm=Model(model_path=vosk_p); V=VoskVoice(Synth(vm),Stress(vm))
DIR=[("Жалоба: в Бюро не наступает полночь.",1.0),0.35,("Заявитель — Бюро.",0.95),0.8,("Странно.",0.95),0.35,("Я здесь первый день.",1.0)]
chunks=[]; phr=[]; t=0.0
for it in DIR:
    if isinstance(it,float): chunks.append(np.zeros(int(it*SR),np.float32)); t+=it; continue
    a=V.best(it[0],4,it[1],n=10); phr.append((t,t+len(a)/SR,it[0])); t+=len(a)/SR; chunks.append(a)
    print(it[0], f"{len(a)/SR:.2f} c", pitch_report(a), "чистых", V.last_info["clean"])
voice=np.concatenate(chunks); voice=voice/np.sqrt(np.mean(voice[np.abs(voice)>1e-4]**2))*10**(-20/20)
T0=0.5; TOTAL=T0+len(voice)/SR+0.9
mix=np.zeros(int(TOTAL*SR),np.float32); mix[int(T0*SR):int(T0*SR)+len(voice)]=voice
mix=mix/np.max(np.abs(mix))*0.89; sf.write(f"{out}/mark_test.wav",mix,SR)
loud=normalize(f"{out}/mark_test.wav",f"{out}/mark_test_norm.wav")
vis=visemes(voice,SR,FPS)
def viseme_at(tt):
    i=int(round((tt-T0)*FPS)); return vis[i] if 0<=i<len(vis) else ["X",0.0]
# ---------- слои: вырезка с фона, совмещение «глаза закрыты» ----------
base=cv2.imread(f"{adir}/ch01_base.png"); closed=cv2.imread(f"{adir}/ch01_eyes_closed.png")
h0,w0=base.shape[:2]
def align(src,dst,box):
    """Подобие (поворот+масштаб+сдвиг) src -> dst по особым точкам внутри box (x0,y0,x1,y1 в координатах dst)."""
    sift=cv2.SIFT_create(4000); g=lambda im: cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
    mask=np.zeros(dst.shape[:2],np.uint8); x0,y0,x1,y1=box; mask[y0:y1,x0:x1]=255
    kd,dd=sift.detectAndCompute(g(dst),mask); ks,ds=sift.detectAndCompute(g(src),None)
    good=[m for m,n in cv2.BFMatcher().knnMatch(ds,dd,k=2) if m.distance<0.7*n.distance]
    M,inl=cv2.estimateAffinePartial2D(np.float32([ks[m.queryIdx].pt for m in good]),np.float32([kd[m.trainIdx].pt for m in good]),
                                      method=cv2.RANSAC,ransacReprojThreshold=2)
    print("совмещение: пар", len(good), "надёжных", int(inl.sum()))
    return cv2.warpAffine(src,M,(dst.shape[1],dst.shape[0]),flags=cv2.INTER_CUBIC,borderValue=(197,197,197))
closed_al=align(closed,base,(250,300,750,700))       # совмещаем по лицу, а не по всей картинке
# маска глаз: два овала с мягким краем (координаты по base 940×1672)
EYES=[(372,557,48,36),(507,545,50,34)]
em=np.zeros((h0,w0),np.float32)
for cx,cy,rx,ry in EYES: cv2.ellipse(em,(cx,cy),(rx,ry),0,0,360,1.0,-1)
em=cv2.GaussianBlur(em,(0,0),5)[...,None]
# вырезка фигуры: заливка фона от краёв (серое худи не трогаем — его отделяет контур)
def cutout(img):
    ff=img.copy(); m=np.zeros((h0+2,w0+2),np.uint8)
    seeds=[(x,0) for x in range(0,w0,15)]+[(x,h0-1) for x in range(0,w0,15)]+[(0,y) for y in range(0,h0,15)]+[(w0-1,y) for y in range(0,h0,15)]
    for p in seeds:                     # точки по всему периметру: фон бывает отрезан папкой и руками
        if m[p[1]+1,p[0]+1]==0 and np.abs(img[p[1],p[0]].astype(int)-[197,197,197]).max()<12:
            cv2.floodFill(ff,m,p,(0,0,0),(6,6,6),(6,6,6),cv2.FLOODFILL_MASK_ONLY|(255<<8)|8)
    a=255-m[1:-1,1:-1]
    a=cv2.erode(a,np.ones((3,3),np.uint8),iterations=1)   # срезаем светлую кайму фона по краю
    return cv2.GaussianBlur(a,(3,3),0)
ALPHA=cutout(base)
MOUTH=(466,650)        # центр линии рта
def draw_mouth(img, shp, op):
    if shp=="X": return img
    wpx,hpx={"B":(26,5),"C":(34,8+4*op),"D":(30,13+7*op),"E":(22,13),"F":(15,11)}[shp]
    S=4; pw,ph=80,60; patch=Image.new("RGBA",(pw*S,ph*S),(0,0,0,0)); d=ImageDraw.Draw(patch)
    cx,cy=pw*S/2,ph*S/2
    d.ellipse([cx-wpx*S/2,cy-hpx*S/2,cx+wpx*S/2,cy+hpx*S/2],fill=(92,38,40,255),outline=(48,26,24,255),width=int(2.2*S))
    if hpx>12: d.ellipse([cx-wpx*S*0.25,cy+hpx*S*0.05,cx+wpx*S*0.25,cy+hpx*S/2-S*2],fill=(170,80,80,255))
    patch=patch.rotate(-4,resample=Image.BICUBIC).resize((pw,ph),Image.LANCZOS)
    pil=Image.fromarray(cv2.cvtColor(img,cv2.COLOR_BGR2RGB)); pil.paste(patch,(MOUTH[0]-pw//2,MOUTH[1]-ph//2),patch)
    return cv2.cvtColor(np.asarray(pil),cv2.COLOR_RGB2BGR)
# мягкий поворот головы вокруг шеи: вес 1 выше подбородка, 0 ниже ворота
PIV=(500,770); yy,xx=np.mgrid[0:h0,0:w0].astype(np.float32)
wgt=np.clip((815-yy)/(815-725),0,1); wgt=wgt*wgt*(3-2*wgt)
def head_warp(img, ang_deg, dy):
    a=np.deg2rad(ang_deg)*wgt; c,s=np.cos(a),np.sin(a)
    X=xx-PIV[0]; Y=yy-PIV[1]+dy*wgt
    mx=PIV[0]+c*X+s*Y; my=PIV[1]-s*X+c*Y
    return cv2.remap(img,mx.astype(np.float32),my.astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
# ---------- движение по смыслу реплик ----------
def env(tt,a,b,ramp=0.25):
    if tt<a-ramp or tt>b+ramp: return 0.0
    u=min(1,(tt-a+ramp)/ramp) if tt<a else (1 if tt<=b else 1-(tt-b)/ramp)
    return u*u*(3-2*u)
p=[(T0+s,T0+e) for s,e,_ in phr]
def pose(tt):
    ang=0.0; dy=0.0
    ang+=0.6*math.sin(2*math.pi*0.23*tt)                                   # живое микропокачивание
    dy+=2.0*math.sin(2*math.pi*0.9*tt)*env(tt,*p[0],0.2)                     # читает: лёгкие кивки на фразе
    ang+= -2.5*env(tt,p[1][0]-0.1,p[1][1]+0.5); dy+=-10*env(tt,p[1][0]-0.1,p[1][1]+0.5)   # «Заявитель — Бюро»: голова чуть вверх и назад
    ang+= 3.5*env(tt,p[2][0],p[3][1]+0.3,0.35)                                         # «Странно…»: наклон головы набок
    return ang,dy
BLINKS=[0.2,p[1][1]+0.35,p[3][1]+0.55]
def blink_amt(tt):
    for b in BLINKS:
        if b<=tt<b+0.16: return 1.0 if tt<b+0.10 else 0.5
    return 0.0
# ---------- фон-заглушка ----------
def background():
    y=np.arange(H)[:,None]; x=np.arange(W)[None,:]
    px=np.zeros((H,W,3),np.float32); px[:]=[22,17,40]
    px+=np.exp(-(((x-150)/520.0)**2+((y-900)/700.0)**2))[...,None]*np.array([120,70,25],np.float32)
    px[(y>1700).repeat(W,1)]=[48,32,30]
    img=Image.fromarray(np.clip(px,0,255).astype(np.uint8)); d=ImageDraw.Draw(img)
    for k in range(3): d.rectangle([760+k*90,350,830+k*90,1250],fill=(32,24,50),outline=(45,35,65),width=4)   # стеллаж с папками
    return img
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
ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
  "-i",f"{out}/mark_test_norm.wav","-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p",
  "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",f"{out}/mark_anim_test.mp4"],stdin=subprocess.PIPE)
for i in range(int(TOTAL*FPS)):
    tt=i/FPS
    bl=blink_amt(tt); img=base if bl==0 else (base*(1-em*bl)+closed_al*em*bl).astype(np.uint8)
    v=viseme_at(tt); img=draw_mouth(img,v[0],v[1])
    ang,dy=pose(tt)
    rgba=np.dstack([cv2.cvtColor(img,cv2.COLOR_BGR2RGB),ALPHA])
    rgba=head_warp(rgba,ang,dy)
    breath=1+0.006*math.sin(2*math.pi*0.25*tt)
    fig=Image.fromarray(rgba,"RGBA").resize((FW,int(FH*breath)),Image.BICUBIC)
    frame=BG.copy(); frame.paste(fig,((W-FW)//2+30,H-fig.height+40),fig)
    z=1+0.06*tt/TOTAL; cw,ch=int(W/z),int(H/z)                                  # медленный наезд
    frame=frame.crop(((W-cw)//2,int((H-ch)*0.3),(W-cw)//2+cw,int((H-ch)*0.3)+ch)).resize((W,H),Image.BICUBIC)
    d=ImageDraw.Draw(frame)
    cur=[(s,e,x) for s,e,x in phr if T0+s-0.05<=tt<=T0+e+0.15]
    if cur:
        lns=wrap(d,cur[-1][2],sub_f)[:2]; lh=84; y0=1380-lh*len(lns)
        for j,ln in enumerate(lns): d.text((W/2,y0+j*lh+lh/2),ln,font=sub_f,fill=(245,238,220),anchor="mm",stroke_width=5,stroke_fill=(10,8,20))
    d.text((50,H-110),"ТЕСТ · Марк, кадр 2 · фон-заглушка",font=lab_f,fill=(120,110,150))
    d.text((50,H-68),f"рот: {v[0]}  {tt:4.1f} c",font=lab_f,fill=(120,110,150))
    ff.stdin.write(frame.tobytes())
ff.stdin.close()
if ff.wait(): sys.exit("ffmpeg завершился с ошибкой")
print(f"длительность {TOTAL:.2f} c; громкость {loud['normalization_type']}, лимитер {loud['limiter_db']} дБ; mp4 {measure(out+'/mark_anim_test.mp4')}")
