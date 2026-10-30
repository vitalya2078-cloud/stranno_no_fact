# Проект рендера «Странно, но факт» — S01E01 «Квартира № 14»

Архив проекта, который Claude ведёт в своей временной рабочей среде. В новом чате приложи этот архив вместе с документацией — работа продолжится с того же места.

## Что внутри
- `S01E01_kvartira14/03_audio/voice/voice_direction.json` — голоса персонажей и режиссура каждой реплики (фразы, темп, паузы, громкость), тайминг кадров.
- `S01E01_kvartira14/03_audio/voice/S01E01_<ID>_v<N>.wav` — озвученные реплики (48 кГц) и рядом `.json` с границами фраз (по ним ставятся субтитры). Утверждённая версия каждой реплики — поле `"take"` в `voice_direction.json`.
- `S01E01_kvartira14/05_previews/` — тайминг субтитров (json). Черновые wav/mp4 в git не хранятся, пересобираются.
- `S01E01_kvartira14/render/synth_lines.py` — синтез выбранных реплик в новую версию (`_v2`, `_v3`…), старые WAV не трогает.
- `S01E01_kvartira14/render/render_preview.py` — черновой ролик из готовых WAV, без синтеза; двухпроходная нормализация громкости.
- `tools/` — ударения по словарю (`stresslib.py`, `vosk_stress.py`, `homographs.py`), отбор дублей и обработка голоса (`voicelib.py`), громкость (`loudness.py`).
- `fonts/` — PT Sans Bold и PT Mono (полные версии) с лицензиями OFL.

## Чего нет (скачивается заново)
- Модель Vosk TTS `vosk-model-tts-ru-0.9-multi` (~750 МБ, Apache 2.0): https://alphacephei.com/vosk/models/vosk-model-tts-ru-0.9-multi.zip
- Python-пакеты: `vosk-tts`, `librosa`, `soundfile`, `praat-parselmouth`, `scipy`, `pillow`, `numpy`; ffmpeg.

## Команды (из папки `project/`)
```bash
# черновик из утверждённых версий (без модели Vosk)
python3 -I S01E01_kvartira14/render/render_preview.py fonts tools S01E01_kvartira14 --tag current
# новые дубли отдельных реплик -> S01E01_<ID>_v2.wav (нужна модель Vosk)
python3 -I S01E01_kvartira14/render/synth_lines.py <vosk_model_dir> tools S01E01_kvartira14 MARK_03 KLY_07
# послушать кандидатов в черновике, не меняя утверждённое
python3 -I S01E01_kvartira14/render/render_preview.py fonts tools S01E01_kvartira14 --use MARK_03=2 --use KLY_07=2 --tag try1
```
Утвердить кандидата — поменять `"take"` реплики в `voice_direction.json` после решения владельца.

## Громкость
Норма черновика и мастера: около −14 LUFS, истинный пик ≤ −1,5 dBTP (`tools/loudness.py`). У синтезированной речи высокий пик-фактор (18–21 дБ), поэтому перед линейным проходом loudnorm стоит лимитер; глубину среза пиков рендер печатает в отчёте. Для черновика v1 — до 11,4 дБ на самых громких пиках (реплика жильца). Как это звучит, оценивает владелец; для мастера цепочку (компрессор/лимитер) утвердить на слух.

## Важно
- Синтез каждый раз даёт немного разные дубли. Утверждённые реплики — это сами wav-файлы. Пересинтезировать только то, что нужно изменить.
- Ударения — только из словаря модели (см. `CLAUDE_INSTRUCTIONS.md`, §7). `voice_script_silero_markup_obsolete.txt` — устаревшая ручная разметка, оставлена для истории, не использовать.
