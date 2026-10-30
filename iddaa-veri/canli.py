# Canlı maçlar ve ilk 11'ler. Her 5 dakikada çalışır.
# - Nesine canlı bülteni (nesine-canli.json): canlı oranlar, skor
# - ESPN futbol skor tablosu (espn-futbol-*.json): dakika, skor, korner, şut, kırmızı kart, form
# - ESPN maç özeti: açıklanan ilk 11 ve diziliş
# -> canli.json, kadro.json
import json, os, re, datetime, urllib.request, concurrent.futures
from ortak import oku_json, benzer, K, TR

simdi = datetime.datetime.now(TR)
simdi_ms = int(simdi.timestamp() * 1000)

def oran(m):
    o = [x.get("O") for x in sorted(m["OCA"], key=lambda x: x["N"])]
    return None if m.get("MS") != 1 or any(not x or x <= 1 for x in o) else o

def cizgiler(mk, mst):
    # Aynı pazarın farklı çizgileri: {"2.5": [alt, üst]}
    return {str(m["SOV"]): o for m in mk if m.get("MST") == mst and (o := oran(m)) and len(o) == 2}

def tek(mk, mst):
    for m in mk:
        if m.get("MST") == mst:
            return oran(m)
    return None

# ---------- ESPN futbol ----------
def gol_dakika(d):
    try:
        return int(re.match(r"\s*(\d+)", (d.get("clock") or {}).get("displayValue") or "").group(1))
    except (AttributeError, ValueError):
        return None

def ilk_yari(tk, c):
    # Devre skoru; İY/MS kuponlarının sonucu için. Önce linescores, yoksa gol olaylarının dakikasından
    # (45'+2' ilk yarı sayılır). Gol olayları toplamı maç skoruyla tutmuyorsa (eksik olay, kendi kalesine gol karışıklığı) boş.
    try:
        return [int(float(tk[y]["linescores"][0]["value"])) for y in ("home", "away")]
    except (KeyError, IndexError, TypeError, ValueError):
        pass
    try:
        skor = [int(tk["home"].get("score") or 0), int(tk["away"].get("score") or 0)]
        ev_id = tk["home"]["team"]["id"]
        goller = [d for d in c.get("details", []) if d.get("scoringPlay") and not d.get("shootout")]
        for kk_ters in (False, True):
            top, iy = [0, 0], [0, 0]
            for d in goller:
                taraf = 0 if d.get("team", {}).get("id") == ev_id else 1
                if kk_ters and d.get("ownGoal"):
                    taraf = 1 - taraf
                dk = gol_dakika(d)
                if dk is None:
                    raise ValueError
                top[taraf] += 1
                if dk <= 45:
                    iy[taraf] += 1
            if top == skor:
                return iy
    except (KeyError, TypeError, ValueError):
        pass
    return None
espn, goruldu = [], set()
# "all" skor tablosu + "all"da olmayan ligler için ayrı çekilenler (espn-futbol-ek-*.json; tur.sh)
dosyalar = ["espn-futbol-0.json", "espn-futbol-1.json", "espn-futbol-2.json"] + sorted(f for f in os.listdir(K) if f.startswith("espn-futbol-ek-"))
ek_durum = {}
for ad in dosyalar:
    if ad.startswith("espn-futbol-ek-"):
        ek_durum[ad[15:-5]] = len((oku_json(ad) or {}).get("events", []))
    for ev in (oku_json(ad) or {}).get("events", []):
        if ev.get("id") in goruldu:
            continue
        goruldu.add(ev.get("id"))
        try:
            c = ev["competitions"][0]
            tk = {x["homeAway"]: x for x in c["competitors"]}
            ist = lambda x: {s["name"]: s.get("displayValue") for s in x.get("statistics", [])}
            sh, sa = ist(tk["home"]), ist(tk["away"])
            kir = [0, 0]
            for d in c.get("details", []):
                if d.get("redCard"):
                    kir[0 if d.get("team", {}).get("id") == tk["home"]["team"]["id"] else 1] += 1
            st = c["status"]
            sayi_ = lambda s, k: float(s[k]) if s.get(k) not in (None, "") else None
            espn.append({"id": ev["id"], "t": datetime.datetime.fromisoformat(ev["date"].replace("Z", "+00:00")),
                "ev": [tk["home"]["team"].get(k, "") for k in ("displayName", "shortDisplayName", "location")],
                "dep": [tk["away"]["team"].get(k, "") for k in ("displayName", "shortDisplayName", "location")],
                "durum": st["type"]["state"], "saat": st.get("displayClock"), "devre": st.get("period"),
                "skor": [int(tk["home"].get("score") or 0), int(tk["away"].get("score") or 0)],
                "form": [tk["home"].get("form"), tk["away"].get("form")],
                "kor": [sayi_(sh, "wonCorners"), sayi_(sa, "wonCorners")],
                "sut": [sayi_(sh, "totalShots"), sayi_(sa, "totalShots")],
                "isabet": [sayi_(sh, "shotsOnTarget"), sayi_(sa, "shotsOnTarget")],
                "top": [sayi_(sh, "possessionPct"), sayi_(sa, "possessionPct")], "kirmizi": kir, "iy": ilk_yari(tk, c) if st["type"]["state"] == "post" else None})
        except (KeyError, ValueError, TypeError, IndexError):
            continue

def espn_bul(ev, dep, bas_ms):
    en, puan = None, 0
    for x in espn:
        if abs(x["t"].timestamp() * 1000 - bas_ms) > 3 * 3600e3:
            continue
        b1, b2 = max(benzer(ev, n) for n in x["ev"] if n), max(benzer(dep, n) for n in x["dep"] if n)
        if min(b1, b2) >= 0.6 and b1 + b2 > puan:
            en, puan = x, b1 + b2
    return en if puan >= 1.4 else None

# ---------- Kaynak karşılaştırması: biten maçların sonucu ESPN'den ----------
kiyas = oku_json("kiyas.json")
if kiyas:
    n = 0
    for k in kiyas["maclar"].values():
        if (k.get("sonuc") and k.get("iy")) or k["t"] > simdi_ms - 105 * 60e3 or k["t"] < simdi_ms - 2 * 864e5:
            continue
        x = espn_bul(k["ev"], k["dep"], k["t"])
        if x and x["durum"] == "post":
            if not k.get("sonuc"):
                k["sonuc"] = x["skor"]; n += 1
            if x["iy"]:
                k["iy"] = x["iy"]
    with open(os.path.join(K, "kiyas.json"), "w", encoding="utf-8") as f:
        json.dump(kiyas, f, ensure_ascii=False, separators=(",", ":"))
    # Sağlık: kupondaki maçlardan sonucu gelmeyenler ve ESPN'de aynı saatteki en yakın adaylar (isim eşleşmesini düzeltmek için)
    kupon_id = {s["id"] for g in ((oku_json("kuponlar.json") or {}).get("gunler") or {}).values() for kp in g["kuponlar"] for s in kp["secim"]}
    eslesmeyen = []
    for i, k in kiyas["maclar"].items():
        if i in kupon_id and not k.get("sonuc") and simdi_ms - 2 * 864e5 < k["t"] < simdi_ms - 3 * 3600e3:
            aday = sorted(((max(benzer(k["ev"], n) for n in x["ev"] if n) + max(benzer(k["dep"], n) for n in x["dep"] if n), x["ev"][0], x["dep"][0], x["durum"])
                           for x in espn if abs(x["t"].timestamp() * 1000 - k["t"]) <= 3 * 3600e3), reverse=True)[:3]
            eslesmeyen.append({"mac": f"{k['ev']} - {k['dep']}", "lig": k["lig"], "aday": [[round(a[0], 2), a[1], a[2], a[3]] for a in aday]})
    with open(os.path.join(K, "saglik.json"), "w", encoding="utf-8") as f:
        json.dump({"zaman": datetime.datetime.now(TR).strftime("%Y-%m-%d %H:%M"), "espn_toplam": len(espn),
                   "espn_gun": {ad: len((oku_json(ad) or {}).get("events", [])) for ad in dosyalar}, "kupon_sonucsuz": eslesmeyen}, f, ensure_ascii=False)
    bitti = [x for x in espn if x["durum"] == "post"]
    print(n, "maçın sonucu ESPN'den işlendi;", len(bitti), "biten ESPN maçının", sum(1 for x in bitti if x["iy"]), "tanesinde devre skoru var")

# ---------- Canlı bülten ----------
ham = oku_json("nesine-canli.json") or {}
sg = ham.get("sg") or {}
ligler = {l["LID"]: l.get("N", "") for l in sg.get("LA", [])}
onmac = (oku_json("onmac.json") or {}).get("maclar", {})
# onmac.json yokken takip.json'daki son oranlar yedek
for i, k in ((oku_json("takip.json") or {}).get("maclar") or {}).items():
    if i not in onmac and k.get("son"):
        onmac[i] = {"ms": k["son"].get("ms"), "au25": k["son"].get("au25") or k["son"].get("avgAu")}
futbol, basket = [], []
for e in sg.get("EA", []):
    if e.get("GT") not in (1, 2):
        continue
    mk = e.get("MA", [])
    m = {"id": e.get("NID") or e["C"], "lig": ligler.get(e.get("LC"), ""), "ev": e["HN"], "dep": e["AN"], "bas": e.get("ESD") or e["ED"]}
    if e["GT"] == 1:
        m.update(ms=tek(mk, 4), au=cizgiler(mk, 14), iyau=cizgiler(mk, 63), kg=tek(mk, 136), iy=tek(mk, 47), korner=cizgiler(mk, 792))
        # "Maçın Geri Kalanını Kim Kazanır 1:0" pazarının adında anlık skor yazıyor
        for x in mk:
            r = re.search(r"Kalanını Kim Kazanır (\d+):(\d+)", x.get("MN") or "")
            if r and x.get("MTID") == 56:
                m["skor"] = [int(r.group(1)), int(r.group(2))]
        x = espn_bul(e["HN"], e["AN"], m["bas"])
        if x:
            m["espn"] = {k: x[k] for k in ("durum", "saat", "devre", "skor", "kor", "sut", "isabet", "top", "kirmizi", "form")}
            if x["durum"] in ("in", "post"):
                m["skor"] = x["skor"]
        o = onmac.get(str(m["id"]))
        if o:
            m["on"] = {"ms": o.get("ms"), "au25": o.get("au25")}
        m["kapali"] = not m["ms"] and not m["au"]
        futbol.append(m)
    else:
        m.update(ms=tek(mk, 71), toplam=cizgiler(mk, 140))
        o = onmac.get(str(m["id"]))
        if o:
            m["on"] = {"toplam": o.get("toplam")}
        basket.append(m)

# ESPN basketbol (NBA/WNBA) canlı skoru
for ad in ("espn-nba.json", "espn-wnba.json"):
    for ev in (oku_json(ad) or {}).get("events", []):
        try:
            c = ev["competitions"][0]
            if c["status"]["type"]["state"] != "in":
                continue
            tk = {x["homeAway"]: x for x in c["competitors"]}
            for m in basket:
                if benzer(m["ev"], tk["home"]["team"]["displayName"]) >= 0.6 and benzer(m["dep"], tk["away"]["team"]["displayName"]) >= 0.6:
                    m["espn"] = {"skor": [int(tk["home"]["score"]), int(tk["away"]["score"])], "devre": c["status"]["period"],
                                 "saat": c["status"].get("displayClock"), "lig": "WNBA" if "wnba" in ad else "NBA"}
        except (KeyError, ValueError, TypeError):
            continue

with open(os.path.join(K, "canli.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": simdi.strftime("%Y-%m-%d %H:%M"), "t": simdi_ms, "futbol": futbol, "basket": basket}, f, ensure_ascii=False, separators=(",", ":"))
print(len(futbol), "canlı futbol,", sum(1 for m in futbol if m.get("espn")), "ESPN eşleşen,", len(basket), "canlı basketbol")

# ---------- İlk 11 ve form ----------
# Bültendeki her maç ESPN ile eşleştirilir (form için). Başlamasına 100 dakikadan az kalan ve canlı maçlar için
# ESPN özeti çekilir; ilk 11 açıklanınca kaydedilir ve bir daha çekilmez.
bulten = oku_json("bulten.json") or {}
kadro = (oku_json("kadro.json") or {}).get("maclar", {})
kadro = {i: k for i, k in kadro.items() if k.get("t", 0) > simdi_ms - 864e5}
cek = []
for m in bulten.get("futbol", []) + [dict(x, t=x["bas"]) for x in futbol]:
    x = espn_bul(m["ev"], m["dep"], m["t"])
    if not x:
        continue
    k = kadro.setdefault(str(m["id"]), {"t": m["t"], "eid": x["id"]})
    k["form"] = x["form"]
    # Puan durumu ve son karşılaşmalar için her maç bir kez; ilk 11 için son 100 dakikada 9 dakikada bir
    if "sira" not in k or (not k.get("ev") and m["t"] - simdi_ms < 100 * 60e3 and k.get("son", 0) < simdi_ms - 9 * 60e3):
        cek.append(k)

def ozet(k):
    try:
        u = "https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=" + k["eid"]
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
            s = json.load(r)
    except Exception:
        return
    k["son"] = simdi_ms
    # Puan durumu: iki takımın sırası, puanı, oynadığı maç, averajı
    try:
        tk = {c["homeAway"]: c["id"] for c in s["header"]["competitions"][0]["competitors"]}
        k["sira"] = {}
        for g in (s.get("standings") or {}).get("groups", []):
            girdi = g.get("standings", {}).get("entries", [])
            for e in girdi:
                ist = {x["name"]: x.get("displayValue") for x in e.get("stats", [])}
                for yer, tid in tk.items():
                    if e.get("id") == tid:
                        k["sira"][yer] = {"s": ist.get("rank"), "p": ist.get("points"), "o": ist.get("gamesPlayed"), "a": ist.get("pointDifferential"), "n": len(girdi)}
        # Son karşılaşmalar (ev sahibi önce)
        k["h2h"] = []
        for ss in s.get("seasonseries") or []:
            for e in ss.get("events", [])[:6]:
                c = {x["homeAway"]: x for x in e.get("competitors", [])}
                if "home" in c and "away" in c and e.get("status") == "post":
                    k["h2h"].append([e.get("date", "")[:10], c["home"]["team"].get("displayName"), c["home"].get("score"), c["away"].get("score"), c["away"]["team"].get("displayName")])
            break
    except (KeyError, IndexError, TypeError):
        k.setdefault("sira", {})
    for r in s.get("rosters") or []:
        ilk = [p for p in r.get("roster", []) if p.get("starter")]
        if len(ilk) < 11:
            continue
        k["ev" if r.get("homeAway") == "home" else "dep"] = {
            "d": r.get("formation"),
            "o": [[p["athlete"].get("displayName"), (p.get("position") or {}).get("abbreviation")] for p in ilk],
            "y": [p["athlete"].get("displayName") for p in r.get("roster", []) if not p.get("starter")][:12]}

with concurrent.futures.ThreadPoolExecutor(8) as h:
    list(h.map(ozet, cek[:80]))
with open(os.path.join(K, "kadro.json"), "w", encoding="utf-8") as f:
    json.dump({"zaman": simdi.strftime("%Y-%m-%d %H:%M"), "maclar": kadro}, f, ensure_ascii=False, separators=(",", ":"))
print(len(kadro), "maç ESPN ile eşleşti,", len(cek), "özet çekildi,", sum(1 for k in kadro.values() if k.get("ev")), "ilk 11 var")
