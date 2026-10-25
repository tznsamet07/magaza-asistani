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

