"""Черновой голос рассказчика (Vosk male_1, бесплатно) по абзацам + пословные тайминги (распознавание Vosk).
Запуск из project/: python3 -I facts/E01_black_hole/synth_draft.py → remotion/public/e01_voice.wav, remotion/src/e01_timing.json"""
import sys, os, json, numpy as np, soundfile as sf
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),"..",".."))
sys.path.insert(0,f"{ROOT}/tools")
from stresslib import Stress
from voicelib import VoskVoice, SR
from emphasis import words
from vosk_tts import Model, Synth
S=json.load(open(os.path.join(os.path.dirname(__file__),"script.json"),encoding="utf-8"))
vm=Model(model_path=f"{ROOT}/../models/vosk-model-tts-ru-0.9-multi"); V=VoskVoice(Synth(vm),Stress(vm))
ASR=f"{ROOT}/../models/vosk-model-small-ru-0.22"
out=[]; t=0.15; chunks=[np.zeros(int(0.15*SR),np.float32)]
for i,p in enumerate(S["paras"]):
    a=V.best(p,4,1.12,n=4)                                  # бодрее: темп 1.12
    a=a/np.sqrt(np.mean(a[np.abs(a)>1e-4]**2))*10**(-20/20)
    ws=[(w,round(t+s,3),round(t+e,3)) for w,s,e in words(a,SR,p,ASR)]
    out.append({"text":p,"t0":round(t,3),"t1":round(t+len(a)/SR,3),"words":ws}); chunks.append(a); t+=len(a)/SR
    gap=0.35; chunks.append(np.zeros(int(gap*SR),np.float32)); t+=gap
    print(i,f"{len(a)/SR:.2f} c",len(ws),"слов")
v=np.concatenate(chunks); v=v/np.max(np.abs(v))*0.89
sf.write(f"{ROOT}/remotion/public/e01_voice.wav",v,SR)
json.dump({"total":round(t+0.6,3),"paras":out},open(f"{ROOT}/remotion/src/e01_timing.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("итого",round(t,2),"c")
