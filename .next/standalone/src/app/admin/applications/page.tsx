"use client";

import { useState, useEffect, useRef } from "react";
import {
  ClipboardList, Search, RefreshCw, Loader2,
  CheckCircle2, XCircle, Clock, User, Phone,
  Mail, Building2, AlertCircle, ShieldAlert,
  Award, FileText, Check, Settings, MapPin, ChevronRight, ChevronDown,
  TrendingUp, ShieldCheck, Heart, Sparkles, HelpCircle
} from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city?: string;
  taxNumber?: string;
  message?: string;
  status: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  BEKLEMEDE:  { label: "Beklemede",  cls: "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100",   icon: Clock },
  INCELENIYOR:{ label: "İnceleniyor",cls: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100",       icon: AlertCircle },
  ONAYLANDI:  { label: "Onaylandı",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100", icon: CheckCircle2 },
  REDDEDILDI: { label: "Reddedildi", cls: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100",           icon: XCircle },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Application | null>(null);
  const [updating, setUpdating] = useState(false);

  // B2B Onboarding ERP parameters
  const [dealerGroup, setDealerGroup] = useState("Standart");
  const [priceGroup, setPriceGroup] = useState("Liste");
  const [creditLimit, setCreditLimit] = useState("10000");
  const [riskLimit, setRiskLimit] = useState("12000");
  const [vadeGun, setVadeGun] = useState("30");

  const knownIdsRef = useRef<string[]>([]);

  const playNewApplicationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 bell chime
      const duration = 0.15;
      
      notes.forEach((freq, index) => {
        const startTime = ctx.currentTime + index * duration;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (error) {
      console.error("Failed to play notification chime:", error);
    }
  };

  const fetchApplications = async (isFirstLoad = false, showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/applications`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const apps = Array.isArray(data) ? data : [];
      setApplications(apps);
      
      const currentIds = apps.map((a: any) => a.id);
      
      if (isFirstLoad) {
        knownIdsRef.current = currentIds;
      } else {
        const newApps = apps.filter((a: any) => !knownIdsRef.current.includes(a.id));
        if (newApps.length > 0) {
          playNewApplicationSound();
          newApps.forEach((app) => {
            toast.success(`Yeni bayi başvurusu alındı: ${app.companyName}`, {
              duration: 8000,
              icon: "🔔"
            });
          });
          knownIdsRef.current = currentIds;
        }
      }
    } catch (err) {
      if (isFirstLoad || showLoader) {
        toast.error("Başvurular yüklenemedi.");
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(true, true);

    const interval = setInterval(() => {
      fetchApplications(false, false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Update ERP states when application selection changes
  useEffect(() => {
    if (selected) {
      setDealerGroup("Standart");
      setPriceGroup("Liste");
      setCreditLimit("10000");
      setRiskLimit("12000");
      setVadeGun("30");
    }
  }, [selected]);

  // Sync risk limit automatically to 1.2x of credit limit on manual adjustments
  const handleCreditLimitChange = (val: string) => {
    setCreditLimit(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setRiskLimit(String(Math.round(num * 1.2)));
    }
  };

  const filtered = applications.filter((a) => {
    const matchesSearch = 
      a.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      a.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.taxNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          dealerGroup,
          priceGroup,
          creditLimit: parseFloat(creditLimit),
          riskLimit: parseFloat(riskLimit),
          vadeGun: parseInt(vadeGun)
        }),
      });
      if (!res.ok) throw new Error();
      
      let successMsg = "İşlem başarıyla gerçekleştirildi.";
      if (newStatus === "ONAYLANDI") successMsg = "Bayi başvurusu onaylandı ve ERP kaydı oluşturuldu.";
      else if (newStatus === "REDDEDILDI") successMsg = "Başvuru başarıyla reddedildi.";
      else if (newStatus === "INCELENIYOR") successMsg = "Başvuru inceleme durumuna alındı.";
      else if (newStatus === "BEKLEMEDE") successMsg = "Başvuru yeniden bekleme durumuna alındı.";
      else if (newStatus === "DELETE") successMsg = "Başvuru kaydı veritabanından tamamen silindi.";
      
      toast.success(successMsg);
      setSelected(null);
      fetchApplications(false, false);
    } catch {
      toast.error("İşlem gerçekleştirilemedi.");
    } finally {
      setUpdating(false);
    }
  };

  const pending = applications.filter(a => a.status === "BEKLEMEDE").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-655">
              <ClipboardList className="w-5 h-5" />
            </div>
            Bayi Başvuru Onay Merkezi
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            B2B portalımıza üye olan yeni firmaları değerlendirin, kredi limitlerini belirleyip ERP hesaplarını aktif edin.
          </p>
        </div>
        <button 
          onClick={() => fetchApplications(false, true)} 
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-sm hover:shadow active:scale-[0.98] cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} /> 
          Verileri Yenile
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Onay Bekleyenler */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Onay Bekleyen Başvurular</p>
            <p className="text-3xl font-bold text-slate-900 group-hover:scale-105 transition-transform origin-left">{pending}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Toplam Değerlendirilen */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Değerlendirilen Başvuru</p>
            <p className="text-3xl font-bold text-slate-900 group-hover:scale-105 transition-transform origin-left">{applications.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-650">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Sistem Sağlığı */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">ERP &amp; B2B Bağlantısı</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-emerald-800">Tüm Servisler Aktif</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ── Split Layout Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Panel: Applications List (7/12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filters Area */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Firma ünvanı, vergi no veya yetkili ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-450/20 focus:border-orange-500 bg-slate-50 transition-all font-medium placeholder-slate-400 text-slate-800"
              />
            </div>
            <div className="w-full sm:w-auto relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none font-semibold text-slate-700 cursor-pointer appearance-none min-w-[150px]"
              >
                <option value="ALL">Tüm Durumlar</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-450 animate-pulse">
                  Bayi Başvuruları Yükleniyor...
                </span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-25 text-slate-500" />
                <p className="text-sm font-semibold text-slate-600">Başvuru kaydı bulunamadı</p>
                <p className="text-xs text-slate-400 mt-1">Yeni kayıt başvuruları yapıldığında bu listede listelenecektir.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((app) => {
                  const isSelected = selected?.id === app.id;
                  const st = STATUS_MAP[app.status] ?? {
                    label: app.status,
                    cls: "bg-slate-50 text-slate-700 border-slate-200",
                    icon: AlertCircle,
                  };
                  const StIcon = st.icon;

                  return (
                    <button
                      key={app.id}
                      onClick={() => setSelected(app)}
                      className={`w-full text-left px-5 py-4.5 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-4 cursor-pointer border-l-4 ${
                        isSelected 
                          ? "bg-orange-50/15 border-orange-500" 
                          : "border-transparent"
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 truncate flex items-center gap-2 max-w-[280px]">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            {app.companyName}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${st.cls}`}>
                            <StIcon className="w-2.5 h-2.5" />
                            {st.label}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                          <p className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                            {app.contactName}
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                            {app.email}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pt-0.5">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span>
                            Başvuru: {new Date(app.createdAt).toLocaleDateString("tr-TR", { 
                              day: "2-digit", 
                              month: "short", 
                              year: "numeric", 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? "translate-x-1 text-orange-600 font-bold" : ""}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Detail Review & ERP Settings (5/12 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6 sticky top-6">
          {selected ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                  Yeni Üye Onay Paneli
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2 uppercase tracking-tight leading-tight">
                  {selected.companyName}
                </h3>
              </div>

              {/* Core Credentials Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                {[
                  { icon: User, label: "Firma Yetkilisi", value: selected.contactName },
                  { icon: Mail, label: "İletişim E-Posta", value: selected.email, href: `mailto:${selected.email}` },
                  { icon: Phone, label: "Telefon Numarası", value: selected.phone, href: `tel:${selected.phone}` },
                  { icon: FileText, label: "Vergi Dairesi / No", value: selected.taxNumber },
                  { icon: MapPin, label: "Merkez Şehir", value: selected.city },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <item.icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-xs font-bold text-orange-600 hover:underline transition">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-xs font-bold text-slate-700">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}

                {selected.message && (
                  <div className="pt-2.5 border-t border-slate-200/50 mt-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-1">
                      Başvuru / Kayıt Notu
                    </p>
                    <p className="text-xs text-slate-600 font-medium italic leading-relaxed bg-amber-50/45 p-2 rounded-lg border border-amber-100/50">
                      "{selected.message}"
                    </p>
                  </div>
                )}
              </div>

              {/* ERP / B2B Onboarding Configuration Form */}
              {selected.status !== "REDDEDILDI" && (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <Settings className="w-4 h-4 text-orange-500" /> 
                    B2B / ERP Limit Tanımları
                  </div>

                  {/* Dropdowns */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Bayi Grubu</label>
                      <div className="relative">
                        <select
                          value={dealerGroup}
                          onChange={(e) => setDealerGroup(e.target.value)}
                          disabled={selected.status === "ONAYLANDI"}
                          className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-700 appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                          <option value="Standart">Standart</option>
                          <option value="VIP">VIP</option>
                          <option value="Gold">Gold</option>
                          <option value="Platin">Platin</option>
                        </select>
                        {selected.status !== "ONAYLANDI" && (
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Fiyat Grubu</label>
                      <div className="relative">
                        <select
                          value={priceGroup}
                          onChange={(e) => setPriceGroup(e.target.value)}
                          disabled={selected.status === "ONAYLANDI"}
                          className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-700 appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                          <option value="Liste">Liste Fiyatı</option>
                          <option value="Toptan">Toptan Fiyatı</option>
                          <option value="Bayi Özel">Bayi Özel</option>
                        </select>
                        {selected.status !== "ONAYLANDI" && (
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inputs for limits */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Kredi Limiti</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={creditLimit}
                          onChange={(e) => handleCreditLimitChange(e.target.value)}
                          disabled={selected.status === "ONAYLANDI"}
                          className="w-full p-2 pr-6 text-xs border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-550/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₺</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Maksimum Risk</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={riskLimit}
                          onChange={(e) => setRiskLimit(e.target.value)}
                          disabled={selected.status === "ONAYLANDI"}
                          className="w-full p-2 pr-6 text-xs border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-550/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₺</span>
                      </div>
                    </div>
                  </div>

                  {/* Smart Suggestion Notification */}
                  {selected.status !== "ONAYLANDI" && creditLimit && !isNaN(parseFloat(creditLimit)) && (
                    <div className="bg-orange-50/45 border border-orange-100 rounded-lg p-2 flex items-start gap-1.5 text-[10px] font-semibold text-orange-850">
                      <HelpCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <span>
                        Önerilen Risk Limiti (Kredi x 1.2): <span className="font-bold">₺{(parseFloat(creditLimit) * 1.2).toLocaleString("tr-TR")}</span>
                      </span>
                    </div>
                  )}

                  {/* Maturity / Vade */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Açık Hesap Vade (Gün Sayısı)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vadeGun}
                        onChange={(e) => setVadeGun(e.target.value)}
                        disabled={selected.status === "ONAYLANDI"}
                        className="w-full p-2 pr-12 text-xs border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-550/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Gün</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status-specific Badges & Info */}
              {selected.status === "ONAYLANDI" && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Bayi Aktif</p>
                    <p className="text-[11px] text-emerald-600/90 mt-0.5">Bu bayi başvurusu onaylanmıştır ve ERP üzerinde aktif cari kartı bulunmaktadır.</p>
                  </div>
                </div>
              )}

              {selected.status === "REDDEDILDI" && (
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-800">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Başvuru Reddedildi</p>
                    <p className="text-[11px] text-red-600/90 mt-0.5">Bu bayi başvurusu reddedilmiştir. Dilerseniz yeniden değerlendirebilir veya veritabanından tamamen silebilirsiniz.</p>
                  </div>
                </div>
              )}

              {/* Dynamic Action Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                {selected.status === "BEKLEMEDE" && (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(selected.id, "INCELENIYOR")}
                        disabled={updating}
                        className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-650 hover:text-blue-750 text-xs font-bold rounded-xl transition-all border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> 
                        İncelemeye Al
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selected.id, "REDDEDILDI")}
                        disabled={updating}
                        className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-750 text-xs font-bold rounded-xl transition-all border border-red-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" /> 
                        Reddet
                      </button>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate(selected.id, "ONAYLANDI")}
                      disabled={updating}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {updating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> 
                          Başvuruyu Onayla
                        </>
                      )}
                    </button>
                  </>
                )}

                {selected.status === "INCELENIYOR" && (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(selected.id, "BEKLEMEDE")}
                        disabled={updating}
                        className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-650 hover:text-amber-750 text-xs font-bold rounded-xl transition-all border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <Clock className="w-3.5 h-3.5" /> 
                        Beklemeye Al
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selected.id, "REDDEDILDI")}
                        disabled={updating}
                        className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-750 text-xs font-bold rounded-xl transition-all border border-red-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" /> 
                        Reddet
                      </button>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate(selected.id, "ONAYLANDI")}
                      disabled={updating}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {updating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> 
                          Başvuruyu Onayla
                        </>
                      )}
                    </button>
                  </>
                )}

                {selected.status === "ONAYLANDI" && (
                  <button
                    onClick={() => handleStatusUpdate(selected.id, "REDDEDILDI")}
                    disabled={updating}
                    className="w-full py-2.5 bg-red-550 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {updating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> 
                        Reddet / Pasif Et
                      </>
                    )}
                  </button>
                )}

                {selected.status === "REDDEDILDI" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(selected.id, "BEKLEMEDE")}
                      disabled={updating}
                      className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-650 hover:text-amber-750 text-xs font-bold rounded-xl transition-all border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Clock className="w-3.5 h-3.5" /> 
                      Beklemeye Al
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Bu başvuruyu veritabanından tamamen silmek istediğinize emin misiniz?")) {
                          handleStatusUpdate(selected.id, "DELETE");
                        }
                      }}
                      disabled={updating}
                      className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <XCircle className="w-3.5 h-3.5" /> 
                      Tamamen Sil
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-600">Lütfen bir başvuru seçin</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                Sol listeden incelemek istediğiniz başvurunun üzerine tıklayarak vergi numarası, yetkili bilgileri ve ERP tanımlarını görüntüleyebilirsiniz.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

