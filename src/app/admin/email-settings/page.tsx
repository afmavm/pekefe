"use client";

import { useState, useEffect } from "react";
import { 
  Mail, Settings, Save, Send, ShieldCheck, ShieldAlert,
  Info, Server, Key, User, RefreshCw,
  Sliders, Eye, EyeOff, MessageSquare, Phone, Terminal, Bell
} from "lucide-react";
import { toast } from "sonner";

interface SettingsForm {
  // SMTP
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpFromName: string;
  smtpSecure: boolean;
  smtpMaxRetries: number;
  smtpRetryDelay: number;
  adminNotificationEmail: string;
  // WhatsApp
  whatsappProvider: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsappFrom: string;
  metaWhatsappToken: string;
  metaPhoneNumberId: string;
  adminNotificationWhatsapp: string;
}

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");
  const [form, setForm] = useState<SettingsForm>({
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    smtpFromName: "PEKEFE Geleneksel & Doğal Lezzetler",
    smtpSecure: false,
    smtpMaxRetries: 3,
    smtpRetryDelay: 5,
    adminNotificationEmail: "",
    whatsappProvider: "wame",
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioWhatsappFrom: "",
    metaWhatsappToken: "",
    metaPhoneNumberId: "",
    adminNotificationWhatsapp: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [showMetaToken, setShowMetaToken] = useState(false);
  
  // SMTP Test states
  const [testRecipient, setTestRecipient] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    stage?: string;
    message: string;
    errorDetails?: string;
    errorCode?: string;
    messageId?: string;
  } | null>(null);

  // WhatsApp Test states
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testingWa, setTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{
    success: boolean;
    message: string;
    provider?: string;
    errorDetails?: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-settings");
      if (res.ok) {
        const data = await res.json();
        setForm({
          smtpHost: data.smtpHost || "smtp.gmail.com",
          smtpPort: data.smtpPort || "587",
          smtpUser: data.smtpUser || "",
          smtpPass: "",
          smtpFromName: data.smtpFromName || "PEKEFE Geleneksel & Doğal Lezzetler",
          smtpSecure: data.smtpSecure || false,
          smtpMaxRetries: data.smtpMaxRetries !== undefined ? Number(data.smtpMaxRetries) : 3,
          smtpRetryDelay: data.smtpRetryDelay !== undefined ? Number(data.smtpRetryDelay) : 5,
          adminNotificationEmail: data.adminNotificationEmail || "",
          whatsappProvider: data.whatsappProvider || "wame",
          twilioAccountSid: data.twilioAccountSid || "",
          twilioAuthToken: "",
          twilioWhatsappFrom: data.twilioWhatsappFrom || "",
          metaWhatsappToken: "",
          metaPhoneNumberId: data.metaPhoneNumberId || "",
          adminNotificationWhatsapp: data.adminNotificationWhatsapp || ""
        });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } fontally: {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        smtpHost: form.smtpHost.trim(),
        smtpPort: form.smtpPort.trim(),
        smtpUser: form.smtpUser.trim(),
        smtpFromName: form.smtpFromName.trim(),
        smtpSecure: form.smtpSecure,
        smtpMaxRetries: Number(form.smtpMaxRetries),
        smtpRetryDelay: Number(form.smtpRetryDelay),
        adminNotificationEmail: form.adminNotificationEmail.trim(),
        whatsappProvider: form.whatsappProvider,
        twilioWhatsappFrom: form.twilioWhatsappFrom.trim(),
        metaPhoneNumberId: form.metaPhoneNumberId.trim(),
        adminNotificationWhatsapp: form.adminNotificationWhatsapp.trim()
      };
      
      if (form.smtpPass.trim()) {
        payload.smtpPass = form.smtpPass.trim();
      }
      if (form.twilioAccountSid.trim()) {
        payload.twilioAccountSid = form.twilioAccountSid.trim();
      }
      if (form.twilioAuthToken.trim()) {
        payload.twilioAuthToken = form.twilioAuthToken.trim();
      }
      if (form.metaWhatsappToken.trim()) {
        payload.metaWhatsappToken = form.metaWhatsappToken.trim();
      }

      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ayarlar kaydedilemedi.");
      }

      toast.success("Entegrasyon ayarları başarıyla güncellendi.");
      setForm(prev => ({ ...prev, smtpPass: "", twilioAuthToken: "", metaWhatsappToken: "" }));
    } catch (error: any) {
      toast.error(error.message || "Ayarlar kaydedilirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim()) {
      toast.error("Lütfen alıcı e-posta adresini giriniz.");
      return;
    }

    setTesting(true);
    setTestResult(null);
    toast.info("SMTP sunucu bağlantısı test ediliyor...");

    try {
      const payload = {
        smtpHost: form.smtpHost.trim(),
        smtpPort: form.smtpPort.trim(),
        smtpUser: form.smtpUser.trim(),
        smtpFromName: form.smtpFromName.trim(),
        smtpSecure: form.smtpSecure,
        smtpPass: form.smtpPass.trim(),
        recipient: testRecipient.trim()
      };

      const res = await fetch("/api/admin/email-settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setTestResult(data);

      if (res.ok && data.success) {
        toast.success("SMTP Bağlantı testi başarılı!");
      } else {
        toast.error("SMTP Bağlantı testi başarısız oldu.");
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: "Test çalıştırılırken hata oluştu.",
        errorDetails: error.message || String(error)
      });
      toast.error("Bağlantı testi başarısız oldu.");
    } finally {
      setTesting(false);
    }
  };

  const handleTestWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error("Lütfen alıcı telefon numarasını giriniz.");
      return;
    }

    setTestingWa(true);
    setWaTestResult(null);
    toast.info("WhatsApp entegrasyonu test ediliyor...");

    try {
      const payload = {
        whatsappProvider: form.whatsappProvider,
        twilioAccountSid: form.twilioAccountSid.trim(),
        twilioAuthToken: form.twilioAuthToken.trim(),
        twilioWhatsappFrom: form.twilioWhatsappFrom.trim(),
        metaWhatsappToken: form.metaWhatsappToken.trim(),
        metaPhoneNumberId: form.metaPhoneNumberId.trim(),
        recipient: testPhone.trim(),
        message: testMessage.trim() || undefined
      };

      const res = await fetch("/api/admin/email-settings/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setWaTestResult(data);
      
      if (data.success) {
        toast.success("WhatsApp testi başarılı!");
      } else {
        toast.error(data.message || "WhatsApp testi başarısız oldu.");
      }
    } catch (error: any) {
      setWaTestResult({
        success: false,
        message: "WhatsApp testi sırasında sunucu hatası oluştu.",
        errorDetails: error.message || String(error)
      });
      toast.error("WhatsApp testi başarısız.");
    } finally {
      setTestingWa(false);
    }
  };

  const handlePortChange = (portVal: string) => {
    setForm(prev => ({
      ...prev,
      smtpPort: portVal,
      smtpSecure: portVal === "465"
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#b45309]" /> E-Posta & WhatsApp Entegrasyon Ayarları
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            SMTP e-posta sunucusu, yönetici bildirimleri ve WhatsApp otomasyon ayarlarını buradan konfigüre edin.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${activeTab === "email" ? "bg-white text-[#b45309] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Mail className="w-4 h-4" /> E-posta (SMTP)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${activeTab === "whatsapp" ? "bg-white text-[#b45309] shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp API
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-[#b45309] animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-3">Entegrasyon ayarları yükleniyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
              
              {activeTab === "email" ? (
                /* EMAIL SETTINGS TAB */
                <div className="space-y-6">
                  
                  {/* SMTP Server Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Server className="w-4 h-4 text-[#b45309]" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">SMTP Sunucu Bilgileri</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block">SMTP Sunucusu (Host) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: smtp.gmail.com"
                          value={form.smtpHost}
                          onChange={e => setForm({ ...form, smtpHost: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Port *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="587 / 465"
                            value={form.smtpPort}
                            onChange={e => handlePortChange(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => handlePortChange("587")}
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded border cursor-pointer ${form.smtpPort === "587" ? "bg-[#b45309] text-white border-[#b45309]" : "bg-white text-slate-500 border-slate-200"}`}
                            >
                              587
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePortChange("465")}
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded border cursor-pointer ${form.smtpPort === "465" ? "bg-[#b45309] text-white border-[#b45309]" : "bg-white text-slate-500 border-slate-200"}`}
                            >
                              465
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-slate-800 block">Güvenli Bağlantı (SSL/TLS)</label>
                        <span className="text-[10px] text-slate-500 font-medium">SSL/TLS üzerinden şifreli bağlantı. Genellikle Port 465 için aktiftir.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, smtpSecure: !form.smtpSecure })}
                        className={`w-11 h-6 rounded-full transition relative cursor-pointer ${form.smtpSecure ? "bg-[#b45309]" : "bg-slate-300"}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition shadow-sm ${form.smtpSecure ? "left-[21px]" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Credentials */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Key className="w-4 h-4 text-[#b45309]" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Kimlik Doğrulama</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Kullanıcı Adı (E-posta) *</label>
                        <input
                          type="email"
                          required
                          placeholder="iletisim@pekefe.com"
                          value={form.smtpUser}
                          onChange={e => setForm({ ...form, smtpUser: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Şifre (Password)</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Değiştirmek için yazın..."
                            value={form.smtpPass}
                            onChange={e => setForm({ ...form, smtpPass: e.target.value })}
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sender Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <User className="w-4 h-4 text-[#b45309]" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Gönderici Bilgileri</h3>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Gönderen Adı (From Display Name)</label>
                      <input
                        type="text"
                        placeholder="Örn: PEKEFE Geleneksel Lezzetler"
                        value={form.smtpFromName}
                        onChange={e => setForm({ ...form, smtpFromName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                      />
                    </div>
                  </div>

                  {/* Queue Settings */}
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Sliders className="w-4 h-4 text-[#b45309]" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Kuyruk ve Bildirim Ayarları</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Maksimum Tekrar Deneme</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={form.smtpMaxRetries}
                          onChange={e => setForm({ ...form, smtpMaxRetries: parseInt(e.target.value) || 3 })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Tekrar Gecikmesi (Saniye)</label>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={form.smtpRetryDelay}
                          onChange={e => setForm({ ...form, smtpRetryDelay: parseInt(e.target.value) || 5 })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 mt-2">
                      <label className="text-xs font-bold text-slate-700 block">Admin Bildirim E-postası</label>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="admin@pekefe.com"
                          value={form.adminNotificationEmail}
                          onChange={e => setForm({ ...form, adminNotificationEmail: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                          <Bell className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* WHATSAPP SETTINGS TAB */
                <div className="space-y-6">
                  
                  {/* Provider Choice */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <MessageSquare className="w-4 h-4 text-[#b45309]" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">WhatsApp Servis Sağlayıcı</h3>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Sağlayıcı (Provider)</label>
                      <select
                        value={form.whatsappProvider}
                        onChange={e => setForm({ ...form, whatsappProvider: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#b45309] cursor-pointer"
                      >
                        <option value="wame">wa.me Deep Link (Yalnızca Yönlendirme Bağlantısı)</option>
                        <option value="twilio">Twilio WhatsApp API (Otomatik Arka Plan Gönderim)</option>
                        <option value="meta">Meta Cloud API (Facebook Developer Entegrasyonu)</option>
                      </select>
                    </div>
                  </div>

                  {/* Twilio Fields */}
                  {form.whatsappProvider === "twilio" && (
                    <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase">
                        <Key className="w-4 h-4 text-[#b45309]" /> Twilio API Kimlik Bilgileri
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Twilio Account SID</label>
                          <input
                            type="text"
                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={form.twilioAccountSid}
                            onChange={e => setForm({ ...form, twilioAccountSid: e.target.value })}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Twilio Auth Token</label>
                          <div className="relative">
                            <input
                              type={showTwilioToken ? "text" : "password"}
                              placeholder="Auth Token giriniz..."
                              value={form.twilioAuthToken}
                              onChange={e => setForm({ ...form, twilioAuthToken: e.target.value })}
                              className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowTwilioToken(!showTwilioToken)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                            >
                              {showTwilioToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Twilio WhatsApp Gönderici Numarası</label>
                          <input
                            type="text"
                            placeholder="whatsapp:+14155238886"
                            value={form.twilioWhatsappFrom}
                            onChange={e => setForm({ ...form, twilioWhatsappFrom: e.target.value })}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Meta Fields */}
                  {form.whatsappProvider === "meta" && (
                    <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase">
                        <Key className="w-4 h-4 text-[#b45309]" /> Meta Developer API Kimlik Bilgileri
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Meta Access Token</label>
                          <div className="relative">
                            <input
                              type={showMetaToken ? "text" : "password"}
                              placeholder="Meta Access Token giriniz..."
                              value={form.metaWhatsappToken}
                              onChange={e => setForm({ ...form, metaWhatsappToken: e.target.value })}
                              className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowMetaToken(!showMetaToken)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                            >
                              {showMetaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Meta Phone Number ID</label>
                          <input
                            type="text"
                            placeholder="10984126XXXXXXXX"
                            value={form.metaPhoneNumberId}
                            onChange={e => setForm({ ...form, metaPhoneNumberId: e.target.value })}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General Notification Phone Number */}
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Phone className="w-4 h-4 text-[#b45309]" />
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Yönetici Bildirim Telefon Numarası</h3>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Yönetici WhatsApp Numarası *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="+905301234567"
                          value={form.adminNotificationWhatsapp}
                          onChange={e => setForm({ ...form, adminNotificationWhatsapp: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#b45309]"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                          <MessageSquare className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Form Save Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Ayarları Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Helper Info Info */}
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-3 text-xs leading-relaxed text-amber-950 font-medium">
              <Info className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900">💡 Hızlı Bildirim Rehberi</p>
                <p className="text-slate-700">
                  {activeTab === "email" ? (
                    "Gmail SMTP sunucusunu kullanıyorsanız, 2 adımlı doğrulama ayarlarından özel 16 haneli 'Uygulama Şifresi' üreterek SMTP şifre alanına girmelisiniz."
                  ) : (
                    "Twilio veya Meta entegrasyonu seçilmediğinde sipariş WhatsApp bildirimleri doğrudan wa.me yönlendirmesi şeklinde yönetici sipariş detayında yer alacaktır."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Test Panel Side */}
          <div className="space-y-6">
            
            {activeTab === "email" ? (
              /* SMTP TEST */
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Send className="w-4 h-4 text-[#b45309]" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">SMTP Teşhis ve Test</h3>
                </div>

                <form onSubmit={handleTestConnection} className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    SMTP sunucu bağlantısını doğrulamak ve test e-postası göndermek için aşağıdaki adresi doldurun.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Alıcı E-posta Adresi *</label>
                    <input
                      type="email"
                      required
                      placeholder="test@pekefe.com"
                      value={testRecipient}
                      onChange={e => setTestRecipient(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={testing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#b45309]" />
                        Test Ediliyor...
                      </>
                    ) : (
                      <>
                        <Terminal className="w-4 h-4 text-[#b45309]" />
                        Bağlantıyı Test Et
                      </>
                    )}
                  </button>
                </form>

                {testResult && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Konsol Çıktısı</span>
                      {testResult.success ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> BAĞLANTI OK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3 text-red-600" /> HATA
                        </span>
                      )}
                    </div>

                    <div className={`p-4 rounded-xl border font-mono text-[10px] leading-relaxed max-h-[180px] overflow-y-auto ${testResult.success ? "bg-slate-900 text-slate-100 border-slate-800" : "bg-red-950 text-red-100 border-red-900"}`}>
                      {testResult.success ? (
                        <div className="space-y-1">
                          <p className="text-emerald-400 font-bold">[SUCCESS] SMTP Bağlantısı Doğrulandı.</p>
                          <p className="text-slate-400">&gt; Sunucu: {form.smtpHost}:{form.smtpPort}</p>
                          <p className="text-slate-400">&gt; Gönderici: {form.smtpUser}</p>
                          <p className="text-emerald-400 mt-2 font-medium">Test e-postası iletildi ({testRecipient})</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-red-400 font-bold">[FAIL] SMTP Hatası</p>
                          <p className="text-red-200">Aşama: {testResult.stage}</p>
                          <p className="text-red-200">Özet: {testResult.message}</p>
                          <pre className="text-red-300 whitespace-pre-wrap font-mono mt-2">{testResult.errorDetails || "Bilgi yok."}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* WHATSAPP TEST */
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Send className="w-4 h-4 text-[#b45309]" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">WhatsApp Entegrasyon Testi</h3>
                </div>

                <form onSubmit={handleTestWhatsApp} className="space-y-4">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    WhatsApp API entegrasyonunun doğruluğunu ve mesaj teslimatını test edin.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Alıcı Telefon Numarası *</label>
                    <input
                      type="text"
                      required
                      placeholder="+905301234567"
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Test Mesajı</label>
                    <textarea
                      placeholder="PEKEFE WhatsApp test mesajı."
                      rows={3}
                      value={testMessage}
                      onChange={e => setTestMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={testingWa}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {testingWa ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#b45309]" />
                        Test Ediliyor...
                      </>
                    ) : (
                      <>
                        <Terminal className="w-4 h-4 text-[#b45309]" />
                        WhatsApp Test Mesajı Gönder
                      </>
                    )}
                  </button>
                </form>

                {waTestResult && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Konsol Çıktısı</span>
                      {waTestResult.success ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> GÖNDERİLDİ
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3 text-red-600" /> HATA
                        </span>
                      )}
                    </div>

                    <div className={`p-4 rounded-xl border font-mono text-[10px] leading-relaxed max-h-[180px] overflow-y-auto ${waTestResult.success ? "bg-slate-900 text-slate-100 border-slate-800" : "bg-red-950 text-red-100 border-red-900"}`}>
                      {waTestResult.success ? (
                        <div className="space-y-1">
                          <p className="text-emerald-400 font-bold">[SUCCESS] WhatsApp Mesajı İletildi.</p>
                          <p className="text-slate-400">&gt; Sağlayıcı: {waTestResult.provider}</p>
                          <p className="text-slate-400">&gt; Alıcı: {testPhone}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-red-400 font-bold">[FAIL] WhatsApp Hatası</p>
                          <p className="text-red-200">Özet: {waTestResult.message}</p>
                          <pre className="text-red-300 whitespace-pre-wrap font-mono mt-2">{waTestResult.errorDetails || "Bilgi yok."}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
