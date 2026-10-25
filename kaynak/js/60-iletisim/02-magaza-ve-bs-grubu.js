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
