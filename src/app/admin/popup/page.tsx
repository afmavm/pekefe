"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Info, Save, Check, Loader2, MessageSquare, Image as ImageIcon, 
  Eye, Link as LinkIcon, Sparkles, X, FileImage 
} from "lucide-react";
import { toast } from "sonner";
import { useCMS } from "@/context/CMSContext";

export default function PopupAdminPage() {
  const { cmsData, updateCMSData } = useCMS();
  
  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Popup Settings States
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("Kampanya Başlığı");
  const [description, setDescription] = useState("Özel teklifler ve duyurular için e-bültene kaydolun.");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonText, setButtonText] = useState("Fırsatları İncele");
  const [buttonLink, setButtonLink] = useState("/products");
  
  // Media Assets Picker States
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
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
            setTitle(parsed.title || "");
            setDescription(parsed.description || "");
            setImageUrl(parsed.imageUrl || "");
            setButtonText(parsed.buttonText || "");
            setButtonLink(parsed.buttonLink || "");
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

  // Save Settings to Database
  const save = async () => {
    if (!title.trim()) {
      toast.error("Popup başlığı boş olamaz.");
      return;
    }
    if (!description.trim()) {
      toast.error("İçerik alanı boş olamaz.");
      return;
    }

    setSaving(true);
    try {
      const newPopupConfig = {
        isActive: active,
        title,
        description,
        imageUrl,
        buttonText,
        buttonLink,
      };

      await updateCMSData({
        popupConfig: JSON.stringify(newPopupConfig)
      });

      setSaved(true);
      toast.success("Popup ve kampanya ayarları başarıyla güncellendi.");
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
        <span className="text-sm text-gray-500">Ayarlar Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#b45309]" />
            Popup & Kampanya Yönetimi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Müşterileriniz sitenizi ziyaret ettiğinde karşılarına çıkacak reklam, kampanya ve duyuruları yönetin.
          </p>
        </div>
        
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
            saved 
              ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
              : "text-white bg-[#b45309] hover:bg-amber-700 shadow-[#b45309]/10"
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
          {saving ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Ayarları Kaydet"}
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Form Controls */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b45309]" />
                Popup Konfigürasyonu
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Duyuru parametrelerini aşağıdan ayarlayın.</p>
            </div>
            
            {/* Status Switcher Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">{active ? "AÇIK" : "KAPALI"}</span>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`relative inline-flex w-12 h-6.5 rounded-full transition-colors duration-200 shrink-0 ${
                  active ? "bg-emerald-500" : "bg-gray-200"
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

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Duyuru Başlığı *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Kampanya veya Duyuru Başlığı"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Duyuru Metni / Açıklaması *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputClass + " resize-none"}
                placeholder="Kullanıcıya gösterilecek kampanya detay metni..."
                required
              />
            </div>

            {/* Image Link & Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Duyuru Görsel Linki
              </label>
              <div className="flex gap-2">
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
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 bg-white rounded-xl hover:bg-gray-50 transition font-bold text-xs flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <ImageIcon className="w-4 h-4 text-[#b45309]" />
                  Görsel Seç
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Boş bırakırsanız popup sadece metin ve butondan oluşacak şekilde hizalanacaktır.
              </p>
            </div>

            {/* Interactive Grid for Actions Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Button Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Buton Yazısı (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className={inputClass}
                  placeholder="Fırsatları İncele"
                />
              </div>

              {/* Button Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Buton Linki
                </label>
                <input
                  type="text"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  className={inputClass}
                  placeholder="/products"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Interactive Device Mock Preview */}
        <div className="flex flex-col space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col justify-center min-h-[460px] relative shadow-inner overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-bold text-gray-400 z-10 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-150">
              <Eye className="w-3.5 h-3.5" />
              <span>Canlı Masaüstü Önizlemesi</span>
            </div>

            {active ? (
              <div className="relative w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-200 animate-in zoom-in-95 duration-500 max-w-lg mx-auto z-10">
                {imageUrl ? (
                  <div className="md:w-1/2 h-44 md:h-auto relative min-h-[160px]">
                    <Image 
                      src={imageUrl} 
                      alt={title} 
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 md:to-transparent md:from-black/5" />
                  </div>
                ) : (
                  <div className="md:w-1/2 h-44 md:h-auto relative min-h-[160px] bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                    <ImageIcon className="w-8 h-8 mb-2 stroke-[1.5]" />
                    <span className="text-[11px] font-semibold">Görsel Alanı Boş</span>
                  </div>
                )}

                <div className={`p-6 flex flex-col justify-center ${imageUrl ? 'md:w-1/2' : 'w-full text-center items-center'}`}>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-2 tracking-tight leading-tight">
                    {title || "Kampanya Başlığı"}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-5">
                    {description || "Kullanıcıya gösterilecek kampanya detay metni..."}
                  </p>
                  
                  {buttonText && buttonLink && (
                    <div 
                      className="inline-flex items-center justify-center px-5 py-2.5 font-bold text-white rounded-xl text-xs shadow-md transition select-none cursor-pointer self-start"
                      style={{ backgroundColor: primaryColor || '#b45309' }}
                    >
                      {buttonText}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 z-10">
                <Info className="w-10 h-10 text-gray-300 mb-3" />
                <h3 className="text-sm font-bold text-gray-700">Popup Şu Anda Pasif</h3>
                <p className="text-xs text-gray-400 max-w-xs mt-1">
                  Homepage popup'ı kapatıldı. Önizlemek için sol taraftaki durum butonunu aktif edin.
                </p>
              </div>
            )}
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
                  Medya Kütüphanesinden Seç
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Sitenizde barındırılan görsellerden birine tıklayarak seçin.</p>
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
              {mediaItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaItems.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => selectImageFromLibrary(item.url)}
                      className="group cursor-pointer bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:border-[#b45309] transition-all duration-350 flex flex-col h-44 shadow-sm hover:shadow-md"
                    >
                      <div className="relative flex-grow bg-gray-100 overflow-hidden">
                        <Image 
                          src={item.url} 
                          alt={item.alt || item.name} 
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1.5 bg-white text-gray-900 font-bold text-xs rounded-xl shadow-lg">Seç</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-white border-t border-gray-100">
                        <p className="text-[11px] font-bold text-gray-800 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{item.size || "Bilinmeyen Boyut"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileImage className="w-12 h-12 text-gray-300 mb-3 stroke-[1.5]" />
                  <h4 className="text-sm font-bold text-gray-700">Medya Kütüphanesi Boş</h4>
                  <p className="text-xs text-gray-400 max-w-xs mt-1 mb-4">
                    Öncelikle admin panelindeki Medya sayfasından bilgisayarınızdan resim yüklemeniz gerekmektedir.
                  </p>
                  <a 
                    href="/admin/media" 
                    className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Görsel Yüklemeye Git
                  </a>
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

