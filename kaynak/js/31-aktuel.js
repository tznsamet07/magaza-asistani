/* ===== Aktüel ürünler (Salı, Cuma, Pazar) ===== */
(function () {
  const V = window.__vardiya;
  if (!V) return;
  const $ = id => document.getElementById(id),
    esc = V.esc,
    KEY = 'vardiya-aktuel';
  const DAYS = [
    { k: 'sal', i: 1, n: 'Salı' },
    { k: 'cum', i: 4, n: 'Cuma' },
    { k: 'paz', i: 6, n: 'Pazar' }
  ];
  let D;
  try {
    D = JSON.parse(localStorage.getItem(KEY) || 'null') || { weeks: {} };
  } catch (e) {
    D = { weeks: {} };
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(D));
      return true;
    } catch (e) {
      V.toast('Telefonda yer kalmadı; eski fotoğrafları sil.');
      return false;
    }
  };
  const pad = n => String(n).padStart(2, '0'),
    ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const monOf = d => {
    const x = new Date(d);
    x.setHours(12, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return ymd(x);
  };
  let wk = monOf(new Date()),
    day = (() => {
      const wd = (new Date().getDay() + 6) % 7;
      return wd >= 6 ? 'paz' : wd >= 4 ? 'cum' : 'sal';
    })(),
    editId = null,
    img = null;
  const items = () => {
    const w = (D.weeks[wk] = D.weeks[wk] || { items: [] });
    return w.items;
  };
  const dateOf = i => {
    const d = new Date(wk + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return d;
  };
  const TL = n =>
    n == null
      ? ''
      : Number(n).toLocaleString('tr-TR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' ₺';
  const parseP = v => {
    let t = String(v || '').replace(/[^\d,.-]/g, '');
    if (!t) return null;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    const x = parseFloat(t);
    return isFinite(x) ? Math.round(x * 100) / 100 : null;
  };
  function render() {
    const a = dateOf(0),
      b = dateOf(6),
      f = d => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    $('akWeek').textContent = `${f(a)} – ${f(b)}${wk === monOf(new Date()) ? ' (bu hafta)' : ''}`;
    const its = items();
    $('akDays').innerHTML = DAYS.map(
      x =>
        `<button type="button" role="tab" data-akd="${x.k}" aria-selected="${x.k === day}">${x.n}<small>${dateOf(x.i).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · ${its.filter(i => i.day === x.k).length} ürün</small></button>`
    ).join('');
    const list = its.filter(i => i.day === day);
    $('akList').innerHTML = list.length
      ? list
          .map(
            i =>
              `<div class="ak-card"><div class="ph">${i.img ? `<img src="${i.img}" alt="${esc(i.name)}">` : 'Fotoğraf yok'}</div><div class="bd"><b>${esc(i.name)}</b><span class="pr">${TL(i.price)}</span>${i.qty ? `<small>Gelen: ${i.qty} adet</small>` : ''}${i.note ? `<small>${esc(i.note)}</small>` : ''}<div class="acts"><button type="button" data-ake="${i.id}">Düzenle</button><button type="button" data-akx="${i.id}">Sil</button></div></div></div>`
          )
          .join('')
      : `<p class="sempty" style="grid-column:1/-1">${DAYS.find(x => x.k === day).n} için henüz ürün yok. Aşağıdan fotoğrafla ekle ya da listeyi toplu yapıştır.</p>`;
    let bytes = 0;
    Object.values(D.weeks).forEach(w =>
      (w.items || []).forEach(i => {
        if (i.img) bytes += i.img.length;
      })
    );
    $('akStore').textContent = `Fotoğraflar telefonda yaklaşık ${(bytes / 1048576).toFixed(1)} MB yer kaplıyor.`;
  }
  window.__renderAk = render;
  function resetForm() {
    editId = null;
    img = null;
    ['akName', 'akPrice', 'akQty', 'akNote'].forEach(k => ($(k).value = ''));
    $('akImgPrev').hidden = true;
    $('akImgDel').hidden = true;
    $('akFormT').textContent = 'Ürün ekle';
    $('akSave').textContent = 'Ekle';
    $('akCancel').hidden = true;
  }
  function shrink(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => {
          const M = 480,
            sc = Math.min(1, M / Math.max(im.width, im.height)),
            c = document.createElement('canvas');
          c.width = Math.round(im.width * sc);
          c.height = Math.round(im.height * sc);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.72));
        };
        im.onerror = rej;
        im.src = r.result;
      };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  $('akImg').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      img = await shrink(f);
      $('akImgPrev').src = img;
      $('akImgPrev').hidden = false;
      $('akImgDel').hidden = false;
    } catch (x) {
      V.toast('Fotoğraf okunamadı.');
    }
  });
  $('akImgDel').addEventListener('click', () => {
    img = '';
    $('akImgPrev').hidden = true;
    $('akImgDel').hidden = true;
  });
  $('akSave').addEventListener('click', () => {
    const name = $('akName').value.trim();
    if (!name) {
      V.toast('Ürün adını yaz.');
      $('akName').focus();
      return;
    }
    const data = {
      name,
      price: parseP($('akPrice').value),
      qty: parseInt($('akQty').value, 10) || null,
      note: $('akNote').value.trim()
    };
    if (editId) {
      const it = items().find(x => x.id === editId);
      if (it) {
        Object.assign(it, data);
        if (img !== null) it.img = img || null;
      }
    } else items().push({ id: Math.random().toString(36).slice(2, 9), day, ...data, img: img || null });
    if (save()) {
      V.toast(editId ? 'Ürün güncellendi.' : 'Ürün eklendi.');
      resetForm();
      render();
    }
  });
  $('akCancel').addEventListener('click', resetForm);
  $('akDays').addEventListener('click', e => {
    const b = e.target.closest('[data-akd]');
    if (!b) return;
    day = b.dataset.akd;
    resetForm();
    render();
  });
  $('akPrev').addEventListener('click', () => {
    const d = new Date(wk + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    wk = ymd(d);
    resetForm();
    render();
  });
  $('akNext').addEventListener('click', () => {
    const d = new Date(wk + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    wk = ymd(d);
    resetForm();
    render();
  });
  $('akList').addEventListener('click', async e => {
    const ed = e.target.closest('[data-ake]'),
      dl = e.target.closest('[data-akx]');
    if (ed) {
      const it = items().find(x => x.id === ed.dataset.ake);
      if (!it) return;
      editId = it.id;
      img = null;
      $('akName').value = it.name;
      $('akPrice').value = it.price != null ? String(it.price).replace('.', ',') : '';
      $('akQty').value = it.qty || '';
      $('akNote').value = it.note || '';
      if (it.img) {
        $('akImgPrev').src = it.img;
        $('akImgPrev').hidden = false;
        $('akImgDel').hidden = false;
      } else {
        $('akImgPrev').hidden = true;
        $('akImgDel').hidden = true;
      }
      $('akFormT').textContent = 'Ürünü düzenle';
      $('akSave').textContent = 'Kaydet';
      $('akCancel').hidden = false;
      $('akAddBox').open = true;
      $('akAddBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (dl) {
      const it = items().find(x => x.id === dl.dataset.akx);
      if (!it) return;
      if (!(await window.askConfirm(`${it.name} listeden silinsin mi?`, 'Sil'))) return;
      D.weeks[wk].items = items().filter(x => x !== it);
      save();
      render();
    }
  });
  $('akBulkBtn').addEventListener('click', () => {
    const lines = $('akBulk')
      .value.split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
    let n = 0;
    for (const l of lines) {
      const p = l.split(/[;\t|]/).map(x => x.trim());
      if (!p[0]) continue;
      items().push({
        id: Math.random().toString(36).slice(2, 9),
        day,
        name: p[0],
        price: parseP(p[1]),
        qty: parseInt(p[2], 10) || null,
        note: '',
        img: null
      });
      n++;
    }
    if (!n) {
      V.toast('Eklenecek satır bulunamadı.');
      return;
    }
    if (save()) {
      $('akBulk').value = '';
      render();
      V.toast(`${n} ürün ${DAYS.find(x => x.k === day).n} listesine eklendi.`);
    }
  });
  $('akShare').addEventListener('click', async () => {
    const list = items().filter(i => i.day === day),
      dn = DAYS.find(x => x.k === day);
    if (!list.length) {
      V.toast('Bu günde ürün yok.');
      return;
    }
    const text = [
      `AKTÜEL: ${dn.n} ${dateOf(dn.i).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`,
      '',
      ...list.map(i => `${i.name}: ${TL(i.price) || '-'}${i.qty ? ` (${i.qty} adet)` : ''}`)
    ].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Aktüel ürünler', text });
        return;
      }
    } catch (x) {
      if (x && x.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      V.toast('Liste panoya kopyalandı.');
    } catch (x) {
      V.toast('Kopyalanamadı.');
    }
  });
  $('akClean').addEventListener('click', async () => {
    const lim = new Date();
    lim.setDate(lim.getDate() - 28);
    const L = monOf(lim);
    let n = 0;
    Object.entries(D.weeks).forEach(([w, v]) => {
      if (w < L)
        (v.items || []).forEach(i => {
          if (i.img) {
            i.img = null;
            n++;
          }
        });
    });
    if (!n) {
      V.toast('Silinecek eski fotoğraf yok.');
      return;
    }
    if (!(await window.askConfirm(`${n} eski fotoğraf silinsin mi? Ürün adları ve fiyatlar kalır.`, 'Sil'))) return;
    save();
    render();
    V.toast('Eski fotoğraflar silindi.');
  });
  if (V.state().tab === 'k' && window.__setTab) window.__setTab('k');
})();
