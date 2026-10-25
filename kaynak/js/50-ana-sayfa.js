/* ===== Ana sayfa: hoş geldin ekranı, günün durumu ve bölümlere kısayollar ===== */
(function () {
  const V = window.__vardiya;
  if (!V) return;
  const $ = id => document.getElementById(id),
    esc = V.esc;
  const TILES = {
    magaza: [
      ['c', 'İletişim', 'BS talepleri ve sohbet'],
      ['c:izin', 'İzin / takas', 'İzin ya da vardiya takası iste'],
      ['c:ise', 'İşe giriş', 'Yeni personel evrakları'],
      ['c:yuk', 'Yükselme sınavı', 'Aday, sınav tarihi ve sonuç'],
      ['c:rehber', 'Mağaza rehberi', 'Kod, ad ya da adresle ara'],
      ['c:kurum', 'Kurum yapısı', 'Üst yönetim ve kademeler'],
      ['v', 'Vardiya planı', 'Haftalık çalışma planı'],
      ['f:mevcut', 'Mevcut listesi', 'Aylık saat ve dinlenme, imza'],
      ['s', 'SKT kontrol', 'Ürün ekle, satıldı ya da fire'],
      ['b', 'BS raporu', "BS'nin istediği günlük dönüşler"],
      ['a', 'Ay başı', 'Ciro hedefi ve grafikler'],
      ['k', 'Aktüel', 'Salı, Cuma ve Pazar ürünleri'],
      ['f:sip', 'Sipariş günleri', 'Sipariş ve gelen grupları'],
      ['g', 'Ayarlar', 'Hesap, görünüm, çalışanlar']
    ],
    pm: [
      ['c', "BS'lerim", 'Bölge sorumlularıyla birebir sohbet'],
      ['c:bsgrup', 'BS grubu', "Tüm BS'lere duyuru ve sohbet"],
      ['c:rehber', 'Mağaza rehberi', 'Kod, ad ya da adresle ara'],
      ['g', 'Ayarlar', 'Hesap ve görünüm']
    ],
    depo: [
      ['c', 'Sevkiyat girişi', 'Araç plakası, saat ve şoför'],
      ['c:kayit', 'Kayıt onayları', 'Yeni çalışan kayıtlarını onayla'],
      ['c:yuk', 'Yükselme sınavı', 'Sınav tarihi ver, puan gir'],
      ['c:mgyeni', 'Yeni mağaza', 'Açılan mağazanın bilgilerini gir'],
      ['c:ik', 'İşe giriş (İK)', 'Yeni personel evraklarını kontrol et'],
      ['c:rehber', 'Mağaza rehberi', 'Kod, ad ya da adresle ara'],
      ['c:kurum', 'Kurum yapısı', 'Üst yönetim ve kademeler'],
      ['g', 'Ayarlar', 'Hesap ve görünüm']
    ],
    bs: [
      ['c', 'Mağazalarım', 'Durum, sohbet ve talepler'],
      ['c:bsgrup', 'BS grubu', 'Diğer bölge sorumlularıyla sohbet'],
      ['c:new', 'Talep gönder', 'Görev, bilgi isteği, kontrol'],
      ['c:svnew', 'Savunma iste', 'MS, MSY ya da personelden'],
      ['c:kayit', 'Kayıt onayları', 'Yeni çalışan kayıtlarını onayla'],
      ['c:yuk', 'Yükselme sınavı', 'Aday göster, sonuçları gör'],
      ['c:rehber', 'Mağaza rehberi', 'Kod, ad ya da adresle ara'],
      ['c:kurum', 'Kurum yapısı', 'Üst yönetim ve kademeler'],
      ['g', 'Personel yetkileri', 'Personelin göreceği bölümler, ayarlar']
    ]
  };
  const ICON = {
    'c:kurum':
      '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2h12v2"/></svg>',
    'c:rehber':
      '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    'c:ise':
      '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    'c:ik':
      '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    'c:izin':
      '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/></svg>',
    'c:bsgrup':
      '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.2c2.3.2 3.9 1.8 4.5 4.3"/></svg>',
    'c:grup':
      '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.2c2.3.2 3.9 1.8 4.5 4.3"/></svg>',
    'c:new': '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    'c:svnew':
      '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>'
  };
  ICON['f:sip'] =
    '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M8 14h3M8 17h6"/></svg>';
  ICON['f:mevcut'] =
    '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16M3 14h18"/></svg>';
  ICON['c:mgyeni'] =
    '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h8"/><path d="M18 15v6M15 18h6"/></svg>';
  ICON['c:yuk'] =
    '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/><path d="M5 21h14"/></svg>';
  ICON['c:kayit'] =
    '<svg class="ti" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M3 20c.8-3.6 3.6-5.5 7-5.5 1.3 0 2.5.3 3.5.8"/><path d="m15.5 18 2 2 4-4.5"/></svg>';
  /* Portal: modüller bölümlere ayrılır */
  const PGRP = [
    ['ilt', 'İletişim'],
    ['mgz', 'Mağaza işleri'],
    ['lj', 'Lojistik'],
    ['ik', 'İnsan kaynakları'],
    ['hs', 'Hesap ve ayarlar']
  ];
  function grpOf(k, r) {
    if (k === 'g') return r === 'bs' ? 'ik' : 'hs';
    if (['c:izin', 'c:ise', 'c:ik', 'c:svnew', 'c:kayit', 'c:yuk'].includes(k)) return 'ik';
    if (k === 'c:mgyeni' || k === 'f:sip') return 'lj';
    if (k === 'f:mevcut') return 'mgz';
    if (k === 'c' && r === 'depo') return 'lj';
    if (['v', 's', 'b', 'a', 'k'].includes(k)) return 'mgz';
    if (k === 'c:kurum') return r === 'bs' ? 'ilt' : 'hs';
    if (k === 'c:rehber') return r === 'depo' ? 'lj' : r === 'magaza' ? 'mgz' : 'ilt';
    return 'ilt';
  }
  const BTN = { v: 'tabV', s: 'tabS', b: 'tabB', c: 'tabC', a: 'tabA', k: 'tabK', g: 'tabG' };
  const shown = id => {
    const b = $(id);
    return b && getComputedStyle(b).display !== 'none';
  };
  function selam() {
    const h = new Date().getHours();
    return h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
  }
  function stat(ok, label, sub, go) {
    return `<div class="hm-st ${ok === true ? 'ok' : ok === false ? 'no' : ''}${go ? ' go' : ''}"${go ? ` data-hm="${go}" role="button" tabindex="0"` : ''}><i>${ok === true ? '✓' : ok === false ? '!' : '•'}</i><div><b>${label}</b><small>${sub}</small></div>${go ? '<em class="hm-go" aria-hidden="true">›</em>' : ''}</div>`;
  }
  function render() {
    const g = window.__giris && window.__giris(),
      bs = g && g.tip === 'bs',
      dp = g && g.tip === 'depo',
      pm = g && g.tip === 'pm',
      ad = g ? String(g.ad || '').split(' ')[0] : '';
    const S = window.__icSum ? window.__icSum() : null,
      now = new Date(),
      mins = now.getHours() * 60 + now.getMinutes();
    let st = '';
    if (S && pm) {
      const ku = g.unvan === 'GM' ? 'gm' : g.unvan === 'BM' ? 'bm' : 'pm';
      st =
        ku === 'pm'
          ? stat(S.pmU ? false : true, 'BS mesajları', S.pmU ? `${S.pmU} yeni mesaj` : 'Yeni mesaj yok', 'c') +
            stat(S.bsg ? false : true, 'BS grubu', S.bsg ? `${S.bsg} yeni mesaj` : 'Yeni mesaj yok', 'c:bsgrup') +
            (S.ustU ? stat(false, 'Bölge müdürü', `${S.ustU} yeni mesaj`, 'c:ust:' + (S.ustK || '')) : '')
          : stat(
              S.ustU ? false : true,
              ku === 'gm' ? 'Bölge müdürleri' : 'PM ve GM mesajları',
              S.ustU ? `${S.ustU} yeni mesaj` : 'Yeni mesaj yok',
              'c'
            );
    } else if (S && dp) {
      if (window.__ikMi && window.__ikMi(g)) {
        const kb = window.__kayit ? window.__kayit.get().list.filter(x => x.durum === 'bek').length : 0;
        st =
          (S.ikB
            ? stat(false, 'İşe giriş dosyası', `${S.ikB} dosya kontrol bekliyor`, 'c:ik')
            : stat(true, 'İşe giriş dosyası', 'Bekleyen dosya yok', 'c:ik')) +
          stat(
            kb ? false : true,
            'Kayıt onayı',
            kb ? `${kb} yeni çalışan onay bekliyor` : 'Bekleyen kayıt yok',
            'c:kayit'
          );
      } else
        st =
          stat(null, 'Bugünkü sevkiyat', S.sevkBs ? `${S.sevkBs} araç planlandı` : 'Bugün için araç girilmedi', 'c') +
          stat(null, 'Yarınki sevkiyat', S.sevkYarin ? `${S.sevkYarin} araç planlandı` : 'Henüz araç girilmedi', 'c');
    } else if (S && bs) {
      st =
        (S.ist.skt ? stat(S.sk === S.n, 'Sabah SKT', `${S.sk}/${S.n} mağaza gönderdi`, 'c') : '') +
        (S.ist.rapor
          ? stat(now.getHours() < 20 ? null : S.rp === S.n, 'Akşam raporu', `${S.rp}/${S.n} mağaza gönderdi`, 'c')
          : '') +
        stat(S.open ? false : true, 'Açık talep', S.open ? `${S.open} talepte eksik dönüş var` : 'Hepsi tamam', 'c') +
        stat(
          S.svWait ? null : true,
          'Savunma',
          S.svWait
            ? `${S.svWait} savunma bekleniyor`
            : S.svNew
              ? `${S.svNew} savunma okunmayı bekliyor`
              : 'Bekleyen yok',
          'c'
        );
    } else if (S) {
      const sk =
        (S.sevk ? stat(null, 'Sevkiyat', S.sevk, 'c') : '') +
        (() => {
          const o = window.__sipBugun && window.__sipBugun();
          if (!o) return '';
          return stat(
            null,
            o.s.length ? 'Bugün sipariş: ' + esc(o.s.join(', ')) : 'Bugün sipariş yok',
            o.t.length ? 'Bugün gelen: ' + esc(o.t.join(', ')) : 'Bugün gelen grup yok',
            'f:sip'
          );
        })();
      if (S.staff) st = sk + (S.sv ? stat(false, 'Savunma', `${S.sv} savunma isteniyor`, 'c') : '');
      else
        st =
          sk +
          (S.vdGun ? stat(S.vdGun.gec ? false : null, S.vdGun.t, S.vdGun.d, 'v:' + S.vdGun.w) : '') +
          (S.izB ? stat(false, 'İzin / takas', `${S.izB} talep onayını bekliyor`, 'c:izin') : '') +
          (S.iseEk ? stat(false, 'İşe giriş evrakı', `${S.iseEk} dosyada eksik var`, 'c:ise') : '') +
          (S.ist.skt
            ? stat(
                S.mskt ? true : mins > 9 * 60 + 15 ? false : null,
                'Sabah SKT dönüşü',
                S.mskt ? 'Gönderildi' : "09.15'e kadar",
                'b'
              )
            : '') +
          (S.ist.rapor
            ? stat(S.rapor ? true : null, 'Akşam raporu', S.rapor ? 'Gönderildi' : "Akşam BS'ye gönderilecek", 'b')
            : '') +
          stat(S.wait ? false : true, 'BS talepleri', S.wait ? `${S.wait} talep yanıt bekliyor` : 'Bekleyen yok', 'c') +
          (S.sv ? stat(false, 'Savunma', `${S.sv} savunma isteniyor`, 'c') : '');
    }
    const stf = document.body.dataset.role === 'staff' && !document.body.classList.contains('yk-c');
    const T = (
      pm
        ? ['GM', 'BM'].includes(g.unvan)
          ? TILES.pm
              .filter(x => x[0] !== 'c:bsgrup')
              .map(x =>
                x[0] === 'c'
                  ? g.unvan === 'GM'
                    ? ['c', 'Bölge müdürleri', 'Bölge müdürleriyle birebir sohbet']
                    : ['c', "PM'lerim", "PM'lerle ve GM ile birebir sohbet"]
                  : x
              )
          : TILES.pm
        : dp
          ? TILES.depo
          : bs
            ? TILES.bs
            : stf
              ? TILES.magaza.map(x => (x[0] === 'c' ? ['c', 'Mağaza grubu', 'Çalışanlarla sohbet'] : x))
              : [TILES.magaza[0], ['c:grup', 'Mağaza grubu', 'Çalışanlarla sohbet'], ...TILES.magaza.slice(1)]
    ).filter(
      ([k]) =>
        (k[0] === 'f' || shown(BTN[k.split(':')[0]])) &&
        (k !== 'c:ise' || (g && ['MS', 'MSY'].includes(g.unvan))) &&
        (k !== 'c:kayit' || (window.__kayit && window.__kayit.yetkili())) &&
        (!dp || (window.__ikMi(g) ? k !== 'c' : !['c:ik', 'c:kayit', 'c:yuk', 'c:mgyeni'].includes(k)))
    );
    $('homeBody').innerHTML =
      `<div class="box hm-hero"><div class="hm-logo" aria-hidden="true"></div><div><p class="hm-hi">${selam()}${ad ? ', ' + esc(ad) : ''}</p><h2>BİM Mağaza Portalı</h2><p class="hm-sub">${
        pm
          ? (g.unvan === 'GM' ? 'Genel müdürlük' : g.unvan === 'BM' ? 'Bölge müdürü' : 'PM') +
            (g.bolge ? ' · ' + esc(g.bolge) : '')
          : dp
            ? 'Depo' + (g.depo ? ' · ' + esc(g.depo) : '')
            : bs
              ? 'Bölge sorumlusu' + (g.bolge ? ' · ' + esc(g.bolge) : '')
              : esc((g && g.magaza) || '') +
                (() => {
                  const o = g && window.__mg && window.__mg.bul(g.magaza);
                  return o ? ' · ' + esc(o.yer) : '';
                })()
      }</p></div></div>
  ${(() => {
    const F = window.__icFeed ? window.__icFeed() : [];
    return F.length
      ? `<div class="box hm-feed"><h2>Son gelenler</h2><ul>${F.map(x => `<li data-hmnt="${esc(x.k)}"><i class="${x.red ? 'red' : ''}"></i><span><b>${esc(x.t)}</b><small>${esc(x.d || '')}</small></span><em>${esc(x.w)}</em></li>`).join('')}</ul>${F.n > F.length ? `<button type="button" class="linkbtn" data-hmall>Tümünü gör (${F.n})</button>` : ''}</div>`
      : '';
  })()}
  ${st ? `<div class="box"><h2>Bugün</h2><div class="hm-today">${st}</div></div>` : ''}
  ${(() => {
    const tile = ([k, t, d]) => {
        const b = $(BTN[k.split(':')[0]]),
          ic = ICON[k] || (b && b.querySelector('.ti') ? b.querySelector('.ti').outerHTML : ''),
          bd = !k.includes(':') && b && b.querySelector('.badge:not([hidden])');
        return `<button type="button" class="hm-tile" data-hm="${k}"><span class="hm-arr" aria-hidden="true">→</span><span class="hm-ic">${ic}</span><b>${t}</b><small>${d}</small>${bd && bd.textContent.trim() && bd.textContent.trim() !== '0' ? `<span class="hm-bd">${esc(bd.textContent.trim())}</span>` : ''}</button>`;
      },
      G = PGRP.map(([gk, gl]) => [
        gl,
        T.filter(x => grpOf(x[0], pm ? 'pm' : dp ? 'depo' : bs ? 'bs' : 'magaza') === gk)
      ]).filter(([, L]) => L.length);
    return G.map(([gl, L]) => `<h2 class="hm-q">${gl}</h2><div class="hm-grid">${L.map(tile).join('')}</div>`).join('');
  })()}`;
  }
  $('homeBody').addEventListener('click', e => {
    const f = e.target.closest('[data-hmnt]');
    if (f && window.__icOpenNt) {
      window.__icOpenNt(f.dataset.hmnt);
      return;
    }
    if (e.target.closest('[data-hmall]')) {
      $('bellBtn').click();
      return;
    }
    const b = e.target.closest('[data-hm]');
    if (!b) return;
    const [t, p, ...r] = b.dataset.hm.split(':');
    if (t === 'f') {
      if (window.__pano) window.__pano.ac(p);
      return;
    }
    if (t === 'c' && window.__icGo && (p || b.classList.contains('hm-st')))
      window.__icGo(p || 'home', r.join(':') || null);
    else {
      window.__setTab(t);
      if (t === 'v' && p && window.__vdHafta) window.__vdHafta(p);
    }
    window.scrollTo({ top: 0 });
  });
  window.__renderHome = render;
})();
