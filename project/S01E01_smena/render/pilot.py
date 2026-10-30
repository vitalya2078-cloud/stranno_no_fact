"""Черновой монтаж пилота «Смена не принята»: 12 кадров, голоса, звуки, субтитры.
Запуск (из project/): python3 -I S01E01_smena/render/pilot.py <lines_dir> <prerender_dir> <out_dir>
lines_dir     — реплики <id>.wav (лучшие дубли, см. pick_takes.py)
prerender_dir — кадр 2 (shot02.mp4 + shot02.wav) и кадры 3–4 (shot34.mp4 + shot34.wav), собранные своими скриптами с CLEAN=1
Кадры 2 и 3–4 берутся готовыми; остальные собираются здесь."""
import sys, os, math, subprocess, json, numpy as np, cv2, soundfile as sf, librosa
from PIL import Image, ImageDraw, ImageFont
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..",".."))
sys.path.insert(0,f"{ROOT}/tools")
from shotlib import W,H,FPS,SR,load_line,cutout,align,Puppet,paste,fill_frame,Subs,Writer,soft_ellipse
from lipsync import visemes
from loudness import normalize, measure
import sfx
ldir, pdir, out = sys.argv[1:4]
A=f"{ROOT}/assets/S01E01_smena"; FONTS=f"{ROOT}/fonts"; ASR=f"{ROOT}/../models/vosk-model-small-ru-0.22"
rd=lambda p: cv2.imread(f"{A}/{p}")
L=lambda n: load_line(f"{ldir}/{n}.wav")
subs=Subs(FONTS); voice=[]; fx=[]          # (время, сигнал) — для сведения
def say(t0, a, text, who):
    voice.append((t0,a)); subs.add(t0,t0+len(a)/SR,text); return t0+len(a)/SR
def sound(t0, a, gain_db): fx.append((t0,a*10**(gain_db/20)))
dur=lambda a: len(a)/SR
# ---------- картинки ----------
CLOCK=rd("PR-01/pr01_clock_nohands.png"); CC=(432,676)          # центр циферблата
LOG=rd("PR-02/pr02_logbook.png"); HAND=rd("PR-03/pr03_hand_pen.png"); NIB=(250,752)
DESK=rd("BG-02/bg02_desk_top.png"); OFFICE=rd("BG-01/bg01_office.png")
KS=rd("CH-04/ch04b_klyaks_smug.png"); KQ=rd("CH-04/ch04a_klyaks_serious.png"); KA=cutout(KS); KQA=cutout(KQ)
M3=Puppet(rd("CH-03/ch03_base.png"),{k:rd(f"CH-03/ch03_mouth_{k}.png") for k in ("open_small","a","o")},(250,350,750,900))
M3UP=align(rd("CH-03/ch03_look_up.png"),M3.base,(0,950,940,1672)); M3UPA=cutout(M3UP)
MARK1=rd("CH-01/ch01_base.png"); MARK1A=cutout(MARK1)
hand_f=ImageFont.truetype(f"{FONTS}/Caveat-Bold.ttf",34); mono=ImageFont.truetype(f"{FONTS}/PTMono.ttf",72)
# ---------- общие элементы ----------
def clock_img(minute_deg, hour_deg, punch=1.0):
    S=2; im=Image.fromarray(cv2.cvtColor(CLOCK,cv2.COLOR_BGR2RGB)).resize((CLOCK.shape[1]*S,CLOCK.shape[0]*S)); d=ImageDraw.Draw(im)
    cx,cy=CC[0]*S,CC[1]*S
    def hand(deg,length,width,col):
        a=math.radians(deg); ux,uy=math.sin(a),-math.cos(a); px,py=-uy,ux
        tip=(cx+ux*length*S,cy+uy*length*S); tail=(cx-ux*40*S,cy-uy*40*S)
        d.polygon([(tail[0]+px*width*S,tail[1]+py*width*S),(tip[0]+px*2*S,tip[1]+py*2*S),(tip[0]-px*2*S,tip[1]-py*2*S),(tail[0]-px*width*S,tail[1]-py*width*S)],fill=col)
    hand(hour_deg,190,11,(40,26,22)); hand(minute_deg,285,8,(30,20,18))
    d.ellipse([cx-16*S,cy-16*S,cx+16*S,cy+16*S],fill=(150,110,50)); d.ellipse([cx-7*S,cy-7*S,cx+7*S,cy+7*S],fill=(60,40,20))
    a=cv2.cvtColor(np.asarray(im.resize((CLOCK.shape[1],CLOCK.shape[0]),Image.LANCZOS)),cv2.COLOR_RGB2BGR)
    return fill_frame(a,(0.5,0.44),punch)
def logbook(with_mark_sig=0.0):
    """Журнал с записями: старые строки-закорючки, «Смену сдал: М.», «Смену принял:» и (по доле) подпись Марка."""
    im=Image.fromarray(cv2.cvtColor(LOG,cv2.COLOR_BGR2RGB)); d=ImageDraw.Draw(im); ink=(38,34,70)
    rows=[438+46*k for k in range(14)]
    rng=np.random.default_rng(5)
    for k in range(6):                                              # старые записи: время и неразборчивая подпись
        y=rows[k]; d.text((470,y),f"{23}:{59}",font=hand_f,fill=ink,anchor="ls")
        x=575; pts=[]
        for j in range(26): pts.append((x+j*7,y-8+rng.integers(-9,9)))
        d.line(pts,fill=ink,width=3)
    y=rows[6]; d.text((470,y),"23:59",font=hand_f,fill=ink,anchor="ls"); d.text((572,y),"Смену сдал: М.",font=hand_f,fill=ink,anchor="ls")
    y=rows[7]; d.text((572,y),"Смену принял:",font=hand_f,fill=ink,anchor="ls")
    if with_mark_sig>0:
        sig=Image.new("RGBA",(220,70),(0,0,0,0)); ImageDraw.Draw(sig).text((4,56),"М.",font=hand_f,fill=ink+(255,),anchor="ls")
        w=int(sig.width*with_mark_sig); im.paste(sig.crop((0,0,max(1,w),70)),(752,rows[7]-56),sig.crop((0,0,max(1,w),70)))
    return cv2.cvtColor(np.asarray(im),cv2.COLOR_RGB2BGR)
def office_bg():
    o=fill_frame(OFFICE,(0.45,1.0),1.4); return (cv2.GaussianBlur(o,(0,0),2.2).astype(np.float32)*0.82).astype(np.uint8)
OFF=office_bg()
def kly_face(img, alpha, vis, blink, t):
    """Рот и моргание Клякса-капли кодом поверх картинки (глаза ищутся по жёлтому)."""
    k=img.copy(); hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
    yel=((hsv[...,0]>15)&(hsv[...,0]<40)&(hsv[...,1]>120)&(hsv[...,2]>160)).astype(np.uint8)
    n,lab,st,cen=cv2.connectedComponentsWithStats(yel); eyes=sorted(range(1,n),key=lambda i:-st[i,4])[:2]
    body=np.median(img[(hsv[...,2]<50)&(alpha>200)],axis=0)
    if blink>0:
        for i in eyes:
            x,y,w,h=st[i,:4]; cut=int(y-6+(h+12)*blink); m=np.zeros(k.shape[:2],np.uint8)
            cv2.ellipse(m,(int(cen[i][0]),int(cen[i][1])),(w//2+8,h//2+8),0,0,360,255,-1); m[cut:,:]=0; k[m>0]=body
    if vis[0]!="X":
        ex=np.mean([cen[i][0] for i in eyes]); ey=np.mean([cen[i][1] for i in eyes]); eh=np.mean([st[i,3] for i in eyes])
        mx,my=int(ex),int(ey+eh*0.95)
        cv2.ellipse(k,(mx+10,my),(int(ex-min(cen[i][0] for i in eyes))+10,22),0,0,360,body.tolist(),-1,cv2.LINE_AA)   # прячем нарисованную ухмылку
        w,h={"B":(46,8),"C":(58,14),"D":(52,26),"E":(36,24),"F":(24,20)}[vis[0]]
        cv2.ellipse(k,(mx,my),(w,h+int(6*vis[1])),0,0,360,(40,10,36),-1,cv2.LINE_AA); cv2.ellipse(k,(mx,my),(w,h+int(6*vis[1])),0,0,360,(230,120,170),4,cv2.LINE_AA)
    return k
def vis_at(VIS, t):
    for t0,v in VIS:
        i=int(round((t-t0)*FPS))
        if 0<=i<len(v): return v[i]
    return ["X",0.0]
# ---------- монтаж ----------
wr=Writer(f"{out}/pilot_video.mp4"); T=0.0; marks={}
def run(n_frames, frame_fn):
    global T
    for i in range(n_frames): wr.put(frame_fn(i/FPS))
    T+=n_frames/FPS
def prerender(name):
    """Готовый кадр: видео кадр за кадром + его голосовая дорожка (громкость приводится к общей)."""
    global T
    cap=cv2.VideoCapture(f"{pdir}/{name}.mp4"); n=0
    while True:
        ok,f=cap.read()
        if not ok: break
        wr.put(f); n+=1
    a,sr=sf.read(f"{pdir}/{name}.wav",dtype="float32"); a=librosa.resample(a,orig_sr=sr,target_sr=SR) if sr!=SR else a
    a=a/np.sqrt(np.mean(a[np.abs(a)>1e-3]**2))*10**(-20/20); voice.append((T,a)); T+=n/FPS
# 1. Часы: 23:59, стрелка дёргается к 12 и отскакивает. Марк з/к.
m01=L("mark01"); t_jump=0.5; d1=0.7+dur(m01)+0.6; marks["1"]=T
sound(T+t_jump,sfx.ratchet_back(),-14)
def s1(t):
    md=354.0; j=t-t_jump
    if 0<=j<0.25: md=354+6*math.sin(math.pi*min(j/0.08,1)/2) if j<0.08 else 360-6*(1-math.exp(-(j-0.08)/0.03))
    md+=1.2*math.exp(-max(0,j-0.25)/0.08)*math.sin(max(0,j-0.25)*60) if j>0.25 else 0
    return clock_img(md,359.5,1+0.04*t/d1)
say(T+0.7,m01,"Ночная смена. Дело номер один.","MARK"); run(int(d1*FPS),s1)
# 2. Марк читает жалобу (готовый кадр).
marks["2"]=T; sound(T+0.2,sfx.paper(0.5),-24); prerender("shot02")
# 3–4. Чернила, Клякс-лужица (готовый кадр).
marks["3"]=T; sound(T+0.45,sfx.splash(),-16); sound(T+2.1,sfx.blink_wet(),-30); prerender("shot34")
# 5. Пустая кружка. Пауза, затем Марк з/к.
m05=L("mark05"); d5=1.1+dur(m05)+0.5; marks["5"]=T
MUG=DESK[100:620,560:864]
def s5(t): return fill_frame(MUG,(0.5,0.45),1+0.05*t/d5)
say(T+1.1,m05,"Это рабочий вопрос.","MARK"); run(int(d5*FPS),s5)
# 6. Клякс-капля крупно, Марк размыт сзади: перечисляет; «И?»; тихо «…пока…».
k03,m06,k04=L("kly03"),L("mark06"),L("kly04")
t1=0.3; t2=t1+dur(k03)+0.25; t3=t2+dur(m06)+0.3; d6=t3+dur(k04)+0.7; marks["6"]=T
VIS6=[(t1,visemes(k03,SR,FPS,scale=1.17)),(t3,visemes(k04,SR,FPS,scale=1.17))]
MB=cv2.GaussianBlur(MARK1,(0,0),9); MBA=cv2.GaussianBlur(MARK1A,(0,0),9)
def s6(t):
    img=OFF.astype(np.float32).copy(); img=paste(img,MB,MBA,250,330,0.95)
    serious=min(1,max(0,(t-t3+0.2)/0.3)); v=vis_at(VIS6,t)
    blink=1.0 if (t1+dur(k03)+0.1)<=t<(t1+dur(k03)+0.2) else 0.0
    a=kly_face(KS,KA,v if serious<0.5 else ["X",0],blink,t); b=kly_face(KQ,KQA,v if serious>=0.5 else ["X",0],blink,t)
    sq=1+0.02*math.sin(2*math.pi*0.5*t)+(0.04*v[1] if v[0]!="X" else 0)-0.06*min(1,max(0,(t-(t3+dur(k04)-0.3))/0.3))
    sc=0.82; kw=int(1024*sc/sq**0.5); kh=int(1024*sc*sq)
    for img_k,al,wgt in ((a,KA,1-serious),(b,KQA,serious)):
        if wgt<=0: continue
        kk=cv2.resize(img_k,(kw,kh)); aa=(cv2.resize(al,(kw,kh)).astype(np.float32)*wgt).astype(np.uint8)
        img=paste(img,kk,aa,(W-kw)//2,1560-kh,1.0)
    z=1+0.03*t/d6+0.03*max(0,min(1,(t-t3)/1.5)); return fill_frame(np.clip(img,0,255).astype(np.uint8),(0.5,0.75),z)
say(T+t1,k03,"Ты уже ломал часы. Уходил домой. Звонил начальству.","KLY"); say(T+t2,m06,"И?","MARK")
say(T+t3,k04,"И опять сидишь здесь. Ночь не кончится, пока...","KLY"); run(int(d6*FPS),s6)
# 7. Журнал смен крупно: «Смену сдал: М.», пустая графа. Марк з/к.
m07a,m07b=L("mark07a"),L("mark07b"); d7=0.4+dur(m07a)+0.6+dur(m07b)+0.5; marks["7"]=T
LB=logbook(0.0); sound(T+0.1,sfx.paper(0.7),-24)
def s7(t): u=t/d7; return fill_frame(LB,(0.92+0.08*u,0.42),1.6+0.1*u)
say(T+0.4,m07a,"Смену сдали. А принять забыли.","MARK"); say(T+0.4+dur(m07a)+0.6,m07b,"Непорядок.","MARK"); run(int(d7*FPS),s7)
# 8. Подпись, удар часов, стрелка проходит 12.
d8a=1.6; d8=d8a+1.6; marks["8"]=T; sound(T+0.2,sfx.pen_scratch(1.2),-22); sound(T+d8a+0.1,sfx.bell(),-10)
SIG=Image.new("RGBA",(260,90),(0,0,0,0)); ImageDraw.Draw(SIG).text((6,70),"Марк",font=ImageFont.truetype(f"{FONTS}/Caveat-Bold.ttf",64),fill=(38,34,70,255),anchor="ls")
SIG=SIG.rotate(-8,expand=True,resample=Image.BICUBIC)
def s8(t):
    if t<d8a:
        im=Image.fromarray(cv2.cvtColor(HAND,cv2.COLOR_BGR2RGB)); u=min(1,max(0,(t-0.2)/1.2)); w=int(SIG.width*u)
        if w>0: im.paste(SIG.crop((0,0,w,SIG.height)),(NIB[0]-SIG.width+8,NIB[1]-SIG.height+22),SIG.crop((0,0,w,SIG.height)))
        return fill_frame(cv2.cvtColor(np.asarray(im),cv2.COLOR_RGB2BGR),(0.3,0.45),1.15)
    j=t-d8a-0.1; md=354+6*min(1,max(0,j/0.06))+ (2.0*max(0,j-0.06))
    punch=1+0.05*math.exp(-max(0,j)/0.12) if j>=0 else 1.0
    return clock_img(md,359.5+(md-354)/12,punch)
run(int(d8*FPS),s8)
# 9. Кабинет: Марк на стуле, Клякс на столе. Лампа больше не трещит.
k05,m08=L("kly05"),L("mark08"); t1=0.4; t2=t1+dur(k05)+0.35; d9=t2+dur(m08)+0.5; marks["9"]=T
VIS9K=[(t1,visemes(k05,SR,FPS,scale=1.17))]; VIS9M=[(t2,visemes(m08,SR,FPS))]
def office_mark(t, vis, up=0.0):
    img=OFF.astype(np.float32).copy(); fr=M3.frame(vis)
    if up>0: fr=(fr*(1-up)+M3UP*up).astype(np.uint8)
    breath=1+0.006*math.sin(2*math.pi*0.25*t); img=paste(img,fr,M3.alpha,170,int(330-20*(breath-1)*100),1.05)
    return img
def s9(t):
    img=office_mark(t,vis_at(VIS9M,t)); v=vis_at(VIS9K,t)
    k=kly_face(KS,KA,v,0.0,t); sq=1+0.02*math.sin(2*math.pi*0.5*t)+(0.04*v[1] if v[0]!="X" else 0)
    kw=int(1024*0.36/sq**0.5); kh=int(1024*0.36*sq)
    img=paste(img,cv2.resize(k,(kw,kh)),cv2.resize(KA,(kw,kh)),40,1640-kh,1.0)
    return fill_frame(np.clip(img,0,255).astype(np.uint8),(0.5,0.6),1+0.03*t/d9)
say(T+t1,k05,"Триста ночей — и одна подпись?","KLY"); say(T+t2,m08,"Это Бюро. Здесь всё решает подпись.","MARK"); run(int(d9*FPS),s9)
# 10. Журнал: от подписи Марка на строку выше — тот же почерк.
m09,k06=L("mark09"),L("kly06"); d10=0.8+dur(m09)+0.25+dur(k06)+0.5; marks["10"]=T
LB2=logbook(1.0)
def s10(t): u=min(1,t/1.0); u=u*u*(3-2*u); return fill_frame(LB2,(1.0,0.50-0.06*u),1.8)
say(T+0.8,m09,"Почерк мой.","MARK"); say(T+0.8+dur(m09)+0.25,k06,"Не спрашивай.","KLY"); run(int(d10*FPS),s10)
# 11. «Ладно.» — Марк поднимает глаза; «Теперь это моя смена.» — часы 00:01.
m10=L("mark10")
from emphasis import words
ws=words(m10,SR,"Ладно. Теперь это моя смена.",ASR); cut=[e for w,s,e in ws if w=="ладно"]
cut=cut[0]+0.05 if cut else dur(m10)*0.3
p1,p2=m10[:int(cut*SR)],m10[int(cut*SR):]; p2=librosa.effects.trim(p2,top_db=40)[0]
d11a=0.3+dur(p1)+0.7; d11=d11a+dur(p2)+0.9; marks["11"]=T
VIS11=[(0.3,visemes(p1,SR,FPS))]
def s11(t):
    if t<d11a:
        up=min(1,max(0,(t-(0.3+dur(p1)+0.15))/0.12))
        return fill_frame(np.clip(office_mark(t,vis_at(VIS11,t),up),0,255).astype(np.uint8),(0.5,0.6),1.03)
    j=t-d11a; return clock_img(6.0,0.5,1+0.03*j)
say(T+0.3,p1,"Ладно.","MARK"); say(T+d11a+0.2,p2,"Теперь это моя смена.","MARK"); run(int(d11*FPS),s11)
# 12. Титр.
d12=1.8; marks["12"]=T
def s12(t):
    im=Image.new("RGB",(W,H),(18,14,34)); d=ImageDraw.Draw(im); a=min(1,t/0.3)*min(1,(d12-t)/0.4)
    d.text((W/2,H/2),"Дело № 001 закрыто",font=mono,fill=tuple(int(c*a) for c in (240,232,214)),anchor="mm"); return im
run(int(d12*FPS),s12)
wr.close(); TOTAL=T
# ---------- субтитры поверх (кроме готовых кадров 2–4 — у них свои) ----------
# (субтитры уже нарисованы в run? — нет: рисуем вторым проходом, чтобы не трогать готовые кадры)
cap=cv2.VideoCapture(f"{out}/pilot_video.mp4"); wr2=Writer(f"{out}/pilot_video_subs.mp4"); i=0
pre=[(marks["2"],marks["5"])]
while True:
    ok,f=cap.read()
    if not ok: break
    t=i/FPS; pil=Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB))
    if not any(a<=t<b for a,b in pre): subs.draw(pil,t)
    wr2.put(pil); i+=1
wr2.close()
# ---------- звук ----------
n=int(TOTAL*SR)+SR; vo=np.zeros(n,np.float32); fxt=np.zeros(n,np.float32)
for t0,a in voice: i=int(t0*SR); vo[i:i+len(a)]+=a[:max(0,n-i)]
for t0,a in fx: i=int(t0*SR); fxt[i:i+len(a)]+=a[:max(0,n-i)]
amb=sfx.room_tone(TOTAL+1)[:n]*10**(-36/20)
k=0.0; tk=sfx.tick()
while k<marks["12"]:
    i=int(k*SR); fxt[i:i+len(tk)]+=tk*10**(-31/20); k+=1.0
lb=sfx.lamp_buzz(marks["9"]-marks["2"]); i=int(marks["2"]*SR); fxt[i:i+len(lb)]+=lb*10**(-40/20)
lb2=sfx.lamp_buzz(marks["12"]-marks["9"],crackle=False); i=int(marks["9"]*SR); fxt[i:i+len(lb2)]+=lb2*10**(-42/20)
mix=(vo+fxt+amb)[:int(TOTAL*SR)]; mix=mix/np.max(np.abs(mix))*0.89
sf.write(f"{out}/pilot_mix.wav",mix,SR); loud=normalize(f"{out}/pilot_mix.wav",f"{out}/pilot_mix_norm.wav")
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"{out}/pilot_video_subs.mp4","-i",f"{out}/pilot_mix_norm.wav","-c:v","copy",
                "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",f"{out}/S01E01_smena_draft_v1.mp4"],check=True)
json.dump({"total":TOTAL,"shots":{k:round(v,2) for k,v in marks.items()}},open(f"{out}/pilot_timing.json","w"),indent=1)
print("кадры:",{k:round(v,2) for k,v in marks.items()}); print(f"итого {TOTAL:.1f} c")
print(f"громкость: {loud['normalization_type']}, лимитер {loud['limiter_db']} дБ; mp4 {measure(out+'/S01E01_smena_draft_v1.mp4')}")
