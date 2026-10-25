/* ===== Giriş: mağaza çalışanı ya da bölge sorumlusu (BS) =====
   Şimdilik şifresiz (sunum sürümü). Sunucuya geçince her kullanıcı kendi şifresi / SMS koduyla girecek. */
(function () {
  const V = window.__vardiya;
  if (!V) return;
  const $ = id => document.getElementById(id),
    esc = V.esc,
    KEY = 'magaza-giris';
  const UNVAN = {
    MS: 'Mağaza Sorumlusu',
    MSY: 'Mağaza Sorumlu Yardımcısı',
    GT: 'Günlük Temsilci',
    PER: 'Personel',
    PART: 'Part eleman'
  };
  const KISA = { MS: 'MS', MSY: 'MSY', GT: 'GT', PER: 'Personel', PART: 'Part' };
  if (window.__unvan) window.__unvan(UNVAN, KISA);
  /* Sicil kaydı (sunum). Gerçek sürümde ~14.000 mağaza ve tüm çalışanlar merkezi kayıtta tutulur; giriş sicille yapılır, kişinin görevi, mağazası ya da bölgesi kayıttan gelir. */
  const KAYIT = {
    200118: { tip: 'bs', ad: 'Ali Yıldırım', bolge: 'Finike bölgesi' },
    200126: { tip: 'bs', ad: 'Murat Kaya', bolge: 'Kumluca bölgesi' },
    200134: { tip: 'bs', ad: 'Selin Aydın', bolge: 'Kaş bölgesi' },
    300021: { tip: 'pm', ad: 'Kemal Arslan', bolge: 'Antalya Bölge Müdürlüğü' },
    900012: { tip: 'pm', unvan: 'GM', ad: 'Selim Aktaş', bolge: '' },
    400305: { tip: 'depo', ad: 'Hakan Öztürk', unvan: 'Sevkiyat elemanı', depo: 'Döşemealtı-2 deposu (9562)' },
    400412: { tip: 'depo', ad: 'Derya Koç', unvan: 'İnsan kaynakları', depo: 'Döşemealtı-2 deposu (9562)' },
    300009: { tip: 'pm', unvan: 'BM', ad: 'Nihat Öz', bolge: 'Antalya Bölge Müdürlüğü' }
  };
  const AB = () => {
    const s = V.state();
    s.ab = s.ab || {};
    return s.ab;
  };
  const IC_MG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/><path d="M10 20v-4h4v4"/></svg>';
  let G = null,
    step = 'sicil',
    sel = null,
    form = { store: '', name: '', role: 'PER', bolge: '' },
    bek = null;
  let acikTut = false;
  document.addEventListener('change', e => {
    if (e.target && e.target.id === 'grAcik') acikTut = e.target.checked;
  });
  /* Yeni çalışan kaydı: sicili listede olmayan kişi kayıt olur, insan kaynakları (İK) onaylar.
   İK isterse bölge sorumlularına (BS) da onay yetkisi verir. Sunumda aynı telefonda saklanır; gerçekte sunucuda tutulur. */
  const KYK = 'magaza-kayit';
  function KY() {
    let o = null;
    try {
      o = JSON.parse(localStorage.getItem(KYK) || 'null');
    } catch (e) {}
    if (!o || !Array.isArray(o.list)) o = { list: [], bsYetki: {} };
    if (!o.bsYetki) o.bsYetki = {};
    if (!o.seed) {
      o.seed = 1;
      const ago = m => new Date(Date.now() - m * 60000).toISOString();
      o.list.push(
        {
          id: 'ky1',
          sicil: '105301',
          ad: 'Burak Demir',
          unvan: 'PER',
          magaza: 'ACISU K767',
          at: ago(95),
          durum: 'bek'
        },
        {
          id: 'ky2',
          sicil: '105318',
          ad: 'Elif Yurt',
          unvan: 'PER',
          magaza: window.__MGDEF || '',
          at: ago(40),
          durum: 'bek'
        }
      );
      KYsave(o);
    }
    return o;
  }
  function KYsave(o) {
    try {
      localStorage.setItem(KYK, JSON.stringify(o));
    } catch (e) {}
  }
  const kyOf = sc => KY().list.find(x => x.sicil === sc);
  window.__kayit = {
    get: KY,
    save: KYsave,
    bsler: () =>
      Object.entries(KAYIT)
        .filter(([, k]) => k.tip === 'bs')
        .map(([sc, k]) => ({ sicil: sc, ad: k.ad, bolge: k.bolge || '' })),
    yetkili: () => !!G && (window.__ikMi(G) || (G.tip === 'bs' && !!KY().bsYetki[G.sicil]))
  };
  window.__ikMi = g => !!g && g.tip === 'depo' && (g.ik === true || g.unvan === 'İnsan kaynakları');
  /* SMS doğrulama (sunum): kod ekranda SMS bildirimi olarak gösterilir. Gerçekte kod SMS sağlayıcısıyla (ör. Firebase Auth) telefona gider. */
  let pend = null,
    prev = 'sicil',
    tel = '',
    sms = null,
    tmr = null;
  const TKEY = 'magaza-tel',
    telKey = g => g.tip + ':' + (g.empId || g.ad).toString().toLocaleLowerCase('tr-TR');
  const telMap = () => {
    try {
      return JSON.parse(localStorage.getItem(TKEY) || '{}');
    } catch (e) {
      return {};
    }
  };
  const telDigits = v => {
    let d = String(v || '').replace(/\D/g, '');
    if (d.startsWith('90') && d.length === 12) d = d.slice(2);
    if (d.startsWith('0')) d = d.slice(1);
    return d;
  };
  const telFmt2 = d => (d.length === 10 ? `+90 (${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}` : d);
  const telFmt = d => (d.length === 10 ? `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}` : d);
  function sendCode() {
    sms = {
      code: String(Math.floor(100000 + Math.random() * 900000)),
      until: Date.now() + 180000,
      again: Date.now() + 60000,
      tries: 0
    };
    const n = $('smsDemo');
    n.innerHTML = `<div class="sm-top"><span class="sm-app">💬 Mesajlar</span><span>şimdi</span></div><b>BIMMAGAZA</b><span>Mağaza Asistanı doğrulama kodun: <strong>${sms.code}</strong>. Bu kodu kimseyle paylaşma.</span><em>Sunum: gerçek sürümde bu mesaj telefona SMS olarak gelir. Dokununca kod yazılır.</em>`;
    n.hidden = false;
    clearTimeout(n._t);
    n._t = setTimeout(() => {
      n.hidden = true;
    }, 15000);
  }
  function tick() {
    clearInterval(tmr);
    tmr = setInterval(() => {
      const a = $('grAgain');
      if (!a || !sms) {
        clearInterval(tmr);
        return;
      }
      const left = Math.ceil((sms.again - Date.now()) / 1000);
      a.disabled = left > 0;
      const L = $('grLeft');
      if (L)
        L.innerHTML =
          left > 0
            ? `Kodun tekrar gönderimi için bekle: <b>0:${String(left).padStart(2, '0')}</b>`
            : 'Kod gelmediyse tekrar gönderebilirsin.';
    }, 500);
  }
  function get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      return null;
    }
  }
  function put(g) {
    try {
      g ? localStorage.setItem(KEY, JSON.stringify(g)) : localStorage.removeItem(KEY);
    } catch (e) {}
  }
  const emps = () => (V.state().employees || []).filter(e => e && e.name && e.name.trim());
  function mgBul(q) {
    const M = window.__mg;
    if (!M || !M.var() || !String(q || '').trim()) return '';
    const o = M.bul(q),
      L = o ? [o] : M.ara(q, 4);
    if (!L.length) return '<p class="hint" style="margin:0">Bu kod ya da adla mağaza bulunamadı.</p>';
    return L.map(
      x =>
        `<button type="button" class="gr-mgb${o || L.length === 1 ? ' on' : ''}" data-grmg="${esc(x.kod || x.isim)}"><b>${esc(x.isim)}</b><small>${esc(x.adres)}</small></button>`
    ).join('');
  }
  function mgSec(q) {
    const M = window.__mg;
    if (!M || !M.var()) return String(q || '').trim();
    const o = M.bul(q);
    if (o) return o.isim;
    const L = M.ara(q, 2);
    return L.length === 1 ? L[0].isim : '';
  }
  function keep() {
    ['grStore:store', 'grSicil:sicil', 'grName:name', 'grRole:role', 'grBolge:bolge'].forEach(p => {
      const [id, k] = p.split(':');
      if ($(id)) form[k] = $(id).value;
    });
  }
  /* Sicilden kişi ve görev: merkezi kayıt (BS, PM, GM, depo) ya da mağaza çalışan listesi */
  function rozet(g) {
    if (!g) return null;
    const t = g.tip;
    if (t === 'pm' && g.unvan === 'GM') return { k: 'GM', t: 'Genel müdürlük' };
    if (t === 'pm' && g.unvan === 'BM') return { k: 'BM', t: 'Bölge müdürü' };
    if (t === 'pm') return { k: 'PM', t: 'PM' };
    if (t === 'bs') return { k: 'BS', t: 'Bölge sorumlusu' };
    if (t === 'depo') return { k: 'DEPO', t: 'Depo' + (g.unvan ? ' · ' + g.unvan : '') };
    const u = g.unvan || g.role || 'PER';
    return { k: u === 'PER' ? 'PER' : u, t: UNVAN[u] || u };
  }
  function bul(sc) {
    sc = String(sc || '').replace(/\D/g, '');
    if (sc.length < 3) return null;
    const k = KAYIT[sc];
    if (k)
      return k.tip === 'depo'
        ? { tip: 'depo', ad: k.ad, depo: k.depo || '', unvan: k.unvan || '', sicil: sc }
        : { tip: k.tip, ad: k.ad, bolge: k.bolge || '', unvan: k.unvan, sicil: sc };
    const e = emps().find(x => String(x.sicil || '') === sc);
    if (e)
      return { tip: 'magaza', ad: e.name.trim(), unvan: e.role || 'PER', empId: e.id, magaza: cihazMg(), sicil: sc };
    const ky = kyOf(sc);
    if (ky && ky.durum === 'onay')
      return { tip: 'magaza', ad: ky.ad, unvan: ky.unvan || 'PER', empId: null, magaza: ky.magaza, sicil: sc };
    const m = merkez().find(r => r[0] === sc);
    if (!m) return null;
    const M = window.__mg,
      o = M && M.kod(m[3]);
    return {
      tip: 'magaza',
      ad: m[1],
      unvan: ['MS', 'MSY', 'GT', 'PER', 'PART'].includes(m[2]) ? (m[2] === 'PART' ? 'PER' : m[2]) : 'PER',
      empId: null,
      magaza: o ? o.isim : m[3],
      sicil: sc
    };
  }
  /* Merkezi çalışan kaydı: gönderilen çalışan listesi (bimVeri.calisanlar: sicil, ad, unvan, mağaza kodu) + sunum için diğer mağazalardan örnek kişiler.
   Sicil yazılınca kişinin mağazası buradan gelir; bu cihazın mağazasına bağlı değildir. */
  /* Bu telefonun mağazası: çalışan listesi ve vardiya bu mağazaya aittir. Başka mağazadan biri girince oturumun mağazası değişir, bu değişmez. */
  function cihazMg() {
    const st = V.state();
    if (!st.cihazMg) {
      st.cihazMg = (AB().store || window.__MGDEF).trim();
      V.save();
    }
    return st.cihazMg;
  }
  const DEMO_CAL = [
    ['105210', 'Hatice Er', 'MS', 'K677'],
    ['105233', 'Mert Şahin', 'MSY', 'K690'],
    ['105247', 'Zehra Kılınç', 'PER', 'K725']
  ];
  function merkez() {
    let L = [];
    try {
      L = (JSON.parse(document.getElementById('bimVeri').textContent).calisanlar || []).map(r => [
        String(r[0]),
        String(r[1] || ''),
        String(r[2] || '').toUpperCase(),
        String(r[3] || '').toUpperCase()
      ]);
    } catch (e) {}
    return L.concat(DEMO_CAL.filter(d => !L.some(r => r[0] === d[0])));
  }
  function kimText(sc) {
    const g = bul(sc);
    if (!g) return '';
    const M = window.__mg,
      o = g.tip === 'magaza' && M ? M.bul(g.magaza) : null;
    const yer =
      g.tip === 'magaza'
        ? (g.magaza || '') + (o && (o.yer || o.il) ? ' · ' + (o.yer || o.il) : '')
        : g.bolge || g.depo || '';
    return `<span class="gr-kart"><span class="gr-av">${esc((g.ad || '?').trim()[0].toLocaleUpperCase('tr-TR'))}</span><span class="gr-kb"><b>${esc(g.ad)}</b><small>${esc(rozet(g).t)}</small>${yer ? `<small>${esc(yer)}</small>` : ''}</span><span class="gr-ok" title="Bilgilerin sicilinden geldi">✓</span></span>`;
  }
  function rozetCiz(g) {
    const r = $('grRozet');
    if (!r) return;
    const z = rozet(g);
    r.hidden = !z;
    if (z) {
      r.textContent = z.k;
      r.title = z.t;
      r.className = 'gr-rozet r-' + z.k.toLowerCase();
    }
  }
  function draw() {
    const el = $('girisBody');
    let h = '';
    if (step === 'sicil') {
      const E = emps().filter(e => e.sicil),
        DM = [
          ...E.map(e => [e.sicil, e.name, e.role]),
          ...DEMO_CAL.map(r => [
            r[0],
            r[1] + ' · ' + (((window.__mg && window.__mg.kod(r[3])) || {}).ad || r[3]),
            r[2]
          ]),
          ...Object.entries(KAYIT).map(([n, k]) => [n, k.ad, rozet(k).k])
        ];
      h = `<div class="sf">
      <label>Sicil numaran<input id="grSicil" inputmode="numeric" autocomplete="off" maxlength="10" value="${esc(form.sicil || '')}" placeholder="Örn. 104512"></label>
      <div id="grKim" aria-live="polite">${kimText(form.sicil)}</div>
      ${sel === 'yeni' ? `<p class="hint" style="margin:0">Bu sicil numarası kayıtlı değil. Mağaza kodunu, adını ve görevini yaz. Kaydın insan kaynaklarının onayından sonra açılır.</p><label>Mağaza kodu ya da adı<input id="grStore" autocomplete="off" value="${esc(form.store)}" placeholder="Örn. K767 ya da Acısu"></label><div id="grMgBul" class="gr-mg">${mgBul(form.store)}</div><div class="srow2"><label>Adın soyadın<input id="grName" autocomplete="name" value="${esc(form.name)}"></label><label>Görevin<select id="grRole">${['MS', 'MSY', 'GT', 'PER'].map(r => `<option value="${r}"${form.role === r ? ' selected' : ''}>${UNVAN[r]}</option>`).join('')}</select></label></div>` : ''}
      <p class="auth-err" id="grErr" role="alert"></p>
      <button type="button" class="btn primary" id="grGo" style="width:100%">Devam</button>
      <p class="hint" style="margin:2px 0 0;text-align:center">Görevin sicilinden bulunur, telefonuna gelen kodla girersin.</p>
      <details class="gr-demo"><summary>Sunum: örnek sicil numaraları</summary><div class="gr-emps">${DM.map(([n, a, k]) => `<button type="button" data-grsicil="${esc(n)}"><b>${esc(n)}</b><small>${esc(a)} · ${esc(k)}</small></button>`).join('')}</div></details></div>`;
    } else if (step === 'bekle') {
      const r = kyOf(bek.sicil) || bek,
        K = r.karar,
        kim = K ? `${esc(K.by)}${K.rol ? ' (' + esc(K.rol) + ')' : ''}` : '';
      const who = `<p class="gr-who">${esc(r.ad)} · ${esc(UNVAN[r.unvan] || r.unvan || '')}<small style="display:block;font-weight:600;color:var(--muted);margin-top:2px">${esc(r.magaza || '')} · Sicil ${esc(r.sicil)}</small></p>`;
      h =
        r.durum === 'onay'
          ? `<div class="sf"><div class="ky-st ok"><b>✓ Kaydın onaylandı</b><span>${kim} onayladı. Artık sicil numaranla girebilirsin.</span></div>${who}<button type="button" class="btn primary" id="grGo" style="width:100%">Giriş yap</button></div>`
          : r.durum === 'red'
            ? `<div class="sf"><div class="ky-st no"><b>Kaydın onaylanmadı</b><span>${kim ? kim + ' onaylamadı.' : ''}${K && K.not ? ' Not: ' + esc(K.not) : ''} Bilgilerin yanlışsa düzeltip tekrar başvurabilirsin ya da mağaza müdürüne danış.</span></div>${who}<button type="button" class="btn primary" id="grKyYeni" style="width:100%">Bilgileri düzelt, tekrar başvur</button></div><button type="button" class="auth-link" data-grback>‹ Başa dön</button>`
            : `<div class="sf"><div class="ky-st wait"><b>Kaydın onay bekliyor</b><span>İnsan kaynakları onaylayınca bu sicille girebilirsin. Onay bölge sorumlusundan da gelebilir.</span></div>${who}<button type="button" class="btn primary" id="grGo" style="width:100%">Durumu kontrol et</button></div><button type="button" class="auth-link" data-grback>‹ Başa dön</button>`;
    } else if (step === 'tel') {
      h = `<div class="sf"><p class="gr-who">${esc(pend.ad)} · ${pend.tip === 'bs' ? 'Bölge sorumlusu' : pend.tip === 'pm' ? 'PM' : pend.tip === 'depo' ? 'Depo' : esc(UNVAN[pend.unvan] || '')}${pend.magaza || pend.bolge || pend.depo ? `<small style="display:block;font-weight:600;color:var(--muted);margin-top:2px">${esc(pend.magaza || pend.bolge || pend.depo)}${pend.sicil ? ' · Sicil ' + esc(pend.sicil) : ''}</small>` : ''}</p>
      <label>Cep telefonun<div class="gr-tel"><span>+90</span><input id="grTel" type="tel" inputmode="tel" autocomplete="tel-national" value="${esc(tel ? telFmt(tel) : '')}" placeholder="05xx xxx xx xx"></div></label>
      <p class="hint" style="margin:0">Bu numaraya 6 haneli bir doğrulama kodu göndereceğiz.</p>
      <p class="auth-err" id="grErr" role="alert"></p>
      <button type="button" class="btn primary" id="grGo" style="width:100%">SMS kodu gönder</button></div>
      <button type="button" class="auth-link" data-grback>‹ Geri</button>`;
    } else if (step === 'kod') {
      h = `<div class="gr-otp-wrap"><div class="gr-lock"><svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="6" width="20" height="36" rx="4" fill="#fff"/><rect x="17" y="11" width="14" height="24" rx="2" fill="currentColor" opacity=".18"/><path d="M20.5 23v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="19" y="22.5" width="10" height="8" rx="2" fill="currentColor"/><circle cx="24" cy="38.5" r="1.4" fill="currentColor"/></svg></div><h2>Doğrulama kodunu gir</h2><p class="gr-sent">Sana biraz önce SMS gönderdik.<br><b>${esc(telFmt2(tel))}</b> <button type="button" class="linkbtn" data-grback>Değiştir</button></p></div>
      <div class="sf"><div class="gr-otp" role="group" aria-label="Doğrulama kodu">${[0, 1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" maxlength="1" data-otp="${i}" aria-label="${i + 1}. hane"${i === 0 ? ' autocomplete="one-time-code"' : ''}>`).join('')}</div>
      <p class="gr-left" id="grLeft"></p>
      <p class="auth-err" id="grErr" role="alert"></p>
      ${pend && pend.tip === 'magaza' ? `<label class="check gr-acik"><input type="checkbox" id="grAcik"${acikTut ? ' checked' : ''}><span>Oturumu açık tut <small>Kendi telefonunsa işaretle; işlem yapmasan da çıkış yapılmaz.</small></span></label>` : ''}
      <button type="button" class="btn primary" id="grGo" style="width:100%">Doğrula ve giriş yap</button>
      <button type="button" class="gr-again" id="grAgain" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20.5V16h-4.5"/></svg>Kodu tekrar gönder</button></div>`;
    }
    rozetCiz(step === 'tel' || step === 'kod' ? pend : step === 'sicil' ? bul(form.sicil) : null);
    el.innerHTML =
      h +
      (step === 'tel' || step === 'kod'
        ? '<p class="gr-note">Sunum sürümü: kod ekranda SMS gibi gösterilir. Gerçek SMS, uygulama sunucuya bağlanınca gelecek.</p>'
        : '');
    if (step === 'kod') {
      tick();
      setTimeout(() => {
        const o = el.querySelector('[data-otp]');
        if (o) o.focus();
      }, 50);
      return;
    }
    const f = el.querySelector('input:not([type=hidden])');
    if (f && step !== 'tip' && !f.value) setTimeout(() => f.focus(), 50);
  }
  function show() {
    G = null;
    step = 'sicil';
    sel = null;
    form = { store: '', sicil: '', name: '', role: 'PER', bolge: '' };
    document.body.classList.add('giris-lock');
    $('giris').hidden = false;
    const n = $('icNote');
    if (n) n.hidden = true;
    draw();
    window.scrollTo(0, 0);
  }
  function label(g) {
    return g.tip === 'pm'
      ? {
          ad: g.ad,
          rol:
            (g.unvan === 'GM' ? 'Genel müdürlük' : g.unvan === 'BM' ? 'Bölge müdürü' : 'PM') +
            (g.bolge ? ' · ' + g.bolge : '') +
            (g.sicil ? ' · Sicil ' + g.sicil : '')
        }
      : g.tip === 'depo'
        ? { ad: g.ad, rol: 'Depo' + (g.depo ? ' · ' + g.depo : '') + (g.sicil ? ' · Sicil ' + g.sicil : '') }
        : g.tip === 'bs'
          ? {
              ad: g.ad,
              rol: 'Bölge sorumlusu' + (g.bolge ? ' · ' + g.bolge : '') + (g.sicil ? ' · Sicil ' + g.sicil : '')
            }
          : {
              ad: g.ad,
              rol: (UNVAN[g.unvan] || '') + ' · ' + (g.magaza || '') + (g.sicil ? ' · Sicil ' + g.sicil : '')
            };
  }
  /* Ayarlar > Mağazam (mağaza rolleri) ya da Bölgem (BS, PM, depo): mağaza listesinden kod, adres, bölge */
  function mgKutu(g) {
    const bx = $('mgBox');
    if (!bx) return;
    const M = window.__mg;
    if (!M || !M.var()) {
      bx.hidden = true;
      return;
    }
    const o = g.tip === 'magaza' ? M.bul(g.magaza) : null,
      bk = o ? o.bk : M.bolgeBul(g.bolge || g.depo || '');
    if (!o && !bk) {
      bx.hidden = true;
      return;
    }
    const row = (k, v) => `<li><span>${k}</span><b>${v}</b></li>`;
    $('mgBoxT').textContent = o ? 'Mağazam' : 'Bölgem';
    $('mgBody').innerHTML =
      `<ul class="mg-ozet">${o ? row('Mağaza', esc(o.ad) + (o.kod ? ' · ' + esc(o.kod) : '')) + row('Adres', esc(o.sokak + (o.no ? ' ' + o.no : ''))) + row('İlçe / il', esc(o.yer || o.il)) : ''}${row('Bölge (depo)', esc(bk) + ' · ' + esc(M.bolge(bk)))}${row('Bölgedeki mağaza', M.say(bk) + ' (listede)')}</ul>
    <div class="mg-btns">${o ? `<a class="btn" href="${esc(M.harita(o))}" target="_blank" rel="noopener">Haritada aç</a>` : ''}<button type="button" class="btn" id="mgRehber">Mağaza rehberi</button></div>`;
    bx.hidden = false;
  }
  $('mgBox').addEventListener('click', e => {
    if (e.target.id === 'mgRehber' && window.__icGo) {
      window.__icGo('rehber');
      window.scrollTo({ top: 0 });
    }
  });
  function apply(g) {
    G = g;
    const b = document.body;
    b.classList.remove('giris-lock');
    $('giris').hidden = true;
    otoCiz();
    b.classList.toggle('giris-bs', g.tip === 'bs');
    b.classList.toggle('giris-gt', g.tip === 'magaza' && g.unvan === 'GT');
    b.classList.toggle('giris-depo', g.tip === 'depo');
    b.classList.toggle('giris-pm', g.tip === 'pm');
    if (window.__renderEmp) setTimeout(window.__renderEmp, 0);
    b.dataset.role =
      g.tip === 'pm'
        ? 'pm'
        : g.tip === 'depo'
          ? 'depo'
          : g.tip === 'bs'
            ? 'bs'
            : ['MS', 'MSY', 'GT'].includes(g.unvan)
              ? 'admin'
              : 'staff';
    $('userbar').hidden = false;
    const un = $('userName');
    un.style.display = '';
    const fn = String(g.ad || '')
      .trim()
      .split(/\s+/)[0];
    un.textContent =
      g.tip === 'pm'
        ? `${fn} · ${['GM', 'BM'].includes(g.unvan) ? g.unvan : 'PM'}`
        : g.tip === 'depo'
          ? `${fn} · ${g.unvan === 'İnsan kaynakları' ? 'İK' : 'Depo'}`
          : g.tip === 'bs'
            ? `${fn} · BS`
            : `${fn} · ${KISA[g.unvan] || ''}`;
    const L = label(g);
    $('hsAv').textContent =
      g.tip === 'bs'
        ? 'BS'
        : g.tip === 'pm'
          ? ['GM', 'BM'].includes(g.unvan)
            ? g.unvan
            : 'PM'
          : g.tip === 'depo'
            ? 'D'
            : (g.ad || '?').trim()[0].toLocaleUpperCase('tr-TR');
    $('hsAv').classList.toggle('bs', g.tip === 'bs');
    $('hsAd').textContent = L.ad;
    $('hsRol').textContent = L.rol + (g.tel ? ' · ' + telFmt(g.tel) : '');
    mgKutu(g);
    $('icView').hidden = true;
    if (window.__renderIc) window.__renderIc(true);
    if (window.__setTab) window.__setTab('h');
  }
  $('girisBody').addEventListener('click', e => {
    const t = e.target;
    let b;
    if (t.closest('[data-grback]')) {
      keep();
      if (step === 'kod') {
        step = 'tel';
      } else if (step === 'tel') {
        step = prev;
      } else {
        step = 'sicil';
        sel = null;
      }
      draw();
      return;
    }
    if (t.id === 'grKyYeni') {
      const r = kyOf(bek.sicil) || bek;
      const o = KY();
      o.list = o.list.filter(x => x.sicil !== r.sicil);
      KYsave(o);
      form = { store: r.magaza || '', sicil: r.sicil, name: r.ad || '', role: r.unvan || 'PER', bolge: '' };
      sel = 'yeni';
      step = 'sicil';
      draw();
      return;
    }
    if (t.id === 'grGo' && step === 'bekle') {
      const r = kyOf(bek.sicil);
      if (!r) {
        step = 'sicil';
        draw();
        return;
      }
      if (r.durum === 'onay') {
        pend = bul(r.sicil);
        prev = 'sicil';
        tel = telMap()[telKey(pend)] || '';
        step = 'tel';
        draw();
        return;
      }
      draw();
      V.toast(r.durum === 'bek' ? 'Henüz onaylanmadı. Onaylanınca giriş yapabilirsin.' : 'Kaydın onaylanmadı.');
      return;
    }
    if (t.id === 'grAgain') {
      if (!sms || Date.now() < sms.again) return;
      sendCode();
      draw();
      return;
    }
    if ((b = t.closest('[data-grmg]'))) {
      keep();
      const o = window.__mg.kod(b.dataset.grmg) || window.__mg.bul(b.dataset.grmg);
      if (o) form.store = o.isim;
      draw();
      if ($('grName') && !$('grName').value) $('grName').focus();
      return;
    }
    if ((b = t.closest('[data-grsicil]'))) {
      keep();
      form.sicil = b.dataset.grsicil;
      sel = null;
      draw();
      return;
    }
    if (t.id === 'grGo' && step === 'tel') {
      const err = m => {
        $('grErr').textContent = m;
      };
      const d = telDigits($('grTel').value);
      if (d.length !== 10 || d[0] !== '5') return err('Geçerli bir cep telefonu yaz (05xx xxx xx xx).');
      tel = d;
      sendCode();
      step = 'kod';
      draw();
      return;
    }
    if (t.id === 'grGo' && step === 'kod') {
      const err = m => {
        $('grErr').textContent = m;
      };
      const c = [...document.querySelectorAll('[data-otp]')].map(i => i.value).join('');
      if (c.length < 6) return err('6 haneli kodu yaz.');
      if (!sms || Date.now() > sms.until) return err('Kodun süresi doldu, yeni kod iste.');
      if (c !== sms.code) {
        sms.tries++;
        document.querySelectorAll('[data-otp]').forEach(i => (i.value = ''));
        document.querySelector('[data-otp]').focus();
        return err(sms.tries >= 5 ? 'Çok fazla hatalı deneme, yeni kod iste.' : 'Kod yanlış, tekrar dene.');
      }
      const g = { ...pend, tel };
      if (g.tip === 'magaza' && $('grAcik') && $('grAcik').checked) g.acik = true;
      const M = telMap();
      M[telKey(g)] = tel;
      try {
        localStorage.setItem(TKEY, JSON.stringify(M));
      } catch (x) {}
      sms = null;
      clearInterval(tmr);
      $('smsDemo').hidden = true;
      if (g.yeni) {
        const o = KY();
        o.list = o.list.filter(x => x.sicil !== g.sicil);
        const r = {
          id: Math.random().toString(36).slice(2, 9),
          sicil: g.sicil,
          ad: g.ad,
          unvan: g.unvan,
          magaza: g.magaza,
          at: new Date().toISOString(),
          durum: 'bek'
        };
        o.list.push(r);
        KYsave(o);
        bek = r;
        step = 'bekle';
        draw();
        return;
      }
      put(g);
      islem();
      apply(g);
      if (window.__icLogin) setTimeout(window.__icLogin, 400);
      return;
    }
    if (t.id === 'grGo') {
      keep();
      const err = m => {
        $('grErr').textContent = m;
      };
      const sc = String(form.sicil || '').replace(/\D/g, '');
      if (sc.length < 3) return err('Sicil numaranı yaz.');
      let g = bul(sc);
      if (!g && sel !== 'yeni') {
        const r = kyOf(sc);
        if (r && r.durum !== 'onay') {
          bek = r;
          step = 'bekle';
          draw();
          return;
        }
        sel = 'yeni';
        draw();
        if ($('grStore')) $('grStore').focus();
        return;
      }
      if (!g) {
        const store = mgSec(form.store);
        if (!String(form.store || '').trim()) return err('Mağaza kodunu yaz.');
        if (!store) return err('Mağazayı listeden seç ya da mağaza kodunu tam yaz (ör. K767).');
        form.store = store;
        if (!form.name.trim()) return err('Adını soyadını yaz.');
        g = {
          tip: 'magaza',
          ad: form.name.trim(),
          unvan: form.role,
          empId: null,
          magaza: store,
          sicil: sc,
          yeni: true
        };
      }
      if (g.tip === 'magaza' && AB().store !== g.magaza) {
        AB().store = g.magaza;
        V.save();
      }
      pend = g;
      prev = step;
      tel = telMap()[telKey(g)] || '';
      step = 'tel';
      draw();
      return;
    }
  });
  $('girisBody').addEventListener('input', e => {
    if (e.target.id === 'grStore') {
      const w = $('grMgBul');
      if (w) w.innerHTML = mgBul(e.target.value);
      return;
    }
    if (e.target.id === 'grSicil') {
      e.target.value = e.target.value.replace(/\D/g, '');
      form.sicil = e.target.value;
      rozetCiz(bul(form.sicil));
      const k = $('grKim');
      if (k) k.innerHTML = kimText(form.sicil);
      if (sel === 'yeni') {
        keep();
        sel = null;
        draw();
        const i = $('grSicil');
        i.focus();
        i.setSelectionRange(i.value.length, i.value.length);
      }
      return;
    }
    const o = e.target.closest('[data-otp]');
    if (!o) return;
    const v = o.value.replace(/\D/g, '');
    if (v.length > 1) {
      const all = [...document.querySelectorAll('[data-otp]')];
      v.slice(0, 6)
        .split('')
        .forEach((ch, k) => {
          const x = all[Number(o.dataset.otp) + k];
          if (x) x.value = ch;
        });
    } else o.value = v;
    const all = [...document.querySelectorAll('[data-otp]')],
      nx = all.find(x => !x.value);
    if (nx && v) nx.focus();
    if (all.every(x => x.value)) $('grGo').click();
  });
  $('girisBody').addEventListener('keydown', e => {
    const o = e.target.closest('[data-otp]');
    if (o && e.key === 'Backspace' && !o.value) {
      const p = document.querySelector(`[data-otp="${Number(o.dataset.otp) - 1}"]`);
      if (p) {
        p.value = '';
        p.focus();
      }
      e.preventDefault();
      return;
    }
  });
  $('girisBody').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('input')) {
      e.preventDefault();
      const go = $('grGo');
      if (go) go.click();
    }
  });
  const cik = () => {
    try {
      if (window.AndroidApp && AndroidApp.scheduleVardiya) AndroidApp.scheduleVardiya(JSON.stringify({ kapali: true }));
    } catch (e) {}
    put(null);
    show();
  };
  const out = async () => {
    if (!(await window.askConfirm('Çıkış yapılsın mı? Veriler bu cihazda kalır.', 'Çıkış yap'))) return;
    cik();
  };
  /* Otomatik çıkış: mağaza telefonu ortak. Mağaza girişlerinde (MS, MSY, GT, personel) belirlenen süre dokunulmazsa çıkış yapılır.
   Son işlem zamanı cihazda tutulur; uygulama arka planda kalıp geri açılınca da süre kontrol edilir. Süre cihaza göre Ayarlar > Hesap'tan seçilir. */
  const OKEY = 'magaza-oto',
    AKEY = 'magaza-son-islem';
  const otoDk = () => {
    let v = null;
    try {
      v = localStorage.getItem(OKEY);
    } catch (e) {}
    const n = Number(v == null ? 10 : v);
    return [0, 5, 10, 30].includes(n) ? n : 10;
  };
  const otoAcik = () => !!G && G.tip === 'magaza' && !G.acik && otoDk() > 0;
  let sonIs = (() => {
      try {
        return Number(localStorage.getItem(AKEY)) || Date.now();
      } catch (e) {
        return Date.now();
      }
    })(),
    otoUyar = false;
  const islem = () => {
    sonIs = Date.now();
    if (otoUyar) {
      otoUyar = false;
    }
    try {
      localStorage.setItem(AKEY, String(sonIs));
    } catch (e) {}
  };
  let isT = 0;
  ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(ev =>
    document.addEventListener(
      ev,
      () => {
        const n = Date.now();
        if (n - isT < 5000) {
          sonIs = n;
          return;
        }
        isT = n;
        islem();
      },
      { passive: true, capture: true }
    )
  );
  function otoKontrol() {
    if (!otoAcik() || document.body.classList.contains('giris-lock')) return;
    let son = sonIs;
    try {
      son = Math.max(son, Number(localStorage.getItem(AKEY)) || 0);
    } catch (e) {}
    const kal = otoDk() * 60000 - (Date.now() - son);
    if (kal <= 0) {
      otoUyar = false;
      cik();
      V.toast('Uzun süre işlem yapılmadığı için çıkış yapıldı.');
      return;
    }
    if (kal <= 30000 && !otoUyar) {
      otoUyar = true;
      V.toast('İşlem yapılmazsa 30 saniye içinde çıkış yapılacak. Devam etmek için ekrana dokun.');
    }
  }
  setInterval(otoKontrol, 5000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) otoKontrol();
    else {
      try {
        localStorage.setItem(AKEY, String(sonIs));
      } catch (e) {}
    }
  });
  function otoCiz() {
    const r = $('otoRow'),
      h = $('otoHint'),
      on = !!G && G.tip === 'magaza';
    if (r) r.hidden = !on || !!G.acik;
    if (h) {
      h.hidden = !on;
      h.innerHTML =
        G && G.acik
          ? 'Oturum açık tutuluyor: işlem yapmasan da çıkış yapılmaz. Kapatmak için çıkış yapıp tekrar girerken kutuyu boş bırak.'
          : 'Mağaza telefonu ortak kullanıldığı için bir süre dokunulmazsa çıkış yapılır. Kendi telefonunsa girişte "Oturumu açık tut" kutusunu işaretle.';
    }
    const s = $('otoSel');
    if (s) s.value = String(otoDk());
  }
  $('otoSel').addEventListener('change', () => {
    try {
      localStorage.setItem(OKEY, $('otoSel').value);
    } catch (e) {}
    islem();
    V.toast(
      Number($('otoSel').value)
        ? `${$('otoSel').value} dakika işlem olmazsa çıkış yapılacak.`
        : 'Otomatik çıkış kapatıldı.'
    );
  });
  $('smsDemo').addEventListener('click', () => {
    if (!sms || step !== 'kod') return;
    const all = [...document.querySelectorAll('[data-otp]')];
    sms.code.split('').forEach((c, k) => {
      if (all[k]) all[k].value = c;
    });
    $('smsDemo').hidden = true;
    $('grGo').click();
  });
  $('cikisBtn').addEventListener('click', out);
  $('hsCikis').addEventListener('click', out);
  $('demoSifir').addEventListener('click', () => {
    const f = () => {
      try {
        Object.keys(localStorage)
          .filter(k => k !== 'vardiya-tema')
          .forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch (e) {}
      location.reload();
    };
    if (window.askConfirm)
      window
        .askConfirm(
          'Bu telefondaki tüm demo verisi silinip ilk hâline dönecek ve giriş ekranı açılacak. Devam edilsin mi?',
          'Sıfırla'
        )
        .then(v => {
          if (v) f();
        });
    else f();
  });
  window.__giris = () => G;
  const g0 = get();
  if (g0 && g0.tip) {
    apply(g0);
    otoKontrol();
  } else show();
})();
