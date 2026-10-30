"""Графика на папку в кадре 2 (CH-01): наклейка «ДЕЛО № 001», штамп «ВХ. 23:59», след от кружки.
Кладётся в перспективе обложек и только на пиксели цвета картона — пальцы и края остаются поверх."""
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
# углы обложек на ch01_base.png (940×1672): верх у корешка, верх внешний, низ внешний, низ у корешка
RIGHT=np.float32([(290,1075),(622,978),(690,1300),(385,1395)])
LEFT =np.float32([(0,895),(285,1068),(385,1395),(70,1250)])   # у левой обложки корешок справа
def _quad(P,u0,v0,u1,v1):
    """Под-четырёхугольник обложки P по долям ширины u и высоты v (билинейно)."""
    def pt(u,v): return (1-v)*((1-u)*P[0]+u*P[1])+v*((1-u)*P[3]+u*P[2])
    return np.float32([pt(u0,v0),pt(u1,v0),pt(u1,v1),pt(u0,v1)])
def _grunge(size, seed, amount):
    rng=np.random.default_rng(seed); n=rng.random((size[1]//6+1,size[0]//6+1)).astype(np.float32)
    n=cv2.resize(n,size,interpolation=cv2.INTER_CUBIC)
    return np.clip(1-amount*n,0,1)
def _label(font_path):
    w,h=600,330; im=Image.new("RGBA",(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rectangle([0,0,w-1,h-1],fill=(232,222,196,255),outline=(70,52,40,255),width=8)
    f1=ImageFont.truetype(font_path,92); f2=ImageFont.truetype(font_path,34)
    d.text((w/2,108),"ДЕЛО № 001",font=f1,fill=(40,30,34,255),anchor="mm")
    for k,y in enumerate((205,255)): d.line([(40,y),(w-40,y)],fill=(120,100,85,255),width=3)
    d.text((44,200),"Жалоба:",font=f2,fill=(80,64,56,255),anchor="lb")
    a=np.asarray(im).astype(np.float32); a[...,:3]*=_grunge((w,h),1,0.18)[...,None]
    return a
def _stamp(font_path):
    w,h=420,190; im=Image.new("RGBA",(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    red=(170,40,40,255); d.rounded_rectangle([8,8,w-8,h-8],radius=22,outline=red,width=10)
    d.text((w/2,h/2+4),"ВХ. 23:59",font=ImageFont.truetype(font_path,70),fill=red,anchor="mm")
    im=im.rotate(9,resample=Image.BICUBIC,expand=True)   # expand: углы рамки не обрезаются
    a=np.asarray(im).astype(np.float32); a[...,3]*=_grunge(im.size,2,0.35)*0.95   # неровный оттиск
    return a
def _ring():
    s=260; im=Image.new("RGBA",(s,s),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.ellipse([20,20,s-20,s-20],outline=(95,62,40,255),width=14)
    im=im.filter(ImageFilter.GaussianBlur(3)); a=np.asarray(im).astype(np.float32); a[...,3]*=_grunge((s,s),3,0.8)*0.35
    return a
def _place(dst, art, quad, card_mask):
    h,w=art.shape[:2]; M=cv2.getPerspectiveTransform(np.float32([(0,0),(w,0),(w,h),(0,h)]),quad)
    warped=cv2.warpPerspective(art,M,(dst.shape[1],dst.shape[0]),flags=cv2.INTER_LINEAR)
    a=(warped[...,3:4]/255.0)*card_mask
    rgb=warped[...,:3][...,::-1]                       # RGB -> BGR
    return dst*(1-a)+rgb*a
def decorate(base_bgr, font_path):
    """base_bgr — картинка Марка (BGR). Возвращает копию с графикой на папке."""
    lab=cv2.cvtColor(base_bgr,cv2.COLOR_BGR2LAB).astype(np.float32)
    ref=cv2.cvtColor(np.uint8([[[80,124,166]]]),cv2.COLOR_BGR2LAB)[0,0].astype(np.float32)   # цвет картона
    card=(np.linalg.norm(lab-ref,axis=-1)<38).astype(np.float32)
    card=cv2.GaussianBlur(cv2.erode(card,np.ones((5,5),np.uint8)),(0,0),1.2)[...,None]
    out=base_bgr.astype(np.float32)
    out=_place(out,_ring(),_quad(RIGHT,0.08,0.62,0.42,0.95),card)
    out=_place(out,_label(font_path),_quad(RIGHT,0.14,0.14,0.86,0.50),card)
    out=_place(out,_stamp(font_path),_quad(LEFT,0.10,0.14,0.92,0.48),card)
    return np.clip(out,0,255).astype(np.uint8)
