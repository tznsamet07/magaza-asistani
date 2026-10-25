  /* --- sevkiyat: depo her aracı (gün, saat, plaka, şoför) ve aracın gideceği 3-4 mağazayı teslim sırasıyla girer.
   Araçtaki her mağaza aynı aracı ve kendi sırasını görür; MS ve MSY görür, personel BS izin verirse görür --- */
  const PLK = [
    '38 BMK 417',
    '38 ADR 902',
    '38 KYS 115',
    '38 TLS 640',
    '38 HCL 288',
    '38 INC 731',
    '38 ERC 059',
    '38 MLK 364'
  ];
  function seedSevk() {
    const R = [
      [['me', 's2', 's4', 's6'], 1, '07:30', 'Soğuk zincir ürünleri önce indirilsin.'],
      [['s3', 's5', 's8'], 0, '06:45', ''],
      [['s7', 's3', 'me'], 2, '08:15', ''],
      [['s2', 's6', 's8', 's4'], 2, '06:30', '']
    ];
    return R.map(([L, d, saat, not], k) => {
      const ids = L.filter(id => D.stores.some(s => s.id === id));
      return {
        id: uid(),
        stores: ids,
        store: ids[0],
        tarih: dstr(d),
        saat,
        plaka: PLK[k % PLK.length],
        sofor: ['Hasan K.', 'Yusuf A.', 'Kemal T.', 'Osman D.'][k % 4],
        not,
        at: isoAt(17, 0, -1)
      };
    });
  }
  if (!Array.isArray(D.sevk) || D.sevk.some(x => !Array.isArray(x.stores))) {
    D.sevk = seedSevk();
    save();
  }
  iseInit();
  const canSevk = () => {
    const g = giris();
    if (!g) return false;
    if (g.tip !== 'magaza') return true;
    return document.body.dataset.role !== 'staff' || !!((D.yetki || {}).me || {}).v;
  };
  const gunAd = t => (t === today() ? 'Bugün' : t === dstr(1) ? 'Yarın' : fmtD(t));
  const durak = x => (Array.isArray(x.stores) && x.stores.length ? x.stores : [x.store]);
  const sevkOf = id =>
    D.sevk
      .filter(x => durak(x).includes(id) && x.tarih >= today())
      .sort((a, b) => (a.tarih + a.saat).localeCompare(b.tarih + b.saat));
  function sevkCard(x, del, st, forId) {
    const L = durak(x),
      i = forId ? L.indexOf(forId) : -1;
    const dur = st
      ? `<ol class="sk-dur">${L.map(id => {
          const o = MG() && MG().bul(S(id).name);
          return `<li><b>${esc(S(id).name)}</b>${o ? `<small>${esc(o.adres)}</small>` : ''}</li>`;
        }).join('')}</ol>`
      : L.length > 1
        ? `<p class="sk-sira">${i >= 0 ? `<b>${i + 1}. ${D.role === 'bs' ? 'sırada' : 'sıradasın'}</b> · ` : ''}Araç ${L.length} mağazaya gidiyor: ${L.map((id, j) => `<span${j === i ? ' class="on"' : ''}>${j + 1}. ${esc(S(id).name.replace(/\s+[A-Z0-9]\d{3,5}$/, ''))}</span>`).join(', ')}</p>`
        : '';
    return `<div class="sv-k"><div class="sk-when"><b>${gunAd(x.tarih)}</b><span>${esc(x.saat)}</span></div><div class="sk-main"><div class="sk-plaka">${esc(x.plaka)}</div><small>${x.sofor ? 'Şoför: ' + esc(x.sofor) : ''}${x.not ? ' · ' + esc(x.not) : ''}</small>${dur}</div>${del ? `<button type="button" class="nt-x" data-skdel="${x.id}" aria-label="Sil">×</button>` : ''}</div>`;
  }
  function sevkBox(id) {
    if (!canSevk()) return '';
    const L = sevkOf(id);
    return `<div class="box"><h2>Sevkiyat</h2>${L.length ? L.map(x => sevkCard(x, false, false, id)).join('') : '<p class="hint" style="margin:6px 0 0">Planlanmış sevkiyat yok.</p>'}</div>`;
  }

  function grupSeenKey() {
    const g = giris();
    return 'grup:' + nrm(g && g.ad);
  }
  function grupUnread() {
    const g = giris();
    if (!g || g.tip !== 'magaza') return [];
    const me = nrm(g.ad),
      seen = (D.seen || {})[grupSeenKey()] || '';
    return D.grup.filter(m => nrm(m.from) !== me && m.at > seen);
  }
  function markGrup() {
    D.seen = D.seen || {};
    D.seen[grupSeenKey()] = new Date().toISOString();
    save();
  }
  function shared(r) {
    return D.grup.some(m => m.share && m.share.id === r.id);
  }
  function shareBtn(r) {
    if (isStaff()) return '';
    if (shared(r)) return `<p class="gs-done">✓ Mağaza grubuyla paylaşıldı</p>`;
    return ui.shareOpen
      ? `<div class="sf gs-form"><label>Ekibe not (isteğe bağlı)<input id="gsNot" autocomplete="off" placeholder="Örn. Akşam vardiyası ilgilensin"></label><div class="gs-act"><button type="button" class="btn" data-gscancel>Vazgeç</button><button type="button" class="btn primary" data-gsgo="${r.id}">Gruba gönder</button></div></div>`
      : `<button type="button" class="btn gs-btn" data-gsopen>${GRP_IC}Mağaza grubuyla paylaş</button>`;
  }
  function shareCard(x) {
    return `<div class="gs-card"><span class="ic-type t-${x.type}">BS · ${TYPES[x.type] || ''}</span><b>${esc(x.title)}</b>${x.body ? `<p>${esc(x.body)}</p>` : ''}${
      x.items && x.items.length
        ? `<ul>${x.items
            .slice(0, 6)
            .map(it => `<li>${esc(it.code)} ${esc(it.name)}</li>`)
            .join('')}</ul>`
        : ''
    }</div>`;
  }
  function grupList() {
    const g = giris(),
      me = nrm(g && g.ad);
    return `<div class="ic-chat" id="icChat">${
      D.grup.length
        ? D.grup
            .map(m => {
              const mine = nrm(m.from) === me;
              return `<div class="ic-msg ${mine ? 'me' : 'them'}${m.share ? ' gs' : ''}">${mine ? '' : `<b class="gm-who">${esc(m.from)} <small>${KISA[m.unvan] || ''}</small></b>`}${m.share ? shareCard(m.share) : ''}${m.text ? `<div>${esc(m.text)}</div>` : ''}<small>${when(m.at)}</small></div>`;
            })
            .join('')
        : '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok.</p>'
    }</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="Gruba yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="grup" aria-label="Gönder">➤</button></div>`}`;
  }
  function grupSim() {
    if (kilitli()) return;
    const g = giris(),
      me = nrm(g && g.ad),
      O = staffOf('me').filter(p => nrm(p.ad) !== me);
    if (!O.length || Math.random() < 0.35) return;
    const p = O[rnd(0, O.length - 1)];
    setTimeout(
      () => {
        D.grup.push({
          from: p.ad,
          unvan: p.unvan,
          text: ['Tamam 👍', 'Anlaşıldı.', 'Ben hallederim.', 'Tamamdır, teşekkürler.'][rnd(0, 3)],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden && ui.page === 'grup') render();
        else updBell();
      },
      2500 + rnd(0, 2500)
    );
  }
  function simSv(s) {
    if (s.store === 'me') return;
    setTimeout(
      () => {
        const x = D.savunma.find(y => y.id === s.id);
        if (!x || x.cevap) return;
        x.cevap = { text: svText(x), at: new Date().toISOString() };
        save();
        if (!$('icView').hidden) render();
        else updBell();
      },
      6000 + rnd(0, 3000)
    );
  }
  function svForm() {
    return { store: '', kisi: '', olay: '', tarih: today(), son: dstr(2), aciklama: '' };
  }
  function readSv() {
    const f = ui.form;
    if (!f) return;
    if ($('svT')) f.tarih = $('svT').value;
    if ($('svSon')) f.son = $('svSon').value;
    if ($('svA')) f.aciklama = $('svA').value;
  }
  function svRow(s, bs) {
    const d = svDurum(s);
    return `<li data-${bs ? 'icsv' : 'icsvans'}="${s.id}"><div><span class="ic-type t-savunma">Savunma</span><b>${bs ? esc(s.ad) + ' <small>' + (KISA[s.unvan] || '') + ' · ' + esc(S(s.store).name) + '</small>' : esc(s.olay)}</b><small>${bs ? esc(s.olay) + ' · ' : ''}${s.cevap ? when(s.cevap.at) + ' yanıtlandı' : 'son gün ' + fmtD(s.son)}</small></div><span class="ic-st sv-${d[0]}">${d[1]}</span></li>`;
  }
  function svAlerts() {
    return D.savunma
      .filter(s => isMine(s) && !s.cevap)
      .map(
        s =>
          `<button type="button" class="sv-alert" data-icsvans="${s.id}"><span><b>Savunman isteniyor</b><span>${esc(s.olay)} · son gün ${fmtD(s.son)}</span></span><span class="ic-go">›</span></button>`
      )
      .join('');
  }
  function svMine() {
    const L = D.savunma.filter(s => isMine(s) && s.cevap);
    return L.length
      ? `<div class="box"><h2>Savunmalarım</h2><ul class="ic-reqs">${L.map(s => svRow(s, false)).join('')}</ul></div>`
      : '';
  }
  function svInfo(s) {
    return `<dl class="sv-dl"><dt>Olay</dt><dd>${esc(s.olay)}</dd><dt>Olay tarihi</dt><dd>${fmtL(s.tarih)}</dd><dt>İsteyen</dt><dd>${esc(s.bs)} (BS)</dd><dt>İstendi</dt><dd>${when(s.at)}</dd><dt>Son yanıt</dt><dd>${fmtL(s.son)}</dd></dl><p class="sv-txt">${esc(s.aciklama)}</p>`;
  }
  function svPrint(s) {
    const st = S(s.store).name,
      row = (k, v) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`;
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Savunma - ${esc(s.ad)}</title><style>body{font:14px/1.5 Arial,Helvetica,sans-serif;color:#000;margin:32px}h1{font-size:19px;text-align:center;margin:0 0 4px;letter-spacing:.02em}p.c{text-align:center;margin:0 0 18px;color:#444}table{width:100%;border-collapse:collapse;margin:10px 0 16px}td{border:1px solid #888;padding:6px 8px;vertical-align:top}td:first-child{width:30%;font-weight:bold;background:#f2f2f2}h2{font-size:14px;margin:14px 0 4px}.t{border:1px solid #888;padding:10px;min-height:110px;white-space:pre-wrap}.imza{display:flex;justify-content:space-between;margin-top:56px}.imza div{width:42%;border-top:1px solid #000;padding-top:6px;text-align:center}</style></head><body>
<h1>SAVUNMA İSTEM VE SAVUNMA FORMU</h1><p class="c">${esc(st)}</p>
<table>${row('Adı soyadı', s.ad)}${row('Görevi', UNVAN[s.unvan] || s.unvan)}${row('Mağaza', st)}${row('Olay', s.olay)}${row('Olay tarihi', fmtL(s.tarih))}${row('Savunma isteyen', s.bs + ' (Bölge sorumlusu)')}${row('İstem tarihi', new Date(s.at).toLocaleString('tr-TR'))}${row('Son yanıt tarihi', fmtL(s.son))}</table>
<h2>Olayın açıklaması</h2><div class="t">${esc(s.aciklama)}</div>
<h2>Savunma</h2><div class="t">${s.cevap ? esc(s.cevap.text) : ''}</div>${s.cevap ? `<p>Gönderildi: ${new Date(s.cevap.at).toLocaleString('tr-TR')}</p>` : ''}
${s.sonuc ? `<h2>Sonuç</h2><div class="t" style="min-height:0">${esc(s.sonuc.karar)}${s.sonuc.not ? '\n' + esc(s.sonuc.not) : ''}</div>` : ''}
<div class="imza"><div>Savunma veren<br>${esc(s.ad)}</div><div>Bölge sorumlusu<br>${esc(s.bs)}</div></div></body></html>`;
    const fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(fr);
    const d = fr.contentWindow.document;
    d.open();
    d.write(html);
    d.close();
    setTimeout(() => {
      try {
        fr.contentWindow.focus();
        fr.contentWindow.print();
      } catch (e) {}
      setTimeout(() => fr.remove(), 60000);
    }, 300);
  }
  function showNote(title, body, ref) {
    const n = $('icNote');
    if (!n) return;
    n.innerHTML = `<button type="button" class="ic-note-x" aria-label="Kapat">×</button><b>${esc(title)}</b><span>${esc(body)}</span>`;
    n.dataset.req = ref.req || '';
    n.dataset.sv = ref.sv || '';
    n.hidden = false;
    clearTimeout(n._t);
    n._t = setTimeout(() => {
      n.hidden = true;
    }, 8000);
  }

