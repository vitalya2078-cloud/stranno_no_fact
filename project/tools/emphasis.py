"""Логическое ударение в синтезированной реплике: выделить нужные слова, приглушить ошибочно выделенные.
1) Разметка слов: распознавание Vosk (vosk-model-small-ru, Apache 2.0) с грамматикой из текста реплики.
2) Praat: на выделенном слове тон выше (+st полутонов) и слово чуть длиннее; на приглушённом — тон ближе к медиане.
Применяется к готовому WAV; результат — новый WAV той же реплики."""
import json, re, numpy as np, librosa, parselmouth
from parselmouth.praat import call
_ASR={}
def words(a, sr, text, asr_dir):
    """[(слово, начало, конец)] по времени в записи. Возвращает слова, которые распознаватель нашёл."""
    from vosk import Model, KaldiRecognizer
    if asr_dir not in _ASR: _ASR[asr_dir]=Model(asr_dir)
    w16=librosa.resample(a.astype(np.float32),orig_sr=sr,target_sr=16000)
    pcm=(np.clip(w16,-1,1)*32767).astype(np.int16).tobytes()
    vocab=re.findall(r"[а-яё]+",text.lower())
    rec=KaldiRecognizer(_ASR[asr_dir],16000,json.dumps([" ".join(vocab),"[unk]"],ensure_ascii=False)); rec.SetWords(True)
    rec.AcceptWaveform(pcm); r=json.loads(rec.FinalResult())
    return [(x["word"],x["start"],x["end"]) for x in r.get("result",[])]
def _span(ws, w):
    for x,s,e in ws:
        if x==w: return s,e
    raise ValueError(f"слово «{w}» не найдено в разметке: {[x for x,_,_ in ws]}")
def emphasize(a, sr, ws, emph=(), flatten=(), st=2.5, stretch=1.12, keep=0.4):
    """emph — слова, которые выделить; flatten — слова, с которых снять выделение (тон к медиане, доля keep)."""
    snd=parselmouth.Sound(a.astype(np.float64),sr)
    man=call(snd,"To Manipulation",0.01,70,900)
    pt=call(man,"Extract pitch tier"); dt=call(man,"Extract duration tier")
    pitch=snd.to_pitch(time_step=0.01,pitch_floor=70,pitch_ceiling=900)
    med=call(pitch,"Get quantile",0,0,0.5,"Hertz")
    k=2**(st/12)
    for w in emph:
        s,e=_span(ws,w); r=min(0.04,(e-s)/4)
        call(pt,"Formula",f"if x>={s+r} and x<={e-r} then self*{k} else if x>{s} and x<{s+r} then self*(1+({k}-1)*(x-{s})/{r}) else if x>{e-r} and x<{e} then self*(1+({k}-1)*({e}-x)/{r}) else self fi fi fi")
        call(dt,"Add point",s-0.001,1.0); call(dt,"Add point",s+0.01,stretch); call(dt,"Add point",e-0.01,stretch); call(dt,"Add point",e+0.001,1.0)
    for w in flatten:
        s,e=_span(ws,w)
        call(pt,"Formula",f"if x>={s} and x<={e} then {med}*exp({keep}*ln(self/{med})) else self fi")
    call([pt,man],"Replace pitch tier"); call([dt,man],"Replace duration tier")
    return call(man,"Get resynthesis (overlap-add)").values[0].astype(np.float32)
