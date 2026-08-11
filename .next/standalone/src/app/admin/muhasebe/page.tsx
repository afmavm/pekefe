import React, { Suspense } from "react";
import { getAccountingData } from "@/modules/accounting/server/accountingActions";
import AccountingDashboard from "@/modules/accounting/components/AccountingDashboard";
import { AlertCircle, Loader2 } from "lucide-react";

export const metadata = {
  title: "Ön Muhasebe & Defter | Pekefe Yönetim Paneli",
  description: "Genel yevmiye fişleri, banka hesapları, B2B fatura tahsilat mutabakatı ve bütçe planlaması.",
};

export default async function MuhasebeDashboardPage() {
  const result = await getAccountingData();

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50/50  border border-red-100  rounded-2xl max-w-xl mx-auto my-12 text-center">
        <div className="w-12 h-12 bg-red-100  text-red-700 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-black text-gray-800  uppercase tracking-wider">Erişim veya Yükleme Hatası</h2>
        <p className="text-xs text-gray-500  mt-2">
          {result.error || "Muhasebe verileri yüklenirken bilinmeyen bir hata oluştu."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#b45309]" />
            <p className="text-xs font-black text-gray-450 uppercase tracking-widest">Ön Muhasebe Paneli Yükleniyor...</p>
          </div>
        }
      >
        <AccountingDashboard initialData={result.data} />
      </Suspense>
    </div>
  );
}

