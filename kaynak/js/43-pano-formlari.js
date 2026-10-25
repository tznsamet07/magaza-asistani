/* ===== Pano formları: sipariş gün ve grupları, mevcut listesi, yıllık gelişim ve masraf takip ===== */
(function () {
  const V = window.__vardiya;
  if (!V) return;
  const $ = id => document.getElementById(id),
    esc = V.esc;
  const GUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    GK = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const AY = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık'
  ];
  const pad = n => String(n).padStart(2, '0');
  const giris = () => window.__giris && window.__giris();
  const yetkili = () => {
    const g = giris();
    return !g || (g.tip === 'magaza' && ['MS', 'MSY'].includes(g.unvan));
  };
  const num = v => {
    let s = String(v == null ? '' : v).replace(/[\s₺%]/g, '');
    if (!s) return null;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const x = parseFloat(s);
    return isFinite(x) ? x : null;
  };
  const fN = (n, d) =>
    n == null || !isFinite(n)
      ? ''
      : n.toLocaleString('tr-TR', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: 0 });
  const fP = n => (n == null || !isFinite(n) ? '' : (n > 0 ? '+' : '') + fN(n, 2));
  const pct = (a, b) => (a != null && b ? (a / b - 1) * 100 : null);

  /* ---- veri (vardiya kaydının içinde, telefon başına) ---- */
  const YIL = () => new Date().getFullYear();
  function P() {
    const s = V.state();
    if (!s.pano) s.pano = {};
    const p = s.pano;
    if (!p.sip)
      p.sip = {
        ornek: true,
        days: [
          { s: ['Fresh', 'K.Et'], t: ['Sevkiyat', 'Poşet ekmek', 'Banka', 'Golf / Algida'] },
          { s: ['Normal', 'Tavuk'], t: ['Sevkiyat', 'Tavuk', 'Fresh'] },
          { s: ['Normal', 'K.Et', 'Tavuk'], t: ['Poşet ekmek'] },
          { s: ['Tavuk', 'Fresh'], t: ['Sevkiyat', 'Tavuk'] },
          { s: ['Normal', 'Tavuk', 'K.Et'], t: ['Sevkiyat', 'Fresh', 'Tavuk', 'Banka'] },
          { s: ['Normal'], t: ['Tavuk'] },
          { s: [], t: [] }
        ]
      };
    if (!p.yg) p.yg = {};
    if (!p.yg[YIL()]) p.yg[YIL()] = ygOrnek();
    if (!p.mf) p.mf = {};
    if (!p.mf[YIL()]) p.mf[YIL()] = mfOrnek();
    if (!p.imza) p.imza = {};
    return p;
  }
  function ygOrnek() {
    const mk = (ad, c2, c1, b, g, m1, m, ex) => {
      const o = { ad, ornek: true, m: {} };
      for (let i = 0; i < 12; i++) {
        const r = { c2: c2[i], c1: c1[i], b: b[i], m1: m1[i] };
        if (g[i] != null) r.g = g[i];
        if (m[i] != null) r.m = m[i];
        Object.assign(r, (ex && ex[i]) || {});
        o.m[i + 1] = r;
      }
      return o;
    };
    const k = a => a.map(x => (x == null ? null : x * 1000));
    return {
      mg: mk(
        'Mağazam',
        k([58.2, 63.4, 68.9, 67.1, 69.3, 70.8, 70.2, 71.5, 72.9, 73.4, 75.6, 81.3]),
        k([73.1, 92.6, 87.9, 80.4, 88.2, 87.5, 89.3, 88.1, 92.7, 83.2, 86.0, 89.9]),
        k([88, 104, 121, 99, 124, 122, 117, 117, 113, 106, 101, 101]),
        k([89.6, 108.9, 100.8, 99.3, 108.1, 104.7, 109.8, 111.9, 110.2]),
        [452, 471, 464, 454, 473, 455, 437, 428, 466, 466, 450, 418],
        [384, 418, 400, 401, 383, 411, 396, 388, 407],
        {
          0: {
            e1d: -0.69,
            e1k: -0.69,
            ed: -1.2,
            ek: -1.2,
            ef: -1.1,
            p1d: 10.4,
            p1k: 10.4,
            pd: 11.6,
            pk: 11.6,
            s1: 0.84,
            s: 1.79
          },
          1: { ed: -1.1, ek: -1.15, p1d: 9.8, p1k: 10.1, pd: 10.4, pk: 11.0, s1: 1.66, s: 1.6 },
          2: { e1d: -0.56, e1k: -0.6, p1d: 9.5, p1k: 9.9, pd: 10.2, pk: 10.6, s1: 1.4, s: 1.49 },
          3: { s1: 1.17, s: 1.37 },
          4: { s1: 1.51, s: 1.35 },
          5: { e1d: -0.72, e1k: -0.66, s1: 1.46, s: 1.22 },
          6: { s1: 1.59, s: 1.07 },
          7: { e1d: -0.39, e1k: -0.58, s1: 1.61, s: 1.4 },
          8: { s1: 1.66 },
          9: { s1: 1.58 },
          10: { e1d: -0.9, e1k: -0.5, s1: 1.7 },
          11: { e1d: -1.5, e1k: -0.8, s1: 1.62 }
        }
      ),
      es: mk(
        'Eşdeğer mağaza',
        k([59.1, 62.5, 66.0, 61.7, 65.0, 71.0, 67.2, 70.7, 77.7, 69.4, 74.6, 80.7]),
        k([78.4, 84.8, 90.6, 85.3, 87.6, 86.0, 101.4, 105.6, 96.6, 95.8, 98.0, 105.1]),
        k([99, 114, 113, 113, 124, 121, 133, 137, 134, 125, 124, 126]),
        k([104.6, 116.2, 124.6, 123.4, 124.5, 124.0, 132.9, 131.0, 131.4]),
        [385, 418, 425, 418, 405, 398, 400, 423, 411, 396, 407, 385],
        [365, 405, 433, 407, 426, 396, 392, 410],
        null
      )
    };
  }
  function mfOrnek() {
    const r = {},
      put = (k, a) => {
        r[k] = {};
        a.forEach((v, i) => {
          if (v !== '' && v != null) r[k][i + 1] = String(v);
        });
      };
    put('elk1', [
      '74/81',
      '78/92',
      '75/86',
      '80/89',
      '91/103',
      '129/121',
      '142/155',
      '145/148',
      '122/132',
      '96/101',
      '80/101',
      '77/90'
    ]);
    put('elk', ['78/83', '79/88', '80/86', '79/97', '86/98', '116/140', '142/182', '142/169', '119/144']);
    put('su1', ['4/3', '3/5', '2/2', '4/3', '2/3', '3/2', '4/4', '2/2', '4/3', '3/3', '3/3', '2/3']);
    put('su', ['3/3', '3/4', '3/3', '4/6', '4/4', '4/7', '4/6', '4/5', '4/6']);
    put('mut', ['590', '500', '405', '472', '149,5', '180,5', '180', '125', '139']);
    put('tem', ['654', '678', '515', '699,5', '1017,5', '943,5', '957', '780', '770']);
    put('pos', ['1', '1', '1', '1', '1', '2', '', '2', '']);
    return { ornek: true, info: { m2: '11 / 25', dolap: '5 / 2' }, r };
  }
  const save = () => V.save();

  /* ---- tam ekran sayfa ---- */
  let acik = null;
  function sayfa(id, baslik, html) {
    acik = id;
    $('pfT').textContent = baslik;
    $('pfBody').innerHTML = html;
    $('pfDlg').hidden = false;
    document.body.classList.add('pf-on');
  }
  function kapat() {
    acik = null;
    $('pfDlg').hidden = true;
    $('pfBody').innerHTML = '';
    document.body.classList.remove('pf-on');
  }
  $('pfX').addEventListener('click', kapat);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && acik) kapat();
  });
  const yenile = () => {
    if (acik === 'sip') sipAc();
    else if (acik === 'mv') mvAc(mvYm);
  };

  /* ===== 1) Sipariş gün ve grupları ===== */
  const bugunK = () => (new Date().getDay() + 6) % 7;
  const chips = (L, c) =>
    L.length ? L.map(x => `<span class="pf-chip ${c}">${esc(x)}</span>`).join('') : '<span class="pf-none">Yok</span>';
  let sipEd = false;
  function sipAc() {
    const S = P().sip,
      t = bugunK(),
      y = yetkili();
    const h = `<p class="hint" style="margin:0 0 10px"><span class="pf-chip pf-s">Kırmızı</span> o gün verilecek sipariş, <span class="pf-chip pf-t">mavi</span> o gün mağazaya gelen (sevkiyat ve teslimler).${S.ornek ? ' Bağyaka panosundaki formdan alındı.' : ''}</p>
  <ul class="pf-days">${S.days.map((d, i) => `<li class="${i === t ? 'bugun' : ''}"><b>${GUN[i]}${i === t ? ' <em>Bugün</em>' : ''}</b>${sipEd ? `<label>Sipariş<input data-sip="${i}:s" value="${esc(d.s.join(', '))}" placeholder="Örn. Normal, Tavuk"></label><label>Gelen<input data-sip="${i}:t" value="${esc(d.t.join(', '))}" placeholder="Örn. Sevkiyat, Fresh"></label>` : `<div><small>Sipariş</small>${chips(d.s, 'pf-s')}</div><div><small>Gelen</small>${chips(d.t, 'pf-t')}</div>`}</li>`).join('')}</ul>
  ${y ? `<div class="simp-act" style="margin-top:12px">${sipEd ? '<button type="button" class="btn primary" data-pf="sipok" style="flex:1">Kaydet</button>' : '<button type="button" class="btn" data-pf="siped" style="flex:1">Düzenle</button>'}</div>${sipEd ? '<p class="hint">Grupları virgülle ayır. Değişiklik bu telefondaki herkesin ana sayfasına yansır.</p>' : ''}` : '<p class="hint">Günleri mağaza sorumlusu ve yardımcısı düzenler.</p>'}`;
    sayfa('sip', 'Sipariş gün ve grupları', h);
  }
  window.__sipBugun = () => {
    const S = P().sip,
      d = S.days[bugunK()],
      y = S.days[(bugunK() + 1) % 7];
    return { s: d.s, t: d.t, ys: y.s, yt: y.t };
  };

  /* ===== 2) Mevcut listesi (vardiyadan) ===== */
  let mvYm = null;
  const imzaKey = r => r.days.map(d => d.c + (d.c === 'w' ? d.h : '')).join(',');
  const hc = n => fN(n, 1);
  function mvAc(ym) {
    mvYm = ym || mvYm || YIL() + '-' + pad(new Date().getMonth() + 1);
    const [y, m] = mvYm.split('-').map(Number),
      dim = new Date(y, m, 0).getDate();
    const R = V.mevcut(mvYm),
      I = P().imza[mvYm] || {},
      g = giris(),
      ben = g && g.empId,
      hol = new Set((V.state().holidays || []).map(h => h.d));
    const RL = { MS: 'M.S.', MSY: 'M.S.Y.', GT: 'G.T.', PER: 'PER.', PART: 'PART' };
    const gunH = [...Array(dim)]
      .map((_, i) => {
        const dt = new Date(y, m - 1, i + 1, 12),
          wd = (dt.getDay() + 6) % 7,
          ds = `${mvYm}-${pad(i + 1)}`;
        return `<th class="${wd === 6 ? 'pz' : ''}${hol.has(ds) ? ' rt' : ''}">${i + 1}<br><small>${GK[wd].slice(0, 2)}</small></th>`;
      })
      .join('');
    const sat = r => {
      let top = 0,
        is = 0,
        mola = 0,
        b = 0,
        yi = 0,
        ra = 0,
        rt = 0,
        bos = 0;
      r.days.forEach((d, i) => {
        const ds = `${mvYm}-${pad(i + 1)}`;
        if (d.c === 'w') {
          top += d.h;
          mola += d.mola * 60;
          if (hol.has(ds)) rt += d.h;
        } else if (d.c === 'B') b++;
        else if (d.c === 'Y') {
          yi++;
          is += d.h;
        } else if (d.c === 'R') {
          ra++;
          is += d.h;
        } else if (d.c === 'H') is += d.h;
        else if (!d.plan) bos++;
      });
      return { top, is, mola, b, yi, ra, rt, bos };
    };
    let eksik = 0;
    const rows = R.map(r => {
      const s = sat(r);
      eksik = Math.max(eksik, s.bos);
      const im = I[r.id],
        gec = im && im.k !== imzaKey(r);
      const hcell = r.days
        .map((d, i) => `<td class="${d.c && d.c !== 'w' ? 'harf' : ''}">${d.c === 'w' ? hc(d.h) : d.c || ''}</td>`)
        .join('');
      const dcell = r.days
        .map(d => `<td class="dk">${d.c === 'w' ? Math.round(d.mola * 60) : d.c && d.c !== 'w' ? '×' : ''}</td>`)
        .join('');
      const imz =
        im && !gec
          ? `<span class="pf-ok">✓ ${new Date(im.at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>`
          : gec
            ? '<span class="pf-warn">Vardiya değişti</span>'
            : '<span class="pf-none">Bekliyor</span>';
      return `<tr><th rowspan="2" class="ad">${esc(r.name)}<small>${RL[r.role] || esc(r.role)}</small></th>${hcell}<td class="tt">${hc(s.top + s.is)}</td><td class="tt">${hc(r.fiks)}</td><td class="tt ${s.top + s.is - r.fiks < -0.01 ? 'neg' : ''}">${fP(s.top + s.is - r.fiks)}</td><td class="tt">${fN(s.mola)}</td><td class="tt">${s.b}</td><td class="tt">${s.yi}</td><td class="tt">${s.ra}</td><td class="tt">${hc(s.rt)}</td><td class="tt" rowspan="2">${imz}</td></tr><tr class="dkr">${dcell}<td colspan="8" class="dkl">Dinlenme süresi (dk)</td></tr>`;
    }).join('');
    const kim = ben && R.find(r => r.id === ben),
      kimIm = kim && I[kim.id] && I[kim.id].k === imzaKey(kim);
    const ms = g && g.tip === 'magaza' && g.unvan === 'MS',
      msOk = I._ms && I._ms.k === R.map(imzaKey).join('|');
    const h = `<div class="fnav" style="margin:0 0 8px"><button type="button" data-pf="mvp" aria-label="Önceki ay">‹</button><b>${AY[m - 1]} ${y}</b><button type="button" data-pf="mvn" aria-label="Sonraki ay">›</button></div>
  <p class="hint" style="margin:0 0 8px">Vardiya planından kendiliğinden dolar; vardiyada bir saat ya da izin değişince burası da değişir. Saatler molası düşülmüş çalışma saatidir. <b>B</b> boş gün, <b>Y</b> yıllık izin, <b>R</b> rapor, <b>H</b> bayram.${eksik ? ` Vardiyası henüz yazılmamış ${eksik} gün boş görünüyor.` : ''}</p>
  ${R.length ? `<div class="scroll pf-mvw"><table class="ctab pf-mv"><thead><tr><th>Adı</th>${gunH}<th>Toplam</th><th>Fiks</th><th>Fark</th><th>Dinl. dk</th><th>B</th><th>Y</th><th>R</th><th>Resmi tatil</th><th>İmza</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="hint">Çalışan listesi boş. Ayarlar › Çalışanlar bölümünden ekle.</p>'}
  <div class="simp-act" style="margin-top:12px;flex-wrap:wrap">${kim ? (kimIm ? '<span class="pf-ok" style="padding:8px 0">Saatlerini kontrol edip imzaladın.</span>' : `<button type="button" class="btn primary" data-pf="imza" style="flex:1 1 100%">Saatlerimi kontrol ettim, imzala</button>`) : ''}${ms ? (msOk ? '<span class="pf-ok" style="padding:8px 0">M.S. onayı verildi.</span>' : '<button type="button" class="btn" data-pf="msimza" style="flex:1 1 100%">M.S. olarak onayla</button>') : ''}<button type="button" class="btn small" data-pf="mvkop" style="flex:1 1 100%">Excel için kopyala</button></div>
  <p class="hint">Her çalışan kendi saatlerini kontrol edip imzalar. İmzadan sonra vardiyası değişirse imza düşer ve yeniden istenir.</p>`;
    sayfa('mv', 'Mevcut listesi', h);
  }
  function mvImza(ms) {
    const R = V.mevcut(mvYm),
      g = giris(),
      I = (P().imza[mvYm] = P().imza[mvYm] || {});
    if (ms) I._ms = { at: new Date().toISOString(), by: g && g.ad, k: R.map(imzaKey).join('|') };
    else {
      const r = R.find(x => x.id === (g && g.empId));
      if (!r) return;
      I[r.id] = { at: new Date().toISOString(), k: imzaKey(r) };
    }
    save();
    V.toast(ms ? 'Mevcut listesi onaylandı.' : 'İmzalandı.');
    mvAc(mvYm);
  }
  function mvKopya() {
    const [y, m] = mvYm.split('-').map(Number),
      R = V.mevcut(mvYm),
      dim = new Date(y, m, 0).getDate();
    const L = [['Adı', 'Görev', ...[...Array(dim)].map((_, i) => i + 1)].join('\t')];
    R.forEach(r => {
      L.push([r.name, r.role, ...r.days.map(d => (d.c === 'w' ? String(d.h).replace('.', ',') : d.c))].join('\t'));
      L.push(['Dinlenme (dk)', '', ...r.days.map(d => (d.c === 'w' ? Math.round(d.mola * 60) : ''))].join('\t'));
    });
    const t = L.join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      () => V.toast("Kopyalandı; Excel'e yapıştırabilirsin."),
      () => V.toast('Kopyalanamadı.')
    );
  }

  /* ===== 3) Yıllık gelişim ve hedef ciro takip formu ===== */
  const YG_F = y => [
    [
      'Ciro',
      [
        ['c2', `${y - 2} geç. ciro ort.`],
        ['c1', `${y - 1} geç. ciro ort.`],
        ['b', `${y} bütçe ort.`],
        ['g', `${y} gerç. ort.`]
      ]
    ],
    [
      'Müşteri sayısı (M.S. ort.)',
      [
        ['m1', `${y - 1}`],
        ['m', `${y}`]
      ]
    ],
    [
      'Envanter %',
      [
        ['e1d', `${y - 1} dönem`],
        ['e1k', `${y - 1} kümülatif`],
        ['ed', `${y} dönem`],
        ['ek', `${y} kümülatif`],
        ['ef', 'Env. dönem fire']
      ]
    ],
    [
      'Personel gideri %',
      [
        ['p1d', `${y - 1} dönem`],
        ['p1k', `${y - 1} kümülatif`],
        ['pd', `${y} dönem`],
        ['pk', `${y} kümülatif`],
        ['pg', 'Yıllık gelişim']
      ]
    ],
    [
      'Stok devir hızı',
      [
        ['s1', `${y - 1}`],
        ['s', `${y}`]
      ]
    ]
  ];
  let ygT = 'mg',
    ygAy = new Date().getMonth() + 1;
  const abOrt = (ym, f) => {
    const c = ((V.state().ab || {}).ciro || {})[ym],
      D =
        c && c.days
          ? Object.values(c.days)
              .map(x => x && x[f])
              .filter(x => x != null && x !== '' && isFinite(x))
          : [];
    return D.length ? D.reduce((a, b) => a + Number(b), 0) / D.length : null;
  };
  function ygVal(r, k, ay) {
    const v = r[k];
    if (v != null && v !== '') return { v: Number(v), oto: false };
    if (ygT === 'mg' && (k === 'g' || k === 'm')) {
      const a = abOrt(YIL() + '-' + pad(ay), k === 'g' ? 'ciro' : 'mus');
      if (a != null) return { v: a, oto: true };
    }
    return { v: null, oto: false };
  }
  function ygCiz() {
    const box = $('ygBody');
    if (!box) return;
    const y = YIL(),
      Y = P().yg[y],
      D = Y[ygT],
      F = YG_F(y),
      ed = yetkili();
    const r = D.m[ygAy] || (D.m[ygAy] = {});
    const sum = () => {
      const g = ygVal(r, 'g', ygAy).v,
        m = ygVal(r, 'm', ygAy).v;
      const a = [
        ['Bütçeden sapma', pct(g, num(r.b))],
        [`${y - 1}'e göre ciro`, pct(g, num(r.c1))],
        [`${y - 1}'e göre müşteri`, pct(m, num(r.m1))]
      ];
      return a
        .map(
          ([l, v]) =>
            `<div><b class="${v == null ? '' : v < 0 ? 'neg' : 'pos'}">${v == null ? '–' : '%' + fP(v)}</b><span>${l}</span></div>`
        )
        .join('');
    };
    const inp = ([k, l]) => {
      const o = ygVal(r, k, ygAy);
      return `<label>${esc(l)}<input data-yg="${k}" inputmode="decimal" value="${o.oto ? '' : esc(r[k] == null ? '' : fN(Number(r[k]), 2))}"${!ed ? ' disabled' : ''} placeholder="${o.oto ? fN(o.v) + ' (Ay başı tablosundan)' : ''}"></label>`;
    };
    // yıllık tablo
    const cols = [
      ['c2'],
      ['c1'],
      ['_g1', 'c1', 'c2'],
      ['b'],
      ['g'],
      ['_sp', 'g', 'b'],
      ['_g2', 'g', 'c1'],
      ['m1'],
      ['m'],
      ['_g3', 'm', 'm1'],
      ['e1d'],
      ['e1k'],
      ['ed'],
      ['ek'],
      ['ef'],
      ['p1d'],
      ['p1k'],
      ['pd'],
      ['pk'],
      ['pg'],
      ['s1'],
      ['s']
    ];
    const cell = (row, ay, c) => {
      if (c[0][0] === '_') {
        const a = ygVal(row, c[1], ay).v,
          b = ygVal(row, c[2], ay).v;
        const v = pct(a, b);
        return { v, t: v == null ? '' : fP(v), cl: v == null ? '' : v < 0 ? 'neg' : 'pos' };
      }
      const o = ygVal(row, c[0], ay);
      const big = ['c2', 'c1', 'b', 'g', 'm1', 'm'].includes(c[0]);
      return { v: o.v, t: o.v == null ? '' : fN(o.v, big ? 0 : 2), cl: o.oto ? 'oto' : '' };
    };
    const ort = cols.map(c => {
      const L = [];
      for (let i = 1; i <= 12; i++) {
        const v = cell(D.m[i] || {}, i, c).v;
        if (v != null) L.push(v);
      }
      if (!L.length) return '';
      const a = L.reduce((x, z) => x + z, 0) / L.length;
      return c[0][0] === '_' ? fP(a) : fN(a, ['c2', 'c1', 'b', 'g', 'm1', 'm'].includes(c[0]) ? 0 : 2);
    });
    const tb = [...Array(12)]
      .map(
        (_, i) =>
          `<tr class="${i + 1 === ygAy ? 'sec' : ''}" data-ygay="${i + 1}"><td>${AY[i]}</td>${cols
            .map(c => {
              const x = cell(D.m[i + 1] || {}, i + 1, c);
              return `<td class="${x.cl}">${x.t}</td>`;
            })
            .join('')}</tr>`
      )
      .join('');
    box.innerHTML = `<div class="ic-seg" style="margin-bottom:10px"><button type="button" data-ygt="mg" aria-pressed="${ygT === 'mg'}">Mağazam</button><button type="button" data-ygt="es" aria-pressed="${ygT === 'es'}">Eşdeğer mağaza</button></div>
  ${ygT === 'es' ? `<label class="pf-l">Eşdeğer mağazanın adı<input data-ygad value="${esc(D.ad === 'Eşdeğer mağaza' ? '' : D.ad)}" placeholder="Örn. FİNİKE"${!ed ? ' disabled' : ''}></label>` : ''}
  ${D.ornek ? '<p class="hint" style="margin:0 0 8px">Şimdilik örnek rakamlar var; kendi rakamlarını yazınca örnekler kalkar.</p>' : ''}
  <label class="pf-l">Ay<select class="ssel" data-ygay-sel>${AY.map((a, i) => `<option value="${i + 1}"${i + 1 === ygAy ? ' selected' : ''}>${a} ${y}</option>`).join('')}</select></label>
  <div class="pf-sum">${sum()}</div>
  ${F.map(([gl, L]) => `<h3 class="pf-h3">${gl}</h3><div class="pf-grid">${L.map(inp).join('')}</div>`).join('')}
  ${ygT === 'mg' ? '<p class="hint">Gerçekleşen ciro ve müşteri ortalaması boş bırakılırsa yukarıdaki aylık tablodan hesaplanır.</p>' : ''}
  <h3 class="pf-h3">${y} tablosu</h3>
  <div class="scroll"><table class="ctab pf-yg"><thead><tr class="grp"><th></th><th colspan="7">Ciro</th><th colspan="3">Müşteri</th><th colspan="5">Envanter %</th><th colspan="5">Personel gideri %</th><th colspan="2">Stok devir</th></tr>
  <tr><th>Ay</th><th>${y - 2} ort.</th><th>${y - 1} ort.</th><th>Glş %</th><th>Bütçe</th><th>Gerç.</th><th>Sapma %</th><th>Glş %</th><th>${y - 1}</th><th>${y}</th><th>Glş %</th><th>${y - 1} dön</th><th>${y - 1} küm</th><th>${y} dön</th><th>${y} küm</th><th>Fire</th><th>${y - 1} dön</th><th>${y - 1} küm</th><th>${y} dön</th><th>${y} küm</th><th>Glş</th><th>${y - 1}</th><th>${y}</th></tr></thead>
  <tbody>${tb}</tbody><tfoot><tr><td>Ort.</td>${ort.map(t => `<td>${t}</td>`).join('')}</tr></tfoot></table></div>
  <div class="simp-act" style="margin-top:10px"><button type="button" class="btn small" data-pf="ygkop">Excel için kopyala</button></div>`;
  }
  function ygKopya() {
    const y = YIL(),
      D = P().yg[y][ygT],
      ks = ['c2', 'c1', 'b', 'g', 'm1', 'm', 'e1d', 'e1k', 'ed', 'ek', 'ef', 'p1d', 'p1k', 'pd', 'pk', 'pg', 's1', 's'];
    const L = [
      [
        'Ay',
        `${y - 2} ciro ort`,
        `${y - 1} ciro ort`,
        `${y} bütçe`,
        `${y} gerç`,
        `${y - 1} müşteri`,
        `${y} müşteri`,
        'env dön -1',
        'env küm -1',
        'env dön',
        'env küm',
        'env fire',
        'pg dön -1',
        'pg küm -1',
        'pg dön',
        'pg küm',
        'pg glş',
        'sdh -1',
        'sdh'
      ].join('\t')
    ];
    for (let i = 1; i <= 12; i++) {
      const r = D.m[i] || {};
      L.push(
        [
          AY[i - 1],
          ...ks.map(k => {
            const v = ygVal(r, k, i).v;
            return v == null ? '' : String(Math.round(v * 100) / 100).replace('.', ',');
          })
        ].join('\t')
      );
    }
    const t = L.join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      () => V.toast('Kopyalandı.'),
      () => V.toast('Kopyalanamadı.')
    );
  }

  /* ===== 4) Masraf takip formu ===== */
  const MF_R = [
    ['elk1', 'Önceki yıl elektrik', 'ort. kW'],
    ['elk', 'Bu yıl elektrik', 'ort. kW'],
    ['su1', 'Önceki yıl su', 'm³'],
    ['su', 'Bu yıl su', 'm³'],
    ['tel', 'Aylık telefon ücretleri', 'TL'],
    ['fire', 'Aylık toplam fire', 'TL / oran'],
    ['mut', 'Mutfak masrafı', 'TL'],
    ['tem', 'Temizlik gideri', 'TL'],
    ['num', 'Numune dağılımı', 'TL'],
    ['jen', 'Jeneratör yakıtı', 'LT'],
    ['isi1', 'Önceki yıl ısınma', 'gaz m³ / LT'],
    ['isi', 'Bu yıl ısınma', 'gaz m³ / LT'],
    ['pos', 'Ekmek poşet gideri', 'TL / oran']
  ];
  let mfAy = new Date().getMonth() + 1;
  const sktFire = ym => {
    const L = ((V.state().skt || {}).fire || []).filter(x => String(x.at || '').slice(0, 7) === ym);
    return L.length ? L.reduce((a, x) => a + (x.price != null ? x.price * (x.qty || 1) : 0), 0) : null;
  };
  const parca = v =>
    String(v || '')
      .split('/')
      .map(num);
  function mfVal(D, k, ay) {
    const v = (D.r[k] || {})[ay];
    if (v != null && v !== '') return { t: v, oto: false };
    if (k === 'fire') {
      const f = sktFire(YIL() + '-' + pad(ay));
      if (f) return { t: fN(f, 2), oto: true };
    }
    return { t: '', oto: false };
  }
  function mfOrt(D, k) {
    const L = [];
    for (let i = 1; i <= 12; i++) {
      const t = mfVal(D, k, i).t;
      if (t !== '') L.push(parca(t));
    }
    if (!L.length) return '';
    const n = Math.max(...L.map(x => x.length));
    return [...Array(n)]
      .map((_, j) => {
        const a = L.map(x => x[j]).filter(x => x != null);
        return a.length ? fN(a.reduce((s, z) => s + z, 0) / a.length, 1) : '–';
      })
      .join(' / ');
  }
  function mfCiz() {
    const box = $('mfBody');
    if (!box) return;
    const y = YIL(),
      D = P().mf[y],
      ed = yetkili();
    const fark = (a, b) => {
      const x = parca(mfVal(D, a, mfAy).t),
        z = parca(mfVal(D, b, mfAy).t);
      if (x[0] == null || z[0] == null) return '';
      const v = pct(x[0], z[0]);
      return v == null ? '' : `<small class="${v > 0 ? 'neg' : 'pos'}">Geçen yıla göre %${fP(v)}</small>`;
    };
    box.innerHTML = `${D.ornek ? '<p class="hint" style="margin:0 0 8px">Bağyaka panosundaki formdan alınan rakamlar var; kendi rakamlarını yazabilirsin.</p>' : ''}
  <div class="pf-grid"><label>Brüt m² / buzdolabı metresi<input data-mfi="m2" value="${esc(D.info.m2 || '')}"${!ed ? ' disabled' : ''}></label><label>Yatay dolap / klima sayısı<input data-mfi="dolap" value="${esc(D.info.dolap || '')}"${!ed ? ' disabled' : ''}></label></div>
  <label class="pf-l">Ay<select class="ssel" data-mfay-sel>${AY.map((a, i) => `<option value="${i + 1}"${i + 1 === mfAy ? ' selected' : ''}>${a} ${y}</option>`).join('')}</select></label>
  <div class="pf-grid">${MF_R.map(([k, l, u]) => {
    const o = mfVal(D, k, mfAy);
    return `<label>${l} <span class="pf-u">${u}</span><input data-mf="${k}" value="${o.oto ? '' : esc(o.t)}"${!ed ? ' disabled' : ''} placeholder="${o.oto ? o.t + ' ₺ (SKT fire kayıtlarından)' : ''}">${k === 'elk' ? fark('elk', 'elk1') : k === 'su' ? fark('su', 'su1') : ''}</label>`;
  }).join('')}</div>
  <p class="hint">Elektrik ve su için iki değer varsa araya / koy (örn. 78/83).</p>
  <h3 class="pf-h3">${y} tablosu</h3>
  <div class="scroll"><table class="ctab pf-mf"><thead><tr><th>Kalem</th>${AY.map((a, i) => `<th class="${i + 1 === mfAy ? 'sec' : ''}">${a.slice(0, 3)}</th>`).join('')}<th>Ort.</th></tr></thead><tbody>
  ${MF_R.map(
    ([k, l]) =>
      `<tr><td>${l}</td>${AY.map((_, i) => {
        const o = mfVal(D, k, i + 1);
        return `<td class="${o.oto ? 'oto' : ''}">${esc(o.t)}</td>`;
      }).join('')}<td><b>${mfOrt(D, k)}</b></td></tr>`
  ).join('')}</tbody></table></div>
  <div class="simp-act" style="margin-top:10px"><button type="button" class="btn small" data-pf="mfkop">Excel için kopyala</button></div>`;
  }
  function mfKopya() {
    const D = P().mf[YIL()];
    const L = [['Kalem', ...AY, 'Ortalama'].join('\t')];
    MF_R.forEach(([k, l, u]) =>
      L.push([`${l} (${u})`, ...AY.map((_, i) => mfVal(D, k, i + 1).t), mfOrt(D, k)].join('\t'))
    );
    const t = L.join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      () => V.toast('Kopyalandı.'),
      () => V.toast('Kopyalanamadı.')
    );
  }

  /* ---- olaylar ---- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pf]');
    if (b) {
      const a = b.dataset.pf;
      if (a === 'sip') sipAc();
      else if (a === 'siped') {
        sipEd = true;
        sipAc();
      } else if (a === 'sipok') {
        const S = P().sip;
        document.querySelectorAll('[data-sip]').forEach(i => {
          const [d, k] = i.dataset.sip.split(':');
          S.days[d][k] = i.value
            .split(/[,\n]/)
            .map(x => x.trim())
            .filter(Boolean);
        });
        S.ornek = false;
        save();
        sipEd = false;
        sipAc();
        V.toast('Sipariş günleri kaydedildi.');
        if (window.__renderHome) window.__renderHome();
      } else if (a === 'mv') mvAc();
      else if (a === 'mvp' || a === 'mvn') {
        const [y, m] = mvYm.split('-').map(Number),
          d = new Date(y, m - 1 + (a === 'mvn' ? 1 : -1), 1);
        mvAc(d.getFullYear() + '-' + pad(d.getMonth() + 1));
      } else if (a === 'imza') mvImza(false);
      else if (a === 'msimza') mvImza(true);
      else if (a === 'mvkop') mvKopya();
      else if (a === 'ygkop') ygKopya();
      else if (a === 'mfkop') mfKopya();
      return;
    }
    const t = e.target.closest('[data-ygt]');
    if (t) {
      ygT = t.dataset.ygt;
      ygCiz();
      return;
    }
    const r = e.target.closest('[data-ygay]');
    if (r) {
      ygAy = Number(r.dataset.ygay);
      ygCiz();
      $('ygBody').querySelector('[data-ygay-sel]').scrollIntoView({ block: 'nearest' });
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-ygay-sel]')) {
      ygAy = Number(t.value);
      ygCiz();
    } else if (t.matches('[data-mfay-sel]')) {
      mfAy = Number(t.value);
      mfCiz();
    } else if (t.matches('[data-yg]') && yetkili()) {
      const D = P().yg[YIL()][ygT],
        r = D.m[ygAy] || (D.m[ygAy] = {}),
        v = num(t.value);
      if (v == null) delete r[t.dataset.yg];
      else r[t.dataset.yg] = v;
      D.ornek = false;
      save();
      ygCiz();
    } else if (t.matches('[data-ygad]') && yetkili()) {
      const D = P().yg[YIL()].es;
      D.ad = t.value.trim() || 'Eşdeğer mağaza';
      save();
    } else if (t.matches('[data-mf]') && yetkili()) {
      const D = P().mf[YIL()],
        k = t.dataset.mf;
      D.r[k] = D.r[k] || {};
      const v = t.value.trim();
      if (v) D.r[k][mfAy] = v;
      else delete D.r[k][mfAy];
      D.ornek = false;
      save();
      mfCiz();
    } else if (t.matches('[data-mfi]') && yetkili()) {
      const D = P().mf[YIL()];
      D.info[t.dataset.mfi] = t.value.trim();
      save();
    }
  });
  // ay başı tablosuna ciro girilince otomatik ortalamalar tazelenir
  const cSave = $('cSave');
  if (cSave) cSave.addEventListener('click', () => setTimeout(ygCiz, 0));
  const tabA = $('tabA');
  if (tabA)
    tabA.addEventListener('click', () => {
      ygCiz();
      mfCiz();
    });
  window.__pano = {
    ac: k => (k === 'sip' ? sipAc() : k === 'mevcut' ? mvAc() : null),
    ciz: () => {
      ygCiz();
      mfCiz();
    },
    P
  };
  ygCiz();
  mfCiz();
})();
