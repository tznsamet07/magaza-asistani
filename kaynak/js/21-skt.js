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

  /* --- günlük hatırlatma --- */
  const pad = n => String(n).padStart(2, '0');
  const todayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  function urgentList() {
    return S()
      .items.filter(i => !i.done && status(i) !== 'ok')
      .sort((a, b) => remDate(a).localeCompare(remDate(b)));
  }
  function summaryText() {
    const c = counts(),
      n = c.exp + c.soon;
    const fs = fireStatus(),
      fl = fs.pendingToday ? `Bugün fire günü: ${fs.pendingToday.length} kalem dönülecek. ` : '';
    if (!n)
      return {
        title: fl ? 'SKT: bugün fire günü' : 'SKT: bugün kontrol edilecek ürün yok',
        body: fl || 'Takipteki ürünlerin hepsi uyarı süresinin dışında.'
      };
    const names = urgentList()
      .slice(0, 6)
      .map(i => {
        const d = daysLeft(remDate(i));
        return `${i.name || i.barcode} (${d < 0 ? 'geçti' : d === 0 ? (offOf(i) ? 'bugün akşam kaldır' : 'bugün') : d + ' gün'})`;
      })
      .join(', ');
    return {
      title: c.exp ? `SKT: ${c.exp} ürün hâlâ raftan kaldırılmadı` : `SKT: ${n} ürün kontrol bekliyor`,
      body:
        fl +
        (c.exp ? `${c.exp} ürün kaldırılmayı bekliyor. ` : '') +
        (c.soon ? `${c.soon} ürün yaklaşıyor. ` : '') +
        names
    };
  }
  function showDialog() {
    const c = counts(),
      list = urgentList();
    const fs = fireStatus();
    const fireLine = fs.pendingToday ? `Bugün fire günü: ${fs.pendingToday.length} kalem dönülecek. ` : '';
    $('sDlgSub').textContent =
      fireLine +
      (list.length
        ? c.exp
          ? `${c.exp} ürün hâlâ raftan kaldırılmadı` + (c.soon ? `, ${c.soon} ürün yaklaşıyor.` : '.')
          : `${c.soon} yaklaşan ürün var.`
        : 'Bugün kontrol edilecek ürün yok.');
    const shown = list.slice(0, 10);
    $('sDlgList').innerHTML =
      shown
        .map(
          (it, k) =>
            (k === 0 && status(it) === 'exp' ? `<li class="shead exp">Kaldırılmamış</li>` : '') +
            (status(it) === 'soon' && (k === 0 || status(shown[k - 1]) === 'exp')
              ? `<li class="shead soon">Yaklaşan</li>`
              : '') +
            `<li class="si ${status(it)}"><div class="si-main"><b>${esc(it.name || it.barcode)}</b><small>${esc([offOf(it) ? 'SKT ' + fmtDate(it.date) : '', it.shelf].filter(Boolean).join(', '))}</small></div><div class="si-date"><b>${dateLabel(it)}</b><small>${itemLeft(it)}</small></div></li>`
        )
        .join('') + (list.length > 10 ? `<li class="sempty">ve ${list.length - 10} ürün daha</li>` : '');
    $('sDlgGo').hidden = !list.length;
    $('sDlg').hidden = false;
    ($('sDlgGo').hidden ? $('sDlgOk') : $('sDlgGo')).focus();
  }
  async function systemNotify() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const t = summaryText();
    try {
      const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
      if (reg && reg.showNotification) {
        await reg.showNotification(t.title, { body: t.body, tag: 'skt-gunluk', icon: 'icons/icon-192.png' });
        return;
      }
    } catch (e) {}
    try {
      new Notification(t.title, { body: t.body, tag: 'skt-gunluk' });
    } catch (e) {}
  }
  function dueNow() {
    const r = S().remind;
    if (!r.on || !S().items.some(i => !i.done)) return false;
    const now = new Date(),
      [h, m] = (r.time || '20:00').split(':').map(Number);
    return now.getHours() * 60 + now.getMinutes() >= h * 60 + m && r.last !== todayStr();
  }
  function checkReminder() {
    if (!dueNow()) return;
    S().remind.last = todayStr();
    save();
    if (!(window.AndroidApp && AndroidApp.scheduleSkt)) systemNotify();
    showDialog();
  }
  function renderRemind() {
    const r = S().remind;
    $('sRemOn').checked = !!r.on;
    const sel = $('sRemTime');
    if (!sel.options.length) {
      const o = [];
      for (let m = 6 * 60; m <= 23 * 60 + 45; m += 15) o.push(pad(Math.floor(m / 60)) + ':' + pad(m % 60));
      sel.innerHTML = o.map(t => `<option value="${t}">${t}</option>`).join('');
    }
    sel.value = r.time || '20:00';
    const native = !!(window.AndroidApp && AndroidApp.scheduleSkt);
    const canAsk = 'Notification' in window && Notification.permission === 'default' && !native;
    $('sNotifBtn').hidden = !canAsk || !r.on;
    $('sRemInfo').textContent = !r.on
      ? 'Hatırlatma kapalı.'
      : native
        ? `Her gün ${r.time} saatinde telefon bildirimi gelir; uygulama kapalı olsa da.`
        : `Her gün ${r.time} saatinde uygulama açıksa özet çıkar${'Notification' in window && Notification.permission === 'granted' ? ' ve bildirim gelir' : ''}. Uygulama o saatte kapalıysa, ilk açtığında o günün özeti gösterilir.`;
  }
  $('sRemOn').addEventListener('change', () => {
    S().remind.on = $('sRemOn').checked;
    save();
    renderRemind();
  });
  $('sRemTime').addEventListener('change', () => {
    S().remind.time = $('sRemTime').value;
    S().remind.last = '';
    const n = new Date(),
      [h, m] = S().remind.time.split(':').map(Number);
    if (n.getHours() * 60 + n.getMinutes() >= h * 60 + m) S().remind.last = todayStr();
    save();
    renderRemind();
  });
  $('sNotifBtn').addEventListener('click', async () => {
    try {
      await Notification.requestPermission();
    } catch (e) {}
    renderRemind();
  });
  $('sDlgOk').addEventListener('click', () => {
    $('sDlg').hidden = true;
  });
  $('sDlgGo').addEventListener('click', () => {
    $('sDlg').hidden = true;
    filter = 'kontrol';
    document
      .querySelectorAll('.sfilter [data-sf]')
      .forEach(x => x.setAttribute('aria-pressed', x.dataset.sf === 'kontrol'));
    setTab('s');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('sDlg').hidden) $('sDlg').hidden = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkReminder();
  });
  setInterval(checkReminder, 30000);
  window.__openSkt = () => setTab('s');

  /* --- bilinmeyen barkodu internette ara --- */
  if (S().online === undefined) S().online = true;
  let lookSeq = 0;
  async function lookupOnline(bc) {
    if (!S().online || !/^\d{8,14}$/.test(bc || '') || S().catalog[bc]) return;
    const seq = ++lookSeq,
      k = $('sKnown');
    k.hidden = false;
    k.classList.add('web');
    k.textContent = 'Barkod internette aranıyor…';
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 6000);
      const r = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${bc}.json?fields=product_name_tr,product_name,brands,quantity`,
        { signal: ctl.signal }
      );
      clearTimeout(t);
      const j = await r.json();
      if (seq !== lookSeq || $('sBar').value.trim() !== bc) return;
      const pr = j && j.status === 1 && j.product;
      const name = pr
        ? [pr.brands && String(pr.brands).split(',')[0].trim(), pr.product_name_tr || pr.product_name, pr.quantity]
            .filter(Boolean)
            .join(' ')
        : '';
      if (name) {
        if (!$('sName').value.trim()) $('sName').value = name;
        k.textContent = `İnternette bulundu: ${name}. Adı kontrol et, gerekirse düzelt; eklediğinde kaydedilir.`;
      } else k.textContent = 'Bu barkod internette bulunamadı. Ürün adını bir kez yaz, sonra hatırlanır.';
    } catch (e) {
      if (seq !== lookSeq) return;
      k.textContent = 'İnternette aranamadı (bağlantı yok ya da izin verilmiyor). Ürün adını yaz.';
    }
  }
  $('sOnline').checked = !!S().online;
  $('sOnline').addEventListener('change', () => {
    S().online = $('sOnline').checked;
    save();
  });

  /* --- toplu yükleme / paylaşma --- */
  function parseLines(txt) {
    const out = [];
    for (const raw of String(txt || '').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const parts = line.split(/\t|;|,(?=\s*\D)|\|/).map(x => x.trim().replace(/^"|"$/g, ''));
      let bc = parts[0].replace(/\s/g, ''),
        name = parts[1] || '',
        g = parts[2] || '',
        pr = parsePrice(parts[3]);
      if (!/^\d{6,14}$/.test(bc) && /^\d{6,14}$/.test((parts[1] || '').replace(/\s/g, ''))) {
        [bc, name] = [parts[1].replace(/\s/g, ''), parts[0]];
      }
      if (!/^\d{6,14}$/.test(bc) || !name) continue;
      if (pr == null && g && parsePrice(g) != null && /^[\d.,\s₺]+$/.test(g)) {
        pr = parsePrice(g);
        g = '';
      }
      out.push({ bc, name, g, pr });
    }
    return out;
  }
  function importText(txt) {
    const rows = parseLines(txt);
    let added = 0,
      updated = 0;
    for (const r of rows) {
      const gm = r.g ? groups().find(x => x.name.toLocaleLowerCase('tr-TR') === r.g.toLocaleLowerCase('tr-TR')) : null;
      const cur = S().catalog[r.bc];
      if (cur) {
        cur.name = r.name;
        if (gm) cur.group = gm.id;
        if (r.pr != null) cur.price = r.pr;
        updated++;
      } else {
        S().catalog[r.bc] = { name: r.name, warn: null, shelf: '', group: gm ? gm.id : 'genel', price: r.pr, used: 0 };
        added++;
      }
    }
    save();
    renderCat();
    V.toast(
      rows.length
        ? `${added} yeni ürün eklendi${updated ? `, ${updated} ürün güncellendi` : ''}.`
        : 'Okunabilir satır bulunamadı. Biçim: barkod; ürün adı'
    );
    return rows.length;
  }
  $('sImpBtn').addEventListener('click', () => {
    if (importText($('sImpText').value)) $('sImpText').value = '';
  });
  $('sImpFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      importText(rd.result);
      e.target.value = '';
    };
    rd.readAsText(f, 'utf-8');
  });
  $('sExpBtn').addEventListener('click', async () => {
    const lines = Object.entries(S().catalog)
      .sort((a, b) => (a[1].name || '').localeCompare(b[1].name || '', 'tr'))
      .map(([bc, c]) => {
        const g = grp(c.group).id !== 'genel' ? grp(c.group).name : '';
        const pr = c.price != null ? String(c.price).replace('.', ',') : '';
        return [bc, c.name || '', ...(g || pr ? [g || 'Genel'] : []), ...(pr ? [pr] : [])].join('; ');
      });
    if (!lines.length) {
      V.toast('Paylaşılacak kayıtlı ürün yok.');
      return;
    }
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SKT ürün listesi', text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      V.toast(`${lines.length} ürün panoya kopyalandı. WhatsApp'a yapıştırabilirsin.`);
    } catch (e) {
      $('sImpText').value = text;
      $('sImpText').select();
      V.toast('Liste kutuya yazıldı; seçip kopyalayabilirsin.');
    }
  });

  /* --- ürün grupları --- */
  function renderGroups() {
    $('sGrpList').innerHTML = groups()
      .map(g => {
        const used = S().items.filter(i => !i.done && grp(i.group).id === g.id).length;
        return `<li class="gi" data-gid="${esc(g.id)}"><input data-gf="name" value="${esc(g.name)}" aria-label="Grup adı"${g.id === 'genel' ? ' readonly' : ''}><input data-gf="off" type="number" min="0" max="60" inputmode="numeric" value="${g.off}" aria-label="${esc(g.name)}: SKT'den kaç gün önce kalkar">${g.id === 'genel' ? '<span></span>' : `<button type="button" class="del" data-gdel="${esc(g.id)}" aria-label="${esc(g.name)} grubunu sil">×</button>`}
      <small>${g.off > 0 ? `SKT'den ${g.off} gün önce akşam raftan kalkar` : 'SKT günü kalkar'}${used ? `, ${used} ürün takipte` : ''}</small></li>`;
      })
      .join('');
  }
  $('sGrpList').addEventListener('change', e => {
    const li = e.target.closest('[data-gid]');
    if (!li) return;
    const g = groups().find(x => x.id === li.dataset.gid);
    if (!g) return;
    if (e.target.dataset.gf === 'name') {
      const v = e.target.value.trim();
      if (v) g.name = v;
    }
    if (e.target.dataset.gf === 'off') g.off = Math.max(0, Math.min(60, parseInt(e.target.value, 10) || 0));
    save();
    renderGroups();
    fillGroups();
    render();
    renderCat();
    preview();
  });
  $('sGrpList').addEventListener('click', async e => {
    const b = e.target.closest('[data-gdel]');
    if (!b) return;
    const g = groups().find(x => x.id === b.dataset.gdel);
    if (!g) return;
    if (!(await askConfirm(`${g.name} grubu silinsin mi? Bu gruptaki ürünler "Genel" grubuna geçer.`))) return;
    S().groups = groups().filter(x => x !== g);
    save();
    renderGroups();
    fillGroups();
    render();
    renderCat();
  });
  $('sGrpAdd').addEventListener('click', () => {
    const name = $('sGrpName').value.trim();
    if (!name) {
      V.toast('Grup adını yaz.');
      $('sGrpName').focus();
      return;
    }
    const off = Math.max(0, Math.min(60, parseInt($('sGrpOff').value, 10) || 0));
    groups().push({ id: uid(), name, off });
    $('sGrpName').value = '';
    $('sGrpOff').value = '';
    save();
    renderGroups();
    fillGroups();
    V.toast(`${name} grubu eklendi.`);
  });
  $('sGroup').addEventListener('change', preview);
  $('sDate').addEventListener('change', preview);
  $('sDate').addEventListener('input', preview);

  /* --- kayıtlı ürünler --- */
  let editing = null;
  function renderCat() {
    const cat = S().catalog,
      keys = Object.keys(cat);
    $('sCatCount').textContent = keys.length ? `(${keys.length})` : '';
    const q = ($('sCatSearch').value || '').toLocaleLowerCase('tr-TR').trim();
    let list = keys.map(k => ({ bc: k, ...cat[k] }));
    if (q) list = list.filter(x => (x.bc + ' ' + (x.name || '')).toLocaleLowerCase('tr-TR').includes(q));
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
    $('sCatList').innerHTML = list.length
      ? list
          .map(x => {
            const meta = [
              x.bc,
              grp(x.group).name,
              x.shelf,
              x.price != null ? TL(x.price) : '',
              x.warn != null && x.warn !== '' ? `${x.warn} gün kala uyar` : 'varsayılan uyarı'
            ]
              .filter(Boolean)
              .map(esc)
              .join(', ');
            const ed =
              editing === x.bc
                ? `<div class="ci-edit"><input data-f="name" value="${esc(x.name || '')}" placeholder="Ürün adı" aria-label="Ürün adı"><input data-f="shelf" value="${esc(x.shelf || '')}" placeholder="Reyon" aria-label="Reyon"><input data-f="warn" type="number" min="0" max="365" inputmode="numeric" value="${x.warn != null ? x.warn : ''}" placeholder="Gün" aria-label="Kaç gün kala uyarsın"><input data-f="price" inputmode="decimal" value="${x.price != null ? String(x.price).replace('.', ',') : ''}" placeholder="Satış fiyatı ₺" aria-label="Satış fiyatı" style="grid-column:1/-1"><select data-f="group" aria-label="Ürün grubu">${groups()
                    .map(
                      g =>
                        `<option value="${esc(g.id)}"${grp(x.group).id === g.id ? ' selected' : ''}>${esc(g.name)}</option>`
                    )
                    .join(
                      ''
                    )}</select><button type="button" class="btn primary" data-cact="save" data-bc="${esc(x.bc)}">Kaydet</button></div>`
                : '';
            return `<li class="ci"><div><b>${esc(x.name || '(adsız)')}</b><small>${meta}</small></div><div class="acts"><button type="button" data-cact="use" data-bc="${esc(x.bc)}">Ekle</button><button type="button" data-cact="edit" data-bc="${esc(x.bc)}">${editing === x.bc ? 'Vazgeç' : 'Düzenle'}</button><button type="button" data-cact="del" data-bc="${esc(x.bc)}" aria-label="${esc(x.name || x.bc)} kaydını sil">Sil</button></div>${ed}</li>`;
          })
          .join('')
      : `<li class="sempty">${keys.length ? 'Aramaya uyan ürün yok.' : 'Henüz kayıtlı ürün yok. Barkodlu ürün ekledikçe burada birikir.'}</li>`;
  }
  $('sCatSearch').addEventListener('input', renderCat);
  $('sCatList').addEventListener('click', async e => {
    const b = e.target.closest('[data-cact]');
    if (!b) return;
    const bc = b.dataset.bc,
      c = S().catalog[bc];
    if (!c) return;
    const a = b.dataset.cact;
    if (a === 'edit') {
      editing = editing === bc ? null : bc;
      renderCat();
      return;
    }
    if (a === 'del') {
      if (!(await askConfirm(`${c.name || bc} kaydı silinsin mi? (Listedeki ürünler silinmez.)`))) return;
      delete S().catalog[bc];
      save();
      renderCat();
      return;
    }
    if (a === 'save') {
      const row = b.closest('.ci');
      const g = f => row.querySelector(`[data-f="${f}"]`).value.trim();
      c.name = g('name');
      c.shelf = g('shelf');
      c.group = g('group') || 'genel';
      c.price = parsePrice(g('price'));
      S()
        .items.filter(i => i.barcode === bc && !i.done)
        .forEach(i => (i.group = c.group));
      const w = g('warn');
      c.warn = w === '' ? null : Math.max(0, parseInt(w, 10) || 0);
      editing = null;
      save();
      renderCat();
      render();
      V.toast('Ürün bilgisi güncellendi.');
      return;
    }
    if (a === 'use') {
      $('sktAddBox').open = true;
      $('sBar').value = bc;
      fillFromCatalog(true);
      $('sDate').value = '';
      $('sktAddBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => $('sDate').focus(), 300);
    }
  });

  /* --- kamera ile barkod --- */
  function camMsg(t) {
    $('sCamMsg').textContent = t;
  }
  function stopScan() {
    scanning = false;
    if (zx) {
      try {
        zx.reset();
      } catch (e) {}
      zx = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    const v = $('sVideo');
    v.srcObject = null;
    $('sCam').hidden = true;
  }
  function found(code) {
    stopScan();
    $('sBar').value = code;
    if (navigator.vibrate) navigator.vibrate(80);
    const known = S().catalog[code];
    if (known) fillFromCatalog(true);
    else {
      $('sName').value = '';
      $('sWarn').value = '';
      $('sShelf').value = '';
      $('sGroup').value = 'genel';
      showKnown(null);
      lookupOnline(code);
    }
    V.toast(known ? `${known.name}: tarihi seç.` : `Yeni barkod: ${code}. Ürün adını bir kez yaz, sonra hatırlanır.`);
    (known ? $('sDate') : $('sName')).focus();
  }
  // Görüntüyü griye çevirip gömülü okuyucuya verir
  function grayOf(ctx, w, h) {
    const d = ctx.getImageData(0, 0, w, h).data,
      g = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
    return g;
  }
  async function decodeCanvas(cv, tryRotations) {
    if ('BarcodeDetector' in window) {
      try {
        const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        const r = await det.detect(cv);
        if (r && r.length) return r[0].rawValue;
      } catch (e) {}
    }
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    let res = EAN.decodeGray(grayOf(ctx, cv.width, cv.height), cv.width, cv.height);
    if (res) return res.code;
    if (!tryRotations) return null;
    for (const ang of [15, -15, 30, -30]) {
      const w = cv.width,
        h = cv.height,
        c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      const x = c2.getContext('2d', { willReadFrequently: true });
      x.fillStyle = '#fff';
      x.fillRect(0, 0, w, h);
      x.translate(w / 2, h / 2);
      x.rotate((ang * Math.PI) / 180);
      x.drawImage(cv, -w / 2, -h / 2);
      res = EAN.decodeGray(grayOf(x, w, h), w, h);
      if (res) return res.code;
    }
    return null;
  }
  async function decodePhoto(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, no) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = no;
        i.src = url;
      });
      const maxSide = 1600,
        sc = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * sc);
      cv.height = Math.round(img.naturalHeight * sc);
      cv.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, cv.width, cv.height);
      let code = await decodeCanvas(cv, true);
      if (!code && sc < 1) {
        // küçük barkod: ortayı tam çözünürlükte dene
        const cw = Math.min(img.naturalWidth, 2000),
          ch = Math.min(img.naturalHeight, 2000),
          c2 = document.createElement('canvas');
        c2.width = cw;
        c2.height = ch;
        c2.getContext('2d', { willReadFrequently: true }).drawImage(
          img,
          (img.naturalWidth - cw) / 2,
          (img.naturalHeight - ch) / 2,
          cw,
          ch,
          0,
          0,
          cw,
          ch
        );
        code = await decodeCanvas(c2, false);
      }
      return code;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  $('sPhotoBtn').addEventListener('click', () => {
    stopScan();
    $('sPhoto').value = '';
    $('sPhoto').click();
  });
  $('sPhoto').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    V.toast('Barkod okunuyor…');
    try {
      const code = await decodePhoto(f);
      if (code) found(code);
      else V.toast('Barkod okunamadı. Barkodu yakından, düz ve net çekip tekrar dene ya da numarayı elle yaz.');
    } catch (err) {
      V.toast('Fotoğraf açılamadı. Tekrar dene ya da numarayı elle yaz.');
    }
  });
  async function startScan() {
    if (scanning) {
      stopScan();
      return;
    }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      V.toast('Bu uygulamada canlı kamera açılmıyor. “Fotoğrafla okut”u kullan.');
      return;
    }
    $('sCam').hidden = false;
    camMsg('Kamera açılıyor…');
    scanning = true;
    const v = $('sVideo');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
    } catch (e) {
      scanning = false;
      $('sCam').hidden = true;
      V.toast('Kamera izni verilmedi ya da kamera açılamadı. “Fotoğrafla okut”u kullan.');
      return;
    }
    if (!scanning) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
      return;
    }
    v.srcObject = stream;
    try {
      await v.play();
    } catch (e) {}
    camMsg('Barkodu kırmızı çizgiye hizala, telefonu sabit tut.');
    let det = null;
    if ('BarcodeDetector' in window) {
      try {
        det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      } catch (e) {
        det = null;
      }
    }
    const cv = document.createElement('canvas'),
      ctx = cv.getContext('2d', { willReadFrequently: true });
    let last = '',
      same = 0;
    const tick = async () => {
      if (!scanning) return;
      try {
        if (v.videoWidth) {
          let code = null;
          if (det) {
            const r = await det.detect(v);
            if (r && r.length) code = r[0].rawValue;
          }
          if (!code) {
            // görüntünün orta bandını oku
            const w = Math.min(960, v.videoWidth),
              h = Math.round((w * v.videoHeight) / v.videoWidth);
            cv.width = w;
            cv.height = h;
            ctx.drawImage(v, 0, 0, w, h);
            const bh = Math.round(h * 0.5),
              y0 = Math.round((h - bh) / 2);
            const g = grayOf(ctx, w, h).subarray(y0 * w, (y0 + bh) * w);
            const r = EAN.decodeGray(g, w, bh, { lines: 24, minVotes: 2 });
            if (r) {
              code = r.code;
            }
          }
          if (code) {
            if (code === last) same++;
            else {
              last = code;
              same = 1;
            }
            if (det || same >= 2) {
              found(code);
              return;
            }
          }
        }
      } catch (e) {}
      setTimeout(tick, 150);
    };
    tick();
  }

  /* --- sekmeler --- */
  function setTab(t) {
    const st = V.state();
    st.tab = t;
    save();
    document.body.classList.toggle('tab-s', t !== 'v' && t !== 'g');
    document.body.classList.toggle('tab-v', t === 'v');
    document.body.classList.toggle('tab-g', t === 'g');
    $('tabG').setAttribute('aria-selected', t === 'g');
    $('tabV').setAttribute('aria-selected', t === 'v');
    $('tabS').setAttribute('aria-selected', t === 's');
    $('tabA').setAttribute('aria-selected', t === 'a');
    $('homeView').hidden = t !== 'h';
    $('tabH').setAttribute('aria-selected', t === 'h');
    if ($('tabM')) $('tabM').setAttribute('aria-selected', ['b', 'a', 'k', 'g'].includes(t));
    $('sktView').hidden = t !== 's';
    $('bsView').hidden = t !== 'b';
    $('icView').hidden = t !== 'c';
    $('tabC').setAttribute('aria-selected', t === 'c');
    $('tabB').setAttribute('aria-selected', t === 'b');
    $('abView').hidden = t !== 'a';
    $('akView').hidden = t !== 'k';
    $('tabK').setAttribute('aria-selected', t === 'k');
    const h = document.getElementById('title');
    if (t !== 's') stopScan();
    if (t === 's') {
      h.firstChild.textContent = 'SKT kontrol';
      if (typeof renderBatches === 'function') renderBatches();
      $('subtitle').textContent = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      render();
    } else if (t === 'k') {
      h.firstChild.textContent = 'Aktüel ürünler';
      $('subtitle').textContent = 'Salı, Cuma ve Pazar gelen ürünler';
      if (window.__renderAk) window.__renderAk();
    } else if (t === 'a') {
      h.firstChild.textContent = 'Ay başı işlemleri';
      $('subtitle').textContent = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      if (window.__renderAb) window.__renderAb();
    } else if (t === 'h') {
      h.firstChild.textContent = 'Portal';
      $('subtitle').textContent = new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        weekday: 'long'
      });
      if (window.__renderHome) window.__renderHome();
    } else if (t === 'c' && document.body.classList.contains('giris-depo')) {
      const ikG = ((window.__giris && window.__giris()) || {}).unvan === 'İnsan kaynakları';
      h.firstChild.textContent = ikG ? 'İnsan kaynakları' : 'Sevkiyat';
      $('subtitle').textContent = ikG
        ? 'Kayıt onayı, yükselme sınavı, yeni mağaza'
        : 'Mağazalara gidecek araçlar: plaka, saat, şoför';
    } else if (t === 'c' && document.body.classList.contains('giris-pm')) {
      const un = ((window.__giris && window.__giris()) || {}).unvan;
      h.firstChild.textContent = 'İletişim';
      $('subtitle').textContent =
        un === 'GM'
          ? 'Bölge müdürleriyle sohbet'
          : un === 'BM'
            ? "PM'lerle ve genel müdürlükle sohbet"
            : "BS'lerle ve bölge müdürüyle sohbet";
    } else if (t === 'c') {
      const stf = document.body.dataset.role === 'staff' && !document.body.classList.contains('yk-c');
      h.firstChild.textContent = stf ? 'Mağaza grubu' : 'İletişim';
      $('subtitle').textContent = stf
        ? 'Mağaza çalışanlarıyla sohbet'
        : 'Mağaza ⇄ bölge sorumlusu: talep, yanıt, sohbet';
      if (window.__renderIc) window.__renderIc();
    } else if (t === 'b') {
      h.firstChild.textContent = 'BS raporu';
      $('subtitle').textContent = "BS'nin istediği günlük dönüşler, kontrol ve bilgi toplama";
      if (window.__renderBs) window.__renderBs();
    } else if (t === 'g') {
      h.firstChild.textContent = 'Ayarlar';
      $('subtitle').textContent =
        document.body.dataset.role === 'admin' ? 'Çalışanlar, saatler, kurallar ve kullanıcılar' : 'Hesap ve görünüm';
    } else V.renderSheet();
  }
  window.__setTab = setTab;

  /* --- Diğer menüsü --- */
  (function () {
    const M = [
      ['b', 'tabB', 'BS raporu', 'Sabah SKT dönüşü, akşam raporu'],
      ['a', 'tabA', 'Ay başı', 'Ciro hedefi, saat ve grafikler'],
      ['k', 'tabK', 'Aktüel', 'Salı, Cuma ve Pazar ürünleri'],
      ['g', 'tabG', 'Ayarlar', 'Hesap, görünüm, çalışanlar']
    ];
    const vis = id => {
      const b = $(id);
      return b && getComputedStyle(b).display !== 'none';
    };
    function draw() {
      const cur = V.state().tab || '';
      $('moreList').innerHTML =
        M.filter(([, id]) => vis(id))
          .map(([k, id, l, d]) => {
            const b = $(id),
              ic = b.querySelector('.ti').outerHTML,
              bd = b.querySelector('.badge:not([hidden])');
            return `<button type="button" class="ms-item" data-more="${k}" aria-current="${cur === k}">${ic}<span><b>${l}</b><small>${d}</small></span>${bd && bd.textContent.trim() ? `<i class="badge">${esc(bd.textContent.trim())}</i>` : '<em aria-hidden="true">›</em>'}</button>`;
          })
          .join('') +
        (() => {
          const g = window.__giris && window.__giris();
          if (g && g.tip !== 'magaza') return '';
          const it = (k, l, d, ic) =>
            `<button type="button" class="ms-item" data-pf="${k}"><svg class="ti" viewBox="0 0 24 24" aria-hidden="true">${ic}</svg><span><b>${l}</b><small>${d}</small></span><em aria-hidden="true">›</em></button>`;
          return (
            it(
              'mv',
              'Mevcut listesi',
              'Aylık saat ve dinlenme, imza',
              '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16M3 14h18"/>'
            ) +
            it(
              'sip',
              'Sipariş günleri',
              'Sipariş ve gelen grupları',
              '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M8 14h3M8 17h6"/>'
            )
          );
        })();
    }
    function open() {
      draw();
      $('moreSheet').hidden = false;
      const f = $('moreList').querySelector('button');
      if (f) f.focus();
    }
    function close() {
      $('moreSheet').hidden = true;
    }
    $('tabM').addEventListener('click', open);
    $('moreSheet').addEventListener('click', e => {
      if (e.target.closest('[data-pf]')) {
        close();
        return;
      }
      const b = e.target.closest('[data-more]');
      if (b) {
        close();
        setTab(b.dataset.more);
        window.scrollTo({ top: 0 });
        return;
      }
      if (e.target === $('moreSheet')) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('moreSheet').hidden) close();
    });
    function sync() {
      const n = ['abBadge']
        .map(id => $(id))
        .filter(b => b && !b.hidden)
        .reduce((a, b) => a + (parseInt(b.textContent, 10) || 0), 0);
      const m = $('mBadge');
      m.hidden = !n;
      m.textContent = n;
    }
    const ab = $('abBadge');
    if (ab)
      new MutationObserver(sync).observe(ab, { attributes: true, childList: true, characterData: true, subtree: true });
    sync();
  })();

  $('tabV').addEventListener('click', () => setTab('v'));
  $('tabH').addEventListener('click', () => setTab('h'));
  $('tabS').addEventListener('click', () => setTab('s'));
  $('tabA').addEventListener('click', () => setTab('a'));
  $('tabK').addEventListener('click', () => setTab('k'));
  $('tabG').addEventListener('click', () => setTab('g'));
  $('tabB').addEventListener('click', () => setTab('b'));
  $('tabC').addEventListener('click', () => setTab('c'));
  $('moreMenu').addEventListener('click', e => {
    if (e.target.closest('.more-list button')) $('moreMenu').open = false;
  });
  document.addEventListener('click', e => {
    const m = $('moreMenu');
    if (m.open && !m.contains(e.target)) m.open = false;
  });
  $('sAdd').addEventListener('click', add);
  $('sDate').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  });
  $('sScan').addEventListener('click', startScan);
  $('sGoScan').addEventListener('click', () => {
    $('sktAddBox').open = true;
    $('sktAddBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && 'BarcodeDetector' in window) startScan();
    else $('sPhotoBtn').click();
  });
  $('sGoAdd').addEventListener('click', () => {
    $('sktAddBox').open = true;
    $('sktAddBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $('sBar').focus(), 250);
  });
  $('sCamClose').addEventListener('click', stopScan);
  function sellVis() {
    const bc = $('sBar').value.trim(),
      on = !!bc && S().items.some(i => !i.done && i.barcode === bc);
    $('sSell').hidden = !on;
    $('sAddHint').textContent = on
      ? 'Bu ürün listede var. Yeni tarihli parti ise Listeye ekle, satıldıysa Satıldı (en yakın tarihliden düşer).'
      : 'Barkod bir kez girilince ürün bilgileri hatırlanır.';
    $('sWarn').placeholder = 'Varsayılan ' + (Number(S().defWarn) || 0);
  }
  {
    const _sk = showKnown;
    showKnown = function (c, bc) {
      _sk(c, bc);
      sellVis();
    };
  }
  sellVis();
  $('sBar').addEventListener('input', sellVis);
  $('sBar').addEventListener('change', () => {
    if (!fillFromCatalog(true)) lookupOnline($('sBar').value.trim());
  });
  $('sBar').addEventListener('input', () => {
    const bc = $('sBar').value.trim();
    if (S().catalog[bc]) {
      fillFromCatalog(true);
    } else showKnown(null);
  });
  $('sBar').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fillFromCatalog(true);
      ($('sName').value ? $('sDate') : $('sName')).focus();
    }
  });
  $('sSearch').addEventListener('input', render);
  const sfClick = e => {
    const b = e.target.closest('[data-sf]');
    if (!b) return;
    filter = b.dataset.sf;
    document
      .querySelectorAll('.sfilter [data-sf]')
      .forEach(x => x.setAttribute('aria-pressed', x.dataset.sf === filter));
    render();
    if (b.closest('#sktSum')) $('sList').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  document.querySelector('.sfilter').addEventListener('click', sfClick);
  $('sktSum').addEventListener('click', sfClick);
  $('sList').addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const it = S().items.find(i => i.id === b.dataset.id);
    if (!it) return;
    const a = b.dataset.act;
    if (a === 'done') {
      openRemove(it);
      return;
    }
    if (a === 'sold') {
      openRemove(it, 'sold');
      return;
    }
    if (a === 'disc') {
      it.disc = !it.disc;
      logla(it.disc ? 'indirim' : 'indirimkalk', it.name || it.barcode, it.qty);
    }
    if (a === 'del') {
      if (!(await askConfirm(`${it.name || 'Bu ürün'} listeden silinsin mi?`))) return;
      S().items = S().items.filter(i => i !== it);
      logla('sil', it.name || it.barcode, it.qty);
    }
    save();
    render();
  });
  /* --- fire sebepleri --- */
  if (!Array.isArray(S().reasons) || !S().reasons.length)
    S().reasons = [
      'SKT geldi',
      'Bozuk / hasarlı',
      'Ezik / kırık',
      'Küflü / bozulmuş',
      'Ambalajı açılmış',
      'Soğuk zincir bozuldu',
      'Müşteri iadesi',
      'Diğer'
    ];
  const reasons = () => S().reasons;
  function fillReasons() {
    const keep = $('fReason').value;
    $('fReason').innerHTML = reasons()
      .map(r => `<option>${esc(r)}</option>`)
      .join('');
    if (reasons().includes(keep)) $('fReason').value = keep;
  }
  function renderReasons() {
    $('fRsnList').innerHTML = reasons()
      .map((r, i) => {
        const n = S().fire.filter(x => x.reason === r).length;
        return `<li class="gi" style="grid-template-columns:minmax(0,1fr) auto"><span style="font-weight:600">${esc(r)}${n ? ` <small style="display:inline;color:var(--muted);font-weight:500">(${n} kayıt)</small>` : ''}</span><button type="button" class="del" data-rdel="${i}" aria-label="${esc(r)} sebebini sil">×</button></li>`;
      })
      .join('');
    fillReasons();
  }
  $('fRsnAdd').addEventListener('click', () => {
    const v = $('fRsnName').value.trim();
    if (!v) {
      V.toast('Sebebi yaz.');
      $('fRsnName').focus();
      return;
    }
    if (reasons().some(r => r.toLocaleLowerCase('tr-TR') === v.toLocaleLowerCase('tr-TR'))) {
      V.toast('Bu sebep zaten var.');
      return;
    }
    reasons().push(v);
    $('fRsnName').value = '';
    save();
    renderReasons();
    V.toast(`“${v}” sebebi eklendi.`);
  });
  $('fRsnName').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('fRsnAdd').click();
    }
  });
  $('fRsnList').addEventListener('click', async e => {
    const b = e.target.closest('[data-rdel]');
    if (!b) return;
    if (reasons().length <= 1) {
      V.toast('En az bir sebep kalmalı.');
      return;
    }
    const r = reasons()[Number(b.dataset.rdel)];
    if (!(await askConfirm(`“${r}” sebebi listeden çıkarılsın mı? Eski fire kayıtları değişmez.`))) return;
    S().reasons = reasons().filter((x, i) => i !== Number(b.dataset.rdel));
    save();
    renderReasons();
  });

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

  /* --- sabah SKT turu: bugün bakılacak ürünler reyon reyon, bitince BS'ye bildirilir --- */
  let seri = null;
  const TUR_DL = 9 * 60 + 15;
  const hm = iso => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const bsWants = () => {
    try {
      return !window.__ist || window.__ist().skt !== false;
    } catch (e) {
      return true;
    }
  };
  function turRead() {
    return (S().tur && S().tur[todayStr()]) || { c: {} };
  }
  function turDay() {
    const t = todayStr();
    if (!S().tur || typeof S().tur !== 'object') S().tur = {};
    if (!S().tur[t]) S().tur[t] = { c: {} };
    return S().tur[t];
  }
  function turMark(id, s) {
    turDay().c[id] = { s, at: new Date().toISOString(), by: who() };
  }
  // 14 günden eski tur kayıtları silinir
  (() => {
    if (!S().tur) return;
    const lim = shiftDate(todayStr(), 14);
    Object.keys(S().tur).forEach(k => {
      if (k < lim) delete S().tur[k];
    });
  })();
  function turItems() {
    const c = turRead().c;
    return S().items.filter(i => (!i.done && status(i) !== 'ok') || c[i.id]);
  }
  const shelfOf = it => it.shelf || (grp(it.group).id !== 'genel' ? grp(it.group).name : '') || 'Reyonu belirtilmemiş';
  function turSum() {
    const c = turRead().c,
      l = turItems(),
      f = s => l.filter(i => c[i.id] && c[i.id].s === s);
    return {
      n: l.length,
      kal: f('rm').length,
      sat: f('sold').length,
      ok: f('ok').length,
      rmNames: f('rm').map(i => i.name || i.barcode)
    };
  }
  function renderTur() {
    const box = $('turBox');
    if (!box) return;
    const d = turRead(),
      c = d.c,
      list = turItems(),
      n = list.length,
      k = list.filter(i => c[i.id]).length,
      bs = bsWants();
    const now = new Date(),
      mins = now.getHours() * 60 + now.getMinutes();
    box.classList.remove('done', 'late', 'wait');
    let badge, info;
    if (d.done) {
      box.classList.add('done');
      badge = 'Bitti';
      info = `Bugün ${hm(d.done.at)} bitirildi${d.done.by ? ` (${d.done.by})` : ''}.${bs ? " BS'ye bildirildi." : ''}`;
    } else if (mins <= TUR_DL) {
      box.classList.add('wait');
      const r = TUR_DL - mins;
      badge = bs ? (r >= 60 ? `${Math.floor(r / 60)} sa ${r % 60} dk` : `${r} dk kaldı`) : `${k}/${n}`;
      info = bs
        ? "Bugün bakılacak ürünleri kontrol et, 09.15'e kadar bitir. Bitince BS'ye kendiliğinden bildirilir."
        : 'Bugün bakılacak ürünleri reyon reyon kontrol et.';
    } else {
      box.classList.add(bs ? 'late' : 'wait');
      badge = bs ? 'Gecikti' : `${k}/${n}`;
      info = bs ? '09.15 geçti, tur henüz bitmedi.' : 'Bugün bakılacak ürünleri reyon reyon kontrol et.';
    }
    $('turBadge').textContent = badge;
    $('turInfo').textContent = info;
    const fin = bs ? "Turu bitir, BS'ye bildir" : 'Turu bitir';
    let h = '';
    if (d.done) {
      const s = d.done;
      h += `<div class="tur-ok" style="margin-top:12px">✓ ${s.n ? `${s.n} ürüne bakıldı: ${s.kal} kaldırıldı, ${s.sat} satılmış, ${s.ok} rafta.` : 'Bugün bakılacak ürün yoktu, kontrol yapıldı.'}</div>
      <div class="simp-act" style="margin-top:8px"><button type="button" class="btn small" data-tu="share">WhatsApp grubuna paylaş</button><button type="button" class="btn small" data-tu="reopen">Turu yeniden aç</button></div>`;
    }
    const open = list.filter(i => !c[i.id]);
    if (!d.done || open.length) {
      if (!n) {
        h += `<p class="hint" style="margin:10px 0 0">Bugün raftan kalkacak ya da yaklaşan ürün yok.</p><div class="tur-end"><button type="button" class="btn primary" data-tu="end">Kontrol yapıldı, ${bs ? "BS'ye bildir" : 'kaydet'}</button></div>`;
      } else {
        if (d.done)
          h += `<p class="hint" style="margin:10px 0 0">Tur bittikten sonra ${open.length} ürün daha listeye düştü.</p>`;
        h += `<div class="tur-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${k}"><i style="width:${Math.round((k / n) * 100)}%"></i></div><div class="tur-p"><span>${k} / ${n} ürün kontrol edildi</span><span>${n - k ? `${n - k} kaldı` : 'Hepsi bitti'}</span></div>`;
        const by = new Map();
        list
          .slice()
          .sort((a, b) => remDate(a).localeCompare(remDate(b)))
          .forEach(i => {
            const s = shelfOf(i);
            if (!by.has(s)) by.set(s, []);
            by.get(s).push(i);
          });
        const keys = [...by.keys()].sort(
          (a, b) => (a === 'Reyonu belirtilmemiş') - (b === 'Reyonu belirtilmemiş') || a.localeCompare(b, 'tr')
        );
        const row = it => {
          const m = c[it.id],
            st = status(it);
          const meta = [it.barcode, it.qty > 1 ? it.qty + ' adet' : '', it.disc ? 'İndirimde' : '']
            .filter(Boolean)
            .map(esc)
            .join(', ');
          if (m)
            return `<li class="si chk"><div class="si-main"><b>${esc(it.name || 'Adsız ürün')}</b><small>${meta || '&nbsp;'}</small></div><div class="si-date"><b>✓</b><small>${m.s === 'rm' ? 'Kaldırıldı' : m.s === 'sold' ? 'Satılmış' : 'Rafta, kontrol edildi'}</small></div>${m.s === 'ok' ? `<div class="si-act"><small style="color:var(--muted);align-self:center">${m.by ? esc(m.by) + ', ' : ''}${hm(m.at)}</small><button type="button" data-tu="undo" data-id="${it.id}">Geri al</button></div>` : ''}</li>`;
          return `<li class="si ${st}"><div class="si-main"><b>${esc(it.name || 'Adsız ürün')}</b><small>${meta || '&nbsp;'}</small></div><div class="si-date"><b>${dateLabel(it)}</b><small>${itemLeft(it)}</small></div><div class="si-act">${
            st === 'exp'
              ? `<button type="button" class="go" data-tu="rm" data-id="${it.id}">Raftan kaldırıldı</button><button type="button" class="sold" data-tu="sold" data-id="${it.id}">Rafta yok, satılmış</button>`
              : `<button type="button" class="go" data-tu="ok" data-id="${it.id}">Baktım, rafta</button><button type="button" data-tu="rm" data-id="${it.id}">Raftan kaldırıldı</button>${it.disc ? '' : `<button type="button" data-tu="disc" data-id="${it.id}">İndirime alındı</button>`}`
          }</div></li>`;
        };
        h += `<ul class="slist" id="turList">${keys
          .map(s => {
            const L = by.get(s),
              kk = L.filter(i => c[i.id]).length;
            return (
              `<li class="shead" style="color:var(--ink)">${esc(s)} <span style="color:var(--muted)">(${kk}/${L.length})</span></li>` +
              L.map(row).join('')
            );
          })
          .join('')}</ul>`;
        h += `<div class="tur-end"><button type="button" class="btn primary" data-tu="end"${k < n ? ' disabled' : ''}>${k < n ? `Bitirmek için ${n - k} ürüne daha bak` : fin}</button></div>`;
      }
    }
    $('turBody').innerHTML = h;
  }
  function turText() {
    const d = turRead(),
      s = d.done || turSum(),
      ab = V.state().ab || {},
      g = (window.__giris && window.__giris()) || {},
      st = ab.msLast || ab.store || g.magaza || '',
      now = new Date();
    const L = [
      `${st ? st + ' - ' : ''}${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      'Sabah SKT kontrolü yapıldı ✅'
    ];
    if (s.n) {
      L.push(`${s.n} ürüne bakıldı: ${s.kal} kaldırıldı, ${s.sat} satılmış, ${s.ok} rafta.`);
      if (s.rmNames && s.rmNames.length) L.push('Kaldırılanlar: ' + s.rmNames.join(', '));
    }
    return L.join('\n');
  }
  function turFinish() {
    const t = todayStr(),
      d = turDay(),
      s = turSum(),
      at = new Date().toISOString(),
      bs = bsWants();
    d.done = { at, by: who(), ...s };
    if (bs) {
      const st = V.state();
      st.ab = st.ab || {};
      const ab = st.ab;
      ab.mskt = ab.mskt || {};
      const g = (window.__giris && window.__giris()) || {};
      ab.mskt[t] = {
        store: ab.msLast || ab.store || g.magaza || '',
        at,
        by: who(),
        tur: { n: s.n, kal: s.kal, sat: s.sat, ok: s.ok }
      };
    }
    logla('turbitir', '', s.n);
    save();
    renderTur();
    renderLog();
    V.toast(bs ? "Tur bitti, BS'ye bildirildi. İstersen WhatsApp grubuna da paylaş." : 'Tur bitti, kaydedildi.');
  }
  $('turBox').addEventListener('click', async e => {
    const b = e.target.closest('[data-tu]');
    if (!b || b.disabled) return;
    const a = b.dataset.tu;
    if (a === 'end') {
      turFinish();
      return;
    }
    if (a === 'share') {
      shareText(turText(), 'Sabah SKT kontrolü', 'Mesaj kopyalandı; WhatsApp grubuna yapıştır.');
      return;
    }
    if (a === 'reopen') {
      if (!(await askConfirm("Tur yeniden açılsın mı? BS'ye giden bildirim yerinde kalır."))) return;
      delete turDay().done;
      save();
      renderTur();
      return;
    }
    const it = S().items.find(i => i.id === b.dataset.id);
    if (!it) return;
    if (a === 'rm') {
      openRemove(it);
      return;
    }
    if (a === 'sold') {
      openRemove(it, 'sold');
      return;
    }
    if (a === 'ok') {
      turMark(it.id, 'ok');
      logla('kontrol', it.name || it.barcode, it.qty);
    }
    if (a === 'disc') {
      it.disc = true;
      turMark(it.id, 'ok');
      logla('indirim', it.name || it.barcode, it.qty);
    }
    if (a === 'undo') {
      delete turDay().c[it.id];
    }
    save();
    render();
    renderLog();
  });
  setInterval(() => {
    if (!$('sktView').hidden) renderTur();
  }, 30000);

  /* --- sevkiyat girişi: art arda okut, tarih seç, kaydet --- */
  function seriBan() {
    const on = !!seri;
    $('sSeri').hidden = !on;
    $('sAdd').textContent = on ? 'Kaydet, sıradaki' : 'Listeye ekle';
    if (on)
      $('sSeriT').textContent = seri.n
        ? `Sevkiyat girişi: ${seri.n} ürün eklendi`
        : 'Sevkiyat girişi: okut, tarihi seç, kaydet.';
  }
  $('sGoSeri').addEventListener('click', () => {
    const cam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && 'BarcodeDetector' in window);
    if (!seri) seri = { n: 0, cam };
    seriBan();
    $('sktAddBox').open = true;
    $('sktAddBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (cam) {
      if (!scanning) startScan();
    } else setTimeout(() => $('sBar').focus(), 250);
    V.toast('Sevkiyat girişi: her üründe barkodu okut, tarihi seç, “Kaydet, sıradaki”ye bas. Bitince “Bitir”.');
  });
  $('sSeriEnd').addEventListener('click', () => {
    stopScan();
    const n = seri ? seri.n : 0;
    if (n) logla('seri', '', n);
    seri = null;
    seriBan();
    save();
    renderLog();
    V.toast(n ? `Sevkiyat girişi bitti: ${n} ürün eklendi.` : 'Sevkiyat girişi kapatıldı.');
  });

  /* --- kim ne yaptı (müdür ve yardımcısı görür) --- */
  const LG = {
    ekle: 'ekledi',
    kaldir: 'raftan kaldırdı',
    sat: 'satıldı diye düştü',
    indirim: 'indirime aldı',
    indirimkalk: 'indirimden çıkardı',
    kontrol: 'baktı, rafta',
    turbitir: 'sabah turunu bitirdi',
    seri: 'sevkiyat girişi yaptı',
    sil: 'listeden sildi',
    geri: 'fireyi geri aldı',
    satgeri: 'satışı geri aldı',
    firedondu: 'fire listesini döndü yaptı',
    firedonmedi: 'fire dönüşünü geri aldı'
  };
  function renderLog() {
    if (!$('logList')) return;
    const lim = Date.now() - 7 * 864e5,
      L = (S().log || [])
        .filter(x => new Date(x.at).getTime() >= lim)
        .slice()
        .reverse();
    const cnt = new Map();
    L.forEach(x => {
      const k = x.by || 'Adı yok';
      cnt.set(k, (cnt.get(k) || 0) + 1);
    });
    $('logWho').innerHTML = [...cnt.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `<span>${esc(k)}: ${n} işlem</span>`)
      .join('');
    if (!L.length) {
      $('logList').innerHTML =
        '<p class="hint">Son 7 günde kayıt yok. Ürün eklendikçe, kaldırıldıkça burada kimin yaptığı görünür.</p>';
      return;
    }
    const t = todayStr(),
      y = shiftDate(t, 1),
      days = new Map();
    L.forEach(x => {
      const k = ymdL(new Date(x.at));
      if (!days.has(k)) days.set(k, []);
      days.get(k).push(x);
    });
    $('logList').innerHTML = [...days.entries()]
      .map(
        ([k, xs]) =>
          `<div class="lg-day">${k === t ? 'Bugün' : k === y ? 'Dün' : dLabel(k)}</div><ul class="lg">${xs
            .map(x => {
              const v = LG[x.t] || x.t,
                cnt = x.t === 'turbitir' || x.t === 'seri';
              return `<li><time>${hm(x.at)}</time><span><b>${esc(x.by || 'Adı yok')}</b>: ${cnt ? `${v}${x.q ? ` (${x.q} ürün)` : ''}` : `${esc(x.ad || 'Ürün')}${x.q ? ` (${x.q} adet)` : ''} ${v}`}</span></li>`;
            })
            .join('')}</ul>`
      )
      .join('');
  }

  fillGroups();
  renderGroups();
  renderBadge();
  renderCat();
  renderRemind();
  renderFire();
  renderReasons();
  renderFireDays();
  renderBatches();
  renderTur();
  renderLog();
  syncNative();
  setTab(['s', 'a', 'k', 'g', 'b', 'c'].includes(V.state().tab) ? V.state().tab : 'v');
  if (dueNow()) setTimeout(checkReminder, 500);
  else {
    const c = counts();
    if (c.exp + c.soon > 0 && V.state().tab !== 's')
      setTimeout(() => V.toast(`SKT: ${c.exp + c.soon} ürün kontrol bekliyor.`), 600);
  }
})();
