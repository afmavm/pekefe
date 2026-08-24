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
          <div className="bg-surface dark:bg-on-surface border-2 border-primary/20 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <TabHeader
              icon="description"
              label="PEKEFE ÖZEL REÇETE VE AÇIKLAMA"
              subtitle={`${product?.name} Hakkında Detaylı Açıklama`}
              badge={<><span className="material-symbols-outlined text-base text-secondary">verified</span><span>%100 Doğal İspir Hasadı</span></>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left: Rich Description */}
              <div className="lg:col-span-8 space-y-8">
                {fullDescriptionText && /\<[a-z][\s\S]*>/i.test(fullDescriptionText) ? (
                  <div
                    className="w-full text-slate-800 dark:text-slate-100 font-sans leading-relaxed text-base md:text-[16.5px] prose max-w-none dark:prose-invert prose-p:text-slate-700 dark:prose-p:text-slate-200 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base md:prose-p:text-[16.5px] prose-headings:text-primary dark:prose-headings:text-amber-400 prose-headings:font-black prose-headings:tracking-tight prose-h1:text-2xl md:prose-h1:text-3xl prose-h1:mt-6 prose-h1:mb-3 prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-5 prose-h2:mb-2.5 prose-h3:text-lg md:prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2 prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ul:my-4 prose-ul:text-slate-700 dark:prose-ul:text-slate-200 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2 prose-ol:my-4 prose-ol:text-slate-700 dark:prose-ol:text-slate-200 prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-secondary prose-blockquote:bg-secondary/5 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-slate-800 dark:prose-blockquote:text-slate-100 prose-blockquote:my-5 prose-table:w-full prose-table:my-6 prose-table:border-collapse prose-table:border prose-table:border-outline-variant/30 prose-table:rounded-2xl prose-table:overflow-hidden prose-table:shadow-xs prose-th:bg-surface-container-low prose-th:text-primary prose-th:font-extrabold prose-th:p-3.5 prose-th:border prose-th:border-outline-variant/20 prose-th:text-left prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-td:p-3.5 prose-td:border prose-td:border-outline-variant/20 prose-td:text-on-surface-variant prose-td:text-sm prose-img:rounded-2xl prose-img:shadow-md prose-img:my-4 prose-img:border prose-img:border-outline-variant/20 prose-img:max-w-full prose-a:text-secondary prose-a:font-bold prose-a:underline hover:prose-a:opacity-80"
                    dangerouslySetInnerHTML={{ __html: fullDescriptionText }}
                  />
                ) : (
                  <div className="text-slate-700 dark:text-slate-200 font-sans leading-relaxed text-base md:text-[16.5px] whitespace-pre-line space-y-4">
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
                    <div key={title} className="p-5 bg-surface-container-low border border-outline-variant/15 rounded-2xl flex items-start gap-3 shadow-xs hover:border-primary/30 transition-colors">
                      <span className={`material-symbols-outlined ${color || "text-primary"} text-2xl shrink-0`}>{icon}</span>
                      <div>
                        <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider">{title}</h4>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Attribute Summary */}
              <div className="lg:col-span-4 space-y-6 bg-surface-container-low/80 p-7 rounded-3xl border border-outline-variant/25 shadow-sm">
                <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">info</span>
                  </div>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Ürün Özet Nitelikleri</h4>
                    <p className="text-xs text-on-surface-variant font-medium">Öne çıkan temel teknik bilgiler</p>
                  </div>
                </div>
                <div className="space-y-3.5">
                  {[
                    ["Kategori", product?.categoryDisplay || product?.category || "Geleneksel"],
                    ["Stok Kodu (SKU)", product?.sku || "PRD-PKF-001"],
                    ...(product?.barcode ? [["Barkod", product.barcode]] : []),
                    ["Hasat Yeri / Menşei", product?.attributes?.specsMaterial || product?.specsMaterial || "Erzurum / İspir"],
                    ["Yayla Yüksekliği / Rakım", product?.attributes?.altitude || product?.altitude || "2200 Metre"],
                    ["Hasat Sezonu", product?.attributes?.harvestSeason || product?.harvestSeason || "Temmuz - Ağustos"],
                  ].map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                      <span className="text-xs text-on-surface-variant font-bold">{key}</span>
                      <span className="text-xs text-primary font-black font-mono">{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                    <span className="text-xs text-on-surface-variant font-bold">Stok Durumu</span>
                    <span className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-mono">
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
          <div className="bg-surface dark:bg-on-surface border-2 border-primary/20 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <TabHeader
              icon="auto_stories"
              label="PEKEFE ZANAATKARLIK VE YAVAŞ ÜRETİM"
              subtitle="Asırlık Zanaatkarlık ve Yavaş Üretim"
              badge={<><span className="material-symbols-outlined text-base text-secondary">local_fire_department</span><span>Geleneksel Odun Ateşi</span></>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 space-y-6">
                {typeof harvestStoryText === "string" && /\<[a-z][\s\S]*>/i.test(harvestStoryText) ? (
                  <div
                    className="w-full text-slate-800 dark:text-slate-100 font-sans leading-relaxed text-base md:text-[16.5px] prose max-w-none dark:prose-invert prose-p:text-slate-700 dark:prose-p:text-slate-200 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold prose-headings:text-primary dark:prose-headings:text-amber-400"
                    dangerouslySetInnerHTML={{ __html: harvestStoryText }}
                  />
                ) : (
                  <div className="text-slate-700 dark:text-slate-200 font-sans leading-relaxed text-base md:text-[16.5px] whitespace-pre-line space-y-4">
                    {harvestStoryText}
                  </div>
                )}
                <div className="p-6 bg-surface-container-low/80 border border-outline-variant/20 rounded-3xl space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">eco</span>
                    <span className="text-[11px] text-secondary font-black uppercase tracking-widest block">Doğal İçindekiler &amp; Katkısız Reçete</span>
                  </div>
                  <p className="text-base font-bold text-primary">{ingredientsText}</p>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed">Renklendirici, koruyucu, nişasta bazlı glikoz şurubu veya yapay aroma verici içermez.</p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6 bg-surface-container-low/80 p-7 rounded-3xl border border-outline-variant/25 shadow-sm">
                <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">tune</span>
                  </div>
                  <div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Teknik Spesifikasyonlar</h4>
                    <p className="text-xs text-on-surface-variant font-medium">Laboratuvar &amp; ambalaj detayları</p>
                  </div>
                </div>
                <div className="space-y-3.5">
                  {specificationsList.map((spec, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-outline-variant/10 pb-2.5">
                      <span className="text-xs text-on-surface-variant font-bold">{spec.key}</span>
                      <span className="text-xs text-primary font-black font-mono">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: ANALİZ & BESİN DEĞERLERİ ── */}
        {activeTab === "besin" && (
          <div className="bg-surface dark:bg-on-surface border-2 border-primary/20 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in duration-300">
            <TabHeader
              icon="science"
              label="PEKEFE LABORATUVAR VE BESİN ANALİZİ"
              subtitle="100g Besin Değerleri ve Analiz Raporu"
              badge={<><span className="material-symbols-outlined text-base text-secondary">verified</span><span>Akredite Laboratuvar Raporlu</span></>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Nutrients Table */}
              <div className="lg:col-span-6 bg-surface-container-low/80 p-7 rounded-3xl border border-outline-variant/25 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-primary/20">
                      <th className="py-3.5 font-display-lg text-xs uppercase tracking-wider font-black text-primary">Besin Ögesi</th>
                      <th className="py-3.5 font-display-lg text-xs uppercase tracking-wider font-black text-primary text-right">100g Değeri</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono text-on-surface-variant divide-y divide-outline-variant/10">
                    {[
                      ["Enerji (Energy)", nutrientsData.energy, "text-primary"],
                      ["Karbonhidrat (Carbohydrate)", nutrientsData.carb, "text-primary"],
                      ["Protein (Protein)", nutrientsData.protein, "text-primary"],
                      ["Kalsiyum (Calcium)", nutrientsData.calcium, "text-primary"],
                      ["Demir (Iron)", nutrientsData.iron, "text-primary"],
                      ["HMF Değeri (Laboratuvar Analizi)", hmfLevelText, "text-secondary font-black"],
                    ].map(([label, value, cls]) => (
                      <tr key={label} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3.5 font-bold text-slate-700 dark:text-slate-200">{label}</td>
                        <td className={`py-3.5 text-right font-black ${cls}`}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ritual + Disclaimer */}
              <div className="lg:col-span-6 space-y-6">
                <div className="p-7 bg-surface-container-low/80 border border-outline-variant/25 rounded-3xl shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">restaurant_menu</span>
                    </div>
                    <h4 className="font-display-lg text-primary text-base font-bold">Tüketim &amp; Servis Ritüeli</h4>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{ritualText}</p>
                </div>

                <div className="flex items-center gap-3.5 bg-amber-500/10 border-2 border-amber-500/30 p-5 rounded-3xl shadow-xs">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <span className="text-xs md:text-sm font-bold text-amber-900 dark:text-amber-200 leading-relaxed">
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
