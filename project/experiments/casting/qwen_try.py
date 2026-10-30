"""Проба Qwen3-TTS (Apache 2.0): VoiceDesign — голос и интонация по описанию; Base — клон голоса по образцу.
Запуск (в отдельном окружении qwen-venv): python -I qwen_try.py <models_dir> <out_dir> <jobs.json>
jobs.json: [{"name": "...", "text": "...", "instruct": "..."}                     — VoiceDesign
            {"name": "...", "text": "...", "ref_audio": "a.wav", "ref_text": "..."}] — клон (Base)"""
import sys, json, time, torch, soundfile as sf
from qwen_tts import Qwen3TTSModel
mroot, out, jobs = sys.argv[1:4]
torch.set_num_threads(4)
models={}
def model(kind):
    if kind not in models:
        models.clear(); __import__("gc").collect()      # две модели 1,7B в float32 не помещаются в 15 ГБ памяти
        t0=time.time(); models[kind]=Qwen3TTSModel.from_pretrained(f"{mroot}/Qwen3-TTS-12Hz-1.7B-{kind}", device_map="cpu", dtype=torch.float32)
        print(f"загрузка {kind}: {time.time()-t0:.0f} c", flush=True)
    return models[kind]
for j in json.load(open(jobs,encoding="utf-8")):
    t0=time.time()
    if "ref_audio" in j:
        wavs,sr=model("Base").generate_voice_clone(text=j["text"], language="Russian", ref_audio=j["ref_audio"], ref_text=j["ref_text"], do_sample=True)
    else:
        wavs,sr=model("VoiceDesign").generate_voice_design(text=j["text"], language="Russian", instruct=j["instruct"], do_sample=True)
    sf.write(f"{out}/{j['name']}.wav", wavs[0], sr)
    print(f"{j['name']}: {len(wavs[0])/sr:.2f} c звука за {time.time()-t0:.0f} c", flush=True)
