"use client";

import { useState, useEffect } from "react";
import { Navigation, Save, Check, Loader2, Plus, Trash2, GripVertical, ExternalLink } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

interface NavLink {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
}

function SortableLink({
  link, onUpdate, onDelete,
}: {
  link: NavLink;
  onUpdate: (id: string, field: keyof NavLink, val: string | boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const inputClass =
    "px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 bg-white text-slate-900 transition";

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm ${isDragging ? "shadow-xl" : ""}`}>
      <button {...attributes} {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>
      <input
        type="text"
        value={link.label}
        onChange={(e) => onUpdate(link.id, "label", e.target.value)}
        placeholder="Menü Adı"
        className={inputClass + " flex-1 min-w-0"}
      />
      <input
        type="text"
        value={link.href}
        onChange={(e) => onUpdate(link.id, "href", e.target.value)}
        placeholder="/sayfa veya https://..."
        className={inputClass + " flex-1 min-w-0"}
      />
      <button
        onClick={() => onUpdate(link.id, "isExternal", !link.isExternal)}
        title="Dış link"
        className={`p-2 rounded-lg border transition shrink-0 ${
          link.isExternal
            ? "border-blue-300 bg-blue-50 text-blue-600"
            : "border-gray-200 text-gray-400 hover:text-gray-600"
        }`}
      >
        <ExternalLink className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(link.id)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-amber-50 rounded-lg transition shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function NavbarAdminPage() {
  const [links, setLinks] = useState<NavLink[]>([
    { id: "1", label: "Ürünler", href: "/products", isExternal: false },
    { id: "2", label: "Hakkımızda", href: "/hakkimizda", isExternal: false },
    { id: "3", label: "İletişim", href: "/contact", isExternal: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setLinks((prev) => {
        const oldIdx = prev.findIndex((l) => l.id === active.id);
        const newIdx = prev.findIndex((l) => l.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const addLink = () => {
    setLinks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", href: "", isExternal: false },
    ]);
  };

  const updateLink = (id: string, field: keyof NavLink, val: string | boolean) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const deleteLink = (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id));

  const save = async () => {
    setSaving(true);
    // In a real implementation this would POST to an API endpoint
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    toast.success("Navbar linkleri kaydedildi.");
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#b45309]" />
            Navbar Yönetimi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Menü linklerini düzenleyin ve sıralarını ayarlayın.</p>
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

      {/* Column headers */}
      <div className="flex items-center gap-3 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
        <div className="w-6 shrink-0" />
        <div className="flex-1">Menü Adı</div>
        <div className="flex-1">URL / Link</div>
        <div className="w-10 text-center shrink-0">Dış</div>
        <div className="w-10 shrink-0" />
      </div>

      {/* Sortable list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {links.map((link) => (
              <SortableLink
                key={link.id}
                link={link}
                onUpdate={updateLink}
                onDelete={deleteLink}
              />
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
  );
}

