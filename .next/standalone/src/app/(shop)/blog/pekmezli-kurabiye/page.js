"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";
import { addToCart } from "@/utils/cartStorage";

export default function PekmezliKurabiyeTarifi() {
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });
  // Checkable ingredients state
  const [checkedIngredients, setCheckedIngredients] = useState({});

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const ingredients = [
    "1 su bardağı Pekefe Dut Pekmezi",
    "125 gr Oda Sıcaklığında Tereyağı",
    "1 adet Yumurta Sarısı",
    "3.5 su bardağı Elenmiş Un",
    "1 paket Kabartma Tozu",
    "Yarım su bardağı Dövülmüş Ceviz",
  ];

  const steps = [
    {
      title: "Sıvı Karışımı Hazırlayın",
      desc: "Geniş bir karıştırma kabına oda sıcaklığındaki tereyağını, yumurta sarısını ve Pekefe Dut Pekmezi'ni alın. Tüm malzemeler tamamen bütünleşene kadar bir spatula yardımıyla karıştırın.",
    },
    {
      title: "Kuru Malzemeleri Ekleyin",
      desc: "Elenmiş unu ve kabartma tozunu azar azar karışıma ilave edin. Ele yapışmayan, yumuşak bir hamur elde edene kadar yaklaşık 5-6 dakika boyunca yoğurun.",
    },
    {
      title: "Şekil Verme ve Pişirme",
      desc: "Hamurdan ceviz büyüklüğünde parçalar koparıp yuvarlayın. Yağlı kağıt serili fırın tepsisine aralıklı olarak dizin. Önceden ısıtılmış 170 derece fırında altları hafifçe kızarana kadar yaklaşık 18-20 dakika pişirin.",
    },
  ];

  const relatedProducts = [
    {
      id: "dut-pekmezi",
      name: "Geleneksel İspir Dut Pekmezi",
      price: "₺280",
      img: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    },
    {
      id: "ceviz",
      name: "İspir Kelebek Ceviz",
      price: "₺185",
      img: "/ispir-kome-gercek-hasat.jpg",
    },
  ];

  const handleAddToCart = (product) => {
    const numericPrice = typeof product.price === "string" ? parseFloat(product.price.replace(/[^0-9.-]+/g,"")) : product.price;
    addToCart({ ...product, price: numericPrice }, 1);
    setToast({ isOpen: true, message: `${product.name} sepetinize eklendi!`, type: "success" });
  };

  return (
    <div className="w-full bg-background text-on-surface font-body-md antialiased pb-section-gap">
      <Toast 
        isOpen={toast.isOpen} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, isOpen: false })} 
      />
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant/80 mb-6 font-label-sm">
          <Link href="/blog" className="hover:text-primary transition-colors">
            Blog & Tarifler
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-bold">Tarif Detay</span>
        </nav>

        {/* Hero Section */}
        <section className="relative rounded-3xl overflow-hidden mb-section-gap group shadow-lg min-h-[350px] md:min-h-[450px] flex items-end">
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage: "url('/ispir-pestil-kurutma-gercek.png')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>
          <div className="relative z-10 p-8 md:p-16 max-w-3xl text-white">
            <span className="bg-secondary text-white font-label-md text-xs px-4 py-1.5 rounded-full mb-4 inline-block uppercase tracking-widest font-bold">
              Geleneksel Tarif
            </span>
            <h1 className="font-display-lg text-[28px] sm:text-[38px] md:text-headline-lg lg:text-[48px] text-white mb-4 font-bold leading-tight">
              Geleneksel Dut Pekmezli Anne Kurabiyesi
            </h1>
            <p className="text-white/90 font-body-lg text-sm md:text-base leading-relaxed">
              Anadolu'nun bereketli topraklarından gelen saf dut pekmezi ile hazırlanan, ağızda
              dağılan kıvamı ve şifalı dokunuşuyla çay saatlerinizin vazgeçilmezi olacak.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Content */}
          <div className="lg:col-span-8">
            {/* Metadata & Social Share */}
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-outline-variant/30 pb-8 mb-8">
              <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Hazırlık
                    </p>
                    <p className="font-bold text-on-surface text-sm sm:text-base">15 Dakika</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">oven</span>
                  </div>
                  <div>
                    <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Pişirme
                    </p>
                    <p className="font-bold text-on-surface text-sm sm:text-base">20 Dakika</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">signal_cellular_alt</span>
                  </div>
                  <div>
                    <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Zorluk
                    </p>
                    <p className="font-bold text-on-surface text-sm sm:text-base">Kolay</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                  <div>
                    <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                      Porsiyon
                    </p>
                    <p className="font-bold text-on-surface text-sm sm:text-base">24 Adet</p>
                  </div>
                </div>
              </div>

              {/* Share actions */}
              <div className="flex items-center gap-2">
                {["share", "push_pin", "chat", "link"].map((icon, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (icon === "link") {
                        if (typeof window !== "undefined") {
                          navigator.clipboard.writeText(window.location.href);
                        }
                        showNotification("Tarif bağlantısı panoya kopyalandı!", "success");
                      } else {
                        showNotification("Paylaşım özelliği yakında aktif olacaktır.", "info");
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="mb-12">
              <h2 className="font-headline-md text-2xl text-on-surface mb-6 font-bold">Malzemeler</h2>
              <p className="text-on-surface-variant text-sm mb-4">
                * Hazırladığınız malzemeleri işaretleyerek tarifi takip edebilirsiniz.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ingredients.map((ing, idx) => (
                  <label
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-all duration-300 group ${
                      checkedIngredients[idx]
                        ? "bg-surface-container border-primary/20 opacity-70"
                        : "bg-surface-container-lowest border-outline-variant/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedIngredients[idx]}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                    <span
                      className={`font-body-md text-sm sm:text-base transition-colors ${
                        checkedIngredients[idx]
                          ? "line-through text-on-surface-variant"
                          : "text-on-surface group-hover:text-primary"
                      }`}
                    >
                      {ing}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Instructions Section */}
            <div className="mb-12">
              <h2 className="font-headline-md text-2xl text-on-surface mb-6 font-bold">Hazırlanışı</h2>
              <div className="space-y-8">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-display-lg text-xl font-bold shadow-lg shadow-primary/10">
                      {idx + 1}
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-on-surface text-base sm:text-lg mb-2">
                        {step.title}
                      </h3>
                      <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chef's Secret Box */}
            <div className="relative p-6 sm:p-8 rounded-2xl overflow-hidden mb-12 border border-primary/10 bg-primary/[0.02]">
              <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[160px] text-primary">
                  restaurant_menu
                </span>
              </div>
              <div className="relative flex items-start gap-4 sm:gap-6">
                <div className="w-12 h-12 flex-shrink-0 bg-secondary rounded-full flex items-center justify-center text-white shadow-inner">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <h4 className="font-headline-md text-lg text-primary font-bold mb-2">Pekefe'nin Sırrı</h4>
                  <p className="text-on-surface-variant font-body-lg text-sm sm:text-base italic leading-relaxed">
                    "Pekmezli kurabiyelerinizin daha parlak görünmesi ve aromasının mühürlenmesi için,
                    kurabiyeler fırından çıkar çıkmaz üzerlerine fırça yardımıyla bir miktar daha
                    pekmez sürebilirsiniz. Bu işlem kurabiyelere 'karamelize' bir dış katman
                    kazandıracaktır."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Related Products */}
            <div className="bg-surface-container-low rounded-2xl p-6 sm:p-8 border border-outline-variant/20 premium-shadow">
              <h3 className="font-headline-md text-lg text-on-surface mb-6 font-bold">Tarifteki Ürünler</h3>
              <div className="space-y-6">
                {relatedProducts.map((prod) => (
                  <div key={prod.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low border border-outline-variant/10 relative">
                      <Image
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        src={prod.img}
                        alt={prod.name}
                        fill
                        sizes="80px"
                      />
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm sm:text-base line-clamp-1">
                          {prod.name}
                        </h4>
                        <p className="text-primary font-bold text-sm">{prod.price}</p>
                      </div>
                      <button
                        onClick={() => handleAddToCart(prod)}
                        className="flex items-center gap-2 text-secondary font-label-md text-xs hover:translate-x-1 transition-transform font-bold cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        Sepete Ekle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Call To Action */}
            <div className="bg-primary p-8 rounded-2xl text-white relative overflow-hidden group shadow-md">
              <div className="relative z-10 text-center">
                <span className="material-symbols-outlined text-4xl mb-4 text-secondary-fixed">
                  mail
                </span>
                <h4 className="font-headline-md text-lg mb-2 font-bold">Tariflerimiz Gelsin</h4>
                <p className="font-body-md text-xs text-white/80 mb-6">
                  Her hafta yeni ve özel geleneksel tarifleri e-postanıza gönderiyoruz.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    showNotification("E-posta listesine başarıyla abone olundu!", "success");
                  }}
                  className="space-y-3"
                >
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-secondary transition-all text-sm"
                    placeholder="E-posta adresiniz"
                    type="email"
                    required
                  />
                  <button
                    className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:bg-secondary-container transition-all active:scale-95 text-sm cursor-pointer"
                    type="submit"
                  >
                    Abone Ol
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

