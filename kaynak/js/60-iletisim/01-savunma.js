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
