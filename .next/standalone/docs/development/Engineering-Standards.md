# PEKEFE Engineering Standards (Yazılım Standartları)

Bu doküman, PEKEFE yazılım mimarisinin kod kalitesi, performans ve güvenlik kurallarını tanımlar.

---

## 1. Mimari Prensipler
*   **Atomic Design:** Ortak UI bileşenleri `src/components/ui/` altında atomik kurallarla yazılmalıdır. Sayfalarda ham HTML/CSS butonu veya girdi alanı kullanılmamalı, `<Button />` ve `<Input />` bileşenleri import edilmelidir.
*   **Feature Based Architecture:** Sayfa rotaları `(shop)` gibi mantıksal gruplar altında toplanmalı ve layout paylaşımları optimize edilmelidir.

---

## 2. Kodlama Kuralları
*   **React 19 & Next.js 16:** Sunucu ve İstemci bileşenlerinin sınırları net çizilmelidir. `"use client"` direktifi sadece istemci etkileşimi (state, onClick, useEffect) barındıran alt yapraklarda kullanılmalıdır.
*   **Path Aliasing:** Import işlemlerinde bağıl yollar (`../../components`) yerine her zaman `@/components` şeklinde tanımlanmış takma adlar (path alias) kullanılmalıdır.

---

## 3. Performans ve SEO
*   **Görsel Optimizasyonu:** `<img>` etiketleri Next.js `<Image>` bileşenine dönüştürülmeli, resim boyutları (width, height) ve nemli LCP görselleri için `priority` niteliği tanımlanmalıdır.
*   **Lighthouse Standartları:** Her yeni özellik eklendikten sonra Lighthouse testleri yapılmalı, Performans ve SEO puanlarının minimum 95 olması sağlanmalıdır.
*   **Schema Markup:** Ürün sayfalarında `Product` ve `AggregateRating` JSON-LD şemaları, yemek tariflerinde ise `Recipe` şeması eksiksiz render edilmelidir.
