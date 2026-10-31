#!/bin/bash
# Сведение (+ хвост TAIL с; 6-й аргумент): голос (−14 LUFS) + музыка под голосом (≈ −24…−26 LUFS, вырез 250–500 Гц, сайдчейн −6…−8 дБ) + звуки (максимум 4).
#   tools/mix.sh public/voice.mp3 public/music.wav public/sfx.wav public/mix.wav [секунда_поворота]
# В момент поворота музыка почти уходит (−18 дБ на 2 с): тишина работает.
set -e
V=$1; M=$2; S=$3; OUT=$4; TW=${5:-0}; TAIL=${6:-2.5}   # TAIL — секунды завершающей картинки после голоса (музыка доигрывает и затухает)
VD=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V"); DUR=$(python3 -c "print($VD+$TAIL)")
ffmpeg -y -loglevel error -i "$V" -i "$M" -i "$S" -filter_complex "
[0:a]aresample=48000,apad=whole_dur=$DUR,highpass=f=80,acompressor=threshold=-20dB:ratio=2:attack=15:release=200,asplit=2[v][vk];
[1:a]aresample=48000,atrim=0:$DUR,equalizer=f=380:t=q:w=1.2:g=-4,volume=0.16,volume='if(between(t,$TW,$TW+2),0.13,1)':eval=frame,afade=t=out:st=$(python3 -c "print($DUR-1.8)"):d=1.8[m];
[m][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];
[2:a]aresample=48000,volume=${SFXV:-0.22}[s];
[v][md][s]amix=inputs=3:duration=first:normalize=0[a]" -map "[a]" -ar 48000 /tmp/_mix_raw.wav
# двухпроходная ЛИНЕЙНАЯ нормализация: без «качелей» громкости в паузах (динамический loudnorm поднимал уровень в тишине)
J=$(ffmpeg -hide_banner -i /tmp/_mix_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -loglevel error -i /tmp/_mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 "$OUT"
ffmpeg -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
