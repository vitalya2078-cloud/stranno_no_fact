"""Общие детали сборки кадров: вырезка с ровного фона, совмещение картинок, «кукла» с ртами по звуку,
субтитры, запись кадров в ffmpeg."""
import subprocess, numpy as np, cv2, soundfile as sf, librosa
from PIL import Image, ImageDraw, ImageFont
W,H,FPS=1080,1920,30
SR=48000
def load_line(path, emph=None, asr=None, text=None):
    """Реплика: моно 48 кГц, обрезаны тишины, громкость к −20 дБ RMS; emph=(выделить, приглушить) — логическое ударение."""
    a,sr=sf.read(path,dtype="float32"); a=a if a.ndim==1 else a.mean(1)
    if emph:
        from emphasis import words, emphasize
        a=emphasize(a,sr,words(a,sr,text,asr),emph=emph[0],flatten=emph[1],st=2.5,stretch=1.1,keep=0.6)
    a=librosa.effects.trim(librosa.resample(a,orig_sr=sr,target_sr=SR),top_db=40)[0]
    return a/np.sqrt(np.mean(a[np.abs(a)>1e-4]**2))*10**(-20/20)
def cutout(img, tol=14):
    """Альфа по заливке ровного фона от периметра (цвет фона берётся из угла)."""
    h,w=img.shape[:2]; m=np.zeros((h+2,w+2),np.uint8); bgc=img[3,3].astype(int)
    for p in [(x,0) for x in range(0,w,15)]+[(x,h-1) for x in range(0,w,15)]+[(0,y) for y in range(0,h,15)]+[(w-1,y) for y in range(0,h,15)]:
        if m[p[1]+1,p[0]+1]==0 and np.abs(img[p[1],p[0]].astype(int)-bgc).max()<tol:
            cv2.floodFill(img.copy(),m,p,0,(6,6,6),(6,6,6),cv2.FLOODFILL_MASK_ONLY|(255<<8)|8)
    a=cv2.erode(255-m[1:-1,1:-1],np.ones((3,3),np.uint8),iterations=1)
    return cv2.GaussianBlur(a,(3,3),0)
def align(src, dst, box):
    """Подобие src → dst по особым точкам внутри box (x0,y0,x1,y1 в координатах dst)."""
    sift=cv2.SIFT_create(4000); g=lambda im: cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
    mask=np.zeros(dst.shape[:2],np.uint8); x0,y0,x1,y1=box; mask[y0:y1,x0:x1]=255
    kd,dd=sift.detectAndCompute(g(dst),mask); ks,ds=sift.detectAndCompute(g(src),None)
    good=[m for m,n in cv2.BFMatcher().knnMatch(ds,dd,k=2) if m.distance<0.7*n.distance]
    M,_=cv2.estimateAffinePartial2D(np.float32([ks[m.queryIdx].pt for m in good]),np.float32([kd[m.trainIdx].pt for m in good]),
                                    method=cv2.RANSAC,ransacReprojThreshold=2)
    return cv2.warpAffine(src,M,(dst.shape[1],dst.shape[0]),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE)
def soft_ellipse(shape, ell, blur=6):
    m=np.zeros(shape[:2],np.float32)
    for e in ell: cv2.ellipse(m,e[:2],e[2:4],e[4] if len(e)>4 else 0,0,360,1.0,-1)
    return cv2.GaussianBlur(m,(0,0),blur)[...,None]
def mouth_center(a, b, box):
    """Где отличаются две картинки (рот закрыт / открыт) — центр рта."""
    x0,y0,x1,y1=box; d=cv2.GaussianBlur(cv2.absdiff(a,b).max(-1).astype(np.float32),(0,0),4)[y0:y1,x0:x1]
    yy,xx=np.unravel_index(np.argmax(d),d.shape); return (int(xx+x0),int(yy+y0))
SHAPE2MOUTH={"B":"open_small","C":"open_small","D":"a","E":"o","F":"o"}
class Puppet:
    """Персонаж из картинок: основа + рты (правки основы) по форме из звука."""
    def __init__(self, base, mouths, face_box):
        self.base=base; self.h,self.w=base.shape[:2]
        self.m={k:align(v,base,face_box) for k,v in mouths.items()}
        c=mouth_center(base,self.m["a"],face_box); self.mm=soft_ellipse(base.shape,[(*c,58,42)])
        self.alpha=cutout(base)
    def frame(self, vis):
        if vis[0]=="X": return self.base
        return (self.base*(1-self.mm)+self.m[SHAPE2MOUTH[vis[0]]]*self.mm).astype(np.uint8)
def paste(dst, src_bgr, alpha, x, y, scale=1.0):
    """Наложить src (с альфой) в точку (x,y) левого верхнего угла с масштабом."""
    if scale!=1.0:
        src_bgr=cv2.resize(src_bgr,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA)
        alpha=cv2.resize(alpha,None,fx=scale,fy=scale,interpolation=cv2.INTER_AREA)
    h,w=src_bgr.shape[:2]; x0,y0=max(0,x),max(0,y); x1,y1=min(dst.shape[1],x+w),min(dst.shape[0],y+h)
    if x1<=x0 or y1<=y0: return dst
    a=(alpha[y0-y:y1-y,x0-x:x1-x].astype(np.float32)/255.0)[...,None]
    dst[y0:y1,x0:x1]=dst[y0:y1,x0:x1]*(1-a)+src_bgr[y0-y:y1-y,x0-x:x1-x]*a
    return dst
def fill_frame(img, focus=(0.5,0.5), zoom=1.0):
    """Картинку любого размера — на весь кадр 1080×1920 (обрезка по focus, доп. наезд zoom)."""
    h,w=img.shape[:2]; k=max(W/w,H/h)*zoom; r=cv2.resize(img,(int(w*k)+1,int(h*k)+1),interpolation=cv2.INTER_CUBIC)
    x0=int((r.shape[1]-W)*focus[0]); y0=int((r.shape[0]-H)*focus[1]); return r[y0:y0+H,x0:x0+W]
class Subs:
    def __init__(self, fontdir, bottom=1300):
        self.f=ImageFont.truetype(f"{fontdir}/PTSans-Bold.ttf",66); self.bottom=bottom; self.items=[]
    def add(self, t0, t1, text, bottom=None): self.items.append((t0,t1,text,bottom or self.bottom))
    def draw(self, pil, t):
        cur=[s for s in self.items if s[0]-0.05<=t<=s[1]+0.15]
        if not cur: return
        d=ImageDraw.Draw(pil); words=cur[-1][2].split(); lines=[""]; bottom=cur[-1][3]
        for w in words:
            n=(lines[-1]+" "+w).strip()
            if d.textlength(n,font=self.f)>920 and lines[-1]: lines.append(w)
            else: lines[-1]=n
        lh=84; y0=bottom-lh*len(lines)
        for j,ln in enumerate(lines): d.text((W/2,y0+j*lh+lh/2),ln,font=self.f,fill=(245,238,220),anchor="mm",stroke_width=5,stroke_fill=(10,8,20))
class Writer:
    """Кадры в mp4 без звука (звук сводится отдельно)."""
    def __init__(self, path):
        self.p=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
            "-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p",path],stdin=subprocess.PIPE)
    def put(self, bgr_or_pil):
        if isinstance(bgr_or_pil,Image.Image): self.p.stdin.write(bgr_or_pil.convert("RGB").tobytes())
        else: self.p.stdin.write(cv2.cvtColor(np.ascontiguousarray(bgr_or_pil),cv2.COLOR_BGR2RGB).tobytes())
    def close(self):
        self.p.stdin.close()
        if self.p.wait(): raise RuntimeError("ffmpeg завершился с ошибкой")
