  /* --- BS kontrol / iade listeleri --- */
  const RCST = [
    ['yok', 'Mağazada yok'],
    ['kaldir', 'Raftan kaldırıldı'],
    ['iade', 'Depoya iade kesildi']
  ];
  const RC = () => {
    const a = AB();
    if (!Array.isArray(a.recalls)) a.recalls = [];
    return a.recalls;
  };
  let rcId = null;
  const rcCur = () => RC().find(x => x.id === rcId);
  // "5012 Çikolatalı gofret", "Çikolatalı gofret - 5012", "5012;Gofret" gibi satırları kod + ad olarak ayırır
  function rcParse(t) {
    const all = String(t || '')
      .split(/\r?\n/)
      .map(l => l.replace(/^\s*(?:[\-\*•]|\d{1,2}[.)])\s+/, '').trim())
      .filter(l => l && /\S/.test(l))
      .map(l => {
        const m = l.match(/\b(\d{3,14})\b/);
        let code = m ? m[1] : '',
          name = (m ? l.replace(m[0], ' ') : l)
            .replace(/[;:|\t,\-–]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!name && code) {
          const c = bsCat()[code] || ((V.state().skt || {}).catalog || {})[code];
          name = (c && c.name) || '';
        }
        return { code, name, st: '', qty: null };
      })
      .filter(x => x.code || x.name);
    // kodlu satır varsa kodsuz satırlar ("Arkadaşlar şunlara bakın" gibi) başlık sayılır, atlanır
    return all.some(x => x.code) ? all.filter(x => x.code) : all;
  }
  function renderRc() {
    const c = rcCur();
    $('rcHome').hidden = !!c;
    $('rcOpen').hidden = !c;
    if (!c) {
      const L = RC()
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at));
      $('rcLists').innerHTML = L.length
        ? L.map(x => {
            const d = x.items.filter(i => i.st).length;
            return `<li class="rp-item" data-rcopen="${x.id}" style="cursor:pointer"><div><b>${esc(x.title)}</b><small>${d}/${x.items.length} işaretlendi · ${fmtDT(x.at)}${x.sent ? ' · gönderildi' : ''}</small></div><span class="mskt-badge" style="${d === x.items.length ? 'background:color-mix(in srgb,var(--green) 15%,transparent);color:var(--green)' : ''}">${d === x.items.length ? 'Tamam' : 'Bekliyor'}</span><span></span></li>`;
          }).join('')
        : '<li class="sempty" style="padding:10px">Henüz liste yok.</li>';
      return;
    }
    $('rcName').textContent = c.title;
    const d = c.items.filter(i => i.st).length;
    $('rcBar').style.width = (c.items.length ? (d * 100) / c.items.length : 0) + '%';
    $('rcProg').textContent = `${d}/${c.items.length} ürün işaretlendi`;
    $('rcItems').innerHTML =
      c.items
        .map(
          (
            it,
            k
          ) => `<li class="rc-it${it.st ? ' ok' : ''}"><div class="rc-top"><div><b>${esc(it.name || 'Adsız ürün')}</b><small>${it.code ? 'Kod ' + esc(it.code) : '&nbsp;'}</small></div><button type="button" class="del" data-rcdel="${k}" aria-label="Ürünü çıkar">×</button></div>
    <div class="rc-st">${RCST.map(([v, l]) => `<button type="button" data-rcst="${k}" data-v="${v}" aria-pressed="${it.st === v}">${l}</button>`).join('')}</div>
    ${it.st && it.st !== 'yok' ? `<label class="rc-q">Adet<input data-rcq="${k}" inputmode="numeric" value="${it.qty != null ? it.qty : ''}" placeholder="0"></label>` : ''}</li>`
        )
        .join('') || '<li class="sempty" style="padding:10px">Listede ürün yok.</li>';
  }
  $('rcNew').addEventListener('click', () => {
    const items = rcParse($('rcPaste').value);
    if (!items.length) {
      V.toast("BS'nin mesajını yapıştır.");
      $('rcPaste').focus();
      return;
    }
    const d = new Date(),
      c = {
        id: uid(),
        title: $('rcTitle').value.trim() || `Kontrol listesi ${d.getDate()} ${MON[d.getMonth()]}`,
        items,
        at: d.toISOString()
      };
    RC().push(c);
    rcId = c.id;
    $('rcPaste').value = '';
    $('rcTitle').value = '';
    V.save();
    renderRc();
    V.toast(`${items.length} ürün eklendi.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('rcLists').addEventListener('click', e => {
    const li = e.target.closest('[data-rcopen]');
    if (!li) return;
    rcId = li.dataset.rcopen;
    renderRc();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('rcBack').addEventListener('click', () => {
    rcId = null;
    renderRc();
  });
  $('rcItems').addEventListener('click', async e => {
    const c = rcCur();
    if (!c) return;
    const b = e.target.closest('[data-rcst]');
    if (b) {
      const it = c.items[Number(b.dataset.rcst)];
      it.st = it.st === b.dataset.v ? '' : b.dataset.v;
      if (it.st === 'yok' || !it.st) it.qty = null;
      V.save();
      renderRc();
      if (it.st && it.st !== 'yok') {
        const q = document.querySelector(`[data-rcq="${b.dataset.rcst}"]`);
        if (q) q.focus();
      }
      return;
    }
    const d = e.target.closest('[data-rcdel]');
    if (d) {
      const k = Number(d.dataset.rcdel);
      if (!(await window.askConfirm(`${c.items[k].name || 'Bu ürün'} listeden çıkarılsın mı?`))) return;
      c.items.splice(k, 1);
      V.save();
      renderRc();
    }
  });
  $('rcItems').addEventListener('change', e => {
    const c = rcCur();
    const q = e.target.closest('[data-rcq]');
    if (!c || !q) return;
    c.items[Number(q.dataset.rcq)].qty = parseN(q.value);
    V.save();
  });
  $('rcAdd').addEventListener('click', () => {
    const c = rcCur();
    if (!c) return;
    const code = $('rcAddCode').value.trim();
    let name = $('rcAddName').value.trim();
    if (!code && !name) {
      V.toast('Kod ya da ad yaz.');
      return;
    }
    if (!name && code) {
      const k = bsCat()[code] || ((V.state().skt || {}).catalog || {})[code];
      name = (k && k.name) || '';
    }
    c.items.push({ code, name, st: '', qty: null });
    $('rcAddCode').value = '';
    $('rcAddName').value = '';
    V.save();
    renderRc();
  });
  function rcText(c) {
    const d = new Date(c.at),
      L = [`${AB().store ? AB().store + ' - ' : ''}${c.title}`, ''];
    c.items.forEach(it => {
      const l = (RCST.find(x => x[0] === it.st) || [])[1];
      L.push(
        `${it.code ? it.code + ' ' : ''}${it.name}: ${l ? (it.st !== 'yok' && it.qty != null ? fmtN(it.qty) + ' adet ' : '') + l.toLocaleLowerCase('tr-TR') + (it.st === 'yok' ? '' : ' ✅') : 'kontrol edilmedi ❌'}`
      );
    });
    const n = c.items.filter(i => !i.st).length;
    L.push('', n ? `${n} ürün henüz kontrol edilmedi.` : 'Tüm ürünler kontrol edildi ✅');
    return L.join('\n');
  }
  $('rcSend').addEventListener('click', async () => {
    const c = rcCur();
    if (!c) return;
    const n = c.items.filter(i => !i.st).length;
    if (n && !(await window.askConfirm(`${n} ürün işaretlenmedi. Yine de gönderilsin mi?`, 'Gönder'))) return;
    c.sent = new Date().toISOString();
    V.save();
    if (!portal('iade', c.id || c.title, rcText(c), 'Dönüş'))
      out(rcText(c), c.title, 'Dönüş kopyalandı; WhatsApp grubuna yapıştır.');
  });
  $('rcWa').addEventListener('click', () => {
    const c = rcCur();
    if (c) out(rcText(c), c.title, 'Dönüş kopyalandı; WhatsApp grubuna yapıştır.');
  });
  $('rcXlsx').addEventListener('click', () => {
    const c = rcCur();
    if (!c) return;
    const rows = c.items.map(it => [
      it.code,
      it.name,
      (RCST.find(x => x[0] === it.st) || [, 'Kontrol edilmedi'])[1],
      it.qty != null ? String(it.qty) : ''
    ]);
    const blob = xlsx(c.title, ['Ürün kodu', 'Ürün adı', 'Durum', 'Adet'], rows),
      name = `${(AB().store ? AB().store + ' ' : '') + c.title}.xlsx`
        .replace(/[\\\/:*?"<>|]/g, '-')
        .replace(
          /[çÇğĞıİöÖşŞüÜ]/g,
          ch => ({ ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' })[ch]
        );
    (async () => {
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
    })();
  });
  $('rcDel').addEventListener('click', async () => {
    const c = rcCur();
    if (!c) return;
    if (!(await window.askConfirm(`“${c.title}” listesi silinsin mi?`, 'Sil'))) return;
    AB().recalls = RC().filter(x => x !== c);
    rcId = null;
    V.save();
    renderRc();
  });
  window.__renderBs = () => {
    renderBs();
    renderCol();
    renderMs();
    renderRc();
  };
  window.__renderAb = () => {
    render();
    renderCiro();
  };
  // Vardiya oluşturucu için: ayın günlük saat hedefleri (saat hedefi girilmişse)
  window.__abDayTargets = m => {
    const P = (C().ciro || {})[m];
    if (!P || !P.hours) return null;
    const days = monthDays(m),
      pc = distribute(m, P.target),
      dh = distributeHours(m, P.hours, pc);
    if (!dh) return null;
    const o = {};
    days.forEach((d, k) => (o[d.ds] = dh[k]));
    return o;
  };
  $('abPrev').addEventListener('click', () => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    ym = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    openId = null;
    $('cDay').value = '';
    render();
    renderCiro();
  });
  $('abNext').addEventListener('click', () => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m, 1);
    ym = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    openId = null;
    $('cDay').value = '';
    render();
    renderCiro();
  });
  $('abList').addEventListener('click', async e => {
    const tg = e.target.closest('[data-tog]');
    if (tg) {
      const id = tg.dataset.tog,
        D = AB().done;
      D[ym] = D[ym] || {};
      const r = D[ym][id] || {};
      if (r.at) {
        delete r.at;
      } else r.at = new Date().toISOString();
      D[ym][id] = r;
      V.save();
      render();
      return;
    }
    const op = e.target.closest('[data-open]');
    if (op) {
      openId = op.dataset.open;
      render();
      const ta = document.querySelector(`[data-note="${openId}"]`);
      if (ta) ta.focus();
      return;
    }
    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const t = AB().tasks.find(x => x.id === ed.dataset.edit);
      if (!t) return;
      editId = t.id;
      $('abT').value = t.t;
      $('abDay').value = t.day || '';
      $('abRole').value = t.role || '';
      $('abDesc').value = t.desc || '';
      $('abFormTitle').textContent = 'Görevi düzenle';
      $('abSave').textContent = 'Kaydet';
      $('abCancel').hidden = false;
      $('abAddBox').open = true;
      $('abAddBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const dl = e.target.closest('[data-del]');
    if (dl) {
      const t = AB().tasks.find(x => x.id === dl.dataset.del);
      if (!t) return;
      if (!(await askConfirm(`“${t.t}” listeden silinsin mi? Geçmiş ayların işaretleri de kalkar.`))) return;
      AB().tasks = AB().tasks.filter(x => x !== t);
      V.save();
      render();
    }
  });
  $('abList').addEventListener('change', e => {
    const ta = e.target.closest('[data-note]');
    if (!ta) return;
    const D = AB().done;
    D[ym] = D[ym] || {};
    const r = D[ym][ta.dataset.note] || {};
    r.note = ta.value.trim();
    D[ym][ta.dataset.note] = r;
    openId = null;
    V.save();
    render();
  });
  function resetForm() {
    editId = null;
    ['abT', 'abDay', 'abDesc'].forEach(k => ($(k).value = ''));
    $('abRole').value = '';
    $('abFormTitle').textContent = 'Görev ekle';
    $('abSave').textContent = 'Listeye ekle';
    $('abCancel').hidden = true;
  }
  $('abSave').addEventListener('click', () => {
    const t = $('abT').value.trim();
    if (!t) {
      V.toast('Yapılacak işi yaz.');
      $('abT').focus();
      return;
    }
    let day = parseInt($('abDay').value, 10);
    day = day >= 1 && day <= 31 ? day : null;
    const data = { t, day, role: $('abRole').value, desc: $('abDesc').value.trim() };
    if (editId) {
      const x = AB().tasks.find(y => y.id === editId);
      if (x) Object.assign(x, data);
      V.toast('Görev güncellendi.');
    } else {
      AB().tasks.push({ id: uid(), ...data });
      V.toast('Görev eklendi.');
    }
    V.save();
    resetForm();
    render();
  });
  $('abCancel').addEventListener('click', resetForm);
  $('abEditBtn').addEventListener('click', () => {
    editMode = !editMode;
    $('abEditBtn').setAttribute('aria-pressed', editMode);
    $('abEditBtn').textContent = editMode ? 'Düzenlemeyi bitir' : 'Listeyi düzenle';
    render();
  });
  $('abShare').addEventListener('click', async () => {
    const ts = sorted();
    if (!ts.length) {
      V.toast('Listede görev yok.');
      return;
    }
    const [y, m] = ym.split('-').map(Number),
      done = ts.filter(t => isDone(t)).length;
    const lines = [
      `AY BAŞI İŞLEMLERİ: ${MON[m - 1]} ${y}`,
      `${done} / ${ts.length} tamamlandı`,
      '',
      ...ts.map(t => {
        const r = recOf(t);
        return `${isDone(t) ? '[x]' : '[ ]'} ${t.t}${t.day ? ` (son gün ${t.day})` : ''}${r && r.note ? `: ${r.note}` : ''}`;
      })
    ];
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ay başı işlemleri', text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      V.toast('Durum panoya kopyalandı.');
    } catch (e) {
      V.toast('Kopyalanamadı.');
    }
  });
  badge();
  if (V.state().tab === 'a' && window.__setTab) window.__setTab('a');
  if (V.state().tab === 'b' && window.__setTab) window.__setTab('b');
})();
