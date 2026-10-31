# Kalıcı kayıt: biten her maç ve sonuçlanan her kupon, aylık CSV dosyalarına bir kez eklenir ve hiç silinmez.
# kiyas.json 150 günde, kuponlar.json 120 günde eskiyi atar; bu dosyalar atmaz. Excel'de açılır (; ayraçlı, UTF-8 BOM).
# -> arsiv/maclar-YYYY-MM.csv, arsiv/kuponlar.csv, arsiv/ozet.json (uygulamadaki Kayıt bölümü için)
import csv, json, os, datetime
from ortak import oku_json, gercek_k, K, TR

A = os.path.join(K, "arsiv")
simdi_ms = datetime.datetime.now(TR).timestamp() * 1000
os.makedirs(A, exist_ok=True)
MAC_BASLIK = ["id", "tarih", "lig", "ev", "deplasman", "ilk yarı", "maç sonu", "iddaa 1", "iddaa X", "iddaa 2", "iddaa 2.5 alt", "iddaa 2.5 üst",
              "ihtimal 1 %", "ihtimal X %", "ihtimal 2 %", "tahmin", "tahmin tuttu", "2.5 tahmini", "2.5 tuttu", "kaynaklar"]
KUPON_BASLIK = ["gün", "kupon", "sonuç", "toplam oran", "tutma ihtimali %", "seçimler"]

def tr(x):
    # Türkçe Excel ondalık ayracı virgül
    return str(x).replace(".", ",") if isinstance(x, float) else x

def ekle(yol, baslik, satirlar):
    yeni = not os.path.exists(yol)
    with open(yol, "a", encoding="utf-8-sig" if yeni else "utf-8", newline="") as f:
        w = csv.writer(f, delimiter=";")
        if yeni:
            w.writerow(baslik)
        w.writerows([[tr(x) for x in r] for r in satirlar])

ozet = oku_json("arsiv/ozet.json") or {"maclar": [], "kuponlar": [], "say": {"mac": 0, "tahmin_tuttu": 0, "u25_tuttu": 0, "kupon": 0, "kupon_tuttu": 0}}
kimlik = oku_json("arsiv/kimlik.json") or {"mac": [], "kupon": []}   # kayda geçenler (bir kez yazılsın)
yazilan = set(kimlik["mac"])

# ---------- Maçlar ----------
aylar = {}
for i, k in (oku_json("kiyas.json") or {}).get("maclar", {}).items():
    if i in yazilan or not k.get("sonuc") or not k.get("k"):
        continue
    h, a = k["sonuc"]
    t = datetime.datetime.fromtimestamp(k["t"] / 1000, TR)
    o = k.get("o") or {}
    g = gercek_k(k["k"], "ms") or (k["k"].get("iddaa") or {}).get("ms")
    g25 = gercek_k(k["k"], "au25") or (k["k"].get("iddaa") or {}).get("au25")
    sonuc = 0 if h > a else 1 if h == a else 2
    tah = max(range(3), key=lambda x: g[x]) if g else None
    t25 = (1 if g25[1] > g25[0] else 0) if g25 else None
    ust = 1 if h + a > 2 else 0
    oms, o25 = o.get("ms") or [None] * 3, o.get("au25") or [None] * 2
    kay = ",".join(x for x in k["k"] if x not in ("iddaa", "halk")) or "iddaa"
    satir = [i, t.strftime("%Y-%m-%d %H:%M"), k["lig"], k["ev"], k["dep"], "-".join(map(str, k["iy"])) if k.get("iy") else "",
             f"{h}-{a}", *oms, *o25, *([round(x * 100, 1) for x in g] if g else [""] * 3),
             "1X2"[tah] if tah is not None else "", ("evet" if tah == sonuc else "hayır") if tah is not None else "",
             ("Üst" if t25 else "Alt") if t25 is not None else "", ("evet" if t25 == ust else "hayır") if t25 is not None else "", kay]
    aylar.setdefault(t.strftime("%Y-%m"), []).append(satir)
    yazilan.add(i)
    s = ozet["say"]
    s["mac"] += 1
    s["tahmin_tuttu"] += tah == sonuc
    s["u25_tuttu"] += t25 == ust
    ozet["maclar"].append({"t": k["t"], "lig": k["lig"], "ev": k["ev"], "dep": k["dep"], "skor": [h, a], "iy": k.get("iy"),
                           "tah": "1X2"[tah] if tah is not None else None, "p": round(g[tah], 3) if g else None, "ok": tah == sonuc})
for ay, satirlar in sorted(aylar.items()):
    ekle(os.path.join(A, f"maclar-{ay}.csv"), MAC_BASLIK, sorted(satirlar, key=lambda r: r[1]))

# ---------- Kuponlar ----------
kup_yazilan = set(kimlik["kupon"])
yeni_kupon = []
for gun, v in sorted((oku_json("kuponlar.json") or {}).get("gunler", {}).items()):
    for kp in v["kuponlar"]:
        anahtar = gun + "|" + kp["ad"]
        if anahtar in kup_yazilan or kp.get("sonuc") not in ("tuttu", "yattı", "sonuç yok"):
            continue
        # Yatan kuponda kalan maçların skoru da gelsin (en geç 2 gün beklenir), kayıtta "?" kalmasın
        if any(s.get("tuttu") is None for s in kp["secim"]) and max(s["t"] for s in kp["secim"]) > simdi_ms - 2 * 864e5:
            continue
        oran = p = 1
        for s in kp["secim"]:
            oran *= s["o"]; p *= s["p"]
        secim = " | ".join(f"{s['ev']}-{s['dep']} {s['ad']} ({s['o']:.2f}) " + ("✓" if s.get("tuttu") else "✗" if s.get("tuttu") is False else "?")
                           + (f" {s['skor'][0]}-{s['skor'][1]}" if s.get("skor") else "") for s in kp["secim"])
        yeni_kupon.append([gun, kp["ad"], kp["sonuc"], round(oran, 2), round(p * 100, 1), secim])
        kup_yazilan.add(anahtar)
        ozet["kuponlar"].append({"gun": gun, "ad": kp["ad"], "sonuc": kp["sonuc"], "oran": round(oran, 2), "p": round(p, 3)})
        if kp["sonuc"] != "sonuç yok":
            ozet["say"]["kupon"] += 1
            ozet["say"]["kupon_tuttu"] += kp["sonuc"] == "tuttu"
if yeni_kupon:
    ekle(os.path.join(A, "kuponlar.csv"), KUPON_BASLIK, yeni_kupon)

# Uygulamaya gömülen özet küçük kalsın: son 400 maç; tam liste CSV'lerde
with open(os.path.join(A, "kimlik.json"), "w", encoding="utf-8") as f:
    json.dump({"mac": sorted(yazilan), "kupon": sorted(kup_yazilan)}, f, separators=(",", ":"))
ozet["maclar"] = sorted(ozet["maclar"], key=lambda m: m["t"])[-400:]
ozet["dosyalar"] = sorted(f for f in os.listdir(A) if f.endswith(".csv"))
ozet["zaman"] = datetime.datetime.now(TR).strftime("%Y-%m-%d %H:%M")
with open(os.path.join(A, "ozet.json"), "w", encoding="utf-8") as f:
    json.dump(ozet, f, ensure_ascii=False, separators=(",", ":"))
print(sum(len(x) for x in aylar.values()), "maç ve", len(yeni_kupon), "kupon kayda eklendi; toplam", ozet["say"])
