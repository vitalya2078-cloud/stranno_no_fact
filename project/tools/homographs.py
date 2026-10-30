import sys, re, collections
dic_path, script = sys.argv[1], sys.argv[2]
words=set()
lines=[l.strip().split("|") for l in open(script,encoding="utf-8") if l.strip()]
for _,_,t in lines: words|=set(re.findall(r"[а-яё]+(?:-[а-яё]+)?", t.replace("+","").lower()))
var=collections.defaultdict(list)
with open(dic_path,encoding="utf-8") as f:
    for line in f:
        p=line.split(None,2)
        if len(p)==3 and p[0] in words: var[p[0]].append((float(p[1]),p[2].strip()))
VL="аеёиоуыэюя"
def show(w,ph):
    vs=[x for x in ph.split() if x[-1] in "01" and x[0] in "aoueiy"]; k=0; o=""
    for ch in w:
        if ch in VL: o+= ch.upper() if (k<len(vs) and vs[k][-1]=="1") else ch; k+=1
        else: o+=ch
    return o
for w in sorted(words):
    vv=var.get(w,[])
    forms=sorted({show(w,ph) for _,ph in vv})
    if len(forms)>1:
        ctx=[f"{r}{n}" for r,n,t in lines if re.search(rf"(?<![а-яё]){w}(?![а-яё])", t.replace('+','').lower())]
        print(f"{w:10} варианты: "+", ".join(f"{show(w,ph)} ({p})" for p,ph in vv)+f"   | реплики: {', '.join(ctx)}")
missing=[w for w in sorted(words) if w not in var]
print("нет в словаре:", missing)
