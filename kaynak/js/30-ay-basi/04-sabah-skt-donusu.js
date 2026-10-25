  /* --- sabah SKT dönüşü: 09.15'e kadar gruba "SKT kontrolü yapıldı" --- */
  const MS_DL = 9 * 60 + 15;
  function msRec() {
    const a = AB();
    if (!a.mskt) a.mskt = {};
    return a.mskt;
  }
  function renderMs() {
    const t = isoToday(),
      r = msRec()[t],
      now = new Date(),
      mins = now.getHours() * 60 + now.getMinutes();
    if (!$('msStore').value) $('msStore').value = (r && r.store) || AB().msLast || AB().store || '';
    const box = $('msBox');
    box.classList.remove('done', 'late', 'wait');
    if (r) {
      box.classList.add('done');
      $('msBadge').textContent = 'Gönderildi';
      $('msInfo').textContent =
        `Bugün ${new Date(r.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} gönderildi: ${r.store || '-'}`;
      $('msSend').textContent = 'Tekrar gönder';
    } else if (mins <= MS_DL) {
      box.classList.add('wait');
      const k = MS_DL - mins;
      $('msBadge').textContent = k >= 60 ? `${Math.floor(k / 60)} sa ${k % 60} dk` : `${k} dk kaldı`;
      $('msInfo').textContent = "Her sabah 09.15'e kadar gruba bildirilir.";
      $('msSend').textContent = "SKT kontrolü yapıldı, BS'ye gönder";
    } else {
      box.classList.add('late');
      $('msBadge').textContent = 'Gecikti';
      $('msInfo').textContent = '09.15 geçti, bugün henüz gönderilmedi.';
      $('msSend').textContent = "SKT kontrolü yapıldı, BS'ye gönder";
    }
  }
  $('msSend').addEventListener('click', () => {
    const st = $('msStore').value.trim(),
      now = new Date();
    const txt = `${st ? st + ' - ' : ''}${now.getDate()} ${MON[now.getMonth()]} ${now.getFullYear()}\nSKT kontrolü yapıldı ✅`;
    msRec()[isoToday()] = { store: st, at: now.toISOString() };
    AB().msLast = st;
    V.save();
    renderMs();
    if (!portal('skt', isoToday(), txt, 'SKT dönüşü'))
      out(txt, 'SKT kontrolü', 'Mesaj kopyalandı; WhatsApp grubuna yapıştır.');
  });
  $('msWa').addEventListener('click', () => {
    const st = $('msStore').value.trim(),
      now = new Date();
    out(
      `${st ? st + ' - ' : ''}${now.getDate()} ${MON[now.getMonth()]} ${now.getFullYear()}\nSKT kontrolü yapıldı ✅`,
      'SKT kontrolü',
      'Mesaj kopyalandı; WhatsApp grubuna yapıştır.'
    );
  });
  setInterval(() => {
    if (!$('bsView').hidden) renderMs();
  }, 30000);
  // Uygulama 09.15'ten önce açılırsa ve bugün gönderilmediyse hatırlat
  setTimeout(() => {
    const n = new Date(),
      m = n.getHours() * 60 + n.getMinutes();
    if (m >= 6 * 60 && m <= MS_DL && !msRec()[isoToday()] && !(window.__ist && !window.__ist().skt))
      V.toast(`Sabah SKT dönüşü: 09.15'e ${MS_DL - m} dk kaldı (BS sekmesi).`);
  }, 1500);

