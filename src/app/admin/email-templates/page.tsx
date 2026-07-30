"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Mail, Search, Plus, Edit, Trash2, Send, ToggleLeft, ToggleRight,
  Info, Eye, FileCode, Check, AlertCircle, Copy, HelpCircle, Save, ArrowLeft, X, Settings
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
  welcome: ["kullanici_adi", "aktivasyon_linki"],
  forgot_password: ["kullanici_adi", "sifirlama_linki"],
  password_changed: ["kullanici_adi"],
  order_received: ["kullanici_adi", "siparis_no", "siparis_tutari", "detay_linki"],
  order_completed: ["kullanici_adi", "siparis_no"],
  cargo_shipped: ["kullanici_adi", "siparis_no", "kargo_firmasi", "takip_no", "takip_linki"],
  reconciliation_request: ["cari_unvan", "bakiye", "vade_tarihi", "onay_linki"]
};

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

  const handleSeedDefaults = async () => {
    if (!confirm('Varsayılan 12 profesyonel şablon veritabanına eklenecek. Mevcut şablonlar güncellenir. Devam edilsin mi?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/seed-email-templates', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      toast.success(`✅ ${data.summary.created} yeni şablon oluşturuldu, ${data.summary.updated} şablon güncellendi.`);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Şablonlar yüklenemedi.');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-templates");
      if (!res.ok) throw new Error("Şablonlar yüklenemedi.");
      const data = await res.json();
      setTemplates(data);
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

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
<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
  <h2 style="color: #b45309; text-align: center;">E-posta Başlığı</h2>
  <p>Merhaba <strong>{{kullanici_adi}}</strong>,</p>
  <p>Bu yeni bir e-posta bildirim şablonudur. İçeriği buradan düzenleyebilirsiniz.</p>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
  <p style="font-size: 12px; color: #999; text-align: center;">Pekefe Geleneksel Lezzetler</p>
</div>
      `.trim(),
      variables: "kullanici_adi",
      status: "ACTIVE"
    });
    setEditorTab("edit");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventType || !form.name || !form.subject || !form.bodyHtml) {
      toast.error("Lütfen zorunlu alanları doldurunuz.");
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

      toast.success(editingTemplate ? "Şablon başarıyla güncellendi." : "Yeni şablon başarıyla oluşturuldu.");
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

  // Get current variables dynamically based on eventType selected or custom input
  const currentVariables = form.eventType 
    ? defaultVariablesMap[form.eventType] || form.variables.split(",").map(v => v.trim()).filter(Boolean)
    : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Mail className="w-7 h-7 text-amber-600" />
            E-posta & Bildirim Yönetimi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistem içi otomatik giden mailleri, HTML şablonlarını ve sunucu bağlantı ayarlarını yönetin.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/10 transition-all hover:-translate-y-0.5 text-sm"
          >
            <Settings className="w-4 h-4" />
            {seeding ? 'Yükleniyor...' : 'Varsayılan Şablonları Yükle'}
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-md shadow-amber-600/10 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Yeni Şablon Ekle
          </button>
        </div>
      </div>


          {/* Search & Stats */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Şablon adı, event type veya konu başlığı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm transition-all"
              />
            </div>
            <div className="text-sm text-gray-500">
              Toplam <strong>{filteredTemplates.length}</strong> şablon listeleniyor.
            </div>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
              <p className="text-gray-500 text-sm mt-4 font-medium">Şablonlar yükleniyor...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800">Şablon Bulunamadı</h3>
              <p className="text-gray-500 text-sm mt-1">Arama kriterlerinize uygun e-posta şablonu bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Header Info */}
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-full">
                          {template.eventType}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleStatusToggle(template)}
                        type="button"
                        className="transition-colors hover:opacity-80 animate-none"
                      >
                        {template.status === "ACTIVE" ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <Check className="w-3.5 h-3.5" /> Aktif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                            Pasif
                          </span>
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-snug">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">Konu: {template.subject}</p>
                    </div>

                    {/* Variables List */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">Desteklenen Değişkenler</span>
                      <div className="flex flex-wrap gap-1.5">
                        {template.variables ? template.variables.split(",").map((v, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                            {`{{${v.trim()}}}`}
                          </span>
                        )) : (
                          <span className="text-xs text-gray-400 italic">Değişken yok</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(template)}
                        type="button"
                        className="p-2 hover:bg-amber-50 hover:text-amber-700 text-gray-600 rounded-lg transition-colors"
                        title="Şablonu Düzenle"
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        type="button"
                        className="p-2 hover:bg-rose-50 hover:text-rose-700 text-gray-600 rounded-lg transition-colors"
                        title="Şablonu Sil"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleOpenTestModal(template.eventType)}
                      type="button"
                      className="flex items-center gap-1 text-xs font-semibold bg-white border border-gray-200 hover:border-amber-500 hover:text-amber-700 text-gray-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Test Gönder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}


      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-8 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTemplate ? "E-posta Şablonunu Güncelle" : "Yeni Şablon Tanımla"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Dinamik alanları çift süslü parantez içinde tanımlayabilirsiniz.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body & Tabs */}
            <form onSubmit={handleSave} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Basic Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Şablon Adı <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Yeni Üyelik Karşılama"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Olay Tipi (Event Type) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      disabled={!!editingTemplate}
                      placeholder="Örn: welcome (sadece küçük harfler)"
                      value={form.eventType}
                      onChange={(e) => setForm({ ...form, eventType: e.target.value.toLowerCase().trim() })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">E-posta Konusu (Subject) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Aramıza Hoş Geldiniz {{kullanici_adi}}!"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700">Değişkenler Listesi (Virgülle Ayrılmış)</label>
                    <input
                      type="text"
                      placeholder="Örn: kullanici_adi,aktivasyon_linki"
                      value={form.variables}
                      onChange={(e) => setForm({ ...form, variables: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Editor Content split or tabbed */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-bold text-gray-700">E-posta İçeriği (HTML Destekli)</label>
                      <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setEditorTab("edit")}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            editorTab === "edit" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5" /> HTML Editör
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorTab("preview")}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                            editorTab === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Canlı Önizleme
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Editor Space */}
                    <div className="lg:col-span-3">
                      {editorTab === "edit" ? (
                        <textarea
                          required
                          rows={14}
                          value={form.bodyHtml}
                          onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
                          placeholder="HTML etiketlerini kullanarak tasarlayın..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-xs leading-relaxed"
                        />
                      ) : (
                        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 min-h-[300px] h-[345px]">
                          <iframe
                            srcDoc={form.bodyHtml}
                            title="Email Live Preview"
                            className="w-full h-full bg-white"
                            sandbox="allow-same-origin"
                          />
                        </div>
                      )}
                    </div>

                    {/* Dynamic Sidebar Hint */}
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-4 h-fit">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Info className="w-5 h-5 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">İpuçları & Kılavuz</h4>
                      </div>
                      <p className="text-xs text-amber-900/80 leading-relaxed">
                        Değişkenleri konuya veya içeriğe eklemek için tıklayabilirsiniz. Bu değerler gönderim anında gerçek verilerle doldurulacaktır.
                      </p>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wide">Kullanılabilir Tag'ler</span>
                        <div className="flex flex-col gap-1.5">
                          {currentVariables.length > 0 ? currentVariables.map((v, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => copyToClipboard(v)}
                              className="flex items-center justify-between text-left text-xs bg-white hover:bg-amber-50 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:border-amber-500 font-mono transition-all group"
                              title="Tıkla ve Kopyala"
                            >
                              <span>{`{{${v}}}`}</span>
                              <Copy className="w-3 h-3 text-gray-400 group-hover:text-amber-600 transition-colors" />
                            </button>
                          )) : (
                            <span className="text-xs text-gray-400 italic">Lütfen yukarıya virgülle ayrılmış değişkenleri girin</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500">Şablon Durumu:</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: form.status === "ACTIVE" ? "PASSIVE" : "ACTIVE" })}
                    className="flex items-center gap-1"
                  >
                    {form.status === "ACTIVE" ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <Check className="w-3.5 h-3.5" /> Yayında
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                        Pasif / Taslak
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-600/10 transition-all"
                  >
                    <Save className="w-4 h-4" /> Şablonu Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-600" />
                Test E-postası Gönder
              </h2>
              <button onClick={() => setIsTestModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTest} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Seçilen <strong>{testEventType}</strong> şablonu, sistemdeki varsayılan test verileriyle doldurularak aşağıdaki e-posta adresine gönderilecektir.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Alıcı E-posta Adresi <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="iletisim@sirketiniz.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="flex items-center gap-1 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                >
                  {testSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Gönderimi Tetikle
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

