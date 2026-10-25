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

