# Haftalık karne: her pazartesi sabahı geçen 7 günün özetini telefona gönderir (ntfy).
# Uygulama aynı hesabı kiyas.json'dan kendisi de yapar. -> karne.json (en son gönderilen hafta)
import json, os, datetime, urllib.request, base64
from ortak import oku_json, K, TR, KONU, ESIK, gercek_k

simdi = datetime.datetime.now(TR)
hafta = simdi.strftime("%G-%V")
kayit = oku_json("karne.json") or {}
if simdi.weekday() != 0 or simdi.hour < 9 or kayit.get("hafta") == hafta:
    raise SystemExit(0)

kiyas = oku_json("kiyas.json") or {"maclar": {}}
bas = (simdi - datetime.timedelta(days=7)).timestamp() * 1000
maclar = [m for m in kiyas["maclar"].values() if m.get("sonuc") and m["t"] >= bas]
bahis = kazanan = 0
kar = 0.0
brier = {}
for m in maclar:
    h, a = m["sonuc"]
    y = {"ms": 0 if h > a else 1 if h == a else 2, "au25": 1 if h + a > 2.5 else 0}
    for kay, v in m.get("k", {}).items():
        if v.get("ms"):
            b = brier.setdefault(kay, [0, 0.0])
            b[0] += 1; b[1] += sum((p - (1 if i == y["ms"] else 0)) ** 2 for i, p in enumerate(v["ms"]))
    for pz in ("ms", "au25"):
        o = (m.get("o") or {}).get(pz)
        p = gercek_k(m.get("k", {}), pz)
        if not o or not p or len(o) != len(p):
            continue
        for i, x in enumerate(o):
            if p[i] * x - 1 >= ESIK:
                bahis += 1
                if i == y[pz]:
                    kazanan += 1; kar += x - 1
                else:
                    kar -= 1
AD = {"borsa": "Smarkets", "piyasa": "Dünya piyasası", "dk": "DraftKings", "iddaa": "İddaa", "halk": "Halk"}
sira = sorted(((v[1] / v[0], k) for k, v in brier.items() if v[0] >= 10))
metin = f"Geçen hafta {len(maclar)} maç sonuçlandı.\n"
metin += f"Avantaj sinyali: {bahis} bahis, {kazanan} tuttu, kâr/zarar {kar:+.1f} birim ({kar / bahis * 100:+.0f}%).\n" if bahis else "Avantaj sinyali çıkmadı.\n"
if sira:
    metin += "En isabetli kaynak: " + ", ".join(f"{AD.get(k, k)} {b:.3f}" for b, k in sira[:3]) + " (Brier, düşük = iyi)."
try:
    urllib.request.urlopen(urllib.request.Request("https://ntfy.sh/" + KONU, data=metin.encode("utf-8"), method="POST",
        headers={"Title": "=?UTF-8?B?" + base64.b64encode("Haftalık karne".encode()).decode() + "?=", "Tags": "bar_chart"}), timeout=15).read()
    kayit = {"hafta": hafta, "metin": metin, "zaman": simdi.strftime("%Y-%m-%d %H:%M")}
    with open(os.path.join(K, "karne.json"), "w", encoding="utf-8") as f:
        json.dump(kayit, f, ensure_ascii=False)
    print("karne gönderildi")
except Exception as x:
    print("karne gönderilemedi:", x)
