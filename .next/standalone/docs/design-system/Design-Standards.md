# PEKEFE Design Standards (Tasarım Sistemi ve Standartları)

PEKEFE tasarım sistemi; modern, minimal, editoryal ve zamansız bir lüks algısı oluşturmak üzere kurgulanmıştır.

---

## 1. Renk Standartları (Color Tokens)
Renkler, globals.css içindeki `@theme` yapılandırmasından beslenir.
*   **Fildişi Krem (`--color-background`):** `#F9F9FF`
    *   *Kural:* Sayfa arka planlarında saf beyaz yerine bu mat krem tonu kullanılmalıdır.
*   **Asil Lacivert-Siyah (`--color-on-background`):** `#111C2D`
    *   *Kural:* Okunabilirliği yüksek tutmak için tüm ana metinlerde ve ikonlarda tercih edilmelidir.
*   **Pekmez Burgundy (`--color-primary`):** `#610000`
    *   *Kural:* Eylem butonlarında ve birincil marka vurgularında idareli kullanılmalıdır.
*   **Zanaatkar Altın (`--color-secondary`):** `#775A19`
    *   *Kural:* Sertifika rozetlerinde, mevsimsel etiketlerde ve narin vurgularda kullanılır.
*   **Toprak Kahve (`--color-outline`):** `#8E706B`
    *   *Kural:* Editoryal çizgiler ve narin bölmeler için ana renktir.

---

## 2. Tipografi Kuralları (Typography)
*   **Serif Başlıklar (Playfair Display):**
    *   *Kullanım:* Büyük ekran başlıkları, hikaye anlatımı, alıntılar.
*   **Sans-Serif Metinler (Manrope):**
    *   *Kullanım:* Ürün açıklamaları, laboratuvar değerleri, sepet listeleri, B2B tabloları.
*   **Hizalama:** Editoryal dergi hissi için asimetrik yerleşimler, geniş harf boşlukları (`letter-spacing`) tercih edilmelidir.

---

## 3. Boşluk ve Grid (Spacing & Grid)
*   **Boşluk Ölçeği:** `4px`, `8px`, `16px`, `24px`, `48px`, `96px` standartlarına sadık kalınmalıdır.
*   **Grid:** Masaüstünde 12 sütunlu asimetrik grid kullanılır. Ürün kartları listelenirken asimetrik alternate sıralama düzeni korunmalıdır.

---

## 4. Yumuşaklık ve Derinlik (Radius & Shadow)
*   **Köşe Yumuşatma (Border Radius):** Buton ve girdi alanlarında `8px` (md), kartlarda `16px` (xl) kullanılmalıdır.
*   **Gölge (Elevation):** Mat kağıt hissini korumak için kalın gölgelerden kaçınılmalı, burgundy pigmentli ultra hafif `premium-shadow` (`rgba(139,0,0,0.04)`) tercih edilmelidir.
