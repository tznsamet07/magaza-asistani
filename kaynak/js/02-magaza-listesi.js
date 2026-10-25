/* Mağaza listesi (bimVeri.magazalar): kod, ad, adres, bölge. Arama ve görünen ad buradan gelir. */
window.__mg = (function () {
  var M = null,
    B = {},
    K = {},
    T = '';
  function tc(x) {
    return String(x || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/(^|[\s(./,-])(\p{L})/gu, function (m, a, b) {
        return a + b.toLocaleUpperCase('tr-TR');
      });
  }
  function up(x) {
    return String(x || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleUpperCase('tr-TR');
  }
  function nr(x) {
    return String(x || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/\s+/g, ' ')
      .trim();
  }
  var IL = {
      'mersin içel': 'Mersin',
      içel: 'Mersin',
      afyon: 'Afyonkarahisar',
      agri: 'Ağrı',
      'k.maraş': 'Kahramanmaraş'
    },
    A2 = null;
  function ilAd(x) {
    x = String(x || '').trim();
    return IL[nr(x)] || x;
  }
  /* Kodsuz mağazalar: BİM sitesindeki 'Mağaza Bul' listesinden gelen, bizdeki rapor listesinde olmayan mağazalar (kod ve bölge yok, sadece rehberde) */
  function L2() {
    if (A2) return A2;
    L();
    A2 = M.slice();
    try {
      var v = JSON.parse(document.getElementById('bimVeri').textContent);
      (v.ekMagazalar || []).forEach(function (r) {
        var a = String(r[0] || '').split(/\s*[\/\\]\s*/)[0] || r[0],
          il = ilAd(r[3]),
          o = {
            kod: '',
            ad: up(a),
            tamAd: r[0],
            sokak: tc(r[1]),
            no: '',
            yer: tc(r[2]) + ' / ' + il,
            il: il,
            bk: String(r[4] || '')
          };
        o.isim = nr(o.ad).indexOf(nr(r[2])) >= 0 ? o.ad : o.ad + ' · ' + tc(r[2]);
        o.adres = o.sokak + (o.yer ? ' · ' + o.yer : '');
        o.q = nr([o.tamAd, o.sokak, o.yer, o.il].join(' '));
        A2.push(o);
      });
    } catch (e) {}
    return A2;
  }
  function L() {
    if (M) return M;
    M = [];
    try {
      var v = JSON.parse(document.getElementById('bimVeri').textContent);
      B = v.bolgeler || {};
      T = v.tarih || '';
      var Y = [];
      try {
        Y = (JSON.parse(localStorage.getItem('magaza-yeni') || '{}').list || []).map(function (m) {
          return [m.kod, m.ad, m.sokak, m.no || '', m.ilce + ' / ' + m.il, m.il, m.bk, 1];
        });
      } catch (e) {}
      M = (v.magazalar || []).concat(Y).map(function (r) {
        var a = String(r[1] || '').split(/\s*[\/\\]\s*/)[0] || r[1],
          o = {
            kod: String(r[0]),
            ad: up(a),
            eskiAd: tc(a),
            tamAd: r[1],
            sokak: tc(r[2]),
            no: String(r[3] || '')
              .trim()
              .replace(/^no\s*:?\s*/i, 'No: ')
              .replace(/[\s\-\/]+$/, ''),
            yer: tc(r[4]),
            il: ilAd(r[5]),
            bk: String(r[6] || ''),
            yeni: !!r[7]
          };
        o.isim = o.ad + ' ' + o.kod;
        o.adres = [o.sokak, o.no].filter(Boolean).join(' ') + (o.yer ? ' · ' + o.yer : '');
        o.q = nr([o.kod, o.tamAd, o.sokak, o.yer, o.il, B[o.bk] || ''].join(' '));
        K[o.kod] = o;
        return o;
      });
    } catch (e) {}
    return M;
  }
  function kodOf(s) {
    var t = String(s || '')
      .toLocaleUpperCase('tr-TR')
      .split(/[\s·,()]+/)
      .filter(function (x) {
        return /^[A-Z0-9]\d{3,5}$/.test(x);
      });
    return t.length ? t[t.length - 1] : '';
  }
  return {
    hepsi: L,
    yenile: function () {
      M = null;
      A2 = null;
      K = {};
    },
    var: function () {
      return L().length > 0;
    },
    kod: function (k) {
      L();
      return K[String(k || '').toUpperCase()] || null;
    },
    kodOf: kodOf,
    bul: function (s) {
      L();
      var k = kodOf(s);
      if (k && K[k]) return K[k];
      var n = nr(s);
      if (!n) return null;
      var A = L2();
      for (var i = 0; i < A.length; i++) if (!A[i].kod && nr(A[i].isim) === n) return A[i];
      return null;
    },
    tumu: L2,
    tumSay: function () {
      return L2().length;
    },
    ara: function (q, n, tum) {
      var A = tum ? L2() : L();
      q = nr(q);
      if (!q) return [];
      var u = q.toLocaleUpperCase('tr-TR'),
        w = q.split(' '),
        r = [];
      if (K[u]) r.push(K[u]);
      for (var i = 0; i < A.length && r.length < (n || 20); i++) {
        var o = A[i];
        if (o === K[u]) continue;
        if (
          w.every(function (x) {
            return o.q.indexOf(x) >= 0;
          })
        )
          r.push(o);
      }
      return r;
    },
    bolge: function (bk) {
      L();
      return B[bk] ? tc(B[bk]) : '';
    },
    bolgeSay: function () {
      L();
      return Object.keys(B).length;
    },
    say: function (bk) {
      return bk
        ? L().filter(function (o) {
            return o.bk === bk;
          }).length
        : L().length;
    },
    ilSay: function () {
      var S = {};
      L2().forEach(function (o) {
        S[o.il] = 1;
      });
      return Object.keys(S).length;
    },
    tarih: function () {
      L();
      return T;
    },
    bolgeBul: function (t) {
      L();
      t = String(t || '');
      var m = t.match(/\b(95\d\d)\b/);
      if (m && B[m[1]]) return m[1];
      var n = nr(t),
        best = '';
      Object.keys(B).forEach(function (k) {
        var b = nr(B[k]).split(/[\s\-\/]+/)[0];
        if (b.length > 2 && n.split(/[\s()]+/).indexOf(b) >= 0 && (!best || nr(B[k]).length < nr(B[best]).length))
          best = k;
      });
      return best;
    },
    bolgeler: function () {
      L();
      return Object.keys(B)
        .map(function (k) {
          return { kod: k, ad: tc(B[k]) };
        })
        .sort(function (a, b) {
          return a.ad.localeCompare(b.ad, 'tr');
        });
    },
    harita: function (o) {
      return (
        'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent('BİM ' + [o.sokak, o.no, o.yer].filter(Boolean).join(' '))
      );
    }
  };
})();
/* Mağaza adları BİM listesindeki gibi büyük harf (emir, 2026-10-17): cihazdaki eski adlar bir kez çevrilir. */
(function () {
  try {
    if (localStorage.getItem('magaza-mgv') === '4') return;
    var M = window.__mg.hepsi(),
      P = [];
    M.forEach(function (o) {
      var e = o.eskiAd + ' ' + o.kod;
      if (e !== o.isim) P.push([e, o.isim]);
    });
    ['market-vardiya-v3', 'magaza-iletisim-demo', 'magaza-giris'].forEach(function (k) {
      var v = localStorage.getItem(k);
      if (!v) return;
      P.forEach(function (x) {
        if (v.indexOf(x[0]) >= 0) v = v.split(x[0]).join(x[1]);
      });
      localStorage.setItem(k, v);
    });
    localStorage.setItem('magaza-mgv', '4');
  } catch (e) {}
})();
