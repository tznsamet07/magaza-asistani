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
