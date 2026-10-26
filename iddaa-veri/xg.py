# Understat'tan büyük 5 lig + Rusya için xG (beklenen gol). Ücretsiz, herkese açık.
# Takımın son 10 maçta ürettiği ve yediği xG, gerçek golleriyle karşılaştırılır: gol > xG ise takım şanslı gidiyor olabilir.
# Understat'ın kendi maç tahmini (galibiyet/beraberlik/mağlubiyet) de kaydedilir.
# Ham veri 6 saatte bir çekilir (xg-ham.json); bültenle eşleştirme her çalışmada yapılır. -> xg.json
import json, os, re, codecs, datetime, urllib.request, collections
from ortak import oku_json, benzer, K, TR

LIGLER = ["EPL", "La_liga", "Bundesliga", "Serie_A", "Ligue_1", "RFPL"]
simdi = datetime.datetime.now(datetime.timezone.utc)
sezon = simdi.year if simdi.month >= 7 else simdi.year - 1
eski = oku_json("xg.json") or {}

def al(lig):
    # Önce Understat'ın JSON uç noktası, olmazsa sayfadaki gömülü veri
    for u, h in ((f"https://understat.com/getLeagueData/{lig}/{sezon}", {"X-Requested-With": "XMLHttpRequest"}), (f"https://understat.com/league/{lig}/{sezon}", {})):
        try:
            istek = urllib.request.Request(u, headers=dict(h, **{"User-Agent": "Mozilla/5.0", "Referer": f"https://understat.com/league/{lig}"}))
            with urllib.request.urlopen(istek, timeout=30) as r:
                metin = r.read().decode("utf-8", "replace")
        except Exception as x:
            print(lig, u, "alınamadı:", x)
            continue
        try:
            j = json.loads(metin)
            if j.get("dates"):
                return j["dates"]
        except ValueError:
            pass
        m = re.search(r"datesData\s*=\s*JSON\.parse\('(.*?)'\)", metin)
        if m:
            return json.loads(codecs.decode(m.group(1), "unicode_escape"))
        print(lig, u, "veri bulunamadı")
    return None

ham = oku_json("xg-ham.json") or {}
if not eski.get("cekim") or simdi - datetime.datetime.fromisoformat(eski["cekim"]) > datetime.timedelta(hours=6) or os.environ.get("GITHUB_EVENT_NAME") == "workflow_dispatch":
    yeni = {}
    for lig in LIGLER:
        d = al(lig)
        if d:
            yeni[lig] = d
    if yeni:
        ham = {**ham, **yeni}
        eski["cekim"] = simdi.isoformat()
        # Ham veri ayrı dosyada; uygulamaya sadece özet gömülür
        with open(os.path.join(K, "xg-ham.json"), "w", encoding="utf-8") as f:
            json.dump(ham, f, ensure_ascii=False, separators=(",", ":"))
    print(len(yeni), "lig Understat'tan çekildi")

# Takım özetleri: son 10 maç (tüm) ve son 5
takim, gelecek = {}, []
for lig, maclar in ham.items():
    gecmis = collections.defaultdict(list)
    for m in sorted(maclar, key=lambda x: x.get("datetime", "")):
        try:
            t = datetime.datetime.fromisoformat(m["datetime"]).replace(tzinfo=datetime.timezone.utc)
            h, a = m["h"]["title"], m["a"]["title"]
            if m.get("isResult"):
                xh, xa, gh, ga = float(m["xG"]["h"]), float(m["xG"]["a"]), int(m["goals"]["h"]), int(m["goals"]["a"])
                gecmis[h].append((xh, xa, gh, ga, 1)); gecmis[a].append((xa, xh, ga, gh, 0))
            elif t > simdi - datetime.timedelta(hours=3) and m.get("forecast"):
                f = m["forecast"]
                gelecek.append({"lig": lig, "ev": h, "dep": a, "t": t, "tahmin": [round(float(f["w"]), 3), round(float(f["d"]), 3), round(float(f["l"]), 3)]})
        except (KeyError, ValueError, TypeError):
            continue
    for ad, xs in gecmis.items():
        s = xs[-10:]
        n = len(s)
        takim[ad] = {"lig": lig, "n": n, "xg": round(sum(x[0] for x in s) / n, 2), "xga": round(sum(x[1] for x in s) / n, 2),
                     "g": round(sum(x[2] for x in s) / n, 2), "ga": round(sum(x[3] for x in s) / n, 2),
                     "son": [[round(x[0], 1), round(x[1], 1), x[2], x[3], x[4]] for x in xs[-5:]]}

# Bültenle eşleştir
bulten = oku_json("bulten.json") or {}
eslesen = {}
for m in bulten.get("futbol", []):
    bas = datetime.datetime.fromtimestamp(m["t"] / 1000, datetime.timezone.utc)
    en, puan = None, 0
    for g in gelecek:
        if abs((g["t"] - bas).total_seconds()) > 4 * 3600:
            continue
        b1, b2 = benzer(m["ev"], g["ev"]), benzer(m["dep"], g["dep"])
        if min(b1, b2) >= 0.6 and b1 + b2 > puan:
            en, puan = g, b1 + b2
    if en and puan >= 1.4:
        eslesen[str(m["id"])] = {"lig": en["lig"], "ev": en["ev"], "dep": en["dep"], "tahmin": en["tahmin"]}

# Understat'ın tahmini de kaynak karşılaştırmasına girer (sadece maç başlamadan)
kiyas = oku_json("kiyas.json")
if kiyas and eslesen:
    sm = int(simdi.timestamp() * 1000)
    for i, e in eslesen.items():
        k = kiyas["maclar"].get(i)
        if k and k["t"] > sm and k.get("k") is not None:
            k["k"]["understat"] = {"ms": e["tahmin"]}
    with open(os.path.join(K, "kiyas.json"), "w", encoding="utf-8") as f:
        json.dump(kiyas, f, ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(K, "xg.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": datetime.datetime.now(TR).strftime("%Y-%m-%d %H:%M"), "cekim": eski.get("cekim"),
               "takim": takim, "maclar": eslesen}, f, ensure_ascii=False, separators=(",", ":"))
print(len(takim), "takım,", len(gelecek), "yaklaşan maç,", len(eslesen), "bültenle eşleşti")
