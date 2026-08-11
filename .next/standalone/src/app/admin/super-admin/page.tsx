"use client";

import { useState, useEffect } from "react";
import { 
  Building, 
  ShieldCheck, 
  Settings, 
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
      setCompanies(fetchedCompanies as any);
      setFeatures(fetchedFeatures as any);
    } catch (error: any) {
      toast.error(error.message || "Veriler yüklenirken bir hata oluştu.");
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
          // If no permission record exists yet in local array
          const targetFeature = features.find(f => f.id === featureModuleId);
          updatedPermissions = [
            ...c.permissions,
            {
              id: "temp-id",
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
        toast.success("İzin başarıyla güncellendi.");
      }
    } catch (error: any) {
      toast.error(error.message || "İzin güncellenirken bir hata oluştu.");
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

  // Counts for cards
  const totalCompanies = companies.length;
  const activeTogglesCount = companies.reduce((sum, c) => 
    sum + c.permissions.filter(p => p.isEnabled).length, 0
  );
  const totalUsersCount = companies.reduce((sum, c) => sum + c.users.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-amber-600" />
            Süper Yönetici Kontrol Paneli
          </h1>
          <p className="text-slate-500 mt-1">
            Çoklu kiracı (SaaS) sistem ayarları ve şirket bazlı modül yetkilendirmesi (Feature Toggling).
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200/80 shadow-sm transition-all hover:scale-102 active:scale-98"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl shadow-slate-100/40 p-6 hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Kayıtlı Şirket</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{totalCompanies}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-all">
              <Building className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl shadow-slate-100/40 p-6 hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Aktif Modüller</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{activeTogglesCount}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-all">
              <Layers className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl shadow-slate-100/40 p-6 hover:shadow-2xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Toplam Kiracı Kullanıcı</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{totalUsersCount}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-all">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl shadow-slate-100/40 p-6">
        {/* Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Grid className="h-5 w-5 text-slate-500" />
            Şirketler & Modül Yetkileri
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Şirket adı veya vergi no ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Aranan kriterlere uygun şirket bulunamadı.</p>
          </div>
        ) : (
          /* Company Cards List */
          <div className="space-y-6">
            {filteredCompanies.map((company) => (
              <div 
                key={company.id}
                className="p-5 border border-slate-200/70 rounded-2xl bg-white hover:border-slate-300 shadow-sm transition-all"
              >
                {/* Company Title Info */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
                        <Building className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-lg">{company.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">ID: {company.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/50 text-slate-600 font-semibold flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {company.users.length} Kullanıcı
                    </div>
                    {company.taxNo && (
                      <div className="text-xs px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/50 text-slate-600 font-semibold">
                        Vergi No: {company.taxNo}
                      </div>
                    )}
                    <div className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                      company.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                    }`}>
                      {company.isActive ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Aktif Şirket
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          Pasif Şirket
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Modül Erişim Yetkileri</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {features.map((feature) => {
                      const permission = company.permissions.find(p => p.featureModuleId === feature.id);
                      const isEnabled = permission ? permission.isEnabled : false;
                      const isToggling = togglingId === `${company.id}-${feature.id}`;

                      return (
                        <div 
                          key={feature.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                            isEnabled 
                              ? 'bg-amber-50/20 border-amber-200/50' 
                              : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm text-slate-700">{feature.name}</span>
                              {isEnabled ? (
                                <Unlock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-normal line-clamp-2">
                              {feature.description || "Açıklama bulunmuyor."}
                            </p>
                          </div>

                          {/* Toggle Action */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              isEnabled ? 'text-amber-700' : 'text-slate-400'
                            }`}>
                              {isEnabled ? 'Aktif' : 'Pasif'}
                            </span>
                            <button
                              onClick={() => handleToggle(company.id, feature.id, isEnabled)}
                              disabled={isToggling}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isEnabled ? "bg-amber-600" : "bg-slate-200"
                              } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
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
                {company.users.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100 bg-slate-50/30 rounded-xl p-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Kiracı Temsilcileri
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {company.users.map((user) => (
                        <div 
                          key={user.id} 
                          className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 flex items-center gap-1 shadow-sm"
                        >
                          <span className="font-semibold">{user.name || user.email}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">{user.role}</span>
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

      {/* Production MySQL Sync Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200/50 rounded-2xl flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-blue-800 text-sm">Üretim Ortamı MySQL Bilgilendirmesi</h4>
          <p className="text-xs text-blue-700 mt-0.5 leading-normal">
            Bu arayüz local SQLite veritabanı üzerinden çalışmaktadır. Yapılan değişiklikler anında <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[10px]">dev.db</code> dosyasına yansıtılır. Üretim ortamına (MySQL) geçiş yaparken DDL betiklerinin çalıştırılmış olduğundan emin olunuz.
          </p>
        </div>
      </div>
    </div>
  );
}

