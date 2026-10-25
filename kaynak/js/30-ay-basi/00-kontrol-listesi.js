/* ===== Ay başı işlemleri ===== */
(function () {
  const V = window.__vardiya;
  if (!V) return;
  const $ = id => document.getElementById(id),
    esc = V.esc;
  const AB = () => {
    const s = V.state();
    if (!s.ab) s.ab = { tasks: [], done: {} };
    if (!s.ab.done) s.ab.done = {};
    return s.ab;
  };
  const uid = () => Math.random().toString(36).slice(2, 9);
  const pad = n => String(n).padStart(2, '0');
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
  const ROLE = {
    '': 'Herkes',
    MS: 'Mağaza Sorumlusu',
    MSY: 'Mağaza Sorumlu Yardımcısı',
    GT: 'Günlük Temsilci',
    PER: 'Personel'
  };
  const nowYm = () => {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1);
  };
  let ym = nowYm(),
    editMode = false,
    editId = null,
    openId = null;
  const recOf = (t, m) => (AB().done[m || ym] || {})[t.id] || null;
  const isDone = (t, m) => !!(recOf(t, m) && recOf(t, m).at);
  function due(t, m) {
    // 'late' | 'today' | 'soon' | null
    m = m || ym;
    if (!t.day) return null;
    const cur = nowYm();
    if (m < cur) return 'late';
    if (m > cur) return null;
    const d = new Date().getDate();
    return d > t.day ? 'late' : d === t.day ? 'today' : null;
  }
  const sorted = () =>
    AB()
      .tasks.slice()
      .sort((a, b) => (a.day || 99) - (b.day || 99));
  function badge() {
    const n = AB().tasks.filter(t => !isDone(t, nowYm()) && (!t.day || t.day <= new Date().getDate())).length;
    const b = $('abBadge');
    b.hidden = !n;
    b.textContent = n;
  }
  function render() {
    const [y, m] = ym.split('-').map(Number);
    $('abMonth').textContent = `${MON[m - 1]} ${y}`;
    const ts = sorted(),
      done = ts.filter(t => isDone(t)).length;
    $('abBar').style.width = ts.length ? Math.round((done * 100) / ts.length) + '%' : '0';
    $('abProgTxt').textContent = ts.length ? `${done} / ${ts.length} tamam` : '';
    const late = ts.filter(t => !isDone(t) && due(t) === 'late');
    $('abAlert').hidden = !late.length;
    $('abAlert').innerHTML = late.length
      ? `<b>${late.length} iş son gününü geçti:</b> ${late.map(t => esc(t.t)).join(', ')}`
      : '';
    $('abList').innerHTML = ts.length
      ? ts
          .map(t => {
            const r = recOf(t),
              dn = isDone(t),
              du = due(t);
            const when = dn ? new Date(r.at) : null;
            const meta = [t.day ? `Son gün: ayın ${t.day}. günü` : '', ROLE[t.role || '']].filter(Boolean).join(', ');
            return `<li class="ab-i${dn ? ' done' : ''}${!dn && du === 'late' ? ' late' : ''}" data-id="${t.id}">
      <button type="button" class="ab-chk" data-tog="${t.id}" aria-pressed="${dn}" aria-label="${esc(t.t)}: ${dn ? 'tamamlandı, geri al' : 'tamamlandı olarak işaretle'}">✓</button>
      <div class="ab-main"><b>${esc(t.t)}</b><small>${esc(meta)}</small>
        ${dn ? `<small class="ok">Tamamlandı: ${when.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${when.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small>` : du === 'late' ? '<small class="late">Son gün geçti</small>' : du === 'today' ? '<small class="late">Son gün bugün</small>' : ''}
        ${t.desc ? `<p>${esc(t.desc)}</p>` : ''}
        ${openId === t.id ? `<textarea data-note="${t.id}" rows="2" placeholder="Not (ör. kime gönderildi, eksik ne kaldı)">${esc((r && r.note) || '')}</textarea>` : `<small><button type="button" data-open="${t.id}" style="border:0;background:none;padding:0;color:var(--green);font:inherit;font-weight:700;font-size:12px">${r && r.note ? 'Not: ' + esc(r.note) : '+ Not ekle'}</button></small>`}
      </div>
      ${editMode ? `<div class="ab-ed"><button type="button" data-edit="${t.id}">Düzenle</button><button type="button" data-del="${t.id}">Sil</button></div>` : '<span></span>'}
    </li>`;
          })
          .join('')
      : `<li class="sempty">Henüz görev yok. “Görev ekle” bölümünden ay başında yapılan işleri ekle; liste her ay kendini yeniler.</li>`;
    badge();
  }
