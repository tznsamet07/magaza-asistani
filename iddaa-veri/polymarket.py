# Polymarket tahmin piyasası: futbol ve basketbol maçlarının fiyatları (fiyat = ihtimal). Herkese açık, anahtar gerekmez.
# Sadece veri olarak kullanılır. Ham olaylar 30 dakikada bir çekilir. -> polymarket.json
import json, os, re, time, datetime, urllib.request, urllib.parse
from ortak import oku_json, K

API = "https://gamma-api.polymarket.com/"
UA = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
simdi = datetime.datetime.now(datetime.timezone.utc)
MIN_HACIM = 1000   # dolar

def al(yol):
    for deneme in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + yol, headers=UA), timeout=25) as r:
                return json.load(r)
        except Exception as x:
            hata = x
            time.sleep(2 + deneme * 3)
    print("alınamadı:", yol, hata)
    return None

def liste(x):
    # Polymarket bazı alanları JSON metni olarak veriyor
    if isinstance(x, str):
        try:
            return json.loads(x)
        except ValueError:
            return []
    return x or []

def olaylar(etiket):
    out = []
    for sayfa in range(20):
        j = al("events?" + urllib.parse.urlencode({"tag_slug": etiket, "closed": "false", "active": "true", "limit": 100, "offset": sayfa * 100}))
        if not j:
            break
        out += j
        if len(j) < 100:
            break
        time.sleep(0.3)
    return out

def mac_cozumle(e, uc_yollu):
    # Maç olayı: "A vs. B" başlıklı; pazarlar "A kazanır mı", "Berabere mi", "B kazanır mı" (Evet fiyatı = ihtimal)
    baslik = e.get("title") or ""
    m = re.match(r"^(.+?)\s+vs\.?\s+(.+?)(?:\s+-\s+.*)?$", baslik)
    if not m:
        return None
    ev, dep = m.group(1).strip(), m.group(2).strip()
    bas = e.get("startTime") or e.get("endDate") or e.get("startDate")
    p = {"ev": None, "x": None, "dep": None}
    hacim = 0
    for mk in e.get("markets") or []:
        if mk.get("closed"):
            continue
        sonuclar, fiyatlar = liste(mk.get("outcomes")), [float(f) for f in liste(mk.get("outcomePrices")) or []]
        if len(sonuclar) != 2 or len(fiyatlar) != 2:
            continue
        hacim += float(mk.get("volumeNum") or mk.get("volume") or 0)
        soru = (mk.get("groupItemTitle") or mk.get("question") or "").lower()
        evet = fiyatlar[[s.lower() for s in sonuclar].index("yes")] if "yes" in [s.lower() for s in sonuclar] else None
        if evet is None:
            # İki yollu pazar: sonuçlar takım adları
            if not uc_yollu and sonuclar[0] and sonuclar[1]:
                a, b = sonuclar
                if ev.lower()[:5] in a.lower() or a.lower()[:5] in ev.lower():
                    p["ev"], p["dep"] = fiyatlar[0], fiyatlar[1]
                elif ev.lower()[:5] in b.lower() or b.lower()[:5] in ev.lower():
                    p["ev"], p["dep"] = fiyatlar[1], fiyatlar[0]
            continue
        if "draw" in soru or "tie" in soru:
            p["x"] = evet
        elif ev.lower()[:6] in soru or soru[:6] in ev.lower():
            p["ev"] = evet
        elif dep.lower()[:6] in soru or soru[:6] in dep.lower():
            p["dep"] = evet
    if uc_yollu:
        if None in p.values():
            return None
        o = [p["ev"], p["x"], p["dep"]]
    else:
        if p["ev"] is None or p["dep"] is None:
            return None
        o = [p["ev"], p["dep"]]
    t = sum(o)
    # Az işlem gören pazarın fiyatı güvenilmez; bitmiş ya da tarihi geçmiş maçlar alınmaz
    if not 0.85 < t < 1.15 or hacim < MIN_HACIM or not bas or bas < (simdi - datetime.timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M"):
        return None
    return {"ev": ev, "dep": dep, "t": bas, "ms": [round(x / t, 4) for x in o], "hacim": round(hacim)}

eski = oku_json("polymarket.json") or {}
try:
    yas = simdi - datetime.datetime.fromisoformat(eski["zaman"])
except (KeyError, ValueError, TypeError):
    yas = datetime.timedelta(days=1)
if yas < datetime.timedelta(minutes=25) and os.environ.get("GITHUB_EVENT_NAME") != "workflow_dispatch":
    raise SystemExit(0)

futbol, basket = [], []
for etiket, hedef, uc in (("soccer", futbol, True), ("basketball", basket, False)):
    ham = olaylar(etiket)
    for e in ham:
        x = mac_cozumle(e, uc)
        if x:
            hedef.append(x)
    print(etiket, len(ham), "olay,", len(hedef), "maç fiyatlı; örnek başlıklar:", [e.get("title") for e in ham[:6]])
    if ham and not hedef:
        e = ham[0]
        print("örnek:", e.get("title"), "| pazarlar:", [(m.get("question"), m.get("outcomes"), m.get("outcomePrices")) for m in (e.get("markets") or [])[:4]])

with open(os.path.join(K, "polymarket.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": simdi.isoformat(), "futbol": futbol, "basket": basket}, f, ensure_ascii=False, separators=(",", ":"))
