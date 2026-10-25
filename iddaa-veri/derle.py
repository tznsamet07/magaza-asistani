# football-data.co.uk CSV'lerini analiz aracının okuduğu sıkıştırılmış veri.json'a çevirir
import csv, glob, json, os, datetime, io

ALANLAR = ["t", "h", "a", "gh", "ga", "ih", "ia", "kh", "ka", "sh", "sa", "ou", "ua", "bu", "ba", "cu", "ca", "hk"]
SINIR = datetime.date.today() - datetime.timedelta(days=3 * 365)
ULKE = {"Argentina": "ARG", "Austria": "AUT", "Brazil": "BRA", "Denmark": "DNK", "Finland": "FIN", "Ireland": "IRL",
        "Japan": "JPN", "Norway": "NOR", "Poland": "POL", "Romania": "ROU", "Sweden": "SWE", "Switzerland": "SWZ", "USA": "USA"}

def sayi(v):
    try:
        return round(float(v), 2) if v not in ("", None) else None
    except ValueError:
        return None

def tarih(s):
    g, a, y = (int(x) for x in s.strip().split("/"))
    return datetime.date(y + 2000 if y < 100 else y, a, g)

ligler = {}
KLASOR = os.path.dirname(os.path.abspath(__file__))
for yol in sorted(glob.glob(os.path.join(KLASOR, "*.csv"))):
    if os.path.basename(yol) == "fixtures.csv":
        continue
    with open(yol, encoding="utf-8-sig", errors="replace") as f:
        for r in csv.DictReader(io.StringIO(f.read())):
            try:
                d = tarih(r["Date"])
            except (KeyError, ValueError):
                continue
            if d < SINIR:
                continue
            lig = r.get("Div") or ULKE.get(r.get("Country", ""), "")
            ev, dep = r.get("HomeTeam") or r.get("Home"), r.get("AwayTeam") or r.get("Away")
            gh, ga = sayi(r.get("FTHG", r.get("HG"))), sayi(r.get("FTAG", r.get("AG")))
            if not lig or not ev or gh is None or ga is None:
                continue
            L = ligler.setdefault(lig, {"takimlar": [], "maclar": []})
            ix = lambda t: L["takimlar"].index(t) if t in L["takimlar"] else (L["takimlar"].append(t) or len(L["takimlar"]) - 1)
            hy, ay = sayi(r.get("HY")), sayi(r.get("AY"))
            kart_h = None if hy is None else hy + (sayi(r.get("HR")) or 0)
            kart_a = None if ay is None else ay + (sayi(r.get("AR")) or 0)
            L["maclar"].append([(d - datetime.date(1970, 1, 1)).days, ix(ev.strip()), ix(dep.strip()), gh, ga,
                sayi(r.get("HTHG")), sayi(r.get("HTAG")), sayi(r.get("HC")), sayi(r.get("AC")), kart_h, kart_a,
                sayi(r.get("Avg>2.5")), sayi(r.get("Avg<2.5")), sayi(r.get("B365>2.5")), sayi(r.get("B365<2.5")),
                sayi(r.get("AvgC>2.5")), sayi(r.get("AvgC<2.5")), (r.get("Referee") or "").strip() or None])
for L in ligler.values():
    L["maclar"].sort(key=lambda m: m[0])
# Yaklaşan maçlar: [lig, gün, ev, deplasman, Avg>2.5, Avg<2.5]
fikstur = []
yol = os.path.join(KLASOR, "fixtures.csv")
if os.path.exists(yol):
    with open(yol, encoding="utf-8-sig", errors="replace") as f:
        for r in csv.DictReader(io.StringIO(f.read())):
            try:
                d = tarih(r["Date"])
            except (KeyError, ValueError):
                continue
            if r.get("Div") in ligler and d >= datetime.date.today() - datetime.timedelta(days=1):
                fikstur.append([r["Div"], (d - datetime.date(1970, 1, 1)).days, r["HomeTeam"].strip(), r["AwayTeam"].strip(),
                    sayi(r.get("Avg>2.5")), sayi(r.get("Avg<2.5"))])
cikti = {"alanlar": ALANLAR, "guncelleme": datetime.date.today().isoformat(), "ligler": ligler, "fikstur": fikstur}
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "veri.json"), "w") as f:
    json.dump(cikti, f, separators=(",", ":"))
print(len(fikstur), "yaklaşan maç")
print({k: len(v["maclar"]) for k, v in ligler.items()})
