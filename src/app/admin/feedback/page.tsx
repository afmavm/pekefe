"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  MessageSquare, Star, Trash2, CheckCircle2, XCircle, 
  Send, Reply, Loader2, Search, Filter, AlertCircle, Sparkles,
  Inbox, TrendingUp, ThumbsUp, RefreshCw
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
    setLoading(true);
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
        toast.success(newStatus === "APPROVED" ? "Yorum onaylandı ve yayına alındı." : "Yorum reddedildi.");
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
        body: JSON.stringify({ reply: replyText, status: "APPROVED" })
      });

      if (res.ok) {
        toast.success("Yanıtınız eklendi ve yorum onaylandı.");
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
    if (!confirm("Bu geri bildirimi silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Geri bildirim silindi.");
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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#b45309]" /> Müşteri Yorumları & Geri Bildirim Merkezi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ziyaretçi ve müşterilerden gelen ürün değerlendirmelerini inceleyin, yanıtlayın ve yayınlayın.
          </p>
        </div>
        <button
          onClick={fetchFeedbacks}
          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Toplam Yorum</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-xs font-semibold text-slate-400">Adet</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-slate-500">
            <Inbox className="w-4 h-4 text-slate-400" />
            <span>Gelen kutusu hacmi</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Onay Bekleyenler</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-amber-700 flex items-center gap-2">
              {metrics.pending}
            </span>
            <span className="text-xs font-semibold text-slate-400">Beklemede</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-slate-500">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>İnceleme gerektirenler</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ortalama Puan</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-emerald-700 flex items-center gap-1.5">
              {metrics.avgRating} <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-slate-500">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Müşteri memnuniyeti</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Yanıtlanma Oranı</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-blue-600">%{metrics.replyRate}</span>
            <span className="text-xs font-semibold text-slate-400">Cevaplandı</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-slate-500">
            <ThumbsUp className="w-4 h-4 text-blue-500" />
            <span>Marka etkileşimi</span>
          </div>
        </div>

      </div>

      {/* Main Workspace Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        
        {/* Controls Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-center gap-4">
          
          {/* Tab buttons */}
          <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
            {[
              { id: "ALL", label: "TÜMÜ", count: metrics.total },
              { id: "PENDING", label: "BEKLEYENLER", count: metrics.pending },
              { id: "APPROVED", label: "ONAYLI", count: metrics.approved },
              { id: "REJECTED", label: "REDDEDİLENLER", count: feedbacks.filter(f => f.status === "REJECTED").length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id 
                    ? "bg-[#b45309] text-white shadow-xs" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İsim, email veya mesaj..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#b45309]"
              />
            </div>

            {/* Rating Dropdown */}
            <div className="relative flex items-center border border-slate-200 rounded-xl bg-white px-3 py-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
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
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Geri bildirimler çekiliyor...</p>
          </div>
        ) : (
          <div className="p-5">
            {filteredFeedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <Inbox className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Geri Bildirim Bulunamadı</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto font-medium">
                    Filtrelere veya arama kriterinize uygun herhangi bir yorum bulunmamaktadır.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedbacks.map(item => (
                  <div 
                    key={item.id} 
                    className={`bg-white border rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-start justify-between gap-5 hover:border-amber-300 shadow-xs ${
                      item.status === 'PENDING' ? 'border-amber-200 bg-amber-50/20' :
                      item.status === 'REJECTED' ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200'
                    }`}
                  >
                    
                    {/* Main Content Info */}
                    <div className="space-y-2.5 max-w-3xl flex-1">
                      
                      {/* Top row metadata */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-extrabold text-sm text-slate-900">{item.name}</span>
                        <span className="text-xs font-semibold text-slate-400">{item.email}</span>
                        <span className="text-xs text-slate-400 font-medium">• {new Date(item.createdAt).toLocaleDateString("tr-TR", { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        {/* Status badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'PENDING' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {item.status === 'PENDING' ? 'Beklemede' :
                           item.status === 'APPROVED' ? 'Yayında (Onaylı)' : 'Reddedildi'}
                        </span>
                      </div>

                      {/* Stars rating visual */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${
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
                        <div className="mt-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-[#b45309] text-[10px] font-bold">
                            <Sparkles className="w-3.5 h-3.5" /> Pekefe Yönetici Yanıtı
                          </div>
                          <p className="text-slate-700 text-xs italic font-medium">
                            "{item.reply}"
                          </p>
                        </div>
                      ) : (
                        item.status === "PENDING" && (
                          <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Bu yoruma henüz yanıt verilmedi. Yanıt yazarak anında onaylayabilirsiniz.
                          </p>
                        )
                      )}

                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      
                      {/* Approve / Reject buttons */}
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(item.id, "APPROVED")}
                            className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            title="Yorumu Onayla"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Onayla
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(item.id, "REJECTED")}
                            className="flex items-center gap-1 px-3.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            title="Yorumu Reddet"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reddet
                          </button>
                        </>
                      )}

                      {/* Approved items toggle reject */}
                      {item.status === 'APPROVED' && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "REJECTED")}
                          className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 hover:bg-red-600 text-slate-600 hover:text-white border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          title="Reddetme Listesine Taşı"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reddet
                        </button>
                      )}

                      {/* Rejected items toggle approve */}
                      {item.status === 'REJECTED' && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "APPROVED")}
                          className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          title="Onaylı Listesine Geri Al"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Onayla
                        </button>
                      )}

                      {/* Reply drawer activator */}
                      <button
                        onClick={() => {
                          setReplyingTo(item);
                          setReplyText(item.reply || "");
                        }}
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Yanıt Ekle / Düzenle"
                      >
                        <Reply className="w-3.5 h-3.5" /> Yanıtla
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition cursor-pointer"
                        title="Geri Bildirimi Kalıcı Olarak Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-6 text-center bg-slate-900 text-white relative">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Reply className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider">Müşteriye Yanıt Yazın</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  ALICI: {replyingTo.name.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleReplySubmit} className="p-6 space-y-4">
              
              {/* Original Review Card Preview */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Müşteri Yorumu</p>
                <p className="text-slate-600 text-xs italic font-medium leading-relaxed">
                  "{replyingTo.message}"
                </p>
              </div>

              {/* Text Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Kurumsal Yanıtınız</label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Müşteriye iletilecek nazik ve profesyonel yanıtınızı yazın..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-xs text-slate-800 transition focus:bg-white focus:border-[#b45309]"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="flex-1 py-3 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submittingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Gönder & Onayla <Send className="w-4 h-4" /></>
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
