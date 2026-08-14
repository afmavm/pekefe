"use client";

import { useState, useEffect } from "react";
import { 
  History, Search, Eye, Filter, CheckCircle2, XCircle, AlertCircle, Clock,
  RefreshCw, X, ChevronLeft, ChevronRight, Calendar, AlertTriangle, Send
} from "lucide-react";
import { toast } from "sonner";

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  bodyHtml: string;
  eventType: string | null;
  status: string;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function EmailHistoryPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Preview Modal State
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, eventFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "15");
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (eventFilter) params.append("eventType", eventFilter);

      const res = await fetch(`/api/admin/email-history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
      }
    } catch (error: any) {
      console.error("Error loading email history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setEventFilter("");
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#b45309]" /> E-posta Gönderim Geçmişi & Logları
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Arka planda gönderilen tüm e-postaları, kuyruktaki bildirimleri ve hata kayıtlarını inceleyin.
          </p>
        </div>
        <button
          onClick={() => { setPage(1); fetchLogs(); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Alıcı adresi veya konu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b45309] text-xs font-semibold text-slate-800"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b45309] text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="">Tüm Durumlar</option>
              <option value="SUCCESS">Başarılı (SUCCESS)</option>
              <option value="FAILED">Hatalı (FAILED)</option>
              <option value="PENDING">Kuyrukta (PENDING)</option>
            </select>
          </div>

          {/* Event Filter */}
          <div>
            <select
              value={eventFilter}
              onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b45309] text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="">Tüm Olay Tipleri</option>
              <option value="WELCOME">Hoş Geldiniz (WELCOME)</option>
              <option value="PASSWORD_RESET">Parola Sıfırlama (PASSWORD_RESET)</option>
              <option value="ORDER_CONFIRMED">Sipariş Alındı (ORDER_CONFIRMED)</option>
              <option value="ORDER_SHIPPED">Kargo Gönderildi (ORDER_SHIPPED)</option>
              <option value="B2B_APPROVED">Cari/Bayi Onayı (B2B_APPROVED)</option>
            </select>
          </div>
        </form>

        {(search || statusFilter || eventFilter) && (
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-semibold">Filtrelere göre gösteriliyor.</div>
            <button
              onClick={handleClearFilters}
              className="text-xs text-[#b45309] hover:underline font-bold cursor-pointer"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[#b45309]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-3">Geçmiş veriler yükleniyor...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <History className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Gönderim Kaydı Bulunamadı</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              Henüz bir e-posta gönderim kaydı oluşmamıştır. E-posta Şablonları sayfasından test gönderimi gerçekleştirebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-200">
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3">Alıcı E-Posta</th>
                  <th className="px-5 py-3">Olay Tipi</th>
                  <th className="px-5 py-3">Konu Başlığı</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3">Tekrar</th>
                  <th className="px-5 py-3 text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-500">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {log.recipient}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {log.eventType ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-mono uppercase">
                          {log.eventType}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Manuel</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 max-w-xs truncate font-medium text-slate-700" title={log.subject}>
                      {log.subject}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {log.status === "SUCCESS" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Başarılı
                        </span>
                      )}
                      {log.status === "FAILED" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-red-600" /> Hata
                        </span>
                      )}
                      {log.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Kuyrukta
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-[11px] font-mono">
                      {log.retryCount > 0 ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {log.retryCount} Deneme
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-amber-100 hover:text-amber-900 text-slate-600 rounded-xl transition cursor-pointer"
                        title="İçeriği İncele"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-bold">
              Toplam <strong>{pagination.total}</strong> kayıttan <strong>{((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)}</strong> arası gösteriliyor.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 rounded-xl hover:bg-white bg-slate-50 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-1.5 border border-slate-200 rounded-xl hover:bg-white bg-slate-50 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Preview Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">E-posta Gönderim Detayı</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Gönderilen nihai HTML çıktısı ve gönderim kayıt detayları.</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {selectedLog.status === "FAILED" && selectedLog.errorMessage && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-2.5 text-red-800 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-red-900 uppercase">Hata Ayrıntısı</h4>
                    <p className="font-mono text-[11px] mt-1 whitespace-pre-wrap">{selectedLog.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Meta Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-semibold">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alıcı E-posta</span>
                  <span className="text-xs font-bold text-slate-900">{selectedLog.recipient}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Olay / Şablon Tipi</span>
                  <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-mono uppercase font-bold inline-block">
                    {selectedLog.eventType || "Belirtilmemiş"}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Konu Başlığı</span>
                  <span className="text-xs font-bold text-slate-900">{selectedLog.subject}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gönderim Tarihi</span>
                  <span className="text-xs text-slate-700">{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Log Kayıt ID</span>
                  <span className="text-xs text-slate-500 font-mono">{selectedLog.id}</span>
                </div>
              </div>

              {/* Email Body Iframe Preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase block">Gönderilen HTML İçerik</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-[300px]">
                  <iframe
                    srcDoc={selectedLog.bodyHtml}
                    title="Email Log Preview"
                    className="w-full h-full bg-white"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
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
