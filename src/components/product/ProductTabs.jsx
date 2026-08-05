"use client";

import { Button } from "@/components/ui/Button";

/**
 * ProductTabs
 * Four-tab info panel: Description · Harvest Story · Nutrition Analysis · Customer Reviews.
 *
 * Extracted from urun/[slug]/page.js (lines 792-1205).
 *
 * All state (activeTab, reviewsList, etc.) is lifted to the parent page for minimal coupling.
 */
export function ProductTabs({
  product,
  activeTab,
  setActiveTab,
  // Tab 1
  fullDescriptionText,
  specificationsList,
  // Tab 2
  harvestStoryText,
  ingredientsText,
  // Tab 3
  nutrientsData,
  hmfLevelText,
  ritualText,
  // Tab 4
  reviewsList,
  setIsReviewModalOpen,
}) {
  /** Shared header banner layout used by each tab */
  const TabHeader = ({ icon, label, subtitle, badge }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/15 pb-6">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary block">{label}</span>
          <h3 className="font-display-lg text-primary text-2xl md:text-3xl font-bold tracking-tight">{subtitle}</h3>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-secondary/5 text-secondary px-3.5 py-1.5 rounded-full border border-secondary-container text-xs font-bold font-mono">
        {badge}
      </div>
    </div>
  );

  const tabClass = (key) =>
    `flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer text-center ${
      activeTab === key
        ? "bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/40"
        : "text-on-surface-variant hover:text-primary hover:bg-surface/70"
    }`;

  return (
    <div className="border-t border-outline-variant/15 pt-12">
      {/* Segmented Tab Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-2 rounded-2xl border border-outline-variant/20 bg-surface-container-low/90 shadow-sm mb-8">
        <button onClick={() => setActiveTab("urun_aciklamasi")} className={tabClass("urun_aciklamasi")}>
          <span className="material-symbols-outlined text-lg shrink-0">description</span>
          <span className="truncate">Ürün Açıklaması</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${activeTab === "urun_aciklamasi" ? "bg-secondary/70 text-on-surface" : "bg-primary/10 text-primary"}`}>
            Özel Reçete
          </span>
        </button>
        <button onClick={() => setActiveTab("aciklama")} className={tabClass("aciklama")}>
          <span className="material-symbols-outlined text-lg shrink-0">auto_stories</span>
          <span className="truncate">Mahsul Hikayesi &amp; Detaylar</span>
        </button>
        <button onClick={() => setActiveTab("besin")} className={tabClass("besin")}>
          <span className="material-symbols-outlined text-lg shrink-0">science</span>
          <span className="truncate">Analiz &amp; Besin Değerleri</span>
        </button>
        <button onClick={() => setActiveTab("yorumlar")} className={tabClass("yorumlar")}>
          <span className="material-symbols-outlined text-lg shrink-0">rate_review</span>
          <span className="truncate">Müşteri Yorumları ({reviewsList.length})</span>
        </button>
      </div>

      <div className="py-4 min-h-[350px]">
        {/* ── TAB 1: ÜRÜN AÇIKLAMASI ── */}
        {activeTab === "urun_aciklamasi" && (
          <div className="bg-surface dark:bg-on-surface border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <TabHeader
              icon="description"
              label="PEKEFE ÖZEL REÇETE VE AÇIKLAMA"
              subtitle={`${product?.name} Hakkında Detaylı Açıklama`}
              badge={<><span className="material-symbols-outlined text-base text-secondary">verified</span><span>%100 Doğal İspir Hasadı</span></>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left: Rich Description */}
              <div className="lg:col-span-8 space-y-8">
                {fullDescriptionText && /\<[a-z][\s\S]*>/.test(fullDescriptionText) ? (
                  <div
                    className="text-on-surface-variant font-body-md leading-relaxed font-light text-base md:text-lg prose max-w-none dark:prose-invert prose-headings:text-primary prose-strong:text-primary prose-strong:font-bold"
                    dangerouslySetInnerHTML={{ __html: fullDescriptionText }}
                  />
                ) : (
                  <div className="text-on-surface-variant font-body-md leading-relaxed font-light text-base md:text-lg whitespace-pre-line space-y-4">
                    {fullDescriptionText}
                  </div>
                )}

                {/* Pillar Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-outline-variant/15">
                  {[
                    { icon: "verified", title: "%100 Doğal İçerik", desc: "Katkı maddesi, koruyucu veya ilave şeker içermez." },
                    { icon: "terrain", title: "İspir Yöresi Hasadı", desc: "İspirin bereketli yaylalarında yetişen asırlık mahsuller.", color: "text-secondary" },
                    { icon: "local_fire_department", title: "Odun Ateşinde Bakır Kazan", desc: "Geleneksel yöntemlerle kısık ateşte yavaş pişirme." },
                  ].map(({ icon, title, desc, color }) => (
                    <div key={title} className="p-5 bg-surface-container-low border border-outline-variant/15 rounded-2xl flex items-start gap-3 shadow-xs">
                      <span className={`material-symbols-outlined ${color || "text-primary"} text-2xl`}>{icon}</span>
                      <div>
                        <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">{title}</h4>
                        <p className="text-xs text-on-surface-variant font-light mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Attribute Summary */}
              <div className="lg:col-span-4 space-y-6 bg-surface-container-low/70 p-7 rounded-2xl border border-outline-variant/20 shadow-inner">
                <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                  <span className="material-symbols-outlined text-primary text-2xl">info</span>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Ürün Özet Nitelikleri</h4>
                    <p className="text-xs text-on-surface-variant font-light">Öne çıkan temel teknik bilgiler</p>
                  </div>
                </div>
                <div className="space-y-3.5">
                  {[
                    ["Kategori", product?.categoryDisplay || product?.category || "Geleneksel"],
                    ["Stok Kodu (SKU)", product?.sku || "PRD-PKF-001"],
                    ...(product?.barcode ? [["Barkod", product.barcode]] : []),
                    ["Hasat Yeri", "Erzurum / İspir"],
                    ["Yayla Yüksekliği", product?.attributes?.altitude || product?.altitude || "2200 Metre"],
                  ].map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                      <span className="text-xs text-on-surface-variant font-semibold">{key}</span>
                      <span className="text-xs text-primary font-bold font-mono">{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                    <span className="text-xs text-on-surface-variant font-semibold">Stok Durumu</span>
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                      {product?.status || "Stokta Var"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MAHSUL HİKAYESİ ── */}
        {activeTab === "aciklama" && (
          <div className="bg-surface dark:bg-on-surface border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <TabHeader
              icon="auto_stories"
              label="PEKEFE ZANAATKARLIK VE YAVAŞ ÜRETİM"
              subtitle="Asırlık Zanaatkarlık ve Yavaş Üretim"
              badge={<><span className="material-symbols-outlined text-base text-secondary">local_fire_department</span><span>Geleneksel Odun Ateşi</span></>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 space-y-6">
                {typeof harvestStoryText === "string" && /\<[a-z][\s\S]*>/.test(harvestStoryText) ? (
                  <div
                    className="text-on-surface-variant font-body-md leading-relaxed font-light text-base md:text-lg prose max-w-none dark:prose-invert prose-headings:text-primary prose-strong:text-primary prose-strong:font-bold"
                    dangerouslySetInnerHTML={{ __html: harvestStoryText }}
                  />
                ) : (
                  <div className="text-on-surface-variant font-body-md leading-relaxed font-light text-base md:text-lg whitespace-pre-line">
                    {harvestStoryText}
                  </div>
                )}
                <div className="p-6 bg-surface-container-low border border-outline-variant/15 rounded-2xl space-y-2.5 shadow-xs">
                  <span className="text-[10px] text-secondary font-extrabold uppercase tracking-widest block">İçindekiler Temizliği</span>
                  <p className="text-base font-bold text-primary">{ingredientsText}</p>
                  <p className="text-xs text-on-surface-variant font-light">Renklendirici, koruyucu, nişasta bazlı glikoz veya aroma verici sentetikler içermez.</p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6 bg-surface-container-low/70 p-7 rounded-2xl border border-outline-variant/20 shadow-inner">
                <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
                  <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Teknik Spesifikasyonlar</h4>
                    <p className="text-xs text-on-surface-variant font-light">Laboratuvar &amp; ambalaj detayları</p>
                  </div>
                </div>
                <div className="space-y-3.5">
                  {specificationsList.map((spec, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                      <span className="text-xs text-on-surface-variant font-semibold">{spec.key}</span>
                      <span className="text-xs text-primary font-bold font-mono">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: ANALİZ & BESİN DEĞERLERİ ── */}
        {activeTab === "besin" && (
          <div className="bg-surface dark:bg-on-surface border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <TabHeader
              icon="science"
              label="PEKEFE LABORATUVAR VE BESİN ANALİZİ"
              subtitle="100g Besin Değerleri ve Analiz Raporu"
              badge={<><span className="material-symbols-outlined text-base text-secondary">verified</span><span>Akredite Laboratuvar Raporlu</span></>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Nutrients Table */}
              <div className="lg:col-span-6 bg-surface-container-low/70 p-7 rounded-2xl border border-outline-variant/20 shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20">
                      <th className="py-3.5 font-display-lg text-xs uppercase tracking-wider font-extrabold text-primary">Besin Ögesi</th>
                      <th className="py-3.5 font-display-lg text-xs uppercase tracking-wider font-extrabold text-primary text-right">100g Değeri</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono text-on-surface-variant">
                    {[
                      ["Enerji (Energy)", nutrientsData.energy, "text-primary"],
                      ["Karbonhidrat (Carbohydrate)", nutrientsData.carb, "text-primary"],
                      ["Protein (Protein)", nutrientsData.protein, "text-primary"],
                      ["Kalsiyum (Calcium)", nutrientsData.calcium, "text-primary"],
                      ["Demir (Iron)", nutrientsData.iron, "text-primary"],
                      ["HMF Değeri (Analiz)", hmfLevelText, "text-secondary"],
                    ].map(([label, value, cls]) => (
                      <tr key={label} className="border-b border-outline-variant/10">
                        <td className="py-3 font-semibold text-on-surface-variant">{label}</td>
                        <td className={`py-3 text-right font-bold ${cls}`}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ritual + Disclaimer */}
              <div className="lg:col-span-6 space-y-6">
                <div className="p-7 bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl shadow-inner space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-2xl">restaurant_menu</span>
                    <h4 className="font-display-lg text-primary text-base font-bold">Tüketim &amp; Servis Ritüeli</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-light">{ritualText}</p>
                </div>

                <div className="flex items-center gap-3.5 bg-secondary/10 border-2 border-secondary/40 p-4 rounded-2xl shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-secondary text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-xl">info</span>
                  </div>
                  <span className="text-xs md:text-sm font-bold text-secondary dark:text-secondary-container leading-relaxed">
                    Yukarıdaki değerler akredite gıda laboratuvarı mevsimsel analiz raporlarına dayanmaktadır.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: MÜŞTERİ YORUMLARI ── */}
        {activeTab === "yorumlar" && (
          <div className="bg-surface dark:bg-on-surface border-2 border-primary/20 rounded-3xl p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <TabHeader
              icon="rate_review"
              label="PEKEFE MÜŞTERİ DENEYİMİ VE DEĞERLENDİRMELERİ"
              subtitle={`Doğrulanmış Müşteri Yorumları (${reviewsList.length})`}
              badge={<><span className="material-symbols-outlined text-base text-secondary">star</span><span>5.0 / 5 Tam Puan</span></>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Rating Summary */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-surface-container-low/70 p-7 rounded-2xl border border-outline-variant/20 text-center shadow-inner space-y-4">
                  <div className="text-5xl font-display-lg text-primary font-bold">5.0</div>
                  <div className="flex justify-center text-secondary gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <div className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                    {reviewsList.length} Doğrulanmış Müşteri
                  </div>
                  <Button className="w-full py-3.5 cursor-pointer shadow-md" onClick={() => setIsReviewModalOpen(true)}>
                    Yorum Gönder
                  </Button>
                </div>
              </div>

              {/* Review Cards */}
              <div className="lg:col-span-8 space-y-4">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="p-6 bg-surface-container-low/50 border border-outline-variant/15 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex text-secondary gap-0.5 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: i < rev.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                          ))}
                        </div>
                        <div className="font-bold text-xs text-primary uppercase tracking-wide flex items-center gap-1.5">
                          <span>{rev.author}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-mono font-bold">Doğrulanmış Alıcı</span>
                        </div>
                      </div>
                      <span className="text-on-surface-variant/80 text-[10px] font-mono">{rev.date}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-light">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
