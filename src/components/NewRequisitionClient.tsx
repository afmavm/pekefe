"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  ClipboardList, Plus, Trash2, Calendar, Layout, 
  ArrowLeft, Save, Send, AlertTriangle, Info,
  Package, DollarSign, Store, Tag, Sparkles, Building
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  criticalLimit: number;
  locations: Array<{
    warehouseId: string;
    stock: number;
    minStock: number;
    criticalLimit: number;
    warehouse: { name: string };
  }>;
}

interface Branch {
  id: string;
  name: string;
  warehouses: Array<{ id: string; name: string }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  branchId?: string;
  warehouseId?: string;
}

interface RequisitionItemInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;
  description: string;
}

export function NewRequisitionClient() {
  const { data: session } = useSession();
  const router = useRouter();

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("Satın Alma");
  const [requesterId, setRequesterId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [priority, setPriority] = useState<"Düşük" | "Normal" | "Yüksek" | "Kritik">("Normal");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10) // 7 days later
  );
  const [notes, setNotes] = useState("");
  
  // Requisition Items State
  const [items, setItems] = useState<RequisitionItemInput[]>([
    { productId: "", warehouseId: "", quantity: 1, unitPrice: 0, description: "" }
  ]);

  // Selected item index for showing details panel
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  // Fetch initial master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [prodRes, branchRes, userRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/branches"),
          fetch("/api/users")
        ]);

        const prodData = await prodRes.json();
        const branchData = await branchRes.json();
        const userData = await userRes.json();

        const safeProd = Array.isArray(prodData) ? prodData : [];
        const safeBranch = Array.isArray(branchData) ? branchData : [];
        const safeUser = Array.isArray(userData) ? userData : [];

        setProducts(safeProd);
        setBranches(safeBranch);
        setUsers(safeUser);

        // Auto select current logged-in user
        if (session?.user?.email && safeUser.length > 0) {
          const matchedUser = safeUser.find((u: User) => u.email === session.user?.email);
          if (matchedUser) {
            setRequesterId(matchedUser.id);
            if (matchedUser.branchId) {
              setBranchId(matchedUser.branchId);
            }
          }
        } else if (safeUser.length > 0) {
          setRequesterId(safeUser[0].id);
        }

        if (safeBranch.length > 0 && !branchId) {
          setBranchId(safeBranch[0].id);
        }
      } catch (error) {
        toast.error("Gerekli tanımlamalar yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, [session]);

  // Auto select warehouse for items when branch changes
  useEffect(() => {
    if (branchId) {
      const branchObj = branches.find(b => b.id === branchId);
      if (branchObj && branchObj.warehouses.length > 0) {
        const defaultWhId = branchObj.warehouses[0].id;
        setItems(prev => prev.map(item => ({
          ...item,
          warehouseId: item.warehouseId ? item.warehouseId : defaultWhId
        })));
      }
    }
  }, [branchId, branches]);

  // Items handlers
  const handleAddItem = () => {
    const branchObj = branches.find(b => b.id === branchId);
    const defaultWhId = branchObj && branchObj.warehouses.length > 0 ? branchObj.warehouses[0].id : "";
    setItems(prev => [
      ...prev,
      { productId: "", warehouseId: defaultWhId, quantity: 1, unitPrice: 0, description: "" }
    ]);
    setActiveItemIndex(items.length);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.warning("En az bir ürün kalemi girmelisiniz.");
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
    setActiveItemIndex(0);
  };

  const handleItemChange = (index: number, field: keyof RequisitionItemInput, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };
        // Auto-fill price if product changes
        if (field === "productId") {
          const prod = products.find(p => p.id === value);
          if (prod) {
            updated.unitPrice = prod.price;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // Calculations
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Active Item Metadata Helpers
  const activeItem = items[activeItemIndex];
  const activeProduct = activeItem ? products.find(p => p.id === activeItem.productId) : null;
  const activeWarehouse = activeItem && activeProduct ? activeProduct.locations.find(l => l.warehouseId === activeItem.warehouseId) : null;
  
  // Simulated Supplier & Last purchase info
  const getLastPurchaseInfo = () => {
    if (!activeProduct) return null;
    const lastPrice = activeProduct.cost || activeProduct.price * 0.85;
    const suppliers = ["Pekefe Çelik A.Ş.", "Arı Ekipmanları Sanayi", "Petek Ambalaj A.Ş.", "Teknik Metal LTD."];
    // Hash product id to keep supplier consistent for demo
    const index = activeProduct.id.charCodeAt(0) % suppliers.length;
    return {
      price: lastPrice,
      supplier: suppliers[index]
    };
  };
  const lastPurchaseInfo = getLastPurchaseInfo();

  // Simulated Alternative Products
  const getAlternatives = () => {
    if (!activeProduct) return [];
    return products
      .filter(p => p.category === activeProduct.category && p.id !== activeProduct.id)
      .slice(0, 3);
  };
  const alternatives = getAlternatives();

  // Submit Handler
  const handleSubmit = async (submitStatus: "Taslak" | "Onay Bekliyor") => {
    if (!branchId || !departmentId || !requesterId) {
      toast.error("Lütfen genel bilgileri eksiksiz doldurun.");
      return;
    }

    const invalidItem = items.some(item => !item.productId || !item.warehouseId || item.quantity <= 0);
    if (invalidItem) {
      toast.error("Lütfen ürün kalemi bilgilerini (ürün, depo, miktar) eksiksiz doldurun.");
      return;
    }

    const toastId = toast.loading("Talep kaydediliyor...");
    try {
      const payload = {
        branchId,
        departmentId,
        requesterId,
        projectId: projectId || null,
        costCenterId: costCenterId || null,
        priority,
        status: submitStatus,
        expectedDeliveryDate,
        notes: notes || null,
        items
      };

      const res = await fetch("/api/purchase-requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(submitStatus === "Onay Bekliyor" ? "Talep başarıyla onaya sunuldu!" : "Talep taslak olarak kaydedildi.", { id: toastId });
      router.push("/muhasebe/purchase-requisitions");
    } catch (error: any) {
      toast.error(error.message || "Kaydetme işlemi sırasında hata oluştu.", { id: toastId });
    }
  };

  const selectedBranchObj = branches.find(b => b.id === branchId);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/muhasebe/purchase-requisitions")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-850"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-base font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              Yeni Satın Alma Talebi
            </h1>
            <p className="text-[10px] text-slate-500">Yeni bir ihtiyaç talebi hazırlayın ve onay akışını başlatın.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit("Taslak")}
            className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4 text-slate-500" /> Taslak Kaydet
          </button>
          <button
            onClick={() => handleSubmit("Onay Bekliyor")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md hover:scale-[1.02]"
          >
            <Send className="w-4 h-4" /> Onaya Sun
          </button>
        </div>
      </div>

      {/* Main Grid: Form + Metadata Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" /> Genel Bilgiler
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Talep No</label>
                <input 
                  type="text" disabled placeholder="Otomatik Üretilecek"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Talep Tarihi</label>
                <input 
                  type="date" disabled defaultValue={new Date().toISOString().substring(0, 10)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl outline-none font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Talep Eden</label>
                <select
                  value={requesterId}
                  onChange={e => setRequesterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 transition-all shadow-sm"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Şube (Organizasyon)</label>
                <select
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 transition-all shadow-sm"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Departman</label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 transition-all shadow-sm"
                >
                  {["Yönetim", "Muhasebe", "Satın Alma", "Satış & Pazarlama", "Üretim", "Depo & Sevkiyat", "IT & Altyapı"].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Masraf Merkezi</label>
                <select
                  value={costCenterId}
                  onChange={e => setCostCenterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 transition-all shadow-sm"
                >
                  <option value="">Seçin (Opsiyonel)</option>
                  <option value="MM-01">Genel Yönetim Giderleri (MM-01)</option>
                  <option value="MM-02">Üretim Maliyetleri (MM-02)</option>
                  <option value="MM-03">Satış Dağıtım Masrafları (MM-03)</option>
                  <option value="MM-04">ArGe \ İnovasyon Merkezi (MM-04)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Proje Kodu</label>
                <input 
                  type="text" placeholder="Örn: PRJ-2026-FIBER"
                  value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Öncelik Seviyesi</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 transition-all shadow-sm"
                >
                  <option value="Düşük">Düşük</option>
                  <option value="Normal">Normal</option>
                  <option value="Yüksek">Yüksek</option>
                  <option value="Kritik">Kritik</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Beklenen Teslim Tarihi</label>
                <input 
                  type="date" required
                  value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Product Items Breakdown Table */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" /> Talep Edilen Malzeme & Hizmet Kalemleri
              </h3>
              <button
                type="button" onClick={handleAddItem}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Kalem Ekle
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveItemIndex(idx)}
                  className={`p-4 border rounded-2xl transition cursor-pointer text-xs ${
                    activeItemIndex === idx 
                      ? "border-indigo-500 bg-indigo-500/5" 
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/40"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* Index */}
                    <div className="md:col-span-1 flex items-center justify-center font-black text-slate-400">
                      #{idx + 1}
                    </div>

                    {/* Product */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="font-extrabold text-[10px] text-slate-400 block uppercase">Ürün / Hizmet</label>
                      <select
                        value={item.productId}
                        onChange={e => handleItemChange(idx, "productId", e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-850 dark:text-slate-100"
                      >
                        <option value="">Ürün Seçin</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>

                    {/* Warehouse */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="font-extrabold text-[10px] text-slate-400 block uppercase">Depo</label>
                      <select
                        value={item.warehouseId}
                        onChange={e => handleItemChange(idx, "warehouseId", e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-850 dark:text-slate-100"
                      >
                        {selectedBranchObj ? (
                          selectedBranchObj.warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))
                        ) : (
                          <option value="">Depo Seçin</option>
                        )}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-1.5 space-y-1">
                      <label className="font-extrabold text-[10px] text-slate-400 block uppercase">Miktar</label>
                      <input 
                        type="number" min="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-850 dark:text-slate-100"
                      />
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="font-extrabold text-[10px] text-slate-400 block uppercase">Birim Fiyat (TRY)</label>
                      <input 
                        type="number" min="0" step="0.01"
                        value={item.unitPrice}
                        onChange={e => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-850 dark:text-slate-100 text-right font-mono"
                      />
                    </div>

                    {/* Remove */}
                    <div className="md:col-span-0.5 flex justify-end">
                      <button
                        type="button" onClick={() => handleRemoveItem(idx)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-650 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-2">
                    <div className="md:col-span-1"></div>
                    <div className="md:col-span-8">
                      <input 
                        type="text" placeholder="İhtiyaç detay açıklaması veya satır notu girin..."
                        value={item.description}
                        onChange={e => handleItemChange(idx, "description", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-200 dark:hover:border-slate-800 dark:focus:border-slate-800 outline-none text-[10px] text-slate-500 font-bold"
                      />
                    </div>
                    <div className="md:col-span-3 text-right text-[11px] font-black text-slate-600 dark:text-slate-400 mt-1.5 pr-2">
                      Satır Toplamı: {formatCurrency(item.quantity * item.unitPrice, "TRY")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall totals */}
            <div className="flex justify-end pt-3">
              <div className="w-64 space-y-1.5 text-xs bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-2xl">
                <div className="flex justify-between font-black text-slate-800 dark:text-slate-200 text-sm">
                  <span>Tahmini Genel Toplam:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalAmount, "TRY")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block text-xs">Talep Notları & Açıklama</label>
            <textarea
              rows={3} placeholder="Talep amacını, aciliyet sebeplerini veya ek notlarınızı buraya yazın..."
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-xs text-slate-800 dark:text-slate-100 focus:border-indigo-500 transition-all shadow-sm resize-none"
            />
          </div>
        </div>

        {/* Sidebar Metadata Details Panel */}
        <div className="space-y-6">
          {/* Budget Limit warning */}
          {totalAmount > 50000 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 font-black text-xs">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                Bütçe Limit Uyarısı
              </div>
              <p className="text-[10px] leading-relaxed font-bold">
                Talep tutarı **{formatCurrency(50000, "TRY")}** onay limit eşiğini aştığı için bu talep Genel Müdür veya Yönetim Kurulu onay kademesine aktarılacaktır.
              </p>
            </div>
          )}

          {/* Product Metadata Info panel */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
                Seçili Kalem Akıllı Analiz
              </h3>
            </div>

            {activeProduct ? (
              <div className="space-y-5 text-xs">
                {/* Product Name Header */}
                <div>
                  <h4 className="font-black text-slate-850 dark:text-slate-100">{activeProduct.name}</h4>
                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">SKU: {activeProduct.sku}</span>
                </div>

                {/* Stock Status Grid */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                    <span>SEÇİLİ DEPO STOK DURUMU</span>
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">Kullanılabilir Stok</span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-150">
                        {activeWarehouse ? `${activeWarehouse.stock} Adet` : "0 Adet"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block text-right font-bold">Kritik Limit</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {activeWarehouse ? `${activeWarehouse.criticalLimit} Adet` : `${activeProduct.criticalLimit} Adet`}
                      </span>
                    </div>
                  </div>
                  {activeWarehouse && activeWarehouse.stock <= activeWarehouse.criticalLimit && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-[9px] font-bold flex items-center gap-1 leading-normal">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Kritik stok seviyesinin altında veya sınırda! Tedarik yapılması önerilir.
                    </div>
                  )}
                </div>

                {/* Last Purchase Information */}
                {lastPurchaseInfo && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                      <span>SON SATIN ALMA DETAYI</span>
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">Son Alış Fiyatı</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(lastPurchaseInfo.price, "TRY")}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold text-right">Son Tedarikçi</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-right truncate" title={lastPurchaseInfo.supplier}>
                          {lastPurchaseInfo.supplier}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternatives */}
                {alternatives.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Alternatif Ürün Önerileri</span>
                    <div className="space-y-2">
                      {alternatives.map(alt => (
                        <div 
                          key={alt.id}
                          className="flex items-center justify-between p-2.5 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 hover:border-indigo-400 transition"
                        >
                          <div>
                            <div className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200">{alt.name}</div>
                            <div className="text-[8px] text-slate-400 font-mono">{alt.sku}</div>
                          </div>
                          <span className="font-black text-indigo-600 dark:text-indigo-400 text-[10px]">
                            {formatCurrency(alt.price, "TRY")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 font-bold text-xs space-y-2">
                <Info className="w-6 h-6 text-slate-350 mx-auto" />
                <p>Ürün bazlı stok durumu, son alış fiyatı ve alternatif önerilerini incelemek için soldan bir ürün seçin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
