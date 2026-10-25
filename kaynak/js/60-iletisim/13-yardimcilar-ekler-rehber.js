  /* --- yardımcılar --- */
  const trq = x => String(x || '').toLocaleLowerCase('tr-TR');
  function reqLis(L, q) {
    q = trq(q).trim();
    const pend = [],
      done = [];
    L.forEach(r => {
      if (q) {
        const d = new Date(r.at),
          hay = trq(
            [
              r.title,
              r.body,
              TYPES[r.type],
              when(r.at),
              d.toLocaleDateString('tr-TR'),
              d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
              ...(r.items || []).map(it => it.code + ' ' + it.name)
            ].join(' ')
          );
        if (!q.split(/\s+/).every(w => hay.includes(w))) return;
      }
      (answered(r, 'me') ? done : pend).push(r);
    });
    const li = r => {
      const a = answered(r, 'me');
      return `<li data-icans="${r.id}" class="${a ? 'done' : 'todo'}"><div><span class="ic-type t-${r.type}">${TYPES[r.type]}</span><b>${esc(r.title)}</b><small>${when(r.at)}${r.foto ? ' · 📷 fotoğraf isteniyor' : ''}${a ? ' · yanıtlandı' : ''}</small></div><span class="ic-st ${a ? 'ok' : 'wait'}">${a ? 'Yanıtlandı' : 'Yanıtla'}</span></li>`;
    };
    if (!pend.length && !done.length) return `<li class="sempty">${q ? 'Aramaya uyan talep yok.' : 'Talep yok.'}</li>`;
    return (
      (pend.length ? `<li class="rq-sep">Yapılacaklar · ${pend.length}</li>` + pend.map(li).join('') : '') +
      (done.length ? `<li class="rq-sep">Yapılanlar · ${done.length}</li>` + done.map(li).join('') : '')
    );
  }
  let bsTab = 'm',
    bsQ = '',
    dpSel = [];
  function reqHit(r, q) {
    if (!q) return true;
    const d = new Date(r.at),
      hay = trq(
        [
          r.title,
          r.body,
          TYPES[r.type],
          when(r.at),
          d.toLocaleDateString('tr-TR'),
          d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
          ...(r.items || []).map(it => it.code + ' ' + it.name)
        ].join(' ')
      );
    return q.split(/\s+/).every(w => hay.includes(w));
  }
  function bsReqLis(q) {
    q = trq(q).trim();
    const L = D.requests.filter(r => reqHit(r, q)).sort((a, b) => b.at.localeCompare(a.at)),
      cnt = r => r.to.filter(id => answered(r, id)).length,
      open = L.filter(r => cnt(r) < r.to.length),
      done = L.filter(r => cnt(r) >= r.to.length);
    const li = r => {
      const n = cnt(r);
      return `<li data-icreq="${r.id}"><div><span class="ic-type t-${r.type}">${TYPES[r.type]}</span><b>${esc(r.title)}</b><small>${when(r.at)} · 👁 ${readN(r)}/${r.to.length} okudu${r.foto ? ' · 📷' : ''}</small></div><div class="ic-prog"><b>${n}/${r.to.length}</b><div class="ab-bar"><i style="width:${(n * 100) / r.to.length}%"></i></div></div></li>`;
    };
    if (!L.length) return `<li class="sempty">${q ? 'Aramaya uyan talep yok.' : 'Henüz talep yok.'}</li>`;
    return (
      (open.length ? `<li class="rq-sep">Dönüş bekleniyor · ${open.length}</li>` + open.map(li).join('') : '') +
      (done.length ? `<li class="rq-sep">Tamamlananlar · ${done.length}</li>` + done.map(li).join('') : '')
    );
  }
  const myReqs = () => D.requests.filter(r => r.to.includes('me')).sort((a, b) => b.at.localeCompare(a.at));
  /* --- ekler: fotoğraf, belge, dosya (sunumda cihazda saklanır; gerçek sürümde buluta yüklenir) --- */
  const ATT_MAX = 2 * 1024 * 1024;
  const fsz = n =>
    n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const extOf = n => {
    const m = String(n || '').match(/\.([a-z0-9]{1,5})$/i);
    return m ? m[1].toLocaleUpperCase('tr-TR') : 'DOSYA';
  };
  function attHtml(L, del) {
    if (!L || !L.length) return '';
    return `<div class="att-list">${L.map((a, i) => {
      const im = /^image\//.test(a.type);
      return `<div class="att${im ? ' img' : ''}">${im ? `<button type="button" class="att-th" data-attview="${i}" data-attsrc="${del ? 'form' : ''}" aria-label="${esc(a.name)} büyüt"><img src="${a.data}" alt=""></button>` : `<a class="att-f" href="${a.data}" download="${esc(a.name)}"><span class="att-ext">${esc(extOf(a.name))}</span><span class="att-n"><b>${esc(a.name)}</b><small>${fsz(a.size)} · indir</small></span></a>`}${del ? `<button type="button" class="att-x" data-attdel="${i}" aria-label="Kaldır">×</button>` : ''}</div>`;
    }).join('')}</div>`;
  }
  function attBox(L, title, hint) {
    return `<div class="box"><h2 style="font-size:17px">${title}</h2><p class="hint" style="margin:2px 0 0">${hint}</p>${attHtml(L, true)}<div class="att-act"><label class="btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Fotoğraf çek<input type="file" accept="image/*" capture="environment" data-attin hidden></label><label class="btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12.5 12.6 20a5 5 0 0 1-7.1-7.1L13 5.4a3.4 3.4 0 0 1 4.8 4.8l-7.4 7.4a1.7 1.7 0 0 1-2.4-2.4L15 8.3"/></svg>Belge / dosya<input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx" data-attin hidden></label></div></div>`;
  }
  function readAtt(file) {
    return new Promise(res => {
      const fr = new FileReader();
      fr.onerror = () => res(null);
      if (/^image\//.test(file.type) && !/svg|gif/.test(file.type)) {
        fr.onload = () => {
          const im = new Image();
          im.onload = () => {
            const k = Math.min(1, 1600 / Math.max(im.width, im.height)),
              c = document.createElement('canvas');
            c.width = Math.round(im.width * k);
            c.height = Math.round(im.height * k);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            const d = c.toDataURL('image/jpeg', 0.72);
            res({
              name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
              type: 'image/jpeg',
              size: Math.round(d.length * 0.75),
              data: d
            });
          };
          im.onerror = () => res(null);
          im.src = fr.result;
        };
      } else {
        if (file.size > ATT_MAX) {
          res({ err: file.name });
          return;
        }
        fr.onload = () =>
          res({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: fr.result });
      }
      fr.readAsDataURL(file);
    });
  }
  function attView(src, name) {
    let v = $('attView');
    if (!v) {
      v = document.createElement('div');
      v.id = 'attView';
      v.className = 'att-view';
      v.setAttribute('role', 'dialog');
      document.body.appendChild(v);
      v.addEventListener('click', e => {
        if (!e.target.closest('a')) v.hidden = true;
      });
    }
    v.innerHTML = `<img src="${src}" alt=""><div class="att-vb"><a class="btn" href="${src}" download="${esc(name)}">İndir</a><button type="button" class="btn">Kapat</button></div>`;
    v.hidden = false;
  }
  const answered = (r, id) => !!(D.responses[r.id] || {})[id];
  const unreadFor = id => {
    const L = D.messages[id] || [],
      seen = (D.seen || {})[(D.role === 'bs' ? 'bs:' : 'mg:') + id] || '';
    return L.filter(m => m.from !== (D.role === 'bs' ? 'bs' : 'magaza') && m.at > seen).length;
  };
  function markSeen(id) {
    D.seen = D.seen || {};
    D.seen[(D.role === 'bs' ? 'bs:' : 'mg:') + id] = new Date().toISOString();
    save();
  }
  function chip(ok, label, t) {
    return ok == null
      ? `<span class="ic-chip">• ${label}${t ? ' ' + t : ''}</span>`
      : `<span class="ic-chip ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${label}${ok && t ? ' ' + t : ''}</span>`;
  }
  /* Mağaza rehberi: bimVeri.magazalar listesinden kod, ad, mahalle, ilçe ya da il ile arama */
  const MG = () => (window.__mg && window.__mg.var() ? window.__mg : null);
  function mgAdres(name, hm) {
    const M = MG(),
      o = M && M.bul(name);
    if (!o) return '';
    return `<p class="mg-adr"${hm ? ` style="margin:${hm}"` : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>${esc(o.adres)}${o.bk ? `<small>Bölge ${esc(o.bk)} · ${esc(M.bolge(o.bk))}</small>` : ''}</span><a href="${esc(M.harita(o))}" target="_blank" rel="noopener">Harita</a></p>`;
  }
  function rhRows(L) {
    const M = MG(),
      my = window.__mg.kodOf(myName());
    return L.map(
      o =>
        `<li><div><b>${esc(o.ad)}${o.kod ? ` <span class="rh-kod">${esc(o.kod)}</span>` : ''}${o.yeni ? ' <span class="stag">Yeni</span>' : ''}${D.role === 'magaza' && (o.kod ? o.kod === my : o === MG().bul(myName())) ? ' <em class="rh-me">Bizim mağaza</em>' : ''}</b><small>${esc(o.adres)}</small>${o.bk ? `<small>${nrm(o.il) !== nrm(M.bolge(o.bk)) ? esc(o.il) + ' · ' : ''}Bölge ${esc(o.bk)} · ${esc(M.bolge(o.bk))}</small>` : ''}</div><a class="btn small" href="${esc(M.harita(o))}" target="_blank" rel="noopener">Harita</a></li>`
    ).join('');
  }
  let rhIl = '';
  function rhIller() {
    const M = MG(),
      m = {};
    M.tumu().forEach(o => {
      const k = nrm(o.il);
      if (k && !m[k]) m[k] = o.il;
    });
    return Object.entries(m).sort((a, b) => a[1].localeCompare(b[1], 'tr'));
  }
  function rhDef() {
    if (rhIl) {
      const M = MG(),
        L = M.tumu()
          .filter(x => nrm(x.il) === rhIl)
          .sort((a, b) => String(a.yer).localeCompare(String(b.yer), 'tr'));
      return { t: `${esc((L[0] || {}).il || '')} · ${L.length} mağaza`, L };
    }
    const M = MG(),
      g = giris(),
      o = D.role === 'magaza' ? M.bul(myName()) : null,
      bk = o ? o.bk : (g && M.bolgeBul(g.bolge || g.depo || '')) || (M.bul(window.__MGDEF) || {}).bk || '',
      L = M.hepsi().filter(x => x.bk === bk);
    if (o) {
      if (!L.includes(o)) L.unshift(o);
      L.sort((a, b) => (b === o) - (a === o));
    }
    return { t: `${esc(M.bolge(bk))} bölgesi · ${L.length} mağaza`, L };
  }
  function rehberPage() {
    const M = MG();
    if (!M)
      return (
        head('Mağaza rehberi', true) +
        '<div class="box"><p class="hint" style="margin:0">Mağaza listesi henüz yüklenmedi.</p></div>'
      );
    const d = rhDef();
    return (
      head('Mağaza rehberi', true) +
      `<div class="box"><p class="hint" style="margin:0">Listede ${M.tumSay().toLocaleString('tr-TR')} mağaza var · ${M.bolgeSay()} bölge · ${M.ilSay()} il</p><label class="rq-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="rhQ" type="search" autocomplete="off" placeholder="Şehir, ilçe, mağaza adı ya da kodu ara" aria-label="Mağaza ara"></label>
    <label class="rh-il">Göster<select id="rhIl"><option value="">Kendi bölgem</option>${rhIller()
      .map(([k, v]) => `<option value="${esc(k)}"${rhIl === k ? ' selected' : ''}>${esc(v)}</option>`)
      .join(
        ''
      )}</select></label><p class="gr-lbl" id="rhT" style="margin:12px 0 4px">${d.t}</p><ul class="rh-list" id="rhL">${rhRows(d.L.slice(0, 40))}</ul><p class="hint" id="rhMore" style="margin:6px 0 0"${d.L.length > 40 ? '' : ' hidden'}>İlk 40 mağaza gösteriliyor. Aramayla ya da il seçerek daralt.</p></div>`
    );
  }
  function head(title, back) {
    return `<div class="box ic-head">${back ? `<button type="button" class="btn small" data-icgo="home">‹ Geri</button>` : ''}<h2>${title}</h2></div>`;
  }
  /* Akşam raporu portaldan: BS raporu sekmesindeki metin mağaza ⇄ BS sohbetine rapor kartı olarak düşer; aynı gün yeniden gönderilirse güncellenir. Mesai kilidi rapora uygulanmaz. */
  const BSK = {
    rapor: '📋 Akşam raporu',
    skt: '✅ Sabah SKT dönüşü',
    iade: '📦 Kontrol / iade dönüşü',
    liste: '📊 Bilgi listesi'
  };
  window.__bsGonder = (tur, key, text) => {
    const L = (D.messages.me = D.messages.me || []),
      g = giris(),
      k = tur + ':' + key,
      old = L.find(m => m.rapor === k),
      at = new Date().toISOString();
    if (old) {
      old.text = text;
      old.at = at;
      old.guncel = true;
      L.splice(L.indexOf(old), 1);
      L.push(old);
    } else L.push({ from: 'magaza', text, at, rapor: k, tur, by: g ? g.ad : '' });
    save();
    if (window.__renderIc) window.__renderIc();
    updBell();
    return old ? 2 : 1;
  };
  window.__rpPortal = (text, date) => window.__bsGonder('rapor', date || today(), text);
  function bubbleList(id) {
    const L = D.messages[id] || [],
      mine = D.role === 'bs' ? 'bs' : 'magaza';
    return `<div class="ic-chat" id="icChat">${L.length ? L.map(m => `<div class="ic-msg ${m.from === mine ? 'me' : 'them'}${m.rapor ? ' rp' : ''}">${m.rapor ? `<p class="ic-rp">${BSK[m.tur || 'rapor']}${m.guncel ? ' · güncellendi' : ''}${m.by ? ' · ' + esc(m.by) : ''}</p>` : ''}<div>${esc(m.text)}</div><small>${m.from === 'bs' ? 'BS' : esc(S(id).name)} · ${when(m.at)}</small></div>`).join('') : '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok.</p>'}</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="Mesaj yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="${id}" aria-label="Gönder">➤</button></div>`}`;
  }
  function respTable(r) {
    const R = D.responses[r.id] || {},
      rows = [];
    if (r.type === 'kontrol') {
      r.to.forEach(id => {
        const x = R[id];
        r.items.forEach((it, i) => {
          const v = x && x.items[i];
          rows.push([
            S(id).name,
            it.code,
            it.name,
            v ? (RCST.find(z => z[0] === v.st) || [, ''])[1] : 'Yanıt yok',
            v && v.qty != null ? String(v.qty) : ''
          ]);
        });
      });
      return { cols: ['Mağaza', 'Ürün kodu', 'Ürün adı', 'Durum', 'Adet'], rows };
    }
    if (r.type === 'bilgi') {
      r.to.forEach(id => {
        const x = R[id];
        if (x) x.rows.forEach(rw => rows.push([S(id).name, ...r.cols.map((_, c) => rw[c] || '')]));
        else rows.push([S(id).name, ...r.cols.map((_, c) => (c === 0 ? 'Yanıt yok' : ''))]);
      });
      return { cols: ['Mağaza', ...r.cols], rows };
    }
    r.to.forEach(id => {
      const x = R[id];
      rows.push([
        S(id).name,
        x ? (x.done ? 'Yapıldı' : 'Yapılmadı') : 'Yanıt yok',
        x && !x.done ? x.reason || '' : '',
        x ? when(x.at) : ''
      ]);
    });
    return { cols: ['Mağaza', 'Durum', 'Neden yapılmadı', 'Saat'], rows };
  }

  function reqTable(r) {
    const T = respTable(r);
    if (!(ui.page === 'req' && ui.id === r.id && ui.sel)) return T;
    const names = ui.sel.map(id => S(id).name);
    return { cols: T.cols, rows: T.rows.filter(rw => names.includes(rw[0])) };
  }
