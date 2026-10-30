import sys, re
from vosk_tts import Model
from vosk_tts.g2p import convert
m=Model(model_path=sys.argv[1])
VL="аеёиоуыэюя"
def stressed_view(word):
    w=word.lower()
    src="словарь" if w in m.dic else "правило"
    ph=(m.dic[w] if w in m.dic else convert(w)).split()
    vph=[p for p in ph if p[-1] in "01" and p[:-1] in ("a","o","u","i","e","y","ae","oo","ee")] or [p for p in ph if p[-1] in "01"]
    marks=[p[-1]=="1" for p in vph]
    out=[]; k=0
    for ch in w:
        if ch in VL:
            st = marks[k] if k<len(marks) else False; k+=1
            out.append(ch.upper() if st else ch)
        else: out.append(ch)
    return "".join(out), src, sum(marks), len([c for c in w if c in VL])
lines=[l.strip().split("|") for l in open(sys.argv[2],encoding="utf-8") if l.strip()]
problems=[]
for role,num,text in lines:
    plain=text.replace("+","")
    words=re.findall(r"[а-яё]+(?:-[а-яё]+)?", plain.lower())
    view=[]
    for w in words:
        v,src,nst,nv=stressed_view(w)
        flag="" if (nst==1 or nv<=1) else ("  ⚠нет ударения" if nst==0 else "  ⚠несколько")
        if src=="правило": flag+="  (нет в словаре)"
        view.append(v+flag)
        if flag.strip(): problems.append((role+num,w,flag.strip()))
    print(f"{role}{num}: "+" · ".join(view))
print("\nПроблемы:", problems if problems else "нет")
