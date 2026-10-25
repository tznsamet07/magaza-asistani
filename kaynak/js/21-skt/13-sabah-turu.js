  /* --- sabah SKT turu: bugün bakılacak ürünler reyon reyon, bitince BS'ye bildirilir --- */
  let seri = null;
  const TUR_DL = 9 * 60 + 15;
  const hm = iso => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const bsWants = () => {
    try {
      return !window.__ist || window.__ist().skt !== false;
    } catch (e) {
      return true;
    }
  };
  function turRead() {
    return (S().tur && S().tur[todayStr()]) || { c: {} };
  }
  function turDay() {
    const t = todayStr();
    if (!S().tur || typeof S().tur !== 'object') S().tur = {};
    if (!S().tur[t]) S().tur[t] = { c: {} };
    return S().tur[t];
  }
  function turMark(id, s) {
    turDay().c[id] = { s, at: new Date().toISOString(), by: who() };
  }
  // 14 günden eski tur kayıtları silinir
  (() => {
    if (!S().tur) return;
    const lim = shiftDate(todayStr(), 14);
    Object.keys(S().tur).forEach(k => {
      if (k < lim) delete S().tur[k];
    });
  })();
  function turItems() {
    const c = turRead().c;
    return S().items.filter(i => (!i.done && status(i) !== 'ok') || c[i.id]);
  }
  const shelfOf = it => it.shelf || (grp(it.group).id !== 'genel' ? grp(it.group).name : '') || 'Reyonu belirtilmemiş';
  function turSum() {
    const c = turRead().c,
      l = turItems(),
      f = s => l.filter(i => c[i.id] && c[i.id].s === s);
    return {
      n: l.length,
      kal: f('rm').length,
      sat: f('sold').length,
      ok: f('ok').length,
      rmNames: f('rm').map(i => i.name || i.barcode)
    };
  }
  function renderTur() {
    const box = $('turBox');
    if (!box) return;
    const d = turRead(),
      c = d.c,
      list = turItems(),
      n = list.length,
      k = list.filter(i => c[i.id]).length,
      bs = bsWants();
    const now = new Date(),
      mins = now.getHours() * 60 + now.getMinutes();
    box.classList.remove('done', 'late', 'wait');
    let badge, info;
    if (d.done) {
      box.classList.add('done');
      badge = 'Bitti';
      info = `Bugün ${hm(d.done.at)} bitirildi${d.done.by ? ` (${d.done.by})` : ''}.${bs ? " BS'ye bildirildi." : ''}`;
    } else if (mins <= TUR_DL) {
      box.classList.add('wait');
      const r = TUR_DL - mins;
      badge = bs ? (r >= 60 ? `${Math.floor(r / 60)} sa ${r % 60} dk` : `${r} dk kaldı`) : `${k}/${n}`;
      info = bs
        ? "Bugün bakılacak ürünleri kontrol et, 09.15'e kadar bitir. Bitince BS'ye kendiliğinden bildirilir."
        : 'Bugün bakılacak ürünleri reyon reyon kontrol et.';
    } else {
      box.classList.add(bs ? 'late' : 'wait');
      badge = bs ? 'Gecikti' : `${k}/${n}`;
      info = bs ? '09.15 geçti, tur henüz bitmedi.' : 'Bugün bakılacak ürünleri reyon reyon kontrol et.';
    }
    $('turBadge').textContent = badge;
    $('turInfo').textContent = info;
    const fin = bs ? "Turu bitir, BS'ye bildir" : 'Turu bitir';
    let h = '';
    if (d.done) {
      const s = d.done;
      h += `<div class="tur-ok" style="margin-top:12px">✓ ${s.n ? `${s.n} ürüne bakıldı: ${s.kal} kaldırıldı, ${s.sat} satılmış, ${s.ok} rafta.` : 'Bugün bakılacak ürün yoktu, kontrol yapıldı.'}</div>
      <div class="simp-act" style="margin-top:8px"><button type="button" class="btn small" data-tu="share">WhatsApp grubuna paylaş</button><button type="button" class="btn small" data-tu="reopen">Turu yeniden aç</button></div>`;
    }
    const open = list.filter(i => !c[i.id]);
    if (!d.done || open.length) {
      if (!n) {
        h += `<p class="hint" style="margin:10px 0 0">Bugün raftan kalkacak ya da yaklaşan ürün yok.</p><div class="tur-end"><button type="button" class="btn primary" data-tu="end">Kontrol yapıldı, ${bs ? "BS'ye bildir" : 'kaydet'}</button></div>`;
      } else {
        if (d.done)
          h += `<p class="hint" style="margin:10px 0 0">Tur bittikten sonra ${open.length} ürün daha listeye düştü.</p>`;
        h += `<div class="tur-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${k}"><i style="width:${Math.round((k / n) * 100)}%"></i></div><div class="tur-p"><span>${k} / ${n} ürün kontrol edildi</span><span>${n - k ? `${n - k} kaldı` : 'Hepsi bitti'}</span></div>`;
        const by = new Map();
        list
          .slice()
          .sort((a, b) => remDate(a).localeCompare(remDate(b)))
          .forEach(i => {
            const s = shelfOf(i);
            if (!by.has(s)) by.set(s, []);
            by.get(s).push(i);
          });
        const keys = [...by.keys()].sort(
          (a, b) => (a === 'Reyonu belirtilmemiş') - (b === 'Reyonu belirtilmemiş') || a.localeCompare(b, 'tr')
        );
        const row = it => {
          const m = c[it.id],
            st = status(it);
          const meta = [it.barcode, it.qty > 1 ? it.qty + ' adet' : '', it.disc ? 'İndirimde' : '']
            .filter(Boolean)
            .map(esc)
            .join(', ');
          if (m)
            return `<li class="si chk"><div class="si-main"><b>${esc(it.name || 'Adsız ürün')}</b><small>${meta || '&nbsp;'}</small></div><div class="si-date"><b>✓</b><small>${m.s === 'rm' ? 'Kaldırıldı' : m.s === 'sold' ? 'Satılmış' : 'Rafta, kontrol edildi'}</small></div>${m.s === 'ok' ? `<div class="si-act"><small style="color:var(--muted);align-self:center">${m.by ? esc(m.by) + ', ' : ''}${hm(m.at)}</small><button type="button" data-tu="undo" data-id="${it.id}">Geri al</button></div>` : ''}</li>`;
          return `<li class="si ${st}"><div class="si-main"><b>${esc(it.name || 'Adsız ürün')}</b><small>${meta || '&nbsp;'}</small></div><div class="si-date"><b>${dateLabel(it)}</b><small>${itemLeft(it)}</small></div><div class="si-act">${
            st === 'exp'
              ? `<button type="button" class="go" data-tu="rm" data-id="${it.id}">Raftan kaldırıldı</button><button type="button" class="sold" data-tu="sold" data-id="${it.id}">Rafta yok, satılmış</button>`
              : `<button type="button" class="go" data-tu="ok" data-id="${it.id}">Baktım, rafta</button><button type="button" data-tu="rm" data-id="${it.id}">Raftan kaldırıldı</button>${it.disc ? '' : `<button type="button" data-tu="disc" data-id="${it.id}">İndirime alındı</button>`}`
          }</div></li>`;
        };
        h += `<ul class="slist" id="turList">${keys
          .map(s => {
            const L = by.get(s),
              kk = L.filter(i => c[i.id]).length;
            return (
              `<li class="shead" style="color:var(--ink)">${esc(s)} <span style="color:var(--muted)">(${kk}/${L.length})</span></li>` +
              L.map(row).join('')
            );
          })
          .join('')}</ul>`;
        h += `<div class="tur-end"><button type="button" class="btn primary" data-tu="end"${k < n ? ' disabled' : ''}>${k < n ? `Bitirmek için ${n - k} ürüne daha bak` : fin}</button></div>`;
      }
    }
    $('turBody').innerHTML = h;
  }
  function turText() {
    const d = turRead(),
      s = d.done || turSum(),
      ab = V.state().ab || {},
      g = (window.__giris && window.__giris()) || {},
      st = ab.msLast || ab.store || g.magaza || '',
      now = new Date();
    const L = [
      `${st ? st + ' - ' : ''}${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      'Sabah SKT kontrolü yapıldı ✅'
    ];
    if (s.n) {
      L.push(`${s.n} ürüne bakıldı: ${s.kal} kaldırıldı, ${s.sat} satılmış, ${s.ok} rafta.`);
      if (s.rmNames && s.rmNames.length) L.push('Kaldırılanlar: ' + s.rmNames.join(', '));
    }
    return L.join('\n');
  }
  function turFinish() {
    const t = todayStr(),
      d = turDay(),
      s = turSum(),
      at = new Date().toISOString(),
      bs = bsWants();
    d.done = { at, by: who(), ...s };
    if (bs) {
      const st = V.state();
      st.ab = st.ab || {};
      const ab = st.ab;
      ab.mskt = ab.mskt || {};
      const g = (window.__giris && window.__giris()) || {};
      ab.mskt[t] = {
        store: ab.msLast || ab.store || g.magaza || '',
        at,
        by: who(),
        tur: { n: s.n, kal: s.kal, sat: s.sat, ok: s.ok }
      };
    }
    logla('turbitir', '', s.n);
    save();
    renderTur();
    renderLog();
    V.toast(bs ? "Tur bitti, BS'ye bildirildi. İstersen WhatsApp grubuna da paylaş." : 'Tur bitti, kaydedildi.');
  }
  $('turBox').addEventListener('click', async e => {
    const b = e.target.closest('[data-tu]');
    if (!b || b.disabled) return;
    const a = b.dataset.tu;
    if (a === 'end') {
      turFinish();
      return;
    }
    if (a === 'share') {
      shareText(turText(), 'Sabah SKT kontrolü', 'Mesaj kopyalandı; WhatsApp grubuna yapıştır.');
      return;
    }
    if (a === 'reopen') {
      if (!(await askConfirm("Tur yeniden açılsın mı? BS'ye giden bildirim yerinde kalır."))) return;
      delete turDay().done;
      save();
      renderTur();
      return;
    }
    const it = S().items.find(i => i.id === b.dataset.id);
    if (!it) return;
    if (a === 'rm') {
      openRemove(it);
      return;
    }
    if (a === 'sold') {
      openRemove(it, 'sold');
      return;
    }
    if (a === 'ok') {
      turMark(it.id, 'ok');
      logla('kontrol', it.name || it.barcode, it.qty);
    }
    if (a === 'disc') {
      it.disc = true;
      turMark(it.id, 'ok');
      logla('indirim', it.name || it.barcode, it.qty);
    }
    if (a === 'undo') {
      delete turDay().c[it.id];
    }
    save();
    render();
    renderLog();
  });
  setInterval(() => {
    if (!$('sktView').hidden) renderTur();
  }, 30000);

