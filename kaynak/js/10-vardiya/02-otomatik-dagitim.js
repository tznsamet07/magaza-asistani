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

