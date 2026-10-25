  /* --- BS raporu: ayın ürünleri (kod, ad, fiyat) + günlük adet, ciro, müşteri --- */
  function F(m) {
    const a = AB();
    if (!a.focus) a.focus = {};
    if (!a.focus[m]) a.focus[m] = { items: [], sales: {} };
    return a.focus[m];
  }
  const isoToday = () => {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const rpYm = () => ($('rpDate').value || isoToday()).slice(0, 7),
    rpI = () => Number(($('rpDate').value || isoToday()).slice(8, 10));
  const parseP = v => {
    let t = String(v || '').replace(/\s|₺/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    const x = parseFloat(t);
    return isFinite(x) ? x : null;
  };
  const TLf = n =>
    (Math.round((n || 0) * 100) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    ' ₺';
  let rpEditId = null;
  // Ürün kodu kataloğu: bir kez girilen kodun adı ve fiyatı hatırlanır (tüm aylar için)
  function bsCat() {
    const a = AB();
    if (!a.bsCat) {
      a.bsCat = {};
      Object.values(a.focus || {}).forEach(f =>
        (f.items || []).forEach(it => {
          if (it.code) a.bsCat[it.code] = { name: it.name, price: it.price != null ? it.price : null };
        })
      );
    }
    return a.bsCat;
  }
  let rpAuto = false;
  function rpFromCode() {
    const c = bsCat()[$('rpCode').value.trim()];
    if (c) {
      if (!$('rpName').value || rpAuto) {
        $('rpName').value = c.name || '';
        $('rpPrice').value = c.price != null ? String(c.price).replace('.', ',') : '';
        rpAuto = true;
      }
    } else if (rpAuto) {
      $('rpName').value = '';
      $('rpPrice').value = '';
      rpAuto = false;
    }
  }
  function monthTot(f, id, i) {
    return Object.entries(f.sales)
      .filter(([d]) => Number(d) <= i)
      .reduce((a, [, v]) => a + (Number(v[id]) || 0), 0);
  }
  function renderBs() {
    if (!$('rpDate').value) $('rpDate').value = isoToday();
    $('rpStore').value = AB().store || ((window.__giris && window.__giris()) || {}).magaza || '';
    fillRep();
    const f = F(rpYm());
    $('rpItems').innerHTML = f.items.length
      ? f.items
          .map(
            it =>
              `<li class="rp-item"><div><b>${esc(it.name)}</b><small>${it.code ? 'Kod ' + esc(it.code) + ', ' : ''}${it.price != null ? TLf(it.price) : 'fiyat yok'}</small></div><button type="button" class="btn small" data-rped="${it.id}">Düzenle</button><button type="button" class="del" data-rpdel="${it.id}" aria-label="${esc(it.name)} ürününü sil">×</button></li>`
          )
          .join('')
      : '<li class="sempty" style="padding:10px">Bu ay için ürün eklenmedi.</li>';
  }
  function fillRep() {
    const m = rpYm(),
      i = rpI(),
      x = plan(m).days[i] || {},
      f = F(m),
      sd = f.sales[i] || {};
    $('rpCiro').value = x.ciro != null ? fmtN(x.ciro) : '';
    $('rpMus').value = x.mus != null ? x.mus : '';
    const ir = (f.irs || {})[i] || {};
    $('irsN').value = ir.n != null ? ir.n : '';
    $('irsG').setAttribute('aria-pressed', !!ir.g);
    $('irsT').setAttribute('aria-pressed', !!ir.t);
    $('irsNone').checked = !!ir.none;
    irsUi();
    $('rpList').innerHTML = f.items.length
      ? f.items
          .map(
            it =>
              `<li class="rp-row" data-rprow="${it.id}"><div><b>${esc(it.name)}</b><small>${it.code ? 'Kod ' + esc(it.code) + ' · ' : ''}${it.price != null ? TLf(it.price) : 'fiyat yok'} · ay: ${fmtN(monthTot(f, it.id, i))} adet</small></div><input data-rpq="${it.id}" inputmode="numeric" value="${sd[it.id] != null ? sd[it.id] : ''}" placeholder="0" aria-label="${esc(it.name)} satılan adet"><span class="rp-amt" data-rpamt="${it.id}"></span></li>`
          )
          .join('')
      : '<li class="sempty" style="padding:10px">Önce aşağıdan ayın ürünlerini ekle.</li>';
    calcRep();
  }
  function curQty() {
    const o = {};
    document.querySelectorAll('#rpList [data-rpq]').forEach(inp => {
      const v = parseN(inp.value);
      if (v != null) o[inp.dataset.rpq] = v;
    });
    return o;
  }
  function calcRep() {
    const f = F(rpYm()),
      q = curQty();
    let n = 0,
      t = 0;
    f.items.forEach(it => {
      const a = Number(q[it.id]) || 0,
        amt = it.price != null ? a * it.price : null;
      n += a;
      if (amt) t += amt;
      const el = document.querySelector(`[data-rpamt="${it.id}"]`);
      if (el) el.textContent = a && amt != null ? TLf(amt) : '';
    });
    $('rpTot').innerHTML = f.items.length ? `<span>Toplam</span><b>${fmtN(n)} adet</b><b>${TLf(t)}</b>` : '';
  }
  function saveRep() {
    const m = rpYm(),
      i = rpI(),
      P = plan(m),
      x = P.days[i] || {},
      f = F(m);
    const c = parseN($('rpCiro').value),
      mu = parseN($('rpMus').value);
    x.ciro = c;
    x.mus = mu;
    if (x.saat == null && c != null && m === ym) {
      const r = rows()[i - 1];
      x.saat = r ? r.hp : null;
    }
    if (x.ciro == null && x.mus == null && x.saat == null) delete P.days[i];
    else P.days[i] = x;
    const sd = curQty();
    if (Object.keys(sd).length) f.sales[i] = sd;
    else delete f.sales[i];
    if (!f.irs) f.irs = {};
    const ir = {
      n: parseN($('irsN').value),
      g: $('irsG').getAttribute('aria-pressed') === 'true',
      t: $('irsT').getAttribute('aria-pressed') === 'true',
      none: $('irsNone').checked
    };
    if (ir.n == null && !ir.g && !ir.t && !ir.none) delete f.irs[i];
    else f.irs[i] = ir;
    AB().store = $('rpStore').value.trim();
    V.save();
    if (m === ym) renderCiro();
    fillRep();
  }
  function repText() {
    const m = rpYm(),
      i = rpI(),
      [y, mo] = m.split('-').map(Number),
      wd = (new Date(y, mo - 1, i).getDay() + 6) % 7,
      x = plan(m).days[i] || {},
      f = F(m),
      sd = f.sales[i] || {};
    const L = [
      `${AB().store ? AB().store + ' - ' : ''}${i} ${MON[mo - 1]} ${y} ${['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][wd]}`
    ];
    L.push(`Ciro: ${x.ciro != null ? fmtN(x.ciro) + ' ₺' : '-'}`, `Müşteri: ${x.mus != null ? fmtN(x.mus) : '-'}`);
    const ir = (f.irs || {})[i];
    if (ir)
      L.push(
        ir.none
          ? 'İrsaliye: bugün gelmedi'
          : `İrsaliye${ir.n != null ? ' (' + fmtN(ir.n) + ' adet)' : ''}: girildi ${ir.g ? '✅' : '❌'}, takıldı ${ir.t ? '✅' : '❌'}`
      );
    if (f.items.length) {
      let n = 0,
        t = 0;
      L.push('', 'Ayın ürünleri:');
      f.items.forEach(it => {
        const a = Number(sd[it.id]) || 0,
          amt = it.price != null ? a * it.price : null;
        n += a;
        if (amt) t += amt;
        L.push(
          `${it.code ? it.code + ' ' : ''}${it.name}: ${fmtN(a)} adet${amt != null ? ' = ' + TLf(amt) : ''} (ay: ${fmtN(monthTot(f, it.id, i))})`
        );
      });
      L.push(`Toplam: ${fmtN(n)} adet, ${TLf(t)}`);
    }
    return L.join('\n');
  }
  function rpReset() {
    rpEditId = null;
    rpAuto = false;
    $('rpCode').value = '';
    $('rpName').value = '';
    $('rpPrice').value = '';
    $('rpAdd').textContent = 'Ekle';
    $('rpCancel').hidden = true;
  }
  $('rpDate').addEventListener('change', renderBs);
  function irsUi() {
    const n = $('irsNone').checked;
    document.querySelector('#bsDaily .irs').classList.toggle('off', n);
  }
  ['irsG', 'irsT'].forEach(id =>
    $(id).addEventListener('click', () => {
      const b = $(id);
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
      if (b.getAttribute('aria-pressed') === 'true') {
        $('irsNone').checked = false;
        irsUi();
      }
    })
  );
  $('irsNone').addEventListener('change', () => {
    if ($('irsNone').checked) {
      $('irsG').setAttribute('aria-pressed', 'false');
      $('irsT').setAttribute('aria-pressed', 'false');
      $('irsN').value = '';
    }
    irsUi();
  });
  $('rpStore').addEventListener('change', () => {
    AB().store = $('rpStore').value.trim();
    V.save();
  });
  $('rpList').addEventListener('input', e => {
    if (e.target.closest('[data-rpq]')) calcRep();
  });
  $('rpSave').addEventListener('click', () => {
    saveRep();
    V.toast(`${rpI()}. gün kaydedildi.`);
  });
  $('rpSend').addEventListener('click', () => {
    saveRep();
    if (!portal('rapor', $('rpDate').value || isoToday(), repText(), 'Rapor'))
      out(repText(), 'BS raporu', "Rapor kopyalandı; WhatsApp'ta BS'ye yapıştır.");
  });
  $('rpWa').addEventListener('click', () => {
    saveRep();
    out(repText(), 'BS raporu', "Rapor kopyalandı; WhatsApp'ta BS'ye yapıştır.");
  });
  $('rpAdd').addEventListener('click', () => {
    const name = $('rpName').value.trim(),
      code = $('rpCode').value.trim(),
      price = parseP($('rpPrice').value);
    if (!name) {
      V.toast('Ürün adını yaz.');
      $('rpName').focus();
      return;
    }
    const f = F(rpYm());
    if (!rpEditId && code && f.items.some(x => x.code === code)) {
      V.toast('Bu kod bu ayın listesinde zaten var.');
      return;
    }
    if (rpEditId) {
      const it = f.items.find(x => x.id === rpEditId);
      if (it) {
        it.name = name;
        it.code = code;
        it.price = price;
      }
    } else f.items.push({ id: uid(), code, name, price });
    if (code) bsCat()[code] = { name, price };
    rpAuto = false;
    rpReset();
    V.save();
    renderBs();
    $('rpCode').focus();
  });
  $('rpCancel').addEventListener('click', rpReset);
  $('rpCode').addEventListener('input', rpFromCode);
  $('rpName').addEventListener('input', () => {
    rpAuto = false;
  });
  $('rpPrice').addEventListener('input', () => {
    rpAuto = false;
  });
  $('rpName').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('rpAdd').click();
    }
  });
  $('rpItems').addEventListener('click', async e => {
    const f = F(rpYm());
    const ed = e.target.closest('[data-rped]');
    if (ed) {
      const it = f.items.find(x => x.id === ed.dataset.rped);
      if (!it) return;
      rpEditId = it.id;
      $('rpCode').value = it.code || '';
      $('rpName').value = it.name;
      $('rpPrice').value = it.price != null ? String(it.price).replace('.', ',') : '';
      $('rpAdd').textContent = 'Kaydet';
      $('rpCancel').hidden = false;
      $('rpName').focus();
      return;
    }
    const b = e.target.closest('[data-rpdel]');
    if (!b) return;
    const it = f.items.find(x => x.id === b.dataset.rpdel);
    if (!it) return;
    if (!(await window.askConfirm(`“${it.name}” bu ayın listesinden çıkarılsın mı?`))) return;
    f.items = f.items.filter(x => x !== it);
    Object.values(f.sales).forEach(v => delete v[it.id]);
    V.save();
    renderBs();
  });
  $('rpCopyPrev').addEventListener('click', () => {
    const [y, m] = rpYm().split('-').map(Number),
      d = new Date(y, m - 2, 1),
      pm = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    const prev = (AB().focus || {})[pm];
    if (!prev || !prev.items.length) {
      V.toast('Geçen ay için ürün yok.');
      return;
    }
    const f = F(rpYm()),
      have = new Set(f.items.map(x => (x.code || '') + '|' + x.name.toLocaleLowerCase('tr-TR')));
    let n = 0;
    prev.items.forEach(it => {
      if (!have.has((it.code || '') + '|' + it.name.toLocaleLowerCase('tr-TR'))) {
        f.items.push({ id: uid(), code: it.code || '', name: it.name, price: it.price != null ? it.price : null });
        n++;
      }
    });
    V.save();
    renderBs();
    V.toast(n ? `${n} ürün eklendi.` : 'Hepsi zaten listede.');
  });

