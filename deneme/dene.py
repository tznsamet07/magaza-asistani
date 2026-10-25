import urllib.request, json, gzip
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "Accept": "application/json", "Accept-Encoding": "gzip"}
def al(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25)
        b = r.read()
        if r.headers.get("Content-Encoding") == "gzip": b = gzip.decompress(b)
        return r.status, b
    except Exception as e:
        return getattr(e, "code", str(e)), (e.read() if hasattr(e, "read") else b"")
out = open("sonuc.txt", "w")
def kaydet(ad, u):
    s, b = al(u)
    out.write(f"\n=== {ad} {u} -> {s} {len(b)}\n{b[:1200]!r}\n")
    open(ad, "wb").write(b[:4000000])
    return s, b
S = "https://api.smarkets.com/v3/"
s, b = kaydet("sm-olay.json", S + "events/?type_scope=single_event&type_domain=football&state=upcoming&limit=100&sort=start_datetime,id")
try:
    ids = [e["id"] for e in json.loads(b)["events"]][:30]
    s, b = kaydet("sm-pazar.json", S + "events/" + ",".join(ids) + "/markets/?limit_by_event=5")
    mids = [m["id"] for m in json.loads(b)["markets"]][:60]
    kaydet("sm-kontrat.json", S + "markets/" + ",".join(mids) + "/contracts/")
    kaydet("sm-fiyat.json", S + "markets/" + ",".join(mids) + "/quotes/")
    kaydet("sm-son.json", S + "markets/" + ",".join(mids) + "/last_executed_prices/")
except Exception as x:
    out.write(f"smarkets hata {x}\n")
kaydet("pm-spor.json", "https://gamma-api.polymarket.com/sports")
kaydet("pm-olay.json", "https://gamma-api.polymarket.com/events?tag_slug=soccer&closed=false&limit=100&order=startDate&ascending=true")
kaydet("ka-seri.json", "https://api.elections.kalshi.com/trade-api/v2/series?category=Sports")
kaydet("ka-olay.json", "https://api.elections.kalshi.com/trade-api/v2/events?status=open&with_nested_markets=true&limit=200&series_ticker=KXEPLGAME")
kaydet("elo.csv", "http://api.clubelo.com/Fixtures")
