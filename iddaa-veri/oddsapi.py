# The Odds API ücretsiz katmanı (ayda 500 kredi): Pinnacle ve Betfair borsası oranları. Sadece veri olarak kullanılır.
# Anahtar GitHub'da ODDS_API_KEY sırrında durur; yoksa hiçbir şey yapmaz.
# Kredi idaresi: günde bir kez (16:00 TR'den sonra), sadece önümüzdeki 30 saatte maçı olan liglerden MS ve 2.5 çekilir
# (lig başına 2 kredi). Lig listesi ve maç takvimi uç noktaları kredi harcamaz. -> oddsapi.json
import json, os, datetime, urllib.request, urllib.parse
from ortak import oku_json, K, TR

ANAHTAR = os.environ.get("ODDS_API_KEY")
if not ANAHTAR:
    raise SystemExit(0)
API = "https://api.the-odds-api.com/v4/"
LIGLER = ["soccer_epl", "soccer_spain_la_liga", "soccer_germany_bundesliga", "soccer_italy_serie_a", "soccer_france_ligue_one",
          "soccer_turkey_super_league", "soccer_uefa_champs_league", "soccer_uefa_europa_league", "soccer_netherlands_eredivisie",
          "soccer_portugal_primeira_liga", "basketball_euroleague", "basketball_nba"]
simdi = datetime.datetime.now(TR)
eski = oku_json("oddsapi.json") or {}
if eski.get("gun") == simdi.strftime("%Y-%m-%d") or simdi.hour < 16:
    raise SystemExit(0)

kalan = None
def al(yol, **p):
    global kalan
    u = API + yol + "?" + urllib.parse.urlencode(dict(p, apiKey=ANAHTAR))
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
            kalan = r.headers.get("x-requests-remaining", kalan)
            return json.load(r)
    except Exception as x:
        print("alınamadı:", yol, x)
        return None

def marjsiz(o):
    if not o or not all(o):
        return None
    t = sum(1 / x for x in o)
    return [round(1 / x / t, 4) for x in o]

son = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
futbol, basket = [], []
for lig in LIGLER:
    takvim = al(f"sports/{lig}/events", commenceTimeTo=son)   # kredi harcamaz
    if not takvim:
        continue
    if kalan is not None and int(float(kalan)) < 10:
        print("kredi azaldı, durdu"); break
    oranlar = al(f"sports/{lig}/odds", regions="eu", markets="h2h,totals", bookmakers="pinnacle,betfair_ex_eu", oddsFormat="decimal", commenceTimeTo=son) or []
    for e in oranlar:
        kayit = {"ev": e["home_team"], "dep": e["away_team"], "t": e["commence_time"], "lig": lig}
        # Önce Pinnacle, yoksa Betfair
        for bm in sorted(e.get("bookmakers", []), key=lambda b: b["key"] != "pinnacle"):
            for mk in bm.get("markets", []):
                o = {x["name"]: x for x in mk.get("outcomes", [])}
                if mk["key"] == "h2h" and "ms" not in kayit:
                    sira = [e["home_team"], "Draw", e["away_team"]] if lig.startswith("soccer") else [e["home_team"], e["away_team"]]
                    if all(s in o for s in sira):
                        kayit["ms"] = marjsiz([o[s]["price"] for s in sira]); kayit["kaynak"] = bm["key"]
                if mk["key"] == "totals" and "Over" in o and "Under" in o:
                    c = o["Over"].get("point")
                    if lig.startswith("soccer") and c == 2.5 and "au25" not in kayit:
                        kayit["au25"] = marjsiz([o["Under"]["price"], o["Over"]["price"]])
                    elif lig.startswith("basketball") and c:
                        kayit.setdefault("toplam", {}).setdefault(str(c), marjsiz([o["Under"]["price"], o["Over"]["price"]]))
        if kayit.get("ms"):
            (futbol if lig.startswith("soccer") else basket).append(kayit)
print(len(futbol), "futbol,", len(basket), "basketbol Pinnacle/Betfair; kalan kredi", kalan)
with open(os.path.join(K, "oddsapi.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": simdi.isoformat(), "gun": simdi.strftime("%Y-%m-%d"), "kalan": kalan, "futbol": futbol, "basket": basket}, f, ensure_ascii=False, separators=(",", ":"))
