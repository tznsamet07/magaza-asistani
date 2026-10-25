/* ===== İletişim (sunum demosu): WhatsApp grubunun yerine mağaza ⇄ BS talep, yanıt ve sohbet =====
   Veri yapısı ileride bulut sunucuya birebir taşınacak şekilde: mağazalar, talepler, yanıtlar, mesajlar.
   Şimdilik tek cihazda çalışır; diğer mağazaların yanıtları örnek veriyle (simülasyon) gelir. */
(function () {
  const V = window.__vardiya;
  if (!V) return;
  const $ = id => document.getElementById(id),
    esc = V.esc,
    KEY = 'magaza-iletisim-demo';
  const pad = n => String(n).padStart(2, '0'),
    uid = () => Math.random().toString(36).slice(2, 9);
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
  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const hm = iso => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const when = iso => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
      ? hm(iso)
      : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + hm(iso);
  };
  const AB = () => V.state().ab || {};
  const myName = () => AB().store || window.__MGDEF;
  const TYPES = { duyuru: 'Görev / duyuru', bilgi: 'Bilgi isteği', kontrol: 'Kontrol / iade' };
  const NEDEN = ['Personel yetersizdi', 'Ürün/malzeme gelmedi', 'Sistem arızası', 'Yarın yapılacak'];
  const RCST = [
    ['yok', 'Mağazada yok'],
    ['kaldir', 'Raftan kaldırıldı'],
    ['iade', 'Depoya iade kesildi']
  ];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function isoAt(h, m, dayOff) {
    const d = new Date();
    d.setDate(d.getDate() + (dayOff || 0));
    d.setHours(h, m, rnd(0, 59), 0);
    return d.toISOString();
  }

  let D;
  function seed() {
    const st = [
      ['me', myName()],
      ['s2', 'ACISU K767'],
      ['s3', 'AKÇAY O583'],
      ['s4', 'YENİ KUMLUCA - KUMLUCA K688'],
      ['s5', 'CUMHURİYET L927'],
      ['s6', 'MİLLİ EGEMENLİK R168'],
      ['s7', 'KALKAN-KAŞ. K671'],
      ['s8', 'YENİ ADNANMENDERES K735']
    ].map(([id, name]) => ({ id, name }));
    const others = st.filter(s => s.id !== 'me');
    const r1 = {
      id: uid(),
      type: 'bilgi',
      title: 'Soğuk dolap arıza durumu',
      body: 'Arkadaşlar mağazanızda arızalı ya da tam soğutmayan dolap var mı? Adet ve kısa not yazın.',
      cols: ['Dolap', 'Adet', 'Not'],
      items: [],
      to: st.map(s => s.id),
      at: isoAt(10, 5, -1)
    };
    const r2 = {
      id: uid(),
      type: 'kontrol',
      title: 'Geri çağırma: kakaolu ürünler',
      body: 'Aşağıdaki ürünleri kontrol edin, varsa raftan kaldırıp depoya iade kesin.',
      cols: [],
      items: [
        { code: '5012', name: 'Çikolatalı gofret' },
        { code: '6630', name: "Kakaolu kek 6'lı" },
        { code: '7104', name: 'Fındık kreması 400 g' }
      ],
      to: st.map(s => s.id),
      at: isoAt(8, 20, 0)
    };
    const r3 = {
      id: uid(),
      type: 'duyuru',
      title: 'Kasa önü düzeni',
      body: 'Bugün kapanışa kadar kasa önü reyonları planograma göre düzenlensin. Yapılmadıysa nedenini yazın.',
      cols: [],
      items: [],
      to: st.map(s => s.id),
      at: isoAt(11, 0, -1)
    };
    const D0 = {
      v: 2,
      stores: st,
      role: 'magaza',
      requests: [r1, r2, r3],
      responses: {},
      messages: {},
      mskt: {},
      rapor: {}
    };
    // dün sorulan bilgiye 6 mağaza yanıt vermiş
    D0.responses[r1.id] = {};
    others.slice(0, 6).forEach((s, k) => {
      D0.responses[r1.id][s.id] = {
        at: isoAt(10, 20 + k * 7, -1),
        rows:
          k % 3 === 0
            ? [['Süt dolabı', '1', 'Kapak contası bozuk']]
            : k % 3 === 1
              ? [['Yok', '0', '']]
              : [
                  ['Dondurucu', '1', 'Sıcaklık -12°C'],
                  ['İçecek dolabı', '1', 'Fan sesli']
                ]
      };
    });
    // bugün kontrol talebine 4 mağaza yanıt vermiş
    D0.responses[r2.id] = {};
    others.slice(0, 4).forEach((s, k) => {
      D0.responses[r2.id][s.id] = {
        at: isoAt(8, 40 + k * 6, 0),
        items: r2.items.map((_, i) => {
          const v = RCST[(k + i) % 3][0];
          return { st: v, qty: v === 'yok' ? null : rnd(2, 12) };
        })
      };
    });
    D0.responses[r3.id] = {};
    others.forEach((s, k) => {
      if (k < 6)
        D0.responses[r3.id][s.id] =
          k === 2
            ? { at: isoAt(20, 40, -1), done: false, reason: 'Personel yetersizdi, yarın sabah yapılacak' }
            : { at: isoAt(18 + (k % 3), 10 + k * 5, -1), done: true };
    });
    // sabah SKT dönüşleri (bizimki BS sekmesinden gelir)
    others.forEach((s, k) => {
      if (k !== 2) D0.mskt[s.id] = isoAt(8, 25 + k * 6, 0);
    });
    D0.messages = {
      me: [{ from: 'bs', text: 'Günaydın, bugün AKÇAY mağazasına SKT kontrolü sizden gidiyor.', at: isoAt(8, 2, 0) }],
      s3: [
        { from: 'bs', text: 'Sabah SKT dönüşünüz gelmedi, durum nedir?', at: isoAt(9, 20, 0) },
        { from: 'magaza', text: 'Hemen bakıyoruz, 10 dk içinde gönderiyoruz.', at: isoAt(9, 24, 0) }
      ]
    };
    return D0;
  }
  // geçmiş talepler (arama denemesi için): mağazamız dahil hepsi yanıtlamış
  function addHist(X) {
    if (X.hist) return;
    X.hist = 1;
    const ids = X.stores.map(s => s.id);
    const H = [
      {
        type: 'duyuru',
        title: 'Bayram öncesi stok düzeni',
        body: 'Bayram öncesi şeker, lokum ve kolonya reyonları ön cepheye alınsın, boş raf kalmasın.',
        d: -3,
        h: 9
      },
      {
        type: 'kontrol',
        title: 'Geri çağırma: ayçiçek yağı 5 L',
        body: 'Belirtilen parti numaralı ürünleri kontrol edin, varsa raftan kaldırın.',
        items: [
          { code: '3021', name: 'Ayçiçek yağı 5 L' },
          { code: '3022', name: 'Ayçiçek yağı 2 L' }
        ],
        d: -6,
        h: 8
      },
      {
        type: 'bilgi',
        title: 'Kırık kasa ve palet sayısı',
        body: 'Depodaki kırık kasa ve palet adedini yazın, toplama aracı gelecek.',
        cols: ['Malzeme', 'Adet', 'Not'],
        d: -9,
        h: 10
      },
      {
        type: 'duyuru',
        title: 'Yangın tüpü kontrol tarihi',
        body: 'Yangın tüplerinin son kontrol tarihine bakın, süresi geçen varsa bildirin.',
        d: -14,
        h: 11
      }
    ];
    H.forEach((x, k) => {
      const r = {
        id: uid(),
        type: x.type,
        title: x.title,
        body: x.body,
        cols: x.cols || [],
        items: x.items || [],
        to: ids.slice(),
        at: isoAt(x.h, 10, x.d)
      };
      X.requests.push(r);
      X.responses[r.id] = {};
      ids.forEach((id, j) => {
        const at = isoAt(x.h + 2, 5 + j * 4, x.d);
        X.responses[r.id][id] =
          x.type === 'kontrol'
            ? { at, items: r.items.map(() => ({ st: 'yok', qty: null })) }
            : x.type === 'bilgi'
              ? {
                  at,
                  rows: [
                    ['Kırık kasa', String(2 + (j % 4)), ''],
                    ['Palet', String(1 + (j % 3)), '']
                  ]
                }
              : { at, done: true };
      });
    });
  }
  function load() {
    try {
      D = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      D = null;
    }
    if (!D || D.v !== 2) D = seed();
    addHist(D);
    save();
    D.stores[0].name = myName();
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(D));
      return true;
    } catch (e) {
      if (window.__vardiya) window.__vardiya.toast('Cihaz hafızası doldu: bazı ekleri silmen gerekebilir.');
      return false;
    }
  }
  load();
  const S = id => D.stores.find(s => s.id === id) || { name: '?' };
  let ui = { page: 'home', id: null, form: null };
  const GRP_IC =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.2c2.3.2 3.9 1.8 4.5 4.3"/></svg>';
  /* --- savunma: BS bir olay için MS, MSY ya da personelden yazılı savunma ister; sadece o kişi görür --- */
  const OLAY = [
    'Kasa açığı',
    'SKT geçmiş ürün',
    'Geç gelme / devamsızlık',
    'Müşteri şikâyeti',
    'Fire / kayıp',
    'Talimata uyulmaması',
    'Diğer'
  ];
  const SONUC = ['Savunma yeterli bulundu', 'Sözlü uyarı yapıldı', 'Yazılı uyarı verildi', "İK'ya iletildi"];
  const UNVAN = {
    MS: 'Mağaza Sorumlusu',
    MSY: 'Mağaza Sorumlu Yardımcısı',
    GT: 'Günlük Temsilci',
    PER: 'Personel',
    PART: 'Part eleman'
  };
  const KISA = { MS: 'MS', MSY: 'MSY', GT: 'GT', PER: 'Personel', PART: 'Part' };
  if (window.__unvan) window.__unvan(UNVAN, KISA);
  const ADLAR = [
    'Ahmet Yılmaz',
    'Ayşe Demir',
    'Mehmet Kaya',
    'Fatma Çelik',
    'Mustafa Şahin',
    'Zeynep Arslan',
    'Hüseyin Koç',
    'Elif Kurt',
    'Emre Aydın',
    'Merve Özdemir',
    'Burak Yıldız',
    'Esra Doğan',
    'Hakan Polat',
    'Seda Aksoy',
    'Murat Erdem',
    'Büşra Kılıç'
  ];
  const dstr = off => {
    const d = new Date();
    d.setDate(d.getDate() + off);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const fmtD = s => {
    if (!s) return '';
    const p = s.split('-').map(Number);
    return p[2] + ' ' + MON[p[1] - 1].slice(0, 3);
  };
  const fmtL = s => {
    if (!s) return '';
    const p = s.split('-').map(Number);
    return p[2] + ' ' + MON[p[1] - 1] + ' ' + p[0];
  };
  const nrm = x =>
    String(x || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/\s+/g, ' ')
      .trim();
  const giris = () => (window.__giris && window.__giris()) || null;
  function staffOf(id) {
    if (id === 'me')
      return (V.state().employees || [])
        .filter(e => e && e.name && e.name.trim())
        .map(e => ({ id: e.id, ad: e.name.trim(), unvan: e.role || 'PER' }));
    const k = Math.max(
      0,
      D.stores.findIndex(s => s.id === id)
    );
    return [
      ['MS', 0],
      ['MSY', 1],
      ['PER', 2],
      ['PER', 3]
    ].map(([u, j]) => ({ id: id + '-' + j, ad: ADLAR[(k * 3 + j * 5) % ADLAR.length], unvan: u }));
  }
  function svDurum(s) {
    if (s.sonuc) return ['kapali', 'Kapatıldı'];
    if (s.cevap) return ['yanit', 'Savunma geldi'];
    return today() > s.son ? ['gec', 'Süresi geçti'] : ['bek', 'Bekleniyor'];
  }
  function isMine(s) {
    const g = giris();
    if (!g || g.tip !== 'magaza' || s.store !== 'me') return false;
    return (g.empId && s.kisiId === g.empId) || nrm(s.ad) === nrm(g.ad);
  }
  function svText(s) {
    return `${fmtL(s.tarih)} tarihindeki olayla ilgili savunmamdır.\n\nO gün mağaza çok yoğundu ve vardiyada eksik personel vardı. Olayda herhangi bir kastım yoktur, gerekli kontrolleri yapmaya çalıştım. Bundan sonra aynı durumun yaşanmaması için daha dikkatli olacağım.\n\n${s.ad}`;
  }
  function seedSv() {
    const a = staffOf('s3')[1],
      b = staffOf('s5')[2],
      y = new Date();
    y.setDate(y.getDate() - 1);
    const s1 = {
      id: uid(),
      store: 's3',
      kisiId: a.id,
      ad: a.ad,
      unvan: a.unvan,
      olay: 'Kasa açığı',
      tarih: dstr(-2),
      aciklama: 'Kapanışta 2 numaralı kasada 340 ₺ açık çıktı. Kasa devri sırasında sayım yapılmamış.',
      son: dstr(1),
      at: isoAt(10, 0, -1),
      bs: 'Bölge sorumlusu',
      cevap: null,
      sonuc: null
    };
    s1.cevap = {
      text:
        'Kapanışta kasa çok yoğundu, devir sırasında sayımı sonraya bıraktım. Açığın bozuk para üstünden kaynaklandığını düşünüyorum. Bundan sonra her devirde sayım yapacağım.\n\n' +
        a.ad,
      at: isoAt(15, 30, -1)
    };
    const s2 = {
      id: uid(),
      store: 's5',
      kisiId: b.id,
      ad: b.ad,
      unvan: b.unvan,
      olay: 'Geç gelme / devamsızlık',
      tarih: dstr(-4),
      aciklama: 'Sabah vardiyasına haber vermeden 1 saat geç gelindi, mağaza geç açıldı.',
      son: dstr(-1),
      at: isoAt(11, 15, -3),
      bs: 'Bölge sorumlusu',
      cevap: null,
      sonuc: null
    };
    return [s1, s2];
  }
  if (!Array.isArray(D.savunma)) {
    D.savunma = seedSv();
    save();
  }
  /* --- mağaza grubu: sadece o mağazanın çalışanları (MS, MSY, personel) yazışır; BS bu grubu görmez --- */
  const isStaff = () => document.body.dataset.role === 'staff' && !((D.yetki || {}).me || {}).c;
  function seedGrup() {
    const P = staffOf('me'),
      n = k =>
        P[k % Math.max(P.length, 1)] || {
          ad: ['Erol', 'Kardelen', 'Samet', 'İklim'][k],
          unvan: ['MS', 'MSY', 'GT', 'PER'][k]
        };
    return [
      {
        from: n(0).ad,
        unvan: n(0).unvan,
        text: "Arkadaşlar yarın sevkiyat 07.30'da geliyor, sabahçılar erken gelsin lütfen.",
        at: isoAt(9, 40, 0)
      },
      { from: n(3).ad, unvan: n(3).unvan, text: "Tamam abi, 07.15'te buradayım 👍", at: isoAt(9, 46, 0) },
      {
        from: n(1).ad,
        unvan: n(1).unvan,
        text: 'Kasa önü düzenini öğleden sonra bitirelim, BS sordu.',
        at: isoAt(13, 5, 0)
      }
    ];
  }
  if (!Array.isArray(D.grup)) {
    D.grup = seedGrup();
    save();
  }
  /* BS grubu: bölge sorumlularının kendi aralarındaki sohbet (mağazalar görmez). Diğer BS'ler örnek kişilerdir. */
  const BSLER = [
    { ad: 'Murat Kaya', bolge: 'Kumluca bölgesi', mg: 5 },
    { ad: 'Selin Aydın', bolge: 'Kaş bölgesi', mg: 6 },
    { ad: 'Okan Demir', bolge: 'Konyaaltı bölgesi', mg: 4 },
    { ad: 'Ayşe Kılıç', bolge: 'Kepez bölgesi', mg: 6 },
    { ad: 'Tolga Şen', bolge: 'Kemer bölgesi', mg: 5 },
    { ad: 'Deniz Aksoy', bolge: 'İncesu bölgesi', mg: 4 },
    { ad: 'Berk Yalçın', bolge: 'Yahyalı bölgesi', mg: 6 },
    { ad: 'Gül Ateş', bolge: 'Bünyan bölgesi', mg: 5 }
  ];
  /* Kurum yapısı. Şirket rakamları BİM 2026 1. çeyrek faaliyet raporundan (31.03.2026). Bölge müdürlüğü içi sayılar örnektir:
   Uygulamanın kapsamı sadece BİM Türkiye: 12.814 aktif mağaza, 73 bölge müdürlüğü;
   12.814 / 73 ≈ 176 mağaza. Bir PM ~9 BS, bir BS 8–12 mağaza. */
  /* Üst yönetim: emir'in gönderdiği liste (BİM). Uygulamaya giriş kaydı değildir, sadece kurum yapısında gösterilir. */
  const UST = [
    ['İcra Başkanı (CEO)', 'Mahmud Muhammed Topbaş'],
    ['Mali İşler Başkanı (CFO)', 'Fatih Meriç'],
    ['Operasyon Başkanı (COO)', 'Tolga Şahin'],
    ['İnsan Kaynakları Başkanı (CHRO)', 'Hasan Kaya'],
    ['Ticaret Başkanı (CCO)', 'Umut Baba'],
    ['Teknoloji Başkanı (CTO)', 'Ali Can'],
    ['Denetim, Risk ve Uyum Başkanı', 'Hayrettin Bülent Metiner']
  ];
  const KADEME = [
    [
      'Genel müdürlük ve üst yönetim',
      [
        ['ust', 'Üst yönetim (başkanlar)', 'CEO, CFO, COO, CHRO, CCO, CTO, denetim'],
        ['dir', 'Direktörler', 'Ana operasyon kollarını yönetir'],
        ['gm', 'Kategori / departman müdürleri', 'Genel müdürlük departmanlarını yönetir'],
        ['uz', 'Uzmanlar, kıdemli uzmanlar', 'Satın alma, İK, BT, finans, kalite güvence']
      ]
    ],
    [
      'Bölge yönetimi',
      [
        ['bm', 'Bölge müdürü', "Şehirdeki mağazalar, depo ve BS'ler bağlıdır"],
        ['pm', 'PM', 'Bölge sorumlularını yönetir'],
        ['bs', 'Bölge sorumlusu (mağaza denetmeni)', 'Genelde 4–6 mağaza, mağaza müdürlerinin üstü'],
        ['depo', 'Depo ve lojistik', 'Depo şefi, mal kabul, depo görevlisi, sevkiyat elemanı']
      ]
    ],
    [
      'Mağaza',
      [
        ['ms', 'Mağaza sorumlusu / müdürü (MS)', 'Ciro, personel, envanter ve idari işler'],
        ['msy', 'MS yardımcısı / müdür yardımcısı (MSY)', 'MS yokken sorumlu, sipariş ve stok'],
        ['per', 'Satış elemanı (GT, personel, part-time)', 'Reyon, ürün kabul, kasa, temizlik']
      ]
    ]
  ];
  function kurumIc(P, nm) {
    const f = n => n.toLocaleString('tr-TR'),
      g = giris(),
      u = g && g.unvan,
      my = !g
        ? ''
        : g.tip === 'pm'
          ? u === 'GM'
            ? 'gm'
            : u === 'BM'
              ? 'bm'
              : 'pm'
          : g.tip === 'bs'
            ? 'bs'
            : g.tip === 'depo'
              ? 'depo'
              : u === 'MS'
                ? 'ms'
                : u === 'MSY'
                  ? 'msy'
                  : 'per';
    return `<h3 class="yp-h">Üst yönetim</h3><ul class="yp">${UST.map(([u, a]) => `<li><span>${esc(u)}</span><b>${esc(a)}</b></li>`).join('')}</ul>
  <h3 class="yp-h">Kademeler</h3>${KADEME.map(([gl, L]) => `<p class="yp-g">${gl}</p><ol class="yp-kd">${L.map(([k, t, d]) => `<li${k === my ? ' class="on"' : ''}><b>${t}</b><small>${d}${k === my ? ' · sen buradasın' : ''}</small></li>`).join('')}</ol>`).join('')}
  <h3 class="yp-h">Sayılar</h3><ul class="yp"><li><span>BİM Türkiye</span><b>${f(YAPI.tr)} aktif mağaza · ${YAPI.trBm} bölge müdürlüğü</b></li>
  <li><span>${esc(YAPI.bmAd)} (${YAPI.bmKod})</span><b>${MG() && MG().say(YAPI.bmKod) ? MG().say(YAPI.bmKod) + ' mağaza listede' : '~' + YAPI.bmMg + ' mağaza'} · ${YAPI.bmPm} PM · ${YAPI.bmBs} BS</b></li>${MG() ? `<li><span>Mağaza listesi</span><b>${f(MG().say())} mağaza · ${MG().bolgeSay()} bölge · ${MG().ilSay()} il</b></li>` : ''}
  ${P ? `<li class="yp-me"><span>Senin bölgen</span><b>${P.length} BS · ${nm} mağaza</b></li>` : ''}</ul>
  <p class="hint" style="margin:8px 0 0">Sadece BİM Türkiye. Sayılar BİM 2026 1. çeyrek faaliyet raporundan (31 Mart 2026); bölge müdürlüğü içi sayılar sunum için örnektir.</p>`;
  }
  function kurumPage() {
    return head('Kurum yapısı', true) + `<div class="box yp-box">${kurumIc(null, 0)}</div>`;
  }
  const YAPI = { tr: 12814, trBm: 73, bmAd: 'Antalya Bölge Müdürlüğü', bmKod: '9562', bmMg: 125, bmPm: 2, bmBs: 18 };
  if (!Array.isArray(D.bsgrup)) {
    D.bsgrup = [
      {
        from: 'Murat Kaya',
        bolge: 'Kumluca bölgesi',
        text: 'Günaydın arkadaşlar. Kakaolu ürün geri çağırmasında depoya iade kesildi mi sizde?',
        at: isoAt(8, 35, 0)
      },
      {
        from: 'Selin Aydın',
        bolge: 'Kaş bölgesi',
        text: 'Bizde 6 mağaza tamamladı, 2 mağaza öğleden sonra kesecek.',
        at: isoAt(8, 52, 0)
      },
      {
        from: 'Okan Demir',
        bolge: 'Konyaaltı bölgesi',
        text: "Yarın sabah bölge toplantısı 10.00'da, unutmayalım.",
        at: isoAt(9, 40, 0)
      }
    ];
    save();
  }
  /* PM: BS'lerin yöneticisi. BS'lerle birebir sohbet eder, BS grubuna da yazar. */
  const PM_DEF = 'Kemal Arslan';
  if (!D.pmMsg) {
    D.pmMsg = {
      [nrm('Murat Kaya')]: [
        {
          from: 'bs',
          text: "Hocam Kumluca'da iki mağazada personel eksiği var, bu hafta destek alabilir miyiz?",
          at: isoAt(9, 10, 0)
        }
      ],
      [nrm('Selin Aydın')]: [
        {
          from: 'pm',
          text: 'Selin Hanım, Kaş bölgesinin ay sonu raporunu cuma günü bekliyorum.',
          at: isoAt(10, 30, -1)
        },
        { from: 'bs', text: 'Tamam hocam, cuma öğlene kadar gönderirim.', at: isoAt(10, 48, -1) }
      ]
    };
    save();
  }
  const pmAd = () => (!D.pmAd || ['Nihat Öz', 'Selim Aktaş'].includes(D.pmAd) ? PM_DEF : D.pmAd);
  const pmName = () => {
    const g = giris();
    return g && g.tip === 'pm' && !['GM', 'BM'].includes(g.unvan) ? g.ad : pmAd();
  };
  function bsPeople() {
    return [{ ad: D.bsAd || 'Ali Yıldırım', bolge: D.bsBolge || 'Finike bölgesi', mg: D.stores.length }, ...BSLER];
  }
  function pmUnreadOf(k) {
    const g = giris();
    if (!g) return [];
    const L = D.pmMsg[k] || [],
      pmSide = g.tip === 'pm',
      seen = (D.seen || {})[(pmSide ? 'pm:' : 'pmbs:') + k] || '';
    return L.filter(m => m.from === (pmSide ? 'bs' : 'pm') && m.at > seen);
  }
  function markPm(k) {
    const g = giris();
    D.seen = D.seen || {};
    D.seen[(g && g.tip === 'pm' ? 'pm:' : 'pmbs:') + k] = new Date().toISOString();
    save();
  }
  /* Mesai dışı sohbet kilidi: vardiyadaki açılış ve son vardiya bitiş saatinin dışında sohbetlere yazılamaz, kimse rahatsız edilmez. Mesajlar okunabilir. */
  function mesai() {
    const st = V.state(),
      o = st.open || '08:45',
      c = st.close || '21:15',
      t2 = x => {
        const [h, m] = String(x).split(':').map(Number);
        return h * 60 + (m || 0);
      },
      d = new Date(),
      n = d.getHours() * 60 + d.getMinutes();
    return { acik: n >= t2(o) && n < t2(c), o, c, sabah: n < t2(o) };
  }
  function kilitli() {
    return !mesai().acik;
  }
  function kilitBar() {
    const m = mesai();
    return `<div class="ic-kilit" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><div><b>Mağaza kapalı, sohbet kilitli</b><small>Açılış: ${m.sabah ? 'bugün' : 'yarın'} ${esc(m.o)}. Mesai dışında kimse rahatsız edilmez.</small></div></div>`;
  }
  function pmChat(k) {
    const g = giris(),
      pmSide = g && g.tip === 'pm',
      L = D.pmMsg[k] || [];
    return `<div class="ic-chat" id="icChat">${
      L.map(m => {
        const mine = (m.from === 'pm') === pmSide;
        return `<div class="ic-msg ${mine ? 'me' : 'them'}"><div>${esc(m.text)}</div><small>${when(m.at)}</small></div>`;
      }).join('') || '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok. İlk mesajı sen yaz.</p>'
    }</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="Mesaj yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="pm:${k}" aria-label="Gönder">➤</button></div>`}`;
  }
  function pmSim(k, from) {
    if (kilitli()) return;
    if (Math.random() < 0.25) return;
    setTimeout(
      () => {
        (D.pmMsg[k] = D.pmMsg[k] || []).push({
          from,
          text:
            from === 'pm'
              ? ['Tamam, takip ediyorum.', 'Teşekkürler, bilgim oldu.', 'Uygundur.', 'Yarın konuşalım.'][rnd(0, 3)]
              : ['Tamam hocam.', 'Hemen ilgileniyorum.', 'Bilgi için teşekkürler.', 'Akşama dönüş yaparım.'][rnd(0, 3)],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden && ui.page === 'pmchat') render();
        else updBell();
      },
      2500 + rnd(0, 2500)
    );
  }
  /* Kademe zinciri: GM ↔ BM ↔ PM ↔ BS ↔ mağaza. Herkes yalnız bir üstü ve bir altıyla yazışır; BM, BS'ye PM üzerinden ulaşır. */
  const kad = () => {
    const g = giris();
    if (!g || g.tip !== 'pm') return '';
    return g.unvan === 'GM' ? 'gm' : g.unvan === 'BM' ? 'bm' : 'pm';
  };
  const GM_AD = 'Selim Aktaş',
    BM_AD = 'Nihat Öz';
  const PMLER = () => [
    { ad: pmAd(), bolge: 'Antalya Bölge Müdürlüğü', bs: bsPeople().length },
    { ad: 'Hülya Şen', bolge: 'Antalya Bölge Müdürlüğü', bs: YAPI.bmBs - bsPeople().length }
  ];
  const BMLER = () => [
    { ad: BM_AD, bolge: 'Antalya Bölge Müdürlüğü' },
    { ad: 'Cem Yalçın', bolge: 'İzmir Bölge Müdürlüğü' },
    { ad: 'Aylin Tekin', bolge: 'Ankara Bölge Müdürlüğü' }
  ];
  if (!D.ust) {
    D.ust = {
      ['bm:' + nrm(PM_DEF)]: [
        {
          from: 'ust',
          text: 'Kemal Bey, bölgenin ekim fire özetini perşembe toplantısına hazırlar mısınız?',
          at: isoAt(9, 0, -1)
        },
        { from: 'alt', text: "Hazırlıyorum Nihat Bey, BS'lerden dönüşleri topluyorum.", at: isoAt(9, 25, -1) }
      ],
      ['gm:' + nrm(BM_AD)]: [
        {
          from: 'ust',
          text: "Bölge müdürleri toplantısı pazartesi 14.00'te, bölge özetlerinizi getirin.",
          at: isoAt(16, 0, -1)
        }
      ]
    };
    save();
  }
  /* üstümle sohbet anahtarı: PM için 'bm:<ben>', BM için 'gm:<ben>' */
  const ustKey = () => {
    const k = kad(),
      g = giris();
    return k === 'pm' ? 'bm:' + nrm(g.ad) : k === 'bm' ? 'gm:' + nrm(g.ad) : '';
  };
  const ustSide = key => {
    const k = kad();
    return (k === 'bm' && key.startsWith('bm:')) || (k === 'gm' && key.startsWith('gm:')) ? 'ust' : 'alt';
  };
  function ustUnread(key) {
    const side = ustSide(key),
      seen = (D.seen || {})['ust:' + side + ':' + key] || '';
    return (D.ust[key] || []).filter(m => m.from !== side && m.at > seen);
  }
  function markUst(key) {
    D.seen = D.seen || {};
    D.seen['ust:' + ustSide(key) + ':' + key] = new Date().toISOString();
    save();
  }
  function altlar() {
    const k = kad();
    return k === 'bm'
      ? PMLER().map(p => ({ ...p, key: 'bm:' + nrm(p.ad), rol: 'PM' }))
      : k === 'gm'
        ? BMLER().map(p => ({ ...p, key: 'gm:' + nrm(p.ad), rol: 'BM' }))
        : [];
  }
  function ustKisi() {
    const k = kad();
    return k === 'pm'
      ? { ad: BM_AD, rol: 'BM', t: 'Bölge müdürü' }
      : k === 'bm'
        ? { ad: GM_AD, rol: 'GM', t: 'Genel müdürlük' }
        : null;
  }
  function ustTumU() {
    const k = ustKey();
    return (k ? ustUnread(k).length : 0) + altlar().reduce((a, p) => a + ustUnread(p.key).length, 0);
  }
  function ustRow() {
    const u = ustKisi(),
      key = ustKey();
    if (!u) return '';
    const L = (D.ust[key] || []).slice(-1)[0],
      n = ustUnread(key).length;
    return `<div class="box ic-bsrow" data-ust="${esc(key)}"><div class="ic-av pm">${u.rol}</div><div class="ic-sm"><b>${u.rol} · ${esc(u.ad)}</b><small>${L ? esc((L.from === 'alt' ? 'Sen: ' : '') + L.text) : 'Yöneticinle birebir sohbet'}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function ustChat(key) {
    const side = ustSide(key),
      L = D.ust[key] || [];
    return `<div class="ic-chat" id="icChat">${L.map(m => `<div class="ic-msg ${m.from === side ? 'me' : 'them'}"><div>${esc(m.text)}</div><small>${when(m.at)}</small></div>`).join('') || '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok. İlk mesajı sen yaz.</p>'}</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="Mesaj yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="ust:${esc(key)}" aria-label="Gönder">➤</button></div>`}`;
  }
  function ustKimi(key) {
    const u = ustKisi();
    if (key === ustKey() && u) return { ad: u.ad, t: u.t };
    const p = altlar().find(x => x.key === key);
    return p ? { ad: p.ad, t: (p.rol === 'PM' ? 'PM' : 'Bölge müdürü') + ' · ' + p.bolge } : { ad: '', t: '' };
  }
  function ustSim(key, from) {
    if (kilitli()) return;
    if (Math.random() < 0.25) return;
    setTimeout(
      () => {
        (D.ust[key] = D.ust[key] || []).push({
          from,
          text: ['Tamam, takip ediyorum.', 'Bilgim oldu, teşekkürler.', 'Uygundur.', 'Toplantıda konuşalım.'][
            rnd(0, 3)
          ],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden && ui.page === 'ust') render();
        else updBell();
      },
      2500 + rnd(0, 2500)
    );
  }
  function ustPage() {
    const k = kad(),
      A = altlar(),
      u = ustKisi();
    let h = '';
    h += `<div class="ic-kpi"><div><b>${k === 'gm' ? YAPI.trBm : YAPI.bmPm}</b><span>${k === 'gm' ? 'Bölge müdürlüğü' : 'PM'}</span></div><div><b>${(k === 'gm' ? YAPI.tr : YAPI.bmMg).toLocaleString('tr-TR')}</b><span>Mağaza</span></div><div><b>${ustTumU()}</b><span>Yeni mesaj</span></div></div>`;
    h += `<details class="box sect yp-box"><summary><h2>Kurum yapısı</h2></summary>${kurumIc(
      bsPeople(),
      bsPeople().reduce((a, p) => a + (p.mg || 0), 0)
    )}</details>`;
    if (u) h += ustRow();
    h += `<div class="box"><h2>${k === 'gm' ? 'Bölge müdürlerim' : "PM'lerim"}</h2><p class="hint" style="margin:2px 0 0">${k === 'gm' ? 'Bölgelere bölge müdürleri üzerinden ulaşırsın.' : "Bölge sorumlularına ve mağazalara PM'ler üzerinden ulaşırsın."}</p><ul class="ic-stores">${A.map(
      p => {
        const L = (D.ust[p.key] || []).slice(-1)[0],
          n = ustUnread(p.key).length;
        return `<li data-ust="${esc(p.key)}"><div class="ic-av">${esc(p.ad[0])}</div><div class="ic-sm"><b>${esc(p.ad)}</b><small>${esc(p.rol === 'PM' ? `PM · ${p.bs} bölge sorumlusu` : p.bolge)}${L ? '<br>' + esc((L.from === 'ust' ? 'Sen: ' : '') + L.text) : ''}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</li>`;
      }
    ).join('')}</ul></div>`;
    return h;
  }
  window.__kad = kad;
  /* İzin talepleri: çalışan ister, MS ya da MSY onaylar (kendi talebini kendisi onaylayamaz) */
  const IZT = { B: 'Haftalık izin (B)', Y: 'Yıllık izin', M: 'Mazeret izni', R: 'Rapor', T: 'Vardiya takası' };
  if (!Array.isArray(D.izin)) {
    const P = staffOf('me').filter(p => p.unvan !== 'MS' && p.unvan !== 'MSY'),
      p = P[0] || { id: null, ad: 'İklim', unvan: 'PER' };
    D.izin = [
      {
        id: uid(),
        kisiId: p.id,
        ad: p.ad,
        unvan: p.unvan,
        tur: 'B',
        bas: dstr(3),
        bit: dstr(3),
        not: 'Kardeşimin düğünü var, o gün izin alabilir miyim?',
        at: isoAt(18, 20, -1),
        durum: 'bek'
      }
    ];
    save();
  }
  const izMine = x => {
    const g = giris();
    return !!g && g.tip === 'magaza' && ((g.empId && x.kisiId === g.empId) || nrm(x.ad) === nrm(g.ad));
  };
  const canOnay = () => {
    const g = giris();
    return !!g && g.tip === 'magaza' && ['MS', 'MSY'].includes(g.unvan);
  };
  const izBekl = () => (canOnay() ? D.izin.filter(x => x.durum === 'bek' && !izMine(x)) : []);
  const izTarih = x => (x.bas === x.bit ? fmtD(x.bas) : fmtD(x.bas) + ' – ' + fmtD(x.bit));
  const izGun = x => Math.round((new Date(x.bit + 'T12:00:00') - new Date(x.bas + 'T12:00:00')) / 864e5) + 1;
  const IZD = { bek: ['wait', 'Onay bekliyor'], onay: ['ok', 'Onaylandı'], red: ['no', 'Reddedildi'] };
  function izRow(x, act) {
    const [c, l] = IZD[x.durum];
    return `<li class="iz-row"><div class="iz-top"><div><b>${esc(x.ad)} <small>${KISA[x.unvan] || ''}</small></b><small>${IZT[x.tur]} · ${izTarih(x)}${x.kimle ? ' · ' + esc(x.kimle) + ' ile' : ''}${izGun(x) > 1 ? ' (' + izGun(x) + ' gün)' : ''}</small></div><span class="iz-st ${x.durum}">${l}</span></div>${x.not ? `<p class="iz-not">${esc(x.not)}</p>` : ''}${x.karar ? `<p class="hint" style="margin:4px 0 0">${esc(x.karar.by)} · ${when(x.karar.at)}${x.karar.not ? ' · ' + esc(x.karar.not) : ''}</p>` : ''}${act ? `<div class="iz-act"><button type="button" class="btn" data-izred="${x.id}">Reddet</button><button type="button" class="btn primary" data-izok="${x.id}">Onayla</button></div>` : ''}${x.durum === 'bek' && izMine(x) ? `<button type="button" class="linkbtn" data-izdel="${x.id}" style="margin-top:6px">Talebi geri çek</button>` : ''}</li>`;
  }
  /* Yükselme: MS ya da BS aday gösterir, İK sınav tarihini verir ve puanı girer. Geçme notunu alan kişinin görevi kendiliğinden yükselir. */
  const RUT = ['PART', 'PER', 'GT', 'MSY', 'MS', 'BS'],
    RUTAD = { ...UNVAN, BS: 'Bölge Sorumlusu' },
    RUTK = { ...KISA, BS: 'BS' };
  const rNext = u => RUT[Math.min(RUT.length - 1, Math.max(0, RUT.indexOf(u)) + 1)];
  function yukInit() {
    if (Array.isArray(D.yuk)) return;
    D.yuk = [];
    D.yukGec = D.yukGec || 70;
    const p = staffOf('me').find(x => x.unvan === 'PER');
    if (p)
      D.yuk.push({
        id: uid(),
        store: 'me',
        ad: p.ad,
        kisiId: p.id,
        from: 'PER',
        to: 'GT',
        by: { ad: 'Erol', rol: 'MS' },
        at: isoAt(10, 5, -6),
        not: 'Kasada ve sevkiyatta çok iyi.',
        sinav: { tarih: dstr(3), saat: '10:00', yer: 'Döşemealtı-2 deposu eğitim salonu' },
        puan: null,
        durum: 'sinav'
      });
    const q = staffOf('s4').find(x => x.unvan === 'MSY');
    if (q)
      D.yuk.push({
        id: uid(),
        store: 's4',
        ad: q.ad,
        kisiId: q.id,
        from: 'MSY',
        to: 'MS',
        by: { ad: D.bsAd || 'Ali Yıldırım', rol: 'BS' },
        at: isoAt(9, 30, -20),
        not: '',
        sinav: { tarih: dstr(-5), saat: '10:00', yer: 'Döşemealtı-2 deposu eğitim salonu' },
        puan: 84,
        sonucAt: isoAt(15, 0, -4),
        durum: 'gecti'
      });
    save();
  }
  const YU = () => {
    yukInit();
    return D.yuk;
  };
  const yGec = () => Number(D.yukGec) || 70;
  const isIkY = () => !!window.__ikMi && window.__ikMi(giris());
  const canAday = () => {
    const g = giris();
    return !!g && (g.tip === 'bs' || (g.tip === 'magaza' && g.unvan === 'MS'));
  };
  const yMine = y => {
    const g = giris();
    return (
      !!g && g.tip === 'magaza' && y.store === 'me' && ((g.empId && y.kisiId === g.empId) || nrm(y.ad) === nrm(g.ad))
    );
  };
  function yGor() {
    const g = giris();
    if (!g) return [];
    const L = YU();
    if (g.tip === 'depo') return isIkY() ? L : [];
    if (g.tip === 'pm') return L;
    if (g.tip === 'bs') return L;
    if (canOnay()) return L.filter(y => y.store === 'me');
    return L.filter(yMine);
  }
  const YD = {
    aday: ['bek', 'Sınav tarihi bekleniyor'],
    sinav: ['bek', 'Sınava girecek'],
    gecti: ['onay', 'Geçti, yükseldi'],
    kaldi: ['red', 'Geçemedi']
  };
  function ySinavTxt(y) {
    return y.sinav ? `${fmtD(y.sinav.tarih)} ${y.sinav.saat || ''}${y.sinav.yer ? ' · ' + y.sinav.yer : ''}` : '';
  }
  function yRow(y) {
    const [c, l] = YD[y.durum],
      ik = isIkY();
    let h = `<li class="iz-row"><div class="iz-top"><div><b>${esc(y.ad)} <small>${RUTK[y.from] || ''} → ${RUTK[y.to] || ''}</small></b><small>${esc(S(y.store).name)} · aday gösteren ${esc(y.by.ad)} (${esc(y.by.rol)})</small></div><span class="iz-st ${c}">${l}</span></div>`;
    if (y.not) h += `<p class="iz-not">${esc(y.not)}</p>`;
    if (y.sinav) h += `<p class="hint" style="margin:4px 0 0">Sınav: ${esc(ySinavTxt(y))}</p>`;
    if (y.puan != null)
      h += `<p class="yk-puan ${y.durum}"><b>${y.puan}</b> puan · geçme notu ${y.gec || yGec()}${y.durum === 'gecti' ? ` · yeni görevi: ${esc(RUTAD[y.to] || y.to)}` : ''}</p>`;
    if (ik && y.durum === 'aday')
      h += `<div class="yk-f"><div class="srow2"><label>Sınav günü<input type="date" id="yt-${y.id}" value="${dstr(7)}"></label><label>Saat<input type="time" id="ys-${y.id}" value="10:00"></label></div><label>Yer<input id="yy-${y.id}" autocomplete="off" value="Döşemealtı-2 deposu eğitim salonu"></label><button type="button" class="btn primary" data-ytar="${y.id}">Sınav tarihini kaydet</button></div>`;
    if (ik && y.durum === 'sinav')
      h += `<div class="yk-f"><label>Sınav puanı (0-100)<input id="yp-${y.id}" type="number" min="0" max="100" inputmode="numeric" placeholder="Örn. 78"></label><button type="button" class="btn primary" data-ypuan="${y.id}">Puanı kaydet</button></div>`;
    if (y.durum === 'aday' && canAday() && !yMine(y))
      h += `<button type="button" class="linkbtn" data-ydel="${y.id}" style="margin-top:6px">Adaylığı geri çek</button>`;
    return h + '</li>';
  }
  function yukRowBox() {
    const L = yGor(),
      g = giris();
    if (!g) return '';
    const me = L.find(yMine);
    const ik = isIkY(),
      n = ik
        ? L.filter(y => y.durum === 'aday' || (y.durum === 'sinav' && y.sinav && y.sinav.tarih <= today())).length
        : L.filter(y => y.durum === 'aday' || y.durum === 'sinav').length;
    const sub = me
      ? me.durum === 'sinav'
        ? `Sınavın: ${ySinavTxt(me)}`
        : me.durum === 'aday'
          ? 'Aday gösterildin, sınav tarihi bekleniyor'
          : me.durum === 'gecti'
            ? `Tebrikler, ${RUTAD[me.to]} oldun`
            : 'Sınav sonucun geldi'
      : ik
        ? n
          ? `${n} aday işlem bekliyor`
          : 'Sınav tarihi ver, puan gir'
        : n
          ? `${n} kişi sınav sürecinde`
          : canAday()
            ? 'Aday göster, sonuçları takip et'
            : 'Yükselme sınavları';
    if (!me && !L.length && !canAday() && !ik) return '';
    return `<div class="box ic-bsrow" data-icgo="yuk"><div class="ic-av ise"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/><path d="M5 21h14"/></svg></div><div class="ic-sm"><b>Yükselme sınavı</b><small>${esc(sub)}</small></div>${ik && n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function yukPage() {
    let h = head('Yükselme sınavı', true);
    const L = yGor(),
      ik = isIkY(),
      me = L.find(yMine);
    h += `<div class="box"><p class="hint" style="margin:0">Seçilen kişiler yükselme sınavına girer. Geçme notu <b>${yGec()}</b>. Geçen kişinin görevi kendiliğinden bir üst göreve geçer; geçemeyen eski görevinde devam eder.</p></div>`;
    if (me && !ik) h += `<div class="box"><h2>Senin durumun</h2><ul class="iz-list">${yRow(me)}</ul></div>`;
    if (canAday()) {
      const g = giris(),
        bs = g.tip === 'bs',
        stores = bs ? D.stores : [D.stores[0]];
      const opts = stores
        .map(s => {
          const P = staffOf(s.id).filter(p => p.unvan !== 'MS' || bs);
          if (!P.length) return '';
          const o = P.map(
            p => `<option value="${esc(s.id + '|' + p.id)}">${esc(p.ad)} · ${RUTK[p.unvan] || p.unvan}</option>`
          ).join('');
          return bs ? `<optgroup label="${esc(s.name)}">${o}</optgroup>` : o;
        })
        .join('');
      h += `<details class="box sect" id="yuBox"${L.length ? '' : ' open'}><summary><h2>Aday göster</h2></summary><div class="sf" style="margin-top:8px"><label>Kişi<select id="yuK" class="ssel">${opts}</select></label>
      <label>Yükseleceği görev<select id="yuTo" class="ssel"><option value="">Bir üst görev</option>${['GT', 'MSY', 'MS', 'BS'].map(k => `<option value="${k}">${RUTAD[k]}</option>`).join('')}</select></label>
      <label>Neden aday gösteriyorsun? (isteğe bağlı)<input id="yuNot" autocomplete="off" placeholder="Örn. Kasada ve sevkiyatta çok iyi"></label>
      <button type="button" class="btn primary" id="yuAdd">Aday göster, İK'ya gönder</button><p class="hint" style="margin:0">İK sınav tarihini verir; kişiye ve sana bildirim gider.</p></div></details>`;
    }
    const A = L.filter(y => (y.durum === 'aday' || y.durum === 'sinav') && !(me && y === me && !ik)).sort((a, b) =>
        ((a.sinav || {}).tarih || '9').localeCompare((b.sinav || {}).tarih || '9')
      ),
      R = L.filter(y => (y.durum === 'gecti' || y.durum === 'kaldi') && !(me && y === me && !ik)).sort((a, b) =>
        (b.sonucAt || '').localeCompare(a.sonucAt || '')
      );
    if (ik || canAday() || canOnay()) {
      h += `<div class="box"><h2>Sınav süreci</h2>${A.length ? `<ul class="iz-list">${A.map(yRow).join('')}</ul>` : '<p class="hint" style="margin:6px 0 0">Sınav bekleyen aday yok.</p>'}</div>`;
      if (R.length)
        h += `<div class="box"><h2>Sonuçlar</h2><ul class="iz-list">${R.slice(0, 15).map(yRow).join('')}</ul></div>`;
    }
    if (ik)
      h += `<div class="box"><h2>Geçme notu</h2><div class="sf" style="margin-top:8px"><div class="srow2"><label>Puan<input id="yuGec" type="number" min="1" max="100" inputmode="numeric" value="${yGec()}"></label><button type="button" class="btn" id="yuGecK" style="align-self:end;min-height:48px">Kaydet</button></div></div></div>`;
    if (!ik && !canAday() && !canOnay() && !me)
      h += `<div class="box"><p class="hint" style="margin:0">Henüz yükselme sınavı için aday gösterilmedin. Mağaza müdürün ya da bölge sorumlun aday gösterince burada görürsün.</p></div>`;
    return h;
  }
  // Sınavı geçen kişinin görevi: bu mağazanın çalışan listesinde ve kayıt listesinde güncellenir
  function yTerfi(y) {
    if (y.store !== 'me' || !['GT', 'MSY', 'MS'].includes(y.to)) return;
    const st = V.state();
    const e = (st.employees || []).find(x => x && (x.id === y.kisiId || nrm(x.name) === nrm(y.ad)));
    if (e) {
      e.role = y.to;
      V.save();
    }
    if (window.__kayit) {
      const o = window.__kayit.get(),
        r = o.list.find(x => nrm(x.ad) === nrm(y.ad));
      if (r) {
        r.unvan = y.to;
        window.__kayit.save(o);
      }
    }
  }
  function yukClick(t) {
    let b;
    if (t.id === 'yuAdd') {
      const v = ($('yuK') || {}).value || '';
      if (!v) return (V.toast('Kişiyi seç.'), true);
      const [sid, pid] = v.split('|'),
        p = staffOf(sid).find(x => x.id === pid);
      if (!p) return true;
      const to = $('yuTo').value || rNext(p.unvan);
      if (RUT.indexOf(to) <= RUT.indexOf(p.unvan)) {
        V.toast(`${p.ad} zaten ${RUTAD[p.unvan]}; daha üst bir görev seç.`);
        return true;
      }
      if (YU().some(y => y.store === sid && y.kisiId === pid && (y.durum === 'aday' || y.durum === 'sinav'))) {
        V.toast(`${p.ad} zaten sınav sürecinde.`);
        return true;
      }
      const g = giris();
      YU().push({
        id: uid(),
        store: sid,
        ad: p.ad,
        kisiId: p.id,
        from: p.unvan,
        to,
        by: { ad: g.ad, rol: g.tip === 'bs' ? 'BS' : g.unvan },
        at: new Date().toISOString(),
        not: ($('yuNot').value || '').trim(),
        sinav: null,
        puan: null,
        durum: 'aday'
      });
      save();
      render();
      V.toast(`${p.ad} aday gösterildi. İK sınav tarihini verecek.`);
      return true;
    }
    if ((b = t.closest('[data-ytar]'))) {
      const y = YU().find(x => x.id === b.dataset.ytar);
      if (!y || !isIkY()) return true;
      const d = $('yt-' + y.id).value;
      if (!d) {
        V.toast('Sınav gününü seç.');
        return true;
      }
      y.sinav = { tarih: d, saat: $('ys-' + y.id).value || '', yer: ($('yy-' + y.id).value || '').trim() };
      y.durum = 'sinav';
      y.sinavAt = new Date().toISOString();
      save();
      render();
      V.toast(`${y.ad} için sınav tarihi kaydedildi; kişiye bildirim gitti.`);
      return true;
    }
    if ((b = t.closest('[data-ypuan]'))) {
      const y = YU().find(x => x.id === b.dataset.ypuan);
      if (!y || !isIkY()) return true;
      const v = $('yp-' + y.id).value;
      const p = Number(v);
      if (v === '' || !(p >= 0 && p <= 100)) {
        V.toast('0 ile 100 arasında bir puan yaz.');
        return true;
      }
      y.puan = Math.round(p);
      y.gec = yGec();
      y.durum = y.puan >= y.gec ? 'gecti' : 'kaldi';
      y.sonucAt = new Date().toISOString();
      if (y.durum === 'gecti') yTerfi(y);
      save();
      render();
      V.toast(
        y.durum === 'gecti'
          ? `${y.ad} geçti (${y.puan}); görevi ${RUTAD[y.to]} oldu.`
          : `${y.ad} geçemedi (${y.puan}, geçme notu ${y.gec}).`
      );
      return true;
    }
    if ((b = t.closest('[data-ydel]'))) {
      if (!canAday()) return true;
      D.yuk = YU().filter(x => x.id !== b.dataset.ydel);
      save();
      render();
      V.toast('Adaylık geri çekildi.');
      return true;
    }
    if (t.id === 'yuGecK') {
      const v = Math.round(Number($('yuGec').value));
      if (!(v >= 1 && v <= 100)) {
        V.toast('1 ile 100 arasında bir not yaz.');
        return true;
      }
      D.yukGec = v;
      save();
      render();
      V.toast(`Geçme notu ${v} oldu.`);
      return true;
    }
    return false;
  }
  function yukN(L) {
    const g = giris();
    if (!g) return;
    const lim = new Date(Date.now() - 7 * 864e5).toISOString(),
      Y = yGor();
    if (g.tip === 'depo') {
      if (!isIkY()) return;
      Y.forEach(y => {
        if (y.durum === 'aday')
          L.push({
            k: 'yk:a:' + y.id,
            t: `Yükselme adayı: ${y.ad}`,
            d: `${RUTK[y.from]} → ${RUTK[y.to]} · ${S(y.store).name} · sınav tarihi ver`,
            at: y.at,
            go: { page: 'yuk' }
          });
        else if (y.durum === 'sinav' && y.sinav && y.sinav.tarih <= today())
          L.push({
            k: 'yk:p:' + y.id,
            t: `Sınav puanı gir: ${y.ad}`,
            d: ySinavTxt(y),
            at: y.sinavAt || y.at,
            go: { page: 'yuk' }
          });
      });
      return;
    }
    Y.forEach(y => {
      const m = yMine(y);
      if (m && y.durum === 'sinav')
        L.push({
          k: 'yk:s:' + y.id + ':' + y.sinav.tarih,
          t: 'Yükselme sınavın var',
          d: ySinavTxt(y),
          at: y.sinavAt || y.at,
          go: { page: 'yuk' }
        });
      if ((y.durum === 'gecti' || y.durum === 'kaldi') && (y.sonucAt || '') > lim)
        L.push({
          k: 'yk:r:' + y.id,
          t: m
            ? y.durum === 'gecti'
              ? `Tebrikler, sınavı geçtin: ${RUTAD[y.to]} oldun`
              : 'Yükselme sınavını geçemedin'
            : `${y.ad} sınavı ${y.durum === 'gecti' ? 'geçti' : 'geçemedi'}`,
          d: `${y.puan} puan · geçme notu ${y.gec || yGec()}`,
          at: y.sonucAt,
          go: { page: 'yuk' }
        });
    });
  }
  /* Yeni mağaza: İK açılan mağazanın kodunu, adını, adresini ve bölgesini girer; rehberde ve kayıtta hemen görünür.
   Sunumda bu telefonda saklanır; gerçekte merkezi mağaza listesine yazılır. */
  const MGY = 'magaza-yeni';
  const mgyAl = () => {
    try {
      const o = JSON.parse(localStorage.getItem(MGY) || 'null');
      return o && Array.isArray(o.list) ? o : { list: [] };
    } catch (e) {
      return { list: [] };
    }
  };
  const mgyKoy = o => {
    try {
      localStorage.setItem(MGY, JSON.stringify(o));
    } catch (e) {}
    if (MG() && MG().yenile) MG().yenile();
  };
  function mgyRowBox() {
    if (!isIkY()) return '';
    const n = mgyAl().list.length;
    return `<div class="box ic-bsrow" data-icgo="mgyeni"><div class="ic-av ise">${IC_MGY}</div><div class="ic-sm"><b>Yeni mağaza</b><small>${n ? `${n} yeni mağaza girildi · yenisini ekle` : 'Açılan mağazanın bilgilerini gir'}</small></div><span class="ic-go">›</span></div>`;
  }
  const IC_MGY =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h8"/><path d="M18 15v6M15 18h6"/></svg>';
  function mgyPage() {
    let h = head('Yeni mağaza', true);
    if (!isIkY())
      return (
        h +
        `<div class="box"><p class="hint" style="margin:0">Yeni mağaza bilgilerini insan kaynakları girer.</p></div>`
      );
    const B = MG() ? MG().bolgeler() : [],
      g = giris(),
      my = MG() ? MG().bolgeBul(g.depo || '') : '',
      f = ui.form || {};
    const il = [...new Set((MG() ? MG().tumu() : []).map(o => o.il).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'tr')
    );
    h += `<div class="box"><h2>Açılan mağazayı ekle</h2><p class="hint" style="margin:2px 0 0">Eklediğin mağaza hemen mağaza rehberinde görünür; çalışanlar kayıt olurken bu mağazayı seçebilir.</p><div class="sf" style="margin-top:10px">
    <div class="srow2"><label>Mağaza kodu<input id="myKod" autocomplete="off" maxlength="6" placeholder="Örn. K812" style="text-transform:uppercase" value="${esc(f.kod || '')}"></label><label>Açılış tarihi<input id="myAc" type="date" value="${esc(f.ac || dstr(0))}"></label></div>
    <label>Mağaza adı<input id="myAd" autocomplete="off" placeholder="Örn. Sahil - Finike" value="${esc(f.ad || '')}"></label>
    <div class="srow2"><label>Mahalle, cadde / sokak<input id="mySk" autocomplete="off" placeholder="Örn. Sahil Mah. 102. Sok." value="${esc(f.sk || '')}"></label><label>No<input id="myNo" autocomplete="off" placeholder="Örn. 14/A" value="${esc(f.no || '')}"></label></div>
    <div class="srow2"><label>İlçe<input id="myIlce" autocomplete="off" placeholder="Örn. Finike" value="${esc(f.ilce || '')}"></label><label>İl<input id="myIl" autocomplete="off" list="myIlL" placeholder="Örn. Antalya" value="${esc(f.il || '')}"><datalist id="myIlL">${il.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label></div>
    <label>Bağlı olduğu bölge (depo)<select id="myBk" class="ssel">${B.map(b => `<option value="${b.kod}"${(f.bk || my) === b.kod ? ' selected' : ''}>${esc(b.ad)} · ${b.kod}</option>`).join('')}</select></label>
    <p class="auth-err" id="myErr" role="alert"></p>
    <button type="button" class="btn primary" id="myAdd">Mağazayı ekle</button></div></div>`;
    const L = mgyAl().list.slice().reverse();
    h += `<div class="box"><h2>Eklenen yeni mağazalar</h2>${L.length ? `<ul class="iz-list">${L.map(m => `<li class="iz-row"><div class="iz-top"><div><b>${esc(m.ad.toLocaleUpperCase('tr-TR'))} ${esc(m.kod)}</b><small>${esc([m.sokak, m.no].filter(Boolean).join(' '))} · ${esc(m.ilce)} / ${esc(m.il)}<br>Bölge ${esc(m.bk)} · ${esc(MG() ? MG().bolge(m.bk) : '')} · açılış ${fmtD(m.acilis)}</small></div><span class="iz-st onay">Yeni</span></div><p class="hint" style="margin:4px 0 0">${esc(m.by)} · ${when(m.at)}</p><button type="button" class="linkbtn" data-mydel="${esc(m.kod)}" style="margin-top:6px">Listeden çıkar</button></li>`).join('')}</ul>` : '<p class="hint" style="margin:6px 0 0">Henüz yeni mağaza eklenmedi.</p>'}</div>`;
    return h;
  }
  function mgyClick(t) {
    let b;
    if ((t.id === 'myAdd' || t.closest('[data-mydel]')) && !isIkY()) return true;
    if (t.id === 'myAdd') {
      const v = id => ($(id).value || '').trim(),
        err = m => {
          $('myErr').textContent = m;
          return true;
        };
      const f = {
        kod: v('myKod').toLocaleUpperCase('tr-TR'),
        ac: v('myAc'),
        ad: v('myAd'),
        sk: v('mySk'),
        no: v('myNo'),
        ilce: v('myIlce'),
        il: v('myIl'),
        bk: $('myBk').value
      };
      ui.form = f;
      if (!/^[A-ZÇĞİÖŞÜ]\d{3,5}$/.test(f.kod)) return err('Mağaza kodunu harf ve rakamla yaz (ör. K812).');
      if (MG() && MG().kod(f.kod)) return err(`${f.kod} kodlu mağaza zaten var: ${MG().kod(f.kod).isim}.`);
      if (!f.ad) return err('Mağaza adını yaz.');
      if (!f.sk) return err('Adresi yaz.');
      if (!f.ilce || !f.il) return err('İlçe ve ili yaz.');
      const tcz = x =>
        x.toLocaleLowerCase('tr-TR').replace(/(^|[\s(./-])(\p{L})/gu, (m, a, c) => a + c.toLocaleUpperCase('tr-TR'));
      const o = mgyAl();
      o.list.push({
        kod: f.kod,
        ad: f.ad,
        sokak: f.sk,
        no: f.no,
        ilce: tcz(f.ilce),
        il: tcz(f.il),
        bk: f.bk,
        acilis: f.ac || dstr(0),
        at: new Date().toISOString(),
        by: giris().ad
      });
      mgyKoy(o);
      ui.form = {};
      render();
      window.scrollTo({ top: 0 });
      const m = MG() && MG().kod(f.kod);
      V.toast(`${m ? m.isim : f.kod} eklendi. Rehberde ve kayıt ekranında görünüyor.`);
      return true;
    }
    if ((b = t.closest('[data-mydel]'))) {
      const o = mgyAl();
      o.list = o.list.filter(x => x.kod !== b.dataset.mydel);
      mgyKoy(o);
      render();
      V.toast('Mağaza listeden çıkarıldı.');
      return true;
    }
    return false;
  }
  function mgyN(L) {
    const g = giris();
    if (!g || g.tip !== 'bs') return;
    const lim = new Date(Date.now() - 7 * 864e5).toISOString();
    mgyAl()
      .list.filter(m => m.at > lim)
      .forEach(m => {
        const o = MG() && MG().kod(m.kod);
        L.push({
          k: 'mgy:' + m.kod,
          t: `Yeni mağaza açıldı: ${o ? o.isim : m.kod}`,
          d: `${m.ilce} / ${m.il} · açılış ${fmtD(m.acilis)}`,
          at: m.at,
          go: { page: 'rehber' }
        });
      });
  }
  /* Kayıt onayları: İK (depo girişi) onaylar; İK yetki verdiği BS'ler de onaylar */
  const KYa = () => window.__kayit,
    kyYetki = () => !!(KYa() && KYa().yetkili());
  const kyBek = () =>
    KYa()
      ? KYa()
          .get()
          .list.filter(x => x.durum === 'bek')
          .sort((a, b) => b.at.localeCompare(a.at))
      : [];
  const KY_IC =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M3 20c.8-3.6 3.6-5.5 7-5.5 1.3 0 2.5.3 3.5.8"/><path d="m15.5 18 2 2 4-4.5"/></svg>';
  function kayitRowBox() {
    if (!kyYetki()) return '';
    const n = kyBek().length;
    return `<div class="box ic-bsrow" data-icgo="kayit"><div class="ic-av ise">${KY_IC}</div><div class="ic-sm"><b>Kayıt onayları</b><small>${n ? `${n} yeni çalışan onay bekliyor` : 'Bekleyen kayıt yok'}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function kyRow(r, act) {
    const st =
      r.durum === 'bek' ? ['bek', 'Onay bekliyor'] : r.durum === 'onay' ? ['onay', 'Onaylandı'] : ['red', 'Reddedildi'];
    return `<li class="iz-row"><div class="iz-top"><div><b>${esc(r.ad)} <small>${KISA[r.unvan] || esc(r.unvan || '')}</small></b><small>${esc(r.magaza || '-')} · Sicil ${esc(r.sicil)} · ${when(r.at)}</small></div><span class="iz-st ${st[0]}">${st[1]}</span></div>${r.karar ? `<p class="hint" style="margin:4px 0 0">${esc(r.karar.by)}${r.karar.rol ? ' (' + esc(r.karar.rol) + ')' : ''} · ${when(r.karar.at)}${r.karar.eski ? ` · görev ${esc(KISA[r.karar.eski] || r.karar.eski)} → ${esc(KISA[r.unvan] || r.unvan)} düzeltildi` : ''}</p>${r.karar.not ? `<p class="iz-not">${esc(r.karar.not)}</p>` : ''}` : ''}${act ? `<div class="sf ky-f" style="margin-top:8px"><label>Görevi (yanlışsa düzelt)<select id="kyu-${r.id}">${['MS', 'MSY', 'GT', 'PER', 'PART'].map(u => `<option value="${u}"${r.unvan === u ? ' selected' : ''}>${esc(UNVAN[u] || u)}</option>`).join('')}</select></label><label>Not (reddedersen nedenini yaz)<input id="kyn-${r.id}" autocomplete="off" placeholder="Örn. Sicil numarası yanlış"></label></div><div class="iz-act"><button type="button" class="btn" data-kyred="${r.id}">Reddet</button><button type="button" class="btn primary" data-kyok="${r.id}">Onayla</button></div>` : ''}</li>`;
  }
  function kayitPage() {
    let h = head('Kayıt onayları', true);
    if (!kyYetki())
      return (
        h +
        `<div class="box"><p class="hint" style="margin:0">Yeni çalışan kayıtlarını insan kaynakları onaylar. Sana onay yetkisi verilmemiş.</p></div>`
      );
    const o = KYa().get(),
      B = kyBek(),
      K = o.list
        .filter(x => x.durum !== 'bek' && x.karar)
        .sort((a, b) => b.karar.at.localeCompare(a.karar.at))
        .slice(0, 10),
      ik = isIkY();
    h += `<div class="box"><h2>Onay bekleyenler</h2><p class="hint" style="margin:2px 0 0">Sicil numarası listede olmayan biri kayıt olunca buraya düşer. Onaylarsan o sicille giriş yapabilir.</p>${B.length ? `<ul class="iz-list">${B.map(r => kyRow(r, true)).join('')}</ul>` : '<p class="hint" style="margin:8px 0 0">Bekleyen kayıt yok.</p>'}</div>`;
    if (K.length)
      h += `<div class="box"><h2>Son kararlar</h2><ul class="iz-list">${K.map(r => kyRow(r, false)).join('')}</ul></div>`;
    if (ik) {
      const L = KYa().bsler();
      h += `<div class="box"><h2>BS'lere onay yetkisi</h2><p class="hint" style="margin:2px 0 0">Açtığın bölge sorumlusu da yeni çalışan kayıtlarını onaylayabilir.</p><ul class="yk-list">${L.map(b => `<li><div><b>${esc(b.ad)}</b><small>${esc(b.bolge || 'Bölge sorumlusu')} · Sicil ${esc(b.sicil)}</small></div><button type="button" class="yk-sw" role="switch" data-kybs="${esc(b.sicil)}" aria-checked="${!!o.bsYetki[b.sicil]}" aria-label="${esc(b.ad)} onay yetkisi"><i></i></button></li>`).join('')}</ul></div>`;
    }
    return (
      h + `<p class="kvkk" style="text-align:center">🔒 Kayıtta T.C. kimlik no, adres ya da telefon gösterilmez.</p>`
    );
  }
  function izRowBox() {
    const n = izBekl().length,
      mine = D.izin.filter(izMine),
      last = mine.slice().sort((a, b) => b.at.localeCompare(a.at))[0];
    return `<div class="box ic-bsrow" data-icgo="izin"><div class="ic-av iz"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/></svg></div><div class="ic-sm"><b>İzin ve vardiya takası</b><small>${n ? `${n} talep onayını bekliyor` : last ? `Son talebin: ${IZD[last.durum][1].toLocaleLowerCase('tr-TR')}` : 'İzin iste, durumunu takip et'}</small></div>${n ? `<span class="ic-unread">${n}</span>` : '<span class="ic-go">›</span>'}</div>`;
  }
  function izPage() {
    const f = ui.form || {},
      B = izBekl(),
      mine = D.izin.filter(izMine).sort((a, b) => b.at.localeCompare(a.at)),
      hist = canOnay()
        ? D.izin.filter(x => x.durum !== 'bek' && !izMine(x)).sort((a, b) => b.at.localeCompare(a.at))
        : [];
    let h = head('İzin ve vardiya takası', true);
    if (B.length)
      h += `<div class="box"><h2>Onayını bekleyenler</h2><ul class="iz-list">${B.map(x => izRow(x, true)).join('')}</ul></div>`;
    h += `<div class="box"><h2>Yeni talep</h2><div class="sf" style="margin-top:8px"><div class="ic-pick">${Object.entries(
      IZT
    )
      .map(([k, l]) => `<button type="button" data-iztur="${k}" aria-pressed="${(f.tur || 'B') === k}">${l}</button>`)
      .join('')}</div>
    <div class="srow2"><label>${['B', 'T'].includes(f.tur || 'B') ? 'Gün' : 'Başlangıç'}<input type="date" id="izBas" value="${esc(f.bas || dstr(1))}"></label>${
      (f.tur || 'B') === 'B'
        ? ''
        : f.tur === 'T'
          ? `<label>Kiminle<select id="izKim"><option value="">Seç</option>${staffOf('me')
              .filter(p => nrm(p.ad) !== nrm(giris().ad))
              .map(p => `<option${f.kimle === p.ad ? ' selected' : ''}>${esc(p.ad)}</option>`)
              .join('')}</select></label>`
          : `<label>Bitiş<input type="date" id="izBit" value="${esc(f.bit || f.bas || dstr(1))}"></label>`
    }</div>
    <label>Açıklama (isteğe bağlı)<textarea id="izNot" class="simp" rows="2" placeholder="Örn. Hastane randevum var">${esc(f.not || '')}</textarea></label>
    <button type="button" class="btn primary" id="izGo">Talebi gönder</button><p class="hint" style="margin:0">Talebin MS ve MSY'ye gider; onaylanınca bildirim alırsın.</p></div></div>`;
    h += `<div class="box"><h2>Taleplerim</h2><ul class="iz-list">${mine.map(x => izRow(x, false)).join('') || '<li class="sempty">Henüz izin talebin yok.</li>'}</ul></div>`;
    if (hist.length)
      h += `<div class="box"><h2>Karar verilenler</h2><ul class="iz-list">${hist.map(x => izRow(x, false)).join('')}</ul></div>`;
    return h;
  }
  function readIz() {
    const f = (ui.form = ui.form || {});
    if ($('izKim')) f.kimle = $('izKim').value;
    if ($('izBas')) f.bas = $('izBas').value;
    if ($('izBit')) f.bit = $('izBit').value;
    if ($('izNot')) f.not = $('izNot').value;
  }
  /* Okundu bilgisi: mağaza talebi açınca işaretlenir; yanıt veren mağaza okumuş sayılır */
  D.okundu = D.okundu || {};
  if (!D.okSeed) {
    D.okSeed = 1;
    D.requests.forEach(r => {
      const R = D.responses[r.id] || {},
        O = (D.okundu[r.id] = D.okundu[r.id] || {});
      r.to.forEach((id, k) => {
        if (id === 'me' || R[id] || O[id]) return;
        if ((k * 7 + r.title.length) % 5 < 3)
          O[id] = new Date(new Date(r.at).getTime() + (20 + k * 9) * 60000).toISOString();
      });
    });
    save();
  }
  const readAt = (r, id) => (D.okundu[r.id] || {})[id] || ((D.responses[r.id] || {})[id] || {}).at || null;
  const readN = r => r.to.filter(id => readAt(r, id)).length;
  function markRead(r) {
    if (!r || !r.to.includes('me')) return;
    const O = (D.okundu[r.id] = D.okundu[r.id] || {});
    if (!O.me) {
      O.me = new Date().toISOString();
      save();
    }
  }
  /* Örnek kanıt fotoğrafı (sunumda diğer mağazaların yanıtları için çizilir) */
  function demoFoto(label) {
    try {
      const c = document.createElement('canvas');
      c.width = 480;
      c.height = 360;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 360);
      g.addColorStop(0, '#dfe7e2');
      g.addColorStop(1, '#b9c7be');
      x.fillStyle = g;
      x.fillRect(0, 0, 480, 360);
      for (let i = 0; i < 4; i++) {
        x.fillStyle = '#7d8c84';
        x.fillRect(30, 60 + i * 72, 420, 8);
        for (let j = 0; j < 9; j++) {
          x.fillStyle = ['#e2574c', '#f2c14e', '#4a90d9', '#2f8f6b', '#9b59b6'][(i * 3 + j) % 5];
          x.fillRect(38 + j * 46, 22 + i * 72, 36, 38);
        }
      }
      x.fillStyle = 'rgba(0,0,0,.55)';
      x.fillRect(0, 316, 480, 44);
      x.fillStyle = '#fff';
      x.font = 'bold 20px sans-serif';
      x.fillText(label, 14, 345);
      const d = c.toDataURL('image/jpeg', 0.7);
      return { name: 'kanit.jpg', type: 'image/jpeg', size: Math.round(d.length * 0.75), data: d };
    } catch (e) {
      return null;
    }
  }
  /* Mağaza ziyaret formu (BS doldurur, puanlanır) */
  const ZK = [
    ['kasa', 'Kasa önü düzeni'],
    ['raf', 'Raf ve planogram'],
    ['skt', 'SKT ve tazelik'],
    ['temiz', 'Temizlik'],
    ['depo', 'Depo düzeni'],
    ['etiket', 'Fiyat etiketleri'],
    ['aktuel', 'Aktüel alanı'],
    ['personel', 'Personel ve kıyafet']
  ];
  const ZV = [
    [2, 'Uygun'],
    [1, 'Kısmen'],
    [0, 'Uygun değil']
  ];
  const zSkor = p => Math.round((ZK.reduce((a, [k]) => a + (p[k] || 0), 0) * 100) / (ZK.length * 2));
  if (!Array.isArray(D.ziyaret)) {
    D.ziyaret = D.stores
      .filter((_, k) => k % 3 !== 2)
      .map((st, k) => {
        const p = {};
        ZK.forEach(([z], j) => {
          p[z] = (k + j * 3) % 7 === 0 ? 0 : (k * j) % 4 === 1 ? 1 : 2;
        });
        return {
          id: uid(),
          store: st.id,
          at: isoAt(14, 30, -(2 + k * 3)),
          bs: 'Bölge sorumlusu',
          puan: p,
          not: k % 2 ? 'Depo girişi toparlanmalı.' : 'Genel olarak iyi.',
          files: [],
          goruldu: st.id === 'me' ? null : isoAt(15, 0, -(2 + k * 3))
        };
      });
    save();
  }
  function zBox(id) {
    const Z = D.ziyaret.filter(z => z.store === id).sort((a, b) => b.at.localeCompare(a.at));
    return `<div class="box"><div class="gf-head"><h2>Mağaza ziyareti</h2>${Z[0] ? `<span class="pn-z ${zCls(zSkor(Z[0].puan))}">Son: %${zSkor(Z[0].puan)}</span>` : ''}</div>${
      Z.length
        ? `<ul class="zy-list">${Z.slice(0, 3)
            .map(
              z =>
                `<li data-zyv="${z.id}"><span>${fmtD(z.at.slice(0, 10))} · ${esc(z.bs)}</span><b class="pn-z ${zCls(zSkor(z.puan))}">%${zSkor(z.puan)}</b></li>`
            )
            .join('')}</ul>`
        : '<p class="hint" style="margin:6px 0 0">Bu mağazaya henüz ziyaret formu doldurulmadı.</p>'
    }
  ${giris() && giris().tip === 'bs' ? `<button type="button" class="btn primary" data-zynew="${id}" style="width:100%;margin-top:10px">Ziyaret formu doldur</button>` : ''}</div>`;
  }
  function zView(z) {
    const sk = zSkor(z.puan);
    return (
      head('Ziyaret · ' + esc(S(z.store).name), true) +
      `<div class="box"><div class="zy-skor ${zCls(sk)}" style="margin-top:0"><b>%${sk}</b><span>${fmtD(z.at.slice(0, 10))} · ${esc(z.bs)}</span></div>
  <ul class="zy-items">${ZK.map(([k, l]) => {
    const v = z.puan[k];
    return `<li><span>${l}</span><em class="zv${v}">${(ZV.find(x => x[0] === v) || [0, '—'])[1]}</em></li>`;
  }).join('')}</ul>${z.not ? `<p style="margin:10px 0 0"><b>Not:</b> ${esc(z.not)}</p>` : ''}${attHtml(z.files)}${
    z.gorev && D.requests.find(r => r.id === z.gorev)
      ? (() => {
          const r = D.requests.find(q => q.id === z.gorev),
            ok = answered(r, z.store);
          return `<button type="button" class="box ic-bsrow" data-icreq="${r.id}" style="width:100%;box-sizing:border-box;margin:12px 0 0;text-align:left;font:inherit;color:inherit;border:0;cursor:pointer"><div class="ic-av zy ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '!'}</div><div class="ic-sm"><b>Eksikler görevi</b><small>${ok ? 'Mağaza düzeltti, fotoğrafı gönderdi' : 'Mağazanın düzeltmesi bekleniyor'}</small></div><span class="ic-go">›</span></button>`;
        })()
      : ''
  }</div>`
    );
  }
  /* BS panosu: eksik sayısı, sıralama ve hatırlatma */
  function eksikler() {
    const I = ist(),
      ev = new Date().getHours() >= 20,
      out = [];
    D.stores.forEach(s => {
      const w = [];
      if (I.skt && !msktOf(s.id)) w.push('sabah SKT');
      if (I.rapor && ev && !raporOf(s.id)) w.push('akşam raporunu');
      if (w.length) out.push({ s, what: w.join(' ve '), w });
    });
    return out;
  }
  function eksikN(s) {
    const I = ist();
    return (
      (I.skt && !msktOf(s.id) ? 1 : 0) +
      (I.rapor && new Date().getHours() >= 20 && !raporOf(s.id) ? 1 : 0) +
      D.requests.filter(q => q.to.includes(s.id) && !answered(q, s.id)).length
    );
  }
  function bsSorted() {
    return D.stores
      .map((s, i) => ({ s, i, n: eksikN(s) }))
      .sort((a, b) => (b.n > 0) - (a.n > 0) || b.n - a.n || a.i - b.i)
      .map(x => x.s);
  }
  /* Onaylanan izin ya da takas, o günü içeren hazır vardiya planına işlenir */
  /* --- Vardiya bildirimleri ---
   1) Yazılmış bir haftada değişiklik olunca BS'ye bildirim gider (kim, hangi gün, eskisi → yenisi).
      Hafta, MS/MSY vardiya ekranından çıkınca "yazıldı" sayılır; boş hücrenin doldurulması yazmaya devam sayılır, değişiklik sayılmaz.
   2) Vardiyalar perşembe yazılır: perşembeden itibaren gelecek haftanın planı boşsa MS ve MSY'ye hatırlatma gider. */
  const VK = {
    M: 'Sabah',
    E: 'Akşam',
    T: 'Tam gün',
    A: 'Aracı',
    O: 'İzin (B)',
    R: 'Rapor',
    Y: 'Yıllık izin',
    H: 'Bayram'
  };
  const vdTxt = c =>
    !c || !c.k ? '' : (VK[c.k] || c.k) + (c.s && c.e && ['M', 'E', 'T', 'A'].includes(c.k) ? ` ${c.s}–${c.e}` : '');
  const wkAdd = (w, n) => {
    const d = new Date(w + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const monOf = () => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  const wkAd = w => `${fmtD(w)} – ${fmtD(wkAdd(w, 6))}`;
  const dolu = W => !!W && Object.values(W).some(r => Array.isArray(r) && r.some(c => c && c.k));
  if (!Array.isArray(D.vd)) {
    D.vd = [
      {
        id: uid(),
        tip: 'deg',
        store: 's3',
        w: monOf(),
        by: 'AKÇAY O583 MS',
        at: isoAt(18, 40, -1),
        L: [
          {
            ad: 'Hüseyin Koç',
            gun: wkAdd(monOf(), Math.min(6, ((new Date().getDay() + 6) % 7) + 1)),
            from: 'Sabah 08:30–16:30',
            to: 'Rapor'
          }
        ]
      }
    ];
    save();
  }
  document.addEventListener(
    'click',
    e => {
      if (e.target.closest('#tabV'))
        setTimeout(() => {
          const L = notifs().filter(x => x.go && x.go.tab === 'v');
          if (L.length) {
            dismiss(L);
            updBell();
          }
        }, 50);
    },
    true
  );
  function vdKontrol(force) {
    const g = giris();
    if (!g || g.tip !== 'magaza') return;
    const b = document.body;
    if (!force && b.classList.contains('tab-v') && !document.hidden) return;
    const st = V.state(),
      S0 = st.schedules || {},
      E = {};
    (st.employees || []).forEach(e => {
      if (e && e.id) E[e.id] = (e.name || '').trim() || 'Çalışan';
    });
    const ilk = !st.vdSnap,
      snap = (st.vdSnap = st.vdSnap || {}),
      min = wkAdd(monOf(), -7);
    let deg = 0;
    Object.keys(snap).forEach(w => {
      if (w < min) delete snap[w];
    });
    Object.keys(S0)
      .filter(w => w >= monOf())
      .sort()
      .forEach(w => {
        const W = S0[w];
        if (!dolu(W)) return;
        const cur = {};
        Object.keys(W).forEach(id => {
          if (E[id] && Array.isArray(W[id])) cur[id] = W[id].slice(0, 7).map(vdTxt);
        });
        const old = snap[w];
        snap[w] = cur;
        if (ilk) return;
        if (!old) {
          D.vd.push({
            id: uid(),
            tip: 'yaz',
            store: 'me',
            w,
            by: g.ad + ' · ' + (g.unvan || ''),
            at: new Date().toISOString(),
            L: []
          });
          deg++;
          return;
        }
        const L = [];
        Object.keys(cur).forEach(id => {
          const o = old[id];
          if (!o) return;
          cur[id].forEach((t, i) => {
            if (o[i] && o[i] !== t) L.push({ ad: E[id], gun: wkAdd(w, i), from: o[i], to: t || 'Boş' });
          });
        });
        if (L.length) {
          D.vd.push({
            id: uid(),
            tip: 'deg',
            store: 'me',
            w,
            by: g.ad + ' · ' + (g.unvan || ''),
            at: new Date().toISOString(),
            L
          });
          deg++;
        }
      });
    if (D.vd.length > 60) D.vd = D.vd.slice(-60);
    V.save();
    if (deg) {
      save();
      updBell();
      const x = D.vd[D.vd.length - 1];
      V.toast(
        x.tip === 'yaz'
          ? "Vardiya yazıldı, BS'ye bildirildi."
          : `Vardiya değişikliği BS'ye bildirildi (${x.L.length} değişiklik).`
      );
    }
  }
  window.__vdKontrol = vdKontrol;
  setInterval(() => vdKontrol(), 20000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) vdKontrol(true);
  });
  document.addEventListener(
    'click',
    e => {
      if (e.target.closest('.tabbar button,[role="tab"],[data-hm],#moreSheet button'))
        setTimeout(() => vdKontrol(), 50);
    },
    true
  );
  setTimeout(() => vdKontrol(), 800);
  function vdHafta(w) {
    if (!w || !V.setWeek) return;
    const st = V.state();
    if (st.weekStart !== w) {
      V.setWeek(w);
      V.toast(`${wkAd(w)} haftası açıldı. Plan oluştur'a bas.`);
    }
  }
  window.__vdHafta = vdHafta;
  function vdSatir(c) {
    return `${esc(c.ad)} · ${fmtD(c.gun)}: ${esc(c.from)} → ${esc(c.to)}`;
  }
  function vdBox(id) {
    const L = D.vd
      .filter(x => x.store === id)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 4);
    if (!L.length) return '';
    return `<div class="box"><h2>Vardiya değişiklikleri</h2><ul class="vd-list">${L.map(x => `<li><b>${x.tip === 'yaz' ? 'Haftalık vardiya yazıldı' : 'Vardiya değişti'} · ${wkAd(x.w)}</b>${x.L.map(c => `<span>${vdSatir(c)}</span>`).join('')}<small>${esc(x.by)} · ${when(x.at)}</small></li>`).join('')}</ul></div>`;
  }
  /* Perşembe hatırlatması: gelecek haftanın planı boşsa (perşembe-pazar) MS ve MSY'ye */
  function vdGunu() {
    const g = giris();
    if (!g || g.tip !== 'magaza' || !['MS', 'MSY'].includes(g.unvan)) return null;
    const wd = (new Date().getDay() + 6) % 7;
    if (wd < 3) return null;
    const w = wkAdd(monOf(), 7),
      W = (V.state().schedules || {})[w];
    if (dolu(W)) return null;
    return {
      w,
      gec: wd > 3,
      t: wd === 3 ? 'Bugün vardiya günü' : 'Gelecek haftanın vardiyası yazılmadı',
      d: `${wkAd(w)} haftasının planını yaz`
    };
  }
  function vdHatirlat() {
    const g = giris(),
      ok = g && g.tip === 'magaza' && ['MS', 'MSY'].includes(g.unvan);
    try {
      if (window.AndroidApp && AndroidApp.scheduleVardiya)
        AndroidApp.scheduleVardiya(
          JSON.stringify(
            ok
              ? { gun: 4, saat: '09:00', baslik: 'Vardiya günü', metin: 'Gelecek haftanın vardiyasını yaz.' }
              : { kapali: true }
          )
        );
    } catch (e) {}
    if (!ok) return;
    const v = vdGunu(),
      st = V.state();
    if (!v || st.vdBild === today()) return;
    st.vdBild = today();
    V.save();
    if (!(window.AndroidApp && AndroidApp.scheduleVardiya))
      try {
        if ('Notification' in window && Notification.permission === 'granted')
          new Notification(v.t, { body: v.d, tag: 'vardiya-gunu' });
      } catch (e) {}
  }
  function planIsle(x) {
    const st = V.state(),
      E = st.employees || [],
      K = { B: 'O', Y: 'Y', R: 'R' }[x.tur];
    const emp = a => E.find(e => e && ((x.kisiId && e.id === a) || nrm(e.name) === nrm(a)));
    const p = x.tur === 'T' ? null : E.find(e => e && e.id === x.kisiId) || emp(x.ad);
    if (x.tur !== 'T' && (!K || !p)) return 0;
    const days = [];
    for (
      let d = new Date(x.bas + 'T12:00:00');
      d <= new Date((x.bit || x.bas) + 'T12:00:00');
      d.setDate(d.getDate() + 1)
    )
      days.push(new Date(d));
    let n = 0;
    days.forEach(d => {
      for (const w of Object.keys(st.schedules || {})) {
        const W = st.schedules[w],
          i = Math.round((d - new Date(w + 'T12:00:00')) / 864e5);
        if (i < 0 || i > 6 || !W || !Object.keys(W).length) continue;
        if (x.tur === 'T') {
          const a = E.find(e => e && e.id === x.kisiId) || E.find(e => e && nrm(e.name) === nrm(x.ad)),
            b = E.find(e => e && nrm(e.name) === nrm(x.kimle));
          if (!a || !b || !W[a.id] || !W[b.id]) continue;
          const t = W[a.id][i];
          W[a.id][i] = W[b.id][i];
          W[b.id][i] = t;
          n++;
        } else {
          if (!W[p.id]) W[p.id] = [];
          W[p.id][i] = { k: K };
          n++;
        }
      }
    });
    if (n) {
      V.save();
    }
    return n;
  }
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
  /* Veri yükleme: portalın gerçek verileri (ürün/barkod, fiyat politikası, çalışanlar, unvanlar) Excel şablonuyla yüklenir.
   Gerçek sürümde genel müdürlük yükler ve tüm mağazalara dağıtılır; sunumda bu cihaza yüklenir. */
  const vrSt = () => {
    const st = V.state();
    st.veri = st.veri || {};
    return st.veri;
  };
  const sktS = () => {
    const st = V.state();
    st.skt = st.skt || { items: [], catalog: {} };
    st.skt.catalog = st.skt.catalog || {};
    return st.skt;
  };
  const myCode = () => (window.__mg ? window.__mg.kodOf(myName()) : '');
  const vNum = x => {
    x = String(x || '')
      .trim()
      .replace(/\s|₺|TL/gi, '');
    if (!x) return null;
    if (/,\d{1,2}$/.test(x)) x = x.replace(/\./g, '').replace(',', '.');
    else x = x.replace(/,/g, '');
    const n = Number(x);
    return isFinite(n) ? n : null;
  };
  const vDate = x => {
    x = String(x || '').trim();
    let m = x.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) return m[3] + '-' + pad(m[2]) + '-' + pad(m[1]);
    m = x.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? x : '';
  };
  function vImport(k, R) {
    let ok = 0,
      bad = 0,
      info = '';
    const st = V.state();
    if (k === 'urun') {
      const S2 = sktS(),
        G = S2.groups || [];
      R.forEach(r => {
        const bc = (r[0] || '').replace(/\D/g, '');
        if (bc.length < 6 || !r[1]) {
          bad++;
          return;
        }
        const g = G.find(x => nrm(x.name) === nrm(r[2]));
        const w = r[3] === '' || r[3] == null ? null : Math.max(0, parseInt(r[3], 10) || 0);
        const c = S2.catalog[bc] || (S2.catalog[bc] = { warn: null, shelf: '', group: 'genel', price: null, used: 0 });
        c.name = r[1];
        if (g) c.group = g.id;
        if (w != null) c.warn = w;
        ok++;
      });
      info = `${ok} ürün`;
    } else if (k === 'fiyat') {
      const S2 = sktS(),
        F = (st.fiyat = st.fiyat || {}),
        t = today();
      R.forEach(r => {
        const bc = (r[0] || '').replace(/\D/g, ''),
          p = vNum(r[1]);
        if (bc.length < 6 || p == null) {
          bad++;
          return;
        }
        const kp = vNum(r[2]),
          kb = vDate(r[3]),
          ke = vDate(r[4]);
        F[bc] = { p, k: kp, kb, ke };
        const c =
          S2.catalog[bc] ||
          (S2.catalog[bc] = { name: '', warn: null, shelf: '', group: 'genel', price: null, used: 0 });
        c.price = kp != null && kb && ke && t >= kb && t <= ke ? kp : p;
        ok++;
      });
      const kn = Object.values(F).filter(x => x.k != null && x.kb && x.ke && t >= x.kb && t <= x.ke).length;
      info = `${ok} fiyat${kn ? `, ${kn} üründe kampanya geçerli` : ''}`;
    } else if (k === 'calisan') {
      const me = myCode(),
        E = (st.employees = st.employees || []),
        say = {};
      let add = 0,
        upd = 0;
      R.forEach(r => {
        const sc = (r[0] || '').replace(/\D/g, ''),
          ad = (r[1] || '').trim(),
          un = (r[2] || '').trim().toLocaleUpperCase('tr-TR'),
          mk = String(r[3] || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
        if (sc.length < 3 || !ad || !['MS', 'MSY', 'GT', 'PER', 'PART'].includes(un)) {
          bad++;
          return;
        }
        ok++;
        say[mk || me] = (say[mk || me] || 0) + 1;
        if (mk && me && mk !== me) return;
        const e = E.find(x => String(x.sicil || '') === sc) || E.find(x => !x.sicil && nrm(x.name) === nrm(ad));
        const role = un === 'PART' ? 'PER' : un;
        if (e) {
          e.name = ad;
          e.role = role;
          e.sicil = sc;
          upd++;
        } else {
          E.push({ id: uid(), name: ad, role, izin: 'auto', araciOk: true, gender: '', sicil: sc });
          add++;
        }
      });
      st.magazaSay = say;
      const n = Object.keys(say).length;
      info = `${me ? 'Mağaza ' + me + ': ' : ''}${add} eklendi, ${upd} güncellendi${n > 1 ? ` · dosyada ${n} mağaza, ${ok} çalışan` : ''}`;
    }
    if (ok) {
      vrSt()[k] = { n: ok, bad, at: new Date().toISOString(), info };
    }
    return { ok, bad, info };
  }
  (function () {
    let BV;
    try {
      BV = JSON.parse(document.getElementById('bimVeri').textContent);
    } catch (e) {
      return;
    }
    if (!BV || !BV.surum) return;
    const st = V.state(),
      t = today();
    if (st.veriSurum !== BV.surum) {
      const T = x => (x || []).map(r => r.map(c => (c == null ? '' : String(c))));
      vImport('urun', T(BV.urunler));
      vImport('calisan', T(BV.calisanlar));
      st.veriSurum = BV.surum;
      st.veriGun = '';
    }
    if (st.veriGun !== t) {
      vImport(
        'fiyat',
        (BV.fiyatlar || []).map(r => r.map(c => (c == null ? '' : String(c))))
      );
      st.veriGun = t;
    }
    V.save();
  })();
  const lastZ = id => D.ziyaret.filter(z => z.store === id).sort((a, b) => b.at.localeCompare(a.at))[0] || null;
  const zCls = n => (n >= 85 ? 'ok' : n >= 65 ? 'mid' : 'bad');
  /* Son 7 gün fire tutarı: bu cihazın mağazası gerçek, diğerleri örnek */
  function fire7(id, name) {
    if (id === 'me') {
      const lim = dstr(-6),
        L = ((V.state().skt || {}).fire || []).filter(x => String(x.at || '').slice(0, 10) >= lim);
      const t = L.reduce((a, x) => a + (x.price != null ? x.price * (x.qty || 1) : 0), 0);
      if (L.length) return { t, ex: false };
    }
    let h = 0;
    for (const c of String(name || id) + today()) h = (h * 31 + c.charCodeAt(0)) % 9973;
    return { t: 600 + (h % 2400), ex: true };
  }
  function bsgKey() {
    const g = giris();
    return 'bsg:' + nrm(g && g.ad);
  }
  function bsUnread() {
    const g = giris();
    if (!g || (g.tip !== 'bs' && kad() !== 'pm')) return [];
    const me = nrm(g.ad),
      seen = (D.seen || {})[bsgKey()] || '';
    return D.bsgrup.filter(m => nrm(m.from) !== me && m.at > seen);
  }
  function markBs() {
    D.seen = D.seen || {};
    D.seen[bsgKey()] = new Date().toISOString();
    save();
  }
  function bsList() {
    const g = giris(),
      me = nrm(g && g.ad);
    return `<div class="ic-chat" id="icChat">${
      D.bsgrup
        .map(m => {
          const mine = nrm(m.from) === me;
          return `<div class="ic-msg ${mine ? 'me' : 'them'}">${mine ? '' : `<b class="gm-who">${esc(m.from)} <small>${esc(m.bolge || 'BS')}</small></b>`}<div>${esc(m.text)}</div><small>${when(m.at)}</small></div>`;
        })
        .join('') || '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok.</p>'
    }</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="BS grubuna yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="bsgrup" aria-label="Gönder">➤</button></div>`}`;
  }
  function bsSim() {
    if (kilitli()) return;
    if (Math.random() < 0.3) return;
    const p = BSLER[rnd(0, BSLER.length - 1)];
    setTimeout(
      () => {
        D.bsgrup.push({
          from: p.ad,
          bolge: p.bolge,
          text: [
            'Tamam, teşekkürler 👍',
            'Bizde de aynı durum.',
            'Not aldım.',
            'Ben de bölgeme ileteyim.',
            'Anlaşıldı.'
          ][rnd(0, 4)],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden && ui.page === 'bsgrup') render();
        else updBell();
      },
      2500 + rnd(0, 2500)
    );
  }
  /* --- sevkiyat: depo her aracı (gün, saat, plaka, şoför) ve aracın gideceği 3-4 mağazayı teslim sırasıyla girer.
   Araçtaki her mağaza aynı aracı ve kendi sırasını görür; MS ve MSY görür, personel BS izin verirse görür --- */
  const PLK = [
    '38 BMK 417',
    '38 ADR 902',
    '38 KYS 115',
    '38 TLS 640',
    '38 HCL 288',
    '38 INC 731',
    '38 ERC 059',
    '38 MLK 364'
  ];
  function seedSevk() {
    const R = [
      [['me', 's2', 's4', 's6'], 1, '07:30', 'Soğuk zincir ürünleri önce indirilsin.'],
      [['s3', 's5', 's8'], 0, '06:45', ''],
      [['s7', 's3', 'me'], 2, '08:15', ''],
      [['s2', 's6', 's8', 's4'], 2, '06:30', '']
    ];
    return R.map(([L, d, saat, not], k) => {
      const ids = L.filter(id => D.stores.some(s => s.id === id));
      return {
        id: uid(),
        stores: ids,
        store: ids[0],
        tarih: dstr(d),
        saat,
        plaka: PLK[k % PLK.length],
        sofor: ['Hasan K.', 'Yusuf A.', 'Kemal T.', 'Osman D.'][k % 4],
        not,
        at: isoAt(17, 0, -1)
      };
    });
  }
  if (!Array.isArray(D.sevk) || D.sevk.some(x => !Array.isArray(x.stores))) {
    D.sevk = seedSevk();
    save();
  }
  iseInit();
  const canSevk = () => {
    const g = giris();
    if (!g) return false;
    if (g.tip !== 'magaza') return true;
    return document.body.dataset.role !== 'staff' || !!((D.yetki || {}).me || {}).v;
  };
  const gunAd = t => (t === today() ? 'Bugün' : t === dstr(1) ? 'Yarın' : fmtD(t));
  const durak = x => (Array.isArray(x.stores) && x.stores.length ? x.stores : [x.store]);
  const sevkOf = id =>
    D.sevk
      .filter(x => durak(x).includes(id) && x.tarih >= today())
      .sort((a, b) => (a.tarih + a.saat).localeCompare(b.tarih + b.saat));
  function sevkCard(x, del, st, forId) {
    const L = durak(x),
      i = forId ? L.indexOf(forId) : -1;
    const dur = st
      ? `<ol class="sk-dur">${L.map(id => {
          const o = MG() && MG().bul(S(id).name);
          return `<li><b>${esc(S(id).name)}</b>${o ? `<small>${esc(o.adres)}</small>` : ''}</li>`;
        }).join('')}</ol>`
      : L.length > 1
        ? `<p class="sk-sira">${i >= 0 ? `<b>${i + 1}. ${D.role === 'bs' ? 'sırada' : 'sıradasın'}</b> · ` : ''}Araç ${L.length} mağazaya gidiyor: ${L.map((id, j) => `<span${j === i ? ' class="on"' : ''}>${j + 1}. ${esc(S(id).name.replace(/\s+[A-Z0-9]\d{3,5}$/, ''))}</span>`).join(', ')}</p>`
        : '';
    return `<div class="sv-k"><div class="sk-when"><b>${gunAd(x.tarih)}</b><span>${esc(x.saat)}</span></div><div class="sk-main"><div class="sk-plaka">${esc(x.plaka)}</div><small>${x.sofor ? 'Şoför: ' + esc(x.sofor) : ''}${x.not ? ' · ' + esc(x.not) : ''}</small>${dur}</div>${del ? `<button type="button" class="nt-x" data-skdel="${x.id}" aria-label="Sil">×</button>` : ''}</div>`;
  }
  function sevkBox(id) {
    if (!canSevk()) return '';
    const L = sevkOf(id);
    return `<div class="box"><h2>Sevkiyat</h2>${L.length ? L.map(x => sevkCard(x, false, false, id)).join('') : '<p class="hint" style="margin:6px 0 0">Planlanmış sevkiyat yok.</p>'}</div>`;
  }

  function grupSeenKey() {
    const g = giris();
    return 'grup:' + nrm(g && g.ad);
  }
  function grupUnread() {
    const g = giris();
    if (!g || g.tip !== 'magaza') return [];
    const me = nrm(g.ad),
      seen = (D.seen || {})[grupSeenKey()] || '';
    return D.grup.filter(m => nrm(m.from) !== me && m.at > seen);
  }
  function markGrup() {
    D.seen = D.seen || {};
    D.seen[grupSeenKey()] = new Date().toISOString();
    save();
  }
  function shared(r) {
    return D.grup.some(m => m.share && m.share.id === r.id);
  }
  function shareBtn(r) {
    if (isStaff()) return '';
    if (shared(r)) return `<p class="gs-done">✓ Mağaza grubuyla paylaşıldı</p>`;
    return ui.shareOpen
      ? `<div class="sf gs-form"><label>Ekibe not (isteğe bağlı)<input id="gsNot" autocomplete="off" placeholder="Örn. Akşam vardiyası ilgilensin"></label><div class="gs-act"><button type="button" class="btn" data-gscancel>Vazgeç</button><button type="button" class="btn primary" data-gsgo="${r.id}">Gruba gönder</button></div></div>`
      : `<button type="button" class="btn gs-btn" data-gsopen>${GRP_IC}Mağaza grubuyla paylaş</button>`;
  }
  function shareCard(x) {
    return `<div class="gs-card"><span class="ic-type t-${x.type}">BS · ${TYPES[x.type] || ''}</span><b>${esc(x.title)}</b>${x.body ? `<p>${esc(x.body)}</p>` : ''}${
      x.items && x.items.length
        ? `<ul>${x.items
            .slice(0, 6)
            .map(it => `<li>${esc(it.code)} ${esc(it.name)}</li>`)
            .join('')}</ul>`
        : ''
    }</div>`;
  }
  function grupList() {
    const g = giris(),
      me = nrm(g && g.ad);
    return `<div class="ic-chat" id="icChat">${
      D.grup.length
        ? D.grup
            .map(m => {
              const mine = nrm(m.from) === me;
              return `<div class="ic-msg ${mine ? 'me' : 'them'}${m.share ? ' gs' : ''}">${mine ? '' : `<b class="gm-who">${esc(m.from)} <small>${KISA[m.unvan] || ''}</small></b>`}${m.share ? shareCard(m.share) : ''}${m.text ? `<div>${esc(m.text)}</div>` : ''}<small>${when(m.at)}</small></div>`;
            })
            .join('')
        : '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok.</p>'
    }</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="Gruba yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="grup" aria-label="Gönder">➤</button></div>`}`;
  }
  function grupSim() {
    if (kilitli()) return;
    const g = giris(),
      me = nrm(g && g.ad),
      O = staffOf('me').filter(p => nrm(p.ad) !== me);
    if (!O.length || Math.random() < 0.35) return;
    const p = O[rnd(0, O.length - 1)];
    setTimeout(
      () => {
        D.grup.push({
          from: p.ad,
          unvan: p.unvan,
          text: ['Tamam 👍', 'Anlaşıldı.', 'Ben hallederim.', 'Tamamdır, teşekkürler.'][rnd(0, 3)],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden && ui.page === 'grup') render();
        else updBell();
      },
      2500 + rnd(0, 2500)
    );
  }
  function simSv(s) {
    if (s.store === 'me') return;
    setTimeout(
      () => {
        const x = D.savunma.find(y => y.id === s.id);
        if (!x || x.cevap) return;
        x.cevap = { text: svText(x), at: new Date().toISOString() };
        save();
        if (!$('icView').hidden) render();
        else updBell();
      },
      6000 + rnd(0, 3000)
    );
  }
  function svForm() {
    return { store: '', kisi: '', olay: '', tarih: today(), son: dstr(2), aciklama: '' };
  }
  function readSv() {
    const f = ui.form;
    if (!f) return;
    if ($('svT')) f.tarih = $('svT').value;
    if ($('svSon')) f.son = $('svSon').value;
    if ($('svA')) f.aciklama = $('svA').value;
  }
  function svRow(s, bs) {
    const d = svDurum(s);
    return `<li data-${bs ? 'icsv' : 'icsvans'}="${s.id}"><div><span class="ic-type t-savunma">Savunma</span><b>${bs ? esc(s.ad) + ' <small>' + (KISA[s.unvan] || '') + ' · ' + esc(S(s.store).name) + '</small>' : esc(s.olay)}</b><small>${bs ? esc(s.olay) + ' · ' : ''}${s.cevap ? when(s.cevap.at) + ' yanıtlandı' : 'son gün ' + fmtD(s.son)}</small></div><span class="ic-st sv-${d[0]}">${d[1]}</span></li>`;
  }
  function svAlerts() {
    return D.savunma
      .filter(s => isMine(s) && !s.cevap)
      .map(
        s =>
          `<button type="button" class="sv-alert" data-icsvans="${s.id}"><span><b>Savunman isteniyor</b><span>${esc(s.olay)} · son gün ${fmtD(s.son)}</span></span><span class="ic-go">›</span></button>`
      )
      .join('');
  }
  function svMine() {
    const L = D.savunma.filter(s => isMine(s) && s.cevap);
    return L.length
      ? `<div class="box"><h2>Savunmalarım</h2><ul class="ic-reqs">${L.map(s => svRow(s, false)).join('')}</ul></div>`
      : '';
  }
  function svInfo(s) {
    return `<dl class="sv-dl"><dt>Olay</dt><dd>${esc(s.olay)}</dd><dt>Olay tarihi</dt><dd>${fmtL(s.tarih)}</dd><dt>İsteyen</dt><dd>${esc(s.bs)} (BS)</dd><dt>İstendi</dt><dd>${when(s.at)}</dd><dt>Son yanıt</dt><dd>${fmtL(s.son)}</dd></dl><p class="sv-txt">${esc(s.aciklama)}</p>`;
  }
  function svPrint(s) {
    const st = S(s.store).name,
      row = (k, v) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`;
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Savunma - ${esc(s.ad)}</title><style>body{font:14px/1.5 Arial,Helvetica,sans-serif;color:#000;margin:32px}h1{font-size:19px;text-align:center;margin:0 0 4px;letter-spacing:.02em}p.c{text-align:center;margin:0 0 18px;color:#444}table{width:100%;border-collapse:collapse;margin:10px 0 16px}td{border:1px solid #888;padding:6px 8px;vertical-align:top}td:first-child{width:30%;font-weight:bold;background:#f2f2f2}h2{font-size:14px;margin:14px 0 4px}.t{border:1px solid #888;padding:10px;min-height:110px;white-space:pre-wrap}.imza{display:flex;justify-content:space-between;margin-top:56px}.imza div{width:42%;border-top:1px solid #000;padding-top:6px;text-align:center}</style></head><body>
<h1>SAVUNMA İSTEM VE SAVUNMA FORMU</h1><p class="c">${esc(st)}</p>
<table>${row('Adı soyadı', s.ad)}${row('Görevi', UNVAN[s.unvan] || s.unvan)}${row('Mağaza', st)}${row('Olay', s.olay)}${row('Olay tarihi', fmtL(s.tarih))}${row('Savunma isteyen', s.bs + ' (Bölge sorumlusu)')}${row('İstem tarihi', new Date(s.at).toLocaleString('tr-TR'))}${row('Son yanıt tarihi', fmtL(s.son))}</table>
<h2>Olayın açıklaması</h2><div class="t">${esc(s.aciklama)}</div>
<h2>Savunma</h2><div class="t">${s.cevap ? esc(s.cevap.text) : ''}</div>${s.cevap ? `<p>Gönderildi: ${new Date(s.cevap.at).toLocaleString('tr-TR')}</p>` : ''}
${s.sonuc ? `<h2>Sonuç</h2><div class="t" style="min-height:0">${esc(s.sonuc.karar)}${s.sonuc.not ? '\n' + esc(s.sonuc.not) : ''}</div>` : ''}
<div class="imza"><div>Savunma veren<br>${esc(s.ad)}</div><div>Bölge sorumlusu<br>${esc(s.bs)}</div></div></body></html>`;
    const fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(fr);
    const d = fr.contentWindow.document;
    d.open();
    d.write(html);
    d.close();
    setTimeout(() => {
      try {
        fr.contentWindow.focus();
        fr.contentWindow.print();
      } catch (e) {}
      setTimeout(() => fr.remove(), 60000);
    }, 300);
  }
  function showNote(title, body, ref) {
    const n = $('icNote');
    if (!n) return;
    n.innerHTML = `<button type="button" class="ic-note-x" aria-label="Kapat">×</button><b>${esc(title)}</b><span>${esc(body)}</span>`;
    n.dataset.req = ref.req || '';
    n.dataset.sv = ref.sv || '';
    n.hidden = false;
    clearTimeout(n._t);
    n._t = setTimeout(() => {
      n.hidden = true;
    }, 8000);
  }

  /* --- bizim mağazanın gerçek verisi: BS sekmesindeki sabah SKT ve akşam raporu --- */
  function myMskt() {
    const r = (AB().mskt || {})[today()];
    return r ? r.at : null;
  }
  function myRapor() {
    const t = today(),
      m = t.slice(0, 7),
      i = Number(t.slice(8));
    const P = ((AB().ciro || {})[m] || {}).days || {};
    return P[i] && P[i].ciro != null ? P[i] : null;
  }
  function msktOf(id) {
    return id === 'me' ? myMskt() : D.mskt[id] || null;
  }
  // örnek: diğer mağazalar akşam 20.00'den sonra raporlarını göndermiş görünür (biri hariç)
  function raporOf(id) {
    if (id === 'me') return myRapor();
    if (D.rapor[id]) return D.rapor[id];
    const k = D.stores.findIndex(s => s.id === id);
    return new Date().getHours() >= 20 && k !== 5 ? { ciro: 95000 + k * 7350, mus: 610 + k * 23 } : null;
  }

  /* --- simülasyon: diğer mağazalar birkaç saniye içinde yanıtlar --- */
  function simulate(req) {
    req.to
      .filter(id => id !== 'me')
      .forEach((id, k) => {
        if (Math.random() < 0.92)
          setTimeout(
            () => {
              const O = (D.okundu[req.id] = D.okundu[req.id] || {});
              if (!O[id]) {
                O[id] = new Date().toISOString();
                save();
                if (!$('icView').hidden && ui.page === 'req') render();
              }
            },
            1200 + k * 900 + rnd(0, 800)
          );
      });
    req.to
      .filter(id => id !== 'me')
      .forEach((id, k) => {
        if (Math.random() < 0.15) return; // biri hep geç kalır
        setTimeout(
          () => {
            const R = (D.responses[req.id] = D.responses[req.id] || {});
            if (R[id]) return;
            if (req.type === 'kontrol')
              R[id] = {
                at: new Date().toISOString(),
                items: req.items.map(() => {
                  const v = RCST[rnd(0, 2)][0];
                  return { st: v, qty: v === 'yok' ? null : rnd(1, 15) };
                })
              };
            else if (req.type === 'bilgi')
              R[id] = {
                at: new Date().toISOString(),
                rows: [
                  req.cols.map((h, c) =>
                    /adet|sayı|miktar|stok/i.test(h)
                      ? String(rnd(0, 24))
                      : c === 0
                        ? ['Var', 'Yok', 'Kontrol edildi'][rnd(0, 2)]
                        : ''
                  )
                ]
              };
            else
              R[id] =
                Math.random() < 0.8
                  ? { at: new Date().toISOString(), done: true }
                  : { at: new Date().toISOString(), done: false, reason: NEDEN[rnd(0, NEDEN.length - 1)] };
            if (req.foto && R[id].done !== false) {
              const f = demoFoto(S(id).name + ' · örnek kanıt');
              if (f) R[id].files = [f];
            }
            save();
            if (!$('icView').hidden) render();
            else updBell();
          },
          2500 + k * 1700 + rnd(0, 1500)
        );
      });
  }
  function simReply(id) {
    if (id === 'me') return;
    setTimeout(
      () => {
        (D.messages[id] = D.messages[id] || []).push({
          from: 'magaza',
          text: ['Tamam, bakıyoruz 👍', 'Anlaşıldı, hallediyoruz.', 'Kontrol edip dönüş yapacağız.'][rnd(0, 2)],
          at: new Date().toISOString()
        });
        save();
        if (!$('icView').hidden) render();
        else updBell();
      },
      3000 + rnd(0, 2000)
    );
  }

  /* --- yardımcılar --- */
  const trq = x => String(x || '').toLocaleLowerCase('tr-TR');
  function reqLis(L, q) {
    q = trq(q).trim();
    const pend = [],
      done = [];
    L.forEach(r => {
      if (q) {
        const d = new Date(r.at),
          hay = trq(
            [
              r.title,
              r.body,
              TYPES[r.type],
              when(r.at),
              d.toLocaleDateString('tr-TR'),
              d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
              ...(r.items || []).map(it => it.code + ' ' + it.name)
            ].join(' ')
          );
        if (!q.split(/\s+/).every(w => hay.includes(w))) return;
      }
      (answered(r, 'me') ? done : pend).push(r);
    });
    const li = r => {
      const a = answered(r, 'me');
      return `<li data-icans="${r.id}" class="${a ? 'done' : 'todo'}"><div><span class="ic-type t-${r.type}">${TYPES[r.type]}</span><b>${esc(r.title)}</b><small>${when(r.at)}${r.foto ? ' · 📷 fotoğraf isteniyor' : ''}${a ? ' · yanıtlandı' : ''}</small></div><span class="ic-st ${a ? 'ok' : 'wait'}">${a ? 'Yanıtlandı' : 'Yanıtla'}</span></li>`;
    };
    if (!pend.length && !done.length) return `<li class="sempty">${q ? 'Aramaya uyan talep yok.' : 'Talep yok.'}</li>`;
    return (
      (pend.length ? `<li class="rq-sep">Yapılacaklar · ${pend.length}</li>` + pend.map(li).join('') : '') +
      (done.length ? `<li class="rq-sep">Yapılanlar · ${done.length}</li>` + done.map(li).join('') : '')
    );
  }
  let bsTab = 'm',
    bsQ = '',
    dpSel = [];
  function reqHit(r, q) {
    if (!q) return true;
    const d = new Date(r.at),
      hay = trq(
        [
          r.title,
          r.body,
          TYPES[r.type],
          when(r.at),
          d.toLocaleDateString('tr-TR'),
          d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
          ...(r.items || []).map(it => it.code + ' ' + it.name)
        ].join(' ')
      );
    return q.split(/\s+/).every(w => hay.includes(w));
  }
  function bsReqLis(q) {
    q = trq(q).trim();
    const L = D.requests.filter(r => reqHit(r, q)).sort((a, b) => b.at.localeCompare(a.at)),
      cnt = r => r.to.filter(id => answered(r, id)).length,
      open = L.filter(r => cnt(r) < r.to.length),
      done = L.filter(r => cnt(r) >= r.to.length);
    const li = r => {
      const n = cnt(r);
      return `<li data-icreq="${r.id}"><div><span class="ic-type t-${r.type}">${TYPES[r.type]}</span><b>${esc(r.title)}</b><small>${when(r.at)} · 👁 ${readN(r)}/${r.to.length} okudu${r.foto ? ' · 📷' : ''}</small></div><div class="ic-prog"><b>${n}/${r.to.length}</b><div class="ab-bar"><i style="width:${(n * 100) / r.to.length}%"></i></div></div></li>`;
    };
    if (!L.length) return `<li class="sempty">${q ? 'Aramaya uyan talep yok.' : 'Henüz talep yok.'}</li>`;
    return (
      (open.length ? `<li class="rq-sep">Dönüş bekleniyor · ${open.length}</li>` + open.map(li).join('') : '') +
      (done.length ? `<li class="rq-sep">Tamamlananlar · ${done.length}</li>` + done.map(li).join('') : '')
    );
  }
  const myReqs = () => D.requests.filter(r => r.to.includes('me')).sort((a, b) => b.at.localeCompare(a.at));
  /* --- ekler: fotoğraf, belge, dosya (sunumda cihazda saklanır; gerçek sürümde buluta yüklenir) --- */
  const ATT_MAX = 2 * 1024 * 1024;
  const fsz = n =>
    n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const extOf = n => {
    const m = String(n || '').match(/\.([a-z0-9]{1,5})$/i);
    return m ? m[1].toLocaleUpperCase('tr-TR') : 'DOSYA';
  };
  function attHtml(L, del) {
    if (!L || !L.length) return '';
    return `<div class="att-list">${L.map((a, i) => {
      const im = /^image\//.test(a.type);
      return `<div class="att${im ? ' img' : ''}">${im ? `<button type="button" class="att-th" data-attview="${i}" data-attsrc="${del ? 'form' : ''}" aria-label="${esc(a.name)} büyüt"><img src="${a.data}" alt=""></button>` : `<a class="att-f" href="${a.data}" download="${esc(a.name)}"><span class="att-ext">${esc(extOf(a.name))}</span><span class="att-n"><b>${esc(a.name)}</b><small>${fsz(a.size)} · indir</small></span></a>`}${del ? `<button type="button" class="att-x" data-attdel="${i}" aria-label="Kaldır">×</button>` : ''}</div>`;
    }).join('')}</div>`;
  }
  function attBox(L, title, hint) {
    return `<div class="box"><h2 style="font-size:17px">${title}</h2><p class="hint" style="margin:2px 0 0">${hint}</p>${attHtml(L, true)}<div class="att-act"><label class="btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Fotoğraf çek<input type="file" accept="image/*" capture="environment" data-attin hidden></label><label class="btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12.5 12.6 20a5 5 0 0 1-7.1-7.1L13 5.4a3.4 3.4 0 0 1 4.8 4.8l-7.4 7.4a1.7 1.7 0 0 1-2.4-2.4L15 8.3"/></svg>Belge / dosya<input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx" data-attin hidden></label></div></div>`;
  }
  function readAtt(file) {
    return new Promise(res => {
      const fr = new FileReader();
      fr.onerror = () => res(null);
      if (/^image\//.test(file.type) && !/svg|gif/.test(file.type)) {
        fr.onload = () => {
          const im = new Image();
          im.onload = () => {
            const k = Math.min(1, 1600 / Math.max(im.width, im.height)),
              c = document.createElement('canvas');
            c.width = Math.round(im.width * k);
            c.height = Math.round(im.height * k);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            const d = c.toDataURL('image/jpeg', 0.72);
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
  function attView(src, name) {
    let v = $('attView');
    if (!v) {
      v = document.createElement('div');
      v.id = 'attView';
      v.className = 'att-view';
      v.setAttribute('role', 'dialog');
      document.body.appendChild(v);
      v.addEventListener('click', e => {
        if (!e.target.closest('a')) v.hidden = true;
      });
    }
    v.innerHTML = `<img src="${src}" alt=""><div class="att-vb"><a class="btn" href="${src}" download="${esc(name)}">İndir</a><button type="button" class="btn">Kapat</button></div>`;
    v.hidden = false;
  }
  const answered = (r, id) => !!(D.responses[r.id] || {})[id];
  const unreadFor = id => {
    const L = D.messages[id] || [],
      seen = (D.seen || {})[(D.role === 'bs' ? 'bs:' : 'mg:') + id] || '';
    return L.filter(m => m.from !== (D.role === 'bs' ? 'bs' : 'magaza') && m.at > seen).length;
  };
  function markSeen(id) {
    D.seen = D.seen || {};
    D.seen[(D.role === 'bs' ? 'bs:' : 'mg:') + id] = new Date().toISOString();
    save();
  }
  function chip(ok, label, t) {
    return ok == null
      ? `<span class="ic-chip">• ${label}${t ? ' ' + t : ''}</span>`
      : `<span class="ic-chip ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${label}${ok && t ? ' ' + t : ''}</span>`;
  }
  /* Mağaza rehberi: bimVeri.magazalar listesinden kod, ad, mahalle, ilçe ya da il ile arama */
  const MG = () => (window.__mg && window.__mg.var() ? window.__mg : null);
  function mgAdres(name, hm) {
    const M = MG(),
      o = M && M.bul(name);
    if (!o) return '';
    return `<p class="mg-adr"${hm ? ` style="margin:${hm}"` : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>${esc(o.adres)}${o.bk ? `<small>Bölge ${esc(o.bk)} · ${esc(M.bolge(o.bk))}</small>` : ''}</span><a href="${esc(M.harita(o))}" target="_blank" rel="noopener">Harita</a></p>`;
  }
  function rhRows(L) {
    const M = MG(),
      my = window.__mg.kodOf(myName());
    return L.map(
      o =>
        `<li><div><b>${esc(o.ad)}${o.kod ? ` <span class="rh-kod">${esc(o.kod)}</span>` : ''}${o.yeni ? ' <span class="stag">Yeni</span>' : ''}${D.role === 'magaza' && (o.kod ? o.kod === my : o === MG().bul(myName())) ? ' <em class="rh-me">Bizim mağaza</em>' : ''}</b><small>${esc(o.adres)}</small>${o.bk ? `<small>${nrm(o.il) !== nrm(M.bolge(o.bk)) ? esc(o.il) + ' · ' : ''}Bölge ${esc(o.bk)} · ${esc(M.bolge(o.bk))}</small>` : ''}</div><a class="btn small" href="${esc(M.harita(o))}" target="_blank" rel="noopener">Harita</a></li>`
    ).join('');
  }
  let rhIl = '';
  function rhIller() {
    const M = MG(),
      m = {};
    M.tumu().forEach(o => {
      const k = nrm(o.il);
      if (k && !m[k]) m[k] = o.il;
    });
    return Object.entries(m).sort((a, b) => a[1].localeCompare(b[1], 'tr'));
  }
  function rhDef() {
    if (rhIl) {
      const M = MG(),
        L = M.tumu()
          .filter(x => nrm(x.il) === rhIl)
          .sort((a, b) => String(a.yer).localeCompare(String(b.yer), 'tr'));
      return { t: `${esc((L[0] || {}).il || '')} · ${L.length} mağaza`, L };
    }
    const M = MG(),
      g = giris(),
      o = D.role === 'magaza' ? M.bul(myName()) : null,
      bk = o ? o.bk : (g && M.bolgeBul(g.bolge || g.depo || '')) || (M.bul(window.__MGDEF) || {}).bk || '',
      L = M.hepsi().filter(x => x.bk === bk);
    if (o) {
      if (!L.includes(o)) L.unshift(o);
      L.sort((a, b) => (b === o) - (a === o));
    }
    return { t: `${esc(M.bolge(bk))} bölgesi · ${L.length} mağaza`, L };
  }
  function rehberPage() {
    const M = MG();
    if (!M)
      return (
        head('Mağaza rehberi', true) +
        '<div class="box"><p class="hint" style="margin:0">Mağaza listesi henüz yüklenmedi.</p></div>'
      );
    const d = rhDef();
    return (
      head('Mağaza rehberi', true) +
      `<div class="box"><p class="hint" style="margin:0">Listede ${M.tumSay().toLocaleString('tr-TR')} mağaza var · ${M.bolgeSay()} bölge · ${M.ilSay()} il</p><label class="rq-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="rhQ" type="search" autocomplete="off" placeholder="Şehir, ilçe, mağaza adı ya da kodu ara" aria-label="Mağaza ara"></label>
    <label class="rh-il">Göster<select id="rhIl"><option value="">Kendi bölgem</option>${rhIller()
      .map(([k, v]) => `<option value="${esc(k)}"${rhIl === k ? ' selected' : ''}>${esc(v)}</option>`)
      .join(
        ''
      )}</select></label><p class="gr-lbl" id="rhT" style="margin:12px 0 4px">${d.t}</p><ul class="rh-list" id="rhL">${rhRows(d.L.slice(0, 40))}</ul><p class="hint" id="rhMore" style="margin:6px 0 0"${d.L.length > 40 ? '' : ' hidden'}>İlk 40 mağaza gösteriliyor. Aramayla ya da il seçerek daralt.</p></div>`
    );
  }
  function head(title, back) {
    return `<div class="box ic-head">${back ? `<button type="button" class="btn small" data-icgo="home">‹ Geri</button>` : ''}<h2>${title}</h2></div>`;
  }
  /* Akşam raporu portaldan: BS raporu sekmesindeki metin mağaza ⇄ BS sohbetine rapor kartı olarak düşer; aynı gün yeniden gönderilirse güncellenir. Mesai kilidi rapora uygulanmaz. */
  const BSK = {
    rapor: '📋 Akşam raporu',
    skt: '✅ Sabah SKT dönüşü',
    iade: '📦 Kontrol / iade dönüşü',
    liste: '📊 Bilgi listesi'
  };
  window.__bsGonder = (tur, key, text) => {
    const L = (D.messages.me = D.messages.me || []),
      g = giris(),
      k = tur + ':' + key,
      old = L.find(m => m.rapor === k),
      at = new Date().toISOString();
    if (old) {
      old.text = text;
      old.at = at;
      old.guncel = true;
      L.splice(L.indexOf(old), 1);
      L.push(old);
    } else L.push({ from: 'magaza', text, at, rapor: k, tur, by: g ? g.ad : '' });
    save();
    if (window.__renderIc) window.__renderIc();
    updBell();
    return old ? 2 : 1;
  };
  window.__rpPortal = (text, date) => window.__bsGonder('rapor', date || today(), text);
  function bubbleList(id) {
    const L = D.messages[id] || [],
      mine = D.role === 'bs' ? 'bs' : 'magaza';
    return `<div class="ic-chat" id="icChat">${L.length ? L.map(m => `<div class="ic-msg ${m.from === mine ? 'me' : 'them'}${m.rapor ? ' rp' : ''}">${m.rapor ? `<p class="ic-rp">${BSK[m.tur || 'rapor']}${m.guncel ? ' · güncellendi' : ''}${m.by ? ' · ' + esc(m.by) : ''}</p>` : ''}<div>${esc(m.text)}</div><small>${m.from === 'bs' ? 'BS' : esc(S(id).name)} · ${when(m.at)}</small></div>`).join('') : '<p class="hint" style="text-align:center;margin:20px 0">Henüz mesaj yok.</p>'}</div>
  ${kilitli() ? kilitBar() : `<div class="ic-send"><input id="icMsg" autocomplete="off" placeholder="Mesaj yaz…" aria-label="Mesaj"><button type="button" class="btn primary" id="icMsgGo" data-icchat="${id}" aria-label="Gönder">➤</button></div>`}`;
  }
  function respTable(r) {
    const R = D.responses[r.id] || {},
      rows = [];
    if (r.type === 'kontrol') {
      r.to.forEach(id => {
        const x = R[id];
        r.items.forEach((it, i) => {
          const v = x && x.items[i];
          rows.push([
            S(id).name,
            it.code,
            it.name,
            v ? (RCST.find(z => z[0] === v.st) || [, ''])[1] : 'Yanıt yok',
            v && v.qty != null ? String(v.qty) : ''
          ]);
        });
      });
      return { cols: ['Mağaza', 'Ürün kodu', 'Ürün adı', 'Durum', 'Adet'], rows };
    }
    if (r.type === 'bilgi') {
      r.to.forEach(id => {
        const x = R[id];
        if (x) x.rows.forEach(rw => rows.push([S(id).name, ...r.cols.map((_, c) => rw[c] || '')]));
        else rows.push([S(id).name, ...r.cols.map((_, c) => (c === 0 ? 'Yanıt yok' : ''))]);
      });
      return { cols: ['Mağaza', ...r.cols], rows };
    }
    r.to.forEach(id => {
      const x = R[id];
      rows.push([
        S(id).name,
        x ? (x.done ? 'Yapıldı' : 'Yapılmadı') : 'Yanıt yok',
        x && !x.done ? x.reason || '' : '',
        x ? when(x.at) : ''
      ]);
    });
    return { cols: ['Mağaza', 'Durum', 'Neden yapılmadı', 'Saat'], rows };
  }

  function reqTable(r) {
    const T = respTable(r);
    if (!(ui.page === 'req' && ui.id === r.id && ui.sel)) return T;
    const names = ui.sel.map(id => S(id).name);
    return { cols: T.cols, rows: T.rows.filter(rw => names.includes(rw[0])) };
  }
  /* --- ekranlar --- */
  function render() {
    {
      const g = giris();
      D.role = g && g.tip === 'bs' ? 'bs' : g && g.tip === 'depo' ? 'depo' : g && g.tip === 'pm' ? 'pm' : 'magaza';
      if (g && g.tip === 'bs' && (D.bsAd !== g.ad || D.bsBolge !== (g.bolge || ''))) {
        D.bsAd = g.ad;
        D.bsBolge = g.bolge || '';
        save();
      }
      if (g && g.tip === 'pm' && !['GM', 'BM'].includes(g.unvan) && D.pmAd !== g.ad) {
        D.pmAd = g.ad;
        save();
      }
    }
    document
      .querySelectorAll('[data-icrole]')
      .forEach(b => b.setAttribute('aria-pressed', b.dataset.icrole === D.role));
    const el = $('icBody');
    let h = '';
    if (ui.page === 'rehber') {
      h += rehberPage();
    } else if (ui.page === 'kurum') {
      h += kurumPage();
    } else if (ui.page === 'kayit') {
      h += kayitPage();
    } else if (ui.page === 'yuk') {
      h += yukPage();
    } else if (ui.page === 'mgyeni') {
      h += mgyPage();
    } else if (D.role === 'pm' && kad() !== 'pm') {
      if (ui.page === 'ust' && ui.id) {
        const key = ui.id,
          p = ustKimi(key);
        if (!$('icView').hidden) markUst(key);
        h +=
          head(esc(p.ad), true) +
          `<div class="box"><p class="hint" style="margin:0">${esc(p.t)}</p>${ustChat(key)}</div>`;
      } else {
        ui = { page: 'home' };
        h += ustPage();
      }
    } else if (D.role === 'pm') {
      if (ui.page === 'ust' && ui.id) {
        const key = ui.id,
          p = ustKimi(key);
        if (!$('icView').hidden) markUst(key);
        h +=
          head(esc(p.ad), true) +
          `<div class="box"><p class="hint" style="margin:0">${esc(p.t)}</p>${ustChat(key)}</div>`;
      } else if (ui.page === 'pmchat') {
        const k = ui.id,
          p = bsPeople().find(x => nrm(x.ad) === k) || { ad: 'BS' };
        if (!$('icView').hidden) markPm(k);
        h +=
          head(esc(p.ad), true) +
          `<div class="box"><p class="hint" style="margin:0">Bölge sorumlusu${p.bolge ? ' · ' + esc(p.bolge) : ''}</p>${pmChat(k)}</div>`;
      } else if (ui.page === 'bsgrup') {
        if (!$('icView').hidden) markBs();
        h +=
          head('BS grubu', true) +
          `<div class="box"><h2>Bölge sorumluları</h2><p class="hint" style="margin:2px 0 0">${esc([pmName() + ' (PM)', ...bsPeople().map(p => p.ad)].join(', '))} · Mağazalar bu grubu görmez</p>${bsList()}</div>`;
      } else {
        const P = bsPeople(),
          tot = P.reduce((a, p) => a + pmUnreadOf(nrm(p.ad)).length, 0),
          bu = bsUnread().length,
          Lg = D.bsgrup[D.bsgrup.length - 1];
        const nm = P.reduce((a, p) => a + (p.mg || 0), 0),
          f = n => n.toLocaleString('tr-TR');
        h += `<div class="ic-kpi"><div><b>${P.length}</b><span>Bölge sorumlusu</span></div><div><b>${nm}</b><span>Mağaza</span></div><div><b>${tot}</b><span>Yeni mesaj</span></div></div>`;
        h += `<details class="box sect yp-box"><summary><h2>Kurum yapısı</h2></summary>${kurumIc(P, nm)}</details>`;
        h += ustRow();
        h += `<div class="box ic-bsrow" data-icgo="bsgrup"><div class="ic-av gm">${GRP_IC}</div><div class="ic-sm"><b>BS grubu</b><small>${Lg ? esc(Lg.from.split(' ')[0] + ': ' + Lg.text) : "Tüm BS'lere duyuru ve sohbet"}</small></div>${bu ? `<span class="ic-unread">${bu}</span>` : '<span class="ic-go">›</span>'}</div>`;
        if (window.__grafBolge) h += window.__grafBolge(P);
        h += `<div class="box"><h2>Bölge sorumlularım</h2><ul class="ic-stores">${P.map(p => {
          const k = nrm(p.ad),
            L = D.pmMsg[k] || [],
            l = L[L.length - 1],
            u = pmUnreadOf(k).length;
          return `<li data-pmbs="${esc(k)}"><div class="ic-av">${esc(p.ad[0])}</div><div class="ic-sm"><b>${esc(p.ad)}</b><small>${esc((p.bolge || 'Bölge sorumlusu') + (p.mg ? ' · ' + p.mg + ' mağaza' : ''))}${l ? '<br>' + esc((l.from === 'pm' ? 'Sen: ' : '') + l.text) : ''}</small></div>${u ? `<span class="ic-unread">${u}</span>` : '<span class="ic-go">›</span>'}</li>`;
        }).join('')}</ul></div>`;
      }
    } else if (D.role === 'depo') {
      if ((ui.page === 'ik' || ui.page === 'ikv') && !isIk()) {
        ui = { page: 'home' };
      }
      if (ui.page === 'ik') {
        h += ikPage();
      } else if (ui.page === 'ikv') {
        const x = D.ise.find(y => y.id === ui.id);
        if (!x) {
          ui = { page: 'ik' };
          return render();
        }
        h += iseView(x, true);
      } else if (isIk()) {
        h += kayitRowBox() + yukRowBox() + mgyRowBox() + ikRowBox();
        h += `<p class="hint" style="text-align:center;margin:4px 0 0">Sevkiyat girişini depo sevkiyat sorumlusu yapar.</p>`;
      } else {
        const A = D.sevk
            .filter(x => x.tarih >= today())
            .sort((a, b) => (a.tarih + a.saat).localeCompare(b.tarih + b.saat)),
          nT = A.filter(x => x.tarih === today()).length,
          nY = A.filter(x => x.tarih === dstr(1)).length;
        dpSel = dpSel.filter(id => D.stores.some(x => x.id === id));
        h += `<div class="ic-kpi"><div><b>${nT}</b><span>Bugün araç</span></div><div><b>${nY}</b><span>Yarın araç</span></div><div><b>${D.stores.length}</b><span>Mağaza</span></div></div>`;
        h += `<div class="box"><h2>Yeni sevkiyat</h2><div class="sf" style="margin-top:8px"><div><div class="gr-lbl">Araçtaki mağazalar <small style="font-weight:600">· teslim sırasıyla dokun</small></div><label class="rq-search" style="margin-bottom:8px"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="dpQ" type="search" autocomplete="off" placeholder="Mağaza ara: ad, kod ya da adres"></label><div class="ic-pick" id="dpPick">${D.stores
          .map(x => {
            const o = MG() && MG().bul(x.name);
            return `<button type="button" data-dpst="${x.id}" data-q="${esc(o ? o.adres : '')}" aria-pressed="${dpSel.includes(x.id)}">${dpSel.includes(x.id) ? `<i class="dp-no">${dpSel.indexOf(x.id) + 1}</i>` : ''}${esc(x.name)}</button>`;
          })
          .join('')}</div><p class="hint" id="dpNone" style="margin:6px 0 0" hidden>Bu aramayla mağaza bulunamadı.</p>
      ${
        dpSel.length
          ? `<ol class="sk-dur dp-sec">${dpSel
              .map(id => {
                const o = MG() && MG().bul(S(id).name);
                return `<li><b>${esc(S(id).name)}</b>${o ? `<small>${esc(o.adres)}</small>` : ''}</li>`;
              })
              .join('')}</ol>`
          : '<p class="hint" style="margin:8px 0 0">Bir araç genelde 3-4 mağazaya gider. Mağazalara teslim sırasıyla dokun.</p>'
      }</div>
      <div class="srow2"><label>Gün<input type="date" id="skT" value="${dstr(1)}"></label><label>Saat<input type="time" id="skS" value="07:30"></label></div>
      <div class="srow2"><label>Araç plakası<input id="skP" autocomplete="off" placeholder="38 ABC 123" style="text-transform:uppercase"></label><label>Şoför<input id="skD" autocomplete="off" placeholder="Ad Soyad"></label></div>
      <label>Not (isteğe bağlı)<input id="skN" autocomplete="off" placeholder="Örn. Soğuk zincir önce indirilsin"></label>
      <button type="button" class="btn primary" id="skAdd"${dpSel.length ? '' : ' disabled'}>${dpSel.length ? `Aracı kaydet (${dpSel.length} mağaza)` : 'Önce mağaza seç'}</button></div></div>`;
        let last = '';
        h += `<div class="box"><h2>Planlanan sevkiyatlar</h2>${
          A.map(x => {
            const d =
              x.tarih !== last
                ? `<p class="dp-day">${gunAd(x.tarih)}${x.tarih > dstr(1) ? '' : ' · ' + fmtD(x.tarih)}</p>`
                : '';
            last = x.tarih;
            return d + sevkCard(x, true, true);
          }).join('') || '<p class="hint" style="margin:6px 0 0">Henüz sevkiyat girilmedi.</p>'
        }</div>`;
        h += `<p class="hint" style="text-align:center;margin:4px 0 0">Girdiğin bilgiyi o mağazanın MS ve MSY'si görür; personel, BS izin verdiyse görür.</p>`;
      }
    } else if (D.role === 'bs') {
      if (ui.page === 'home') {
        const st = D.stores,
          sk = st.filter(s => msktOf(s.id)).length,
          rp = st.filter(s => raporOf(s.id)).length,
          open = D.requests.filter(r => r.to.some(id => !answered(r, id))).length;
        {
          const I = ist(),
            ft = st.reduce((a, s) => a + fire7(s.id, s.name).t, 0),
            K = [
              I.skt ? `<div><b>${sk}/${st.length}</b><span>Sabah SKT</span></div>` : '',
              I.rapor ? `<div><b>${rp}/${st.length}</b><span>Akşam raporu</span></div>` : '',
              `<div><b>${open}</b><span>Açık talep</span></div>`,
              `<div><b>${Math.round(ft / 1000).toLocaleString('tr-TR')}<small style="font-size:.6em"> bin ₺</small></b><span>Fire 7 gün</span></div>`
            ].filter(Boolean);
          h += `<div class="ic-kpi${K.length > 3 ? ' k4' : ''}" style="grid-template-columns:repeat(${K.length},1fr)">${K.join('')}</div>`;
        }
        h += `<div class="ic-acts"><button type="button" class="btn primary" data-icgo="new">+ Talep gönder</button><button type="button" class="btn" data-icgo="svnew">Savunma iste</button></div>`;
        {
          const k = nrm(giris().ad),
            Lp = (D.pmMsg[k] || []).slice(-1)[0],
            up = pmUnreadOf(k).length;
          h += `<div class="box ic-bsrow" data-pmbs="${esc(k)}"><div class="ic-av pm">PM</div><div class="ic-sm"><b>PM · ${esc(pmName())}</b><small>${Lp ? esc((Lp.from === 'bs' ? 'Sen: ' : '') + Lp.text) : 'Yöneticinle birebir sohbet'}</small></div>${up ? `<span class="ic-unread">${up}</span>` : '<span class="ic-go">›</span>'}</div>`;
        }
        h += kayitRowBox() + yukRowBox();
        {
          const L = D.bsgrup[D.bsgrup.length - 1],
            u = bsUnread().length;
          h += `<div class="box ic-bsrow" data-icgo="bsgrup"><div class="ic-av gm">${GRP_IC}</div><div class="ic-sm"><b>BS grubu</b><small>${L ? esc(L.from.split(' ')[0] + ': ' + L.text) : 'Diğer bölge sorumlularıyla sohbet'}</small></div>${u ? `<span class="ic-unread">${u}</span>` : '<span class="ic-go">›</span>'}</div>`;
        }
        const SV = D.savunma.slice().sort((a, b) => !!a.sonuc - !!b.sonuc || b.at.localeCompare(a.at)),
          svWait = SV.filter(x => !x.sonuc).length;
        h += `<div class="ic-seg bs-seg"><button type="button" data-bstab="m" aria-pressed="${bsTab === 'm'}">Mağazalar</button><button type="button" data-bstab="t" aria-pressed="${bsTab === 't'}">Talepler${open ? ` <em>${open}</em>` : ''}</button><button type="button" data-bstab="s" aria-pressed="${bsTab === 's'}">Savunmalar${svWait ? ` <em>${svWait}</em>` : ''}</button></div>`;
        if (bsTab === 'm') {
          const I = ist(),
            Y = x =>
              `<span class="pn-i ${x === true ? 'ok' : x === false ? 'no' : 'na'}">${x === true ? '✓' : x === false ? '✗' : '–'}</span>`;
          h += `<div class="box pano"><div class="gf-head"><h2>Mağaza panosu</h2><span class="hint" style="margin:0">${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span></div>
        <div class="pn-wrap"><table class="pn"><thead><tr><th>Mağaza</th>${I.skt ? '<th>SKT</th>' : ''}${I.rapor ? '<th>Rapor</th>' : ''}<th>Talep</th><th>Fire 7g</th><th>Ziyaret</th></tr></thead><tbody>${bsSorted()
          .map(s => {
            const u = unreadFor(s.id),
              m = msktOf(s.id),
              r = raporOf(s.id),
              pend = D.requests.filter(q => q.to.includes(s.id) && !answered(q, s.id)).length,
              f = fire7(s.id, s.name),
              z = lastZ(s.id),
              zs = z ? zSkor(z.puan) : null;
            return `<tr data-icstore="${s.id}"><td><b>${esc(s.name)}</b>${u ? ` <span class="ic-unread sm">${u}</span>` : ''}${(o =>
              o
                ? `<small>${esc(
                    String(o.yer || o.il)
                      .split('/')[0]
                      .trim()
                  )}</small>`
                : '')(
              MG() && MG().bul(s.name)
            )}${s.id === 'me' ? '<small>bu cihaz</small>' : ''}</td>${I.skt ? `<td>${Y(!!m)}${m ? `<small class="pn-t">${hm(m)}</small>` : ''}</td>` : ''}${I.rapor ? `<td>${r ? Y(true) : new Date().getHours() >= 20 ? Y(false) : '<span class="pn-i na" title="Akşam 20.00\'den sonra beklenir">–</span>'}</td>` : ''}<td>${pend ? `<span class="pn-n warn">${pend}</span>` : Y(true)}</td><td class="pn-f">${Math.round(f.t).toLocaleString('tr-TR')} ₺</td><td>${zs != null ? `<span class="pn-z ${zCls(zs)}">%${zs}</span>` : '<span class="pn-i na">–</span>'}</td></tr>`;
          })
          .join('')}</tbody></table></div>
        ${(() => {
          const E = eksikler(),
            hz = (D.hatirlat || {})[today()];
          return E.length
            ? `<div class="pn-rem"><span>${(() => {
                const nS = E.filter(x => x.w.includes('sabah SKT')).length,
                  nR = E.filter(x => x.w.includes('akşam raporunu')).length;
                return [nS ? `<b>${nS} mağaza</b> sabah SKT` : '', nR ? `<b>${nR} mağaza</b> akşam raporunu` : '']
                  .filter(Boolean)
                  .join(', ');
              })()} göndermedi.${hz ? `<br><small class="hint" style="margin:0">Son hatırlatma ${hm(hz)}</small>` : ''}</span><button type="button" class="btn primary" id="pnRem">Eksiklere hatırlat</button></div>`
            : `<p class="hint" style="margin:8px 0 0;color:var(--green)">✓ Bugün eksik dönüş yok.</p>`;
        })()}
        <p class="hint" style="margin:8px 0 0">Eksiği olan mağazalar en üstte. Satıra dokun, mağazanın sayfası açılsın. Fire ve ziyaret puanları diğer mağazalar için örnek veridir.</p></div>`;
        } else if (bsTab === 't') {
          h += `<div class="box"><label class="rq-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="bsQ" type="search" autocomplete="off" placeholder="Talep ara: başlık, ürün, kod, tarih" value="${esc(bsQ)}"></label><ul class="ic-reqs" id="bsReqL">${bsReqLis(bsQ)}</ul></div>`;
        } else {
          h += `<div class="box"><h2>Savunma talepleri</h2><ul class="ic-reqs">${SV.map(s => svRow(s, true)).join('') || '<li class="sempty">Henüz savunma istenmedi.</li>'}</ul></div>`;
        }
      } else if (ui.page === 'zy') {
        const f = ui.form,
          sid = ui.id;
        h +=
          head('Ziyaret formu · ' + esc(S(sid).name), true) +
          `<div class="box">${mgAdres(S(sid).name, '0 0 10px')}<p class="hint" style="margin:0">Her maddeyi işaretle; puan kendiliğinden hesaplanır (Uygun 2, Kısmen 1, Uygun değil 0).</p><ul class="zy-form">${ZK.map(([k, l]) => `<li><b>${l}</b><div class="zy-seg">${ZV.map(([v, t]) => `<button type="button" data-zk="${k}" data-zvv="${v}" class="zv${v}" aria-pressed="${f.puan[k] === v}">${t}</button>`).join('')}</div></li>`).join('')}</ul>
        <div class="zy-skor ${zCls(zSkor(f.puan))}"><b>%${zSkor(f.puan)}</b><span>${Object.keys(f.puan).length}/${ZK.length} madde işaretlendi</span></div>
        <label style="display:block;margin-top:10px">Genel not<textarea id="zyNot" class="simp" rows="3" placeholder="Örn. Depo girişi toparlanmalı">${esc(f.not || '')}</textarea></label></div>` +
          attBox(f.files, 'Fotoğraflar', 'Ziyarette çektiğin fotoğraflar (isteğe bağlı).') +
          `<div class="box rp-send"><button type="button" class="btn primary" id="zySave">Kaydet ve mağazaya gönder</button></div>`;
      } else if (ui.page === 'zyv') {
        const z = D.ziyaret.find(x => x.id === ui.id);
        if (!z) {
          ui = { page: 'home' };
          return render();
        }
        h += zView(z);
      } else if (ui.page === 'pmchat') {
        const k = ui.id;
        if (!$('icView').hidden) markPm(k);
        h +=
          head('PM · ' + esc(pmName()), true) +
          `<div class="box"><p class="hint" style="margin:0">Yöneticinle birebir sohbet · mağazalar görmez</p>${pmChat(k)}</div>`;
      } else if (ui.page === 'bsgrup') {
        if (!$('icView').hidden) markBs();
        h +=
          head('BS grubu', true) +
          `<div class="box"><h2>Bölge sorumluları</h2><p class="hint" style="margin:2px 0 0">${esc([pmName() + ' (PM)', giris().ad, ...BSLER.map(p => p.ad)].join(', '))} · Mağazalar bu grubu görmez</p>${bsList()}</div>`;
      } else if (ui.page === 'new') {
        const f = ui.form;
        h +=
          head('Yeni talep', true) +
          `<div class="box"><div class="sf">
        <div class="ic-seg">${Object.entries(TYPES)
          .map(([k, l]) => `<button type="button" data-ictype="${k}" aria-pressed="${f.type === k}">${l}</button>`)
          .join('')}</div>
        <label>Başlık<input id="icT" autocomplete="off" value="${esc(f.title)}" placeholder="${f.type === 'kontrol' ? 'Örn. Geri çağırma: ...' : f.type === 'bilgi' ? 'Örn. Eksik ürün sayımı' : 'Örn. Cumartesi sayım duyurusu'}"></label>
        <label>Mesaj<textarea id="icB" class="simp" rows="3" placeholder="Mağazalara iletmek istediğin açıklama">${esc(f.body)}</textarea></label>
        ${f.type === 'kontrol' ? `<label>Ürünler (her satıra kod ve ad)<textarea id="icItems" class="simp" rows="4" placeholder="5012 Çikolatalı gofret&#10;7781 Zeytinyağı 1 L">${esc(f.itemsTxt)}</textarea></label>` : ''}
        ${f.type === 'bilgi' ? `<label>Mağazaların dolduracağı sütunlar (virgülle)<input id="icCols" autocomplete="off" value="${esc(f.cols)}"></label>` : ''}
        <label class="check"><input type="checkbox" id="icFoto"${f.foto ? ' checked' : ''}><span>Fotoğraflı kanıt iste (mağaza fotoğraf eklemeden yanıtlayamaz)</span></label>
        <div><div class="ic-lbl">Gönderilecek mağazalar <button type="button" class="linkbtn" id="icAll">${f.to.length === D.stores.length ? 'Hiçbiri' : 'Tümü'}</button></div>
        <div class="ic-pick">${D.stores.map(s => `<button type="button" data-icto="${s.id}" aria-pressed="${f.to.includes(s.id)}">${esc(s.name)}</button>`).join('')}</div></div>
        <button type="button" class="btn primary" id="icSendReq">Gönder (${f.to.length} mağaza)</button></div></div>`;
        h = h.replace(
          /(<button type="button" class="btn primary" id="icSendReq">)/,
          '</div></div>' +
            attBox(f.files, 'Ekler', 'Mağazalara gidecek belge, fotoğraf ya da dosya (isteğe bağlı).') +
            '<div class="box"><div class="sf">$1'
        );
      } else if (ui.page === 'req') {
        const r = D.requests.find(x => x.id === ui.id);
        if (!r) {
          ui.page = 'home';
          return render();
        }
        const R = D.responses[r.id] || {},
          yes = r.to.filter(id => R[id]),
          no = r.to.filter(id => !R[id]),
          n = yes.length,
          sel = ui.sel || null,
          T = reqTable(r);
        const same = a => !!sel && sel.length === a.length && a.every(id => sel.includes(id));
        h +=
          head(esc(r.title), true) +
          `<div class="box"><span class="ic-type t-${r.type}">${TYPES[r.type]}</span><p style="margin:8px 0 0">${esc(r.body || '')}</p><p class="hint" style="margin:6px 0 0">${when(r.at)} gönderildi · ${n}/${r.to.length} mağaza dönüş yaptı · 👁 ${readN(r)}/${r.to.length} okudu${r.foto ? ' · 📷 fotoğraf kanıtı istendi' : ''}</p><div class="ab-bar" style="margin-top:8px"><i style="width:${(n * 100) / r.to.length}%"></i></div>${attHtml(r.files)}</div>
        <div class="rq-grid"><div class="box rq-col ok"><h3>Dönüş yaptı <b>${yes.length}</b></h3><ul>${
          yes
            .map(id => {
              const x = R[id];
              return `<li data-icstore="${id}"><span>${esc(S(id).name)}</span><small${x.done === false ? ' class="bad"' : ''}>${x.done === false ? 'Yapılmadı · ' : ''}${x.files && x.files.length ? '📎' + x.files.length + ' · ' : ''}${when(x.at)}</small></li>`;
            })
            .join('') || '<li class="sempty">Henüz dönüş yok.</li>'
        }</ul></div>
        <div class="box rq-col no"><h3>Dönüş yapmadı <b>${no.length}</b></h3><ul>${
          no
            .map(id => {
              const ra = readAt(r, id);
              return `<li data-icstore="${id}"><span>${esc(S(id).name)}</span><small class="${ra ? '' : 'bad'}">${ra ? '👁 Okudu ' + when(ra) : 'Okumadı'}</small></li>`;
            })
            .join('') || '<li class="sempty">Hepsi dönüş yaptı.</li>'
        }</ul>${no.length ? `<button type="button" class="btn small primary" data-icremind="${r.id}" style="width:100%;margin-top:10px">${no.length} mağazaya hatırlat</button>` : ''}</div></div>
        ${(() => {
          const W = yes.filter(id => R[id].files && R[id].files.length);
          return W.length
            ? `<div class="box"><h2>Gelen ekler</h2>${W.map(id => `<div class="att-grp"><b>${esc(S(id).name)}</b>${attHtml(R[id].files)}</div>`).join('')}</div>`
            : '';
        })()}
        <div class="box" style="padding:12px 0"><h2 style="padding:0 16px">Yanıtlar</h2>
        <div class="ic-pick rq-sel" style="padding:8px 16px 0"><button type="button" data-rqsel="all" aria-pressed="${!sel}">Tüm mağazalar</button><button type="button" data-rqsel="yes" aria-pressed="${same(yes)}">Dönüş yapanlar</button><button type="button" data-rqsel="no" aria-pressed="${same(no)}">Yapmayanlar</button></div>
        <div class="ic-pick rq-sel" style="padding:6px 16px 0">${r.to.map(id => `<button type="button" data-rqst="${id}" aria-pressed="${!!sel && sel.includes(id)}" class="${R[id] ? 'has' : 'miss'}">${R[id] ? '✓' : '○'} ${esc(S(id).name)}</button>`).join('')}</div>
        <div class="scroll" style="margin-top:10px"><table class="col-tab ic-tab"><thead><tr>${T.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${T.rows.map(rw => `<tr${/Yanıt yok/.test(rw.join('')) ? ' class="miss"' : rw.includes('Yapılmadı') ? ' class="bad"' : ''}>${rw.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${T.cols.length}" class="sempty">Seçili mağaza yok.</td></tr>`}</tbody></table></div></div>
        <div class="box rp-send"><button type="button" class="btn primary" data-icxlsx="${r.id}">Excel olarak indir${sel ? ` (${sel.length} mağaza)` : ''}</button></div>`;
      } else if (ui.page === 'svnew') {
        const f = ui.form,
          P = f.store ? staffOf(f.store) : [];
        h +=
          head('Savunma iste', true) +
          `<div class="box"><div class="sf">
        <div><div class="ic-lbl">Mağaza</div><div class="ic-pick">${D.stores.map(s => `<button type="button" data-svstore="${s.id}" aria-pressed="${f.store === s.id}">${esc(s.name)}</button>`).join('')}</div></div>
        ${f.store ? `<div><div class="ic-lbl">Kimden?</div>${P.length ? `<div class="ic-pick">${P.map(p => `<button type="button" data-svkisi="${p.id}" aria-pressed="${f.kisi === p.id}">${esc(p.ad)} · ${KISA[p.unvan] || ''}</button>`).join('')}</div>` : '<p class="hint" style="margin:0">Bu mağazada kayıtlı çalışan yok (Ayarlar → Çalışanlar).</p>'}</div>` : ''}
        <div><div class="ic-lbl">Olay</div><div class="ic-pick">${OLAY.map(o => `<button type="button" data-svolay="${esc(o)}" aria-pressed="${f.olay === o}">${esc(o)}</button>`).join('')}</div></div>
        <div class="srow2"><label>Olay tarihi<input type="date" id="svT" value="${esc(f.tarih)}"></label><label>Son yanıt tarihi<input type="date" id="svSon" value="${esc(f.son)}"></label></div>
        <label>Olayın açıklaması<textarea id="svA" class="simp" rows="4" placeholder="Ne oldu, ne zaman oldu? Savunması istenen kişi bu metni görecek.">${esc(f.aciklama)}</textarea></label>
        <p class="hint" style="margin:0">Talep sadece seçtiğin kişiye gider, mağazadaki diğer çalışanlar görmez.</p>
        <button type="button" class="btn primary" id="svSend">Savunma talebini gönder</button></div></div>`;
      } else if (ui.page === 'sv') {
        const s = D.savunma.find(x => x.id === ui.id);
        if (!s) {
          ui = { page: 'home' };
          return render();
        }
        const d = svDurum(s),
          f = ui.form || (ui.form = { karar: '', not: '' });
        h +=
          head('Savunma', true) +
          `<div class="box"><div class="sv-who"><div class="ic-av">${esc(s.ad[0])}</div><div class="ic-sm"><b>${esc(s.ad)}</b><small>${UNVAN[s.unvan] || ''} · ${esc(S(s.store).name)}</small></div><span class="ic-st sv-${d[0]}">${d[1]}</span></div>${svInfo(s)}</div>`;
        h += s.cevap
          ? `<div class="box"><h2>Savunma</h2><p class="sv-txt sv-ans">${esc(s.cevap.text)}</p><p class="hint" style="margin:8px 0 0">${esc(s.ad)} · ${when(s.cevap.at)} gönderdi</p></div>`
          : `<div class="box"><p class="hint" style="margin:0">${d[0] === 'gec' ? 'Son yanıt tarihi geçti, savunma gelmedi.' : 'Savunma henüz gelmedi. Kişi uygulamaya girdiğinde bildirim görür.'}</p></div>`;
        if (s.sonuc)
          h += `<div class="box"><h2>Sonuç</h2><p style="margin:6px 0 0;font-weight:700">${esc(s.sonuc.karar)}</p>${s.sonuc.not ? `<p class="hint" style="margin:4px 0 0">${esc(s.sonuc.not)}</p>` : ''}<p class="hint" style="margin:6px 0 0">${when(s.sonuc.at)} kapatıldı</p></div>`;
        else if (s.cevap)
          h += `<div class="box"><h2>Sonuç</h2><div class="ic-pick" style="margin-top:10px">${SONUC.map(k => `<button type="button" data-svkarar="${esc(k)}" aria-pressed="${f.karar === k}">${esc(k)}</button>`).join('')}</div><div class="sf" style="margin-top:10px"><label>Not (isteğe bağlı)<textarea id="svNot" class="simp" rows="2">${esc(f.not)}</textarea></label><button type="button" class="btn primary" id="svClose">Dosyayı kapat</button></div></div>`;
        h += `<div class="box rp-send"><button type="button" class="btn${s.cevap ? ' primary' : ''}" data-svprint="${s.id}">Yazdır / PDF</button>${!s.cevap ? `<button type="button" class="btn primary" data-svremind="${s.id}">Hatırlat</button>` : ''}</div>`;
      } else if (ui.page === 'store') {
        const s = S(ui.id),
          m = msktOf(s.id),
          r = raporOf(s.id);
        markSeen(s.id);
        const pend = D.requests.filter(q => q.to.includes(s.id) && !answered(q, s.id));
        h +=
          head(esc(s.name), true) +
          `<div class="box">${mgAdres(s.name, '0 0 10px')}<div class="ic-chips">${ist().skt ? chip(!!m, 'Sabah SKT', m && hm(m)) : ''}${ist().rapor ? (r ? chip(true, 'Akşam raporu') : new Date().getHours() >= 20 ? chip(false, 'Akşam raporu') : chip(null, 'Akşam raporu', "20.00'den sonra")) : ''}</div>${r && ist().rapor ? `<p class="hint" style="margin:8px 0 0">Bugün ciro ${Math.round(r.ciro).toLocaleString('tr-TR')} ₺${r.mus != null ? ', müşteri ' + r.mus : ''}</p>` : ''}${pend.length ? `<p class="hint" style="margin:8px 0 0;color:#8A5A00;font-weight:700">Bekleyen: ${pend.map(q => esc(q.title)).join(', ')}</p>` : ''}</div>
        ${zBox(s.id)}${window.__grafStore ? window.__grafStore(s.id, s.name) : ''}${
          s.id === 'me' && D.izin.length
            ? `<div class="box"><h2>İzin talepleri</h2><ul class="iz-list">${D.izin
                .slice()
                .sort((a, b) => b.at.localeCompare(a.at))
                .slice(0, 5)
                .map(x => izRow(x, false))
                .join('')}</ul><p class="hint" style="margin:6px 0 0">Onayı mağazada MS ya da MSY verir.</p></div>`
            : ''
        }
        ${vdBox(s.id)}<div class="box"><h2>Sevkiyat</h2>${
          sevkOf(s.id)
            .map(x => sevkCard(x, false, false, s.id))
            .join('') || '<p class="hint" style="margin:6px 0 0">Planlanmış sevkiyat yok.</p>'
        }<p class="hint" style="margin:8px 0 0">Araç bilgisini depo girer.</p></div>
        <div class="box"><h2>Sohbet</h2>${bubbleList(s.id)}</div>`;
      }
    } else {
      const me = D.stores[0];
      if (isStaff() && !['svans', 'grup', 'izin', 'yuk'].includes(ui.page)) ui.page = 'grup';
      if (['ise', 'isen', 'isev'].includes(ui.page) && !canIse()) ui.page = 'home';
      if (ui.page === 'ise') {
        h += isePage();
      } else if (ui.page === 'isen') {
        h += iseNewPage();
      } else if (ui.page === 'isev') {
        const x = D.ise.find(y => y.id === ui.id && y.store === 'me');
        if (!x) {
          ui = { page: 'ise' };
          return render();
        }
        h += iseView(x, false);
      } else if (ui.page === 'izin') {
        h += izPage();
      } else if (ui.page === 'zyv') {
        const z = D.ziyaret.find(x => x.id === ui.id);
        if (z) {
          if (!$('icView').hidden && !z.goruldu) {
            z.goruldu = new Date().toISOString();
            save();
          }
          h += zView(z);
        } else {
          ui.page = 'home';
          return render();
        }
      } else if (ui.page === 'grup') {
        if (!$('icView').hidden) markGrup();
        h +=
          (isStaff() ? svAlerts() + sevkBox('me') + izRowBox() + yukRowBox() : head('Mağaza grubu', true)) +
          `<div class="box"><h2>${esc(myName())} grubu</h2><p class="hint" style="margin:2px 0 0">${
            staffOf('me')
              .map(p => esc(p.ad))
              .join(', ') || 'Mağaza çalışanları'
          } · BS bu grubu görmez</p>${grupList()}</div>` +
          (isStaff() ? svMine() : '');
      } else if (ui.page === 'home') {
        const L = myReqs(),
          u = unreadFor('me'),
          wait = L.filter(r => !answered(r, 'me')).length;
        h += svAlerts();
        {
          const I = ist(),
            K = [
              `<div><b>${wait}</b><span>Yanıt bekleyen</span></div>`,
              I.skt ? `<div><b>${myMskt() ? '✓' : '✗'}</b><span>Sabah SKT</span></div>` : '',
              I.rapor ? `<div><b>${myRapor() ? '✓' : '✗'}</b><span>Akşam raporu</span></div>` : ''
            ].filter(Boolean);
          h += `<div class="ic-kpi" style="grid-template-columns:repeat(${K.length},1fr)">${K.join('')}</div>`;
        }
        h += `<div class="box ic-bsrow" data-icgo="grup"><div class="ic-av gm">${GRP_IC}</div><div class="ic-sm"><b>Mağaza grubu</b><small>${esc((D.grup.slice(-1)[0] || {}).from ? D.grup.slice(-1)[0].from + ': ' + (D.grup.slice(-1)[0].share ? 'BS paylaşımı · ' + D.grup.slice(-1)[0].share.title : D.grup.slice(-1)[0].text) : 'Çalışanlarla sohbet')}</small></div>${grupUnread().length ? `<span class="ic-unread">${grupUnread().length}</span>` : '<span class="ic-go">›</span>'}</div>`;
        h += izRowBox() + iseRowBox() + yukRowBox();
        {
          const z = lastZ('me');
          if (z) {
            const sk = zSkor(z.puan);
            h += `<div class="box ic-bsrow" data-zyv="${z.id}"><div class="ic-av zy ${zCls(sk)}">%${sk}</div><div class="ic-sm"><b>Son mağaza ziyareti</b><small>${fmtD(z.at.slice(0, 10))} · ${esc(z.bs)}${z.not ? ' · ' + esc(z.not) : ''}</small></div><span class="ic-go">›</span></div>`;
          }
        }
        h += `<div class="box ic-bsrow" data-icgo="chat"><div class="ic-av bs">BS</div><div class="ic-sm"><b>Bölge sorumlusu</b><small>${esc(((D.messages.me || []).slice(-1)[0] || {}).text || 'Mesaj yaz')}</small></div>${u ? `<span class="ic-unread">${u}</span>` : '<span class="ic-go">›</span>'}</div>`;
        h += `<div class="box"><h2>Gelen talepler</h2>${L.length ? `<label class="rq-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="icQ" type="search" autocomplete="off" placeholder="Talep ara: başlık, ürün, kod, tarih" value="${esc(ui.q || '')}"></label>` : ''}<ul class="ic-reqs" id="icReqL">${reqLis(L, ui.q)}</ul></div>`;
        h += sevkBox('me');
        h += svMine();
      } else if (ui.page === 'chat') {
        markSeen('me');
        h += head('Bölge sorumlusu', true) + `<div class="box">${bubbleList('me')}</div>`;
      } else if (ui.page === 'svans') {
        const s = D.savunma.find(x => x.id === ui.id);
        if (!s || !isMine(s)) {
          ui = { page: 'home' };
          return render();
        }
        const d = svDurum(s);
        h +=
          head('Savunma talebi', true) +
          `<div class="box"><p style="margin:0">Bölge sorumlusu <b>${esc(s.bs)}</b> aşağıdaki olayla ilgili senden yazılı savunma istiyor.</p>${svInfo(s)}</div>`;
        if (s.cevap)
          h += `<div class="box"><h2>Savunman</h2><p class="sv-txt sv-ans">${esc(s.cevap.text)}</p><p class="hint" style="margin:8px 0 0">${when(s.cevap.at)} gönderdin · <span class="ic-st sv-${d[0]}" style="padding:3px 9px">${d[1]}</span></p>${s.sonuc ? `<p style="margin:10px 0 0"><b>Sonuç:</b> ${esc(s.sonuc.karar)}</p>` : ''}</div>`;
        else
          h += `<div class="box"><div class="sf"><label>Savunman<textarea id="svCevap" class="simp" rows="7" placeholder="Olayı kendi açından anlat: ne oldu, neden oldu, ne yaptın?"></textarea></label>
        <label class="sv-beyan"><input type="checkbox" id="svBeyan"> Yazdıklarımın doğru olduğunu beyan ederim.</label>
        <button type="button" class="btn primary" id="svAnsGo">Savunmayı gönder</button></div></div>`;
      } else if (ui.page === 'ans') {
        const r = D.requests.find(x => x.id === ui.id);
        if (!r) {
          ui.page = 'home';
          return render();
        }
        const mine = (D.responses[r.id] || {}).me,
          f = ui.form;
        if (!$('icView').hidden) markRead(r);
        h +=
          head(esc(r.title), true) +
          `<div class="box"><span class="ic-type t-${r.type}">${TYPES[r.type]}</span><p style="margin:8px 0 0">${esc(r.body || '')}</p><p class="hint" style="margin:6px 0 0">BS · ${when(r.at)}${mine ? ' · ' + when(mine.at) + ' yanıtladın' : ''}</p>${attHtml(r.files)}${shareBtn(r)}</div>`;
        if (r.type === 'kontrol')
          h += `<div class="box"><ul class="slist">${r.items
            .map((it, k) => {
              const v = f.items[k] || {};
              return `<li class="rc-it${v.st ? ' ok' : ''}"><div class="rc-top"><div><b>${esc(it.name)}</b><small>Kod ${esc(it.code)}</small></div></div><div class="rc-st">${RCST.map(([x, l]) => `<button type="button" data-icst="${k}" data-v="${x}" aria-pressed="${v.st === x}">${l}</button>`).join('')}</div>${v.st && v.st !== 'yok' ? `<label class="rc-q">Adet<input data-icq="${k}" inputmode="numeric" value="${v.qty != null ? v.qty : ''}" placeholder="0"></label>` : ''}</li>`;
            })
            .join('')}</ul></div>`;
        else if (r.type === 'bilgi')
          h += `<div class="box"><div class="scroll"><table class="col-tab"><thead><tr>${r.cols.map(c => `<th>${esc(c)}</th>`).join('')}<th></th></tr></thead><tbody>${f.rows.map((rw, i) => `<tr>${r.cols.map((_, c) => `<td>${esc(rw[c] || '')}</td>`).join('')}<td><button type="button" class="del" data-icrowdel="${i}">×</button></td></tr>`).join('') || `<tr><td colspan="${r.cols.length + 1}" class="sempty">Aşağıdan satır ekle.</td></tr>`}</tbody></table></div>
        <div class="sf" style="margin-top:10px">${r.cols.map((c, k) => `<label>${esc(c)}<input data-icf="${k}" autocomplete="off"></label>`).join('')}<button type="button" class="btn" id="icRowAdd">Satır ekle</button></div></div>`;
        if (r.type === 'duyuru')
          h += `<div class="box"><h2 style="font-size:17px">Durum</h2><div class="ic-done"><button type="button" data-icdone="1" aria-pressed="${f.done === true}">✓ Yapıldı</button><button type="button" data-icdone="0" aria-pressed="${f.done === false}">✗ Yapılmadı</button></div>
        ${f.done === false ? `<div class="sf" style="margin-top:10px"><label>Neden yapılmadı?<textarea id="icWhy" class="simp" rows="3" placeholder="Kısaca açıkla">${esc(f.reason || '')}</textarea></label><div class="ic-pick">${NEDEN.map(n => `<button type="button" data-icwhy="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>` : ''}</div>`;
        h += attBox(
          f.files,
          r.foto ? '📷 Fotoğraf kanıtı' : 'Ekler',
          r.foto
            ? 'BS bu iş için fotoğraf istiyor. En az bir fotoğraf eklemeden yanıt gönderilemez.'
            : 'Fotoğraf, belge ya da dosya ekle (isteğe bağlı).'
        );
        h += `<div class="box rp-send"><button type="button" class="btn primary" id="icAnswer">${mine ? 'Yanıtı güncelle' : "BS'ye yanıt gönder"}</button></div>`;
      }
    }
    el.innerHTML = h;
    const c = $('icChat');
    if (c) c.scrollTop = c.scrollHeight;
    autoRead();
    updBell();
  }
  /* Açılan sayfa okundu sayılır: bildirimi bu sayfayı gösteren her şey (mesaj, sohbet, talep, form, vardiya değişikliği) zilden düşer */
  function autoRead() {
    if ($('icView').hidden || !giris()) return;
    const L = notifs().filter(x => x.go && x.go.page === ui.page && (!x.go.id || x.go.id === ui.id));
    if (L.length) dismiss(L);
  }
  // Bildirim: gerçek sistemde telefona anlık bildirim (push) gider; demoda bu cihazda bildirim gösterilir
  function notify(r) {
    const title = `BS'den yeni ${TYPES[r.type].toLocaleLowerCase('tr-TR')}`,
      body = r.title;
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker && navigator.serviceWorker.getRegistration
          ? navigator.serviceWorker
              .getRegistration()
              .then(g =>
                g && g.showNotification
                  ? g.showNotification(title, { body, tag: 'ic-' + r.id })
                  : new Notification(title, { body })
              )
              .catch(() => new Notification(title, { body }))
          : new Notification(title, { body });
      }
    } catch (e) {}
    const n = $('icNote');
    if (n) {
      n.innerHTML = `<b>🔔 ${esc(title)}</b><span>${esc(body)}</span>`;
      n.dataset.req = r.id;
      n.hidden = false;
      clearTimeout(n._t);
      n._t = setTimeout(() => {
        n.hidden = true;
      }, 7000);
    }
  }
  function newForm() {
    return {
      type: 'duyuru',
      title: '',
      body: '',
      itemsTxt: '',
      cols: 'Ürün kodu, Ürün adı, Adet, Not',
      to: D.stores.map(s => s.id),
      files: []
    };
  }
  function readForm() {
    const f = ui.form;
    if (!f) return;
    const g = id => $(id) && $(id).value;
    if ($('icT')) f.title = g('icT');
    if ($('icB')) f.body = g('icB');
    if ($('icItems')) f.itemsTxt = g('icItems');
    if ($('icCols')) f.cols = g('icCols');
    if ($('icFoto')) f.foto = $('icFoto').checked;
  }
  function parseItems(t) {
    return String(t || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const m = l.match(/\b(\d{3,14})\b/);
        return {
          code: m ? m[1] : '',
          name: (m ? l.replace(m[0], ' ') : l)
            .replace(/[;:|\t,\-–]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        };
      })
      .filter(x => x.code || x.name);
  }
  function sendMsg(id) {
    if (kilitli()) {
      render();
      return;
    }
    if (id.startsWith('ust:')) {
      const key = id.slice(4),
        t = $('icMsg').value.trim();
      if (!t) return;
      const side = ustSide(key);
      (D.ust[key] = D.ust[key] || []).push({ from: side, text: t, at: new Date().toISOString() });
      markUst(key);
      save();
      render();
      $('icMsg').focus();
      ustSim(key, side === 'ust' ? 'alt' : 'ust');
      return;
    }
    if (id.startsWith('pm:')) {
      const k = id.slice(3),
        t = $('icMsg').value.trim();
      if (!t) return;
      const g = giris(),
        side = g.tip === 'pm' ? 'pm' : 'bs';
      (D.pmMsg[k] = D.pmMsg[k] || []).push({ from: side, text: t, at: new Date().toISOString() });
      markPm(k);
      save();
      render();
      $('icMsg').focus();
      pmSim(k, side === 'pm' ? 'bs' : 'pm');
      return;
    }
    if (id === 'bsgrup') {
      const t = $('icMsg').value.trim();
      if (!t) return;
      const g = giris();
      D.bsgrup.push({
        from: g.ad,
        bolge: g.tip === 'pm' ? 'PM' : g.bolge || '',
        text: t,
        at: new Date().toISOString()
      });
      markBs();
      save();
      render();
      $('icMsg').focus();
      bsSim();
      return;
    }
    if (id === 'grup') {
      const t = $('icMsg').value.trim();
      if (!t) return;
      const g = giris();
      D.grup.push({ from: g.ad, unvan: g.unvan, text: t, at: new Date().toISOString() });
      markGrup();
      save();
      render();
      $('icMsg').focus();
      grupSim();
      return;
    }
    const t = $('icMsg').value.trim();
    if (!t) return;
    (D.messages[id] = D.messages[id] || []).push({
      from: D.role === 'bs' ? 'bs' : 'magaza',
      text: t,
      at: new Date().toISOString()
    });
    save();
    render();
    $('icMsg').focus();
    if (D.role === 'bs') simReply(id);
  }

  $('icView').addEventListener('input', e => {
    if (e.target.id === 'bsQ') {
      bsQ = e.target.value;
      const u = $('bsReqL');
      if (u) u.innerHTML = bsReqLis(bsQ);
      return;
    }
    if (e.target.id !== 'icQ') return;
    ui.q = e.target.value;
    const u = $('icReqL');
    if (u) u.innerHTML = reqLis(myReqs(), ui.q);
  });
  $('icView').addEventListener('click', async e => {
    const t = e.target;
    let b;
    if (t.closest('[data-gsopen]')) {
      ui.shareOpen = true;
      render();
      const n = $('gsNot');
      if (n) n.focus();
      return;
    }
    if (t.closest('[data-gscancel]')) {
      ui.shareOpen = false;
      render();
      return;
    }
    if ((b = t.closest('[data-gsgo]'))) {
      const r = D.requests.find(x => x.id === b.dataset.gsgo),
        g = giris();
      if (!r || !g) return;
      D.grup.push({
        from: g.ad,
        unvan: g.unvan,
        text: ($('gsNot').value || '').trim(),
        share: {
          id: r.id,
          type: r.type,
          title: r.title,
          body: r.body || '',
          items: (r.items || []).map(it => ({ code: it.code, name: it.name }))
        },
        at: new Date().toISOString()
      });
      markGrup();
      save();
      ui.shareOpen = false;
      render();
      V.toast('Mağaza grubuyla paylaşıldı.');
      return;
    }
    if (t.id === 'skAdd') {
      if (!dpSel.length) return V.toast('Araçtaki mağazaları seç.');
      const v = id => ($(id).value || '').trim();
      const x = {
        id: uid(),
        stores: dpSel.slice(),
        store: dpSel[0],
        tarih: v('skT'),
        saat: v('skS'),
        plaka: v('skP').toLocaleUpperCase('tr-TR').replace(/\s+/g, ' '),
        sofor: v('skD'),
        not: v('skN'),
        by: (giris() || {}).ad || '',
        at: new Date().toISOString()
      };
      if (!x.tarih || !x.saat) return V.toast('Gün ve saati seç.');
      if (x.plaka.replace(/\s/g, '').length < 5) return V.toast('Araç plakasını yaz.');
      D.sevk.push(x);
      dpSel = [];
      save();
      render();
      if ($('skP')) {
        $('skT').value = x.tarih;
        $('skS').value = x.saat;
      }
      V.toast(`${x.plaka}: ${gunAd(x.tarih)} ${x.saat}, ${x.stores.length} mağaza kaydedildi.`);
      return;
    }
    if ((b = t.closest('[data-skdel]'))) {
      D.sevk = D.sevk.filter(x => x.id !== b.dataset.skdel);
      save();
      render();
      return;
    }
    if ((b = t.closest('[data-icsv]'))) {
      ui = { page: 'sv', id: b.dataset.icsv, form: { karar: '', not: '' } };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-icsvans]'))) {
      ui = { page: 'svans', id: b.dataset.icsvans };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-svstore]'))) {
      readSv();
      ui.form.store = b.dataset.svstore;
      ui.form.kisi = '';
      render();
      return;
    }
    if ((b = t.closest('[data-svkisi]'))) {
      readSv();
      ui.form.kisi = b.dataset.svkisi;
      render();
      return;
    }
    if ((b = t.closest('[data-svolay]'))) {
      readSv();
      ui.form.olay = b.dataset.svolay;
      render();
      return;
    }
    if (t.id === 'svSend') {
      readSv();
      const f = ui.form;
      if (!f.store) return V.toast('Mağaza seç.');
      if (!f.kisi) return V.toast('Savunması istenecek kişiyi seç.');
      if (!f.olay) return V.toast('Olayı seç.');
      if (!f.aciklama.trim()) {
        V.toast('Olayı kısaca açıkla.');
        $('svA').focus();
        return;
      }
      if (!f.son || f.son < today()) return V.toast('Son yanıt tarihi bugünden önce olamaz.');
      const p = staffOf(f.store).find(x => x.id === f.kisi);
      if (!p) return V.toast('Kişiyi seç.');
      const g = giris();
      const s = {
        id: uid(),
        store: f.store,
        kisiId: p.id,
        ad: p.ad,
        unvan: p.unvan,
        olay: f.olay,
        tarih: f.tarih || today(),
        aciklama: f.aciklama.trim(),
        son: f.son,
        at: new Date().toISOString(),
        bs: (g && g.tip === 'bs' && g.ad) || 'Bölge sorumlusu',
        cevap: null,
        sonuc: null
      };
      D.savunma.push(s);
      save();
      simSv(s);
      ui = { page: 'sv', id: s.id, form: { karar: '', not: '' } };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      V.toast(`${p.ad} kişisinden savunma istendi.`);
      return;
    }
    if ((b = t.closest('[data-svkarar]'))) {
      if ($('svNot')) ui.form.not = $('svNot').value;
      ui.form.karar = b.dataset.svkarar;
      render();
      return;
    }
    if (t.id === 'svClose') {
      const s = D.savunma.find(x => x.id === ui.id);
      if (!ui.form.karar) return V.toast('Sonucu seç.');
      s.sonuc = { karar: ui.form.karar, not: ($('svNot').value || '').trim(), at: new Date().toISOString() };
      save();
      render();
      V.toast('Dosya kapatıldı.');
      return;
    }
    if ((b = t.closest('[data-svprint]'))) {
      const s = D.savunma.find(x => x.id === b.dataset.svprint);
      if (s) svPrint(s);
      return;
    }
    if ((b = t.closest('[data-svremind]'))) {
      const s = D.savunma.find(x => x.id === b.dataset.svremind);
      if (!s) return;
      (D.messages[s.store] = D.messages[s.store] || []).push({
        from: 'bs',
        text: `Hatırlatma: ${s.ad} adına istenen savunma ${fmtD(s.son)} tarihine kadar bekleniyor.`,
        at: new Date().toISOString()
      });
      save();
      simSv(s);
      V.toast('Hatırlatma gönderildi.');
      return;
    }
    if (t.id === 'svAnsGo') {
      const s = D.savunma.find(x => x.id === ui.id),
        txt = $('svCevap').value.trim();
      if (txt.length < 10) {
        V.toast('Savunmanı yaz.');
        $('svCevap').focus();
        return;
      }
      if (!$('svBeyan').checked) return V.toast('Beyan kutusunu işaretle.');
      if (!(await window.askConfirm("Savunman BS'ye gönderilsin mi? Gönderdikten sonra değiştiremezsin.", 'Gönder')))
        return;
      s.cevap = { text: txt, at: new Date().toISOString() };
      save();
      render();
      V.toast("Savunman BS'ye gönderildi.");
      return;
    }
    if ((b = t.closest('[data-icrole]'))) {
      D.role = b.dataset.icrole;
      ui = { page: 'home' };
      save();
      render();
      return;
    }
    if ((b = t.closest('[data-attdel]')) && ui.form) {
      readForm();
      if ($('zyNot')) ui.form.not = $('zyNot').value;
      if ($('icWhy')) ui.form.reason = $('icWhy').value;
      ui.form.files.splice(Number(b.dataset.attdel), 1);
      render();
      return;
    }
    if ((b = t.closest('[data-attview]'))) {
      const L = b.dataset.attsrc === 'form' ? ui.form.files : null,
        img = b.querySelector('img');
      const a = L ? L[Number(b.dataset.attview)] : null;
      attView(img.src, a ? a.name : 'fotograf.jpg');
      return;
    }
    if ((b = t.closest('[data-zynew]'))) {
      ui = { page: 'zy', id: b.dataset.zynew, form: { puan: {}, not: '', files: [] } };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-zk]'))) {
      if ($('zyNot')) ui.form.not = $('zyNot').value;
      ui.form.puan[b.dataset.zk] = Number(b.dataset.zvv);
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      return;
    }
    if (t.id === 'iseNew') {
      ui = { page: 'isen', form: {} };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if (t.id === 'iseCreate') {
      const ad = $('iseAd').value.trim();
      if (!ad) {
        V.toast('Personelin adını yaz.');
        $('iseAd').focus();
        return;
      }
      const x = {
        id: uid(),
        store: 'me',
        ad,
        unvan: $('iseUn').value,
        bas: $('iseBas').value || dstr(3),
        by: giris().ad,
        at: new Date().toISOString(),
        docs: {},
        durum: 'taslak',
        kontrol: {},
        asil: null
      };
      D.ise.push(x);
      save();
      ui = { page: 'isev', id: x.id };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-isev]'))) {
      ui = { page: 'isev', id: b.dataset.isev };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-ikv]')) && b.tagName === 'LI') {
      ui = { page: 'ikv', id: b.dataset.ikv, form: {} };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-evview]'))) {
      const x = D.ise.find(y => y.id === ui.id),
        [k, i] = b.dataset.evview.split(':'),
        a = x && (x.docs[k] || [])[Number(i)];
      if (a) attView(a.data, a.name);
      return;
    }
    if ((b = t.closest('[data-evdel]'))) {
      const x = D.ise.find(y => y.id === ui.id),
        [k, i] = b.dataset.evdel.split(':');
      if (x) {
        x.docs[k].splice(Number(i), 1);
        save();
        const y = window.scrollY;
        render();
        window.scrollTo(0, y);
      }
      return;
    }
    if ((b = t.closest('[data-asil]'))) {
      const x = D.ise.find(y => y.id === ui.id),
        v = D.sevk.find(y => y.id === b.dataset.asil);
      if (x && v) {
        x.asil = { plaka: v.plaka, tarih: v.tarih, saat: v.saat, durum: 'yolda' };
        save();
        const y = window.scrollY;
        render();
        window.scrollTo(0, y);
        V.toast(`Asıllar ${v.plaka} aracıyla gidecek.`);
      }
      return;
    }
    if (t.id === 'iseSend') {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      const n = evN(x);
      if (n < EV.length) {
        V.toast(`Eksik evrak var (${n}/${EV.length}).`);
        return;
      }
      if (!((x.imza || {}).per && (x.imza || {}).ms)) {
        V.toast('Göndermeden önce çalışan ve mağaza sorumlusu imzalamalı.');
        const el = document.querySelector('.imz-grid');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (x.durum === 'eksik')
        (x.eksik || []).forEach(k => {
          delete x.kontrol[k];
        });
      x.durum = 'ik';
      x.gonder = new Date().toISOString();
      x.eksik = [];
      save();
      render();
      window.scrollTo({ top: 0 });
      V.toast(
        x.asil
          ? "Dosya İK'ya gönderildi."
          : "Dosya İK'ya gönderildi. Asılları hangi araçla göndereceğini seçmeyi unutma."
      );
      return;
    }
    if (t.id === 'iseDel') {
      if (!(await window.askConfirm('Bu dosya silinsin mi?', 'Sil'))) return;
      D.ise = D.ise.filter(y => y.id !== ui.id);
      save();
      ui = { page: 'ise' };
      render();
      return;
    }
    if (t.closest('[data-ikk],[data-asilok]') || t.id === 'ikEksik' || t.id === 'ikOk') {
      if (!isIk()) return;
    }
    if ((b = t.closest('[data-ikk]'))) {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      ui.form = ui.form || {};
      if ($('ikNot')) ui.form.not = $('ikNot').value;
      x.kontrol = x.kontrol || {};
      x.kontrol[b.dataset.ikk] = b.dataset.ikv === '1';
      save();
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      return;
    }
    if ((b = t.closest('[data-asilok]'))) {
      const x = D.ise.find(y => y.id === b.dataset.asilok);
      if (x && x.asil) {
        x.asil.durum = 'ulasti';
        x.asil.at = new Date().toISOString();
        save();
        render();
        V.toast('Asıl evraklar teslim alındı.');
      }
      return;
    }
    if (t.id === 'ikEksik') {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      x.eksik = EV.filter(([k]) => (x.kontrol || {})[k] === false).map(([k]) => k);
      x.ikNot = ($('ikNot').value || '').trim();
      x.durum = 'eksik';
      x.karar = { by: giris().ad, at: new Date().toISOString() };
      save();
      ui = { page: 'ik' };
      render();
      window.scrollTo({ top: 0 });
      V.toast(`${x.eksik.length} eksik evrak mağazaya bildirildi.`);
      return;
    }
    if (t.id === 'ikOk') {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      if (!(x.imza || {}).ik) {
        V.toast('Onaylamadan önce İK olarak imzala.');
        const el = document.querySelector('.imz-grid');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const sc = ($('ikSicil').value || '').replace(/\D/g, '');
      if (sc.length < 3) {
        V.toast('Sicil numarasını yaz.');
        return;
      }
      if ((V.state().employees || []).some(e => String(e.sicil || '') === sc) || D.ise.some(y => y.sicil === sc)) {
        V.toast('Bu sicil numarası kullanılıyor.');
        return;
      }
      x.sicil = sc;
      x.durum = 'tamam';
      x.karar = { by: giris().ad, at: new Date().toISOString() };
      if (x.store === 'me') {
        const st = V.state();
        st.employees.push({
          id: uid(),
          name: x.ad,
          role: x.unvan === 'PART' ? 'PER' : x.unvan,
          izin: 'auto',
          araciOk: true,
          gender: '',
          sicil: sc
        });
        V.save();
      }
      save();
      ui = { page: 'ikv', id: x.id };
      render();
      window.scrollTo({ top: 0 });
      V.toast(`${x.ad} için sicil ${sc} verildi.`);
      return;
    }
    if (t.id === 'pnRem') {
      const E = eksikler();
      if (!E.length) return;
      const at = new Date().toISOString();
      E.forEach(({ s, w }) => {
        (D.messages[s.id] = D.messages[s.id] || []).push({
          from: 'bs',
          text: `Hatırlatma: bugünkü ${w.join(' ve ')} henüz gelmedi, lütfen gönderin.`,
          at
        });
      });
      D.hatirlat = D.hatirlat || {};
      D.hatirlat[today()] = at;
      save();
      render();
      V.toast(`${E.length} mağazaya hatırlatma gönderildi.`);
      return;
    }
    if (t.id === 'zySave') {
      const f = ui.form;
      if ($('zyNot')) f.not = $('zyNot').value.trim();
      if (Object.keys(f.puan).length < ZK.length) {
        V.toast(`Tüm maddeleri işaretle (${Object.keys(f.puan).length}/${ZK.length}).`);
        return;
      }
      const z = {
        id: uid(),
        store: ui.id,
        at: new Date().toISOString(),
        bs: giris().ad,
        puan: { ...f.puan },
        not: f.not,
        files: f.files || []
      };
      D.ziyaret.push(z);
      const ex = ZK.filter(([k]) => z.puan[k] < 2);
      let gt = '';
      if (ex.length) {
        const r = {
          id: uid(),
          type: 'duyuru',
          title: 'Ziyaret eksikleri (' + ex.length + ' madde)',
          body:
            'Ziyarette düzeltilmesi gerekenler:\n' +
            ex.map(([k, l]) => '• ' + l + ' (' + (z.puan[k] === 0 ? 'uygun değil' : 'kısmen') + ')').join('\n') +
            (z.not ? '\n\nNot: ' + z.not : '') +
            '\n\nDüzeltince fotoğrafını ekleyip Yapıldı de.',
          cols: [],
          items: [],
          to: [z.store],
          at: z.at,
          foto: true,
          ziyaret: z.id
        };
        if (z.files && z.files.length) r.files = z.files.slice();
        D.requests.push(r);
        z.gorev = r.id;
        simulate(r);
        gt = ` ${ex.length} eksik görev olarak gönderildi.`;
      }
      save();
      ui = { page: 'zyv', id: z.id };
      render();
      window.scrollTo({ top: 0 });
      V.toast(`Ziyaret kaydedildi: %${zSkor(z.puan)}.${gt || ' Mağazaya bildirim gitti.'}`);
      return;
    }
    if ((b = t.closest('[data-zyv]'))) {
      ui = { page: 'zyv', id: b.dataset.zyv };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-iztur]'))) {
      readIz();
      ui.form.tur = b.dataset.iztur;
      render();
      return;
    }
    if (t.id === 'izGo') {
      readIz();
      const f = ui.form,
        g = giris();
      const tur = f.tur || 'B',
        bas = f.bas,
        bit = ['B', 'T'].includes(tur) ? f.bas : f.bit || f.bas;
      if (tur === 'T' && !f.kimle) return V.toast('Kiminle takas yapacağını seç.');
      if (!bas) return V.toast('Tarihi seç.');
      if (bit < bas) return V.toast('Bitiş, başlangıçtan önce olamaz.');
      const p = staffOf('me').find(x => (g.empId && x.id === g.empId) || nrm(x.ad) === nrm(g.ad));
      D.izin.push({
        id: uid(),
        kisiId: g.empId || (p && p.id) || null,
        ad: g.ad,
        unvan: g.unvan,
        tur,
        bas,
        bit,
        kimle: tur === 'T' ? f.kimle : '',
        not: (f.not || '').trim(),
        at: new Date().toISOString(),
        durum: 'bek'
      });
      save();
      ui = { page: 'izin', form: {} };
      render();
      V.toast(tur === 'T' ? "Takas talebin MS ve MSY'ye gönderildi." : "İzin talebin MS ve MSY'ye gönderildi.");
      return;
    }
    if (yukClick(t) || mgyClick(t)) return;
    if ((b = t.closest('[data-imza]'))) {
      const x = D.ise.find(y => y.id === ui.id);
      if (x) imzaAc(x, b.dataset.imza);
      return;
    }
    if (t.id === 'isePdf') {
      const x = D.ise.find(y => y.id === ui.id);
      if (x) await isePdfIndir(x);
      return;
    }
    if ((b = t.closest('[data-kyok],[data-kyred]'))) {
      const o = KYa().get(),
        id = b.dataset.kyok || b.dataset.kyred,
        r = o.list.find(x => x.id === id),
        ok = !!b.dataset.kyok;
      if (!r || !kyYetki()) return;
      const g = giris(),
        not = (($('kyn-' + id) || {}).value || '').trim(),
        u = ($('kyu-' + id) || {}).value || r.unvan;
      if (!ok && !not) {
        V.toast('Reddetme nedenini yaz; kişi kendi ekranında görecek.');
        const el = $('kyn-' + id);
        if (el) el.focus();
        return;
      }
      const eski = ok && u !== r.unvan ? r.unvan : '';
      if (eski) r.unvan = u;
      r.durum = ok ? 'onay' : 'red';
      r.karar = { by: g.ad, rol: g.tip === 'bs' ? 'BS' : 'İK', at: new Date().toISOString(), not, eski };
      KYa().save(o);
      render();
      if (window.__renderHome) window.__renderHome();
      V.toast(ok ? `${r.ad} onaylandı; artık ${r.sicil} sicil numarasıyla girebilir.` : `${r.ad} kaydı reddedildi.`);
      return;
    }
    if ((b = t.closest('[data-kybs]'))) {
      if (!isIkY()) return;
      const o = KYa().get(),
        k = b.dataset.kybs;
      o.bsYetki[k] = !o.bsYetki[k];
      KYa().save(o);
      render();
      const p = KYa()
        .bsler()
        .find(x => x.sicil === k);
      V.toast(
        o.bsYetki[k]
          ? `${p ? p.ad : 'BS'} artık kayıt onaylayabilir.`
          : `${p ? p.ad : 'BS'} için onay yetkisi kapatıldı.`
      );
      return;
    }
    if ((b = t.closest('[data-izok],[data-izred]'))) {
      const id = b.dataset.izok || b.dataset.izred,
        x = D.izin.find(y => y.id === id),
        ok = !!b.dataset.izok;
      if (!x || !izBekl().includes(x)) return;
      let not = '';
      if (!ok) {
        not = (prompt('Reddetme nedeni (isteğe bağlı):', '') || '').trim();
      }
      x.durum = ok ? 'onay' : 'red';
      x.karar = { by: giris().ad, at: new Date().toISOString(), not };
      const pl = ok ? planIsle(x) : 0;
      save();
      render();
      V.toast(
        ok
          ? `${x.ad}: ${x.tur === 'T' ? 'takas' : 'izin'} onaylandı.${pl ? ' Vardiya planı güncellendi.' : x.tur === 'M' ? '' : ' Bu hafta için plan yok; plan oluşturulunca dikkate al.'}`
          : `${x.ad}: ${x.tur === 'T' ? 'takas' : 'izin'} reddedildi.`
      );
      return;
    }
    if ((b = t.closest('[data-izdel]'))) {
      if (!(await window.askConfirm('İzin talebin geri çekilsin mi?', 'Geri çek'))) return;
      D.izin = D.izin.filter(y => y.id !== b.dataset.izdel);
      save();
      render();
      return;
    }
    if ((b = t.closest('[data-ust]'))) {
      ui = { page: 'ust', id: b.dataset.ust };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-pmbs]'))) {
      ui = { page: 'pmchat', id: b.dataset.pmbs };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    if ((b = t.closest('[data-dpst]'))) {
      const id = b.dataset.dpst;
      dpSel = dpSel.includes(id) ? dpSel.filter(y => y !== id) : [...dpSel, id];
      const keepV = {};
      ['skT', 'skS', 'skP', 'skD', 'skN'].forEach(id => {
        if ($(id)) keepV[id] = $(id).value;
      });
      render();
      Object.keys(keepV).forEach(id => {
        if ($(id)) $(id).value = keepV[id];
      });
      return;
    }
    if ((b = t.closest('[data-bstab]'))) {
      bsTab = b.dataset.bstab;
      render();
      return;
    }
    if ((b = t.closest('[data-icgo]'))) {
      readForm();
      const p = b.dataset.icgo;
      ui = { page: p, id: null, form: p === 'new' ? newForm() : p === 'svnew' ? svForm() : p === 'izin' ? {} : null };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-icstore]'))) {
      ui = { page: 'store', id: b.dataset.icstore };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-icreq]'))) {
      ui = { page: 'req', id: b.dataset.icreq };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-icans]'))) {
      const r = D.requests.find(x => x.id === b.dataset.icans),
        mine = (D.responses[r.id] || {}).me;
      ui = {
        page: 'ans',
        id: r.id,
        form: {
          items: r.items.map((_, k) => (mine && mine.items ? { ...mine.items[k] } : { st: '', qty: null })),
          rows: mine && mine.rows ? mine.rows.map(x => x.slice()) : [],
          done: mine && 'done' in mine ? mine.done : null,
          reason: (mine && mine.reason) || '',
          files: mine && mine.files ? mine.files.slice() : []
        }
      };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if ((b = t.closest('[data-ictype]'))) {
      readForm();
      ui.form.type = b.dataset.ictype;
      render();
      return;
    }
    if ((b = t.closest('[data-icto]'))) {
      readForm();
      const f = ui.form,
        id = b.dataset.icto;
      f.to = f.to.includes(id) ? f.to.filter(x => x !== id) : [...f.to, id];
      render();
      return;
    }
    if (t.id === 'icAll') {
      readForm();
      ui.form.to = ui.form.to.length === D.stores.length ? [] : D.stores.map(s => s.id);
      render();
      return;
    }
    if (t.id === 'icSendReq') {
      readForm();
      const f = ui.form;
      if (!f.title.trim()) {
        V.toast('Başlık yaz.');
        $('icT').focus();
        return;
      }
      if (!f.to.length) {
        V.toast('En az bir mağaza seç.');
        return;
      }
      const items = f.type === 'kontrol' ? parseItems(f.itemsTxt) : [];
      if (f.type === 'kontrol' && !items.length) {
        V.toast('Ürünleri yaz.');
        return;
      }
      const cols =
        f.type === 'bilgi'
          ? f.cols
              .split(',')
              .map(x => x.trim())
              .filter(Boolean)
          : [];
      if (f.type === 'bilgi' && !cols.length) {
        V.toast('En az bir sütun yaz.');
        return;
      }
      const r = {
        id: uid(),
        type: f.type,
        title: f.title.trim(),
        body: f.body.trim(),
        items,
        cols,
        to: f.to.slice(),
        at: new Date().toISOString()
      };
      if (f.files && f.files.length) r.files = f.files.slice();
      if (f.foto) r.foto = true;
      D.requests.push(r);
      save();
      simulate(r);
      ui = { page: 'req', id: r.id };
      render();
      V.toast(`Talep ${r.to.length} mağazaya gönderildi.`);
      return;
    }
    if ((b = t.closest('[data-icxlsx]'))) {
      const r = D.requests.find(x => x.id === b.dataset.icxlsx),
        T = reqTable(r);
      const blob = window.__xlsx(r.title, T.cols, T.rows),
        name = (r.title + '.xlsx')
          .replace(/[\\\/:*?"<>|]/g, '-')
          .replace(
            /[çÇğĞıİöÖşŞüÜ]/g,
            ch =>
              ({ ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' })[ch]
          );
      try {
        const f = new File([blob], name, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [f] })) {
          await navigator.share({ files: [f], title: r.title });
          return;
        }
      } catch (x) {
        if (x && x.name === 'AbortError') return;
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
      return;
    }
    if ((b = t.closest('[data-icremind]'))) {
      const r = D.requests.find(x => x.id === b.dataset.icremind);
      const miss = r.to.filter(id => !answered(r, id));
      miss.forEach(id => {
        (D.messages[id] = D.messages[id] || []).push({
          from: 'bs',
          text: `Hatırlatma: “${r.title}” talebine yanıt bekleniyor.`,
          at: new Date().toISOString()
        });
      });
      save();
      simulate({ ...r, to: miss });
      render();
      V.toast(`${miss.length} mağazaya hatırlatma gitti.`);
      return;
    }
    if ((b = t.closest('[data-rqsel]'))) {
      const r = D.requests.find(x => x.id === ui.id),
        R = D.responses[r.id] || {},
        v = b.dataset.rqsel;
      ui.sel = v === 'all' ? null : r.to.filter(id => (v === 'yes' ? R[id] : !R[id]));
      render();
      return;
    }
    if ((b = t.closest('[data-rqst]'))) {
      const r = D.requests.find(x => x.id === ui.id),
        id = b.dataset.rqst;
      let L = ui.sel ? ui.sel.slice() : [];
      L = L.includes(id) ? L.filter(x => x !== id) : [...L, id];
      ui.sel = L.length && L.length < r.to.length ? L : null;
      render();
      return;
    }
    if (t.id === 'icMsgGo') {
      sendMsg(t.dataset.icchat);
      return;
    }
    if ((b = t.closest('[data-icst]'))) {
      const k = Number(b.dataset.icst),
        v = ui.form.items[k];
      v.st = v.st === b.dataset.v ? '' : b.dataset.v;
      if (v.st === 'yok' || !v.st) v.qty = null;
      render();
      return;
    }
    if (t.id === 'icRowAdd') {
      const vals = [...document.querySelectorAll('[data-icf]')].map(i => i.value.trim());
      if (!vals.some(Boolean)) {
        V.toast('Önce bir alan doldur.');
        return;
      }
      ui.form.rows.push(vals);
      render();
      const f = document.querySelector('[data-icf]');
      if (f) f.focus();
      return;
    }
    if ((b = t.closest('[data-icrowdel]'))) {
      ui.form.rows.splice(Number(b.dataset.icrowdel), 1);
      render();
      return;
    }
    if ((b = t.closest('[data-icdone]'))) {
      if ($('icWhy')) ui.form.reason = $('icWhy').value;
      ui.form.done = b.dataset.icdone === '1';
      render();
      if (!ui.form.done && $('icWhy')) $('icWhy').focus();
      return;
    }
    if ((b = t.closest('[data-icwhy]'))) {
      $('icWhy').value = b.dataset.icwhy;
      ui.form.reason = b.dataset.icwhy;
      return;
    }
    if (t.id === 'icAnswer') {
      const r = D.requests.find(x => x.id === ui.id),
        f = ui.form;
      if (r.type === 'duyuru') {
        if ($('icWhy')) f.reason = $('icWhy').value.trim();
        if (f.done == null) {
          V.toast('Yapıldı mı, yapılmadı mı seç.');
          return;
        }
        if (f.done === false && !f.reason) {
          V.toast('Neden yapılmadığını yaz.');
          $('icWhy').focus();
          return;
        }
      }
      if (
        r.type === 'kontrol' &&
        f.items.some(x => !x.st) &&
        !(await window.askConfirm('Tüm ürünler işaretlenmedi. Yine de gönderilsin mi?', 'Gönder'))
      )
        return;
      if (r.foto && !(r.type === 'duyuru' && f.done === false) && !(f.files || []).some(a => /^image\//.test(a.type))) {
        V.toast('Fotoğraf kanıtı ekle: BS bu iş için fotoğraf istiyor.');
        const a = document.querySelector('.att-act');
        if (a) a.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      if (r.type === 'bilgi' && !f.rows.length) {
        const vals = [...document.querySelectorAll('[data-icf]')].map(i => i.value.trim());
        if (vals.some(Boolean)) f.rows.push(vals);
        else {
          V.toast('En az bir satır ekle.');
          return;
        }
      }
      const resp =
        r.type === 'kontrol'
          ? { at: new Date().toISOString(), items: f.items }
          : r.type === 'bilgi'
            ? { at: new Date().toISOString(), rows: f.rows }
            : { at: new Date().toISOString(), done: f.done, reason: f.done ? '' : f.reason };
      if (f.files && f.files.length) resp.files = f.files;
      (D.responses[r.id] = D.responses[r.id] || {}).me = resp;
      save();
      ui = { page: 'home' };
      render();
      V.toast("Yanıt BS'ye gönderildi.");
      return;
    }
  });
  document.addEventListener('click', e => {
    const n = e.target.closest('#icNote');
    if (!n) return;
    n.hidden = true;
    if (e.target.closest('.ic-note-x')) return;
    if (window.__setTab) window.__setTab('c');
    if (n.dataset.sv) {
      ui = { page: 'svans', id: n.dataset.sv };
      render();
      return;
    }
    const r = D.requests.find(x => x.id === n.dataset.req);
    ui = r
      ? {
          page: 'ans',
          id: r.id,
          form: { items: r.items.map(() => ({ st: '', qty: null })), rows: [], done: null, reason: '', files: [] }
        }
      : { page: 'home' };
    render();
  });
  $('icView').addEventListener('change', async e => {
    const ei = e.target.closest('[data-evin]');
    if (ei) {
      const x = D.ise.find(y => y.id === ui.id);
      if (!x) return;
      const F = [...ei.files];
      ei.value = '';
      const k = ei.dataset.evin;
      x.docs[k] = x.docs[k] || [];
      for (const f of F) {
        const a = await evRead(f);
        if (a && a.err) {
          V.toast(`${a.err} 2 MB'tan büyük.`);
          continue;
        }
        if (a) x.docs[k].push(a);
      }
      if (!save()) {
        x.docs[k].splice(-F.length);
      }
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      return;
    }
    const fi = e.target.closest('[data-attin]');
    if (fi && ui.form) {
      readForm();
      if ($('zyNot')) ui.form.not = $('zyNot').value;
      if ($('icWhy')) ui.form.reason = $('icWhy').value;
      const F = [...fi.files];
      fi.value = '';
      ui.form.files = ui.form.files || [];
      const big = [];
      for (const file of F) {
        const a = await readAtt(file);
        if (!a) continue;
        if (a.err) {
          big.push(a.err);
          continue;
        }
        ui.form.files.push(a);
      }
      render();
      if (big.length) V.toast(`${big.join(', ')}: 2 MB'tan büyük (sunum sürümü sınırı).`);
      else if (F.length) V.toast(F.length > 1 ? `${F.length} dosya eklendi.` : 'Eklendi.');
      return;
    }
    const q = e.target.closest('[data-icq]');
    if (q && ui.form) {
      ui.form.items[Number(q.dataset.icq)].qty = q.value === '' ? null : Number(q.value.replace(',', '.'));
    }
  });
  $('icView').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'icMsg') {
      e.preventDefault();
      $('icMsgGo').click();
    }
  });
  /* --- bildirimler: liste, tek tek ya da toplu silme (silinenler D.dismissed içinde tutulur) --- */
  function notifs() {
    const g = giris();
    if (!g) return [];
    const dis = D.dismissed || {},
      L = [],
      bs = g.tip === 'bs';
    const kyN = () => {
      if (kyYetki())
        kyBek().forEach(r =>
          L.push({
            k: 'ky:' + r.id,
            t: `Kayıt onayı: ${r.ad}`,
            d: `${KISA[r.unvan] || r.unvan || ''} · ${r.magaza || ''}`,
            at: r.at,
            go: { page: 'kayit' }
          })
        );
    };
    if (g.tip === 'depo') {
      kyN();
      yukN(L);
      D.ise
        .filter(x => isIk() && x.durum === 'ik')
        .forEach(x =>
          L.push({
            k: 'ik:' + x.id + ':' + x.gonder,
            t: `İşe giriş dosyası: ${x.ad}`,
            d: S(x.store).name + ' · ' + evN(x) + '/' + EV.length + ' evrak',
            at: x.gonder || x.at,
            go: { page: 'ikv', id: x.id }
          })
        );
      return L.filter(x => !dis[x.k]).sort((a, b) => b.at.localeCompare(a.at));
    }
    const pmN = k => {
      const u = pmUnreadOf(k);
      if (u.length) {
        const last = u[u.length - 1],
          p = bsPeople().find(x => nrm(x.ad) === k);
        L.push({
          k: 'pm:' + k + ':' + last.at,
          t: g.tip === 'pm' ? `${p ? p.ad : 'BS'}: ${u.length} yeni mesaj` : `PM'den ${u.length} yeni mesaj`,
          d: last.text,
          at: last.at,
          go: { page: 'pmchat', id: k },
          seen: (g.tip === 'pm' ? 'pm:' : 'pmbs:') + k
        });
      }
    };
    const bgN = () => {
      const bu = bsUnread();
      if (bu.length) {
        const last = bu[bu.length - 1];
        L.push({
          k: 'bg:' + last.at,
          t: `BS grubu: ${bu.length} yeni mesaj`,
          d: last.from + ': ' + last.text,
          at: last.at,
          go: { page: 'bsgrup' },
          seen: bsgKey()
        });
      }
    };
    const ustN = key => {
      const u = ustUnread(key);
      if (u.length) {
        const last = u[u.length - 1],
          p = ustKimi(key);
        L.push({
          k: 'ust:' + key + ':' + last.at,
          t: `${p.ad}: ${u.length} yeni mesaj`,
          d: last.text,
          at: last.at,
          go: { page: 'ust', id: key },
          seen: 'ust:' + ustSide(key) + ':' + key
        });
      }
    };
    if (g.tip === 'pm') {
      if (ustKey()) ustN(ustKey());
      altlar().forEach(p => ustN(p.key));
      if (kad() === 'pm') {
        bsPeople().forEach(p => pmN(nrm(p.ad)));
        bgN();
      }
    } else if (bs) {
      pmN(nrm(g.ad));
      kyN();
      yukN(L);
      mgyN(L);
      const lim = new Date(Date.now() - 2 * 864e5).toISOString();
      D.requests.forEach(r => {
        const R = D.responses[r.id] || {},
          ids = Object.keys(R);
        if (!ids.length) return;
        const last = ids
          .map(id => R[id].at)
          .sort()
          .pop();
        if (last < lim) return;
        const n = r.to.filter(id => R[id]).length;
        L.push({
          k: 'a:' + r.id + ':' + n,
          t:
            n >= r.to.length
              ? `${r.title}: tüm mağazalar dönüş yaptı`
              : `${r.title}: ${n}/${r.to.length} mağaza dönüş yaptı`,
          d: 'Son dönüş: ' + S(ids.sort((a, b) => R[a].at.localeCompare(R[b].at)).pop()).name,
          at: last,
          go: { page: 'req', id: r.id }
        });
      });
      D.stores.forEach(s => {
        const M = (D.messages[s.id] || []).filter(m => m.from === 'magaza'),
          seen = (D.seen || {})['bs:' + s.id] || '',
          u = M.filter(m => m.at > seen);
        if (u.length) {
          const last = u[u.length - 1];
          L.push({
            k: 'm:' + s.id + ':' + last.at,
            t: u.every(m => m.rapor)
              ? u.length > 1
                ? `${s.name}: ${u.length} dönüş geldi`
                : `${s.name}: ${(BSK[last.tur || 'rapor'] || '').replace(/^\S+ /, '').toLocaleLowerCase('tr-TR')} geldi`
              : `${s.name}: ${u.length} yeni mesaj`,
            d: last.rapor ? last.text.split('\n').filter(Boolean).slice(0, 2).join(' · ') : last.text,
            at: last.at,
            go: { page: 'store', id: s.id },
            seen: 'bs:' + s.id
          });
        }
      });
      bgN();
      const vlim = new Date(Date.now() - 7 * 864e5).toISOString();
      D.vd
        .filter(x => x.at > vlim)
        .forEach(x =>
          L.push({
            k: 'vd:' + x.id,
            t: `${S(x.store).name}: ${x.tip === 'yaz' ? 'haftalık vardiya yazıldı' : 'vardiya değişti'}`,
            d:
              x.tip === 'yaz'
                ? wkAd(x.w) + ' haftası'
                : vdSatir(x.L[0]).replace(/&amp;/g, '&') + (x.L.length > 1 ? ` · +${x.L.length - 1} değişiklik` : ''),
            at: x.at,
            go: { page: 'store', id: x.store },
            red: x.tip === 'deg'
          })
        );
      D.savunma
        .filter(s => s.cevap && !s.sonuc)
        .forEach(s =>
          L.push({
            k: 'sva:' + s.id,
            t: `${s.ad} savunmasını gönderdi`,
            d: s.olay + ' · ' + S(s.store).name,
            at: s.cevap.at,
            go: { page: 'sv', id: s.id }
          })
        );
    } else {
      const gu = grupUnread();
      if (gu.length) {
        const last = gu[gu.length - 1];
        L.push({
          k: 'g:' + last.at,
          t: `Mağaza grubu: ${gu.length} yeni mesaj`,
          d: last.from + ': ' + (last.share ? 'BS paylaşımı · ' + last.share.title : last.text),
          at: last.at,
          go: { page: 'grup' },
          seen: grupSeenKey()
        });
      }
      if (!isStaff()) {
        if (canIse())
          D.ise
            .filter(x => x.store === 'me' && x.karar && (x.durum === 'eksik' || x.durum === 'tamam'))
            .forEach(x =>
              L.push({
                k: 'ise:' + x.id + ':' + x.karar.at,
                t: x.durum === 'eksik' ? `İK eksik evrak bildirdi: ${x.ad}` : `İşe giriş tamamlandı: ${x.ad}`,
                d: x.durum === 'eksik' ? x.ikNot || (x.eksik || []).length + ' evrak eksik' : 'Sicil ' + x.sicil,
                at: x.karar.at,
                go: { page: 'isev', id: x.id },
                red: x.durum === 'eksik'
              })
            );
        myReqs()
          .filter(r => !answered(r, 'me'))
          .forEach(r =>
            L.push({
              k: 'r:' + r.id,
              t: `BS'den yeni ${TYPES[r.type].toLocaleLowerCase('tr-TR')}`,
              d: r.title,
              at: r.at,
              go: { page: 'ans', id: r.id }
            })
          );
        const M = (D.messages.me || []).filter(m => m.from === 'bs'),
          seen = (D.seen || {})['mg:me'] || '',
          u = M.filter(m => m.at > seen);
        if (u.length) {
          const last = u[u.length - 1];
          L.push({
            k: 'm:me:' + last.at,
            t: `BS'den ${u.length} yeni mesaj`,
            d: last.text,
            at: last.at,
            go: { page: 'chat' },
            seen: 'mg:me'
          });
        }
      }
      {
        const v = vdGunu();
        if (v)
          L.push({
            k: 'vdg:' + v.w + ':' + today(),
            t: v.t,
            d: v.d,
            at: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
            go: { tab: 'v', week: v.w },
            red: v.gec
          });
      }
      if (canOnay())
        D.ziyaret
          .filter(z => z.store === 'me' && !z.goruldu && z.at > new Date(Date.now() - 3 * 864e5).toISOString())
          .forEach(z =>
            L.push({
              k: 'zy:' + z.id,
              t: `BS ziyaret formu: %${zSkor(z.puan)}`,
              d: fmtD(z.at.slice(0, 10)) + ' · ' + z.bs,
              at: z.at,
              go: { page: 'zyv', id: z.id }
            })
          );
      D.izin
        .filter(x => x.tur === 'T' && x.durum === 'bek' && x.kimle && giris() && nrm(x.kimle) === nrm(giris().ad))
        .forEach(x =>
          L.push({
            k: 'izt:' + x.id,
            t: `${x.ad} seninle vardiya takası istiyor`,
            d: izTarih(x) + ' · MS/MSY onayına gitti',
            at: x.at,
            go: { page: 'izin' }
          })
        );
      yukN(L);
      izBekl().forEach(x =>
        L.push({
          k: 'iz:' + x.id,
          t: `${x.ad} izin istiyor`,
          d: IZT[x.tur] + ' · ' + izTarih(x),
          at: x.at,
          go: { page: 'izin' }
        })
      );
      D.izin
        .filter(x => izMine(x) && x.durum !== 'bek')
        .forEach(x =>
          L.push({
            k: 'izk:' + x.id,
            t: x.durum === 'onay' ? 'İzin talebin onaylandı' : 'İzin talebin reddedildi',
            d: IZT[x.tur] + ' · ' + izTarih(x) + ' · ' + x.karar.by,
            at: x.karar.at,
            go: { page: 'izin' },
            red: x.durum === 'red'
          })
        );
      D.savunma.filter(isMine).forEach(s => {
        if (!s.cevap)
          L.push({
            k: 'sv:' + s.id,
            t: 'Savunman isteniyor',
            d: s.olay + ' · son gün ' + fmtD(s.son),
            at: s.at,
            go: { page: 'svans', id: s.id },
            red: true
          });
        else if (s.sonuc)
          L.push({
            k: 'svs:' + s.id,
            t: 'Savunma sonucu',
            d: s.sonuc.karar,
            at: s.sonuc.at,
            go: { page: 'svans', id: s.id }
          });
      });
    }
    return L.filter(x => !dis[x.k]).sort((a, b) => b.at.localeCompare(a.at));
  }
  function dismiss(L) {
    D.dismissed = D.dismissed || {};
    D.seen = D.seen || {};
    const now = new Date().toISOString();
    L.forEach(x => {
      D.dismissed[x.k] = 1;
      if (x.seen) D.seen[x.seen] = now;
    });
    save();
  }
  function updBell() {
    const n = notifs().length,
      b = $('bellN'),
      c = $('icBadge');
    if (b) {
      b.textContent = n > 99 ? '99+' : n;
      b.hidden = !n;
    }
    if (c) {
      c.textContent = n > 99 ? '99+' : n;
      c.hidden = !n;
    }
    if (!$('ntDlg').hidden) drawNt();
  }
  function drawNt() {
    const L = notifs();
    $('ntList').innerHTML = L.length
      ? L.map(
          x =>
            `<li class="${x.red ? 'red' : ''}"><button type="button" class="nt-go" data-ntgo="${esc(x.k)}"><i></i><span><b>${esc(x.t)}</b><small>${esc(x.d || '')}</small><em>${when(x.at)}</em></span></button><button type="button" class="nt-x" data-ntdel="${esc(x.k)}" aria-label="Bildirimi sil">×</button></li>`
        ).join('')
      : '<li class="nt-empty">Yeni bildirim yok.</li>';
    $('ntAll').hidden = !L.length;
    $('ntCount').textContent = L.length ? L.length + ' bildirim' : '';
  }
  function openNt() {
    if (!giris()) return;
    $('ntDlg').hidden = false;
    drawNt();
  }
  $('bellBtn').addEventListener('click', openNt);
  window.__icFeed = () => {
    const L = notifs(),
      F = L.slice(0, 3).map(x => ({ k: x.k, t: x.t, d: x.d, red: x.red, w: when(x.at) }));
    F.n = L.length;
    return F;
  };
  window.__icOpenNt = k => {
    const x = notifs().find(y => y.k === k);
    if (!x) return;
    dismiss([x]);
    if (x.go.tab) {
      $('ntDlg').hidden = true;
      window.__setTab(x.go.tab);
      vdHafta(x.go.week);
      window.scrollTo({ top: 0 });
      return;
    }
    if (window.__setTab) window.__setTab('c');
    const r = x.go.page === 'ans' && D.requests.find(q => q.id === x.go.id);
    ui = r
      ? {
          page: 'ans',
          id: r.id,
          form: { items: r.items.map(() => ({ st: '', qty: null })), rows: [], done: null, reason: '', files: [] }
        }
      : x.go.page === 'sv'
        ? { ...x.go, form: { karar: '', not: '' } }
        : { ...x.go };
    render();
    window.scrollTo({ top: 0 });
  };
  $('ntDlg').addEventListener('click', async e => {
    const t = e.target;
    let b;
    if (t === $('ntDlg') || t.id === 'ntClose') {
      $('ntDlg').hidden = true;
      return;
    }
    if ((b = t.closest('[data-ntdel]'))) {
      const x = notifs().find(y => y.k === b.dataset.ntdel);
      if (x) dismiss([x]);
      updBell();
      if (D.role && !$('icView').hidden) render();
      return;
    }
    if (t.id === 'ntAll') {
      const L = notifs();
      if (!L.length) return;
      if (!(await window.askConfirm(`${L.length} bildirimin hepsi silinsin mi?`, 'Tümünü sil'))) return;
      dismiss(L);
      const n = $('icNote');
      if (n) n.hidden = true;
      updBell();
      if (!$('icView').hidden) render();
      else updBell();
      if (window.__renderHome && !$('homeView').hidden) window.__renderHome();
      V.toast('Bildirimler silindi.');
      return;
    }
    if ((b = t.closest('[data-ntgo]'))) {
      const x = notifs().find(y => y.k === b.dataset.ntgo);
      if (!x) return;
      $('ntDlg').hidden = true;
      dismiss([x]);
      if (x.go.tab) {
        $('ntDlg').hidden = true;
        window.__setTab(x.go.tab);
        vdHafta(x.go.week);
        window.scrollTo({ top: 0 });
        return;
      }
      if (window.__setTab) window.__setTab('c');
      const r = x.go.page === 'ans' && D.requests.find(q => q.id === x.go.id);
      ui = r
        ? {
            page: 'ans',
            id: r.id,
            form: { items: r.items.map(() => ({ st: '', qty: null })), rows: [], done: null, reason: '', files: [] }
          }
        : x.go.page === 'sv'
          ? { ...x.go, form: { karar: '', not: '' } }
          : { ...x.go };
      render();
      window.scrollTo({ top: 0 });
      return;
    }
  });
  /* --- personel yetkileri: BS her mağaza için personelin hangi bölümleri göreceğini açıp kapatır --- */
  const IST = [
    ['skt', 'Sabah SKT dönüşü', "Her sabah 09.15'e kadar SKT kontrolü"],
    ['rapor', 'Akşam raporu', 'Günlük ciro ve müşteri sayısı'],
    ['irs', 'İrsaliyeler', 'Gelen irsaliye girildi mi, takıldı mı'],
    ['ayin', 'Ayın ürünleri', 'Ayın ürünlerinden günlük satış adedi']
  ];
  const ist = () => Object.assign({ skt: true, rapor: true, irs: true, ayin: true }, D.istek || {});
  window.__ist = () => ist();
  function istApply() {
    const b = document.body,
      I = ist();
    IST.forEach(([k]) => b.classList.toggle('no-' + k, !I[k]));
    const none = !IST.some(([k]) => I[k]);
    b.classList.toggle('no-daily', none);
    if (none) {
      const d = document.getElementById('bsDaily');
      if (d && !d.hidden) {
        const r = document.querySelector('[data-bsm="rc"]');
        if (r) r.click();
      }
    }
  }
  function drawIst() {
    const el = $('istBody');
    if (!el) return;
    const I = ist();
    el.innerHTML = `<p class="hint" style="margin:0 0 10px">Mağazalardan her gün hangi dönüşleri istediğini seç. Kapattıkların mağazanın BS sekmesinde ve özetlerde görünmez.</p>
  <ul class="yk-list">${IST.map(([k, t, d]) => `<li><div><b>${t}</b><small>${d}</small></div><button type="button" class="yk-sw" role="switch" data-ist="${k}" aria-checked="${!!I[k]}" aria-label="${t}"><i></i></button></li>`).join('')}</ul>`;
  }
  $('istBody').addEventListener('click', e => {
    const b = e.target.closest('[data-ist]');
    if (!b) return;
    const k = b.dataset.ist,
      I = ist();
    I[k] = !I[k];
    D.istek = I;
    save();
    drawIst();
    istApply();
    render();
    V.toast(`${IST.find(x => x[0] === k)[1]} ${I[k] ? 'istenecek' : 'artık istenmeyecek'}.`);
  });
  const YK = [
    ['v', 'Sevkiyat bilgisi', 'Araç plakası, saat ve şoför'],
    ['s', 'SKT kontrol', 'Ürün ekleme, satıldı ve fire'],
    ['b', 'BS raporu', "BS'nin istediği günlük dönüşler"],
    ['c', 'BS talepleri', "BS'den gelen görev, bilgi ve kontrol istekleri"],
    ['a', 'Ay başı', 'Ciro ve saat hedefi']
  ];
  const YK_DEF = { v: false, s: true, b: false, c: false, a: false };
  const ykOf = id => Object.assign({}, YK_DEF, (D.yetki || {})[id] || {});
  let ykStore = 'me';
  function ykApply() {
    const b = document.body,
      y = ykOf('me');
    YK.forEach(([k]) => b.classList.toggle('yk-' + k, !!y[k]));
    const tl = $('tabC').querySelector('.tl');
    if (tl)
      tl.textContent =
        b.dataset.role === 'depo' ? 'Sevkiyat' : b.dataset.role === 'staff' && !y.c ? 'Grup' : 'İletişim';
    const st = V.state().tab,
      map = { s: 's', b: 'b', a: 'a' };
    if (b.dataset.role === 'staff' && map[st] && !y[st] && window.__setTab) window.__setTab('h');
  }
  function drawYk() {
    const el = $('ykBody');
    if (!el) return;
    const y = ykOf(ykStore);
    el.innerHTML = `<p class="hint" style="margin:0 0 10px">Personelin (MS ve MSY hariç) hangi bölümleri göreceğini sen belirlersin. Vardiya, Aktüel ve Mağaza grubu her zaman açık.</p>
  <div class="ic-pick">${D.stores.map(s => `<button type="button" data-ykst="${s.id}" aria-pressed="${ykStore === s.id}">${esc(s.name)}</button>`).join('')}</div>
  <ul class="yk-list">${YK.map(([k, t, d]) => `<li><div><b>${t}</b><small>${d}</small></div><button type="button" class="yk-sw" role="switch" data-yk="${k}" aria-checked="${!!y[k]}" aria-label="${t}"><i></i></button></li>`).join('')}</ul>`;
  }
  $('ykBody').addEventListener('click', e => {
    let b;
    if ((b = e.target.closest('[data-ykst]'))) {
      ykStore = b.dataset.ykst;
      drawYk();
      return;
    }
    if ((b = e.target.closest('[data-yk]'))) {
      const k = b.dataset.yk;
      D.yetki = D.yetki || {};
      const y = ykOf(ykStore);
      y[k] = !y[k];
      D.yetki[ykStore] = y;
      save();
      drawYk();
      ykApply();
      const t = YK.find(x => x[0] === k)[1];
      V.toast(`${S(ykStore).name} personeli: ${t} ${y[k] ? 'açıldı' : 'kapatıldı'}.`);
    }
  });
  $('icBody').addEventListener('change', e => {
    if (e.target.id !== 'rhIl') return;
    rhIl = e.target.value;
    const q = $('rhQ');
    if (q) q.value = '';
    const d = rhDef();
    $('rhT').innerHTML = d.t;
    $('rhL').innerHTML = rhRows(d.L.slice(0, 40));
    $('rhMore').hidden = d.L.length <= 40;
  });
  $('icBody').addEventListener('input', e => {
    if (e.target.id === 'rhQ') {
      const M = MG();
      if (!M) return;
      const q = e.target.value.trim();
      let t,
        L,
        more = false;
      if (q) {
        const A = M.ara(q, 41, true);
        more = A.length > 40;
        L = A.slice(0, 40);
        t = L.length ? `${more ? '40+' : L.length} sonuç` : 'Bu aramayla mağaza bulunamadı.';
      } else {
        const d = rhDef();
        t = d.t;
        more = d.L.length > 40;
        L = d.L.slice(0, 40);
      }
      $('rhT').innerHTML = t;
      $('rhL').innerHTML = rhRows(L);
      $('rhMore').hidden = !more;
      return;
    }
    if (e.target.id === 'ikQ') {
      const q = nrm(e.target.value);
      document.querySelectorAll('#ikL [data-ikv]').forEach(li => {
        li.hidden = !!q && !li.dataset.q.includes(q);
      });
      return;
    }
    if (e.target.id !== 'dpQ') return;
    const q = nrm(e.target.value);
    let n = 0;
    document.querySelectorAll('#dpPick [data-dpst]').forEach(b => {
      const ok = !q || nrm(b.textContent + ' ' + (b.dataset.q || '')).includes(q);
      b.hidden = !ok;
      if (ok) n++;
    });
    $('dpNone').hidden = n > 0;
  });
  window.__renderIc = reset => {
    if (reset) ui = { page: 'home' };
    D.stores[0].name = myName();
    ykApply();
    drawYk();
    istApply();
    drawIst();
    render();
  };
  ykApply();
  drawYk();
  istApply();
  drawIst();
  window.__icSum = () => {
    const I = ist(),
      n = D.stores.length,
      nx = canSevk() ? sevkOf('me')[0] : null;
    return {
      n,
      vdGun: vdGunu(),
      sevk: nx
        ? `${gunAd(nx.tarih)} ${nx.saat} · ${nx.plaka}${durak(nx).length > 1 ? ` · ${durak(nx).indexOf('me') + 1}. sıradasın (${durak(nx).length} mağaza)` : ''}`
        : null,
      sevkBs: D.sevk.filter(x => x.tarih === today()).length,
      sevkYarin: D.sevk.filter(x => x.tarih === dstr(1)).length,
      grup: grupUnread().length,
      staff: isStaff(),
      ist: I,
      ustU: giris() && giris().tip === 'pm' ? ustTumU() : 0,
      ustK: giris() && giris().tip === 'pm' ? ustKey() : '',
      pmU: kad() === 'pm' ? bsPeople().reduce((a, p) => a + pmUnreadOf(nrm(p.ad)).length, 0) : 0,
      bsg: bsUnread().length,
      sk: D.stores.filter(s => msktOf(s.id)).length,
      rp: D.stores.filter(s => raporOf(s.id)).length,
      open: D.requests.filter(r => r.to.some(id => !answered(r, id))).length,
      svWait: D.savunma.filter(s => !s.cevap).length,
      svNew: D.savunma.filter(s => s.cevap && !s.sonuc).length,
      mskt: !!myMskt(),
      rapor: !!myRapor(),
      wait: myReqs().filter(r => !answered(r, 'me')).length,
      sv: D.savunma.filter(s => isMine(s) && !s.cevap).length,
      izB: izBekl().length,
      ikB: isIk() ? D.ise.filter(x => x.durum === 'ik').length : 0,
      iseEk: canIse() ? D.ise.filter(x => x.store === 'me' && x.durum === 'eksik').length : 0
    };
  };
  window.__icGo = (p, id) => {
    if (window.__setTab) window.__setTab('c');
    ui = {
      page: p,
      id: id || null,
      form: p === 'new' ? newForm() : p === 'svnew' ? svForm() : p === 'izin' ? {} : null
    };
    render();
  };
  // giriş yapınca: bekleyen savunma ya da talep varsa bildirim
  window.__icLogin = () => {
    const g = giris();
    ui = { page: 'home' };
    render();
    updBell();
    vdHatirlat();
    if (!g || g.tip !== 'magaza') return;
    if (isStaff()) {
      const s2 = D.savunma.find(x => isMine(x) && !x.cevap);
      if (s2) showNote('🔔 Savunman isteniyor', s2.olay + ' · son gün ' + fmtD(s2.son), { sv: s2.id });
      else {
        const gu = grupUnread();
        if (gu.length)
          showNote(
            `💬 Mağaza grubu: ${gu.length} yeni mesaj`,
            gu[gu.length - 1].from + ': ' + gu[gu.length - 1].text,
            {}
          );
      }
      return;
    }
    const sv = D.savunma.find(x => isMine(x) && !x.cevap);
    if (sv) return showNote('🔔 Savunman isteniyor', sv.olay + ' · son gün ' + fmtD(sv.son), { sv: sv.id });
    const w = myReqs().filter(r => !answered(r, 'me'));
    if (w.length) showNote(`🔔 BS'den ${w.length} talep yanıt bekliyor`, w[0].title, { req: w[0].id });
  };
  setTimeout(() => {
    if (window.__renderHome && !$('homeView').hidden) window.__renderHome();
  }, 0);
  window.__icReset = () => {
    D = seed();
    D.savunma = seedSv();
    save();
    ui = { page: 'home' };
    render();
  };
  render();
})();
