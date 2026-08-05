"use client";

import Image from "next/image";
import { Input } from "@/components/ui/Input";

/**
 * ProductModals
 * All overlay dialogs for the product detail page:
 *   1. Fullscreen Image Zoom Lightbox  (isZoomModalOpen)
 *   2. Review Submission Modal         (isReviewModalOpen)
 *   3. Social Share Modal              (isShareModalOpen)
 *
 * Extracted from urun/[slug]/page.js (lines 1208-1625).
 */
export function ProductModals({
  product,
  // Zoom Lightbox
  isZoomModalOpen,
  setIsZoomModalOpen,
  zoomScale,
  setZoomScale,
  mousePos,
  setMousePos,
  isHoveringZoom,
  setIsHoveringZoom,
  selectedMedia,
  setSelectedMedia,
  mediaList,
  mainImage,
  // Review Modal
  isReviewModalOpen,
  setIsReviewModalOpen,
  newReview,
  setNewReview,
  handleAddReviewSubmit,
  // Share Modal
  isShareModalOpen,
  setIsShareModalOpen,
  displayPrice,
  getPublicShareUrl,
  getWhatsAppShareText,
  setToastMsg,
  setToastOpen,
}) {
  const navigateImage = (direction) => {
    const list =
      mediaList.length > 0
        ? mediaList
        : (product?.images || []).map((img) => ({ type: "image", url: img }));
    const currentIdx = list.findIndex(
      (m) => (m.url || m) === (selectedMedia?.url || mainImage)
    );
    const nextIdx =
      (currentIdx + direction + list.length) % list.length;
    setSelectedMedia(list[nextIdx]);
  };

  return (
    <>
      {/* ── FULLSCREEN IMAGE ZOOM LIGHTBOX ── */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-[100] bg-on-surface/95 backdrop-blur-2xl flex flex-col justify-between p-4 md:p-8 animate-in fade-in duration-200">
          {/* Top Header */}
          <div className="flex justify-between items-center z-10 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary/70">
                <span className="material-symbols-outlined text-xl">zoom_in</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-base md:text-lg font-display-lg leading-tight">{product?.name}</h3>
                <p className="text-outline text-xs font-mono">Fareyi görsel üzerinde gezdirerek detayları inceleyebilirsiniz</p>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/10 rounded-xl border border-white/15 p-1 gap-1">
                <button type="button" onClick={() => setZoomScale((p) => Math.max(1, p - 0.5))} className="w-8 h-8 rounded-lg text-white hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors" title="Uzaklaştır (-)">
                  <span className="material-symbols-outlined text-base">zoom_out</span>
                </button>
                <span className="text-xs font-mono font-bold text-secondary/70 px-2 min-w-[45px] text-center">
                  {Math.round((zoomScale === 1 && isHoveringZoom ? 2.2 : zoomScale) * 100)}%
                </span>
                <button type="button" onClick={() => setZoomScale((p) => Math.min(3.5, p + 0.5))} className="w-8 h-8 rounded-lg text-white hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors" title="Yakınlaştır (+)">
                  <span className="material-symbols-outlined text-base">zoom_in</span>
                </button>
                <button type="button" onClick={() => setZoomScale(1)} className="px-2.5 py-1 text-[11px] font-mono font-bold text-outline-variant hover:text-white hover:bg-white/20 rounded-lg cursor-pointer transition-colors" title="Sıfırla">
                  1:1
                </button>
              </div>
              <button type="button" onClick={() => { setIsZoomModalOpen(false); setZoomScale(1); }} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 text-outline-variant hover:text-red-400 border border-white/15 flex items-center justify-center cursor-pointer transition-colors" title="Kapat (Esc)">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          </div>

          {/* Image Stage */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden select-none">
            {(mediaList.length > 1 || (product?.images && product.images.length > 1)) && (
              <button type="button" onClick={() => navigateImage(-1)} className="absolute left-2 md:left-6 z-20 w-12 h-12 rounded-full bg-on-surface/80 hover:bg-secondary text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-2xl backdrop-blur-md transition-all hover:scale-110">
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
            )}

            <div
              onMouseEnter={() => setIsHoveringZoom(true)}
              onMouseLeave={() => { setIsHoveringZoom(false); setMousePos({ x: 50, y: 50 }); }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
              }}
              className="relative max-w-4xl w-full h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-on-surface/60 shadow-2xl cursor-crosshair group"
            >
              <Image
                src={selectedMedia?.url || mainImage || "/premium-pekefe-kavanoz.png"}
                alt={product?.name || "Detaylı Ürün Görseli"}
                fill
                priority
                className="object-contain transition-transform duration-150 ease-out"
                style={{
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                  transform: `scale(${isHoveringZoom && zoomScale === 1 ? 2.2 : zoomScale})`,
                }}
              />
              {!isHoveringZoom && (
                <div className="absolute bottom-6 bg-on-surface/80 text-secondary/50 border border-secondary/30 px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-2xl pointer-events-none animate-pulse">
                  <span className="material-symbols-outlined text-base">center_focus_strong</span>
                  <span>Büyüteç etkisi için imleci görsel üzerinde gezdirin</span>
                </div>
              )}
            </div>

            {(mediaList.length > 1 || (product?.images && product.images.length > 1)) && (
              <button type="button" onClick={() => navigateImage(1)} className="absolute right-2 md:right-6 z-20 w-12 h-12 rounded-full bg-on-surface/80 hover:bg-secondary text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-2xl backdrop-blur-md transition-all hover:scale-110">
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          <div className="z-10 border-t border-white/10 pt-4 flex justify-center">
            <div className="flex gap-3 overflow-x-auto no-scrollbar p-1 max-w-2xl">
              {(mediaList.length > 0
                ? mediaList
                : (product?.images || [mainImage]).map((img) => ({ type: "image", url: img }))
              ).map((item, index) => {
                const itemUrl = typeof item === "string" ? item : item.url;
                const isCurrent = (selectedMedia?.url || mainImage) === itemUrl;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedMedia(typeof item === "string" ? { type: "image", url: item } : item)}
                    className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden cursor-pointer shrink-0 transition-all ${isCurrent ? "border-secondary/60 scale-105 shadow-lg shadow-secondary/30" : "border-white/20 opacity-60 hover:opacity-100"}`}
                  >
                    <Image src={itemUrl} alt={`Görsel ${index + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── YORUM GÖNDER MODAL ── */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-surface-container space-y-5">
            <div className="flex justify-between items-center border-b border-surface-container pb-4">
              <h3 className="text-lg font-bold text-on-surface">Müşteri Değerlendirmesi Ekle</h3>
              <button type="button" onClick={() => setIsReviewModalOpen(false)} className="text-outline hover:text-on-surface-variant cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface-variant">Adınız Soyadınız *</label>
                <input
                  type="text"
                  required
                  value={newReview.author}
                  onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-semibold outline-none focus:bg-surface focus:border-secondary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface-variant">Puanınız *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })} className="text-secondary hover:scale-110 transition cursor-pointer">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: star <= newReview.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface-variant">Yorumunuz *</label>
                <textarea
                  rows={4}
                  required
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Ürün kalitesi, lezzeti ve paketlemesi hakkındaki deneyiminizi yazın..."
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-semibold outline-none focus:bg-surface focus:border-secondary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsReviewModalOpen(false)} className="flex-1 py-3 bg-surface-container hover:bg-outline-variant/50 text-on-surface-variant font-bold rounded-xl text-xs transition cursor-pointer">
                  İptal
                </button>
                <button type="submit" className="flex-1 py-3 bg-secondary hover:bg-secondary text-white font-bold rounded-xl text-xs transition shadow-md shadow-secondary/20 cursor-pointer">
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PAYLAŞ MODAL ── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-surface-container animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-surface-container pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/5 text-secondary flex items-center justify-center border border-secondary-container/50">
                  <span className="material-symbols-outlined text-xl">share</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Ürünü Paylaş</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Sevdiklerinizle veya sosyal medyada paylaşın</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsShareModalOpen(false)} className="w-8 h-8 rounded-full bg-surface-container hover:bg-outline-variant/50 text-on-surface-variant flex items-center justify-center transition cursor-pointer">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Product Preview */}
            <div className="flex items-center gap-3.5 bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/30">
              <div className="relative w-14 h-14 bg-surface rounded-xl overflow-hidden border border-outline-variant/30 flex-shrink-0 p-1">
                <Image src={selectedMedia?.url || product?.image || "/premium-pekefe-kavanoz.png"} alt={product?.name || "Ürün"} fill className="object-contain p-1" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-on-surface truncate">{product?.name}</h4>
                <p className="text-[11px] text-secondary font-bold font-mono mt-0.5">₺{displayPrice}</p>
                <span className="text-[10px] text-outline font-semibold truncate block">Pekefe Asırlık Erzurum Mahsulleri</span>
              </div>
            </div>

            {/* Platform Buttons */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "WhatsApp",
                  bg: "bg-emerald-50 hover:bg-emerald-100/90 border-emerald-200/60 text-emerald-800",
                  iconBg: "bg-emerald-500 shadow-emerald-500/20",
                  icon: "chat",
                  onClick: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(getWhatsAppShareText())}`, "_blank"),
                },
                {
                  label: "Instagram",
                  bg: "bg-pink-50 hover:bg-pink-100/90 border-pink-200/60 text-pink-800",
                  iconBg: "bg-gradient-to-tr from-secondary via-rose-500 to-purple-600 shadow-pink-500/20",
                  icon: "photo_camera",
                  onClick: () => {
                    navigator.clipboard?.writeText(`${product?.name} - ₺${displayPrice}\n${getPublicShareUrl()}`);
                    window.open("https://www.instagram.com", "_blank");
                    setToastMsg("Ürün detayları & bağlantı kopyalandı!"); setToastOpen(true);
                  },
                },
                {
                  label: "Telegram",
                  bg: "bg-sky-50 hover:bg-sky-100/90 border-sky-200/60 text-sky-800",
                  iconBg: "bg-sky-500 shadow-sky-500/20",
                  icon: "send",
                  onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(getPublicShareUrl())}&text=${encodeURIComponent(`*${product?.name}*\n💰 Fiyat: ₺${displayPrice}\n✨ Pekefe Asırlık Erzurum Mahsulleri`)}`, "_blank"),
                },
                {
                  label: "Facebook",
                  bg: "bg-blue-50 hover:bg-blue-100/90 border-blue-200/60 text-blue-800",
                  iconBg: "bg-blue-600 shadow-blue-600/20",
                  icon: "thumb_up",
                  onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getPublicShareUrl())}`, "_blank"),
                },
                {
                  label: "X (Twitter)",
                  bg: "bg-surface-container hover:bg-outline-variant/50 border-outline-variant/30 text-on-surface",
                  iconBg: "bg-on-surface",
                  icon: "tag",
                  onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getPublicShareUrl())}&text=${encodeURIComponent(`${product?.name} - Pekefe Asırlık Erzurum Mahsulleri 🌾`)}`, "_blank"),
                },
                {
                  label: "Kopyala",
                  bg: "bg-secondary/5 hover:bg-secondary-container/50 border-secondary-container/60 text-secondary",
                  iconBg: "bg-secondary shadow-secondary/20",
                  icon: "content_copy",
                  onClick: () => {
                    navigator.clipboard?.writeText(getPublicShareUrl());
                    setToastMsg("Ürün bağlantısı panoya kopyalandı!"); setToastOpen(true);
                    setIsShareModalOpen(false);
                  },
                },
              ].map(({ label, bg, iconBg, icon, onClick }) => (
                <button key={label} type="button" onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border ${bg} transition group cursor-pointer`}>
                  <div className={`w-10 h-10 rounded-full ${iconBg} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                  </div>
                  <span className="text-xs font-extrabold">{label}</span>
                </button>
              ))}
            </div>

            {/* Copy Link Bar */}
            <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/30">
              <input type="text" readOnly value={typeof window !== "undefined" ? getPublicShareUrl() : ""} className="w-full bg-transparent text-xs font-mono text-on-surface-variant outline-none px-2 truncate" />
              <button type="button" onClick={() => { navigator.clipboard?.writeText(getPublicShareUrl()); setToastMsg("Ürün bağlantısı panoya kopyalandı!"); setToastOpen(true); }} className="px-3.5 py-2 bg-secondary hover:bg-secondary text-white font-bold text-xs rounded-lg transition whitespace-nowrap cursor-pointer shadow-sm shadow-secondary/20">
                Kopyala
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
