import React, { Suspense } from "react";
import CariPage from "../muhasebe/cari/page";

export const metadata = {
  title: "Cari Hesaplar & Bayi Yönetimi | Pekefe Yönetim Paneli",
  description: "B2B bayi ve müşteri cari kartları, risk limitleri, özel fiyatlandırma formülleri, B2B yetkilendirme ve sadakat puanı yönetimi.",
};

export default function AdminDealersPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-6 text-xs text-slate-500 font-bold uppercase tracking-widest">Yükleniyor...</div>}>
        <CariPage />
      </Suspense>
    </div>
  );
}

