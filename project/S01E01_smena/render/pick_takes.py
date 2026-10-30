"""Выбор лучшего дубля каждой реплики по замерам тона (меньше скачков, меньше выбросов) → <out>/<id>.wav.
Запуск: python3 -I pick_takes.py <takes_dir> <out_dir>   (дубли: <id>_1.wav, <id>_2.wav, …)
Замеры — подсказка; окончательный выбор на слух делает владелец."""
import sys, os, glob, re, shutil, json, numpy as np, soundfile as sf, librosa
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..","tools"))
from voicelib import pitch_report
src, dst = sys.argv[1:3]; os.makedirs(dst, exist_ok=True); report={}
groups={}
for p in glob.glob(f"{src}/*_[0-9].wav"): groups.setdefault(re.sub(r"_\d\.wav$","",os.path.basename(p)),[]).append(p)
for lid,ps in sorted(groups.items()):
    scored=[]
    for p in ps:
        a,sr=sf.read(p,dtype="float32"); r=pitch_report(librosa.resample(a,orig_sr=sr,target_sr=48000)); scored.append(((r["jumps"],r["outside"]),p,r))
    best=sorted(scored)[0]; shutil.copy(best[1],f"{dst}/{lid}.wav"); report[lid]={"take":os.path.basename(best[1]),"report":best[2]}
    print(lid,"←",os.path.basename(best[1]),best[2])
json.dump(report,open(f"{dst}/picked.json","w"),ensure_ascii=False,indent=1)
