# Geçici araştırma: ESPN'in futbol lig listesinden sonuç alabileceğimiz ek ligleri bulur (log'a yazar).
import json, urllib.request
def al(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
        return json.load(r)
try:
    j = al("https://site.api.espn.com/apis/site/v2/sports/soccer/leagues?limit=1000")
    ls = j.get("leagues") or (j.get("sports") or [{}])[0].get("leagues") or []
    print("site ligler:", len(ls), [(l.get("slug") or l.get("abbreviation"), l.get("name")) for l in ls][:400])
except Exception as x:
    print("site ligler yok:", x)
try:
    j = al("https://sports.core.api.espn.com/v2/sports/soccer/leagues?limit=1000")
    print("core ligler:", j.get("count"), [i.get("$ref", "").split("/leagues/")[-1].split("?")[0] for i in j.get("items", [])])
except Exception as x:
    print("core ligler yok:", x)
for s in ("tur.cup", "tur.2", "eng.5", "eng.6", "eng.7", "eng.conf.n", "eng.conf.s", "ita.3", "nor.3", "por.cup", "pol.cup", "aut.cup", "svn.2", "uga.1", "ksa.2"):
    try:
        j = al(f"https://site.api.espn.com/apis/site/v2/sports/soccer/{s}/scoreboard")
        print("slug", s, "->", (j.get("leagues") or [{}])[0].get("name"), len(j.get("events", [])), "maç")
    except Exception as x:
        print("slug", s, "yok", x)
