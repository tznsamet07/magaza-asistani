# API-Football ücretsiz katmanı (günde 100 sorgu): bugünkü ve yarınki maçların sakat / cezalı oyuncu listesi.
# Anahtar GitHub'da APIFOOTBALL_KEY sırrında durur; yoksa hiçbir şey yapmaz.
# Sorgu idaresi: 3 saatte bir; gün başına fixtures + injuries?date, ayrıca kupondaki en çok 8 maç için injuries?fixture -> günde ~100 sorguya kadar.
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
    for v in eksik.values():
        if "ev" not in v:
            v["ev"], v["dep"] = oyuncu.get((v["fid"], v["hid"]), []), oyuncu.get((v["fid"], v["aid"]), [])

# Ücretsiz planda ids= kapalı, date= ile de kayıt gelmedi (11-13 Kasım). Kupondaki maçlar tek tek fixture= ile sorulur
# (en çok 8 sorgu; günde ~80 sorgu). Gelmezse plan bu sezonun sakatlık verisini vermiyor demektir.
kup = (oku_json("kuponlar.json") or {}).get("gunler", {}).get(simdi.strftime("%Y-%m-%d"), {}).get("kuponlar", [])
kup_id = list(dict.fromkeys(s["id"] for kp in kup for s in kp["secim"] if s["t"] > simdi_ms))[:8]
n = 0
for mid in kup_id:
    v = eksik.get(mid)
    if not v:
        continue
    r = al("injuries", fixture=v["fid"]); n += 1
    for x in r:
        tid, p = x.get("team", {}).get("id"), x.get("player", {})
        (v["ev"] if tid == v["hid"] else v["dep"] if tid == v["aid"] else []).append([p.get("name"), p.get("type"), p.get("reason")])
teshis["kupon_sorgu"] = n
teshis["kupon_kayit"] = sum(len(eksik[m]["ev"]) + len(eksik[m]["dep"]) for m in kup_id if m in eksik)
for v in eksik.values():
    v.pop("hid", None); v.pop("aid", None)

with open(os.path.join(K, "apifootball.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": simdi.strftime("%Y-%m-%d %H:%M"), "ms": simdi_ms, "kalan": kalan, "hata": hatalar[:5], "teshis": teshis, "maclar": eksik},
              f, ensure_ascii=False, separators=(",", ":"))
print("API-Football:", len(eksik), "maç eşleşti,", sum(len(v["ev"]) + len(v["dep"]) for v in eksik.values()), "eksik oyuncu; kalan sorgu", kalan, "; hata", hatalar[:2], teshis)
