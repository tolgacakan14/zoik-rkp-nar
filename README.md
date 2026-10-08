# Zoi Kırkpınar QR Menü

Mobil odaklı, kategori ve ürün araması olan Zoi Kırkpınar menüsü. Ürünler altışar yüklenir; nargile menüsünde en fazla iki aromanın fiziksel katman olarak görüldüğü etkileşimli 3B model bulunur.

```bash
npm install
npm run dev
```

Yerel geliştirme adresi terminalde Vite tarafından gösterilir. Statik çıktı için `npm run build` komutu `dist-local/` klasörünü üretir. Menü verisini kontrol etmek için `npm run audit:menu` kullanılabilir.

## Menü yönetimi

Ana yönetim tablosu: [ZOI Kırkpınar · Menü Yönetimi](https://docs.google.com/spreadsheets/d/1TZL5VfTyn5ysH1DGdNKimF7F2lkkZHAK2OQD3LV7GKk/edit)

- `Menü`: fiyat, stok, görünürlük, açıklama, görsel ve ürün önerileri
- `Nargile`: aroma adı, seri, fiyat, renk, etiket ve stok durumu
- `Ayarlar`: nargile servis fiyatları ve iki aromalık seçim sınırı
- `Aktif`: ürünü gösterir, `Tükendi`: gösterir ve seçimi kapatır, `Gizli`: menüden kaldırır

Vercel üzerindeki `/api/menu` uç noktası tabloyu okur. Tablo erişilemezse site kesintiye uğramadan `data/menu.json` ve `data/hookah.ts` içindeki doğrulanmış yerel veriye döner. Kafenin düzenleyebilmesi ve canlı eşitlemenin çalışması için Google Sheets paylaşım ayarlarından ilgili işletme hesabına düzenleyici, bağlantıya ise görüntüleyici erişimi verilmelidir.

## GoPOS fiyat senkronu

GitHub Actions her 15 dakikada bir gerçek GoPOS QR menüsünü Chromium ile açar. Ürünler adlarıyla eşleştirilir; değişen fiyatlar `data/menu.json` ve `data/gopos-prices.json` içine yazılarak otomatik commit edilir. Commit Vercel dağıtımını tetikler. GoPOS fiyatları Google Sheets fiyat alanından önceliklidir; stok, görünürlük, açıklama ve öneriler Google Sheets üzerinden yönetilmeye devam eder.
