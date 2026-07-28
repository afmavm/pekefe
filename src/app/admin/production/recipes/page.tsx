import React, { Suspense } from "react";
import { getProductionData } from "@/modules/production/server/productionActions";
import RecipesClient from "./RecipesClient";
import { AlertCircle, Loader2, Hammer } from "lucide-react";
import UpgradeGate from "@/components/UpgradeGate";

export const metadata = {
  title: "Ürün Reçeteleri (BOM) | Atak Arıcılık Yönetim Paneli",
  description: "Malzeme ürün ağaçları (BOM), hammadde ve yarı mamul reçete oranları.",
};

export default async function RecipesPage() {
  const result = await getProductionData();

  if (!result.success || !result.data) {
    const isFeatureDisabled = 
      result.error?.includes("modülü aktif değil") || 
      result.error?.includes("yetkiniz bulunmamaktadır") ||
      result.error?.includes("Erişim engellendi");

    if (isFeatureDisabled) {
      return (
        <UpgradeGate 
          moduleName="Üretim & MRP" 
          moduleKey="production"
          icon={Hammer}
          description="Üretim planlama, ürün reçeteleri (BOM), iş istasyonları ve imalat emirleri gibi gelişmiş planlama modülünü kullanabilmek için şirketinizi PRO pakete yükseltebilirsiniz."
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 border border-red-100 rounded-2xl max-w-xl mx-auto my-12 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Yükleme Hatası</h2>
        <p className="text-xs text-slate-500 mt-2">
          {result.error || "Reçete verileri yüklenirken bir hata oluştu."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reçeteler Yükleniyor...</p>
          </div>
        }
      >
        <RecipesClient initialData={result.data} />
      </Suspense>
    </div>
  );
}

