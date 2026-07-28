"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  ShoppingBag, ShieldCheck, Phone, Mail, MapPin, Lock, LogOut,
  User, UserCheck, Package, Heart, Building, Sun, Moon, Search,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { Link, useRouter } from "@/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/modules/catalog/store";
import { useProduct } from "@/context/ProductContext";
import dynamic from "next/dynamic";
import { slugify } from "@/lib/utils";
import SearchAutocompleteDropdown from "./SearchAutocompleteDropdown";

// Standard components
import HomeHero from "@/modules/cms/components/HomeHero";
import ProductGrid from "@/modules/catalog/components/ProductGrid";
import HomeFaq from "@/modules/cms/components/HomeFaq";
import { CMSSectionRenderer } from "@/components/CMSSectionRenderer";

// Modularized Static Sections
import TrustStrip from "@/modules/cms/components/TrustStrip";
import WhyAtak from "@/modules/cms/components/WhyAtak";
import FinalCTA from "@/modules/cms/components/FinalCTA";

// Isolated Interactive Sections
import InteractiveHotspots from "@/modules/cms/components/InteractiveHotspots";
import Testimonials from "@/modules/cms/components/Testimonials";

// Dynamic Overlay Modals (SSR disabled for performance)
const CheckoutDrawer = dynamic(() => import("@/modules/orders/components/CheckoutDrawer"), { ssr: false });
const HomePopup = dynamic(() => import("@/components/HomePopup"), { ssr: false });
const UserAuthModal = dynamic(() => import("@/components/UserAuthModal"), { ssr: false });
const SuccessOverlayModal = dynamic(() => import("@/components/SuccessOverlayModal"), { ssr: false });
const SupportWidget = dynamic(() => import("@/components/SupportWidget"), { ssr: false });
import Footer from "@/components/Footer";

interface ProductDto {
  id: string;
  name: string;
  sku: string;
  price: number;
  oldPrice: number | null;
  desc: string | null;
  image: string | null;
  images?: any;
  category?: string;
  attributes?: any;
  stock?: number;
}

interface AtakLandingPageClientProps {
  products: ProductDto[];
  cmsData: any;
  initialSections?: any[];
  heroProduct?: any;
}

export default function AtakLandingPageClient({ 
  products, 
  cmsData, 
  initialSections = [],
  heroProduct
}: AtakLandingPageClientProps) {
  const t = useTranslations("Home");
  
  const whatsappNumber = cmsData?.socialWhatsapp ? cmsData.socialWhatsapp.replace(/\D/g, "") : "905441494851";
  const whatsappUrl = cmsData?.socialWhatsapp
    ? (cmsData.socialWhatsapp.startsWith("http") || cmsData.socialWhatsapp.startsWith("wa.me")
        ? (cmsData.socialWhatsapp.startsWith("http") ? cmsData.socialWhatsapp : `https://${cmsData.socialWhatsapp}`)
        : `https://wa.me/${whatsappNumber}`)
    : "https://wa.me/905441494851";
  
  // --- States ---
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // --- Hash Scrolling Effect for external/internal hash navigation ---
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = decodeURIComponent(hash.replace("#", ""));
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    const timer = setTimeout(handleHashScroll, 500);

    window.addEventListener("hashchange", handleHashScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", handleHashScroll);
    };
  }, []);

  const { data: session } = useSession();
  const currentUser = session?.user ? {
    name: session.user.name || session.user.email || "",
    email: session.user.email || ""
  } : null;

  const findProduct = (sku: string, defaultPrice: number, defaultName: string) => {
    const dbProduct = products.find(p => p.sku === sku);
    return {
      id: dbProduct?.id || sku,
      name: dbProduct?.name || defaultName,
      sku: sku,
      price: dbProduct?.price || defaultPrice,
      oldPrice: dbProduct?.oldPrice || Math.round(defaultPrice * 1.3),
      image: dbProduct?.image || null,
      images: dbProduct?.images || [],
      stock: dbProduct?.stock ?? 10
    };
  };

  const productSmoker = heroProduct 
    ? {
        id: heroProduct.id,
        name: heroProduct.name,
        sku: heroProduct.sku,
        price: heroProduct.price,
        oldPrice: heroProduct.oldPrice || Math.round(heroProduct.price * 1.3),
        image: heroProduct.image || null,
        images: heroProduct.images || [],
        stock: heroProduct.stock ?? 0
      }
    : findProduct("ATAK-KORUK-01", 850, "Atak Pro Paslanmaz Arı Körüğü");

  return (
    <div>
      <div className="relative min-h-screen text-slate-800 dark:text-zinc-200 selection:bg-amber-500 selection:text-neutral-950 font-sans overflow-x-hidden transition-colors duration-300 bg-honeycomb homepage-bg">
        
        {/* JSON-LD Structured Data for Google SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": cmsData?.siteName || "Atak Arıcılık",
              "url": "https://atakaricilik.com",
              "logo": "https://atakaricilik.com/uploads/1779836095322-585290292-Logo.jpg",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": cmsData?.contactPhone || "+905441494851",
                "contactType": "customer service",
                "email": cmsData?.contactEmail || "info@atakaricilik.com"
              },
              "sameAs": [
                cmsData?.socialInstagram || "https://instagram.com/atakaricilik",
                cmsData?.socialFacebook || "https://facebook.com/atakaricilik"
              ]
            })
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Popüler Arıcılık Ekipmanları",
              "description": "Atak Arıcılık patentli arı körükleri ve profesyonel arıcılık malzemeleri.",
              "numberOfItems": products.length,
              "itemListElement": products.map((p, idx) => {
                const pImage = p.image && p.image.trim() !== "" ? p.image : "https://placehold.co/400x400?text=Gorsel+Yok";
                const absoluteImage = pImage.startsWith("http") ? pImage : `https://atakaricilik.com${pImage.startsWith("/") ? "" : "/"}${pImage}`;
                return {
                  "@type": "ListItem",
                  "position": idx + 1,
                  "item": {
                    "@type": "Product",
                    "name": p.name,
                    "image": absoluteImage,
                    "description": p.desc || p.name,
                    "sku": p.sku,
                    "brand": {
                      "@type": "Brand",
                      "name": "Atak Arıcılık"
                    },
                    "offers": {
                      "@type": "Offer",
                      "priceCurrency": "TRY",
                      "price": p.price,
                      "itemCondition": "https://schema.org/NewCondition",
                      "availability": p.stock && p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                      "url": `https://atakaricilik.com/products/${slugify(p.name)}`
                    }
                  }
                };
              })
            })
          }}
        />

        {/* GPU-Accelerated Dynamic Premium Backdrop Layer */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#FCFCFD] dark:bg-[#0B0F17] transition-colors duration-300">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.28] dark:opacity-[0.35] scale-105 animate-slow-drift"
            style={{ backgroundImage: "url('/uploads/home_page_bg.jpg')" }}
          />
          {/* Dynamic soft light gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FCFCFD]/50 to-[#FCFCFD]/90 dark:via-transparent dark:to-[#0B0F17]/90 transition-colors duration-300" />
          
          {/* Floating Ambient Glowing Particles (Pollen/Honey Dust) */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] animate-float-1" />
            <div className="absolute top-3/4 right-1/4 w-[450px] h-[450px] bg-orange-500/5 rounded-full blur-[130px] animate-float-2" />
            <div className="absolute top-1/2 left-2/3 w-60 h-60 bg-yellow-500/8 rounded-full blur-[90px] animate-float-3" />
          </div>
        </div>
        
        {/* Dynamic inline styles for the noise/honeycomb backgrounds */}
        <style dangerouslySetInnerHTML={{__html: `
          .text-gradient { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .text-gradient-silver { background: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 60%, #d1d5db 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .glass { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(15, 23, 42, 0.08); }
          .dark .glass { background: rgba(26, 34, 53, 0.7); border: 1px solid rgba(156, 163, 175, 0.08); }
          .glass-amber { background: rgba(245, 158, 11, 0.08); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1.5px solid rgba(245, 158, 11, 0.28); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.05); }
          .dark .glass-amber { background: rgba(245, 158, 11, 0.12); border: 1.5px solid rgba(245, 158, 11, 0.35); }
          .product-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
          .product-card:hover { transform: translateY(-8px); box-shadow: 0 24px 64px rgba(245,158,11,0.08); }
          .dark .product-card:hover { box-shadow: 0 24px 64px rgba(245,158,11,0.12); }
          .bg-honeycomb {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-18L8 36V20L28 4l20 16v16L28 48z' fill='%23f59e0b' fill-opacity='0.015'/%3E%3C/svg%3E");
          }
          .active-hotspot {
            background-color: #f59e0b !important;
            color: #0b0f17 !important;
            box-shadow: 0 0 20px #f59e0b;
            transform: scale(1.15);
          }
          body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
            pointer-events: none;
            z-index: 0;
            opacity: 0.35;
          }
        `}} />


        {initialSections && initialSections.filter((s: any) => s.visible).length > 0 ? (
          <div className="flex flex-col">
            {initialSections
              .filter((s: any) => s.visible)
              .map((section: any) => {
                const content = section.fields || section.content || {};
                const sectionContent = {
                  ...content,
                  heroTitle: content.heroTitle || cmsData?.heroTitle,
                  heroSubtitle: content.heroSubtitle || cmsData?.heroSubtitle,
                  buttonText: content.buttonText || cmsData?.buttonText,
                  appTitle: content.appTitle || cmsData?.appTitle,
                  appSubtitle: content.appSubtitle || cmsData?.appSubtitle,
                  categoryTitle: content.categoryTitle || cmsData?.categoryTitle,
                  categorySubtitle: content.categorySubtitle || cmsData?.categorySubtitle,
                  siteName: cmsData?.siteName,
                  siteDescription: cmsData?.siteDescription,
                  contactPhone: cmsData?.contactPhone,
                  contactEmail: cmsData?.contactEmail,
                };
                return (
                  <CMSSectionRenderer 
                    key={section.id} 
                    type={section.type} 
                    content={sectionContent} 
                    primaryColor={cmsData?.primaryColor || "#b45309"}
                    styles={section.styles}
                  />
                );
              })}
          </div>
        ) : (
          <>
            <HomeHero productSmoker={productSmoker} />
            <TrustStrip />
            <ProductGrid products={products} />
            <WhyAtak />
            <InteractiveHotspots />
            <Testimonials currentUser={currentUser} />
            <HomeFaq />
            <FinalCTA whatsappUrl={whatsappUrl} />
          </>
        )}

        <HomePopup />
      </div>
    </div>
  );
}
