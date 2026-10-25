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

