"use client";

import Link from "next/link";
import { Toast } from "@/components/ui/Toast";
import JsonLd from "@/components/seo/JsonLd";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ProductModals } from "@/components/product/ProductModals";
import { ProductRecommendations } from "@/components/product/ProductRecommendations";
import { useProductDetailState, getVariantLabel } from "@/components/product/useProductDetailState";

export default function UrunDetay({ params }) {
  const state = useProductDetailState(params);

  // ── Loading Guard ─────────────────────────────────────────────────────────
  if (state.isLoading) {
    return (
      <div className="relative w-full min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="animate-pulse flex flex-col lg:flex-row gap-10 w-full max-w-5xl px-6">
          <div className="bg-surface-container-low rounded-2xl w-full lg:w-1/2 aspect-square" />
          <div className="flex flex-col gap-4 flex-1 py-4">
            <div className="h-4 bg-surface-container-low rounded-full w-1/3" />
            <div className="h-8 bg-surface-container-low rounded-full w-3/4" />
            <div className="h-4 bg-surface-container-low rounded-full w-1/2" />
            <div className="h-12 bg-surface-container-low rounded-2xl w-1/4 mt-4" />
            <div className="h-10 bg-surface-container rounded-2xl w-full mt-4" />
            <div className="h-10 bg-primary/20 rounded-2xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not-Found Guard ───────────────────────────────────────────────────────
  if (!state.product) {
    return (
      <div className="relative w-full min-h-screen bg-background flex flex-col items-center justify-center gap-6 text-center px-6">
        <span className="material-symbols-outlined text-6xl text-outline-variant">inventory_2</span>
        <h1 className="font-display text-2xl text-on-surface">Ürün Bulunamadı</h1>
        <p className="text-on-surface-variant">Bu ürün mevcut değil veya kaldırılmış olabilir.</p>
        <Link
          href="/kategoriler"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-2xl font-label-md hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Tüm Ürünlere Dön
        </Link>
      </div>
    );
  }

  // ── Main Page Render ──────────────────────────────────────────────────────
  return (
    <div className="relative w-full min-h-screen bg-background text-on-surface pb-24 overflow-hidden">
      {state.productSchema && <JsonLd data={state.productSchema} />}
      <div className="absolute inset-0 bg-surface-container/30 pointer-events-none opacity-40 mix-blend-multiply" />

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-base relative z-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 py-8 text-on-surface-variant font-label-sm text-[10px] uppercase tracking-widest">
          <Link className="hover:text-primary transition-colors" href="/">Mağaza</Link>
          <span className="material-symbols-outlined text-[10px] text-outline">chevron_right</span>
          <Link className="hover:text-primary transition-colors" href="/kategoriler">
            {state.product?.categoryDisplay || state.product?.category || "Gıda"}
          </Link>
          <span className="material-symbols-outlined text-[10px] text-outline">chevron_right</span>
          <span className="text-primary font-bold">{state.product?.name}</span>
        </nav>

        {/* ── Showcase Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24">
          <ProductGallery
            product={state.product}
            mediaList={state.mediaList}
            selectedMedia={state.selectedMedia}
            setSelectedMedia={state.setSelectedMedia}
            mainImage={state.mainImage}
            onImageClick={() => { state.setIsZoomModalOpen(true); state.setZoomScale(1); }}
          />

          <ProductConfigurator
            product={state.product}
            variantsList={state.variantsList}
            selectedVariant={state.selectedVariant}
            setSelectedVariant={state.setSelectedVariant}
            getVariantLabel={getVariantLabel}
            displayPrice={state.displayPrice}
            summaryDescription={state.summaryDescription}
            quantity={state.quantity}
            handleQuantityChange={state.handleQuantityChange}
            handleAddToCart={state.handleAddToCart}
            isFavorite={state.isFavorite}
            handleFavoriteToggle={state.handleFavoriteToggle}
            handleShareClick={state.handleShareClick}
          />
        </div>

        {/* ── Tabs ── */}
        <ProductTabs
          product={state.product}
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
          fullDescriptionText={state.fullDescriptionText}
          specificationsList={state.specificationsList}
          harvestStoryText={state.harvestStoryText}
          ingredientsText={state.ingredientsText}
          nutrientsData={state.nutrientsData}
          hmfLevelText={state.hmfLevelText}
          ritualText={state.ritualText}
          usageGuideText={state.usageGuideText}
          reviewsList={state.reviewsList}
          setIsReviewModalOpen={state.setIsReviewModalOpen}
        />

        {/* ── Recommendations ── */}
        <ProductRecommendations
          recommendations={state.recommendations}
          failedImages={state.failedImages}
          setFailedImages={state.setFailedImages}
          setToastMsg={state.setToastMsg}
          setToastOpen={state.setToastOpen}
        />
      </div>

      {/* ── All Modals ── */}
      <ProductModals
        product={state.product}
        isZoomModalOpen={state.isZoomModalOpen}
        setIsZoomModalOpen={state.setIsZoomModalOpen}
        zoomScale={state.zoomScale}
        setZoomScale={state.setZoomScale}
        mousePos={state.mousePos}
        setMousePos={state.setMousePos}
        isHoveringZoom={state.isHoveringZoom}
        setIsHoveringZoom={state.setIsHoveringZoom}
        selectedMedia={state.selectedMedia}
        setSelectedMedia={state.setSelectedMedia}
        mediaList={state.mediaList}
        mainImage={state.mainImage}
        isReviewModalOpen={state.isReviewModalOpen}
        setIsReviewModalOpen={state.setIsReviewModalOpen}
        newReview={state.newReview}
        setNewReview={state.setNewReview}
        handleAddReviewSubmit={state.handleAddReviewSubmit}
        isShareModalOpen={state.isShareModalOpen}
        setIsShareModalOpen={state.setIsShareModalOpen}
        displayPrice={state.displayPrice}
        getPublicShareUrl={state.getPublicShareUrl}
        getWhatsAppShareText={state.getWhatsAppShareText}
        setToastMsg={state.setToastMsg}
        setToastOpen={state.setToastOpen}
      />

      <Toast message={state.toastMsg} isOpen={state.toastOpen} onClose={() => state.setToastOpen(false)} />
    </div>
  );
}
