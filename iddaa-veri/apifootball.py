# API-Football ücretsiz katmanı (günde 100 sorgu): bugünkü ve yarınki maçların sakat / cezalı oyuncu listesi.
# Anahtar GitHub'da APIFOOTBALL_KEY sırrında durur; yoksa hiçbir şey yapmaz.
# Sorgu idaresi: 3 saatte bir, gün başına en çok 3 sorgu (fixtures, injuries?date, gerekirse injuries?ids) -> günde ~50 sorgu.
# Bülten maçlarıyla takım adı + başlama saatinden eşleştirilir -> apifootball.json
import json, os, datetime, urllib.request, urllib.parse
from ortak import oku_json, benzer, K, TR

ANAHTAR = os.environ.get("APIFOOTBALL_KEY")
if not ANAHTAR:
    raise SystemExit(0)
API = "https://v3.football.api-sports.io/"
simdi = datetime.datetime.now(TR)
simdi_ms = simdi.timestamp() * 1000
eski = oku_json("apifootball.json") or {}
if eski.get("ms", 0) > simdi_ms - 3 * 3600e3:
    raise SystemExit(0)

hatalar, kalan = [], None
def al(yol, **p):
    global kalan
    u = API + yol + "?" + urllib.parse.urlencode(p)
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"x-apisports-key": ANAHTAR, "User-Agent": "Mozilla/5.0"}), timeout=40) as r:
            kalan = r.headers.get("x-ratelimit-requests-remaining", kalan)
            d = json.load(r)
    except Exception as x:
        hatalar.append(f"{yol}: {x}"); return []
    if d.get("errors"):
        # Ücretsiz plan bazı sezonları kapatıyor olabilir: hata kaydedilir, uygulama "veri yok" der
        hatalar.append(f"{yol}: {d['errors']}")
    return d.get("response") or []

bulten = [m for m in (oku_json("bulten.json") or {}).get("futbol", []) if simdi_ms - 3 * 3600e3 < m["t"] < simdi_ms + 36 * 3600e3]
eksik, teshis = {}, {}
for g in sorted({datetime.datetime.fromtimestamp(m["t"] / 1000, TR).strftime("%Y-%m-%d") for m in bulten})[:2]:
    fik = al("fixtures", date=g, timezone="Europe/Istanbul")
    sak = al("injuries", date=g)
    if not fik:
        continue
    oyuncu = {}
    for s in sak:
        fid, tid = s.get("fixture", {}).get("id"), s.get("team", {}).get("id")
        p = s.get("player", {})
        oyuncu.setdefault((fid, tid), []).append([p.get("name"), p.get("type"), p.get("reason")])
    for m in bulten:
        en, puan = None, 0
        for f in fik:
            t = (f.get("fixture", {}).get("timestamp") or 0) * 1000
            if abs(t - m["t"]) > 3 * 3600e3:
                continue
            h, a = f["teams"]["home"], f["teams"]["away"]
            b1, b2 = benzer(m["ev"], h["name"]), benzer(m["dep"], a["name"])
            if min(b1, b2) >= 0.6 and b1 + b2 > puan:
                en, puan = f, b1 + b2
            elif max(b1, b2) >= 0.9 and min(b1, b2) >= 0.3 and abs(t - m["t"]) <= 30 * 60e3 and 1.4 > puan:
                en, puan = f, 1.4
        if en and puan >= 1.4:
            eksik[str(m["id"])] = {"fid": en["fixture"]["id"], "hid": en["teams"]["home"]["id"], "aid": en["teams"]["away"]["id"]}
    teshis[g] = {"fikstur": len(fik), "sakat_tarihle": len(sak)}
    # Tarihle sorgu boş dönerse (11-12 Kasım'da 95 maçta 0 kayıt) maç numarasıyla sorulur: ids=1-2-3 (en çok 20)
    if not sak:
        ids = [str(v["fid"]) for v in eksik.values() if not v.get("bakildi")][:20]
        for i in range(0, len(ids), 20):
            for s in al("injuries", ids="-".join(ids[i:i + 20])):
                fid, tid = s.get("fixture", {}).get("id"), s.get("team", {}).get("id")
                p = s.get("player", {})
                oyuncu.setdefault((fid, tid), []).append([p.get("name"), p.get("type"), p.get("reason")])
        teshis[g]["sakat_idle"] = sum(len(v) for v in oyuncu.values())
    for v in eksik.values():
        if "hid" in v:
            v["ev"], v["dep"], v["bakildi"] = oyuncu.get((v["fid"], v.pop("hid")), []), oyuncu.get((v["fid"], v.pop("aid")), []), True

with open(os.path.join(K, "apifootball.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": simdi.strftime("%Y-%m-%d %H:%M"), "ms": simdi_ms, "kalan": kalan, "hata": hatalar[:5], "teshis": teshis, "maclar": eksik},
              f, ensure_ascii=False, separators=(",", ":"))
print("API-Football:", len(eksik), "maç eşleşti,", sum(len(v["ev"]) + len(v["dep"]) for v in eksik.values()), "eksik oyuncu; kalan sorgu", kalan, "; hata", hatalar[:2], teshis)
