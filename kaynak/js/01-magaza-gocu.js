/* Eski örnek mağaza adları gerçek Kayseri (9516) mağazalarına taşınır (bir kez). */
(function () {
  try {
    if (localStorage.getItem('magaza-mgv')) return;
    var A = [
      ['Merkez 1234', 'Fevzi Çakmak 3373'],
      ['Kocasinan 5521', 'Sahabiye 3379'],
      ['Kum 7815', 'Serçeönü 3360'],
      ['Kum mağazasına', 'Serçeönü mağazasına'],
      ['Melikgazi 4410', 'Esenyurt 3375'],
      ['Talas 3378', 'Yunusemre 3957'],
      ['Hacılar 6102', 'Mimsin 3390'],
      ['İncesu 2290', 'Gönenkent B982'],
      ['Erciyes 9124', 'Erciyes Cad. 3782'],
      ['Kayseri Bölge Müdürlüğü deposu', 'Kayseri deposu (9516)']
    ];
    ['market-vardiya-v3', 'magaza-iletisim-demo', 'magaza-giris'].forEach(function (k) {
      var v = localStorage.getItem(k);
      if (!v) return;
      A.forEach(function (x) {
        v = v.split(x[0]).join(x[1]);
      });
      localStorage.setItem(k, v);
    });
    localStorage.setItem('magaza-mgv', '1');
  } catch (e) {}
})();
/* Demo bölge Kayseri 9516'dan Antalya Döşemealtı-2 (9562) bölgesine taşındı (emir'in kendi bölgesi, 2026-10-17). */
(function () {
  try {
    if (localStorage.getItem('magaza-mgv') === '2') return;
    var A = [
      ['Fevzi Çakmak 3373', 'Bağyaka - Finike'],
      ['Sahabiye 3379', 'Acısu K767'],
      ['Serçeönü 3360', 'Akçay O583'],
      ['Serçeönü mağazasına', 'Akçay mağazasına'],
      ['Esenyurt 3375', 'Yeni Kumluca - Kumluca K688'],
      ['Yunusemre 3957', 'Cumhuriyet L927'],
      ['Mimsin 3390', 'Milli Egemenlik R168'],
      ['Gönenkent B982', 'Kalkan-Kaş. K671'],
      ['Erciyes Cad. 3782', 'Yeni Adnanmenderes K735'],
      ['Kayseri deposu (9516)', 'Döşemealtı-2 deposu (9562)'],
      ['Kayseri Bölge Müdürlüğü', 'Antalya Bölge Müdürlüğü'],
      ['Kayseri 3. bölge', 'Finike bölgesi'],
      ['Talas bölgesi', 'Kumluca bölgesi'],
      ["Talas'ta", "Kumluca'da"],
      ['Develi bölgesi', 'Kaş bölgesi'],
      ['Develi', 'Kaş'],
      ['Melikgazi bölgesi', 'Konyaaltı bölgesi'],
      ['Kocasinan bölgesi', 'Kepez bölgesi'],
      ['Hacılar bölgesi', 'Kemer bölgesi'],
      ['Merkez 1234', 'Akçay O583']
    ];
    ['market-vardiya-v3', 'magaza-iletisim-demo', 'magaza-giris'].forEach(function (k) {
      var v = localStorage.getItem(k);
      if (!v) return;
      A.forEach(function (x) {
        v = v.split(x[0]).join(x[1]);
      });
      localStorage.setItem(k, v);
    });
    localStorage.setItem('magaza-mgv', '2');
  } catch (e) {}
})();
/* Bağyaka'nın mağaza kodu K700 (emir, 2026-10-17). */
(function () {
  try {
    if (localStorage.getItem('magaza-mgv') === '3') return;
    ['market-vardiya-v3', 'magaza-iletisim-demo', 'magaza-giris'].forEach(function (k) {
      var v = localStorage.getItem(k);
      if (!v) return;
      localStorage.setItem(k, v.replace(/Bağyaka - Finike(?! K700)/g, 'Bağyaka - Finike K700'));
    });
    localStorage.setItem('magaza-mgv', '3');
  } catch (e) {}
})();
window.__MGDEF = 'BAĞYAKA - FİNİKE K700';
