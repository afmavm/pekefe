"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  RefreshCw,
  Settings,
  Unlink,
  UploadCloud,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface PublicBloggerConfig {
  enabled: boolean;
  autoSync: boolean;
  syncDelete: boolean;
  appendBacklink: boolean;
  clientId: string;
  hasClientSecret: boolean;
  blogId: string;
  blogName: string;
  blogUrl: string;
  isConnected: boolean;
  connectedAt: string | null;
  lastSync: string | null;
  availableBlogs: Array<{ id: string; name: string; url: string }>;
  syncedCount: number;
  redirectUri: string;
}

interface Props {
  onSynced?: () => void;
  onConfigLoaded?: (config: PublicBloggerConfig | null) => void;
}

export default function BloggerIntegrationPanel({ onSynced, onConfigLoaded }: Props) {
  const [config, setConfig] = useState<PublicBloggerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [refreshingBlogs, setRefreshingBlogs] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  // Form fields
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [blogId, setBlogId] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [syncDelete, setSyncDelete] = useState(false);
  const [appendBacklink, setAppendBacklink] = useState(true);

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/integrations/blogger", { cache: "no-store" });
      if (!res.ok) return;
      const data: PublicBloggerConfig = await res.json();
      setConfig(data);
      onConfigLoaded?.(data);
      setClientId(data.clientId || "");
      setBlogId(data.blogId || "");
      setBlogUrl(data.blogUrl || "");
      setEnabled(Boolean(data.enabled));
      setAutoSync(Boolean(data.autoSync));
      setSyncDelete(Boolean(data.syncDelete));
      setAppendBacklink(data.appendBacklink !== false);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();

    // Handle OAuth callback query params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("blogger");
      const reason = params.get("reason");
      if (status === "connected") {
        toast.success("Google Blogger hesabı başarıyla bağlandı! Artık blog yazılarınız otomatik senkronize edilecek.");
        setModalOpen(true);
        window.history.replaceState({}, "", "/admin/blog");
      } else if (status === "error") {
        toast.error(`Google Blogger bağlantısı başarısız: ${reason || "Bilinmeyen hata"}`);
        setModalOpen(true);
        window.history.replaceState({}, "", "/admin/blog");
      }
    }
  }, []);

  const handleSave = async (connectAfter = false) => {
    if (connectAfter && (!clientId.trim() || (!clientSecret.trim() && !config?.hasClientSecret))) {
      toast.error("Önce Google Client ID ve Client Secret bilgilerini girin.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/integrations/blogger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          clientId,
          clientSecret: clientSecret || undefined,
          blogId,
          blogUrl,
          enabled,
          autoSync,
          syncDelete,
          appendBacklink,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ayarlar kaydedilemedi.");
        return;
      }
      setConfig(data.config);
      onConfigLoaded?.(data.config);
      setClientSecret("");

      if (connectAfter) {
        window.location.href = "/api/integrations/blogger/auth";
        return;
      }

      toast.success("Google Blogger ayarları kaydedildi.");
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Google Blogger bağlantısını kesmek istediğinize emin misiniz?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/blogger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data.config);
        onConfigLoaded?.(data.config);
        toast.success("Google Blogger bağlantısı kesildi.");
      }
    } catch {
      toast.error("Bağlantı kesilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshBlogs = async () => {
    setRefreshingBlogs(true);
    try {
      const res = await fetch("/api/integrations/blogger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh-blogs" }),
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setConfig(data.config);
        onConfigLoaded?.(data.config);
        setBlogId(data.config.blogId || "");
        setBlogUrl(data.config.blogUrl || "");
        toast.success(`${data.blogs?.length || 0} Google Blogger sayfası bulundu.`);
      } else {
        toast.error(data.error || "Blog listesi alınamadı.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setRefreshingBlogs(false);
    }
  };

  const handleBulkSync = async () => {
    if (!config?.isConnected || !config?.blogId) {
      setModalOpen(true);
      toast.info("Önce Google Blogger hesabınızı bağlayıp hedef blogu seçin.");
      return;
    }

    setBulkSyncing(true);
    const t = toast.loading("Tüm aktif blog yazıları Google Blogger'a senkronize ediliyor...");
    try {
      const res = await fetch("/api/integrations/blogger/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      toast.dismiss(t);
      if (res.ok) {
        if (data.config) {
          setConfig(data.config);
          onConfigLoaded?.(data.config);
        }
        toast.success(
          `Blogger senkronizasyonu tamamlandı: ${data.successCount}/${data.total} yazı başarıyla güncellendi.`
        );
        onSynced?.();
      } else {
        toast.error(data.error || "Toplu senkronizasyon başarısız.");
      }
    } catch {
      toast.dismiss(t);
      toast.error("Bağlantı hatası.");
    } finally {
      setBulkSyncing(false);
    }
  };

  const copyRedirectUri = () => {
    const uri = config?.redirectUri || "https://www.pekefe.com/api/integrations/blogger/callback";
    navigator.clipboard.writeText(uri);
    setCopiedUri(true);
    toast.success("Callback URL kopyalandı.");
    setTimeout(() => setCopiedUri(false), 2000);
  };

  if (loading) return null;

  const isConnectedAndReady = Boolean(config?.isConnected && config?.blogId);

  return (
    <>
      {/* Compact Status Banner */}
      <div
        className={`rounded-2xl border p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
          isConnectedAndReady && config?.enabled
            ? "bg-gradient-to-r from-orange-50 via-amber-50/60 to-white border-orange-200"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-lg shadow-sm ${
              isConnectedAndReady
                ? "bg-[#f97316] text-white"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            B
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-slate-900">
                Google Blogger Otomatik Senkronizasyon
              </h2>
              {isConnectedAndReady ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {config?.enabled && config?.autoSync ? "Otomatik Aktif" : "Bağlı (Manuel)"}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Kurulum Bekliyor
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isConnectedAndReady ? (
                <>
                  Bağlı Blog:{" "}
                  <a
                    href={config?.blogUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-orange-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    {config?.blogName || config?.blogUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {" · "}
                  <span className="font-semibold text-slate-700">
                    {config?.syncedCount || 0} yazı eşleştirildi
                  </span>
                </>
              ) : (
                "PEKEFE'ye eklediğiniz veya güncellediğiniz her blog yazısı otomatik olarak Google Blogger sayfanızda da yayınlansın."
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          {isConnectedAndReady && (
            <button
              onClick={handleBulkSync}
              disabled={bulkSyncing}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {bulkSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              Tümünü Blogger&apos;a Gönder
            </button>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            {isConnectedAndReady ? "Blogger Ayarları" : "Blogger'a Bağla"}
          </button>
        </div>
      </div>

      {/* Settings & OAuth Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black">
                  B
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Google Blogger Entegrasyonu
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Blogger API v3 · Çift yönlü zaman tasarrufu & SEO backlink
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Quick Setup Instructions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-600">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  1 Dakikada Google Cloud Kurulumu
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>
                    <strong>console.cloud.google.com</strong> adresinden projenizde{" "}
                    <strong>Blogger API v3</strong> servisini etkinleştirin.
                  </li>
                  <li>
                    <strong>APIs &amp; Services → Credentials → OAuth 2.0 Client ID (Web application)</strong>{" "}
                    oluşturun ve aşağıdaki <em>Yetkili Yönlendirme URI</em> adresini ekleyin:
                  </li>
                </ol>
                <div className="flex items-center gap-2 pt-1">
                  <code className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 truncate">
                    {config?.redirectUri || "https://www.pekefe.com/api/integrations/blogger/callback"}
                  </code>
                  <button
                    type="button"
                    onClick={copyRedirectUri}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedUri ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUri ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>
              </div>

              {/* OAuth Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Client ID
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="xxxx.apps.googleusercontent.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Client Secret{" "}
                    {config?.hasClientSecret && (
                      <span className="text-emerald-600 font-semibold">(Kayıtlı)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={
                      config?.hasClientSecret
                        ? "Değiştirmek için yeni secret girin..."
                        : "GOCSPX-..."
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Connect / Disconnect Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-orange-200 bg-orange-50/50">
                <div className="text-xs">
                  {config?.isConnected ? (
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Google hesabı yetkilendirildi
                    </span>
                  ) : (
                    <span className="font-bold text-slate-700">
                      Bilgileri girdikten sonra Google hesabınızı yetkilendirin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {config?.isConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={saving}
                      className="px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Unlink className="w-3.5 h-3.5" /> Bağlantıyı Kes
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {config?.isConnected ? "Google Yetkisini Yenile" : "Google ile Bağlan"}
                  </button>
                </div>
              </div>

              {/* Target Blog Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-orange-600" /> Hedef Google Blogger Sayfası
                  </label>
                  {config?.isConnected && (
                    <button
                      type="button"
                      onClick={handleRefreshBlogs}
                      disabled={refreshingBlogs}
                      className="text-[11px] font-bold text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshingBlogs ? "animate-spin" : ""}`} />
                      Blogları Yenile
                    </button>
                  )}
                </div>

                {config?.availableBlogs && config.availableBlogs.length > 0 ? (
                  <select
                    value={blogId}
                    onChange={(e) => {
                      setBlogId(e.target.value);
                      const found = config.availableBlogs.find((b) => b.id === e.target.value);
                      if (found) setBlogUrl(found.url);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Blog Seçin --</option>
                    {config.availableBlogs.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.url})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={blogUrl}
                      onChange={(e) => setBlogUrl(e.target.value)}
                      placeholder="https://pekefe.blogspot.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={blogId}
                      onChange={(e) => setBlogId(e.target.value)}
                      placeholder="Blog ID (bağlanınca otomatik dolar)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              {/* Sync Behavior Toggles */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Otomatik Ekleme &amp; Güncelleme
                    </div>
                    <div className="text-[11px] text-slate-500">
                      PEKEFE&apos;de yeni yazı eklendiğinde veya düzenlendiğinde Blogger&apos;da anında güncellenir.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled && autoSync}
                    onChange={(e) => {
                      setEnabled(e.target.checked);
                      setAutoSync(e.target.checked);
                    }}
                    className="w-4 h-4 accent-orange-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      PEKEFE Kaynak Linki (SEO Backlink) Ekle
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Blogger yazısının altına orijinal www.pekefe.com/blog/... bağlantısını otomatik ekler.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appendBacklink}
                    onChange={(e) => setAppendBacklink(e.target.checked)}
                    className="w-4 h-4 accent-orange-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Silinen Yazıları Blogger&apos;dan da Sil
                    </div>
                    <div className="text-[11px] text-slate-500">
                      PEKEFE&apos;den bir blog silindiğinde Blogger kopyasını da kaldırır.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={syncDelete}
                    onChange={(e) => setSyncDelete(e.target.checked)}
                    className="w-4 h-4 accent-orange-600"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-5 py-2 bg-[#b45309] hover:bg-amber-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Ayarları Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
