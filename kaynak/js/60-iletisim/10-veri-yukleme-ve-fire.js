  /* Veri yükleme: portalın gerçek verileri (ürün/barkod, fiyat politikası, çalışanlar, unvanlar) Excel şablonuyla yüklenir.
   Gerçek sürümde genel müdürlük yükler ve tüm mağazalara dağıtılır; sunumda bu cihaza yüklenir. */
  const vrSt = () => {
    const st = V.state();
    st.veri = st.veri || {};
    return st.veri;
  };
  const sktS = () => {
    const st = V.state();
    st.skt = st.skt || { items: [], catalog: {} };
    st.skt.catalog = st.skt.catalog || {};
    return st.skt;
  };
  const myCode = () => (window.__mg ? window.__mg.kodOf(myName()) : '');
  const vNum = x => {
    x = String(x || '')
      .trim()
      .replace(/\s|₺|TL/gi, '');
    if (!x) return null;
    if (/,\d{1,2}$/.test(x)) x = x.replace(/\./g, '').replace(',', '.');
    else x = x.replace(/,/g, '');
    const n = Number(x);
    return isFinite(n) ? n : null;
  };
  const vDate = x => {
    x = String(x || '').trim();
    let m = x.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) return m[3] + '-' + pad(m[2]) + '-' + pad(m[1]);
    m = x.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? x : '';
  };
  function vImport(k, R) {
    let ok = 0,
      bad = 0,
      info = '';
    const st = V.state();
    if (k === 'urun') {
      const S2 = sktS(),
        G = S2.groups || [];
      R.forEach(r => {
        const bc = (r[0] || '').replace(/\D/g, '');
        if (bc.length < 6 || !r[1]) {
          bad++;
          return;
        }
        const g = G.find(x => nrm(x.name) === nrm(r[2]));
        const w = r[3] === '' || r[3] == null ? null : Math.max(0, parseInt(r[3], 10) || 0);
        const c = S2.catalog[bc] || (S2.catalog[bc] = { warn: null, shelf: '', group: 'genel', price: null, used: 0 });
        c.name = r[1];
        if (g) c.group = g.id;
        if (w != null) c.warn = w;
        ok++;
      });
      info = `${ok} ürün`;
    } else if (k === 'fiyat') {
      const S2 = sktS(),
        F = (st.fiyat = st.fiyat || {}),
        t = today();
      R.forEach(r => {
        const bc = (r[0] || '').replace(/\D/g, ''),
          p = vNum(r[1]);
        if (bc.length < 6 || p == null) {
          bad++;
          return;
        }
        const kp = vNum(r[2]),
          kb = vDate(r[3]),
          ke = vDate(r[4]);
        F[bc] = { p, k: kp, kb, ke };
        const c =
          S2.catalog[bc] ||
          (S2.catalog[bc] = { name: '', warn: null, shelf: '', group: 'genel', price: null, used: 0 });
        c.price = kp != null && kb && ke && t >= kb && t <= ke ? kp : p;
        ok++;
      });
      const kn = Object.values(F).filter(x => x.k != null && x.kb && x.ke && t >= x.kb && t <= x.ke).length;
      info = `${ok} fiyat${kn ? `, ${kn} üründe kampanya geçerli` : ''}`;
    } else if (k === 'calisan') {
      const me = myCode(),
        E = (st.employees = st.employees || []),
        say = {};
      let add = 0,
        upd = 0;
      R.forEach(r => {
        const sc = (r[0] || '').replace(/\D/g, ''),
          ad = (r[1] || '').trim(),
          un = (r[2] || '').trim().toLocaleUpperCase('tr-TR'),
          mk = String(r[3] || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
        if (sc.length < 3 || !ad || !['MS', 'MSY', 'GT', 'PER', 'PART'].includes(un)) {
          bad++;
          return;
        }
        ok++;
        say[mk || me] = (say[mk || me] || 0) + 1;
        if (mk && me && mk !== me) return;
        const e = E.find(x => String(x.sicil || '') === sc) || E.find(x => !x.sicil && nrm(x.name) === nrm(ad));
        const role = un === 'PART' ? 'PER' : un;
        if (e) {
          e.name = ad;
          e.role = role;
          e.sicil = sc;
          upd++;
        } else {
          E.push({ id: uid(), name: ad, role, izin: 'auto', araciOk: true, gender: '', sicil: sc });
          add++;
        }
      });
      st.magazaSay = say;
      const n = Object.keys(say).length;
      info = `${me ? 'Mağaza ' + me + ': ' : ''}${add} eklendi, ${upd} güncellendi${n > 1 ? ` · dosyada ${n} mağaza, ${ok} çalışan` : ''}`;
    }
    if (ok) {
      vrSt()[k] = { n: ok, bad, at: new Date().toISOString(), info };
    }
    return { ok, bad, info };
  }
  (function () {
    let BV;
    try {
      BV = JSON.parse(document.getElementById('bimVeri').textContent);
    } catch (e) {
      return;
    }
    if (!BV || !BV.surum) return;
    const st = V.state(),
      t = today();
    if (st.veriSurum !== BV.surum) {
      const T = x => (x || []).map(r => r.map(c => (c == null ? '' : String(c))));
      vImport('urun', T(BV.urunler));
      vImport('calisan', T(BV.calisanlar));
      st.veriSurum = BV.surum;
      st.veriGun = '';
    }
    if (st.veriGun !== t) {
      vImport(
        'fiyat',
        (BV.fiyatlar || []).map(r => r.map(c => (c == null ? '' : String(c))))
      );
      st.veriGun = t;
    }
    V.save();
  })();
  const lastZ = id => D.ziyaret.filter(z => z.store === id).sort((a, b) => b.at.localeCompare(a.at))[0] || null;
  const zCls = n => (n >= 85 ? 'ok' : n >= 65 ? 'mid' : 'bad');
  /* Son 7 gün fire tutarı: bu cihazın mağazası gerçek, diğerleri örnek */
  function fire7(id, name) {
    if (id === 'me') {
      const lim = dstr(-6),
        L = ((V.state().skt || {}).fire || []).filter(x => String(x.at || '').slice(0, 10) >= lim);
      const t = L.reduce((a, x) => a + (x.price != null ? x.price * (x.qty || 1) : 0), 0);
      if (L.length) return { t, ex: false };
    }
    let h = 0;
    for (const c of String(name || id) + today()) h = (h * 31 + c.charCodeAt(0)) % 9973;
    return { t: 600 + (h % 2400), ex: true };
  }
  function bsgKey() {
    const g = giris();
    return 'bsg:' + nrm(g && g.ad);
  }
  function bsUnread() {
    const g = giris();
    if (!g || (g.tip !== 'bs' && kad() !== 'pm')) return [];
    const me = nrm(g.ad),
      seen = (D.seen || {})[bsgKey()] || '';
    return D.bsgrup.filter(m => nrm(m.from) !== me && m.at > seen);
  }
  function markBs() {
    D.seen = D.seen || {};
    D.seen[bsgKey()] = new Date().toISOString();
    save();
  }
  function bsList() {
    const g = giris(),
      me = nrm(g && g.ad);
    return `<div class="ic-chat" id="icChat">${
      D.bsgrup
        .map(m => {
          const mine = nrm(m.from) === me;
          return `<div class="ic-msg ${mine ? 'me' : 'them'}">${mine ? '' : `<b class="gm-who">${esc(m.from)} <small>${esc(m.bolge || 'BS')}</small></b>`}<div>${esc(m.text)}</div><small>${when(m.at)}</small></div>`;
        })
        .join('') || '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok.</p>'
    }</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="BS grubuna yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="bsgrup" aria-label="Gönder">➤</button></div>`}`;
  }
  function bsSim() {
    if (kilitli()) return;
    if (Math.random() < 0.3) return;
    const p = BSLER[rnd(0, BSLER.length - 1)];
    setTimeout(
      () => {
        D.bsgrup.push({
          from: p.ad,
          bolge: p.bolge,
          text: [
            'Tamam, teşekkürler 👍',
            'Bizde de aynı durum.',
            'Not aldım.',
            'Ben de bölgeme ileteyim.',
            'Anlaşıldı.'
          ][rnd(0, 4)],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden && ui.page === 'bsgrup') render();
        else updBell();
      },
      2500 + rnd(0, 2500)
    );
  }
