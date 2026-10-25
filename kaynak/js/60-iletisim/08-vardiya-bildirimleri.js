  /* Onaylanan izin ya da takas, o günü içeren hazır vardiya planına işlenir */
  /* --- Vardiya bildirimleri ---
   1) Yazılmış bir haftada değişiklik olunca BS'ye bildirim gider (kim, hangi gün, eskisi → yenisi).
      Hafta, MS/MSY vardiya ekranından çıkınca "yazıldı" sayılır; boş hücrenin doldurulması yazmaya devam sayılır, değişiklik sayılmaz.
   2) Vardiyalar perşembe yazılır: perşembeden itibaren gelecek haftanın planı boşsa MS ve MSY'ye hatırlatma gider. */
  const VK = {
    M: 'Sabah',
    E: 'Akşam',
    T: 'Tam gün',
    A: 'Aracı',
    O: 'İzin (B)',
    R: 'Rapor',
    Y: 'Yıllık izin',
    H: 'Bayram'
  };
  const vdTxt = c =>
    !c || !c.k ? '' : (VK[c.k] || c.k) + (c.s && c.e && ['M', 'E', 'T', 'A'].includes(c.k) ? ` ${c.s}–${c.e}` : '');
  const wkAdd = (w, n) => {
    const d = new Date(w + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const monOf = () => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const wkAd = w => `${fmtD(w)} – ${fmtD(wkAdd(w, 6))}`;
  const dolu = W => !!W && Object.values(W).some(r => Array.isArray(r) && r.some(c => c && c.k));
  if (!Array.isArray(D.vd)) {
    D.vd = [
      {
        id: uid(),
        tip: 'deg',
        store: 's3',
        w: monOf(),
        by: 'AKÇAY O583 MS',
        at: isoAt(18, 40, -1),
        L: [
          {
            ad: 'Hüseyin Koç',
            gun: wkAdd(monOf(), Math.min(6, ((new Date().getDay() + 6) % 7) + 1)),
            from: 'Sabah 08:30–16:30',
            to: 'Rapor'
          }
        ]
      }
    ];
    save();
  }
  document.addEventListener(
    'click',
    e => {
      if (e.target.closest('#tabV'))
        setTimeout(() => {
          const L = notifs().filter(x => x.go && x.go.tab === 'v');
          if (L.length) {
            dismiss(L);
            updBell();
          }
        }, 50);
    },
    true
  );
  function vdKontrol(force) {
    const g = giris();
    if (!g || g.tip !== 'magaza') return;
    const b = document.body;
    if (!force && b.classList.contains('tab-v') && !document.hidden) return;
    const st = V.state(),
      S0 = st.schedules || {},
      E = {};
    (st.employees || []).forEach(e => {
      if (e && e.id) E[e.id] = (e.name || '').trim() || 'Çalışan';
    });
    const ilk = !st.vdSnap,
      snap = (st.vdSnap = st.vdSnap || {}),
      min = wkAdd(monOf(), -7);
    let deg = 0;
    Object.keys(snap).forEach(w => {
      if (w < min) delete snap[w];
    });
    Object.keys(S0)
      .filter(w => w >= monOf())
      .sort()
      .forEach(w => {
        const W = S0[w];
        if (!dolu(W)) return;
        const cur = {};
        Object.keys(W).forEach(id => {
          if (E[id] && Array.isArray(W[id])) cur[id] = W[id].slice(0, 7).map(vdTxt);
        });
        const old = snap[w];
        snap[w] = cur;
        if (ilk) return;
        if (!old) {
          D.vd.push({
            id: uid(),
            tip: 'yaz',
            store: 'me',
            w,
            by: g.ad + ' · ' + (g.unvan || ''),
            at: new Date().toISOString(),
            L: []
          });
          deg++;
          return;
        }
        const L = [];
        Object.keys(cur).forEach(id => {
          const o = old[id];
          if (!o) return;
          cur[id].forEach((t, i) => {
            if (o[i] && o[i] !== t) L.push({ ad: E[id], gun: wkAdd(w, i), from: o[i], to: t || 'Boş' });
          });
        });
        if (L.length) {
          D.vd.push({
            id: uid(),
            tip: 'deg',
            store: 'me',
            w,
            by: g.ad + ' · ' + (g.unvan || ''),
            at: new Date().toISOString(),
            L
          });
          deg++;
        }
      });
    if (D.vd.length > 60) D.vd = D.vd.slice(-60);
    V.save();
    if (deg) {
      save();
      updBell();
      const x = D.vd[D.vd.length - 1];
      V.toast(
        x.tip === 'yaz'
          ? "Vardiya yazıldı, BS'ye bildirildi."
          : `Vardiya değişikliği BS'ye bildirildi (${x.L.length} değişiklik).`
      );
    }
  }
  window.__vdKontrol = vdKontrol;
  setInterval(() => vdKontrol(), 20000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) vdKontrol(true);
  });
  document.addEventListener(
    'click',
    e => {
      if (e.target.closest('.tabbar button,[role="tab"],[data-hm],#moreSheet button'))
        setTimeout(() => vdKontrol(), 50);
    },
    true
  );
  setTimeout(() => vdKontrol(), 800);
  function vdHafta(w) {
    if (!w || !V.setWeek) return;
    const st = V.state();
    if (st.weekStart !== w) {
      V.setWeek(w);
      V.toast(`${wkAd(w)} haftası açıldı. Plan oluştur'a bas.`);
    }
  }
  window.__vdHafta = vdHafta;
  function vdSatir(c) {
    return `${esc(c.ad)} · ${fmtD(c.gun)}: ${esc(c.from)} → ${esc(c.to)}`;
  }
  function vdBox(id) {
    const L = D.vd
      .filter(x => x.store === id)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 4);
    if (!L.length) return '';
    return `<div class="box"><h2>Vardiya değişiklikleri</h2><ul class="vd-list">${L.map(x => `<li><b>${x.tip === 'yaz' ? 'Haftalık vardiya yazıldı' : 'Vardiya değişti'} · ${wkAd(x.w)}</b>${x.L.map(c => `<span>${vdSatir(c)}</span>`).join('')}<small>${esc(x.by)} · ${when(x.at)}</small></li>`).join('')}</ul></div>`;
  }
  /* Perşembe hatırlatması: gelecek haftanın planı boşsa (perşembe-pazar) MS ve MSY'ye */
  function vdGunu() {
    const g = giris();
    if (!g || g.tip !== 'magaza' || !['MS', 'MSY'].includes(g.unvan)) return null;
    const wd = (new Date().getDay() + 6) % 7;
    if (wd < 3) return null;
    const w = wkAdd(monOf(), 7),
      W = (V.state().schedules || {})[w];
    if (dolu(W)) return null;
    return {
      w,
      gec: wd > 3,
      t: wd === 3 ? 'Bugün vardiya günü' : 'Gelecek haftanın vardiyası yazılmadı',
      d: `${wkAd(w)} haftasının planını yaz`
    };
  }
  function vdHatirlat() {
    const g = giris(),
      ok = g && g.tip === 'magaza' && ['MS', 'MSY'].includes(g.unvan);
    try {
      if (window.AndroidApp && AndroidApp.scheduleVardiya)
        AndroidApp.scheduleVardiya(
          JSON.stringify(
            ok
              ? { gun: 4, saat: '09:00', baslik: 'Vardiya günü', metin: 'Gelecek haftanın vardiyasını yaz.' }
              : { kapali: true }
          )
        );
    } catch (e) {}
    if (!ok) return;
    const v = vdGunu(),
      st = V.state();
    if (!v || st.vdBild === today()) return;
    st.vdBild = today();
    V.save();
    if (!(window.AndroidApp && AndroidApp.scheduleVardiya))
      try {
        if ('Notification' in window && Notification.permission === 'granted')
          new Notification(v.t, { body: v.d, tag: 'vardiya-gunu' });
      } catch (e) {}
  }
  function planIsle(x) {
    const st = V.state(),
      E = st.employees || [],
      K = { B: 'O', Y: 'Y', R: 'R' }[x.tur];
    const emp = a => E.find(e => e && ((x.kisiId && e.id === a) || nrm(e.name) === nrm(a)));
    const p = x.tur === 'T' ? null : E.find(e => e && e.id === x.kisiId) || emp(x.ad);
    if (x.tur !== 'T' && (!K || !p)) return 0;
    const days = [];
    for (
      let d = new Date(x.bas + 'T12:00:00');
      d <= new Date((x.bit || x.bas) + 'T12:00:00');
      d.setDate(d.getDate() + 1)
    )
      days.push(new Date(d));
    let n = 0;
    days.forEach(d => {
      for (const w of Object.keys(st.schedules || {})) {
        const W = st.schedules[w],
          i = Math.round((d - new Date(w + 'T12:00:00')) / 864e5);
        if (i < 0 || i > 6 || !W || !Object.keys(W).length) continue;
        if (x.tur === 'T') {
          const a = E.find(e => e && e.id === x.kisiId) || E.find(e => e && nrm(e.name) === nrm(x.ad)),
            b = E.find(e => e && nrm(e.name) === nrm(x.kimle));
          if (!a || !b || !W[a.id] || !W[b.id]) continue;
          const t = W[a.id][i];
          W[a.id][i] = W[b.id][i];
          W[b.id][i] = t;
          n++;
        } else {
          if (!W[p.id]) W[p.id] = [];
          W[p.id][i] = { k: K };
          n++;
        }
      }
    });
    if (n) {
      V.save();
    }
    return n;
  }
