"""Синтез выбранных реплик в новую версию. Утверждённые WAV никогда не перезаписываются.
Запуск: python3 -I synth_lines.py <vosk_model_dir> <tools_dir> <episode_dir> <ID> [<ID> ...]
Каждая реплика пишется в <EP>_<ID>_v<N>.wav (+ .json с границами фраз), где N — следующая свободная версия.
Чтобы послушать новую версию в черновике: render_preview.py ... --use <ID>=<N>.
Утвердить версию — поменять "take" у реплики в voice_direction.json (после решения владельца)."""
import sys, os, json, glob, re, numpy as np, soundfile as sf, librosa
vosk_p, tools, ep, *ids = sys.argv[1:]
if not ids: sys.exit("укажи ID реплик, например KLY_07 MARK_03")
sys.path.insert(0, tools)
from stresslib import Stress
from voicelib import VoskVoice, expand_range, door, pitch_report, SR
from vosk_tts import Model, Synth
VD=f"{ep}/03_audio/voice"; EP=os.path.basename(os.path.normpath(ep)).split("_")[0]
D=json.load(open(f"{VD}/voice_direction.json",encoding="utf-8"))
lines={L["id"]:L for L in D["lines"]}
unknown=[i for i in ids if i not in lines]
if unknown: sys.exit(f"нет таких реплик: {unknown}")
vm=Model(model_path=vosk_p); V=VoskVoice(Synth(vm),Stress(vm))
def next_version(lid):
    have=[int(re.search(r"_v(\d+)\.wav$",p).group(1)) for p in glob.glob(f"{VD}/{EP}_{lid}_v*.wav")]
    return max(have,default=0)+1
for lid in ids:
    L=lines[lid]; cfg=D["voices"][lid.split("_")[0]]
    post=(lambda a,s=cfg["pitch_st"]: librosa.effects.pitch_shift(a,sr=SR,n_steps=s)) if cfg["pitch_st"] else None
    chunks=[]; phr=[]; clean=[]; t=0.0
    for item in L["phrases"]:
        if isinstance(item,(int,float)):
            chunks.append(np.zeros(int(item*SR),np.float32)); t+=item; continue
        text,rate=item
        a=V.best(text,cfg["speaker_id"],rate,n=cfg["takes"],post=post); clean.append(V.last_info["clean"])
        if cfg["expand"]: a=expand_range(a,cfg["expand"])
        phr.append([round(t,4),round(t+len(a)/SR,4),text]); t+=len(a)/SR; chunks.append(a)
    a=np.concatenate(chunks)
    if cfg["post"]=="door": a=door(a)
    rms=np.sqrt(np.mean(a[np.abs(a)>1e-4]**2)); a=a/rms*10**(-20/20)*10**(L.get("gain_db",0)/20)
    n=next_version(lid); base=f"{VD}/{EP}_{lid}_v{n}"
    sf.write(base+".wav",a,SR)
    json.dump(dict(id=lid,version=n,duration=round(len(a)/SR,4),phrases=phr,clean_takes=clean,
                   direction=L["phrases"],voice=cfg),open(base+".json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
    print(f"{lid:8} -> v{n}  {len(a)/SR:5.2f} c  чистых дублей по фразам {clean}  отчёт {pitch_report(a)}")
