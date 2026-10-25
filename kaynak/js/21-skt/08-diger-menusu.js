  /* --- Diğer menüsü --- */
  (function () {
    const M = [
      ['b', 'tabB', 'BS raporu', 'Sabah SKT dönüşü, akşam raporu'],
      ['a', 'tabA', 'Ay başı', 'Ciro hedefi, saat ve grafikler'],
      ['k', 'tabK', 'Aktüel', 'Salı, Cuma ve Pazar ürünleri'],
      ['g', 'tabG', 'Ayarlar', 'Hesap, görünüm, yedekleme']
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
