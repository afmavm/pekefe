"use client";

import { useState, useEffect } from "react";
import {
  Ticket, Plus, X, Tag, Percent, Calendar, Users, ToggleLeft,
  ToggleRight, Trash2, Edit, Copy, CheckCircle2, Search, Loader2,
  Sliders, Play, HelpCircle, Save, Info, ArrowRight, ShieldCheck, AlertCircle
} from "lucide-react";
import { PriceCalculator, SafeFormulaEvaluator } from "@/modules/catalog/server/price-calculator";

interface Campaign {
  id: string;
  name: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  target: string;
  description: string;
}

interface TierRule {
  id: string;
  minQty: number;
  discountPercent: number;
}

const emptyForm = {
  name: "", code: "", type: "percentage",
  value: 0, minOrder: 0, maxUses: 100,
  startDate: "", endDate: "", target: "all", description: ""
};

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "pricingRules" | "simulator" | "discounts">("campaigns");
  
  // Tab 1: Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Tab 2: Pricing Rules
  const [tierRules, setTierRules] = useState<TierRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [newMinQty, setNewMinQty] = useState<number | "">("");
  const [newDiscountPercent, setNewDiscountPercent] = useState<number | "">("");

  // Tab 3: Simulator
  const [simBasePrice, setSimBasePrice] = useState<number>(1000);
  const [simCost, setSimCost] = useState<number>(700);
  const [simFormula, setSimFormula] = useState<string>("cost * 1.15");
  const [simDealerGroup, setSimDealerGroup] = useState<string>("Standart");
  const [simPriceGroup, setSimPriceGroup] = useState<string>("Liste");
  const [simQuantity, setSimQuantity] = useState<number>(12);
  const [simResult, setSimResult] = useState<any>(null);

  // Tab 4: Global Discounts & Bank Transfer
  const [cartDiscountType, setCartDiscountType] = useState<string>("none");
  const [cartDiscountValue, setCartDiscountValue] = useState<number>(0);
  const [cartDiscountMinAmount, setCartDiscountMinAmount] = useState<number>(0);
  const [bankTransferDiscountRate, setBankTransferDiscountRate] = useState<number>(0);
  const [companyName, setCompanyName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [bankIban, setBankIban] = useState<string>("");
  const [efaturaPrefix, setEfaturaPrefix] = useState<string>("GIB");
  const [earsivPrefix, setEarsivPrefix] = useState<string>("EAR");
  const [discountsSaving, setDiscountsSaving] = useState(false);

  // Bank Accounts Management States
  const [banks, setBanks] = useState<any[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any | null>(null);
  const [bankForm, setBankForm] = useState({
    name: "",
    accountNumber: "",
    iban: "",
    currency: "TRY",
    branch: "",
    type: "VADESIZ"
  });

  // Full Settings State (to update pricingRules on server)
  const [settings, setSettings] = useState<any>(null);

  const fetchBanks = async () => {
    setBanksLoading(true);
    try {
      const res = await fetch("/api/accounting/banks");
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json?.data || []);
        setBanks(list);
      }
    } catch (err) {
      console.error("Error fetching banks:", err);
    } finally {
      setBanksLoading(false);
    }
  };

  const openAddBank = () => {
    setBankForm({
      name: "",
      accountNumber: "",
      iban: "",
      currency: "TRY",
      branch: "",
      type: "VADESIZ"
    });
    setEditingBank(null);
    setIsBankModalOpen(true);
  };

  const openEditBank = (bank: any) => {
    setBankForm({
      name: bank.name || "",
      accountNumber: bank.accountNumber || "",
      iban: bank.iban || "",
      currency: bank.currency || "TRY",
      branch: bank.branch || "",
      type: bank.type || "VADESIZ"
    });
    setEditingBank(bank);
    setIsBankModalOpen(true);
  };

  const handleSaveBank = async () => {
    if (!bankForm.name.trim()) {
      alert("Banka adı zorunludur.");
      return;
    }
    try {
      const url = editingBank 
        ? `/api/accounting/banks/${editingBank.id}`
        : "/api/accounting/banks";
      const method = editingBank ? "PATCH" : "POST";
      
      const payload = {
        ...bankForm,
        balance: editingBank ? editingBank.balance : 0
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsBankModalOpen(false);
        fetchBanks();
      } else {
        const errJson = await res.json();
        alert(errJson?.error || "Banka hesabı kaydedilirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Error saving bank:", err);
      alert("Bir hata oluştu.");
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("Bu banka hesabını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/accounting/banks/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchBanks();
      } else {
        alert("Banka hesabı silinirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Error deleting bank:", err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data) {
          setCartDiscountType(data.cartDiscountType || "none");
          setCartDiscountValue(data.cartDiscountValue ?? 0);
          setCartDiscountMinAmount(data.cartDiscountMinAmount ?? 0);
          setBankTransferDiscountRate(data.bankTransferDiscountRate ?? 0);
          setCompanyName(data.companyName || "");
          setBankName(data.bankName || "");
          setBankIban(data.bankIban || "");
          setEfaturaPrefix(data.efaturaPrefix || "GIB");
          setEarsivPrefix(data.earsivPrefix || "EAR");
          
          if (data.pricingRules) {
            const parsed = JSON.parse(data.pricingRules);
            setTierRules(
              parsed.map((r: any, idx: number) => ({
                id: r.id || `rule-${idx}-${Date.now()}`,
                minQty: r.minQty || r.quantity || 0,
                discountPercent: r.discountPercent || r.value || 0
              }))
            );
          }
        }
      }
    } catch (err) {
      console.error("Error loading rules:", err);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => { 
    fetchCampaigns(); 
    fetchRules();
    fetchBanks();
  }, []);

  // Update simulator when variables change
  useEffect(() => {
    handleSimulate();
  }, [simBasePrice, simCost, simFormula, simDealerGroup, simPriceGroup, simQuantity, tierRules]);

  // Tab 1 logic
  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCampaigns = campaigns.filter(c => c.isActive).length;
  const totalUses = campaigns.reduce((s, c) => s + c.usedCount, 0);
  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const handleToggle = async (campaign: Campaign) => {
    const updated = { ...campaign, isActive: !campaign.isActive };
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? updated : c));
    await fetch('/api/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: campaign.id, isActive: !campaign.isActive })
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kampanyayı silmek istediğinizden emin misiniz?")) return;
    setCampaigns(prev => prev.filter(c => c.id !== id));
    await fetch('/api/campaigns', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name, code: campaign.code, type: campaign.type,
      value: campaign.value, minOrder: campaign.minOrder, maxUses: campaign.maxUses,
      startDate: campaign.startDate, endDate: campaign.endDate,
      target: campaign.target, description: campaign.description
    });
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCampaign(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingCampaign ? 'PATCH' : 'POST';
      const payload = editingCampaign ? { id: editingCampaign.id, ...form } : form;

      const res = await fetch('/api/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        if (editingCampaign) {
          setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? data : c));
        } else {
          setCampaigns(prev => [data, ...prev]);
        }
        setIsModalOpen(false);
        setEditingCampaign(null);
        setForm({ ...emptyForm });
      } else {
        alert(`Hata: ${data.error || 'Bilinmeyen bir hata oluştu.'}`);
      }
    } catch (err: any) {
      alert(`Bağlantı hatası: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Tab 2 logic (Pricing Rules)
  const handleAddRule = () => {
    if (newMinQty === "" || newDiscountPercent === "") return;
    const rule: TierRule = {
      id: `rule-${Date.now()}`,
      minQty: Number(newMinQty),
      discountPercent: Number(newDiscountPercent)
    };

    const updated = [...tierRules, rule].sort((a, b) => a.minQty - b.minQty);
    setTierRules(updated);
    setNewMinQty("");
    setNewDiscountPercent("");
  };

  const handleDeleteRule = (id: string) => {
    setTierRules(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveRules = async () => {
    if (!settings) return;
    setRulesSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        pricingRules: JSON.stringify(tierRules)
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });

      if (res.ok) {
        alert("B2B Kademeli Miktar Kuralları başarıyla kaydedildi!");
        fetchRules();
      } else {
        const errData = await res.json();
        alert(`Kayıt hatası: ${errData.error || 'Bilinmeyen Hata'}`);
      }
    } catch (e: any) {
      alert(`Sunucu bağlantı hatası: ${e.message}`);
    } finally {
      setRulesSaving(false);
    }
  };

  const handleSaveDiscounts = async () => {
    if (!settings) return;
    setDiscountsSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        cartDiscountType,
        cartDiscountValue: Number(cartDiscountValue),
        cartDiscountMinAmount: Number(cartDiscountMinAmount),
        bankTransferDiscountRate: Number(bankTransferDiscountRate),
        companyName,
        bankName,
        bankIban,
        efaturaPrefix,
        earsivPrefix
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });

      if (res.ok) {
        alert("Sepet & Ödeme İndirimleri başarıyla kaydedildi!");
        fetchRules();
      } else {
        const errData = await res.json();
        alert(`Kayıt hatası: ${errData.error || 'Bilinmeyen Hata'}`);
      }
    } catch (e: any) {
      alert(`Sunucu bağlantı hatası: ${e.message}`);
    } finally {
      setDiscountsSaving(false);
    }
  };

  // Tab 3 logic (Simulator)
  const handleSimulate = () => {
    // 1. Calculate base group price
    let stepFormulaPrice = simBasePrice;
    let usedFormula = false;

    if (simFormula && simFormula.trim().length > 0) {
      stepFormulaPrice = SafeFormulaEvaluator.evaluate(simFormula, {
        cost: simCost,
        price: simBasePrice,
        baseprice: simBasePrice
      });
      usedFormula = true;
    }

    // 2. Compute normal calculator output
    const finalPrice = PriceCalculator.calculateEffectivePrice({
      basePrice: simBasePrice,
      cost: simCost,
      priceGroup: simPriceGroup,
      dealerGroup: simDealerGroup,
      priceFormula: simFormula,
      quantity: simQuantity,
      pricingRules: tierRules
    });

    // 3. Find matched tier rule
    let matchedDiscount = 0;
    const sortedRules = [...tierRules].sort((a, b) => b.minQty - a.minQty);
    const matchedRule = sortedRules.find(r => simQuantity >= r.minQty);
    if (matchedRule) {
      matchedDiscount = matchedRule.discountPercent;
    }

    const minAllowed = simCost * 1.05;
    const isProtected = finalPrice === minAllowed && (stepFormulaPrice * (1 - matchedDiscount/100)) < minAllowed;

    setSimResult({
      formulaResult: stepFormulaPrice,
      matchedDiscount,
      finalPrice,
      minAllowed,
      isProtected,
      usedFormula
    });
  };

  const typeLabel = (type: string) => ({
    percentage: "Yüzde İndirim",
    fixed: "Sabit İndirim",
    free_shipping: "Ücretsiz Kargo",
    buy_x_get_y: "Al X Öde Y"
  }[type] ?? type);

  const targetLabel = (t: string) => ({ all: "Tümü", b2b: "B2B Bayi", b2c: "B2C" }[t] ?? t);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-3">
            <Ticket className="w-8 h-8 text-orange-500" /> Akıllı Kampanya & Fiyatlandırma
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">B2B fiyat formülleri, kademeli hacim indirimleri ve birleşik indirim kuponları.</p>
        </div>
        
        {activeTab === "campaigns" && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-amber-800 transition shadow-lg shrink-0"
          >
            <Plus className="w-5 h-5" /> Yeni Kampanya
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition ${activeTab === "campaigns" ? "border-orange-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Kuponlar & B2C Kampanyaları
        </button>
        <button
          onClick={() => setActiveTab("pricingRules")}
          className={`pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition ${activeTab === "pricingRules" ? "border-orange-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          B2B Kademeli Miktar Kuralları
        </button>
        <button
          onClick={() => setActiveTab("simulator")}
          className={`pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition ${activeTab === "simulator" ? "border-orange-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Formül Test Simülatörü
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`pb-4 text-sm font-black uppercase tracking-widest border-b-2 transition ${activeTab === "discounts" ? "border-orange-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Sepet & Ödeme İndirimleri
        </button>
      </div>

      {/* Content Area */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Toplam Kampanya</p>
              <p className="text-3xl font-black text-slate-900">{campaigns.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Aktif Kampanya</p>
              <p className="text-3xl font-black text-emerald-600">{activeCampaigns}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Toplam Kullanım</p>
              <p className="text-3xl font-black text-blue-600">{totalUses}</p>
            </div>
            <div className="bg-orange-500 rounded-2xl p-5 shadow-sm text-white">
              <p className="text-xs font-bold text-red-200 uppercase tracking-widest mb-1">Süresi Dolan</p>
              <p className="text-3xl font-black">{campaigns.filter(c => isExpired(c.endDate)).length}</p>
            </div>
          </div>

          {/* Campaign List */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Kampanya adı veya kod ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-sm font-medium"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Kampanyalar Yükleniyor...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Kampanya bulunamadı. Yeni kampanya oluşturun.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCampaigns.map(campaign => {
                  const usePercent = campaign.maxUses > 0 ? Math.min((campaign.usedCount / campaign.maxUses) * 100, 100) : 0;
                  const expired = isExpired(campaign.endDate);
                  return (
                    <div key={campaign.id} className={`border rounded-2xl p-5 transition-all ${campaign.isActive && !expired ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/50"}`}>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className={`font-extrabold text-lg ${!campaign.isActive || expired ? "text-slate-400" : "text-slate-900"}`}>
                              {campaign.name}
                            </h3>
                            {expired && <span className="px-2 py-0.5 bg-orange-50 text-red-600 text-[9px] font-black rounded border border-orange-100 uppercase">Süresi Doldu</span>}
                            {campaign.isActive && !expired && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded border border-emerald-100 uppercase">Aktif</span>}
                            {!campaign.isActive && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase">Pasif</span>}
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${campaign.target === "b2b" ? "bg-blue-50 text-blue-600" : campaign.target === "b2c" ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-600"}`}>
                              {targetLabel(campaign.target)}
                            </span>
                          </div>
                          {campaign.description && <p className="text-slate-500 text-sm mb-3">{campaign.description}</p>}
                          <div className="flex flex-wrap gap-4 text-xs">
                            <button
                              onClick={() => handleCopyCode(campaign.code)}
                              className="flex items-center gap-1.5 font-black bg-slate-100 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg transition"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              {campaign.code}
                              {copiedCode === campaign.code ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                              <Percent className="w-3.5 h-3.5 text-slate-400" />
                              {typeLabel(campaign.type)}{campaign.type === "percentage" ? ` %${campaign.value}` : campaign.type === "fixed" ? ` ${campaign.value}₺` : ""}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {campaign.startDate} → {campaign.endDate}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {campaign.usedCount}/{campaign.maxUses} kullanım
                            </div>
                          </div>
                          <div className="mt-3 max-w-xs">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${usePercent >= 100 ? "bg-orange-500" : usePercent > 70 ? "bg-orange-500" : "bg-emerald-500"}`}
                                style={{ width: `${usePercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggle(campaign)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition ${campaign.isActive ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          >
                            {campaign.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            {campaign.isActive ? "Aktif" : "Pasif"}
                          </button>
                          <button onClick={() => handleEdit(campaign)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(campaign.id)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-amber-600 hover:text-white transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "pricingRules" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rules Editor */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">B2B Kademeli Miktar İndirim Kuralları</h2>
              <p className="text-sm text-slate-500 mt-1">Bayilerin sepetlerine ekledikleri ürün adet miktarlarına göre otomatik uygulanacak ek indirim oranları.</p>
            </div>

            {rulesLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kurallar Yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Form to Add New Rule */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 items-end">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Minimum Adet</label>
                    <input
                      type="number"
                      value={newMinQty}
                      onChange={e => setNewMinQty(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Örn: 10"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Ek İndirim Oranı (%)</label>
                    <input
                      type="number"
                      value={newDiscountPercent}
                      onChange={e => setNewDiscountPercent(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Örn: 5"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleAddRule}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                  >
                    Ekle
                  </button>
                </div>

                {/* Rules Table */}
                {tierRules.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-2xl text-slate-400">
                    <Sliders className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Tanımlı kademeli indirim kuralı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-slate-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                          <th className="px-5 py-3">Kural Eşiği</th>
                          <th className="px-5 py-3">Uygulanacak İndirim</th>
                          <th className="px-5 py-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm font-bold text-slate-800">
                        {tierRules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-black">{rule.minQty}+</span>
                              <span>Adet ve üzeri siparişlerde</span>
                            </td>
                            <td className="px-5 py-3.5 text-emerald-600 font-extrabold">
                              %{rule.discountPercent} Ek İndirim
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 hover:text-red-600 rounded-lg hover:bg-orange-50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSaveRules}
                    disabled={rulesSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-amber-800 transition shadow-lg disabled:opacity-50"
                  >
                    {rulesSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    KURALLARI KAYDET
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Info className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider">Kademeli Fiyatlandırma Nedir?</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Toptan alışveriş yapan bayiler için adet miktarı arttıkça birim fiyatın düşürülmesi satış hacminizi büyük oranda artırır.
              </p>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                  <span>Kademeli indirimler bayi özel fiyatı (formüllü veya indirimli) hesaplandıktan sonra uygulanır.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                  <span>Zararına satış koruması (%5 minimum kar marjı) kademeli indirimlerden sonra da geçerlidir.</span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Örnek Yapı</p>
              <div className="flex justify-between items-center text-xs mt-2 font-bold text-slate-300">
                <span>1 - 9 Adet</span>
                <span className="text-slate-500">Standart Bayi Fiyatı</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1.5 font-bold text-slate-300">
                <span>10 - 49 Adet</span>
                <span className="text-emerald-400">%5 Ek İndirim</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1.5 font-bold text-slate-300">
                <span>50+ Adet</span>
                <span className="text-emerald-400">%12 Ek İndirim</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs Panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">B2B Bayi Fiyat Simülasyonu</h2>
              <p className="text-sm text-slate-500 mt-1">Dinamik formülleri, bayi gruplarını ve hacim kademelerini canlı olarak simüle edin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Maliyet (₺)</label>
                <input
                  type="number"
                  value={simCost}
                  onChange={e => setSimCost(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Liste Fiyatı (₺)</label>
                <input
                  type="number"
                  value={simBasePrice}
                  onChange={e => setSimBasePrice(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bayi Özel Fiyat Formülü (CurrentAccount.priceFormula)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={simFormula}
                    onChange={e => setSimFormula(e.target.value)}
                    placeholder="Örn: cost * 1.15"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-black tracking-wider focus:border-orange-500 pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 group cursor-help text-slate-400 hover:text-slate-600">
                    <HelpCircle className="w-5 h-5" />
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 bg-slate-950 text-white text-[10px] font-bold p-3 rounded-xl shadow-2xl leading-relaxed z-30">
                      Formülde kullanılabilecek değişkenler:<br />
                      - <b>cost:</b> Ürün maliyet fiyatı<br />
                      - <b>price:</b> Ürün liste fiyatı<br />
                      Örnekler:<br />
                      - <code className="text-red-400">cost * 1.12</code> (%12 Kar Marjı)<br />
                      - <code className="text-red-400">price * 0.85</code> (Liste fiyatı üzerinden %15 İndirim)<br />
                      - <code className="text-red-400">cost + 45</code> (Maliyet üstüne sabit 45₺ kar ekleme)
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Satın Alma Miktarı (Adet)</label>
                <input
                  type="number"
                  min="1"
                  value={simQuantity}
                  onChange={e => setSimQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bayi Grubu (PriceFormula Yoksa)</label>
                <select
                  value={simDealerGroup}
                  onChange={e => setSimDealerGroup(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                >
                  <option value="Standart">Standart Bayi (İndirim Yok)</option>
                  <option value="VIP">VIP Bayi (%10 İndirim)</option>
                  <option value="Platin">Platin Bayi (%20 İndirim)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fiyat Grubu (PriceFormula Yoksa)</label>
                <select
                  value={simPriceGroup}
                  onChange={e => setSimPriceGroup(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                >
                  <option value="Liste">Liste Fiyatı</option>
                  <option value="MaliyetArtı10">Maliyet + %10</option>
                  <option value="MaliyetArtı15">Maliyet + %15</option>
                  <option value="MaliyetArtı20">Maliyet + %20</option>
                </select>
              </div>
            </div>
          </div>

          {/* Simulation Output */}
          {simResult && (
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                  <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Simülasyon Sonucu</h3>
                </div>

                <div className="space-y-3.5">
                  {/* Base and Cost Row */}
                  <div className="flex justify-between text-xs text-slate-500 font-bold border-b pb-2">
                    <span>Maliyet / Liste Fiyatı</span>
                    <span>{simCost}₺ / {simBasePrice}₺</span>
                  </div>

                  {/* Step 1 Result */}
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">
                      {simResult.usedFormula ? "Özel Formül Değeri" : `Bayi/Fiyat Grubu Fiyatı`}
                    </span>
                    <span className="text-slate-900 text-sm">
                      {simResult.formulaResult.toFixed(2)}₺
                    </span>
                  </div>

                  {/* Volume Discount */}
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600">Kademeli Miktar İndirimi ({simQuantity} Adet)</span>
                    <span className="text-emerald-600 text-xs">
                      {simResult.matchedDiscount > 0 ? `-%${simResult.matchedDiscount}` : "Uygulanmadı"}
                    </span>
                  </div>

                  {/* Margin Protection */}
                  <div className="flex justify-between items-center text-xs font-bold border-t pt-2">
                    <span className="text-slate-500">Maliyet Koruma Sınırı (%5 Garantili Kar)</span>
                    <span className="text-slate-500">{simResult.minAllowed.toFixed(2)}₺</span>
                  </div>
                </div>
              </div>

              {/* Protected Notification */}
              {simResult.isProtected && (
                <div className="bg-orange-50 border border-amber-200 text-red-700 p-3.5 rounded-2xl flex gap-2.5 items-start text-xs font-bold leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-red-800 uppercase tracking-wider mb-0.5">Zararına Satış Koruması!</span>
                    Formül veya kademeli indirim sonucu oluşan fiyat maliyet koruma sınırının altına düştüğü için otomatik olarak <b>{simResult.finalPrice.toFixed(2)}₺</b> sınırına yükseltilmiştir.
                  </div>
                </div>
              )}

              {!simResult.isProtected && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-2xl flex gap-2.5 items-start text-xs font-bold leading-relaxed">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-emerald-800 uppercase tracking-wider mb-0.5">Güvenli Fiyatlandırma</span>
                    Hesaplanan fiyat maliyet koruma eşiğinin üzerindedir. %{(((simResult.finalPrice / simCost) - 1) * 100).toFixed(1)} brüt kar marjı ile satılabilir.
                  </div>
                </div>
              )}

              {/* Final Effective Dealer Price */}
              <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nihai Bayi Özel Birim Fiyatı</span>
                <span className="text-3xl font-black text-white">{simResult.finalPrice.toFixed(2)}₺</span>
                <span className="text-[9px] font-bold text-slate-500 mt-2">Toplam Tutar ({simQuantity} Adet): {(simResult.finalPrice * simQuantity).toFixed(2)}₺</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "discounts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls Panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-8">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Sepet &amp; Ödeme İndirimleri</h2>
              <p className="text-sm text-slate-500 mt-1">Tüm sisteme etki eden sepet altı genel kampanyaları ve banka havalesi ödeme indirimini yapılandırın.</p>
            </div>

            {/* Campaign Discount Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Tag className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">1. Sepette Kampanya İndirimi</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">İndirim Türü</label>
                  <select
                    value={cartDiscountType}
                    onChange={e => setCartDiscountType(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                  >
                    <option value="none">Kampanya Yok</option>
                    <option value="percentage">Yüzde İndirim (%)</option>
                    <option value="fixed">Sabit İndirim (₺)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    {cartDiscountType === "percentage" ? "İndirim Oranı (%)" : cartDiscountType === "fixed" ? "İndirim Tutarı (₺)" : "Değer"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={cartDiscountType === "none"}
                    value={cartDiscountValue || ""}
                    onChange={e => setCartDiscountValue(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Min. Sepet Tutarı (₺)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={cartDiscountType === "none"}
                    value={cartDiscountMinAmount || ""}
                    onChange={e => setCartDiscountMinAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Bank Transfer Discount Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Percent className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">2. Banka Havalesi Ayarları &amp; Hesap Bilgileri</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Havale İndirim Oranı (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bankTransferDiscountRate || ""}
                      onChange={e => setBankTransferDiscountRate(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500 pr-12"
                      placeholder="0"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      %
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Firma Ünvanı / Alıcı Adı</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                    placeholder="Örn: Pekefe Gıda San. ve Tic. Ltd. Şti."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Banka Adı (Varsayılan)</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                    placeholder="Örn: Ziraat Bankası"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">IBAN Numarası (Varsayılan)</label>
                  <input
                    type="text"
                    value={bankIban}
                    onChange={e => setBankIban(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500 font-mono"
                    placeholder="Örn: TR00 0000 0000 0000 0000 0000 00"
                  />
                </div>
              </div>

              {/* E-Fatura & E-Arşiv Serial Prefix Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-2">
                  <Sliders className="w-5 h-5 text-orange-500" />
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">3. E-Fatura &amp; E-Arşiv Ön Ek Ayarları</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">e-Fatura Seri Başlangıç Formatı (Ön Ek - 3 Hane)</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={efaturaPrefix}
                      onChange={e => setEfaturaPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-black tracking-wider focus:border-orange-500 font-mono"
                      placeholder="Örn: GIB"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">E-Faturalar için varsayılan 3 haneli başlangıç seri ön eki (Örn: GIB2026000000001).</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">e-Arşiv Seri Başlangıç Formatı (Ön Ek - 3 Hane)</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={earsivPrefix}
                      onChange={e => setEarsivPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-black tracking-wider focus:border-orange-500 font-mono"
                      placeholder="Örn: EAR"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">E-Arşiv faturaları için varsayılan 3 haneli başlangıç seri ön eki (Örn: EAR2026000000001).</p>
                  </div>
                </div>
              </div>

              {/* Bank Accounts List Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Banka Hesap Listesi</h4>
                    <p className="text-xs text-slate-450 mt-0.5">Havale/EFT ödemesi için müşterilere gösterilecek banka hesap numaraları.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddBank}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Hesap Ekle
                  </button>
                </div>

                {banksLoading ? (
                  <div className="flex items-center justify-center py-6 text-slate-450 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Yükleniyor...
                  </div>
                ) : banks.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-450 text-xs font-bold">
                    Kayıtlı banka hesabı bulunamadı. Lütfen yeni bir hesap ekleyin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banks.map(bank => (
                      <div key={bank.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:shadow-sm transition flex justify-between items-start">
                        <div className="space-y-1 text-left">
                          <span className="text-xs font-black text-slate-700 block">{bank.name}</span>
                          {bank.iban && (
                            <span className="text-[11px] font-mono text-slate-500 block tracking-wide">{bank.iban}</span>
                          )}
                          <div className="text-[10px] text-slate-400 flex gap-3 font-semibold mt-1">
                            <span>Tür: {bank.type}</span>
                            <span>Birim: {bank.currency}</span>
                            {bank.branch && <span>Şube: {bank.branch}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditBank(bank)}
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition"
                            title="Düzenle"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBank(bank.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveDiscounts}
                disabled={discountsSaving}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-amber-800 transition shadow-lg disabled:opacity-50"
              >
                {discountsSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                İNDİRİMLERİ KAYDET
              </button>
            </div>
          </div>

          {/* Sidebar / Info Column */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Info className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider">İndirim Öncelik Sıralaması</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Platformumuzda sepet hesaplanırken indirimler belirli bir hiyerarşide uygulanır:
              </p>
              <div className="space-y-3.5 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 mt-0.5 shrink-0">1</span>
                  <div>
                    <span className="block font-bold text-slate-200">Bayi Özel / Formül Fiyatı:</span>
                    Her ürünün bayi grubuna veya CurrentAccount formülüne göre taban bayi fiyatı hesaplanır.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 mt-0.5 shrink-0">2</span>
                  <div>
                    <span className="block font-bold text-slate-200">Kademeli Miktar İndirimi:</span>
                    Sepetteki her ürünün miktarına göre ek adet indirimi (% ve maliyet koruması) işletilir.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 mt-0.5 shrink-0">3</span>
                  <div>
                    <span className="block font-bold text-slate-200">Ürün Sepet İndirimi (Product.cartDiscountRate):</span>
                    Varsa, ürün bazlı sepette ek indirim oranı uygulanır.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 mt-0.5 shrink-0">4</span>
                  <div>
                    <span className="block font-bold text-slate-200">Global Sepette Kampanya İndirimi:</span>
                    Bu sekmede belirlenen tutar veya oran bazlı sepet altı kampanyası uygulanır.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 mt-0.5 shrink-0">5</span>
                  <div>
                    <span className="block font-bold text-slate-200">Havale İndirimi (%):</span>
                    Eğer ödeme yöntemi olarak Havale seçilirse, tüm aşamalardan sonraki ara toplama ek havale indirimi uygulanır.
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">GÜVENLİK UYARISI</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tüm sepet ve havale indirimleri sipariş onaylama aşamasında sunucu tarafında (Server-Side) yeniden doğrulanır. İstemci taraflı fiyat manipülasyonu engellenmiştir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white relative z-10 w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold">{editingCampaign ? "Kampanya Düzenle" : "Yeni Kampanya Oluştur"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-full hover:text-red-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kampanya Adı *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500" placeholder="Örn: Yaz İndirimi 2025" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kupon Kodu *</label>
                <input required type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-black tracking-widest focus:border-orange-500" placeholder="YAZ2025" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hedef Kitle</label>
                <select value={form.target} onChange={e => setForm({...form, target: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold">
                  <option value="all">Tüm Müşteriler</option>
                  <option value="b2b">Sadece B2B Bayiler</option>
                  <option value="b2c">Sadece B2C Müşteriler</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">İndirim Türü</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold">
                  <option value="percentage">Yüzde İndirim (%)</option>
                  <option value="fixed">Sabit İndirim (₺)</option>
                  <option value="free_shipping">Ücretsiz Kargo</option>
                  <option value="buy_x_get_y">Al X Öde Y</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  {form.type === "percentage" ? "İndirim Oranı (%)" : form.type === "fixed" ? "İndirim Tutarı (₺)" : "Değer"}
                </label>
                <input
                  type="number" min="0" max={form.type === "percentage" ? 100 : undefined}
                  value={form.value || ""}
                  onChange={e => setForm({...form, value: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold"
                  placeholder="0"
                  disabled={form.type === "free_shipping"}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Min. Sipariş Tutarı (₺)</label>
                <input type="number" min="0" value={form.minOrder || ""} onChange={e => setForm({...form, minOrder: Number(e.target.value)})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="0" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Max. Kullanım Sayısı</label>
                <input type="number" min="1" value={form.maxUses || ""} onChange={e => setForm({...form, maxUses: Number(e.target.value)})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="100" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Başlangıç Tarihi *</label>
                <input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bitiş Tarihi *</label>
                <input required type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold" />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Açıklama</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="Kampanya hakkında kısa açıklama" />
              </div>

              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-200 transition">
                  İptal
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-amber-800 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</> : (editingCampaign ? "GÜNCELLE" : "OLUŞTUR")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBankModalOpen(false)} />
          <div className="bg-white relative z-10 w-full max-w-xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold">{editingBank ? "Banka Hesabını Düzenle" : "Yeni Banka Hesabı Ekle"}</h2>
              <button type="button" onClick={() => setIsBankModalOpen(false)} className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-full hover:text-red-650 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Banka Adı *</label>
                <input
                  type="text"
                  required
                  value={bankForm.name}
                  onChange={e => setBankForm({ ...bankForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                  placeholder="Örn: Garanti BBVA"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hesap Türü</label>
                <select
                  value={bankForm.type}
                  onChange={e => setBankForm({ ...bankForm, type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold"
                >
                  <option value="VADESIZ">VADESIZ</option>
                  <option value="VADELI">VADELI</option>
                  <option value="KREDI">KREDI</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Para Birimi</label>
                <select
                  value={bankForm.currency}
                  onChange={e => setBankForm({ ...bankForm, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">IBAN *</label>
                <input
                  type="text"
                  required
                  value={bankForm.iban}
                  onChange={e => setBankForm({ ...bankForm, iban: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-mono font-bold focus:border-orange-500"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hesap Numarası</label>
                <input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Şube</label>
                <input
                  type="text"
                  value={bankForm.branch}
                  onChange={e => setBankForm({ ...bankForm, branch: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-orange-500"
                  placeholder="Kadıköy"
                />
              </div>

              <div className="col-span-2 flex gap-3 pt-4">
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-200 transition">
                  İptal
                </button>
                <button type="button" onClick={handleSaveBank} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-amber-800 transition shadow-lg">
                  KAYDET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

