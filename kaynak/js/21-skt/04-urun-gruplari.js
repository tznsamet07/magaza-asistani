  /* --- ürün grupları --- */
  function renderGroups() {
    $('sGrpList').innerHTML = groups()
      .map(g => {
        const used = S().items.filter(i => !i.done && grp(i.group).id === g.id).length;
        return `<li class="gi" data-gid="${esc(g.id)}"><input data-gf="name" value="${esc(g.name)}" aria-label="Grup adı"${g.id === 'genel' ? ' readonly' : ''}><input data-gf="off" type="number" min="0" max="60" inputmode="numeric" value="${g.off}" aria-label="${esc(g.name)}: SKT'den kaç gün önce kalkar">${g.id === 'genel' ? '<span></span>' : `<button type="button" class="del" data-gdel="${esc(g.id)}" aria-label="${esc(g.name)} grubunu sil">×</button>`}
      <small>${g.off > 0 ? `SKT'den ${g.off} gün önce akşam raftan kalkar` : 'SKT günü kalkar'}${used ? `, ${used} ürün takipte` : ''}</small></li>`;
      })
      .join('');
  }
  $('sGrpList').addEventListener('change', e => {
    const li = e.target.closest('[data-gid]');
    if (!li) return;
    const g = groups().find(x => x.id === li.dataset.gid);
    if (!g) return;
    if (e.target.dataset.gf === 'name') {
      const v = e.target.value.trim();
      if (v) g.name = v;
    }
    if (e.target.dataset.gf === 'off') g.off = Math.max(0, Math.min(60, parseInt(e.target.value, 10) || 0));
    save();
    renderGroups();
    fillGroups();
    render();
    renderCat();
    preview();
  });
  $('sGrpList').addEventListener('click', async e => {
    const b = e.target.closest('[data-gdel]');
    if (!b) return;
    const g = groups().find(x => x.id === b.dataset.gdel);
    if (!g) return;
    if (!(await askConfirm(`${g.name} grubu silinsin mi? Bu gruptaki ürünler "Genel" grubuna geçer.`))) return;
    S().groups = groups().filter(x => x !== g);
    save();
    renderGroups();
    fillGroups();
    render();
    renderCat();
  });
  $('sGrpAdd').addEventListener('click', () => {
    const name = $('sGrpName').value.trim();
    if (!name) {
      V.toast('Grup adını yaz.');
      $('sGrpName').focus();
      return;
    }
    const off = Math.max(0, Math.min(60, parseInt($('sGrpOff').value, 10) || 0));
    groups().push({ id: uid(), name, off });
    $('sGrpName').value = '';
    $('sGrpOff').value = '';
    save();
    renderGroups();
    fillGroups();
    V.toast(`${name} grubu eklendi.`);
  });
  $('sGroup').addEventListener('change', preview);
  $('sDate').addEventListener('change', preview);
  $('sDate').addEventListener('input', preview);

