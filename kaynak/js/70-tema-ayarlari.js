(function () {
  var K = 'vardiya-tema',
    h = document.documentElement,
    m = document.querySelector('meta[name="theme-color"]');
  function get() {
    try {
      return JSON.parse(localStorage.getItem(K) || '{}');
    } catch (e) {
      return {};
    }
  }
  function apply(t) {
    h.classList.toggle('tema-bim', t.renk !== 'yesil');
    if (t.mod === 'light' || t.mod === 'dark') h.setAttribute('data-theme', t.mod);
    else h.removeAttribute('data-theme');
    if (m) m.setAttribute('content', t.renk !== 'yesil' ? '#C00C16' : '#0E4D33');
    document.querySelectorAll('[data-tr]').forEach(function (b) {
      b.setAttribute('aria-pressed', (t.renk || 'bim') === b.dataset.tr);
    });
    document.querySelectorAll('[data-tm]').forEach(function (b) {
      b.setAttribute('aria-pressed', (t.mod || 'auto') === b.dataset.tm);
    });
  }
  var box = document.getElementById('temaBox');
  box &&
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tr],[data-tm]');
      if (!b) return;
      var t = get();
      if (b.dataset.tr) t.renk = b.dataset.tr;
      else t.mod = b.dataset.tm;
      try {
        localStorage.setItem(K, JSON.stringify(t));
      } catch (x) {}
      apply(t);
    });
  apply(get());
})();
