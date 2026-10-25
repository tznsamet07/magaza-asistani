  /* Açılan sayfa okundu sayılır: bildirimi bu sayfayı gösteren her şey (mesaj, sohbet, talep, form, vardiya değişikliği) zilden düşer */
  function autoRead() {
    if ($('icView').hidden || !giris()) return;
    const L = notifs().filter(x => x.go && x.go.page === ui.page && (!x.go.id || x.go.id === ui.id));
    if (L.length) dismiss(L);
  }
  // Bildirim: gerçek sistemde telefona anlık bildirim (push) gider; demoda bu cihazda bildirim gösterilir
  function notify(r) {
    const title = `BS'den yeni ${TYPES[r.type].toLocaleLowerCase('tr-TR')}`,
      body = r.title;
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker && navigator.serviceWorker.getRegistration
          ? navigator.serviceWorker
              .getRegistration()
              .then(g =>
                g && g.showNotification
                  ? g.showNotification(title, { body, tag: 'ic-' + r.id })
                  : new Notification(title, { body })
              )
              .catch(() => new Notification(title, { body }))
          : new Notification(title, { body });
      }
    } catch (e) {}
    const n = $('icNote');
    if (n) {
      n.innerHTML = `<b>🔔 ${esc(title)}</b><span>${esc(body)}</span>`;
      n.dataset.req = r.id;
      n.hidden = false;
      clearTimeout(n._t);
      n._t = setTimeout(() => {
        n.hidden = true;
      }, 7000);
    }
  }
  function newForm() {
    return {
      type: 'duyuru',
      title: '',
      body: '',
      itemsTxt: '',
      cols: 'Ürün kodu, Ürün adı, Adet, Not',
      to: D.stores.map(s => s.id),
      files: []
    };
  }
  function readForm() {
    const f = ui.form;
    if (!f) return;
    const g = id => $(id) && $(id).value;
    if ($('icT')) f.title = g('icT');
    if ($('icB')) f.body = g('icB');
    if ($('icItems')) f.itemsTxt = g('icItems');
    if ($('icCols')) f.cols = g('icCols');
    if ($('icFoto')) f.foto = $('icFoto').checked;
  }
  function parseItems(t) {
    return String(t || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const m = l.match(/\b(\d{3,14})\b/);
        return {
          code: m ? m[1] : '',
          name: (m ? l.replace(m[0], ' ') : l)
            .replace(/[;:|\t,\-–]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        };
      })
      .filter(x => x.code || x.name);
  }
  function sendMsg(id) {
    if (kilitli()) {
      render();
      return;
    }
    if (id.startsWith('ust:')) {
      const key = id.slice(4),
        t = $('icMsg').value.trim();
      if (!t) return;
      const side = ustSide(key);
      (D.ust[key] = D.ust[key] || []).push({ from: side, text: t, at: new Date().toISOString() });
      markUst(key);
      save();
      render();
      $('icMsg').focus();
      ustSim(key, side === 'ust' ? 'alt' : 'ust');
      return;
    }
    if (id.startsWith('pm:')) {
      const k = id.slice(3),
        t = $('icMsg').value.trim();
      if (!t) return;
      const g = giris(),
        side = g.tip === 'pm' ? 'pm' : 'bs';
      (D.pmMsg[k] = D.pmMsg[k] || []).push({ from: side, text: t, at: new Date().toISOString() });
      markPm(k);
      save();
      render();
      $('icMsg').focus();
      pmSim(k, side === 'pm' ? 'bs' : 'pm');
      return;
    }
    if (id === 'bsgrup') {
      const t = $('icMsg').value.trim();
      if (!t) return;
      const g = giris();
      D.bsgrup.push({
        from: g.ad,
        bolge: g.tip === 'pm' ? 'PM' : g.bolge || '',
        text: t,
        at: new Date().toISOString()
      });
      markBs();
      save();
      render();
      $('icMsg').focus();
      bsSim();
      return;
    }
    if (id === 'grup') {
      const t = $('icMsg').value.trim();
      if (!t) return;
      const g = giris();
      D.grup.push({ from: g.ad, unvan: g.unvan, text: t, at: new Date().toISOString() });
      markGrup();
      save();
      render();
      $('icMsg').focus();
      grupSim();
      return;
    }
    const t = $('icMsg').value.trim();
    if (!t) return;
    (D.messages[id] = D.messages[id] || []).push({
      from: D.role === 'bs' ? 'bs' : 'magaza',
      text: t,
      at: new Date().toISOString()
    });
    save();
    render();
    $('icMsg').focus();
    if (D.role === 'bs') simReply(id);
  }

