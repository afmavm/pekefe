"use client";

import { useState, useEffect } from "react";
import { 
  History, Search, Eye, Filter, CheckCircle2, XCircle, AlertCircle, Clock,
  RefreshCw, X, ChevronLeft, ChevronRight, Calendar, AlertTriangle
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
      if (!res.ok) throw new Error("Gönderim geçmişi yüklenemedi.");
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <History className="w-7 h-7 text-amber-600" />
            E-posta Gönderim Geçmişi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Arka planda gönderilen tüm e-postaları, kuyruktaki işlemleri ve hata loglarını buradan takip edebilirsiniz.
          </p>
        </div>
        <button
          onClick={() => { setPage(1); fetchLogs(); }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-amber-500 hover:text-amber-700 bg-white text-gray-700 rounded-xl text-sm font-semibold transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Alıcı adresi veya konu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
            >
              <option value="">Tüm Olay Tipleri</option>
              <option value="welcome">Hoş Geldiniz (welcome)</option>
              <option value="forgot_password">Parola Sıfırlama (forgot_password)</option>
              <option value="password_changed">Parola Değişti (password_changed)</option>
              <option value="order_received">Sipariş Alındı (order_received)</option>
              <option value="order_completed">Sipariş Tamamlandı (order_completed)</option>
              <option value="cargo_shipped">Kargo Gönderildi (cargo_shipped)</option>
              <option value="reconciliation_request">Cari Mutabakat (reconciliation_request)</option>
            </select>
          </div>
        </form>

        {(search || statusFilter || eventFilter) && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-50">
            <div className="text-xs text-gray-500">Aktif filtreler devrededir.</div>
            <button
              onClick={handleClearFilters}
              className="text-xs text-amber-600 hover:text-amber-800 font-semibold"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
            <p className="text-gray-500 text-sm mt-4">Geçmiş veriler yükleniyor...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Gönderim Kaydı Yok</h3>
            <p className="text-gray-500 text-sm mt-1">Herhangi bir gönderim geçmişi kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Tarih</th>
                  <th className="px-6 py-4">Alıcı</th>
                  <th className="px-6 py-4">Şablon / Event</th>
                  <th className="px-6 py-4">Konu</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4">Tekrar Sayısı</th>
                  <th className="px-6 py-4 text-right">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {formatDate(log.createdAt)}
                    </td>

                    {/* Recipient */}
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {log.recipient}
                    </td>

                    {/* Event Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.eventType ? (
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100 rounded-md">
                          {log.eventType}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Manuel / Özel</span>
                      )}
                    </td>

                    {/* Subject */}
                    <td className="px-6 py-4 max-w-xs truncate font-medium text-gray-600" title={log.subject}>
                      {log.subject}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === "SUCCESS" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Başarılı
                        </span>
                      )}
                      {log.status === "FAILED" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Hata
                        </span>
                      )}
                      {log.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Kuyrukta
                        </span>
                      )}
                    </td>

                    {/* Retry count */}
                    <td className="px-6 py-4 text-xs font-mono">
                      {log.retryCount > 0 ? (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {log.retryCount} kez denendi
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-gray-100 hover:text-amber-700 text-gray-600 rounded-lg transition-colors"
                        title="İçeriği İncele"
                      >
                        <Eye className="w-4.5 h-4.5" />
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
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Toplam <strong>{pagination.total}</strong> kayıttan <strong>{((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)}</strong> arası gösteriliyor.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-700 px-2">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-white bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Preview Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">E-posta Gönderim Detayı</h2>
                <p className="text-xs text-gray-500 mt-1">Gönderilen nihai HTML çıktısı aşağıda listelenmiştir.</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Status Banner */}
              {selectedLog.status === "FAILED" && selectedLog.errorMessage && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">Hata Ayrıntısı</h4>
                    <p className="text-xs text-rose-700/90 font-mono mt-1 whitespace-pre-wrap">{selectedLog.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Meta Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Alıcı E-posta</span>
                  <span className="text-sm font-bold text-gray-900">{selectedLog.recipient}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Olay / Şablon Tipi</span>
                  <span className="text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-semibold inline-block">
                    {selectedLog.eventType || "Belirtilmemiş"}
                  </span>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Konu Başlığı</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedLog.subject}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gönderim Tarihi</span>
                  <span className="text-xs text-gray-600">{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Log Kimliği</span>
                  <span className="text-xs text-gray-500 font-mono">{selectedLog.id}</span>
                </div>
              </div>

              {/* Email Body Iframe Preview */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">Gönderilen İçerik Önizlemesi</label>
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-100 min-h-[300px] h-[350px]">
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
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
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

