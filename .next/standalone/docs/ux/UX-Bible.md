# PEKEFE UX Bible (Kullanıcı Deneyimi Kılavuzu)

Bu kılavuz, platformdaki kullanıcı akışlarının (B2C, B2B ve Yönetici ERP alanları) standartlarını belirler.

---

## 1. B2C Alışveriş ve Sepet Deneyimi
*   **Sepet Çekmecesi (Drawer):** Sağ üst köşedeki sepet ikonuna tıklandığında kullanıcı yeni bir sayfaya yönlendirilmez. Sağdan kayarak açılan sepet çekmecesi aktif olur.
*   **Toast Bildirimleri:** Ürün sepete eklendiğinde tarayıcı pencerelerini donduran `alert()` pencereleri yerine, sağ alttan süzülen 3 saniyelik Toast bildirimleri gösterilir.
*   **Duyusal Açıklamalar:** Ürün detay sayfalarında sadece gramaj ve fiyat bilgisi değil, ürünün *Rakım, Hasat Sezonu, İçindekiler Şeffaflığı ve Tüketim Ritüeli* detaylıca açıklanmalıdır.

---

## 2. B2B Kurumsal Bayi Deneyimi
*   **Kredi Limiti Doğrulaması:** Sepet onay butonunun üzerinde bayinin kalan açık hesap kredi limiti dinamik olarak izlenmeli, limit aşımında sepet onayı engellenmeli ve kırmızı uyarı verilmelidir.
*   **Havale / EFT Kolaylığı:** Bayi cari ödeme bildirimlerinde, banka havale talimatları ve IBAN bilgileri (Garanti, Akbank) şık bir Modal penceresinde sunulmalıdır.
*   **Excel / CSV Yükleme:** Toplu koli siparişleri için bayi panelinin sağ üst köşesinde yer alan CSV yükleme alanı, sürükle-bırak kılavuzunu içeren bir Modal ile açılmalıdır.

---

## 3. Yönetici ERP Deneyimi
*   **Bütünleşik Veri Akışı:** Stok ekleme/çıkarma, sipariş onaylama veya cari hesap tahsilatı yapıldığında; Kasa net nakit dengesi, borç/alacak durumları ve stok alarmları anlık olarak ERP dashboard üzerinde güncellenmelidir.
*   **CRUD İşlemleri:** ERP tablolarındaki ekleme, düzenleme ve silme işlemleri pürüzsüz Modallar ile gerçekleştirilmeli, kullanıcıyı başka sayfalara yönlendirmemelidir.
