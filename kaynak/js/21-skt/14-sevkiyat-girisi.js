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

