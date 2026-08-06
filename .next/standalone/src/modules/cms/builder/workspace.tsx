"use client";

import { useState } from "react";
import { 
  Monitor, Tablet, Smartphone, Save, Undo, Redo, Eye, EyeOff, Sparkles,
  Search, Settings, Layout, Type, Image as ImageIcon, 
  PlaySquare, MapPin, FormInput, Sliders, ChevronDown, Plus, Trash2, Copy, 
  ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight, Bold, Italic, 
  Loader2, Check, ArrowRight, Video, FileText, Compass, List, Maximize2
} from "lucide-react";
import { toast } from "sonner";
import { useBuilderStore, CanvasElement, ViewportMode } from "./useBuilderStore";
import { publishCmsChangesAction } from "./cmsBuilderActions";

export default function VisualBuilderWorkspace() {
  const {
    viewport,
    canvasElements,
    selectedElementId,
    historyStack,
    futureStack,
    isDirty,
    saving,
    setViewport,
    selectElement,
    addCanvasElement,
    updateElementProperties,
    duplicateElement,
    deleteElement,
    moveElement,
    undo,
    redo,
    markSaved,
    cmsValues,
    pages,
    selectedPageId,
    selectPage,
    activeChannel,
    setChannel,
    navLinks,
    mediaItems,
    addPage,
    deletePage,
    addNavLink,
    deleteNavLink,
    updateField,
  } = useBuilderStore();

  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<"top" | "bottom" | null>(null);

  // Local states for page form
  const [newPageName, setNewPageName] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [addingPage, setAddingPage] = useState(false);

  // Local states for nav link form
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkPath, setNewLinkPath] = useState("");

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName || !newPageSlug) return;
    setAddingPage(true);
    try {
      const { createBuilderPageAction } = await import("./cmsBuilderActions");
      const res = await createBuilderPageAction(newPageName, newPageSlug);
      if (res.error) {
        toast.error(res.error);
      } else if (res.page) {
        addPage(res.page);
        setNewPageName("");
        setNewPageSlug("");
        toast.success("Yeni sayfa oluşturuldu!");
      }
    } catch (err: any) {
      toast.error("Sayfa oluşturulamadı: " + err.message);
    } finally {
      setAddingPage(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (confirm("Bu sayfayı silmek istediğinize emin misiniz?")) {
      try {
        const { deleteBuilderPageAction } = await import("./cmsBuilderActions");
        const res = await deleteBuilderPageAction(pageId);
        if (res.error) {
          toast.error(res.error);
        } else {
          deletePage(pageId);
          toast.success("Sayfa silindi.");
        }
      } catch (err: any) {
        toast.error("Sayfa silinemedi: " + err.message);
      }
    }
  };

  const handleAddNavLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabel || !newLinkPath) return;
    addNavLink({ label: newLinkLabel, path: newLinkPath });
    setNewLinkLabel("");
    setNewLinkPath("");
    toast.success("Menü bağlantısı eklendi.");
  };

  // Library Items definition
  const libraryItems = [
    { type: "section", name: "Seksiyon/Bölüm", category: "layout", icon: Layout, desc: "Tam genişlikte arka plan konteyneri" },
    { type: "grid", name: "Grid Konteyner", category: "layout", icon: Sliders, desc: "Çok sütunlu esnek yerleşim alanı" },
    { type: "text", name: "Başlık / Metin", category: "basic", icon: Type, desc: "Tipografi ve metin bileşeni" },
    { type: "image", name: "Görsel Elemanı", category: "basic", icon: ImageIcon, desc: "Resim yükleme ve yerleştirme" },
    { type: "button", name: "Eylem Butonu", category: "basic", icon: Plus, desc: "Tıklanabilir yönlendirme butonu" },
    { type: "divider", name: "Bölücü Çizgi", category: "basic", icon: List, desc: "Dikey/Yatay çizgi bölücü" },
    { type: "form", name: "İletişim Formu", category: "advanced", icon: FormInput, desc: "Özelleştirilebilir form bileşeni" },
    { type: "map", name: "Google Harita", category: "advanced", icon: MapPin, desc: "Etkileşimli harita lokasyonu" },
    { type: "video", name: "Video Oynatıcı", category: "advanced", icon: Video, desc: "YouTube veya özel video oynatıcı" },
    { type: "slider", name: "Görsel Kaydırıcı", category: "advanced", icon: Sliders, desc: "Kayar slayt/görsel galerisi" },
  ];

  const filteredLibraryItems = libraryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selected element properties
  const selectedElement = canvasElements.find(el => el.id === selectedElementId);

  // HTML5 Drag events
  const handleDragStart = (e: React.DragEvent, itemType: string) => {
    e.dataTransfer.setData("text/plain", itemType);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const threshold = rect.height / 2;
    
    setDraggedOverIndex(index);
    setDropPosition(relativeY < threshold ? "top" : "bottom");
  };

  const handleDragLeaveCanvas = () => {
    setDraggedOverIndex(null);
    setDropPosition(null);
  };

  const handleDropOnCanvas = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    const itemType = e.dataTransfer.getData("text/plain");
    if (!itemType) return;

    const itemTemplate = libraryItems.find(item => item.type === itemType);
    if (!itemTemplate) return;

    let targetIndex = index;
    if (targetIndex !== undefined && dropPosition === "bottom") {
      targetIndex += 1;
    }

    // Default properties based on element type
    const defaultProps: Record<string, any> = {};
    if (itemType === "text") {
      defaultProps.content = "Yeni Metin Yazısı";
      defaultProps.fontSize = "text-base";
      defaultProps.fontWeight = "font-normal";
      defaultProps.textColor = "text-slate-700";
      defaultProps.textAlign = "text-left";
    } else if (itemType === "button") {
      defaultProps.content = "Buton Metni";
      defaultProps.link = "#";
      defaultProps.buttonStyle = "solid";
      defaultProps.backgroundColor = "bg-orange-500";
      defaultProps.textColor = "text-white";
    } else if (itemType === "image") {
      defaultProps.url = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80";
      defaultProps.alt = "Website Builder Resmi";
      defaultProps.borderRadius = "rounded-xl";
    } else if (itemType === "video") {
      defaultProps.url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
      defaultProps.autoPlay = false;
    } else if (itemType === "map") {
      defaultProps.address = "Erzurum, Türkiye";
      defaultProps.zoom = 14;
    } else if (itemType === "section") {
      defaultProps.padding = "py-12 px-6";
      defaultProps.backgroundColor = "bg-white";
    } else if (itemType === "grid") {
      defaultProps.columns = "grid-cols-3";
      defaultProps.gap = "gap-6";
    }

    addCanvasElement({
      type: itemType,
      name: itemTemplate.name,
      properties: defaultProps
    }, targetIndex);

    setDraggedOverIndex(null);
    setDropPosition(null);
    toast.success(`${itemTemplate.name} tuvale eklendi.`);
  };

  const handleSave = async () => {
    useBuilderStore.setState({ saving: true });
    try {
      const res = await publishCmsChangesAction(cmsValues, pages);
      if (res.error) {
        toast.error(res.error);
      } else {
        markSaved();
        toast.success(res.message || "Tüm tasarım değişiklikleri başarıyla yayına alındı!");
      }
    } catch (err: any) {
      toast.error("Yayınlama işlemi başarısız: " + (err.message || err));
    } finally {
      useBuilderStore.setState({ saving: false });
    }
  };

  return (
    <div className={`flex flex-col border border-slate-100 rounded-2xl overflow-hidden bg-slate-900 shadow-xl transition-all duration-300 ${previewMode ? "fixed inset-0 w-screen h-screen rounded-none z-[9999]" : "h-[calc(100vh-100px)] min-h-[500px]"}`}>
      
      {/* ── TOP NAV BAR ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 text-white rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">DESIGN STUDIO</h2>
            <p className="text-[10px] text-slate-400 font-medium">B2B Website Builder Workspace</p>
          </div>
        </div>

        {/* Page Selector Dropdown */}
        {!previewMode && pages.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
            <FileText className="w-3.5 h-3.5 text-orange-500" />
            <select
              value={selectedPageId || ""}
              onChange={(e) => selectPage(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Viewport Toggles (Active state styling) */}
        {!previewMode && (
          <div className="flex items-center bg-slate-800 p-1 rounded-xl gap-0.5 border border-slate-700/50">
            <button onClick={() => setViewport("desktop")}
              className={`p-2 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center ${viewport === "desktop" ? "bg-orange-500 text-white shadow-sm" : "text-slate-400 hover:text-white bg-transparent"}`}
              title="Desktop Görünümü">
              <Monitor className="w-4 h-4" />
            </button>
            <button onClick={() => setViewport("tablet")}
              className={`p-2 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center ${viewport === "tablet" ? "bg-orange-500 text-white shadow-sm" : "text-slate-400 hover:text-white bg-transparent"}`}
              title="Tablet Görünümü">
              <Tablet className="w-4 h-4" />
            </button>
            <button onClick={() => setViewport("mobile")}
              className={`p-2 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center ${viewport === "mobile" ? "bg-orange-500 text-white shadow-sm" : "text-slate-400 hover:text-white bg-transparent"}`}
              title="Mobil Görünümü">
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          {!previewMode && (
            <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/30 mr-2">
              <button onClick={undo} disabled={historyStack.length === 0}
                className={`p-1.5 rounded-lg border-none cursor-pointer transition flex items-center justify-center ${historyStack.length > 0 ? "text-slate-200 hover:bg-slate-700" : "text-slate-600 bg-transparent cursor-not-allowed"}`}
                title="Geri Al">
                <Undo className="w-4 h-4" />
              </button>
              <button onClick={redo} disabled={futureStack.length === 0}
                className={`p-1.5 rounded-lg border-none cursor-pointer transition flex items-center justify-center ${futureStack.length > 0 ? "text-slate-200 hover:bg-slate-700" : "text-slate-600 bg-transparent cursor-not-allowed"}`}
                title="İleri Al">
                <Redo className="w-4 h-4" />
              </button>
            </div>
          )}

          <button onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 transition text-xs font-bold text-white rounded-xl border-none cursor-pointer">
            {previewMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Düzenle
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Önizleme
              </>
            )}
          </button>

          <button onClick={handleSave} disabled={saving || !isDirty}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border-none transition cursor-pointer ${isDirty ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}>
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Kaydediliyor
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Kaydet ve Yayınla
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE BODY ── */}
      <div className="flex flex-1 overflow-hidden bg-slate-950 relative">

        {/* ── LEFT SIDEBAR TABS & CONTENTS ── */}
        {!previewMode && (
          <>
            {/* Thin Icon Tab Selector */}
            <div className="w-16 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center py-4 gap-3.5 z-10 shrink-0 select-none">
              {[
                { id: "homepage", label: "Bileşenler", icon: Layout },
                { id: "pages", label: "Sayfalar", icon: FileText },
                { id: "navbar", label: "Menüler", icon: List },
                { id: "theme", label: "Tema & Stil", icon: Sliders },
                { id: "seo", label: "SEO", icon: Settings },
                { id: "media", label: "Medya", icon: ImageIcon }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeChannel === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setChannel(tab.id as any)}
                    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center border-none cursor-pointer transition-all ${isActive ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/40"}`}
                    title={tab.label}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span className="text-[8px] font-bold mt-1 scale-90">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Left Sidebar Content Panel */}
            <div className="w-64 border-r border-slate-800/80 bg-slate-900 flex flex-col z-10 shrink-0 select-none">
              
              {/* Components Channel */}
              {activeChannel === "homepage" && (
                <>
                  <div className="p-4 border-b border-slate-800/60">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input type="text" placeholder="Bileşen ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {["layout", "basic", "advanced"].map(cat => {
                      const items = filteredLibraryItems.filter(item => item.category === cat);
                      if (items.length === 0) return null;
                      return (
                        <div key={cat} className="space-y-2.5">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            {cat === "layout" ? "Düzen / Yerleşim" : cat === "basic" ? "Temel Bileşenler" : "Gelişmiş Araçlar"}
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            {items.map(item => {
                              const Icon = item.icon;
                              return (
                                <div key={item.type} draggable onDragStart={(e) => handleDragStart(e, item.type)}
                                  className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/55 rounded-xl cursor-grab transition active:cursor-grabbing group">
                                  <div className="p-2 bg-slate-900 rounded-lg text-slate-400 group-hover:text-orange-500 group-hover:bg-slate-900/80 transition shrink-0">
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="space-y-0.5 overflow-hidden">
                                    <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition truncate">{item.name}</h4>
                                    <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {filteredLibraryItems.length === 0 && (
                      <div className="text-center py-12 text-slate-600 font-medium text-xs">
                        Bileşen bulunamadı.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Pages Channel */}
              {activeChannel === "pages" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Sayfa Listesi</h3>
                    <div className="space-y-2">
                      {pages.map((p) => {
                        const isActive = p.id === selectedPageId;
                        return (
                          <div key={p.id} onClick={() => selectPage(p.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${isActive ? "bg-orange-500/10 border-orange-500/35 text-white" : "bg-slate-800/40 border-slate-800 hover:border-slate-700/60 text-slate-300"}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className={`w-3.5 h-3.5 ${isActive ? "text-orange-500" : "text-slate-400"}`} />
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold truncate">{p.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">/{p.slug}</p>
                              </div>
                            </div>
                            {p.slug !== "home" && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeletePage(p.id); }}
                                className="p-1 hover:bg-red-950/40 text-slate-500 hover:text-red-400 rounded-lg transition border-none bg-transparent cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Page Form */}
                  <form onSubmit={handleAddPage} className="border-t border-slate-800/80 pt-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Yeni Sayfa Ekle</h4>
                    <div className="space-y-2">
                      <input type="text" placeholder="Sayfa Adı (Örn: Hakkımızda)" value={newPageName} onChange={e => setNewPageName(e.target.value)} required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition" />
                      <input type="text" placeholder="Sayfa Adresi (slug - Örn: hakkimizda)" value={newPageSlug} onChange={e => setNewPageSlug(e.target.value)} required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition" />
                    </div>
                    <button type="submit" disabled={addingPage}
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border-none cursor-pointer">
                      {addingPage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Sayfa Oluştur
                    </button>
                  </form>
                </div>
              )}

              {/* Navigation Menu (Navbar) Channel */}
              {activeChannel === "navbar" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Menü Bağlantıları</h3>
                    <div className="space-y-2">
                      {navLinks.map((link) => (
                        <div key={link.id}
                          className="flex items-center justify-between p-2.5 bg-slate-800/40 border border-slate-800 rounded-xl text-slate-300">
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{link.label}</p>
                            <p className="text-[10px] text-slate-500 truncate">{link.path}</p>
                          </div>
                          <button onClick={() => deleteNavLink(link.id)}
                            className="p-1 hover:bg-red-950/40 text-slate-500 hover:text-red-400 rounded-lg transition border-none bg-transparent cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Nav Link Form */}
                  <form onSubmit={handleAddNavLink} className="border-t border-slate-800/80 pt-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Yeni Bağlantı Ekle</h4>
                    <div className="space-y-2">
                      <input type="text" placeholder="Bağlantı Adı (Örn: Blog)" value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)} required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition" />
                      <input type="text" placeholder="URL / Rota (Örn: /blog)" value={newLinkPath} onChange={e => setNewLinkPath(e.target.value)} required
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition" />
                    </div>
                    <button type="submit"
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border-none cursor-pointer">
                      <Plus className="w-3.5 h-3.5" />
                      Bağlantı Ekle
                    </button>
                  </form>
                </div>
              )}

              {/* Theme & Style Channel */}
              {activeChannel === "theme" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">Tema & Stil Ayarları</h3>
                  
                  {/* Primary Color */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Ana Renk (Primary)</label>
                    <div className="flex gap-2">
                      <input type="color" value={cmsValues.primaryColor || "#b45309"} onChange={e => updateField("primaryColor", e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-700/60 bg-transparent cursor-pointer p-0 shrink-0" />
                      <input type="text" value={cmsValues.primaryColor || ""} onChange={e => updateField("primaryColor", e.target.value)}
                        className="w-full px-3 py-1 bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">İkincil Renk (Secondary)</label>
                    <div className="flex gap-2">
                      <input type="color" value={cmsValues.secondaryColor || "#1F2937"} onChange={e => updateField("secondaryColor", e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-700/60 bg-transparent cursor-pointer p-0 shrink-0" />
                      <input type="text" value={cmsValues.secondaryColor || ""} onChange={e => updateField("secondaryColor", e.target.value)}
                        className="w-full px-3 py-1 bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <label>Köşe Yuvarlaklığı</label>
                      <span>{cmsValues.borderRadius ?? 12}px</span>
                    </div>
                    <input type="range" min="0" max="24" value={cmsValues.borderRadius ?? 12} onChange={e => updateField("borderRadius", Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer" />
                  </div>

                  {/* Logo Font */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Logo Yazı Tipi</label>
                    <select value={cmsValues.logoFont || "Outfit"} onChange={e => updateField("logoFont", e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                      <option value="Outfit">Outfit</option>
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Montserrat">Montserrat</option>
                    </select>
                  </div>

                  {/* Logo Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <label>Logo Boyutu</label>
                      <span>{cmsValues.logoSize ?? 18}px</span>
                    </div>
                    <input type="range" min="12" max="36" value={cmsValues.logoSize ?? 18} onChange={e => updateField("logoSize", Number(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer" />
                  </div>
                </div>
              )}

              {/* SEO & Site Settings Channel */}
              {activeChannel === "seo" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">SEO & Ayarlar</h3>

                  {/* Site Adı */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Site Başlığı (Site Name)</label>
                    <input type="text" value={cmsValues.siteName || ""} onChange={e => updateField("siteName", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                  </div>

                  {/* Site Açıklaması */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Site Açıklaması (Meta Desc)</label>
                    <textarea value={cmsValues.siteDescription || ""} onChange={e => updateField("siteDescription", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition h-24 resize-none" />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">WhatsApp Numarası</label>
                    <input type="text" value={cmsValues.socialWhatsapp || ""} onChange={e => updateField("socialWhatsapp", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Instagram Hesabı</label>
                    <input type="text" value={cmsValues.socialInstagram || ""} onChange={e => updateField("socialInstagram", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                  </div>
                </div>
              )}

              {/* Media Channel */}
              {activeChannel === "media" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">Medya Galeri Kütüphanesi</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {mediaItems.map((item) => (
                      <div key={item.id} onClick={() => {
                        navigator.clipboard.writeText(item.url);
                        toast.success("Resim URL'si panoya kopyalandı!");
                      }}
                        className="group relative aspect-square bg-slate-950 rounded-xl overflow-hidden cursor-pointer border border-slate-850 hover:border-orange-500/60 transition">
                        <img src={item.url} alt={item.alt} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2 transition duration-200">
                          <p className="text-[9px] font-bold text-white truncate">{item.name}</p>
                          <p className="text-[8px] text-slate-400 mt-0.5">{item.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold text-center leading-relaxed">
                    ℹ️ Resim kartlarına tıklayarak URL adreslerini kopyalayabilir, elemanların URL alanlarına yapıştırabilirsiniz.
                  </p>
                </div>
              )}

            </div>
          </>
        )}

        {/* ── CENTER CANVAS: THE DROP ZONE ── */}
        <div className="flex-1 overflow-y-auto flex justify-center bg-slate-950 p-8"
          onDragOver={handleDragOverCanvas}
          onDrop={(e) => handleDropOnCanvas(e)}
          onClick={() => selectElement(null)}>
          
          <div className={`w-full h-fit min-h-[550px] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-350 ease-out relative ${viewport === "tablet" ? "max-w-[768px]" : viewport === "mobile" ? "max-w-[390px]" : "max-w-full"}`}>
            
            {/* Real Webpage Frame Simulator */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              </div>
              <div className="bg-white border border-slate-250 rounded-lg py-1 px-4 text-[10px] font-bold text-slate-500 w-1/2 max-w-sm text-center truncate">
                https://www.atikarilik.com/preview
              </div>
              <div />
            </div>

            {/* Empty Canvas Indicator */}
            {canvasElements.length === 0 && (
              <div className="flex flex-col items-center justify-center py-36 text-center space-y-4 px-6">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-dashed border-slate-250">
                  <Compass className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-slate-800">Sürükle & Bırak ile Başla</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Sol kütüphaneden elemanları bu alana sürükleyip bırakarak yeni bir web tasarımı oluşturabilirsiniz.
                  </p>
                </div>
              </div>
            )}

            {/* Render Draggable Canvas Items */}
            {canvasElements.map((el, index) => {
              const isSelected = el.id === selectedElementId;
              return (
                <div key={el.id}
                  onDragOver={(e) => handleDragOverItem(e, index)}
                  onDragLeave={handleDragLeaveCanvas}
                  onDrop={(e) => handleDropOnCanvas(e, index)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!previewMode) selectElement(el.id);
                  }}
                  className={`relative group/item transition-all ${!previewMode ? "cursor-pointer" : ""}`}>
                  
                  {/* Drop indicator above Y axis */}
                  {draggedOverIndex === index && dropPosition === "top" && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500 z-50 animate-pulse" />
                  )}

                  {/* Render Visual Elements based on Element Type */}
                  <div className={`p-4 transition-all ${isSelected && !previewMode ? "ring-2 ring-orange-500 bg-orange-50/5" : !previewMode ? "hover:bg-slate-50/70 hover:ring-1 hover:ring-slate-300" : ""}`}>
                    {el.type === "section" && (
                      <div className={`${el.properties.padding || "py-12 px-6"} ${el.properties.backgroundColor || "bg-white"} ${el.properties.textAlign || "text-left"} border border-dashed border-slate-200 rounded-xl transition`}>
                        <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-2 uppercase select-none">[ Seksiyon Konteyneri ]</p>
                        <p className="text-xs font-semibold text-slate-500">Bu seksiyonun içerisine diğer metin veya butonları yerleştirebilirsiniz.</p>
                      </div>
                    )}

                    {el.type === "grid" && (
                      <div className={`grid ${el.properties.columns || "grid-cols-3"} ${el.properties.gap || "gap-6"} border border-dashed border-slate-200 p-4 rounded-xl`}>
                        {[1, 2, 3].map(col => (
                          <div key={col} className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase select-none">Kolon {col}</p>
                            <p className="text-[11px] text-slate-500 mt-1">İçerik Alanı</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {el.type === "text" && (
                      <div className={`${el.properties.textAlign || "text-left"} ${el.properties.marginBottom || "mb-4"}`}>
                        <p className={`${el.properties.fontSize || "text-base"} ${el.properties.fontWeight || "font-normal"} ${el.properties.textColor || "text-slate-800"}`}>
                          {el.properties.content || "Metin yazısını sağ panelden özelleştirin..."}
                        </p>
                      </div>
                    )}

                    {el.type === "button" && (
                      <div className="my-2">
                        <span className={`inline-block px-5 py-2.5 rounded-xl text-xs font-bold transition select-none ${el.properties.buttonStyle === "outline" ? "border-2 border-orange-500 text-orange-500 bg-transparent hover:bg-orange-50" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
                          {el.properties.content || "Eylem Butonu"}
                        </span>
                      </div>
                    )}

                    {el.type === "divider" && (
                      <div className="py-4">
                        <hr className="border-t border-slate-200" />
                      </div>
                    )}

                    {el.type === "image" && (
                      <div className="my-3 flex justify-center">
                        <img src={el.properties.url} alt={el.properties.alt}
                          className={`max-w-full max-h-[300px] object-cover shadow-sm ${el.properties.borderRadius || "rounded-xl"}`} />
                      </div>
                    )}

                    {el.type === "video" && (
                      <div className="my-4 flex justify-center">
                        <div className="aspect-video w-full bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 relative overflow-hidden select-none">
                          <PlaySquare className="w-12 h-12 text-white/80 z-10" />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                            <p className="text-xs font-bold text-white">{el.properties.url || "YouTube Embed Video"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {el.type === "map" && (
                      <div className="my-4">
                        <div className="w-full h-[200px] bg-sky-100 rounded-xl border border-sky-200 flex flex-col items-center justify-center text-sky-800 select-none relative overflow-hidden">
                          <MapPin className="w-8 h-8 text-sky-600 animate-bounce mb-1" />
                          <p className="text-xs font-bold">Harita Gösterimi</p>
                          <p className="text-[10px] text-sky-600/80 font-medium">{el.properties.address || "Erzurum, Türkiye"}</p>
                        </div>
                      </div>
                    )}

                    {el.type === "form" && (
                      <div className="my-4 border border-slate-200 p-5 rounded-xl bg-slate-50 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase select-none">[ İletişim Formu Modülü ]</p>
                        <div className="space-y-2">
                          <div className="h-9 bg-white border border-slate-200 rounded-lg" />
                          <div className="h-9 bg-white border border-slate-200 rounded-lg" />
                          <div className="h-20 bg-white border border-slate-200 rounded-lg" />
                        </div>
                        <div className="h-9 bg-orange-500 rounded-lg w-28" />
                      </div>
                    )}

                    {el.type === "slider" && (
                      <div className="my-4 relative bg-slate-100 rounded-xl p-8 text-center border border-slate-200 select-none">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-4">[ Görsel Kaydırıcı Slider ]</p>
                        <div className="flex items-center justify-between max-w-xs mx-auto">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">‹</div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800">Slayt Başlığı 1</p>
                            <p className="text-[10px] text-slate-500 font-medium">Örnek slayt alt açıklaması.</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">›</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Drop indicator below Y axis */}
                  {draggedOverIndex === index && dropPosition === "bottom" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 z-50 animate-pulse" />
                  )}

                  {/* Floating Toolbar Context Menu */}
                  {isSelected && !previewMode && (
                    <div className="absolute right-4 top-2 bg-slate-900 border border-slate-800 text-white py-1.5 px-2 rounded-xl shadow-xl flex items-center gap-1.5 z-40 animate-in fade-in slide-in-from-top-1 select-none">
                      <button onClick={(e) => { e.stopPropagation(); moveElement(el.id, "up"); }} disabled={index === 0}
                        className={`p-1 rounded-lg border-none cursor-pointer transition flex items-center justify-center ${index > 0 ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 bg-transparent cursor-not-allowed"}`}
                        title="Yukarı Taşı">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveElement(el.id, "down"); }} disabled={index === canvasElements.length - 1}
                        className={`p-1 rounded-lg border-none cursor-pointer transition flex items-center justify-center ${index < canvasElements.length - 1 ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-700 bg-transparent cursor-not-allowed"}`}
                        title="Aşağı Taşı">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-3.5 bg-slate-800 mx-0.5" />
                      <button onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }}
                        className="p-1 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg border-none cursor-pointer transition flex items-center justify-center"
                        title="Çoğalt">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                        className="p-1 text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-lg border-none cursor-pointer transition flex items-center justify-center"
                        title="Sil">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: PROPERTIES / SETTINGS INSPECTOR ── */}
        {!previewMode && (
          <div className="w-80 border-l border-slate-800/80 bg-slate-900 flex flex-col z-10 shrink-0 select-none">
            <div className="p-4 border-b border-slate-800/60 flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">ÖZELLİK DENETLEYİCİSİ</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {selectedElement ? (
                <div className="space-y-6">
                  
                  {/* General Meta */}
                  <div className="space-y-1 border-b border-slate-800/60 pb-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Seçili Eleman</p>
                    <h4 className="text-sm font-bold text-white">{selectedElement.name}</h4>
                    <span className="inline-block px-2 py-0.5 bg-slate-800 text-[9px] font-bold text-slate-400 rounded-md border border-slate-700/50 uppercase">
                      ID: {selectedElement.id}
                    </span>
                  </div>

                  {/* TEXT properties inspector */}
                  {selectedElement.type === "text" && (
                    <div className="space-y-4">
                      {/* Metin İçeriği */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Metin İçeriği</label>
                        <textarea value={selectedElement.properties.content || ""}
                          onChange={(e) => updateElementProperties(selectedElement.id, { content: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition h-20 resize-none" />
                      </div>

                      {/* Font boyutu */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Yazı Boyutu</label>
                        <select value={selectedElement.properties.fontSize || "text-base"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { fontSize: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="text-xs">Çok Küçük (xs)</option>
                          <option value="text-sm">Küçük (sm)</option>
                          <option value="text-base">Normal (base)</option>
                          <option value="text-lg">Büyük (lg)</option>
                          <option value="text-xl">Çok Büyük (xl)</option>
                          <option value="text-2xl">Devasa (2xl)</option>
                          <option value="text-4xl">Başlık Boyutu (4xl)</option>
                        </select>
                      </div>

                      {/* Font Ağırlığı */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Yazı Kalınlığı</label>
                        <select value={selectedElement.properties.fontWeight || "font-normal"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { fontWeight: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="font-light">İnce (light)</option>
                          <option value="font-normal">Normal (normal)</option>
                          <option value="font-semibold">Yarı Kalın (semibold)</option>
                          <option value="font-bold">Kalın (bold)</option>
                          <option value="font-extrabold">Çok Kalın (extrabold)</option>
                        </select>
                      </div>

                      {/* Yazı Rengi */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Yazı Rengi</label>
                        <select value={selectedElement.properties.textColor || "text-slate-800"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { textColor: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="text-slate-950">Koyu Antrasit</option>
                          <option value="text-slate-700">Koyu Gri</option>
                          <option value="text-slate-500">Normal Gri</option>
                          <option value="text-orange-500">Akıllı Turuncu</option>
                          <option value="text-sky-500">Mavi</option>
                          <option value="text-red-500">Kırmızı</option>
                        </select>
                      </div>

                      {/* Hizalama */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Hizalama</label>
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 gap-0.5">
                          {[
                            { value: "text-left", icon: AlignLeft },
                            { value: "text-center", icon: AlignCenter },
                            { value: "text-right", icon: AlignRight }
                          ].map(align => {
                            const AlignIcon = align.icon;
                            const isActive = selectedElement.properties.textAlign === align.value;
                            return (
                              <button key={align.value} onClick={() => updateElementProperties(selectedElement.id, { textAlign: align.value })}
                                className={`flex-1 py-1.5 rounded-lg border-none cursor-pointer flex items-center justify-center transition-all ${isActive ? "bg-orange-500 text-white" : "bg-transparent text-slate-400 hover:text-white"}`}>
                                <AlignIcon className="w-3.5 h-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BUTTON properties inspector */}
                  {selectedElement.type === "button" && (
                    <div className="space-y-4">
                      {/* Buton metni */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Buton Metni</label>
                        <input type="text" value={selectedElement.properties.content || ""}
                          onChange={(e) => updateElementProperties(selectedElement.id, { content: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                      </div>

                      {/* Yönlendirme linki */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Bağlantı URL</label>
                        <input type="text" value={selectedElement.properties.link || ""}
                          onChange={(e) => updateElementProperties(selectedElement.id, { link: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                      </div>

                      {/* Buton Türü */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Buton Stili</label>
                        <select value={selectedElement.properties.buttonStyle || "solid"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { buttonStyle: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="solid">Dolu (Solid)</option>
                          <option value="outline">Kenarlık (Outline)</option>
                        </select>
                      </div>

                      {/* Arka plan rengi */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Arka Plan Rengi</label>
                        <select value={selectedElement.properties.backgroundColor || "bg-orange-500"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { backgroundColor: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="bg-orange-500">Turuncu</option>
                          <option value="bg-slate-900">Koyu Antrasit</option>
                          <option value="bg-sky-500">Mavi</option>
                          <option value="bg-emerald-500">Yeşil</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* IMAGE properties inspector */}
                  {selectedElement.type === "image" && (
                    <div className="space-y-4">
                      {/* Görsel URL */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Resim Adresi (URL)</label>
                        <input type="text" value={selectedElement.properties.url || ""}
                          onChange={(e) => updateElementProperties(selectedElement.id, { url: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                      </div>

                      {/* Alt etiketi */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Alt Açıklaması (Alt Tag)</label>
                        <input type="text" value={selectedElement.properties.alt || ""}
                          onChange={(e) => updateElementProperties(selectedElement.id, { alt: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                      </div>

                      {/* Border radius */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Köşe Yuvarlama</label>
                        <select value={selectedElement.properties.borderRadius || "rounded-xl"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { borderRadius: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="rounded-none">Köşeli (Hiç)</option>
                          <option value="rounded-md">Küçük (md)</option>
                          <option value="rounded-xl">Orta (xl)</option>
                          <option value="rounded-2xl">Büyük (2xl)</option>
                          <option value="rounded-full">Oval (Tam)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* SECTION properties inspector */}
                  {selectedElement.type === "section" && (
                    <div className="space-y-4">
                      {/* Dikey iç boşluk */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">İç Boşluk (Padding)</label>
                        <select value={selectedElement.properties.padding || "py-12 px-6"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { padding: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="py-6 px-4">Dar (py-6)</option>
                          <option value="py-12 px-6">Normal (py-12)</option>
                          <option value="py-20 px-8">Geniş (py-20)</option>
                          <option value="py-32 px-12">Çok Geniş (py-32)</option>
                        </select>
                      </div>

                      {/* Arka plan rengi */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Arka Plan Rengi</label>
                        <select value={selectedElement.properties.backgroundColor || "bg-white"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { backgroundColor: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="bg-white">Beyaz</option>
                          <option value="bg-slate-50">Çok Açık Gri</option>
                          <option value="bg-slate-100">Açık Gri</option>
                          <option value="bg-orange-50">Açık Turuncu</option>
                          <option value="bg-slate-900 text-white">Koyu Antrasit</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Harita özellikleri */}
                  {selectedElement.type === "map" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Harita Adresi</label>
                        <input type="text" value={selectedElement.properties.address || ""}
                          onChange={(e) => updateElementProperties(selectedElement.id, { address: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                      </div>
                    </div>
                  )}

                  {/* Video özellikleri */}
                  {selectedElement.type === "video" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Video Embed URL</label>
                        <input type="text" value={selectedElement.properties.url || ""}
                          onChange={(e) => updateElementProperties(selectedElement.id, { url: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition" />
                      </div>
                    </div>
                  )}

                  {/* Grid özellikleri */}
                  {selectedElement.type === "grid" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Kolon Sayısı</label>
                        <select value={selectedElement.properties.columns || "grid-cols-3"}
                          onChange={(e) => updateElementProperties(selectedElement.id, { columns: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition cursor-pointer">
                          <option value="grid-cols-1">1 Kolon</option>
                          <option value="grid-cols-2">2 Kolon</option>
                          <option value="grid-cols-3">3 Kolon</option>
                          <option value="grid-cols-4">4 Kolon</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* General Info */}
                  <div className="text-[10px] text-slate-500 font-semibold bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40 leading-relaxed">
                    ⚙️ Özellik panelindeki güncellemeler tuval üzerindeki görselleşmeye anında yansır.
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 text-slate-600 font-medium text-xs leading-relaxed max-w-[200px] mx-auto space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800/40 flex items-center justify-center text-slate-500 mx-auto">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <p>Herhangi bir elemanın özelliklerini düzenlemek için tuval üzerinden elemanı seçin.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
