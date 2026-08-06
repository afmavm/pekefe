"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the Premium Order Command Center with an elegant skeleton loader
const OrderCommandCenter = dynamic(
  () => import("@/modules/orders/components/OrderCommandCenter"),
  {
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[450px] p-6 space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Sipariş Yönetim Merkezi Yükleniyor...</span>
      </div>
    ),
    ssr: false
  }
);

export default function AdminOrdersPage() {
  return <OrderCommandCenter />;
}

