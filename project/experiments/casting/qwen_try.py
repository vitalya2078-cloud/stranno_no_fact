"""Проба Qwen3-TTS VoiceDesign (Apache 2.0): голос по описанию + интонация по инструкции.
Запуск (в отдельном окружении qwen-venv): python -I qwen_try.py <model_dir> <out_dir> <jobs.json>
jobs.json: [{"name": "...", "text": "...", "instruct": "..."}]"""
import sys, json, time, torch, soundfile as sf
from qwen_tts import Qwen3TTSModel
mdir, out, jobs = sys.argv[1:4]
torch.set_num_threads(4)
t0=time.time(); m=Qwen3TTSModel.from_pretrained(mdir, device_map="cpu", dtype=torch.float32)
print(f"загрузка {time.time()-t0:.0f} c", flush=True)
for j in json.load(open(jobs,encoding="utf-8")):
    t0=time.time()
    wavs,sr=m.generate_voice_design(text=j["text"], language="Russian", instruct=j["instruct"], do_sample=True)
    sf.write(f"{out}/{j['name']}.wav", wavs[0], sr)
    print(f"{j['name']}: {len(wavs[0])/sr:.2f} c звука за {time.time()-t0:.0f} c, {sr} Гц", flush=True)
