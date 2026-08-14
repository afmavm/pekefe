"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Network, Settings2, KeyRound, Activity, X, ToggleLeft, ToggleRight, AlertCircle, ExternalLink, Loader2, Wifi, Plus, Trash2 } from "lucide-react";
import { Integration, IntegrationLog } from "../types";
import { 
  saveIntegrationSettingsAction, 
  triggerChannelSyncAction, 
  retryFailedSyncAction,
  testIntegrationConnectionAction,
  getMarketplaceData,
  createIntegrationAction,
  deleteIntegrationAction
} from "../server/integrationActions";
import SyncMonitor from "./SyncMonitor";
import FailedSyncRetryQueue from "./FailedSyncRetryQueue";
import { toast } from "sonner";

interface MarketplaceDashboardProps {
  initialIntegrations: Integration[];
  initialLogs: IntegrationLog[];
}

export default function MarketplaceDashboard({
  initialIntegrations,
  initialLogs
}: MarketplaceDashboardProps) {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [logs, setLogs] = useState<IntegrationLog[]>(initialLogs);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Settings Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"api" | "automation">("api");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formSettings, setFormSettings] = useState<any>({
    apiKey: "", 
    secretKey: "", 
    sellerId: "", 
    merchantId: "", 
    apiSecret: "", 
    xmlUrl: "", 
    autoSync: true, 
    autoPriceSync: false
  });

  // Create Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormName, setAddFormName] = useState<string>("Trendyol");
  const [customName, setCustomName] = useState<string>("");
  const [addFormSettings, setAddFormSettings] = useState<any>({
    apiKey: "", secretKey: "", sellerId: "", merchantId: "", apiSecret: "", xmlUrl: "", autoSync: true, autoPriceSync: false
  });
  const [isAddingPending, setIsAddingPending] = useState(false);

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [isDeletingPending, setIsDeletingPending] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);

  // Ref to track known error log IDs for background alarm sound checks
  const knownErrorIdsRef = useRef<Set<string>>(new Set(initialLogs.filter(l => l.status === "err").map(l => l.id)));

  const reloadData = async () => {
    try {
      const data = await getMarketplaceData();
      setIntegrations(data.integrations);
      setLogs(data.logs);
      return data;
    } catch (error) {
      console.error("Failed to reload marketplace data:", error);
    }
  };

  const playErrorAlarmSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        
        // Premium low volume warning chime
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration - 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = ctx.currentTime;
      playTone(400, now, 0.25);
      playTone(320, now + 0.3, 0.35);
    } catch (e) {
      console.error("Failed to play warning chime:", e);
    }
  };

  // 15 seconds polling interval for live logs and connection statuses
  useEffect(() => {
    const interval = setInterval(async () => {
      const freshData = await reloadData();
      if (freshData && freshData.logs) {
        let hasNewError = false;
        freshData.logs.forEach((log: any) => {
          if (log.status === "err" && !knownErrorIdsRef.current.has(log.id)) {
            knownErrorIdsRef.current.add(log.id);
            hasNewError = true;
            
            const channel = freshData.integrations.find((i: any) => i.id === log.integrationId);
            toast.error(`Senkronizasyon Hatası (${channel?.name || 'Entegrasyon'}): ${log.message}`);
          }
        });
        
        if (hasNewError) {
          playErrorAlarmSound();
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSync = async (integration: Integration) => {
    setSyncingId(integration.id);
    const res = await triggerChannelSyncAction(integration.id, integration.name);
    setSyncingId(null);
    if (res.success) {
      toast.success(res.message);
      await reloadData();
      setExpandedLogId(integration.id);
    } else {
      toast.error(res.error || "Senkronizasyon hatası.");
      await reloadData();
    }
  };

  const handleRetry = async (logId: string) => {
    const res = await retryFailedSyncAction(logId);
    if (res.success) {
      toast.success(res.message);
      await reloadData();
    } else {
      toast.error(res.error || "Yeniden deneme başarısız.");
    }
  };

  const openSettings = (integration: Integration) => {
    setSelectedIntegration(integration);
    const s = integration.settings || {};
    setFormSettings({
      apiKey: s.apiKey || "",
      secretKey: s.secretKey || "",
      sellerId: s.sellerId || "",
      merchantId: s.merchantId || "",
      apiSecret: s.apiSecret || "",
      xmlUrl: s.xmlUrl || "",
      autoSync: s.autoSync !== false,
      autoPriceSync: s.autoPriceSync === true
    });
    setModalTab("api");
    setIsModalOpen(true);
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;
    setIsTesting(true);
    
    let settingsPayload: any = {
      autoSync: formSettings.autoSync
    };
    
    if (selectedIntegration.name === "Trendyol") {
      settingsPayload.apiKey = formSettings.apiKey;
      settingsPayload.secretKey = formSettings.secretKey;
      settingsPayload.sellerId = formSettings.sellerId;
    } else if (selectedIntegration.name === "Hepsiburada") {
      settingsPayload.apiKey = formSettings.apiKey;
      settingsPayload.merchantId = formSettings.merchantId;
    } else if (selectedIntegration.name === "N11") {
      settingsPayload.apiKey = formSettings.apiKey;
      settingsPayload.apiSecret = formSettings.apiSecret;
    } else if (selectedIntegration.name === "XML Tedarikçi") {
      settingsPayload.xmlUrl = formSettings.xmlUrl;
    }

    const res = await testIntegrationConnectionAction(selectedIntegration.id, selectedIntegration.name, settingsPayload);
    setIsTesting(false);
    
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error || "Bağlantı testi başarısız.");
    }
    await reloadData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;

    startTransition(async () => {
      let settingsPayload: any = {
        autoSync: formSettings.autoSync
      };
      
      if (selectedIntegration.name === "Trendyol") {
        settingsPayload.apiKey = formSettings.apiKey;
        settingsPayload.secretKey = formSettings.secretKey;
        settingsPayload.sellerId = formSettings.sellerId;
        settingsPayload.autoPriceSync = formSettings.autoPriceSync;
      } else if (selectedIntegration.name === "Hepsiburada") {
        settingsPayload.apiKey = formSettings.apiKey;
        settingsPayload.merchantId = formSettings.merchantId;
        settingsPayload.autoPriceSync = formSettings.autoPriceSync;
      } else if (selectedIntegration.name === "N11") {
        settingsPayload.apiKey = formSettings.apiKey;
        settingsPayload.apiSecret = formSettings.apiSecret;
        settingsPayload.autoPriceSync = formSettings.autoPriceSync;
      } else if (selectedIntegration.name === "XML Tedarikçi") {
        settingsPayload.xmlUrl = formSettings.xmlUrl;
      }

      const isApiKeyProvided = selectedIntegration.name === "XML Tedarikçi" ? settingsPayload.xmlUrl : settingsPayload.apiKey;
      const status = isApiKeyProvided ? "ACTIVE" : "INACTIVE";

      const res = await saveIntegrationSettingsAction(selectedIntegration.id, settingsPayload, status);
      if (res.success) {
        toast.success(res.message);
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === selectedIntegration.id
              ? { ...i, settings: settingsPayload, status }
              : i
          )
        );
        setIsModalOpen(false);
        await reloadData();
      } else {
        toast.error(res.error || "Ayarlar kaydedilemedi.");
      }
    });
  };

  const handleOpenAddModal = () => {
    setAddFormName("Trendyol");
    setCustomName("");
    setAddFormSettings({
      apiKey: "", secretKey: "", sellerId: "", merchantId: "", apiSecret: "", xmlUrl: "", autoSync: true, autoPriceSync: false
    });
    setIsAddModalOpen(true);
  };

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPending(true);

    const name = addFormName === "Diğer" ? customName.trim() : addFormName;
    if (!name) {
      toast.error("Lütfen bir entegrasyon ismi girin.");
      setIsAddingPending(false);
      return;
    }

    let logo = "/images/custom.svg";
    if (name === "Trendyol") logo = "/images/trendyol.svg";
    else if (name === "Hepsiburada") logo = "/images/hepsiburada.svg";
    else if (name === "N11") logo = "/images/n11.svg";
    else if (name === "XML Tedarikçi") logo = "/images/xml.svg";

    const type = name === "XML Tedarikçi" ? "XML" : "MARKETPLACE";

    let settingsPayload: any = {
      autoSync: addFormSettings.autoSync
    };
    
    if (name === "Trendyol") {
      settingsPayload.apiKey = addFormSettings.apiKey;
      settingsPayload.secretKey = addFormSettings.secretKey;
      settingsPayload.sellerId = addFormSettings.sellerId;
      settingsPayload.autoPriceSync = addFormSettings.autoPriceSync;
    } else if (name === "Hepsiburada") {
      settingsPayload.apiKey = addFormSettings.apiKey;
      settingsPayload.merchantId = addFormSettings.merchantId;
      settingsPayload.autoPriceSync = addFormSettings.autoPriceSync;
    } else if (name === "N11") {
      settingsPayload.apiKey = addFormSettings.apiKey;
      settingsPayload.apiSecret = addFormSettings.apiSecret;
      settingsPayload.autoPriceSync = addFormSettings.autoPriceSync;
    } else if (name === "XML Tedarikçi") {
      settingsPayload.xmlUrl = addFormSettings.xmlUrl;
    } else {
      settingsPayload.apiKey = addFormSettings.apiKey;
      settingsPayload.secretKey = addFormSettings.secretKey;
      settingsPayload.sellerId = addFormSettings.sellerId;
    }

    const res = await createIntegrationAction(name, type, logo, settingsPayload);
    setIsAddingPending(false);

    if (res.success) {
      toast.success(res.message);
      setIsAddModalOpen(false);
      await reloadData();
    } else {
      toast.error(res.error || "Entegrasyon eklenirken bir hata oluştu.");
    }
  };

  const handleDeleteTrigger = (id: string, name: string) => {
    setDeletingId(id);
    setDeletingName(name);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeletingPending(true);

    const res = await deleteIntegrationAction(deletingId);
    setIsDeletingPending(false);

    if (res.success) {
      toast.success(res.message);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setDeletingName(null);
      await reloadData();
    } else {
      toast.error(res.error || "Entegrasyon silinemedi.");
    }
  };

  const handleToggleLogs = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const activeCount = integrations.filter((i) => i.status === "ACTIVE").length;
  const errorCount = logs.filter((log) => log.status === "err").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Network className="w-6 h-6 text-[#b45309]" /> Entegrasyon & API Servisleri Merkezi
          </h1>
          <p className="text-slate-500 mt-1 text-xs font-medium">
            Trendyol, Hepsiburada, N11 pazaryerleri ve harici tedarikçi kanallarının canlı senkronizasyonunu yönetin.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="py-2.5 px-4 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Yeni Entegrasyon Ekle
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Toplam Kanal</p>
          <p className="text-3xl font-black text-slate-900">{integrations.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Aktif Bağlantı</p>
          <p className="text-3xl font-black text-emerald-600">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Hata Kuyruğu</p>
          <p className="text-3xl font-black text-blue-600">{errorCount}</p>
        </div>
        <div className="bg-[#b45309] rounded-2xl p-5 shadow-sm text-white">
          <p className="text-[10px] font-semibold text-amber-100 uppercase tracking-wider mb-1">Pasif Kanallar</p>
          <p className="text-3xl font-black">{integrations.length - activeCount}</p>
        </div>
      </div>

      {/* Sync Monitor Grid */}
      <SyncMonitor
        integrations={integrations}
        syncingId={syncingId}
        onSync={handleSync}
        onOpenSettings={openSettings}
        onToggleLogs={handleToggleLogs}
        expandedLogId={expandedLogId}
        logs={logs}
        onDeleteTrigger={handleDeleteTrigger}
      />

      {/* Failed Retry Queue Table */}
      <FailedSyncRetryQueue
        logs={logs}
        integrations={integrations}
        onRetry={handleRetry}
      />

      {/* Add Integration Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-widest">Yeni Entegrasyon Ekle</h3>
                  <p className="text-slate-400 text-[10px] font-medium">Yeni entegrasyon kanalı oluşturun</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIntegration} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kanal Seçin</label>
                  <select
                    value={addFormName}
                    onChange={(e) => setAddFormName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                  >
                    <option value="Trendyol">Trendyol</option>
                    <option value="Hepsiburada">Hepsiburada</option>
                    <option value="N11">N11</option>
                    <option value="XML Tedarikçi">XML Tedarikçi</option>
                    <option value="Diğer">Diğer (Özel Entegrasyon)</option>
                  </select>
                </div>

                {addFormName === "Diğer" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Entegrasyon İsmi (Custom Name)</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Örn: Amazon TR"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                      required
                    />
                  </div>
                )}

                {/* Dynamic fields mapping for creation form */}
                {(addFormName === "Trendyol" || addFormName === "Diğer") && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Satıcı ID (Seller ID)</label>
                      <input
                        type="text"
                        value={addFormSettings.sellerId}
                        onChange={(e) => setAddFormSettings({ ...addFormSettings, sellerId: e.target.value })}
                        placeholder="Örn: 123456"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">API Key (API Anahtarı)</label>
                      <input
                        type="text"
                        value={addFormSettings.apiKey}
                        onChange={(e) => setAddFormSettings({ ...addFormSettings, apiKey: e.target.value })}
                        placeholder="API Anahtarınızı girin"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Key (Gizli Anahtar)</label>
                      <input
                        type="password"
                        value={addFormSettings.secretKey}
                        onChange={(e) => setAddFormSettings({ ...addFormSettings, secretKey: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                        required
                      />
                    </div>
                  </>
                )}

                {addFormName === "Hepsiburada" && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant ID (Tüccar ID)</label>
                      <input
                        type="text"
                        value={addFormSettings.merchantId}
                        onChange={(e) => setAddFormSettings({ ...addFormSettings, merchantId: e.target.value })}
                        placeholder="Örn: merchant-12345"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">API Key (API Anahtarı)</label>
                      <input
                        type="text"
                        value={addFormSettings.apiKey}
                        onChange={(e) => setAddFormSettings({ ...addFormSettings, apiKey: e.target.value })}
                        placeholder="Hepsiburada API Key girin"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                        required
                      />
                    </div>
                  </>
                )}

                {addFormName === "N11" && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">AppKey (API Anahtarı)</label>
                      <input
                        type="text"
                        value={addFormSettings.apiKey}
                        onChange={(e) => setAddFormSettings({ ...addFormSettings, apiKey: e.target.value })}
                        placeholder="N11 AppKey girin"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">AppSecret (API Şifresi)</label>
                      <input
                        type="password"
                        value={addFormSettings.apiSecret}
                        onChange={(e) => setAddFormSettings({ ...addFormSettings, apiSecret: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                        required
                      />
                    </div>
                  </>
                )}

                {addFormName === "XML Tedarikçi" && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">XML Besleme URL'si (XML Feed URL)</label>
                      <input
                        type="url"
                        value={addFormSettings.xmlUrl}
                        onChange={(e) => setAddFormSettings({ ...addFormSettings, xmlUrl: e.target.value })}
                        placeholder="https://example.com/feed.xml"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-xs"
                >
                  İptal Et
                </button>
                <button
                  type="submit"
                  disabled={isAddingPending}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-100"
                >
                  {isAddingPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isAddingPending ? "Ekleniyor..." : "Kanalı Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isModalOpen && selectedIntegration && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-[#f97316]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-widest">{selectedIntegration.name} Entegrasyon Ayarları</h3>
                  <p className="text-slate-400 text-[10px] font-medium">{selectedIntegration.type} Kanal Bağlantısı</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50">
              {[
                { id: "api", label: "API Anahtarları", icon: KeyRound },
                { id: "automation", label: "Senkronizasyon Otomasyonu", icon: Activity },
              ].map((tab: any) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-semibold uppercase tracking-wider transition border-b-2 ${
                    modalTab === tab.id
                      ? "border-orange-500 text-orange-500 bg-white"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
              {modalTab === "api" && (
                <div className="space-y-4">
                  {selectedIntegration.name === "Trendyol" && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Satıcı ID (Seller ID)</label>
                        <input
                          type="text"
                          value={formSettings.sellerId}
                          onChange={(e) => setFormSettings({ ...formSettings, sellerId: e.target.value })}
                          placeholder="Örn: 123456"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">API Key (API Anahtarı)</label>
                        <input
                          type="text"
                          value={formSettings.apiKey}
                          onChange={(e) => setFormSettings({ ...formSettings, apiKey: e.target.value })}
                          placeholder="Trendyol API Anahtarınızı girin"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Key (Gizli Anahtar)</label>
                        <input
                          type="password"
                          value={formSettings.secretKey}
                          onChange={(e) => setFormSettings({ ...formSettings, secretKey: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                          required
                        />
                      </div>
                    </>
                  )}

                  {selectedIntegration.name === "Hepsiburada" && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant ID (Tüccar ID)</label>
                        <input
                          type="text"
                          value={formSettings.merchantId}
                          onChange={(e) => setFormSettings({ ...formSettings, merchantId: e.target.value })}
                          placeholder="Örn: merchant-12345"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">API Key (API Anahtarı)</label>
                        <input
                          type="text"
                          value={formSettings.apiKey}
                          onChange={(e) => setFormSettings({ ...formSettings, apiKey: e.target.value })}
                          placeholder="Hepsiburada API Key girin"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                          required
                        />
                      </div>
                    </>
                  )}

                  {selectedIntegration.name === "N11" && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">AppKey (API Anahtarı)</label>
                        <input
                          type="text"
                          value={formSettings.apiKey}
                          onChange={(e) => setFormSettings({ ...formSettings, apiKey: e.target.value })}
                          placeholder="N11 AppKey girin"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">AppSecret (API Şifresi)</label>
                        <input
                          type="password"
                          value={formSettings.apiSecret}
                          onChange={(e) => setFormSettings({ ...formSettings, apiSecret: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                          required
                        />
                      </div>
                    </>
                  )}

                  {selectedIntegration.name === "XML Tedarikçi" && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">XML Besleme URL'si (XML Feed URL)</label>
                        <input
                          type="url"
                          value={formSettings.xmlUrl}
                          onChange={(e) => setFormSettings({ ...formSettings, xmlUrl: e.target.value })}
                          placeholder="https://example.com/feed.xml"
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 focus:bg-white transition"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {modalTab === "automation" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">Otomatik Stok Güncelleme</p>
                      <p className="text-xs text-slate-500 mt-0.5">NexaB2B stok değişiklikleri anlık olarak pazaryerine gönderilir.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormSettings({ ...formSettings, autoSync: !formSettings.autoSync })}
                      className="text-slate-400 font-bold"
                    >
                      {formSettings.autoSync ? (
                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-350" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">Otomatik Fiyat Senkronizasyonu</p>
                      <p className="text-xs text-slate-500 mt-0.5">Ürün liste fiyatı değiştiğinde pazaryeri fiyatı güncellenir.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormSettings({ ...formSettings, autoPriceSync: !formSettings.autoPriceSync })}
                      className="text-slate-400 font-bold"
                    >
                      {formSettings.autoPriceSync ? (
                        <ToggleRight className="w-8 h-8 text-[#f97316]" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-350" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 bg-orange-50 border border-orange-100 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-orange-600 font-bold leading-normal">
                      Fiyat Otomatik Eşitleme aktif olduğunda, pazaryeri panelinde yaptığınız manuel fiyat değişiklikleri ezilebilir.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isPending || isTesting}
                  onClick={handleTestConnection}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 transition border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <Wifi className="w-4 h-4 text-slate-500" />
                  )}
                  {isTesting ? "Test Ediliyor" : "Bağlantıyı Test Et"}
                </button>
                <button
                  type="submit"
                  disabled={isPending || isTesting}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-100"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  {isPending ? "Kaydediliyor..." : "Ayarları Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-650 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="w-6 h-6 text-red-650" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">Kanalı Silmek İstiyor musunuz?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              <strong>{deletingName}</strong> entegrasyon kanalını ve buna bağlı tüm senkronizasyon günlüklerini kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeletingPending}
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 border border-slate-250 hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
              >
                İptal Et
              </button>
              <button
                type="button"
                disabled={isDeletingPending}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-red-200 flex justify-center items-center gap-1.5"
              >
                {isDeletingPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                {isDeletingPending ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
