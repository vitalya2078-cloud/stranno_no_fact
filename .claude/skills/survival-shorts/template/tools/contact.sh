#!/bin/bash
# Контактный лист: кадр каждую секунду → сетка 6 колонок (для самопроверки «5 слабых мест»).
#   tools/contact.sh out/draft.mp4 checks/contact.png
set -e
mkdir -p /tmp/_cs && rm -f /tmp/_cs/*.png
ffmpeg -y -loglevel error -i "$1" -vf "fps=1,scale=180:-1,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6" /tmp/_cs/%03d.png
python3 - "$2" <<'PY'
import glob,sys
from PIL import Image
fs=sorted(glob.glob('/tmp/_cs/*.png')); im=[Image.open(f) for f in fs]; w,h=im[0].size; c=6; r=(len(im)+c-1)//c
W=Image.new('RGB',(w*c,h*r),(20,20,20))
for i,x in enumerate(im): W.paste(x,((i%c)*w,(i//c)*h))
W.save(sys.argv[1]); print(sys.argv[1], len(im),'кадров')
PY
