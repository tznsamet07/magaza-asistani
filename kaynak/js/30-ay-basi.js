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

  /* --- BS raporu: ayın ürünleri (kod, ad, fiyat) + günlük adet, ciro, müşteri --- */
  function F(m) {
    const a = AB();
    if (!a.focus) a.focus = {};
    if (!a.focus[m]) a.focus[m] = { items: [], sales: {} };
    return a.focus[m];
  }
  const isoToday = () => {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const rpYm = () => ($('rpDate').value || isoToday()).slice(0, 7),
    rpI = () => Number(($('rpDate').value || isoToday()).slice(8, 10));
  const parseP = v => {
    let t = String(v || '').replace(/\s|₺/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    const x = parseFloat(t);
    return isFinite(x) ? x : null;
  };
  const TLf = n =>
    (Math.round((n || 0) * 100) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    ' ₺';
  let rpEditId = null;
  // Ürün kodu kataloğu: bir kez girilen kodun adı ve fiyatı hatırlanır (tüm aylar için)
  function bsCat() {
    const a = AB();
    if (!a.bsCat) {
      a.bsCat = {};
      Object.values(a.focus || {}).forEach(f =>
        (f.items || []).forEach(it => {
          if (it.code) a.bsCat[it.code] = { name: it.name, price: it.price != null ? it.price : null };
        })
      );
    }
    return a.bsCat;
  }
  let rpAuto = false;
  function rpFromCode() {
    const c = bsCat()[$('rpCode').value.trim()];
    if (c) {
      if (!$('rpName').value || rpAuto) {
        $('rpName').value = c.name || '';
        $('rpPrice').value = c.price != null ? String(c.price).replace('.', ',') : '';
        rpAuto = true;
      }
    } else if (rpAuto) {
      $('rpName').value = '';
      $('rpPrice').value = '';
      rpAuto = false;
    }
  }
  function monthTot(f, id, i) {
    return Object.entries(f.sales)
      .filter(([d]) => Number(d) <= i)
      .reduce((a, [, v]) => a + (Number(v[id]) || 0), 0);
  }
  function renderBs() {
    if (!$('rpDate').value) $('rpDate').value = isoToday();
    $('rpStore').value = AB().store || ((window.__giris && window.__giris()) || {}).magaza || '';
    fillRep();
    const f = F(rpYm());
    $('rpItems').innerHTML = f.items.length
      ? f.items
          .map(
            it =>
              `<li class="rp-item"><div><b>${esc(it.name)}</b><small>${it.code ? 'Kod ' + esc(it.code) + ', ' : ''}${it.price != null ? TLf(it.price) : 'fiyat yok'}</small></div><button type="button" class="btn small" data-rped="${it.id}">Düzenle</button><button type="button" class="del" data-rpdel="${it.id}" aria-label="${esc(it.name)} ürününü sil">×</button></li>`
          )
          .join('')
      : '<li class="sempty" style="padding:10px">Bu ay için ürün eklenmedi.</li>';
  }
  function fillRep() {
    const m = rpYm(),
      i = rpI(),
      x = plan(m).days[i] || {},
      f = F(m),
      sd = f.sales[i] || {};
    $('rpCiro').value = x.ciro != null ? fmtN(x.ciro) : '';
    $('rpMus').value = x.mus != null ? x.mus : '';
    const ir = (f.irs || {})[i] || {};
    $('irsN').value = ir.n != null ? ir.n : '';
    $('irsG').setAttribute('aria-pressed', !!ir.g);
    $('irsT').setAttribute('aria-pressed', !!ir.t);
    $('irsNone').checked = !!ir.none;
    irsUi();
    $('rpList').innerHTML = f.items.length
      ? f.items
          .map(
            it =>
              `<li class="rp-row" data-rprow="${it.id}"><div><b>${esc(it.name)}</b><small>${it.code ? 'Kod ' + esc(it.code) + ' · ' : ''}${it.price != null ? TLf(it.price) : 'fiyat yok'} · ay: ${fmtN(monthTot(f, it.id, i))} adet</small></div><input data-rpq="${it.id}" inputmode="numeric" value="${sd[it.id] != null ? sd[it.id] : ''}" placeholder="0" aria-label="${esc(it.name)} satılan adet"><span class="rp-amt" data-rpamt="${it.id}"></span></li>`
          )
          .join('')
      : '<li class="sempty" style="padding:10px">Önce aşağıdan ayın ürünlerini ekle.</li>';
    calcRep();
  }
  function curQty() {
    const o = {};
    document.querySelectorAll('#rpList [data-rpq]').forEach(inp => {
      const v = parseN(inp.value);
      if (v != null) o[inp.dataset.rpq] = v;
    });
    return o;
  }
  function calcRep() {
    const f = F(rpYm()),
      q = curQty();
    let n = 0,
      t = 0;
    f.items.forEach(it => {
      const a = Number(q[it.id]) || 0,
        amt = it.price != null ? a * it.price : null;
      n += a;
      if (amt) t += amt;
      const el = document.querySelector(`[data-rpamt="${it.id}"]`);
      if (el) el.textContent = a && amt != null ? TLf(amt) : '';
    });
    $('rpTot').innerHTML = f.items.length ? `<span>Toplam</span><b>${fmtN(n)} adet</b><b>${TLf(t)}</b>` : '';
  }
  function saveRep() {
    const m = rpYm(),
      i = rpI(),
      P = plan(m),
      x = P.days[i] || {},
      f = F(m);
    const c = parseN($('rpCiro').value),
      mu = parseN($('rpMus').value);
    x.ciro = c;
    x.mus = mu;
    if (x.saat == null && c != null && m === ym) {
      const r = rows()[i - 1];
      x.saat = r ? r.hp : null;
    }
    if (x.ciro == null && x.mus == null && x.saat == null) delete P.days[i];
    else P.days[i] = x;
    const sd = curQty();
    if (Object.keys(sd).length) f.sales[i] = sd;
    else delete f.sales[i];
    if (!f.irs) f.irs = {};
    const ir = {
      n: parseN($('irsN').value),
      g: $('irsG').getAttribute('aria-pressed') === 'true',
      t: $('irsT').getAttribute('aria-pressed') === 'true',
      none: $('irsNone').checked
    };
    if (ir.n == null && !ir.g && !ir.t && !ir.none) delete f.irs[i];
    else f.irs[i] = ir;
    AB().store = $('rpStore').value.trim();
    V.save();
    if (m === ym) renderCiro();
    fillRep();
  }
  function repText() {
    const m = rpYm(),
      i = rpI(),
      [y, mo] = m.split('-').map(Number),
      wd = (new Date(y, mo - 1, i).getDay() + 6) % 7,
      x = plan(m).days[i] || {},
      f = F(m),
      sd = f.sales[i] || {};
    const L = [
      `${AB().store ? AB().store + ' - ' : ''}${i} ${MON[mo - 1]} ${y} ${['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][wd]}`
    ];
    L.push(`Ciro: ${x.ciro != null ? fmtN(x.ciro) + ' ₺' : '-'}`, `Müşteri: ${x.mus != null ? fmtN(x.mus) : '-'}`);
    const ir = (f.irs || {})[i];
    if (ir)
      L.push(
        ir.none
          ? 'İrsaliye: bugün gelmedi'
          : `İrsaliye${ir.n != null ? ' (' + fmtN(ir.n) + ' adet)' : ''}: girildi ${ir.g ? '✅' : '❌'}, takıldı ${ir.t ? '✅' : '❌'}`
      );
    if (f.items.length) {
      let n = 0,
        t = 0;
      L.push('', 'Ayın ürünleri:');
      f.items.forEach(it => {
        const a = Number(sd[it.id]) || 0,
          amt = it.price != null ? a * it.price : null;
        n += a;
        if (amt) t += amt;
        L.push(
          `${it.code ? it.code + ' ' : ''}${it.name}: ${fmtN(a)} adet${amt != null ? ' = ' + TLf(amt) : ''} (ay: ${fmtN(monthTot(f, it.id, i))})`
        );
      });
      L.push(`Toplam: ${fmtN(n)} adet, ${TLf(t)}`);
    }
    return L.join('\n');
  }
  function rpReset() {
    rpEditId = null;
    rpAuto = false;
    $('rpCode').value = '';
    $('rpName').value = '';
    $('rpPrice').value = '';
    $('rpAdd').textContent = 'Ekle';
    $('rpCancel').hidden = true;
  }
  $('rpDate').addEventListener('change', renderBs);
  function irsUi() {
    const n = $('irsNone').checked;
    document.querySelector('#bsDaily .irs').classList.toggle('off', n);
  }
  ['irsG', 'irsT'].forEach(id =>
    $(id).addEventListener('click', () => {
      const b = $(id);
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
      if (b.getAttribute('aria-pressed') === 'true') {
        $('irsNone').checked = false;
        irsUi();
      }
    })
  );
  $('irsNone').addEventListener('change', () => {
    if ($('irsNone').checked) {
      $('irsG').setAttribute('aria-pressed', 'false');
      $('irsT').setAttribute('aria-pressed', 'false');
      $('irsN').value = '';
    }
    irsUi();
  });
  $('rpStore').addEventListener('change', () => {
    AB().store = $('rpStore').value.trim();
    V.save();
  });
  $('rpList').addEventListener('input', e => {
    if (e.target.closest('[data-rpq]')) calcRep();
  });
  $('rpSave').addEventListener('click', () => {
    saveRep();
    V.toast(`${rpI()}. gün kaydedildi.`);
  });
  $('rpSend').addEventListener('click', () => {
    saveRep();
    if (!portal('rapor', $('rpDate').value || isoToday(), repText(), 'Rapor'))
      out(repText(), 'BS raporu', "Rapor kopyalandı; WhatsApp'ta BS'ye yapıştır.");
  });
  $('rpWa').addEventListener('click', () => {
    saveRep();
    out(repText(), 'BS raporu', "Rapor kopyalandı; WhatsApp'ta BS'ye yapıştır.");
  });
  $('rpAdd').addEventListener('click', () => {
    const name = $('rpName').value.trim(),
      code = $('rpCode').value.trim(),
      price = parseP($('rpPrice').value);
    if (!name) {
      V.toast('Ürün adını yaz.');
      $('rpName').focus();
      return;
    }
    const f = F(rpYm());
    if (!rpEditId && code && f.items.some(x => x.code === code)) {
      V.toast('Bu kod bu ayın listesinde zaten var.');
      return;
    }
    if (rpEditId) {
      const it = f.items.find(x => x.id === rpEditId);
      if (it) {
        it.name = name;
        it.code = code;
        it.price = price;
      }
    } else f.items.push({ id: uid(), code, name, price });
    if (code) bsCat()[code] = { name, price };
    rpAuto = false;
    rpReset();
    V.save();
    renderBs();
    $('rpCode').focus();
  });
  $('rpCancel').addEventListener('click', rpReset);
  $('rpCode').addEventListener('input', rpFromCode);
  $('rpName').addEventListener('input', () => {
    rpAuto = false;
  });
  $('rpPrice').addEventListener('input', () => {
    rpAuto = false;
  });
  $('rpName').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('rpAdd').click();
    }
  });
  $('rpItems').addEventListener('click', async e => {
    const f = F(rpYm());
    const ed = e.target.closest('[data-rped]');
    if (ed) {
      const it = f.items.find(x => x.id === ed.dataset.rped);
      if (!it) return;
      rpEditId = it.id;
      $('rpCode').value = it.code || '';
      $('rpName').value = it.name;
      $('rpPrice').value = it.price != null ? String(it.price).replace('.', ',') : '';
      $('rpAdd').textContent = 'Kaydet';
      $('rpCancel').hidden = false;
      $('rpName').focus();
      return;
    }
    const b = e.target.closest('[data-rpdel]');
    if (!b) return;
    const it = f.items.find(x => x.id === b.dataset.rpdel);
    if (!it) return;
    if (!(await window.askConfirm(`“${it.name}” bu ayın listesinden çıkarılsın mı?`))) return;
    f.items = f.items.filter(x => x !== it);
    Object.values(f.sales).forEach(v => delete v[it.id]);
    V.save();
    renderBs();
  });
  $('rpCopyPrev').addEventListener('click', () => {
    const [y, m] = rpYm().split('-').map(Number),
      d = new Date(y, m - 2, 1),
      pm = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    const prev = (AB().focus || {})[pm];
    if (!prev || !prev.items.length) {
      V.toast('Geçen ay için ürün yok.');
      return;
    }
    const f = F(rpYm()),
      have = new Set(f.items.map(x => (x.code || '') + '|' + x.name.toLocaleLowerCase('tr-TR')));
    let n = 0;
    prev.items.forEach(it => {
      if (!have.has((it.code || '') + '|' + it.name.toLocaleLowerCase('tr-TR'))) {
        f.items.push({ id: uid(), code: it.code || '', name: it.name, price: it.price != null ? it.price : null });
        n++;
      }
    });
    V.save();
    renderBs();
    V.toast(n ? `${n} ürün eklendi.` : 'Hepsi zaten listede.');
  });

  /* --- BS bilgi toplama listeleri + Excel (.xlsx) çıktısı --- */
  const COL = () => {
    const a = AB();
    if (!Array.isArray(a.collect)) a.collect = [];
    return a.collect;
  };
  let colId = null,
    colEdit = -1;
  document.querySelector('#bsView .sfilter').addEventListener('click', e => {
    const b = e.target.closest('[data-bsm]');
    if (!b) return;
    document.querySelectorAll('#bsView [data-bsm]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $('bsDaily').hidden = b.dataset.bsm !== 'daily';
    $('bsCol').hidden = b.dataset.bsm !== 'col';
    $('bsRc').hidden = b.dataset.bsm !== 'rc';
    renderCol();
    renderRc();
  });
  const cur = () => COL().find(c => c.id === colId);
  const fmtDT = iso => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  function renderCol() {
    const c = cur();
    $('colHome').hidden = !!c;
    $('colOpen').hidden = !c;
    if (!c) {
      const L = COL()
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at));
      $('colLists').innerHTML = L.length
        ? L.map(
            x =>
              `<li class="rp-item" data-colopen="${x.id}" style="cursor:pointer"><div><b>${esc(x.title)}</b><small>${x.rows.length} satır · ${esc(x.cols.join(', '))} · ${fmtDT(x.at)}</small></div><span class="btn small">Aç</span><span></span></li>`
          ).join('')
        : '<li class="sempty" style="padding:10px">Henüz liste yok.</li>';
      return;
    }
    $('colName').textContent = c.title;
    $('colInfo').textContent = `${c.rows.length} satır. Satıra dokununca düzenlenir.`;
    const num = v => v !== '' && !isNaN(Number(String(v).replace(',', '.')));
    const sums = c.cols.map((h, k) =>
      c.rows.length &&
      c.rows.every(r => r[k] === '' || num(r[k])) &&
      c.rows.some(r => num(r[k])) &&
      !/kod|barkod/i.test(h)
        ? c.rows.reduce((a, r) => a + (num(r[k]) ? Number(String(r[k]).replace(',', '.')) : 0), 0)
        : null
    );
    $('colTable').innerHTML =
      `<thead><tr><th>#</th>${c.cols.map(h => `<th>${esc(h)}</th>`).join('')}<th></th></tr></thead><tbody>${c.rows.map((r, i) => `<tr data-colrow="${i}"${i === colEdit ? ' class="ed"' : ''}><td>${i + 1}</td>${c.cols.map((_, k) => `<td>${esc(r[k] || '')}</td>`).join('')}<td><button type="button" class="del" data-coldel="${i}" aria-label="Satırı sil">×</button></td></tr>`).join('') || `<tr><td colspan="${c.cols.length + 2}" class="sempty">Henüz satır yok, aşağıdan ekle.</td></tr>`}</tbody>${sums.some(x => x != null) ? `<tfoot><tr><td>Σ</td>${sums.map(x => `<td>${x != null ? fmtH(x) : ''}</td>`).join('')}<td></td></tr></tfoot>` : ''}`;
    if (!$('colForm').dataset.for || $('colForm').dataset.for !== c.id) {
      $('colForm').dataset.for = c.id;
      $('colForm').innerHTML = c.cols
        .map(
          (h, k) =>
            `<label>${esc(h)}<input data-colf="${k}" autocomplete="off"${/adet|sayı|miktar|stok|fiyat|tutar/i.test(h) || /kod|barkod/i.test(h) ? ' inputmode="decimal"' : ''}></label>`
        )
        .join('');
    }
  }
  function colFormVals() {
    return [...document.querySelectorAll('#colForm [data-colf]')].map(i => i.value.trim());
  }
  function colReset() {
    colEdit = -1;
    document.querySelectorAll('#colForm [data-colf]').forEach(i => (i.value = ''));
    $('colAdd').textContent = 'Ekle';
    $('colFormT').textContent = 'Satır ekle';
    $('colCancel').hidden = true;
  }
  $('colNew').addEventListener('click', () => {
    const t = $('colTitle').value.trim(),
      cols = $('colCols')
        .value.split(',')
        .map(x => x.trim())
        .filter(Boolean);
    if (!t) {
      V.toast('Liste adını yaz.');
      $('colTitle').focus();
      return;
    }
    if (!cols.length) {
      V.toast('En az bir sütun yaz.');
      return;
    }
    const c = { id: uid(), title: t, cols, rows: [], at: new Date().toISOString() };
    COL().push(c);
    colId = c.id;
    $('colTitle').value = '';
    V.save();
    colReset();
    renderCol();
    const f = document.querySelector('#colForm [data-colf]');
    if (f) f.focus();
  });
  $('colLists').addEventListener('click', e => {
    const li = e.target.closest('[data-colopen]');
    if (!li) return;
    colId = li.dataset.colopen;
    colReset();
    renderCol();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('colBack').addEventListener('click', () => {
    colId = null;
    colReset();
    renderCol();
  });
  // Kod sütununa bilinen bir kod yazılınca ad sütunu kendiliğinden dolar (BS ürünleri ve SKT kayıtlı ürünlerinden)
  $('colForm').addEventListener('input', e => {
    const c = cur();
    const inp = e.target.closest('[data-colf]');
    if (!c || !inp) return;
    const k = Number(inp.dataset.colf);
    if (!/kod|barkod/i.test(c.cols[k])) return;
    const nk = c.cols.findIndex(h => /ad|ürün$/i.test(h) && !/adet|kod/i.test(h));
    if (nk < 0) return;
    const v = inp.value.trim(),
      bc = bsCat()[v],
      sc = ((V.state().skt && V.state().skt.catalog) || {})[v],
      nm = (bc && bc.name) || (sc && sc.name);
    const ni = document.querySelector(`#colForm [data-colf="${nk}"]`);
    if (nm && ni && (!ni.value || ni.dataset.auto)) {
      ni.value = nm;
      ni.dataset.auto = '1';
    }
  });
  $('colForm').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.closest('[data-colf]')) {
      e.preventDefault();
      const all = [...document.querySelectorAll('#colForm [data-colf]')],
        i = all.indexOf(e.target);
      if (i < all.length - 1) all[i + 1].focus();
      else $('colAdd').click();
    }
  });
  $('colAdd').addEventListener('click', () => {
    const c = cur();
    if (!c) return;
    const v = colFormVals();
    if (!v.some(Boolean)) {
      V.toast('Önce bir alan doldur.');
      return;
    }
    if (colEdit >= 0) c.rows[colEdit] = v;
    else c.rows.push(v);
    document.querySelectorAll('#colForm [data-colf]').forEach(i => delete i.dataset.auto);
    V.save();
    const was = colEdit >= 0;
    colReset();
    renderCol();
    V.toast(was ? 'Satır güncellendi.' : 'Satır eklendi.');
    const f = document.querySelector('#colForm [data-colf]');
    if (f) f.focus();
  });
  $('colCancel').addEventListener('click', () => {
    colReset();
    renderCol();
  });
  $('colTable').addEventListener('click', async e => {
    const c = cur();
    if (!c) return;
    const d = e.target.closest('[data-coldel]');
    if (d) {
      const i = Number(d.dataset.coldel);
      if (!(await window.askConfirm(`${i + 1}. satır silinsin mi?`))) return;
      c.rows.splice(i, 1);
      V.save();
      colReset();
      renderCol();
      return;
    }
    const tr = e.target.closest('[data-colrow]');
    if (!tr) return;
    colEdit = Number(tr.dataset.colrow);
    document.querySelectorAll('#colForm [data-colf]').forEach((inp, k) => (inp.value = c.rows[colEdit][k] || ''));
    $('colAdd').textContent = 'Kaydet';
    $('colFormT').textContent = `${colEdit + 1}. satırı düzenle`;
    $('colCancel').hidden = false;
    renderCol();
    $('colForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('colDel').addEventListener('click', async () => {
    const c = cur();
    if (!c) return;
    if (!(await window.askConfirm(`“${c.title}” listesi silinsin mi?`, 'Sil'))) return;
    AB().collect = COL().filter(x => x !== c);
    colId = null;
    V.save();
    colReset();
    renderCol();
    V.toast('Liste silindi.');
  });
  const colText = c =>
    [
      `${AB().store ? AB().store + ' - ' : ''}${c.title}`,
      '',
      c.cols.join(' | '),
      ...c.rows.map(r => c.cols.map((_, k) => r[k] || '-').join(' | '))
    ].join('\n');
  $('colShare').addEventListener('click', () => {
    const c = cur();
    if (!c) return;
    out(colText(c), c.title, "Liste kopyalandı; WhatsApp'ta yapıştır.");
  });
  $('colSend').addEventListener('click', () => {
    const c = cur();
    if (!c) return;
    if (!c.rows.length) {
      V.toast('Listede satır yok.');
      return;
    }
    if (!portal('liste', c.id || c.title, colText(c), 'Liste'))
      out(colText(c), c.title, "Liste kopyalandı; WhatsApp'ta yapıştır.");
  });
  // Kütüphanesiz .xlsx: sıkıştırmasız ZIP içinde Office Open XML
  const CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u) {
    let c = 0xffffffff;
    for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const enc = new TextEncoder(),
      parts = [],
      cen = [];
    let off = 0;
    const u16 = n => [n & 255, (n >>> 8) & 255],
      u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    for (const [name, txt] of files) {
      const nm = enc.encode(name),
        data = enc.encode(txt),
        crc = crc32(data);
      const head = new Uint8Array([
        0x50,
        0x4b,
        3,
        4,
        ...u16(20),
        ...u16(0x0800),
        ...u16(0),
        ...u16(0),
        ...u16(0x21),
        ...u32(crc),
        ...u32(data.length),
        ...u32(data.length),
        ...u16(nm.length),
        ...u16(0)
      ]);
      parts.push(head, nm, data);
      cen.push(
        new Uint8Array([
          0x50,
          0x4b,
          1,
          2,
          ...u16(20),
          ...u16(20),
          ...u16(0x0800),
          ...u16(0),
          ...u16(0),
          ...u16(0x21),
          ...u32(crc),
          ...u32(data.length),
          ...u32(data.length),
          ...u16(nm.length),
          ...u16(0),
          ...u16(0),
          ...u16(0),
          ...u16(0),
          ...u32(0),
          ...u32(off)
        ]),
        nm
      );
      off += head.length + nm.length + data.length;
    }
    const cl = cen.reduce((a, x) => a + x.length, 0);
    return new Blob(
      [
        ...parts,
        ...cen,
        new Uint8Array([
          0x50,
          0x4b,
          5,
          6,
          0,
          0,
          0,
          0,
          ...u16(files.length),
          ...u16(files.length),
          ...u32(cl),
          ...u32(off),
          0,
          0
        ])
      ],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
  }
  function xlsx(title, cols, rows) {
    const x = v =>
      String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    const ref = (c, r) => {
      let s = '';
      c++;
      while (c) {
        const m = (c - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        c = Math.floor((c - 1) / 26);
      }
      return s + r;
    };
    const isNum = (v, h) => v !== '' && !/kod|barkod|telefon/i.test(h) && /^-?\d+([.,]\d+)?$/.test(String(v).trim());
    const cell = (v, c, r, st, h) =>
      isNum(v, h)
        ? `<c r="${ref(c, r)}"${st ? ` s="${st}"` : ''}><v>${String(v).trim().replace(',', '.')}</v></c>`
        : `<c r="${ref(c, r)}" t="inlineStr"${st ? ` s="${st}"` : ''}><is><t xml:space="preserve">${x(v)}</t></is></c>`;
    const all = [cols, ...rows],
      w = cols.map((h, k) => Math.min(50, Math.max(8, ...all.map(r => String(r[k] || '').length + 2))));
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${w.map((v, i) => `<col min="${i + 1}" max="${i + 1}" width="${v}" customWidth="1"/>`).join('')}</cols><sheetData><row r="1">${cols.map((h, c) => cell(h, c, 1, 1, '')).join('')}</row>${rows.map((r, i) => `<row r="${i + 2}">${cols.map((h, c) => cell(r[c] || '', c, i + 2, 0, h)).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${ref(cols.length - 1, Math.max(1, rows.length + 1))}"/></worksheet>`;
    const sn = x(title.replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31) || 'Liste');
    return zip([
      [
        '[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'
      ],
      [
        '_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
      ],
      [
        'xl/workbook.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sn}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${sn.replace(/'/g, "''")}'!$A$1:$${ref(cols.length - 1, '').replace(/\d/g, '')}$${Math.max(1, rows.length + 1)}</definedName></definedNames></workbook>`
      ],
      [
        'xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
      ],
      [
        'xl/styles.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF13784F"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'
      ],
      ['xl/worksheets/sheet1.xml', sheet]
    ]);
  }
  $('colXlsx').addEventListener('click', async () => {
    const c = cur();
    if (!c) return;
    if (!c.rows.length) {
      V.toast('Listede satır yok.');
      return;
    }
    const blob = xlsx(c.title, c.cols, c.rows),
      d = new Date();
    const name =
      `${(AB().store ? AB().store + ' ' : '') + c.title} ${d.getDate()}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.xlsx`
        .replace(/[\\\/:*?"<>|]/g, '-')
        .replace(
          /[çÇğĞıİöÖşŞüÜ]/g,
          ch => ({ ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' })[ch]
        );
    try {
      const f = new File([blob], name, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        await navigator.share({ files: [f], title: c.title });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 2000);
    V.toast('Excel dosyası indirildi.');
  });
  window.__xlsx = xlsx;

  /* --- sabah SKT dönüşü: 09.15'e kadar gruba "SKT kontrolü yapıldı" --- */
  const MS_DL = 9 * 60 + 15;
  function msRec() {
    const a = AB();
    if (!a.mskt) a.mskt = {};
    return a.mskt;
  }
  function renderMs() {
    const t = isoToday(),
      r = msRec()[t],
      now = new Date(),
      mins = now.getHours() * 60 + now.getMinutes();
    if (!$('msStore').value) $('msStore').value = (r && r.store) || AB().msLast || AB().store || '';
    const box = $('msBox');
    box.classList.remove('done', 'late', 'wait');
    if (r) {
      box.classList.add('done');
      $('msBadge').textContent = 'Gönderildi';
      $('msInfo').textContent =
        `Bugün ${new Date(r.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} gönderildi: ${r.store || '-'}`;
      $('msSend').textContent = 'Tekrar gönder';
    } else if (mins <= MS_DL) {
      box.classList.add('wait');
      const k = MS_DL - mins;
      $('msBadge').textContent = k >= 60 ? `${Math.floor(k / 60)} sa ${k % 60} dk` : `${k} dk kaldı`;
      $('msInfo').textContent = "Her sabah 09.15'e kadar gruba bildirilir.";
      $('msSend').textContent = "SKT kontrolü yapıldı, BS'ye gönder";
    } else {
      box.classList.add('late');
      $('msBadge').textContent = 'Gecikti';
      $('msInfo').textContent = '09.15 geçti, bugün henüz gönderilmedi.';
      $('msSend').textContent = "SKT kontrolü yapıldı, BS'ye gönder";
    }
  }
  $('msSend').addEventListener('click', () => {
    const st = $('msStore').value.trim(),
      now = new Date();
    const txt = `${st ? st + ' - ' : ''}${now.getDate()} ${MON[now.getMonth()]} ${now.getFullYear()}\nSKT kontrolü yapıldı ✅`;
    msRec()[isoToday()] = { store: st, at: now.toISOString() };
    AB().msLast = st;
    V.save();
    renderMs();
    if (!portal('skt', isoToday(), txt, 'SKT dönüşü'))
      out(txt, 'SKT kontrolü', 'Mesaj kopyalandı; WhatsApp grubuna yapıştır.');
  });
  $('msWa').addEventListener('click', () => {
    const st = $('msStore').value.trim(),
      now = new Date();
    out(
      `${st ? st + ' - ' : ''}${now.getDate()} ${MON[now.getMonth()]} ${now.getFullYear()}\nSKT kontrolü yapıldı ✅`,
      'SKT kontrolü',
      'Mesaj kopyalandı; WhatsApp grubuna yapıştır.'
    );
  });
  setInterval(() => {
    if (!$('bsView').hidden) renderMs();
  }, 30000);
  // Uygulama 09.15'ten önce açılırsa ve bugün gönderilmediyse hatırlat
  setTimeout(() => {
    const n = new Date(),
      m = n.getHours() * 60 + n.getMinutes();
    if (m >= 6 * 60 && m <= MS_DL && !msRec()[isoToday()] && !(window.__ist && !window.__ist().skt))
      V.toast(`Sabah SKT dönüşü: 09.15'e ${MS_DL - m} dk kaldı (BS sekmesi).`);
  }, 1500);

  /* --- BS kontrol / iade listeleri --- */
  const RCST = [
    ['yok', 'Mağazada yok'],
    ['kaldir', 'Raftan kaldırıldı'],
    ['iade', 'Depoya iade kesildi']
  ];
  const RC = () => {
    const a = AB();
    if (!Array.isArray(a.recalls)) a.recalls = [];
    return a.recalls;
  };
  let rcId = null;
  const rcCur = () => RC().find(x => x.id === rcId);
  // "5012 Çikolatalı gofret", "Çikolatalı gofret - 5012", "5012;Gofret" gibi satırları kod + ad olarak ayırır
  function rcParse(t) {
    const all = String(t || '')
      .split(/\r?\n/)
      .map(l => l.replace(/^\s*(?:[\-\*•]|\d{1,2}[.)])\s+/, '').trim())
      .filter(l => l && /\S/.test(l))
      .map(l => {
        const m = l.match(/\b(\d{3,14})\b/);
        let code = m ? m[1] : '',
          name = (m ? l.replace(m[0], ' ') : l)
            .replace(/[;:|\t,\-–]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!name && code) {
          const c = bsCat()[code] || ((V.state().skt || {}).catalog || {})[code];
          name = (c && c.name) || '';
        }
        return { code, name, st: '', qty: null };
      })
      .filter(x => x.code || x.name);
    // kodlu satır varsa kodsuz satırlar ("Arkadaşlar şunlara bakın" gibi) başlık sayılır, atlanır
    return all.some(x => x.code) ? all.filter(x => x.code) : all;
  }
  function renderRc() {
    const c = rcCur();
    $('rcHome').hidden = !!c;
    $('rcOpen').hidden = !c;
    if (!c) {
      const L = RC()
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at));
      $('rcLists').innerHTML = L.length
        ? L.map(x => {
            const d = x.items.filter(i => i.st).length;
            return `<li class="rp-item" data-rcopen="${x.id}" style="cursor:pointer"><div><b>${esc(x.title)}</b><small>${d}/${x.items.length} işaretlendi · ${fmtDT(x.at)}${x.sent ? ' · gönderildi' : ''}</small></div><span class="mskt-badge" style="${d === x.items.length ? 'background:color-mix(in srgb,var(--green) 15%,transparent);color:var(--green)' : ''}">${d === x.items.length ? 'Tamam' : 'Bekliyor'}</span><span></span></li>`;
          }).join('')
        : '<li class="sempty" style="padding:10px">Henüz liste yok.</li>';
      return;
    }
    $('rcName').textContent = c.title;
    const d = c.items.filter(i => i.st).length;
    $('rcBar').style.width = (c.items.length ? (d * 100) / c.items.length : 0) + '%';
    $('rcProg').textContent = `${d}/${c.items.length} ürün işaretlendi`;
    $('rcItems').innerHTML =
      c.items
        .map(
          (
            it,
            k
          ) => `<li class="rc-it${it.st ? ' ok' : ''}"><div class="rc-top"><div><b>${esc(it.name || 'Adsız ürün')}</b><small>${it.code ? 'Kod ' + esc(it.code) : '&nbsp;'}</small></div><button type="button" class="del" data-rcdel="${k}" aria-label="Ürünü çıkar">×</button></div>
    <div class="rc-st">${RCST.map(([v, l]) => `<button type="button" data-rcst="${k}" data-v="${v}" aria-pressed="${it.st === v}">${l}</button>`).join('')}</div>
    ${it.st && it.st !== 'yok' ? `<label class="rc-q">Adet<input data-rcq="${k}" inputmode="numeric" value="${it.qty != null ? it.qty : ''}" placeholder="0"></label>` : ''}</li>`
        )
        .join('') || '<li class="sempty" style="padding:10px">Listede ürün yok.</li>';
  }
  $('rcNew').addEventListener('click', () => {
    const items = rcParse($('rcPaste').value);
    if (!items.length) {
      V.toast("BS'nin mesajını yapıştır.");
      $('rcPaste').focus();
      return;
    }
    const d = new Date(),
      c = {
        id: uid(),
        title: $('rcTitle').value.trim() || `Kontrol listesi ${d.getDate()} ${MON[d.getMonth()]}`,
        items,
        at: d.toISOString()
      };
    RC().push(c);
    rcId = c.id;
    $('rcPaste').value = '';
    $('rcTitle').value = '';
    V.save();
    renderRc();
    V.toast(`${items.length} ürün eklendi.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('rcLists').addEventListener('click', e => {
    const li = e.target.closest('[data-rcopen]');
    if (!li) return;
    rcId = li.dataset.rcopen;
    renderRc();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('rcBack').addEventListener('click', () => {
    rcId = null;
    renderRc();
  });
  $('rcItems').addEventListener('click', async e => {
    const c = rcCur();
    if (!c) return;
    const b = e.target.closest('[data-rcst]');
    if (b) {
      const it = c.items[Number(b.dataset.rcst)];
      it.st = it.st === b.dataset.v ? '' : b.dataset.v;
      if (it.st === 'yok' || !it.st) it.qty = null;
      V.save();
      renderRc();
      if (it.st && it.st !== 'yok') {
        const q = document.querySelector(`[data-rcq="${b.dataset.rcst}"]`);
        if (q) q.focus();
      }
      return;
    }
    const d = e.target.closest('[data-rcdel]');
    if (d) {
      const k = Number(d.dataset.rcdel);
      if (!(await window.askConfirm(`${c.items[k].name || 'Bu ürün'} listeden çıkarılsın mı?`))) return;
      c.items.splice(k, 1);
      V.save();
      renderRc();
    }
  });
  $('rcItems').addEventListener('change', e => {
    const c = rcCur();
    const q = e.target.closest('[data-rcq]');
    if (!c || !q) return;
    c.items[Number(q.dataset.rcq)].qty = parseN(q.value);
    V.save();
  });
  $('rcAdd').addEventListener('click', () => {
    const c = rcCur();
    if (!c) return;
    const code = $('rcAddCode').value.trim();
    let name = $('rcAddName').value.trim();
    if (!code && !name) {
      V.toast('Kod ya da ad yaz.');
      return;
    }
    if (!name && code) {
      const k = bsCat()[code] || ((V.state().skt || {}).catalog || {})[code];
      name = (k && k.name) || '';
    }
    c.items.push({ code, name, st: '', qty: null });
    $('rcAddCode').value = '';
    $('rcAddName').value = '';
    V.save();
    renderRc();
  });
  function rcText(c) {
    const d = new Date(c.at),
      L = [`${AB().store ? AB().store + ' - ' : ''}${c.title}`, ''];
    c.items.forEach(it => {
      const l = (RCST.find(x => x[0] === it.st) || [])[1];
      L.push(
        `${it.code ? it.code + ' ' : ''}${it.name}: ${l ? (it.st !== 'yok' && it.qty != null ? fmtN(it.qty) + ' adet ' : '') + l.toLocaleLowerCase('tr-TR') + (it.st === 'yok' ? '' : ' ✅') : 'kontrol edilmedi ❌'}`
      );
    });
    const n = c.items.filter(i => !i.st).length;
    L.push('', n ? `${n} ürün henüz kontrol edilmedi.` : 'Tüm ürünler kontrol edildi ✅');
    return L.join('\n');
  }
  $('rcSend').addEventListener('click', async () => {
    const c = rcCur();
    if (!c) return;
    const n = c.items.filter(i => !i.st).length;
    if (n && !(await window.askConfirm(`${n} ürün işaretlenmedi. Yine de gönderilsin mi?`, 'Gönder'))) return;
    c.sent = new Date().toISOString();
    V.save();
    if (!portal('iade', c.id || c.title, rcText(c), 'Dönüş'))
      out(rcText(c), c.title, 'Dönüş kopyalandı; WhatsApp grubuna yapıştır.');
  });
  $('rcWa').addEventListener('click', () => {
    const c = rcCur();
    if (c) out(rcText(c), c.title, 'Dönüş kopyalandı; WhatsApp grubuna yapıştır.');
  });
  $('rcXlsx').addEventListener('click', () => {
    const c = rcCur();
    if (!c) return;
    const rows = c.items.map(it => [
      it.code,
      it.name,
      (RCST.find(x => x[0] === it.st) || [, 'Kontrol edilmedi'])[1],
      it.qty != null ? String(it.qty) : ''
    ]);
    const blob = xlsx(c.title, ['Ürün kodu', 'Ürün adı', 'Durum', 'Adet'], rows),
      name = `${(AB().store ? AB().store + ' ' : '') + c.title}.xlsx`
        .replace(/[\\\/:*?"<>|]/g, '-')
        .replace(
          /[çÇğĞıİöÖşŞüÜ]/g,
          ch => ({ ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' })[ch]
        );
    (async () => {
      try {
        const f = new File([blob], name, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [f] })) {
          await navigator.share({ files: [f], title: c.title });
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 2000);
      V.toast('Excel dosyası indirildi.');
    })();
  });
  $('rcDel').addEventListener('click', async () => {
    const c = rcCur();
    if (!c) return;
    if (!(await window.askConfirm(`“${c.title}” listesi silinsin mi?`, 'Sil'))) return;
    AB().recalls = RC().filter(x => x !== c);
    rcId = null;
    V.save();
    renderRc();
  });
  window.__renderBs = () => {
    renderBs();
    renderCol();
    renderMs();
    renderRc();
  };
  window.__renderAb = () => {
    render();
    renderCiro();
  };
  // Vardiya oluşturucu için: ayın günlük saat hedefleri (saat hedefi girilmişse)
  window.__abDayTargets = m => {
    const P = (C().ciro || {})[m];
    if (!P || !P.hours) return null;
    const days = monthDays(m),
      pc = distribute(m, P.target),
      dh = distributeHours(m, P.hours, pc);
    if (!dh) return null;
    const o = {};
    days.forEach((d, k) => (o[d.ds] = dh[k]));
    return o;
  };
  $('abPrev').addEventListener('click', () => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    ym = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    openId = null;
    $('cDay').value = '';
    render();
    renderCiro();
  });
  $('abNext').addEventListener('click', () => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m, 1);
    ym = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    openId = null;
    $('cDay').value = '';
    render();
    renderCiro();
  });
  $('abList').addEventListener('click', async e => {
    const tg = e.target.closest('[data-tog]');
    if (tg) {
      const id = tg.dataset.tog,
        D = AB().done;
      D[ym] = D[ym] || {};
      const r = D[ym][id] || {};
      if (r.at) {
        delete r.at;
      } else r.at = new Date().toISOString();
      D[ym][id] = r;
      V.save();
      render();
      return;
    }
    const op = e.target.closest('[data-open]');
    if (op) {
      openId = op.dataset.open;
      render();
      const ta = document.querySelector(`[data-note="${openId}"]`);
      if (ta) ta.focus();
      return;
    }
    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const t = AB().tasks.find(x => x.id === ed.dataset.edit);
      if (!t) return;
      editId = t.id;
      $('abT').value = t.t;
      $('abDay').value = t.day || '';
      $('abRole').value = t.role || '';
      $('abDesc').value = t.desc || '';
      $('abFormTitle').textContent = 'Görevi düzenle';
      $('abSave').textContent = 'Kaydet';
      $('abCancel').hidden = false;
      $('abAddBox').open = true;
      $('abAddBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const dl = e.target.closest('[data-del]');
    if (dl) {
      const t = AB().tasks.find(x => x.id === dl.dataset.del);
      if (!t) return;
      if (!(await askConfirm(`“${t.t}” listeden silinsin mi? Geçmiş ayların işaretleri de kalkar.`))) return;
      AB().tasks = AB().tasks.filter(x => x !== t);
      V.save();
      render();
    }
  });
  $('abList').addEventListener('change', e => {
    const ta = e.target.closest('[data-note]');
    if (!ta) return;
    const D = AB().done;
    D[ym] = D[ym] || {};
    const r = D[ym][ta.dataset.note] || {};
    r.note = ta.value.trim();
    D[ym][ta.dataset.note] = r;
    openId = null;
    V.save();
    render();
  });
  function resetForm() {
    editId = null;
    ['abT', 'abDay', 'abDesc'].forEach(k => ($(k).value = ''));
    $('abRole').value = '';
    $('abFormTitle').textContent = 'Görev ekle';
    $('abSave').textContent = 'Listeye ekle';
    $('abCancel').hidden = true;
  }
  $('abSave').addEventListener('click', () => {
    const t = $('abT').value.trim();
    if (!t) {
      V.toast('Yapılacak işi yaz.');
      $('abT').focus();
      return;
    }
    let day = parseInt($('abDay').value, 10);
    day = day >= 1 && day <= 31 ? day : null;
    const data = { t, day, role: $('abRole').value, desc: $('abDesc').value.trim() };
    if (editId) {
      const x = AB().tasks.find(y => y.id === editId);
      if (x) Object.assign(x, data);
      V.toast('Görev güncellendi.');
    } else {
      AB().tasks.push({ id: uid(), ...data });
      V.toast('Görev eklendi.');
    }
    V.save();
    resetForm();
    render();
  });
  $('abCancel').addEventListener('click', resetForm);
  $('abEditBtn').addEventListener('click', () => {
    editMode = !editMode;
    $('abEditBtn').setAttribute('aria-pressed', editMode);
    $('abEditBtn').textContent = editMode ? 'Düzenlemeyi bitir' : 'Listeyi düzenle';
    render();
  });
  $('abShare').addEventListener('click', async () => {
    const ts = sorted();
    if (!ts.length) {
      V.toast('Listede görev yok.');
      return;
    }
    const [y, m] = ym.split('-').map(Number),
      done = ts.filter(t => isDone(t)).length;
    const lines = [
      `AY BAŞI İŞLEMLERİ: ${MON[m - 1]} ${y}`,
      `${done} / ${ts.length} tamamlandı`,
      '',
      ...ts.map(t => {
        const r = recOf(t);
        return `${isDone(t) ? '[x]' : '[ ]'} ${t.t}${t.day ? ` (son gün ${t.day})` : ''}${r && r.note ? `: ${r.note}` : ''}`;
      })
    ];
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ay başı işlemleri', text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      V.toast('Durum panoya kopyalandı.');
    } catch (e) {
      V.toast('Kopyalanamadı.');
    }
  });
  badge();
  if (V.state().tab === 'a' && window.__setTab) window.__setTab('a');
  if (V.state().tab === 'b' && window.__setTab) window.__setTab('b');
})();
