import React from "react";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, BarChart3, Package, CreditCard, ShoppingBag, Star, Clock, Award, Smartphone, Truck, Check, HelpCircle, Mail, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";

// Top-level Wrapper component to avoid creating components during render
interface WrapperProps {
  children: React.ReactNode;
  baseClass?: string;
  wrapperId?: string;
  wrapperClass?: string;
  wrapperStyle?: React.CSSProperties;
  customCss?: string;
}

const Wrapper: React.FC<WrapperProps> = ({ children, baseClass = "", wrapperId, wrapperClass = "", wrapperStyle = {}, customCss = "" }) => {
  const combinedStyle = {
    ...wrapperStyle,
    ...(customCss
      ? Object.fromEntries(
          customCss
            .split(";")
            .filter(Boolean)
            .map((s) => {
              const [k, v] = s.split(":");
              if (!k || !v) return [null, null];
              const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
              return [key, v.trim()];
            })
            .filter(([k]) => k)
        )
      : {}),
  };

  return (
    <div id={wrapperId} className={`${baseClass} ${wrapperClass}`.trim()} style={combinedStyle}>
      {children}
    </div>
  );
};

export interface SectionStyles {
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textColor?: string;
  bgColor?: string;
  borderRadius?: string;
  shadow?: string;
  animation?: string;
  customId?: string;
  customClasses?: string;
  customInlineCss?: string;
  // Legacy fields (kept for backward compat)
  paddingY?: string;
  marginY?: string;
}

interface SectionProps {
  type: string;
  content: any;
  primaryColor: string;
  styles?: SectionStyles;
}

const iconMap: { [key: string]: any } = {
  Truck, Zap, ShieldCheck, Clock, Star, Award, Smartphone, BarChart3, Package, CreditCard, ShoppingBag, Check
};

/** Build a CSSProperties object from SectionStyles */
function buildSectionStyle(styles?: SectionStyles): React.CSSProperties {
  if (!styles) return {};

  const paddingTop    = styles.paddingTop    ? `${styles.paddingTop}px`    : styles.paddingY ? `${Number(styles.paddingY) * 4}px` : undefined;
  const paddingBottom = styles.paddingBottom ? `${styles.paddingBottom}px` : styles.paddingY ? `${Number(styles.paddingY) * 4}px` : undefined;
  const paddingLeft   = styles.paddingLeft   ? `${styles.paddingLeft}px`   : undefined;
  const paddingRight  = styles.paddingRight  ? `${styles.paddingRight}px`  : undefined;
  const marginTop     = styles.marginTop     ? `${styles.marginTop}px`     : styles.marginY ? `${Number(styles.marginY) * 4}px` : undefined;
  const marginBottom  = styles.marginBottom  ? `${styles.marginBottom}px`  : styles.marginY ? `${Number(styles.marginY) * 4}px` : undefined;
  const marginLeft    = styles.marginLeft    ? `${styles.marginLeft}px`    : undefined;
  const marginRight   = styles.marginRight   ? `${styles.marginRight}px`   : undefined;

  // Shadow map
  const shadowMap: Record<string, string> = {
    "none": "none",
    "shadow-sm": "0 1px 3px rgba(0,0,0,0.25)",
    "shadow-md": "0 4px 12px rgba(0,0,0,0.35)",
    "shadow-2xl": "0 25px 50px rgba(0,0,0,0.5)",
    "shadow-[0_8px_30px_rgb(0,0,0,0.12)]": "0 8px 30px rgba(0,0,0,0.35)",
  };
  const boxShadow = styles.shadow ? (shadowMap[styles.shadow] ?? styles.shadow) : undefined;

  return {
    ...(paddingTop    ? { paddingTop }    : {}),
    ...(paddingBottom ? { paddingBottom } : {}),
    ...(paddingLeft   ? { paddingLeft }   : {}),
    ...(paddingRight  ? { paddingRight }  : {}),
    ...(marginTop     ? { marginTop }     : {}),
    ...(marginBottom  ? { marginBottom }  : {}),
    ...(marginLeft    ? { marginLeft }    : {}),
    ...(marginRight   ? { marginRight }   : {}),
    ...(styles.fontFamily  ? { fontFamily: styles.fontFamily }   : {}),
    ...(styles.textColor   ? { color: styles.textColor }         : {}),
    ...(styles.borderRadius? { borderRadius: styles.borderRadius}: {}),
    ...(boxShadow          ? { boxShadow }                       : {}),
  };
}

export const CMSSectionRenderer: React.FC<SectionProps> = ({ type, content, primaryColor, styles }) => {
  // Safe color styles helper
  const primaryRGB = primaryColor.startsWith('#') ? primaryColor : '#b45309';

  const wrapperStyle = buildSectionStyle(styles);
  const wrapperClass = styles?.customClasses || "";
  const wrapperId = styles?.customId || undefined;
  const customCss = styles?.customInlineCss || "";

  switch (type) {
    case "hero":
      return (
        <Wrapper baseClass="relative w-full min-h-[75vh] flex items-center justify-center overflow-hidden bg-black text-white px-4" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="absolute inset-0 z-0">
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-35"
              style={{ 
                background: `radial-gradient(circle at center, ${primaryRGB}55, transparent 70%)`,
                filter: 'blur(120px)'
              }}
            ></div>
            <div className="absolute inset-0 bg-black/60 z-10"></div>
          </div>
          <div className="container relative z-20 mx-auto text-center max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05] bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              {content.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
              {content.heroSubtitle}
            </p>
            <Link 
              href="/products" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 text-xs text-white hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: primaryRGB }}
            >
              {content.buttonText || "İncele"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Wrapper>
      );

    case "features":
      let items = content.items || [];
      if (typeof items === "number") {
        const defaults = [
          { icon: "ShieldCheck", title: "Yüksek Kalite", desc: "Tüm ürünlerimiz 304 paslanmaz çelikten imal edilmiştir." },
          { icon: "Truck", title: "Hızlı Teslimat", desc: "Saat 15:00'e kadar verilen tüm siparişler aynı gün kargoda." },
          { icon: "Clock", title: "7/24 Destek", desc: "WhatsApp destek hattımız üzerinden bize dilediğiniz an ulaşabilirsiniz." }
        ];
        items = defaults.slice(0, items);
      } else if (!Array.isArray(items)) {
        items = [];
      }
      return (
        <Wrapper baseClass="py-20 bg-zinc-950 text-white border-y border-zinc-900" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {items.map((item: any, i: number) => {
                const Icon = iconMap[item.icon] || Check;
                return (
                  <div key={i} className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all hover:translate-y-[-4px] duration-300">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-white shadow-lg"
                      style={{ backgroundColor: primaryRGB }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100 mb-3">{item.title}</h3>
                    <p className="text-zinc-400 font-medium text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Wrapper>
      );

    case "categories":
      return (
        <Wrapper baseClass="py-20 bg-zinc-950 text-white" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">{content.categoryTitle || "Kategoriler"}</h2>
            <p className="text-zinc-400 font-medium max-w-xl mx-auto mb-12">{content.categorySubtitle}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products?category=Arıcılık" className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-bold border border-zinc-800 transition">Arıcılık Ekipmanları</Link>
              <Link href="/products" className="px-6 py-3 rounded-xl font-bold text-white transition hover:brightness-110" style={{ backgroundColor: primaryRGB }}>Tüm Ürünler</Link>
            </div>
          </div>
        </Wrapper>
      );

    case "mobileApp":
      return (
        <Wrapper baseClass="py-24 bg-black text-white overflow-hidden border-t border-zinc-900" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <Smartphone className="w-4 h-4" /> Mobil Uygulama
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">{content.appTitle}</h2>
                <p className="text-zinc-400 text-base font-normal leading-relaxed max-w-xl">{content.appSubtitle}</p>
                <div className="flex gap-4">
                  <div className="h-12 px-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-widest cursor-pointer transition">App Store</div>
                  <div className="h-12 px-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-widest cursor-pointer transition">Play Store</div>
                </div>
              </div>
              <div className="flex-1 relative">
                <div className="w-[280px] h-[560px] bg-zinc-900 rounded-[3rem] border-[6px] border-zinc-800 shadow-2xl relative z-10 mx-auto flex flex-col justify-between p-6">
                  <div className="w-24 h-4 bg-zinc-800 rounded-full mx-auto mb-6"></div>
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <ShoppingBag className="w-16 h-16 text-zinc-700 animate-pulse" />
                    <div className="text-sm font-black text-zinc-400">Atak B2B App</div>
                  </div>
                  <div className="w-16 h-1 bg-zinc-800 rounded-full mx-auto mt-6"></div>
                </div>
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] opacity-15"
                  style={{ backgroundColor: primaryRGB }}
                ></div>
              </div>
            </div>
          </div>
        </Wrapper>
      );

    case "textBlock":
      return (
        <Wrapper baseClass="py-16 bg-zinc-950 text-zinc-300" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed font-normal text-base">
              {content.text}
            </div>
          </div>
        </Wrapper>
      );

    case "gallery":
      const images = Array.isArray(content.images) ? content.images : [];
      return (
        <Wrapper baseClass="py-16 bg-zinc-950 text-white" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img: string, idx: number) => (
                <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg">
                  <Image src={img} alt={`Galeri ${idx + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Wrapper>
      );

    case "pricing":
      const tiers = Array.isArray(content.tiers) ? content.tiers : [
        { name: "Standart", price: "0 TL", features: ["15 güne kadar vade", "Tüm arıcılık ekipmanlarına erişim", "Mobil uygulama siparişi"] },
        { name: "Platin Üye", price: "Fiyat Sorun", features: ["60 güne kadar vade", "Özel nakliye & hızlı sevkiyat", "Hacimli ürünlerde ek %10 indirim"] }
      ];
      return (
        <Wrapper baseClass="py-20 bg-zinc-950 text-white border-t border-zinc-900" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold mb-4">{content.title || "B2B Bayilik Paketleri"}</h2>
              <p className="text-zinc-400">{content.subtitle || "İşletmenizin hacmine en uygun bayilik avantajını seçin."}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tiers.map((tier: any, i: number) => (
                <div key={i} className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                    <div className="text-3xl font-black mb-6" style={{ color: primaryRGB }}>{tier.price}</div>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/contact" className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-center text-sm transition">Başvuru Yap</Link>
                </div>
              ))}
            </div>
          </div>
        </Wrapper>
      );

    case "testimonials":
      const reviews = Array.isArray(content.reviews) ? content.reviews : [
        { author: "Hasan Polat", role: "Polat Arıcılık Çiftliği", text: "Erzurum'dan gelen paslanmaz arı körükleri tam istediğimiz kalitede. Uzun süre sönmeden çalışıyor." },
        { author: "Zeynep Demir", role: "Demir Arıcılık Kooperatifi", text: "B2B portalı üzerinden sipariş vermek çok kolay. Vade süreleri ve bayi iskonto oranları çok avantajlı." }
      ];
      return (
        <Wrapper baseClass="py-20 bg-zinc-950 text-white" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold mb-4">{content.title || "Bayi Yorumları"}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.map((rev: any, i: number) => (
                <div key={i} className="p-8 rounded-3xl bg-zinc-900/20 border border-zinc-850 flex flex-col justify-between">
                  <p className="text-zinc-400 italic text-sm mb-6 leading-relaxed">"{rev.text}"</p>
                  <div>
                    <h4 className="font-bold text-zinc-200 text-sm">{rev.author}</h4>
                    <span className="text-zinc-500 text-xs">{rev.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Wrapper>
      );

    case "faq":
      const faqs = Array.isArray(content.faqs) ? content.faqs : [
        { q: "B2B bayilik başvurusu nasıl yapılır?", a: "Sitemizdeki bayi kayıt formunu doldurarak başvuru yapabilirsiniz. Evraklarınız incelendikten sonra hesabınız aktif edilir." },
        { q: "Minimum sipariş miktarı var mıdır?", a: "B2B siparişlerinizde sevkıyat avantajı için kargo ve tır bazlı minimum sevk limitleri uygulanmaktadır." }
      ];
      return (
        <Wrapper baseClass="py-16 bg-zinc-950 text-white border-y border-zinc-900" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold mb-4">{content.title || "Sıkça Sorulan Sorular"}</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-850">
                  <h4 className="font-bold text-zinc-100 flex items-center gap-2 mb-2 text-sm">
                    <HelpCircle className="w-4 h-4 text-zinc-400" /> {faq.q}
                  </h4>
                  <p className="text-zinc-400 text-sm pl-6 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </Wrapper>
      );

    case "cta":
      return (
        <Wrapper baseClass="py-16 bg-zinc-950 px-4" wrapperId={wrapperId} wrapperClass={wrapperClass} wrapperStyle={wrapperStyle} customCss={customCss}>
          <div className="container mx-auto max-w-4xl p-12 rounded-[2rem] text-center relative overflow-hidden border border-zinc-800" style={{ backgroundColor: `${primaryRGB}15` }}>
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">{content.title || "Bizimle Çalışmaya Başlayın"}</h2>
              <p className="text-zinc-400 text-sm max-w-xl mx-auto">{content.subtitle || "Hemen bayilik profilinizi oluşturun ve toptan alımlarda özel fiyatlardan yararlanın."}</p>
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs text-white transition hover:brightness-110" style={{ backgroundColor: primaryRGB }}>
                {content.buttonText || "Hemen Kaydol"} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Wrapper>
      );

    case "footer":
      return (
        <footer
          id={wrapperId}
          className={`py-12 bg-black border-t border-zinc-900 text-zinc-500 text-xs ${wrapperClass}`.trim()}
          style={wrapperStyle}
        >
          <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="text-white font-extrabold uppercase tracking-widest">{content.siteName || "Atak Arıcılık B2B"}</span>
              <p className="text-zinc-600 text-center md:text-left">{content.siteDescription || "Türkiye'nin Lider Arıcılık Ekipmanı B2B Platformu"}</p>
            </div>
            <div className="flex gap-6">
              <a href="/products" className="hover:text-zinc-300 transition">Katalog</a>
              <a href="/help" className="hover:text-zinc-300 transition">Destek</a>
              <a href="/privacy" className="hover:text-zinc-300 transition">Gizlilik</a>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1.5 text-zinc-600">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {content.contactPhone || "0544 149 48 51"}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {content.contactEmail || "info@atakaricilik.com"}</span>
            </div>
          </div>
        </footer>
      );

    default:
      return null;
  }
};
