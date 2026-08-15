"use client";

import { useState, useEffect } from "react";
import { 
  Mail, Search, Plus, Edit, Trash2, Send, ToggleLeft, ToggleRight,
  Info, Eye, FileCode, Check, AlertCircle, Copy, HelpCircle, Save, X, Settings, RefreshCw, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  eventType: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const defaultVariablesMap: Record<string, string[]> = {
  WELCOME: ["userName", "userEmail", "loginUrl", "recipientEmail"],
  PASSWORD_RESET: ["userName", "resetUrl", "expiresIn", "recipientEmail"],
  ORDER_CONFIRMED: ["userName", "orderNo", "orderDate", "orderTotal", "shippingAddress", "orderDetailUrl", "recipientEmail"],
  ORDER_SHIPPED: ["userName", "orderNo", "cargoCompany", "trackingNo", "trackingUrl", "estimatedDelivery", "recipientEmail"],
  ORDER_DELIVERED: ["userName", "orderNo", "deliveredAt", "feedbackUrl", "shopUrl", "recipientEmail"],
  PAYMENT_RECEIVED: ["userName", "orderNo", "paymentAmount", "paymentMethod", "paymentDate", "invoiceUrl", "recipientEmail"],
  ORDER_CANCELLED: ["userName", "orderNo", "cancelReason", "refundAmount", "refundMethod", "refundDays", "shopUrl", "recipientEmail"],
  B2B_APPROVED: ["userName", "companyName", "b2bGroup", "discountRate", "loginUrl", "catalogUrl", "recipientEmail"],
  B2B_REJECTED: ["userName", "companyName", "rejectReason", "contactUrl", "recipientEmail"]
};

const CLIENT_FALLBACK_TEMPLATES: EmailTemplate[] = [
  {
    id: "fb-1",
    eventType: "WELCOME",
    name: "Hoş Geldiniz - Yeni Üyelik",
    subject: "Pekefe Ailesine Hoş Geldiniz, {{userName}}! 🌿",
    variables: "userName,userEmail,loginUrl,recipientEmail",
    status: "ACTIVE",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;"><h2>Aramıza Hoş Geldiniz, {{userName}}! ✨</h2><p>Pekefe ailesine katıldığınız için teşekkür ederiz.</p></div>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fb-2",
    eventType: "PASSWORD_RESET",
    name: "Şifre Sıfırlama İsteği",
    subject: "Şifrenizi Sıfırlayın — Pekefe",
    variables: "userName,resetUrl,expiresIn,recipientEmail",
    status: "ACTIVE",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;"><h2>Şifre Sıfırlama Talebi</h2><p>Merhaba <strong>{{userName}}</strong>,</p></div>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fb-3",
    eventType: "ORDER_CONFIRMED",
    name: "Sipariş Onaylandı",
    subject: "Siparişiniz Alındı — #{{orderNo}} 📦",
    variables: "userName,orderNo,orderDate,orderTotal,shippingAddress,orderDetailUrl,recipientEmail",
    status: "ACTIVE",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;"><h2>Siparişiniz Alındı! 🎉</h2><p><strong>#{{orderNo}}</strong> numaralı siparişiniz onaylandı.</p></div>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fb-4",
    eventType: "ORDER_SHIPPED",
    name: "Sipariş Kargoya Verildi",
    subject: "Siparişiniz Kargoya Verildi — #{{orderNo}} 🚚",
    variables: "userName,orderNo,cargoCompany,trackingNo,trackingUrl,estimatedDelivery,recipientEmail",
    status: "ACTIVE",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;"><h2>Siparişiniz Yola Çıktı! 🚚</h2></div>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fb-5",
    eventType: "B2B_APPROVED",
    name: "B2B Bayi Hesabı Onaylandı",
    subject: "Tebrikler! Bayi Hesabınız Aktif Edildi — Pekefe B2B 🏆",
    variables: "userName,companyName,b2bGroup,discountRate,loginUrl,recipientEmail",
    status: "ACTIVE",
    bodyHtml: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;"><h2>Bayi Hesabınız Onaylandı! 🏆</h2></div>`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Editor / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  
  // Form State
  const [form, setForm] = useState({
    eventType: "",
    name: "",
    subject: "",
    bodyHtml: "",
    variables: "",
    status: "ACTIVE"
  });

  // Test Email State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEventType, setTestEventType] = useState("");
  const [testRecipient, setTestRecipient] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-templates");
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data);
        } else {
          setTemplates(CLIENT_FALLBACK_TEMPLATES);
        }
      } else {
        setTemplates(CLIENT_FALLBACK_TEMPLATES);
      }
    } catch (error: any) {
      console.warn("API Error, using fallback templates:", error);
      setTemplates(CLIENT_FALLBACK_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Varsayılan 12 adet kurumsal e-posta şablonu veritabanına yüklenecek. Devam edilsin mi?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/seed-email-templates', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      toast.success(`✅ ${data.summary?.created || 0} yeni şablon eklendi, ${data.summary?.updated || 0} şablon güncellendi.`);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Şablonlar yüklenirken bir hata oluştu.');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setForm({
      eventType: template.eventType,
      name: template.name,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      variables: template.variables,
      status: template.status
    });
    setEditorTab("edit");
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setForm({
      eventType: "",
      name: "",
      subject: "",
      bodyHtml: `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background: #fff;">
  <h2 style="color: #b45309; text-align: center; margin-top: 0;">E-posta Bildirimi</h2>
  <p>Merhaba <strong>{{userName}}</strong>,</p>
  <p>Bu yeni bir e-posta bildirim şablonudur. İçeriği buradan düzenleyebilirsiniz.</p>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">PEKEFE Geleneksel &amp; Doğal Lezzetler</p>
</div>
      `.trim(),
      variables: "userName,userEmail,recipientEmail",
      status: "ACTIVE"
    });
    setEditorTab("edit");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventType || !form.name || !form.subject || !form.bodyHtml) {
      toast.error("Lütfen tüm zorunlu alanları doldurunuz.");
      return;
    }

    try {
      const url = editingTemplate 
        ? `/api/admin/email-templates/${editingTemplate.id}`
        : `/api/admin/email-templates`;
      
      const method = editingTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "İşlem başarısız oldu.");
      }

      toast.success(editingTemplate ? "Şablon başarıyla güncellendi." : "Yeni şablon oluşturuldu.");
      setIsModalOpen(false);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu e-posta şablonunu silmek istediğinizden emin misiniz?")) return;

    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Şablon silinemedi.");
      }

      toast.success("Şablon silindi.");
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleStatusToggle = async (template: EmailTemplate) => {
    const newStatus = template.status === "ACTIVE" ? "PASSIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...template,
          status: newStatus
        })
      });

      if (!res.ok) throw new Error("Durum güncellenemedi.");
      
      toast.success(`Şablon ${newStatus === "ACTIVE" ? "Aktif" : "Pasif"} duruma getirildi.`);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleOpenTestModal = (eventType: string) => {
    setTestEventType(eventType);
    setTestRecipient("");
    setIsTestModalOpen(true);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) {
      toast.error("Lütfen alıcı e-posta adresini giriniz.");
      return;
    }

    setTestSending(true);
    try {
      const res = await fetch("/api/admin/email-templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: testEventType,
          recipient: testRecipient
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Test gönderimi başarısız.");
      }

      toast.success("Test e-postası başarıyla gönderim kuyruğuna eklendi!");
      setIsTestModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setTestSending(false);
    }
  };

  const copyToClipboard = (variable: string) => {
    const text = `{{${variable}}}`;
    navigator.clipboard.writeText(text);
    toast.success(`'${text}' kopyalandı! Editöre yapıştırabilirsiniz.`);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.eventType.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const currentVariables = form.eventType 
    ? defaultVariablesMap[form.eventType.toUpperCase()] || form.variables.split(",").map(v => v.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-[#b45309]" /> E-posta & Otomatik Bildirim Şablonları
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistem içi otomatik giden mailleri, HTML şablonlarını ve bildirim tetikleyicilerini yönetin.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            {seeding ? 'Yükleniyor...' : 'Varsayılan Şablonları Yükle'}
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Şablon Ekle
          </button>
          <button
            onClick={fetchTemplates}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Şablon adı, event type veya konu başlığı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b45309] text-xs font-semibold text-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">
          Toplam <strong className="text-slate-900">{filteredTemplates.length}</strong> şablon aktif.
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-3">Şablonlar Yükleniyor...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <Mail className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Şablon Bulunamadı</h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            Arama kriterlerinize uygun şablon bulunmamaktadır. Sağ üstten 'Varsayılan Şablonları Yükle' butonuna basarak 12 hazır şablonu yükleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => (
            <div 
              key={template.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              {/* Header Info */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 bg-amber-50 border border-amber-200 rounded-md font-mono uppercase">
                    {template.eventType}
                  </span>

                  <button 
                    onClick={() => handleStatusToggle(template)}
                    type="button"
                    className="cursor-pointer"
                  >
                    {template.status === "ACTIVE" ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        Pasif
                      </span>
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{template.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">Konu: {template.subject}</p>
                </div>

                {/* Variables List */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Değişkenler</span>
                  <div className="flex flex-wrap gap-1">
                    {template.variables ? template.variables.split(",").map((v, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                        {`{{${v.trim()}}}`}
                      </span>
                    )) : (
                      <span className="text-xs text-slate-400 italic">Değişken yok</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(template)}
                    type="button"
                    className="p-2 hover:bg-amber-100 text-slate-600 hover:text-amber-900 rounded-xl transition cursor-pointer"
                    title="Şablonu Düzenle"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    type="button"
                    className="p-2 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition cursor-pointer"
                    title="Şablonu Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => handleOpenTestModal(template.eventType)}
                  type="button"
                  className="flex items-center gap-1 text-xs font-bold bg-white border border-slate-200 hover:border-[#b45309] text-slate-800 px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#b45309]" /> Test Gönder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {editingTemplate ? "E-posta Şablonunu Düzenle" : "Yeni E-posta Şablonu Tanımla"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Süslü parantez &#123;&#123;degisken&#125;&#125; formatı dinamik veriler ile değiştirilir.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Şablon Adı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Yeni Sipariş Bildirimi"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Olay Tipi (Event Type) *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingTemplate}
                      placeholder="Örn: ORDER_CONFIRMED"
                      value={form.eventType}
                      onChange={(e) => setForm({ ...form, eventType: e.target.value.toUpperCase().trim() })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:border-[#b45309] outline-none disabled:opacity-60"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-posta Konusu (Subject) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Siparişiniz Alındı #{{orderNo}}"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Değişkenler Listesi (Virgülle Ayrılmış)</label>
                    <input
                      type="text"
                      placeholder="userName,orderNo,orderTotal"
                      value={form.variables}
                      onChange={(e) => setForm({ ...form, variables: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:border-[#b45309] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase">E-posta HTML İçeriği</label>
                    <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 gap-1">
                      <button
                        type="button"
                        onClick={() => setEditorTab("edit")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          editorTab === "edit" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5" /> HTML Kodu
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab("preview")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          editorTab === "preview" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-700" /> Canlı Önizleme
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3">
                      {editorTab === "edit" ? (
                        <textarea
                          required
                          rows={12}
                          value={form.bodyHtml}
                          onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
                          className="w-full p-4 border border-slate-200 rounded-xl focus:border-[#b45309] font-mono text-xs leading-relaxed outline-none"
                        />
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-[300px]">
                          <iframe
                            srcDoc={form.bodyHtml}
                            title="Email Live Preview"
                            className="w-full h-full bg-white"
                            sandbox="allow-same-origin"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3 h-fit">
                      <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                        <Info className="w-4 h-4 text-[#b45309]" />
                        <span>Kullanılabilir Etiketler</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {currentVariables.length > 0 ? currentVariables.map((v, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => copyToClipboard(v)}
                            className="flex items-center justify-between text-left text-xs bg-white hover:bg-amber-100 text-slate-700 px-2.5 py-1.5 rounded-lg border border-amber-200 font-mono transition cursor-pointer group"
                            title="Tıkla ve Kopyala"
                          >
                            <span>{`{{${v}}}`}</span>
                            <Copy className="w-3 h-3 text-slate-400 group-hover:text-amber-700" />
                          </button>
                        )) : (
                          <span className="text-[11px] text-slate-400 italic">Virgülle ayrılmış değişken yazın</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" /> Şablonu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#b45309]" /> Test E-postası Gönder
              </h2>
              <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTest} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Seçilen <strong>{testEventType}</strong> şablonu test verileriyle doldurularak aşağıdaki adrese iletilecektir.
              </p>
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Alıcı E-posta Adresi *</label>
                <input
                  type="email"
                  required
                  placeholder="test@firma.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {testSending ? "Gönderiliyor..." : "Testi Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
