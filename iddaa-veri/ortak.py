# bulten.py ve canli.py'nin ortak yardımcıları
import json, os, difflib, unicodedata, re, datetime, gzip

K = os.path.dirname(os.path.abspath(__file__))
TR = datetime.timezone(datetime.timedelta(hours=3))

def oku_json(ad):
    yol = os.path.join(K, ad)
    if not os.path.exists(yol):
        return None
    ac = gzip.open if ad.endswith(".gz") else open
    try:
        with ac(yol, "rt", encoding="utf-8") as f:
            return json.load(f)
    except (ValueError, OSError):
        return None

def sade(s):
    s = unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode()
    s = re.sub(r"\b(fc|cf|sc|ac|afc|fk|sk|cd|ud|sd|as|us|ss|calcio|club|de|the|u21|u23|ii|b)\b", " ", s)
    s = s.replace("utd", "united").replace("man.", "manchester").replace("ath.", "athletic")
    return re.sub(r"[^a-z0-9]", "", s)

# iddaa milli takımları Türkçe yazıyor, ESPN İngilizce: 12-14 Kasım'da milli maç kuponları bu yüzden sonuçlanmadı
ULKE = {"Almanya": "Germany", "Arnavutluk": "Albania", "Avusturya": "Austria", "Azerbaycan": "Azerbaijan", "Belçika": "Belgium",
    "Beyaz Rusya": "Belarus", "Belarus": "Belarus", "Bosna Hersek": "Bosnia-Herzegovina", "Bulgaristan": "Bulgaria", "Cebelitarık": "Gibraltar",
    "Çekya": "Czechia", "Danimarka": "Denmark", "Ermenistan": "Armenia", "Estonya": "Estonia", "Faroe Adaları": "Faroe Islands",
    "Finlandiya": "Finland", "Fransa": "France", "Galler": "Wales", "Gürcistan": "Georgia", "Hırvatistan": "Croatia", "Hollanda": "Netherlands",
    "İngiltere": "England", "İrlanda": "Republic of Ireland", "İskoçya": "Scotland", "İspanya": "Spain", "İsrail": "Israel", "İsveç": "Sweden",
    "İsviçre": "Switzerland", "İtalya": "Italy", "İzlanda": "Iceland", "Karadağ": "Montenegro", "Kazakistan": "Kazakhstan", "Kıbrıs": "Cyprus",
    "G. Kıbrıs": "Cyprus", "Kosova": "Kosovo", "Kuzey İrlanda": "Northern Ireland", "K. Makedonya": "North Macedonia", "Kuzey Makedonya": "North Macedonia",
    "Letonya": "Latvia", "Lihtenştayn": "Liechtenstein", "Litvanya": "Lithuania", "Lüksemburg": "Luxembourg", "Macaristan": "Hungary",
    "Malta": "Malta", "Moldova": "Moldova", "Norveç": "Norway", "Polonya": "Poland", "Portekiz": "Portugal", "Romanya": "Romania",
    "Rusya": "Russia", "San Marino": "San Marino", "Sırbistan": "Serbia", "Slovakya": "Slovakia", "Slovenya": "Slovenia", "Türkiye": "Türkiye",
    "Ukrayna": "Ukraine", "Yunanistan": "Greece", "Andorra": "Andorra",
    "Cezayir": "Algeria", "Fas": "Morocco", "Tunus": "Tunisia", "Libya": "Libya", "Mısır": "Egypt", "Sudan": "Sudan", "Nijerya": "Nigeria",
    "Gana": "Ghana", "Kamerun": "Cameroon", "Fildişi Sahili": "Ivory Coast", "Senegal": "Senegal", "Mali": "Mali", "Gine": "Guinea",
    "Gine Bissau": "Guinea-Bissau", "Ekvator Ginesi": "Equatorial Guinea", "Yeşil Burun Adaları": "Cape Verde", "Burkina Faso": "Burkina Faso",
    "Moritanya": "Mauritania", "Gambiya": "Gambia", "Liberya": "Liberia", "Sierra Leone": "Sierra Leone", "Togo": "Togo", "Benin": "Benin",
    "Nijer": "Niger", "Çad": "Chad", "Orta Afrika Cum.": "Central African Republic", "Kongo": "Congo", "Kongo DC": "DR Congo", "Gabon": "Gabon",
    "Angola": "Angola", "Zambiya": "Zambia", "Zimbabve": "Zimbabwe", "Mozambik": "Mozambique", "Malavi": "Malawi", "Tanzanya": "Tanzania",
    "Kenya": "Kenya", "Uganda": "Uganda", "Ruanda": "Rwanda", "Burundi": "Burundi", "Etiyopya": "Ethiopia", "Eritre": "Eritrea",
    "Somali": "Somalia", "Güney Afrika": "South Africa", "Namibya": "Namibia", "Botsvana": "Botswana", "Lesotho": "Lesotho",
    "Esvatini": "Eswatini", "Madagaskar": "Madagascar", "Komorlar": "Comoros", "Mauritius": "Mauritius", "Güney Sudan": "South Sudan",
    "Arjantin": "Argentina", "Brezilya": "Brazil", "Uruguay": "Uruguay", "Paraguay": "Paraguay", "Şili": "Chile", "Kolombiya": "Colombia",
    "Ekvador": "Ecuador", "Peru": "Peru", "Bolivya": "Bolivia", "Venezuela": "Venezuela", "Meksika": "Mexico", "ABD": "United States",
    "Kanada": "Canada", "Kosta Rika": "Costa Rica", "Panama": "Panama", "Honduras": "Honduras", "Guatemala": "Guatemala", "Jamaika": "Jamaica",
    "Haiti": "Haiti", "El Salvador": "El Salvador", "Nikaragua": "Nicaragua", "Porto Riko": "Puerto Rico", "Dominika": "Dominica",
    "Dominik Cum.": "Dominican Republic", "Küba": "Cuba", "Trinidad & T.": "Trinidad and Tobago", "Antigua & Bar.": "Antigua and Barbuda",
    "ST Kitts ve Nevis": "St. Kitts and Nevis", "Saint Lucia": "St. Lucia", "Grenada": "Grenada", "Barbados": "Barbados", "Bermuda": "Bermuda",
    "Curaçao": "Curacao", "Aruba": "Aruba", "Surinam": "Suriname", "Guyana": "Guyana", "Martinik": "Martinique", "Guadeloupe": "Guadeloupe",
    "Montserrat": "Montserrat",
    "Japonya": "Japan", "Güney Kore": "South Korea", "Kuzey Kore": "North Korea", "Çin": "China PR", "Avustralya": "Australia",
    "Yeni Zelanda": "New Zealand", "İran": "Iran", "Irak": "Iraq", "Suudi Arabistan": "Saudi Arabia", "Katar": "Qatar",
    "B. A. Emirlikleri": "United Arab Emirates", "Umman": "Oman", "Bahreyn": "Bahrain", "Kuveyt": "Kuwait", "Ürdün": "Jordan",
    "Suriye": "Syria", "Lübnan": "Lebanon", "Filistin": "Palestine", "Özbekistan": "Uzbekistan", "Tacikistan": "Tajikistan",
    "Kırgızistan": "Kyrgyzstan", "Türkmenistan": "Turkmenistan", "Hindistan": "India", "Tayland": "Thailand", "Vietnam": "Vietnam",
    "Endonezya": "Indonesia", "Malezya": "Malaysia", "Filipinler": "Philippines", "Singapur": "Singapore"}
_ULKE_SIRALI = sorted(ULKE.items(), key=lambda x: -len(x[0]))   # en uzun önce: "Gine Bissau" "Gine"den önce
def _ulke(s):
    # "İskoçya U21" gibi adlarda ülke kısmı çevrilir, ek (U21, U20) korunur
    for tr, en in _ULKE_SIRALI:
        if s == tr or s.startswith(tr + " "):
            return en + s[len(tr):]
    return s

def benzer(a, b):
    a, b = sade(_ulke(a)), sade(_ulke(b))
    if not a or not b:
        return 0
    if a in b or b in a:
        return 0.9
    return difflib.SequenceMatcher(None, a, b).ratio()


def marjsiz(o):
    # Oranlardan bahisçi payını ayırıp ihtimal çıkarır. 2'li pazarda (alt/üst) payı orantılı dağıtmak en isabetlisi.
    # 3'lü pazarda (MS) Shin yöntemi: bahisçi payın çoğunu sürpriz sonuçlara yüklüyor, orantılı dağıtım favorinin
    # ihtimalini düşük çıkarıyordu (iddaa 1.349 maç: %60+ favoriler %68 denip %74 tuttu; Shin ile %71 / %70).
    if not o or not all(o):
        return None
    q = [1 / x for x in o]
    B = sum(q)
    if len(o) != 3:
        return [x / B for x in q]
    lo, hi = 0.0, 0.4
    for _ in range(50):
        z = (lo + hi) / 2
        p = [((z * z + 4 * (1 - z) * x * x / B) ** 0.5 - z) / (2 * (1 - z)) for x in q]
        lo, hi = (z, hi) if sum(p) > 1 else (lo, z)
    s = sum(p)
    return [x / s for x in p]


# Bildirim kanalı ve avantaj eşiği (bildir.py, karne.py)
KONU = "iddaa-analiz-7e4d51316682"
ESIK = 0.05  # dış kaynaklı gerçek olasılıkta en az %5 avantaj
# Gerçek olasılıkta kaynak ağırlıkları (uygulamadaki varsayılanla aynı)
W = {"pinnacle": 4, "borsa": 3, "piyasa": 2, "dk": 1, "polymarket": 1}

def gercek_k(k, pz):
    # kiyas.json kaydındaki kaynaklardan ağırlıklı ortalama olasılık
    ks = [(k[a][pz], W[a]) for a in W if k.get(a, {}).get(pz)]
    if not ks:
        return None
    w = sum(x[1] for x in ks)
    return [sum(x[0][i] * x[1] for x in ks) / w for i in range(len(ks[0][0]))]
