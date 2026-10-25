  /* İzin talepleri: çalışan ister, MS ya da MSY onaylar (kendi talebini kendisi onaylayamaz) */
  const IZT = { B: 'Haftalık izin (B)', Y: 'Yıllık izin', M: 'Mazeret izni', R: 'Rapor', T: 'Vardiya takası' };
  if (!Array.isArray(D.izin)) {
    const P = staffOf('me').filter(p => p.unvan !== 'MS' && p.unvan !== 'MSY'),
      p = P[0] || { id: null, ad: 'İklim', unvan: 'PER' };
    D.izin = [
      {
        id: uid(),
        kisiId: p.id,
        ad: p.ad,
        unvan: p.unvan,
        tur: 'B',
        bas: dstr(3),
        bit: dstr(3),
        not: 'Kardeşimin düğünü var, o gün izin alabilir miyim?',
        at: isoAt(18, 20, -1),
        durum: 'bek'
      }
    ];
    save();
  }
  const izMine = x => {
    const g = giris();
    return !!g && g.tip === 'magaza' && ((g.empId && x.kisiId === g.empId) || nrm(x.ad) === nrm(g.ad));
  };
  const canOnay = () => {
    const g = giris();
    return !!g && g.tip === 'magaza' && ['MS', 'MSY'].includes(g.unvan);
  };
  const izBekl = () => (canOnay() ? D.izin.filter(x => x.durum === 'bek' && !izMine(x)) : []);
  const izTarih = x => (x.bas === x.bit ? fmtD(x.bas) : fmtD(x.bas) + ' – ' + fmtD(x.bit));
  const izGun = x => Math.round((new Date(x.bit + 'T12:00:00') - new Date(x.bas + 'T12:00:00')) / 864e5) + 1;
  const IZD = { bek: ['wait', 'Onay bekliyor'], onay: ['ok', 'Onaylandı'], red: ['no', 'Reddedildi'] };
  function izRow(x, act) {
    const [c, l] = IZD[x.durum];
    return `<li class="iz-row"><div class="iz-top"><div><b>${esc(x.ad)} <small>${KISA[x.unvan] || ''}</small></b><small>${IZT[x.tur]} · ${izTarih(x)}${x.kimle ? ' · ' + esc(x.kimle) + ' ile' : ''}${izGun(x) > 1 ? ' (' + izGun(x) + ' gün)' : ''}</small></div><span class="iz-st ${x.durum}">${l}</span></div>${x.not ? `<p class="iz-not">${esc(x.not)}</p>` : ''}${x.karar ? `<p class="hint" style="margin:4px 0 0">${esc(x.karar.by)} · ${when(x.karar.at)}${x.karar.not ? ' · ' + esc(x.karar.not) : ''}</p>` : ''}${act ? `<div class="iz-act"><button type="button" class="btn" data-izred="${x.id}">Reddet</button><button type="button" class="btn primary" data-izok="${x.id}">Onayla</button></div>` : ''}${x.durum === 'bek' && izMine(x) ? `<button type="button" class="linkbtn" data-izdel="${x.id}" style="margin-top:6px">Talebi geri çek</button>` : ''}</li>`;
  }
  /* Yükselme: MS ya da BS aday gösterir, İK sınav tarihini verir ve puanı girer. Geçme notunu alan kişinin görevi kendiliğinden yükselir. */
  const RUT = ['PART', 'PER', 'GT', 'MSY', 'MS', 'BS'],
    RUTAD = { ...UNVAN, BS: 'Bölge Sorumlusu' },
    RUTK = { ...KISA, BS: 'BS' };
  const rNext = u => RUT[Math.min(RUT.length - 1, Math.max(0, RUT.indexOf(u)) + 1)];
  function yukInit() {
    if (Array.isArray(D.yuk)) return;
    D.yuk = [];
    D.yukGec = D.yukGec || 70;
    const p = staffOf('me').find(x => x.unvan === 'PER');
    if (p)
      D.yuk.push({
        id: uid(),
        store: 'me',
        ad: p.ad,
        kisiId: p.id,
        from: 'PER',
        to: 'GT',
        by: { ad: 'Erol', rol: 'MS' },
        at: isoAt(10, 5, -6),
        not: 'Kasada ve sevkiyatta çok iyi.',
        sinav: { tarih: dstr(3), saat: '10:00', yer: 'Döşemealtı-2 deposu eğitim salonu' },
        puan: null,
        durum: 'sinav'
      });
    const q = staffOf('s4').find(x => x.unvan === 'MSY');
    if (q)
      D.yuk.push({
        id: uid(),
        store: 's4',
        ad: q.ad,
        kisiId: q.id,
        from: 'MSY',
        to: 'MS',
        by: { ad: D.bsAd || 'Ali Yıldırım', rol: 'BS' },
        at: isoAt(9, 30, -20),
        not: '',
        sinav: { tarih: dstr(-5), saat: '10:00', yer: 'Döşemealtı-2 deposu eğitim salonu' },
        puan: 84,
        sonucAt: isoAt(15, 0, -4),
        durum: 'gecti'
      });
    save();
  }
  const YU = () => {
    yukInit();
    return D.yuk;
  };
  const yGec = () => Number(D.yukGec) || 70;
  const isIkY = () => !!window.__ikMi && window.__ikMi(giris());
  const canAday = () => {
    const g = giris();
    return !!g && (g.tip === 'bs' || (g.tip === 'magaza' && g.unvan === 'MS'));
  };
  const yMine = y => {
    const g = giris();
    return (
      !!g && g.tip === 'magaza' && y.store === 'me' && ((g.empId && y.kisiId === g.empId) || nrm(y.ad) === nrm(g.ad))
    );
  };
  function yGor() {
    const g = giris();
    if (!g) return [];
    const L = YU();
    if (g.tip === 'depo') return isIkY() ? L : [];
    if (g.tip === 'pm') return L;
    if (g.tip === 'bs') return L;
    if (canOnay()) return L.filter(y => y.store === 'me');
    return L.filter(yMine);
  }
  const YD = {
    aday: ['bek', 'Sınav tarihi bekleniyor'],
    sinav: ['bek', 'Sınava girecek'],
    gecti: ['onay', 'Geçti, yükseldi'],
    kaldi: ['red', 'Geçemedi']
  };
  function ySinavTxt(y) {
    return y.sinav ? `${fmtD(y.sinav.tarih)} ${y.sinav.saat || ''}${y.sinav.yer ? ' · ' + y.sinav.yer : ''}` : '';
  }
  function yRow(y) {
    const [c, l] = YD[y.durum],
      ik = isIkY();
    let h = `<li class="iz-row"><div class="iz-top"><div><b>${esc(y.ad)} <small>${RUTK[y.from] || ''} → ${RUTK[y.to] || ''}</small></b><small>${esc(S(y.store).name)} · aday gösteren ${esc(y.by.ad)} (${esc(y.by.rol)})</small></div><span class="iz-st ${c}">${l}</span></div>`;
    if (y.not) h += `<p class="iz-not">${esc(y.not)}</p>`;
    if (y.sinav) h += `<p class="hint" style="margin:4px 0 0">Sınav: ${esc(ySinavTxt(y))}</p>`;
    if (y.puan != null)
      h += `<p class="yk-puan ${y.durum}"><b>${y.puan}</b> puan · geçme notu ${y.gec || yGec()}${y.durum === 'gecti' ? ` · yeni görevi: ${esc(RUTAD[y.to] || y.to)}` : ''}</p>`;
    if (ik && y.durum === 'aday')
      h += `<div class="yk-f"><div class="srow2"><label>Sınav günü<input type="date" id="yt-${y.id}" value="${dstr(7)}"></label><label>Saat<input type="time" id="ys-${y.id}" value="10:00"></label></div><label>Yer<input id="yy-${y.id}" autocomplete="off" value="Döşemealtı-2 deposu eğitim salonu"></label><button type="button" class="btn primary" data-ytar="${y.id}">Sınav tarihini kaydet</button></div>`;
    if (ik && y.durum === 'sinav')
      h += `<div class="yk-f"><label>Sınav puanı (0-100)<input id="yp-${y.id}" type="number" min="0" max="100" inputmode="numeric" placeholder="Örn. 78"></label><button type="button" class="btn primary" data-ypuan="${y.id}">Puanı kaydet</button></div>`;
    if (y.durum === 'aday' && canAday() && !yMine(y))
      h += `<button type="button" class="linkbtn" data-ydel="${y.id}" style="margin-top:6px">Adaylığı geri çek</button>`;
    return h + '</li>';
  }
  function yukRowBox() {
    const L = yGor(),
      g = giris();
    if (!g) return '';
    const me = L.find(yMine);
    const ik = isIkY(),
      n = ik
        ? L.filter(y => y.durum === 'aday' || (y.durum === 'sinav' && y.sinav && y.sinav.tarih <= today())).length
        : L.filter(y => y.durum === 'aday' || y.durum === 'sinav').length;
    const sub = me
      ? me.durum === 'sinav'
        ? `Sınavın: ${ySinavTxt(me)}`
        : me.durum === 'aday'
          ? 'Aday gösterildin, sınav tarihi bekleniyor'
          : me.durum === 'gecti'
            ? `Tebrikler, ${RUTAD[me.to]} oldun`
            : 'Sınav sonucun geldi'
      : ik
        ? n
          ? `${n} aday işlem bekliyor`
          : 'Sınav tarihi ver, puan gir'
        : n
          ? `${n} kişi sınav sürecinde`
          : canAday()
            ? 'Aday göster, sonuçları takip et'
            : 'Yükselme sınavları';
    if (!me && !L.length && !canAday() && !ik) return '';
    return `<div class="box ic-bsrow" data-icgo="yuk"><div class="ic-av ise"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/><path d="M5 21h14"/></svg></div><div class="ic-sm"><b>Yükselme sınavı</b><small>${esc(sub)}</small></div>${ik && n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function yukPage() {
    let h = head('Yükselme sınavı', true);
    const L = yGor(),
      ik = isIkY(),
      me = L.find(yMine);
    h += `<div class="box"><p class="hint" style="margin:0">Seçilen kişiler yükselme sınavına girer. Geçme notu <b>${yGec()}</b>. Geçen kişinin görevi kendiliğinden bir üst göreve geçer; geçemeyen eski görevinde devam eder.</p></div>`;
    if (me && !ik) h += `<div class="box"><h2>Senin durumun</h2><ul class="iz-list">${yRow(me)}</ul></div>`;
    if (canAday()) {
      const g = giris(),
        bs = g.tip === 'bs',
        stores = bs ? D.stores : [D.stores[0]];
      const opts = stores
        .map(s => {
          const P = staffOf(s.id).filter(p => p.unvan !== 'MS' || bs);
          if (!P.length) return '';
          const o = P.map(
            p => `<option value="${esc(s.id + '|' + p.id)}">${esc(p.ad)} · ${RUTK[p.unvan] || p.unvan}</option>`
          ).join('');
          return bs ? `<optgroup label="${esc(s.name)}">${o}</optgroup>` : o;
        })
        .join('');
      h += `<details class="box sect" id="yuBox"${L.length ? '' : ' open'}><summary><h2>Aday göster</h2></summary><div class="sf" style="margin-top:8px"><label>Kişi<select id="yuK" class="ssel">${opts}</select></label>
      <label>Yükseleceği görev<select id="yuTo" class="ssel"><option value="">Bir üst görev</option>${['GT', 'MSY', 'MS', 'BS'].map(k => `<option value="${k}">${RUTAD[k]}</option>`).join('')}</select></label>
      <label>Neden aday gösteriyorsun? (isteğe bağlı)<input id="yuNot" autocomplete="off" placeholder="Örn. Kasada ve sevkiyatta çok iyi"></label>
      <button type="button" class="btn primary" id="yuAdd">Aday göster, İK'ya gönder</button><p class="hint" style="margin:0">İK sınav tarihini verir; kişiye ve sana bildirim gider.</p></div></details>`;
    }
    const A = L.filter(y => (y.durum === 'aday' || y.durum === 'sinav') && !(me && y === me && !ik)).sort((a, b) =>
        ((a.sinav || {}).tarih || '9').localeCompare((b.sinav || {}).tarih || '9')
      ),
      R = L.filter(y => (y.durum === 'gecti' || y.durum === 'kaldi') && !(me && y === me && !ik)).sort((a, b) =>
        (b.sonucAt || '').localeCompare(a.sonucAt || '')
      );
    if (ik || canAday() || canOnay()) {
      h += `<div class="box"><h2>Sınav süreci</h2>${A.length ? `<ul class="iz-list">${A.map(yRow).join('')}</ul>` : '<p class="hint" style="margin:6px 0 0">Sınav bekleyen aday yok.</p>'}</div>`;
      if (R.length)
        h += `<div class="box"><h2>Sonuçlar</h2><ul class="iz-list">${R.slice(0, 15).map(yRow).join('')}</ul></div>`;
    }
    if (ik)
      h += `<div class="box"><h2>Geçme notu</h2><div class="sf" style="margin-top:8px"><div class="srow2"><label>Puan<input id="yuGec" type="number" min="1" max="100" inputmode="numeric" value="${yGec()}"></label><button type="button" class="btn" id="yuGecK" style="align-self:end;min-height:48px">Kaydet</button></div></div></div>`;
    if (!ik && !canAday() && !canOnay() && !me)
      h += `<div class="box"><p class="hint" style="margin:0">Henüz yükselme sınavı için aday gösterilmedin. Mağaza müdürün ya da bölge sorumlun aday gösterince burada görürsün.</p></div>`;
    return h;
  }
  // Sınavı geçen kişinin görevi: bu mağazanın çalışan listesinde ve kayıt listesinde güncellenir
  function yTerfi(y) {
    if (y.store !== 'me' || !['GT', 'MSY', 'MS'].includes(y.to)) return;
    const st = V.state();
    const e = (st.employees || []).find(x => x && (x.id === y.kisiId || nrm(x.name) === nrm(y.ad)));
    if (e) {
      e.role = y.to;
      V.save();
    }
    if (window.__kayit) {
      const o = window.__kayit.get(),
        r = o.list.find(x => nrm(x.ad) === nrm(y.ad));
      if (r) {
        r.unvan = y.to;
        window.__kayit.save(o);
      }
    }
  }
  function yukClick(t) {
    let b;
    if (t.id === 'yuAdd') {
      const v = ($('yuK') || {}).value || '';
      if (!v) return (V.toast('Kişiyi seç.'), true);
      const [sid, pid] = v.split('|'),
        p = staffOf(sid).find(x => x.id === pid);
      if (!p) return true;
      const to = $('yuTo').value || rNext(p.unvan);
      if (RUT.indexOf(to) <= RUT.indexOf(p.unvan)) {
        V.toast(`${p.ad} zaten ${RUTAD[p.unvan]}; daha üst bir görev seç.`);
        return true;
      }
      if (YU().some(y => y.store === sid && y.kisiId === pid && (y.durum === 'aday' || y.durum === 'sinav'))) {
        V.toast(`${p.ad} zaten sınav sürecinde.`);
        return true;
      }
      const g = giris();
      YU().push({
        id: uid(),
        store: sid,
        ad: p.ad,
        kisiId: p.id,
        from: p.unvan,
        to,
        by: { ad: g.ad, rol: g.tip === 'bs' ? 'BS' : g.unvan },
        at: new Date().toISOString(),
        not: ($('yuNot').value || '').trim(),
        sinav: null,
        puan: null,
        durum: 'aday'
      });
      save();
      render();
      V.toast(`${p.ad} aday gösterildi. İK sınav tarihini verecek.`);
      return true;
    }
    if ((b = t.closest('[data-ytar]'))) {
      const y = YU().find(x => x.id === b.dataset.ytar);
      if (!y || !isIkY()) return true;
      const d = $('yt-' + y.id).value;
      if (!d) {
        V.toast('Sınav gününü seç.');
        return true;
      }
      y.sinav = { tarih: d, saat: $('ys-' + y.id).value || '', yer: ($('yy-' + y.id).value || '').trim() };
      y.durum = 'sinav';
      y.sinavAt = new Date().toISOString();
      save();
      render();
      V.toast(`${y.ad} için sınav tarihi kaydedildi; kişiye bildirim gitti.`);
      return true;
    }
    if ((b = t.closest('[data-ypuan]'))) {
      const y = YU().find(x => x.id === b.dataset.ypuan);
      if (!y || !isIkY()) return true;
      const v = $('yp-' + y.id).value;
      const p = Number(v);
      if (v === '' || !(p >= 0 && p <= 100)) {
        V.toast('0 ile 100 arasında bir puan yaz.');
        return true;
      }
      y.puan = Math.round(p);
      y.gec = yGec();
      y.durum = y.puan >= y.gec ? 'gecti' : 'kaldi';
      y.sonucAt = new Date().toISOString();
      if (y.durum === 'gecti') yTerfi(y);
      save();
      render();
      V.toast(
        y.durum === 'gecti'
          ? `${y.ad} geçti (${y.puan}); görevi ${RUTAD[y.to]} oldu.`
          : `${y.ad} geçemedi (${y.puan}, geçme notu ${y.gec}).`
      );
      return true;
    }
    if ((b = t.closest('[data-ydel]'))) {
      if (!canAday()) return true;
      D.yuk = YU().filter(x => x.id !== b.dataset.ydel);
      save();
      render();
      V.toast('Adaylık geri çekildi.');
      return true;
    }
    if (t.id === 'yuGecK') {
      const v = Math.round(Number($('yuGec').value));
      if (!(v >= 1 && v <= 100)) {
        V.toast('1 ile 100 arasında bir not yaz.');
        return true;
      }
      D.yukGec = v;
      save();
      render();
      V.toast(`Geçme notu ${v} oldu.`);
      return true;
    }
    return false;
  }
  function yukN(L) {
    const g = giris();
    if (!g) return;
    const lim = new Date(Date.now() - 7 * 864e5).toISOString(),
      Y = yGor();
    if (g.tip === 'depo') {
      if (!isIkY()) return;
      Y.forEach(y => {
        if (y.durum === 'aday')
          L.push({
            k: 'yk:a:' + y.id,
            t: `Yükselme adayı: ${y.ad}`,
            d: `${RUTK[y.from]} → ${RUTK[y.to]} · ${S(y.store).name} · sınav tarihi ver`,
            at: y.at,
            go: { page: 'yuk' }
          });
        else if (y.durum === 'sinav' && y.sinav && y.sinav.tarih <= today())
          L.push({
            k: 'yk:p:' + y.id,
            t: `Sınav puanı gir: ${y.ad}`,
            d: ySinavTxt(y),
            at: y.sinavAt || y.at,
            go: { page: 'yuk' }
          });
      });
      return;
    }
    Y.forEach(y => {
      const m = yMine(y);
      if (m && y.durum === 'sinav')
        L.push({
          k: 'yk:s:' + y.id + ':' + y.sinav.tarih,
          t: 'Yükselme sınavın var',
          d: ySinavTxt(y),
          at: y.sinavAt || y.at,
          go: { page: 'yuk' }
        });
      if ((y.durum === 'gecti' || y.durum === 'kaldi') && (y.sonucAt || '') > lim)
        L.push({
          k: 'yk:r:' + y.id,
          t: m
            ? y.durum === 'gecti'
              ? `Tebrikler, sınavı geçtin: ${RUTAD[y.to]} oldun`
              : 'Yükselme sınavını geçemedin'
            : `${y.ad} sınavı ${y.durum === 'gecti' ? 'geçti' : 'geçemedi'}`,
          d: `${y.puan} puan · geçme notu ${y.gec || yGec()}`,
          at: y.sonucAt,
          go: { page: 'yuk' }
        });
    });
  }
