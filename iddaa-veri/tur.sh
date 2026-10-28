#!/bin/bash
# Bir veri turu: iddaa-gunluk workflow'u bunu 5 dakikada bir, ~50 dakika boyunca tekrar çalıştırır
# (GitHub zamanlanmış işleri 5 dakikada bir değil, ancak saatte bir civarı başlatıyor).
# Depo kökünden çalışır. Adımlar workflow'daki eski sırayla aynı.
cd "$(dirname "$0")/.."
echo "=== tur $(date -u +%H:%M) ==="
(
  cd iddaa-veri
  NES="-sSfL --compressed -m 60 -A Mozilla/5.0 -H Referer:https://www.nesine.com/"
  curl $NES -o nesine-canli.json "https://bulten.nesine.com/api/bulten/getlivebultenv3" || echo "canlı bülten alınamadı"
  G0=$(date -u -d yesterday +%Y%m%d); G1=$(date -u +%Y%m%d); G2=$(date -u -d tomorrow +%Y%m%d)
  curl -sSfL -m 60 -o espn-futbol-0.json "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?limit=500&dates=$G0" || echo "espn futbol 0 yok"
  curl -sSfL -m 60 -o espn-futbol-1.json "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?limit=500&dates=$G1" || echo "espn futbol 1 yok"
  curl -sSfL -m 60 -o espn-futbol-2.json "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?limit=500&dates=$G2" || echo "espn futbol 2 yok"
  # "all" tablosunda olmayan ligler (sonuçları gelmiyordu): dün ve bugün, 8 paralel istek
  rm -f espn-futbol-ek-*.json
  for d in $G0 $G1; do
    echo eng.5 eng.trophy eng.fa_qual tur.2 ita.3 nor.3 uga.1 ger.3 fra.3 por.2 bel.2 aut.2 sui.1 sui.2 den.2 swe.2 pol.1 cze.1 rou.1 gre.2 isr.1 cyp.1 irl.1 sco.3 sco.4 wal.1 nir.1 aus.2 jpn.2 kor.1 uae.1 qat.1 egy.1 mar.1 tun.1 nga.1 ken.1 gha.1 rus.2 ukr.1 cro.1 srb.1 bul.1 hun.1 svk.1 slo.1 isl.1 fin.1 est.1 chn.2 tha.1 idn.1 mys.1 vie.1 sgp.1 uzb.1 irn.1 bhr.1 kuw.1 jor.1 | tr ' ' '\n' | \
      xargs -P 8 -I{} sh -c "curl -sSL -m 30 -o espn-futbol-ek-{}-$d.json -w '{} %{http_code}\n' 'https://site.api.espn.com/apis/site/v2/sports/soccer/{}/scoreboard?dates=$d' 2>&1 || true"
  done > ../iddaa-veri/espn-ek-durum.txt
  echo "ESPN ek lig: $(ls espn-futbol-ek-*.json 2>/dev/null | wc -l) dosya"
  for l in nba wnba; do
    curl -sSfL -m 60 -o "espn-$l.json" "https://site.api.espn.com/apis/site/v2/sports/basketball/$l/scoreboard" || echo "espn $l alınamadı"
  done
  NES="-sSfL --compressed -m 90 -A Mozilla/5.0 -H Referer:https://www.nesine.com/"
  curl $NES -o nesine.json "https://cdnbulten.nesine.com/api/bulten/getprebultenfull" || echo "bülten alınamadı"
  for s in 1 2; do
    curl $NES -o "oynanma-$s.json" "https://bulten.nesine.com/api/bulten/getOutcomePlayPercentages?sportId=$s" || echo "oynanma $s yok"
    curl $NES -o "mac-oynanma-$s.json" "https://bulten.nesine.com/api/bulten/geteventplaypercentages?sportId=$s" || echo "maç oynanma $s yok"
    curl $NES -o "kazananlar-$s.json" "https://bw.nesine.com/v1/BestWinnersBets?sportId=$s" || echo "kazananlar $s yok"
  done
  curl -sSfL -m 60 -A "Mozilla/5.0" -o fixtures.csv "https://www.football-data.co.uk/fixtures.csv" || echo "fikstür alınamadı"
  timeout 300 python3 smarkets.py || echo "Smarkets alınamadı"
  timeout 180 python3 polymarket.py || echo "Polymarket alınamadı"
  timeout 180 python3 oddsapi.py || echo "The Odds API alınamadı"
)
# Geçmiş istatistikler: 05 UTC'den sonra, veri.json bugün henüz güncellenmediyse bir kez (elle çalıştırınca ilk turda hep)
SON=$(python3 -c "import json; print(json.load(open('iddaa-veri/veri.json'))['guncelleme'])" 2>/dev/null || echo yok)
if [ "$GITHUB_EVENT_NAME" = "workflow_dispatch" ] || { [ "$(date -u +%H)" -ge 5 ] && [ "$SON" != "$(date -u +%F)" ]; }; then
  for s in 2425 2526 2627; do
    for l in E0 E1 E2 E3 EC SC0 SC1 SC2 SC3 D1 D2 I1 I2 SP1 SP2 F1 F2 N1 B1 P1 T1 G1; do
      curl -sSfL -m 60 -A "Mozilla/5.0" -o "iddaa-veri/${l}_${s}.csv" "https://www.football-data.co.uk/mmz4281/${s}/${l}.csv" || echo "yok: $l $s"
    done
  done
  for l in ARG AUT BRA DNK FIN IRL JPN NOR POL ROU SWE SWZ USA; do
    curl -sSfL -m 60 -A "Mozilla/5.0" -o "iddaa-veri/${l}.csv" "https://www.football-data.co.uk/new/${l}.csv" || echo "yok: $l"
  done
  python3 iddaa-veri/derle.py
fi
[ -f iddaa-veri/nesine.json ] && python3 iddaa-veri/bulten.py || echo "bülten yok, atlandı"
timeout 300 python3 iddaa-veri/canli.py || echo "canlı derlenemedi"
timeout 180 python3 iddaa-veri/xg.py || echo "xG alınamadı"
timeout 120 python3 iddaa-veri/bildir.py || echo "bildirim gönderilemedi"
timeout 120 python3 iddaa-veri/kuponlar.py || echo "kuponlar kurulamadı"
timeout 60 python3 iddaa-veri/karne.py || echo "karne gönderilemedi"
# Kaydet: sık güncellenen bülten tek kayıt üzerinde tutulur, depo şişmesin.
# force-with-lease: bu arada dala başka bir kayıt geldiyse onu silmez, gönderim reddedilir (sonraki turda yeniden).
git add iddaa-veri
git diff --cached --quiet && exit 0
if [ "$(git log -1 --format=%s)" = "iddaa bülteni" ]; then
  git commit -q --amend -m "iddaa bülteni" && git push -q --force-with-lease origin HEAD:claude/project-thread-brb60g
else
  git commit -q -m "iddaa bülteni" && git push -q origin HEAD:claude/project-thread-brb60g
fi
