  /* --- ciro planı --- */
  const DSH = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const fmtN = n => (n == null || n === '' || isNaN(n) ? '' : Math.round(n).toLocaleString('tr-TR'));
  const fmtH = n => (n == null || isNaN(n) ? '' : (Math.round(n * 10) / 10).toLocaleString('tr-TR'));
  const parseN = v => {
    const x = parseFloat(
      String(v || '')
        .replace(/\s|₺|\./g, '')
        .replace(',', '.')
    );
    return isFinite(x) ? x : null;
  };
  const parseH = v => {
    const x = parseFloat(String(v || '').replace(',', '.'));
    return isFinite(x) ? x : null;
  };
  function C() {
    const a = AB();
    if (!a.ciro) a.ciro = {};
    // Salı ve Cuma aktüel günü, Cumartesi en yoğun; Çarşamba ve Pazar sakin
    const NEW_W = [100, 104.5, 96, 100, 104.5, 109.5, 90];
    if (!a.weights || a.weights.join(',') === '100,100,100,100,104.5,109.5,90') a.weights = NEW_W.slice();
    return a;
  }
  function plan(m) {
    m = m || ym;
    const c = C().ciro;
    if (!c[m]) c[m] = { target: null, days: {} };
    if (!c[m].days) c[m].days = {};
    return c[m];
  }
  function monthDays(m) {
    const [y, mo] = m.split('-').map(Number),
      dim = new Date(y, mo, 0).getDate();
    return [...Array(dim)].map((_, i) => {
      const ds = `${m}-${pad(i + 1)}`,
        dt = new Date(ds + 'T12:00:00');
      return { i: i + 1, ds, wd: (dt.getDay() + 6) % 7 };
    });
  }
  // Hedefi gün oranlarına göre 50 ₺'lık birimlerle dağıtır. Her güne ay ve güne bağlı sabit küçük bir oynama
  // (±%1,5) eklenir ki sayılar doğal dursun; arka arkaya iki gün aynı olmaz; toplam tam hedefe eşit olur.
  function seedRand(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function distribute(m, target) {
    const days = monthDays(m),
      rnd = seedRand('ciro-' + m + '-' + (target || 0));
    const w = days.map(d => {
        const b = V.isHolidayDate(d.ds) ? 0 : Number(C().weights[d.wd]) || 0;
        return b ? b * (1 + (rnd() * 2 - 1) * 0.015) : 0;
      }),
      sw = w.reduce((a, b) => a + b, 0);
    if (!sw || !target) return days.map(() => 0);
    const unit = 50,
      units = Math.floor(target / unit),
      rest = target - units * unit;
    const raw = w.map(x => (units * x) / sw),
      base = raw.map(Math.floor);
    let left = units - base.reduce((a, b) => a + b, 0);
    raw
      .map((x, i) => ({ i, f: x - Math.floor(x) }))
      .sort((a, b) => b.f - a.f)
      .forEach(o => {
        if (left > 0 && w[o.i] > 0) {
          base[o.i]++;
          left--;
        }
      });
    const out = base.map(u => u * unit);
    if (rest) {
      const li = out
        .map((x, i) => (x > 0 ? i : -1))
        .filter(i => i >= 0)
        .pop();
      if (li != null) out[li] += rest;
    }
    // arka arkaya aynı tutar kalmasın: farklı bir günle 50-150 ₺ takas et (toplam değişmez)
    for (let i = 1; i < out.length; i++) {
      if (!out[i] || out[i] !== out[i - 1]) continue;
      const step = unit * (1 + Math.floor(rnd() * 3));
      let j = -1;
      for (let k = i + 2; k < out.length; k++)
        if (out[k] > 0) {
          j = k;
          break;
        }
      if (j < 0)
        for (let k = i - 2; k >= 0; k--)
          if (out[k] > 0) {
            j = k;
            break;
          }
      if (j >= 0) {
        out[i] += step;
        out[j] -= step;
      }
    }
    return out;
  }
  function rows(m) {
    m = m || ym;
    const P = plan(m),
      days = monthDays(m),
      pc = distribute(m, P.target),
      dh = distributeHours(m, P.hours, pc);
    const est = (V.staffHours ? V.staffHours(m) : V.staffCount() * V.monthTargetOf(m)) / days.length;
    let kp = 0,
      ko = 0,
      kh = 0,
      kho = 0,
      km = 0,
      nO = 0,
      nM = 0;
    return days.map((d, k) => {
      const r = P.days[d.i] || {},
        hol = V.isHolidayDate(d.ds);
      const hp = hol ? 0 : dh ? dh[k] : (V.dayHours(d.ds) ?? Math.round(est * 2) / 2),
        fromPlan = !!dh || V.dayHours(d.ds) != null;
      kp += pc[k];
      kh += hp;
      const o = r.ciro != null ? r.ciro : null,
        ho = r.saat != null ? r.saat : null,
        mu = r.mus != null ? r.mus : null;
      if (o != null) {
        ko += o;
        nO++;
      }
      if (ho != null) kho += ho;
      if (mu != null) {
        km += mu;
        nM++;
      }
      return {
        ...d,
        hol,
        pc: pc[k],
        kp,
        o,
        ko: o != null ? ko : null,
        avg: o != null ? ko / nO : null,
        hp,
        est: !fromPlan && !hol,
        kh,
        ho,
        kho: ho != null ? kho : null,
        perfP: kh ? Math.floor(kp / kh) : null,
        perfO: o != null && kho ? Math.floor(ko / kho) : null,
        mu,
        km: mu != null ? km : null,
        mavg: mu != null ? Math.round(km / nM) : null
      };
    });
  }
  function renderCiro() {
    window.__abYm = ym;
    window.__abRows = m => rows(m);
    if (window.__drawGraf) setTimeout(window.__drawGraf, 0);
    const P = plan(),
      R = rows(),
      today = new Date(),
      tds = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    if (document.activeElement !== $('cTarget')) $('cTarget').value = P.target ? fmtN(P.target) : '';
    const sug = V.staffHours ? V.staffHours(ym) : V.staffCount() * V.monthTargetOf(ym);
    if (document.activeElement !== $('hTarget')) $('hTarget').value = P.hours ? String(P.hours).replace('.', ',') : '';
    $('hTarget').placeholder = `Örn. ${fmtH(sug)}`;
    $('hHint').textContent = P.hours
      ? `Saat cironun oranına göre dağıtılıyor (toplam ${fmtH(P.hours)} saat).`
      : `Saat hedefi boşsa vardiya planındaki saatler kullanılır. Personel toplamı: ${fmtH(sug)} saat (${V.staffCount()} kişi; tam zamanlı ${fmtH(V.monthTargetOf(ym))}, part en fazla 120).`;
    // özet
    const lastO = [...R].reverse().find(r => r.o != null);
    const planToDate = lastO ? R[lastO.i - 1].kp : 0,
      pct = lastO && planToDate ? Math.round((lastO.ko * 100) / planToDate) : null;
    $('cSum').innerHTML = P.target
      ? `<div><b style="font-size:18px">${fmtN(P.target)}</b><span>Aylık hedef ₺</span></div><div class="${pct != null && pct < 100 ? 'exp' : ''}"><b style="font-size:18px">${lastO ? fmtN(lastO.ko) : '-'}</b><span>Gerçekleşen${pct != null ? ` (%${pct})` : ''}</span></div><div><b style="font-size:18px">${lastO && lastO.perfO ? fmtN(lastO.perfO) : '-'}</b><span>Performans (plan ${fmtN(R[R.length - 1].perfP)})</span></div>`
      : '';
    // tablo
    const th =
      '<thead><tr class="grp"><th></th><th colspan="2">Ciro</th><th colspan="3">Kümülatif ciro</th><th colspan="2">Çalışma saati</th><th colspan="2">Küm. saat</th><th colspan="2">Küm. performans</th><th colspan="3">Müşteri</th></tr><tr><th>Tarih</th><th>Plan</th><th>Olan</th><th>Plan</th><th>Olan</th><th>Ort.</th><th>Plan</th><th>Olan</th><th>Plan</th><th>Olan</th><th>Plan</th><th>Olan</th><th>Gün</th><th>Küm.</th><th>Ort.</th></tr></thead>';
    const tb = R.map(
      r => `<tr data-cday="${r.i}" class="${r.wd >= 4 ? 'we' : ''}${r.wd === 6 ? ' sun' : ''}${r.ds === tds ? ' today' : ''}${r.hol ? ' hol' : ''}"><td>${r.i} ${DSH[r.wd]}</td>
    <td class="p">${P.target ? fmtN(r.pc) : ''}</td><td class="o">${fmtN(r.o)}</td>
    <td class="p">${P.target ? fmtN(r.kp) : ''}</td><td class="o">${fmtN(r.ko)}</td><td class="o">${fmtN(r.avg)}</td>
    <td class="p"${r.est ? ' title="Vardiya planı yok, tahmini" style="font-style:italic;opacity:.7"' : ''}>${fmtH(r.hp)}</td><td class="o">${fmtH(r.ho)}</td>
    <td class="p">${fmtH(r.kh)}</td><td class="o">${fmtH(r.kho)}</td>
    <td class="p">${P.target && r.perfP ? fmtN(r.perfP) : ''}</td><td class="o">${fmtN(r.perfO)}</td>
    <td class="o">${fmtN(r.mu)}</td><td class="o">${fmtN(r.km)}</td><td class="o">${fmtN(r.mavg)}</td></tr>`
    ).join('');
    const L = R[R.length - 1];
    $('cTable').innerHTML =
      th +
      '<tbody>' +
      tb +
      `</tbody><tfoot><tr><td>Toplam</td><td class="p">${P.target ? fmtN(L.kp) : ''}</td><td class="o">${fmtN(lastO && lastO.ko)}</td><td></td><td></td><td></td><td class="p">${fmtH(L.kh)}</td><td class="o">${fmtH([...R].reverse().find(r => r.kho != null)?.kho)}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr></tfoot>`;
    // gün seçici
    const sel = $('cDay'),
      keep = sel.value;
    sel.innerHTML = R.map(r => `<option value="${r.i}">${r.i} ${DSH[r.wd]}${r.hol ? ' (bayram)' : ''}</option>`).join(
      ''
    );
    sel.value = keep && R[keep - 1] ? keep : ym === nowYm() ? String(today.getDate()) : '1';
    fillDay();
    // oranlar
    if (!$('cWeights').children.length || !$('cWeights').contains(document.activeElement))
      $('cWeights').innerHTML = DSH.map(
        (d, i) =>
          `<label>${d}<input data-cw="${i}" inputmode="decimal" value="${String(C().weights[i]).replace('.', ',')}"></label>`
      ).join('');
    const n = AB().tasks.length;
    $('abChkCount').textContent = n ? `(${AB().tasks.filter(t => isDone(t)).length}/${n})` : '';
  }
  function fillDay() {
    const i = Number($('cDay').value),
      R = rows(),
      r = R[i - 1];
    if (!r) return;
    const P = plan(),
      x = P.days[i] || {};
    $('cCiro').value = x.ciro != null ? fmtN(x.ciro) : '';
    $('cMus').value = x.mus != null ? x.mus : '';
    $('cSaat').value = x.saat != null ? String(x.saat).replace('.', ',') : '';
    $('cSaat').placeholder = r.hp ? `Plan: ${fmtH(r.hp)}` : 'Saat';
    $('cDayInfo').textContent = r.hol
      ? 'Bu gün bayram, mağaza kapalı.'
      : P.target
        ? `${r.i} ${DSH[r.wd]}: plan ${fmtN(r.pc)} ₺, ${fmtH(r.hp)} saat.`
        : 'Önce aylık ciro hedefini yazıp “Dağıt”a bas.';
  }
  $('cDay').addEventListener('change', fillDay);
  $('cApply').addEventListener('click', () => {
    const t = parseN($('cTarget').value),
      h = parseH($('hTarget').value);
    if ((!t || t < 1000) && !h) {
      V.toast('Ciro ya da saat hedefini yaz.');
      $('cTarget').focus();
      return;
    }
    const P = plan();
    if (t && t >= 1000) P.target = Math.round(t);
    P.hours = h && h > 0 ? Math.round(h * 2) / 2 : null;
    V.save();
    renderCiro();
    V.toast(
      `${P.target ? fmtN(P.target) + ' ₺' : ''}${P.target && P.hours ? ' ve ' : ''}${P.hours ? fmtH(P.hours) + ' saat' : ''} günlere dağıtıldı.`
    );
  });
  // Saat hedefini günlerin cirosuna orantılı dağıtır (tam saat birimleriyle, toplam hedefe eşit)
  function distributeHours(m, H, pc) {
    if (!H) return null;
    const days = monthDays(m);
    let w =
      pc && pc.some(x => x > 0)
        ? pc.slice()
        : days.map(d => (V.isHolidayDate(d.ds) ? 0 : Number(C().weights[d.wd]) || 0));
    const sw = w.reduce((a, b) => a + b, 0);
    if (!sw) return days.map(() => 0);
    const unit = Number.isInteger(H) ? 1 : 0.5,
      units = Math.floor(H / unit + 1e-9),
      rest = Math.round((H - units * unit) * 100) / 100;
    const raw = w.map(x => (units * x) / sw),
      base = raw.map(Math.floor);
    let left = units - base.reduce((a, b) => a + b, 0);
    raw
      .map((x, i) => ({ i, f: x - Math.floor(x) }))
      .sort((a, b) => b.f - a.f)
      .forEach(o => {
        if (left > 0 && w[o.i] > 0) {
          base[o.i]++;
          left--;
        }
      });
    const out = base.map(u => u * unit);
    if (rest) {
      const li = out
        .map((x, i) => (x > 0 ? i : -1))
        .filter(i => i >= 0)
        .pop();
      if (li != null) out[li] += rest;
    }
    return out;
  }
  $('hTarget').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('cApply').click();
  });
  $('cTarget').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('cApply').click();
  });
  $('cSave').addEventListener('click', () => {
    const i = Number($('cDay').value),
      P = plan(),
      x = P.days[i] || {};
    const c = parseN($('cCiro').value),
      mu = parseN($('cMus').value),
      h = parseH($('cSaat').value);
    x.ciro = c;
    x.mus = mu;
    if (h != null) x.saat = h;
    else if (c != null) {
      const r = rows()[i - 1];
      x.saat = r ? r.hp : null;
    } else x.saat = null;
    if (x.ciro == null && x.mus == null && x.saat == null) delete P.days[i];
    else P.days[i] = x;
    V.save();
    renderCiro();
    $('cDlg').hidden = true;
    V.toast(`${i}. gün kaydedildi.`);
  });
  $('cTable').addEventListener('click', e => {
    const tr = e.target.closest('[data-cday]');
    if (!tr) return;
    $('cDay').value = tr.dataset.cday;
    fillDay();
    $('cDlg').hidden = false;
    $('cCiro').focus();
  });
  $('cClose').addEventListener('click', () => {
    $('cDlg').hidden = true;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('cDlg').hidden) $('cDlg').hidden = true;
  });
  $('cWeights').addEventListener('change', e => {
    const inp = e.target.closest('[data-cw]');
    if (!inp) return;
    const v = parseH(inp.value);
    if (v == null || v < 0) return;
    C().weights[Number(inp.dataset.cw)] = v;
    V.save();
    renderCiro();
  });
  function portal(tur, key, text, ad) {
    const r = window.__bsGonder ? window.__bsGonder(tur, key, text) : 0;
    if (r) V.toast(r === 2 ? `${ad} güncellendi; BS portalda yeni halini görür.` : `${ad} portaldan BS'ye gönderildi.`);
    return r;
  }
  async function out(text, title, msg) {
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      V.toast(msg);
    } catch (e) {
      V.toast('Kopyalanamadı.');
    }
  }
  $('cCopy').addEventListener('click', () => {
    const R = rows(),
      num = n => (n == null ? '' : String(Math.round(n * 10) / 10).replace('.', ','));
    const head = [
      'Tarih',
      'Ciro plan',
      'Ciro olan',
      'Küm. ciro plan',
      'Küm. ciro olan',
      'Ortalama',
      'Saat plan',
      'Saat olan',
      'Küm. saat plan',
      'Küm. saat olan',
      'Performans plan',
      'Performans olan',
      'Müşteri',
      'Küm. müşteri',
      'Ort. müşteri'
    ];
    const lines = [
      head.join('\t'),
      ...R.map(r =>
        [
          `${r.i}.${ym.slice(5)}.${ym.slice(0, 4)}`,
          num(r.pc),
          num(r.o),
          num(r.kp),
          num(r.ko),
          num(r.avg && Math.round(r.avg)),
          num(r.hp),
          num(r.ho),
          num(r.kh),
          num(r.kho),
          num(r.perfP),
          num(r.perfO),
          num(r.mu),
          num(r.km),
          num(r.mavg)
        ].join('\t')
      )
    ];
    out(lines.join('\n'), 'Ciro tablosu', "Tablo kopyalandı; Excel'de bir hücreye yapıştır.");
  });
  $('cShare').addEventListener('click', () => {
    const P = plan(),
      R = rows();
    if (!P.target) {
      V.toast('Önce hedef gir.');
      return;
    }
    const [y, m] = ym.split('-').map(Number),
      lastO = [...R].reverse().find(r => r.o != null);
    const lines = [`CİRO: ${MON[m - 1]} ${y}`, `Hedef: ${fmtN(P.target)} ₺`];
    if (lastO) {
      const pt = R[lastO.i - 1].kp;
      lines.push(
        `${lastO.i}. güne kadar plan: ${fmtN(pt)} ₺, olan: ${fmtN(lastO.ko)} ₺ (%${Math.round((lastO.ko * 100) / pt)})`,
        `Günlük ortalama: ${fmtN(lastO.avg)} ₺`,
        `Performans: ${fmtN(lastO.perfO)} (plan ${fmtN(R[lastO.i - 1].perfP)})`
      );
      if (lastO.km) lines.push(`Müşteri: ${fmtN(lastO.km)} (ort. ${fmtN(lastO.mavg)})`);
    }
    out(lines.join('\n'), 'Ciro özeti', 'Özet kopyalandı.');
  });

