"use client";

import { useState, useEffect } from "react";
import { 
  Building, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Layers,
  CheckCircle2,
  XCircle,
  Users,
  Grid,
  Lock,
  Unlock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
  getCompaniesWithPermissionsAction, 
  getFeatureModulesAction, 
  toggleCompanyPermissionAction 
} from "@/modules/cms/super-admin/superActions";

interface FeatureModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface CompanyPermission {
  id: string;
  companyId: string;
  featureModuleId: string;
  isEnabled: boolean;
  featureModule: FeatureModule;
}

interface UserSummary {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface CompanyWithPermissions {
  id: string;
  name: string;
  taxNo: string | null;
  currency: string;
  isActive: boolean;
  permissions: CompanyPermission[];
  users: UserSummary[];
}

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<CompanyWithPermissions[]>([]);
  const [features, setFeatures] = useState<FeatureModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedCompanies, fetchedFeatures] = await Promise.all([
        getCompaniesWithPermissionsAction(),
        getFeatureModulesAction()
      ]);
      setCompanies((fetchedCompanies || []) as any);
      setFeatures((fetchedFeatures || []) as any);
    } catch (error: any) {
      console.error("Error loading super-admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (companyId: string, featureModuleId: string, currentStatus: boolean) => {
    const toggleKey = `${companyId}-${featureModuleId}`;
    setTogglingId(toggleKey);

    // Optimistic Update
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        const hasPermRecord = c.permissions.some(p => p.featureModuleId === featureModuleId);
        let updatedPermissions;
        
        if (hasPermRecord) {
          updatedPermissions = c.permissions.map(p => {
            if (p.featureModuleId === featureModuleId) {
              return { ...p, isEnabled: !currentStatus };
            }
            return p;
          });
        } else {
          const targetFeature = features.find(f => f.id === featureModuleId);
          updatedPermissions = [
            ...c.permissions,
            {
              id: `temp-${Date.now()}`,
              companyId,
              featureModuleId,
              isEnabled: !currentStatus,
              featureModule: targetFeature!
            }
          ];
        }
        return { ...c, permissions: updatedPermissions };
      }
      return c;
    }));

    try {
      const result = await toggleCompanyPermissionAction(companyId, featureModuleId, !currentStatus);
      if (result.success) {
        toast.success("Modül izin durumu güncellendi.");
      }
    } catch (error: any) {
      toast.error("İzin güncellenirken hata oluştu.");
      // Rollback on error
      setCompanies(prev => prev.map(c => {
        if (c.id === companyId) {
          return {
            ...c,
            permissions: c.permissions.map(p => {
              if (p.featureModuleId === featureModuleId) {
                return { ...p, isEnabled: currentStatus };
              }
              return p;
            })
          };
        }
        return c;
      }));
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.taxNo && company.taxNo.includes(searchTerm))
  );

  const totalCompanies = companies.length;
  const activeTogglesCount = companies.reduce((sum, c) => 
    sum + (c.permissions ? c.permissions.filter(p => p.isEnabled).length : 0), 0
  );
  const totalUsersCount = companies.reduce((sum, c) => sum + (c.users ? c.users.length : 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#b45309]" /> Süper Yönetici Kontrol &amp; Yetki Merkezi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Çoklu kiracı (SaaS) sistem ayarları ve şirket bazlı modül yetkilendirmesini (Feature Toggling) yönetin.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Kayıtlı Şirketler</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{totalCompanies}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <Building className="w-6 h-6 text-[#b45309]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Aktif Modül İzinleri</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{activeTogglesCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <Layers className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Kiracı Temsilcileri</p>
            <h3 className="text-3xl font-black text-blue-600 mt-1">{totalUsersCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        {/* Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Grid className="w-4 h-4 text-[#b45309]" /> Şirket Yetki Matrisi
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Şirket adı veya vergi no ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#b45309]"
            />
          </div>
        </div>

        {/* Loading / Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[#b45309]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-3">Veriler yükleniyor...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <Building className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Kriterlere uygun kayıtlı şirket bulunamadı.</p>
          </div>
        ) : (
          /* Company Cards List */
          <div className="space-y-6">
            {filteredCompanies.map((company) => (
              <div 
                key={company.id}
                className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-slate-300 shadow-xs transition"
              >
                {/* Company Title Info */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[#b45309]">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{company.name}</h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {company.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="text-[11px] px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {company.users ? company.users.length : 0} Kullanıcı
                    </div>
                    {company.taxNo && (
                      <div className="text-[11px] px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold">
                        VKN: {company.taxNo}
                      </div>
                    )}
                    <div className={`text-[11px] px-3 py-1 rounded-full font-bold flex items-center gap-1 ${
                      company.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {company.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Aktif Şirket
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          Pasif Şirket
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="pt-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Modül Erişim İzinleri</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {features.map((feature) => {
                      const permission = company.permissions ? company.permissions.find(p => p.featureModuleId === feature.id) : null;
                      const isEnabled = permission ? permission.isEnabled : false;
                      const isToggling = togglingId === `${company.id}-${feature.id}`;

                      return (
                        <div 
                          key={feature.id}
                          className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-3 ${
                            isEnabled 
                              ? 'bg-amber-50/40 border-amber-200' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-xs text-slate-800">{feature.name}</span>
                              {isEnabled ? (
                                <Unlock className="w-3.5 h-3.5 text-[#b45309] shrink-0" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                              {feature.description || "Modül açıklaması."}
                            </p>
                          </div>

                          {/* Toggle Action */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                              isEnabled ? 'text-[#b45309]' : 'text-slate-400'
                            }`}>
                              {isEnabled ? 'Erişim Açık' : 'Kapalı'}
                            </span>
                            <button
                              onClick={() => handleToggle(company.id, feature.id, isEnabled)}
                              disabled={isToggling}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isEnabled ? "bg-[#b45309]" : "bg-slate-300"
                              } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                                  isEnabled ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Company Users Detail */}
                {company.users && company.users.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 rounded-xl p-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Kiracı Temsilcileri
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {company.users.map((user) => (
                        <div 
                          key={user.id} 
                          className="text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{user.name || user.email}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[#b45309] text-[10px] font-bold uppercase">{user.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Production Info Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950 font-medium">
        <AlertCircle className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
        <div>
          <h4 className="font-extrabold text-amber-900">Çoklu Kiracı (Multi-Tenant) İzin Mekanizması</h4>
          <p className="mt-0.5 leading-relaxed text-slate-700">
            Yapılan değişiklikler şirket yetki veritabanına anında işlenir. Bayi paneli kullanıcıları sadece erişim izni verilmiş modül fonksiyonlarına erişebilirler.
          </p>
        </div>
      </div>
    </div>
  );
}
