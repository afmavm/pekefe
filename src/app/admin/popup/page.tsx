"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Info, Save, Check, Loader2, MessageSquare, Image as ImageIcon, 
  Eye, Link as LinkIcon, Sparkles, X, FileImage, Clock, Tag, 
  Smartphone, Monitor, Copy, Upload, Zap, Gift, Truck, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useCMS } from "@/context/CMSContext";

export default function PopupAdminPage() {
  const { cmsData, updateCMSData } = useCMS();
  
  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Popup Core Settings States
  const [active, setActive] = useState(false);
  const [badge, setBadge] = useState("🔥 Rekolte Fırsatı");
  const [title, setTitle] = useState("Özel %15 Açılış İndirimi!");
  const [description, setDescription] = useState("İspir yaylasının saf ham balı ve geleneksel dut pekmezinde geçerli indirim kuponunuzu hemen kullanın.");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80");
  const [couponCode, setCouponCode] = useState("PEKEFE15");
  const [buttonText, setButtonText] = useState("Fırsatları İncele");
  const [buttonLink, setButtonLink] = useState("/kategoriler");
  
  // Advanced Target & Display Settings
  const [showDelay, setShowDelay] = useState(2); // seconds
  const [displayFrequency, setDisplayFrequency] = useState("once_per_session"); // once_per_session | once_per_day | always
  const [targetPage, setTargetPage] = useState("home_only"); // home_only | all
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [countdownEndDate, setCountdownEndDate] = useState("2026-08-31T23:59");

  // UI State Controls
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#b45309");

  // Load existing configuration from database via CMS Context
  useEffect(() => {
    if (cmsData) {
      if (cmsData.primaryColor) {
        setPrimaryColor(cmsData.primaryColor);
      }
      if (cmsData.popupConfig) {
        try {
          const parsed = typeof cmsData.popupConfig === 'string'
            ? JSON.parse(cmsData.popupConfig)
            : cmsData.popupConfig;
          
          if (parsed) {
            setActive(!!parsed.isActive);
            if (parsed.badge !== undefined) setBadge(parsed.badge);
            if (parsed.title !== undefined) setTitle(parsed.title);
            if (parsed.description !== undefined) setDescription(parsed.description);
            if (parsed.imageUrl !== undefined) setImageUrl(parsed.imageUrl);
            if (parsed.couponCode !== undefined) setCouponCode(parsed.couponCode);
            if (parsed.buttonText !== undefined) setButtonText(parsed.buttonText);
            if (parsed.buttonLink !== undefined) setButtonLink(parsed.buttonLink);
            if (parsed.showDelay !== undefined) setShowDelay(Number(parsed.showDelay) || 2);
            if (parsed.displayFrequency !== undefined) setDisplayFrequency(parsed.displayFrequency);
            if (parsed.targetPage !== undefined) setTargetPage(parsed.targetPage);
            if (parsed.countdownEnabled !== undefined) setCountdownEnabled(!!parsed.countdownEnabled);
            if (parsed.countdownEndDate !== undefined) setCountdownEndDate(parsed.countdownEndDate);
          }
        } catch (e) {
          console.error("Error parsing popupConfig in Admin Page", e);
        }
      }
      setLoading(false);
    }
  }, [cmsData]);

  // Fetch Media Library Assets for Picker
  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/cms/media", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMediaItems(data);
      }
    } catch (e) {
      console.error("Error fetching media for popup picker", e);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Direct File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImageUrl(data.url);
        toast.success("Görsel başarıyla yüklendi ve popup'a eklendi!");
        fetchMedia(); // Refresh picker
        setIsMediaPickerOpen(false);
      } else {
        toast.error(data.error || "Görsel yüklenemedi.");
      }
    } catch (err) {
      toast.error("Görsel yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  // Presets Loader
  const loadPreset = (presetType: string) => {
    if (presetType === "flash_sale") {
      setBadge("⚡ FLAŞ FIRSAT");
      setTitle("%20 Rekolte İndirimi!");
      setDescription("Tüm ham çiçek balları ve petek ürünlerinde sepette anında %20 indirim fırsatını kaçırmayın.");
      setImageUrl("https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=800&q=80");
      setCouponCode("FLAS20");
      setButtonText("Kuponu Kullan & İncele");
      setButtonLink("/kategoriler");
      setCountdownEnabled(true);
      toast.info("⚡ Flaş İndirim şablonu yüklendi.");
    } else if (presetType === "free_shipping") {
      setBadge("🚚 ÜCRETSİZ KARGO");
      setTitle("500 TL Üzerine Kargo Bedava!");
      setDescription("Siparişinizi tamamlayın, Türkiye'nin her yerine özel soğuk zincirli ve tescilli kargo ile kapınıza gelsin.");
      setImageUrl("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80");
      setCouponCode("BEDAVAKARGO");
      setButtonText("Alışverişe Başla");
      setButtonLink("/products");
      setCountdownEnabled(false);
      toast.info("🚚 Ücretsiz Kargo şablonu yüklendi.");
    } else if (presetType === "newsletter") {
      setBadge("🎁 REKOLTE KULÜBÜ");
      setTitle("Ayrıcalıklı Gurme Ailesine Katılın");
      setDescription("Yeni rekolte bal ve dut pekmezi üretimlerimizden ilk siz haberdar olun, özel hediyeler kazanın.");
      setImageUrl("https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80");
      setCouponCode("");
      setButtonText("Bültene Abone Ol");
      setButtonLink("/kayit");
      setCountdownEnabled(false);
      toast.info("🎁 Rekolte Kulübü şablonu yüklendi.");
    }
  };

  // Save Settings to Database
  const save = async () => {
    if (!title.trim()) {
      toast.error("Popup başlığı boş olamaz.");
      return;
    }

    setSaving(true);
    try {
      const newPopupConfig = {
        isActive: active,
        badge,
        title,
        description,
        imageUrl,
        couponCode,
        buttonText,
        buttonLink,
        showDelay,
        displayFrequency,
        targetPage,
        countdownEnabled,
        countdownEndDate,
      };

      await updateCMSData({
        popupConfig: JSON.stringify(newPopupConfig)
      });

      setSaved(true);
      toast.success("Popup ve kampanya ayarları başarıyla kaydedildi!");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.message || "Kayıt sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const selectImageFromLibrary = (url: string) => {
    setImageUrl(url);
    setIsMediaPickerOpen(false);
    toast.success("Görsel başarıyla seçildi.");
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309] transition bg-white text-gray-900 placeholder-gray-400";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#b45309]" />
        <span className="text-sm font-semibold text-gray-500">Popup Ayarları Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#b45309]" />
            Popup & Kampanya Açılır Pencere Yönetimi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ziyaretçilerinizin karşısına çıkan reklam, indirim kuponu ve kampanya pencerelerini canlı yönetin.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition shadow-md ${
              saved 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "text-white bg-[#b45309] hover:bg-amber-800 shadow-amber-900/10"
            } ${saving ? "opacity-75 cursor-not-allowed" : ""}`}
            style={!saved ? { backgroundColor: primaryColor } : {}}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>

      {/* Preset Quick Loader Buttons */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
          <Zap className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Hızlı Şablon Yükle:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadPreset("flash_sale")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            ⚡ Flaş İndirim
          </button>
          <button
            type="button"
            onClick={() => loadPreset("free_shipping")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-200 shadow-sm transition"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            🚚 Ücretsiz Kargo
          </button>
          <button
            type="button"
            onClick={() => loadPreset("newsletter")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-xl border border-blue-200 shadow-sm transition"
          >
            <Gift className="w-3.5 h-3.5 text-blue-600" />
            🎁 Rekolte Kulübü
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Activation & General */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#b45309]" />
                  Popup Durumu & Gösterim Hedeflemesi
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Pencerenin ne zaman ve nerede çıkacağını belirleyin.</p>
              </div>
              
              {/* Status Switcher Toggle */}
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {active ? "AKTİF / YAYINDA" : "PASİF / KAPALI"}
                </span>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative inline-flex w-12 h-6.5 rounded-full transition-colors duration-200 shrink-0 ${
                    active ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5.5 h-5.5 bg-white rounded-full shadow transition-transform duration-200 ${
                      active ? "translate-x-5.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Show Delay */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Açılış Gecikmesi (Sn)
                </label>
                <select
                  value={showDelay}
                  onChange={(e) => setShowDelay(Number(e.target.value))}
                  className={inputClass}
                >
                  <option value={0}>Anında (0 Saniye)</option>
                  <option value={1}>1 Saniye Sonra</option>
                  <option value={2}>2 Saniye Sonra (Önerilen)</option>
                  <option value={5}>5 Saniye Sonra</option>
                  <option value={10}>10 Saniye Sonra</option>
                </select>
              </div>

              {/* Display Frequency */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Gösterim Sıklığı
                </label>
                <select
                  value={displayFrequency}
                  onChange={(e) => setDisplayFrequency(e.target.value)}
                  className={inputClass}
                >
                  <option value="once_per_session">Oturumda 1 Kez (Kapatınca Gizlenir)</option>
                  <option value="once_per_day">Günde 1 Kez (24 Saat)</option>
                  <option value="always">Her Sayfa Yenilendiğinde</option>
                </select>
              </div>

              {/* Target Page */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Hedef Sayfalar
                </label>
                <select
                  value={targetPage}
                  onChange={(e) => setTargetPage(e.target.value)}
                  className={inputClass}
                >
                  <option value="home_only">Sadece Ana Sayfa</option>
                  <option value="all">Tüm Sayfalar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Content & Copywriting */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#b45309]" />
              Metin ve İndirim Detayları
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Badge */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Üst Rozet / Etiket Metni
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className={inputClass}
                  placeholder="örn: 🔥 Rekolte Fırsatı"
                />
              </div>

              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  İndirim Kuponu Kodu (İsteğe Bağlı)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className={inputClass + " uppercase font-mono font-bold tracking-wider text-amber-700 bg-amber-50/30"}
                    placeholder="örn: PEKEFE20"
                  />
                  {couponCode && (
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Kopyalanabilir
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Duyuru / Kampanya Başlığı *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass + " font-extrabold"}
                placeholder="örn: Özel %15 Açılış İndirimi!"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Açıklama Metni *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputClass + " resize-none"}
                placeholder="Kullanıcıya gösterilecek detaylı kampanya mesajı..."
                required
              />
            </div>

            {/* Countdown Timer Settings */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Canlı Geri Sayım Sayacı</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCountdownEnabled(!countdownEnabled)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    countdownEnabled ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-gray-200 text-gray-600 border-gray-300"
                  }`}
                >
                  {countdownEnabled ? "SAYAÇ AKTİF" : "SAYAÇ KAPALI"}
                </button>
              </div>

              {countdownEnabled && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Kampanya Bitiş Tarihi ve Saati
                  </label>
                  <input
                    type="datetime-local"
                    value={countdownEndDate}
                    onChange={(e) => setCountdownEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Action Button Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Buton Etiketi
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className={inputClass}
                  placeholder="Fırsatları İncele"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Buton Bağlantısı (URL)
                </label>
                <input
                  type="text"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  className={inputClass}
                  placeholder="/kategoriler"
                />
              </div>
            </div>

            {/* Image Selection & Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Duyuru Görseli
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className={inputClass + " pl-10"}
                    placeholder="https://example.com/kampanya.jpg"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="px-4 py-2.5 border border-gray-200 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <ImageIcon className="w-4 h-4 text-[#b45309]" />
                    Kütüphaneden Seç
                  </button>

                  <label className="px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-amber-400" />}
                    <span>Yükle</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Interactive Device Mock Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col min-h-[580px] sticky top-6">
            
            {/* Device Switcher Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <Eye className="w-4 h-4 text-[#b45309]" />
                <span>Canlı Önizleme Mode</span>
              </div>

              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    previewMode === "desktop" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Masaüstü
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    previewMode === "mobile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobil
                </button>
              </div>
            </div>

            {/* Preview Container */}
            <div className="flex-1 bg-gray-100/80 rounded-xl p-4 border border-gray-200/80 flex items-center justify-center relative overflow-hidden">
              {active ? (
                <div
                  className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
                    previewMode === "mobile" ? "w-full max-w-[280px] flex-col" : "w-full max-w-md flex-col sm:flex-row"
                  }`}
                >
                  {/* Close Icon Simulation */}
                  <div className="absolute top-2.5 right-2.5 z-20 w-7 h-7 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md border border-gray-200 text-gray-500">
                    <X className="w-4 h-4" />
                  </div>

                  {/* Image Part */}
                  {imageUrl ? (
                    <div className={`relative ${previewMode === "mobile" ? "h-36 w-full" : "sm:w-5/12 h-36 sm:h-auto min-h-[140px]"}`}>
                      <Image 
                        src={imageUrl} 
                        alt={title} 
                        fill 
                        sizes="400px" 
                        className="object-cover" 
                      />
                    </div>
                  ) : (
                    <div className={`relative bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-3 ${previewMode === "mobile" ? "h-28 w-full" : "sm:w-5/12 h-28 sm:h-auto"}`}>
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Görsel Yok</span>
                    </div>
                  )}

                  {/* Content Part */}
                  <div className={`p-4 flex flex-col justify-center ${previewMode === "mobile" ? "w-full" : "sm:w-7/12"}`}>
                    {badge && (
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-black text-amber-800 bg-amber-100 rounded-full w-max mb-1.5">
                        {badge}
                      </span>
                    )}

                    <h3 className="text-sm font-black text-gray-900 tracking-tight leading-snug mb-1">
                      {title || "Duyuru Başlığı"}
                    </h3>

                    <p className="text-[11px] text-gray-500 font-medium leading-normal mb-3 line-clamp-3">
                      {description || "Açıklama metni..."}
                    </p>

                    {/* Countdown Simulation */}
                    {countdownEnabled && (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2 mb-3 text-center">
                        <div className="text-[9px] font-bold text-amber-900 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Kalan Süre:</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-black text-amber-950">
                          <span className="bg-white px-1.5 py-0.5 rounded border border-amber-200">02d</span>:
                          <span className="bg-white px-1.5 py-0.5 rounded border border-amber-200">14sa</span>:
                          <span className="bg-white px-1.5 py-0.5 rounded border border-amber-200">35dk</span>
                        </div>
                      </div>
                    )}

                    {/* Coupon Code Box */}
                    {couponCode && (
                      <div className="bg-dashed border border-amber-300 bg-amber-50/50 rounded-lg p-2 mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-amber-900 tracking-wider">
                          Kupon: <strong>{couponCode}</strong>
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Copy className="w-2.5 h-2.5" />
                          Kopyala
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    {buttonText && (
                      <button
                        type="button"
                        className="w-full py-2 px-3 text-xs font-bold text-white rounded-xl shadow transition text-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {buttonText}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Info className="w-10 h-10 text-gray-300 mb-2" />
                  <h4 className="text-xs font-bold text-gray-600">Popup Pasif Konumda</h4>
                  <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                    Önizlemeyi görmek için sol üstteki durumu AKTİF yapın.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMediaPickerOpen(false)}></div>
          
          <div className="bg-white relative z-10 rounded-[2rem] w-full max-w-3xl shadow-2xl border border-gray-200 transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-[2rem] shrink-0">
              <div>
                <h3 className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#b45309]" />
                  Medya Kütüphanesinden Görsel Seç
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Sitenize yüklediğiniz görsellerden birine tıklayarak seçin veya yenisini yükleyin.</p>
              </div>
              <button 
                onClick={() => setIsMediaPickerOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-red-100 hover:text-red-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Images Grid */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-500">Mevcut Görseller ({mediaItems.length})</span>
                <label className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-800 transition flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Yeni Yükle</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {mediaItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaItems.map((item) => (
                    <div 
                      key={item.id || item.url}
                      onClick={() => selectImageFromLibrary(item.url)}
                      className="group cursor-pointer bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:border-[#b45309] transition-all duration-350 flex flex-col h-44 shadow-sm hover:shadow-md"
                    >
                      <div className="relative flex-grow bg-gray-100 overflow-hidden">
                        <Image 
                          src={item.url} 
                          alt={item.alt || item.name || "Media Asset"} 
                          fill
                          sizes="200px"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 bg-white text-gray-900 font-bold text-xs rounded-xl shadow-lg">Seç</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-white border-t border-gray-100">
                        <p className="text-[11px] font-bold text-gray-800 truncate" title={item.name}>
                          {item.name || "Görsel"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileImage className="w-12 h-12 text-gray-300 mb-3 stroke-[1.5]" />
                  <h4 className="text-sm font-bold text-gray-700">Medya Kütüphanesi Boş</h4>
                  <p className="text-xs text-gray-400 max-w-xs mt-1 mb-4">
                    Henüz hiç görsel yüklenmedi. "Yeni Yükle" butonunu kullanarak bilgisayarınızdan görsel ekleyebilirsiniz.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-[2rem] flex justify-end shrink-0">
              <button 
                onClick={() => setIsMediaPickerOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
