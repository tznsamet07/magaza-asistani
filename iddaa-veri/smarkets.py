# Smarkets bahis borsasının herkese açık API'sinden önümüzdeki 36 saatin futbol maçlarını çeker.
# Borsada fiyatı oyuncular belirler, komisyon ~%2; alış-satış ortası gerçek olasılığa çok yakındır.
# Sadece veri olarak kullanılır -> smarkets.json
import json, os, time, datetime, urllib.request, urllib.parse
from ortak import K

API = "https://api.smarkets.com/v3/"
UA = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}

def al(yol):
    for deneme in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + yol, headers=UA), timeout=25) as r:
                return json.load(r)
        except Exception:
            time.sleep(2 + deneme * 3)
    return None

simdi = datetime.datetime.now(datetime.timezone.utc)
son = simdi + datetime.timedelta(hours=36)
olaylar, sayfa = [], "events/?type_scope=single_event&type_domain=football&state=upcoming&limit=50&sort=start_datetime,id"
for _ in range(60):
    j = al(sayfa)
    if not j:
        break
    olaylar += j.get("events", [])
    nxt = (j.get("pagination") or {}).get("next_page")
    if not nxt or not olaylar or olaylar[-1]["start_datetime"] > son.strftime("%Y-%m-%dT%H:%M:%SZ"):
        break
    sayfa = "events/" + nxt
    time.sleep(0.3)
olaylar = [e for e in olaylar if e.get("type") == "football_match" and " vs " in e["name"]]

def parca(xs, n):
    return [xs[i:i + n] for i in range(0, len(xs), n)]

# İstenen pazarlar: maç sonucu, 1.5/2.5/3.5 alt-üst, karşılıklı gol
pazarlar = {}
for p in parca([e["id"] for e in olaylar], 40):
    j = al("events/" + ",".join(p) + "/markets/?limit_by_event=20") or {}
    for m in j.get("markets", []):
        t = m["market_type"]
        ad = {"WINNER_3_WAY": "ms", "BTTS": "kg"}.get(t["name"]) or (("au" + t["param"].replace(".", "")) if t["name"] == "OVER_UNDER" and t.get("param") in ("1.5", "2.5", "3.5") else None)
        if ad:
            pazarlar[m["id"]] = (m["event_id"], ad)
    time.sleep(0.3)

kontrat, fiyat, son_fiyat = {}, {}, {}
for p in parca(list(pazarlar), 60):
    ids = ",".join(p)
    for c in (al("markets/" + ids + "/contracts/") or {}).get("contracts", []):
        kontrat[c["id"]] = (c["market_id"], c["contract_type"]["name"])
    fiyat.update(al("markets/" + ids + "/quotes/") or {})
    for mid, xs in ((al("markets/" + ids + "/last_executed_prices/") or {}).get("last_executed_prices") or {}).items():
        for x in xs:
            son_fiyat[x["contract_id"]] = float(x["last_executed_price"] or 0) / 100
    time.sleep(0.3)

def olasilik(cid):
    # Alış-satış ortası; makas genişse ya da teklif yoksa son işlem fiyatı
    q = fiyat.get(cid) or {}
    b = max((x["price"] for x in q.get("bids", [])), default=None)
    o = min((x["price"] for x in q.get("offers", [])), default=None)
    if b and o and o - b <= 800:
        return (b + o) / 2 / 10000
    return son_fiyat.get(cid) or None

SIRA = {"ms": ["HOME", "DRAW", "AWAY"], "kg": ["YES", "NO"], "au15": ["UNDER", "OVER"], "au25": ["UNDER", "OVER"], "au35": ["UNDER", "OVER"]}
sonuc = {}
for cid, (mid, tip) in kontrat.items():
    eid, ad = pazarlar[mid]
    sonuc.setdefault(eid, {}).setdefault(ad, {})[tip] = olasilik(cid)
cikti = []
for e in olaylar:
    s = sonuc.get(e["id"], {})
    kayit = {"ev": e["name"].split(" vs ")[0], "dep": e["name"].split(" vs ", 1)[1], "t": e["start_datetime"], "lig": e.get("full_slug", "").split("/")[3] if e.get("full_slug", "").count("/") > 3 else ""}
    for ad, sira in SIRA.items():
        p = [s.get(ad, {}).get(x) for x in sira]
        if all(p) and 0.9 < sum(p) < 1.1:
            kayit[ad] = [round(x / sum(p), 4) for x in p]
    if "ms" in kayit:
        cikti.append(kayit)
with open(os.path.join(K, "smarkets.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": simdi.isoformat(), "maclar": cikti}, f, ensure_ascii=False, separators=(",", ":"))
print(len(olaylar), "Smarkets maçı,", len(cikti), "fiyatlı")
