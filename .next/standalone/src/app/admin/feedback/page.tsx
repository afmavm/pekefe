"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  MessageSquare, Star, Trash2, CheckCircle2, XCircle, 
  Send, Reply, Loader2, Search, Filter, AlertCircle, Sparkles,
  Inbox, TrendingUp, ThumbsUp
} from "lucide-react";
import { toast } from "sonner";

interface Feedback {
  id: string;
  name: string;
  email: string;
  rating: number;
  message: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reply: string | null;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  
  // Reply modal/drawer state
  const [replyingTo, setReplyingTo] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      } else {
        toast.error("Geri bildirimler yüklenirken bir hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Actions
  const handleStatusUpdate = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success(newStatus === "APPROVED" ? "Yorum başarıyla onaylandı." : "Yorum reddedildi.");
        // Update state locally
        setFeedbacks(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      } else {
        toast.error("İşlem başarısız oldu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Bağlantı hatası.");
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/feedback/${replyingTo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText, status: "APPROVED" }) // Automatically approve on reply
      });

      if (res.ok) {
        toast.success("Yanıtınız başarıyla eklendi ve yorum onaylandı.");
        setFeedbacks(prev => prev.map(item => 
          item.id === replyingTo.id ? { ...item, reply: replyText, status: "APPROVED" } : item
        ));
        setReplyingTo(null);
        setReplyText("");
      } else {
        toast.error("Yanıt gönderilemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Bağlantı hatası.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu geri bildirimi kalıcı olarak silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Geri bildirim başarıyla silindi.");
        setFeedbacks(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error("Silme işlemi başarısız.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Bağlantı hatası.");
    }
  };

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const total = feedbacks.length;
    const pending = feedbacks.filter(f => f.status === "PENDING").length;
    const approved = feedbacks.filter(f => f.status === "APPROVED").length;
    const replied = feedbacks.filter(f => f.reply !== null).length;
    
    const sumRatings = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = total > 0 ? (sumRatings / total).toFixed(1) : "0.0";
    
    const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0;

    return { total, pending, approved, avgRating, replyRate };
  }, [feedbacks]);

  // Filters & Search
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchesSearch = 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = activeTab === "ALL" || f.status === activeTab;
      
      const matchesRating = ratingFilter === "ALL" || f.rating === ratingFilter;

      return matchesSearch && matchesTab && matchesRating;
    });
  }, [feedbacks, searchTerm, activeTab, ratingFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-orange-500" /> Geri Bildirim & CRM Merkezi
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            B2C ve B2B müşterilerden gelen değerlendirmeleri, puanları inceleyin. Yanıt yazarak kurumsal prestijinizi artırın.
          </p>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-500 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Toplam Yorum</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-xs font-bold text-slate-400">Adet</span>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-slate-500">
            <Inbox className="w-4 h-4 text-slate-400" />
            <span>Gelen kutusu hacmi</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bekleyen Yorumlar</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-black text-amber-600 flex items-center gap-2">
              {metrics.pending}
              {metrics.pending > 0 && (
                <span className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500"></span>
                </span>
              )}
            </span>
            <span className="text-xs font-bold text-slate-400">Onay Bekleyen</span>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-slate-500">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Maksimum 24 saat yanıt süresi</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ortalama Puan</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-black text-emerald-600 flex items-center gap-1.5">
              {metrics.avgRating} <Star className="w-6 h-6 fill-current" />
            </span>
            <span className="text-xs font-bold text-slate-400">/ 5.0 Puan</span>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-slate-500">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Genel müşteri memnuniyeti</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-500 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yanıtlanma Oranı</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-black text-blue-600">%{metrics.replyRate}</span>
            <span className="text-xs font-bold text-slate-400">Cevaplandı</span>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-slate-500">
            <ThumbsUp className="w-4 h-4 text-blue-500" />
            <span>Marka etkileşim başarısı</span>
          </div>
        </div>

      </div>

      {/* Main Workspace Panel */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        
        {/* Controls Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row justify-between gap-4">
          
          {/* Tab buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "ALL", label: "TÜMÜ", count: metrics.total, color: "bg-slate-100 text-slate-800" },
              { id: "PENDING", label: "BEKLEYENLER", count: metrics.pending, color: "bg-amber-100 text-orange-600" },
              { id: "APPROVED", label: "ONAYLANANLAR", count: metrics.approved, color: "bg-emerald-100 text-emerald-700" },
              { id: "REJECTED", label: "REDDEDİLENLER", count: feedbacks.filter(f => f.status === "REJECTED").length, color: "bg-red-100 text-red-700" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${
                  activeTab === tab.id 
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10 scale-[1.02]" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : tab.color}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="İsim, email veya mesaj..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[240px] pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            {/* Rating Dropdown */}
            <div className="relative flex items-center border border-slate-200 rounded-2xl bg-white px-3.5 py-2.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="bg-transparent text-xs font-black text-slate-700 focus:outline-none pr-2 cursor-pointer"
              >
                <option value="ALL">TÜM PUANLAR</option>
                <option value="5">5 YILDIZ</option>
                <option value="4">4 YILDIZ</option>
                <option value="3">3 YILDIZ</option>
                <option value="2">2 YILDIZ</option>
                <option value="1">1 YILDIZ</option>
              </select>
            </div>
          </div>

        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Geri bildirimler çekiliyor...</p>
          </div>
        ) : (
          <div className="p-6">
            {filteredFeedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <Inbox className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Kayıt Bulunamadı</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto font-medium">
                    Filtrelere veya arama sorgunuza uygun herhangi bir geri bildirim bulunmamaktadır.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredFeedbacks.map(item => (
                  <div 
                    key={item.id} 
                    className={`bg-slate-50 border rounded-3xl p-6 transition-all duration-300 relative group flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md hover:bg-white ${
                      item.status === 'PENDING' ? 'border-amber-200 bg-orange-50/10' :
                      item.status === 'REJECTED' ? 'border-orange-100' : 'border-slate-200'
                    }`}
                  >
                    
                    {/* Main Content Info */}
                    <div className="space-y-3 max-w-3xl flex-1">
                      
                      {/* Top row metadata */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-extrabold text-sm text-slate-900">{item.name}</span>
                        <span className="text-[11px] font-bold text-slate-400">{item.email}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">• {new Date(item.createdAt).toLocaleDateString("tr-TR", { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        {/* Status badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          item.status === 'PENDING' ? 'bg-amber-100 text-orange-600' :
                          item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status === 'PENDING' ? 'BEKLEMEDE' :
                           item.status === 'APPROVED' ? 'ONAYLANDI' : 'REDDEDİLDİ'}
                        </span>
                      </div>

                      {/* Stars rating visual */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < item.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                            }`} 
                          />
                        ))}
                      </div>

                      {/* Client Comment Message */}
                      <p className="text-slate-700 text-xs leading-relaxed font-medium">
                        "{item.message}"
                      </p>

                      {/* Admin Response Block */}
                      {item.reply ? (
                        <div className="mt-4 p-4 bg-slate-100 border border-slate-200 rounded-2xl space-y-1.5 animate-in slide-in-from-top-2">
                          <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5" /> Nexa Yönetici Yanıtı
                          </div>
                          <p className="text-slate-600 text-xs italic font-semibold">
                            "{item.reply}"
                          </p>
                        </div>
                      ) : (
                        item.status === "PENDING" && (
                          <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1.5 mt-2 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" /> Bu yoruma henüz yanıt verilmedi. Yanıt yazarak anında onaylayın!
                          </p>
                        )
                      )}

                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row md:flex-col items-center justify-end gap-2.5 md:self-center border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      
                      {/* Approve / Reject buttons */}
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(item.id, "APPROVED")}
                            className="flex items-center gap-1 px-4 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
                            title="Yorumu Onayla"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Onayla
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(item.id, "REJECTED")}
                            className="flex items-center gap-1 px-4 py-2 bg-orange-50 hover:bg-amber-600 text-red-700 hover:text-white border border-amber-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
                            title="Yorumu Reddet"
                          >
                            <XCircle className="w-4 h-4" /> Reddet
                          </button>
                        </>
                      )}

                      {/* Approved items toggle reject */}
                      {item.status === 'APPROVED' && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "REJECTED")}
                          className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-amber-600 text-slate-500 hover:text-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
                          title="Reddetme Listesine Taşı"
                        >
                          <XCircle className="w-4 h-4" /> Reddet
                        </button>
                      )}

                      {/* Rejected items toggle approve */}
                      {item.status === 'REJECTED' && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "APPROVED")}
                          className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-emerald-600 text-slate-500 hover:text-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
                          title="Onaylı Listesine Geri Al"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Onayla
                        </button>
                      )}

                      {/* Reply drawer activator */}
                      <button
                        onClick={() => {
                          setReplyingTo(item);
                          setReplyText(item.reply || "");
                        }}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
                        title="Yanıt Ekle / Düzenle"
                      >
                        <Reply className="w-4 h-4" /> Yanıtla
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-orange-50 border border-transparent hover:border-amber-200 rounded-xl transition-all"
                        title="Geri Bildirimi Kalıcı Olarak Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Reply Modal / Overlay Drawer */}
      {replyingTo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[500px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-8 pb-6 text-center bg-slate-900 text-white relative">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <Reply className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-xl font-extrabold uppercase tracking-widest">Cevap Yazın</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  YAZAN: {replyingTo.name.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleReplySubmit} className="p-8 space-y-6">
              
              {/* Original Review Card Preview */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Müşteri Yorumu</p>
                <p className="text-slate-600 text-xs italic font-medium leading-relaxed">
                  "{replyingTo.message}"
                </p>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yanıt Mesajınız</label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Müşteriye iletilecek profesyonel cevabınızı yazın..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs text-slate-800 transition-all focus:bg-white focus:border-orange-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {submittingReply ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Gönder & Onayla <Send className="w-4.5 h-4.5" /></>
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

