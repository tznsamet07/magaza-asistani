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
