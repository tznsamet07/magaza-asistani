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
