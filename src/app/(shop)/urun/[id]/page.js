"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { getProductById, getProducts, fetchLiveProducts } from "@/utils/productsStorage";
import { addToCart } from "@/utils/cartStorage";
import JsonLd from "@/components/seo/JsonLd";
import { resolveProductMediaItems, isVideoUrl } from "@/lib/utils";

const productsData = {
  "dut-pekmezi": {
    name: "Geleneksel İspir Dut Pekmezi",
    category: "Geleneksel Pekmezler",
    price: 280,
    tag: "En Çok Satan",
    altitude: "2200 Metre",
    harvestSeason: "Temmuz - Ağustos",
    images: [
      "/geleneksel-pekmez.png",
      "/premium-pekefe-kavanoz.png",
      "/ispir-meyve-kurutma.png"
    ],
    description: "İspir'in 2000 rakımlı yaylalarındaki yabani beyaz dut ağaçlarından toplanıp odun ateşinde ve kalın bakır kazanlarda kaynatılan, hiçbir katkı maddesi içermeyen %100 saf ve yoğun gövdeli geleneksel dut pekmezi.",
    details: "Asırlık yabani dut ağaçlarından şafak vakti çarşaflar gerilerek toplanan dutlar, soğuk kaynak sularıyla yıkanıp sıkılır. Elde edilen saf şıra, meşe odunu ateşinde el yapımı bakır kazanlarda (herle) yavaşça karıştırılarak kaynatılır. HMF değerlerinin yükselmemesi için ideal sıcaklıklarda dinlendirilen pekmezimiz, kimyasal koruyucu ve ilave şeker barındırmaz.",
    ingredients: "100% Saf İspir Beyaz Dut Şırası",
    ritual: "Oda sıcaklığında (18°C - 22°C), taş değirmen tahini ile %40'a %60 oranında karıştırılarak servis edilmesi önerilir. Karıştırırken metal kaşık yerine ahşap veya seramik kaşık tercih edilmelidir.",
    nutrients: { energy: "293 kcal", carb: "70.2 g", protein: "0.8 g", calcium: "400 mg", iron: "10.2 mg" },
    specifications: [
      { key: "Menşei", value: "Erzurum / İspir" },
      { key: "Pişirme Yöntemi", value: "Odun Ateşinde Bakır Kazanlar" },
      { key: "Şeker İlavesi", value: "0.0% (Sadece Doğal Meyve Şekeri)" },
      { key: "HMF Seviyesi", value: "< 10 mg/kg (Analiz Raporlu)" }
    ]
  },
  "karadut-pekmezi": {
    name: "Yabani Karadut Pekmezi",
    category: "Geleneksel Pekmezler",
    price: 320,
    tag: "Özel Hasat",
    altitude: "1800 Metre",
    harvestSeason: "Ağustos",
    images: [
      "/premium-pekefe-kavanoz.png",
      "/geleneksel-pekmez.png",
      "/ispir-dut-hasadi.png"
    ],
    description: "Geleneksel vakumlu kaynatma tekniği kullanılarak, yüksek sıcaklıklara çıkılmadan meyvenin vitamin ve minerallerini koruyan, yoğun kıvamlı ve hafif ekşimsi butik karadut özü.",
    details: "Yabani karadut meyvelerinin preslenmesiyle elde edilen şıra, düşük sıcaklıktaki vakumlu kazanlarımızda besin değerlerini yitirmeden yoğunlaştırılır. Karadutun doğal ekşi-tatlı aroması ve yüksek polifenol yapısı korunur. Ağız yaraları, bağışıklık desteği ve doğal enerji deposu olarak bilinir.",
    ingredients: "100% Yabani Karadut Şırası",
    ritual: "Sabahları aç karnına bir yemek kaşığı doğrudan tüketilmesi veya ılık kaynak suyuna eklenerek doğal bir meyve şerbeti şeklinde yavaşça yudumlanması önerilir.",
    nutrients: { energy: "285 kcal", carb: "68.5 g", protein: "1.2 g", calcium: "380 mg", iron: "12.4 mg" },
    specifications: [
      { key: "Menşei", value: "Erzurum / İspir" },
      { key: "Koyulaştırma Yöntemi", value: "Düşük Sıcaklıkta Vakumlu Yoğunlaştırma" },
      { key: "Katkı Maddesi", value: "Yoktur (Sıfır Koruyucu)" },
      { key: "Ambalaj", value: "Premium Cam Şişe" }
    ]
  },
  "sade-pestil": {
    name: "Sade Dut Pestili",
    category: "Pestil & Köme",
    price: 180,
    tag: "Doğal Güneşte Kurutulmuş",
    altitude: "1900 Metre",
    harvestSeason: "Temmuz",
    images: [
      "/ispir-meyve-kurutma.png",
      "/el-emegi.png",
      "/premium-pekefe-kavanoz.png"
    ],
    description: "Saf dut şırası ve tam buğday ununun bakır kazanlarda pişirilip keten sergiler üzerine incecik dökülmesi ve İspir güneşi altında doğal olarak kurutulmasıyla üretilen ipeksi sade pestil.",
    details: "Kazanlarda kaynayan dut şırası, az miktarda tam buğday unu ile bulamaç (herle) kıvamına getirilir. Keten bezlere milimetrik kalınlıkta serilerek İspir'in kuru dağ rüzgarlarında güneş altında kurumaya bırakılır. Kuruyan pestiller bezlerden su yardımıyla sıyrılıp, katlanarak özel kraft kutularına yerleştirilir.",
    ingredients: "İspir Beyaz Dut Şırası, Tam Buğday Unu, Eser Miktar Bal",
    ritual: "Yanında taze demlenmiş soğuk çiçek çayı veya Türk kahvesiyle oda sıcaklığında tüketilmesi; arzu edilirse manda kaymağı sarılarak servis edilmesi önerilir.",
    nutrients: { energy: "380 kcal", carb: "82.0 g", protein: "3.5 g", calcium: "120 mg", iron: "4.0 mg" },
    specifications: [
      { key: "Kurutma Şekli", value: "Keten Bezlerde Güneşte Doğal Kurutma" },
      { key: "Kalınlık", value: "< 1.5mm (İpeksi Tekstür)" },
      { key: "Şeker İlavesi", value: "Yok (Glikozsuz)" },
      { key: "Ambalaj", value: "Nem Bariyerli Kraft Kutu" }
    ]
  },
  "cevizli-pestil": {
    name: "Cevizli Rulo Pestil",
    category: "Pestil & Köme",
    price: 220,
    tag: "Geleneksel Tarif",
    altitude: "1900 Metre",
    harvestSeason: "Temmuz - Eylül",
    images: [
      "/el-emegi.png",
      "/ispir-meyve-kurutma.png",
      "/premium-pekefe-kavanoz.png"
    ],
    description: "İspir havzasının yerli cevizleriyle harmanlanan, ipeksi kıvamda serilen geleneksel dut pestilinin rulo haline getirilmiş en asil ve besleyici şekli.",
    details: "Güneşte kurutulmuş sade dut pestilinin içerisine yerli İspir cevizlerinin dövülerek serpilmesi ve rulo şeklinde sarılmasıyla elde edilir. Cevizin doğal yağ ve protein dengesi, dutun karamelize enerjisiyle birleşerek mükemmel bir atıştırmalık sunar.",
    ingredients: "Dut Pestili (Dut şırası, un), Yerli İspir Cevizi",
    ritual: "İnce halkalar şeklinde dilimlenerek, yanında olgunlaştırılmış sert keçi peyniri ile şarküteri tahtalarında servis edilmesi asil bir zıtlık oluşturur.",
    nutrients: { energy: "410 kcal", carb: "72.4 g", protein: "5.8 g", calcium: "140 mg", iron: "4.8 mg" },
    specifications: [
      { key: "Ceviz Oranı", value: "%35 (Yerli İspir Cevizi)" },
      { key: "Koruyucu", value: "Sıfır (Katkısız)" },
      { key: "Kurutma", value: "Doğal Rüzgar Altında Güneşte" },
      { key: "Hediye Kutusu", value: "Premium Ahşap Kaplamalı Kutu" }
    ]
  },
  "ispir-kome": {
    name: "İspir Dut Kömesi (Cevizli Sucuk)",
    category: "Pestil & Köme",
    price: 380,
    tag: "Coğrafi İşaretli",
    altitude: "2100 Metre",
    harvestSeason: "Eylül",
    images: [
      "/ispir-dut-hasadi.png",
      "/vakumlu-uretim.png",
      "/geleneksel-kazan.png"
    ],
    description: "İpe dizilen taze İspir cevizlerinin, kaynayan dut şırası herlesine defalarca daldırılıp İspir'in kuru havasında asılarak kurutulmasıyla elde edilen efsanevi coğrafi tescilli köme.",
    details: "Ayıklanan taze yerli cevizler pamuk ipliklere dizilir. Odun ateşinde hazırlanan sıcak dut herlesine (şıra, bal, un karışımı) batırılarak üzeri kaplanır. Havada asılarak kurutulan kömeler, kıvamını bulduktan sonra toplanarak paketlenir. Çiğnenebilir, yumuşak ve zengin lif yapılıdır.",
    ingredients: "İspir Cevizi, Dut Şırası, Süzme Bal, Tam Buğday Unu, Süt",
    ritual: "Serin bir ortamda saklanmalı, servis etmeden hemen önce ince şeritler halinde verev (asimetrik) dilimlenerek ikram edilmelidir.",
    nutrients: { energy: "420 kcal", carb: "68.0 g", protein: "6.2 g", calcium: "150 mg", iron: "5.2 mg" },
    specifications: [
      { key: "Tescil Tipi", value: "Coğrafi İşaretli Mahsul" },
      { key: "Ceviz Cinsi", value: "İnce Kabuklu İspir Cevizi" },
      { key: "Kaplama Sayısı", value: "Üç Kat Daldırma (Maksimum Dolgunluk)" },
      { key: "Koruyucu Kimyasal", value: "0.0% (Bulunmadı)" }
    ]
  },
  "ispir-tek-cekim-kome": {
    name: "İspir Tek Çekim Dut Kömesi",
    category: "Pestil & Köme",
    price: 240,
    tag: "Sınırlı Üretim",
    altitude: "2100 Metre",
    harvestSeason: "Eylül",
    images: [
      "/premium-pekefe-kavanoz.png",
      "/ispir-dut-hasadi.png",
      "/geleneksel-kazan.png"
    ],
    description: "Ceviz yoğunluğunu hissetmek isteyenler için tasarlanmış, dut herlesine sadece tek bir kez daldırılarak kaplama tabakası ince tutulmuş premium cevizli sucuk serisi.",
    details: "Yerli İspir cevizleri ipe dizildikten sonra kaynayan şıra kazanına sadece bir kez batırılır. Bu sayede üzerindeki tatlı dış tabaka ince kalır ve cevizlerin kıtırlığı ile aroması en üst perdeden hissedilir. Ağır tatlı sevmeyen gurmelerin bir numaralı tercihidir.",
    ingredients: "Yerli İspir Cevizi (%50), Dut Şırası, Bal, Un",
    ritual: "Sıcak espresso veya sert bir Türk kahvesiyle mükemmel uyum sağlar. Kahvenin acılığı, ince tatlı herle kaplamasını mükemmel dengeler.",
    nutrients: { energy: "445 kcal", carb: "60.4 g", protein: "7.8 g", calcium: "165 mg", iron: "5.5 mg" },
    specifications: [
      { key: "Ceviz Oranı", value: "%50 (Yoğun Kıtırlık)" },
      { key: "Herle Kaplama Kalınlığı", value: "< 1.0mm (Tek Daldırma)" },
      { key: "Glikoz/Sakkaroz", value: "0.0% (Eklenmemiş)" },
      { key: "Hasat Yılı", value: "Güncel Sezon Hasadı" }
    ]
  },
  "muska-tatlisi": {
    name: "Dut Pestil Muska Tatlısı",
    category: "Geleneksel Tatlılar",
    price: 200,
    tag: "El Emeği",
    altitude: "1900 Metre",
    harvestSeason: "Temmuz",
    images: [
      "/ispir-meyve-kurutma.png",
      "/el-emegi.png",
      "/geleneksel-pekmez.png"
    ],
    description: "İncecik kesilen sade dut pestilinin içerisine yerli ceviz, bal ve pekmez karışımı yerleştirilerek muska şeklinde katlanan en asil saray tatlısı.",
    details: "Keten sergilerden sıyrılan taze sade pestiller şeritler halinde kesilir. İçerisine dövülmüş ceviz içi, saf İspir balı ve koyu dut pekmezi karışımı dolgu olarak yerleştirilir. Usta kadınların el emeğiyle muska şeklinde katlanarak hazırlanan bu lezzet lokmaları, ağızda eriyen bir dokuya sahiptir.",
    ingredients: "Dut Pestili, Yerli Ceviz, Saf Çiçek Balı, Yoğun Dut Pekmezi",
    ritual: "Oda sıcaklığında, üzerine hafifçe toz antep fıstığı serpiştirilerek ve taze demlenmiş bergamatlı siyah çay ile servis edilmesi önerilir.",
    nutrients: { energy: "395 kcal", carb: "78.0 g", protein: "4.5 g", calcium: "130 mg", iron: "4.2 mg" },
    specifications: [
      { key: "Katlama Biçimi", value: "Geleneksel Muska (Üçgen)" },
      { key: "İç Dolgu", value: "Ceviz, Bal, Pekmez Karışımı" },
      { key: "Koruyucu ve Katkı", value: "Kesinlikle İçermez" },
      { key: "Kutu Tipi", value: "Premium Cam Sunum Kabı" }
    ]
  },
  "sarma-tatlisi": {
    name: "Dut Pestil Sarma Tatlısı",
    category: "Geleneksel Tatlılar",
    price: 210,
    tag: "Gurme Seri",
    altitude: "1900 Metre",
    harvestSeason: "Temmuz - Ağustos",
    images: [
      "/el-emegi.png",
      "/ispir-meyve-kurutma.png",
      "/premium-pekefe-kavanoz.png"
    ],
    description: "İncecik serilmiş sade dut pestilinin içerisine bol miktarda dövülmüş İspir cevizi ve antep fıstığı kreması sarılarak hazırlanan gurme lezzet rulosu.",
    details: "Taze sade dut pestilinin üzerine homojen olarak yerli ceviz içi ve katkısız Antep fıstığı ezmesi sürülür. Rulo halinde sıkıca sarıldıktan sonra lokmalık dilimler şeklinde kesilir. Hem fıstık hem ceviz aromalarını pestilin karamelize dokusuyla buluşturur.",
    ingredients: "Dut Pestili, İspir Cevizi, Katkısız Antep Fıstığı Ezmesi",
    ritual: "Yemek sonrasında hafif bir tatlı olarak, yanında bir top sade dondurma veya soğuk kaymak ile servis edilmesi tavsiye edilir.",
    nutrients: { energy: "415 kcal", carb: "74.0 g", protein: "5.1 g", calcium: "135 mg", iron: "4.5 mg" },
    specifications: [
      { key: "Dış Tabaka", value: "Keten Güneşte Kurutulmuş Dut Pestili" },
      { key: "İç Dolgu", value: "Ceviz & Fıstık Ezmesi Harmanı" },
      { key: "Katkı Oranı", value: "0% Yapay Aroma / Renklendirici" },
      { key: "Ambalaj", value: "Premium Karton Sunum Kutusu" }
    ]
  }
};

export default function UrunDetay({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [productState, setProductState] = useState(() => getProductById(id));

  useEffect(() => {
    // Clear stale localStorage cache and fetch fresh data from DB
    if (typeof window !== "undefined") {
      localStorage.removeItem("pekefe_products_state");
    }
    fetchLiveProducts().then(() => {
      setProductState(getProductById(id));
    });

    const handleProductsChange = () => {
      setProductState(getProductById(id));
    };
    window.addEventListener("pekefe_products_changed", handleProductsChange);
    return () => {
      window.removeEventListener("pekefe_products_changed", handleProductsChange);
    };
  }, [id]);

  const translateImage = (url) => {
    if (!url) return url;
    if (url.includes("/pekefe-dut-pekmezi-kavanoz.jpg") || url.includes("/geleneksel-pekmez.jpg") || url.includes("/geleneksel-pekmez.png")) {
      return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
    }
    if (url.includes("/premium-pekefe-kavanoz.png")) {
      return "/premium-pekefe-kavanoz-tr.png";
    }
    return url;
  };

  const product = useMemo(() => {
    if (!productState) return null;
    return {
      ...productState,
      image: productState.image ? translateImage(productState.image) : productState.image,
      images: productState.images ? productState.images.map(translateImage) : productState.images
    };
  }, [productState]);

  const mediaList = useMemo(() => {
    if (!product) return [];
    return resolveProductMediaItems(product.image, product.images, product.videoUrl);
  }, [product]);

  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    if (mediaList.length > 0) {
      setSelectedMedia(mediaList[0]);
    } else if (product) {
      setSelectedMedia({ id: "def", type: "image", url: product.image || "/premium-pekefe-kavanoz.png", name: "Görsel" });
    }
  }, [mediaList, product]);

  const variantsList = useMemo(() => {
    if (!product) return [];
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants;
    }
    if (product.attributes && product.attributes.variants && Array.isArray(product.attributes.variants) && product.attributes.variants.length > 0) {
      return product.attributes.variants;
    }
    return [];
  }, [product]);

  const getVariantLabel = (v) => {
    if (!v) return "";
    let attrs = v.attributes;
    if (typeof attrs === "string") {
      try { attrs = JSON.parse(attrs); } catch (e) {}
    }
    if (attrs && typeof attrs === "object") {
      return attrs.size || attrs.name || v.name || v.size || "";
    }
    return v.size || v.name || "";
  };

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(product && product.images && product.images[0] ? product.images[0] : (product ? product.image : "/premium-pekefe-kavanoz.png"));
  const [activeTab, setActiveTab] = useState("aciklama");
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => {
    if (variantsList.length > 0) {
      setSelectedVariant((prev) => {
        if (!prev) return variantsList[0];
        const prevLabel = getVariantLabel(prev);
        const match = variantsList.find((v) => (v.id && prev.id && v.id === prev.id) || getVariantLabel(v) === prevLabel);
        return match || variantsList[0];
      });
    } else {
      setSelectedVariant(null);
    }
  }, [variantsList]);

  const displayPrice = useMemo(() => {
    if (selectedVariant && selectedVariant.price && Number(selectedVariant.price) > 0) {
      return Number(selectedVariant.price);
    }
    if (product && product.price && Number(product.price) > 0) {
      return Number(product.price);
    }
    return 280;
  }, [selectedVariant, product]);

  const sessionResult = useSession();
  const session = sessionResult?.data;
  
  // Review Submission, Share Modal & Favorites State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newReview, setNewReview] = useState({ author: "", rating: 5, comment: "" });
  const [reviewsList, setReviewsList] = useState([
    { id: "1", author: "Ayşe Yıldız", rating: 5, date: "12.06.2026", comment: "Kıvamı ve tadı harika. Çocukluğumdaki o gerçek lezzeti sonunda buldum. Paketleme de çok özenliydi, sapasağlam ulaştı." },
    { id: "2", author: "Mehmet Kaya", rating: 5, date: "05.07.2026", comment: "İspirli biri olarak söylüyorum, tam kıvamında ve çok lezzetli. Tahinle harika oluyor." }
  ]);

  // Sync favorites state
  useEffect(() => {
    if (typeof window !== "undefined" && product) {
      const favoritesKey = session?.user?.email ? `favorites_${session.user.email}` : "favorites";
      const favs = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
      const targetId = String(product.id || id);
      setIsFavorite(favs.some((item) => String(item.id) === targetId || String(item.sku) === targetId));
    }
  }, [product, id, session]);

  const handleFavoriteToggle = () => {
    if (!product) return;
    const favoritesKey = session?.user?.email ? `favorites_${session.user.email}` : "favorites";
    const targetId = String(product.id || id);
    let favs = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    const exists = favs.some((item) => String(item.id) === targetId || String(item.sku) === targetId);

    if (exists) {
      favs = favs.filter((item) => String(item.id) !== targetId && String(item.sku) !== targetId);
      localStorage.setItem(favoritesKey, JSON.stringify(favs));
      setIsFavorite(false);
      setToastMsg(`${product.name} favorilerinizden çıkarıldı.`);
      setToastOpen(true);
    } else {
      const newFavItem = {
        id: targetId,
        name: product.name,
        price: `₺${Number(product.price).toLocaleString("tr-TR")}`,
        img: selectedMedia?.url || product.image || "/premium-pekefe-kavanoz.png",
        image: selectedMedia?.url || product.image || "/premium-pekefe-kavanoz.png",
        sku: product.sku || targetId,
        weight: product.attributes?.specsWeight || "1 Kg"
      };
      favs.push(newFavItem);
      localStorage.setItem(favoritesKey, JSON.stringify(favs));
      setIsFavorite(true);
      setToastMsg(`${product.name} favorilerinize eklendi! ❤️`);
      setToastOpen(true);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pekefe_favorites_changed"));
    }
  };

  const getPublicShareUrl = () => {
    if (typeof window === "undefined") return `https://www.pekefe.com/urun/${id}`;
    let href = window.location.href;
    if (href.includes("localhost") || href.includes("127.0.0.1")) {
      href = href.replace(/http:\/\/(localhost|127\.0\.0\.1):3000/, "https://www.pekefe.com");
    }
    return href;
  };

  const getWhatsAppShareText = () => {
    const shareUrl = getPublicShareUrl();
    const priceText = product?.price ? `₺${Number(product.price).toLocaleString("tr-TR")}` : "";
    const altitude = product?.altitude || product?.attributes?.altitude || "2200 Metre";
    const harvest = product?.harvestSeason || product?.attributes?.harvestSeason || "Temmuz - Ağustos";

    return (
      `*${product?.name || "Pekefe Yöresel Mahsul"}*\n` +
      `✨ *Pekefe Asırlık Erzurum Mahsulleri*\n` +
      (priceText ? `💰 *Fiyat:* ${priceText}\n` : "") +
      `🏔️ *Rakım / Hasat:* ${altitude} · ${harvest}\n` +
      `🌿 *Kalite:* %100 Doğal & Coğrafi İşaretli\n\n` +
      `📸 *Ürünü İncele & Sipariş Ver:* \n` +
      `${shareUrl}`
    );
  };

  const handleShareClick = async () => {
    const shareUrl = getPublicShareUrl();
    const shareText = getWhatsAppShareText();

    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: product?.name || "Pekefe Erzurum Mahsulleri",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          setIsShareModalOpen(true);
        }
        return;
      }
    }
    setIsShareModalOpen(true);
  };

  // Toast States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Sync main image if product changes
  useEffect(() => {
    if (product) {
      setMainImage(product.images && product.images[0] ? product.images[0] : product.image);
      setQuantity(1);
    }
  }, [product]);

  const handleAddReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReview.author.trim() || !newReview.comment.trim()) {
      setToastMsg("Lütfen adınızı ve yorumunuzu doldurunuz.");
      setToastOpen(true);
      return;
    }

    const reviewObj = {
      id: Math.random().toString(),
      author: newReview.author.trim(),
      rating: newReview.rating,
      date: new Date().toLocaleDateString("tr-TR"),
      comment: newReview.comment.trim()
    };

    setReviewsList(prev => [reviewObj, ...prev]);
    setIsReviewModalOpen(false);
    setNewReview({ author: "", rating: 5, comment: "" });
    setToastMsg("Değerlendirmeniz başarıyla iletildi. Teşekkür ederiz!");
    setToastOpen(true);
  };

  const recommendations = useMemo(() => {
    const allProds = getProducts();
    const filtered = allProds.filter(p => p.id !== id).slice(0, 3);
    return filtered.map(p => ({
      ...p,
      image: p.image ? translateImage(p.image) : p.image,
      images: p.images ? p.images.map(translateImage) : p.images
    }));
  }, [id, product]);

  const handleQuantityChange = (val) => {
    if (quantity + val >= 1) {
      setQuantity(quantity + val);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const finalPrice = selectedVariant && selectedVariant.price ? Number(selectedVariant.price) : Number(product.price);
    if (!finalPrice || finalPrice <= 0) {
      setToastMsg("Fiyatı 0 TL olan ürünler sepete eklenemez.");
      setToastOpen(true);
      return;
    }
    const variantLabel = getVariantLabel(selectedVariant);
    const uniqueCartId = selectedVariant?.id 
      ? `${product.id}_${selectedVariant.id}` 
      : (variantLabel ? `${product.id}_${variantLabel.replace(/\s+/g, '_')}` : product.id);

    const cartItem = {
      ...product,
      id: uniqueCartId,
      productId: product.id,
      name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
      price: finalPrice,
      sku: selectedVariant?.sku || product.sku || product.id
    };
    const success = addToCart(cartItem, quantity);
    if (success !== false) {
      setToastMsg(`${cartItem.name} (${quantity} adet) sepete eklendi!`);
      setToastOpen(true);
    }
  };

  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images && product.images[0] ? `https://www.pekefe.com${product.images[0]}` : `https://www.pekefe.com/pekefe-dut-pekmezi-kavanoz-tr.jpg`,
    "description": product.description || product.details,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "PEKEFE"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.pekefe.com/urun/${product.id}`,
      "priceCurrency": "TRY",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock"
    }
  } : null;

  // Dynamic tab data fallbacks
  const harvestStoryText = product?.details || product?.attributes?.harvestStory || product?.description || "İspir'in 2000 rakımlı yüksek yaylalarından toplanan mahsullerimiz geleneksel yöntemlerle kısık odun ateşinde bakır kazanlarda kaynatılarak üretilmektedir.";
  const ingredientsText = product?.ingredients || product?.attributes?.ingredients || "%100 Saf Katkısız Ve İlave Şekersiz İspir Hasadı";
  const ritualText = product?.ritual || product?.attributes?.ritual || "Oda sıcaklığında (18°C - 22°C) muhafaza edilmesi ve seramik veya ahşap kaşık ile tüketilmesi tavsiye edilir.";
  
  const nutrientsData = product?.nutrients || product?.attributes?.nutrients || {
    energy: "310 kcal",
    carb: "71.5 g",
    protein: "1.2 g",
    calcium: "180 mg",
    iron: "8.5 mg"
  };

  const hmfLevelText = product?.attributes?.hmfLevel || "< 10 mg/kg (Analiz Raporlu)";

  const specificationsList = product?.specifications || product?.attributes?.specifications || [
    { key: "Menşei", value: "Erzurum / İspir" },
    { key: "Pişirme Yöntemi", value: "Geleneksel Odun Ateşi Bakır Kazan" },
    { key: "Şeker İlavesi", value: "0.0% (Sadece Doğal Meyve Şekeri)" },
    { key: "HMF Seviyesi", value: hmfLevelText }
  ];

  return (
    <div className="relative w-full min-h-screen bg-background text-on-surface pb-24 overflow-hidden">
      {productSchema && <JsonLd data={productSchema} />}
      {/* Subtle background grain grid */}
      <div className="absolute inset-0 bg-[#F9F9FF] pointer-events-none opacity-40 mix-blend-multiply"></div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-base relative z-10">
        {/* Minimal Breadcrumbs */}
        <nav className="flex items-center gap-2 py-8 text-on-surface-variant font-label-sm text-[10px] uppercase tracking-widest">
          <Link className="hover:text-primary transition-colors" href="/">
            Mağaza
          </Link>
          <span className="material-symbols-outlined text-[10px] text-outline">chevron_right</span>
          <Link className="hover:text-primary transition-colors" href="/kategoriler">
            {product?.category || "Gıda"}
          </Link>
          <span className="material-symbols-outlined text-[10px] text-outline">chevron_right</span>
          <span className="text-primary font-bold">{product?.name}</span>
        </nav>

        {/* ─── ASYMMETRICAL EDITORIAL SHOWCASE GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24">
          
          {/* LEFT: Spacious Gallery Display (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container-low/60 rounded-2xl overflow-hidden border border-outline-variant/20 aspect-square max-h-[600px] w-full relative shadow-sm group flex items-center justify-center p-2">
              {product?.tag && (
                <span className="absolute top-4 left-4 backdrop-blur-md bg-secondary/90 text-white font-label-sm text-[10px] px-3.5 py-1.5 rounded-full uppercase font-bold shadow-md tracking-widest z-10">
                  {product.tag}
                </span>
              )}
              
              {selectedMedia && (selectedMedia.type === "video" || isVideoUrl(selectedMedia.url)) ? (
                <div className="w-full h-full relative flex items-center justify-center bg-black rounded-xl overflow-hidden">
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <Image
                  className="object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-105"
                  src={selectedMedia?.url || mainImage || "/premium-pekefe-kavanoz.png"}
                  alt={product?.name || "Ürün Görseli"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )}
            </div>
            
            {/* Horizontal gallery list */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {mediaList.length > 0 ? mediaList.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMedia(item)}
                  className={`relative aspect-square bg-surface-container-low rounded-xl border overflow-hidden cursor-pointer w-20 flex-shrink-0 transition-all ${
                    selectedMedia?.url === item.url ? "border-primary shadow-md ring-2 ring-primary/20 scale-105" : "border-outline-variant/30 hover:border-outline opacity-80 hover:opacity-100"
                  }`}
                >
                  {item.type === "video" || isVideoUrl(item.url) ? (
                    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center text-amber-400 rounded-lg">
                      <span className="material-symbols-outlined text-2xl animate-pulse">play_circle</span>
                      <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">VIDEO</span>
                    </div>
                  ) : (
                    <Image className="object-cover" src={item.url} alt={`${product?.name} görsel ${index + 1}`} fill sizes="80px" />
                  )}
                </button>
              )) : (
                (product?.images || [mainImage]).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMedia({ type: "image", url: img })}
                    className={`relative aspect-square bg-surface-container-low rounded-xl border overflow-hidden cursor-pointer w-20 flex-shrink-0 transition-all ${
                      selectedMedia?.url === img ? "border-primary shadow-md ring-2 ring-primary/20 scale-105" : "border-outline-variant/30 hover:border-outline opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Image className="object-cover" src={img} alt={`${product?.name} görsel ${index + 1}`} fill sizes="80px" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Sticky Configurator & Brand Story (5 Columns) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] text-secondary uppercase font-mono tracking-[0.25em] font-bold block">
                Altitude: {product?.altitude || product?.attributes?.altitude || "2000 Metre"} · Hasat: {product?.harvestSeason || product?.attributes?.harvestSeason || "Temmuz - Ağustos"}
              </span>
              <h1 className="font-display-lg text-primary text-3xl md:text-headline-lg font-bold leading-tight tracking-tight">
                {product?.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex text-secondary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <span className="text-on-surface-variant font-label-sm text-xs uppercase tracking-wider underline cursor-pointer">
                  Doğrulanmış Mahsul Raporları
                </span>
              </div>
            </div>

            {/* Ölçü / Gramaj Varyant Seçimi */}
            {variantsList.length > 0 && (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-amber-600">straighten</span>
                    Ölçü / Gramaj Seçimi:
                  </label>
                  <span className="text-xs text-amber-700 font-bold font-mono">
                    {getVariantLabel(selectedVariant)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {variantsList.map((v, i) => {
                    const label = getVariantLabel(v);
                    const isSelected = selectedVariant ? (selectedVariant.id === v.id || getVariantLabel(selectedVariant) === label) : i === 0;
                    return (
                      <button
                        key={v.id || i}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-600/20 scale-102"
                            : "border-slate-200 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50"
                        }`}
                      >
                        <span>{label}</span>
                        <span className={`font-mono font-extrabold ${isSelected ? "text-white" : "text-amber-700"}`}>
                          ₺{v.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-primary font-display-lg text-2xl md:text-3xl font-bold tracking-tight border-b border-outline-variant/10 pb-6 flex items-baseline gap-3">
              <span>₺{displayPrice}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 font-mono">
                KDV Dahil
              </span>
            </div>

            <p className="text-on-surface-variant font-body-md text-sm md:text-base leading-relaxed font-light">
              {product?.description || product?.shortDesc}
            </p>

            {/* Micro Pillars */}
            <div className="grid grid-cols-2 gap-4 border-y border-outline-variant/10 py-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">eco</span>
                <span className="font-label-sm text-xs text-on-surface font-bold uppercase tracking-wider">0% Katkı Maddesi</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">history_edu</span>
                <span className="font-label-sm text-xs text-on-surface font-bold uppercase tracking-wider">Asırlık Tarifler</span>
              </div>
            </div>

            {/* Action Pane */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-outline-variant/30 rounded-lg overflow-hidden h-14 bg-white shadow-inner" role="group" aria-label="Ürün adedi">
                  <button onClick={() => handleQuantityChange(-1)} className="px-4 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant" aria-label="Adet azalt">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <input
                    className="w-10 text-center border-none focus:ring-0 font-bold bg-transparent outline-none text-sm font-mono"
                    type="number"
                    value={quantity}
                    readOnly
                    aria-label="Seçili adet"
                    aria-live="polite"
                  />
                  <button onClick={() => handleQuantityChange(1)} className="px-4 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant" aria-label="Adet artır">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="flex-grow shadow-md h-14"
                >
                  Sepete Ekle
                </Button>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  variant={isFavorite ? "default" : "outline"}
                  className={`flex-1 h-12 cursor-pointer flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wider ${
                    isFavorite 
                      ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-md shadow-rose-600/20" 
                      : "bg-white hover:border-rose-300 hover:text-rose-600 text-slate-700"
                  }`}
                  onClick={handleFavoriteToggle}
                >
                  <span className={`material-symbols-outlined text-lg ${isFavorite ? "text-white" : "text-rose-500"}`} style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                    favorite
                  </span>
                  {isFavorite ? "Favorilerinizde" : "Favorilere Ekle"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 bg-white cursor-pointer flex items-center justify-center gap-2 hover:border-amber-500 hover:text-amber-700 transition"
                  onClick={handleShareClick}
                >
                  <span className="material-symbols-outlined text-base">share</span>
                  Paylaş
                </Button>
              </div>
            </div>

            {/* Quick trust metrics */}
            <div className="p-5 bg-surface-container-low border border-outline-variant/10 rounded-xl space-y-3">
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
                <span>İspir'den doğrudan kapınıza kargo (24 saatte kargoya verilir)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                <span>Analiz sertifikalı ve Coğrafi İşaret logolu orijinal kutu</span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── TECHNICAL TABS & INGREDIENT TRANSPARENCY ─── */}
        <div className="border-t border-outline-variant/15 pt-12">
          <div className="flex border-b border-outline-variant/10 gap-10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("aciklama")}
              className={`pb-4 font-label-md text-xs uppercase tracking-widest font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === "aciklama" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Mahsul Hikayesi & Detaylar
            </button>
            <button
              onClick={() => setActiveTab("besin")}
              className={`pb-4 font-label-md text-xs uppercase tracking-widest font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === "besin" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Analiz & Besin Değerleri
            </button>
            <button
              onClick={() => setActiveTab("yorumlar")}
              className={`pb-4 font-label-md text-xs uppercase tracking-widest font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === "yorumlar" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Müşteri Değerlendirmeleri ({reviewsList.length})
            </button>
          </div>

          <div className="py-12 min-h-[350px]">
            {activeTab === "aciklama" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <h3 className="font-display-lg text-primary text-2xl font-bold">Asırlık Zanaatkarlık ve Yavaş Üretim</h3>
                  <p className="text-on-surface-variant font-body-md leading-relaxed font-light text-sm sm:text-base">
                    {harvestStoryText}
                  </p>
                  
                  <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-xl space-y-3">
                    <span className="text-[10px] text-secondary font-bold uppercase tracking-widest block">İçindekiler Temizliği</span>
                    <p className="text-sm font-bold text-primary">{ingredientsText}</p>
                    <p className="text-xs text-on-surface-variant font-light">Renklendirici, koruyucu, nişasta bazlı glikoz veya aroma verici sentetikler içermez.</p>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6 bg-white p-8 rounded-2xl border border-outline-variant/15 shadow-sm">
                  <h4 className="font-display-lg text-primary text-lg font-bold">Teknik Spesifikasyonlar</h4>
                  <div className="space-y-4">
                    {specificationsList.map((spec, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                        <span className="text-xs text-on-surface-variant font-semibold">{spec.key}</span>
                        <span className="text-xs text-primary font-bold font-mono">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "besin" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-6 bg-white p-8 rounded-2xl border border-outline-variant/15 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/20">
                        <th className="py-4 font-display-lg text-sm uppercase tracking-wider font-bold text-primary">Besin Ögesi</th>
                        <th className="py-4 font-display-lg text-sm uppercase tracking-wider font-bold text-primary text-right">100g Değeri</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-mono text-on-surface-variant">
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-3.5">Enerji (Energy)</td>
                        <td className="py-3.5 text-right font-bold text-primary">{nutrientsData.energy}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-3.5">Karbonhidrat (Carbohydrate)</td>
                        <td className="py-3.5 text-right font-bold text-primary">{nutrientsData.carb}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-3.5">Protein (Protein)</td>
                        <td className="py-3.5 text-right font-bold text-primary">{nutrientsData.protein}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-3.5">Kalsiyum (Calcium)</td>
                        <td className="py-3.5 text-right font-bold text-primary">{nutrientsData.calcium}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-3.5">Demir (Iron)</td>
                        <td className="py-3.5 text-right font-bold text-primary">{nutrientsData.iron}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-3.5">HMF Değeri (Analiz)</td>
                        <td className="py-3.5 text-right font-bold text-amber-600">{hmfLevelText}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="lg:col-span-6 space-y-6">
                  <div className="p-8 bg-surface-container-low border border-outline-variant/10 rounded-2xl">
                    <span className="material-symbols-outlined text-secondary text-3xl mb-3">restaurant_menu</span>
                    <h4 className="font-display-lg text-primary text-lg font-bold mb-3">Tüketim & Servis Ritüeli</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-light">
                      {ritualText}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-secondary-fixed bg-secondary-fixed/5 border border-secondary-fixed/20 p-4 rounded-xl">
                    <span className="material-symbols-outlined">info</span>
                    <span>Yukarıdaki değerler akredite gıda laboratuvarı mevsimsel analiz raporlarına dayanmaktadır.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "yorumlar" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
                    <div className="text-5xl font-display-lg text-primary font-bold">5.0</div>
                    <div className="flex justify-center text-secondary my-3">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                    <div className="text-on-surface-variant text-xs uppercase tracking-wider">{reviewsList.length} Doğrulanmış Müşteri</div>
                    <Button
                      className="mt-6 w-full py-3 cursor-pointer"
                      onClick={() => setIsReviewModalOpen(true)}
                    >
                      Yorum Gönder
                    </Button>
                  </div>
                </div>
                
                <div className="lg:col-span-8 space-y-6">
                  {reviewsList.map(rev => (
                    <div key={rev.id} className="border-b border-outline-variant/10 pb-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex text-secondary gap-0.5 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: i < rev.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                            ))}
                          </div>
                          <div className="font-bold text-xs text-on-surface uppercase tracking-wide">{rev.author}</div>
                        </div>
                        <span className="text-on-surface-variant/80 text-[10px] font-mono">{rev.date}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-light">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── YORUM GÖNDER MODAL ─── */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-800">Müşteri Değerlendirmesi Ekle</h3>
                <button type="button" onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddReviewSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Adınız Soyadınız *</label>
                  <input
                    type="text"
                    required
                    value={newReview.author}
                    onChange={e => setNewReview({ ...newReview, author: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Puanınız *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="text-amber-500 hover:scale-110 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: star <= newReview.rating ? "'FILL' 1" : "'FILL' 0" }}>
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Yorumunuz *</label>
                  <textarea
                    rows={4}
                    required
                    value={newReview.comment}
                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Ürün kalitesi, lezzeti ve paketlemesi hakkındaki deneyiminizi yazın..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-600/20"
                  >
                    Gönder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── PAYLAŞ MODAL (SHARE MODAL) ─── */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-100 animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
                    <span className="material-symbols-outlined text-xl">share</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Ürünü Paylaş</h3>
                    <p className="text-xs text-slate-500 font-medium">Sevdiklerinizle veya sosyal medyada paylaşın</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsShareModalOpen(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Product Preview Card */}
              <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                <div className="relative w-14 h-14 bg-white rounded-xl overflow-hidden border border-slate-200/80 flex-shrink-0 p-1">
                  <Image 
                    src={selectedMedia?.url || product?.image || "/premium-pekefe-kavanoz.png"} 
                    alt={product?.name || "Ürün"} 
                    fill 
                    className="object-contain p-1" 
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{product?.name}</h4>
                  <p className="text-[11px] text-amber-700 font-bold font-mono mt-0.5">₺{product?.price}</p>
                  <span className="text-[10px] text-slate-400 font-semibold truncate block">Pekefe Asırlık Erzurum Mahsulleri</span>
                </div>
              </div>

              {/* Share Platform Buttons Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    const text = getWhatsAppShareText();
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/60 text-emerald-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">chat</span>
                  </div>
                  <span className="text-xs font-extrabold">WhatsApp</span>
                </button>

                {/* Instagram */}
                <button
                  type="button"
                  onClick={() => {
                    const text = `${product?.name || "Pekefe"} - ₺${product?.price}\n${getPublicShareUrl()}`;
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(text);
                    }
                    window.open("https://www.instagram.com", "_blank");
                    setToastMsg("Ürün detayları & bağlantı kopyalandı! Instagram'da paylaşabilirsiniz.");
                    setToastOpen(true);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-pink-50 hover:bg-pink-100/90 border border-pink-200/60 text-pink-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                  </div>
                  <span className="text-xs font-extrabold">Instagram</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    const text = `*${product?.name || "Pekefe"}*\n💰 Fiyat: ₺${product?.price}\n✨ Pekefe Asırlık Erzurum Mahsulleri`;
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100/90 border border-sky-200/60 text-sky-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">send</span>
                  </div>
                  <span className="text-xs font-extrabold">Telegram</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100/90 border border-blue-200/60 text-blue-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">thumb_up</span>
                  </div>
                  <span className="text-xs font-extrabold">Facebook</span>
                </button>

                {/* X (Twitter) */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    const text = `${product?.name || "Pekefe"} - Pekefe Asırlık Erzurum Mahsulleri 🌾`;
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/90 border border-slate-200 text-slate-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">tag</span>
                  </div>
                  <span className="text-xs font-extrabold">X (Twitter)</span>
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(url);
                    }
                    setToastMsg("Ürün bağlantısı panoya kopyalandı!");
                    setToastOpen(true);
                    setIsShareModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200/60 text-amber-800 transition group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">content_copy</span>
                  </div>
                  <span className="text-xs font-extrabold">Kopyala</span>
                </button>
              </div>

              {/* Copy link input bar */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? getPublicShareUrl() : ""}
                  className="w-full bg-transparent text-xs font-mono text-slate-600 outline-none px-2 truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = getPublicShareUrl();
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(url);
                    }
                    setToastMsg("Ürün bağlantısı panoya kopyalandı!");
                    setToastOpen(true);
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition whitespace-nowrap cursor-pointer shadow-sm shadow-amber-600/20"
                >
                  Kopyala
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ─── SUGGESTIONS / BOUTIQUE COLLECTION ─── */}
        <section className="mt-24 border-t border-outline-variant/15 pt-16">
          <h2 className="font-display-lg text-primary text-2xl md:text-3xl font-bold mb-8 tracking-tight">
            Seçkin Mahsuller Koleksiyonu
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="group cursor-pointer">
                <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 relative aspect-[3/4] p-4 flex items-center justify-center">
                  {failedImages[rec.id] ? (
                    <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center text-primary z-10">
                      <span className="material-symbols-outlined text-3xl">eco</span>
                    </div>
                  ) : (
                    <Image
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                      src={rec.image}
                      alt={rec.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      onError={() => setFailedImages((prev) => ({ ...prev, [rec.id]: true }))}
                    />
                  )}
                  {rec.tag && (
                    <span className="absolute top-4 left-4 bg-secondary text-white text-[8px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">
                      {rec.tag}
                    </span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setToastMsg(`${rec.name} sepete eklendi!`);
                      setToastOpen(true);
                    }}
                    className="absolute bottom-4 right-4 bg-white hover:bg-primary text-primary hover:text-white p-3.5 rounded-lg shadow-sm border border-outline-variant/20 transition-all cursor-pointer flex items-center justify-center z-10"
                  >
                    <span className="material-symbols-outlined text-sm">shopping_cart</span>
                  </button>
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="font-display-lg text-primary text-sm font-bold leading-snug group-hover:underline">
                    <Link href={`/urun/${rec.id}`}>{rec.name}</Link>
                  </h3>
                  <div className="text-secondary font-bold text-xs font-mono">₺{rec.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <Toast
        message={toastMsg}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
