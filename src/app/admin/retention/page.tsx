"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Clock,
  Copy,
  History,
  Loader2,
  Mail,
  MessageCircle,
  Play,
  RefreshCw,
  Repeat,
  Save,
  Send,
  Settings,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

type TabKey = "abandoned" | "reorder" | "settings" | "logs";

export default function AdminRetentionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("abandoned");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copiedCron, setCopiedCron] = useState(false);

  // Settings form state
  const [settings, setSettings] = useState({
    enabled: true,
    abandonedCartEnabled: true,
    abandonedCartDelayMinutes: 60,
    abandonedCartCouponCode: "SEPET5",
    abandonedCartDiscountText: "%5 Sepet Hatırlatma İndirimi",
    reorderEnabled: true,
    reorderDelayDays: 28,
    reorderMaxAgeDays: 90,
    reorderCouponCode: "TEKRAR10",
    reorderDiscountText: "%10 Sadakat İndirimi",
    channels: { email: true, whatsapp: true },
  });

  // Test email state
  const [testEmail, setTestEmail] = useState("");
  const [testType, setTestType] = useState<"abandoned_cart" | "reorder">("abandoned_cart");
  const [sendingTest, setSendingTest] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/retention", { cache: "no-store" });
      if (!res.ok) throw new Error("Veriler alınamadı");
      const json = await res.json();
      setData(json);
      if (json.settings) {
        setSettings({
          enabled: Boolean(json.settings.enabled),
          abandonedCartEnabled: Boolean(json.settings.abandonedCartEnabled),
          abandonedCartDelayMinutes: Number(json.settings.abandonedCartDelayMinutes || 60),
          abandonedCartCouponCode: json.settings.abandonedCartCouponCode || "",
          abandonedCartDiscountText: json.settings.abandonedCartDiscountText || "",
          reorderEnabled: Boolean(json.settings.reorderEnabled),
          reorderDelayDays: Number(json.settings.reorderDelayDays || 28),
          reorderMaxAgeDays: Number(json.settings.reorderMaxAgeDays || 90),
          reorderCouponCode: json.settings.reorderCouponCode || "",
          reorderDiscountText: json.settings.reorderDiscountText || "",
          channels: {
            email: json.settings.channels?.email !== false,
            whatsapp: json.settings.channels?.whatsapp !== false,
          },
        });
      }
    } catch {
      toast.error("Retention verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", ...settings }),
      });
      if (res.ok) {
        toast.success("Otomatik Müşteri Tutma ayarları kaydedildi.");
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

  const handleRunNow = async () => {
    setRunning(true);
    const t = toast.loading("Retention otomasyon döngüsü çalıştırılıyor...");
    try {
      const res = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-now" }),
      });
      const json = await res.json();
      toast.dismiss(t);
      if (res.ok && json.success) {
        const r = json.result;
        toast.success(
          `Tamamlandı! Terk edilen sepet: ${r.abandonedSent}/${r.abandonedProcessed} · Tekrar sipariş: ${r.reorderSent}/${r.reorderProcessed}`
        );
        loadData();
      } else {
        toast.error(json.error || "Döngü çalıştırılamadı.");
      }
    } catch {
      toast.dismiss(t);
      toast.error("Bağlantı hatası.");
    } finally {
      setRunning(false);
    }
  };

  const handleSendAbandoned = async (cartId: string) => {
    setSendingId(cartId);
    try {
      const res = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-abandoned", cartId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          `Hatırlatma gönderildi (${json.emailOk ? "E-posta ✓" : ""} ${json.whatsappOk ? "WhatsApp ✓" : ""})`
        );
        loadData();
      } else {
        toast.error(json.error || "Gönderim başarısız.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setSendingId(null);
    }
  };

  const handleSendReorder = async (orderId: string) => {
    setSendingId(orderId);
    try {
      const res = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-reorder", orderId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tekrar sipariş hatırlatması gönderildi!");
        loadData();
      } else {
        toast.error(json.error || "Gönderim başarısız.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteCart = async (cartId: string) => {
    try {
      await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-cart", cartId }),
      });
      toast.success("Kayıt silindi.");
      loadData();
    } catch {}
  };

  const handleSendTest = async () => {
    if (!testEmail.includes("@")) {
      toast.error("Geçerli bir e-posta adresi girin.");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-test", email: testEmail, templateType: testType }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Test e-postası ${testEmail} adresine gönderildi!`);
      } else {
        toast.error(json.error || "Test e-postası gönderilemedi.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setSendingTest(false);
    }
  };

  const copyCronCommand = () => {
    const cmd = `*/30 * * * * curl -s "${data?.settings?.cronUrl || ""}" > /dev/null 2>&1`;
    navigator.clipboard.writeText(cmd);
    setCopiedCron(true);
    toast.success("cPanel Cron komutu kopyalandı.");
    setTimeout(() => setCopiedCron(false), 2000);
  };

  const kpis = data?.kpis || {
    activeAbandoned: 0,
    totalAbandoned: 0,
    remindedCount: 0,
    recoveredCount: 0,
    recoveredRevenue: 0,
    pendingReorders: 0,
    sentReorders: 0,
  };

  const formatMoney = (v: number) =>
    `₺${Number(v || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#6b1d2f]" />
            Otomatik Müşteri Tutma (Retention Engine)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Terk edilen sepet kurtarma &amp; 25–30. gün tekrar sipariş e-posta / WhatsApp otomasyonu
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="px-4 py-2.5 bg-[#6b1d2f] hover:bg-[#531523] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Otomasyonu Şimdi Çalıştır
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Aktif Terk Edilen Sepet</span>
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{kpis.activeAbandoned}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Toplam {kpis.totalAbandoned} kayıt · {kpis.remindedCount} hatırlatıldı
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
            <span>Kurtarılan Ciro</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-2">
            {formatMoney(kpis.recoveredRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            {kpis.recoveredCount} sepet satışa döndü
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Tekrar Sipariş Adayı</span>
            <Repeat className="w-4 h-4 text-[#6b1d2f]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{kpis.pendingReorders}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {settings.reorderDelayDays}+ gün önceki siparişler · {kpis.sentReorders} gönderildi
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Son Otomasyon Çalışması</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-black text-slate-900 mt-2.5">
            {data?.settings?.lastCronRun
              ? new Date(data.settings.lastCronRun).toLocaleString("tr-TR")
              : "Henüz çalışmadı"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Durum: {settings.enabled ? "Aktif ✅" : "Duraklatıldı"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "abandoned", label: `Terk Edilen Sepetler (${data?.abandonedCarts?.length || 0})`, icon: ShoppingCart },
          { key: "reorder", label: `Tekrar Sipariş Adayları (${data?.reorderCandidates?.length || 0})`, icon: Repeat },
          { key: "settings", label: "Otomasyon & Cron Ayarları", icon: Settings },
          { key: "logs", label: `Gönderim Geçmişi (${data?.logs?.length || 0})`, icon: History },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabKey)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === t.key
                  ? "bg-[#6b1d2f] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ABANDONED CARTS */}
      {activeTab === "abandoned" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {!data?.abandonedCarts?.length ? (
            <div className="p-12 text-center space-y-2">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Henüz yakalanan terk edilmiş sepet yok.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Müşteriler ödeme ekranında e-posta veya telefon bilgisi girip siparişi tamamlamadan çıktığında otomatik olarak burada listelenir ve {settings.abandonedCartDelayMinutes} dk sonra hatırlatma gönderilir.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Müşteri</th>
                    <th className="py-3 px-4">Sepet İçeriği</th>
                    <th className="py-3 px-4">Tutar</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.abandonedCarts.map((cart: any) => (
                    <tr key={cart.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cart.customerName}</div>
                        <div className="text-[11px] text-slate-500">{cart.email || "—"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{cart.phone || ""}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        {(cart.items || []).slice(0, 3).map((i: any, idx: number) => (
                          <div key={idx} className="text-[11px] text-slate-700 truncate">
                            • {i.name} × {i.quantity}
                          </div>
                        ))}
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(cart.updatedAt).toLocaleString("tr-TR")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#6b1d2f] font-mono">
                        {formatMoney(cart.subtotal)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            cart.status === "recovered"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : cart.status === "reminded"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {cart.status === "recovered"
                            ? "Kurtarıldı ✓"
                            : cart.status === "reminded"
                              ? `Hatırlatıldı (${cart.reminderCount})`
                              : "Bekliyor"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {cart.status !== "recovered" && (
                            <button
                              onClick={() => handleSendAbandoned(cart.id)}
                              disabled={sendingId === cart.id}
                              className="px-2.5 py-1.5 bg-[#6b1d2f] hover:bg-[#531523] text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {sendingId === cart.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Gönder
                            </button>
                          )}
                          {cart.whatsappWebUrl && (
                            <a
                              href={cart.whatsappWebUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                              title="WhatsApp Web ile tek tıkla gönder"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WA
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteCart(cart.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REORDER CANDIDATES */}
      {activeTab === "reorder" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {!data?.reorderCandidates?.length ? (
            <div className="p-12 text-center space-y-2">
              <Repeat className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                Şu an {settings.reorderDelayDays}–{settings.reorderMaxAgeDays} gün aralığında tekrar sipariş adayı bulunmuyor.
              </p>
              <p className="text-xs text-slate-500">
                Tamamlanan siparişleriniz {settings.reorderDelayDays} günü doldurduğunda müşteriler otomatik olarak burada listelenir ve hatırlatma alır.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Müşteri</th>
                    <th className="py-3 px-4">Son Sipariş</th>
                    <th className="py-3 px-4">Geçen Süre</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.reorderCandidates.map((cand: any) => (
                    <tr key={cand.orderId} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cand.customerName}</div>
                        <div className="text-[11px] text-slate-500">{cand.email || "—"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{cand.phone || ""}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-mono text-[11px] font-bold text-slate-700">
                          #{cand.orderNumber} · {formatMoney(cand.total)}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{cand.itemsSummary}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#6b1d2f]">{cand.daysAgo} gün önce</td>
                      <td className="py-3.5 px-4">
                        {cand.alreadySent ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Gönderildi ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Gönderime Hazır
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendReorder(cand.orderId)}
                            disabled={sendingId === cand.orderId}
                            className="px-2.5 py-1.5 bg-[#6b1d2f] hover:bg-[#531523] text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {sendingId === cand.orderId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            {cand.alreadySent ? "Tekrar Gönder" : "Hatırlat"}
                          </button>
                          {cand.whatsappWebUrl && (
                            <a
                              href={cand.whatsappWebUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WA
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SETTINGS & CRON */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-slate-900">Otomasyon Kuralları</h2>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">Retention Motorunu Aktifleştir</div>
                <div className="text-[11px] text-slate-500">Tüm otomatik sepet kurtarma ve tekrar sipariş akışlarını yönetir.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="w-4 h-4 accent-[#6b1d2f]"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#6b1d2f]" /> E-Posta (SMTP)
                </span>
                <input
                  type="checkbox"
                  checked={settings.channels.email}
                  onChange={(e) =>
                    setSettings({ ...settings, channels: { ...settings.channels, email: e.target.checked } })
                  }
                  className="w-4 h-4 accent-[#6b1d2f]"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp API
                </span>
                <input
                  type="checkbox"
                  checked={settings.channels.whatsapp}
                  onChange={(e) =>
                    setSettings({ ...settings, channels: { ...settings.channels, whatsapp: e.target.checked } })
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
              </label>
            </div>

            {/* Abandoned Cart Config */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900">1. Terk Edilen Sepet Kurtarma</span>
                <input
                  type="checkbox"
                  checked={settings.abandonedCartEnabled}
                  onChange={(e) => setSettings({ ...settings, abandonedCartEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-700"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bekleme (Dakika)</label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.abandonedCartDelayMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, abandonedCartDelayMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Özel Kupon Kodu</label>
                  <input
                    type="text"
                    value={settings.abandonedCartCouponCode}
                    onChange={(e) => setSettings({ ...settings, abandonedCartCouponCode: e.target.value })}
                    placeholder="SEPET5"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kupon Açıklaması</label>
                  <input
                    type="text"
                    value={settings.abandonedCartDiscountText}
                    onChange={(e) => setSettings({ ...settings, abandonedCartDiscountText: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Reorder Config */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#6b1d2f]">2. Tekrar Sipariş Hatırlatması (25–30 Gün)</span>
                <input
                  type="checkbox"
                  checked={settings.reorderEnabled}
                  onChange={(e) => setSettings({ ...settings, reorderEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#6b1d2f]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kaç Gün Sonra?</label>
                  <input
                    type="number"
                    min={7}
                    max={120}
                    value={settings.reorderDelayDays}
                    onChange={(e) => setSettings({ ...settings, reorderDelayDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Sadakat Kuponu</label>
                  <input
                    type="text"
                    value={settings.reorderCouponCode}
                    onChange={(e) => setSettings({ ...settings, reorderCouponCode: e.target.value })}
                    placeholder="TEKRAR10"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kupon Açıklaması</label>
                  <input
                    type="text"
                    value={settings.reorderDiscountText}
                    onChange={(e) => setSettings({ ...settings, reorderDiscountText: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full py-3 bg-[#6b1d2f] hover:bg-[#531523] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Ayarları Kaydet
            </button>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Test Email Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900">Şablon Test E-Postası Gönder</h3>
              <p className="text-xs text-slate-500">
                Müşterilerinize gidecek lüks PEKEFE e-posta tasarımını kendi gelen kutunuzda önizleyin.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTestType("abandoned_cart")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                    testType === "abandoned_cart"
                      ? "bg-[#6b1d2f] text-white border-[#6b1d2f]"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  Terk Edilen Sepet
                </button>
                <button
                  type="button"
                  onClick={() => setTestType("reorder")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                    testType === "reorder"
                      ? "bg-[#6b1d2f] text-white border-[#6b1d2f]"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  28. Gün Tekrar Sipariş
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="ornek@pekefe.com"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  onClick={handleSendTest}
                  disabled={sendingTest}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Test Gönder
                </button>
              </div>
            </div>

            {/* cPanel Cron Job Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                7/24 Otomatik Çalışma (cPanel Cron Job)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                cPanel → <strong>Cron Jobs</strong> bölümüne aşağıdaki komutu <strong>her 30 dakikada bir</strong> çalışacak şekilde eklediğinizde sistem tamamen otonom olarak terk edilen sepetleri ve 28. gün tekrar sipariş hatırlatmalarını gönderir:
              </p>
              <div className="bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-amber-300 break-all">
                */30 * * * * curl -s &quot;{data?.settings?.cronUrl || ""}&quot; &gt; /dev/null 2&gt;&amp;1
              </div>
              <button
                onClick={copyCronCommand}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedCron ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCron ? "Cron Komutu Kopyalandı" : "Cron Komutunu Kopyala"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {!data?.logs?.length ? (
            <div className="p-12 text-center text-xs text-slate-500">Henüz gönderim kaydı yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Akış</th>
                    <th className="py-3 px-4">Kanal</th>
                    <th className="py-3 px-4">Alıcı</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.logs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {log.type === "abandoned_cart" ? "Terk Edilen Sepet" : "Tekrar Sipariş"}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold">{log.channel}</td>
                      <td className="py-3 px-4 text-slate-700">{log.recipient}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === "sent"
                              ? "bg-emerald-50 text-emerald-700"
                              : log.status === "skipped"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {log.status === "sent" ? "Gönderildi" : log.status === "skipped" ? "Atlandı" : "Hata"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">{log.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
