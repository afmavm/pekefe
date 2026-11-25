"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  PlayCircle,
  RefreshCw,
  Save,
  Send,
  Settings,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type MainView = "studio" | "settings";
type PlatformTab = "visuals" | "instagram" | "facebook" | "whatsapp" | "youtube" | "googleBusiness";

function VisualPreviewCard({
  packId,
  format,
  title,
  sizeLabel,
  aspectClass = "aspect-[4/5]",
}: {
  packId: string;
  format: string;
  title: string;
  sizeLabel: string;
  aspectClass?: string;
}) {
  const previewUrl = `/api/social-media/visual?packId=${encodeURIComponent(packId)}&format=${encodeURIComponent(format)}`;
  const downloadUrl = `${previewUrl}&download=1`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
      <div className={`relative w-full ${aspectClass} bg-slate-100 overflow-hidden`}>
        <img
          src={previewUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-contain bg-slate-900/5"
        />
      </div>
      <div className="p-2.5 flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70">
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold text-slate-900 truncate">{title}</div>
          <div className="text-[10px] font-mono text-slate-500">{sizeLabel}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            title="Tam Boyut Aç"
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={downloadUrl}
            download
            title="PNG İndir"
            className="px-2 py-1.5 bg-[#6b1d2f] hover:bg-[#521423] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
          >
            <Download className="w-3 h-3" /> PNG
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminSocialMediaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<MainView>("studio");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [platformTab, setPlatformTab] = useState<PlatformTab>("instagram");
  const [generating, setGenerating] = useState(false);
  const [publishingKey, setPublishingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Settings form state
  const [settings, setSettings] = useState({
    enabled: true,
    autoGenerateOnNewProduct: true,
    autoPublishOnNewProduct: true,
    instagram: {
      enabled: true,
      accountId: "",
      accessToken: "",
      hasAccessToken: false,
      publishPost: true,
      publishStory: true,
    },
    facebook: {
      enabled: true,
      pageId: "",
      pageAccessToken: "",
      hasPageAccessToken: false,
    },
    whatsapp: {
      enabled: true,
      broadcastPhones: "",
    },
    youtube: {
      enabled: true,
      channelHandle: "@pekefe",
      webhookUrl: "",
    },
    googleBusiness: {
      enabled: true,
      locationName: "PEKEFE İspir Yöresel Ürünler",
      webhookUrl: "",
    },
    universalWebhookUrl: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social-media", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      if (json.products?.length && !selectedProductId) {
        setSelectedProductId(json.products[0].id);
      }
      if (json.packs?.length && !selectedPackId) {
        setSelectedPackId(json.packs[0].id);
      }
      if (json.settings) {
        setSettings((prev) => ({
          ...prev,
          enabled: Boolean(json.settings.enabled),
          autoGenerateOnNewProduct: Boolean(json.settings.autoGenerateOnNewProduct),
          autoPublishOnNewProduct: Boolean(json.settings.autoPublishOnNewProduct),
          universalWebhookUrl: json.settings.universalWebhookUrl || "",
          instagram: {
            ...prev.instagram,
            ...json.settings.instagram,
            accessToken: "",
          },
          facebook: {
            ...prev.facebook,
            ...json.settings.facebook,
            pageAccessToken: "",
          },
          whatsapp: {
            ...prev.whatsapp,
            ...json.settings.whatsapp,
          },
          youtube: {
            ...prev.youtube,
            ...json.settings.youtube,
          },
          googleBusiness: {
            ...prev.googleBusiness,
            ...json.settings.googleBusiness,
          },
        }));
      }
    } catch {
      toast.error("Sosyal medya verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedProductId) {
      toast.error("Lütfen bir ürün seçin.");
      return;
    }
    setGenerating(true);
    const t = toast.loading("5 platform için kanca yöntemli AI içerikleri üretiliyor...");
    try {
      const res = await fetch("/api/admin/social-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", productId: selectedProductId }),
      });
      const json = await res.json();
      toast.dismiss(t);
      if (res.ok && json.pack) {
        toast.success(
          `5 platform içeriği hazırlandı (${json.pack.generatedBy === "gemini" ? "Gemini AI ✨" : "Akıllı Şablon"})!`
        );
        setSelectedPackId(json.pack.id);
        loadData();
      } else {
        toast.error(json.error || "İçerik üretilemedi.");
      }
    } catch {
      toast.dismiss(t);
      toast.error("Bağlantı hatası.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (packId: string, target: string) => {
    setPublishingKey(`${packId}:${target}`);
    try {
      const res = await fetch("/api/admin/social-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", packId, target }),
      });
      const json = await res.json();
      if (res.ok && json.results) {
        const vals = Object.values(json.results) as any[];
        const okCount = vals.filter((v) => v?.ok).length;
        const firstErr = vals.find((v) => v?.error)?.error;
        if (okCount > 0) {
          toast.success(`${okCount} platforma başarıyla yayınlandı!`);
        } else if (firstErr) {
          toast.warning(firstErr);
        } else {
          toast.info("Otomatik yayın için API/Webhook bağlantısı ekleyin veya tek tıkla kopyalayın.");
        }
        loadData();
      } else {
        toast.error(json.error || "Yayınlama başarısız.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setPublishingKey(null);
    }
  };

  const handleDeletePack = async (packId: string) => {
    await fetch("/api/admin/social-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-pack", packId }),
    }).catch(() => {});
    if (selectedPackId === packId) setSelectedPackId(null);
    toast.success("Paket silindi.");
    loadData();
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/social-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-settings", ...settings }),
      });
      if (res.ok) {
        toast.success("Sosyal medya otomasyon ayarları kaydedildi.");
        loadData();
      } else {
        toast.error("Ayarlar kaydedilemedi.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  const copyText = (text: string, label = "İçerik") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} panoya kopyalandı!`);
  };

  const packs = data?.packs || [];
  const activePack = packs.find((p: any) => p.id === selectedPackId) || packs[0] || null;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-[#6b1d2f]" />
            Sosyal Medya AI İçerik &amp; Otomatik Yayın Stüdyosu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Instagram (Post · Hikaye · Reels), WhatsApp, Facebook, YouTube Shorts &amp; Google İşletme — Yeni üründe otomatik kanca yöntemli üretim
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("studio")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              view === "studio"
                ? "bg-[#6b1d2f] text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            İçerik Stüdyosu ({packs.length})
          </button>
          <button
            onClick={() => setView("settings")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              view === "settings"
                ? "bg-[#6b1d2f] text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            API &amp; Otomasyon Ayarları
          </button>
        </div>
      </div>

      {/* STUDIO VIEW */}
      {view === "studio" && (
        <>
          {/* Generator Bar */}
          <div className="bg-gradient-to-r from-[#6b1d2f] to-[#46111e] text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">
                5 Platform İçin Kanca Yöntemli AI İçerik Üret
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-bold focus:outline-none"
              >
                {(data?.products || []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₺{Number(p.price || 0).toLocaleString("tr-TR")}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedProductId}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0 disabled:opacity-60 md:mt-5"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              5 Platform İçin Üret
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar: Generated Packs List */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Hazır Ürün Paketleri
                </h2>
                <button
                  onClick={loadData}
                  className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                  title="Yenile"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {packs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Henüz içerik paketi yok. Yukarıdan bir ürün seçip <strong>5 Platform İçin Üret</strong> butonuna basın veya yeni ürün ekleyin!
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {packs.map((pack: any) => (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPackId(pack.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                        activePack?.id === pack.id
                          ? "bg-rose-50/70 border-[#6b1d2f] shadow-xs"
                          : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={pack.productImage}
                        alt={pack.productName}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {pack.productName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{new Date(pack.createdAt).toLocaleDateString("tr-TR")}</span>
                          <span>·</span>
                          <span className="font-bold text-amber-700">
                            {pack.generatedBy === "gemini" ? "Gemini AI ✨" : "Şablon"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePack(pack.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Paketi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Content: 5-Platform Viewer */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              {!activePack ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  İçerikleri görüntülemek için soldan bir paket seçin veya yeni paket üretin.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-black text-slate-900">{activePack.productName}</h2>
                      <a
                        href={activePack.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#6b1d2f] hover:underline inline-flex items-center gap-1 font-mono"
                      >
                        {activePack.productUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <button
                      onClick={() => handlePublish(activePack.id, "all")}
                      disabled={publishingKey === `${activePack.id}:all`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {publishingKey === `${activePack.id}:all` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Bağlı Tüm Platformlara Yayınla
                    </button>
                  </div>

                  {/* Platform Selector Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                      { id: "visuals", label: "Hazır Görseller (9 PNG)", icon: ImageIcon },
                      { id: "instagram", label: "Instagram (Post · Hikaye · Reels)", icon: Camera },
                      { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                      { id: "facebook", label: "Facebook", icon: Globe },
                      { id: "youtube", label: "YouTube Shorts", icon: PlayCircle },
                      { id: "googleBusiness", label: "Google İşletme", icon: MapPin },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setPlatformTab(tab.id as PlatformTab)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
                            platformTab === tab.id
                              ? "bg-[#6b1d2f] text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* ALL 9 BRANDED VISUALS TAB */}
                  {platformTab === "visuals" && (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-center justify-between flex-wrap gap-2">
                        <span>
                          <strong>Otomatik Marka Görsel Stüdyosu:</strong> Her platformun piksel standardına uygun, kanca (hook) metinli ve PEKEFE fiyat rozetli 9 yüksek çözünürlüklü PNG görsel otomatik üretilir.
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        <VisualPreviewCard packId={activePack.id} format="ig-post" title="Instagram Post" sizeLabel="1080×1350 (4:5)" aspectClass="aspect-[4/5]" />
                        <VisualPreviewCard packId={activePack.id} format="ig-story-1" title="Instagram Hikaye 1 (Kanca)" sizeLabel="1080×1920 (9:16)" aspectClass="aspect-[9/16]" />
                        <VisualPreviewCard packId={activePack.id} format="ig-story-2" title="Instagram Hikaye 2 (Fayda)" sizeLabel="1080×1920 (9:16)" aspectClass="aspect-[9/16]" />
                        <VisualPreviewCard packId={activePack.id} format="ig-story-3" title="Instagram Hikaye 3 (CTA)" sizeLabel="1080×1920 (9:16)" aspectClass="aspect-[9/16]" />
                        <VisualPreviewCard packId={activePack.id} format="ig-reels" title="Instagram Reels Kapağı" sizeLabel="1080×1920 (9:16)" aspectClass="aspect-[9/16]" />
                        <VisualPreviewCard packId={activePack.id} format="yt-shorts" title="YouTube Shorts Kapağı" sizeLabel="1080×1920 (9:16)" aspectClass="aspect-[9/16]" />
                        <VisualPreviewCard packId={activePack.id} format="wa-card" title="WhatsApp Paylaşım Kartı" sizeLabel="1080×1080 (1:1)" aspectClass="aspect-square" />
                        <VisualPreviewCard packId={activePack.id} format="fb-post" title="Facebook Sayfa Görseli" sizeLabel="1200×630" aspectClass="aspect-[1200/630]" />
                        <VisualPreviewCard packId={activePack.id} format="gbp-post" title="Google İşletme (Haritalar)" sizeLabel="1200×900 (4:3)" aspectClass="aspect-[4/3]" />
                      </div>
                    </div>
                  )}

                  {/* INSTAGRAM TAB: POST + STORY + REELS */}
                  {platformTab === "instagram" && (
                    <div className="space-y-5">
                      {/* 1. Instagram Post */}
                      <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/30 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="text-xs font-black text-pink-900 uppercase tracking-wider">
                            1. Instagram Post (Kanca + Açıklama + Hashtag)
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                copyText(
                                  `${activePack.instagram.post.caption}\n\n${activePack.instagram.post.hashtags.join(" ")}`,
                                  "Instagram Post"
                                )
                              }
                              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" /> Kopyala
                            </button>
                            <button
                              onClick={() => handlePublish(activePack.id, "instagramPost")}
                              disabled={publishingKey === `${activePack.id}:instagramPost`}
                              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              <Send className="w-3 h-3" /> Post Yayınla
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          <div className="md:col-span-4">
                            <VisualPreviewCard
                              packId={activePack.id}
                              format="ig-post"
                              title="Instagram Post Görseli"
                              sizeLabel="1080×1350"
                              aspectClass="aspect-[4/5]"
                            />
                          </div>
                          <div className="md:col-span-8 space-y-2.5">
                            <div className="p-3 bg-white rounded-lg border border-pink-100 text-xs whitespace-pre-line text-slate-700 leading-relaxed">
                              {activePack.instagram.post.caption}
                            </div>
                            <div className="text-[11px] font-mono text-pink-700 break-words">
                              {activePack.instagram.post.hashtags.join(" ")}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Instagram Story */}
                      <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider">
                            2. Instagram Hikaye (3 Slaytlık Etkileşim Akışı)
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                copyText(
                                  activePack.instagram.story.slides
                                    .map((s: any) => `SLAYT ${s.slideNo}: ${s.headline}\n${s.body}\nÇıkartma: ${s.stickerSuggestion}`)
                                    .join("\n\n"),
                                  "Instagram Hikaye Akışı"
                                )
                              }
                              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" /> Kopyala
                            </button>
                            <button
                              onClick={() => handlePublish(activePack.id, "instagramStory")}
                              disabled={publishingKey === `${activePack.id}:instagramStory`}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              <Send className="w-3 h-3" /> Hikaye Yayınla
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {(activePack.instagram.story.slides || []).map((s: any) => (
                            <div key={s.slideNo} className="space-y-2">
                              <VisualPreviewCard
                                packId={activePack.id}
                                format={`ig-story-${s.slideNo}`}
                                title={`Slayt ${s.slideNo} Görseli`}
                                sizeLabel="1080×1920"
                                aspectClass="aspect-[9/16]"
                              />
                              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1.5">
                                <span className="text-[10px] font-black uppercase text-purple-700">
                                  Slayt {s.slideNo}
                                </span>
                                <div className="text-xs font-extrabold text-slate-900">{s.headline}</div>
                                <div className="text-[11px] text-slate-600 whitespace-pre-line">{s.body}</div>
                                <div className="text-[10px] bg-purple-50 text-purple-800 px-2 py-1 rounded-md font-semibold">
                                  {s.stickerSuggestion}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Instagram Reels */}
                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                            3. Instagram Reels (Kanca Senaryosu + Çekim Planı)
                          </h3>
                          <button
                            onClick={() =>
                              copyText(
                                `0-3sn KANCA: ${activePack.instagram.reels.hook0_3s}\n\n3-15sn GÖVDE: ${activePack.instagram.reels.body3_15s}\n\n15-25sn CTA: ${activePack.instagram.reels.cta15_25s}\n\nÇEKİM PLANI: ${activePack.instagram.reels.visualDirection}\n\nAÇIKLAMA:\n${activePack.instagram.reels.caption}\n${activePack.instagram.reels.hashtags.join(" ")}`,
                                "Reels Senaryosu"
                              )
                            }
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Senaryoyu Kopyala
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          <div className="md:col-span-4">
                            <VisualPreviewCard
                              packId={activePack.id}
                              format="ig-reels"
                              title="Reels Kapak Görseli"
                              sizeLabel="1080×1920"
                              aspectClass="aspect-[9/16]"
                            />
                          </div>
                          <div className="md:col-span-8 space-y-2 text-xs">
                            <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                              <strong className="text-[#6b1d2f]">0–3 sn (Kanca / Hook):</strong> {activePack.instagram.reels.hook0_3s}
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                              <strong className="text-slate-800">3–15 sn (Değer &amp; Hikaye):</strong> {activePack.instagram.reels.body3_15s}
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                              <strong className="text-emerald-700">15–25 sn (Harekete Geçirici):</strong> {activePack.instagram.reels.cta15_25s}
                            </div>
                            <div className="p-2.5 bg-amber-100/50 rounded-lg text-[11px] text-amber-950">
                              <strong>Görsel Çekim Yönergesi:</strong> {activePack.instagram.reels.visualDirection}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WHATSAPP TAB */}
                  {platformTab === "whatsapp" && (
                    <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs font-black text-emerald-900 uppercase">
                          WhatsApp Kanal / Durum &amp; Müşteri Duyurusu
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyText(activePack.whatsapp.broadcastText, "WhatsApp Metni")}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Kopyala
                          </button>
                          <a
                            href={activePack.whatsapp.waShareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp&apos;ta Paylaş
                          </a>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-5">
                          <VisualPreviewCard
                            packId={activePack.id}
                            format="wa-card"
                            title="WhatsApp Paylaşım Kartı"
                            sizeLabel="1080×1080"
                            aspectClass="aspect-square"
                          />
                        </div>
                        <div className="md:col-span-7 space-y-3">
                          <div className="p-4 bg-white rounded-xl border border-emerald-100 text-xs whitespace-pre-line text-slate-800 leading-relaxed">
                            {activePack.whatsapp.broadcastText}
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs">
                            <span className="text-[10px] font-black uppercase text-emerald-700 block mb-1">
                              Kısa Durum (Status) Metni
                            </span>
                            {activePack.whatsapp.statusCaption}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FACEBOOK TAB */}
                  {platformTab === "facebook" && (
                    <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs font-black text-blue-900 uppercase">
                          Facebook Sayfa Gönderisi (Etkileşim &amp; Link)
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              copyText(
                                `${activePack.facebook.postText}\n\n${activePack.facebook.questionForEngagement}\n\n${activePack.facebook.hashtags.join(" ")}`,
                                "Facebook Gönderisi"
                              )
                            }
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Kopyala
                          </button>
                          <button
                            onClick={() => handlePublish(activePack.id, "facebookPost")}
                            disabled={publishingKey === `${activePack.id}:facebookPost`}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            <Send className="w-3.5 h-3.5" /> Facebook&apos;ta Yayınla
                          </button>
                        </div>
                      </div>
                      <VisualPreviewCard
                        packId={activePack.id}
                        format="fb-post"
                        title="Facebook Paylaşım Görseli"
                        sizeLabel="1200×630"
                        aspectClass="aspect-[1200/630]"
                      />
                      <div className="p-4 bg-white rounded-xl border border-blue-100 text-xs whitespace-pre-line text-slate-800 leading-relaxed">
                        {activePack.facebook.postText}
                        {"\n\n"}
                        {activePack.facebook.questionForEngagement}
                      </div>
                      <div className="text-[11px] font-mono text-blue-700">
                        {activePack.facebook.hashtags.join(" ")}
                      </div>
                    </div>
                  )}

                  {/* YOUTUBE TAB */}
                  {platformTab === "youtube" && (
                    <div className="p-5 rounded-xl border border-red-200 bg-red-50/30 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs font-black text-red-900 uppercase">
                          YouTube Shorts — SEO Başlık, Açıklama, Senaryo &amp; Etiketler
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              copyText(
                                `BAŞLIK: ${activePack.youtube.shortsTitle}\n\nAÇIKLAMA:\n${activePack.youtube.seoDescription}\n\nSENARYO:\n${activePack.youtube.script0_30s}\n\nETİKETLER:\n${activePack.youtube.tags.join(", ")}`,
                                "YouTube Shorts Paketi"
                              )
                            }
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Tümünü Kopyala
                          </button>
                          <button
                            onClick={() => handlePublish(activePack.id, "youtube")}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Webhook&apos;a Gönder
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-4">
                          <VisualPreviewCard
                            packId={activePack.id}
                            format="yt-shorts"
                            title="YouTube Shorts Kapağı"
                            sizeLabel="1080×1920"
                            aspectClass="aspect-[9/16]"
                          />
                        </div>
                        <div className="md:col-span-8 space-y-3">
                          <div className="p-3 bg-white rounded-xl border border-red-100 text-xs">
                            <span className="text-[10px] font-black uppercase text-red-700 block mb-1">SEO Video Başlığı</span>
                            <span className="font-bold text-slate-900">{activePack.youtube.shortsTitle}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-red-100 text-xs whitespace-pre-line text-slate-700">
                            <span className="text-[10px] font-black uppercase text-red-700 block mb-1">30 Saniyelik Shorts Senaryosu</span>
                            {activePack.youtube.script0_30s}
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-red-100 text-xs whitespace-pre-line text-slate-700">
                            <span className="text-[10px] font-black uppercase text-red-700 block mb-1">SEO Açıklama</span>
                            {activePack.youtube.seoDescription}
                          </div>
                          <div className="text-[11px] font-mono text-slate-600">
                            <strong>Etiketler:</strong> {activePack.youtube.tags.join(", ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GOOGLE BUSINESS PROFILE TAB */}
                  {platformTab === "googleBusiness" && (
                    <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/30 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs font-black text-sky-900 uppercase">
                          Google İşletme Profili (Haritalar) — Yerel SEO Güncellemesi
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyText(activePack.googleBusiness.summary, "Google İşletme Metni")}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Kopyala
                          </button>
                          <button
                            onClick={() => handlePublish(activePack.id, "googleBusiness")}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Webhook&apos;a Gönder
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-5">
                          <VisualPreviewCard
                            packId={activePack.id}
                            format="gbp-post"
                            title="Google İşletme Kartı"
                            sizeLabel="1200×900"
                            aspectClass="aspect-[4/3]"
                          />
                        </div>
                        <div className="md:col-span-7 space-y-3">
                          <div className="p-4 bg-white rounded-xl border border-sky-100 text-xs text-slate-800 leading-relaxed">
                            {activePack.googleBusiness.summary}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>CTA Butonu:</strong> Sipariş Ver → <span className="font-mono text-sky-700">{activePack.googleBusiness.ctaUrl}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* SETTINGS VIEW */}
      {view === "settings" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <span className="text-xs font-bold text-slate-900">Sosyal Medya Motoru Aktif</span>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="w-4 h-4 accent-[#6b1d2f]"
              />
            </label>
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <span className="text-xs font-bold text-slate-900">Yeni Üründe Otomatik AI İçerik Üret</span>
              <input
                type="checkbox"
                checked={settings.autoGenerateOnNewProduct}
                onChange={(e) => setSettings({ ...settings, autoGenerateOnNewProduct: e.target.checked })}
                className="w-4 h-4 accent-[#6b1d2f]"
              />
            </label>
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <span className="text-xs font-bold text-slate-900">Bağlı Platformlarda Otomatik Paylaş</span>
              <input
                type="checkbox"
                checked={settings.autoPublishOnNewProduct}
                onChange={(e) => setSettings({ ...settings, autoPublishOnNewProduct: e.target.checked })}
                className="w-4 h-4 accent-[#6b1d2f]"
              />
            </label>
          </div>

          {/* Instagram & Facebook Meta Graph API */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-pink-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4" /> Instagram Business API (Post &amp; Hikaye)
                </h3>
                <input
                  type="checkbox"
                  checked={settings.instagram.enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, instagram: { ...settings.instagram, enabled: e.target.checked } })
                  }
                  className="w-4 h-4 accent-pink-600"
                />
              </div>
              <input
                type="text"
                value={settings.instagram.accountId}
                onChange={(e) =>
                  setSettings({ ...settings, instagram: { ...settings.instagram, accountId: e.target.value } })
                }
                placeholder="Instagram Business Account ID (örn: 178414...)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
              <input
                type="password"
                value={settings.instagram.accessToken}
                onChange={(e) =>
                  setSettings({ ...settings, instagram: { ...settings.instagram, accessToken: e.target.value } })
                }
                placeholder={
                  settings.instagram.hasAccessToken
                    ? "Access Token kayıtlı (değiştirmek için yenisini girin)"
                    : "Meta Page / Instagram Access Token"
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.instagram.publishPost}
                    onChange={(e) =>
                      setSettings({ ...settings, instagram: { ...settings.instagram, publishPost: e.target.checked } })
                    }
                  />
                  Otomatik Post
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.instagram.publishStory}
                    onChange={(e) =>
                      setSettings({ ...settings, instagram: { ...settings.instagram, publishStory: e.target.checked } })
                    }
                  />
                  Otomatik Hikaye
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> Facebook Sayfa API (Otomatik Gönderi)
                </h3>
                <input
                  type="checkbox"
                  checked={settings.facebook.enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, facebook: { ...settings.facebook, enabled: e.target.checked } })
                  }
                  className="w-4 h-4 accent-blue-600"
                />
              </div>
              <input
                type="text"
                value={settings.facebook.pageId}
                onChange={(e) =>
                  setSettings({ ...settings, facebook: { ...settings.facebook, pageId: e.target.value } })
                }
                placeholder="Facebook Page ID"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
              <input
                type="password"
                value={settings.facebook.pageAccessToken}
                onChange={(e) =>
                  setSettings({ ...settings, facebook: { ...settings.facebook, pageAccessToken: e.target.value } })
                }
                placeholder={
                  settings.facebook.hasPageAccessToken
                    ? "Page Access Token kayıtlı (değiştirmek için yenisini girin)"
                    : "Facebook Page Access Token"
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {/* WhatsApp + YouTube + Google Business + Universal Webhook */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 space-y-2.5">
              <h3 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> WhatsApp Otomatik Duyuru Numaraları
              </h3>
              <input
                type="text"
                value={settings.whatsapp.broadcastPhones}
                onChange={(e) =>
                  setSettings({ ...settings, whatsapp: { ...settings.whatsapp, broadcastPhones: e.target.value } })
                }
                placeholder="+90534..., +90544... (virgülle ayırın)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <h3 className="text-xs font-black text-slate-900">
                Evrensel Otomasyon Webhook (YouTube · Google İşletme · Make / n8n / Zapier)
              </h3>
              <input
                type="url"
                value={settings.universalWebhookUrl}
                onChange={(e) => setSettings({ ...settings, universalWebhookUrl: e.target.value })}
                placeholder="https://hook.eu2.make.com/... veya n8n webhook URL"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full py-3 bg-[#6b1d2f] hover:bg-[#531523] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sosyal Medya Otomasyon Ayarlarını Kaydet
          </button>
        </div>
      )}
    </div>
  );
}
