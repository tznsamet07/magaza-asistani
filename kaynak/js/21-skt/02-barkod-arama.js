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

