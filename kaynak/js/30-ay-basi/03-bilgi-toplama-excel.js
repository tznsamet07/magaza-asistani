  /* --- BS bilgi toplama listeleri + Excel (.xlsx) çıktısı --- */
  const COL = () => {
    const a = AB();
    if (!Array.isArray(a.collect)) a.collect = [];
    return a.collect;
  };
  let colId = null,
    colEdit = -1;
  document.querySelector('#bsView .sfilter').addEventListener('click', e => {
    const b = e.target.closest('[data-bsm]');
    if (!b) return;
    document.querySelectorAll('#bsView [data-bsm]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $('bsDaily').hidden = b.dataset.bsm !== 'daily';
    $('bsCol').hidden = b.dataset.bsm !== 'col';
    $('bsRc').hidden = b.dataset.bsm !== 'rc';
    renderCol();
    renderRc();
  });
  const cur = () => COL().find(c => c.id === colId);
  const fmtDT = iso => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  function renderCol() {
    const c = cur();
    $('colHome').hidden = !!c;
    $('colOpen').hidden = !c;
    if (!c) {
      const L = COL()
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at));
      $('colLists').innerHTML = L.length
        ? L.map(
            x =>
              `<li class="rp-item" data-colopen="${x.id}" style="cursor:pointer"><div><b>${esc(x.title)}</b><small>${x.rows.length} satır · ${esc(x.cols.join(', '))} · ${fmtDT(x.at)}</small></div><span class="btn small">Aç</span><span></span></li>`
          ).join('')
        : '<li class="sempty" style="padding:10px">Henüz liste yok.</li>';
      return;
    }
    $('colName').textContent = c.title;
    $('colInfo').textContent = `${c.rows.length} satır. Satıra dokununca düzenlenir.`;
    const num = v => v !== '' && !isNaN(Number(String(v).replace(',', '.')));
    const sums = c.cols.map((h, k) =>
      c.rows.length &&
      c.rows.every(r => r[k] === '' || num(r[k])) &&
      c.rows.some(r => num(r[k])) &&
      !/kod|barkod/i.test(h)
        ? c.rows.reduce((a, r) => a + (num(r[k]) ? Number(String(r[k]).replace(',', '.')) : 0), 0)
        : null
    );
    $('colTable').innerHTML =
      `<thead><tr><th>#</th>${c.cols.map(h => `<th>${esc(h)}</th>`).join('')}<th></th></tr></thead><tbody>${c.rows.map((r, i) => `<tr data-colrow="${i}"${i === colEdit ? ' class="ed"' : ''}><td>${i + 1}</td>${c.cols.map((_, k) => `<td>${esc(r[k] || '')}</td>`).join('')}<td><button type="button" class="del" data-coldel="${i}" aria-label="Satırı sil">×</button></td></tr>`).join('') || `<tr><td colspan="${c.cols.length + 2}" class="sempty">Henüz satır yok, aşağıdan ekle.</td></tr>`}</tbody>${sums.some(x => x != null) ? `<tfoot><tr><td>Σ</td>${sums.map(x => `<td>${x != null ? fmtH(x) : ''}</td>`).join('')}<td></td></tr></tfoot>` : ''}`;
    if (!$('colForm').dataset.for || $('colForm').dataset.for !== c.id) {
      $('colForm').dataset.for = c.id;
      $('colForm').innerHTML = c.cols
        .map(
          (h, k) =>
            `<label>${esc(h)}<input data-colf="${k}" autocomplete="off"${/adet|sayı|miktar|stok|fiyat|tutar/i.test(h) || /kod|barkod/i.test(h) ? ' inputmode="decimal"' : ''}></label>`
        )
        .join('');
    }
  }
  function colFormVals() {
    return [...document.querySelectorAll('#colForm [data-colf]')].map(i => i.value.trim());
  }
  function colReset() {
    colEdit = -1;
    document.querySelectorAll('#colForm [data-colf]').forEach(i => (i.value = ''));
    $('colAdd').textContent = 'Ekle';
    $('colFormT').textContent = 'Satır ekle';
    $('colCancel').hidden = true;
  }
  $('colNew').addEventListener('click', () => {
    const t = $('colTitle').value.trim(),
      cols = $('colCols')
        .value.split(',')
        .map(x => x.trim())
        .filter(Boolean);
    if (!t) {
      V.toast('Liste adını yaz.');
      $('colTitle').focus();
      return;
    }
    if (!cols.length) {
      V.toast('En az bir sütun yaz.');
      return;
    }
    const c = { id: uid(), title: t, cols, rows: [], at: new Date().toISOString() };
    COL().push(c);
    colId = c.id;
    $('colTitle').value = '';
    V.save();
    colReset();
    renderCol();
    const f = document.querySelector('#colForm [data-colf]');
    if (f) f.focus();
  });
  $('colLists').addEventListener('click', e => {
    const li = e.target.closest('[data-colopen]');
    if (!li) return;
    colId = li.dataset.colopen;
    colReset();
    renderCol();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('colBack').addEventListener('click', () => {
    colId = null;
    colReset();
    renderCol();
  });
  // Kod sütununa bilinen bir kod yazılınca ad sütunu kendiliğinden dolar (BS ürünleri ve SKT kayıtlı ürünlerinden)
  $('colForm').addEventListener('input', e => {
    const c = cur();
    const inp = e.target.closest('[data-colf]');
    if (!c || !inp) return;
    const k = Number(inp.dataset.colf);
    if (!/kod|barkod/i.test(c.cols[k])) return;
    const nk = c.cols.findIndex(h => /ad|ürün$/i.test(h) && !/adet|kod/i.test(h));
    if (nk < 0) return;
    const v = inp.value.trim(),
      bc = bsCat()[v],
      sc = ((V.state().skt && V.state().skt.catalog) || {})[v],
      nm = (bc && bc.name) || (sc && sc.name);
    const ni = document.querySelector(`#colForm [data-colf="${nk}"]`);
    if (nm && ni && (!ni.value || ni.dataset.auto)) {
      ni.value = nm;
      ni.dataset.auto = '1';
    }
  });
  $('colForm').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.closest('[data-colf]')) {
      e.preventDefault();
      const all = [...document.querySelectorAll('#colForm [data-colf]')],
        i = all.indexOf(e.target);
      if (i < all.length - 1) all[i + 1].focus();
      else $('colAdd').click();
    }
  });
  $('colAdd').addEventListener('click', () => {
    const c = cur();
    if (!c) return;
    const v = colFormVals();
    if (!v.some(Boolean)) {
      V.toast('Önce bir alan doldur.');
      return;
    }
    if (colEdit >= 0) c.rows[colEdit] = v;
    else c.rows.push(v);
    document.querySelectorAll('#colForm [data-colf]').forEach(i => delete i.dataset.auto);
    V.save();
    const was = colEdit >= 0;
    colReset();
    renderCol();
    V.toast(was ? 'Satır güncellendi.' : 'Satır eklendi.');
    const f = document.querySelector('#colForm [data-colf]');
    if (f) f.focus();
  });
  $('colCancel').addEventListener('click', () => {
    colReset();
    renderCol();
  });
  $('colTable').addEventListener('click', async e => {
    const c = cur();
    if (!c) return;
    const d = e.target.closest('[data-coldel]');
    if (d) {
      const i = Number(d.dataset.coldel);
      if (!(await window.askConfirm(`${i + 1}. satır silinsin mi?`))) return;
      c.rows.splice(i, 1);
      V.save();
      colReset();
      renderCol();
      return;
    }
    const tr = e.target.closest('[data-colrow]');
    if (!tr) return;
    colEdit = Number(tr.dataset.colrow);
    document.querySelectorAll('#colForm [data-colf]').forEach((inp, k) => (inp.value = c.rows[colEdit][k] || ''));
    $('colAdd').textContent = 'Kaydet';
    $('colFormT').textContent = `${colEdit + 1}. satırı düzenle`;
    $('colCancel').hidden = false;
    renderCol();
    $('colForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('colDel').addEventListener('click', async () => {
    const c = cur();
    if (!c) return;
    if (!(await window.askConfirm(`“${c.title}” listesi silinsin mi?`, 'Sil'))) return;
    AB().collect = COL().filter(x => x !== c);
    colId = null;
    V.save();
    colReset();
    renderCol();
    V.toast('Liste silindi.');
  });
  const colText = c =>
    [
      `${AB().store ? AB().store + ' - ' : ''}${c.title}`,
      '',
      c.cols.join(' | '),
      ...c.rows.map(r => c.cols.map((_, k) => r[k] || '-').join(' | '))
    ].join('\n');
  $('colShare').addEventListener('click', () => {
    const c = cur();
    if (!c) return;
    out(colText(c), c.title, "Liste kopyalandı; WhatsApp'ta yapıştır.");
  });
  $('colSend').addEventListener('click', () => {
    const c = cur();
    if (!c) return;
    if (!c.rows.length) {
      V.toast('Listede satır yok.');
      return;
    }
    if (!portal('liste', c.id || c.title, colText(c), 'Liste'))
      out(colText(c), c.title, "Liste kopyalandı; WhatsApp'ta yapıştır.");
  });
  // Kütüphanesiz .xlsx: sıkıştırmasız ZIP içinde Office Open XML
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u) {
    let c = 0xffffffff;
    for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const enc = new TextEncoder(),
      parts = [],
      cen = [];
    let off = 0;
    const u16 = n => [n & 255, (n >>> 8) & 255],
      u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    for (const [name, txt] of files) {
      const nm = enc.encode(name),
        data = enc.encode(txt),
        crc = crc32(data);
      const head = new Uint8Array([
        0x50,
        0x4b,
        3,
        4,
        ...u16(20),
        ...u16(0x0800),
        ...u16(0),
        ...u16(0),
        ...u16(0x21),
        ...u32(crc),
        ...u32(data.length),
        ...u32(data.length),
        ...u16(nm.length),
        ...u16(0)
      ]);
      parts.push(head, nm, data);
      cen.push(
        new Uint8Array([
          0x50,
          0x4b,
          1,
          2,
          ...u16(20),
          ...u16(20),
          ...u16(0x0800),
          ...u16(0),
          ...u16(0),
          ...u16(0x21),
          ...u32(crc),
          ...u32(data.length),
          ...u32(data.length),
          ...u16(nm.length),
          ...u16(0),
          ...u16(0),
          ...u16(0),
          ...u16(0),
          ...u32(0),
          ...u32(off)
        ]),
        nm
      );
      off += head.length + nm.length + data.length;
    }
    const cl = cen.reduce((a, x) => a + x.length, 0);
    return new Blob(
      [
        ...parts,
        ...cen,
        new Uint8Array([
          0x50,
          0x4b,
          5,
          6,
          0,
          0,
          0,
          0,
          ...u16(files.length),
          ...u16(files.length),
          ...u32(cl),
          ...u32(off),
          0,
          0
        ])
      ],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
  }
  function xlsx(title, cols, rows) {
    const x = v =>
      String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    const ref = (c, r) => {
      let s = '';
      c++;
      while (c) {
        const m = (c - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        c = Math.floor((c - 1) / 26);
      }
      return s + r;
    };
    const isNum = (v, h) => v !== '' && !/kod|barkod|telefon/i.test(h) && /^-?\d+([.,]\d+)?$/.test(String(v).trim());
    const cell = (v, c, r, st, h) =>
      isNum(v, h)
        ? `<c r="${ref(c, r)}"${st ? ` s="${st}"` : ''}><v>${String(v).trim().replace(',', '.')}</v></c>`
        : `<c r="${ref(c, r)}" t="inlineStr"${st ? ` s="${st}"` : ''}><is><t xml:space="preserve">${x(v)}</t></is></c>`;
    const all = [cols, ...rows],
      w = cols.map((h, k) => Math.min(50, Math.max(8, ...all.map(r => String(r[k] || '').length + 2))));
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${w.map((v, i) => `<col min="${i + 1}" max="${i + 1}" width="${v}" customWidth="1"/>`).join('')}</cols><sheetData><row r="1">${cols.map((h, c) => cell(h, c, 1, 1, '')).join('')}</row>${rows.map((r, i) => `<row r="${i + 2}">${cols.map((h, c) => cell(r[c] || '', c, i + 2, 0, h)).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${ref(cols.length - 1, Math.max(1, rows.length + 1))}"/></worksheet>`;
    const sn = x(title.replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31) || 'Liste');
    return zip([
      [
        '[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'
      ],
      [
        '_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
      ],
      [
        'xl/workbook.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sn}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${sn.replace(/'/g, "''")}'!$A$1:$${ref(cols.length - 1, '').replace(/\d/g, '')}$${Math.max(1, rows.length + 1)}</definedName></definedNames></workbook>`
      ],
      [
        'xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
      ],
      [
        'xl/styles.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF13784F"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'
      ],
      ['xl/worksheets/sheet1.xml', sheet]
    ]);
  }
  $('colXlsx').addEventListener('click', async () => {
    const c = cur();
    if (!c) return;
    if (!c.rows.length) {
      V.toast('Listede satır yok.');
      return;
    }
    const blob = xlsx(c.title, c.cols, c.rows),
      d = new Date();
    const name =
      `${(AB().store ? AB().store + ' ' : '') + c.title} ${d.getDate()}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.xlsx`
        .replace(/[\\\/:*?"<>|]/g, '-')
        .replace(
          /[çÇğĞıİöÖşŞüÜ]/g,
          ch => ({ ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' })[ch]
        );
    try {
      const f = new File([blob], name, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        await navigator.share({ files: [f], title: c.title });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 2000);
    V.toast('Excel dosyası indirildi.');
  });
  window.__xlsx = xlsx;

