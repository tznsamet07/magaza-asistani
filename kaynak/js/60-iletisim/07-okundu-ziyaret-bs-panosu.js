  /* Okundu bilgisi: mağaza talebi açınca işaretlenir; yanıt veren mağaza okumuş sayılır */
  D.okundu = D.okundu || {};
  if (!D.okSeed) {
    D.okSeed = 1;
    D.requests.forEach(r => {
      const R = D.responses[r.id] || {},
        O = (D.okundu[r.id] = D.okundu[r.id] || {});
      r.to.forEach((id, k) => {
        if (id === 'me' || R[id] || O[id]) return;
        if ((k * 7 + r.title.length) % 5 < 3)
          O[id] = new Date(new Date(r.at).getTime() + (20 + k * 9) * 60000).toISOString();
      });
    });
    save();
  }
  const readAt = (r, id) => (D.okundu[r.id] || {})[id] || ((D.responses[r.id] || {})[id] || {}).at || null;
  const readN = r => r.to.filter(id => readAt(r, id)).length;
  function markRead(r) {
    if (!r || !r.to.includes('me')) return;
    const O = (D.okundu[r.id] = D.okundu[r.id] || {});
    if (!O.me) {
      O.me = new Date().toISOString();
      save();
    }
  }
  /* Örnek kanıt fotoğrafı (sunumda diğer mağazaların yanıtları için çizilir) */
  function demoFoto(label) {
    try {
      const c = document.createElement('canvas');
      c.width = 480;
      c.height = 360;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 360);
      g.addColorStop(0, '#dfe7e2');
      g.addColorStop(1, '#b9c7be');
      x.fillStyle = g;
      x.fillRect(0, 0, 480, 360);
      for (let i = 0; i < 4; i++) {
        x.fillStyle = '#7d8c84';
        x.fillRect(30, 60 + i * 72, 420, 8);
        for (let j = 0; j < 9; j++) {
          x.fillStyle = ['#e2574c', '#f2c14e', '#4a90d9', '#2f8f6b', '#9b59b6'][(i * 3 + j) % 5];
          x.fillRect(38 + j * 46, 22 + i * 72, 36, 38);
        }
      }
      x.fillStyle = 'rgba(0,0,0,.55)';
      x.fillRect(0, 316, 480, 44);
      x.fillStyle = '#fff';
      x.font = 'bold 20px sans-serif';
      x.fillText(label, 14, 345);
      const d = c.toDataURL('image/jpeg', 0.7);
      return { name: 'kanit.jpg', type: 'image/jpeg', size: Math.round(d.length * 0.75), data: d };
    } catch (e) {
      return null;
    }
  }
  /* Mağaza ziyaret formu (BS doldurur, puanlanır) */
  const ZK = [
    ['kasa', 'Kasa önü düzeni'],
    ['raf', 'Raf ve planogram'],
    ['skt', 'SKT ve tazelik'],
    ['temiz', 'Temizlik'],
    ['depo', 'Depo düzeni'],
    ['etiket', 'Fiyat etiketleri'],
    ['aktuel', 'Aktüel alanı'],
    ['personel', 'Personel ve kıyafet']
  ];
  const ZV = [
    [2, 'Uygun'],
    [1, 'Kısmen'],
    [0, 'Uygun değil']
  ];
  const zSkor = p => Math.round((ZK.reduce((a, [k]) => a + (p[k] || 0), 0) * 100) / (ZK.length * 2));
  if (!Array.isArray(D.ziyaret)) {
    D.ziyaret = D.stores
      .filter((_, k) => k % 3 !== 2)
      .map((st, k) => {
        const p = {};
        ZK.forEach(([z], j) => {
          p[z] = (k + j * 3) % 7 === 0 ? 0 : (k * j) % 4 === 1 ? 1 : 2;
        });
        return {
          id: uid(),
          store: st.id,
          at: isoAt(14, 30, -(2 + k * 3)),
          bs: 'Bölge sorumlusu',
          puan: p,
          not: k % 2 ? 'Depo girişi toparlanmalı.' : 'Genel olarak iyi.',
          files: [],
          goruldu: st.id === 'me' ? null : isoAt(15, 0, -(2 + k * 3))
        };
      });
    save();
  }
  function zBox(id) {
    const Z = D.ziyaret.filter(z => z.store === id).sort((a, b) => b.at.localeCompare(a.at));
    return `<div class="box"><div class="gf-head"><h2>Mağaza ziyareti</h2>${Z[0] ? `<span class="pn-z ${zCls(zSkor(Z[0].puan))}">Son: %${zSkor(Z[0].puan)}</span>` : ''}</div>${
      Z.length
        ? `<ul class="zy-list">${Z.slice(0, 3)
            .map(
              z =>
                `<li data-zyv="${z.id}"><span>${fmtD(z.at.slice(0, 10))} · ${esc(z.bs)}</span><b class="pn-z ${zCls(zSkor(z.puan))}">%${zSkor(z.puan)}</b></li>`
            )
            .join('')}</ul>`
        : '<p class="hint" style="margin:6px 0 0">Bu mağazaya henüz ziyaret formu doldurulmadı.</p>'
    }
  ${giris() && giris().tip === 'bs' ? `<button type="button" class="btn primary" data-zynew="${id}" style="width:100%;margin-top:10px">Ziyaret formu doldur</button>` : ''}</div>`;
  }
  function zView(z) {
    const sk = zSkor(z.puan);
    return (
      head('Ziyaret · ' + esc(S(z.store).name), true) +
      `<div class="box"><div class="zy-skor ${zCls(sk)}" style="margin-top:0"><b>%${sk}</b><span>${fmtD(z.at.slice(0, 10))} · ${esc(z.bs)}</span></div>
  <ul class="zy-items">${ZK.map(([k, l]) => {
    const v = z.puan[k];
    return `<li><span>${l}</span><em class="zv${v}">${(ZV.find(x => x[0] === v) || [0, '—'])[1]}</em></li>`;
  }).join('')}</ul>${z.not ? `<p style="margin:10px 0 0"><b>Not:</b> ${esc(z.not)}</p>` : ''}${attHtml(z.files)}${
    z.gorev && D.requests.find(r => r.id === z.gorev)
      ? (() => {
          const r = D.requests.find(q => q.id === z.gorev),
            ok = answered(r, z.store);
          return `<button type="button" class="box ic-bsrow" data-icreq="${r.id}" style="width:100%;box-sizing:border-box;margin:12px 0 0;text-align:left;font:inherit;color:inherit;border:0;cursor:pointer"><div class="ic-av zy ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '!'}</div><div class="ic-sm"><b>Eksikler görevi</b><small>${ok ? 'Mağaza düzeltti, fotoğrafı gönderdi' : 'Mağazanın düzeltmesi bekleniyor'}</small></div><span class="ic-go">›</span></button>`;
        })()
      : ''
  }</div>`
    );
  }
  /* BS panosu: eksik sayısı, sıralama ve hatırlatma */
  function eksikler() {
    const I = ist(),
      ev = new Date().getHours() >= 20,
      out = [];
    D.stores.forEach(s => {
      const w = [];
      if (I.skt && !msktOf(s.id)) w.push('sabah SKT');
      if (I.rapor && ev && !raporOf(s.id)) w.push('akşam raporunu');
      if (w.length) out.push({ s, what: w.join(' ve '), w });
    });
    return out;
  }
  function eksikN(s) {
    const I = ist();
    return (
      (I.skt && !msktOf(s.id) ? 1 : 0) +
      (I.rapor && new Date().getHours() >= 20 && !raporOf(s.id) ? 1 : 0) +
      D.requests.filter(q => q.to.includes(s.id) && !answered(q, s.id)).length
    );
  }
  function bsSorted() {
    return D.stores
      .map((s, i) => ({ s, i, n: eksikN(s) }))
      .sort((a, b) => (b.n > 0) - (a.n > 0) || b.n - a.n || a.i - b.i)
      .map(x => x.s);
  }
