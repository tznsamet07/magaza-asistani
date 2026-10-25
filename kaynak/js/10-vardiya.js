(function () {
  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const HEAD = ['P.TESİ', 'SALI', 'ÇARŞ.', 'PERŞ.', 'CUMA', 'C.TESİ', 'PAZAR'];
  const SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const FRI = 4;
  const ROLES = { MS: 'M.S.', MSY: 'M.S.Y.', GT: 'G.T.', PER: 'PER.', PART: 'PART' };
  const ROLE_NAMES = {
    MS: 'Mağaza Sorumlusu',
    MSY: 'Mağaza Sorumlu Yardımcısı',
    GT: 'Günlük Temsilci',
    PER: 'Personel',
    PART: 'Part eleman'
  };
  if (window.__unvan) window.__unvan(ROLE_NAMES);
  const ROLE_ORDER = ['MS', 'MSY', 'GT', 'PER', 'PART'];
  const KEY = 'market-vardiya-v3';
  // Uygulama içi onay penceresi (bazı APK'larda telefonun kendi onay penceresi açılmıyor)
  function askConfirm(msg, yes) {
    return new Promise(res => {
      const w = document.getElementById('qDlg'),
        y = document.getElementById('qYes'),
        n = document.getElementById('qNo');
      document.getElementById('qMsg').textContent = msg;
      y.textContent = yes || 'Evet';
      w.hidden = false;
      const done = v => {
        w.hidden = true;
        y.onclick = n.onclick = null;
        document.removeEventListener('keydown', key);
        res(v);
      };
      const key = e => {
        if (e.key === 'Escape') done(false);
      };
      y.onclick = () => done(true);
      n.onclick = () => done(false);
      document.addEventListener('keydown', key);
      y.focus();
    });
  }
  window.askConfirm = askConfirm;
  const KINDS = {
    M: { label: 'Sabah', color: 'var(--morning)' },
    E: { label: 'Akşam', color: 'var(--evening)' },
    T: { label: 'Tam gün', color: 'var(--full)' },
    A: { label: 'Aracı', color: 'var(--hl)' },
    O: { label: 'İzin (B)', color: 'var(--off)' },
    R: { label: 'Rapor', color: 'var(--sick)' },
    Y: { label: 'Yıllık izin', color: 'var(--annual)' },
    H: { label: 'Bayram', color: 'var(--hol)' }
  };
  const WORK = ['M', 'E', 'T', 'A'],
    ABSENT = ['O', 'R', 'Y'];
  const uid = () => Math.random().toString(36).slice(2, 9);
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const t2m = t => {
    const p = String(t || '0:0')
      .split(':')
      .map(Number);
    return p[0] * 60 + (p[1] || 0);
  };
  const m2t = m => {
    m = ((Math.round(m) % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  };
  const QUARTERS = (() => {
    const a = [];
    for (let m = 7 * 60; m <= 23 * 60; m += 15) a.push(m2t(m));
    return a;
  })();
  function tOpts(v) {
    const list = QUARTERS.includes(v) || !v ? QUARTERS : [...QUARTERS, v].sort();
    return list.map(t => `<option value="${t}"${t === v ? ' selected' : ''}>${t}</option>`).join('');
  }
  function tSel(f, v) {
    return `<select data-t="${f}" aria-label="Saat">${tOpts(v)}</select>`;
  }
  const fmt = n => (Math.round(n * 100) / 100).toLocaleString('tr-TR');

  function thisMonday() {
    const d = new Date();
    const k = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - k);
    return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
  }
  function newEmp(name, role) {
    return { id: uid(), name: name || '', role: role || 'PER', izin: 'auto', araciOk: true, gender: '' };
  }
  function defaults() {
    return {
      employees: [newEmp('Erol', 'MS'), newEmp('Kardelen', 'MSY'), newEmp('Samet', 'GT'), newEmp('İklim', 'PER')],
      sevk: [true, true, false, true, true, false, false],
      temizlik: [false, false, false, false, false, false, false],
      open: '08:45',
      close: '21:15',
      mEnd: '17:45',
      eStart: '14:15',
      countDays: [],
      shortThr: 5,
      shortMola: 0.5,
      mola: 1,
      longThr: 7,
      longMola: 1.5,
      ruleV: 4,
      tamMola: 1.5,
      weekTarget: 45,
      leaveHours: 7.5,
      holidays: [
        { d: '2027-03-09', n: 'Ramazan Bayramı 1. gün' },
        { d: '2027-05-17', n: 'Kurban Bayramı 2. gün' },
        { d: '2027-05-18', n: 'Kurban Bayramı 3. gün' }
      ],
      schedules: {},
      monthAdj: {},
      skt: { items: [], catalog: {}, defWarn: 7, remind: { on: true, time: '20:00', last: '' }, online: true },
      tab: 'v',
      yetkili: true,
      noCloseOpen: false,
      staggerE: true,
      genderMix: true,
      preFullE: true,
      izinRule: true,
      araciOn: true,
      araciMEnd: '09:45',
      araciEStart: '15:15',
      araciHist: {},
      friMinEnd: '17:45',
      sunShort: true,
      sunNoIzin: false,
      oneOff: true,
      sunMEnd: '16:15',
      sunEStart: '15:45',
      cntOut: '16:00',
      cntBack: '19:00',
      cntMStart: '07:45',
      cntMEndShort: '09:45',
      cntMEndLong: '17:45',
      pazarOn: true,
      pazarDay: 5,
      pazarMEnd: '18:15',
      pazarEStart: '13:45',
      weekStart: thisMonday(),
      schedule: {}
    };
  }
  let state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : null;
  } catch (e) {
    state = null;
  }
  if (!state || !Array.isArray(state.employees)) state = defaults();
  {
    const SC = ['104512', '104527', '104533', '104548'];
    state.employees.forEach((e, i) => {
      if (e && e.sicil == null && !e.temp) e.sicil = SC[i] || String(104560 + i * 13);
    });
  }
  const D = defaults();
  if (!state.cntSeed1) {
    state.countDays = (state.countDays || []).filter(x => x.d !== '2026-10-14' && x.d !== '2026-10-15');
    state.countDays.push(
      { d: '2026-10-14', n: 'Sayım', part: 'aksam' },
      { d: '2026-10-15', n: 'Sayım', part: 'sabah' }
    );
    state.cntSeed1 = 1;
  }
  if (!state.closeV) {
    if (state.close === '21:45') state.close = '21:15';
    if (state.eStart === '14:45') state.eStart = '14:15';
    if (Number(state.tamMola) === 2) state.tamMola = 1.5;
    state.closeV = 1;
  }
  if ((state.ruleV || 0) < 4) {
    state.shortThr = 5;
    state.longThr = 7;
    state.ruleV = 4;
  }
  if (state.araci && state.araciOn === undefined) state.araciOn = !!state.araci.on;
  for (const k in D) if (state[k] === undefined) state[k] = D[k];
  if (!state.schedules) state.schedules = {};
  if (!state.monthAdj) state.monthAdj = {};
  // her haftanın planı ayrı saklanır; geçerli hafta state.schedule ile aynı nesnedir
  if (state.weekStart) {
    if (state.schedules[state.weekStart]) state.schedule = state.schedules[state.weekStart];
    else state.schedules[state.weekStart] = state.schedule || {};
  }
  function save() {
    try {
      if (state.weekStart) state.schedules[state.weekStart] = state.schedule;
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }

  const $ = id => document.getElementById(id);
  const esc = s =>
    String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let toastT;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 4000);
  }

  const isPart = e => e && e.role === 'PART';
  let grpOv = null;
  // yıllık izinli haftada gereken haftalık izin: 6 gün yıllık izindeyse kalan gün B; 1–5 gün ise 1 B
  const leaveCap = (yC, need) => (yC >= 6 ? Math.max(0, 7 - yC) : yC >= 1 ? Math.min(1, Math.max(1, need)) : need);
  const baseGroup = e => (e.role === 'MS' || e.role === 'MSY' ? 'A' : isPart(e) ? 'P' : 'B');
  const groupOf = e => (grpOv && grpOv[e.id]) || baseGroup(e);
  // M.S. ya da M.S.Y. yıllık izindeyse G.T. onun yerine geçer (M.S./M.S.Y. eşleşmesine girer); G.T.'nin yerine personel/geçici personel geçer
  function leaveGroups(S, emps) {
    const onLeave = emps.filter(
      e => (e.role === 'MS' || e.role === 'MSY') && (S[e.id] || []).filter(c => c && c.k === 'Y').length >= 3
    );
    if (!onLeave.length) return null;
    const o = {};
    emps.filter(e => e.role === 'GT').forEach(e => (o[e.id] = 'A'));
    onLeave.forEach(e => (o[e.id] = 'L'));
    return o;
  }
  const isYetkili = e => ['MS', 'MSY', 'GT'].includes(e.role);
  // Part eleman: ayda en fazla 120 saat, haftada 2 gün izin; tam gün eşleşmesine ve aracıya girmez
  const PART_MONTH = 120,
    PART_OFFS = 2;
  const tempDaysIn = (e, from, to) => {
    let n = 0;
    const d = new Date(from + 'T12:00:00'),
      end = new Date(to + 'T12:00:00');
    for (; d <= end; d.setDate(d.getDate() + 1)) {
      const k = ymd(d);
      if (k >= e.tempFrom && k <= e.tempTo) n++;
    }
    return n;
  };
  const monthTargetFor = (e, ym) => {
    if (e.temp) {
      const [y, m] = ym.split('-').map(Number),
        dim = new Date(y, m, 0).getDate();
      return Math.round(((tempDaysIn(e, ym + '-01', ym + '-' + String(dim).padStart(2, '0')) * 7.5 * 6) / 7) * 2) / 2;
    }
    return isPart(e) ? Number(e.maxMonth) || PART_MONTH : monthTargetOf(ym);
  };
  // geçici personel sadece görev tarihleriyle kesişen haftalarda listede görünür
  const activeNow = e => !e.temp || !state.weekStart || (e.tempFrom <= dateOf(6) && e.tempTo >= dateOf(0));
  const sorted = () =>
    state.employees
      .filter(e => e.name.trim() && activeNow(e))
      .map((e, i) => ({ e, i }))
      .sort((a, b) => ROLE_ORDER.indexOf(a.e.role) - ROLE_ORDER.indexOf(b.e.role) || a.i - b.i)
      .map(x => x.e);
  const cellOf = (id, d) => (state.schedule[id] || [])[d] || null;
  function netOf(c) {
    if (!c) return 0;
    if (c.k === 'R' || c.k === 'Y' || c.k === 'H') return Number(state.leaveHours) || 0;
    if (!WORK.includes(c.k)) return 0;
    return netFor(grossOf(c), c.k);
  }
  // Çalışma Saatleri Tablosu: vardiya süresine göre mola
  // 4 saate kadar molasız, 4,5–5,5 saat 30 dk, 6,5–8 saat 60 dk, 9 saat ve üzeri 90 dk.
  // 6, 8,5 ve 13 saatlik vardiyalar kullanılmaz. En uzun vardiya 12,5 saat (08:45–21:15): 1,5 saat mola, 11 saat sayılır.
  function molaFor(g) {
    if (g <= 4 + 1e-9) return 0;
    if (g < 6 - 1e-9) return 0.5;
    if (g < 8.5 - 1e-9) return 1;
    if (g < 13 - 1e-9) return 1.5;
    return 2;
  }
  // Resmi tablo: 6 ve 8,5 saat ile 12,5 saatten uzun (13 saat) vardiyalar kullanılmaz
  const forbidden = g => Math.abs(g - 6) < 1e-6 || Math.abs(g - 8.5) < 1e-6 || g > 12.5 + 1e-6;
  function netFor(g, k) {
    if (k === 'T') return Math.max(0, g - (Number(state.tamMola) || 0));
    return Math.max(0, g - molaFor(g));
  }
  function netText(c) {
    const g = grossOf(c);
    if (forbidden(g)) return `${fmt(g)} saat: bu aralık kullanılmaz`;
    return `${fmt(g)} saat, ${fmt(c.k === 'T' ? Number(state.tamMola) || 0 : molaFor(g))} saat mola, ${fmt(netOf(c))} saat sayılır`;
  }
  function grossOf(c) {
    let g = (t2m(c.e) - t2m(c.s)) / 60;
    if (c.k === 'A') g += (t2m(c.e2) - t2m(c.s2)) / 60;
    return g;
  }
  const isPazar = d => state.pazarOn && Number(state.pazarDay) === d;
  // Pazar günü (sakin gün): izin yok, sabahçı erken çıkar, akşamcı geç gelir; saatler sabit
  const isSun = d => !!state.sunShort && d === 6 && !isPazar(6);
  const isFixedDay = d => isPazar(d) || isSun(d);
  const fixMEnd = d => (isPazar(d) ? state.pazarMEnd : state.sunMEnd);
  const fixEStart = d => (isPazar(d) ? state.pazarEStart : state.sunEStart);
  function defaultCell(k, d) {
    if (isFixedDay(d) && k === 'M') return { k, s: state.open, e: fixMEnd(d) };
    if (isFixedDay(d) && k === 'E') return { k, s: fixEStart(d), e: state.close };
    if (k === 'A') return { k, s: state.open, e: state.araciMEnd, s2: state.araciEStart, e2: state.close };
    if (k === 'M') return { k, s: state.open, e: state.mEnd };
    if (k === 'E') return { k, s: state.eStart, e: state.close };
    if (k === 'T') return { k, s: state.open, e: state.close };
    return { k };
  }

  /* ---------- Sidebar ---------- */
  /* Çalışan listesi yetkileri: görev ve sicil değişikliği yalnız MS; silme MS/MSY; kimse kendi satırında görev ya da sicil değiştiremez */
  function empYetki() {
    const g = window.__giris && window.__giris();
    if (!g || g.tip !== 'magaza') return { ms: true, sil: () => true, ben: () => false };
    return {
      ms: g.unvan === 'MS',
      sil: e => g.unvan === 'MS' || (g.unvan === 'MSY' && !['MS', 'MSY'].includes(e.role)),
      ben: e => (g.empId && e.id === g.empId) || (!!g.sicil && String(e.sicil || '') === String(g.sicil))
    };
  }
  const empRank = r => ROLE_ORDER.indexOf(r);
  window.__renderEmp = () => renderEmployees();
  function renderEmployees() {
    const Y = empYetki();
    $('empList').innerHTML =
      state.employees
        .map(
          e => `
    <div class="emp" data-id="${e.id}">${e.temp ? `<p class="hint" style="margin:0 0 6px;color:var(--ink);font-weight:600">Geçici personel: ${new Date(e.tempFrom + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${new Date(e.tempTo + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</p>` : ''}
      <div class="emp-row">
        <input type="text" value="${esc(e.name)}" data-f="name" aria-label="Çalışan adı" placeholder="İsim">
        <input type="text" class="emp-sicil" value="${esc(e.sicil || '')}" data-f="sicil" inputmode="numeric" aria-label="Sicil numarası" placeholder="Sicil no"${Y.ms && !Y.ben(e) ? '' : ' disabled title="Sicili yalnız MS değiştirir"'}>
        ${Y.sil(e) && !Y.ben(e) ? `<button class="del" type="button" data-act="del" aria-label="${esc(e.name || 'Çalışan')} sil" title="Sil">×</button>` : ''}
      </div>
      <div class="emp-opts">
        <select data-f="role" aria-label="Görevi"${Y.ms && !Y.ben(e) ? '' : ' disabled'}>
          ${ROLE_ORDER.map(r => `<option value="${r}" ${e.role === r ? 'selected' : ''}>${ROLE_NAMES[r]}</option>`).join('')}
        </select>
        <select data-f="izin" aria-label="Haftalık izin günü">
          <option value="auto" ${e.izin === 'auto' ? 'selected' : ''}>İzin: otomatik</option>
          ${DAYS.map((d, i) => (i === FRI ? '' : `<option value="${i}" ${String(e.izin) === String(i) ? 'selected' : ''}>İzin: ${d}</option>`)).join('')}
        </select>
      </div>
      <div class="emp-opts"><select data-f="gender" aria-label="Cinsiyet">
        <option value="" ${!e.gender ? 'selected' : ''}>Cinsiyet: belirtilmemiş</option>
        <option value="K" ${e.gender === 'K' ? 'selected' : ''}>Kadın</option>
        <option value="E" ${e.gender === 'E' ? 'selected' : ''}>Erkek</option>
      </select></div>
      <label class="check" style="margin-top:8px;font-size:13px;color:var(--muted)"><input type="checkbox" data-f="araciOk" ${e.araciOk !== false ? 'checked' : ''}><span>Cuma aracı olabilir</span></label>
    </div>`
        )
        .join('') || '<p class="hint">Henüz çalışan yok.</p>';
  }
  function renderDays() {
    $('daysTable').innerHTML =
      '<tr><th>Gün</th><th>Sevkiyat</th><th>Temizlik</th></tr>' +
      DAYS.map(
        (d, i) => `<tr><td>${d}${i === FRI ? '<small>Aktüel, izin yok</small>' : ''}</td>
      <td><input type="checkbox" data-sevk="${i}" ${state.sevk[i] ? 'checked' : ''} aria-label="${d} sevkiyat"></td>
      <td><input type="checkbox" data-tem="${i}" ${state.temizlik[i] ? 'checked' : ''} aria-label="${d} temizlik"></td></tr>`
      ).join('');
  }
  function initFixed() {
    document.querySelectorAll('select[data-tsel]').forEach(el => {
      el.innerHTML = tOpts(state[el.id]);
    });
    $('pazarDay').innerHTML = DAYS.map((d, i) => `<option value="${i}">${d}</option>`).join('');
    $('pazarDay').value = String(state.pazarDay);
    $('pazarOn').checked = state.pazarOn;
    $('pazarOn').addEventListener('change', () => {
      state.pazarOn = $('pazarOn').checked;
      save();
      renderSheet();
    });
    $('pazarDay').addEventListener('change', () => {
      state.pazarDay = Number($('pazarDay').value);
      save();
      renderSheet();
    });
    [
      'pazarMEnd',
      'pazarEStart',
      'sunMEnd',
      'sunEStart',
      'cntOut',
      'cntBack',
      'cntMStart',
      'cntMEndShort',
      'cntMEndLong'
    ].forEach(k => {
      $(k).value = state[k];
      $(k).addEventListener('change', () => {
        state[k] = $(k).value;
        save();
        renderSheet();
      });
    });
    ['open', 'close', 'mEnd', 'eStart', 'friMinEnd'].forEach(k => {
      $(k).value = state[k];
      $(k).addEventListener('change', () => {
        state[k] = $(k).value;
        save();
        renderSheet();
      });
    });
    $('weekMode').value = state.weekMode === 'fixed' ? 'fixed' : 'auto';
    $('weekMode').addEventListener('change', () => {
      state.weekMode = $('weekMode').value;
      save();
      renderSheet();
    });
    [
      ['tamMola', 5],
      ['weekTarget', 80],
      ['leaveHours', 24]
    ].forEach(([k, max]) => {
      $(k).value = state[k];
      $(k).addEventListener('change', () => {
        let v = parseFloat(String($(k).value).replace(',', '.'));
        if (isNaN(v) || v < 0) v = 0;
        if (v > max) v = max;
        state[k] = v;
        $(k).value = v;
        save();
        renderSheet();
      });
    });
    [
      'yetkili',
      'noCloseOpen',
      'staggerE',
      'preFullE',
      'izinRule',
      'genderMix',
      'sunShort',
      'sunNoIzin',
      'oneOff'
    ].forEach(k => {
      $(k).checked = state[k];
      $(k).addEventListener('change', () => {
        state[k] = $(k).checked;
        save();
        renderSheet();
      });
    });
    $('araciOn').checked = state.araciOn;
    $('araciOn').addEventListener('change', () => {
      state.araciOn = $('araciOn').checked;
      save();
      renderSheet();
    });
    ['araciMEnd', 'araciEStart'].forEach(k => {
      $(k).value = state[k];
      $(k).addEventListener('change', () => {
        state[k] = $(k).value;
        save();
        renderSheet();
      });
    });
    $('weekStart').value = state.weekStart || '';
    $('weekStart').addEventListener('change', () => setWeek($('weekStart').value));
  }
  $('empList').addEventListener('input', ev => {
    const w = ev.target.closest('.emp');
    if (!w) return;
    const f = ev.target.dataset.f;
    if (f === 'sicil') return;
    if (f !== 'name') return;
    state.employees.find(x => x.id === w.dataset.id).name = ev.target.value;
    save();
    renderSheet();
  });
  $('empList').addEventListener('change', async ev => {
    const w = ev.target.closest('.emp');
    if (!w) return;
    const e = state.employees.find(x => x.id === w.dataset.id);
    const f = ev.target.dataset.f,
      Y = empYetki();
    if ((f === 'role' || f === 'sicil') && (!Y.ms || Y.ben(e))) {
      toast(
        Y.ben(e)
          ? 'Kendi görevini ya da sicilini değiştiremezsin.'
          : 'Görev ve sicil değişikliğini yalnız mağaza sorumlusu yapar.'
      );
      renderEmployees();
      return;
    }
    if (f === 'sicil') {
      const v = ev.target.value.replace(/\D/g, '');
      if (v && state.employees.some(x => x !== e && String(x.sicil || '') === v)) {
        toast(`${v} sicil numarası başka bir çalışanda var.`);
        renderEmployees();
        return;
      }
      if (
        e.sicil &&
        v !== String(e.sicil) &&
        !(await askConfirm(
          `${e.name || 'Çalışan'} bundan sonra ${v || 'sicilsiz'} ile giriş yapacak. Değiştirilsin mi?`
        ))
      ) {
        renderEmployees();
        return;
      }
      e.sicil = v;
      save();
      renderEmployees();
      return;
    }
    if (f === 'role' && e.sicil && empRank(ev.target.value) < empRank(e.role)) {
      toast('Görev yükseltme yükselme sınavıyla olur: İletişim > Yükselme sınavı.');
      renderEmployees();
      return;
    }
    if (f === 'role' || f === 'izin' || f === 'gender') {
      e[f] = ev.target.value;
      save();
      renderSheet();
    }
    if (f === 'araciOk') {
      e.araciOk = ev.target.checked;
      save();
      renderSheet();
    }
  });
  $('empList').addEventListener('click', async ev => {
    if (ev.target.dataset.act !== 'del') return;
    const id = ev.target.closest('.emp').dataset.id,
      e = state.employees.find(x => x.id === id),
      Y = empYetki();
    if (!e || !Y.sil(e) || Y.ben(e)) return;
    if (
      (e.name || e.sicil) &&
      !(await askConfirm(
        `${e.name || 'Bu çalışan'} listeden silinsin mi? Vardiya planından da çıkar ve bu sicille giriş yapamaz.`
      ))
    )
      return;
    state.employees = state.employees.filter(x => x.id !== id);
    delete state.schedule[id];
    save();
    renderEmployees();
    renderSheet();
  });
  $('addEmp').addEventListener('click', () => {
    const e = newEmp('', 'PER');
    state.employees.push(e);
    save();
    renderEmployees();
    renderSheet();
    const inp = document.querySelector(`.emp[data-id="${e.id}"] input[type=text]`);
    if (inp) inp.focus();
  });
  $('daysTable').addEventListener('change', ev => {
    const t = ev.target;
    if (t.dataset.sevk !== undefined) state.sevk[t.dataset.sevk] = t.checked;
    if (t.dataset.tem !== undefined) state.temizlik[t.dataset.tem] = t.checked;
    save();
    renderSheet();
  });

  /* ---------- Otomatik dağıtım ---------- */
  function araciLast() {
    const last = {},
      cur = state.weekStart || '9999';
    for (const [w, id] of Object.entries(state.araciHist || {}))
      if (w < cur && (!last[id] || w > last[id])) last[id] = w;
    return last;
  }
  function araciRank(emps) {
    const last = araciLast(),
      pri = { PER: 0, GT: 1, MSY: 2, MS: 3 };
    return emps
      .filter(e => e.araciOk !== false && !isPart(e))
      .slice()
      .sort((a, b) => (last[a.id] || '').localeCompare(last[b.id] || '') || pri[a.role] - pri[b.role]);
  }
  function prevAraci() {
    const last = araciLast();
    let best = '',
      id = null;
    for (const [k, w] of Object.entries(last))
      if (w > best) {
        best = w;
        id = k;
      }
    return id;
  }
  function dateOf(i) {
    if (!state.weekStart) return '';
    const d = new Date(state.weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
  }
  function holidayOf(i) {
    const ds = dateOf(i);
    if (!ds) return null;
    const h = (state.holidays || []).find(x => x.d === ds);
    return h ? h.n || 'Bayram' : null;
  }
  const CPART = { gun: 'tüm gün', aksam: 'akşam', sabah: 'sabah' };
  function countRec(i) {
    const ds = dateOf(i);
    if (!ds) return null;
    return (state.countDays || []).find(x => x.d === ds) || null;
  }
  function countOf(i) {
    const c = countRec(i);
    return c ? (c.n || 'Sayım') + (c.part && c.part !== 'gun' ? ' (' + CPART[c.part] + ')' : '') : null;
  }
  const countPart = i => {
    const c = countRec(i);
    return c ? c.part || 'gun' : null;
  };
  function renderCounts() {
    const el = $('cntList');
    if (!el) return;
    const list = (state.countDays || []).slice().sort((a, b) => a.d.localeCompare(b.d));
    el.innerHTML = list.length
      ? list
          .map(h => {
            const d = new Date(h.d + 'T12:00:00');
            return `<div class="hol-row"><span><b>${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })}</b><br><small style="color:var(--muted)">Sayım, ${CPART[h.part || 'gun']}</small></span><button type="button" class="del" data-cdel="${h.d}" aria-label="${esc(h.n || h.d)} sil">×</button></div>`;
          })
          .join('')
      : '<p class="hint">Kayıtlı sayım günü yok.</p>';
  }
  function renderHolidays() {
    const el = $('holList');
    if (!el) return;
    const list = (state.holidays || []).slice().sort((a, b) => a.d.localeCompare(b.d));
    el.innerHTML = list.length
      ? list
          .map(h => {
            const d = new Date(h.d + 'T12:00:00');
            return `<div class="hol-row"><span><b>${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })}</b><br><small style="color:var(--muted)">${esc(h.n || '')}</small></span><button type="button" class="del" data-hdel="${h.d}" aria-label="${esc(h.n || h.d)} sil">×</button></div>`;
          })
          .join('')
      : '<p class="hint">Kayıtlı bayram günü yok.</p>';
  }
  function shiftWeek(n) {
    const d = new Date(state.weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7 * n);
    return (
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    );
  }
  // d-1 / d+1 gününün hücresi; hafta sınırında önceki/sonraki haftanın kaydına bakar
  function nb(S, id, d, dir) {
    const j = d + dir;
    if (j >= 0 && j <= 6) return (S[id] || [])[j] || null;
    if (!state.weekStart) return null;
    const w = state.schedules && state.schedules[shiftWeek(dir)];
    return w && w[id] ? w[id][j < 0 ? 6 : 0] || null : null;
  }
  const isK = (c, k) => !!c && c.k === k;
  // yıllık izinden dönüş günü: geriye doğru B ve bayramlar atlanınca yıllık izne varılıyorsa
  function backFromLeave(S, id, d) {
    for (let j = d - 1, g = 0; g < 10; j--, g++) {
      let c;
      if (j >= 0) c = (S[id] || [])[j];
      else {
        const w = state.weekStart && state.schedules && state.schedules[shiftWeek(-1)];
        c = w && w[id] ? w[id][7 + j] : null;
        if (j < -6) return false;
      }
      if (!c) return false;
      if (c.k === 'Y') return true;
      if (c.k === 'O' || c.k === 'H') continue;
      return false;
    }
    return false;
  }
  let izinPlan = {},
    fixedOffs = null,
    fixedCells = null;
  function attempt(emps) {
    const aracRank = state.araciOn ? araciRank(emps) : [];
    const prevA = state.araciOn ? prevAraci() : null;
    const S = {};
    let pen = 0;
    emps.forEach(e => {
      S[e.id] = Array(7).fill(null);
      for (let d = 0; d < 7; d++) {
        const c = cellOf(e.id, d);
        if (holidayOf(d)) S[e.id][d] = { k: 'H' };
        else if (c && (c.k === 'R' || c.k === 'Y')) S[e.id][d] = c.n ? { k: c.k, n: c.n } : { k: c.k };
        else if (c && c.k === 'O' && c.yl) S[e.id][d] = { k: 'O', yl: true };
      }
      if (e.temp)
        for (let d = 0; d < 7; d++) {
          const ds = dateOf(d);
          if (ds < e.tempFrom || ds > e.tempTo) S[e.id][d] = { k: 'Z' };
        }
      if (fixedCells && fixedCells[e.id])
        for (const [dd, k] of Object.entries(fixedCells[e.id])) if (!S[e.id][dd]) S[e.id][dd] = { k, fx: true };
    });
    grpOv = leaveGroups(S, emps);
    const isAbs = (e, d) => S[e.id][d] && ABSENT.includes(S[e.id][d].k);
    const absentOn = d => emps.filter(e => isAbs(e, d));

    // 1) İzin (B): ayın izin hakkından bu haftaya düşen sayı kadar (31 çeken ayda 5, diğerlerinde 4)
    const ownAdj = (e, d) => isK(nb(S, e.id, d, -1), 'O') || isK(nb(S, e.id, d, 1), 'O');
    const hasPart = emps.some(isPart);
    if (fixedOffs) {
      // elle değiştirilen izinler sabit; kurallar bunlara göre yeniden kurulur
      for (const e of emps)
        if (fixedOffs[e.id]) for (const d of fixedOffs[e.id]) if (!S[e.id][d]) S[e.id][d] = { k: 'O' };
    }
    {
      for (const e of [
        ...emps.filter(x => x.izin !== 'auto'),
        ...shuffle(emps.filter(x => x.izin === 'auto' && !isPart(x))),
        ...shuffle(emps.filter(x => x.izin === 'auto' && isPart(x)))
      ]) {
        if (fixedOffs && fixedOffs[e.id]) continue;
        for (const seg of izinPlan[e.id] || [{ idx: [0, 1, 2, 3, 4, 5, 6], needB: 1 }]) {
          const yC = seg.idx.filter(x => S[e.id][x] && S[e.id][x].k === 'Y').length;
          let need = leaveCap(yC, seg.needB) - seg.idx.filter(x => S[e.id][x] && S[e.id][x].k === 'O').length;
          if (e.izin !== 'auto') {
            const fd = Number(e.izin);
            if (seg.idx.includes(fd) && need > 0) {
              if (!S[e.id][fd]) S[e.id][fd] = { k: 'O' };
              need--;
            }
          }
          for (let n = 0; n < need; n++) {
            let best = -1,
              bk = Infinity;
            for (const d of seg.idx) {
              if (d === FRI || S[e.id][d] || countOf(d) || (state.sunNoIzin && d === 6)) continue;
              const abs = absentOn(d);
              const gAbs = abs.filter(x => groupOf(x) === groupOf(e)).length;
              const mates = emps.filter(x => x !== e && groupOf(x) === groupOf(e) && !S[x.id][d]).length;
              const gm = emps.filter(x => x !== e && groupOf(x) === groupOf(e));
              const adjMate =
                state.izinRule && gm.length === 1
                  ? gm.filter(x => isK(nb(S, x.id, d, -1), 'O') || isK(nb(S, x.id, d, 1), 'O')).length
                  : 0;
              let edge = 0;
              if (state.izinRule) {
                const pv = nb(S, e.id, d, -1),
                  nx = nb(S, e.id, d, 1);
                if (d === 0 && pv && (pv.k === 'E' || pv.k === 'A' || pv.k === 'T')) edge += 80;
                if (d === 6 && nx && (nx.k === 'M' || nx.k === 'T')) edge += 80;
              }
              const offsToday = emps.filter(
                  x => x !== e && S[x.id][d] && S[x.id][d].k === 'O' && !S[x.id][d].yl && isPart(x) === isPart(e)
                ).length,
                offsAny = emps.filter(x => x !== e && S[x.id][d] && S[x.id][d].k === 'O').length;
              const k =
                abs.length * 4 +
                gAbs * 25 +
                (mates ? 0 : 60) +
                adjMate * 40 +
                edge +
                (ownAdj(e, d) ? 35 : 0) +
                (state.oneOff && offsToday ? 120 : 0) +
                (offsAny ? 15 : 0) +
                (isPart(e) && emps.some(x => groupOf(x) === 'B' && S[x.id][d] && S[x.id][d].k === 'O') ? 40 : 0) +
                (emps.some(
                  x => x !== e && !isPart(x) && groupOf(x) === groupOf(e) && !S[x.id][d] && backFromLeave(S, x.id, d)
                )
                  ? 200
                  : 0) +
                (state.izinRule &&
                !isPart(e) &&
                ((d < 6 && S[e.id][d + 1] && S[e.id][d + 1].fx && ['M', 'T'].includes(S[e.id][d + 1].k)) ||
                  (d > 0 && S[e.id][d - 1] && S[e.id][d - 1].fx && ['E', 'A', 'T'].includes(S[e.id][d - 1].k)))
                  ? 100
                  : 0) +
                Math.random() * 2;
              if (k < bk) {
                bk = k;
                best = d;
              }
            }
            if (best < 0) {
              pen += 50;
              break;
            }
            S[e.id][best] = { k: 'O' };
          }
        }
      }
    }
    // yıllık izin haftasının kalan izin günü de yıllık izne bağlı sayılır (aynı gün izin kuralına girmez, eşine tam gün yazdırmaz)
    for (const e of emps) {
      const yC = S[e.id].filter(c => c && c.k === 'Y').length;
      if (yC >= 6)
        S[e.id].forEach((c, i) => {
          if (c && c.k === 'O') S[e.id][i] = { k: 'O', yl: true };
        });
    }

    // 2) Tam gün: izinli kişinin eşi çeker
    const tCnt = {};
    emps.forEach(e => (tCnt[e.id] = 0));
    for (let d = 0; d < 7; d++) {
      for (const p of absentOn(d)) {
        if (isPart(p)) continue;
        // uzun yıllık izinde eş her gün tam gün çekmez; sadece haftalık izin ve rapor için
        if (S[p.id][d].k === 'Y' || S[p.id][d].yl) continue;
        // 4 tam zamanlı + part: G.T. ve personelin izni için tam gün yazılmaz, sadece M.S. ve M.S.Y. tam gün çeker
        if (hasPart && groupOf(p) === 'B') continue;
        if (emps.some(q => q !== p && groupOf(q) === groupOf(p) && S[q.id][d] && S[q.id][d].k === 'T')) continue;
        // eşi olmayan (ör. G.T. izindeki yöneticinin yerine geçtiğinde personel) için tam gün yazılmaz
        if (!emps.some(q => q !== p && !isPart(q) && groupOf(q) === groupOf(p))) continue;
        const okT = q =>
          !(state.izinRule && (isK(nb(S, q.id, d, -1), 'O') || isK(nb(S, q.id, d, 1), 'O'))) &&
          !(state.preFullE && isK(nb(S, q.id, d, -1), 'M')) &&
          !backFromLeave(S, q.id, d);
        let c = emps.filter(q => q !== p && !isPart(q) && groupOf(q) === groupOf(p) && !S[q.id][d] && okT(q));
        if (!c.length) {
          c = emps.filter(q => q !== p && groupOf(q) === groupOf(p) && !S[q.id][d]);
          if (c.length) pen += 60;
        }
        if (!c.length) {
          c = emps.filter(q => !S[q.id][d] && !isPart(q) && (!hasPart || groupOf(q) === 'A'));
          if (c.length) pen += 30;
        }
        if (!c.length) {
          pen += 100;
          continue;
        }
        let q = null,
          bk = Infinity;
        for (const x of c) {
          const k = tCnt[x.id] + Math.random() * 0.5;
          if (k < bk) {
            bk = k;
            q = x;
          }
        }
        S[q.id][d] = { k: 'T' };
        tCnt[q.id]++;
      }
    }
    emps.forEach(e => {
      if (tCnt[e.id] > 1) pen += (tCnt[e.id] - 1) * 15;
    });

    // 3) Sabah / akşam
    const cnt = {};
    emps.forEach(e => (cnt[e.id] = { M: 0, E: 0 }));
    for (let d = 0; d < 7; d++) {
      const W = emps.filter(e => !S[e.id][d]);
      const F = emps.filter(e => S[e.id][d] && S[e.id][d].k === 'T');
      const fY = F.some(isYetkili);
      const n = W.length;
      // elle seçilmiş sabah/akşamlar sabit; açılış/kapanış ve denge hesabına katılır
      const pM = emps.filter(e => S[e.id][d] && S[e.id][d].fx && S[e.id][d].k === 'M'),
        pE = emps.filter(e => S[e.id][d] && S[e.id][d].fx && S[e.id][d].k === 'E');
      pM.forEach(e => cnt[e.id].M++);
      pE.forEach(e => cnt[e.id].E++);
      const oY0 = fY || pM.some(isYetkili),
        cY0 = fY || pE.some(isYetkili);
      if (!n) {
        if (state.yetkili && !fY && F.length) pen += 200;
        continue;
      }
      const cp = countPart(d);
      const nt = n + pM.length + pE.length,
        mT =
          cp === 'sabah'
            ? nt - Math.floor(nt / 2)
            : nt % 2 === 0
              ? nt / 2
              : state.sevk[d]
                ? Math.ceil(nt / 2)
                : Math.floor(nt / 2);
      const m = Math.max(0, Math.min(n, mT - pM.length));
      const prefA = d === FRI && state.araciOn ? aracRank.find(x => W.includes(x)) : null;
      const fG = F.map(x => x.gender).filter(Boolean),
        pMG = pM.map(x => x.gender).filter(Boolean),
        pEG = pE.map(x => x.gender).filter(Boolean),
        dayG = new Set([...fG, ...pMG, ...pEG, ...W.map(x => x.gender).filter(Boolean)]);
      const scoreMask = mask => {
        let s = 0,
          oY = oY0,
          cY = cY0;
        const oG = [...fG, ...pMG],
          cG = [...fG, ...pEG];
        for (let i = 0; i < n; i++) {
          const e = W[i],
            k = (mask >> i) & 1 ? 'M' : 'E',
            c = cnt[e.id];
          s += Math.abs(c.M - c.E + (k === 'M' ? 1 : -1));
          const prev = d > 0 ? S[e.id][d - 1] : null;
          if (prev && prev.k === k) s += 0.4;
          if (state.noCloseOpen && prev && prev.k === 'E' && k === 'M') s += 60;
          if (state.preFullE && k === 'M' && isK(nb(S, e.id, d, 1), 'T')) s += 150;
          if (state.izinRule && !isPart(e) && k === 'E' && isK(nb(S, e.id, d, 1), 'O')) s += 150;
          if (state.izinRule && !isPart(e) && k === 'M' && isK(nb(S, e.id, d, -1), 'O')) s += 150;
          if (k === 'M' && backFromLeave(S, e.id, d)) s += 150;
          if (isYetkili(e)) {
            if (k === 'M') oY = true;
            else cY = true;
          }
          if (prefA && e === prefA && k === 'M') s += 6;
          if (e.gender) {
            if (k === 'M') oG.push(e.gender);
            else cG.push(e.gender);
          }
        }
        if (state.yetkili) {
          if (!oY) s += 200;
          if (!cY) s += 200;
        }
        // kadın-erkek dengesi: açılış ve kapanış ekibi tek cinsiyetten olmasın (gün içinde ikisi de varsa)
        if (state.genderMix && dayG.size > 1) {
          const mono = a => a.length >= 2 && a.every(g => g === a[0]);
          if (mono(oG)) s += 40;
          if (mono(cG)) s += 40;
        }
        return s + Math.random() * 0.6;
      };
      let bestMask = 0,
        bs = Infinity;
      const pc = x => {
        let c = 0;
        while (x) {
          c += x & 1;
          x >>= 1;
        }
        return c;
      };
      if (n <= 12) {
        for (let mask = 0; mask < 1 << n; mask++) {
          if (pc(mask) !== m) continue;
          const s = scoreMask(mask);
          if (s < bs) {
            bs = s;
            bestMask = mask;
          }
        }
      } else {
        for (let t = 0; t < 300; t++) {
          const idx = shuffle([...Array(n).keys()]).slice(0, m);
          let mask = 0;
          idx.forEach(i => (mask |= 1 << i));
          const s = scoreMask(mask);
          if (s < bs) {
            bs = s;
            bestMask = mask;
          }
        }
      }
      pen += bs;
      W.forEach((e, i) => {
        const k = (bestMask >> i) & 1 ? 'M' : 'E';
        S[e.id][d] = { k };
        cnt[e.id][k]++;
      });
    }
    // 3b) Akşam sayımı: sabahçılar ara verip sayıma geri döner (ör. 08:45–16:00, 19:00–kapanış)
    for (let d = 0; d < 7; d++) {
      if (countPart(d) !== 'aksam') continue;
      for (const e of emps) {
        const c = S[e.id][d];
        if (c && c.k === 'M' && !c.fx) S[e.id][d] = { k: 'A', cnt: true };
      }
    }
    // 3c) Sabah sayımı: herkes erken gelir; yarısı uzun kalır (ör. 07:45–17:45), diğerleri sayım sonrası çıkıp akşam kapanışa döner
    for (let d = 0; d < 7; d++) {
      if (countPart(d) !== 'sabah') continue;
      for (const e of emps) {
        const c = S[e.id][d];
        if (c && c.k === 'M') S[e.id][d] = { k: 'M', cnt: true };
        else if (c && c.k === 'E') S[e.id][d] = { k: 'A', cnt: true, ms: true };
      }
    }

    // 4) Cuma aracı: akşamcılardan biri bölünmüş çalışır (önce personel)
    if (state.araciOn && !emps.some(e => S[e.id][FRI] && S[e.id][FRI].k === 'A' && !S[e.id][FRI].cnt)) {
      const idx = e => {
        const i = aracRank.indexOf(e);
        return i < 0 ? 999 : i;
      };
      const c = emps.filter(
        e => S[e.id][FRI] && S[e.id][FRI].k === 'E' && !S[e.id][FRI].fx && !backFromLeave(S, e.id, FRI)
      );
      if (c.length) {
        c.sort((a, b) => idx(a) - idx(b));
        const a = c[0];
        S[a.id][FRI] = { k: 'A' };
        pen += idx(a) * 3;
        if (idx(a) === 999) pen += 30;
        if (a.id === prevA) pen += 60;
      } else pen += 20;
    }
    return { S, score: pen };
  }

  function fitTimes(S, emps) {
    const ALL = sorted();
    const usedT = (e, d, k) =>
      new Set(
        ALL.filter(o => o.id !== e.id)
          .map(o => S[o.id] && S[o.id][d])
          .filter(x => x && x.k === k)
          .map(x => (k === 'M' ? x.e : x.s))
          .filter(Boolean)
      );
    const open = t2m(state.open),
      close = t2m(state.close);
    const mDef = (t2m(state.mEnd) - open) / 60,
      eDef = (close - t2m(state.eStart)) / 60;
    const maxG = Math.max(4, (close - open) / 60 - 0.5);
    for (const e of emps) {
      const row = S[e.id];
      if (!row) continue;
      for (const seg of weekSegs(e)) {
        const tgtE = seg.target;
        let fixed = 0;
        const items = [];
        for (const d of seg.idx) {
          const c = row[d];
          if (!c) continue;
          if (c.lock && WORK.includes(c.k)) {
            fixed += netOf(c);
            continue;
          }
          if (c.cnt) {
            if (c.k === 'M') {
              c.s = state.cntMStart;
              c.e = state.cntMEndLong;
              fixed += netOf(c);
              continue;
            }
            if (c.k === 'A' && c.ms) {
              const part = Math.max(0, (t2m(state.cntMEndShort) - t2m(state.cntMStart)) / 60);
              const def = part + (close - t2m(state.eStart)) / 60;
              items.push({ c, def, g: def, part, min: part + 4, d });
              continue;
            }
            if (c.k === 'A') {
              c.s = state.open;
              c.e = state.cntOut;
              c.s2 = state.cntBack;
              c.e2 = state.close;
              fixed += netOf(c);
              continue;
            }
          }
          if (isFixedDay(d) && (c.k === 'M' || c.k === 'E')) {
            Object.assign(c, defaultCell(c.k, d));
            if (c.k === 'M' && state.staggerE) {
              const offs = [0, -30, 30, -60, 60, -90].filter(
                o => !forbidden((t2m(fixMEnd(d)) - t2m(state.open) + o) / 60)
              );
              {
                const u = usedT(e, d, 'M');
                const o = offs.find(o => !u.has(m2t(t2m(fixMEnd(d)) + o)));
                c.e = m2t(t2m(fixMEnd(d)) + (o === undefined ? 0 : o));
              }
            }
            if (c.k === 'E' && state.staggerE) {
              const offs = [0, 30, -30, 60, -60, 90].filter(
                o => !forbidden((t2m(state.close) - t2m(fixEStart(d)) - o) / 60)
              );
              {
                const u = usedT(e, d, 'E');
                const o = offs.find(o => !u.has(m2t(t2m(fixEStart(d)) + o)));
                c.s = m2t(t2m(fixEStart(d)) + (o === undefined ? 0 : o));
              }
            }
            fixed += netOf(c);
            continue;
          }
          if (c.k === 'T') {
            c.s = state.open;
            c.e = state.close;
            fixed += netOf(c);
          } else if (c.k === 'R' || c.k === 'Y' || c.k === 'H') fixed += netOf(c);
          else if (c.k === 'M' || c.k === 'E') {
            const min = isPart(e)
              ? 4
              : c.k === 'M' && d === FRI
                ? Math.max(6.5, (t2m(state.friMinEnd) - open) / 60)
                : 6.5;
            const def = Math.max(c.k === 'M' ? mDef : eDef, min);
            items.push({ c, def, g: def, min, d });
          } else if (c.k === 'A') {
            const part = Math.max(0, (t2m(state.araciMEnd) - open) / 60);
            const def = part + (close - t2m(state.araciEStart)) / 60;
            items.push({ c, def, g: def, part, min: part + 2, d });
          }
        }
        if (!items.length) continue;
        const total = () => fixed + items.reduce((a, x) => a + netFor(x.g, x.c.k), 0);
        for (let guard = 0; guard < 500; guard++) {
          const diff = tgtE - total();
          if (Math.abs(diff) < 0.01) break;
          const st = Math.abs(diff) < 0.49 ? 0.25 : 0.5;
          if (diff > 0) {
            const pool = items.filter(x => x.g + st <= maxG);
            if (!pool.length) break;
            pool.sort(
              (a, b) =>
                a.g - a.def + (a.d === 6 ? 1.5 : 0) - (b.g - b.def + (b.d === 6 ? 1.5 : 0)) || (a.c.k === 'E' ? -1 : 1)
            );
            pool[0].g += st;
            if (forbidden(pool[0].g) && pool[0].g + st <= maxG) pool[0].g += st;
          } else {
            const pool = items.filter(x => x.g - st >= x.min);
            if (!pool.length) break;
            pool.sort(
              (a, b) =>
                b.g - b.def + (b.d === 6 ? 1.5 : 0) - (a.g - a.def + (a.d === 6 ? 1.5 : 0)) || (a.c.k === 'M' ? -1 : 1)
            );
            pool[0].g -= st;
            if (forbidden(pool[0].g) && pool[0].g - st >= pool[0].min) pool[0].g -= st;
          }
        }
        // aynı saati sayan iki süre varsa (örn. 7 ve 7,5 saat) kısa olanı kullan
        for (const x of items) {
          if (forbidden(x.g)) x.g += 0.5;
          while (x.g - 0.5 >= x.min && !forbidden(x.g - 0.5) && netFor(x.g - 0.5, x.c.k) === netFor(x.g, x.c.k))
            x.g -= 0.5;
        }
        for (const x of items) {
          const g = Math.round(x.g * 60);
          if (x.c.k === 'M') {
            x.c.s = state.open;
            x.c.e = m2t(open + g);
          } else if (x.c.k === 'E') {
            x.c.e = state.close;
            x.c.s = m2t(close - g);
          } else if (x.c.ms) {
            x.c.s = state.cntMStart;
            x.c.e = state.cntMEndShort;
            x.c.e2 = state.close;
            x.c.s2 = m2t(close - (g - Math.round(x.part * 60)));
          } else {
            x.c.s = state.open;
            x.c.e = state.araciMEnd;
            x.c.e2 = state.close;
            x.c.s2 = m2t(close - (g - Math.round(x.part * 60)));
          }
        }
      }
    }
    if (emps.length > 1) balanceDays(S, emps);
    if (state.staggerE) staggerEvenings(S, emps);
  }
  // Aynı gün akşama gelenlerin geliş saatlerini ayır; kişinin haftalık toplamını koruyarak
  // başka bir vardiyasını ters yönde kaydırır.
  function staggerEvenings(S, emps) {
    const ALL = sorted();
    const open = t2m(state.open),
      close = t2m(state.close);
    const maxG = Math.max(4, (close - open) / 60 - 0.5);
    const part = Math.max(0, (t2m(state.araciMEnd) - open) / 60);
    const setG = (c, g) => {
      const m = Math.round(g * 60);
      if (c.k === 'M') {
        c.s = state.open;
        c.e = m2t(open + m);
      } else if (c.k === 'E') {
        c.e = state.close;
        c.s = m2t(close - m);
      } else if (c.k === 'A') {
        c.s = state.open;
        c.e = state.araciMEnd;
        c.e2 = state.close;
        c.s2 = m2t(close - (m - Math.round(part * 60)));
      }
    };
    const minG = (c, d) =>
      c.k === 'A' ? part + 2 : c.k === 'M' && d === FRI ? Math.max(6.5, (t2m(state.friMinEnd) - open) / 60) : 6.5;
    const sumNet = e => (S[e.id] || []).reduce((a, c) => a + netOf(c), 0);
    const grp = c => (c.k === 'M' ? 'dep' : 'arr');
    const keyT = c => (c.k === 'M' ? c.e : c.k === 'A' ? c.s2 : c.s);
    const isArr = c => c && !c.cnt && (c.k === 'E' || c.k === 'A' || c.k === 'M');
    const collides = (d, c) =>
      ALL.some(o => {
        const x = S[o.id] && S[o.id][d];
        return isArr(x) && x !== c && grp(x) === grp(c) && keyT(x) === keyT(c);
      });
    const tried = new Set();
    for (let it = 0; it < 300; it++) {
      let tg = null;
      for (let d = 0; d < 7 && !tg; d++) {
        if (isFixedDay(d)) continue;
        for (const e of emps) {
          const c = S[e.id] && S[e.id][d];
          if (isArr(c) && !c.lock && !tried.has(e.id + '_' + d) && collides(d, c)) {
            tg = { e, d, c };
            break;
          }
        }
      }
      if (!tg) break;
      tried.add(tg.e.id + '_' + tg.d);
      const { e, d, c } = tg,
        tot = sumNet(e),
        g0 = grossOf(c);
      let best = null;
      for (const dg of [-0.5, 0.5, -1, 1, -1.5, 1.5, -0.25, 0.25, -0.75, 0.75]) {
        const g1 = g0 + dg;
        if (g1 < minG(c, d) || g1 > maxG || forbidden(g1)) continue;
        for (let d2 = 0; d2 < 7; d2++) {
          if (d2 === d || isFixedDay(d2)) continue;
          if (state.weekStart && state.weekMode !== 'fixed' && dateOf(d2).slice(0, 7) !== dateOf(d).slice(0, 7))
            continue;
          const y = S[e.id][d2];
          if (!y || y.lock || y.cnt || !['M', 'E', 'A'].includes(y.k)) continue;
          const gy0 = grossOf(y);
          for (const dy of [0.5, -0.5, 1, -1, 1.5, -1.5, 0.25, -0.25, 0.75, -0.75]) {
            const gy1 = gy0 + dy;
            if (gy1 < minG(y, d2) || gy1 > maxG || forbidden(gy1)) continue;
            const sc = { ...c },
              sy = { ...y };
            setG(c, g1);
            setG(y, gy1);
            const ok = Math.abs(sumNet(e) - tot) < 0.01 && !collides(d, c) && !(isArr(y) && collides(d2, y));
            const q = (dg * 2) % 1 !== 0 || (dy * 2) % 1 !== 0;
            const cost = Math.abs(dg) + Math.abs(dy) + (y.k === 'M' ? 0 : 0.1) + (q ? 0.8 : 0);
            Object.assign(c, sc);
            Object.assign(y, sy);
            if (ok && (!best || cost < best.cost)) best = { cost, g1, y, gy1 };
          }
        }
      }
      // Ayın devamı sonraki haftalardaysa tek başına kaydırmak yeterli; fark sonraki haftalarda dengelenir
      if (!best && state.weekStart && state.weekMode !== 'fixed') {
        const sg = weekSegs(e).find(x => x.idx.includes(d));
        if (sg && !sg.last)
          for (const dg of [-0.5, 0.5, -0.25, 0.25, -1, 1]) {
            const g1 = g0 + dg;
            if (g1 < minG(c, d) || g1 > maxG || forbidden(g1)) continue;
            const sc = { ...c };
            setG(c, g1);
            const ok = !collides(d, c);
            Object.assign(c, sc);
            if (ok) {
              best = { cost: Math.abs(dg), g1, y: null };
              break;
            }
          }
      }
      // Bu haftada telafi edecek gün yoksa (ör. ayın tek günü bu haftada), aynı ayın önceki haftasından telafi et
      if (!best && state.weekStart && state.weekMode !== 'fixed' && state.schedules) {
        const pk = shiftWeek(-1),
          PW = state.schedules[pk],
          prow = PW && PW[e.id];
        if (prow) {
          const ps = new Date(pk + 'T12:00:00'),
            ym = dateOf(d).slice(0, 7);
          const collIn = (d2, y) =>
            ALL.some(o => {
              const x = PW[o.id] && PW[o.id][d2];
              return isArr(x) && x !== y && grp(x) === grp(y) && keyT(x) === keyT(y);
            });
          for (const dg of [-0.5, 0.5, -0.25, 0.25, -1, 1]) {
            const g1 = g0 + dg;
            if (g1 < minG(c, d) || g1 > maxG || forbidden(g1)) continue;
            for (let d2 = 0; d2 < 7; d2++) {
              const dd = new Date(ps);
              dd.setDate(ps.getDate() + d2);
              if (ymd(dd).slice(0, 7) !== ym || isFixedDay(d2)) continue;
              const y = prow[d2];
              if (!y || y.lock || y.cnt || !['M', 'E', 'A'].includes(y.k)) continue;
              const gy0 = grossOf(y),
                ny0 = netOf(y),
                nc0 = netOf(c);
              for (const dy of [0.5, -0.5, 0.25, -0.25, 1, -1]) {
                const gy1 = gy0 + dy;
                if (gy1 < minG(y, d2) || gy1 > maxG || forbidden(gy1)) continue;
                const sc = { ...c },
                  sy = { ...y };
                setG(c, g1);
                setG(y, gy1);
                const ok =
                  Math.abs(netOf(c) - nc0 + (netOf(y) - ny0)) < 0.01 && !collides(d, c) && !(isArr(y) && collIn(d2, y));
                const cost = Math.abs(dg) + Math.abs(dy);
                Object.assign(c, sc);
                Object.assign(y, sy);
                if (ok && (!best || cost < best.cost)) best = { cost, g1, y, gy1 };
              }
            }
          }
        }
      }
      if (best) {
        setG(c, best.g1);
        if (best.y) setG(best.y, best.gy1);
      }
    }
  }
  function generateCore(emps) {
    izinPlan = {};
    emps.forEach(e => (izinPlan[e.id] = weekSegs(e)));
    let best = null;
    for (let t = 0; t < 250; t++) {
      const r = attempt(emps);
      if (!best || r.score < best.score) best = r;
    }
    state.schedule = best.S;
    if (state.weekStart) state.schedules[state.weekStart] = state.schedule;
    fitTimes(best.S, emps);
  }
  function monthWeeks() {
    const st = new Date(state.weekStart + 'T12:00:00');
    const th = new Date(st);
    th.setDate(st.getDate() + 3);
    const y = th.getFullYear(),
      m = th.getMonth(),
      first = new Date(y, m, 1, 12),
      last = new Date(y, m + 1, 0, 12);
    const mon = new Date(first);
    mon.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const out = [];
    for (const d = new Date(mon); d <= last; d.setDate(d.getDate() + 7)) out.push(ymd(d));
    return { weeks: out, label: `${MONTHS[m]} ${y}` };
  }
  async function generateMonth() {
    const emps = sorted();
    if (!emps.length) {
      toast('Önce en az bir çalışan ekle.');
      return;
    }
    if (!state.weekStart) {
      toast('Önce üstten hafta başlangıcını seç.');
      return;
    }
    const { weeks, label } = monthWeeks(),
      orig = state.weekStart;
    const planned = weeks.filter(w => {
      const sc = state.schedules[w];
      return sc && Object.values(sc).some(r => r && r.some(c => c && !['R', 'Y'].includes(c.k)));
    });
    if (
      planned.length &&
      !(await askConfirm(
        `${label} için ${weeks.length} hafta oluşturulacak. Daha önce planlanmış ${planned.length} hafta yeniden yapılacak (rapor ve yıllık izinler korunur). Devam edilsin mi?`
      ))
    )
      return;
    save();
    let i = 0;
    const step = () => {
      if (i >= weeks.length) {
        state.weekStart = orig;
        state.schedule = state.schedules[orig] || {};
        $('weekStart').value = orig;
        mDay = null;
        save();
        renderSheet();
        toast(`${label}: ${weeks.length} hafta oluşturuldu. Aylık özet tablonun altında.`);
        return;
      }
      const w = weeks[i];
      state.weekStart = w;
      if (!state.schedules[w]) state.schedules[w] = {};
      state.schedule = state.schedules[w];
      generateCore(emps);
      syncAraciHist(emps);
      save();
      toast(`${label}: ${i + 1}. hafta hazır (${weeks.length} hafta)…`);
      i++;
      setTimeout(step, 30);
    };
    step();
  }
  function generate() {
    const emps = sorted();
    if (!emps.length) {
      toast('Önce en az bir çalışan ekle.');
      return;
    }
    generateCore(emps);
    save();
    renderSheet();
    toast('Plan hazır. Bir kutuya tıklayarak vardiyayı veya saati değiştirebilirsin.');
  }

  /* ---------- Tablo ---------- */
  function dayDate(i, opts) {
    if (!state.weekStart) return '';
    const d = new Date(state.weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return opts === 'short'
      ? d.getDate() + '/' + (d.getMonth() + 1)
      : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  }
  function weekNo() {
    if (!state.weekStart) return '';
    const d = new Date(state.weekStart + 'T12:00:00');
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    return Math.floor((d.getDate() - 1 + ((first.getDay() + 6) % 7)) / 7) + 1;
  }
  let mDay = null;
  function mobileView(emps, cellHtml, totals, hasPlan, target, issues) {
    if (mDay === null) {
      mDay = 0;
      if (state.weekStart) {
        const st = new Date(state.weekStart + 'T00:00:00'),
          t = new Date();
        t.setHours(0, 0, 0, 0);
        const k = Math.round((t - st) / 864e5);
        if (k >= 0 && k < 7) mDay = k;
      }
    }
    const dayHasIssue = i => issues.some(x => x.startsWith(DAYS[i]) || x.includes(', ' + DAYS[i] + ':'));
    let h =
      `<div class="mview"><div class="dchips" role="group" aria-label="Gün seç">` +
      SHORT.map(
        (d, i) =>
          `<button type="button" class="dchip" data-mday="${i}" aria-pressed="${i === mDay}">${d}<small>${dayDate(i, 'short')}</small>${dayHasIssue(i) ? '<span class="dot" aria-label="uyarı var"></span>' : ''}</button>`
      ).join('') +
      `</div>`;
    h += `<div class="mday">${DAYS[mDay]} ${esc(dayDate(mDay))}${holidayOf(mDay) ? `<span class="tag hol">${esc(holidayOf(mDay))}</span>` : ''}${countOf(mDay) ? `<span class="tag cnt">${esc(countOf(mDay))}</span>` : ''}${mDay === FRI ? '<span class="tag akt">Aktüel</span>' : ''}${isPazar(mDay) ? '<span class="tag pzr">Pazar</span>' : ''}${state.sevk[mDay] ? '<span class="tag pzr">Sevkiyat</span>' : ''}${state.temizlik[mDay] ? '<span class="tag">Temizlik</span>' : ''}</div><ul class="mlist">`;
    for (const e of emps)
      h += `<li><div class="who"><b>${esc(e.name)}</b><small>${ROLE_NAMES[e.role]}</small></div><div>${cellHtml[e.id + '_' + mDay] || ''}</div></li>`;
    h +=
      `</ul><div class="mtot"><h3>Haftalık toplam</h3>` +
      emps
        .map(e => {
          const target = weekTargetFor(e),
            v = totals[e.id] || 0,
            bad = hasPlan && Math.abs(v - target) > 0.01;
          return `<div><span>${esc(e.name)}</span><span class="${bad ? 'bad' : ''}">${fmt(v)} / ${fmt(target)} saat</span></div>`;
        })
        .join('') +
      `</div></div>`;
    return h;
  }
  function syncAraciHist(emps) {
    if (!state.weekStart) return;
    state.araciHist = state.araciHist || {};
    const a = emps.find(e => {
      const c = cellOf(e.id, FRI);
      return c && c.k === 'A';
    });
    if (a) state.araciHist[state.weekStart] = a.id;
    else delete state.araciHist[state.weekStart];
    save();
    const el = $('araciHistList');
    if (!el) return;
    const rows = Object.entries(state.araciHist)
      .sort((x, y) => y[0].localeCompare(x[0]))
      .slice(0, 6);
    el.innerHTML = rows.length
      ? '<b style="display:block;margin-bottom:4px">Son aracılar</b>' +
        rows
          .map(([w, id]) => {
            const e = state.employees.find(x => x.id === id);
            const d = new Date(w + 'T12:00:00');
            return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid var(--line)"><span>${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} haftası</span><b>${esc(e ? e.name : '(silinmiş)')}</b></div>`;
          })
          .join('')
      : '';
  }
  const MONTHS = [
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
  const ymd = d =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  // Ay başı sekmesindeki günlük saat hedeflerine yaklaştırır: kişinin haftalık toplamını bozmadan
  // hedefin üstünde kalan günden kısıp hedefin altında kalan güne ekler (Cuma/Cumartesi uzun, Pazar kısa).
  function balanceDays(S, emps) {
    if (!state.weekStart || !window.__abDayTargets) return;
    const ds = [...Array(7)].map((_, d) => dateOf(d)),
      tg = {};
    for (const ym of new Set(ds.map(x => x.slice(0, 7)))) {
      const t = window.__abDayTargets(ym);
      if (t) Object.assign(tg, t);
    }
    if (!ds.some(x => tg[x] > 0)) return;
    const open = t2m(state.open),
      close = t2m(state.close),
      maxG = Math.max(4, (close - open) / 60 - 0.5);
    const part = Math.max(0, (t2m(state.araciMEnd) - open) / 60);
    const minG = (c, d) =>
      c.k === 'A' ? part + 2 : c.k === 'M' && d === FRI ? Math.max(6.5, (t2m(state.friMinEnd) - open) / 60) : 6.5;
    const setG = (c, g) => {
      const m = Math.round(g * 60);
      if (c.k === 'M') {
        c.s = state.open;
        c.e = m2t(open + m);
      } else if (c.k === 'E') {
        c.e = state.close;
        c.s = m2t(close - m);
      } else if (c.k === 'A') {
        c.s = state.open;
        c.e = state.araciMEnd;
        c.e2 = state.close;
        c.s2 = m2t(close - (m - Math.round(part * 60)));
      }
    };
    const movable = (c, d) =>
      c && ['M', 'E', 'A'].includes(c.k) && !c.lock && !c.cnt && !isFixedDay(d) && !holidayOf(d);
    const dayH = d =>
      emps.reduce((a, e) => {
        const c = S[e.id] && S[e.id][d];
        return a + (c && WORK.includes(c.k) ? netOf(c) : 0);
      }, 0);
    const days = [0, 1, 2, 3, 4, 5, 6].filter(d => tg[ds[d]] > 0 && !holidayOf(d));
    if (days.length < 2) return;
    const tot = days.reduce((a, d) => a + dayH(d), 0),
      ts = days.reduce((a, d) => a + tg[ds[d]], 0);
    if (!ts) return;
    const want = {};
    days.forEach(d => (want[d] = (tg[ds[d]] * tot) / ts));
    const sameMonth = (a, b) => state.weekMode === 'fixed' || ds[a].slice(0, 7) === ds[b].slice(0, 7);
    for (let it = 0; it < 300; it++) {
      const dev = {};
      days.forEach(d => (dev[d] = dayH(d) - want[d]));
      const pairs = [];
      for (const a of days)
        for (const b of days)
          if (a !== b && dev[a] > 0.5 && dev[b] < -0.5 && sameMonth(a, b)) pairs.push([dev[a] - dev[b], a, b]);
      pairs.sort((x, y) => y[0] - x[0]);
      let moved = false;
      for (const [, a, b] of pairs) {
        for (const e of shuffleL(emps.slice())) {
          const ca = S[e.id] && S[e.id][a],
            cb = S[e.id] && S[e.id][b];
          if (!movable(ca, a) || !movable(cb, b)) continue;
          const ga = grossOf(ca),
            gb = grossOf(cb),
            na = netOf(ca),
            nb = netOf(cb);
          for (const [da, db] of [
            [-0.5, 0.5],
            [-1, 1],
            [-0.5, 1],
            [-1, 0.5]
          ]) {
            const ga1 = ga + da,
              gb1 = gb + db;
            if (ga1 < minG(ca, a) || gb1 > maxG || gb1 < minG(cb, b) || forbidden(ga1) || forbidden(gb1)) continue;
            const sa = { ...ca },
              sb = { ...cb };
            setG(ca, ga1);
            setG(cb, gb1);
            const ok = Math.abs(netOf(ca) - na + (netOf(cb) - nb)) < 0.01 && netOf(ca) < na;
            if (ok) {
              moved = true;
              break;
            }
            Object.assign(ca, sa);
            Object.assign(cb, sb);
          }
          if (moved) break;
        }
        if (moved) break;
      }
      if (!moved) break;
    }
  }
  const shuffleL = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  function monthTargetOf(ym) {
    const [y, m] = ym.split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    const hak = dim === 31 ? 5 : 4;
    return (dim - hak) * (Number(state.leaveHours) || 7.5);
  }
  // Haftalık hedef: ayın kalan saatini, ayın henüz planlanmamış günlerine eşit dağıtır
  // Haftayı ay parçalarına böler; her parça için o aydan kalan saat ve izin (B) payını hesaplar.
  // Ayın son parçası kalanın tamamını alır, böylece ay sonunda toplam tam aylık hedefe oturur.
  function weekSegs(e) {
    if (e.temp && state.weekStart) {
      const n = tempDaysIn(e, dateOf(0), dateOf(6));
      return [
        {
          idx: [0, 1, 2, 3, 4, 5, 6],
          ym: null,
          last: true,
          target: Math.round(((45 * Math.min(n, 7)) / 7) * 2) / 2,
          needB: n >= 5 ? 1 : 0
        }
      ];
    }
    const all = {
      idx: [0, 1, 2, 3, 4, 5, 6],
      ym: null,
      last: true,
      target: isPart(e)
        ? Math.round((((Number(e.maxMonth) || PART_MONTH) * 7) / 30.44) * 2) / 2
        : Number(state.weekTarget) || 0,
      needB: isPart(e) ? PART_OFFS : 1
    };
    if (state.weekMode === 'fixed' || !state.weekStart) return [all];
    const ws = state.weekStart,
      st = new Date(ws + 'T12:00:00');
    const days = [...Array(7)].map((_, i) => {
      const d = new Date(st);
      d.setDate(st.getDate() + i);
      return ymd(d);
    });
    const segs = [...new Set(days.map(x => x.slice(0, 7)))].map(ym => {
      const idx = days.map((x, i) => (x.slice(0, 7) === ym ? i : -1)).filter(i => i >= 0);
      const [y, m] = ym.split('-').map(Number),
        dim = new Date(y, m, 0).getDate(),
        hak = dim === 31 ? 5 : 4;
      let done = Number((state.monthAdj[ym] || {})[e.id]) || 0,
        usedB = 0;
      const covered = new Set();
      for (const [w, sch] of Object.entries(state.schedules || {})) {
        if (w === ws) continue;
        const row = sch && sch[e.id];
        if (!row || !row.some(Boolean)) continue;
        const s0 = new Date(w + 'T12:00:00');
        for (let i = 0; i < 7; i++) {
          const d = new Date(s0);
          d.setDate(s0.getDate() + i);
          const k = ymd(d);
          if (k.slice(0, 7) !== ym || days.includes(k)) continue;
          covered.add(k);
          done += netOf(row[i]);
          if (row[i] && row[i].k === 'O') usedB++;
        }
      }
      // bugünden önceki, uygulamada kaydı olmayan günler: "Uygulama dışı saat" yazılmadıysa normal çalışılmış sayılır
      const adjSet = (state.monthAdj[ym] || {})[e.id] != null;
      const today = ymd(new Date());
      let past = 0;
      for (let dd = 1; dd <= dim; dd++) {
        const k = ym + '-' + String(dd).padStart(2, '0');
        if (k < today && !covered.has(k) && !days.includes(k)) past++;
      }
      const MT = monthTargetFor(e, ym);
      if (past && !adjSet) {
        done += (MT * past) / dim;
        usedB += (hak * past) / dim;
      }
      const open = dim - covered.size - past,
        last = open <= idx.length;
      const tgt = open > 0 ? ((MT - done) * idx.length) / open : 0;
      const needB = Math.max(0, hak - usedB),
        expB = open > 0 ? (needB * idx.length) / open : 0;
      return {
        idx,
        ym,
        last,
        target: Math.max(0, last ? Math.round(tgt * 4) / 4 : Math.round(tgt * 2) / 2),
        needB: Math.min(3, Math.max(0, Math.round(last ? needB : expB)))
      };
    });
    // part eleman: haftada 2 izin, ay parçalarına gün sayısına göre paylaştırılır
    if (isPart(e)) {
      let left = PART_OFFS;
      segs.forEach((g, i) => {
        const n = i === segs.length - 1 ? left : Math.min(left, Math.round((PART_OFFS * g.idx.length) / 7));
        g.needB = n;
        left -= n;
      });
    }
    return segs;
  }
  function weekTargetFor(e) {
    return Math.max(
      0,
      Math.min(
        70,
        weekSegs(e).reduce((a, s) => a + s.target, 0)
      )
    );
  }
  function monthStats(ym, emps) {
    const res = {};
    emps.forEach(e => (res[e.id] = { h: 0, b: 0 }));
    for (const [w, sch] of Object.entries(state.schedules || {})) {
      const st = new Date(w + 'T12:00:00');
      for (let i = 0; i < 7; i++) {
        const dt = new Date(st);
        dt.setDate(st.getDate() + i);
        if (ymd(dt).slice(0, 7) !== ym) continue;
        for (const e of emps) {
          const c = (sch[e.id] || [])[i];
          if (!c) continue;
          res[e.id].h += netOf(c);
          if (c.k === 'O') res[e.id].b++;
        }
      }
    }
    const adj = state.monthAdj[ym] || {};
    emps.forEach(e => (res[e.id].h += Number(adj[e.id]) || 0));
    // kaydı olmayan geçmiş günler (uygulama dışı saat yazılmadıysa) normal çalışılmış sayılır
    const [y, m] = ym.split('-').map(Number),
      dim = new Date(y, m, 0).getDate(),
      today = ymd(new Date());
    for (const e of emps) {
      if (adj[e.id] != null) continue;
      const cov = new Set();
      for (const [w, sch] of Object.entries(state.schedules || {})) {
        const row = sch && sch[e.id];
        if (!row || !row.some(Boolean)) continue;
        const st = new Date(w + 'T12:00:00');
        for (let i = 0; i < 7; i++) {
          const dt = new Date(st);
          dt.setDate(st.getDate() + i);
          cov.add(ymd(dt));
        }
      }
      let past = 0;
      for (let dd = 1; dd <= dim; dd++) {
        const k = ym + '-' + String(dd).padStart(2, '0');
        if (k < today && !cov.has(k)) past++;
      }
      if (past) {
        res[e.id].h += (monthTargetFor(e, ym) * past) / dim;
        res[e.id].assumed = past;
      }
    }
    return res;
  }
  function monthBlock(emps) {
    if (!state.weekStart)
      return '<div class="month no-print"><p class="hint">Aylık 195 saat takibi için üstten hafta başlangıcını seç.</p></div>';
    const st = new Date(state.weekStart + 'T12:00:00');
    const yms = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(st);
      dt.setDate(st.getDate() + i);
      const ym = ymd(dt).slice(0, 7);
      if (!yms.includes(ym)) yms.push(ym);
    }
    return yms
      .map(ym => {
        const [y, m] = ym.split('-').map(Number);
        const dim = new Date(y, m, 0).getDate();
        const hak = dim === 31 ? 5 : 4;
        const tgt = monthTargetOf(ym);
        const r = monthStats(ym, emps);
        const adj = state.monthAdj[ym] || {};
        return (
          `<div class="month"><h3>${MONTHS[m - 1]} ${y}: aylık ${fmt(tgt)} saat</h3>
      <div class="scroll"><table class="mtab"><thead><tr><th>Çalışan</th><th>Çalıştı</th><th>Kalan</th><th>İzin (B)</th><th class="no-print">Uygulama dışı saat</th></tr></thead><tbody>` +
          emps
            .map(e => {
              const h = r[e.id].h,
                te = isPart(e) ? monthTargetFor(e, ym) : tgt,
                k = Math.round((te - h) * 2) / 2;
              return `<tr><td class="nm">${esc(e.name)}${isPart(e) ? `<small style="display:block;color:var(--muted);font-weight:500">part, en fazla ${fmt(monthTargetFor(e, ym))}</small>` : ''}</td><td><b>${fmt(Math.round(h * 2) / 2)}${r[e.id].assumed ? '*' : ''}</b></td><td class="${k < 0 ? 'bad' : ''}">${k >= 0 ? fmt(k) : fmt(-k) + ' fazla'}</td><td class="${!isPart(e) && r[e.id].b > hak ? 'bad' : ''}">${r[e.id].b}${isPart(e) ? ' (haftada 2)' : ' / ' + hak}</td>
          <td class="no-print"><input type="number" step="0.5" min="0" data-adj="${ym}" data-emp="${e.id}" value="${adj[e.id] ? adj[e.id] : ''}" placeholder="0" aria-label="${esc(e.name)} ${MONTHS[m - 1]} uygulama dışı saat"></td></tr>`;
            })
            .join('') +
          `</tbody></table></div>${emps.some(e => r[e.id].assumed) ? `<p class="hint" style="margin:6px 0 0">* Ayın uygulamada kaydı olmayan geçmiş günleri normal çalışılmış (günde ${fmt(Math.round((tgt / new Date(y, m, 0).getDate()) * 100) / 100)} saat) sayıldı. Gerçek saat farklıysa “Uygulama dışı saat”e o günlerin toplamını yaz.</p>` : ''}<p class="hint" style="margin:6px 0 0">Bu ay uygulamada kayıtlı tüm haftaların toplamı (bu haftanın planı dahil). Uygulamayı kullanmadan önce çalışılan saatleri “Uygulama dışı saat”e yaz.</p></div>`
        );
      })
      .join('');
  }
  /* Hafta değiştir: hafta seçicisi, vardiya günü uyarısı ve "gelecek haftaya geç" düğmesi aynı yolu kullanır */
  function setWeek(w) {
    save();
    state.weekStart = w;
    $('weekStart').value = w || '';
    if (w) {
      if (!state.schedules[w]) state.schedules[w] = {};
      state.schedule = state.schedules[w];
    } else state.schedule = {};
    mDay = null;
    save();
    renderSheet();
  }
  const ymdOf = d =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function nextMon() {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7);
    return ymdOf(d);
  }
  function renderNext() {
    const el = $('vdNext');
    if (!el) return;
    const wd = (new Date().getDay() + 6) % 7,
      n = nextMon(),
      W = state.schedules[n],
      dolu = !!W && Object.values(W).some(r => Array.isArray(r) && r.some(c => c && c.k));
    const show = wd >= 3 && state.weekStart !== n && !dolu;
    el.hidden = !show;
    if (!show) return;
    const f = x => new Date(x + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
      e = new Date(n + 'T12:00:00');
    e.setDate(e.getDate() + 6);
    el.innerHTML = `<p><b>Gelecek haftanın planı boş (${f(n)} – ${f(ymdOf(e))}).</b> Şu an başka bir haftaya bakıyorsun; önce o haftaya geç, sonra Plan oluştur'a bas.</p><button type="button" class="btn primary" id="vdNextGo">Gelecek haftaya geç</button>`;
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#vdNextGo')) {
      setWeek(nextMon());
      window.scrollTo({ top: 0 });
      toast("Gelecek hafta açıldı. Şimdi Plan oluştur'a bas.");
    }
  });
  function renderSheet() {
    renderNext();
    const sheet = $('sheet');
    const emps = sorted();
    grpOv = leaveGroups(state.schedule, emps);
    const wn = weekNo();
    $('title').firstChild.textContent = wn ? `${wn}. hafta` : 'Haftalık vardiya';
    $('subtitle').textContent = state.weekStart ? `${dayDate(0)} – ${dayDate(6)}` : 'Market çalışma planı';
    if (!emps.length) {
      sheet.innerHTML = '<div class="intro">“Çalışanlar” bölümünden çalışan ekleyerek başla.</div>';
      return;
    }
    const hasPlan = emps.some(e => (state.schedule[e.id] || []).some(x => x && !['R', 'Y'].includes(x.k)));
    syncAraciHist(emps);
    const issues = [];
    const cellHtml = {},
      totals = {};
    let rows = '';
    for (const e of emps) {
      let h = 0,
        cells = '',
        offs = 0;
      for (let d = 0; d < 7; d++) {
        const c = cellOf(e.id, d);
        h += netOf(c);
        if (c && c.k === 'O') offs++;
        let warn = '';
        if (c && c.k === 'O' && d === FRI) warn = 'Cuma izin verilmez';
        else if (c && c.k === 'O' && countOf(d)) warn = 'Sayım günü izin verilmez';
        else if (c && c.k === 'O' && state.sunNoIzin && d === 6) warn = 'Pazar izin verilmez';
        else if (
          c &&
          c.k === 'O' &&
          state.oneOff &&
          !c.yl &&
          emps.some(
            o =>
              o !== e && isPart(o) === isPart(e) && cellOf(o.id, d) && cellOf(o.id, d).k === 'O' && !cellOf(o.id, d).yl
          )
        )
          warn = 'Aynı gün başka biri de izinli';
        else if (
          c &&
          c.k === 'O' &&
          !c.yl &&
          emps.some(
            o =>
              o !== e &&
              groupOf(o) === groupOf(e) &&
              cellOf(o.id, d) &&
              cellOf(o.id, d).k === 'O' &&
              !cellOf(o.id, d).yl
          )
        )
          warn = 'Eşiyle aynı gün izinli';
        else if (
          c &&
          c.k === 'T' &&
          !countPart(d) &&
          !emps.some(o => o !== e && cellOf(o.id, d) && ABSENT.includes(cellOf(o.id, d).k)) &&
          !emps.some(o => o !== e && groupOf(o) === groupOf(e) && cellOf(o.id, d) && ABSENT.includes(cellOf(o.id, d).k))
        )
          warn = 'Eşi izinli değil';
        else if (c && (c.k === 'M' || c.k === 'E' || c.k === 'A' || c.k === 'T') && forbidden(grossOf(c)))
          warn = 'Bu saat aralığı kullanılmaz';
        else if (c && c.k === 'M' && d === FRI && !isPart(e) && t2m(c.e) < t2m(state.friMinEnd))
          warn = `Cuma en erken ${state.friMinEnd}'te çıkılır`;
        else if (state.preFullE && isK(c, 'M') && isK(nb(state.schedule, e.id, d, 1), 'T'))
          warn = 'Ertesi gün tam gün, bugün akşamcı olmalı';
        else if (
          state.izinRule &&
          isK(c, 'T') &&
          (isK(nb(state.schedule, e.id, d, -1), 'O') || isK(nb(state.schedule, e.id, d, 1), 'O'))
        )
          warn = 'İzin ile tam gün yan yana olmamalı';
        else if (
          state.izinRule &&
          !isPart(e) &&
          (isK(c, 'E') || isK(c, 'A')) &&
          isK(nb(state.schedule, e.id, d, 1), 'O')
        )
          warn = 'Ertesi gün izinli, bugün sabahçı olmalı';
        else if (c && (c.k === 'M' || c.k === 'A') && !c.fx && !c.lock && backFromLeave(state.schedule, e.id, d))
          warn = 'Yıllık izinden dönüş günü akşamcı olmalı';
        else if (state.izinRule && !isPart(e) && isK(c, 'M') && isK(nb(state.schedule, e.id, d, -1), 'O'))
          warn = 'Dün izinliydi, bugün akşamcı olmalı';
        else if (state.noCloseOpen && c && c.k === 'M' && d > 0 && cellOf(e.id, d - 1) && cellOf(e.id, d - 1).k === 'E')
          warn = 'Kapanıştan sonra açılış';
        if (warn) issues.push(`${e.name}, ${DAYS[d]}: ${warn.toLocaleLowerCase('tr-TR')}.`);
        let cls = 'N',
          inner = '—';
        if (c) {
          cls = c.k;
          if (c.k === 'A')
            inner = `<small>${c.cnt ? 'Sayım' : 'Aracı'}</small>${esc(c.s)}–${esc(c.e)}<br>${esc(c.s2)}–${esc(c.e2)}`;
          else if (WORK.includes(c.k))
            inner = `<small>${c.cnt ? 'Sayım' : KINDS[c.k].label}</small>${esc(c.s)}<br>${esc(c.e)}`;
          else if (c.k === 'O') inner = 'B';
          else if (c.k === 'Y' && c.n) inner = `Y${c.n}<small>Yıllık izin</small>`;
          else if (c.k === 'Z') inner = '—<small>Görevde değil</small>';
          else inner = `${KINDS[c.k].label}<small>${fmt(netOf(c))} saat</small>`;
        }
        const lbl = c
          ? c.k === 'A'
            ? `${c.cnt ? 'Sayım' : 'Aracı'} ${c.s}–${c.e} ve ${c.s2}–${c.e2}`
            : WORK.includes(c.k)
              ? `${KINDS[c.k].label} ${c.s}–${c.e}`
              : KINDS[c.k]
                ? KINDS[c.k].label
                : 'Görevde değil'
          : 'Boş';
        const btnHtml = `<button type="button" class="cell ${cls}${warn ? ' warn' : ''}${c && c.lock ? ' locked' : ''}" data-emp="${e.id}" data-day="${d}" aria-haspopup="dialog"
        aria-label="${esc(e.name)}, ${DAYS[d]}: ${lbl}${warn ? '. Uyarı: ' + warn : ''}"${warn ? ` title="${warn}"` : ''}>${inner}</button>`;
        cellHtml[e.id + '_' + d] = btnHtml;
        cells += `<td>${btnHtml}</td>`;
      }
      {
        const expB = weekSegs(e).reduce((x, sg) => {
          const yC = sg.idx.filter(i => {
            const c = cellOf(e.id, i);
            return c && c.k === 'Y';
          }).length;
          return x + leaveCap(yC, sg.needB);
        }, 0);
        if (hasPlan && offs !== expB) issues.push(`${e.name} bu hafta ${offs} gün izinli, ${expB} olmalı.`);
      }
      totals[e.id] = h;
      const target = weekTargetFor(e),
        soft = state.weekMode !== 'fixed' && state.weekStart && !weekSegs(e).some(x => x.last);
      const diff = h - target,
        bad = hasPlan && Math.abs(diff) > 0.01 && !soft;
      rows += `<tr><td class="role" title="${ROLE_NAMES[e.role]}">${ROLES[e.role]}</td><td class="name">${esc(e.name)}<small class="mrole">${ROLES[e.role]}</small></td>${cells}
      <td class="total${bad ? ' bad' : ''}">${fmt(h)}<small>${hasPlan && Math.abs(diff) > 0.01 ? `${diff > 0 ? '+' : ''}${fmt(diff)}, ` : ''}hedef ${fmt(target)}${soft && hasPlan && Math.abs(diff) > 0.01 ? '<br>sonraki haftada dengelenir' : ''}</small></td></tr>`;
    }
    // gün bazlı kontroller
    if (hasPlan && state.araciOn) {
      const pa = prevAraci(),
        a = emps.find(e => {
          const c = cellOf(e.id, FRI);
          return c && c.k === 'A';
        });
      if (pa && a && a.id === pa) issues.push(`Cuma aracı geçen hafta da ${a.name} idi, bu hafta başkası olmalı.`);
    }
    if (
      hasPlan &&
      state.araciOn &&
      !holidayOf(FRI) &&
      !emps.some(e => {
        const c = cellOf(e.id, FRI);
        return c && c.k === 'A';
      })
    )
      issues.push('Cuma aracı yazılmadı.');
    if (hasPlan) {
      for (let d = 0; d < 7; d++) {
        const on = emps.filter(e => {
          const c = cellOf(e.id, d);
          return c && WORK.includes(c.k);
        });
        if (holidayOf(d)) continue;
        if (!on.length) {
          issues.push(`${DAYS[d]}: kimse çalışmıyor.`);
          continue;
        }
        const iv = [];
        on.forEach(e => {
          const c = cellOf(e.id, d);
          iv.push([t2m(c.s), t2m(c.e)]);
          if (c.k === 'A') iv.push([t2m(c.s2), t2m(c.e2)]);
        });
        iv.sort((a, b) => a[0] - b[0]);
        let reach = t2m(state.open),
          gap = '';
        for (const [s, e] of iv) {
          if (s > reach) {
            gap = `${m2t(reach)}–${m2t(s)}`;
            break;
          }
          reach = Math.max(reach, e);
        }
        if (!gap && reach < t2m(state.close)) gap = `${m2t(reach)}–${state.close}`;
        if (gap) issues.push(`${DAYS[d]}: ${gap} arası mağazada kimse yok.`);
        if (state.genderMix) {
          const gs = on.map(e => e.gender).filter(Boolean);
          // sadece önlenebilir durumda uyar: aynı gün sabah/akşam yer değiştirerek iki ekip de karma yapılabiliyorsa
          const mono = a => a.length >= 2 && a.every(g => g && g === a[0]);
          const fixedG = on.filter(e => cellOf(e.id, d).k === 'T').map(e => e.gender);
          const norm = on.filter(e => ['M', 'E', 'A'].includes(cellOf(e.id, d).k)),
            nM = norm.filter(e => cellOf(e.id, d).k === 'M').length;
          let avoidable = false;
          for (let mask = 0; mask < 1 << norm.length && !avoidable; mask++) {
            let c1 = 0;
            for (let i = 0; i < norm.length; i++) if ((mask >> i) & 1) c1++;
            if (c1 !== nM) continue;
            const o = [...fixedG],
              cl = [...fixedG];
            norm.forEach((e, i) => ((mask >> i) & 1 ? o : cl).push(e.gender));
            if (!mono(o) && !mono(cl)) avoidable = true;
          }
          if (new Set(gs).size > 1 && avoidable) {
            const team = k =>
              on
                .filter(e => {
                  const c = cellOf(e.id, d);
                  return c.k === 'T' || (k === 'o' ? c.k === 'M' : c.k === 'E' || c.k === 'A');
                })
                .map(e => e.gender);
            if (mono(team('o')))
              issues.push(
                `${DAYS[d]}: açılış ekibi tek cinsiyetten (${team('o')[0] === 'K' ? 'hepsi kadın' : 'hepsi erkek'}).`
              );
            if (mono(team('c')))
              issues.push(
                `${DAYS[d]}: kapanış ekibi tek cinsiyetten (${team('c')[0] === 'K' ? 'hepsi kadın' : 'hepsi erkek'}).`
              );
          }
        }
        if (state.staggerE) {
          const arr = on
            .map(e => {
              const c = cellOf(e.id, d);
              return c.k === 'E' ? c.s : c.k === 'A' && !c.cnt ? c.s2 : null;
            })
            .filter(Boolean);
          const dup = arr.find((t, i) => arr.indexOf(t) !== i);
          if (dup) issues.push(`${DAYS[d]}: akşamcılar aynı saatte (${dup}) geliyor.`);
          const dep = on
            .map(e => {
              const c = cellOf(e.id, d);
              return c.k === 'M' && !c.cnt ? c.e : null;
            })
            .filter(Boolean);
          const dd = dep.find((t, i) => dep.indexOf(t) !== i);
          if (dd) issues.push(`${DAYS[d]}: sabahçılar aynı saatte (${dd}) çıkıyor.`);
        }
        if (state.yetkili) {
          const opener = on.some(e => isYetkili(e) && t2m(cellOf(e.id, d).s) <= t2m(state.open));
          const closer = on.some(e => {
            const c = cellOf(e.id, d);
            return isYetkili(e) && (c.k === 'A' ? c.e2 : c.e) === state.close;
          });
          if (!opener) issues.push(`${DAYS[d]}: açılışta yetkili yok.`);
          if (!closer) issues.push(`${DAYS[d]}: kapanışta yetkili yok.`);
        }
      }
    }

    sheet.dataset.view = state.mView || 'table';
    sheet.innerHTML = `
    <div class="sheet-head">
      <h2>${wn ? wn + '. hafta' : 'Bu hafta'}</h2>
      <div class="mtoggle" role="group" aria-label="Görünüm"><button type="button" data-view="table" aria-pressed="${(state.mView || 'table') === 'table'}">Tablo</button><button type="button" data-view="day" aria-pressed="${state.mView === 'day'}">Gün gün</button></div>
      <div class="legend">${Object.values(KINDS)
        .map(k => `<span><i style="background:${k.color}"></i>${k.label}</span>`)
        .join('')}</div>
    </div>
    ${hasPlan ? '' : '<div class="intro no-print">Rapor ve yıllık izinler varsa önce tabloda işaretle (kutuya tıkla), sonra <b>Plan oluştur</b>\'a bas. Program bunları koruyarak planı kurar.</div>'}
    ${mobileView(emps, cellHtml, totals, hasPlan, null, issues)}
    <div class="scroll desk"><table class="grid">
      <thead><tr><th class="role">Görevi</th><th class="name">Adı Soyadı</th>${HEAD.map((d, i) => `<th>${d}<small>${dayDate(i, 'short')}</small>${holidayOf(i) ? `<span class="tag hol" title="${esc(holidayOf(i))}">Bayram</span>` : ''}${countOf(i) ? `<span class="tag cnt" title="${esc(countOf(i))}">Sayım</span>` : ''}${i === FRI && !holidayOf(i) ? '<span class="tag akt">Aktüel</span>' : ''}${isPazar(i) && !holidayOf(i) ? '<span class="tag pzr">Pazar</span>' : ''}</th>`).join('')}<th>Haf. Top.<br>Çal. Saat</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td class="role"></td><td class="lbl name">Sevkiyat</td>${state.sevk.map(v => `<td>${v ? '<span class="mark" aria-label="var">✓</span>' : ''}</td>`).join('')}<td></td></tr>
        <tr><td class="role"></td><td class="lbl name">Temizlik</td>${state.temizlik.map(v => `<td>${v ? '<span class="mark" aria-label="var">✓</span>' : ''}</td>`).join('')}<td></td></tr>
      </tfoot>
    </table></div>
    ${monthBlock(emps)}
    <div class="notes no-print">
      ${issues.length ? issues.map(t => `<p class="bad">${esc(t)}</p>`).join('') : hasPlan ? '<p>Tüm kurallar sağlanıyor, herkes hedef saatte.</p>' : ''}
      <p>Kutuya tıklayınca vardiya türünü ve saatlerini değiştirebilirsin. Bir saati değiştirdiğinde o gün sabitlenir (kesikli çerçeve) ve kişinin diğer günleri 45 saate göre kendiliğinden yeniden ayarlanır.</p>
    </div>`;
  }

  /* ---------- Hücre menüsü ---------- */
  const menu = $('menu');
  let menuAt = null,
    dirty = false;
  let leaveAt = null;
  function leaveInfo() {
    if (!leaveAt) return;
    const n = Math.max(1, Math.min(60, parseInt($('yDays').value, 10) || 0));
    const plan = leavePlan(leaveAt.id, dateOf(leaveAt.d), n),
      last = plan[plan.length - 1],
      sun = plan.filter(x => x.c.k === 'O').length,
      hol = plan.filter(x => x.c.k === 'H').length;
    const f = ds =>
      new Date(ds + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });
    $('yInfo').textContent =
      `${f(plan[0].ds)} – ${f(last.ds)}: ${n} gün yıllık izin (Y1–Y${n})${sun ? `, ${sun} Pazar B olarak geçer` : ''}${hol ? `, ${hol} bayram günü izinden sayılmaz` : ''}. İşe dönüş: ${(() => {
        const d = new Date(last.ds + 'T12:00:00');
        d.setDate(d.getDate() + 1);
        return f(ymd(d));
      })()}.`;
  }
  function openLeave(id, d) {
    if (!state.weekStart) {
      toast('Önce hafta başlangıcını seç.');
      return;
    }
    leaveAt = { id, d };
    const e = state.employees.find(x => x.id === id);
    $('yT').textContent = `${e ? e.name : ''}: yıllık izin`;
    $('yDays').value = 5;
    $('ySub').value = '';
    $('ySubBox').hidden = !(e && (e.role === 'MS' || e.role === 'MSY'));
    leaveInfo();
    $('yDlg').hidden = false;
    $('yDays').focus();
    $('yDays').select();
  }
  // İzni başka güne taşı: eski izin günü, yeni günün vardiyasını alır;
  // eşin tam günü de yeni izin gününe kayar. Sonra iki kişinin saatleri 45'e göre yeniden ayarlanır.
  // İzni başka güne taşır ve haftayı kurallara göre yeniden kurar: herkesin izin günleri sabit kalır,
  // tam gün eşleşmesi, izinden önce sabah / sonra akşam, tam günden önce akşam, saatler ve diğer kurallar yeniden uygulanır.
  // Haftadaki kural ihlallerini sayar (izin/tam gün yan yana, izin öncesi sabah, sonrası akşam, tam gün öncesi akşam, aynı gün iki izin, Cuma izni)
  function ruleViolations(S, emps) {
    let v = 0;
    grpOv = leaveGroups(S, emps);
    for (const e of emps) {
      const r = S[e.id] || [];
      for (let d = 0; d < 7; d++) {
        const k = r[d] && r[d].k,
          nx = d < 6 && r[d + 1] && r[d + 1].k,
          pv = d > 0 && r[d - 1] && r[d - 1].k;
        if (k === 'O' && d === FRI) v += 3;
        if (isPart(e)) continue;
        if (state.izinRule && ((k === 'O' && nx === 'T') || (k === 'T' && nx === 'O'))) v += 2;
        if (state.izinRule && k === 'O' && (pv === 'E' || pv === 'A')) v++;
        if (state.izinRule && k === 'O' && nx === 'M') v++;
        if (state.preFullE && k === 'T' && pv === 'M') v++;
        if ((k === 'M' || k === 'T') && !r[d].fx && backFromLeave(S, e.id, d)) v++;
      }
    }
    if (state.oneOff)
      for (let d = 0; d < 7; d++) {
        const n = emps.filter(
          e => !isPart(e) && S[e.id] && S[e.id][d] && S[e.id][d].k === 'O' && !S[e.id][d].yl
        ).length;
        if (n > 1) v += 2 * (n - 1);
      }
    // tam gün eşleşmesi: izinlinin eşi o gün tam gün olmalı; kimse izinli değilken tam gün olmamalı
    const hasP = emps.some(isPart),
      cell = (e, d) => S[e.id] && S[e.id][d];
    for (let d = 0; d < 7; d++) {
      if (countPart(d) || holidayOf(d)) continue;
      for (const e of emps) {
        if (isPart(e)) continue;
        const c = cell(e, d);
        if (!c) continue;
        const mates = emps.filter(o => o !== e && !isPart(o) && groupOf(o) === groupOf(e));
        if (
          c.k === 'O' &&
          !c.yl &&
          mates.length &&
          !(hasP && groupOf(e) === 'B') &&
          !mates.some(m => {
            const x = cell(m, d);
            return x && x.k === 'T';
          })
        )
          v += 2;
        if (
          c.k === 'T' &&
          !emps.some(o => o !== e && cell(o, d) && ['O', 'R'].includes(cell(o, d).k) && !cell(o, d).yl)
        )
          v += 1;
      }
    }
    return v;
  }
  // İzni başka güne taşır ve haftayı kurallara göre yeniden kurar. Önce herkesin izni yerinde kalarak denenir;
  // kural bozuluyorsa önce eşlerinin, gerekirse diğerlerinin izni de uygun güne kaydırılır. Seçtiğin gün hep korunur.
  function moveIzin(id, d) {
    const S = state.schedule,
      row = S[id] || [],
      emp = state.employees.find(x => x.id === id),
      emps = sorted();
    const before = JSON.parse(JSON.stringify(S));
    const offsOf = e => (before[e.id] || []).map((c, i) => (c && c.k === 'O' ? i : -1)).filter(i => i >= 0);
    const oldDays = offsOf({ id }).filter(i => i !== d);
    const mv = oldDays.length ? oldDays.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a)) : null;
    const mine = offsOf({ id }).filter(i => i !== mv);
    if (!mine.includes(d)) mine.push(d);
    const all = {};
    emps.forEach(e => (all[e.id] = e.id === id ? mine : offsOf(e)));
    const mates = emps.filter(e => e.id !== id && groupOf(e) === groupOf(emp)).map(e => e.id);
    const variants = [all, Object.fromEntries(Object.entries(all).filter(([k]) => !mates.includes(k))), { [id]: mine }];
    let best = null;
    for (const fo of variants) {
      for (let t = 0; t < 3; t++) {
        fixedOffs = fo;
        try {
          generateCore(emps);
        } finally {
          fixedOffs = null;
        }
        const v = ruleViolations(state.schedule, emps);
        let ch = 0;
        for (const e of emps)
          for (let i = 0; i < 7; i++) {
            const a = before[e.id] && before[e.id][i],
              b = state.schedule[e.id] && state.schedule[e.id][i];
            if ((a ? a.k : '-') !== (b ? b.k : '-')) ch++;
          }
        if (!best || v < best.v || (v === best.v && ch < best.ch))
          best = { v, ch, S: JSON.parse(JSON.stringify(state.schedule)) };
        if (v === 0) break;
      }
      if (best && best.v === 0) break;
    }
    state.schedule = best.S;
    if (state.weekStart) state.schedules[state.weekStart] = state.schedule;
    save();
    const who = new Set(),
      moved = [];
    for (const e of emps) {
      for (let i = 0; i < 7; i++) {
        const a = before[e.id] && before[e.id][i],
          b = state.schedule[e.id] && state.schedule[e.id][i];
        if ((a ? a.k : '-') !== (b ? b.k : '-')) who.add(e.name);
      }
      if (e.id !== id) {
        const o1 = offsOf(e).join(','),
          o2 = (state.schedule[e.id] || []).map((c, i) => (c && c.k === 'O' ? i : -1)).filter(i => i >= 0);
        if (o1 !== o2.join(',')) moved.push(`${e.name} ${o2.map(i => DAYS[i]).join(', ') || '-'}`);
      }
    }
    toast(
      `${emp ? emp.name : ''}: izin ${mv != null ? DAYS[mv] + ' yerine ' : ''}${DAYS[d]}. Kurallar yeniden uygulandı${moved.length ? '. Yeni izin günleri: ' + moved.join(', ') : ''}${best.v ? '. Bazı kurallar tutturulamadı, kırmızı uyarılara bak' : ''}.`
    );
  }
  const offsMap = () => {
    const o = {};
    sorted()
      .filter(e => (state.schedule[e.id] || []).some(Boolean))
      .forEach(
        e => (o[e.id] = (state.schedule[e.id] || []).map((c, i) => (c && c.k === 'O' ? i : -1)).filter(i => i >= 0))
      );
    return o;
  };
  // Haftayı sabitlenen izinler ve hücrelerle yeniden kurar; en az kural ihlali olan sonucu seçer
  function regenBest(fo, fc, before) {
    const emps = sorted();
    let best = null;
    for (let t = 0; t < 4; t++) {
      fixedOffs = fo;
      fixedCells = fc;
      try {
        generateCore(emps);
      } finally {
        fixedOffs = null;
        fixedCells = null;
      }
      const v = ruleViolations(state.schedule, emps);
      let ch = 0;
      for (const e of emps)
        for (let i = 0; i < 7; i++) {
          const a = before[e.id] && before[e.id][i],
            b = state.schedule[e.id] && state.schedule[e.id][i];
          if ((a ? a.k : '-') !== (b ? b.k : '-')) ch++;
        }
      if (!best || v < best.v || (v === best.v && ch < best.ch))
        best = { v, ch, S: JSON.parse(JSON.stringify(state.schedule)) };
      if (v === 0 && ch <= 3) break;
    }
    state.schedule = best.S;
    if (state.weekStart) state.schedules[state.weekStart] = state.schedule;
    save();
    const who = new Set();
    for (const e of emps)
      for (let i = 0; i < 7; i++) {
        const a = before[e.id] && before[e.id][i],
          b = state.schedule[e.id] && state.schedule[e.id][i];
        if ((a ? a.k : '-') !== (b ? b.k : '-')) who.add(e.name);
      }
    return { v: best.v, who: [...who] };
  }
  // Bir günü elle sabah / akşam / tam gün yapınca: o seçim sabit kalır, hafta kurallara göre yeniden kurulur
  function applyKind(id, d, k) {
    const before = JSON.parse(JSON.stringify(state.schedule)),
      emp = state.employees.find(x => x.id === id);
    const fo = offsMap(),
      wasOff = before[id] && before[id][d] && before[id][d].k === 'O';
    if (wasOff) delete fo[id];
    else fo[id] = (fo[id] || []).filter(i => i !== d);
    let pairMsg = '';
    if (k === 'T' && emp && !isPart(emp)) {
      const all = sorted(),
        hasP = all.some(isPart);
      const mates = all.filter(o => o.id !== id && !isPart(o) && groupOf(o) === groupOf(emp));
      if (mates.length && !(hasP && groupOf(emp) === 'B') && !mates.some(m => (fo[m.id] || []).includes(d))) {
        // eşlerden izni bu güne en yakın olanın iznini tam gün gününe al
        let best = null;
        for (const m of mates) {
          const mo = fo[m.id] || [];
          const dd = mo.length ? mo.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a)) : null;
          const cm = before[m.id] && before[m.id][d];
          if (cm && ['R', 'Y', 'H'].includes(cm.k)) continue;
          const sc = dd == null ? 99 : Math.abs(dd - d);
          if (!best || sc < best.sc) best = { m, dd, sc };
        }
        if (best) {
          fo[best.m.id] = (fo[best.m.id] || []).filter(i => i !== best.dd).concat([d]);
          pairMsg = `, ${best.m.name} izni ${best.dd != null ? DAYS[best.dd] + ' yerine ' : ''}${DAYS[d]} oldu`;
        }
      }
    }
    // önce olduğu gibi; kural bozulursa kişinin kendi izni, sonra diğer eşlerin izni serbest bırakılır (taşınan eş izni korunur)
    const movedMate = pairMsg
      ? Object.keys(fo).find(m => m !== id && (fo[m] || []).includes(d) && !(offsMap()[m] || []).includes(d))
      : null;
    // aynı gün iki izin olmasın: taşınan eşin yeni izin gününde başkasının izni varsa onunki serbest bırakılır
    if (movedMate && state.oneOff)
      sorted().forEach(o => {
        if (o.id !== id && o.id !== movedMate && !isPart(o) && (fo[o.id] || []).includes(d)) delete fo[o.id];
      });
    const fo2 = { ...fo };
    delete fo2[id];
    const fo3 = { ...fo2 };
    sorted().forEach(o => {
      if (o.id !== id && o.id !== movedMate && groupOf(o) === groupOf(emp)) delete fo3[o.id];
    });
    let r = null,
      bestS = null;
    for (const f of [fo, fo2, fo3]) {
      state.schedule = JSON.parse(JSON.stringify(before));
      const rr = regenBest(f, { [id]: { [d]: k } }, before);
      if (!r || rr.v < r.v) {
        r = rr;
        bestS = JSON.parse(JSON.stringify(state.schedule));
      }
      if (r.v === 0) break;
    }
    state.schedule = bestS;
    if (state.weekStart) state.schedules[state.weekStart] = state.schedule;
    save();
    toast(
      `${emp ? emp.name : ''}: ${DAYS[d]} ${KINDS[k].label.toLocaleLowerCase('tr-TR')} yapıldı. Kurallar yeniden uygulandı${pairMsg}${wasOff ? ', izin başka güne alındı' : ''}${r.v ? '. Bazı kurallar tutturulamadı, kırmızı uyarılara bak' : ''}.`
    );
  }
  // Yıllık izin: başlangıçtan itibaren n iş günü Y1, Y2…; Pazarlar B (haftalık izin), bayramlar sayılmaz. Gelecek haftalara da yazılır.
  function leavePlan(id, startDs, n) {
    const out = [];
    let k = 0;
    const d = new Date(startDs + 'T12:00:00');
    for (let g = 0; g < 120 && k < n; g++) {
      const ds = ymd(d),
        wd = (d.getDay() + 6) % 7;
      if (isHolidayDate(ds)) out.push({ ds, wd, c: { k: 'H' } });
      else if (wd === 6) out.push({ ds, wd, c: { k: 'O', yl: true } });
      else {
        k++;
        out.push({ ds, wd, c: { k: 'Y', n: k } });
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  function writeLeave(id, startDs, n) {
    const plan = leavePlan(id, startDs, n),
      before = JSON.parse(JSON.stringify(state.schedule));
    for (const x of plan) {
      const dt = new Date(x.ds + 'T12:00:00');
      dt.setDate(dt.getDate() - x.wd);
      const w = ymd(dt);
      const sc = w === state.weekStart ? state.schedule : (state.schedules[w] = state.schedules[w] || {});
      if (!sc[id]) sc[id] = Array(7).fill(null);
      sc[id][x.wd] = x.c;
    }
    // bu hafta: diğerlerinin izinleri sabit, kurallar yeniden
    const fo = offsMap();
    delete fo[id];
    const r = regenBest(fo, null, before);
    if (r.v) {
      let keep = JSON.parse(JSON.stringify(state.schedule)),
        v1 = r.v;
      const fm = { ...fo };
      const em = state.employees.find(x => x.id === id);
      sorted().forEach(o => {
        if (groupOf(o) !== 'A' || o.role === 'GT') delete fm[o.id];
      });
      for (const f of [fm, {}, {}]) {
        const r2 = regenBest(f, null, before);
        if (r2.v < v1) {
          v1 = r2.v;
          keep = JSON.parse(JSON.stringify(state.schedule));
        }
        if (!v1) break;
      }
      state.schedule = keep;
      if (state.weekStart) state.schedules[state.weekStart] = state.schedule;
      save();
    }
    return plan;
  }
  function refitPerson(id) {
    const e = state.employees.find(x => x.id === id);
    if (!e || !e.name.trim()) return;
    fitTimes(state.schedule, [e]);
    save();
  }
  function weekText(id) {
    const em = state.employees.find(x => x.id === id);
    const t = (state.schedule[id] || []).reduce((a, c) => a + netOf(c), 0),
      g = em ? weekTargetFor(em) : Number(state.weekTarget) || 0;
    return `Haftalık toplam: ${fmt(t)} / ${fmt(g)} saat${Math.abs(t - g) > 0.01 ? (state.manualEdit ? ` (${t > g ? '+' : ''}${fmt(t - g)} saat fark)` : ' (diğer günler bu kadar esneyemiyor)') : ''}`;
  }
  function findCell(id, d) {
    return (
      [...document.querySelectorAll(`.cell[data-emp="${id}"][data-day="${d}"]`)].find(x => x.offsetParent !== null) ||
      null
    );
  }
  function openMenu(id, d) {
    const btn = findCell(id, d);
    if (!btn) return;
    menuAt = { id, d };
    $('toast').classList.remove('show');
    const e = state.employees.find(x => x.id === id),
      c = cellOf(id, d);
    menu.innerHTML =
      `<p>${esc(e.name)}, ${DAYS[d]}</p><label class="mchk"><input type="checkbox" data-manual ${state.manualEdit ? 'checked' : ''}><span><b>Manuel yaz</b><br>Sadece bu kutu değişir, kurallar ve diğer günler elle bırakılır</span></label><div class="kinds">` +
      Object.entries(KINDS)
        .map(
          ([k, v]) =>
            `<button type="button" data-k="${k}" aria-current="${c && c.k === k}"><i style="background:${v.color}"></i>${v.label}</button>`
        )
        .join('') +
      `<button type="button" data-k="" style="grid-column:1/-1"><i style="border:1px dashed var(--muted)"></i>Boş bırak</button></div>` +
      (c && WORK.includes(c.k)
        ? `<div class="tm"><label>${c.k === 'A' ? 'Sabah başlar' : 'Başlangıç'}${tSel('s', c.s)}</label><label>${c.k === 'A' ? 'Sabah biter' : 'Bitiş'}${tSel('e', c.e)}</label>${c.k === 'A' ? `<label>Akşam başlar${tSel('s2', c.s2)}</label><label>Akşam biter${tSel('e2', c.e2)}</label>` : ''}<span class="net" id="netTxt">${netText(c)}</span>${c.lock ? '<button type="button" data-unlock style="grid-column:1/-1;justify-content:center;border:1px solid var(--line)">Bu saati otomatiğe bırak</button>' : ''}</div>`
        : '') +
      `<p class="net" id="wkTxt" style="margin:10px 6px 0;color:var(--ink)">${weekText(id)}</p>` +
      (c && WORK.includes(c.k)
        ? `<p style="margin:4px 6px 0;font-weight:500">${state.manualEdit ? 'Manuel: geliş ve çıkış saatini seç; başka hiçbir gün değişmez.' : 'Saati değiştirince bu gün sabitlenir, diğer günler 45 saate göre yeniden ayarlanır.'}</p>`
        : '') +
      `<button type="button" class="mclose" data-close>Kapat</button>`;
    menu.hidden = false;
    const r = btn.getBoundingClientRect(),
      vw = document.documentElement.clientWidth;
    let left = r.left + window.scrollX,
      top = r.bottom + window.scrollY + 6;
    const w = menu.offsetWidth,
      h = menu.offsetHeight;
    if (left + w > window.scrollX + vw - 8) left = window.scrollX + vw - w - 8;
    if (r.bottom + h + 6 > window.innerHeight && r.top > h) top = r.top + window.scrollY - h - 6;
    menu.style.left = Math.max(8, left) + 'px';
    menu.style.top = top + 'px';
    (menu.querySelector('[aria-current="true"]') || menu.querySelector('button')).focus();
  }
  function closeMenu(focusBack) {
    if (menu.hidden) return;
    menu.hidden = true;
    if (dirty) {
      dirty = false;
      renderSheet();
    }
    if (focusBack && menuAt) {
      const t = findCell(menuAt.id, menuAt.d);
      if (t) t.focus();
    }
  }
  menu.addEventListener('click', ev => {
    ev.stopPropagation();
    if (ev.target.closest('[data-close]')) {
      closeMenu(true);
      return;
    }
    if (ev.target.closest('[data-unlock]') && menuAt) {
      const { id, d } = menuAt;
      const c = state.schedule[id][d];
      if (c) {
        delete c.lock;
        refitPerson(id);
      }
      dirty = false;
      renderSheet();
      openMenu(id, d);
      return;
    }
    const b = ev.target.closest('button[data-k]');
    if (!b || !menuAt) return;
    const { id, d } = menuAt;
    const k = b.dataset.k;
    if (!state.schedule[id]) state.schedule[id] = Array(7).fill(null);
    const cur = state.schedule[id][d];
    if (state.manualEdit) {
      if (!k) state.schedule[id][d] = null;
      else if (!(cur && cur.k === k)) {
        const c = k === 'O' || k === 'Y' || k === 'R' || k === 'H' ? { k } : defaultCell(k, d);
        c.fx = true;
        if (WORK.includes(k)) c.lock = true;
        state.schedule[id][d] = c;
      }
      save();
      dirty = false;
      renderSheet();
      if (k && WORK.includes(k)) openMenu(id, d);
      else {
        menu.hidden = true;
        const t = findCell(id, d);
        if (t) t.focus();
      }
      return;
    }
    if (!k) state.schedule[id][d] = null;
    else if (k === 'O' && !(cur && cur.k === 'O')) {
      moveIzin(id, d);
      dirty = false;
      renderSheet();
      menu.hidden = true;
      const t = findCell(id, d);
      if (t) t.focus();
      return;
    } else if (k === 'Y' && !(cur && cur.k === 'Y')) {
      menu.hidden = true;
      openLeave(id, d);
      return;
    } else if (['M', 'E', 'T', 'R', 'A', 'H'].includes(k) && !(cur && cur.k === k)) {
      applyKind(id, d, k);
      dirty = false;
      renderSheet();
      menu.hidden = true;
      const t = findCell(id, d);
      if (t) t.focus();
      return;
    } else if (!(cur && cur.k === k)) state.schedule[id][d] = defaultCell(k, d);
    refitPerson(id);
    dirty = false;
    renderSheet();
    if (WORK.includes(k)) openMenu(id, d);
    else {
      menu.hidden = true;
      const t = findCell(id, d);
      if (t) t.focus();
    }
  });
  menu.addEventListener('change', ev => {
    if (ev.target.matches('[data-manual]')) {
      state.manualEdit = ev.target.checked;
      save();
      if (menuAt) openMenu(menuAt.id, menuAt.d);
      toast(
        state.manualEdit
          ? 'Manuel yazma açık: sadece seçtiğin kutu değişir.'
          : 'Manuel yazma kapalı: değişikliklerde kurallar yeniden uygulanır.'
      );
      return;
    }
    const f = ev.target.dataset.t;
    if (!f || !menuAt) return;
    const c = state.schedule[menuAt.id][menuAt.d];
    if (!c) return;
    if (!ev.target.value) return;
    c[f] = ev.target.value;
    c.lock = true;
    if (!state.manualEdit) refitPerson(menuAt.id);
    else {
      c.fx = true;
      save();
    }
    dirty = true;
    const n = $('netTxt');
    if (n) n.textContent = netText(c);
    const w = $('wkTxt');
    if (w) w.textContent = weekText(menuAt.id);
    if (!menu.querySelector('[data-unlock]') && n)
      n.insertAdjacentHTML(
        'afterend',
        '<button type="button" data-unlock style="grid-column:1/-1;justify-content:center;border:1px solid var(--line)">Bu saati otomatiğe bırak</button>'
      );
  });
  document.addEventListener('keydown', ev => {
    if (!menu.hidden && ev.key === 'Escape') closeMenu(true);
  });
  document.addEventListener('click', ev => {
    if (!menu.hidden && !menu.contains(ev.target) && !ev.target.closest('.cell')) closeMenu(false);
  });
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth !== lastW) {
      lastW = window.innerWidth;
      closeMenu(false);
    }
  });
  $('sheet').addEventListener('click', ev => {
    if (
      (document.body.dataset.role === 'staff' || document.body.classList.contains('giris-gt')) &&
      ev.target.closest('.cell[data-emp]')
    ) {
      toast('Vardiyayı MS ve MSY değiştirir.');
      return;
    }
    const vb = ev.target.closest('.mtoggle button[data-view]');
    if (vb) {
      state.mView = vb.dataset.view;
      save();
      renderSheet();
      return;
    }
    const dc = ev.target.closest('.dchip');
    if (dc) {
      mDay = Number(dc.dataset.mday);
      renderSheet();
      const b = document.querySelector(`.dchip[data-mday="${mDay}"]`);
      if (b) b.focus();
      return;
    }
    const c = ev.target.closest('.cell[data-emp]');
    if (!c) return;
    ev.stopPropagation();
    if (!menu.hidden) closeMenu(false);
    openMenu(c.dataset.emp, Number(c.dataset.day));
  });

  $('sheet').addEventListener('change', ev => {
    const t = ev.target;
    if (!t.dataset || !t.dataset.adj) return;
    const ym = t.dataset.adj;
    state.monthAdj[ym] = state.monthAdj[ym] || {};
    const v = parseFloat(String(t.value).replace(',', '.'));
    if (isNaN(v) || v <= 0) delete state.monthAdj[ym][t.dataset.emp];
    else state.monthAdj[ym][t.dataset.emp] = v;
    save();
    renderSheet();
  });
  $('holAdd').addEventListener('click', () => {
    const d = $('holDate').value;
    if (!d) {
      toast('Önce tarih seç.');
      return;
    }
    state.holidays = (state.holidays || []).filter(h => h.d !== d);
    state.holidays.push({ d, n: $('holName').value.trim() || 'Bayram' });
    $('holDate').value = '';
    $('holName').value = '';
    save();
    renderHolidays();
    renderSheet();
    toast('Bayram günü eklendi. O haftanın planını yeniden oluşturmayı unutma.');
  });
  $('holList').addEventListener('click', ev => {
    const b = ev.target.closest('[data-hdel]');
    if (!b) return;
    state.holidays = (state.holidays || []).filter(h => h.d !== b.dataset.hdel);
    save();
    renderHolidays();
    renderSheet();
  });
  $('cntAdd').addEventListener('click', () => {
    const d = $('cntDate').value;
    if (!d) {
      toast('Önce tarih seç.');
      return;
    }
    state.countDays = (state.countDays || []).filter(h => h.d !== d);
    state.countDays.push({ d, n: 'Sayım', part: $('cntPart').value });
    $('cntDate').value = '';
    $('cntName').value = '';
    save();
    renderCounts();
    renderSheet();
    toast('Sayım günü eklendi. O haftanın planını yeniden oluşturmayı unutma.');
  });
  $('cntList').addEventListener('click', ev => {
    const b = ev.target.closest('[data-cdel]');
    if (!b) return;
    state.countDays = (state.countDays || []).filter(h => h.d !== b.dataset.cdel);
    save();
    renderCounts();
    renderSheet();
  });
  /* ---------- yedekleme ---------- */
  const BK_TAG = 'VARDIYA-YEDEK-1:';
  function backupText() {
    return BK_TAG + JSON.stringify({ v: 1, at: new Date().toISOString(), data: state });
  }
  function bkInfo() {
    const n = state.employees.length,
      sk = ((state.skt && state.skt.items) || []).filter(i => !i.done).length,
      cat = Object.keys((state.skt && state.skt.catalog) || {}).length,
      w = Object.keys(state.schedules || {}).length;
    $('bkInfo').textContent =
      `Bu telefonda: ${n} çalışan, ${w} haftalık plan, ${sk} takipte ürün, ${cat} kayıtlı barkod.`;
  }
  $('bkShare').addEventListener('click', async () => {
    const text = backupText(),
      name = `vardiya-yedek-${new Date().toISOString().slice(0, 10)}.txt`;
    try {
      if (navigator.canShare && window.File) {
        const f = new File([text], name, { type: 'text/plain' });
        if (navigator.canShare({ files: [f] })) {
          await navigator.share({ files: [f], title: 'Vardiya yedeği' });
          return;
        }
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Vardiya yedeği', text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Yedek panoya kopyalandı. WhatsApp'ta kendine gönder.");
    } catch (e) {
      $('bkText').value = text;
      $('bkText').select();
      toast('Yedek kutuya yazıldı; seçip kopyala.');
    }
  });
  $('bkBox').addEventListener('toggle', bkInfo);
  $('bkCopy').addEventListener('click', async () => {
    const text = backupText();
    try {
      await navigator.clipboard.writeText(text);
      toast('Yedek panoya kopyalandı.');
    } catch (e) {
      $('bkText').value = text;
      $('bkText').select();
      toast('Yedek kutuya yazıldı; seçip kopyala.');
    }
  });
  $('bkFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      $('bkText').value = String(r.result || '');
      e.target.value = '';
      toast('Dosya okundu; “Geri yükle”ye bas.');
    };
    r.readAsText(f, 'utf-8');
  });
  $('bkRestore').addEventListener('click', async () => {
    let t = ($('bkText').value || '').trim();
    const i = t.indexOf(BK_TAG);
    if (i < 0) {
      toast('Bu bir yedek metni değil. Yedeğin tamamını yapıştır.');
      return;
    }
    let obj;
    try {
      obj = JSON.parse(t.slice(i + BK_TAG.length));
    } catch (e) {
      toast('Yedek eksik ya da bozuk; tamamını kopyaladığından emin ol.');
      return;
    }
    const d = obj && obj.data;
    if (!d || !Array.isArray(d.employees)) {
      toast('Yedek okunamadı.');
      return;
    }
    const when = obj.at ? new Date(obj.at).toLocaleString('tr-TR') : '';
    if (
      !(await askConfirm(
        `${when} tarihli yedek geri yüklensin mi? Bu telefondaki mevcut veriler yedektekiyle değişir.`
      ))
    )
      return;
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (e) {
      toast('Kaydedilemedi.');
      return;
    }
    toast('Yedek geri yüklendi, uygulama yenileniyor…');
    setTimeout(() => location.reload(), 600);
  });
  $('yDays').addEventListener('input', leaveInfo);
  $('yNo').addEventListener('click', () => {
    $('yDlg').hidden = true;
    leaveAt = null;
  });
  $('yOk').addEventListener('click', () => {
    if (!leaveAt) return;
    const n = Math.max(1, Math.min(60, parseInt($('yDays').value, 10) || 0)),
      { id, d } = leaveAt,
      e = state.employees.find(x => x.id === id);
    $('yDlg').hidden = true;
    leaveAt = null;
    const sub = $('ySub').value.trim(),
      isMgr = e && (e.role === 'MS' || e.role === 'MSY');
    if (isMgr && sub) {
      const pl = leavePlan(id, dateOf(d), n);
      state.employees.push({
        id: uid(),
        name: sub,
        role: 'PER',
        izin: 'auto',
        araciOk: false,
        gender: '',
        temp: true,
        tempFrom: pl[0].ds,
        tempTo: pl[pl.length - 1].ds
      });
      save();
      renderEmployees();
    }
    const plan = writeLeave(id, dateOf(d), n);
    renderSheet();
    const last = plan[plan.length - 1];
    toast(
      `${e ? e.name : ''}: ${n} gün yıllık izin yazıldı (bitiş ${new Date(last.ds + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}). Bu hafta kurallara göre yeniden kuruldu; sonraki haftalar oluşturulurken izin korunur.`
    );
  });
  $('genBtn').addEventListener('click', generate);
  $('genMonthBtn').addEventListener('click', generateMonth);
  $('fitBtn').addEventListener('click', () => {
    fitTimes(state.schedule, sorted());
    save();
    renderSheet();
    toast('Sabah ve akşam saatleri hedefe göre yeniden ayarlandı.');
  });
  $('printBtn').addEventListener('click', () => {
    if (window.AndroidApp && AndroidApp.print) AndroidApp.print();
    else window.print();
  });
  $('clearBtn').addEventListener('click', () => {
    const has = sc => sc && Object.values(sc).some(r => r && r.some(Boolean));
    $('clrWeekTxt').textContent = state.weekStart ? `${dayDate(0)} – ${dayDate(6)}` : 'Bu haftanın planı';
    if (state.weekStart) {
      const { weeks, label } = monthWeeks();
      $('clrMonthTxt').textContent = `${label}: ${weeks.filter(w => has(state.schedules[w])).length} planlı hafta`;
    } else $('clrMonthTxt').textContent = 'Önce hafta başlangıcını seç';
    $('clrDlg').hidden = false;
    $('clrNo').focus();
  });
  $('clrNo').addEventListener('click', () => {
    $('clrDlg').hidden = true;
  });
  $('clrDlg').addEventListener('click', async e => {
    const b = e.target.closest('[data-clr]');
    if (!b) return;
    const k = b.dataset.clr;
    $('clrDlg').hidden = true;
    if (k === 'week') {
      state.schedule = {};
      if (state.weekStart) state.schedules[state.weekStart] = state.schedule;
      save();
      renderSheet();
      toast('Hafta temizlendi.');
    } else if (k === 'month') {
      if (!state.weekStart) {
        toast('Önce hafta başlangıcını seç.');
        return;
      }
      const { weeks, label } = monthWeeks();
      if (!(await askConfirm(`${label} ayının tüm haftaları (${weeks.length} hafta) temizlensin mi?`, 'Temizle')))
        return;
      weeks.forEach(w => {
        state.schedules[w] = {};
        if (state.araciHist) delete state.araciHist[w];
      });
      state.schedule = state.schedules[state.weekStart] || {};
      state.schedules[state.weekStart] = state.schedule;
      save();
      renderSheet();
      toast(`${label} temizlendi.`);
    } else if (k === 'all') {
      if (
        !(await askConfirm(
          'Tüm haftaların vardiya planları kalıcı olarak silinsin mi? Gerekirse önce yedek al.',
          'Komple temizle'
        ))
      )
        return;
      state.schedules = {};
      state.schedule = {};
      state.araciHist = {};
      state.monthAdj = {};
      if (state.weekStart) state.schedules[state.weekStart] = state.schedule;
      save();
      renderSheet();
      toast('Tüm vardiya planları temizlendi.');
    }
  });

  renderEmployees();
  renderDays();
  initFixed();
  renderHolidays();
  renderCounts();
  renderSheet();
  bkInfo();
  if (window.matchMedia('(min-width:981px)').matches)
    document.querySelectorAll('details.sect').forEach(d => (d.open = true));
  // Bir günün mağazadaki toplam çalışma saati (vardiya planından; plan yoksa null)
  function dayHours(ds) {
    const d = new Date(ds + 'T12:00:00'),
      k = (d.getDay() + 6) % 7,
      mon = new Date(d);
    mon.setDate(d.getDate() - k);
    const sch = state.schedules && state.schedules[ymd(mon)];
    if (!sch) return null;
    let h = 0,
      any = false;
    for (const e of sorted()) {
      const c = (sch[e.id] || [])[k];
      if (c) {
        any = true;
        if (WORK.includes(c.k)) h += netOf(c);
      }
    }
    return any ? h : null;
  }
  const isHolidayDate = ds => (state.holidays || []).some(h => h.d === ds);
  // Mevcut listesi: ayın her günü için vardiyadan saat, mola ve izin harfi (B boş gün, Y yıllık izin, R rapor, H bayram)
  function mevcutOf(ym) {
    const [y, m] = ym.split('-').map(Number),
      dim = new Date(y, m, 0).getDate(),
      first = ym + '-01',
      last = ym + '-' + String(dim).padStart(2, '0');
    const emps = state.employees
      .filter(e => e.name.trim() && (!e.temp || (e.tempFrom <= last && e.tempTo >= first)))
      .map((e, i) => ({ e, i }))
      .sort((a, b) => ROLE_ORDER.indexOf(a.e.role) - ROLE_ORDER.indexOf(b.e.role) || a.i - b.i)
      .map(x => x.e);
    return emps.map(e => {
      const days = [];
      for (let d = 1; d <= dim; d++) {
        const dt = new Date(y, m - 1, d, 12),
          k = (dt.getDay() + 6) % 7,
          mon = new Date(dt);
        mon.setDate(d - k);
        const sch = state.schedules && state.schedules[ymd(mon)],
          c = sch && (sch[e.id] || [])[k];
        if (!c) days.push({ c: '', h: 0, mola: 0, plan: !!sch && Object.keys(sch).length > 0 });
        else if (WORK.includes(c.k)) {
          const g = grossOf(c);
          days.push({ c: 'w', h: netOf(c), mola: c.k === 'T' ? Number(state.tamMola) || 0 : molaFor(g), plan: true });
        } else days.push({ c: { O: 'B', R: 'R', Y: 'Y', H: 'H' }[c.k] || '', h: netOf(c), mola: 0, plan: true });
      }
      return { id: e.id, name: e.name, role: e.role, days, fiks: monthTargetFor(e, ym) };
    });
  }
  window.__vardiya = {
    mevcut: mevcutOf,
    state: () => state,
    save,
    toast,
    renderSheet,
    setWeek,
    esc,
    dayHours,
    isHolidayDate,
    staffCount: () => sorted().length,
    staffHours: ym => sorted().reduce((a, e) => a + monthTargetFor(e, ym), 0),
    monthTargetOf: ym => monthTargetOf(ym)
  };
})();
