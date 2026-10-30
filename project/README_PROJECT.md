# Проект рендера «Странно, но факт» — S01E01 «Квартира № 14»

Архив проекта, который Claude ведёт в своей временной рабочей среде. В новом чате приложи этот архив вместе с документацией — работа продолжится с того же места.

## Что внутри
- `S01E01_kvartira14/03_audio/voice/voice_direction.json` — голоса персонажей и режиссура каждой реплики (фразы, темп, паузы, громкость), тайминг кадров.
- `S01E01_kvartira14/03_audio/voice/S01E01_*_v1.wav` — озвученные реплики (48 кГц), версия 1.
- `S01E01_kvartira14/05_previews/` — черновая озвучка (wav, mp4) и тайминг субтитров (json).
- `S01E01_kvartira14/render/voice_draft.py` — синтез и черновой ролик.
- `tools/` — ударения по словарю (`stresslib.py`, `vosk_stress.py`, `homographs.py`), отбор дублей и обработка голоса (`voicelib.py`).
- `fonts/` — PT Sans Bold и PT Mono (полные версии) с лицензиями OFL.

## Чего нет (скачивается заново)
- Модель Vosk TTS `vosk-model-tts-ru-0.9-multi` (~750 МБ, Apache 2.0): https://alphacephei.com/vosk/models/vosk-model-tts-ru-0.9-multi.zip
- Python-пакеты: `vosk-tts`, `librosa`, `soundfile`, `praat-parselmouth`, `scipy`, `pillow`, `numpy`; ffmpeg.

## Важно
- Синтез каждый раз даёт немного разные дубли. Утверждённые реплики — это сами wav-файлы. Пересинтезировать только то, что нужно изменить.
- Ударения — только из словаря модели (см. `CLAUDE_INSTRUCTIONS.md`, §7). `voice_script_silero_markup_obsolete.txt` — устаревшая ручная разметка, оставлена для истории, не использовать.
