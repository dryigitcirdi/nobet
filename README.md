# VIGIL — Ultra-Premium iOS Nöbet & İcap Takip Sistemi (PWA)

Apple, Linear, Arc Browser ve Porsche tasarım felsefesiyle inşa edilmiş; iPhone Safari üzerinden açılıp **"Ana Ekrana Ekle"** dendiğinde yerel bir iOS uygulaması gibi çalışan, canlı nöbetçi ve icapçı hekim takip sistemi.

---

## 📱 iPhone Safari'de Kurulum (Ana Ekrana Ekleme)

1. iPhone'unuzda **Safari** tarayıcısını açın.
2. Uygulama bağlantısına (veya yerel test IP adresinize) gidin.
3. Safari'nin altındaki **Paylaş** simgesine (`⎋`) dokunun.
4. Menüyü hafifçe aşağı kaydırıp **"Ana Ekrana Ekle"** (Add to Home Screen) seçeneğine dokunun.
5. Sağ üstteki **"Ekle"** butonuna basın.
6. Artık iPhone ana ekranınızda özel tasarlanmış titanyum logolu **VIGIL** simgesi belirecek ve Safari adres çubuğu olmadan tam ekran bir uygulama olarak açılacaktır!

---

## 📊 Google Drive / E-Tablo ile Nöbet Listesi Nasıl Hazırlanır?

Uygulama, Google Drive üzerinde oluşturacağınız bir Google E-Tablosu (Google Sheets) ile canlı senkronize çalışır.

### Adım 1: Google E-Tablo Oluşturma
Google Drive'ınıza girin (`drive.google.com`) ve **Yeni > Google E-Tablolar** seçeneğine tıklayın.

### Adım 2: Sütun Başlıklarını Yazma
Tablonun **1. satırına** aşağıdaki sütun başlıklarını yazın:

| A (Tarih) | B (Nöbetçi) | C (Branş / Rol) | D (Nöbetçi Tel) | E (İcapçı) | F (İcapçı Rol) | G (İcapçı Tel) | H (Notlar) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 20.09.2026 | Prof. Dr. Cihan Karadağ | Klinik Şefi | 05328901234 | Doç. Dr. Melis Sancak | İcapçı Uzman | 05334567890 | 08:00 - 08:00 Vardiyası |
| 21.09.2026 | Op. Dr. Barış Akın | Acil Cerrahi | 05356789012 | Doç. Dr. Ece Doğanay | Nöroradyoloji | 05301234567 | Yoğun Bakım Destek |

> **Tarih Formatı:** `GG.AA.YYYY` (Örn: `20.09.2026`), `GG/AA/YYYY` veya `YYYY-AA-GG` formatlarının tamamı otomatik algılanır.

### Adım 3: Tabloyu Paylaşma
1. E-Tablo sayfasının sağ üst köşesindeki **Paylaş** butonuna tıklayın.
2. "Genel erişim" ayarını **"Bağlantıya sahip olan herkes: Görüntüleyen"** yapın.
3. **Bağlantıyı Kopyala** butonuna basın.

### Adım 4: Uygulamaya Bağlama
1. VIGIL uygulamasında alttaki **"Drive"** (Ayarlar) sekmesine geçin.
2. Kopyaladığınız bağlantıyı **"Google E-Tablo Bağlantısı"** kutusuna yapıştırın.
3. **"Bağla ve Senkronize Et"** butonuna dokunun.
4. Tüm ekip artık tablonuzu canlı olarak telefonlarından takip edebilir!

---

## 🚀 Ücretsiz ve Hızlı Canlıya Alma (Deployment)

Uygulama sıfır sunucu kurulumu gerektirir. Şu platformlardan herhangi birine tek tıkla yükleyebilirsiniz:

- **Vercel**: Proje klasörünü sürükleyip bırakın veya GitHub deponuzu bağlayın.
- **Netlify**: Klasörü `app.netlify.com/drop` alanına sürükleyin.
- **GitHub Pages**: Depo ayarlarından `Pages > Deploy from main branch` seçeneğini aktif edin.

---

## ✨ Özellikler & Mühendislik Detayları

- **3D Tilt & Specular Physics**: Kartlarda jiroskop ve dokunma hareketine göre hareket eden 60 FPS holografik yansıma.
- **Offline / Çevrimdışı Çalışma**: Service Worker ve LocalStorage önbellekleme sayesinde ameliyathanede veya sığınakta bile nöbet listesi 0 milisaniyede açılır.
- **Tek Dokunuşla Arama & SMS**: Nöbetçi veya icapçı hekime tek tuşla anında çağrı başlatma.
- **Apple Minimal Takvim**: Aylık nöbet matrisi ve renk kodlu görev göstergeleri.
