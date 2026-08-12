"use client";

import { useState, useEffect } from "react";
import {
  Navigation, Save, Check, Loader2, Plus, Trash2, GripVertical, ExternalLink,
  ChevronRight, Megaphone, Truck, ShieldCheck, Star, Package, Clock, Award, Tag, Zap, Sparkles, Eye, EyeOff
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLink {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
}

interface TopBarItem {
  id: string;
  text: string;
  icon: string;
  enabled: boolean;
}

const ICON_OPTIONS = [
  { value: "truck", label: "Kargo", Icon: Truck },
  { value: "shield", label: "Güvenlik", Icon: ShieldCheck },
  { value: "star", label: "Yıldız", Icon: Star },
  { value: "package", label: "Paket", Icon: Package },
  { value: "clock", label: "Saat", Icon: Clock },
  { value: "award", label: "Ödül", Icon: Award },
  { value: "tag", label: "Etiket", Icon: Tag },
  { value: "zap", label: "Şimşek", Icon: Zap },
  { value: "sparkles", label: "Parlama", Icon: Sparkles },
];

const ICON_MAP: Record<string, React.ElementType> = {
  truck: Truck, shield: ShieldCheck, star: Star, package: Package,
  clock: Clock, award: Award, tag: Tag, zap: Zap, sparkles: Sparkles,
};

// ─── Sortable NavLink Row ────────────────────────────────────────────────────

function SortableNavLink({ link, onUpdate, onDelete }: {
  link: NavLink;
  onUpdate: (id: string, field: keyof NavLink, val: string | boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm ${isDragging ? "shadow-xl" : ""}`}>
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>
      <input
        type="text" value={link.label}
        onChange={(e) => onUpdate(link.id, "label", e.target.value)}
        placeholder="Menü Adı"
        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 bg-white text-slate-900 transition"
      />
      <input
        type="text" value={link.href}
        onChange={(e) => onUpdate(link.id, "href", e.target.value)}
        placeholder="/sayfa veya https://..."
        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 bg-white text-slate-900 transition"
      />
      <button
        onClick={() => onUpdate(link.id, "isExternal", !link.isExternal)}
        title="Dış link"
        className={`p-2 rounded-lg border transition shrink-0 ${link.isExternal ? "border-blue-300 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}
      >
        <ExternalLink className="w-4 h-4" />
      </button>
      <button onClick={() => onDelete(link.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Sortable TopBar Item Row ────────────────────────────────────────────────

function SortableTopBarItem({ item, onUpdate, onDelete }: {
  item: TopBarItem;
  onUpdate: (id: string, field: keyof TopBarItem, val: string | boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const IconComp = ICON_MAP[item.icon] || Sparkles;

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 bg-white border rounded-xl p-3 shadow-sm transition ${isDragging ? "shadow-xl" : ""} ${!item.enabled ? "opacity-50 border-gray-100" : "border-gray-200"}`}>
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Icon selector */}
      <div className="relative shrink-0">
        <select
          value={item.icon}
          onChange={(e) => onUpdate(item.id, "icon", e.target.value)}
          className="appearance-none pl-8 pr-2 py-2 text-sm border border-gray-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 cursor-pointer"
        >
          {ICON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <IconComp className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
      </div>

      {/* Text */}
      <input
        type="text" value={item.text}
        onChange={(e) => onUpdate(item.id, "text", e.target.value)}
        placeholder="Öğe metni..."
        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 bg-white text-slate-900 transition"
      />

      {/* Toggle enabled */}
      <button
        onClick={() => onUpdate(item.id, "enabled", !item.enabled)}
        title={item.enabled ? "Gizle" : "Göster"}
        className={`p-2 rounded-lg border transition shrink-0 ${item.enabled ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-gray-200 text-gray-400"}`}
      >
        {item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* Delete */}
      <button onClick={() => onDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const DEFAULT_TOP_BAR_ITEMS: TopBarItem[] = [
  { id: "1", text: "Türkiye'nin Her Yerine Güvenli Sevkiyat", icon: "truck", enabled: true },
  { id: "2", text: "%100 Doğal ve Tescilli Lezzet", icon: "shield", enabled: true },
];

export default function NavbarAdminPage() {
  const [activeTab, setActiveTab] = useState<"topbar" | "navbar">("topbar");

  // NavLinks state
  const [links, setLinks] = useState<NavLink[]>([
    { id: "1", label: "Ürünler", href: "/products", isExternal: false },
    { id: "2", label: "Hakkımızda", href: "/hakkimizda", isExternal: false },
    { id: "3", label: "İletişim", href: "/contact", isExternal: false },
  ]);

  // TopBar items state
  const [topBarItems, setTopBarItems] = useState<TopBarItem[]>(DEFAULT_TOP_BAR_ITEMS);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Load topBarItems from API
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.topBarItems) {
          try {
            const parsed = typeof data.topBarItems === "string" ? JSON.parse(data.topBarItems) : data.topBarItems;
            if (Array.isArray(parsed) && parsed.length > 0) setTopBarItems(parsed);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // ── NavLink handlers ──
  const handleNavDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setLinks((prev) => {
        const oldIdx = prev.findIndex((l) => l.id === active.id);
        const newIdx = prev.findIndex((l) => l.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };
  const addLink = () => setLinks((prev) => [...prev, { id: crypto.randomUUID(), label: "", href: "", isExternal: false }]);
  const updateLink = (id: string, field: keyof NavLink, val: string | boolean) =>
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  const deleteLink = (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id));

  // ── TopBar handlers ──
  const handleTopBarDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setTopBarItems((prev) => {
        const oldIdx = prev.findIndex((i) => i.id === active.id);
        const newIdx = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };
  const addTopBarItem = () => setTopBarItems((prev) => [...prev, { id: crypto.randomUUID(), text: "", icon: "sparkles", enabled: true }]);
  const updateTopBarItem = (id: string, field: keyof TopBarItem, val: string | boolean) =>
    setTopBarItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)));
  const deleteTopBarItem = (id: string) => setTopBarItems((prev) => prev.filter((i) => i.id !== id));

  // ── Save ──
  const save = async () => {
    setSaving(true);
    try {
      if (activeTab === "topbar") {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topBarItems: JSON.stringify(topBarItems) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.details || "Kayıt başarısız");
        toast.success("Top bar öğeleri kaydedildi!");
      } else {
        // Navbar links not yet connected to API, show info
        toast.info("Navbar link yönetimi yakında aktif olacak.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#b45309]" />
            Navbar & Top Bar Yönetimi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Üst duyuru bandını ve menü linklerini düzenleyin.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
            saved ? "bg-emerald-500 text-white" : "bg-[#b45309] hover:bg-amber-700 text-white"
          } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Kaydet"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("topbar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "topbar" ? "bg-white text-[#b45309] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Duyuru Bandı
        </button>
        <button
          onClick={() => setActiveTab("navbar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "navbar" ? "bg-white text-[#b45309] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Navigation className="w-4 h-4" />
          Navbar Linkleri
        </button>
      </div>

      {/* ── TOP BAR TAB ── */}
      {activeTab === "topbar" && (
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-gradient-to-r from-[#6b1d2f] via-[#8b2d3f] to-[#521321] rounded-xl p-3 flex items-center gap-3 text-white text-xs overflow-hidden">
            <span className="shrink-0 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">Önizleme</span>
            <div className="flex items-center gap-3 overflow-hidden">
              {topBarItems.filter(i => i.enabled).map((item, idx) => {
                const IconComp = ICON_MAP[item.icon] || Sparkles;
                return (
                  <span key={item.id} className={`flex items-center gap-1 whitespace-nowrap text-amber-200/90 ${idx === 0 ? "bg-white/10 px-2 py-0.5 rounded-full border border-white/10" : ""}`}>
                    <IconComp className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px]">{item.text || "(boş)"}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            <div className="w-6 shrink-0" />
            <div className="w-28 shrink-0">İkon</div>
            <div className="flex-1">Metin</div>
            <div className="w-10 text-center shrink-0">Görün.</div>
            <div className="w-10 shrink-0" />
          </div>

          {/* Sortable list */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTopBarDragEnd}>
            <SortableContext items={topBarItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {topBarItems.map((item) => (
                  <SortableTopBarItem
                    key={item.id}
                    item={item}
                    onUpdate={updateTopBarItem}
                    onDelete={deleteTopBarItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={addTopBarItem}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-[#b45309]/40 hover:text-[#b45309] hover:bg-amber-50/50 transition"
          >
            <Plus className="w-4 h-4" />
            Yeni Öğe Ekle
          </button>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            💡 <strong>İpucu:</strong> Öğeleri sürükleyerek sıralayabilirsiniz. Göz ikonuna tıklayarak geçici olarak gizleyebilirsiniz. Sol tarafta en fazla 2-3 öğe gösterilir.
          </div>
        </div>
      )}

      {/* ── NAVBAR TAB ── */}
      {activeTab === "navbar" && (
        <div className="space-y-4">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            <div className="w-6 shrink-0" />
            <div className="flex-1">Menü Adı</div>
            <div className="flex-1">URL / Link</div>
            <div className="w-10 text-center shrink-0">Dış</div>
            <div className="w-10 shrink-0" />
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNavDragEnd}>
            <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {links.map((link) => (
                  <SortableNavLink key={link.id} link={link} onUpdate={updateLink} onDelete={deleteLink} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={addLink}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-[#b45309]/40 hover:text-[#b45309] hover:bg-amber-50/50 transition"
          >
            <Plus className="w-4 h-4" />
            Yeni Link Ekle
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            💡 <strong>İpucu:</strong> Satırları sürükleyerek sıralamayı değiştirebilirsiniz. Dış link ikonu aktif edilirse link yeni sekmede açılır.
          </div>
        </div>
      )}
    </div>
  );
}
