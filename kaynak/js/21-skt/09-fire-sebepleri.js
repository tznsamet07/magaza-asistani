  /* --- fire sebepleri --- */
  if (!Array.isArray(S().reasons) || !S().reasons.length)
    S().reasons = [
      'SKT geldi',
      'Bozuk / hasarlı',
      'Ezik / kırık',
      'Küflü / bozulmuş',
      'Ambalajı açılmış',
      'Soğuk zincir bozuldu',
      'Müşteri iadesi',
      'Diğer'
    ];
  const reasons = () => S().reasons;
  function fillReasons() {
    const keep = $('fReason').value;
    $('fReason').innerHTML = reasons()
      .map(r => `<option>${esc(r)}</option>`)
      .join('');
    if (reasons().includes(keep)) $('fReason').value = keep;
  }
  function renderReasons() {
    $('fRsnList').innerHTML = reasons()
      .map((r, i) => {
        const n = S().fire.filter(x => x.reason === r).length;
        return `<li class="gi" style="grid-template-columns:minmax(0,1fr) auto"><span style="font-weight:600">${esc(r)}${n ? ` <small style="display:inline;color:var(--muted);font-weight:500">(${n} kayıt)</small>` : ''}</span><button type="button" class="del" data-rdel="${i}" aria-label="${esc(r)} sebebini sil">×</button></li>`;
      })
      .join('');
    fillReasons();
  }
  $('fRsnAdd').addEventListener('click', () => {
    const v = $('fRsnName').value.trim();
    if (!v) {
      V.toast('Sebebi yaz.');
      $('fRsnName').focus();
      return;
    }
    if (reasons().some(r => r.toLocaleLowerCase('tr-TR') === v.toLocaleLowerCase('tr-TR'))) {
      V.toast('Bu sebep zaten var.');
      return;
    }
    reasons().push(v);
    $('fRsnName').value = '';
    save();
    renderReasons();
    V.toast(`“${v}” sebebi eklendi.`);
  });
  $('fRsnName').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('fRsnAdd').click();
    }
  });
  $('fRsnList').addEventListener('click', async e => {
    const b = e.target.closest('[data-rdel]');
    if (!b) return;
    if (reasons().length <= 1) {
      V.toast('En az bir sebep kalmalı.');
      return;
    }
    const r = reasons()[Number(b.dataset.rdel)];
    if (!(await askConfirm(`“${r}” sebebi listeden çıkarılsın mı? Eski fire kayıtları değişmez.`))) return;
    S().reasons = reasons().filter((x, i) => i !== Number(b.dataset.rdel));
    save();
    renderReasons();
  });

