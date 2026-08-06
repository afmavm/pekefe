import { Suspense } from "react";
import { MonitorPlay, Loader2 } from "lucide-react";
import { getCmsSettingsAndPages } from "@/modules/cms/server/cmsActions";
import VisualBuilderContainer from "@/modules/cms/builder/workspace-container";

export const dynamic = "force-dynamic";

export default async function SiteEditorPage() {
  const { cmsData, pages } = await getCmsSettingsAndPages();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
            <MonitorPlay className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Website Builder</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Görsel sayfa ve tema düzenleme modülü.
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">
            Tasarım stüdyosu yükleniyor...
          </p>
        </div>
      }>
        <VisualBuilderContainer initialCmsData={cmsData} initialPages={pages} />
      </Suspense>
    </div>
  );
}


