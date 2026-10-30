"""Картинки героев для Remotion: вырезка с фона + совмещение вариантов (рты, моргание, эмоции) → public/*.png (RGBA).
Запуск из project/: python3 -I remotion/tools/prep_assets.py"""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "tools"))
import cv2, numpy as np
from shotlib import cutout, align
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..")
A=f"{ROOT}/assets/S01E01_smena/CH-01/"; O=f"{ROOT}/remotion/public/"
base=cv2.imread(A+"ch01_base.png"); al=cutout(base)
out={"mark_base":base,"mark_blink":align(cv2.imread(A+"ch01_eyes_closed.png"),base,(250,300,750,700)),
     "mark_surprised":align(cv2.imread(A+"ch01_surprised.png"),base,(250,300,750,800))}
for k in ("open_small","a","o"): out["mark_m_"+k]=align(cv2.imread(A+f"ch01_mouth_{k}.png"),base,(250,300,750,800))
for n,img in out.items(): cv2.imwrite(O+n+".png",np.dstack([img,al]))
print("готово:",list(out))
