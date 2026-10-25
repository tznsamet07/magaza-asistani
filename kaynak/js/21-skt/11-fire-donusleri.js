  /* --- fire dönüşleri (haftada belirli günler) --- */
  if (!Array.isArray(S().fireDays)) S().fireDays = [0, 3, 5];
  if (!S().fireDone) S().fireDone = {};
  const DSHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    DLONG = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const ymdL = d =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  // Bir kaydın döneceği fire günü: kaldırıldığı gün ya da sonraki ilk fire günü
  function batchDate(iso) {
    const fd = S().fireDays;
    const d = new Date(iso);
    d.setHours(12, 0, 0, 0);
    if (!fd.length) return ymdL(d);
    for (let k = 0; k < 7; k++) {
      const x = new Date(d);
      x.setDate(d.getDate() + k);
      if (fd.includes((x.getDay() + 6) % 7)) return ymdL(x);
    }
    return ymdL(d);
  }
  // Fire günü listesi döndükten sonra kaldırılan ürün bir sonraki fire gününe kalır
  function batchMap() {
    const m = {};
    for (const r of S().fire) {
      let k = batchDate(r.at),
        g = 0;
      while (S().fireDone[k] && r.at > S().fireDone[k] && g++ < 10) {
        const x = new Date(k + 'T12:00:00');
        x.setDate(x.getDate() + 1);
        k = batchDate(x.toISOString());
      }
      (m[k] = m[k] || []).push(r);
    }
    return m;
  }
  const dLabel = ds => {
    const d = new Date(ds + 'T12:00:00');
    return `${DLONG[(d.getDay() + 6) % 7]} ${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`;
  };
  function fireStatus() {
    const m = batchMap(),
      t = todayStr(),
      todayFire = S().fireDays.includes((new Date().getDay() + 6) % 7);
    const pendingToday = todayFire && m[t] && !S().fireDone[t] ? m[t] : null;
    const overdue = Object.keys(m).filter(k => k < t && !S().fireDone[k]);
    return { m, t, todayFire, pendingToday, overdue };
  }
  function renderBatches() {
    const { m, t, todayFire, pendingToday, overdue } = fireStatus();
    // sıradaki fire günü
    let next = null;
    for (let k = 0; k < 8 && !next; k++) {
      const x = new Date();
      x.setDate(x.getDate() + k);
      if (S().fireDays.includes((x.getDay() + 6) % 7)) next = ymdL(x);
    }
    const nb = next && m[next] ? m[next] : [];
    $('fbNext').textContent = !S().fireDays.length
      ? 'Fire günü seçilmemiş; SKT ayarlarından seç.'
      : next === t
        ? `Bugün fire günü. ${nb.length ? `${nb.length} kalem dönülecek.` : 'Henüz kaldırılan ürün yok.'}`
        : `Sıradaki fire günü: ${dLabel(next)}. Şu an ${nb.length} kalem birikti.`;
    const keys = [...new Set([...Object.keys(m), ...(next ? [next] : [])])].sort().reverse().slice(0, 8);
    $('fbList').innerHTML = keys.length
      ? keys
          .map(k => {
            const rs = (m[k] || []).slice().sort((a, b) => a.at.localeCompare(b.at)),
              q = rs.reduce((a, r) => a + r.qty, 0),
              tl = rs.reduce((a, r) => a + (r.price != null ? r.price * r.qty : 0), 0);
            const done = S().fireDone[k];
            const st = !rs.length
              ? ['empty', 'Boş']
              : done
                ? ['ok', 'Döndü']
                : k === t
                  ? ['today', 'Bugün']
                  : k < t
                    ? ['today', 'Dönülmedi']
                    : ['wait', 'Birikiyor'];
            return `<details class="fb"${k === t || (!done && k < t && rs.length) ? ' open' : ''}><summary><b>${dLabel(k)}</b><span class="st ${st[0]}">${st[1]}</span><small>${rs.length} kalem, ${q} adet${tl ? `, ${TL(tl)}` : ''}${done ? `. Döndü: ${new Date(done).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${new Date(done).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}</small></summary>
      <ul>${rs.map(r => fireRow(r, !done)).join('') || '<li class="sempty">Bu güne düşen kaldırılan ürün yok.</li>'}</ul>
      ${rs.length ? `<div class="simp-act">${done ? `<button type="button" class="btn small" data-fbundo="${k}">Dönüşü geri al</button>` : `<button type="button" class="btn small primary" data-fbdone="${k}">Döndü olarak işaretle</button>`}<button type="button" class="btn small" data-fbshare="${k}">Listeyi paylaş</button><button type="button" class="btn small" data-fbcopy="${k}">Excel için kopyala</button></div>` : ''}</details>`;
          })
          .join('')
      : '<p class="hint">Henüz kaldırılan ürün yok.</p>';
    // üst uyarı
    const fa = $('fireAlert'),
      parts = [];
    if (pendingToday) {
      const tl = pendingToday.reduce((a, r) => a + (r.price != null ? r.price * r.qty : 0), 0);
      parts.push(`<b>Bugün fire günü:</b> ${pendingToday.length} kalem${tl ? ` (${TL(tl)})` : ''} dönülecek.`);
    }
    if (overdue.length)
      parts.push(`<b>${overdue.length} fire listesi dönülmedi</b> (${overdue.map(k => dLabel(k)).join(', ')}).`);
    fa.hidden = !parts.length;
    fa.innerHTML = parts.join(' ');
  }
  function batchText(k) {
    const rs = (batchMap()[k] || []).slice().sort((a, b) => a.at.localeCompare(b.at)),
      q = rs.reduce((a, r) => a + r.qty, 0),
      tl = rs.reduce((a, r) => a + (r.price != null ? r.price * r.qty : 0), 0);
    return [
      `FİRE: ${dLabel(k)}`,
      `${rs.length} kalem, ${q} adet${tl ? `, ${TL(tl)} (satış fiyatıyla)` : ''}`,
      '',
      ...rs.map(
        r =>
          `${r.name || r.barcode}${r.barcode && r.name ? ` (${r.barcode})` : ''}: ${r.qty} adet${r.price != null ? ` x ${TL(r.price)} = ${TL(r.price * r.qty)}` : ''}, ${r.reason}`
      )
    ].join('\n');
  }
  $('fbList').addEventListener('click', async e => {
    const d = e.target.closest('[data-fbdone]');
    if (d) {
      S().fireDone[d.dataset.fbdone] = new Date().toISOString();
      logla('firedondu', dLabel(d.dataset.fbdone), 0);
      save();
      renderBatches();
      renderLog();
      V.toast('Fire listesi döndü olarak işaretlendi.');
      return;
    }
    const u = e.target.closest('[data-fbundo]');
    if (u) {
      if (!(await askConfirm('Bu fire listesinin dönüşü geri alınsın mı?'))) return;
      delete S().fireDone[u.dataset.fbundo];
      logla('firedonmedi', dLabel(u.dataset.fbundo), 0);
      save();
      renderBatches();
      renderLog();
      return;
    }
    const sh = e.target.closest('[data-fbshare]');
    if (sh) {
      shareText(batchText(sh.dataset.fbshare), 'Fire listesi', 'Liste panoya kopyalandı.');
      return;
    }
    const cp = e.target.closest('[data-fbcopy]');
    if (cp) {
      const rs = (batchMap()[cp.dataset.fbcopy] || []).slice().sort((a, b) => a.at.localeCompare(b.at)),
        num = n => (n == null ? '' : String(Math.round(n * 100) / 100).replace('.', ','));
      const rows = [
        ['Kaldırma', 'Ürün', 'Barkod', 'Grup', 'Reyon', 'SKT', 'Adet', 'Satış fiyatı', 'Tutar', 'Sebep'].join('\t'),
        ...rs.map(r =>
          [
            new Date(r.at).toLocaleDateString('tr-TR'),
            r.name || '',
            r.barcode ? '="' + r.barcode + '"' : '',
            grp(r.group).name,
            r.shelf || '',
            new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR'),
            r.qty,
            num(r.price),
            r.price != null ? num(r.price * r.qty) : '',
            r.reason
          ].join('\t')
        )
      ];
      try {
        await navigator.clipboard.writeText(rows.join('\n'));
        V.toast('Tablo kopyalandı.');
      } catch (err) {
        shareText(rows.join('\n'), 'Fire listesi', 'Tablo kopyalandı.');
      }
      return;
    }
    const un = e.target.closest('[data-fundo]');
    if (un) {
      const r = S().fire.find(x => x.id === un.dataset.fundo);
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
      }
      save();
      render();
      renderFire();
      renderBatches();
      V.toast('Geri alındı.');
    }
  });
  function renderFireDays() {
    $('fDays').innerHTML = DSHORT.map(
      (d, i) =>
        `<button type="button" class="dchip" data-fd="${i}" aria-pressed="${S().fireDays.includes(i)}">${d}</button>`
    ).join('');
  }
  $('fDays').addEventListener('click', e => {
    const b = e.target.closest('[data-fd]');
    if (!b) return;
    const i = Number(b.dataset.fd),
      fd = S().fireDays;
    S().fireDays = fd.includes(i) ? fd.filter(x => x !== i) : [...fd, i].sort();
    save();
    renderFireDays();
    renderBatches();
  });

