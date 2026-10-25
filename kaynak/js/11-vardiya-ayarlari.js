
/* ===== Vardiya › Plan / Vardiya ayarları geçişi =====
   Vardiyayla ilgili ayar kutuları (class="vd-set") Ayarlar sekmesinde değil, Vardiya sekmesinde
   "Vardiya ayarları" düğmesiyle açılır. Kutuların kendisi ve kodları yerinde kalır; görünüm CSS ile değişir. */
(function () {
  const seg = document.getElementById('vdSeg');
  if (!seg) return;
  function goster(ayar) {
    document.body.classList.toggle('vd-ayar', ayar);
    seg.querySelectorAll('[data-vds]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.vds === 'ayar') === ayar)));
    window.scrollTo({ top: 0 });
  }
  seg.addEventListener('click', e => {
    const b = e.target.closest('[data-vds]');
    if (b) goster(b.dataset.vds === 'ayar');
  });
  // başka sekmeye geçip dönünce plan açılır
  const tabV = document.getElementById('tabV');
  if (tabV) tabV.addEventListener('click', () => goster(false));
  window.__vardiyaAyarlari = goster;
})();
