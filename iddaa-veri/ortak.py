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

def benzer(a, b):
    a, b = sade(a), sade(b)
    if not a or not b:
        return 0
    if a in b or b in a:
        return 0.9
    return difflib.SequenceMatcher(None, a, b).ratio()
