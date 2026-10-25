/* ===== Grafikler: Ay başı sekmesinde günlük ciro (hedefe karşı) ve fire tutarı ===== */
(function () {
  const V = window.__vardiya;
  if (!V) return;
  const $ = id => document.getElementById(id),
    esc = V.esc,
    pad = n => String(n).padStart(2, '0');
  const MON = [
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
  const N = n => Math.round(n || 0).toLocaleString('tr-TR'),
    TLs = n => N(n) + ' ₺',
    TLk = n => (n >= 1e6 ? (n / 1e6).toFixed(2).replace('.', ',') + ' Mn ₺' : TLs(n));
  const short = n =>
    n >= 1e6
      ? (n / 1e6).toFixed(1).replace('.', ',') + ' Mn'
      : n >= 1e3
        ? Math.round(n / 1e3) + ' B'
        : String(Math.round(n));
  let mode = 'ciro',
    ornek = false,
    sel = null;
  const curYm = () =>
    window.__abYm ||
    (() => {
      const d = new Date();
      return d.getFullYear() + '-' + pad(d.getMonth() + 1);
    })();
  const prevYm = m => {
    const [y, mo] = m.split('-').map(Number),
      d = new Date(y, mo - 2, 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1);
  };
  const dim = m => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo, 0).getDate();
  };
  const todayI = m => {
    const d = new Date(),
      c = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    return c === m ? d.getDate() : c > m ? dim(m) : 0;
  };
  function rnd(seed) {
    let h = 2166136261;
    for (const c of seed) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function ciroData(m) {
    const R = window.__abRows ? window.__abRows(m) : [];
    let days = R.map(r => ({ i: r.i, hedef: r.pc || 0, o: r.o, mu: r.mu }));
    if (ornek) {
      const r = rnd('c' + m),
        last = todayI(m);
      days = [...Array(dim(m))].map((_, k) => {
        const wd = (new Date(m + '-' + pad(k + 1) + 'T12:00:00').getDay() + 6) % 7,
          base = [44, 47, 41, 44, 48, 53, 38][wd] * 1000,
          h = Math.round(base / 50) * 50;
        return {
          i: k + 1,
          hedef: h,
          o: k + 1 <= last ? Math.round((h * (0.88 + r() * 0.25)) / 10) * 10 : null,
          mu: null
        };
      });
    }
    return days;
  }
  function fireData(m) {
    let L = ((V.state().skt || {}).fire || [])
      .filter(x => String(x.at || '').slice(0, 7) === m)
      .map(x => ({
        d: Number(x.at.slice(8, 10)),
        t: x.price != null ? x.price * (x.qty || 1) : 0,
        q: x.qty || 1,
        reason: x.reason || 'Diğer'
      }));
    if (ornek) {
      const r = rnd('f' + m),
        last = todayI(m),
        RS = ['SKT geldi', 'Kırık / ezik', 'Bozulmuş', 'Ambalaj hasarlı'];
      L = [];
      for (let d = 1; d <= last; d++) {
        const n = Math.floor(r() * 4);
        for (let k = 0; k < n; k++)
          L.push({
            d,
            t: Math.round((15 + r() * 140) * (1 + Math.floor(r() * 3))),
            q: 1 + Math.floor(r() * 3),
            reason: RS[Math.floor(r() * r() * 4)]
          });
      }
    }
    return L;
  }
  function bars(vals, opt) {
    const W = 340,
      H = 150,
      P = 22,
      n = vals.length,
      mx = Math.max(1, ...vals.map(v => Math.max(v.a || 0, v.b || 0))) * 1.1,
      bw = (W - P) / n;
    const y = v => H - 18 - (v / mx) * (H - 28);
    let g = `<svg class="gf-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label)}">`;
    [0, 0.5, 1].forEach(f => {
      const v = (mx / 1.1) * f,
        yy = y(v);
      g += `<line x1="${P}" x2="${W}" y1="${yy}" y2="${yy}" class="gf-grid"/><text x="${P - 3}" y="${yy + 3}" class="gf-ax" text-anchor="end">${short(v)}</text>`;
    });
    vals.forEach((v, k) => {
      const x = P + k * bw;
      if (v.a != null && v.a > 0)
        g += `<rect x="${x + bw * 0.15}" y="${y(v.a)}" width="${bw * 0.7}" height="${H - 18 - y(v.a)}" rx="2" class="gf-bar ${opt.cls}${sel === k ? ' on' : ''}"/>`;
      if (v.b) g += `<line x1="${x + bw * 0.05}" x2="${x + bw * 0.95}" y1="${y(v.b)}" y2="${y(v.b)}" class="gf-tgt"/>`;
      g += `<rect x="${x}" y="0" width="${bw}" height="${H}" fill="transparent" data-gd="${k}"/>`;
      {
        const dn = (opt.off || 1) + k;
        if (dn % 5 === 0 || k === 0)
          g += `<text x="${x + bw / 2}" y="${H - 4}" class="gf-ax" text-anchor="middle">${dn}</text>`;
      }
    });
    return g + '</svg>';
  }
  function draw() {
    const el = $('grafBody');
    if (!el) return;
    const m = curYm(),
      [y, mo] = m.split('-').map(Number),
      ay = MON[mo - 1];
    document.querySelectorAll('[data-gf]').forEach(b => b.setAttribute('aria-pressed', b.dataset.gf === mode));
    let h = '';
    if (mode === 'ciro') {
      const D = ciroData(m),
        act = D.filter(d => d.o != null),
        top = act.reduce((a, d) => a + d.o, 0),
        hdf = D.reduce((a, d) => a + d.hedef, 0),
        hdfSoFar = D.filter(d => d.o != null).reduce((a, d) => a + d.hedef, 0);
      const pm = ornek
        ? null
        : ciroData(prevYm(m))
            .filter(d => d.o != null && d.i <= Math.max(...act.map(d => d.i), 0))
            .reduce((a, d) => a + d.o, 0);
      if (!act.length && !ornek) {
        h = `<p class="hint" style="margin:8px 0 0">${ay} ayı için henüz ciro girilmedi. Ciro, BS raporundan ya da aşağıdaki tablodan girildikçe grafik dolar.</p><button type="button" class="linkbtn" data-gfornek>Örnek veriyle göster</button>`;
      } else {
        const pc = hdfSoFar ? Math.round((top * 100) / hdfSoFar) : null;
        h = `<div class="gf-kpi"><div><b>${TLk(top)}</b><span>${act.length} günlük ciro</span></div><div><b class="${pc == null ? '' : pc >= 100 ? 'up' : 'dn'}">${pc != null ? '%' + pc : '—'}</b><span>Hedefe göre</span></div><div><b>${hdf ? TLk(hdf) : '—'}</b><span>Ay hedefi</span></div></div>
      ${bars(
        D.map(d => ({ a: d.o, b: d.hedef })),
        { cls: 'c', label: ay + ' günlük ciro' }
      )}
      <div class="gf-leg"><span><i class="c"></i>Gerçekleşen</span><span><i class="t"></i>Günlük hedef</span>${pm ? `<span>Geçen ay aynı dönem: ${TLs(pm)} (${top >= pm ? '+' : ''}${Math.round(((top - pm) * 100) / pm)}%)</span>` : ''}</div>
      <p class="gf-sel" id="gfSel">${sel != null && D[sel] ? `${D[sel].i} ${ay}: ${D[sel].o != null ? TLs(D[sel].o) : 'girilmedi'}${D[sel].hedef ? ' · hedef ' + TLs(D[sel].hedef) : ''}` : 'Bir güne dokun, rakamı gör.'}</p>`;
      }
    } else {
      const L = fireData(m),
        n = dim(m),
        per = [...Array(n)].map((_, k) => L.filter(x => x.d === k + 1)),
        tut = L.reduce((a, x) => a + x.t, 0),
        adet = L.reduce((a, x) => a + x.q, 0);
      const P = ornek ? [] : fireData(prevYm(m)),
        ptut = P.reduce((a, x) => a + x.t, 0);
      if (!L.length && !ornek) {
        h = `<p class="hint" style="margin:8px 0 0">${ay} ayında fire kaydı yok. SKT sekmesinde fire olarak kaldırılan ürünler burada görünür.</p><button type="button" class="linkbtn" data-gfornek>Örnek veriyle göster</button>`;
      } else {
        const useT = tut > 0,
          RS = {};
        L.forEach(x => {
          RS[x.reason] = (RS[x.reason] || 0) + (useT ? x.t : x.q);
        });
        const top = Object.entries(RS).sort((a, b) => b[1] - a[1]),
          mx = top.length ? top[0][1] : 1;
        h = `<div class="gf-kpi"><div><b>${useT ? TLk(tut) : N(adet) + ' adet'}</b><span>${ay} fire</span></div><div><b>${N(adet)}</b><span>Ürün adedi</span></div><div><b class="${!ptut ? '' : tut <= ptut ? 'up' : 'dn'}">${ptut ? (tut >= ptut ? '+' : '') + Math.round(((tut - ptut) * 100) / ptut) + '%' : '—'}</b><span>Geçen aya göre</span></div></div>
      ${bars(
        per.map(a => ({ a: a.reduce((s, x) => s + (useT ? x.t : x.q), 0) })),
        { cls: 'f', label: ay + ' günlük fire' }
      )}
      <p class="gf-sel" id="gfSel">${sel != null && per[sel] ? `${sel + 1} ${ay}: ${per[sel].length ? (useT ? TLs(per[sel].reduce((s, x) => s + x.t, 0)) : '') + ' · ' + per[sel].reduce((s, x) => s + x.q, 0) + ' adet' : 'fire yok'}` : 'Bir güne dokun, rakamı gör.'}</p>
      <h3 class="gf-h3">Fire nedenleri</h3><ul class="gf-rs">${top.map(([k, v]) => `<li><span>${esc(k)}</span><div class="gf-rb"><i style="width:${Math.max(4, (v * 100) / mx)}%"></i></div><b>${useT ? TLs(v) : N(v)}</b></li>`).join('')}</ul>`;
      }
    }
    if (ornek)
      h =
        `<p class="gf-ornek">Örnek veri gösteriliyor <button type="button" class="linkbtn" data-gfornek>Gerçek veriye dön</button></p>` +
        h;
    el.innerHTML = h;
  }
  $('grafBox').addEventListener('click', e => {
    const b = e.target.closest('[data-gf]');
    if (b) {
      mode = b.dataset.gf;
      sel = null;
      draw();
      return;
    }
    if (e.target.closest('[data-gfornek]')) {
      ornek = !ornek;
      sel = null;
      draw();
      return;
    }
    const d = e.target.closest('[data-gd]');
    if (d) {
      sel = Number(d.getAttribute('data-gd'));
      draw();
    }
  });
  window.__drawGraf = () => {
    sel = null;
    draw();
  };
  /* BS ve PM için: mağaza bazında son günlerin ciro ve fire özeti (bu cihazın mağazası gerçek veri, diğerleri örnek) */
  window.__grafStore = (id, name) => {
    const m = curYm(),
      last = todayI(m),
      from = Math.max(1, last - 13);
    let C = [],
      F = [],
      ex = id !== 'me';
    if (!ex) {
      const R = window.__abRows ? window.__abRows(m) : [];
      C = R.filter(r => r.i >= from && r.i <= last).map(r => ({ i: r.i, a: r.o, b: r.pc }));
      const fl = ((V.state().skt || {}).fire || []).filter(x => String(x.at || '').slice(0, 7) === m);
      F = [...Array(last - from + 1)].map((_, k) =>
        fl
          .filter(x => Number(x.at.slice(8, 10)) === from + k)
          .reduce((s, x) => s + (x.price != null ? x.price * (x.qty || 1) : 0), 0)
      );
      if (!C.some(x => x.a != null) && !F.some(Boolean)) ex = true;
    }
    if (ex) {
      const r = rnd(String(name || id) + m),
        lvl = 0.8 + r() * 0.5;
      C = [...Array(last - from + 1)].map((_, k) => {
        const wd = (new Date(m + '-' + pad(from + k) + 'T12:00:00').getDay() + 6) % 7,
          b = Math.round(([44, 47, 41, 44, 48, 53, 38][wd] * 1000 * lvl) / 50) * 50;
        return { i: from + k, a: Math.round((b * (0.88 + r() * 0.25)) / 10) * 10, b };
      });
      F = C.map(() => Math.round(r() * r() * 900));
    }
    const top = C.reduce((s, x) => s + (x.a || 0), 0),
      hd = C.filter(x => x.a != null).reduce((s, x) => s + (x.b || 0), 0),
      ft = F.reduce((s, x) => s + x, 0);
    return `<div class="box gf"><div class="gf-head"><h2>Ciro ve fire</h2>${ex ? '<span class="gf-tag">örnek veri</span>' : ''}</div>
    <div class="gf-kpi"><div><b>${TLk(top)}</b><span>Son ${C.length} gün ciro</span></div><div><b class="${hd ? (top >= hd ? 'up' : 'dn') : ''}">${hd ? '%' + Math.round((top * 100) / hd) : '—'}</b><span>Hedefe göre</span></div><div><b>${TLk(ft)}</b><span>Son ${C.length} gün fire</span></div></div>
    ${bars(
      C.map(x => ({ a: x.a, b: x.b })),
      { cls: 'c', label: 'Günlük ciro', off: from }
    )}
    <div class="gf-leg"><span><i class="c"></i>Günlük ciro</span><span><i class="t"></i>Hedef</span><span><i class="f"></i>Fire</span></div>
    ${bars(
      F.map(v => ({ a: v })),
      { cls: 'f', label: 'Günlük fire', off: from }
    ).replace('class="gf-svg"', 'class="gf-svg sm"')}</div>`;
  };
  window.__grafBolge = L => {
    const m = curYm(),
      R = L.map(p => {
        const r = rnd(p.ad + m),
          c = Math.round(((7.5 + r() * 3) * 1e6 * todayI(m)) / 30),
          f = Math.round(c * (0.004 + r() * 0.004));
        return { ad: p.ad, bolge: p.bolge, c, f };
      }),
      mc = Math.max(...R.map(x => x.c), 1),
      mf = Math.max(...R.map(x => x.f), 1);
    return `<div class="box gf"><div class="gf-head"><h2>Bölgeler bu ay</h2><span class="gf-tag">örnek veri</span></div>
    <h3 class="gf-h3">Ciro</h3><ul class="gf-rs">${R.map(x => `<li><span>${esc(x.ad.split(' ')[0])}${x.bolge ? ' · ' + esc(x.bolge.replace(' bölgesi', '')) : ''}</span><div class="gf-rb c"><i style="width:${(x.c * 100) / mc}%"></i></div><b>${TLk(x.c)}</b></li>`).join('')}</ul>
    <h3 class="gf-h3">Fire</h3><ul class="gf-rs">${R.map(x => `<li><span>${esc(x.ad.split(' ')[0])}</span><div class="gf-rb"><i style="width:${(x.f * 100) / mf}%"></i></div><b>${TLk(x.f)}</b></li>`).join('')}</ul></div>`;
  };
  draw();
})();
