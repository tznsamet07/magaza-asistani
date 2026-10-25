  /* --- fire raporu --- */
  let fYm = (() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  })();
  const MONTHS_TR = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık'
  ];
  const ymLabel = ym => {
    const [y, m] = ym.split('-').map(Number);
    return `${MONTHS_TR[m - 1]} ${y}`;
  };
  const ymLocal = iso => {
    const d = new Date(iso);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  };
  // Dönem: hafta (Pazartesi başlar) ya da ay
  let fPer = 'ay',
    fWk = (() => {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return ymdL(d);
    })();
  const wkEnd = w => {
    const d = new Date(w + 'T12:00:00');
    d.setDate(d.getDate() + 6);
    return ymdL(d);
  };
  function perLabel() {
    if (fPer === 'ay') return ymLabel(fYm);
    const a = new Date(fWk + 'T12:00:00'),
      b = new Date(wkEnd(fWk) + 'T12:00:00');
    return a.getMonth() === b.getMonth()
      ? `${a.getDate()}-${b.getDate()} ${MONTHS_TR[b.getMonth()]} ${b.getFullYear()}`
      : `${a.getDate()} ${MONTHS_TR[a.getMonth()]} - ${b.getDate()} ${MONTHS_TR[b.getMonth()]} ${b.getFullYear()}`;
  }
  function inPer(r) {
    if (fPer === 'ay') return ymLocal(r.at) === fYm;
    const k = ymdL(new Date(r.at));
    return k >= fWk && k <= wkEnd(fWk);
  }
  function monthRecs() {
    return S()
      .fire.filter(inPer)
      .sort((a, b) => a.at.localeCompare(b.at));
  }
  // Son 30 günde 3 ya da daha çok kez fire olan ürünler: sipariş azaltılabilir
  function orderWarn() {
    const lim = Date.now() - 30 * 864e5,
      m = new Map();
    for (const r of S().fire) {
      if (new Date(r.at).getTime() < lim) continue;
      const k = r.barcode || r.name;
      if (!k) continue;
      const o = m.get(k) || { ad: r.name || r.barcode, n: 0, qty: 0, tl: 0 };
      o.n++;
      o.qty += r.qty;
      if (r.price != null) o.tl += r.price * r.qty;
      m.set(k, o);
    }
    return [...m.values()].filter(o => o.n >= 3).sort((a, b) => b.n - a.n || b.qty - a.qty);
  }
  function sums(recs) {
    const qty = recs.reduce((a, r) => a + r.qty, 0),
      priced = recs.filter(r => r.price != null);
    return {
      n: recs.length,
      qty,
      tl: priced.reduce((a, r) => a + r.price * r.qty, 0),
      unpriced: recs.length - priced.length
    };
  }
  function groupBy(recs, keyFn) {
    const m = new Map();
    for (const r of recs) {
      const k = keyFn(r) || '-';
      const o = m.get(k) || { qty: 0, tl: 0 };
      o.qty += r.qty;
      if (r.price != null) o.tl += r.price * r.qty;
      m.set(k, o);
    }
    return [...m.entries()].sort((a, b) => b[1].qty - a[1].qty);
  }
  function renderFire() {
    $('fMonth').textContent = perLabel();
    document.querySelectorAll('[data-fper]').forEach(b => b.setAttribute('aria-pressed', b.dataset.fper === fPer));
    const ow = orderWarn();
    $('fWarn').innerHTML = ow.length
      ? `<div class="fwarn"><b>Sipariş uyarısı</b><div class="hint" style="margin:2px 0 0">Son 30 günde 3 ya da daha çok kez fire oldu. Siparişi azaltmayı düşün.</div><ul>${ow
          .slice(0, 8)
          .map(o => `<li>${esc(o.ad)}: ${o.n} kez, ${o.qty} adet${o.tl ? `, ${TL(o.tl)}` : ''}</li>`)
          .join('')}</ul></div>`
      : '';
    const recs = monthRecs(),
      t = sums(recs);
    $('fSum').innerHTML =
      `<div><b>${t.n}</b><span>Kalem</span></div><div><b>${t.qty}</b><span>Adet</span></div><div class="exp"><b style="font-size:${t.tl >= 10000 ? '17px' : t.tl >= 100 ? '19px' : '24px'}">${TL(t.tl)}</b><span>Tutar</span></div>`;
    const tbl = (title, rows) =>
      rows.length
        ? `<table class="fbreak"><thead><tr><th>${title}</th><th>Adet</th><th>Tutar</th></tr></thead><tbody>${rows.map(([k, o]) => `<tr><td>${esc(k)}</td><td>${o.qty}</td><td>${o.tl ? TL(o.tl) : '-'}</td></tr>`).join('')}</tbody></table>`
        : '';
    const top = groupBy(recs, r => r.name || r.barcode).slice(0, 10);
    $('fTop').innerHTML = top.length ? tbl('En çok fire olan ürünler', top) : '';
    $('fBreak').innerHTML = recs.length
      ? tbl(
          'Grup',
          groupBy(recs, r => grp(r.group).name)
        ) +
        tbl(
          'Sebep',
          groupBy(recs, r => r.reason)
        ) +
        (recs.some(r => r.shelf)
          ? tbl(
              'Reyon',
              groupBy(recs, r => r.shelf || 'Belirtilmemiş')
            )
          : '') +
        (t.unpriced
          ? `<p class="hint" style="margin:4px 0 0">${t.unpriced} kalemde fiyat yazılmadığı için tutara katılmadı.</p>`
          : '')
      : '';
    $('fList').innerHTML = recs.length
      ? recs
          .slice()
          .reverse()
          .map(r => fireRow(r, false))
          .join('')
      : `<li class="sempty">${perLabel()} için fire kaydı yok.</li>`;
  }
  $('fBox')
    .querySelector('.fper')
    .addEventListener('click', e => {
      const b = e.target.closest('[data-fper]');
      if (!b) return;
      fPer = b.dataset.fper;
      renderFire();
    });
  const wkShift = n => {
    const d = new Date(fWk + 'T12:00:00');
    d.setDate(d.getDate() + 7 * n);
    fWk = ymdL(d);
    renderFire();
  };
  $('fPrev').addEventListener('click', () => {
    if (fPer === 'hafta') return wkShift(-1);
    const [y, m] = fYm.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    fYm = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    renderFire();
  });
  $('fNext').addEventListener('click', () => {
    if (fPer === 'hafta') return wkShift(1);
    const [y, m] = fYm.split('-').map(Number);
    const d = new Date(y, m, 1);
    fYm = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    renderFire();
  });
  async function shareText(text, title, okMsg) {
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      V.toast(okMsg);
    } catch (e) {
      $('sImpText').value = text;
      $('sCatBox').open = true;
      $('sImpText').scrollIntoView({ block: 'center' });
      $('sImpText').select();
      V.toast('Rapor “Toplu ürün yükle” kutusuna yazıldı; seçip kopyalayabilirsin.');
    }
  }
  $('fShare').addEventListener('click', () => {
    const recs = monthRecs(),
      t = sums(recs);
    if (!recs.length) {
      V.toast(fPer === 'ay' ? 'Bu ay fire kaydı yok.' : 'Bu hafta fire kaydı yok.');
      return;
    }
    const d2 = iso => new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    const ow = orderWarn(),
      top = groupBy(recs, r => r.name || r.barcode).slice(0, 10);
    const lines = [
      `FİRE RAPORU (${fPer === 'ay' ? 'aylık' : 'haftalık'}): ${perLabel()}`,
      `Toplam: ${t.n} kalem, ${t.qty} adet${t.tl ? `, ${TL(t.tl)}` : ''}`,
      '',
      'En çok fire olan ürünler:',
      ...top.map(([k, o]) => `- ${k}: ${o.qty} adet${o.tl ? `, ${TL(o.tl)}` : ''}`),
      '',
      ...(ow.length
        ? ['Sipariş uyarısı (son 30 günde 3+ kez fire):', ...ow.map(o => `- ${o.ad}: ${o.n} kez, ${o.qty} adet`), '']
        : []),
      'Gruplara göre:',
      ...groupBy(recs, r => grp(r.group).name).map(([k, o]) => `- ${k}: ${o.qty} adet${o.tl ? `, ${TL(o.tl)}` : ''}`),
      '',
      'Sebebe göre:',
      ...groupBy(recs, r => r.reason).map(([k, o]) => `- ${k}: ${o.qty} adet${o.tl ? `, ${TL(o.tl)}` : ''}`),
      '',
      'Ürünler:',
      ...recs.map(
        r =>
          `${d2(r.at)} ${r.name || r.barcode}: ${r.qty} adet${r.price != null ? `, ${TL(r.price * r.qty)}` : ''} (${r.reason})`
      )
    ];
    shareText(lines.join('\n'), `Fire raporu ${perLabel()}`, 'Rapor panoya kopyalandı.');
  });
  $('fCopy').addEventListener('click', () => {
    const recs = monthRecs();
    if (!recs.length) {
      V.toast(fPer === 'ay' ? 'Bu ay fire kaydı yok.' : 'Bu hafta fire kaydı yok.');
      return;
    }
    const num = n => (n == null ? '' : String(n).replace('.', ','));
    const rows = [
      ['Tarih', 'Ürün', 'Barkod', 'Grup', 'Reyon', 'SKT', 'Adet', 'Birim fiyat', 'Tutar', 'Sebep', 'Kaldıran'].join(
        '\t'
      ),
      ...recs.map(r =>
        [
          new Date(r.at).toLocaleDateString('tr-TR'),
          r.name || '',
          r.barcode ? '="' + r.barcode + '"' : '',
          grp(r.group).name,
          r.shelf || '',
          new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR'),
          r.qty,
          num(r.price),
          r.price != null ? num(Math.round(r.price * r.qty * 100) / 100) : '',
          r.reason,
          r.by || ''
        ].join('\t')
      )
    ];
    (async () => {
      try {
        await navigator.clipboard.writeText(rows.join('\n'));
        V.toast(`${recs.length} satır kopyalandı. Excel'de bir hücreye yapıştır.`);
      } catch (e) {
        shareText(rows.join('\n'), 'Fire raporu (tablo)', 'Tablo panoya kopyalandı.');
      }
    })();
  });

  $('sDefWarn').value = S().defWarn;
  $('sDefWarn').addEventListener('change', () => {
    const v = Math.max(0, Math.min(365, parseInt($('sDefWarn').value, 10) || 0));
    S().defWarn = v;
    $('sDefWarn').value = v;
    save();
    render();
    sellVis();
  });

