# Nesine'nin herkese açık iddaa bülteninden (nesine.json) günün futbol ve basketbol maçlarını çıkarır,
# football-data fikstürüyle eşleştirir ve oran hareketini tutar -> bulten.json
import json, os, csv, io, difflib, unicodedata, re, datetime, gzip

from ortak import oku_json, sade, benzer, K, TR

def sayi(v):
    try:
        x = float(v)
        return x if x > 1 else None
    except (TypeError, ValueError):
        return None

def pazar(mk, mtid):
    m = mk.get(mtid)
    if not m:
        return None
    o = [x.get("O") for x in sorted(m["OCA"], key=lambda x: x["N"])]
    if any(not x or x <= 1 for x in o):
        return None
    return {"c": m.get("SOV", 0), "o": o, "id": m.get("ID")}

ham = oku_json("nesine.json")
if ham is None:
    raise SystemExit("nesine.json yok")
ligler = {l["LID"]: l.get("UVN") or l["N"] for l in ham["sg"].get("LA", [])}

# football-data fikstürü (piyasa ortalaması, Betfair borsası)
fikstur = []
yol = os.path.join(K, "fixtures.csv")
if os.path.exists(yol):
    with open(yol, encoding="utf-8-sig", errors="replace") as f:
        for r in csv.DictReader(io.StringIO(f.read())):
            try:
                g, a, y = (int(x) for x in r["Date"].split("/"))
                d = datetime.date(y + 2000 if y < 100 else y, a, g)
            except (KeyError, ValueError):
                continue
            fikstur.append((d, r))

def eslestir(ev, dep, gun):
    en, puan = None, 0
    for d, r in fikstur:
        if abs((d - gun).days) > 1:
            continue
        b1, b2 = benzer(ev, r["HomeTeam"]), benzer(dep, r["AwayTeam"])
        if min(b1, b2) >= 0.55 and b1 + b2 > puan:
            en, puan = r, b1 + b2
    if not en or puan < 1.3:
        return None
    return {
        "lig": en["Div"], "ev": en["HomeTeam"].strip(), "dep": en["AwayTeam"].strip(),
        "avgMs": [sayi(en.get(k)) for k in ("AvgH", "AvgD", "AvgA")],
        "maxMs": [sayi(en.get(k)) for k in ("MaxH", "MaxD", "MaxA")],
        "avgAu": [sayi(en.get("Avg<2.5")), sayi(en.get("Avg>2.5"))],
        "maxAu": [sayi(en.get("Max<2.5")), sayi(en.get("Max>2.5"))],
        "bfeMs": [sayi(en.get(k)) for k in ("BFEH", "BFED", "BFEA")],
        "bfeAu": [sayi(en.get("BFE<2.5")), sayi(en.get("BFE>2.5"))],
        "hakem": (en.get("Referee") or "").strip() or None,
    }

# ESPN: ABD basketbolu için DraftKings çizgisi (keskin piyasa referansı)
espn = []
for ad in ("espn-nba.json", "espn-wnba.json"):
    j = oku_json(ad) or {}
    for ev in j.get("events", []):
        try:
            c = ev["competitions"][0]
            od = (c.get("odds") or [None])[0]
            if not od or not od.get("total"):
                continue
            tk = {x["homeAway"]: x["team"] for x in c["competitors"]}
            def ondalik(a):
                a = float(str(a).replace("+", ""))
                return round(1 + (a / 100 if a > 0 else 100 / -a), 3)
            t = od["total"]
            espn.append({"t": datetime.datetime.fromisoformat(ev["date"].replace("Z", "+00:00")),
                "ev": [tk["home"].get("location", ""), tk["home"].get("displayName", "")],
                "dep": [tk["away"].get("location", ""), tk["away"].get("displayName", "")],
                "cizgi": float(t["over"]["close"]["line"][1:]),
                "ust": ondalik(t["over"]["close"]["odds"]), "alt": ondalik(t["under"]["close"]["odds"]),
                "lig": "WNBA" if "wnba" in ad else "NBA"})
        except (KeyError, ValueError, IndexError, TypeError):
            continue

def espn_eslestir(ev, dep, bas):
    for x in espn:
        if abs((x["t"] - bas).total_seconds()) > 36 * 3600:
            continue
        if max(benzer(ev, n) for n in x["ev"]) >= 0.6 and max(benzer(dep, n) for n in x["dep"]) >= 0.6:
            return {"cizgi": x["cizgi"], "ust": x["ust"], "alt": x["alt"], "lig": x["lig"]}
    return None

# Nesine oynanma yüzdeleri (her seçeneği oynayan kupon oranı) ve en çok kazananların tercihleri
oyn = {}
for ad in ("oynanma-1.json", "oynanma-2.json"):
    for ev in oku_json(ad) or []:
        for mk_ in ev.get("markets", []):
            oyn[mk_["marketId"]] = {o["oddNo"]: o["percentage"] for o in mk_.get("outcomes", [])}
mac_oyn = {}
for ad in ("mac-oynanma-1.json", "mac-oynanma-2.json"):
    for ev in oku_json(ad) or []:
        mac_oyn[ev["eventId"]] = ev["percentage"]
kazananlar = {}
for ad in ("kazananlar-1.json", "kazananlar-2.json"):
    for ev in (oku_json(ad) or {}).get("d") or []:
        for mk_ in ev.get("markets", []):
            for o in mk_.get("outcomes", []):
                kazananlar[(mk_["marketId"], o["oddNo"])] = o["count"]

def oynanma_ekle(m, e):
    m["oyn"] = mac_oyn.get(e["C"])
    for k, v in list(m.items()):
        if isinstance(v, dict) and v.get("id") and "o" in v:
            y = oyn.get(v["id"])
            if y:
                v["y"] = [y.get(i + 1, 0) for i in range(len(v["o"]))]
            kz = [kazananlar.get((v["id"], i + 1), 0) for i in range(len(v["o"]))]
            if any(kz):
                v["kz"] = kz

onceki = oku_json("bulten.json") or {}
eski = {str(m["id"]): m for m in onceki.get("futbol", []) + onceki.get("basket", [])}

def hareket(m):
    # İlk görülen oranı saklar; oran düşüşü = piyasaya para girdiği anlamına gelebilir
    e = eski.get(str(m["id"]))
    m["ilk"] = (e or {}).get("ilk") or {k: m[k]["o"] for k in m["oranlar"] if m.get(k)}
    m["once"] = {k: e[k]["o"] for k in m["oranlar"] if e and e.get(k) and m.get(k) and e[k].get("c") == m[k].get("c")} if e else {}
    del m["oranlar"]

simdi = datetime.datetime.now(TR)
futbol, basket = [], []
for e in ham["sg"]["EA"]:
    if e.get("GT") not in (1, 2):
        continue
    bas = datetime.datetime.fromtimestamp(e["ED"] / 1000, TR)
    if bas < simdi - datetime.timedelta(hours=2):
        continue
    mk = {m["MTID"]: m for m in e.get("MA", [])}
    m = {"id": e["C"], "t": e["ED"], "lig": ligler.get(e.get("LC"), ""), "ev": e["HN"], "dep": e["AN"]}
    if e["GT"] == 1:
        m.update(ms=pazar(mk, 1), au15=pazar(mk, 11), au25=pazar(mk, 12), au35=pazar(mk, 13), kg=pazar(mk, 38),
                 korner=pazar(mk, 216), kart=pazar(mk, 218), iyms=pazar(mk, 5), golAralik=pazar(mk, 43))
        if not m["ms"]:
            continue
        m["oranlar"] = ["ms", "au25", "kg", "korner"]
        m["fd"] = eslestir(e["HN"], e["AN"], bas.date())
        oynanma_ekle(m, e)
        hareket(m)
        futbol.append(m)
    else:
        m.update(ms=pazar(mk, 142), toplam=pazar(mk, 149), hand=pazar(mk, 148), ev_t=pazar(mk, 151), dep_t=pazar(mk, 150))
        if not m["toplam"] and not m["ms"]:
            continue
        m["oranlar"] = ["ms", "toplam"]
        m["dk"] = espn_eslestir(e["HN"], e["AN"], bas)
        oynanma_ekle(m, e)
        hareket(m)
        basket.append(m)

futbol.sort(key=lambda m: m["t"]); basket.sort(key=lambda m: m["t"])
veri = oku_json("veri.json") or {}
cikti = {"zaman": simdi.strftime("%Y-%m-%d %H:%M"), "veriGuncelleme": veri.get("guncelleme"), "futbol": futbol, "basket": basket}
with open(os.path.join(K, "bulten.json"), "w", encoding="utf-8") as f:
    json.dump(cikti, f, ensure_ascii=False, separators=(",", ":"))
print(len(futbol), "futbol,", len(basket), "basketbol,", sum(1 for m in futbol if m["fd"]), "eşleşen,", sum(1 for m in basket if m.get("dk")), "basketbol DraftKings")

# Maç öncesi son oranlar; maç başlayınca bültenden düştüğü için canlı hesapta buradan okunur
onmac = (oku_json("onmac.json") or {}).get("maclar", {})
for m in futbol + basket:
    if m["t"] > int(simdi.timestamp() * 1000):
        onmac[str(m["id"])] = {"t": m["t"], "ms": (m.get("ms") or {}).get("o"), "au25": (m.get("au25") or {}).get("o"),
                               "toplam": [m["toplam"]["c"]] + m["toplam"]["o"] if m.get("toplam") else None}
onmac = {i: k for i, k in onmac.items() if k["t"] > int(simdi.timestamp() * 1000) - 864e5}
with open(os.path.join(K, "onmac.json"), "w", encoding="utf-8") as f:
    json.dump({"maclar": onmac}, f, separators=(",", ":"))

# ---------- Otomatik takip ----------
# Piyasa verisi olan her maçın iddaa oranı ve piyasa olasılığı başlama saatine kadar kaydedilir;
# maç bitince sonuç football-data'dan işlenir. Uygulama bununla value sinyallerinin gerçek ROI'sini gösterir.
takip = oku_json("takip.json") or {"maclar": {}}
simdi_ms = int(simdi.timestamp() * 1000)
for m in futbol:
    f = m.get("fd")
    if not f or m["t"] <= simdi_ms:
        continue
    k = takip["maclar"].setdefault(str(m["id"]), {"t": m["t"], "ev": m["ev"], "dep": m["dep"], "lig": m["lig"], "fd": {"lig": f["lig"], "ev": f["ev"], "dep": f["dep"]}})
    son = {"ms": m["ms"]["o"], "au25": m["au25"]["o"] if m.get("au25") else None, "avgMs": f["avgMs"], "avgAu": f["avgAu"], "zaman": simdi_ms}
    k.setdefault("ilk", son)
    k["son"] = son
# Sonuçlar
gun0 = datetime.date(1970, 1, 1)
for k in takip["maclar"].values():
    if k.get("sonuc") or k["t"] > simdi_ms - 3 * 3600e3:
        continue
    L = veri.get("ligler", {}).get(k["fd"]["lig"])
    if not L:
        continue
    gun = (datetime.datetime.fromtimestamp(k["t"] / 1000, datetime.timezone.utc).date() - gun0).days
    tk = L["takimlar"]
    for r in L["maclar"]:
        if abs(r[0] - gun) <= 1 and tk[r[1]] == k["fd"]["ev"] and tk[r[2]] == k["fd"]["dep"]:
            k["sonuc"] = [r[3], r[4]]
            break
# 150 günden eski kayıtlar silinir
takip["maclar"] = {i: k for i, k in takip["maclar"].items() if k["t"] > simdi_ms - 150 * 864e5}
takip["zaman"] = cikti["zaman"]
with open(os.path.join(K, "takip.json"), "w", encoding="utf-8") as f:
    json.dump(takip, f, ensure_ascii=False, separators=(",", ":"))
print(len(takip["maclar"]), "takipte,", sum(1 for k in takip["maclar"].values() if k.get("sonuc")), "sonuçlandı")
