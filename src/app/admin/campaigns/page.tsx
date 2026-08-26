"use client";

import { useState, useEffect } from "react";
import {
  Ticket, Plus, X, Tag, Percent, Calendar, Users, ToggleLeft,
  ToggleRight, Trash2, Edit, Copy, CheckCircle2, Search, Loader2,
  Sliders, Play, HelpCircle, Save, Info, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Wand2
} from "lucide-react";
import { toast } from "sonner";
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
  value: 15, minOrder: 500, maxUses: 500,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 84600 * 1000).toISOString().split('T')[0],
  target: "all", description: ""
};

const CAMPAIGN_PRESETS = [
  {
    name: "%15 Genel Açılış İndirimi",
    code: "PEKEFE15",
    type: "percentage",
    value: 15,
    minOrder: 500,
    maxUses: 1000,
    target: "all",
    description: "Tüm İspir bal, pekmez ve yöresel ürün siparişlerinde geçerli %15 indirim."
  },
  {
    name: "2000 TL Üzeri Ücretsiz Kargo",
    code: "BEDAVAKARGO",
    type: "free_shipping",
    value: 0,
    minOrder: 2000,
    maxUses: 2000,
    target: "all",
    description: "2000 TL üzerindeki tüm sepette kargo bedeli sistem tarafından sıfırlanır."
  },
  {
    name: "200 TL Hoş Geldin Kuponu",
    code: "HOSGELDIN200",
    type: "fixed",
    value: 200,
    minOrder: 1500,
    maxUses: 300,
    target: "b2c",
    description: "1500 TL üzeri ilk alışverişte geçerli 200 TL tutarında hediye kuponu."
  },
  {
    name: "B2B Toptan Bayi İndirimi",
    code: "BAYIBERKET20",
    type: "percentage",
    value: 20,
    minOrder: 5000,
    maxUses: 100,
    target: "b2b",
    description: "Bayi siparişlerinde 5000 TL üzeri alımlara özel ek %20 fırsat indirimi."
  }
];

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
  const [campaignsBannerTitle, setCampaignsBannerTitle] = useState<string>("");
  const [campaignsBannerDesc, setCampaignsBannerDesc] = useState<string>("");
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
      toast.error("Banka adı zorunludur.");
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
        toast.success("Banka hesabı kaydedildi.");
        fetchBanks();
      } else {
        const errJson = await res.json();
        toast.error(errJson?.error || "Banka hesabı kaydedilirken hata oluştu.");
      }
    } catch (err) {
      console.error("Error saving bank:", err);
      toast.error("Bir hata oluştu.");
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("Bu banka hesabını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/accounting/banks/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Banka hesabı silindi.");
        fetchBanks();
      } else {
        toast.error("Banka hesabı silinemedi.");
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
          setCampaignsBannerTitle(data.campaignsBannerTitle || "");
          setCampaignsBannerDesc(data.campaignsBannerDesc || "");
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

  useEffect(() => {
    handleSimulate();
  }, [simBasePrice, simCost, simFormula, simDealerGroup, simPriceGroup, simQuantity, tierRules]);

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
    toast.success(updated.isActive ? "Kampanya aktifleştirildi." : "Kampanya pasife alındı.");
    await fetch('/api/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: campaign.id, isActive: !campaign.isActive })
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kampanyayı silmek istediğinizden emin misiniz?")) return;
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success("Kampanya silindi.");
    await fetch('/api/campaigns', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`"${code}" kupon kodu kopyalandı!`);
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

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "PEKEFE";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, code }));
  };

  const applyPresetToForm = (preset: typeof CAMPAIGN_PRESETS[0]) => {
    setForm({
      name: preset.name,
      code: preset.code,
      type: preset.type,
      value: preset.value,
      minOrder: preset.minOrder,
      maxUses: preset.maxUses,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 84600 * 1000).toISOString().split('T')[0],
      target: preset.target,
      description: preset.description
    });
    toast.success(`"${preset.name}" şablonu yüklendi.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Kampanya adı ve kupon kodu zorunludur.");
      return;
    }

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
          toast.success("Kampanya güncellendi.");
        } else {
          setCampaigns(prev => [data, ...prev]);
          toast.success("Yeni kampanya oluşturuldu.");
        }
        setIsModalOpen(false);
        setEditingCampaign(null);
        setForm({ ...emptyForm });
      } else {
        toast.error(`Hata: ${data.error || 'Bilinmeyen bir hata oluştu.'}`);
      }
    } catch (err: any) {
      toast.error(`Bağlantı hatası: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Tab 2 logic
  const handleAddRule = () => {
    if (newMinQty === "" || newDiscountPercent === "") {
      toast.error("Lütfen adet ve indirim oranını eksiksiz girin.");
      return;
    }
    const rule: TierRule = {
      id: `rule-${Date.now()}`,
      minQty: Number(newMinQty),
      discountPercent: Number(newDiscountPercent)
    };

    const updated = [...tierRules, rule].sort((a, b) => a.minQty - b.minQty);
    setTierRules(updated);
    setNewMinQty("");
    setNewDiscountPercent("");
    toast.success("Kademeli indirim eşiği eklendi.");
  };

  const handleDeleteRule = (id: string) => {
    setTierRules(prev => prev.filter(r => r.id !== id));
    toast.success("Kural kaldırıldı.");
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
        toast.success("B2B Kademeli Miktar Kuralları kaydedildi!");
        fetchRules();
      } else {
        const errData = await res.json();
        toast.error(`Kayıt hatası: ${errData.error || 'Bilinmeyen Hata'}`);
      }
    } catch (e: any) {
      toast.error(`Sunucu bağlantı hatası: ${e.message}`);
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
        campaignsBannerTitle,
        campaignsBannerDesc,
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
        toast.success("Sepet & Ödeme İndirimleri kaydedildi!");
        fetchRules();
      } else {
        const errData = await res.json();
        toast.error(`Kayıt hatası: ${errData.error || 'Bilinmeyen Hata'}`);
      }
    } catch (e: any) {
      toast.error(`Sunucu bağlantı hatası: ${e.message}`);
    } finally {
      setDiscountsSaving(false);
    }
  };

  // Tab 3 logic (Simulator)
  const handleSimulate = () => {
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

    const finalPrice = PriceCalculator.calculateEffectivePrice({
      basePrice: simBasePrice,
      cost: simCost,
      priceGroup: simPriceGroup,
      dealerGroup: simDealerGroup,
      priceFormula: simFormula,
      quantity: simQuantity,
      pricingRules: tierRules
    });

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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">

      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-[#b45309]" /> Akıllı Kampanya & İndirim Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            B2B fiyat formülleri, kupon kodları, hacim kademeleri ve havale indirimi konfigürasyonu.
          </p>
        </div>

        {activeTab === "campaigns" && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-5 py-3 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-900/10 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Kampanya Oluştur
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "campaigns" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Tag className="w-4 h-4 text-amber-700" /> Kuponlar & Kampanyalar
        </button>
        <button
          onClick={() => setActiveTab("pricingRules")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "pricingRules" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-700" /> B2B Kademeli İndirim
        </button>
        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "simulator" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Play className="w-4 h-4 text-amber-700" /> Formül Test Simülatörü
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "discounts" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Percent className="w-4 h-4 text-amber-700" /> Sepet & Ödeme İndirimi
        </button>
      </div>

      {/* Content Area */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Toplam Kampanya</p>
              <p className="text-2xl font-black text-slate-900">{campaigns.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Aktif Kampanya</p>
              <p className="text-2xl font-black text-emerald-600">{activeCampaigns}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Toplam Kullanım</p>
              <p className="text-2xl font-black text-blue-600">{totalUses}</p>
            </div>
            <div className="bg-amber-500 rounded-2xl p-5 shadow-xs text-white">
              <p className="text-xs font-bold text-amber-100 uppercase tracking-widest mb-1">Süresi Dolan</p>
              <p className="text-2xl font-black">{campaigns.filter(c => isExpired(c.endDate)).length}</p>
            </div>
          </div>

          {/* Quick Preset Launcher */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#b45309]" />
              <h3 className="font-extrabold text-sm text-amber-950">Tek Tıkla Şablon Kampanya Oluşturun</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CAMPAIGN_PRESETS.map((p) => (
                <button
                  key={p.code}
                  onClick={() => {
                    applyPresetToForm(p);
                    setIsModalOpen(true);
                  }}
                  className="p-3 bg-white border border-amber-200 hover:border-[#b45309] rounded-xl text-left transition cursor-pointer group shadow-2xs"
                >
                  <span className="text-xs font-extrabold text-slate-900 block group-hover:text-[#b45309]">{p.name}</span>
                  <span className="text-[10px] font-mono text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded inline-block mt-1">{p.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Campaign List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Kampanya adı veya kupon ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#b45309] text-xs font-semibold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kampanyalar Yükleniyor...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-bold text-sm text-slate-600">Aranan kriterlere uygun kampanya bulunamadı.</p>
                <button onClick={handleOpenNew} className="text-[#b45309] font-bold text-xs hover:underline mt-1 cursor-pointer">
                  + Yeni bir kampanya ekleyin
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCampaigns.map(campaign => {
                  const usePercent = campaign.maxUses > 0 ? Math.min((campaign.usedCount / campaign.maxUses) * 100, 100) : 0;
                  const expired = isExpired(campaign.endDate);
                  return (
                    <div key={campaign.id} className={`border rounded-2xl p-5 transition-all ${campaign.isActive && !expired ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/50"}`}>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className={`font-extrabold text-base ${!campaign.isActive || expired ? "text-slate-400" : "text-slate-900"}`}>
                              {campaign.name}
                            </h3>
                            {expired && <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-md border border-red-200 uppercase">Süresi Doldu</span>}
                            {campaign.isActive && !expired && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 uppercase">Aktif</span>}
                            {!campaign.isActive && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md uppercase">Pasif</span>}
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${campaign.target === "b2b" ? "bg-blue-50 text-blue-700 border border-blue-100" : campaign.target === "b2c" ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-slate-100 text-slate-600"}`}>
                              {targetLabel(campaign.target)}
                            </span>
                          </div>

                          {campaign.description && <p className="text-slate-500 text-xs font-medium">{campaign.description}</p>}
                          
                          <div className="flex flex-wrap gap-3 text-xs pt-1">
                            <button
                              onClick={() => handleCopyCode(campaign.code)}
                              className="flex items-center gap-1.5 font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1 rounded-lg transition border border-amber-200 cursor-pointer"
                            >
                              <Tag className="w-3.5 h-3.5 text-amber-600" />
                              {campaign.code}
                              {copiedCode === campaign.code ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                            
                            <div className="flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                              <Percent className="w-3.5 h-3.5 text-slate-400" />
                              {typeLabel(campaign.type)}{campaign.type === "percentage" ? ` %${campaign.value}` : campaign.type === "fixed" ? ` ${campaign.value}₺` : ""}
                            </div>
                            
                            <div className="flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {campaign.startDate} → {campaign.endDate}
                            </div>
                            
                            <div className="flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {campaign.usedCount}/{campaign.maxUses} kullanım
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggle(campaign)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                              campaign.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {campaign.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            {campaign.isActive ? "Aktif" : "Pasif"}
                          </button>

                          <button onClick={() => handleEdit(campaign)} className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl hover:bg-blue-100 transition cursor-pointer" title="Düzenle">
                            <Edit className="w-4 h-4" />
                          </button>

                          <button onClick={() => handleDelete(campaign.id)} className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition cursor-pointer" title="Sil">
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

      {/* Tab 2: Pricing Rules */}
      {activeTab === "pricingRules" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">B2B Kademeli Miktar İndirim Kuralları</h2>
              <p className="text-xs text-slate-500 mt-1">Bayilerin sepetlerine ekledikleri ürün miktar eşiğine göre otomatik tanımlanan ek indirimler.</p>
            </div>

            {rulesLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#b45309]" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kurallar Yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Minimum Adet</label>
                    <input
                      type="number"
                      value={newMinQty}
                      onChange={e => setNewMinQty(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Örn: 10"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-[#b45309]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ek İndirim Oranı (%)</label>
                    <input
                      type="number"
                      value={newDiscountPercent}
                      onChange={e => setNewDiscountPercent(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Örn: 5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-[#b45309]"
                    />
                  </div>
                  <button
                    onClick={handleAddRule}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                  >
                    Eşik Ekle
                  </button>
                </div>

                {tierRules.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-2xl text-slate-400">
                    <Sliders className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">Tanımlı kademeli indirim kuralı bulunmamaktadır.</p>
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
                      <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-800">
                        {tierRules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-extrabold border border-blue-100">{rule.minQty}+</span>
                              <span>Adet ve üzeri alımlarda</span>
                            </td>
                            <td className="px-5 py-3.5 text-emerald-700 font-extrabold">
                              %{rule.discountPercent} Ek İndirim
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
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

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveRules}
                    disabled={rulesSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {rulesSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Kuralları Sakla
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-5 flex flex-col justify-between shadow-sm">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Kademeli İndirim Mantığı</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Toptan alımlarda adet arttıkça birim fiyata ek indirim uygular. Zira zararına satış koruması (%5 kâr marjı) sistemsel olarak devrededir.
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2">Varsayılan Örnek Şablon</p>
              <div className="space-y-1.5 text-xs font-semibold text-slate-300">
                <div className="flex justify-between">
                  <span>1 - 9 Adet</span>
                  <span className="text-slate-400">Standart Fiyat</span>
                </div>
                <div className="flex justify-between">
                  <span>10 - 49 Adet</span>
                  <span className="text-amber-400">%5 İndirim</span>
                </div>
                <div className="flex justify-between">
                  <span>50+ Adet</span>
                  <span className="text-emerald-400">%12 İndirim</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Simulator */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">B2B Fiyat & Kampanya Simülatörü</h2>
              <p className="text-xs text-slate-500 mt-0.5">Maliyet, bayilik grubu ve hacim kademelerini canlı olarak test edin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Maliyet (₺)</label>
                <input
                  type="number"
                  value={simCost}
                  onChange={e => setSimCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#b45309]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Liste Fiyatı (₺)</label>
                <input
                  type="number"
                  value={simBasePrice}
                  onChange={e => setSimBasePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#b45309]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bayi Özel Formülü (priceFormula)</label>
                <input
                  type="text"
                  value={simFormula}
                  onChange={e => setSimFormula(e.target.value)}
                  placeholder="Örn: cost * 1.15"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#b45309]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Satın Alma Miktarı (Adet)</label>
                <input
                  type="number"
                  min="1"
                  value={simQuantity}
                  onChange={e => setSimQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#b45309]"
                />
              </div>
            </div>
          </div>

          {/* Simulation Output */}
          {simResult && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <h3 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">Simülasyon Çıktısı</h3>
                </div>

                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
                    <span>Maliyet / Liste Fiyatı</span>
                    <span>{simCost}₺ / {simBasePrice}₺</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Özel Formül Fiyatı</span>
                    <span>{simResult.formulaResult.toFixed(2)}₺</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Kademeli Miktar İndirimi</span>
                    <span className="text-emerald-600 font-bold">
                      {simResult.matchedDiscount > 0 ? `-%${simResult.matchedDiscount}` : "Uygulanmadı"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 text-white text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nihai Bayi Özel Birim Fiyatı</span>
                <span className="text-2xl font-black text-amber-400 block">{simResult.finalPrice.toFixed(2)} TL</span>
                <span className="text-[10px] text-slate-400 block">Toplam ({simQuantity} Adet): {(simResult.finalPrice * simQuantity).toFixed(2)} TL</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Discounts & Bank */}
      {activeTab === "discounts" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Sepet Altı & Havale İndirimleri</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sistem genelinde geçerli indirim oranları ve banka havale bilgileri.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sepet Kampanya Türü</label>
                <select
                  value={cartDiscountType}
                  onChange={e => setCartDiscountType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#b45309]"
                >
                  <option value="none">Kampanya Yok</option>
                  <option value="percentage">Yüzde İndirim (%)</option>
                  <option value="fixed">Sabit İndirim (₺)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">İndirim Değeri</label>
                <input
                  type="number"
                  disabled={cartDiscountType === "none"}
                  value={cartDiscountValue}
                  onChange={e => setCartDiscountValue(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#b45309] disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Banka Havale İndirimi (%)</label>
                <input
                  type="number"
                  value={bankTransferDiscountRate}
                  onChange={e => setBankTransferDiscountRate(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#b45309]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Kampanyalar Sayfası Banner Başlığı (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={campaignsBannerTitle}
                  onChange={e => setCampaignsBannerTitle(e.target.value)}
                  placeholder="örn: 2000 TL Üzeri Ücretsiz Kargo & Havale İndirimi"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#b45309]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Boş bırakılırsa kargo ve havale oranına göre otomatik oluşturulur.</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Kampanyalar Sayfası Banner Açıklaması (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={campaignsBannerDesc}
                  onChange={e => setCampaignsBannerDesc(e.target.value)}
                  placeholder="örn: Tüm siparişlerinizde kargo tarafımızdan karşılanır..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#b45309]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Boş bırakılırsa dinamik kargo ve havale avantaj metni yazılır.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveDiscounts}
                disabled={discountsSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {discountsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Genel İndirimleri Kaydet
              </button>
            </div>
          </div>

          {/* Bank Accounts Management */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Havale / EFT Banka Hesapları</h3>
                <p className="text-xs text-slate-500 mt-0.5">Müşterilerin ödeme sayfasında göreceği aktif şirket banka hesapları.</p>
              </div>
              <button
                onClick={openAddBank}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Yeni Banka Ekle
              </button>
            </div>

            {banksLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#b45309]" />
                <p className="text-xs font-bold text-slate-500">Banka hesapları yükleniyor...</p>
              </div>
            ) : banks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs font-semibold">Kayıtlı banka hesabı bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banks.map((b: any) => (
                  <div key={b.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex justify-between items-start">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900">{b.name}</h4>
                      <p className="text-xs font-mono font-bold text-slate-700 break-all">{b.iban || "IBAN Belirtilmemiş"}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{b.branch ? `${b.branch} Şubesi • ` : ""}{b.accountNumber ? `Hesap No: ${b.accountNumber}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => openEditBank(b)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Düzenle">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteBank(b.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Sil">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BANK MODAL */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingBank ? "Banka Hesabını Düzenle" : "Yeni Banka Hesabı Ekle"}
              </h3>
              <button onClick={() => setIsBankModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Banka Adı *</label>
                <input
                  type="text"
                  value={bankForm.name}
                  onChange={e => setBankForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="örn: Ziraat Bankası"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">IBAN *</label>
                <input
                  type="text"
                  value={bankForm.iban}
                  onChange={e => setBankForm(prev => ({ ...prev, iban: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
                  placeholder="TR..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-[#b45309] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Şube</label>
                  <input
                    type="text"
                    value={bankForm.branch}
                    onChange={e => setBankForm(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="İspir Şubesi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hesap No</label>
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={e => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="12345678"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                  />
                </div>
              </div>
              <div className="pt-3 flex gap-2 border-t border-slate-100">
                <button
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveBank}
                  className="flex-1 py-2.5 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — Create / Edit Campaign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-3xl shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#b45309]" />
                {editingCampaign ? "Kampanyayı Düzenle" : "Yeni Kampanya Oluştur"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kampanya Adı *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="örn: İspir Dut Pekmezi Yaz Fırsatı %15"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kupon Kodu *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={form.code}
                      onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
                      placeholder="PEKEFE15"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:border-[#b45309] outline-none"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Rastgele Kod Üret"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-amber-700" /> Kod Üret
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">İndirim Tipi</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none cursor-pointer"
                  >
                    <option value="percentage">Yüzde İndirim (%)</option>
                    <option value="fixed">Sabit İndirim Tutarı (₺)</option>
                    <option value="free_shipping">Ücretsiz Kargo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">İndirim Miktarı</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={e => setForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-[#b45309] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Min. Sepet Tutarı (₺)</label>
                  <input
                    type="number"
                    value={form.minOrder}
                    onChange={e => setForm(prev => ({ ...prev, minOrder: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-[#b45309] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hedef Kitle</label>
                  <select
                    value={form.target}
                    onChange={e => setForm(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none cursor-pointer"
                  >
                    <option value="all">Tüm Ziyaretçiler</option>
                    <option value="b2c">B2C Bireysel Müşteriler</option>
                    <option value="b2b">B2B Kurumsal Bayiler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kampanya Açıklaması</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ziyaretçilerin göreceği kısa kampanya koşulları veya duyuru açıklaması..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#b45309] outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#b45309] hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-md"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Kaydediliyor..." : editingCampaign ? "Güncelle" : "Kampanyayı Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
