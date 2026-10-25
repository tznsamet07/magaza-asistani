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

