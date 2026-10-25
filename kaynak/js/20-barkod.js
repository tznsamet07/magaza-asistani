/* ===== Gömülü barkod okuyucu (EAN-13 / EAN-8) ===== */
/* EAN-13 / EAN-8 / UPC-A barkod çözücü: internet ve harici kütüphane gerektirmez */
const EAN = (() => {
  const LW = [
    [3, 2, 1, 1],
    [2, 2, 2, 1],
    [2, 1, 2, 2],
    [1, 4, 1, 1],
    [1, 1, 3, 2],
    [1, 2, 3, 1],
    [1, 1, 1, 4],
    [1, 3, 1, 2],
    [1, 2, 1, 3],
    [3, 1, 1, 2]
  ];
  const GW = LW.map(w => w.slice().reverse());
  const PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  // benzer kenar mesafeleri (çubuk kalınlaşmasına dayanıklı) + en yakın desen
  const key = w => w[0] + w[1] + ',' + (w[1] + w[2]);
  function digit(r, i, sets) {
    const w = [r[i], r[i + 1], r[i + 2], r[i + 3]],
      s = w[0] + w[1] + w[2] + w[3];
    if (!s) return null;
    const n = w.map(x => (x * 7) / s);
    const ek = Math.round(n[0] + n[1]) + ',' + Math.round(n[1] + n[2]);
    let best = null,
      be = 9,
      bestK = null,
      bk = 9;
    for (const [tag, set] of sets)
      for (let d = 0; d < 10; d++) {
        let e = 0;
        for (let k = 0; k < 4; k++) e += Math.abs(n[k] - set[d][k]);
        if (e < be) {
          be = e;
          best = { d, tag };
        }
        if (key(set[d]) === ek && e < bk) {
          bk = e;
          bestK = { d, tag };
        }
      }
    if (bestK && bk < 2.6) return bestK;
    return be < 1.6 ? best : null;
  }
  const ck13 = c => {
    let s = 0;
    for (let i = 0; i < 12; i++) s += +c[i] * (i % 2 ? 3 : 1);
    return (10 - (s % 10)) % 10 === +c[12];
  };
  const ck8 = c => {
    let s = 0;
    for (let i = 0; i < 7; i++) s += +c[i] * (i % 2 ? 1 : 3);
    return (10 - (s % 10)) % 10 === +c[7];
  };
  // r: koşu uzunlukları, r[0] koyu (çubuk)
  function tryAt(r, i) {
    const m = (r[i] + r[i + 1] + r[i + 2]) / 3;
    if (m < 0.8) return null;
    if (Math.max(r[i], r[i + 1], r[i + 2]) > 2.2 * Math.min(r[i], r[i + 1], r[i + 2]) + 1) return null;
    if (i > 0 && r[i - 1] < m * 3) return null; // sessiz bölge
    // EAN-13
    if (i + 58 < r.length) {
      let ok = true,
        par = '',
        L = [],
        R = [];
      for (let k = 0; k < 6 && ok; k++) {
        const g = digit(r, i + 3 + k * 4, [
          ['L', LW],
          ['G', GW]
        ]);
        if (!g) {
          ok = false;
          break;
        }
        par += g.tag;
        L.push(g.d);
      }
      const mid = r.slice(i + 27, i + 32);
      if (ok && Math.max(...mid) > m * 2.6) ok = false;
      for (let k = 0; k < 6 && ok; k++) {
        const g = digit(r, i + 32 + k * 4, [['R', LW]]);
        if (!g) {
          ok = false;
          break;
        }
        R.push(g.d);
      }
      if (ok) {
        const f = PAR.indexOf(par);
        if (f >= 0) {
          const c = '' + f + L.join('') + R.join('');
          if (ck13(c)) return c;
        }
      }
    }
    // EAN-8
    if (i + 42 < r.length) {
      let ok = true,
        L = [],
        R = [];
      for (let k = 0; k < 4 && ok; k++) {
        const g = digit(r, i + 3 + k * 4, [['L', LW]]);
        if (!g) {
          ok = false;
          break;
        }
        L.push(g.d);
      }
      for (let k = 0; k < 4 && ok; k++) {
        const g = digit(r, i + 24 + k * 4, [['R', LW]]);
        if (!g) {
          ok = false;
          break;
        }
        R.push(g.d);
      }
      if (ok) {
        const c = L.join('') + R.join('');
        if (ck8(c) && (i + 43 >= r.length || r[i + 43] >= m * 3)) return c;
      }
    }
    return null;
  }
  function runs(bits) {
    const out = [];
    let cur = bits[0],
      n = 0,
      start = 0;
    for (let k = 0; k < bits.length; k++) {
      if (bits[k] === cur) n++;
      else {
        out.push(n);
        cur = bits[k];
        n = 1;
      }
    }
    out.push(n);
    return { r: out, firstDark: bits[0] === 1 };
  }
  function scanBits(bits) {
    for (const b of [bits, bits.slice().reverse()]) {
      const { r, firstDark } = runs(b);
      for (let i = firstDark ? 0 : 1; i < r.length - 40; i += 2) {
        const c = tryAt(r, i);
        if (c) return c;
      }
    }
    return null;
  }
  // satırı ikili hale getir: yerel ortalama ve genel orta değer eşikleri, küçük görüntüde 2x büyütme
  function prep(line) {
    let a = line;
    if (a.length < 1400) {
      const b = new Float32Array(a.length * 2);
      for (let k = 0; k < a.length; k++) {
        const n = k + 1 < a.length ? a[k + 1] : a[k];
        b[2 * k] = a[k];
        b[2 * k + 1] = (a[k] + n) / 2;
      }
      a = b;
    }
    return a;
  }
  function binarizeAll(line) {
    const a = prep(line),
      n = a.length;
    let lo = 255,
      hi = 0;
    for (let k = 0; k < n; k++) {
      if (a[k] < lo) lo = a[k];
      if (a[k] > hi) hi = a[k];
    }
    if (hi - lo < 25) return [];
    const pre = new Float64Array(n + 1);
    for (let k = 0; k < n; k++) pre[k + 1] = pre[k] + a[k];
    const outs = [];
    for (const div of [10, 24]) {
      const win = Math.max(12, Math.round(n / div)),
        bits = new Uint8Array(n);
      for (let k = 0; k < n; k++) {
        const x = Math.max(0, k - win),
          y = Math.min(n, k + win);
        bits[k] = a[k] < (pre[y] - pre[x]) / (y - x) - 1 ? 1 : 0;
      }
      outs.push(bits);
    }
    const mid = (lo + hi) / 2,
      g = new Uint8Array(n);
    for (let k = 0; k < n; k++) g[k] = a[k] < mid ? 1 : 0;
    outs.push(g);
    return outs;
  }
  // gray: Uint8 gri değerler (w*h). Yatay ve dikey satırları tarar, en çok oy alan kodu döndürür.
  function decodeGray(gray, w, h, opts) {
    const votes = {},
      lines = (opts && opts.lines) || 40;
    const take = arr => {
      for (const b of binarizeAll(arr)) {
        const c = scanBits(b);
        if (c) {
          votes[c] = (votes[c] || 0) + 1;
          break;
        }
      }
    };
    for (let t = 1; t < lines; t++) {
      const y = Math.round((h * t) / lines);
      take(gray.subarray(y * w, (y + 1) * w));
    }
    if (!(opts && opts.noVertical))
      for (let t = 1; t < lines; t++) {
        const x = Math.round((w * t) / lines);
        const col = new Uint8Array(h);
        for (let y = 0; y < h; y++) col[y] = gray[y * w + x];
        take(col);
      }
    let best = null,
      bv = 0;
    for (const [c, v] of Object.entries(votes))
      if (v > bv) {
        bv = v;
        best = c;
      }
    const need = (opts && opts.minVotes) || 2;
    return best && bv >= need ? { code: best, votes: bv } : null;
  }
  return { decodeGray, scanBits };
})();
