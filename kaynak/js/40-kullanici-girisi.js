/* ===== Giriş sistemi (kullanıcı kodu + şifre) ===== */
(function () {
  const V = window.__vardiya;
  const $ = id => document.getElementById(id);
  const ov = $('auth');
  if (!V) {
    ov.hidden = true;
    document.body.classList.remove('locked');
    return;
  }
  const esc = V.esc,
    SKEY = 'vardiya-session';
  // SHA-256 (cihazdan bağımsız, kütüphanesiz)
  function sha256(str) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
      0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
      0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
      0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
      0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
      0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
      0xc67178f2
    ];
    const bytes = Array.from(new TextEncoder().encode(str)),
      bl = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(Math.floor(bl / Math.pow(2, 8 * i)) & 255);
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < bytes.length; o += 64) {
      const w = new Array(64);
      for (let i = 0; i < 16; i++)
        w[i] =
          (bytes[o + 4 * i] << 24) | (bytes[o + 4 * i + 1] << 16) | (bytes[o + 4 * i + 2] << 8) | bytes[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3),
          s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, k] = h;
      for (let i = 0; i < 64; i++) {
        const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25),
          ch = (e & f) ^ (~e & g),
          t1 = (k + S1 + ch + K[i] + w[i]) | 0,
          S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22),
          mj = (a & b) ^ (a & c) ^ (b & c),
          t2 = (S0 + mj) | 0;
        k = g;
        g = f;
        f = e;
        e = (d + t1) | 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) | 0;
      }
      h = h.map((x, i) => (x + [a, b, c, d, e, f, g, k][i]) | 0);
    }
    return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  const hash = (salt, pw) => {
    let x = salt + ':' + pw;
    for (let i = 0; i < 500; i++) x = sha256(x + salt);
    return x;
  };
  const rnd = n => {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    const buf = new Uint32Array(n);
    window.crypto && crypto.getRandomValues
      ? crypto.getRandomValues(buf)
      : buf.forEach((_, i) => (buf[i] = Math.random() * 4294967296));
    buf.forEach(v => (s += a[v % a.length]));
    return s;
  };
  const A = () => {
    const st = V.state();
    if (!st.auth) st.auth = { users: [] };
    if (!Array.isArray(st.auth.users)) st.auth.users = [];
    return st.auth;
  };
  // kullanıcı kodu büyük/küçük harf ve Türkçe karakter farkı gözetmez (İklim = iklim = IKLIM)
  const norm = c =>
    String(c || '')
      .trim()
      .replace(/[İIı]/g, 'i')
      .toLowerCase()
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '');
  let me = null,
    mode = 'login',
    tries = 0;

  function session() {
    try {
      const x = JSON.parse(localStorage.getItem(SKEY) || 'null');
      if (x && x.exp > Date.now()) return x;
    } catch (e) {}
    return null;
  }
  function startSession(u, remember) {
    try {
      localStorage.setItem(SKEY, JSON.stringify({ uid: u.id, exp: Date.now() + (remember ? 30 : 0.5) * 864e5 }));
    } catch (e) {}
  }
  function apply(u) {
    me = u;
    document.body.dataset.role = u.role;
    ov.hidden = true;
    document.body.classList.remove('locked');
    $('userbar').hidden = false;
    $('userName').textContent = `${u.name || u.code}, ${u.role === 'admin' ? 'Yönetici' : 'Personel'}`;
    if (u.role === 'staff' && ['a', 'g'].includes(V.state().tab) && window.__setTab) window.__setTab('v');
    renderUsers();
    if ($('myQ')) renderQA(u);
    if (u.role === 'admin' && (A().pending || []).length)
      setTimeout(() => V.toast(`${A().pending.length} kayıt isteği onayını bekliyor (Ayarlar > Kullanıcılar).`), 700);
  }
  const QUESTIONS = [
    'İlk evcil hayvanının adı?',
    'Doğduğun şehir?',
    'İlkokul öğretmeninin adı?',
    'En sevdiğin yemek?',
    'Annenin doğduğu şehir?',
    'İlk çalıştığın iş yeri?',
    'Çocukken en yakın arkadaşının adı?'
  ];
  const normAns = a => norm(a).replace(/[^a-z0-9]/g, '');
  function qSelect(id, sel) {
    return `<label>Güvenlik sorusu<select id="${id}">${QUESTIONS.map((q, i) => `<option value="${i}"${String(sel) === String(i) ? ' selected' : ''}>${q}</option>`).join('')}</select></label>`;
  }
  function setQA(u, qi, ans) {
    const s2 = rnd(12);
    u.sq = Number(qi) || 0;
    u.sa = { salt: s2, hash: hash(s2, normAns(ans)) };
  }
  function field(id, label, type, extra) {
    return `<label>${label}<input id="${id}" type="${type || 'text'}" ${extra || ''}></label>`;
  }
  function show(m) {
    mode = m;
    $('authErr').textContent = '';
    ov.hidden = false;
    document.body.classList.add('locked');
    $('authForm').hidden = false;
    $('regDone').hidden = true;
    $('atabs').hidden = !(m === 'login' || m === 'register');
    $('authRst').hidden = !((m === 'login' || m === 'register') && !A().users.length);
    document.querySelectorAll('#atabs [data-am]').forEach(b => b.setAttribute('aria-selected', b.dataset.am === m));
    document.body.dataset.role = '';
    $('userbar').hidden = true;
    if (m === 'setup') {
      $('authSub').textContent =
        'İlk kurulum: yönetici hesabını oluştur. Diğer kullanıcıları sonra Ayarlar → Kullanıcılar bölümünden eklersin.';
      $('authFields').innerHTML =
        field('aName', 'Adın', 'text', 'autocomplete="name"') +
        field('aCode', 'Kullanıcı kodu', 'text', 'autocomplete="username" autocapitalize="off" spellcheck="false"') +
        field('aPhone', 'Cep telefonun', 'tel', 'autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx"') +
        qSelect('aQ', 0) +
        field('aAns', 'Cevabın (şifreni unutursan sorulur)', 'text', 'autocomplete="off" spellcheck="false"') +
        field('aPass', 'Şifre (en az 4 karakter)', 'password', 'autocomplete="new-password"') +
        field('aPass2', 'Şifre tekrar', 'password', 'autocomplete="new-password"');
      $('authGo').textContent = 'Hesabı oluştur';
      $('authAlt').hidden = true;
    } else if (m === 'register' && !A().users.length) {
      $('authSub').textContent =
        'İlk kayıt: henüz hesap yok, kayıt olan ilk kişi yönetici olur. Diğer kayıtları sen onaylarsın.';
      $('authFields').innerHTML =
        field('aName', 'Adın soyadın', 'text', 'autocomplete="name"') +
        field(
          'aCode',
          'Kullanıcı kodu (giriş için)',
          'text',
          'autocomplete="username" autocapitalize="off" spellcheck="false"'
        ) +
        field('aPhone', 'Cep telefonun', 'tel', 'autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx"') +
        qSelect('aQ', 0) +
        field('aAns', 'Cevabın (şifreni unutursan sorulur)', 'text', 'autocomplete="off" spellcheck="false"') +
        field('aPass', 'Şifre (en az 4 karakter)', 'password', 'autocomplete="new-password"') +
        field('aPass2', 'Şifre tekrar', 'password', 'autocomplete="new-password"');
      $('authGo').textContent = 'Yönetici olarak kayıt ol';
      $('authAlt').hidden = true;
    } else if (m === 'register') {
      $('authSub').textContent = 'Kayıt ol. Hesabın yöneticinin onayından sonra açılır.';
      $('authFields').innerHTML =
        field('aName', 'Adın soyadın', 'text', 'autocomplete="name"') +
        field(
          'aCode',
          'Kullanıcı kodu (giriş için)',
          'text',
          'autocomplete="username" autocapitalize="off" spellcheck="false"'
        ) +
        field('aPhone', 'Cep telefonun', 'tel', 'autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx"') +
        field('aPass', 'Şifre (en az 4 karakter)', 'password', 'autocomplete="new-password"') +
        field('aPass2', 'Şifre tekrar', 'password', 'autocomplete="new-password"');
      $('authGo').textContent = 'Kayıt isteği gönder';
      $('authAlt').hidden = true;
    } else if (m === 'login') {
      $('authSub').textContent = 'Kullanıcı kodun ve şifrenle giriş yap.';
      $('authFields').innerHTML =
        field('aCode', 'Kullanıcı kodu', 'text', 'autocomplete="username" autocapitalize="off" spellcheck="false"') +
        field('aPass', 'Şifre', 'password', 'autocomplete="current-password"') +
        '<label class="check" style="flex-direction:row;margin-top:2px"><input type="checkbox" id="aRem" checked><span>Bu telefonda 30 gün açık kalsın</span></label>';
      $('authGo').textContent = 'Giriş yap';
      $('authAlt').hidden = false;
      $('authAlt').textContent = 'Yönetici şifremi unuttum';
    } else if (m === 'restore') {
      $('authSub').textContent =
        'Hesabın başka bir cihazdaysa (örneğin bilgisayarda), orada Ayarlar → Yedekleme ve taşıma → "Yedeği al" de ve gelen yedeği buraya yapıştır ya da dosyasını seç. Hesapların ve tüm verilerin bu cihaza gelir.';
      $('authFields').innerHTML =
        '<label>Yedek<textarea id="aBk" placeholder="VARDIYA-YEDEK-1:… ile başlayan metni yapıştır" spellcheck="false"></textarea></label><label class="btn small" style="cursor:pointer;text-align:center;flex-direction:row;justify-content:center;color:var(--ink)">Dosyadan seç<input type="file" id="aBkFile" accept=".txt,.json,text/plain,application/json" hidden></label>';
      $('authGo').textContent = 'Yedeği yükle';
      $('authAlt').hidden = false;
      $('authAlt').textContent = 'Geri dön';
      $('aBkFile').addEventListener('change', e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          $('aBk').value = String(r.result || '');
        };
        r.readAsText(f, 'utf-8');
      });
    } else if (m === 'recover') {
      $('authSub').textContent = 'Kayıtlı cep telefonun ve güvenlik sorunun cevabıyla yönetici şifreni yenile.';
      $('authFields').innerHTML =
        field('aCode', 'Kullanıcı kodu', 'text', 'autocapitalize="off" spellcheck="false"') +
        field('aPhone', 'Kayıtlı cep telefonun', 'tel', 'inputmode="tel" placeholder="05xx xxx xx xx"') +
        '<p class="hint" id="aQtxt" style="margin:0;font-weight:700;color:var(--ink)">Güvenlik sorusu: kullanıcı kodunu yazınca görünür</p>' +
        field('aAns', 'Cevabın', 'text', 'autocomplete="off" spellcheck="false"') +
        field('aPass', 'Yeni şifre', 'password', 'autocomplete="new-password"');
      const qt = () => {
        const u = A().users.find(x => x.code === norm($('aCode').value));
        $('aQtxt').textContent =
          u && u.sa ? 'Güvenlik sorusu: ' + QUESTIONS[u.sq || 0] : 'Güvenlik sorusu: kullanıcı kodunu yazınca görünür';
      };
      $('aCode').addEventListener('input', qt);
      $('authGo').textContent = 'Şifreyi yenile';
      $('authAlt').hidden = false;
      $('authAlt').textContent = 'Girişe dön';
    }
    const f = $('authFields').querySelector('input');
    if (f) setTimeout(() => f.focus(), 50);
  }
  function err(t) {
    $('authErr').textContent = t;
  }
  $('authAlt').addEventListener('click', () =>
    show(mode === 'login' ? 'recover' : mode === 'restore' ? (A().users.length ? 'login' : 'register') : 'login')
  );
  $('authRst').addEventListener('click', () => show('restore'));
  $('regBack').addEventListener('click', () => show('login'));
  $('authForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = id => ($(id) && $(id).value) || '';
    if (mode === 'restore') {
      if (A().users.length)
        return err('Bu cihazda zaten hesap var; yedeği giriş yaptıktan sonra Yedekleme bölümünden yükle.');
      const t = v('aBk').trim(),
        TAG = 'VARDIYA-YEDEK-1:',
        i = t.indexOf(TAG);
      if (i < 0) return err('Bu bir yedek metni değil; yedeğin tamamını yapıştır.');
      let obj;
      try {
        obj = JSON.parse(t.slice(i + TAG.length));
      } catch (x) {
        return err('Yedek eksik ya da bozuk; tamamını kopyaladığından emin ol.');
      }
      const d = obj && obj.data;
      if (!d || !Array.isArray(d.employees)) return err('Yedek okunamadı.');
      try {
        localStorage.setItem('market-vardiya-v3', JSON.stringify(d));
      } catch (x) {
        return err('Kaydedilemedi.');
      }
      $('authSub').textContent = 'Yedek yüklendi, uygulama açılıyor… Kendi kullanıcı kodun ve şifrenle giriş yap.';
      setTimeout(() => location.reload(), 700);
      return;
    }
    if (mode === 'register' && !A().users.length) mode = 'setup';
    if (mode === 'setup') {
      const name = v('aName').trim(),
        code = norm(v('aCode')),
        pw = v('aPass');
      if (!name || !code) return err('Adını ve kullanıcı kodunu yaz.');
      if (pw.length < 4) return err('Şifre en az 4 karakter olmalı.');
      if (pw !== v('aPass2')) return err('Şifreler aynı değil.');
      const phone = normPhone(v('aPhone'));
      if (!phone) return err('Cep telefonunu yaz (05xx…).');
      if (normAns(v('aAns')).length < 2) return err('Güvenlik sorusunun cevabını yaz.');
      const salt = rnd(12),
        rec = rnd(8),
        rsalt = rnd(12),
        u = { id: rnd(10), name, code, role: 'admin', phone, salt, hash: hash(salt, pw) };
      setQA(u, v('aQ'), v('aAns'));
      A().users = [u];
      A().recovery = { salt: rsalt, hash: hash(rsalt, rec) };
      V.save();
      startSession(u, true);
      apply(u);
      V.toast('Hesap oluşturuldu. Şifreni unutursan telefon numaran ve güvenlik sorunla yenileyebilirsin.');
      return;
    }
    if (mode === 'register') {
      const name = v('aName').trim(),
        code = norm(v('aCode')),
        pw = v('aPass'),
        phone = normPhone(v('aPhone'));
      if (!name || !code) return err('Adını ve kullanıcı kodunu yaz.');
      if (!phone) return err('Cep telefonunu yaz (05xx…).');
      if (pw.length < 4) return err('Şifre en az 4 karakter olmalı.');
      if (pw !== v('aPass2')) return err('Şifreler aynı değil.');
      if (A().users.some(x => x.code === code) || (A().pending || []).some(x => x.code === code))
        return err('Bu kullanıcı kodu alınmış, başka bir kod seç.');
      const salt = rnd(12);
      A().pending = A().pending || [];
      A().pending.push({ id: rnd(10), name, code, phone, salt, hash: hash(salt, pw), at: new Date().toISOString() });
      V.save();
      const adm = A().users.find(x => x.role === 'admin' && x.phone) || A().users.find(x => x.role === 'admin');
      const msg = `Mağaza Asistanı: ${name} (kullanıcı kodu: ${code}) kayıt oldu, onayını bekliyor. Uygulamada Ayarlar > Kullanıcılar bölümünden onaylayabilirsin.`;
      $('authForm').hidden = true;
      $('authAlt').hidden = true;
      $('atabs').hidden = true;
      $('regDone').hidden = false;
      $('authSub').textContent = 'Kayıt isteğin alındı.';
      $('regDoneTxt').textContent =
        `Yönetici onayladıktan sonra "${code}" koduyla giriş yapabilirsin. Yöneticiye haber vermek için aşağıdaki düğmeleri kullan.`;
      const ph = adm && adm.phone ? adm.phone : '';
      $('regSms').href = `sms:${ph}?&body=${encodeURIComponent(msg)}`;
      $('regWa').href = ph
        ? `https://wa.me/${ph.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      return;
    }
    if (mode === 'login') {
      if (!A().users.length) {
        err('Henüz hesap yok. Önce "Kayıt ol" sekmesinden kayıt ol; ilk kayıt olan yönetici olur.');
        return;
      }
      if ((A().pending || []).some(x => x.code === norm(v('aCode')))) {
        err('Kaydın henüz yönetici tarafından onaylanmadı.');
        return;
      }
      const u = A().users.find(x => x.code === norm(v('aCode')));
      if (!u || hash(u.salt, v('aPass')) !== u.hash) {
        err('Kullanıcı kodu ya da şifre yanlış.');
        $('aPass').value = '';
        return;
      }
      startSession(u, $('aRem') && $('aRem').checked);
      apply(u);
      V.toast(`Hoş geldin, ${u.name || u.code}.`);
      return;
    }
    if (mode === 'recover') {
      const u = A().users.find(x => x.code === norm(v('aCode')) && x.role === 'admin');
      if (!u) return err('Bu kodla bir yönetici bulunamadı. Personel şifresini yönetici sıfırlar.');
      if (!u.sa) return err('Bu hesapta güvenlik sorusu yok; başka bir yönetici şifreni sıfırlayabilir.');
      if (!u.phone || normPhone(v('aPhone')) !== u.phone || hash(u.sa.salt, normAns(v('aAns'))) !== u.sa.hash) {
        tries++;
        return err(
          tries >= 5
            ? 'Çok fazla deneme. Başka bir yöneticiden şifreni sıfırlamasını iste.'
            : 'Telefon ya da cevap uyuşmuyor.'
        );
      }
      if (tries >= 5) return err('Çok fazla deneme. Başka bir yöneticiden şifreni sıfırlamasını iste.');
      if (v('aPass').length < 4) return err('Yeni şifre en az 4 karakter olmalı.');
      u.salt = rnd(12);
      u.hash = hash(u.salt, v('aPass'));
      V.save();
      startSession(u, true);
      apply(u);
      V.toast('Şifre yenilendi.');
    }
  });
  $('recOk').addEventListener('click', () => {
    $('recDlg').hidden = true;
  });
  // 05xx xxx xx xx → +905xxxxxxxxx
  function normPhone(v) {
    let d = String(v || '').replace(/\D/g, '');
    if (d.startsWith('0090')) d = d.slice(2);
    if (d.startsWith('90') && d.length === 12) return '+' + d;
    if (d.startsWith('0') && d.length === 11) return '+9' + d;
    if (d.startsWith('5') && d.length === 10) return '+90' + d;
    return d.length >= 10 ? '+' + d : '';
  }
  function showRec(rec, u) {
    const code = rec.slice(0, 4) + '-' + rec.slice(4),
      msg = `Mağaza Asistanı kurtarma kodu: ${code}\nKullanıcı kodu: ${u.code}\nBu kodu kimseyle paylaşma.`;
    $('recCode').textContent = code;
    $('recSms').href = `sms:${u.phone || ''}?&body=${encodeURIComponent(msg)}`;
    $('recWa').href = `https://wa.me/${(u.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    $('recHint').textContent =
      `Yönetici şifreni unutursan bu kodla yeni şifre belirlersin. ${u.phone ? u.phone + ' numarana' : 'Kendine'} SMS ya da WhatsApp ile gönder; mesajların arasında saklanır.`;
    $('recDlg').hidden = false;
  }
  // yönetici: kurtarma kodunu yenile ve tekrar gönder
  function newRecovery() {
    const me2 = me;
    if (!me2 || me2.role !== 'admin') return;
    const rec = rnd(8),
      rsalt = rnd(12);
    A().recovery = { salt: rsalt, hash: hash(rsalt, rec) };
    V.save();
    showRec(rec, me2);
  }
  $('brandLink').addEventListener('click', e => {
    e.preventDefault();
    if (window.__setTab) window.__setTab('h');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('logoutBtn').addEventListener('click', () => {
    try {
      localStorage.removeItem(SKEY);
    } catch (e) {}
    me = null;
    show('login');
  });

  /* --- kullanıcı yönetimi (yönetici) --- */
  function renderPending() {
    const el = $('pendList');
    if (!el) return;
    const P = A().pending || [],
      isAdm = me && me.role === 'admin';
    $('pendBadge').hidden = !P.length || !isAdm;
    $('pendBadge').textContent = P.length;
    el.innerHTML = isAdm
      ? P.map(
          r =>
            `<div class="pend"><b>${esc(r.name)} kayıt olmak istiyor</b><small>Kod: ${esc(r.code)}, Tel: ${esc(r.phone || '-')}, ${new Date(r.at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small><div class="acts"><select data-prole="${r.id}" aria-label="Yetki"><option value="staff">Personel</option><option value="admin">Yönetici</option></select><button type="button" class="ok" data-pok="${r.id}">Onayla</button><button type="button" data-pno="${r.id}">Reddet</button></div></div>`
        ).join('')
      : '';
    const ub = $('userName');
    if (ub) {
      const old = document.getElementById('pendDot');
      if (old) old.remove();
      if (isAdm && P.length) {
        ub.insertAdjacentHTML(
          'afterend',
          `<button type="button" class="ubadge" id="pendDot" title="Onay bekleyen kayıt">${P.length} onay</button>`
        );
        $('pendDot').onclick = () => {
          if (window.__setTab) window.__setTab('g');
          $('usrBox').open = true;
          $('usrBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
      }
    }
  }
  function renderUsers() {
    renderPending();
    const el = $('usrList');
    if (!el) return;
    el.innerHTML = A()
      .users.map(
        u =>
          `<div class="ui"><div><b>${esc(u.name || u.code)}</b><small>Kod: ${esc(u.code)}, ${u.role === 'admin' ? 'Yönetici' : 'Personel'}${me && u.id === me.id ? ' (sen)' : ''}</small></div><div class="acts"><button type="button" data-ureset="${u.id}">Şifre</button>${me && u.id !== me.id ? `<button type="button" data-urole="${u.id}">${u.role === 'admin' ? 'Personel yap' : 'Yönetici yap'}</button><button type="button" data-udel="${u.id}">Sil</button>` : ''}</div></div>`
      )
      .join('');
  }
  $('uAdd').addEventListener('click', () => {
    const name = $('uName').value.trim(),
      code = norm($('uCode').value),
      pw = $('uPass').value;
    if (!name || !code) return V.toast('Ad ve kullanıcı kodu yaz.');
    if (pw.length < 4) return V.toast('Geçici şifre en az 4 karakter olmalı.');
    if (A().users.some(x => x.code === code)) return V.toast('Bu kullanıcı kodu zaten var.');
    const salt = rnd(12);
    A().users.push({ id: rnd(10), name, code, role: $('uRole').value, salt, hash: hash(salt, pw) });
    V.save();
    ['uName', 'uCode', 'uPass'].forEach(k => ($(k).value = ''));
    renderUsers();
    V.toast(`${name} eklendi. Kodu: ${code}`);
  });
  $('pendList').addEventListener('click', async e => {
    const ok = e.target.closest('[data-pok]'),
      no = e.target.closest('[data-pno]');
    if (!ok && !no) return;
    const id = (ok || no).dataset.pok || (ok || no).dataset.pno,
      r = (A().pending || []).find(x => x.id === id);
    if (!r) return;
    if (ok) {
      const role = document.querySelector(`[data-prole="${id}"]`).value;
      A().users.push({ id: r.id, name: r.name, code: r.code, phone: r.phone, role, salt: r.salt, hash: r.hash });
      V.toast(`${r.name} onaylandı, artık giriş yapabilir.`);
    } else {
      if (!(await window.askConfirm(`${r.name} kişisinin kayıt isteği reddedilsin mi?`, 'Reddet'))) return;
      V.toast('Kayıt isteği reddedildi.');
    }
    A().pending = (A().pending || []).filter(x => x !== r);
    V.save();
    renderUsers();
  });
  $('usrList').addEventListener('click', async e => {
    const rs = e.target.closest('[data-ureset]'),
      ro = e.target.closest('[data-urole]'),
      dl = e.target.closest('[data-udel]');
    if (rs) {
      const u = A().users.find(x => x.id === rs.dataset.ureset);
      if (!u) return;
      const pw = rnd(6);
      u.salt = rnd(12);
      u.hash = hash(u.salt, pw);
      V.save();
      await window.askConfirm(
        `${u.name || u.code} için yeni geçici şifre: ${pw}. Bunu kendisine ilet; giriş yaptıktan sonra yönetici değiştirebilir.`,
        'Tamam'
      );
      return;
    }
    if (ro) {
      const u = A().users.find(x => x.id === ro.dataset.urole);
      if (!u) return;
      if (u.role === 'admin' && A().users.filter(x => x.role === 'admin').length < 2)
        return V.toast('En az bir yönetici kalmalı.');
      u.role = u.role === 'admin' ? 'staff' : 'admin';
      V.save();
      renderUsers();
      return;
    }
    if (dl) {
      const u = A().users.find(x => x.id === dl.dataset.udel);
      if (!u) return;
      if (!(await window.askConfirm(`${u.name || u.code} kullanıcısı silinsin mi?`, 'Sil'))) return;
      A().users = A().users.filter(x => x !== u);
      V.save();
      renderUsers();
    }
  });

  $('qaSave').addEventListener('click', () => {
    if (!me) return;
    const u = A().users.find(x => x.id === me.id);
    if (!u) return;
    const ph = normPhone($('myPhone').value);
    if (!ph) return V.toast('Geçerli bir cep telefonu yaz.');
    const ans = $('myAns').value;
    if (!u.sa && normAns(ans).length < 2) return V.toast('Güvenlik sorusunun cevabını yaz.');
    u.phone = ph;
    if (normAns(ans).length >= 2) setQA(u, $('myQ').value, ans);
    else u.sq = Number($('myQ').value) || 0;
    V.save();
    $('myAns').value = '';
    renderQA(u);
    V.toast('Kaydedildi.');
  });
  function renderQA(u) {
    $('myQ').innerHTML = QUESTIONS.map(
      (q, i) => `<option value="${i}"${(u.sq || 0) === i ? ' selected' : ''}>${q}</option>`
    ).join('');
    $('myPhone').value = u.phone || '';
    $('qaInfo').textContent = u.sa
      ? 'Şifreni unutursan kayıtlı telefonun ve güvenlik sorunla yenilersin.'
      : 'Henüz güvenlik sorun yok. Şifreni unutursan yenileyebilmek için şimdi bir soru seçip cevabını yaz.';
    $('qaInfo').style.color = u.sa ? '' : 'var(--danger)';
  }

  /* --- açılış --- */
  // Giriş ekranı şimdilik kapalı: uygulama doğrudan yönetici olarak açılır.
  // Kayıtlı kullanıcılar silinmez; tekrar açmak için GIRIS_ACIK=true yapmak yeterli.
  const GIRIS_ACIK = false;
  if (!GIRIS_ACIK) {
    apply({ id: 'yerel', name: 'Mağaza', code: 'magaza', role: 'admin' });
    ['logoutBtn', 'userName', 'usrBox'].forEach(id => {
      const el = $(id);
      if (el) el.style.display = 'none';
    });
    const pd = document.getElementById('pendDot');
    if (pd) pd.style.display = 'none';
  } else {
    const ss = session(),
      u = ss && A().users.find(x => x.id === ss.uid);
    document.querySelectorAll('#atabs [data-am]').forEach(b => b.addEventListener('click', () => show(b.dataset.am)));
    if (u) apply(u);
    else show(A().users.length ? 'login' : 'register');
  }
})();
