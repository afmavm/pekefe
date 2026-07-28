"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, RefreshCw, Eye, X, HelpCircle, Loader2 } from "lucide-react";
import { IntegrationLog, Integration } from "../types";

interface FailedSyncRetryQueueProps {
  logs: IntegrationLog[];
  integrations: Integration[];
  onRetry: (logId: string) => Promise<void>;
}

export default function FailedSyncRetryQueue({
  logs,
  integrations,
  onRetry
}: FailedSyncRetryQueueProps) {
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Filter logs with "err" status
  const errorLogs = logs.filter((log) => log.status === "err");

  const handleRetryClick = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingId(logId);
    try {
      await onRetry(logId);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-950">Hatalı Senkronizasyon &amp; Yeniden Deneme Kuyruğu</h3>
          <p className="text-xs text-slate-400 mt-0.5">Senkronizasyonu başarısız olan isteklerin detaylarını inceleyin ve manuel olarak yeniden tetikleyin.</p>
        </div>
      </div>

      {errorLogs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <HelpCircle className="w-12 h-12 text-slate-200 mb-2" />
          <p className="text-sm font-bold text-slate-700">Bekleyen Hata Bulunmuyor</p>
          <p className="text-xs text-slate-400 mt-1">Tüm entegrasyonlar stabil çalışıyor.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-3 px-4">Kanal</th>
                <th className="py-3 px-4">Zaman</th>
                <th className="py-3 px-4">Hata Açıklaması</th>
                <th className="py-3 px-4 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {errorLogs.map((log) => {
                const integration = integrations.find((i) => i.id === log.integrationId);
                const isRetrying = retryingId === log.id;

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        {integration?.logo ? (
                          <div className="w-7 h-7 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shrink-0 relative">
                            <Image src={integration.logo} alt={integration.name} width={28} height={28} className="object-contain" />
                          </div>
                        ) : null}
                        <span className="text-xs font-black text-slate-900">{integration?.name || "Bilinmeyen Entegrasyon"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {log.time}
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-red-600 max-w-xs truncate">
                      {log.message}
                    </td>
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 transition-colors"
                          title="Detayları İncele"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRetryClick(log.id, e)}
                          disabled={isRetrying}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm shadow-red-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                        >
                          {isRetrying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          Tekrar Dene
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Logs Inspection Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-250">
            <div>
              {/* Drawer Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Entegrasyon Hata Denetimi</h3>
                  <p className="text-[10px] font-bold text-red-600 uppercase mt-0.5 tracking-wider">Durum: Senkronizasyon Hatası</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="space-y-5">
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 font-semibold leading-relaxed">
                    {selectedLog.message}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem Detayları</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Hata Kimliği (Log ID):</span>
                      <span className="font-mono font-bold text-slate-800 text-[10px]">{selectedLog.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Entegrasyon ID:</span>
                      <span className="font-mono font-bold text-slate-800 text-[10px]">{selectedLog.integrationId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Zaman Damgası:</span>
                      <span className="font-bold text-slate-800">{selectedLog.time}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simüle Edilen İstek Gövdesi (Payload)</h4>
                  <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl font-mono text-[10px] overflow-auto max-h-52 leading-relaxed">
{JSON.stringify({
  action: "SyncOrders",
  timestamp: selectedLog.createdAt,
  status: "FAILED",
  retry_count: 1,
  payload: {
    channelId: selectedLog.integrationId,
    api_endpoint: "https://api.integration.channel/v2/orders",
    error_code: "CONN_TIMEOUT",
    suggested_fix: "API anahtarlarınızı güncelleyin ve bağlantı testi yapın."
  }
}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={(e) => {
                  handleRetryClick(selectedLog.id, e);
                  setSelectedLog(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow-md shadow-red-200"
              >
                Yeniden Dene
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
