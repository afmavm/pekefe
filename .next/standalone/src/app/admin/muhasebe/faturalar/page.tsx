"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Plus, Search, Edit2, Trash2, Filter, Eye, FileText, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalAmount: number;
}

interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  taxAmount: number;
  status: string;
  type: string;
  currentAccount: { id: string, name: string };
  invoiceItems?: InvoiceItem[];
  externalLink?: string;
}

export default function FaturalarPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<{id:string, name:string}[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    currentAccountId: "", type: "SATIS", date: new Date().toISOString().split("T")[0], dueDate: new Date().toISOString().split("T")[0],
    notes: "", items: [] as InvoiceItem[], status: "TASLAK"
  });

  const fetchInvoices = () => {
    setLoading(true);
    fetch("/api/accounting/invoices")
      .then(res => res.json())
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  const fetchAccounts = () => {
    fetch("/api/accounting/current-accounts")
      .then(res => res.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
  }, []);

  const openAddModal = () => {
    setSelectedInvoice(null);
    setFormData({
      currentAccountId: "", type: "SATIS", date: new Date().toISOString().split("T")[0], dueDate: new Date().toISOString().split("T")[0],
      notes: "", items: [{ name: "", quantity: 1, unitPrice: 0, vatRate: 18, totalAmount: 0 }], status: "TASLAK"
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsDeleteOpen(true);
  };

  const openViewModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsViewOpen(true);
    fetch("/api/accounting/invoices/" + inv.id).then(res => res.json()).then(data => setSelectedInvoice(data));
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/accounting/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    fetchInvoices();
  };

  const calculateTotals = (items: InvoiceItem[]) => {
    let subTotal = 0;
    let taxTotal = 0;
    items.forEach(item => {
      const rowSub = item.quantity * item.unitPrice;
      const rowTax = rowSub * (item.vatRate / 100);
      subTotal += rowSub;
      taxTotal += rowTax;
    });
    return { subTotal, taxTotal, total: subTotal + taxTotal };
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    
    // Auto calc row total
    const rowSub = newItems[index].quantity * newItems[index].unitPrice;
    const rowTax = rowSub * (newItems[index].vatRate / 100);
    newItems[index].totalAmount = rowSub + rowTax;

    setFormData({ ...formData, items: newItems });
  };

  const addItemRow = () => {
    setFormData({ ...formData, items: [...formData.items, { name: "", quantity: 1, unitPrice: 0, vatRate: 18, totalAmount: 0 }] });
  };
  const removeItemRow = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) return alert("En az 1 kalem eklemelisiniz.");
    const totals = calculateTotals(formData.items);
    
    await fetch("/api/accounting/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        taxAmount: totals.taxTotal,
        totalAmount: totals.total
      })
    });
    setIsModalOpen(false);
    fetchInvoices();
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    await fetch(`/api/accounting/invoices/${selectedInvoice.id}`, { method: "DELETE" });
    fetchInvoices();
  };

  const totals = calculateTotals(formData.items);

  const stats = {
    toplam: invoices.reduce((acc, inv) => acc + inv.totalAmount, 0),
    odenen: invoices.filter(i => i.status === "ODENDI").reduce((acc, inv) => acc + inv.totalAmount, 0),
    bekleyen: invoices.filter(i => i.status !== "ODENDI" && i.status !== "IPTAL").reduce((acc, inv) => acc + inv.totalAmount, 0),
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturalar</h1>
          <p className="text-gray-500 text-sm mt-1">Alış ve satış faturalarınızı yönetin.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-lg shadow-blue-600/20">
          <Plus className="w-5 h-5" /> Yeni Fatura Kes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">Toplam İşlem Hacmi</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.toplam)}</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-emerald-700 text-sm font-medium mb-1">Ödenen (Tahsil Edilen)</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.odenen)}</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
          <p className="text-amber-700 text-sm font-medium mb-1">Bekleyen (Açık)</p>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(stats.bekleyen)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Tarih / Vade</th>
                <th className="px-6 py-4">Cari Hesap</th>
                <th className="px-6 py-4">Tip</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">Toplam Tutar</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Fatura bulunamadı.</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">{new Date(inv.date).toLocaleDateString("tr-TR")}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Vade: {new Date(inv.dueDate).toLocaleDateString("tr-TR")}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold">{inv.currentAccount.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${inv.type === "SATIS" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{inv.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider ${
                      inv.status === "TASLAK" ? "bg-gray-100 text-gray-600" :
                      inv.status === "ONAYLANDI" ? "bg-blue-100 text-blue-700" :
                      inv.status === "ODENDI" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {inv.status !== "ODENDI" && inv.status !== "IPTAL" && (
                        <button onClick={() => updateStatus(inv.id, "ODENDI")} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Ödendi İşaretle"><CheckCircle className="w-4 h-4" /></button>
                      )}
                      
                      {/* e-Fatura Gönderme Butonu (Taslak durumundaysa) */}
                      {inv.status === "TASLAK" && (
                        <button 
                          onClick={async () => {
                            const toastId = toast.loading("e-Fatura GİB sistemine gönderiliyor...");
                            try {
                              const res = await fetch("/api/integrations/efatura", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ invoiceId: inv.id })
                              });
                              const data = await res.json();
                              toast.dismiss(toastId);
                              if (data.success) {
                                toast.success(data.message);
                                fetchInvoices();
                              } else {
                                toast.error(data.error || "Gönderim başarısız.");
                              }
                            } catch {
                              toast.dismiss(toastId);
                              toast.error("Bağlantı hatası oluştu.");
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="e-Fatura / e-Arşiv Gönder"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                          </svg>
                        </button>
                      )}

                      {/* e-Fatura Görüntüleme Butonu (Eğer onaylanmış/gönderilmişse ve link varsa) */}
                      {inv.externalLink && (
                        <a 
                          href={inv.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition inline-flex items-center"
                          title="e-Fatura PDF Gör"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                      )}

                      <button onClick={() => openViewModal(inv)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Görüntüle"><Eye className="w-4 h-4" /></button>
                      {inv.status !== "ONAYLANDI" && inv.status !== "ODENDI" && (
                        <button onClick={() => openDeleteModal(inv)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Sil"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Fatura" maxWidth="max-w-4xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Cari Hesap <span className="text-red-500">*</span></label>
              <select required value={formData.currentAccountId} onChange={e => setFormData({...formData, currentAccountId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                <option value="">Seçiniz</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fatura Tipi</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                <option value="SATIS">Satış Faturası</option>
                <option value="ALIS">Alış Faturası</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Durum</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                <option value="TASLAK">Taslak</option>
                <option value="ONAYLANDI">Onaylandı</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Fatura Tarihi</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Vade Tarihi</label>
              <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Fatura Kalemleri</h3>
              <button type="button" onClick={addItemRow} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                <Plus className="w-4 h-4" /> Kalem Ekle
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Ürün/Hizmet Adı</label>
                    <input required type="text" value={item.name} onChange={e => handleItemChange(index, "name", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Miktar</label>
                    <input required type="number" min="0.1" step="0.1" value={item.quantity} onChange={e => handleItemChange(index, "quantity", parseFloat(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Birim Fiyat</label>
                    <input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(index, "unitPrice", parseFloat(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">KDV %</label>
                    <select value={item.vatRate} onChange={e => handleItemChange(index, "vatRate", parseFloat(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                      <option value="0">0%</option>
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Satır Toplamı</label>
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 font-medium">
                      {formatCurrency(item.totalAmount)}
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItemRow(index)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition mb-px">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.items.length === 0 && <p className="text-sm text-center text-gray-400 py-4">Kalem eklenmedi.</p>}
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Ara Toplam:</span> <span className="font-medium">{formatCurrency(totals.subTotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Toplam KDV:</span> <span className="font-medium">{formatCurrency(totals.taxTotal)}</span></div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Genel Toplam:</span> <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-sm">İptal</button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-md shadow-blue-600/20">Faturayı Kaydet</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Fatura Detayı" maxWidth="max-w-2xl">
        {selectedInvoice ? (
           <div className="space-y-6">
             <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-xl font-bold text-gray-900">{selectedInvoice.currentAccount?.name}</h2>
                 <p className="text-sm text-gray-500 mt-1">Fatura Tipi: {selectedInvoice.type}</p>
                 <p className="text-sm text-gray-500">Tarih: {new Date(selectedInvoice.date).toLocaleDateString("tr-TR")}</p>
               </div>
               <span className="px-3 py-1 rounded-md text-sm font-bold bg-gray-100 text-gray-700">{selectedInvoice.status}</span>
             </div>
             <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Açıklama</th>
                    <th className="px-4 py-3">Miktar</th>
                    <th className="px-4 py-3">Fiyat</th>
                    <th className="px-4 py-3">KDV</th>
                    <th className="px-4 py-3 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedInvoice.invoiceItems?.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3">%{item.vatRate}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
             <div className="flex justify-end">
               <div className="w-64 space-y-2 text-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-gray-600"><span>KDV Toplamı:</span> <span className="font-medium">{formatCurrency(selectedInvoice.taxAmount)}</span></div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Genel Toplam:</span> <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
               </div>
             </div>
           </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Faturayı Sil"
        message={`Faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
      />
    </div>
  );
}

