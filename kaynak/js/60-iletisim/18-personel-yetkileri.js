  /* --- personel yetkileri: BS her mağaza için personelin hangi bölümleri göreceğini açıp kapatır --- */
  const IST = [
    ['skt', 'Sabah SKT dönüşü', "Her sabah 09.15'e kadar SKT kontrolü"],
    ['rapor', 'Akşam raporu', 'Günlük ciro ve müşteri sayısı'],
    ['irs', 'İrsaliyeler', 'Gelen irsaliye girildi mi, takıldı mı'],
    ['ayin', 'Ayın ürünleri', 'Ayın ürünlerinden günlük satış adedi']
  ];
  const ist = () => Object.assign({ skt: true, rapor: true, irs: true, ayin: true }, D.istek || {});
  window.__ist = () => ist();
  function istApply() {
    const b = document.body,
      I = ist();
    IST.forEach(([k]) => b.classList.toggle('no-' + k, !I[k]));
    const none = !IST.some(([k]) => I[k]);
    b.classList.toggle('no-daily', none);
    if (none) {
      const d = document.getElementById('bsDaily');
      if (d && !d.hidden) {
        const r = document.querySelector('[data-bsm="rc"]');
        if (r) r.click();
      }
    }
  }
  function drawIst() {
    const el = $('istBody');
    if (!el) return;
    const I = ist();
    el.innerHTML = `<p class="hint" style="margin:0 0 10px">Mağazalardan her gün hangi dönüşleri istediğini seç. Kapattıkların mağazanın BS sekmesinde ve özetlerde görünmez.</p>
  <ul class="yk-list">${IST.map(([k, t, d]) => `<li><div><b>${t}</b><small>${d}</small></div><button type="button" class="yk-sw" role="switch" data-ist="${k}" aria-checked="${!!I[k]}" aria-label="${t}"><i></i></button></li>`).join('')}</ul>`;
  }
  $('istBody').addEventListener('click', e => {
    const b = e.target.closest('[data-ist]');
    if (!b) return;
    const k = b.dataset.ist,
      I = ist();
    I[k] = !I[k];
    D.istek = I;
    save();
    drawIst();
    istApply();
    render();
    V.toast(`${IST.find(x => x[0] === k)[1]} ${I[k] ? 'istenecek' : 'artık istenmeyecek'}.`);
  });
  const YK = [
    ['v', 'Sevkiyat bilgisi', 'Araç plakası, saat ve şoför'],
    ['s', 'SKT kontrol', 'Ürün ekleme, satıldı ve fire'],
    ['b', 'BS raporu', "BS'nin istediği günlük dönüşler"],
    ['c', 'BS talepleri', "BS'den gelen görev, bilgi ve kontrol istekleri"],
    ['a', 'Ay başı', 'Ciro ve saat hedefi']
  ];
  const YK_DEF = { v: false, s: true, b: false, c: false, a: false };
  const ykOf = id => Object.assign({}, YK_DEF, (D.yetki || {})[id] || {});
  let ykStore = 'me';
  function ykApply() {
    const b = document.body,
      y = ykOf('me');
    YK.forEach(([k]) => b.classList.toggle('yk-' + k, !!y[k]));
    const tl = $('tabC').querySelector('.tl');
    if (tl)
      tl.textContent =
        b.dataset.role === 'depo' ? 'Sevkiyat' : b.dataset.role === 'staff' && !y.c ? 'Grup' : 'İletişim';
    const st = V.state().tab,
      map = { s: 's', b: 'b', a: 'a' };
    if (b.dataset.role === 'staff' && map[st] && !y[st] && window.__setTab) window.__setTab('h');
  }
  function drawYk() {
    const el = $('ykBody');
    if (!el) return;
    const y = ykOf(ykStore);
    el.innerHTML = `<p class="hint" style="margin:0 0 10px">Personelin (MS ve MSY hariç) hangi bölümleri göreceğini sen belirlersin. Vardiya, Aktüel ve Mağaza grubu her zaman açık.</p>
  <div class="ic-pick">${D.stores.map(s => `<button type="button" data-ykst="${s.id}" aria-pressed="${ykStore === s.id}">${esc(s.name)}</button>`).join('')}</div>
  <ul class="yk-list">${YK.map(([k, t, d]) => `<li><div><b>${t}</b><small>${d}</small></div><button type="button" class="yk-sw" role="switch" data-yk="${k}" aria-checked="${!!y[k]}" aria-label="${t}"><i></i></button></li>`).join('')}</ul>`;
  }
  $('ykBody').addEventListener('click', e => {
    let b;
    if ((b = e.target.closest('[data-ykst]'))) {
      ykStore = b.dataset.ykst;
      drawYk();
      return;
    }
    if ((b = e.target.closest('[data-yk]'))) {
      const k = b.dataset.yk;
      D.yetki = D.yetki || {};
      const y = ykOf(ykStore);
      y[k] = !y[k];
      D.yetki[ykStore] = y;
      save();
      drawYk();
      ykApply();
      const t = YK.find(x => x[0] === k)[1];
      V.toast(`${S(ykStore).name} personeli: ${t} ${y[k] ? 'açıldı' : 'kapatıldı'}.`);
    }
  });
  $('icBody').addEventListener('change', e => {
    if (e.target.id !== 'rhIl') return;
    rhIl = e.target.value;
    const q = $('rhQ');
    if (q) q.value = '';
    const d = rhDef();
    $('rhT').innerHTML = d.t;
    $('rhL').innerHTML = rhRows(d.L.slice(0, 40));
    $('rhMore').hidden = d.L.length <= 40;
  });
  $('icBody').addEventListener('input', e => {
    if (e.target.id === 'rhQ') {
      const M = MG();
      if (!M) return;
      const q = e.target.value.trim();
      let t,
        L,
        more = false;
      if (q) {
        const A = M.ara(q, 41, true);
        more = A.length > 40;
        L = A.slice(0, 40);
        t = L.length ? `${more ? '40+' : L.length} sonuç` : 'Bu aramayla mağaza bulunamadı.';
      } else {
        const d = rhDef();
        t = d.t;
        more = d.L.length > 40;
        L = d.L.slice(0, 40);
      }
      $('rhT').innerHTML = t;
      $('rhL').innerHTML = rhRows(L);
      $('rhMore').hidden = !more;
      return;
    }
    if (e.target.id === 'ikQ') {
      const q = nrm(e.target.value);
      document.querySelectorAll('#ikL [data-ikv]').forEach(li => {
        li.hidden = !!q && !li.dataset.q.includes(q);
      });
      return;
    }
    if (e.target.id !== 'dpQ') return;
    const q = nrm(e.target.value);
    let n = 0;
    document.querySelectorAll('#dpPick [data-dpst]').forEach(b => {
      const ok = !q || nrm(b.textContent + ' ' + (b.dataset.q || '')).includes(q);
      b.hidden = !ok;
      if (ok) n++;
    });
    $('dpNone').hidden = n > 0;
  });
  window.__renderIc = reset => {
    if (reset) ui = { page: 'home' };
    D.stores[0].name = myName();
    ykApply();
    drawYk();
    istApply();
    drawIst();
    render();
  };
  ykApply();
  drawYk();
  istApply();
  drawIst();
  window.__icSum = () => {
    const I = ist(),
      n = D.stores.length,
      nx = canSevk() ? sevkOf('me')[0] : null;
    return {
      n,
      vdGun: vdGunu(),
      sevk: nx
        ? `${gunAd(nx.tarih)} ${nx.saat} · ${nx.plaka}${durak(nx).length > 1 ? ` · ${durak(nx).indexOf('me') + 1}. sıradasın (${durak(nx).length} mağaza)` : ''}`
        : null,
      sevkBs: D.sevk.filter(x => x.tarih === today()).length,
      sevkYarin: D.sevk.filter(x => x.tarih === dstr(1)).length,
      grup: grupUnread().length,
      staff: isStaff(),
      ist: I,
      ustU: giris() && giris().tip === 'pm' ? ustTumU() : 0,
      ustK: giris() && giris().tip === 'pm' ? ustKey() : '',
      pmU: kad() === 'pm' ? bsPeople().reduce((a, p) => a + pmUnreadOf(nrm(p.ad)).length, 0) : 0,
      bsg: bsUnread().length,
      sk: D.stores.filter(s => msktOf(s.id)).length,
      rp: D.stores.filter(s => raporOf(s.id)).length,
      open: D.requests.filter(r => r.to.some(id => !answered(r, id))).length,
      svWait: D.savunma.filter(s => !s.cevap).length,
      svNew: D.savunma.filter(s => s.cevap && !s.sonuc).length,
      mskt: !!myMskt(),
      rapor: !!myRapor(),
      wait: myReqs().filter(r => !answered(r, 'me')).length,
      sv: D.savunma.filter(s => isMine(s) && !s.cevap).length,
      izB: izBekl().length,
      ikB: isIk() ? D.ise.filter(x => x.durum === 'ik').length : 0,
      iseEk: canIse() ? D.ise.filter(x => x.store === 'me' && x.durum === 'eksik').length : 0
    };
  };
  window.__icGo = (p, id) => {
    if (window.__setTab) window.__setTab('c');
    ui = {
      page: p,
      id: id || null,
      form: p === 'new' ? newForm() : p === 'svnew' ? svForm() : p === 'izin' ? {} : null
    };
    render();
  };
  // giriş yapınca: bekleyen savunma ya da talep varsa bildirim
  window.__icLogin = () => {
    const g = giris();
    ui = { page: 'home' };
    render();
    updBell();
    vdHatirlat();
    if (!g || g.tip !== 'magaza') return;
    if (isStaff()) {
      const s2 = D.savunma.find(x => isMine(x) && !x.cevap);
      if (s2) showNote('🔔 Savunman isteniyor', s2.olay + ' · son gün ' + fmtD(s2.son), { sv: s2.id });
      else {
        const gu = grupUnread();
        if (gu.length)
          showNote(
            `💬 Mağaza grubu: ${gu.length} yeni mesaj`,
            gu[gu.length - 1].from + ': ' + gu[gu.length - 1].text,
            {}
          );
      }
      return;
    }
    const sv = D.savunma.find(x => isMine(x) && !x.cevap);
    if (sv) return showNote('🔔 Savunman isteniyor', sv.olay + ' · son gün ' + fmtD(sv.son), { sv: sv.id });
    const w = myReqs().filter(r => !answered(r, 'me'));
    if (w.length) showNote(`🔔 BS'den ${w.length} talep yanıt bekliyor`, w[0].title, { req: w[0].id });
  };
  setTimeout(() => {
    if (window.__renderHome && !$('homeView').hidden) window.__renderHome();
  }, 0);
  window.__icReset = () => {
    D = seed();
    D.savunma = seedSv();
    save();
    ui = { page: 'home' };
    render();
  };
  render();
})();
