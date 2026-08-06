import { getTransfersData } from "@/modules/inventory/server/inventoryActions";
import { ArrowLeftRight, Truck } from "lucide-react";
import TransfersClient from "./TransfersClient";

export const metadata = {
  title: "Depolar Arası Transfer | Pekefe ERP",
  description: "In-Transit transfer yönetimi: Taslak → Yolda → Tamamlandı akışı.",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    warehouseId?: string;
    page?: string;
  }>;
}

export default async function TransfersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  
  const result = await getTransfersData({
    status: sp.status,
    warehouseId: sp.warehouseId,
    page,
  });

  const data = result.data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-orange-500" />
              Depolar Arası Transfer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              In-Transit akış yönetimi: Taslak → Yolda → Tamamlandı
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <Truck className="w-3.5 h-3.5" />
              Yolda: {data?.transfers?.filter((t: any) => t.status === "Yolda").length || 0} transfer
            </div>
          </div>
        </div>
      </div>

      {/* Transfer akışı açıklaması */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Transfer Akışı</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Taslak", color: "bg-slate-100 text-slate-600", desc: "Oluşturuldu, onay bekliyor" },
            { label: "→", color: "", desc: "" },
            { label: "Yolda", color: "bg-amber-100 text-amber-700", desc: "Stok kaynaktan düşüldü" },
            { label: "→", color: "", desc: "" },
            { label: "Tamamlandı", color: "bg-emerald-100 text-emerald-700", desc: "Hedefe stok eklendi" },
            { label: "|", color: "", desc: "" },
            { label: "Reddedildi", color: "bg-red-100 text-red-700", desc: "Stok iade edildi" },
          ].map((step, i) => (
            step.label === "→" || step.label === "|" ? (
              <span key={i} className="text-slate-300 font-bold text-sm">{step.label}</span>
            ) : (
              <div key={i} className="flex flex-col items-start">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${step.color}`}>{step.label}</span>
                {step.desc && <span className="text-[9px] text-slate-400 mt-0.5 max-w-[100px]">{step.desc}</span>}
              </div>
            )
          ))}
        </div>
      </div>

      {!result.success ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-red-600">{result.error || "Veri yüklenemedi."}</p>
        </div>
      ) : (
        <TransfersClient
          transfers={data?.transfers || []}
          warehouses={data?.warehouses || []}
          products={data?.products || []}
          total={data?.total || 0}
          page={data?.page || 1}
          pageSize={data?.pageSize || 20}
        />
      )}
    </div>
  );
}

