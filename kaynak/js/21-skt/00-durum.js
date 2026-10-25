/* ===== SKT (son kullanma tarihi) kontrolü ===== */
(function () {
  const V = window.__vardiya;
  if (!V) return;
  const S = () => V.state().skt;
  const $ = id => document.getElementById(id);
  const esc = V.esc;
  let filter = 'kontrol',
    scanning = false,
    stream = null,
    zx = null;
  if (!S().remind) S().remind = { on: true, time: '20:00', last: '' };
  if (!Array.isArray(S().groups))
    S().groups = [
      { id: 'genel', name: 'Genel', off: 0 },
      { id: 'tavuk', name: 'Tavuk / beyaz et', off: 2 }
    ];
  const groups = () => S().groups;
  function grp(id) {
    return (
      groups().find(g => g.id === id) || groups().find(g => g.id === 'genel') || { id: 'genel', name: 'Genel', off: 0 }
    );
  }
  const offOf = it => Math.max(0, Number(grp(it.group).off) || 0);
  function shiftDate(ds, n) {
    const d = new Date(ds + 'T12:00:00');
    d.setDate(d.getDate() - n);
    return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
  }
  // Raftan kaldırma günü: SKT'den grubun gün sayısı kadar önce (o günün akşamı)
  const remDate = it => shiftDate(it.date, offOf(it));
  // Fire kayıtları: her raftan kaldırma bir kayıt; kısmi kaldırmada ürün kalan adetle takipte kalır
  if (!Array.isArray(S().sold)) S().sold = [];
  if (!Array.isArray(S().fire)) {
    S().fire = [];
    S()
      .items.filter(i => i.done)
      .forEach(i => {
        S().fire.push({
          id: Math.random().toString(36).slice(2, 9),
          itemId: i.id,
          at: i.doneAt || i.added || new Date().toISOString(),
          name: i.name,
          barcode: i.barcode,
          group: i.group,
          shelf: i.shelf,
          date: i.date,
          qty: i.qty || 1,
          price: null,
          reason: 'SKT geldi'
        });
        i.qty = 0;
      });
  }
  const TL = n => (Number(n) || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  const parsePrice = v => {
    const x = parseFloat(
      String(v || '')
        .replace(/\s/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(',', '.')
    );
    return isFinite(x) && x >= 0 ? Math.round(x * 100) / 100 : null;
  };
  // Android uygulamasında (köprü varsa) her gün belirlenen saatte telefon bildirimi kurulur
  function syncNative() {
    try {
      if (!(window.AndroidApp && AndroidApp.scheduleSkt)) return;
      const r = S().remind;
      AndroidApp.scheduleSkt(
        JSON.stringify({
          on: !!r.on,
          time: r.time,
          defWarn: Number(S().defWarn) || 0,
          items: S()
            .items.filter(i => !i.done)
            .map(i => ({
              name: i.name || i.barcode || 'Ürün',
              date: remDate(i),
              warn: i.warn === null || i.warn === undefined || i.warn === '' ? null : Number(i.warn)
            }))
        })
      );
    } catch (e) {}
  }
  function save() {
    V.save();
    syncNative();
  }

  function today() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }
  function daysLeft(ds) {
    return Math.round((new Date(ds + 'T00:00:00') - today()) / 864e5);
  }
  function warnOf(it) {
    return it.warn === null || it.warn === undefined || it.warn === ''
      ? Number(S().defWarn) || 0
      : Number(it.warn) || 0;
  }
  function status(it) {
    const d = daysLeft(remDate(it));
    return d < 0 ? 'exp' : d <= warnOf(it) ? 'soon' : 'ok';
  }
  function leftText(d, off) {
    if (off > 0)
      return d < 0
        ? `Kaldırılması gerekiyordu (${-d} gün önce)`
        : d === 0
          ? 'Bugün akşam kaldır'
          : d === 1
            ? 'Yarın akşam kaldır'
            : `${d} gün sonra kaldır`;
    return d < 0 ? `${-d} gün geçti` : d === 0 ? 'Bugün son gün' : d === 1 ? 'Yarın son gün' : `${d} gün kaldı`;
  }
  const itemLeft = it => leftText(daysLeft(remDate(it)), offOf(it));
  const dateLabel = it => (offOf(it) > 0 ? `${fmtDate(remDate(it))} akşamı` : fmtDate(it.date));
  function fmtDate(ds) {
    return new Date(ds + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const uid = () => Math.random().toString(36).slice(2, 9);
  // Kim ne yaptı: her işlem yapan kişinin adıyla kaydedilir
  const who = () => {
    try {
      const g = window.__giris && window.__giris();
      return (g && g.ad) || '';
    } catch (e) {
      return '';
    }
  };
  function logla(t, ad, q) {
    if (!Array.isArray(S().log)) S().log = [];
    S().log.push({ at: new Date().toISOString(), by: who(), t, ad: ad || '', q: q || 0 });
    if (S().log.length > 500) S().log.splice(0, S().log.length - 500);
    setTimeout(renderLog, 0);
  }

  function counts() {
    const act = S().items.filter(i => !i.done);
    return {
      exp: act.filter(i => status(i) === 'exp').length,
      soon: act.filter(i => status(i) === 'soon').length,
      all: act.length
    };
  }
  function renderBadge() {
    const c = counts(),
      n = c.exp + c.soon,
      b = $('sktBadge');
    b.hidden = !n;
    b.textContent = n;
  }
  function render() {
    renderBadge();
    if (typeof renderTur === 'function') renderTur();
    const c = counts();
    const late = S().items.filter(i => !i.done && status(i) === 'exp');
    const maxLate = late.reduce((m, i) => Math.max(m, -daysLeft(remDate(i))), 0);
    $('sAlert').hidden = !late.length;
    $('sAlert').innerHTML = late.length
      ? `<b>${late.length} ürün hâlâ raftan kaldırılmadı.</b> ${maxLate > 1 ? `En eskisi ${maxLate} gündür bekliyor. ` : ''}“Raftan kaldırıldı” diye işaretlenene kadar her gün uyarı verilir.`
      : '';
    $('sktSum').innerHTML =
      `<button type="button" class="exp" data-sf="kontrol"><b>${c.exp}</b><span>Kaldırılacak</span></button><button type="button" class="soon" data-sf="kontrol"><b>${c.soon}</b><span>Yaklaşan</span></button><button type="button" data-sf="tumu"><b>${c.all}</b><span>Takipte</span></button>`;
    const q = () => ($('sSearch').value || '').toLocaleLowerCase('tr-TR').trim();
    if (filter === 'done') {
      renderFireList(q());
      return;
    }
    let list = S().items.filter(i => !i.done);
    if (filter === 'kontrol') list = list.filter(i => status(i) !== 'ok');
    const qq = q();
    if (qq)
      list = list.filter(i =>
        [i.name, i.barcode, i.shelf, grp(i.group).name].join(' ').toLocaleLowerCase('tr-TR').includes(qq)
      );
    list.sort((a, b) =>
      filter === 'done' ? (b.doneAt || '').localeCompare(a.doneAt || '') : remDate(a).localeCompare(remDate(b))
    );
    const row = it => {
      const st = it.done ? '' : status(it),
        off = offOf(it);
      const meta = [
        off > 0 ? `SKT ${fmtDate(it.date)}` : '',
        grp(it.group).id !== 'genel' ? grp(it.group).name : '',
        it.barcode,
        it.shelf,
        it.qty > 1 ? it.qty + ' adet' : '',
        it.by ? 'Ekleyen: ' + it.by : ''
      ]
        .filter(Boolean)
        .map(esc)
        .join(', ');
      return `<li class="si ${st}"><div class="si-main"><b>${esc(it.name || 'Adsız ürün')}${it.disc ? '<span class="stag">İndirimde</span>' : ''}</b><small>${meta || '&nbsp;'}</small></div>
      <div class="si-date"><b>${dateLabel(it)}</b><small>${it.done ? (it.soldOut ? 'Satıldı' : 'Kaldırıldı') : itemLeft(it)}</small></div>
      <div class="si-act">${
        it.done
          ? `<button type="button" data-act="undo" data-id="${it.id}">Geri al</button><button type="button" data-act="del" data-id="${it.id}">Sil</button>`
          : `<button type="button" class="go" data-act="done" data-id="${it.id}">Raftan kaldırıldı</button><button type="button" class="sold" data-act="sold" data-id="${it.id}">Satıldı</button><button type="button" data-act="disc" data-id="${it.id}">${it.disc ? 'İndirimi kaldır' : 'İndirime alındı'}</button><button type="button" data-act="del" data-id="${it.id}">Sil</button>`
      }</div></li>`;
    };
    let html = '';
    if (filter === 'kontrol') {
      const a = list.filter(i => status(i) === 'exp'),
        b = list.filter(i => status(i) === 'soon');
      if (a.length) html += `<li class="shead exp">Kaldırılmamış ürünler (${a.length})</li>` + a.map(row).join('');
      if (b.length) html += `<li class="shead soon">Yaklaşan (${b.length})</li>` + b.map(row).join('');
    } else html = list.map(row).join('');
    $('sList').innerHTML =
      html ||
      `<li class="sempty">${filter === 'kontrol' ? 'Kontrol edilecek ürün yok.' : filter === 'done' ? 'Kaldırılan ürün yok.' : 'Henüz ürün eklenmedi.'}</li>`;
  }

  let lastFilled = '';
  function showKnown(c, bc) {
    const k = $('sKnown');
    k.classList.remove('web');
    $('sktAddBox').classList.toggle('known', !!(c && c.name));
    if (!c) {
      k.hidden = true;
      return;
    }
    const n = S().items.filter(i => i.barcode === bc).length;
    k.hidden = false;
    k.textContent = `Kayıtlı ürün: ${c.name || '(adsız)'}${n ? `, daha önce ${n} kez eklendi` : ''}. Sadece tarihi seç.`;
  }
  // Barkod kayıtlıysa ürün bilgilerini doldurur. force: yeni okutmada eski bilgilerin üstüne yazar.
  function fillFromCatalog(force) {
    const bc = $('sBar').value.trim();
    const c = bc ? S().catalog[bc] : null;
    if (c && (force || lastFilled !== bc)) {
      $('sName').value = c.name || '';
      $('sWarn').value = c.warn != null ? c.warn : '';
      $('sShelf').value = c.shelf || '';
      $('sGroup').value = grp(c.group).id;
      $('sPrice').value = c.price != null ? String(c.price).replace('.', ',') : '';
      lastFilled = bc;
    }
    showKnown(c, bc);
    preview();
    return !!c;
  }
  function fillGroups() {
    const opts = groups()
      .map(
        g =>
          `<option value="${esc(g.id)}">${esc(g.name)}${g.off > 0 ? ` (SKT'den ${g.off} gün önce kalkar)` : ''}</option>`
      )
      .join('');
    const keep = $('sGroup').value;
    $('sGroup').innerHTML = opts;
    $('sGroup').value = groups().some(g => g.id === keep) ? keep : 'genel';
  }
  function preview() {
    const date = $('sDate').value,
      el = $('sPrev');
    if (!date) {
      el.hidden = true;
      return;
    }
    const it = { date, group: $('sGroup').value };
    const off = offOf(it);
    el.hidden = false;
    el.textContent =
      off > 0
        ? `Raftan kaldırma: ${fmtDate(remDate(it))} akşamı (SKT'den ${off} gün önce). ${itemLeft(it)}.`
        : `SKT: ${fmtDate(date)}. ${itemLeft(it)}.`;
  }
  function add() {
    const bc = $('sBar').value.trim(),
      name = $('sName').value.trim(),
      date = $('sDate').value;
    if (!name && !bc) {
      V.toast('Ürün adı ya da barkod gir.');
      $('sName').focus();
      return;
    }
    if (!date) {
      V.toast('Son kullanma tarihini seç.');
      $('sDate').focus();
      return;
    }
    const w = $('sWarn').value === '' ? null : Math.max(0, parseInt($('sWarn').value, 10) || 0);
    const qty = Math.max(1, parseInt($('sQty').value, 10) || 1);
    const pr = parsePrice($('sPrice').value);
    const it = {
      id: uid(),
      barcode: bc,
      name: name || (S().catalog[bc] && S().catalog[bc].name) || '',
      date,
      group: $('sGroup').value || 'genel',
      qty,
      shelf: $('sShelf').value.trim(),
      warn: w,
      price: pr,
      done: false,
      disc: false,
      added: new Date().toISOString(),
      by: who()
    };
    S().items.push(it);
    logla('ekle', it.name || it.barcode, qty);
    if (bc)
      S().catalog[bc] = {
        name: it.name,
        warn: w,
        shelf: it.shelf,
        group: it.group,
        price: pr != null ? pr : S().catalog[bc] && S().catalog[bc].price != null ? S().catalog[bc].price : null,
        used: ((S().catalog[bc] && S().catalog[bc].used) || 0) + 1,
        last: new Date().toISOString()
      };
    save();
    V.toast(`${it.name || 'Ürün'} eklendi: ${itemLeft(it).toLocaleLowerCase('tr-TR')}.`);
    ['sBar', 'sName', 'sDate', 'sShelf', 'sWarn', 'sPrice'].forEach(k => ($(k).value = ''));
    $('sQty').value = 1;
    $('sGroup').value = 'genel';
    lastFilled = '';
    showKnown(null);
    preview();
    render();
    renderCat();
    if (seri) {
      seri.n++;
      seriBan();
      if (seri.cam) startScan();
      else $('sBar').focus();
    } else $('sBar').focus();
  }

