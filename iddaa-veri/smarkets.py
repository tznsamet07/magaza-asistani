# Smarkets bahis borsasının herkese açık API'sinden önümüzdeki 36 saatin futbol ve basketbol maçlarını çeker.
# Borsada fiyatı oyuncular belirler, komisyon ~%2; alış-satış ortası gerçek olasılığa çok yakındır.
# Sadece veri olarak kullanılır -> smarkets.json
import json, os, time, datetime, urllib.request, collections
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

def parca(xs, n):
    return [xs[i:i + n] for i in range(0, len(xs), n)]

simdi = datetime.datetime.now(datetime.timezone.utc)
son = (simdi + datetime.timedelta(hours=36)).strftime("%Y-%m-%dT%H:%M:%SZ")

def olaylari_al(alan, tip):
    olaylar, sayfa = [], f"events/?type_scope=single_event&type_domain={alan}&state=upcoming&limit=50&sort=start_datetime,id"
    for _ in range(60):
        j = al(sayfa)
        if not j:
            break
        olaylar += j.get("events", [])
        nxt = (j.get("pagination") or {}).get("next_page")
        if not nxt or not olaylar or olaylar[-1]["start_datetime"] > son:
            break
        sayfa = "events/" + nxt
        time.sleep(0.3)
    return [e for e in olaylar if (e.get("type") == tip or (e.get("type") or "").endswith("_match")) and " vs " in e["name"]]

def pazar_adi(alan, t):
    if alan == "football":
        if t["name"] == "WINNER_3_WAY":
            return "ms"
        if t["name"] == "BTTS":
            return "kg"
        if t["name"] == "OVER_UNDER" and t.get("param") in ("1.5", "2.5", "3.5"):
            return "au" + t["param"].replace(".", "")
        return None
    # Basketbol: maç sonucu (uzatma dahil) ve toplam sayı çizgileri
    if t["name"] in ("WINNER_2_WAY", "MONEYLINE", "WINNER_INCLUDING_OVERTIME"):
        return "ms"
    if "OVER_UNDER" in t["name"] and t.get("param"):
        try:
            if float(t["param"]) > 60:
                return "t" + t["param"]
        except ValueError:
            return None
    return None

def cek(alan, tip):
    olaylar = olaylari_al(alan, tip)
    pazarlar, turler = {}, collections.Counter()
    # Basketbolda çeyrek pazarları çok; maç sonucu ve toplam ilk 40'a girmeyebiliyor
    n = 40 if alan == "football" else 10
    for p in parca([e["id"] for e in olaylar], n):
        j = al("events/" + ",".join(p) + f"/markets/?limit_by_event={40 if alan == 'football' else 200}") or {}
        for m in j.get("markets", []):
            turler[m["market_type"]["name"]] += 1
            ad = pazar_adi(alan, m["market_type"])
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

    sonuc = {}
    for cid, (mid, ctip) in kontrat.items():
        eid, ad = pazarlar[mid]
        sonuc.setdefault(eid, {}).setdefault(ad, {})[ctip] = olasilik(cid)
    cikti = []
    for e in olaylar:
        s = sonuc.get(e["id"], {})
        kayit = {"ev": e["name"].split(" vs ")[0], "dep": e["name"].split(" vs ", 1)[1], "t": e["start_datetime"],
                 "lig": e.get("full_slug", "").split("/")[3] if e.get("full_slug", "").count("/") > 3 else ""}
        for ad, v in s.items():
            if ad == "ms":
                sira = ["HOME", "DRAW", "AWAY"] if alan == "football" else ["HOME", "AWAY"]
            else:
                sira = ["UNDER", "OVER"] if alan == "football" or ad.startswith("t") else ["YES", "NO"]
                if ad == "kg":
                    sira = ["YES", "NO"]
            p = [v.get(x) for x in sira]
            if all(p) and 0.9 < sum(p) < 1.1:
                kayit[ad] = [round(x / sum(p), 4) for x in p]
        if alan == "basketball":
            kayit["toplam"] = {ad[1:]: kayit.pop(ad) for ad in [a for a in kayit if a.startswith("t") and a[1:2].isdigit()]}
        if "ms" in kayit or kayit.get("toplam"):
            cikti.append(kayit)
    print(alan, len(olaylar), "olay,", len(cikti), "fiyatlı; pazar türleri:", dict(turler.most_common(12)))
    return cikti

futbol = cek("football", "football_match")
basket = cek("basketball", "basketball_match")
with open(os.path.join(K, "smarkets.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": simdi.isoformat(), "maclar": futbol, "basket": basket}, f, ensure_ascii=False, separators=(",", ":"))
