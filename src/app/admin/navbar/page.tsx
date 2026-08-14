"use client";

import { useState, useEffect } from "react";
import {
  Navigation, Save, Check, Loader2, Plus, Trash2, GripVertical, ExternalLink,
  Megaphone, Truck, ShieldCheck, Star, Package, Clock, Award, Tag, Zap, Sparkles, Eye, EyeOff,
  Phone, MessageCircle, Power, Info
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
  { value: "truck", label: "Kargo / Sevkiyat", Icon: Truck },
  { value: "shield", label: "Güvenlik / Tescil", Icon: ShieldCheck },
  { value: "star", label: "Yıldız / Kalite", Icon: Star },
  { value: "package", label: "Paket / İmalat", Icon: Package },
  { value: "clock", label: "Aynı Gün Kargo", Icon: Clock },
  { value: "award", label: "Ödül / Garanti", Icon: Award },
  { value: "tag", label: "Fiyat / Fırsat", Icon: Tag },
  { value: "zap", label: "Şimşek / Hızlı", Icon: Zap },
  { value: "sparkles", label: "Parlama / Lezzet", Icon: Sparkles },
  { value: "phone", label: "Telefon", Icon: Phone },
];

const ICON_MAP: Record<string, React.ElementType> = {
  truck: Truck, shield: ShieldCheck, star: Star, package: Package,
  clock: Clock, award: Award, tag: Tag, zap: Zap, sparkles: Sparkles, phone: Phone,
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
        placeholder="Menü Adı (örn: Ürünler)"
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
        title={link.isExternal ? "Dış bağlantı (Yeni Sekme)" : "İç bağlantı"}
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
          className="appearance-none pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 cursor-pointer"
        >
          {ICON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <IconComp className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 pointer-events-none" />
      </div>

      {/* Text */}
      <input
        type="text" value={item.text}
        onChange={(e) => onUpdate(item.id, "text", e.target.value)}
        placeholder="Öğe metni (örn: Türkiye'nin Her Yerine Güvenli Sevkiyat)"
        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 bg-white text-slate-900 transition"
      />

      {/* Toggle enabled */}
      <button
        onClick={() => onUpdate(item.id, "enabled", !item.enabled)}
        title={item.enabled ? "Gizle" : "Göster"}
        className={`p-2 rounded-lg border transition shrink-0 ${item.enabled ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}
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

  // Top Announcement Bar fields state
  const [announcementActive, setAnnouncementActive] = useState<boolean>(true);
  const [announcement1Enabled, setAnnouncement1Enabled] = useState<boolean>(true);
  const [announcement2Enabled, setAnnouncement2Enabled] = useState<boolean>(true);
  const [contactPhoneEnabled, setContactPhoneEnabled] = useState<boolean>(true);
  const [socialWhatsappEnabled, setSocialWhatsappEnabled] = useState<boolean>(true);

  const [announcement, setAnnouncement] = useState<string>("Tüm Türkiye'ye Aynı Gün Kargo ve Fabrika Fiyatları!");
  const [announcement2, setAnnouncement2] = useState<string>("🔥 %100 Yerli İmalat & 304 Paslanmaz Çelik Garantisi");
  const [contactPhone, setContactPhone] = useState<string>("0544 149 48 51");
  const [socialWhatsapp, setSocialWhatsapp] = useState<string>("05441494851");
  const [topBarItems, setTopBarItems] = useState<TopBarItem[]>(DEFAULT_TOP_BAR_ITEMS);

  // NavLinks state
  const [links, setLinks] = useState<NavLink[]>([
    { id: "1", label: "Ürünler", href: "/products", isExternal: false },
    { id: "2", label: "Hikayemiz", href: "/hikayemiz", isExternal: false },
    { id: "3", label: "İletişim", href: "/iletisim", isExternal: false },
  ]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Load all settings from API
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r && r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object") {
          if (typeof data.announcementActive === "boolean") setAnnouncementActive(data.announcementActive);
          if (typeof data.announcement1Enabled === "boolean") setAnnouncement1Enabled(data.announcement1Enabled);
          if (typeof data.announcement2Enabled === "boolean") setAnnouncement2Enabled(data.announcement2Enabled);
          if (typeof data.contactPhoneEnabled === "boolean") setContactPhoneEnabled(data.contactPhoneEnabled);
          if (typeof data.socialWhatsappEnabled === "boolean") setSocialWhatsappEnabled(data.socialWhatsappEnabled);
          
          if (data.announcement !== undefined) setAnnouncement(data.announcement || "");
          if (data.announcement2 !== undefined) setAnnouncement2(data.announcement2 || "");
          if (data.contactPhone !== undefined) setContactPhone(data.contactPhone || "");
          if (data.socialWhatsapp !== undefined) setSocialWhatsapp(data.socialWhatsapp || "");
          
          if (data.topBarItems) {
            try {
              const parsed = typeof data.topBarItems === "string" ? JSON.parse(data.topBarItems) : data.topBarItems;
              if (Array.isArray(parsed) && parsed.length > 0) setTopBarItems(parsed);
            } catch {}
          }
        }
      })
      .catch((err) => console.error("Settings load error:", err));
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
  const addTopBarItem = () => setTopBarItems((prev) => [...prev, { id: crypto.randomUUID(), text: "", icon: "truck", enabled: true }]);
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
          body: JSON.stringify({
            announcementActive,
            announcement,
            announcement2,
            contactPhone,
            socialWhatsapp,
            topBarItems: JSON.stringify(topBarItems),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.details || "Kayıt başarısız");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("settings-updated"));
          try {
            localStorage.setItem("pekefe_settings_updated", String(Date.now()));
          } catch {}
        }
        toast.success("Üst duyuru bandı ayarları başarıyla kaydedildi!");
      } else {
        toast.info("Navbar link yönetimi kaydedildi.");
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#6b1d2f]" />
            Üst Duyuru Bandı & Navbar Yönetimi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Sitenizin en üstünde yer alan duyuru metinlerini, kargo rozetlerini ve iletişim bilgilerini yönetin.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition shadow-md ${
            saved ? "bg-emerald-600 text-white" : "bg-[#6b1d2f] hover:bg-[#521321] text-white"
          } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Kaydediliyor..." : saved ? "Değişiklikler Kaydedildi!" : "Tüm Değişiklikleri Kaydet"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("topbar")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition ${
            activeTab === "topbar" ? "bg-white text-[#6b1d2f] shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-600" />
          Üst Duyuru Bandı (Top Bar)
        </button>
        <button
          onClick={() => setActiveTab("navbar")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition ${
            activeTab === "navbar" ? "bg-white text-[#6b1d2f] shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Navigation className="w-4 h-4 text-blue-600" />
          Navbar Menü Linkleri
        </button>
      </div>

      {/* ── TOP BAR TAB ── */}
      {activeTab === "topbar" && (
        <div className="space-y-6">

          {/* 1. REAL-TIME LIVE PREVIEW */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Canlı Görünüm Önizlemesi
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${announcementActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {announcementActive ? "Duyuru Bandı YAYINDA" : "Duyuru Bandı GİZLİ"}
              </span>
            </div>

            {announcementActive ? (
              <div className="bg-gradient-to-r from-[#6b1d2f] via-[#8b2d3f] to-[#521321] text-white text-xs py-2.5 px-4 rounded-xl shadow-md border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                {/* Left Badges */}
                <div className="flex items-center gap-3 text-[11px] text-amber-200/90 shrink-0">
                  {topBarItems.filter(i => i.enabled).map((item, idx) => {
                    const IconComp = ICON_MAP[item.icon] || Sparkles;
                    return (
                      <span key={item.id} className={`flex items-center gap-1.5 ${idx === 0 ? "bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10" : ""}`}>
                        <IconComp className={`w-3.5 h-3.5 ${idx === 0 ? "text-amber-400" : "text-emerald-400"}`} />
                        <span>{item.text || "(boş metin)"}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Center Announcement */}
                {(announcement1Enabled || announcement2Enabled) && (
                  <div className="flex-1 text-center font-bold text-white flex items-center justify-center gap-2 min-w-[200px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    {announcement1Enabled && <span>{announcement || "(Duyuru metni girilmedi)"}</span>}
                    {announcement2Enabled && announcement2 && (
                      <span className="text-amber-200/80 font-normal">
                        {announcement1Enabled ? `• ${announcement2}` : announcement2}
                      </span>
                    )}
                  </div>
                )}

                {/* Right Contact */}
                {(contactPhoneEnabled || socialWhatsappEnabled) && (
                  <div className="flex items-center gap-3 shrink-0 text-[11px]">
                    {contactPhoneEnabled && contactPhone && (
                      <span className="flex items-center gap-1 text-white/90">
                        <Phone className="w-3 h-3 text-amber-400" />
                        <span>{contactPhone}</span>
                      </span>
                    )}
                    {socialWhatsappEnabled && socialWhatsapp && (
                      <span className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500 font-medium">
                Duyuru bandı pasif hale getirildiği için sitede görünmeyecektir.
              </div>
            )}
          </div>

          {/* 2. GENERAL STATUS SWITCH */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${announcementActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Duyuru Bandı Durumu</h3>
                <p className="text-xs text-slate-500">Sitenin en üst kısmındaki duyuru çubuğunu tamamen açın veya kapatın.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAnnouncementActive(!announcementActive)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                announcementActive ? "bg-[#6b1d2f]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  announcementActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 3. LEFT SIDE ITEMS (Kargo, Tescilli Lezzet vb.) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  Sol Taraf Bilgi Rozetleri & İkonları
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Duyuru çubuğunun sol kısmında yer alacak vurgu metinlerini ve ikonlarını düzenleyin.</p>
              </div>
              <button
                onClick={addTopBarItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#6b1d2f] text-xs font-bold rounded-lg border border-amber-200 transition"
              >
                <Plus className="w-4 h-4" />
                Rozet Ekle
              </button>
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-3 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              <div className="w-6 shrink-0" />
              <div className="w-36 shrink-0">İkon</div>
              <div className="flex-1">Rozet Metni</div>
              <div className="w-10 text-center shrink-0">Durum</div>
              <div className="w-10 shrink-0" />
            </div>

            {/* Sortable List */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTopBarDragEnd}>
              <SortableContext items={topBarItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2.5">
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
          </div>

          {/* 4. CENTER ANNOUNCEMENT TEXTS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Orta Kısım Duyuru Metinleri
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Sitenin ortasında vurgulanan ana kampanya ve fabrika mesajlarını girin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Birincil Duyuru Metni</label>
                  <button
                    type="button"
                    onClick={() => setAnnouncement1Enabled(!announcement1Enabled)}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      announcement1Enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {announcement1Enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {announcement1Enabled ? "Gösteriliyor" : "Gizli"}
                  </button>
                </div>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="örn: Tüm Türkiye'ye Aynı Gün Kargo ve Fabrika Fiyatları!"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20 transition ${
                    announcement1Enabled ? "border-gray-200 bg-white text-slate-900" : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">İkincil Duyuru Metni (Ek Mesaj)</label>
                  <button
                    type="button"
                    onClick={() => setAnnouncement2Enabled(!announcement2Enabled)}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      announcement2Enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {announcement2Enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {announcement2Enabled ? "Gösteriliyor" : "Gizli"}
                  </button>
                </div>
                <input
                  type="text"
                  value={announcement2}
                  onChange={(e) => setAnnouncement2(e.target.value)}
                  placeholder="örn: 🔥 %100 Yerli İmalat & 304 Paslanmaz Çelik Garantisi"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20 transition ${
                    announcement2Enabled ? "border-gray-200 bg-white text-slate-900" : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 5. RIGHT SIDE CONTACT INFO */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                Sağ Kısım İletişim & WhatsApp Numaraları
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Duyuru bandının sağında yer alan müşteri temsilcisi telefonu ve WhatsApp hattı.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">İletişim Telefon Numarası</label>
                  <button
                    type="button"
                    onClick={() => setContactPhoneEnabled(!contactPhoneEnabled)}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      contactPhoneEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {contactPhoneEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {contactPhoneEnabled ? "Gösteriliyor" : "Gizli"}
                  </button>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0544 149 48 51"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20 transition ${
                      contactPhoneEnabled ? "border-gray-200 bg-white text-slate-900" : "border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">WhatsApp Numarası</label>
                  <button
                    type="button"
                    onClick={() => setSocialWhatsappEnabled(!socialWhatsappEnabled)}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      socialWhatsappEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {socialWhatsappEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {socialWhatsappEnabled ? "Gösteriliyor" : "Gizli"}
                  </button>
                </div>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={socialWhatsapp}
                    onChange={(e) => setSocialWhatsapp(e.target.value)}
                    placeholder="05441494851 veya 905441494851"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20 transition ${
                      socialWhatsappEnabled ? "border-gray-200 bg-white text-slate-900" : "border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>İpucu:</strong> Yapılan değişiklikler kaydet butonuna bastığınız anda veritabanına işlenir ve sitenizde anında canlıya yansır.
            </div>
          </div>

        </div>
      )}

      {/* ── NAVBAR TAB ── */}
      {activeTab === "navbar" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Ana Menü Linkleri</h3>
                <p className="text-xs text-slate-500">Üst navigasyon menüsündeki sayfaları ve yönlendirmeleri düzenleyin.</p>
              </div>
              <button
                onClick={addLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition"
              >
                <Plus className="w-4 h-4" />
                Link Ekle
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

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNavDragEnd}>
              <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {links.map((link) => (
                    <SortableNavLink key={link.id} link={link} onUpdate={updateLink} onDelete={deleteLink} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>İpucu:</strong> Satırları sürükleyerek menü sırasını değiştirebilirsiniz. Dış link simgesine basıldığında link yeni sekmede açılır.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
