import re
VL="аеёиоуыэюя"
OVERRIDES={"уже":"уж+е"}   # омографы: выбор по смыслу из вариантов словаря
class Stress:
    def __init__(self, vosk_model):
        self.m=vosk_model
    def stressed_index(self, w):
        if w in OVERRIDES: return OVERRIDES[w].index("+")  # позиция буквы после '+'
        ph=self.m.dic.get(w)
        if ph is None: return None
        vs=[x for x in ph.split() if x[-1] in "01" and x[0] in "aoueiy"]
        k=0
        for i,ch in enumerate(w):
            if ch in VL:
                if k<len(vs) and vs[k][-1]=="1": return i
                k+=1
        return None
    def silero(self, text):
        def rep(mo):
            w=mo.group(0); lw=w.lower()
            if sum(c in VL for c in lw)<2: return w
            i=self.stressed_index(lw)
            if i is None: raise ValueError(f"нет ударения для «{w}»")
            if lw in OVERRIDES: i=OVERRIDES[lw].index("+")
            return w[:i]+"+"+w[i:]
        return re.sub(r"[А-Яа-яЁё]+", rep, text)
    def vosk(self, text):
        t=text.replace("…","...")
        for w,f in OVERRIDES.items():
            t=re.sub(rf"(?<![А-Яа-яЁё]){w}(?![А-Яа-яЁё])", f, t, flags=re.I)
        return t
