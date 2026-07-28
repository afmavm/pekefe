import { Suspense } from "react";
import MarketplaceDashboard from "@/modules/marketplace/components/MarketplaceDashboard";
import { getMarketplaceData } from "@/modules/marketplace/server/integrationActions";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const data = await getMarketplaceData();

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-xs text-slate-400 font-semibold">Entegrasyonlar Yükleniyor...</p>
      </div>
    }>
      <MarketplaceDashboard
        initialIntegrations={data.integrations}
        initialLogs={data.logs}
      />
    </Suspense>
  );
}

