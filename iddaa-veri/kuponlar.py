# Günün kuponları: her sabah (09:00 TR'den sonra, günde bir kez) uygulamadaki yöntemle o günün maçlarından 3 kupon kurar,
# kaydeder ve telefona gönderir (ntfy). Maçlar bittikçe sonuçları işler (kiyas.json: ESPN skoru ve ilk yarı skoru).
# 1) En sağlam: gerçek ihtimali en yüksek 3 seçenek  2) Dengeli: ihtimal %55-75, avantajı en iyi 3 seçenek
# 3) Sürpriz: ihtimali en yüksek İY/MS 1/2 ya da 2/1 + 2 sağlam seçenek
# -> kuponlar.json
import json, os, math, datetime, urllib.request, base64
from ortak import oku_json, K, TR, KONU, W

IY_PAYI = 0.446
ESIK_PAY = 0.12
IYMS_DUZELTME = {2: 1.18, 6: 1.15}
AD = {"ms": ["MS 1", "MS X", "MS 2"], "au15": ["1.5 Alt", "1.5 Üst"], "au25": ["2.5 Alt", "2.5 Üst"], "au35": ["3.5 Alt", "3.5 Üst"],
      "kg": ["KG Var", "KG Yok"], "iyms": ["İY/MS " + x for x in ("1/1", "1/X", "1/2", "X/1", "X/X", "X/2", "2/1", "2/X", "2/2")]}

simdi = datetime.datetime.now(TR)
simdi_ms = int(simdi.timestamp() * 1000)
kayit = oku_json("kuponlar.json") or {"gunler": {}}

# ---------- Olasılık motoru (uygulamadakinin aynısı) ----------
def marjsiz(o):
    if not o or not all(o):
        return None
    t = sum(1 / x for x in o)
    return [1 / x / t for x in o]

POI = {}
def poisson(l, n=10):
    a = round(l, 4)
    if a not in POI:
        d = [math.exp(-l)]
        for k in range(1, n + 1):
            d.append(d[-1] * l / k)
        POI[a] = d
    return POI[a]

def ms_au(lh, la):
    ph, pa = poisson(lh), poisson(la)
    h = d = a = u = 0.0
    for i, x in enumerate(ph):
        for j, y in enumerate(pa):
            p = x * y
            if i > j: h += p
            elif i == j: d += p
            else: a += p
            if i + j > 2.5: u += p
    return h, d, a, u

def lambda_coz(p1, p2, pu):
    hata = lambda lh, la: (lambda r: (r[0] - p1) ** 2 + (r[2] - p2) ** 2 + (r[3] - pu) ** 2)(ms_au(lh, la))
    en, eh = (1.4, 1.1), float("inf")
    for i in range(43):
        for j in range(38):
            lh, la = 0.2 + i * 0.1, 0.2 + j * 0.1
            e = hata(lh, la)
            if e < eh:
                eh, en = e, (lh, la)
    adim = 0.05
    while adim >= 0.005:
        iyi = True
        while iyi:
            iyi = False
            for dx, dy in ((adim, 0), (-adim, 0), (0, adim), (0, -adim)):
                lh, la = en[0] + dx, en[1] + dy
                if lh <= 0.05 or la <= 0.05:
                    continue
                e = hata(lh, la)
                if e < eh:
                    eh, en, iyi = e, (lh, la), True
        adim /= 2
    return en

def tum_olasiliklar(lh, la):
    ph, pa = poisson(lh), poisson(la)
    r = {"ms": [0, 0, 0], "kg": [0, 0]}
    top = [0.0] * 21
    for i, x in enumerate(ph):
        for j, y in enumerate(pa):
            p = x * y
            r["ms"][0 if i > j else 1 if i == j else 2] += p
            top[i + j] += p
            r["kg"][0 if i > 0 and j > 0 else 1] += p
    for c in (1.5, 2.5, 3.5):
        u = sum(p for k, p in enumerate(top) if k > c)
        r["au" + str(c).replace(".", "")] = [1 - u, u]
    h1, a1 = poisson(lh * IY_PAYI, 8), poisson(la * IY_PAYI, 8)
    h2, a2 = poisson(lh * (1 - IY_PAYI), 8), poisson(la * (1 - IY_PAYI), 8)
    sn = lambda x, y: 0 if x > y else 1 if x == y else 2
    iy = [0.0] * 9
    for i in range(9):
        for j in range(9):
            p1 = h1[i] * a1[j]
            if p1 < 1e-7:
                continue
            for k in range(9):
                for l in range(9):
                    iy[sn(i, j) * 3 + sn(i + k, j + l)] += p1 * h2[k] * a2[l]
    ek = 0
    for i, c in IYMS_DUZELTME.items():
        yeni = iy[i] * c; ek += yeni - iy[i]; iy[i] = yeni
    kalan = sum(p for i, p in enumerate(iy) if i not in IYMS_DUZELTME)
    r["iyms"] = [p if i in IYMS_DUZELTME else p * (kalan - ek) / kalan for i, p in enumerate(iy)]
    return r

def gercek(m):
    f, sm, dk = m.get("fd") or {}, m.get("sm") or {}, m.get("dkf") or {}
    tam = lambda o: o and all(o)
    pin, pm = m.get("pin") or {}, m.get("pm") or {}
    kms, kau = [], []
    if pin.get("ms"): kms.append((pin["ms"], W["pinnacle"]))
    if pin.get("au25"): kau.append((pin["au25"], W["pinnacle"]))
    if pm.get("ms"): kms.append((pm["ms"], W["polymarket"]))
    if sm.get("ms"): kms.append((sm["ms"], W["borsa"]))
    if tam(f.get("avgMs")): kms.append((marjsiz(f["avgMs"]), W["piyasa"]))
    if tam(dk.get("ms")): kms.append((marjsiz(dk["ms"]), W["dk"]))
    if sm.get("au25"): kau.append((sm["au25"], W["borsa"]))
    if tam(f.get("avgAu")): kau.append((marjsiz(f["avgAu"]), W["piyasa"]))
    if tam(dk.get("au25")): kau.append((marjsiz(dk["au25"]), W["dk"]))
    ort = lambda ks: [sum(k[0][i] * k[1] for k in ks) / sum(k[1] for k in ks) for i in range(len(ks[0][0]))]
    ms = au = kaynak = None
    if kms:
        ms, kaynak = ort(kms), "piyasa"
        au = ort(kau) if kau else marjsiz(m["au25"]["o"]) if m.get("au25") else None
        if not au:
            kaynak = None
    if not kaynak and m.get("ms") and m.get("au25"):
        ms, au, kaynak = marjsiz(m["ms"]["o"]), marjsiz(m["au25"]["o"]), "iddaa"
    if not kaynak:
        return None
    r = tum_olasiliklar(*lambda_coz(ms[0], ms[2], au[1]))
    if kaynak == "piyasa":
        r["ms"] = ms
        if kau: r["au25"] = au
        for k in ("au15", "au35", "kg"):
            if sm.get(k): r[k] = [(p + sm[k][i]) / 2 for i, p in enumerate(r[k])]
    r["kaynak"] = kaynak
    return r

def secenekler(m):
    g = gercek(m)
    if not g:
        return []
    out = []
    for k in ("ms", "au15", "au25", "au35", "kg", "iyms"):
        if not m.get(k) or not g.get(k) or len(g[k]) != len(m[k]["o"]):
            continue
        for i, o in enumerate(m[k]["o"]):
            # 13 bin maçlık geçmişte (football-data kapanış oranları) %65-70 ihtimalli "Alt"lar %67 değil %61 tuttu,
            # "Üst"ler ise ihtimalinin biraz üstünde: Alt seçeneklerin ihtimali kupon için 3 puan kısılır.
            p = g[k][i] - (0.03 if k in ("au15", "au25", "au35") and i == 0 else 0)
            out.append({"k": k, "i": i, "ad": AD[k][i], "o": o, "p": p, "e": p * o - 1, "dis": g["kaynak"] == "piyasa"})
    return out

# xG kontrolü: gol pazarlarında (alt/üst, KG) iki takımın son maçlardaki xG'sinden Poisson ihtimali.
# Piyasanın ihtimalinden 10 puandan fazla düşükse seçenek kupona alınmaz (xG verisi olan liglerde).
XG = oku_json("xg.json") or {}
def xg_olas(m, k, i):
    e = (XG.get("maclar") or {}).get(str(m["id"]))
    T = XG.get("takim") or {}
    if not e or k not in ("au15", "au25", "au35", "kg"):
        return None
    a, b = T.get(e["ev"]), T.get(e["dep"])
    if not a or not b or min(a["n"], b["n"]) < 5:
        return None
    ph, pa = poisson((a["xg"] + b["xga"]) / 2), poisson((b["xg"] + a["xga"]) / 2)
    if k == "kg":
        var = (1 - ph[0]) * (1 - pa[0])
        return var if i == 0 else 1 - var
    c = {"au15": 1, "au25": 2, "au35": 3}[k]
    alt = sum(ph[x] * pa[y] for x in range(c + 1) for y in range(c + 1 - x))
    return alt if i == 0 else 1 - alt

# Oran hareketi: 2.250 maçlık geçmişte (football-data açılış -> kapanış) ihtimali maça doğru düşen seçenekler
# beklenenden 5-10 puan az tuttu, yükselenler biraz fazla. iddaa'nın ilk oranından bu yana ihtimali 2 puandan fazla
# düşen seçenek kupona alınmaz. 1.5 ve 3.5 için 2.5'in hareketi kullanılır (aynı yönde oynarlar).
def trend(m, k, i):
    kk = "au25" if k in ("au15", "au35") else k
    ilk, simdi_o = (m.get("ilk") or {}).get(kk), (m.get(kk) or {}).get("o")
    if kk not in ("ms", "au25", "kg") or not ilk or not simdi_o or len(ilk) != len(simdi_o):
        return None
    a, b = marjsiz(ilk), marjsiz(simdi_o)
    return b[i] - a[i] if a and b else None

def dusuyor(m, x):
    d = trend(m, x["k"], x["i"])
    return d is not None and d < -0.02

def xg_uyar(m, x):
    q = xg_olas(m, x["k"], x["i"])
    return q is not None and q < x["p"] - 0.10

def kuponlari_kur(maclar):
    aday = [(m, x) for m in maclar for x in secenekler(m)]
    # Önce dış kaynaklı, sonra sonucu daha önce gelmiş liglerdeki seçenekler (kupon karnesine yansısın)
    # 1.5 ve 3.5 ihtimali dış kaynakta doğrudan yok, 2.5 ve MS'den hesaplanıyor: eşit şartta doğrudan ölçülen pazar önce
    # (kupon karnesi 30 Ekim: MS seçimleri 9'da 8 tuttu, 3.5 Alt'lar 9'da 3)
    sirala = lambda xs, f: sorted(xs, key=lambda v: (not v[1]["dis"], v[0].get("lig") not in BILINEN, v[1]["k"] in ("au15", "au35"), f(v)))
    kul = set()
    def sec(xs, n):
        out = []
        for m, x in xs:
            if len(out) >= n: break
            if m["id"] in kul: continue
            kul.add(m["id"]); out.append((m, x))
        return out
    # Kupa maçlarında (alt lig - üst lig eşleşmeleri) farklı skor sık: Kral Kupası 1-5, 1-3 gibi. Kupada "Alt" alınmaz.
    kupa_alt = lambda m, x: x["k"].startswith("au") and x["i"] == 0 and any(w in (m.get("lig") or "") for w in ("Kupa", "Cup", "Copa"))
    normal = [v for v in aday if v[1]["k"] != "iyms" and v[1]["o"] >= 1.2 and not xg_uyar(*v) and not dusuyor(*v) and not kupa_alt(*v)]
    # Sağlam ve dengeli kupon 2 maçlık: 3 maçta %70'lik seçimlerle bile kupon ancak %35 tutuyordu
    # iddaa'nın payı seçenekten seçeneğe değişiyor; payı %12'den fazla olanlar yeterince aday varsa alınmaz
    ucuz = lambda xs: [v for v in xs if v[1]["e"] >= -ESIK_PAY] if len([v for v in xs if v[1]["e"] >= -ESIK_PAY]) >= 6 else xs
    # %70'lik 2 seçenek yoksa (sakin günler) eşik %65'e iner; yoksa sağlam kupon hiç çıkmıyordu
    esik = 0.7 if len({v[0]["id"] for v in normal if v[1]["p"] >= 0.7}) >= 2 else 0.65
    k1 = sec(sirala(ucuz([v for v in normal if v[1]["p"] >= esik]), lambda v: (-v[1]["p"], -v[1]["e"])), 2)
    k2 = sec(sirala(ucuz([v for v in normal if 0.55 <= v[1]["p"] < 0.75]), lambda v: -v[1]["e"]), 2)
    sur = sirala([v for v in aday if v[1]["k"] == "iyms" and v[1]["i"] in (2, 6)], lambda v: (-v[1]["p"], -v[1]["e"]))
    k3 = sec(sur, 1)
    if k3:
        k3 += sec(sirala([v for v in normal if v[1]["p"] >= 0.6], lambda v: -v[1]["p"]), 2)
    paket = lambda ad, xs: {"ad": ad, "secim": [{"id": str(m["id"]), "ev": m["ev"], "dep": m["dep"], "lig": m["lig"], "t": m["t"], "k": x["k"], "i": x["i"],
                                                  "ad": x["ad"], "o": x["o"], "p": round(x["p"], 4)} for m, x in xs]}
    return [paket(a, xs) for a, xs in (("En sağlam", k1), ("Dengeli", k2), ("Sürpriz", k3)) if xs]

# ---------- Sonuçlar ----------
def tuttu_mu(s, km):
    if not km or not km.get("sonuc"):
        return None
    h, a = km["sonuc"]
    if s["k"] == "ms": return s["i"] == (0 if h > a else 1 if h == a else 2)
    if s["k"].startswith("au"): return s["i"] == (1 if h + a > int(s["k"][2:]) / 10 else 0)
    if s["k"] == "kg": return s["i"] == (0 if h > 0 and a > 0 else 1)
    if s["k"] == "iyms":
        if not km.get("iy"):
            return None
        ih, ia = km["iy"]
        return s["i"] == (0 if ih > ia else 1 if ih == ia else 2) * 3 + (0 if h > a else 1 if h == a else 2)
    return None

kiyas = (oku_json("kiyas.json") or {}).get("maclar", {})
biten = []   # bu çalışmada sonuçlanan kuponlar (telefona bildirilir)
for gun in kayit["gunler"].values():
    for kp in gun["kuponlar"]:
        onceki = kp.get("sonuc")
        for s in kp["secim"]:
            # Yatan kuponun kalan seçimleri de işlenir; yoksa seçim karnesine yalnız yatanlar girer (yanıltır)
            if s.get("tuttu") is None:
                s["tuttu"] = tuttu_mu(s, kiyas.get(s["id"]))
                if s["tuttu"] is not None:
                    s["skor"] = kiyas[s["id"]]["sonuc"]
                    if kiyas[s["id"]].get("iy"): s["iy"] = kiyas[s["id"]]["iy"]
        if onceki in ("tuttu", "yattı"):
            continue
        if any(s.get("tuttu") is False for s in kp["secim"]):
            kp["sonuc"] = "yattı"
        elif all(s.get("tuttu") for s in kp["secim"]):
            kp["sonuc"] = "tuttu"
        elif all(s["t"] < simdi_ms - 2 * 864e5 for s in kp["secim"]):
            kp["sonuc"] = "sonuç yok"   # ESPN'de bulunamadı
        if kp.get("sonuc") in ("tuttu", "yattı") and kp["sonuc"] != onceki:
            biten.append(kp)

# ---------- İlk 11'den sonra kontrol ----------
# Başlamasına 90 dakikadan az kalan seçeneklerin ihtimali güncel bültenden yeniden hesaplanır (ilk 11 açıklanınca borsa hemen oynar).
# İhtimal 3 puandan fazla düştüyse telefona uyarı ve yerine aynı türden, henüz başlamamış bir seçenek önerilir.
def gonder(baslik, metin, etiket, oncelik="default"):
    try:
        urllib.request.urlopen(urllib.request.Request("https://ntfy.sh/" + KONU, data=metin.encode("utf-8"), method="POST",
            headers={"Title": "=?UTF-8?B?" + base64.b64encode(baslik.encode()).decode() + "?=", "Tags": etiket, "Priority": oncelik}), timeout=15).read()
        return True
    except Exception as x:
        print("bildirim gönderilemedi:", x)
        return False

# Sonucu hiç gelmeyen ligler (ESPN o ligi izlemiyor): son maçlarından en az 2'si bittiği hâlde hiçbiri sonuçlanmadıysa
# kupona alınmaz, yoksa kupon karnesine hiç yansımaz.
def sonucsuz_ligler(kiyas):
    say = {}
    for k in kiyas.values():
        if k["t"] < simdi_ms - 4 * 3600e3 and k.get("lig"):
            a = say.setdefault(k["lig"], [0, 0]); a[0] += 1; a[1] += k.get("sonuc") is not None
    return {l for l, (n, ok) in say.items() if n >= 2 and not ok}
SONUCSUZ = sonucsuz_ligler(kiyas)
BILINEN = {k["lig"] for k in kiyas.values() if k.get("sonuc") and k.get("lig")}

bulten = oku_json("bulten.json") or {}
bugun = simdi.strftime("%Y-%m-%d")
bugunku = [m for m in bulten.get("futbol", []) if m.get("lig") not in SONUCSUZ and datetime.datetime.fromtimestamp(m["t"] / 1000, TR).strftime("%Y-%m-%d") == bugun]
gun = kayit["gunler"].get(bugun)
if gun:
    mac = {str(m["id"]): m for m in bugunku}
    for kp in gun["kuponlar"]:
        kullanilan = {s["id"] for s in kp["secim"]}
        for s in kp["secim"]:
            m = mac.get(s["id"])
            if not m or not (simdi_ms + 5 * 60e3 < s["t"] < simdi_ms + 90 * 60e3):
                continue
            x = next((x for x in secenekler(m) if x["k"] == s["k"] and x["i"] == s["i"]), None)
            if not x:
                continue
            s["p_son"], s["o_son"] = round(x["p"], 4), x["o"]
            # Geçmişte 3 puandan fazla düşen seçenekler belirgin daha az tuttu: uyarı eşiği 3 puan
            if s.get("uyari") or x["p"] >= s["p"] - 0.03:
                continue
            # Yerine: aynı kupon türünün ölçütüne uyan, en az 15 dakika sonra başlayan, kuponda olmayan en iyi seçenek
            dengeli = kp["ad"] in ("Dengeli", "Akşam dengeli")
            alt, ust = (0.55, 0.75) if dengeli else (0.65, 1.01)
            tum = [(mm, y) for mm in bugunku if str(mm["id"]) not in kullanilan and mm["t"] > simdi_ms + 15 * 60e3
                   for y in secenekler(mm) if y["k"] != "iyms" and y["o"] >= 1.2 and not xg_uyar(mm, y) and not dusuyor(mm, y)]
            # Ölçüte uyan yoksa 5 puan gevşetilir; öneri yine de düşen seçenekten daha olası olmalı
            aday = [v for v in tum if alt <= v[1]["p"] < ust] or [v for v in tum if alt - 0.05 <= v[1]["p"] < ust and v[1]["p"] > x["p"]]
            aday.sort(key=lambda v: (not v[1]["dis"], -v[1]["e"] if dengeli else -v[1]["p"]))
            s["uyari"] = True
            metin = f"{kp['ad']} kuponundaki {s['ev']} – {s['dep']} ({s['ad']}) ihtimali %{s['p'] * 100:.0f} → %{x['p'] * 100:.0f} oldu (oran {s['o']:.2f} → {x['o']:.2f}). İlk 11 ya da bir haber piyasayı oynattı."
            if aday:
                mm, y = aday[0]
                s["oneri"] = {"id": str(mm["id"]), "ev": mm["ev"], "dep": mm["dep"], "lig": mm["lig"], "t": mm["t"], "k": y["k"], "i": y["i"], "ad": y["ad"], "o": y["o"], "p": round(y["p"], 4)}
                metin += f"\nKuponu henüz oynamadıysan yerine: {datetime.datetime.fromtimestamp(mm['t'] / 1000, TR):%H:%M} {mm['ev']} – {mm['dep']}: {y['ad']} ({y['o']:.2f}, %{y['p'] * 100:.0f})"
            gonder("Kupon uyarısı", metin, "warning", "high")

# Kupon sonuçlanınca telefona: tuttu mu, hangi maç yaktı
for kp in biten:
    oran = 1
    for s in kp["secim"]: oran *= s["o"]
    if kp["sonuc"] == "tuttu":
        gonder(f"{kp['ad']} kuponu tuttu", f"Toplam oran {oran:.2f}. " + ", ".join(f"{s['ev']}–{s['dep']} {s.get('skor', ['?', '?'])[0]}-{s.get('skor', ['?', '?'])[1]}" for s in kp["secim"]), "white_check_mark")
    else:
        yakan = [s for s in kp["secim"] if s.get("tuttu") is False]
        gonder(f"{kp['ad']} kuponu yattı", "Yakan: " + ", ".join(f"{s['ev']}–{s['dep']} ({s['ad']}, skor {s.get('skor', ['?', '?'])[0]}-{s.get('skor', ['?', '?'])[1]})" for s in yakan), "x")

# ---------- Günün kuponları ----------
if bugun not in kayit["gunler"] and simdi.hour >= 9:
    maclar = [m for m in bugunku if m["t"] > simdi_ms + 10 * 60e3]
    kuponlar = kuponlari_kur(maclar)
    if kuponlar:
        kayit["gunler"][bugun] = {"zaman": simdi.strftime("%H:%M"), "kuponlar": kuponlar}
        bitis = lambda kp: max(s["t"] for s in kp["secim"])
        satir = []
        for kp in sorted(kuponlar, key=bitis):
            oran = math.prod(s["o"] for s in kp["secim"]); p = math.prod(s["p"] for s in kp["secim"])
            satir.append(f"{kp['ad']} · oran {oran:.2f} · tutma %{p * 100:.0f}" + "".join(
                f"\n  {datetime.datetime.fromtimestamp(s['t'] / 1000, TR):%H:%M} {s['ev']} – {s['dep']}: {s['ad']} ({s['o']:.2f}, %{s['p'] * 100:.0f})" for s in kp["secim"]))
            if len(kp["secim"]) == 3 and kp["ad"] != "Sürpriz":
                iki = sorted(kp["secim"], key=lambda s: -s["p"])[:2]
                satir[-1] += f"\n  2'li istersen ilk ikisi: oran {iki[0]['o'] * iki[1]['o']:.2f}, tutma %{iki[0]['p'] * iki[1]['p'] * 100:.0f}"
        metin = "\n\n".join(satir) + "\n\nMaçlardan 1 saat önce ilk 11'ler açıklanınca tekrar bakılır; ihtimal düşerse uyarı gelir. Kupon iddaa'nın payını katlar; az parayla oyna."
        if gonder("Günün kuponları", metin, "tickets"):
            kayit["gunler"][bugun]["gonderildi"] = True
        print(len(kuponlar), "kupon kuruldu")

# Sabah bir kupon türü çıkmadıysa (yeterli maç yoktu), 18:00'e kadar kalan maçlardan tamamlanmaya çalışılır
gun = kayit["gunler"].get(bugun)
if gun and 9 <= simdi.hour < 18:
    mevcut = {kp["ad"] for kp in gun["kuponlar"]}
    kullanilan = {s["id"] for kp in gun["kuponlar"] for s in kp["secim"]}
    maclar = [m for m in bugunku if m["t"] > simdi_ms + 30 * 60e3 and str(m["id"]) not in kullanilan]
    for kp in kuponlari_kur(maclar) if len(mevcut) < 3 else []:
        if kp["ad"] in mevcut or kp["ad"] == "Sürpriz":
            continue
        gun["kuponlar"].append(kp)
        oran = math.prod(x["o"] for x in kp["secim"]); p = math.prod(x["p"] for x in kp["secim"])
        gonder(f"{kp['ad']} kuponu (yeni)", f"Sabah yeterli maç yoktu, kalan maçlardan kuruldu. Oran {oran:.2f} · tutma %{p * 100:.0f}" + "".join(
            f"\n  {datetime.datetime.fromtimestamp(x['t'] / 1000, TR):%H:%M} {x['ev']} – {x['dep']}: {x['ad']} ({x['o']:.2f}, %{x['p'] * 100:.0f})" for x in kp["secim"]), "tickets")
        print(kp["ad"], "kuponu sonradan kuruldu")

# Akşam kuponu (emir istedi): 18:00'de, 19:00 sonrası başlayan ve sabah kuponlarında olmayan maçlardan sağlam + dengeli.
# Maça yakın oranlar daha isabetli, büyük ligler de çoğunlukla akşam oynanıyor. 21:00'e kadar maç yoksa o gün atlanır.
gun = kayit["gunler"].get(bugun)
if gun and 18 <= simdi.hour < 21 and not gun.get("aksam"):
    kullanilan = {s["id"] for kp in gun["kuponlar"] for s in kp["secim"]}
    on9 = int(simdi.replace(hour=19, minute=0, second=0, microsecond=0).timestamp() * 1000)
    maclar = [m for m in bugunku if m["t"] >= max(on9, simdi_ms + 30 * 60e3) and str(m["id"]) not in kullanilan]
    aksam = [dict(kp, ad="Akşam " + ("sağlam" if kp["ad"] == "En sağlam" else "dengeli")) for kp in kuponlari_kur(maclar) if kp["ad"] != "Sürpriz"]
    if aksam:
        gun["kuponlar"] += aksam
        gun["aksam"] = simdi.strftime("%H:%M")
        satir = []
        for kp in aksam:
            oran = math.prod(x["o"] for x in kp["secim"]); p = math.prod(x["p"] for x in kp["secim"])
            satir.append(f"{kp['ad']} · oran {oran:.2f} · tutma %{p * 100:.0f}" + "".join(
                f"\n  {datetime.datetime.fromtimestamp(x['t'] / 1000, TR):%H:%M} {x['ev']} – {x['dep']}: {x['ad']} ({x['o']:.2f}, %{x['p'] * 100:.0f})" for x in kp["secim"]))
        gonder("Akşam kuponu", "\n\n".join(satir) + "\n\nİlk 11'ler açıklanınca tekrar bakılır; ihtimal düşerse uyarı gelir.", "tickets")
        print(len(aksam), "akşam kuponu kuruldu")
elif gun and simdi.hour >= 21:
    gun.setdefault("aksam", False)

kayit["gunler"] = {g: v for g, v in kayit["gunler"].items() if g >= (simdi - datetime.timedelta(days=120)).strftime("%Y-%m-%d")}
with open(os.path.join(K, "kuponlar.json"), "w", encoding="utf-8") as f:
    json.dump(kayit, f, ensure_ascii=False, separators=(",", ":"))
