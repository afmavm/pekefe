"use client";

import Image from "next/image";
import { Activity, CheckCircle2, XCircle, Terminal, KeyRound, RefreshCw, Loader2, Trash2 } from "lucide-react";
import { Integration } from "../types";

const MARKETPLACE_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Trendyol: { bg: "bg-orange-50/50", text: "text-orange-700", border: "border-orange-200", accent: "bg-orange-600 hover:bg-orange-700" },
  Hepsiburada: { bg: "bg-orange-50/50", text: "text-orange-600", border: "border-amber-200", accent: "bg-amber-600 hover:bg-amber-700" },
  N11: { bg: "bg-blue-50/50", text: "text-blue-700", border: "border-blue-200", accent: "bg-blue-600 hover:bg-blue-700" },
  "XML Tedarikçi": { bg: "bg-purple-50/50", text: "text-purple-700", border: "border-purple-200", accent: "bg-purple-600 hover:bg-purple-700" },
};

interface SyncMonitorProps {
  integrations: Integration[];
  syncingId: string | null;
  onSync: (integration: Integration) => void;
  onOpenSettings: (integration: Integration) => void;
  onToggleLogs: (integrationId: string) => void;
  expandedLogId: string | null;
  logs: any[];
  onDeleteTrigger: (id: string, name: string) => void;
}

export default function SyncMonitor({
  integrations,
  syncingId,
  onSync,
  onOpenSettings,
  onToggleLogs,
  expandedLogId,
  logs,
  onDeleteTrigger
}: SyncMonitorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {integrations.map((integration) => {
        const isActive = integration.status === "ACTIVE";
        const isSyncing = syncingId === integration.id;
        const colors = MARKETPLACE_COLORS[integration.name] || {
          bg: "bg-slate-50/50",
          text: "text-slate-700",
          border: "border-slate-200",
          accent: "bg-slate-800 hover:bg-slate-900"
        };

        const integrationLogs = logs.filter(l => l.integrationId === integration.id);
        const isLogOpen = expandedLogId === integration.id;

        return (
          <div
            key={integration.id}
            className={`bg-white border ${colors.border} rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
          >
            <div>
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center overflow-hidden p-2 shadow-sm relative">
                  <Image
                    src={integration.logo}
                    alt={integration.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Aktif
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-350" />
                        Pasif
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteTrigger(integration.id, integration.name)}
                    className="p-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                    title="Kanalı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Desc */}
              <h3 className="text-lg font-black text-slate-900">{integration.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                {integration.type} Entegrasyonu
              </p>

              {/* Details & Settings info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>Son Eşitleme: </span>
                  <strong className="text-slate-800">{integration.lastSync || "—"}</strong>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {integration.settings?.autoSync !== false && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded border border-emerald-100">
                      Stok Otomatik Eşitle ✓
                    </span>
                  )}
                  {integration.settings?.autoPriceSync && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded border border-blue-100">
                      Fiyat Otomatik Eşitle ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sync Logs Panel */}
            {isLogOpen && (
              <div className="mb-4 bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-850">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Konsol Günlükleri
                  </span>
                  <span className="text-[9px] font-semibold text-slate-600">Son 10 Kayıt</span>
                </div>
                <div className="p-3 max-h-36 overflow-y-auto space-y-1 font-mono text-[9px] text-slate-300">
                  {integrationLogs.length === 0 ? (
                    <div className="text-slate-500 italic py-2 text-center">Günlük kaydı bulunamadı.</div>
                  ) : (
                    integrationLogs.slice(0, 10).map((log: any) => (
                      <div key={log.id} className="flex gap-2 leading-relaxed">
                        <span className="text-slate-600 shrink-0">{log.time}</span>
                        <span
                          className={
                            log.status === "ok"
                              ? "text-emerald-400"
                              : log.status === "err"
                              ? "text-red-400"
                              : "text-blue-400"
                          }
                        >
                          {log.status === "ok" ? "✓" : log.status === "err" ? "✗" : "i"} {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenSettings(integration)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition border border-slate-200/80 flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Ayarlar
              </button>
              <button
                type="button"
                onClick={() => onToggleLogs(integration.id)}
                className={`px-3 py-2.5 rounded-xl border transition flex items-center justify-center ${
                  isLogOpen
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500"
                }`}
                title="Logları Göster/Gizle"
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSync(integration)}
                disabled={!isActive || isSyncing}
                className={`flex-1 py-2.5 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${colors.accent}`}
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {isSyncing ? "Eşitleniyor" : "Senkronize Et"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
