  /* --- raftan kaldırma penceresi ve fire --- */
  let fItem = null;
  function fTotalText() {
    const q = parseInt($('fQty').value, 10) || 0,
      p = parsePrice($('fPrice').value);
    $('fTotal').textContent =
      p != null && q > 0 ? `Fire tutarı: ${TL(p * q)}` : 'Fiyat yazarsan fire raporunda toplam tutar da hesaplanır.';
  }
  let fMode = 'fire';
  function openRemove(it, mode) {
    fItem = it;
    fMode = mode === 'sold' ? 'sold' : 'fire';
    const max = Math.max(1, it.qty || 1),
      sold = fMode === 'sold';
    $('fDlgT').textContent = sold ? 'Satıldı' : 'Raftan kaldır';
    $('fQtyL').textContent = sold ? 'Kaç adet satıldı' : 'Kaç adet kaldırıldı';
    $('fPriceRow').hidden = sold;
    $('fReasonRow').hidden = sold;
    $('fTotal').hidden = sold;
    $('fOk').textContent = sold ? 'Satıldı, düş' : 'Kaldırıldı, kaydet';
    $('fDlgSub').textContent = sold
      ? `${it.name || it.barcode || 'Ürün'}: takipte ${max} adet. Satılan adet listeden düşer, fire raporuna yazılmaz.`
      : `${it.name || it.barcode || 'Ürün'}: takipte ${max} adet.${max > 1 ? ' Hepsi kalkmadıysa kalkan adedi yaz; kalanlar takipte kalır.' : ''}`;
    $('fQty').value = max;
    $('fQty').max = max;
    const c = it.barcode && S().catalog[it.barcode];
    const pv = it.price != null ? it.price : c && c.price != null ? c.price : null;
    $('fPrice').value = pv != null ? String(pv).replace('.', ',') : '';
    fillReasons();
    const rs = reasons(),
      pick =
        status(it) === 'ok'
          ? rs.find(r => /bozuk|hasar/i.test(r)) || rs.find(r => !/skt/i.test(r))
          : rs.find(r => /skt/i.test(r));
    $('fReason').value = pick || rs[0] || '';
    fTotalText();
    $('fDlg').hidden = false;
    $('fOk').focus();
  }
  // Satış: adedi düşer, fire raporuna girmez; "Kaldırılan / satılan" listesinden geri alınabilir
  function sellFrom(it, q, at) {
    if (status(it) !== 'ok') turMark(it.id, 'sold');
    S().sold.push({
      id: uid(),
      itemId: it.id,
      at,
      name: it.name,
      barcode: it.barcode,
      group: it.group,
      shelf: it.shelf,
      date: it.date,
      qty: q,
      by: who()
    });
    logla('sat', it.name || it.barcode, q);
    it.qty = Math.max(0, (it.qty || 1) - q);
    if (it.qty <= 0) {
      it.qty = 0;
      it.done = true;
      it.soldOut = true;
      it.doneAt = at;
    }
  }
  $('sSell').addEventListener('click', () => {
    const bc = $('sBar').value.trim();
    if (!bc) {
      V.toast('Önce barkodu okut ya da yaz.');
      $('sBar').focus();
      return;
    }
    const lots = S()
      .items.filter(i => !i.done && i.barcode === bc)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (!lots.length) {
      V.toast('Bu barkodla takipte ürün yok.');
      return;
    }
    let left = Math.max(1, parseInt($('sQty').value, 10) || 1);
    const total = left,
      at = new Date().toISOString(),
      parts = [];
    for (const it of lots) {
      if (left <= 0) break;
      const q = Math.min(left, Math.max(1, it.qty || 1));
      sellFrom(it, q, at);
      left -= q;
      parts.push(`${q} adet SKT ${fmtDate(it.date)}`);
    }
    save();
    render();
    V.toast(
      `${lots[0].name || 'Ürün'}: ${total - left} adet satıldı (${parts.join(', ')}).${left > 0 ? ` Takipte olandan fazla yazdın, ${left} adet düşülmedi.` : ''}`
    );
    $('sBar').value = '';
    $('sQty').value = 1;
    showKnown(null);
  });
  function closeRemove() {
    $('fDlg').hidden = true;
    fItem = null;
  }
  $('fMinus').addEventListener('click', () => {
    $('fQty').value = Math.max(1, (parseInt($('fQty').value, 10) || 1) - 1);
    fTotalText();
  });
  $('fPlus').addEventListener('click', () => {
    const max = Math.max(1, (fItem && fItem.qty) || 1);
    $('fQty').value = Math.min(max, (parseInt($('fQty').value, 10) || 0) + 1);
    fTotalText();
  });
  $('fQty').addEventListener('input', fTotalText);
  $('fPrice').addEventListener('input', fTotalText);
  $('fCancel').addEventListener('click', closeRemove);
  $('fOk').addEventListener('click', () => {
    const it = fItem;
    if (!it) return;
    const max = Math.max(1, it.qty || 1),
      q = Math.min(max, Math.max(1, parseInt($('fQty').value, 10) || 1)),
      p = parsePrice($('fPrice').value);
    const at = new Date().toISOString();
    if (fMode === 'sold') {
      sellFrom(it, q, at);
      save();
      closeRemove();
      render();
      renderTur();
      renderLog();
      V.toast(
        it.done ? `${it.name || 'Ürün'} satıldı, listeden düştü.` : `${q} adet satıldı, ${it.qty} adet takipte kaldı.`
      );
      return;
    }
    if (status(it) !== 'ok') turMark(it.id, 'rm');
    S().fire.push({
      id: uid(),
      itemId: it.id,
      at,
      name: it.name,
      barcode: it.barcode,
      group: it.group,
      shelf: it.shelf,
      date: it.date,
      qty: q,
      price: p,
      reason: $('fReason').value,
      by: who()
    });
    logla('kaldir', it.name || it.barcode, q);
    it.qty = max - q;
    if (it.qty <= 0) {
      it.qty = 0;
      it.done = true;
      it.doneAt = at;
    }
    if (p != null && it.barcode && S().catalog[it.barcode]) S().catalog[it.barcode].price = p;
    save();
    closeRemove();
    render();
    renderFire();
    renderReasons();
    renderBatches();
    renderTur();
    renderLog();
    V.toast(
      it.done
        ? `${it.name || 'Ürün'} raftan kaldırıldı, fire raporuna eklendi.`
        : `${q} adet kaldırıldı, ${it.qty} adet takipte kaldı.`
    );
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('fDlg').hidden) closeRemove();
  });

  function fireRow(r, withUndo) {
    const at = new Date(r.at),
      t = r.price != null ? r.price * r.qty : null;
    const meta = [
      `${r.qty} adet`,
      r.reason,
      grp(r.group).id !== 'genel' ? grp(r.group).name : '',
      r.shelf,
      `SKT ${fmtDate(r.date)}`,
      r.by ? 'Kaldıran: ' + r.by : ''
    ]
      .filter(Boolean)
      .map(esc)
      .join(', ');
    return `<li class="fr"><div><b>${esc(r.name || r.barcode || 'Ürün')}</b><small>${meta}</small><small>${at.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${at.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small></div><div class="amt">${t != null ? TL(t) : '-'}</div>${withUndo ? `<div class="acts"><button type="button" data-fundo="${r.id}">Geri al</button></div>` : ''}</li>`;
  }
  function soldRow(r) {
    const at = new Date(r.at);
    const meta = [`${r.qty} adet`, 'Satıldı', r.shelf, `SKT ${fmtDate(r.date)}`, r.by ? 'İşaretleyen: ' + r.by : '']
      .filter(Boolean)
      .map(esc)
      .join(', ');
    return `<li class="fr"><div><b>${esc(r.name || r.barcode || 'Ürün')}<span class="stag sold">Satıldı</span></b><small>${meta}</small><small>${at.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${at.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small></div><div class="amt">-</div><div class="acts"><button type="button" data-sundo="${r.id}">Geri al</button></div></li>`;
  }
  function renderFireList(q) {
    let recs = S()
      .fire.map(r => ({ ...r, _k: 'f' }))
      .concat(S().sold.map(r => ({ ...r, reason: 'Satıldı', _k: 's' })))
      .sort((a, b) => b.at.localeCompare(a.at));
    if (q)
      recs = recs.filter(r =>
        [r.name, r.barcode, r.shelf, r.reason, grp(r.group).name].join(' ').toLocaleLowerCase('tr-TR').includes(q)
      );
    $('sList').innerHTML = recs.length
      ? recs
          .slice(0, 150)
          .map(r => (r._k === 's' ? soldRow(r) : fireRow(r, true)))
          .join('')
      : '<li class="sempty">Kaldırılan ürün yok.</li>';
  }
  $('sList').addEventListener('click', async e => {
    const sb = e.target.closest('[data-sundo]');
    if (sb) {
      const r = S().sold.find(x => x.id === sb.dataset.sundo);
      if (!r) return;
      if (!(await askConfirm(`${r.name || 'Bu satış'} (${r.qty} adet) geri alınsın mı? Ürün tekrar takibe döner.`)))
        return;
      S().sold = S().sold.filter(x => x !== r);
      logla('satgeri', r.name || r.barcode, r.qty);
      const it = S().items.find(i => i.id === r.itemId);
      if (it) {
        it.qty = (it.qty || 0) + r.qty;
        it.done = false;
        delete it.doneAt;
        delete it.soldOut;
      }
      save();
      render();
      V.toast('Satış geri alındı.');
      return;
    }
    const b = e.target.closest('[data-fundo]');
    if (!b) return;
    const r = S().fire.find(x => x.id === b.dataset.fundo);
    if (!r) return;
    if (!(await askConfirm(`${r.name || 'Bu kayıt'} (${r.qty} adet) geri alınsın mı? Ürün tekrar takibe döner.`)))
      return;
    S().fire = S().fire.filter(x => x !== r);
    logla('geri', r.name || r.barcode, r.qty);
    const it = S().items.find(i => i.id === r.itemId);
    if (it) {
      it.qty = (it.qty || 0) + r.qty;
      it.done = false;
      delete it.doneAt;
      delete it.soldOut;
    }
    save();
    render();
    renderFire();
    V.toast('Geri alındı.');
  });

