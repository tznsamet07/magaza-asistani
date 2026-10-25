(function () {
  try {
    var t = JSON.parse(localStorage.getItem('vardiya-tema') || '{}');
    var h = document.documentElement;
    if (t.renk !== 'yesil') h.classList.add('tema-bim');
    window.__unvan = function (U, K) {
      try {
        var v = JSON.parse(document.getElementById('bimVeri').textContent);
        (v.unvanlar || []).forEach(function (r) {
          var c = String(r[0] || '').toUpperCase();
          if (U && r[1]) U[c] = r[1];
          if (K && (r[2] || r[1])) K[c] = r[2] || c;
        });
      } catch (e) {}
    };
    if (t.mod === 'light' || t.mod === 'dark') h.setAttribute('data-theme', t.mod);
  } catch (e) {}
})();
