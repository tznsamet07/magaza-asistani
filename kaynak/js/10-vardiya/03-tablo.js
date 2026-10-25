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
