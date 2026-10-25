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
