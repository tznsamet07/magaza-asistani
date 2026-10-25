#!/usr/bin/env python3
"""Kaynak dosyaları (kaynak/) tek dosyaya birleştirir: index.html.
Uygulama (APK) GitHub'dan yalnızca index.html'i indirdiği için her şey tek dosyada olmalı.
Kullanım: python3 derle.py"""
import re,os,sys
KOK=os.path.dirname(os.path.abspath(__file__))
K=os.path.join(KOK,'kaynak')
def oku(p):
    tam=os.path.join(K,p)
    if p.endswith('/'):  # klasör: içindeki dosyalar ad sırasıyla tek bloğa eklenir
        return ''.join(oku(p+a) for a in sorted(os.listdir(tam)) if not a.startswith('.'))
    with open(tam,encoding='utf-8',newline='') as f:return f.read()
def dahil(m):
    yol,tag,attr=m.group(1),m.group(2),m.group(3) or ''
    return '<%s%s>%s</%s>'%(tag,attr,oku(yol),tag)
sayfa=oku('sayfa.html')
html=re.sub(r'<!-- @dahil (\S+) (script|style)((?: [^>]*?)?) -->',dahil,sayfa)
cikti=sys.argv[1] if len(sys.argv)>1 else os.path.join(KOK,'index.html')
with open(cikti,'w',encoding='utf-8',newline='') as f:f.write(html)
print(cikti,len(html.encode('utf-8')),'bayt')
