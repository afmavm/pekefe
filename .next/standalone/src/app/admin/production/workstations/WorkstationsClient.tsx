"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  createWorkstationAction, 
  deleteWorkstationAction, 
  createRouteStepAction, 
  deleteRouteStepAction 
} from "@/modules/production/server/productionActions";
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Cpu, 
  GitCommit, 
  Settings,
  Clock
} from "lucide-react";

interface WorkstationsClientProps {
  initialData: any;
}

export default function WorkstationsClient({ initialData }: WorkstationsClientProps) {
  const [workstations, setWorkstations] = useState<any[]>(initialData.workstations || []);
  const [routeSteps, setRouteSteps] = useState<any[]>(initialData.routeSteps || []);
  const [loading, setLoading] = useState(false);

  // Workstation Form
  const [wsName, setWsName] = useState("");
  const [wsCode, setWsCode] = useState("");
  const [wsCapacity, setWsCapacity] = useState(8);
  const [wsUnit, setWsUnit] = useState("SAAT/GUN");

  // Route Step Form
  const [routeProductId, setRouteProductId] = useState("");
  const [routeStepNum, setRouteStepNum] = useState(1);
  const [routeStepName, setRouteStepName] = useState("");
  const [routeWorkstationId, setRouteWorkstationId] = useState("");
  const [routeSetupTime, setRouteSetupTime] = useState(10);
  const [routeRunTime, setRouteRunTime] = useState(5);

  const handleCreateWorkstation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName || !wsCode || wsCapacity <= 0) {
      toast.error("Lütfen istasyon adı, kodu ve geçerli kapasite değerini doldurun.");
      return;
    }

    setLoading(true);
    try {
      const res = await createWorkstationAction({
        name: wsName,
        code: wsCode.toUpperCase(),
        capacity: wsCapacity,
        unit: wsUnit
      });

      if (res.success && res.data) {
        toast.success("İş istasyonu eklendi.");
        setWorkstations([...workstations, res.data]);
        setWsName("");
        setWsCode("");
        setWsCapacity(8);
      } else {
        toast.error(res.error || "İstasyon eklenirken hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkstation = async (id: string) => {
    if (!confirm("Bu iş istasyonunu silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await deleteWorkstationAction(id);
      if (res.success) {
        toast.success("İş istasyonu silindi.");
        setWorkstations(workstations.filter(w => w.id !== id));
      } else {
        toast.error(res.error || "Silinemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası.");
    }
  };

  const handleCreateRouteStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeProductId || !routeStepName || !routeWorkstationId || routeStepNum <= 0) {
      toast.error("Lütfen ürün, adım numarası, operasyon adı ve iş istasyonunu seçin.");
      return;
    }

    setLoading(true);
    try {
      const res = await createRouteStepAction({
        productId: routeProductId,
        stepNumber: routeStepNum,
        name: routeStepName,
        workstationId: routeWorkstationId,
        setupTime: routeSetupTime,
        runTime: routeRunTime
      });

      if (res.success && res.data) {
        toast.success("Operasyon rota adımı eklendi.");
        
        // Refresh local routeSteps
        const newStep = {
          ...res.data,
          product: initialData.finishedGoods.find((p: any) => p.id === routeProductId),
          workstation: workstations.find(w => w.id === routeWorkstationId)
        };
        setRouteSteps([...routeSteps, newStep]);
        
        // Reset
        setRouteStepName("");
        setRouteStepNum(prev => prev + 1);
      } else {
        toast.error(res.error || "Rota adımı eklenirken hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRouteStep = async (id: string) => {
    if (!confirm("Bu rota adımını silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await deleteRouteStepAction(id);
      if (res.success) {
        toast.success("Rota adımı silindi.");
        setRouteSteps(routeSteps.filter(s => s.id !== id));
      } else {
        toast.error(res.error || "Silinemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası.");
    }
  };

  // Group route steps by product
  const productsWithRoutes = initialData.finishedGoods.filter((prod: any) => 
    routeSteps.some(step => step.productId === prod.id)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Sliders className="w-8 h-8 text-orange-500" />
            İŞ İSTASYONLARI & ROTALAR
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            İmalat makinelerinizi, kapasitelerini ve ürünlerin adım adım izleyeceği operasyon rotalarını yönetin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workstations Section */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              Yeni İş İstasyonu Ekle
            </h2>
            <form onSubmit={handleCreateWorkstation} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">İstasyon Adı</label>
                <input
                  type="text"
                  placeholder="Örn: CNC Kesim Tezgahı"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">İstasyon Kodu</label>
                <input
                  type="text"
                  placeholder="Örn: CNC-01"
                  value={wsCode}
                  onChange={(e) => setWsCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Kapasite</label>
                <input
                  type="number"
                  value={wsCapacity}
                  onChange={(e) => setWsCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Kapasite Birimi</label>
                <select
                  value={wsUnit}
                  onChange={(e) => setWsUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                >
                  <option value="SAAT/GUN">Saat / Gün</option>
                  <option value="ADET/SAAT">Adet / Saat</option>
                  <option value="kg/GUN">kg / Gün</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sm:col-span-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                İstasyonu Kaydet
              </button>
            </form>
          </div>

          {/* Workstations List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-700">Aktif İstasyonlar</h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {workstations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  İş istasyonu bulunmamaktadır.
                </div>
              ) : (
                workstations.map(ws => (
                  <div key={ws.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800">{ws.name}</div>
                        <div className="text-[10px] text-slate-400">Kod: {ws.code}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-700">{ws.capacity} {ws.unit}</div>
                        <div className="text-[10px] text-slate-400">Kapasite</div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteWorkstation(ws.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition"
                        title="İstasyonu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Route Steps Section */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              Ürün İmalat Rotası Oluştur
            </h2>
            <form onSubmit={handleCreateRouteStep} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Ürün / Mamul</label>
                  <select
                    value={routeProductId}
                    onChange={(e) => setRouteProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                  >
                    <option value="">-- Ürün Seçin --</option>
                    {initialData.finishedGoods.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">İş İstasyonu</label>
                  <select
                    value={routeWorkstationId}
                    onChange={(e) => setRouteWorkstationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                  >
                    <option value="">-- İstasyon Seçin --</option>
                    {workstations.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Adım Sıra No</label>
                  <input
                    type="number"
                    min={1}
                    value={routeStepNum}
                    onChange={(e) => setRouteStepNum(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Operasyon Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Hammadde Kesim ve Hazırlık"
                    value={routeStepName}
                    onChange={(e) => setRouteStepName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Hazırlık Süresi (Dk)</label>
                  <input
                    type="number"
                    value={routeSetupTime}
                    onChange={(e) => setRouteSetupTime(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">İşleme Süresi (Dk/Adet)</label>
                  <input
                    type="number"
                    value={routeRunTime}
                    onChange={(e) => setRouteRunTime(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Rota Adımını Ekle
              </button>
            </form>
          </div>

          {/* Rota Listeleri */}
          <div className="space-y-4">
            {productsWithRoutes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                Rotası oluşturulmuş mamul bulunmamaktadır.
              </div>
            ) : (
              productsWithRoutes.map((prod: any) => {
                const stepsForProd = routeSteps
                  .filter(s => s.productId === prod.id)
                  .sort((a, b) => a.stepNumber - b.stepNumber);

                return (
                  <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                      <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{prod.name} Rota Akışı</h3>
                    </div>
                    
                    <div className="divide-y divide-slate-100 text-slate-700">
                      {stepsForProd.map(step => (
                        <div key={step.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                              {step.stepNumber}
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-slate-800">{step.name}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Settings className="w-3 h-3 text-orange-500" />
                                İstasyon: {step.workstation?.name} ({step.workstation?.code})
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex gap-3 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                Hazırlık: {step.setupTime} dk
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                İşleme: {step.runTime} dk/ad
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteRouteStep(step.id)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition"
                              title="Adımı Rota'dan Çıkar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

