# Mağaza Asistanı

Uygulamanın güncel sürümü: `index.html`. Android uygulaması her açılışta bu dosyayı indirir ve kendini günceller.


## Kaynak kod

Uygulama tek bir `index.html` olarak çalışır (APK bu dosyayı indirir). Kod okunur olsun diye parçalara ayrıldı:

```
derle.py              parçaları birleştirip index.html üretir
kaynak/sayfa.html     sayfa iskeleti (ekranların HTML'i); <!-- @dahil ... --> satırları dosyaların yerini gösterir
kaynak/css/ana.css    tüm görünüm
kaynak/veri/bim-veri.json   mağaza ve bölge listesi
kaynak/js/            ekran başına bir dosya, yükleme sırasına göre numaralı
  01-magaza-gocu.js        eski örnek mağaza adlarını gerçek listeye taşır
  02-magaza-listesi.js     mağaza listesi: arama, kod, bölge (window.__mg)
  03-tema-baslangic.js     sayfa açılırken renk/koyu mod
  04-giris-kilidi.js       giriş yapılmadıysa ekranı kilitler
  10-vardiya.js            vardiya planı, çalışanlar, ayarlar (window.__vardiya)
  20-barkod.js             kamerayla barkod okuma
  21-skt.js                SKT kontrolü, fire, sabah turu
  30-ay-basi.js            ay başı: kontrol listesi, ciro ve saat hedefi, BS raporu
  31-aktuel.js             aktüel ürünler
  40-kullanici-girisi.js   eski kullanıcı kodu + şifre girişi (kapalı)
  41-giris.js              sicil + SMS girişi, roller, otomatik çıkış
  42-grafikler.js          ciro ve fire grafikleri
  43-pano-formlari.js      sipariş günleri, mevcut listesi, yıllık gelişim, masraf
  50-ana-sayfa.js          ana sayfa
  60-iletisim.js           iletişim, BS/PM/depo/İK ekranları, kademe zinciri
  70-tema-ayarlari.js      Ayarlar › Görünüm
```

Değişiklik yaptıktan sonra: `python3 derle.py` → `index.html` güncellenir.
