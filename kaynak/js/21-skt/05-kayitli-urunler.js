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

