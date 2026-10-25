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

