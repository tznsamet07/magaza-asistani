  /* İşe giriş evrakları: MS/MSY yeni personelin evraklarını fotoğraflar, İK (depo) kontrol eder ve sicil verir.
   Asıl evraklar yine sevkiyat aracıyla gider; hangi araçla gittiği ve depoya ulaştığı burada izlenir.
   KVKK: dosyaları sadece o mağazanın MS ve MSY'si ile İK görür. */
  const EV = [
    ['kimlik', 'Kimlik kartı (ön ve arka)'],
    ['ikamet', 'İkametgâh belgesi'],
    ['saglik', 'Sağlık raporu'],
    ['adli', 'Adli sicil kaydı'],
    ['diploma', 'Diploma / öğrenim belgesi'],
    ['banka', 'Banka hesap bilgisi (IBAN)'],
    ['foto', 'Vesikalık fotoğraf'],
    ['sozlesme', 'İmzalı iş sözleşmesi']
  ];
  const ISD = {
    taslak: ['wait', 'Hazırlanıyor'],
    ik: ['wait', 'İK kontrolünde'],
    eksik: ['no', 'Eksik var'],
    tamam: ['ok', 'Tamamlandı']
  };
  function evFoto(label) {
    try {
      const c = document.createElement('canvas');
      c.width = 300;
      c.height = 420;
      const x = c.getContext('2d');
      x.fillStyle = '#f4f1ea';
      x.fillRect(0, 0, 300, 420);
      x.fillStyle = '#d0cbbf';
      x.fillRect(0, 0, 300, 6);
      x.fillStyle = '#2b2b2b';
      x.font = 'bold 17px sans-serif';
      x.fillText(label.slice(0, 26), 20, 44);
      x.fillStyle = '#9a9488';
      for (let i = 0; i < 11; i++) x.fillRect(20, 72 + i * 26, i % 4 === 3 ? 150 : 260, 7);
      x.strokeStyle = '#3a5fa0';
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(170, 380);
      x.bezierCurveTo(190, 350, 210, 400, 240, 365);
      x.stroke();
      return { name: label + '.jpg', type: 'image/jpeg', size: 16000, data: c.toDataURL('image/jpeg', 0.6) };
    } catch (e) {
      return null;
    }
  }
  function evRead(file) {
    return new Promise(res => {
      const fr = new FileReader();
      fr.onerror = () => res(null);
      if (/^image\//.test(file.type) && !/svg|gif/.test(file.type)) {
        fr.onload = () => {
          const im = new Image();
          im.onload = () => {
            const k = Math.min(1, 1200 / Math.max(im.width, im.height)),
              c = document.createElement('canvas');
            c.width = Math.round(im.width * k);
            c.height = Math.round(im.height * k);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            const d = c.toDataURL('image/jpeg', 0.6);
            res({
              name: file.name.replace(/\.[^.]+$/, '') + '.jpg',
              type: 'image/jpeg',
              size: Math.round(d.length * 0.75),
              data: d
            });
          };
          im.onerror = () => res(null);
          im.src = fr.result;
        };
      } else {
        if (file.size > ATT_MAX) {
          res({ err: file.name });
          return;
        }
        fr.onload = () =>
          res({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: fr.result });
      }
      fr.readAsDataURL(file);
    });
  }
  function iseInit() {
    if (!Array.isArray(D.ise)) {
      const sv = D.sevk.find(x => x.store === 's3');
      D.ise = [
        {
          id: uid(),
          store: 's3',
          ad: 'Yusuf Çetin',
          unvan: 'PER',
          bas: dstr(4),
          by: 'AKÇAY O583 MS',
          at: isoAt(16, 20, -1),
          docs: Object.fromEntries(EV.map(([k, l]) => [k, [evFoto(l)].filter(Boolean)])),
          durum: 'ik',
          gonder: isoAt(16, 40, -1),
          kontrol: {},
          asil: sv ? { plaka: sv.plaka, tarih: sv.tarih, saat: sv.saat, durum: 'yolda' } : null
        }
      ];
      save();
    }
    imzaSeed();
  }
  const canIse = () => canOnay();
  const isIk = () => !!window.__ikMi && window.__ikMi(giris());
  const evN = x => EV.filter(([k]) => (x.docs[k] || []).length).length;
  const iseMine = () => D.ise.filter(x => x.store === 'me').sort((a, b) => b.at.localeCompare(a.at));
  const ikList = () =>
    D.ise
      .filter(x => x.durum !== 'taslak')
      .sort(
        (a, b) =>
          (a.durum === 'ik' ? 0 : 1) - (b.durum === 'ik' ? 0 : 1) || (b.gonder || b.at).localeCompare(a.gonder || a.at)
      );
  function isChip(x) {
    const [c, l] = ISD[x.durum];
    return `<span class="iz-st ${c === 'ok' ? 'onay' : c === 'no' ? 'red' : 'bek'}">${l}</span>`;
  }
  function asilTxt(a) {
    if (!a) return 'Asıllar henüz gönderilmedi';
    return a.durum === 'ulasti'
      ? `Asıllar depoya ulaştı (${esc(a.plaka)})`
      : `Asıllar ${esc(a.plaka)} aracıyla · ${gunAd(a.tarih)} ${esc(a.saat || '')}`;
  }
  function iseRowBox() {
    if (!canIse()) return '';
    const L = iseMine(),
      ek = L.filter(x => x.durum === 'eksik').length,
      ik = L.filter(x => x.durum === 'ik').length,
      tl = L.filter(x => x.durum === 'taslak').length;
    return `<div class="box ic-bsrow" data-icgo="ise"><div class="ic-av ise"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><circle cx="12" cy="13" r="2"/><path d="M8.5 18c.6-1.6 1.9-2.4 3.5-2.4s2.9.8 3.5 2.4"/></svg></div><div class="ic-sm"><b>İşe giriş evrakları</b><small>${ek ? `${ek} dosyada İK eksik bildirdi` : ik ? `${ik} dosya İK kontrolünde` : tl ? `${tl} dosya hazırlanıyor` : 'Yeni personelin evraklarını yükle'}</small></div>${ek ? `<span class="ic-unread">${ek}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function isePage() {
    const L = iseMine();
    let h = head('İşe giriş evrakları', true);
    h += `<div class="box"><p class="hint" style="margin:0">Yeni personelin evraklarını fotoğrafla, İK'ya gönder. Asıl evraklar yine sevkiyat aracıyla depoya gider; hangi araçla gittiğini buradan seçersin.</p><button type="button" class="btn primary" id="iseNew" style="width:100%;margin-top:10px">+ Yeni personel</button><p class="kvkk">🔒 Kişisel belgeler sadece mağazanın MS ve MSY'si ile İK tarafından görülür.</p></div>`;
    h += `<div class="box"><h2>Dosyalar</h2><ul class="ic-reqs">${L.map(x => `<li data-isev="${x.id}"><div><b>${esc(x.ad)} <small style="color:var(--muted);font-weight:600">${KISA[x.unvan] || ''}</small></b><small>${evN(x)}/${EV.length} evrak · ${x.durum === 'tamam' && x.sicil ? 'Sicil ' + esc(x.sicil) : asilTxt(x.asil)}</small></div>${isChip(x)}</li>`).join('') || '<li class="sempty">Henüz dosya yok.</li>'}</ul></div>`;
    return h;
  }
  function iseNewPage() {
    const f = ui.form || {};
    return (
      head('Yeni personel', true) +
      `<div class="box"><div class="sf"><label>Adı soyadı<input id="iseAd" autocomplete="off" value="${esc(f.ad || '')}" placeholder="Örn. Yusuf Çetin"></label>
  <div class="srow2"><label>Görevi<select id="iseUn">${['PER', 'PART', 'GT', 'MSY'].map(r => `<option value="${r}"${(f.unvan || 'PER') === r ? ' selected' : ''}>${UNVAN[r]}</option>`).join('')}</select></label><label>İşe başlama<input type="date" id="iseBas" value="${esc(f.bas || dstr(3))}"></label></div>
  <button type="button" class="btn primary" id="iseCreate">Dosyayı aç</button><p class="kvkk" style="margin:0">🔒 T.C. kimlik no gibi bilgiler uygulamaya yazılmaz; sadece belgelerin fotoğrafı İK'ya gider.</p></div></div>`
    );
  }
  function evItem(x, k, l, edit, ik) {
    const F = x.docs[k] || [],
      ks = (x.kontrol || {})[k],
      ek = x.durum === 'eksik' && (x.eksik || []).includes(k);
    return `<li class="ev ${F.length ? 'has' : ''} ${ek ? 'ek' : ''}"><div class="ev-top"><span class="ev-i">${F.length ? '✓' : ''}</span><b>${l}</b>${ik ? `<div class="ev-ik"><button type="button" data-ikk="${k}" data-ikv="1" aria-pressed="${ks === true}">Uygun</button><button type="button" data-ikk="${k}" data-ikv="0" aria-pressed="${ks === false}">Eksik</button></div>` : ek ? '<em class="ev-ek">İK: eksik</em>' : ''}</div>
  ${F.length ? `<div class="att-list">${F.map((a, i) => (/^image\//.test(a.type) ? `<div class="att img"><button type="button" class="att-th" data-evview="${k}:${i}" aria-label="${esc(l)} büyüt"><img src="${a.data}" alt=""></button>${edit ? `<button type="button" class="att-x" data-evdel="${k}:${i}" aria-label="Kaldır">×</button>` : ''}</div>` : `<div class="att"><a class="att-f" href="${a.data}" download="${esc(a.name)}"><span class="att-ext">${esc(extOf(a.name))}</span><span class="att-n"><b>${esc(a.name)}</b><small>${fsz(a.size)}</small></span></a>${edit ? `<button type="button" class="att-x" data-evdel="${k}:${i}" aria-label="Kaldır">×</button>` : ''}</div>`)).join('')}</div>` : ''}
  ${edit ? (F.length ? `<div class="ev-act"><label class="linkbtn" style="cursor:pointer">+ Sayfa ekle<input type="file" accept="image/*,.pdf" data-evin="${k}" hidden></label></div>` : `<div class="ev-act"><label class="btn small">📷 Fotoğraf<input type="file" accept="image/*" capture="environment" data-evin="${k}" hidden></label><label class="btn small">Dosya<input type="file" accept="image/*,.pdf" data-evin="${k}" hidden></label></div>`) : ''}</li>`;
  }
  function iseView(x, ik) {
    const edit = !ik && ['taslak', 'eksik'].includes(x.durum),
      n = evN(x);
    let h = head((ik ? 'İK · ' : '') + esc(x.ad), true);
    h += `<div class="box"><div class="gf-head"><h2 style="margin:0">${esc(x.ad)}</h2>${isChip(x)}</div><p class="hint" style="margin:4px 0 0">${UNVAN[x.unvan] || ''} · ${esc(S(x.store).name)} · İşe başlama ${fmtD(x.bas)}${x.sicil ? ' · <b>Sicil ' + esc(x.sicil) + '</b>' : ''}</p>
    ${x.durum === 'eksik' && x.ikNot ? `<p class="ev-not"><b>İK notu:</b> ${esc(x.ikNot)}</p>` : ''}${x.durum === 'tamam' ? `<p class="ev-ok">✓ İK onayladı${x.store === 'me' ? '; çalışan listesine eklendi, bu sicille giriş yapabilir' : ''}.</p>` : ''}</div>`;
    h += `<div class="box"><div class="gf-head"><h2 style="margin:0">Evraklar</h2><span class="hint" style="margin:0">${n}/${EV.length}</span></div><ul class="ev-list">${EV.map(([k, l]) => evItem(x, k, l, edit, ik && x.durum === 'ik')).join('')}</ul><p class="kvkk">🔒 Sadece MS, MSY ve İK görür.</p></div>`;
    h += imzaBox(x, ik);
    if (ik)
      h += `<div class="box"><h2>Çıktı</h2><p class="hint" style="margin:4px 0 8px">Kapak sayfası, tüm evraklar ve imzalar tek PDF'te. Açıp yazdırıp dosyaya koyabilirsin.</p><button type="button" class="btn primary" id="isePdf" style="width:100%">İmzalı PDF'i indir</button></div>`;
    // asıl evraklar
    if (ik) {
      h += `<div class="box"><h2>Asıl evraklar</h2><p class="hint" style="margin:4px 0 0">${asilTxt(x.asil)}</p>${x.asil && x.asil.durum !== 'ulasti' ? `<button type="button" class="btn" data-asilok="${x.id}" style="width:100%;margin-top:8px">Asıllar depoya ulaştı</button>` : ''}</div>`;
      if (x.durum === 'ik') {
        const K = x.kontrol || {},
          all = EV.every(([k]) => K[k] === true),
          any = EV.some(([k]) => K[k] === false),
          sug = String(
            Math.max(
              104560,
              ...(V.state().employees || []).map(e => Number(e.sicil) || 0),
              ...D.ise.map(y => Number(y.sicil) || 0)
            ) + 1
          );
        h += `<div class="box rp-send"><label>Mağazaya not (eksik varsa)<textarea id="ikNot" class="simp" rows="2" placeholder="Örn. Sağlık raporu imzasız, yeniden çekin">${esc((ui.form || {}).not || '')}</textarea></label>
      ${any ? `<button type="button" class="btn" id="ikEksik" style="width:100%">Eksikleri mağazaya bildir</button>` : ''}
      ${all ? `<label>Sicil numarası<input id="ikSicil" inputmode="numeric" value="${sug}"></label>${(x.imza || {}).ik ? '' : '<p class="hint" style="margin:0">Onaylamadan önce yukarıdan İK olarak imzala.</p>'}<button type="button" class="btn primary" id="ikOk" style="width:100%">Onayla ve sicil ver</button>` : `<p class="hint" style="margin:0">Her evrakı Uygun ya da Eksik diye işaretle. Hepsi uygunsa sicil verirsin.</p>`}</div>`;
      }
    } else {
      const nx = sevkOf('me');
      h += `<div class="box"><h2>Asıl evraklar</h2><p class="hint" style="margin:4px 0 8px">İmzalı asılları hangi sevkiyat aracıyla gönderiyorsun?</p>${x.asil && x.asil.durum === 'ulasti' ? `<p class="ev-ok">✓ ${asilTxt(x.asil)}</p>` : `<div class="ic-pick">${nx.map(v => `<button type="button" data-asil="${v.id}" aria-pressed="${!!x.asil && x.asil.plaka === v.plaka && x.asil.tarih === v.tarih}">${gunAd(v.tarih)} ${esc(v.saat)} · ${esc(v.plaka)}</button>`).join('') || '<span class="hint">Planlı sevkiyat yok.</span>'}</div>`}</div>`;
      if (edit)
        h += `<div class="box rp-send"><button type="button" class="btn primary" id="iseSend" style="width:100%">${x.durum === 'eksik' ? "Düzelttim, İK'ya tekrar gönder" : "İK'ya gönder"}</button><p class="hint" style="margin:6px 0 0">${n < EV.length ? `Göndermek için ${EV.length - n} evrak daha yükle.` : 'Tüm evraklar hazır.'}</p>${x.durum === 'taslak' ? '<button type="button" class="linkbtn" id="iseDel" style="margin-top:6px">Dosyayı sil</button>' : ''}</div>`;
    }
    return h;
  }
  function ikPage() {
    const L = ikList(),
      bek = L.filter(x => x.durum === 'ik').length;
    let h = head('İşe giriş evrakları (İK)', true);
    h += `<div class="box"><label class="rq-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="ikQ" type="search" autocomplete="off" placeholder="Ara: ad, mağaza, sicil"></label>
  <ul class="ic-reqs" id="ikL">${L.map(x => `<li data-ikv="${x.id}" data-q="${esc(nrm(x.ad + ' ' + S(x.store).name + ' ' + (x.sicil || '')))}"><div><b>${esc(x.ad)} <small style="color:var(--muted);font-weight:600">${KISA[x.unvan] || ''}</small></b><small>${esc(S(x.store).name)} · ${evN(x)}/${EV.length} evrak · ${x.asil && x.asil.durum === 'ulasti' ? 'asıllar depoda' : x.asil ? 'asıllar yolda' : 'asıllar gönderilmedi'}</small></div>${isChip(x)}</li>`).join('') || '<li class="sempty">Henüz gelen dosya yok.</li>'}</ul></div>`;
    return (
      h +
      `<p class="kvkk" style="text-align:center">🔒 Kişisel belgeler sadece İK ve ilgili mağazanın MS/MSY'sine görünür.</p>`
    );
  }
  /* İşe giriş imzaları: çalışan ve mağaza sorumlusu mağazada telefona parmakla imzalar, İK onaylarken imzalar.
   İK, evrakları imzalarla birlikte tek PDF olarak indirip çıktı alır. */
  const IMZ = [
    ['per', 'Çalışan'],
    ['ms', 'Mağaza sorumlusu'],
    ['ik', 'İnsan kaynakları']
  ];
  function imzaSahte(seed) {
    try {
      const c = document.createElement('canvas');
      c.width = 600;
      c.height = 200;
      const x = c.getContext('2d');
      x.strokeStyle = '#1d3c8f';
      x.lineWidth = 4;
      x.lineCap = 'round';
      x.beginPath();
      let px = 60,
        py = 120;
      x.moveTo(px, py);
      for (let i = 0; i < 9; i++) {
        const nx = px + 45 + ((seed * 7 + i * 13) % 25),
          ny = 60 + ((seed * 11 + i * 29) % 90);
        x.bezierCurveTo(px + 15, py - 50, nx - 20, ny + 50, nx, ny);
        px = nx;
        py = ny;
      }
      x.stroke();
      return c.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }
  function imzaSeed() {
    const x = D.ise.find(y => y.ad === 'Yusuf Çetin' && y.store === 's3');
    if (x && !x.imza) {
      x.imza = {
        per: { ad: 'Yusuf Çetin', at: isoAt(16, 25, -1), data: imzaSahte(1) },
        ms: { ad: 'AKÇAY O583 MS', at: isoAt(16, 30, -1), data: imzaSahte(2) }
      };
      save();
    }
  }
  function imzaBox(x, ik) {
    const I = x.imza || {},
      edit = !ik && ['taslak', 'eksik'].includes(x.durum);
    const slot = ([k, l]) => {
      const s = I[k],
        can = k === 'ik' ? ik : edit && k !== 'ik';
      return `<div class="imz ${s ? 'ok' : ''}"><div class="imz-l">${l}</div>${s ? `<img src="${s.data}" alt="${esc(l)} imzası"><small>${esc(s.ad)} · ${when(s.at)}</small>${can ? `<button type="button" class="linkbtn" data-imza="${k}">Yeniden imzala</button>` : ''}` : can ? `<button type="button" class="btn small" data-imza="${k}">✍️ İmzala</button>` : `<small class="imz-yok">${k === 'ik' ? 'İK onaylarken imzalar' : 'İmzalanmadı'}</small>`}</div>`;
    };
    return `<div class="box"><div class="gf-head"><h2 style="margin:0">İmzalar</h2><span class="hint" style="margin:0">${IMZ.filter(([k]) => I[k]).length}/3</span></div><p class="hint" style="margin:4px 0 0">${ik ? "Evrakları kontrol edip imzala. Sonra imzalı PDF'i indirip çıktı alabilirsin." : "Çalışan ve mağaza sorumlusu telefonda parmakla imzalar. İK'ya göndermeden önce iki imza da gerekli."}</p><div class="imz-grid">${IMZ.map(slot).join('')}</div></div>`;
  }
  /* imza penceresi */
  let imzK = null;
  function imzaAc(x, k) {
    imzK = { id: x.id, k };
    const g = giris(),
      def = k === 'per' ? x.ad : (g && g.ad) || '';
    let d = $('imzaDlg');
    if (!d) {
      d = document.createElement('div');
      d.className = 'sdlg-wrap';
      d.id = 'imzaDlg';
      d.hidden = true;
      d.innerHTML = `<div class="sdlg" role="dialog" aria-modal="true" aria-labelledby="imzaT"><h2 id="imzaT">İmza</h2><p class="hint" id="imzaS" style="margin:0 0 8px"></p><div class="sf" style="margin-bottom:8px"><label>İmzalayan<input id="imzaAd" autocomplete="off"></label></div><canvas id="imzaC" class="imz-c" width="600" height="240" aria-label="İmza alanı"></canvas><p class="hint" style="margin:6px 0 0;text-align:center">Kutunun içine parmağınla imzanı at.</p><div class="sdlg-act" style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:8px"><button type="button" class="btn" id="imzaTem">Temizle</button><button type="button" class="btn" id="imzaVz">Vazgeç</button><button type="button" class="btn primary" id="imzaOk">İmzayı kaydet</button></div></div>`;
      document.body.appendChild(d);
      const c = $('imzaC'),
        cx = c.getContext('2d');
      let on = false,
        dirty = false;
      const pt = e => {
        const r = c.getBoundingClientRect();
        return [((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height];
      };
      c.addEventListener('pointerdown', e => {
        on = true;
        c.setPointerCapture(e.pointerId);
        const [a, b] = pt(e);
        cx.beginPath();
        cx.moveTo(a, b);
        e.preventDefault();
      });
      c.addEventListener('pointermove', e => {
        if (!on) return;
        const [a, b] = pt(e);
        cx.lineTo(a, b);
        cx.stroke();
        dirty = true;
        e.preventDefault();
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(v =>
        c.addEventListener(v, () => {
          on = false;
        })
      );
      c._clr = () => {
        cx.clearRect(0, 0, c.width, c.height);
        cx.strokeStyle = '#1d3c8f';
        cx.lineWidth = 4;
        cx.lineCap = 'round';
        cx.lineJoin = 'round';
        dirty = false;
      };
      c._dirty = () => dirty;
      d.addEventListener('click', e => {
        const t = e.target;
        if (t.id === 'imzaTem') {
          c._clr();
          return;
        }
        if (t.id === 'imzaVz' || t === d) {
          d.hidden = true;
          return;
        }
        if (t.id === 'imzaOk') {
          if (!c._dirty()) {
            V.toast('Önce imzanı at.');
            return;
          }
          const ad = ($('imzaAd').value || '').trim();
          if (!ad) {
            V.toast('İmzalayanın adını yaz.');
            $('imzaAd').focus();
            return;
          }
          const y = D.ise.find(z => z.id === imzK.id);
          if (!y) {
            d.hidden = true;
            return;
          }
          y.imza = y.imza || {};
          y.imza[imzK.k] = { ad, at: new Date().toISOString(), data: c.toDataURL('image/png') };
          save();
          d.hidden = true;
          render();
          V.toast('İmza kaydedildi.');
        }
      });
    }
    $('imzaT').textContent = (IMZ.find(([a]) => a === k) || [])[1] + ' imzası';
    $('imzaS').textContent = `${x.ad} · işe giriş evrakları`;
    $('imzaAd').value = def;
    $('imzaC')._clr();
    d.hidden = false;
  }
  /* imzalı PDF: her sayfa A4 resim (kapak + evraklar), kütüphanesiz */
  function pdfYap(pages) {
    const enc = new TextEncoder(),
      parts = [],
      offs = [];
    let len = 0;
    const push = v => {
      const b = typeof v === 'string' ? enc.encode(v) : v;
      parts.push(b);
      len += b.length;
    };
    const obj = (i, f) => {
      offs[i] = len;
      push(`${i} 0 obj\n`);
      f();
      push('\nendobj\n');
    };
    const n = pages.length;
    push('%PDF-1.4\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push(`<< /Type /Pages /Kids [${pages.map((p, k) => `${3 + k * 3} 0 R`).join(' ')}] /Count ${n} >>`));
    pages.forEach((p, k) => {
      const pi = 3 + k * 3,
        bin = Uint8Array.from(atob(p.data.split(',')[1]), ch => ch.charCodeAt(0)),
        cs = `q 595 0 0 842 0 0 cm /Im${k} Do Q`;
      obj(pi, () =>
        push(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${k} ${pi + 2} 0 R >> >> /Contents ${pi + 1} 0 R >>`
        )
      );
      obj(pi + 1, () => push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
      obj(pi + 2, () => {
        push(
          `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bin.length} >>\nstream\n`
        );
        push(bin);
        push('\nendstream');
      });
    });
    const xr = len,
      tot = 3 + n * 3;
    let t = `xref\n0 ${tot}\n0000000000 65535 f \n`;
    for (let i = 1; i < tot; i++) t += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(t + `trailer\n<< /Size ${tot} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  }
  const imgYukle = src =>
    new Promise(r => {
      const i = new Image();
      i.onload = () => r(i);
      i.onerror = () => r(null);
      i.src = src;
    });
  async function isePdf(x) {
    const W = 1240,
      H = 1754,
      I = x.imza || {},
      pages = [],
      olus = new Date();
    const sig = {};
    for (const [k] of IMZ) if (I[k]) sig[k] = await imgYukle(I[k].data);
    const docs = [];
    EV.forEach(([k, l]) =>
      (x.docs[k] || []).forEach((a, i, arr) =>
        docs.push({ l: arr.length > 1 ? `${l} (${i + 1}/${arr.length})` : l, a })
      )
    );
    const N = 1 + docs.length,
      dt = iso =>
        new Date(iso).toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
    const yeni = () => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#111';
      g.textBaseline = 'alphabetic';
      return [c, g];
    };
    const alt = (g, no) => {
      g.fillStyle = '#666';
      g.font = '22px sans-serif';
      g.fillText(`${x.ad} · İşe giriş dosyası · ${S(x.store).name}`, 80, H - 50);
      const s = `Sayfa ${no}/${N}`;
      g.fillText(s, W - 80 - g.measureText(s).width, H - 50);
    };
    const imzaSatir = (g, y0, h, kucuk) => {
      const w = (W - 160 - 40) / 3;
      IMZ.forEach(([k, l], i) => {
        const x0 = 80 + i * (w + 20);
        g.strokeStyle = '#bbb';
        g.lineWidth = 2;
        g.strokeRect(x0, y0, w, h);
        g.fillStyle = '#333';
        g.font = `bold ${kucuk ? 20 : 26}px sans-serif`;
        g.fillText(l, x0 + 14, y0 + (kucuk ? 28 : 38));
        const s = I[k];
        if (s && sig[k]) {
          const ih = h - (kucuk ? 70 : 110),
            iw = ih * 3;
          g.drawImage(sig[k], x0 + (w - Math.min(iw, w - 20)) / 2, y0 + (kucuk ? 34 : 50), Math.min(iw, w - 20), ih);
          g.fillStyle = '#444';
          g.font = `${kucuk ? 17 : 22}px sans-serif`;
          g.fillText(`${s.ad}`.slice(0, 30), x0 + 14, y0 + h - (kucuk ? 26 : 40));
          g.fillText(dt(s.at), x0 + 14, y0 + h - (kucuk ? 6 : 14));
        } else {
          g.fillStyle = '#b00';
          g.font = `${kucuk ? 18 : 22}px sans-serif`;
          g.fillText('İmzalanmadı', x0 + 14, y0 + h / 2 + 10);
        }
      });
    };
    // kapak
    {
      const [c, g] = yeni();
      g.fillStyle = '#D50F1A';
      g.fillRect(0, 0, W, 16);
      g.fillStyle = '#111';
      g.font = 'bold 54px sans-serif';
      g.fillText('İşe Giriş Dosyası', 80, 140);
      g.font = '26px sans-serif';
      g.fillStyle = '#555';
      g.fillText('Mağaza Asistanı · dijital imzalı evrak dökümü', 80, 186);
      const rows = [
        ['Adı soyadı', x.ad],
        ['Görevi', UNVAN[x.unvan] || x.unvan || ''],
        ['Mağaza', S(x.store).name],
        ['İşe başlama', fmtD(x.bas)],
        ['Sicil', x.sicil || 'Henüz verilmedi'],
        ['Durum', ISD[x.durum][1]],
        ['Hazırlayan', x.by || ''],
        ["İK'ya gönderim", x.gonder ? dt(x.gonder) : '-'],
        ['Döküm tarihi', dt(olus.toISOString())]
      ];
      let y = 270;
      rows.forEach(([a, b]) => {
        g.fillStyle = '#666';
        g.font = '26px sans-serif';
        g.fillText(a, 80, y);
        g.fillStyle = '#111';
        g.font = 'bold 28px sans-serif';
        g.fillText(String(b).slice(0, 48), 380, y);
        y += 50;
      });
      y += 20;
      g.fillStyle = '#111';
      g.font = 'bold 32px sans-serif';
      g.fillText('Evraklar', 80, y);
      y += 46;
      EV.forEach(([k, l]) => {
        const n = (x.docs[k] || []).length,
          ks = (x.kontrol || {})[k];
        g.font = '26px sans-serif';
        g.fillStyle = n ? '#1E8A4A' : '#b00';
        g.fillText(n ? '✓' : '✗', 80, y);
        g.fillStyle = '#111';
        g.fillText(`${l}${n > 1 ? ` (${n} sayfa)` : ''}`, 120, y);
        if (ks != null) {
          g.fillStyle = ks ? '#1E8A4A' : '#b00';
          const s = ks ? 'İK: uygun' : 'İK: eksik';
          g.fillText(s, W - 80 - g.measureText(s).width, y);
        }
        y += 42;
      });
      y += 30;
      g.fillStyle = '#111';
      g.font = 'bold 32px sans-serif';
      g.fillText('İmzalar', 80, y);
      imzaSatir(g, y + 20, 300, false);
      g.fillStyle = '#777';
      g.font = '20px sans-serif';
      g.fillText(
        'İmzalar uygulamada parmakla atılmış imza görüntüleridir; tarih ve saatleriyle kaydedilmiştir.',
        80,
        y + 360
      );
      alt(g, 1);
      pages.push({ w: W, h: H, data: c.toDataURL('image/jpeg', 0.82) });
    }
    // evrak sayfaları
    for (let i = 0; i < docs.length; i++) {
      const [c, g] = yeni(),
        { l, a } = docs[i];
      g.font = 'bold 34px sans-serif';
      g.fillText(l, 80, 100);
      g.fillStyle = '#666';
      g.font = '22px sans-serif';
      g.fillText(`${x.ad} · ${a.name}`, 80, 136);
      const top = 170,
        bot = H - 330,
        img = /^image\//.test(a.type) ? await imgYukle(a.data) : null;
      if (img) {
        const k = Math.min((W - 160) / img.width, (bot - top) / img.height);
        const w = img.width * k,
          h = img.height * k;
        g.drawImage(img, (W - w) / 2, top, w, h);
        g.strokeStyle = '#ddd';
        g.strokeRect((W - w) / 2, top, w, h);
      } else {
        g.fillStyle = '#f3f3f3';
        g.fillRect(80, top, W - 160, 300);
        g.fillStyle = '#333';
        g.font = '26px sans-serif';
        g.fillText('Bu evrak dosya olarak eklendi (resim değil):', 110, top + 120);
        g.font = 'bold 26px sans-serif';
        g.fillText(a.name.slice(0, 60), 110, top + 170);
      }
      imzaSatir(g, H - 300, 190, true);
      alt(g, i + 2);
      pages.push({ w: W, h: H, data: c.toDataURL('image/jpeg', 0.82) });
    }
    return pdfYap(pages);
  }
  async function isePdfIndir(x) {
    V.toast('PDF hazırlanıyor…');
    const blob = await isePdf(x);
    const name = `Ise giris ${x.ad} ${new Date().toLocaleDateString('tr-TR')}.pdf`
      .replace(/[\\\/:*?"<>|]/g, '-')
      .replace(
        /[çÇğĞıİöÖşŞüÜ]/g,
        ch => ({ ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' })[ch]
      );
    window.__sonPdf = blob;
    try {
      const f = new File([blob], name, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        await navigator.share({ files: [f], title: 'İşe giriş dosyası' });
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
    }, 4000);
    V.toast('PDF indirildi. Açıp yazdırabilirsin.');
  }
  function ikRowBox() {
    const n = ikList().filter(x => x.durum === 'ik').length,
      y = D.ise.filter(x => x.asil && x.asil.durum === 'yolda' && x.durum !== 'taslak').length;
    return `<div class="box ic-bsrow" data-icgo="ik"><div class="ic-av ise"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg></div><div class="ic-sm"><b>İşe giriş evrakları (İK)</b><small>${n ? `${n} dosya kontrol bekliyor` : 'Bekleyen dosya yok'}${y ? ` · ${y} dosyanın asılları yolda` : ''}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
