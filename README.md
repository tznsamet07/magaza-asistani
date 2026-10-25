# Mağaza Asistanı

Uygulamanın güncel sürümü: `index.html`. Android uygulaması her açılışta bu dosyayı indirir ve kendini günceller.


## Kaynak kod

Uygulama tek bir `index.html` olarak çalışır (APK bu dosyayı indirir). Kod okunur olsun diye parçalara ayrıldı; `derle.py` hepsini birleştirip `index.html`'i üretir.

```
derle.py                 parçaları birleştirir → index.html
kaynak/sayfa.html        sayfa iskeleti; <!-- @dahil ... --> satırları dosyaların yerini gösterir
kaynak/css/ana.css       tüm görünüm
kaynak/veri/bim-veri.json  mağaza ve bölge listesi
kaynak/js/               yükleme sırasına göre numaralı; klasörler tek bir blok olarak birleştirilir
  01-magaza-gocu.js        eski örnek mağaza adlarını gerçek listeye taşır
  02-magaza-listesi.js     mağaza listesi: arama, kod, bölge (window.__mg)
  03-tema-baslangic.js     sayfa açılırken renk ve koyu mod
  04-giris-kilidi.js       giriş yapılmadıysa ekranı kilitler
  10-vardiya/              vardiya planı (window.__vardiya)
    00-durum-ve-kurallar, 01-calisanlar-ve-ayarlar, 02-otomatik-dagitim, 03-tablo,
    04-hafta-secimi, 05-hucre-menusu-ve-izinler, 06-yedekleme-ve-disa-acilanlar
  11-vardiya-ayarlari.js   Vardiya › Plan / Vardiya ayarları geçişi
  20-barkod.js             kamerayla barkod okuma
  21-skt/                  SKT: hatırlatma, ürünler, kamera, fire, sabah turu, sevkiyat, kim ne yaptı
  30-ay-basi/              kontrol listesi, ciro ve saat hedefi, BS raporu, bilgi toplama (Excel), kontrol/iade
  31-aktuel.js             aktüel ürünler
  40-kullanici-girisi.js   eski kullanıcı kodu + şifre girişi (kapalı, uygulamayı yönetici modunda başlatır)
  41-giris.js              sicil + SMS girişi, roller, otomatik çıkış
  42-grafikler.js          ciro ve fire grafikleri
  43-pano-formlari.js      sipariş günleri, mevcut listesi, yıllık gelişim, masraf
  50-ana-sayfa.js          ana sayfa
  60-iletisim/             iletişim: savunma, gruplar, kurum, PM/kademe, izin, yükselme, kayıt onayı,
                           BS panosu, vardiya bildirimleri, işe giriş, sevkiyat, ekranlar, bildirimler, yetkiler
  70-tema-ayarlari.js      Ayarlar › Görünüm
testler/                 ekran testleri (Playwright)
```

### Değişiklik yapınca

1. `kaynak/` altındaki dosyayı düzenle.
2. `python3 derle.py` → `index.html` güncellenir.
3. `node testler/calistir.js` → tüm testler çalışır (önce bir kez: `npm i playwright && npx playwright install chromium`). Tek test için: `node testler/calistir.js vd71`.

Not: Klasördeki dosyalar aynı fonksiyonun içinde devam eder; bir klasördeki dosyaları ayrı ayrı açıp kapatmayın, sıralarını değiştirmeyin.
