# Avantajlı bahis çıkınca telefona bildirim gönderir (ntfy.sh, ücretsiz).
# Telefonda ntfy uygulamasını kurup KONU kanalına abone olmak yeterli.
# Her seçenek bir kez bildirilir; avantajı belirgin büyürse yeniden bildirilir. -> bildirim.json
import json, os, datetime, urllib.request, base64
from ortak import oku_json, K, TR

KONU = "iddaa-analiz-7e4d51316682"
ESIK = 0.05          # dış kaynaklı gerçek olasılıkta en az %5 avantaj
ESIK_GECIKME = 0.03  # borsa oynadı, iddaa durdu: %3 yeter
AD = {"ms": ["MS 1", "MS X", "MS 2"], "au25": ["2.5 Alt", "2.5 Üst"], "kg": ["KG Var", "KG Yok"]}
W = {"borsa": 3, "piyasa": 2, "dk": 1}

def marjsiz(o):
    if not o or not all(o):
        return None
    t = sum(1 / x for x in o)
    return [1 / x / t for x in o]

def gercek(m, k):
    # Uygulamadaki gibi: Smarkets 3, piyasa ortalaması 2, DraftKings 1 ağırlıkla
    ks = []
    sm, f, dk = m.get("sm") or {}, m.get("fd") or {}, m.get("dkf") or {}
    if sm.get(k):
        ks.append((sm[k], W["borsa"]))
    p = marjsiz(f.get({"ms": "avgMs", "au25": "avgAu"}.get(k, "-")))
    if p:
        ks.append((p, W["piyasa"]))
    p = marjsiz(dk.get(k))
    if p:
        ks.append((p, W["dk"]))
    if not ks:
        return None
    w = sum(x[1] for x in ks)
    return [sum(x[0][i] * x[1] for x in ks) / w for i in range(len(ks[0][0]))]

bulten = oku_json("bulten.json") or {}
kayit = oku_json("bildirim.json") or {"gonderilen": {}}
simdi = datetime.datetime.now(TR)
simdi_ms = int(simdi.timestamp() * 1000)
yeni = []
for m in bulten.get("futbol", []):
    if m["t"] <= simdi_ms + 5 * 60e3:
        continue
    gec = {(x["k"], x["i"]): x for x in m.get("gecikme") or []}
    for k in ("ms", "au25", "kg"):
        if not m.get(k):
            continue
        p = gercek(m, k)
        if not p or len(p) != len(m[k]["o"]):
            continue
        for i, o in enumerate(m[k]["o"]):
            e = p[i] * o - 1
            g = gec.get((k, i))
            if e < (ESIK_GECIKME if g else ESIK):
                continue
            anahtar = f'{m["id"]}|{k}|{i}'
            once = kayit["gonderilen"].get(anahtar)
            if once and e < once["e"] + 0.03:
                continue
            yeni.append((e, m, AD[k][i], o, p[i], g, anahtar))

def gonder(baslik, metin, oncelik="default"):
    try:
        istek = urllib.request.Request("https://ntfy.sh/" + KONU, data=metin.encode("utf-8"), method="POST",
                                       headers={"Title": "=?UTF-8?B?" + base64.b64encode(baslik.encode("utf-8")).decode() + "?=", "Priority": oncelik, "Tags": "soccer"})
        urllib.request.urlopen(istek, timeout=15).read()
        return True
    except Exception as x:
        print("bildirim gönderilemedi:", x)
        return False

# Bir çalışmada en fazla 8 bildirim; kalanlar sonraki çalışmalarda gider
yeni.sort(key=lambda x: -x[0])
for e, m, ad, o, p, g, anahtar in yeni[:8]:
    saat = datetime.datetime.fromtimestamp(m["t"] / 1000, TR).strftime("%d.%m %H:%M")
    # Kasanın 1/4 Kelly'si, en fazla %3
    pay = min(e / (o - 1) * 0.25, 0.03)
    metin = f"{m['ev']} – {m['dep']} ({saat}, {m['lig']})\n{ad} iddaa {o:.2f} · gerçek ihtimal %{p * 100:.0f} · avantaj +%{e * 100:.0f}\nÖnerilen: kasanın %{pay * 100:.1f}'i"
    if g:
        metin += f"\nBorsa {g['dk']} dakikada %{g['p0'] * 100:.0f} → %{g['p1'] * 100:.0f} oldu, iddaa oranı hâlâ {g['o1']:.2f}. Oran düşmeden bak."
    # Gönderilemeyen bildirim kaydedilmez, bir sonraki çalışmada tekrar denenir
    if gonder(("İddaa geç kaldı: " if g else "Avantaj: ") + ad, metin, "high" if g else "default"):
        kayit["gonderilen"][anahtar] = {"e": round(e, 4), "t": m["t"]}
kayit["gonderilen"] = {a: v for a, v in kayit["gonderilen"].items() if v["t"] > simdi_ms - 2 * 864e5}
kayit["zaman"] = simdi.strftime("%Y-%m-%d %H:%M")
with open(os.path.join(K, "bildirim.json"), "w", encoding="utf-8") as f:
    json.dump(kayit, f, ensure_ascii=False, separators=(",", ":"))
print(len(yeni), "yeni bildirim")
