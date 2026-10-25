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
