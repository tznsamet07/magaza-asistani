# bulten.py ve canli.py'nin ortak yardımcıları
import json, os, difflib, unicodedata, re, datetime, gzip

K = os.path.dirname(os.path.abspath(__file__))
TR = datetime.timezone(datetime.timedelta(hours=3))

def oku_json(ad):
    yol = os.path.join(K, ad)
    if not os.path.exists(yol):
        return None
    ac = gzip.open if ad.endswith(".gz") else open
    try:
        with ac(yol, "rt", encoding="utf-8") as f:
            return json.load(f)
    except (ValueError, OSError):
        return None

def sade(s):
    s = unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode()
    s = re.sub(r"\b(fc|cf|sc|ac|afc|fk|sk|cd|ud|sd|as|us|ss|calcio|club|de|the|u21|u23|ii|b)\b", " ", s)
    s = s.replace("utd", "united").replace("man.", "manchester").replace("ath.", "athletic")
    return re.sub(r"[^a-z0-9]", "", s)

def benzer(a, b):
    a, b = sade(a), sade(b)
    if not a or not b:
        return 0
    if a in b or b in a:
        return 0.9
    return difflib.SequenceMatcher(None, a, b).ratio()


def marjsiz(o):
    # Oranlardan bahisçi payını ayırıp ihtimal çıkarır. 2'li pazarda (alt/üst) payı orantılı dağıtmak en isabetlisi.
    # 3'lü pazarda (MS) Shin yöntemi: bahisçi payın çoğunu sürpriz sonuçlara yüklüyor, orantılı dağıtım favorinin
    # ihtimalini düşük çıkarıyordu (iddaa 1.349 maç: %60+ favoriler %68 denip %74 tuttu; Shin ile %71 / %70).
    if not o or not all(o):
        return None
    q = [1 / x for x in o]
    B = sum(q)
    if len(o) != 3:
        return [x / B for x in q]
    lo, hi = 0.0, 0.4
    for _ in range(50):
        z = (lo + hi) / 2
        p = [((z * z + 4 * (1 - z) * x * x / B) ** 0.5 - z) / (2 * (1 - z)) for x in q]
        lo, hi = (z, hi) if sum(p) > 1 else (lo, z)
    s = sum(p)
    return [x / s for x in p]


# Bildirim kanalı ve avantaj eşiği (bildir.py, karne.py)
KONU = "iddaa-analiz-7e4d51316682"
ESIK = 0.05  # dış kaynaklı gerçek olasılıkta en az %5 avantaj
# Gerçek olasılıkta kaynak ağırlıkları (uygulamadaki varsayılanla aynı)
W = {"pinnacle": 4, "borsa": 3, "piyasa": 2, "dk": 1, "polymarket": 1}

def gercek_k(k, pz):
    # kiyas.json kaydındaki kaynaklardan ağırlıklı ortalama olasılık
    ks = [(k[a][pz], W[a]) for a in W if k.get(a, {}).get(pz)]
    if not ks:
        return None
    w = sum(x[1] for x in ks)
    return [sum(x[0][i] * x[1] for x in ks) / w for i in range(len(ks[0][0]))]
