"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { 
  createRecipeItemAction, 
  deleteRecipeItemAction 
} from "@/modules/production/server/productionActions";
import { 
  Layers3, 
  Plus, 
  Trash2, 
  Layers,
  ArrowRight
} from "lucide-react";

interface RecipesClientProps {
  initialData: any;
}

export default function RecipesClient({ initialData }: RecipesClientProps) {
  const [finishedGoods, setFinishedGoods] = useState<any[]>(initialData.finishedGoods || []);
  const [loading, setLoading] = useState(false);

  // Form states
  const [mainProductId, setMainProductId] = useState("");
  const [mainProductVariantId, setMainProductVariantId] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [ingredientVariantId, setIngredientVariantId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("Adet");

  // Selection helpers
  const selectedMainProduct = finishedGoods.find(p => p.id === mainProductId);
  const mainVariants = selectedMainProduct?.variants || [];
  
  const selectedIngredient = initialData.rawMaterials.find((p: any) => p.id === ingredientId);
  const ingredientVariants = selectedIngredient?.variants || [];

  const handleAddRecipeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainProductId || !ingredientId || quantity <= 0 || !unit) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const res = await createRecipeItemAction({
        mainProductId,
        mainProductVariantId: mainProductVariantId || null,
        ingredientId,
        ingredientVariantId: ingredientVariantId || null,
        quantity,
        unit
      });

      if (res.success && res.data) {
        toast.success("Reçete kalemi eklendi.");
        
        // Refresh local state list
        const updatedFinishedGoods = finishedGoods.map(p => {
          if (p.id === mainProductId) {
            const newItem = {
              ...res.data,
              ingredient: selectedIngredient,
              ingredientVariant: ingredientVariants.find((v: any) => v.id === ingredientVariantId) || null,
              mainProductVariant: mainVariants.find((v: any) => v.id === mainProductVariantId) || null
            };
            return {
              ...p,
              recipe: [...(p.recipe || []), newItem]
            };
          }
          return p;
        });
        setFinishedGoods(updatedFinishedGoods);

        // Reset inputs
        setIngredientId("");
        setIngredientVariantId("");
        setQuantity(1);
      } else {
        toast.error(res.error || "Eklenemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (recipeItemId: string, parentProductId: string) => {
    if (!confirm("Bu reçete bileşenini silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await deleteRecipeItemAction(recipeItemId);
      if (res.success) {
        toast.success("Bileşen silindi.");
        const updatedFinishedGoods = finishedGoods.map(p => {
          if (p.id === parentProductId) {
            return {
              ...p,
              recipe: p.recipe.filter((r: any) => r.id !== recipeItemId)
            };
          }
          return p;
        });
        setFinishedGoods(updatedFinishedGoods);
      } else {
        toast.error(res.error || "Silinemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Sistem hatası.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers3 className="w-8 h-8 text-orange-500" />
            BOM / ÜRÜN REÇETELERİ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ürünlerinizin imalatında tüketilecek hammadde ve yarı mamul karışım reçetelerini (BOM Ağacı) belirleyin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Add Recipe Item Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5 h-fit">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            Reçeteye Hammadde Ekle
          </h2>
          <form onSubmit={handleAddRecipeItem} className="space-y-4">
            {/* Main Product */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Ana Ürün (Mamul)</label>
              <select
                value={mainProductId}
                onChange={(e) => {
                  setMainProductId(e.target.value);
                  setMainProductVariantId("");
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="">-- Mamul Seçin --</option>
                {finishedGoods.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                ))}
              </select>
            </div>

            {mainVariants.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Mamul Varyantı</label>
                <select
                  value={mainProductVariantId}
                  onChange={(e) => setMainProductVariantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                >
                  <option value="">Varsayılan (Tüm Varyantlar)</option>
                  {mainVariants.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {Object.values(v.attributes as Record<string, string>).join(" ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-center py-1">
              <ArrowRight className="w-5 h-5 text-slate-400 rotate-90" />
            </div>

            {/* Ingredient */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Kullanılacak Bileşen (Hammadde)</label>
              <select
                value={ingredientId}
                onChange={(e) => {
                  setIngredientId(e.target.value);
                  setIngredientVariantId("");
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
              >
                <option value="">-- Hammadde Seçin --</option>
                {initialData.rawMaterials.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                ))}
              </select>
            </div>

            {ingredientVariants.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bileşen Varyantı</label>
                <select
                  value={ingredientVariantId}
                  onChange={(e) => setIngredientVariantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                >
                  <option value="">Varsayılan</option>
                  {ingredientVariants.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {Object.values(v.attributes as Record<string, string>).join(" ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Birim Miktar</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Ölçü Birimi</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:bg-white focus:border-orange-400 outline-none transition text-slate-800"
                >
                  <option value="Adet">Adet</option>
                  <option value="kg">kg</option>
                  <option value="gr">gr</option>
                  <option value="metre">metre</option>
                  <option value="litre">litre</option>
                  <option value="Paket">Paket</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Reçeteye Ekle
            </button>
          </form>
        </div>

        {/* Recipes BOM Tree */}
        <div className="xl:col-span-2 space-y-6">
          {finishedGoods.map(goods => {
            const hasRecipe = goods.recipe && goods.recipe.length > 0;
            return (
              <div key={goods.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="font-bold text-sm text-slate-800">{goods.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">SKU: {goods.sku}</span>
                    </div>
                  </div>
                </div>

                <div className="p-0">
                  {!hasRecipe ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Bu ürüne ait reçete (BOM) bulunmamaktadır. Sol taraftan malzeme ekleyebilirsiniz.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          <th className="p-3 pl-4">Hammadde (Bileşen)</th>
                          <th className="p-3">Gerekli Miktar</th>
                          <th className="p-3 text-right pr-4">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                        {goods.recipe.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 pl-4 font-semibold">
                              {item.ingredient?.name} 
                              {item.ingredientVariant && (
                                <span className="text-slate-400 font-medium text-[10px] ml-1.5">
                                  ({Object.values(item.ingredientVariant.attributes as Record<string, string>).join(", ")})
                                </span>
                              )}
                              <div className="text-[9px] text-slate-400">SKU: {item.ingredient?.sku}</div>
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-3 text-right pr-4">
                              <button
                                onClick={() => handleDeleteItem(item.id, goods.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition"
                                title="Bileşeni Çıkar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

