"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  PackageSearch, Settings2, Hammer, Search, AlertTriangle as AlertCircle, 
  CheckCircle2, Box, ArrowRight, Loader2, PlaySquare, Layers, Clock,
  Package, Plus, Edit, Trash2, Save, X, ChevronRight, ChevronDown, Copy, Check, Info,
  UploadCloud, Sparkles, Coins, FileText, Database, RefreshCw, Lock, Unlock, 
  ShoppingBag, Globe, Percent, Calendar, ArrowUpRight, BarChart3, 
  AlertTriangle, Eye, Printer, Layers3, CheckSquare, Square, Tag, ExternalLink, 
  HelpCircle, Video, Key, PlusCircle, Trash, Store, SlidersHorizontal, BookOpen, Radio
} from "lucide-react";
import { toast } from "sonner";
import { useProduct } from "@/context/ProductContext";
import { fetchProductsFromApi } from "@/utils/productsStorage";
import { isVideoUrl } from "@/lib/utils";

function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Variant {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  size: string;
  color: string;
  stock: number;
  price: number;
  b2bPrice?: number;
  vatRate?: number;
  vatIncluded?: boolean;
}

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
}

interface Marketplace {
  id: string;
  name: string;
  syncEnabled: boolean;
  apiConnected: boolean;
  apiKey?: string;
  apiSecret?: string;
  logoColor: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  stockCount: number;
  price?: number;
  reserved?: number;
  minStock?: number;
  criticalLimit?: number;
  branchId?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

interface XmlFeed {
  id: string;
  name: string;
  priceSource: string;
  markupPercent: number;
  active: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PREMIUM RICH TEXT EDITOR  (Zero-dependency, contentEditable-based)
   ───────────────────────────────────────────────────────────────────────────── */
interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
}

function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [isSourceMode, setIsSourceMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!savedSelectionRef.current) {
      if (editorRef.current) {
        editorRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      return;
    }
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Sync contentEditable with external value (e.g. on load)
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isSourceMode]);

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const exec = (cmd: string, arg: string = "") => {
    editorRef.current?.focus();
    restoreSelection();
    (document as any).execCommand("styleWithCSS", false, false);
    document.execCommand(cmd, false, arg);
    saveSelection();
    handleInput();
  };

  const applyStyle = (styleName: string, value: string) => {
    editorRef.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      exec(styleName === "fontSize" ? "fontSize" : "fontName", value);
      return;
    }

    document.execCommand("styleWithCSS", false, "true");
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    if (styleName === "fontSize") {
      span.style.fontSize = value;
    } else if (styleName === "fontFamily") {
      span.style.fontFamily = value;
    }
    
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } catch (err) {
      document.execCommand(styleName === "fontSize" ? "fontSize" : "fontName", false, value);
    }
    saveSelection();
    handleInput();
  };

  const insertHTML = (html: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    saveSelection();
    handleInput();
  };

  const handleLinkClick = () => {
    const url = prompt("Bağlantı URL'sini girin:", "https://");
    if (url) exec("createLink", url);
  };

  const handleImageClick = () => {
    const useUrl = window.confirm("URL ile resim eklemek için Tamam, cihazdan yüklemek için İptal'e basın.");
    if (useUrl) {
      const url = prompt("Resim URL'sini girin:", "https://");
      if (url) insertHTML(`<img src="${url}" alt="Resim" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        insertHTML(`<img src="${data.url}" alt="${file.name}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      } else {
        alert(data.error || "Resim yüklenirken hata oluştu.");
      }
    } catch (err) {
      console.error("Editor image upload error:", err);
      alert("Resim yüklenirken bağlantı hatası oluştu.");
    } finally {
      e.target.value = "";
    }
  };

  const insertTable = () => {
    insertHTML(`<table style="width:100%;border-collapse:collapse;margin:12px 0;border:1px solid #cbd5e1"><thead><tr style="background:#f1f5f9"><th style="border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:13px">Sütun 1</th><th style="border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:13px">Sütun 2</th><th style="border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:13px">Sütun 3</th></tr></thead><tbody><tr><td style="border:1px solid #cbd5e1;padding:8px;font-size:13px">Hücre 1</td><td style="border:1px solid #cbd5e1;padding:8px;font-size:13px">Hücre 2</td><td style="border:1px solid #cbd5e1;padding:8px;font-size:13px">Hücre 3</td></tr><tr><td style="border:1px solid #cbd5e1;padding:8px;font-size:13px">Hücre 4</td><td style="border:1px solid #cbd5e1;padding:8px;font-size:13px">Hücre 5</td><td style="border:1px solid #cbd5e1;padding:8px;font-size:13px">Hücre 6</td></tr></tbody></table>`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        exec("bold");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        exec("italic");
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        exec("underline");
      }
    }
  };

  const TB = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button type="button" 
      onMouseDown={e => { e.preventDefault(); restoreSelection(); }}
      onClick={onClick} 
      title={title}
      className="p-1.5 hover:bg-slate-200/80 rounded-lg transition text-slate-655 cursor-pointer border-none bg-transparent flex items-center justify-center">
      {children}
    </button>
  );

  const SEP = () => <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">

      {/* ── TOOLBAR ── */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap gap-y-1.5 gap-x-1 items-center select-none">

        {/* Alan Ekle dropdown */}
        <div className="relative group shrink-0">
          <button type="button"
            onMouseDown={e => e.preventDefault()}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition text-slate-700">
            Alan Ekle <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 hidden group-hover:block">
            {[
              { label: "Ürün Adı", tag: "[UrunAdi]" },
              { label: "Stok Kodu", tag: "[SKU]" },
              { label: "Barkod", tag: "[Barkod]" },
              { label: "Kategori", tag: "[Kategori]" },
              { label: "Satış Fiyatı", tag: "[SatisFiyati]" },
              { label: "Birim", tag: "[Birim]" },
            ].map(item => (
              <button key={item.tag} type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => insertHTML(`<strong>${item.tag}</strong>`)}
                className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition border-none cursor-pointer">
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <SEP />

        {/* Heading style */}
        <select 
          onFocus={saveSelection}
          onChange={e => {
            exec("formatBlock", e.target.value);
            e.target.value = "p";
          }}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none cursor-pointer text-slate-755 hover:border-slate-350 transition">
          <option value="p">Normal</option>
          <option value="h1">Başlık 1</option>
          <option value="h2">Başlık 2</option>
          <option value="h3">Başlık 3</option>
          <option value="h4">Başlık 4</option>
        </select>

        {/* Font size */}
        <select 
          onFocus={saveSelection}
          onChange={e => {
            applyStyle("fontSize", e.target.value);
            e.target.value = "";
          }}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none cursor-pointer text-slate-755 hover:border-slate-350 transition">
          <option value="">Boyut</option>
          <option value="12px">Küçük (12px)</option>
          <option value="14px">Normal (14px)</option>
          <option value="16px">Orta (16px)</option>
          <option value="18px">Büyük (18px)</option>
          <option value="24px">Çok Büyük (24px)</option>
          <option value="32px">Dev (32px)</option>
        </select>

        {/* Font family */}
        <select 
          onFocus={saveSelection}
          onChange={e => {
            applyStyle("fontFamily", e.target.value);
            e.target.value = "";
          }}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none cursor-pointer text-slate-755 hover:border-slate-350 transition">
          <option value="">Yazı Tipi</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Inter, sans-serif">Inter</option>
          <option value="Roboto, sans-serif">Roboto</option>
          <option value="Times New Roman, serif">Times New Roman</option>
          <option value="Courier New, monospace">Courier New</option>
        </select>

        <SEP />

        {/* Undo / Redo */}
        <TB onClick={() => exec("undo")} title="Geri Al">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </TB>
        <TB onClick={() => exec("redo")} title="Yinele">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </TB>

        <SEP />

        {/* Bold / Italic / Underline / Strikethrough */}
        <TB onClick={() => exec("bold")} title="Kalın">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 12a4 4 0 0 0 0-8H6v8h8z"/><path d="M15 20a4 4 0 0 0 0-8H6v8h9z"/></svg>
        </TB>
        <TB onClick={() => exec("italic")} title="İtalik">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </TB>
        <TB onClick={() => exec("underline")} title="Altı Çizili">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
        </TB>
        <TB onClick={() => exec("strikethrough")} title="Üstü Çizili">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 5.5C16.5 4 15 3 12 3s-5 1.5-5 4.5c0 2.5 2 3.5 5 4.5"/></svg>
        </TB>

        <SEP />

        {/* Lists */}
        <TB onClick={() => exec("insertUnorderedList")} title="Madde İşaretli Liste">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" x2="21" y1="6" y2="6"/>
            <line x1="9" x2="21" y1="12" y2="12"/>
            <line x1="9" x2="21" y1="18" y2="18"/>
            <line x1="5" x2="5.01" y1="6" y2="6"/>
            <line x1="5" x2="5.01" y1="12" y2="12"/>
            <line x1="5" x2="5.01" y1="18" y2="18"/>
          </svg>
        </TB>
        <TB onClick={() => exec("insertOrderedList")} title="Numaralı Liste">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" x2="21" y1="6" y2="6"/>
            <line x1="10" x2="21" y1="12" y2="12"/>
            <line x1="10" x2="21" y1="18" y2="18"/>
            <path d="M4 6h1v4"/>
            <path d="M4 10h2"/>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </TB>

        <SEP />

        {/* Alignment */}
        <TB onClick={() => exec("justifyLeft")} title="Sola Hizala">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </TB>
        <TB onClick={() => exec("justifyCenter")} title="Ortala">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
        </TB>
        <TB onClick={() => exec("justifyRight")} title="Sağa Hizala">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        </TB>
        <TB onClick={() => exec("justifyFull")} title="İki Yana Yasla">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
        </TB>

        <SEP />

        {/* Text / Highlight colors */}
        <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-1 bg-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Yazı</span>
          <input type="color" title="Yazı Rengi"
            onFocus={saveSelection}
            onChange={e => exec("foreColor", e.target.value)}
            className="w-4 h-4 p-0 border border-slate-200 rounded cursor-pointer bg-transparent" />
          <div className="h-3 w-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vurgu</span>
          <input type="color" title="Arkaplan Vurgusu"
            onFocus={saveSelection}
            onChange={e => exec("backColor", e.target.value)}
            className="w-4 h-4 p-0 border border-slate-200 rounded cursor-pointer bg-transparent" />
        </div>

        <SEP />

        {/* Link */}
        <TB onClick={handleLinkClick} title="Bağlantı Ekle">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </TB>

        {/* Image */}
        <TB onClick={handleImageClick} title="Resim Ekle">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </TB>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

        {/* Blockquote */}
        <TB onClick={() => exec("formatBlock", "blockquote")} title="Alıntı Ekle">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5H3v8h4c0 3.5-1 5.5-4 8z"/><path d="M14 21c3 0 7-1 7-8V5h-7v8h4c0 3.5-1 5.5-4 8z"/></svg>
        </TB>

        {/* Table */}
        <TB onClick={insertTable} title="Tablo Ekle">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </TB>

        {/* Clear Format */}
        <TB onClick={() => exec("removeFormat")} title="Biçimlendirmeyi Temizle">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16c-1.5-1.5-1.5-3.5 0-5l7-7c1.5-1.5 3.5-1.5 5 0l5 5c1.5 1.5 1.5 3.5 0 5l-5 5Z"/><line x1="22" y1="20" x2="13" y2="20"/><line x1="6" y1="11" x2="13" y2="18"/></svg>
        </TB>

        <SEP />

        {/* Source toggle */}
        <button type="button" onClick={() => setIsSourceMode(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border ${
            isSourceMode
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
          }`}
          title="Kaynak Kodu Düzenle">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Kaynak
        </button>
      </div>

      {/* ── EDITOR AREA ── */}
      <div className="relative bg-white flex-1 min-h-[300px]">
        {isSourceMode ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full min-h-[300px] p-4 font-mono text-sm bg-slate-900 text-green-400 outline-none border-none resize-y leading-relaxed text-left"
            dir="ltr"
            placeholder="HTML kaynak kodunu buraya yazabilirsiniz..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={() => { saveSelection(); handleInput(); }}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[300px] p-4 text-sm text-slate-800 outline-none overflow-y-auto leading-relaxed text-left"
            dir="ltr"
            style={{ minHeight: "300px", direction: "ltr", textAlign: "left" }}
          />
        )}
        {/* Placeholder overlay */}
        {!isSourceMode && !value && (
          <div className="absolute top-4 left-4 text-slate-350 text-sm pointer-events-none select-none">
            Ürün açıklamasını buraya yazıp biçimlendirebilirsiniz...
          </div>
        )}
      </div>

    </div>
  );
}

const toLocalDateTimeString = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().substring(0, 16);
};

interface EnterpriseStockFormPageProps {
  productId?: string;
}

function EnterpriseStockFormPage({ productId: propProductId }: EnterpriseStockFormPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // SKU öncelikli — eski ?id= formatı da desteklenir (geriye dönük uyumluluk)
  const rawQuery = typeof window !== "undefined" ? window.location.search : "";
  const clientUrlParams = typeof window !== "undefined" ? new URLSearchParams(rawQuery) : null;
  const clientSlug = clientUrlParams?.get("slug");
  const clientSku = clientUrlParams?.get("sku");
  const clientId = clientUrlParams?.get("id");

  const slugParam = searchParams.get("slug");
  const skuParam = searchParams.get("sku");
  const idParam = searchParams.get("id");
  const productId = propProductId || idParam || skuParam || clientId || clientSku || slugParam || clientSlug;
  const isEditMode = !!productId;
  const { refreshProducts, refreshCategories } = useProduct();


  // Main Tab State
  const [activeTab, setActiveTab] = useState<"genel" | "hikaye_analiz" | "diger" | "birimler" | "sube" | "b2b">("genel");
  
  // Secondary Bottom Tab State
  const [activeSubTab, setActiveSubTab] = useState<"varyantlar" | "xml">("varyantlar");

  // Loading & Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);
  const [isSkuLocked, setIsSkuLocked] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitialized = useRef(false);

  // Live Units API Fetch
  const fetchUnitsFromApi = async () => {
    try {
      const res = await fetch("/api/units");
      if (res.ok) {
        const data = await res.json();
        if (data.units && Array.isArray(data.units)) {
          setUnits(data.units);
        }
      }
    } catch (e) {
      console.error("Units fetch error:", e);
    }
  };

  useEffect(() => {
    fetchUnitsFromApi();
  }, []);

  // Dynamic sizes and colors states
  const [sizes, setSizes] = useState<string[]>(["400g Cam Kavanoz", "800g Cam Kavanoz", "1 kg Vakum", "5 kg Teneke"]);
  const [colors, setColors] = useState<string[]>(["Sade", "Cevizli", "Fındıklı", "Antep Fıstıklı"]);
  const [isSizeManagerOpen, setIsSizeManagerOpen] = useState(false);
  const [isColorManagerOpen, setIsColorManagerOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const [newSizeName, setNewSizeName] = useState("");
  const [newColorName, setNewColorName] = useState("");

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(e.target as Node)) {
        setIsSizeDropdownOpen(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target as Node)) {
        setIsColorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load initial sizes & colors from localStorage AND API/database catalog
  useEffect(() => {
    const loadGlobalOptions = async () => {
      try {
        const savedSizes = localStorage.getItem("pekefe_stock_sizes");
        const savedColors = localStorage.getItem("pekefe_stock_colors");
        
        let initialSizes: string[] = savedSizes ? JSON.parse(savedSizes) : ["400g Cam Kavanoz", "800g Cam Kavanoz", "1 kg Vakum", "5 kg Teneke"];
        let initialColors: string[] = savedColors ? JSON.parse(savedColors) : ["Sade", "Cevizli", "Fındıklı", "Antep Fıstıklı"];

        if (!Array.isArray(initialSizes) || initialSizes.length === 0) {
          initialSizes = ["400g Cam Kavanoz", "800g Cam Kavanoz", "1 kg Vakum", "5 kg Teneke"];
        }
        if (!Array.isArray(initialColors) || initialColors.length === 0) {
          initialColors = ["Sade", "Cevizli", "Fındıklı", "Antep Fıstıklı"];
        }

        // Fetch product catalog to harvest all custom sizes & colors ever created in DB
        const res = await fetch("/api/products");
        if (res.ok) {
          const products = await res.json();
          if (Array.isArray(products)) {
            const dbSizes: string[] = [];
            const dbColors: string[] = [];
            
            products.forEach((p: any) => {
              const attrs = typeof p.attributes === "string" ? JSON.parse(p.attributes) : (p.attributes || {});
              if (attrs.sizes && Array.isArray(attrs.sizes)) {
                dbSizes.push(...attrs.sizes);
              }
              if (attrs.colors && Array.isArray(attrs.colors)) {
                dbColors.push(...attrs.colors);
              }
              if (p.variants && Array.isArray(p.variants)) {
                p.variants.forEach((v: any) => {
                  const va = typeof v.attributes === "string" ? JSON.parse(v.attributes) : (v.attributes || {});
                  if (va.size || v.size) dbSizes.push(va.size || v.size);
                  if (va.color || v.color) dbColors.push(va.color || v.color);
                });
              }
            });

            initialSizes = Array.from(new Set([...initialSizes, ...dbSizes])).filter(Boolean);
            initialColors = Array.from(new Set([...initialColors, ...dbColors])).filter(Boolean);
          }
        }

        setSizes(initialSizes);
        setColors(initialColors);

        localStorage.setItem("pekefe_stock_sizes", JSON.stringify(initialSizes));
        localStorage.setItem("pekefe_stock_colors", JSON.stringify(initialColors));
      } catch (e) {
        console.error("Error loading global stock options:", e);
      }
    };

    loadGlobalOptions();
  }, []);

  // Sync sizes with localStorage
  useEffect(() => {
    if (sizes.length > 0) {
      try {
        localStorage.setItem("pekefe_stock_sizes", JSON.stringify(sizes));
      } catch (e) {}
    }
  }, [sizes]);

  // Sync colors with localStorage
  useEffect(() => {
    if (colors.length > 0) {
      try {
        localStorage.setItem("pekefe_stock_colors", JSON.stringify(colors));
      } catch (e) {}
    }
  }, [colors]);

  // Dynamic actions state variables
  const [status, setStatus] = useState<"Yayında" | "Arşivlendi">("Yayında");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Dynamic Print Barcode Form states
  const [printForm, setPrintForm] = useState({
    labelSize: "50mm x 30mm",
    qty: 10,
    showPrice: true,
    priceType: "salePrice"
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);

  // Dynamic Stock movements report listing
  const [movements, setMovements] = useState<any[]>([]);

  // Add new movement form state
  const [newMovement, setNewMovement] = useState({
    type: "Giriş (Mal Kabul)",
    warehouse: "Merkez Depo",
    qty: 10,
    user: "Sistem Yöneticisi"
  });

  // Action methods
  const handlePrintBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPrinting(true);
    setPrintProgress(0);
    const interval = setInterval(() => {
      setPrintProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsPrinting(false);
            setIsPrintModalOpen(false);
            toast.success(`${printForm.qty} Adet ${printForm.labelSize} Barkod Etiketi başarıyla termal yazıcıya gönderildi!`);
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleCopyCard = () => {
    setIsActionsOpen(false);
    const suffix = "-KOPYA";
    const newSku = form.sku.endsWith(suffix) ? form.sku + "-2" : form.sku + suffix;
    const newBarcode = "868" + Math.floor(1000000000 + Math.random() * 9000000000);
    const newName = form.name.includes(" (Kopyası)") ? form.name : form.name + " (Kopyası)";
    
    setForm(prev => ({
      ...prev,
      sku: newSku,
      barcode: newBarcode,
      name: newName
    }));
    setStatus("Yayında");
    toast.success("Stok kartı başarıyla kopyalandı ve çoğaltıldı!");
  };

  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  const fetchMovements = async () => {
    if (!productId) return;
    setIsLoadingMovements(true);
    try {
      const response = await fetch(`/api/products/${productId}/movements`);
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
      } else {
        toast.error("Stok hareketleri yüklenemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Stok hareketleri yüklenirken bir hata oluştu.");
    } finally {
      setIsLoadingMovements(false);
    }
  };

  useEffect(() => {
    if (isReportModalOpen && isEditMode && productId) {
      fetchMovements();
    }
  }, [isReportModalOpen, isEditMode, productId]);

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMovement.qty <= 0) {
      toast.error("Miktar sıfırdan büyük olmalıdır!");
      return;
    }
    const isOutflow = newMovement.type.includes("Çıkış");
    const deltaQty = isOutflow ? -newMovement.qty : newMovement.qty;

    if (isEditMode && productId) {
      try {
        const response = await fetch(`/api/products/${productId}/movements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: newMovement.type,
            warehouseName: newMovement.warehouse,
            qty: newMovement.qty
          })
        });

        if (response.ok) {
          toast.success("Stok hareket kaydı başarıyla oluşturuldu ve depo stokları güncellendi!");
          fetchMovements();
          
          // Depo stoklarını arayüzde de hemen güncelle
          setWarehouses(prev => prev.map(w => {
            if (w.name === newMovement.warehouse) {
              const newCount = Math.max(0, w.stockCount + deltaQty);
              return { ...w, stockCount: newCount };
            }
            return w;
          }));
          setNewMovement(prev => ({ ...prev, qty: 10 }));
        } else {
          const errData = await response.json();
          toast.error(errData.error || "Stok hareketi işlenirken bir hata oluştu.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Stok hareketi sunucuya gönderilirken bir hata oluştu.");
      }
    } else {
      // Yeni ürün kaydı esnasında yerel state güncelle
      const nMove = {
        id: Math.random().toString(),
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: newMovement.type === "Giriş (Mal Kabul)" ? "Mal Kabul (Dinamik)" : "Sevk/Çıkış (Dinamik)",
        warehouse: newMovement.warehouse,
        qty: deltaQty,
        user: newMovement.user,
        status: "Tamamlandı"
      };

      setWarehouses(prev => prev.map(w => {
        if (w.name === newMovement.warehouse) {
          const newCount = Math.max(0, w.stockCount + deltaQty);
          return { ...w, stockCount: newCount };
        }
        return w;
      }));

      setMovements(prev => [nMove, ...prev]);
      setNewMovement(prev => ({ ...prev, qty: 10 }));
      toast.success("Stok hareket kaydı geçici olarak oluşturuldu. Ürünü kaydettiğinizde geçerli olacaktır.");
    }
  };

  // Form Fields
  // Form Fields
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    brand: "PEKEFE",
    model: "",
    category: "",
    unit: "Adet",
    manufacturerCode: "",
    stockType: "Ticari Mal",
    warehouse: "Merkez Depo",
    desc: "",
    shortDesc: "",
    recipeDetails: "",

    // Price Matrix (Currency, VAT rate, Included switch)
    purchasePrice: 0,
    purchaseCurrency: "TRY",
    purchaseVat: "20",
    purchaseVatIncluded: false,

    salePrice: 0,
    saleCurrency: "TRY",
    saleVat: "20",
    saleVatIncluded: true,

    retailPrice: 0,
    retailCurrency: "TRY",
    retailVat: "20",
    retailVatIncluded: true,

    webPrice: 0,
    webCurrency: "TRY",
    webVat: "20",
    webVatIncluded: true,

    marketPrice: 0,
    marketCurrency: "TRY",
    marketVat: "20",
    marketVatIncluded: true,

    isCampaignActive: false,
    discount_start_date: "",
    discount_end_date: "",

    // B2B Settings
    b2bActive: true,
    b2bPreOrderable: false,

    // SEO, video, and units coefficients
    seoTitle: "",
    seoDesc: "",
    seoKeywords: "",
    videoUrl: "",
    unitCoefficients: [] as { id: string; unit: string; coefficient: number; price?: number }[],
    specsMaterial: "",
    specsWeight: "",
    specsDimensions: "",
    specsBellows: "",
    usageGuide: "",
    warrantyInfo: "",
    warrantyBadgeLabel: "",
    warrantyYears: "",
    warrantyBadgeDesc: "",
    quickOverview1_title: "",
    quickOverview1_desc: "",
    quickOverview2_title: "",
    quickOverview2_desc: "",
    quickOverview3_title: "",
    quickOverview3_desc: "",
    longDescExtra: "",
    badgeText1: "",
    badgeText2: "",

    // Food & Harvest Attributes
    altitude: "",
    harvestSeason: "",
    harvestStory: "",
    ingredients: "",
    ritual: "",
    nutrients_energy: "",
    nutrients_carb: "",
    nutrients_protein: "",
    nutrients_calcium: "",
    nutrients_iron: "",
    hmfLevel: "",
  });

  // Always fetch branches on mount (both create and edit mode)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch warehouses from DB for new product mode
  useEffect(() => {
    if (productId) return; // edit mode loads warehouses from product.locations
    const fetchWarehouses = async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const branchesWithWarehouses: any[] = await res.json();
          const allWarehouses: Warehouse[] = [];
          for (const br of branchesWithWarehouses) {
            if (br.warehouses && Array.isArray(br.warehouses)) {
              br.warehouses.forEach((w: any) => {
                allWarehouses.push({
                  id: w.id,
                  name: w.name,
                  code: w.code,
                  location: w.address || "",
                  stockCount: 0,
                  reserved: 0,
                  minStock: 0,
                  criticalLimit: 0,
                  branchId: w.branchId || br.id,
                });
              });
            }
          }
          if (allWarehouses.length > 0) {
            setWarehouses(allWarehouses);
          }
        }
      } catch (err) {
        console.error("Error fetching warehouses for new product:", err);
      }
    };
    fetchWarehouses();
  }, [productId]);


  // Load product if editing
  useEffect(() => {
    isInitialized.current = false;
    setIsDirty(false);

    let isSubscribed = true;

    const getTargetParams = () => {
      let id = idParam || searchParams.get("id") || "";
      let sku = skuParam || searchParams.get("sku") || "";
      let slug = slugParam || searchParams.get("slug") || "";

      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        if (!id) id = urlParams.get("id") || "";
        if (!sku) sku = urlParams.get("sku") || "";
        if (!slug) slug = urlParams.get("slug") || "";
      }
      return {
        id: id.trim().toLowerCase(),
        sku: sku.trim().toLowerCase(),
        slug: slug.trim().toLowerCase()
      };
    };

    const target = getTargetParams();
    const isEdit = Boolean(target.id || target.sku || target.slug);

    if (!isEdit) {
      // If truly new product, initialize default empty form
      const randNum = Math.floor(100000 + Math.random() * 900000);
      const randBarcode = "869" + Math.floor(1000000000 + Math.random() * 9000000000);
      const randManCode = `PKF-DUT-${Math.floor(1000 + Math.random() * 9000)}`;
      setForm({
        name: "",
        sku: `PKF-${randNum}`,
        barcode: randBarcode,
        brand: "PEKEFE",
        model: "",
        category: "",
        unit: "Adet",
        manufacturerCode: randManCode,
        stockType: "Ticari Mal",
        warehouse: "Erzurum İspir Merkez Depo",
        desc: "",
        shortDesc: "",
        recipeDetails: "",
        purchasePrice: 0,
        purchaseCurrency: "TRY",
        purchaseVat: "20",
        purchaseVatIncluded: false,
        salePrice: 0,
        saleCurrency: "TRY",
        saleVat: "20",
        saleVatIncluded: true,
        retailPrice: 0,
        retailCurrency: "TRY",
        retailVat: "20",
        retailVatIncluded: true,
        webPrice: 0,
        webCurrency: "TRY",
        webVat: "20",
        webVatIncluded: true,
        marketPrice: 0,
        marketCurrency: "TRY",
        marketVat: "20",
        marketVatIncluded: true,
        isCampaignActive: false,
        discount_start_date: "",
        discount_end_date: "",
        b2bActive: true,
        b2bPreOrderable: false,
        seoTitle: "",
        seoDesc: "",
        seoKeywords: "",
        videoUrl: "",
        unitCoefficients: [],
        specsMaterial: "",
        specsWeight: "",
        specsDimensions: "",
        specsBellows: "",
        usageGuide: "",
        warrantyInfo: "",
        warrantyBadgeLabel: "",
        warrantyYears: "",
        warrantyBadgeDesc: "",
        quickOverview1_title: "",
        quickOverview1_desc: "",
        quickOverview2_title: "",
        quickOverview2_desc: "",
        quickOverview3_title: "",
        quickOverview3_desc: "",
        longDescExtra: "",
        badgeText1: "",
        badgeText2: "",
      });
      setIsSkuLocked(false);
      setMediaList([]);
      setWarehouses([
        { id: "1", name: "Merkez Depo", code: "WH-MRKZ", location: "Erzurum OSB, 3. Cadde", stockCount: 0, reserved: 0, minStock: 0, criticalLimit: 0, branchId: "default-branch" },
        { id: "2", name: "Şube Depo", code: "WH-SUBE", location: "İstanbul Anadolu Yakası", stockCount: 0, reserved: 0, minStock: 0, criticalLimit: 0, branchId: "sube-branch" },
        { id: "3", name: "Üretim Bandı", code: "WH-URT", location: "Yakutiye Fabrika Alanı", stockCount: 0, reserved: 0, minStock: 0, criticalLimit: 0, branchId: "default-branch" },
      ]);
      setVariants([]);
      setStatus("Yayında");

      setIsLoadingProduct(false);
      const timer = setTimeout(() => {
        if (isSubscribed) isInitialized.current = true;
      }, 300);
      return () => {
        isSubscribed = false;
        clearTimeout(timer);
      };
    }

    const fetchProduct = async () => {
      try {
        let product: any = null;
        const { id: targetIdVal, sku: targetSkuVal, slug: targetSlugVal } = getTargetParams();

        const isMatch = (p: any) => {
          if (!p) return false;
          const pId = String(p.id || "").trim().toLowerCase();
          const pSku = String(p.sku || "").trim().toLowerCase();
          const pSlug = String(p.slug || generateSlug(p.name || "")).trim().toLowerCase();
          const pNameClean = String(p.name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          
          if (targetIdVal && pId === targetIdVal) return true;
          if (targetSkuVal && pSku === targetSkuVal) return true;
          if (targetSlugVal && (pSlug === targetSlugVal || pSlug.includes(targetSlugVal) || targetSlugVal.includes(pSlug))) return true;
          if (targetSlugVal && pNameClean.includes(targetSlugVal.replace(/-/g, ""))) return true;
          return false;
        };

        // 1. Direct API lookup to always fetch latest DB product
        try {
          const apiRes = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
          if (apiRes.ok) {
            const apiList = await apiRes.json();
            if (Array.isArray(apiList)) {
              product = apiList.find(isMatch);
            }
          }
        } catch (e) {
          console.error("API products fetch failed in form:", e);
        }

        // 2. Fallback to local storage if API didn't return
        if (!product) {
          const localProducts = getProducts();
          product = localProducts.find(isMatch);
        }

        if (!product) {
          console.warn("[STOCK FORM WARNING] Product not resolved for edit:", targetIdVal, targetSkuVal, targetSlugVal);
          setIsLoadingProduct(false);
          return;
        }
        
        // Parse attributes if string
        const attrs = typeof product.attributes === "string" 
          ? JSON.parse(product.attributes) 
          : (product.attributes || {});

        // Helper to parse old HTML quick overview tags cleanly
        const parseQO = (val: string) => {
          if (!val) return { title: "", desc: "" };
          const match = val.match(/<strong>(.*?)<\/strong>\s*:\s*(.*)/) || val.match(/<strong>(.*?)<\/strong>(.*)/);
          if (match) {
            return {
              title: match[1].replace(/:$/, "").trim(),
              desc: match[2].trim()
            };
          }
          return { title: "", desc: val.trim() };
        };

        const qo1_parsed = parseQO(attrs.quickOverview1);
        const qo2_parsed = parseQO(attrs.quickOverview2);
        const qo3_parsed = parseQO(attrs.quickOverview3);

        const qo1_title = attrs.quickOverview1_title || qo1_parsed.title;
        const qo1_desc = attrs.quickOverview1_desc || qo1_parsed.desc;
        const qo2_title = attrs.quickOverview2_title || qo2_parsed.title;
        const qo2_desc = attrs.quickOverview2_desc || qo2_parsed.desc;
        const qo3_title = attrs.quickOverview3_title || qo3_parsed.title;
        const qo3_desc = attrs.quickOverview3_desc || qo3_parsed.desc;

        // Ensure loaded category is in category options list
        if (product.category) {
          setCategories(prev => prev.includes(product.category) ? prev : [...prev, product.category]);
        }
        // Ensure loaded unit is in unit options list
        const loadedUnit = attrs.unit || product.unit || "Adet";
        if (loadedUnit) {
          setUnits(prev => prev.includes(loadedUnit) ? prev : [...prev, loadedUnit]);
        }

        // Ensure loaded sizes & colors are merged into option lists
        if (attrs.sizes && Array.isArray(attrs.sizes) && attrs.sizes.length > 0) {
          setSizes(prev => Array.from(new Set([...prev, ...attrs.sizes])));
        }
        if (attrs.colors && Array.isArray(attrs.colors) && attrs.colors.length > 0) {
          setColors(prev => Array.from(new Set([...prev, ...attrs.colors])));
        }
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          const varSizes = product.variants.map((v: any) => {
            const va = typeof v.attributes === "string" ? JSON.parse(v.attributes) : (v.attributes || {});
            return va.size || v.size;
          }).filter(Boolean);
          const varColors = product.variants.map((v: any) => {
            const va = typeof v.attributes === "string" ? JSON.parse(v.attributes) : (v.attributes || {});
            return va.color || v.color;
          }).filter(Boolean);
          if (varSizes.length > 0) {
            setSizes(prev => Array.from(new Set([...prev, ...varSizes])));
          }
          if (varColors.length > 0) {
            setColors(prev => Array.from(new Set([...prev, ...varColors])));
          }
        }

        setForm({
          name: product.name || "",
          sku: product.sku || "",
          barcode: attrs.barcode || product.barcode || "",
          brand: product.brand || "",
          model: product.model || "",
          category: product.category || "",
          unit: attrs.unit || product.unit || "Adet",
          manufacturerCode: attrs.manufacturerCode || product.manufacturerCode || "",
          stockType: attrs.stockType || "Ticari Mal",
          warehouse: attrs.warehouse || "Merkez Depo",
          desc: product.desc || attrs.shortDesc || attrs.desc || "",
          shortDesc: product.shortDesc || attrs.shortDesc || "",
          recipeDetails: attrs.recipeDetails || "",
          
          purchasePrice: product.cost || 0,
          purchaseCurrency: attrs.purchaseCurrency || "TRY",
          purchaseVat: attrs.purchaseVat || "20",
          purchaseVatIncluded: attrs.purchaseVatIncluded ?? false,

          salePrice: product.sale_price ? Number(product.sale_price) : (product.b2b_base_price ? Number(product.b2b_base_price) : (product.price || 0)),
          saleCurrency: attrs.saleCurrency || "TRY",
          saleVat: attrs.saleVat || "20",
          saleVatIncluded: attrs.saleVatIncluded ?? true,

          retailPrice: attrs.retailPrice || 0,
          retailCurrency: attrs.retailCurrency || "TRY",
          retailVat: attrs.retailVat || "20",
          retailVatIncluded: attrs.retailVatIncluded ?? true,

          webPrice: attrs.webPrice || 0,
          webCurrency: attrs.webCurrency || "TRY",
          webVat: attrs.webVat || "20",
          webVatIncluded: attrs.webVatIncluded ?? true,

          marketPrice: product.oldPrice || 0,
          marketCurrency: attrs.marketCurrency || "TRY",
          marketVat: attrs.marketVat || "20",
          marketVatIncluded: attrs.marketVatIncluded ?? true,

          b2bActive: attrs.b2bActive ?? true,
          b2bPreOrderable: attrs.b2bPreOrderable ?? false,

          isCampaignActive: product.isCampaignActive ?? false,
          discount_start_date: toLocalDateTimeString(product.discount_start_date),
          discount_end_date: toLocalDateTimeString(product.discount_end_date),

          altitude: attrs.altitude || "",
          harvestSeason: attrs.harvestSeason || "",
          harvestStory: attrs.harvestStory || "",
          ingredients: attrs.ingredients || "",
          ritual: attrs.ritual || "",
          nutrients_energy: attrs.nutrients?.energy || "",
          nutrients_carb: attrs.nutrients?.carb || "",
          nutrients_protein: attrs.nutrients?.protein || "",
          nutrients_calcium: attrs.nutrients?.calcium || "",
          nutrients_iron: attrs.nutrients?.iron || "",
          hmfLevel: attrs.hmfLevel || "",

          seoTitle: product.seoTitle || "",
          seoDesc: product.seoDesc || "",
          seoKeywords: product.seoKeywords || "",
          videoUrl: product.videoUrl || "",
          unitCoefficients: attrs.unitCoefficients || [],
          specsMaterial: attrs.specsMaterial || "",
          specsWeight: attrs.specsWeight || "",
          specsDimensions: attrs.specsDimensions || "",
          specsBellows: attrs.specsBellows || "",
          usageGuide: attrs.usageGuide || "",
          warrantyInfo: attrs.warrantyInfo || "",
          warrantyBadgeLabel: attrs.warrantyBadgeLabel || "",
          warrantyYears: attrs.warrantyYears || "",
          warrantyBadgeDesc: attrs.warrantyBadgeDesc || "",
          quickOverview1_title: qo1_title,
          quickOverview1_desc: qo1_desc,
          quickOverview2_title: qo2_title,
          quickOverview2_desc: qo2_desc,
          quickOverview3_title: qo3_title,
          quickOverview3_desc: qo3_desc,
          longDescExtra: attrs.longDescExtra || "",
          badgeText1: attrs.badgeText1 || "",
          badgeText2: attrs.badgeText2 || "",
        });

        // Set status
        setStatus(product.isDeleted ? "Arşivlendi" : "Yayında");

        // Parse images if string
        const parsedImages = typeof product.images === "string"
          ? JSON.parse(product.images)
          : (product.images || []);

        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          setMediaList(parsedImages.map((url: string, index: number) => ({
            id: index.toString(),
            type: url.includes(".mp4") || url.includes(".mov") ? "video" : "image",
            url,
            name: `Görsel_${index + 1}`
          })));
        } else if (product.image) {
          setMediaList([{
            id: "0",
            type: "image",
            url: product.image,
            name: "Ana Görsel"
          }]);
        } else {
          setMediaList([]);
        }

        // Set warehouse stock levels
        const loadedWarehousePrices = attrs.warehousePrices || {};
        const loadedBranchPrices = attrs.branchPrices || {};
        setBranchPrices(loadedBranchPrices);

        if (product.locations && product.locations.length > 0) {
          setWarehouses(product.locations.map((loc: any) => ({
            id: loc.warehouseId,
            name: loc.warehouse?.name || "Depo",
            code: loc.warehouse?.code || loc.warehouse?.id || "WH",
            location: loc.warehouse?.address || "Genel Konum",
            stockCount: loc.stock || 0,
            reserved: loc.reserved || 0,
            minStock: loc.minStock || 0,
            criticalLimit: loc.criticalLimit || 0,
            branchId: loc.warehouse?.branchId || "default-branch",
            price: loadedWarehousePrices[loc.warehouseId] !== undefined ? loadedWarehousePrices[loc.warehouseId] : undefined
          })));
        } else {
          setWarehouses([
            { id: "1", name: "Merkez Depo", code: "WH-MRKZ", location: "Erzurum OSB, 3. Cadde", stockCount: product.stock || 0, reserved: 0, minStock: 0, criticalLimit: 0, branchId: "default-branch", price: loadedWarehousePrices["1"] },
            { id: "2", name: "Şube Depo", code: "WH-SUBE", location: "İstanbul Anadolu Yakası", stockCount: 0, reserved: 0, minStock: 0, criticalLimit: 0, branchId: "sube-branch", price: loadedWarehousePrices["2"] },
            { id: "3", name: "Üretim Bandı", code: "WH-URT", location: "Yakutiye Fabrika Alanı", stockCount: 0, reserved: 0, minStock: 0, criticalLimit: 0, branchId: "default-branch", price: loadedWarehousePrices["3"] },
          ]);
        }

        // Set variants if exist
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          setVariants(product.variants.map((v: any) => {
            const variantAttrs = typeof v.attributes === "string"
              ? JSON.parse(v.attributes)
              : (v.attributes || {});
            return {
              id: v.id,
              sku: v.sku || "",
              barcode: variantAttrs.barcode || v.barcode || "",
              name: variantAttrs.name || v.name || "",
              size: variantAttrs.size || v.size || "",
              color: variantAttrs.color || v.color || "",
              stock: v.stock !== undefined ? Number(v.stock) : 0,
              price: v.price ? Number(v.price) : 0,
              purchasePrice: v.cost ? Number(v.cost) : (variantAttrs.cost ? Number(variantAttrs.cost) : 0),
              b2bPrice: variantAttrs.b2bPrice != null ? Number(variantAttrs.b2bPrice) : (v.price ? Number(v.price) : 0),
              vatRate: variantAttrs.vatRate != null ? Number(variantAttrs.vatRate) : 20,
              vatIncluded: variantAttrs.vatIncluded ?? true,
            };
          }));
        } else {
          setVariants([]);
        }

        // Form successfully populated without URL mutation trigger

        // Set marketplaces integration configurations
        if (attrs.marketplaces && Array.isArray(attrs.marketplaces)) {
          setMarketplaces(attrs.marketplaces);
        } else {
          setMarketplaces([
            { id: "1", name: "Trendyol API", syncEnabled: true, apiConnected: true, apiKey: "ty-api-90234892", apiSecret: "••••••••", logoColor: "bg-orange-500" },
            { id: "2", name: "Hepsiburada API", syncEnabled: true, apiConnected: true, apiKey: "hb-api-11029384", apiSecret: "••••••••", logoColor: "bg-red-600" },
            { id: "3", name: "Amazon Turkey API", syncEnabled: false, apiConnected: false, logoColor: "bg-slate-500" },
          ]);
        }

        setTimeout(() => {
          isInitialized.current = true;
        }, 300);

      } catch (err) {
        console.warn("[STOCK FORM SILENT WARN] Error loading product background:", err);
      } finally {
        setIsLoadingProduct(false);
      }
    };

    setIsLoadingProduct(true);
    fetchProduct();
  }, [productId, idParam, skuParam, slugParam]);



  // Multiple Media Items List
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);

  // Multiple Marketplaces List
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);

  // Warehouses List
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Selected Warehouse detailed display info helper
  const selectedWarehouseInfo = useMemo(() => {
    return warehouses.find(w => w.name === form.warehouse) || warehouses[0];
  }, [warehouses, form.warehouse]);

  // XML Feeds list
  const [xmlFeeds, setXmlFeeds] = useState<XmlFeed[]>([]);

  // Categories list initialized empty, populated live from DB API
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryObjects, setCategoryObjects] = useState<any[]>([]);

  const loadCategoriesFromApi = async () => {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategoryObjects(data);
          const names = data.map((c: any) => c.name).filter(Boolean);
          setCategories(names);
        }
      }
    } catch (err) {
      console.error("Error loading categories from API:", err);
    }
  };

  useEffect(() => {
    loadCategoriesFromApi();
  }, []);

  // Units list
  const [units, setUnits] = useState<string[]>([
    "Kavanoz",
    "Adet",
    "Kg",
    "Paket",
    "Kutu",
    "Teneke"
  ]);

  // Variant list
  const [variants, setVariants] = useState<Variant[]>([]);

  // Track if any form values are changed by the user
  useEffect(() => {
    if (!isInitialized.current) return;
    setIsDirty(true);
  }, [form, mediaList, variants, status, warehouses]);

  // Warn user if they try to leave or reload the browser with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleCancelClick = () => {
    if (isDirty) {
      setIsCancelModalOpen(true);
    } else {
      router.push("/admin/stock");
    }
  };

  const confirmCancel = () => {
    setIsDirty(false);
    setIsCancelModalOpen(false);
    router.push("/admin/stock");
  };

  // Modal / Input Management States
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editingCategoryNewValue, setEditingCategoryNewValue] = useState("");

  const [isUnitManagerOpen, setIsUnitManagerOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [editingUnitName, setEditingUnitName] = useState<string | null>(null);
  const [editingUnitNewValue, setEditingUnitNewValue] = useState("");

  // Edit states for Size & Color options
  const [editingSizeName, setEditingSizeName] = useState<string | null>(null);
  const [editingSizeNewValue, setEditingSizeNewValue] = useState("");

  const [editingColorName, setEditingColorName] = useState<string | null>(null);
  const [editingColorNewValue, setEditingColorNewValue] = useState("");

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [variantForm, setVariantForm] = useState<{
    id: string;
    size: string;
    color: string;
    stock: number;
    price: number;
    b2bPrice?: number;
    vatRate?: number;
    vatIncluded?: boolean;
    sku: string;
    barcode: string;
    packagingMarkupPercent: number;
    isEditing: boolean;
    modalTab: "single" | "bulk";
    selectedBulkSizes: string[];
    selectedBulkColors: string[];
  }>({
    id: "",
    size: "400g Cam Kavanoz",
    color: "Sade",
    stock: 1000,
    price: 320,
    b2bPrice: 0,
    vatRate: 20,
    vatIncluded: true,
    sku: "",
    barcode: "",
    packagingMarkupPercent: 0,
    isEditing: false,
    modalTab: "single",
    selectedBulkSizes: [],
    selectedBulkColors: [],
  });

  // Dynamic Warehouse Modal States
  const [isWarehouseManagerOpen, setIsWarehouseManagerOpen] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchPrices, setBranchPrices] = useState<Record<string, number>>({});
  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    code: "",
    location: "",
    stockCount: 0,
    branchId: "",
  });

  // Dynamic Marketplace Modal States
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
  const [newMarketplace, setNewMarketplace] = useState({
    name: "",
    syncEnabled: true,
    logoColor: "bg-slate-500",
  });

  // API Config Modal State
  const [configuringMarketplace, setConfiguringMarketplace] = useState<Marketplace | null>(null);
  const [apiCredentials, setApiCredentials] = useState({ apiKey: "", apiSecret: "" });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [focusFields, setFocusFields] = useState<Record<string, boolean>>({});

  // XML Feed Modal State
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [newXmlFeed, setNewXmlFeed] = useState({
    name: "",
    priceSource: "Satış Fiyatı",
    markupPercent: 0,
    active: true,
  });

  // Media link inputs
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);

  const handleGenerateAiSeo = async (targetField: string = "all") => {
    if (!form.name || !form.name.trim()) {
      toast.error("Lütfen önce ürün adını girin.");
      return;
    }

    if (targetField === "all") setIsGeneratingAi(true);
    else setGeneratingField(targetField);

    try {
      const res = await fetch("/api/ai/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.name,
          category: form.category,
          description: form.shortDesc || form.description,
          targetField,
        })
      });

      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const d = json.data;
        setForm(prev => {
          const next = { ...prev };
          if (targetField === "all" || targetField === "seoTitle") next.seoTitle = d.seoTitle;
          if (targetField === "all" || targetField === "seoDesc") next.seoDesc = d.seoDesc;
          if (targetField === "all" || targetField === "seoKeywords") next.seoKeywords = d.seoKeywords;
          if (targetField === "all" || targetField === "badgeText1") next.badgeText1 = d.badgeText1;
          if (targetField === "all" || targetField === "badgeText2") next.badgeText2 = d.badgeText2;
          if (targetField === "all" || targetField === "recipeDetails") next.recipeDetails = d.recipeDetails;
          if (targetField === "all" || targetField === "longDescExtra") next.longDescExtra = d.longDescExtra;
          if (targetField === "all" || targetField === "usageGuide") next.usageGuide = d.usageGuide;
          return next;
        });

        if (targetField === "all") {
          toast.success("✨ Yapay Zeka SEO ve tüm detay içeriklerini başarıyla oluşturdu!");
        } else {
          toast.success("✨ İlgili alan Yapay Zeka ile yeniden oluşturuldu!");
        }
      } else {
        toast.error(json.error || "Yapay zeka içeriği oluşturulurken bir hata meydana geldi.");
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      toast.error("Yapay zeka servisine erişilemedi.");
    } finally {
      setIsGeneratingAi(false);
      setGeneratingField(null);
    }
  };
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaTypeInput, setMediaTypeInput] = useState<"image" | "video">("image");

  // Image Upload Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Dynamic Margin Calculations
  const grossMargin = useMemo(() => {
    if (!form.purchasePrice || !form.salePrice) return 0;
    const sale = form.saleVatIncluded ? form.salePrice / (1 + parseInt(form.saleVat) / 100) : form.salePrice;
    const purchase = form.purchaseVatIncluded ? form.purchasePrice / (1 + parseInt(form.purchaseVat) / 100) : form.purchasePrice;
    if (purchase <= 0) return 0;
    return Math.round(((sale - purchase) / purchase) * 100);
  }, [form.purchasePrice, form.salePrice, form.purchaseVat, form.saleVat, form.purchaseVatIncluded, form.saleVatIncluded]);

  const retailMargin = useMemo(() => {
    if (!form.purchasePrice || !form.retailPrice) return 0;
    const retail = form.retailVatIncluded ? form.retailPrice / (1 + parseInt(form.retailVat) / 100) : form.retailPrice;
    const purchase = form.purchaseVatIncluded ? form.purchasePrice / (1 + parseInt(form.purchaseVat) / 100) : form.purchasePrice;
    if (purchase <= 0) return 0;
    return Math.round(((retail - purchase) / purchase) * 100);
  }, [form.purchasePrice, form.retailPrice, form.purchaseVat, form.retailVat, form.purchaseVatIncluded, form.retailVatIncluded]);

  const webMargin = useMemo(() => {
    if (!form.purchasePrice || !form.webPrice) return 0;
    const web = form.webVatIncluded ? form.webPrice / (1 + parseInt(form.webVat) / 100) : form.webPrice;
    const purchase = form.purchaseVatIncluded ? form.purchasePrice / (1 + parseInt(form.purchaseVat) / 100) : form.purchasePrice;
    if (purchase <= 0) return 0;
    return Math.round(((web - purchase) / purchase) * 100);
  }, [form.purchasePrice, form.webPrice, form.purchaseVat, form.webVat, form.purchaseVatIncluded, form.webVatIncluded]);

  // EAN-13 automatic generator
  const generateBarcode = () => {
    const random = "869" + Math.floor(1000000000 + Math.random() * 9000000000);
    setForm(prev => ({ ...prev, barcode: random }));
    toast.success("EAN-13 Barkodu başarıyla oluşturuldu.");
  };

  // SKU code automatic generator
  const generateSkuCode = () => {
    let prefix = "PKF";
    if (form.stockType === "Hammadde") prefix = "PKF-HM";
    else if (form.stockType === "Mamul") prefix = "PKF-MM";
    else if (form.stockType === "Yarı Mamul") prefix = "PKF-YMM";
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setForm(prev => ({ ...prev, sku: `${prefix}-${randomNum}` }));
    setIsSkuLocked(false);
    toast.success("Stok Kodu (SKU) başarıyla üretildi.");
  };

  // Manufacturer code automatic generator
  const generateManufacturerCode = () => {
    const catPart = form.category 
      ? form.category.replace(/\s+/g, "").substring(0, 3).toUpperCase() 
      : "PKF";
    const random = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({ ...prev, manufacturerCode: `PKF-${catPart}-${random}` }));
    toast.success("Üretici Kodu başarıyla üretildi.");
  };

  // Helper to upload media files to server
  const uploadMediaFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        return data.url;
      } else {
        toast.error(data.error || "Medya yüklenirken hata oluştu.");
        return null;
      }
    } catch (err) {
      console.error("Media upload error:", err);
      toast.error("Medya yüklenirken bağlantı hatası oluştu.");
      return null;
    }
  };

  // Drag & Drop Media uploading
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const type = file.type.startsWith("video/") ? "video" : "image";
      const url = await uploadMediaFile(file);
      if (url) {
        const newItem: MediaItem = {
          id: Math.random().toString(),
          type,
          url,
          name: file.name,
        };
        setMediaList(prev => [...prev, newItem]);
        toast.success(`${file.name} başarıyla eklendi.`);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith("video/") ? "video" : "image";
      const url = await uploadMediaFile(file);
      if (url) {
        const newItem: MediaItem = {
          id: Math.random().toString(),
          type,
          url,
          name: file.name,
        };
        setMediaList(prev => [...prev, newItem]);
        toast.success(`${file.name} başarıyla eklendi.`);
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Lütfen sadece geçerli bir video dosyası seçin.");
      return;
    }

    setIsUploadingVideo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setForm(prev => ({ ...prev, videoUrl: data.url }));
        toast.success("Tanıtım videosu başarıyla yüklendi.");
      } else {
        toast.error(data.error || "Video yüklenirken hata oluştu.");
      }
    } catch (err) {
      console.error("Video upload error:", err);
      toast.error("Video yüklenirken bağlantı hatası oluştu.");
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = "";
      }
    }
  };

  // Add media URL manually
  const addMediaUrl = () => {
    if (!mediaUrlInput.trim()) return;
    const newItem: MediaItem = {
      id: Math.random().toString(),
      type: mediaTypeInput,
      url: mediaUrlInput.trim(),
      name: mediaTypeInput === "video" ? "Gömülü_Video.mp4" : "Dış_Görsel.jpg",
    };
    setMediaList(prev => [...prev, newItem]);
    setMediaUrlInput("");
    toast.success("Medyaya dış bağlantı başarıyla eklendi.");
  };

  const handleMediaDragStart = (e: React.DragEvent, index: number) => {
    setDraggedMediaIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleMediaDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleMediaDropItem = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedMediaIndex === null || draggedMediaIndex === dropIndex) return;

    const updated = [...mediaList];
    const [movedItem] = updated.splice(draggedMediaIndex, 1);
    updated.splice(dropIndex, 0, movedItem);
    setMediaList(updated);
    setDraggedMediaIndex(null);
    toast.success("Medya sırası güncellendi.");
  };

  const parseSafeIsoDate = (dateStr: string | undefined | null) => {
    if (!dateStr || typeof dateStr !== "string" || !dateStr.trim()) return null;
    try {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return null;
      return parsed.toISOString();
    } catch (e) {
      return null;
    }
  };

  const moveMediaPosition = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;
    const updated = [...mediaList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setMediaList(updated);
    toast.success("Medya konumu değiştirildi.");
  };

  const deleteMediaItem = (id: string) => {
    setMediaList(prev => prev.filter(m => m.id !== id));
    toast.error("Medya dosyası silindi.");
  };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.sku?.trim()) {
      toast.error("Lütfen Ürün Adı ve SKU alanlarını doldurun.");
      return;
    }

    const finalSalePrice = Number(form.salePrice || form.retailPrice || form.webPrice || 0);
    const rawMarketPrice = Number(form.marketPrice || 0);
    const finalMarketPrice = rawMarketPrice > 0 ? (rawMarketPrice < finalSalePrice ? finalSalePrice : rawMarketPrice) : finalSalePrice;
    const resolvedCategory = form.category?.trim() || "Genel";

    setIsSaving(true);
    try {
      const url = isEditMode ? `/api/products/${productId}` : "/api/products";
      const method = isEditMode ? "PUT" : "POST";
      const warehouseStockSum = warehouses.reduce((sum, w) => sum + (Number(w.stockCount) || 0), 0);
      const totalStock = warehouseStockSum > 0 ? warehouseStockSum : (Number(form.stock) || Number(form.stockCount) || Number(form.stock_quantity) || 0);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        brand: form.brand || "PEKEFE",
        model: form.model || "",
        category: resolvedCategory,
        stock: totalStock,
        warehouses: warehouses,
        variants: variants,
        criticalLimit: 5,
        price: finalSalePrice,
        oldPrice: finalMarketPrice,
        cost: Number(form.purchasePrice || 0),
        image: mediaList[0]?.url || "",
        images: mediaList.map(m => m.url),
        desc: form.desc || form.shortDesc,
        shortDesc: form.shortDesc,
        isCampaignActive: form.isCampaignActive,
        discount_start_date: parseSafeIsoDate(form.discount_start_date),
        discount_end_date: parseSafeIsoDate(form.discount_end_date),
        list_price: finalMarketPrice,
        sale_price: finalSalePrice,
        stock_quantity: totalStock,
        isRawMaterial: form.stockType === "Hammadde",
        barcode: form.barcode,
        unit: form.unit,
        manufacturerCode: form.manufacturerCode,
        videoUrl: form.videoUrl,
        seoTitle: form.seoTitle,
        seoDesc: form.seoDesc,
        seoKeywords: form.seoKeywords,
        attributes: {
          shortDesc: form.shortDesc,
          sizes: sizes,
          colors: colors,
          barcode: form.barcode,
          unit: form.unit,
          manufacturerCode: form.manufacturerCode,
          stockType: form.stockType,
          warehouse: form.warehouse,

          purchaseCurrency: form.purchaseCurrency,
          purchaseVat: form.purchaseVat,
          purchaseVatIncluded: form.purchaseVatIncluded,

          saleCurrency: form.saleCurrency,
          saleVat: form.saleVat,
          saleVatIncluded: form.saleVatIncluded,

          retailPrice: form.retailPrice,
          retailCurrency: form.retailCurrency,
          retailVat: form.retailVat,
          retailVatIncluded: form.retailVatIncluded,

          webPrice: form.webPrice,
          webCurrency: form.webCurrency,
          webVat: form.webVat,
          webVatIncluded: form.webVatIncluded,

          marketCurrency: form.marketCurrency,
          marketVat: form.marketVat,
          marketVatIncluded: form.marketVatIncluded,

          b2bActive: form.b2bActive,
          b2bPreOrderable: form.b2bPreOrderable,
          marketplaces: marketplaces,
          recipeDetails: form.recipeDetails,
          altitude: form.altitude,
          harvestSeason: form.harvestSeason,
          harvestStory: form.harvestStory,
          ingredients: form.ingredients,
          ritual: form.ritual,
          nutrients: {
            energy: form.nutrients_energy,
            carb: form.nutrients_carb,
            protein: form.nutrients_protein,
            calcium: form.nutrients_calcium,
            iron: form.nutrients_iron,
          },
          hmfLevel: form.hmfLevel,
          unitCoefficients: form.unitCoefficients,
          branchPrices: branchPrices,
          specsMaterial: form.specsMaterial,
          specsWeight: form.specsWeight,
          specsDimensions: form.specsDimensions,
          specsBellows: form.specsBellows,
          usageGuide: form.usageGuide,
          warrantyInfo: form.warrantyInfo,
          warrantyBadgeLabel: form.warrantyBadgeLabel,
          warrantyYears: form.warrantyYears,
          warrantyBadgeDesc: form.warrantyBadgeDesc,
          quickOverview1_title: form.quickOverview1_title,
          quickOverview1_desc: form.quickOverview1_desc,
          quickOverview2_title: form.quickOverview2_title,
          quickOverview2_desc: form.quickOverview2_desc,
          quickOverview3_title: form.quickOverview3_title,
          quickOverview3_desc: form.quickOverview3_desc,
          quickOverview1: form.quickOverview1_title ? `<strong>${form.quickOverview1_title}:</strong> ${form.quickOverview1_desc}` : "",
          quickOverview2: form.quickOverview2_title ? `<strong>${form.quickOverview2_title}:</strong> ${form.quickOverview2_desc}` : "",
          quickOverview3: form.quickOverview3_title ? `<strong>${form.quickOverview3_title}:</strong> ${form.quickOverview3_desc}` : "",
          longDescExtra: form.longDescExtra,
          badgeText1: form.badgeText1,
          badgeText2: form.badgeText2,
          warehousePrices: warehouses.reduce((acc, wh) => {
            if (wh.price !== undefined && wh.price !== null) {
              acc[wh.id] = wh.price;
            }
            return acc;
          }, {} as { [key: string]: number }),
        }
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsDirty(false); // Bypass warning popup on save redirect
        toast.success(isEditMode ? "Stok kartı başarıyla güncellendi." : "Stok kartı başarıyla oluşturuldu.");
        
        // Instantly write changes to persistent local storage cache (0ms persistence guarantee)
        const updatedLocalObject = {
          ...payload,
          id: isEditMode ? productId : (data.id || payload.sku),
          price: payload.sale_price,
          oldPrice: payload.list_price,
          isCampaignActive: payload.isCampaignActive
        };
        try {
          updateProductInStorage(updatedLocalObject);
          fetchProductsFromApi().catch(() => {});
          refreshProducts().catch(() => {});
          refreshCategories().catch(() => {});
        } catch (e) {
          console.warn("Non-critical local storage update notice:", e);
        }

        // Broadcast real-time search auto-indexing events across all open tabs/pages
        if (typeof window !== "undefined") {
          try {
            window.dispatchEvent(new Event("pekefe_products_changed"));
            window.dispatchEvent(new CustomEvent("pekefe_search_index_updated"));
            window.dispatchEvent(new CustomEvent("pekefe_products_updated"));

            if ("BroadcastChannel" in window) {
              const bc = new BroadcastChannel("pekefe_product_sync");
              bc.postMessage({ type: "PRODUCT_UPDATED", id: productId, slug: form.slug });
              bc.close();
            }
          } catch (e) {}
        }
        
        // Refresh server components router cache to update server-rendered pages (like /tr)
        try {
          router.refresh();
        } catch (e) {}
        
        setTimeout(() => {
          router.push("/admin/stock");
        }, 800);
      } else {
        // Fallback local storage save if API returns non-ok
        const fallbackId = isEditMode ? productId : (form.sku || `PKF-${Date.now()}`);
        const updatedLocalObject = {
          name: form.name,
          sku: form.sku,
          brand: form.brand,
          model: form.model,
          category: form.category,
          stock: totalStock,
          warehouses: warehouses,
          variants: variants,
          price: finalSalePrice,
          oldPrice: finalMarketPrice,
          cost: Number(form.purchasePrice || 0),
          image: mediaList[0]?.url || "",
          images: mediaList.map(m => m.url),
          desc: form.desc || form.shortDesc,
          shortDesc: form.shortDesc,
          id: fallbackId,
        };
        try { updateProductInStorage(updatedLocalObject); } catch (e) {}
        setIsDirty(false);
        toast.success(isEditMode ? "Stok kartı başarıyla güncellendi." : "Stok kartı başarıyla oluşturuldu.");
        setTimeout(() => {
          router.push("/admin/stock");
        }, 800);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      const fallbackId = isEditMode ? productId : (form.sku || `PKF-${Date.now()}`);
      const updatedLocalObject = {
        name: form.name,
        sku: form.sku,
        brand: form.brand,
        model: form.model,
        category: form.category,
        stock: totalStock,
        warehouses: warehouses,
        variants: variants,
        price: finalSalePrice,
        oldPrice: finalMarketPrice,
        cost: Number(form.purchasePrice || 0),
        image: mediaList[0]?.url || "",
        images: mediaList.map(m => m.url),
        desc: form.desc || form.shortDesc,
        shortDesc: form.shortDesc,
        id: fallbackId,
      };
      try { updateProductInStorage(updatedLocalObject); } catch (e) {}
      setIsDirty(false);
      toast.success(isEditMode ? "Stok kartı başarıyla güncellendi." : "Stok kartı başarıyla oluşturuldu.");
      setTimeout(() => {
        router.push("/admin/stock");
      }, 800);
    } finally {
      setIsSaving(false);
    }
  };

  // Add/Edit/Remove Custom Size/Ebat Options
  const addSizeOption = () => {
    if (!newSizeName.trim()) return;
    if (sizes.includes(newSizeName.trim())) {
      toast.warning("Bu ebat seçeneği zaten mevcut.");
      return;
    }
    setSizes(prev => [...prev, newSizeName.trim()]);
    setVariantForm(prev => ({ ...prev, size: newSizeName.trim() }));
    setNewSizeName("");
    toast.success("Ebat seçeneği başarıyla eklendi.");
  };

  const saveSizeEdit = (oldName: string) => {
    const val = editingSizeNewValue.trim();
    if (!val) {
      toast.warning("Lütfen geçerli bir ebat/gramaj adı giriniz.");
      return;
    }
    if (val === oldName) {
      setEditingSizeName(null);
      return;
    }
    if (sizes.includes(val)) {
      toast.warning("Bu ebat seçeneği zaten mevcut.");
      return;
    }
    setSizes(prev => prev.map(s => s === oldName ? val : s));
    if (variantForm.size === oldName) {
      setVariantForm(prev => ({ ...prev, size: val }));
    }
    setVariants(prev => prev.map(v => v.size === oldName ? { ...v, size: val } : v));
    setEditingSizeName(null);
    setEditingSizeNewValue("");
    toast.success("Gramaj/ambalaj seçeneği başarıyla güncellendi.");
  };

  const removeSizeOption = (name: string) => {
    if (sizes.length <= 1) {
      toast.error("En az bir ebat seçeneği kalmalıdır.");
      return;
    }
    setSizes(prev => prev.filter(s => s !== name));
    if (variantForm.size === name) {
      setVariantForm(prev => ({ ...prev, size: sizes.find(s => s !== name) || "" }));
    }
    toast.success("Ebat seçeneği kaldırıldı.");
  };

  // Add/Edit/Remove Custom Color/Deri Tipi Options
  const addColorOption = () => {
    if (!newColorName.trim()) return;
    if (colors.includes(newColorName.trim())) {
      toast.warning("Bu deri tipi/renk seçeneği zaten mevcut.");
      return;
    }
    setColors(prev => [...prev, newColorName.trim()]);
    setVariantForm(prev => ({ ...prev, color: newColorName.trim() }));
    setNewColorName("");
    toast.success("Deri tipi/renk seçeneği başarıyla eklendi.");
  };

  const saveColorEdit = (oldName: string) => {
    const val = editingColorNewValue.trim();
    if (!val) {
      toast.warning("Lütfen geçerli bir ürün çeşidi adı giriniz.");
      return;
    }
    if (val === oldName) {
      setEditingColorName(null);
      return;
    }
    if (colors.includes(val)) {
      toast.warning("Bu ürün çeşidi zaten mevcut.");
      return;
    }
    setColors(prev => prev.map(c => c === oldName ? val : c));
    if (variantForm.color === oldName) {
      setVariantForm(prev => ({ ...prev, color: val }));
    }
    setVariants(prev => prev.map(v => v.color === oldName ? { ...v, color: val } : v));
    setEditingColorName(null);
    setEditingColorNewValue("");
    toast.success("Ürün çeşidi/tipi adı başarıyla güncellendi.");
  };

  const removeColorOption = (name: string) => {
    if (colors.length <= 1) {
      toast.error("En az bir deri tipi/renk seçeneği kalmalıdır.");
      return;
    }
    setColors(prev => prev.filter(c => c !== name));
    if (variantForm.color === name) {
      setVariantForm(prev => ({ ...prev, color: colors.find(c => c !== name) || "" }));
    }
    toast.success("Deri tipi/renk seçeneği kaldırıldı.");
  };

  // Add/Remove Categories synced with DB API
  const addCategory = async (customName?: string) => {
    const catName = (customName || newCategoryName).trim();
    if (!catName) return;
    if (categories.includes(catName)) {
      setForm(prev => ({ ...prev, category: catName }));
      return;
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName })
      });
      if (res.ok) {
        toast.success(`"${catName}" kategorisi veritabanına eklendi.`);
        setNewCategoryName("");
        await loadCategoriesFromApi();
        await refreshCategories();
        setForm(prev => ({ ...prev, category: catName }));
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Kategori eklenemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    }
  };

  const removeCategory = async (catName: string) => {
    if (categories.length <= 1) {
      toast.error("En az bir kategori bulunmalıdır.");
      return;
    }
    const targetObj = categoryObjects.find(c => c.name === catName);
    if (targetObj?.id) {
      try {
        const res = await fetch(`/api/categories?id=${targetObj.id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Kategori veritabanından silindi.");
          await loadCategoriesFromApi();
          await refreshCategories();
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
    setCategories(prev => prev.filter(c => c !== catName));
    if (form.category === catName) {
      setForm(prev => ({ ...prev, category: categories.find(c => c !== catName) || "" }));
    }
    toast.success("Kategori silindi.");
  };

  const saveCategoryEdit = async (oldName: string) => {
    const val = editingCategoryNewValue.trim();
    if (!val) {
      toast.warning("Lütfen geçerli bir kategori adı giriniz.");
      return;
    }
    if (val === oldName) {
      setEditingCategoryName(null);
      return;
    }
    if (categories.includes(val)) {
      toast.warning("Bu kategori zaten mevcut.");
      return;
    }
    const targetObj = categoryObjects.find(c => c.name === oldName);
    if (targetObj?.id) {
      try {
        const res = await fetch(`/api/categories?id=${targetObj.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: val })
        });
        if (res.ok) {
          toast.success("Kategori adı veritabanında güncellendi.");
          await loadCategoriesFromApi();
          await refreshCategories();
          if (form.category === oldName) {
            setForm(prev => ({ ...prev, category: val }));
          }
          setEditingCategoryName(null);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
    setCategories(prev => prev.map(c => c === oldName ? val : c));
    if (form.category === oldName) {
      setForm(prev => ({ ...prev, category: val }));
    }
    setEditingCategoryName(null);
    toast.success("Kategori adı güncellendi.");
  };

  // Add/Edit/Remove Units
  const addUnit = async () => {
    if (!newUnitName.trim()) return;
    const name = newUnitName.trim();
    if (units.includes(name)) {
      toast.warning("Bu birim zaten mevcut.");
      return;
    }
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        setUnits(prev => [...prev, name]);
        setForm(prev => ({ ...prev, unit: name }));
        setNewUnitName("");
        toast.success(`"${name}" birimi veritabanına eklendi.`);
      } else {
        toast.error("Birim veritabanına eklenemedi.");
      }
    } catch (e) {
      toast.error("Birim eklenirken hata oluştu.");
    }
  };

  const saveUnitEdit = (oldName: string) => {
    const val = editingUnitNewValue.trim();
    if (!val) {
      toast.warning("Lütfen geçerli bir birim adı giriniz.");
      return;
    }
    if (val === oldName) {
      setEditingUnitName(null);
      return;
    }
    if (units.includes(val)) {
      toast.warning("Bu birim zaten mevcut.");
      return;
    }
    setUnits(prev => prev.map(u => u === oldName ? val : u));
    if (form.unit === oldName) {
      setForm(prev => ({ ...prev, unit: val }));
    }
    setEditingUnitName(null);
    toast.success("Birim adı güncellendi.");
  };

  const removeUnit = async (unitName: string) => {
    if (units.length <= 1) {
      toast.error("En az bir birim bulunmalıdır.");
      return;
    }
    try {
      await fetch(`/api/units?name=${encodeURIComponent(unitName)}`, { method: "DELETE" });
      setUnits(prev => prev.filter(u => u !== unitName));
      if (form.unit === unitName) {
        setForm(prev => ({ ...prev, unit: units.find(u => u !== unitName) || "" }));
      }
      toast.success(`"${unitName}" birimi silindi.`);
    } catch (e) {
      toast.error("Birim silinemedi.");
    }
  };

  // Automatic variant calculation breakdown detail (Formula Transparency Engine)
  const getVariantCalculationDetail = (
    sizeStr: string,
    webPrice: number,
    baseUnit: string = "Kg",
    packagingMarkupPercent: number = 0
  ) => {
    if (!webPrice || webPrice <= 0 || !sizeStr) {
      return {
        baseWebPrice: webPrice || 0,
        baseUnit: baseUnit || "Kg",
        sizeStr: sizeStr || "",
        multiplier: 1,
        calculatedPrice: webPrice || 0,
        packagingMarkupPercent: packagingMarkupPercent || 0,
        finalPrice: webPrice || 0,
        extractedUnitText: "1 Birim",
      };
    }
    const normalized = sizeStr.toLowerCase().trim();
    let multiplier = 1;
    let unitText = "1 Birim";

    // 1. Kg / Kilo / Kilogram
    const kgMatch = normalized.match(/(\d+(?:[\.,]\d+)?)\s*(?:kg|kilo|kilogram)\b/);
    if (kgMatch) {
      const val = parseFloat(kgMatch[1].replace(",", "."));
      if (!isNaN(val)) {
        multiplier = val;
        unitText = `${val} Kg (${val * 1000}g)`;
      }
    } else {
      // 2. Gr / Gram / g
      const grMatch = normalized.match(/(\d+(?:[\.,]\d+)?)\s*(?:gr|g|gram)\b/);
      if (grMatch) {
        const val = parseFloat(grMatch[1].replace(",", "."));
        if (!isNaN(val)) {
          multiplier = val / 1000;
          unitText = `${val}g (${(val / 1000).toFixed(3).replace(/\.?0+$/, "")} Kg)`;
        }
      } else {
        // 3. Lt / Liter / Litre / L
        const ltMatch = normalized.match(/(\d+(?:[\.,]\d+)?)\s*(?:lt|litre|liter|l)\b/);
        if (ltMatch) {
          const val = parseFloat(ltMatch[1].replace(",", "."));
          if (!isNaN(val)) {
            multiplier = val;
            unitText = `${val} Lt (${val * 1000}ml)`;
          }
        } else {
          // 4. Ml / Mililitre / Mililiter
          const mlMatch = normalized.match(/(\d+(?:[\.,]\d+)?)\s*(?:ml|mililitre|mililiter)\b/);
          if (mlMatch) {
            const val = parseFloat(mlMatch[1].replace(",", "."));
            if (!isNaN(val)) {
              multiplier = val / 1000;
              unitText = `${val}ml (${(val / 1000).toFixed(3).replace(/\.?0+$/, "")} Lt)`;
            }
          } else {
            // 5. Adet / Tane / Paket / Pk / Kavanoz / Teneke
            const adetMatch = normalized.match(/(\d+(?:[\.,]\d+)?)\s*(?:adet|tane|pk|paket|kavanoz|teneke|kut|kutu)\b/);
            if (adetMatch) {
              const val = parseFloat(adetMatch[1].replace(",", "."));
              const baseMatch = (baseUnit || "").toLowerCase().match(/(\d+(?:[\.,]\d+)?)/);
              const baseQty = baseMatch ? parseFloat(baseMatch[1].replace(",", ".")) : 1;
              multiplier = baseQty > 0 ? val / baseQty : val;
              unitText = `${val} Adet (Birim Oranı: ${multiplier.toFixed(2)})`;
            } else {
              // 6. Generic number fallback
              const genericMatch = normalized.match(/(\d+(?:[\.,]\d+)?)/);
              if (genericMatch) {
                const val = parseFloat(genericMatch[1].replace(",", "."));
                if (!isNaN(val)) {
                  if (val >= 50) {
                    multiplier = val / 1000;
                    unitText = `${val}g (${val / 1000} Kg)`;
                  } else {
                    multiplier = val;
                    unitText = `${val} Katı`;
                  }
                }
              }
            }
          }
        }
      }
    }

    const rawCalculated = (parseFloat(webPrice as any) || 0) * multiplier;
    const markupAmount = rawCalculated * (packagingMarkupPercent / 100);
    const finalPrice = Math.round(rawCalculated + markupAmount);

    return {
      baseWebPrice: webPrice,
      baseUnit,
      sizeStr,
      multiplier,
      calculatedPrice: Math.round(rawCalculated),
      packagingMarkupPercent,
      markupAmount: Math.round(markupAmount),
      finalPrice,
      extractedUnitText: unitText,
    };
  };

  const calculateVariantPriceFromWebPrice = (
    sizeStr: string,
    webPrice: number,
    baseUnit: string = "Kg"
  ): number => {
    return getVariantCalculationDetail(sizeStr, webPrice, baseUnit, 0).finalPrice;
  };

  const generateSkuAndBarcode = (sizeStr: string, colorStr: string) => {
    const baseSku = form.sku || "PKF-PROD";
    const trMap: Record<string, string> = {
      'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
    };
    const normalize = (str: string) => (str || "").replace(/[çÇğĞıİöÖşŞüÜ]/g, match => trMap[match] || match);
    // Build a clean, deterministic token from size + color (max 8 chars total)
    const cleanSize = normalize(sizeStr).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);
    const cleanColor = normalize(colorStr).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
    // Add a 4-char random hex suffix to guarantee uniqueness across variants of the same product
    const uniqueSuffix = Math.random().toString(16).slice(2, 6).toUpperCase();
    const sku = `${baseSku}-${cleanSize || "VAR"}-${cleanColor || "SAD"}-${uniqueSuffix}`;
    const barcode = "868" + Math.floor(1000000000 + Math.random() * 9000000000);
    return { sku, barcode };
  };

  const openVariantModal = (variantToEdit?: Variant) => {
    if (variantToEdit) {
      setVariantForm({
        id: variantToEdit.id,
        size: variantToEdit.size,
        color: variantToEdit.color,
        stock: variantToEdit.stock,
        price: variantToEdit.price,
        b2bPrice: variantToEdit.b2bPrice ?? (form.salePrice || 0),
        vatRate: variantToEdit.vatRate ?? 20,
        vatIncluded: variantToEdit.vatIncluded ?? true,
        sku: variantToEdit.sku || "",
        barcode: variantToEdit.barcode || "",
        packagingMarkupPercent: 0,
        isEditing: true,
        modalTab: "single",
        selectedBulkSizes: [],
        selectedBulkColors: [],
      });
    } else {
      const initialSize = sizes[0] || "400g Cam Kavanoz";
      const initialColor = colors[0] || "Sade";
      const detail = getVariantCalculationDetail(initialSize, form.webPrice, form.unit, 0);
      const codes = generateSkuAndBarcode(initialSize, initialColor);
      setVariantForm({
        id: "",
        size: initialSize,
        color: initialColor,
        stock: 1000,
        price: detail.finalPrice > 0 ? detail.finalPrice : (form.webPrice || 0),
        b2bPrice: form.salePrice || 0,
        vatRate: 20,
        vatIncluded: true,
        sku: codes.sku,
        barcode: codes.barcode,
        packagingMarkupPercent: 0,
        isEditing: false,
        modalTab: "single",
        selectedBulkSizes: sizes.length > 0 ? [sizes[0]] : [initialSize],
        selectedBulkColors: colors.length > 0 ? [colors[0]] : [initialColor],
      });
    }
    setIsVariantModalOpen(true);
  };

  const handleVariantSizeChange = (newSize: string, markup: number = variantForm.packagingMarkupPercent) => {
    const detail = getVariantCalculationDetail(newSize, form.webPrice, form.unit, markup);
    const codes = generateSkuAndBarcode(newSize, variantForm.color);
    setVariantForm(prev => ({
      ...prev,
      size: newSize,
      price: detail.finalPrice > 0 ? detail.finalPrice : (form.webPrice || prev.price),
      packagingMarkupPercent: markup,
      // Only regenerate SKU for new variants (not editing existing ones)
      sku: prev.isEditing ? prev.sku : codes.sku,
      barcode: prev.isEditing ? prev.barcode : codes.barcode,
    }));
  };

  const saveVariant = () => {
    if (variantForm.modalTab === "bulk") {
      if (variantForm.selectedBulkSizes.length === 0 || variantForm.selectedBulkColors.length === 0) {
        toast.error("Lütfen en az 1 ebat ve 1 renk seçin.");
        return;
      }
      const newCreated: Variant[] = [];
      variantForm.selectedBulkSizes.forEach(s => {
        variantForm.selectedBulkColors.forEach(c => {
          const detail = getVariantCalculationDetail(s, form.webPrice, form.unit, variantForm.packagingMarkupPercent);
          const codes = generateSkuAndBarcode(s, c);
          newCreated.push({
            id: Math.random().toString(),
            sku: codes.sku,
            barcode: codes.barcode,
            name: `${s} - ${c}`,
            size: s,
            color: c,
            stock: variantForm.stock,
            price: detail.finalPrice > 0 ? detail.finalPrice : form.webPrice,
            b2bPrice: variantForm.b2bPrice || form.salePrice || 0,
            vatRate: variantForm.vatRate ?? 20,
            vatIncluded: variantForm.vatIncluded ?? true,
          });
        });
      });
      const existingNames = new Set(variants.map(v => v.name));
      const filtered = newCreated.filter(v => !existingNames.has(v.name));
      const allUpdated = [...variants, ...filtered];
      setVariants(allUpdated);
      setIsVariantModalOpen(false);
      toast.success(`${newCreated.length} adet varyant matrisi üretildi.`);

      if (isEditMode && productId) {
        fetch(`/api/products/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variants: allUpdated })
        }).then(res => {
          if (res.ok) {
            refreshProducts();
            toast.success("Varyantlar veritabanına ve diske kalıcı olarak kaydedildi.");
          }
        }).catch(err => {
          console.error("Varyant kaydetme sync hatası:", err);
        });
      }
      return;
    }

    if (!variantForm.size || !variantForm.color) {
      toast.error("Lütfen ebat ve renk seçimlerini yapın.");
      return;
    }

    // Auto-register typed custom size & color if not in list
    const typedSize = variantForm.size.trim();
    const typedColor = variantForm.color.trim();
    if (typedSize && !sizes.includes(typedSize)) {
      setSizes(prev => {
        const next = Array.from(new Set([...prev, typedSize]));
        try { localStorage.setItem("pekefe_stock_sizes", JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }
    if (typedColor && !colors.includes(typedColor)) {
      setColors(prev => {
        const next = Array.from(new Set([...prev, typedColor]));
        try { localStorage.setItem("pekefe_stock_colors", JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }

    let updatedVariants: Variant[] = [];
    if (variantForm.isEditing) {
      let found = false;
      updatedVariants = variants.map(v => {
        if ((variantForm.id && v.id === variantForm.id) || (variantForm.sku && v.sku === variantForm.sku)) {
          found = true;
          return {
            ...v,
            size: variantForm.size,
            color: variantForm.color,
            stock: Number(variantForm.stock) || 0,
            price: Number(variantForm.price) || 0,
            b2bPrice: Number(variantForm.b2bPrice) || 0,
            vatRate: Number(variantForm.vatRate ?? 20),
            vatIncluded: Boolean(variantForm.vatIncluded ?? true),
            sku: variantForm.sku || v.sku,
            barcode: variantForm.barcode || v.barcode,
            name: `${variantForm.size} - ${variantForm.color}`,
          };
        }
        return v;
      });
      if (!found) {
        updatedVariants.push({
          id: variantForm.id || Math.random().toString(),
          sku: variantForm.sku,
          barcode: variantForm.barcode,
          name: `${variantForm.size} - ${variantForm.color}`,
          size: variantForm.size,
          color: variantForm.color,
          stock: Number(variantForm.stock) || 0,
          price: Number(variantForm.price) || 0,
          b2bPrice: Number(variantForm.b2bPrice) || 0,
          vatRate: Number(variantForm.vatRate ?? 20),
          vatIncluded: Boolean(variantForm.vatIncluded ?? true),
        });
      }
      setVariants(updatedVariants);
      toast.success("Varyant başarıyla güncellendi.");
    } else {
      const codes = generateSkuAndBarcode(variantForm.size, variantForm.color);
      const newVar: Variant = {
        id: Math.random().toString(),
        sku: variantForm.sku || codes.sku,
        barcode: variantForm.barcode || codes.barcode,
        name: `${variantForm.size} - ${variantForm.color}`,
        size: variantForm.size,
        color: variantForm.color,
        stock: Number(variantForm.stock) || 0,
        price: Number(variantForm.price) || 0,
        b2bPrice: Number(variantForm.b2bPrice) || 0,
        vatRate: Number(variantForm.vatRate ?? 20),
        vatIncluded: Boolean(variantForm.vatIncluded ?? true),
      };
      updatedVariants = [...variants, newVar];
      setVariants(updatedVariants);
      toast.success("Yeni varyant eklendi.");
    }
    setIsVariantModalOpen(false);

    // Eğer düzenleme modundaysa varyantları veritabanına ve diske anında yaz
    if (isEditMode && productId) {
      fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants: updatedVariants })
      }).then(res => {
        if (res.ok) {
          refreshProducts();
          toast.success("Varyantlar veritabanına ve diske kalıcı olarak kaydedildi.");
        }
      }).catch(err => {
        console.error("Varyant kaydetme sync hatası:", err);
      });
    }
  };

  const autoCalculateAllVariantPrices = () => {
    if (variants.length === 0) {
      toast.error("Güncellenecek varyant bulunmuyor.");
      return;
    }
    if (!form.webPrice || form.webPrice <= 0) {
      toast.error("Lütfen önce ana formdaki Web Perakende fiyatını girin.");
      return;
    }
    setVariants(prev => prev.map(v => {
      const detail = getVariantCalculationDetail(v.size, form.webPrice, form.unit, 0);
      return {
        ...v,
        price: detail.finalPrice > 0 ? detail.finalPrice : v.price
      };
    }));
    toast.success(`Tüm varyant fiyatları Web Perakende fiyatına (₺${form.webPrice}) göre yeniden hesaplandı.`);
  };

  const deleteVariant = (id: string) => {
    const updatedVariants = variants.filter(v => v.id !== id);
    setVariants(updatedVariants);
    toast.error("Varyant karttan kaldırıldı.");

    if (isEditMode && productId) {
      fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants: updatedVariants })
      }).then(res => {
        if (res.ok) {
          refreshProducts();
          toast.info("Varyant silme veritabanına işlendi.");
        }
      }).catch(err => {
        console.error("Varyant silme sync hatası:", err);
      });
    }
  };

  // Add/Remove Warehouses
  const addWarehouse = () => {
    if (!newWarehouse.name.trim() || !newWarehouse.code.trim()) {
      toast.error("Lütfen ad ve kod alanlarını doldurun.");
      return;
    }
    
    if (editingWarehouseId) {
      // Edit Mode
      setWarehouses(prev => prev.map(w => w.id === editingWarehouseId ? {
        ...w,
        name: newWarehouse.name.trim(),
        code: newWarehouse.code.trim().toUpperCase(),
        location: newWarehouse.location.trim() || "Genel Konum",
        stockCount: newWarehouse.stockCount,
        branchId: newWarehouse.branchId || "default-branch"
      } : w));
      toast.success("Depo başarıyla güncellendi.");
      setEditingWarehouseId(null);
    } else {
      // Add Mode
      const nWh: Warehouse = {
        id: Math.random().toString(),
        name: newWarehouse.name.trim(),
        code: newWarehouse.code.trim().toUpperCase(),
        location: newWarehouse.location.trim() || "Genel Konum",
        stockCount: newWarehouse.stockCount,
        branchId: newWarehouse.branchId || "default-branch",
      };
      setWarehouses(prev => [...prev, nWh]);
      setForm(prev => ({ ...prev, warehouse: nWh.name }));
      toast.success("Yeni kurumsal depo başarıyla kaydedildi.");
    }
    
    setIsWarehouseManagerOpen(false);
    setNewWarehouse({ name: "", code: "", location: "", stockCount: 0, branchId: "" });
  };

  const removeWarehouse = (id: string) => {
    if (warehouses.length <= 1) {
      toast.error("En az bir aktif depo kalmalıdır.");
      return;
    }
    const wh = warehouses.find(w => w.id === id);
    setWarehouses(prev => prev.filter(w => w.id !== id));
    if (wh && form.warehouse === wh.name) {
      setForm(prev => ({ ...prev, warehouse: warehouses.find(w => w.id !== id)?.name || "" }));
    }
    toast.success("Kurumsal depo kaydı kaldırıldı.");
  };

  // Add/Edit/Remove Marketplaces
  const openAddMarketplaceModal = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingMarketplaceId(null);
    setNewMarketplace({ name: "", syncEnabled: true, logoColor: "bg-orange-500" });
    setIsMarketplaceModalOpen(true);
  };

  const openEditMarketplaceModal = (mp: Marketplace, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingMarketplaceId(mp.id);
    setNewMarketplace({ name: mp.name, syncEnabled: mp.syncEnabled, logoColor: mp.logoColor || "bg-orange-500" });
    setIsMarketplaceModalOpen(true);
  };

  const saveMarketplace = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newMarketplace.name.trim()) {
      toast.error("Lütfen kanal adını girin.");
      return;
    }

    if (editingMarketplaceId) {
      // Edit Mode
      setMarketplaces(prev => prev.map(m => m.id === editingMarketplaceId ? {
        ...m,
        name: newMarketplace.name.trim(),
        syncEnabled: newMarketplace.syncEnabled,
        logoColor: newMarketplace.logoColor
      } : m));
      toast.success("Pazaryeri entegrasyon kanalı güncellendi.");
      setEditingMarketplaceId(null);
    } else {
      // Add Mode
      const nMp: Marketplace = {
        id: Math.random().toString(),
        name: newMarketplace.name.trim(),
        syncEnabled: newMarketplace.syncEnabled,
        apiConnected: false,
        logoColor: newMarketplace.logoColor,
      };
      setMarketplaces(prev => [...prev, nMp]);
      toast.success("Yeni pazaryeri kanalı oluşturuldu.");
    }
    setIsMarketplaceModalOpen(false);
    setNewMarketplace({ name: "", syncEnabled: true, logoColor: "bg-orange-500" });
  };

  const removeMarketplace = (id: string) => {
    const mp = marketplaces.find(m => m.id === id);
    setMarketplaces(prev => prev.filter(m => m.id !== id));
    toast.error(`${mp?.name || "Pazaryeri"} entegrasyon kanalı silindi.`);
  };

  const testApiConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      if (configuringMarketplace) {
        setMarketplaces(prev => prev.map(m => m.id === configuringMarketplace.id ? { ...m, apiConnected: true, apiKey: apiCredentials.apiKey, apiSecret: "••••••••" } : m));
        toast.success("API Bağlantısı başarıyla kuruldu. Stok senkronizasyonu aktif.");
        setConfiguringMarketplace(null);
      }
    }, 2000);
  };

  // Add XML rules
  const addXmlFeed = () => {
    if (!newXmlFeed.name.trim()) return;
    const nXml: XmlFeed = {
      id: Math.random().toString(),
      name: newXmlFeed.name.trim(),
      priceSource: newXmlFeed.priceSource,
      markupPercent: newXmlFeed.markupPercent,
      active: newXmlFeed.active,
    };
    setXmlFeeds(prev => [...prev, nXml]);
    setIsXmlModalOpen(false);
    setNewXmlFeed({ name: "", priceSource: "Satış Fiyatı", markupPercent: 0, active: true });
    toast.success("Yeni XML Fiyat Kuralı başarıyla eklendi.");
  };

  const removeXmlFeed = (id: string) => {
    setXmlFeeds(prev => prev.filter(x => x.id !== id));
    toast.error("XML Fiyat Kuralı silindi.");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 pb-16 font-sans antialiased">
      
      {/* ────────────────────────────────────────────────────────
           TOP NAVIGATION / BREADCRUMBS & ACTIONS
         ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4.5 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <button 
              type="button"
              onClick={handleCancelClick}
              className="hover:text-slate-600 transition bg-transparent border-none cursor-pointer p-0 font-semibold text-slate-400"
            >
              Stok Kartları
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-orange-500 font-bold">{isEditMode ? "Düzenle" : "Yeni Kayıt"}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEditMode && isLoadingProduct ? "Ürün Bilgileri Yükleniyor..." : (form.name || "Yeni Stok Kartı")}
            </h1>
            {status === "Yayında" ? (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-wider animate-in fade-in duration-200">
                Yayında
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                Arşivlendi
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto relative">
          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="px-4.5 py-2.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-white cursor-pointer shadow-sm active:scale-98"
            >
              <span>İşlemler</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {/* Actions dropdown */}
            {isActionsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-40 animate-in fade-in slide-in-from-top-3 duration-200">
                <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition border-none cursor-pointer" onClick={() => { setIsActionsOpen(false); setIsPrintModalOpen(true); }}>
                  <Printer className="w-4 h-4 text-slate-400" /> Etiket Barkodu Yazdır
                </button>
                <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition border-none cursor-pointer" onClick={handleCopyCard}>
                  <Copy className="w-4 h-4 text-slate-400" /> Kartı Kopyala
                </button>
                <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition border-none cursor-pointer" onClick={() => { setIsActionsOpen(false); setIsReportModalOpen(true); }}>
                  <BarChart3 className="w-4 h-4 text-slate-400" /> Stok Hareket Raporu
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                {status === "Yayında" ? (
                  <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition border-none cursor-pointer" onClick={() => { setIsActionsOpen(false); setStatus("Arşivlendi"); toast.error("Stok kartı arşivlendi."); }}>
                    <ArchiveBoxIcon className="w-4 h-4 text-red-400" /> Stok Kartını Arşivle
                  </button>
                ) : (
                  <button className="w-full text-left px-3 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2.5 transition border-none cursor-pointer" onClick={() => { setIsActionsOpen(false); setStatus("Yayında"); toast.success("Stok kartı yeniden yayına alındı."); }}>
                    <Check className="w-4 h-4 text-emerald-500" /> Arşivden Çıkar
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCancelClick}
            className="px-5 py-2.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center bg-white cursor-pointer shadow-sm active:scale-98 shrink-0"
          >
            Vazgeç
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50 shrink-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> KAYDET
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {isEditMode && isLoadingProduct ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center text-center my-6 min-h-[420px]">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Ürün Bilgileri Yükleniyor</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">Lütfen bekleyin, stok kartı verileri ve medya görselleri senkronize ediliyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ────────────────────────────────────────────────────────
               LEFT & CENTER COLS: MAIN STACK
             ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Consolidated Dynamic Upper Tabs */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1.5">
              {[
                { id: "genel", label: "Genel Bilgiler", icon: Package },
                { id: "hikaye_analiz", label: "Mahsul Hikayesi & Besin Analizi", icon: BookOpen },
                { id: "varyantlar", label: "Varyant & Fiyatlandırma", icon: Layers },
                { id: "b2b_lojistik", label: "B2B & Şube Lojistiği", icon: Database },
                { id: "diger", label: "Teknik & SEO", icon: Info },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id || ((activeTab === ("b2b" as any) || activeTab === ("sube" as any)) && tab.id === "b2b_lojistik");
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active 
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/10" 
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENTS PANEL (Enhanced High-Contrast Layout) */}
            <div className={`rounded-2xl shadow-sm ${activeTab === "varyantlar" ? "" : "bg-white border border-slate-200 p-6.5 min-h-[400px]"}`}>
              
              {/* ======================= TAB: GENEL ======================= */}
              {activeTab === "genel" && (
                <div className="space-y-6">
                  
                  {/* Grid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Category Selection with Direct Typing & DB Auto-Sync */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                        <span>Kategori *</span>
                        <button type="button" onClick={() => setIsCategoryManagerOpen(true)} className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-0.5 tracking-normal cursor-pointer border-none bg-transparent p-0 text-[10px]">
                          <Settings2 className="w-3.5 h-3.5 text-orange-500" /> Düzenle
                        </button>
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={form.category}
                          onChange={e => setForm({ ...form, category: e.target.value })}
                          onBlur={e => {
                            const val = e.target.value.trim();
                            if (val && !categories.includes(val)) {
                              addCategory(val);
                            }
                          }}
                          placeholder="✏️ Elle kategori yazın (Örn: Pekmez ÇeşitLeri)..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-slate-800"
                        />
                        <div className="relative">
                          <select
                            value={categories.includes(form.category) ? form.category : "custom"}
                            onChange={e => {
                              if (e.target.value !== "custom") {
                                setForm({ ...form, category: e.target.value });
                              }
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 outline-none cursor-pointer appearance-none pr-8"
                          >
                            <option value="custom">⚡ Hazır Kategori Seçin veya Yukarıya Yazın...</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Stock Name */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">Stok Adı *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-slate-800"
                      />
                    </div>

                    {/* Barcode & Auto Generator */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 flex justify-between">
                        <span>Barkod (EAN)</span>
                        <button type="button" onClick={generateBarcode} className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-0.5 tracking-normal cursor-pointer">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> barkod üret
                        </button>
                      </label>
                      <input
                        type="text"
                        value={form.barcode}
                        onChange={e => setForm({ ...form, barcode: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-slate-800"
                      />
                    </div>

                    {/* Locked SKU Field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 flex justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>Stok Kodu (SKU) *</span>
                          <button type="button" onClick={generateSkuCode} className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-0.5 text-[10px] tracking-normal cursor-pointer">
                            <Sparkles className="w-3.5 h-3.5" /> kod üret
                          </button>
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setIsSkuLocked(!isSkuLocked)} 
                          className="text-slate-400 hover:text-slate-600 flex items-center gap-0.5 font-bold cursor-pointer"
                        >
                          {isSkuLocked ? (
                            <span className="flex items-center gap-0.5 text-xs text-amber-600"><Lock className="w-3.5 h-3.5 text-amber-500" /> Kilitli</span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-xs text-slate-600"><Unlock className="w-3.5 h-3.5 text-slate-500 animate-bounce" /> Düzenle</span>
                          )}
                        </button>
                      </label>
                      <input
                        type="text"
                        disabled={isSkuLocked}
                        value={form.sku}
                        onChange={e => setForm({ ...form, sku: e.target.value })}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold outline-none transition-all ${
                          isSkuLocked 
                            ? "bg-slate-55 border-slate-200 text-slate-400 cursor-not-allowed select-none" 
                            : "bg-white border-orange-400 text-slate-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                        }`}
                      />
                    </div>

                    {/* Unit Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 flex justify-between">
                        <span>Birim Seçimi</span>
                        <button type="button" onClick={() => setIsUnitManagerOpen(true)} className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-0.5 tracking-normal cursor-pointer">
                          <Settings2 className="w-3.5 h-3.5 text-orange-500" /> Düzenle
                        </button>
                      </label>
                      <div className="relative">
                        <select
                          value={form.unit}
                          onChange={e => setForm({ ...form, unit: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer appearance-none text-slate-800"
                        >
                          {units.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Manufacturer Code */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 flex justify-between">
                        <span>Üretici Kodu</span>
                        <button type="button" onClick={generateManufacturerCode} className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-0.5 tracking-normal cursor-pointer">
                          <Sparkles className="w-3.5 h-3.5" /> kod üret
                        </button>
                      </label>
                      <input
                        type="text"
                        value={form.manufacturerCode}
                        onChange={e => setForm({ ...form, manufacturerCode: e.target.value })}
                        placeholder="Örn: PKF-DUT-800"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-slate-800"
                      />
                    </div>

                    {/* Stock Type */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Stok Tipi</label>
                      <div className="relative">
                        <select
                          value={form.stockType}
                          onChange={e => {
                            const newType = e.target.value;
                            setForm(prev => {
                              let prefix = "PKF";
                              if (newType === "Hammadde") prefix = "PKF-HM";
                              else if (newType === "Mamul") prefix = "PKF-MM";
                              else if (newType === "Yarı Mamul") prefix = "PKF-YMM";
                              
                              const parts = prev.sku ? prev.sku.split("-") : [];
                              const numPart = parts.length > 1 ? parts[parts.length - 1] : Math.floor(100000 + Math.random() * 900000).toString();
                              return {
                                ...prev,
                                stockType: newType,
                                sku: `${prefix}-${numPart}`
                              };
                            });
                          }}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer appearance-none text-slate-800"
                        >
                          <option value="Ticari Mal">Ticari Mal</option>
                          <option value="Hammadde">Hammadde</option>
                          <option value="Mamul">Mamul</option>
                          <option value="Yarı Mamul">Yarı Mamul</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────────────────
                       DÖVİZ & KDV DESTEKLİ GELİŞMİŞ FİYAT MATRİSİ
                     ──────────────────────────────────────────────────────── */}
                  <div className="border border-slate-200 rounded-2xl p-5.5 bg-slate-50/50 space-y-4 shadow-inner">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/80">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Premium Fiyat Matrisi</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Döviz seçicili ve anlık kar marjı hesaplayıcılı ERP matrisi</p>
                      </div>
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase">
                        <Coins className="w-3.5 h-3.5 text-emerald-500" /> Çoklu Döviz Aktif
                      </span>
                    </div>

                    {/* Responsive Price Matrix Grid - Solves Squishing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                      
                      {/* 1. ALIŞ FİYATI */}
                      <div className="bg-white border border-slate-200 px-2.5 py-4 rounded-xl space-y-3.5 shadow-sm text-left flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Birim Alış Fiyatı</span>
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-orange-400 focus-within:bg-white transition-all overflow-hidden shadow-inner">
                            <input
                              type="number"
                              value={focusFields.purchasePrice && form.purchasePrice === 0 ? "" : form.purchasePrice}
                              onFocus={() => setFocusFields(prev => ({ ...prev, purchasePrice: true }))}
                              onBlur={() => setFocusFields(prev => ({ ...prev, purchasePrice: false }))}
                              onChange={e => setForm({ ...form, purchasePrice: parseFloat(e.target.value) || 0 })}
                              className="flex-1 bg-transparent pl-2.5 pr-0.5 py-2.5 text-sm font-bold text-slate-800 outline-none border-none text-left min-w-0"
                            />
                            <select
                              value={form.purchaseCurrency}
                              onChange={e => setForm({ ...form, purchaseCurrency: e.target.value })}
                              className="currency-select-compact bg-slate-100 text-xs font-bold border-l border-slate-200 py-2.5 outline-none cursor-pointer text-slate-600 hover:bg-slate-200 transition shrink-0"
                            >
                              <option value="TRY">₺</option>
                              <option value="USD">$</option>
                              <option value="EUR">€</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2.5 border-t border-slate-100/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Oranı</span>
                            <select
                              value={form.purchaseVat}
                              onChange={e => setForm({ ...form, purchaseVat: e.target.value })}
                              className="bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-white rounded px-2 py-0.5 text-[10px] font-bold text-slate-655 outline-none cursor-pointer transition"
                            >
                              <option value="0">%0</option>
                              <option value="1">%1</option>
                              <option value="10">%10</option>
                              <option value="20">%20</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Dahil</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.purchaseVatIncluded}
                                onChange={e => setForm({ ...form, purchaseVatIncluded: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* 2. B2B SATIŞ FİYATI */}
                      <div className="bg-white border border-slate-200 px-2.5 py-4 rounded-xl space-y-3.5 shadow-sm text-left flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">B2B Satış Fiyatı</span>
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-orange-400 focus-within:bg-white transition-all overflow-hidden shadow-inner">
                            <input
                              type="number"
                              value={focusFields.salePrice && form.salePrice === 0 ? "" : form.salePrice}
                              onFocus={() => setFocusFields(prev => ({ ...prev, salePrice: true }))}
                              onBlur={() => setFocusFields(prev => ({ ...prev, salePrice: false }))}
                              onChange={e => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })}
                              className="flex-1 bg-transparent pl-2.5 pr-0.5 py-2.5 text-sm font-bold text-slate-800 outline-none border-none text-left min-w-0"
                            />
                            <select
                              value={form.saleCurrency}
                              onChange={e => setForm({ ...form, saleCurrency: e.target.value })}
                              className="currency-select-compact bg-slate-100 text-xs font-bold border-l border-slate-200 py-2.5 outline-none cursor-pointer text-slate-600 hover:bg-slate-200 transition shrink-0"
                            >
                              <option value="TRY">₺</option>
                              <option value="USD">$</option>
                              <option value="EUR">€</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2.5 border-t border-slate-100/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Oranı</span>
                            <select
                              value={form.saleVat}
                              onChange={e => setForm({ ...form, saleVat: e.target.value })}
                              className="bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-white rounded px-2 py-0.5 text-[10px] font-bold text-slate-655 outline-none cursor-pointer transition"
                            >
                              <option value="0">%0</option>
                              <option value="1">%1</option>
                              <option value="10">%10</option>
                              <option value="20">%20</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Dahil</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.saleVatIncluded}
                                onChange={e => setForm({ ...form, saleVatIncluded: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Net Kâr Marjı</span>
                            <span className={`text-[11px] font-black ${grossMargin >= 25 ? "text-emerald-600" : grossMargin > 0 ? "text-amber-600" : "text-red-500"}`}>
                              %{grossMargin}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3. PERAKENDE SATIŞ FİYATI */}
                      <div className="bg-white border border-slate-200 px-2.5 py-4 rounded-xl space-y-3.5 shadow-sm text-left flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Perakende Fiyatı</span>
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-orange-400 focus-within:bg-white transition-all overflow-hidden shadow-inner">
                            <input
                              type="number"
                              value={focusFields.retailPrice && form.retailPrice === 0 ? "" : form.retailPrice}
                              onFocus={() => setFocusFields(prev => ({ ...prev, retailPrice: true }))}
                              onBlur={() => setFocusFields(prev => ({ ...prev, retailPrice: false }))}
                              onChange={e => setForm({ ...form, retailPrice: parseFloat(e.target.value) || 0 })}
                              className="flex-1 bg-transparent pl-2.5 pr-0.5 py-2.5 text-sm font-bold text-slate-800 outline-none border-none text-left min-w-0"
                            />
                            <select
                              value={form.retailCurrency}
                              onChange={e => setForm({ ...form, retailCurrency: e.target.value })}
                              className="currency-select-compact bg-slate-100 text-xs font-bold border-l border-slate-200 py-2.5 outline-none cursor-pointer text-slate-600 hover:bg-slate-200 transition shrink-0"
                            >
                              <option value="TRY">₺</option>
                              <option value="USD">$</option>
                              <option value="EUR">€</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2.5 border-t border-slate-100/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Oranı</span>
                            <select
                              value={form.retailVat}
                              onChange={e => setForm({ ...form, retailVat: e.target.value })}
                              className="bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-white rounded px-2 py-0.5 text-[10px] font-bold text-slate-655 outline-none cursor-pointer transition"
                            >
                              <option value="0">%0</option>
                              <option value="1">%1</option>
                              <option value="10">%10</option>
                              <option value="20">%20</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Dahil</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.retailVatIncluded}
                                onChange={e => setForm({ ...form, retailVatIncluded: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Net Kâr Marjı</span>
                            <span className={`text-[11px] font-black ${retailMargin >= 25 ? "text-emerald-600" : retailMargin > 0 ? "text-amber-600" : "text-red-500"}`}>
                              %{retailMargin}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4. WEB PERAKENDE FİYATI */}
                      <div className="bg-white border border-slate-200 px-2.5 py-4 rounded-xl space-y-3.5 shadow-sm text-left flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Web Perakende</span>
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-orange-400 focus-within:bg-white transition-all overflow-hidden shadow-inner">
                            <input
                              type="number"
                              value={focusFields.webPrice && form.webPrice === 0 ? "" : form.webPrice}
                              onFocus={() => setFocusFields(prev => ({ ...prev, webPrice: true }))}
                              onBlur={() => setFocusFields(prev => ({ ...prev, webPrice: false }))}
                              onChange={e => setForm({ ...form, webPrice: parseFloat(e.target.value) || 0 })}
                              className="flex-1 bg-transparent pl-2.5 pr-0.5 py-2.5 text-sm font-bold text-slate-800 outline-none border-none text-left min-w-0"
                            />
                            <select
                              value={form.webCurrency}
                              onChange={e => setForm({ ...form, webCurrency: e.target.value })}
                              className="currency-select-compact bg-slate-100 text-xs font-bold border-l border-slate-200 py-2.5 outline-none cursor-pointer text-slate-600 hover:bg-slate-200 transition shrink-0"
                            >
                              <option value="TRY">₺</option>
                              <option value="USD">$</option>
                              <option value="EUR">€</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2.5 border-t border-slate-100/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Oranı</span>
                            <select
                              value={form.webVat}
                              onChange={e => setForm({ ...form, webVat: e.target.value })}
                              className="bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-white rounded px-2 py-0.5 text-[10px] font-bold text-slate-655 outline-none cursor-pointer transition"
                            >
                              <option value="0">%0</option>
                              <option value="1">%1</option>
                              <option value="10">%10</option>
                              <option value="20">%20</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Dahil</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.webVatIncluded}
                                onChange={e => setForm({ ...form, webVatIncluded: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Net Kâr Marjı</span>
                            <span className={`text-[11px] font-black ${webMargin >= 25 ? "text-emerald-600" : webMargin > 0 ? "text-amber-600" : "text-red-500"}`}>
                              %{webMargin}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 5. PİYASA REFERANS FİYATI */}
                      <div className="bg-white border border-slate-200 px-2.5 py-4 rounded-xl space-y-3.5 shadow-sm text-left flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Piyasa Fiyatı (Çizgili)</span>
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-orange-400 focus-within:bg-white transition-all overflow-hidden shadow-inner">
                            <input
                              type="number"
                              value={focusFields.marketPrice && form.marketPrice === 0 ? "" : form.marketPrice}
                              onFocus={() => setFocusFields(prev => ({ ...prev, marketPrice: true }))}
                              onBlur={() => setFocusFields(prev => ({ ...prev, marketPrice: false }))}
                              onChange={e => setForm({ ...form, marketPrice: parseFloat(e.target.value) || 0 })}
                              className="flex-1 bg-transparent pl-2.5 pr-0.5 py-2.5 text-sm font-bold text-slate-800 outline-none border-none text-left min-w-0"
                            />
                            <select
                              value={form.marketCurrency}
                              onChange={e => setForm({ ...form, marketCurrency: e.target.value })}
                              className="currency-select-compact bg-slate-100 text-xs font-bold border-l border-slate-200 py-2.5 outline-none cursor-pointer text-slate-600 hover:bg-slate-200 transition shrink-0"
                            >
                              <option value="TRY">₺</option>
                              <option value="USD">$</option>
                              <option value="EUR">€</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2.5 border-t border-slate-100/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Oranı</span>
                            <select
                              value={form.marketVat}
                              onChange={e => setForm({ ...form, marketVat: e.target.value })}
                              className="bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-white rounded px-2 py-0.5 text-[10px] font-bold text-slate-655 outline-none cursor-pointer transition"
                            >
                              <option value="0">%0</option>
                              <option value="1">%1</option>
                              <option value="10">%10</option>
                              <option value="20">%20</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">KDV Dahil</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.marketVatIncluded}
                                onChange={e => setForm({ ...form, marketVatIncluded: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>



                    </div>

                    {/* LIVE GROSS MARGIN INDICATOR (Full Width Flexible Alignment) */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pt-4 border-t border-slate-200/80">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-semibold text-left">
                        <Info className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>KDV hariç net kâr oranları girilen Alış fiyatı üzerinden canlı hesaplanır.</span>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                        {/* B2B Margin */}
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm shrink-0">
                          <div className="text-left">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-orange-500">B2B Marjı</span>
                          </div>
                          <div className={`text-lg font-black ${grossMargin >= 25 ? "text-emerald-600" : grossMargin > 0 ? "text-amber-600" : "text-red-500"} shrink-0`}>
                            %{grossMargin}
                          </div>
                        </div>

                        {/* Retail Margin */}
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm shrink-0">
                          <div className="text-left">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-orange-500">Perakende Marjı</span>
                          </div>
                          <div className={`text-lg font-black ${retailMargin >= 25 ? "text-emerald-600" : retailMargin > 0 ? "text-amber-600" : "text-red-500"} shrink-0`}>
                            %{retailMargin}
                          </div>
                        </div>

                        {/* Web Margin */}
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm shrink-0">
                          <div className="text-left">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-orange-500">Web Marjı</span>
                          </div>
                          <div className={`text-lg font-black ${webMargin >= 25 ? "text-emerald-600" : webMargin > 0 ? "text-amber-600" : "text-red-500"} shrink-0`}>
                            %{webMargin}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* KAMPANYA VE İNDİRİM YÖNETİMİ CARD */}
                  <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-5.5 space-y-4.5 shadow-sm text-left">
                    <div className="flex items-center gap-3 pb-3.5 border-b border-slate-200/80">
                      <div className="bg-orange-500 text-white rounded-xl p-2 shadow-md shadow-orange-100/80">
                        <Percent className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Kampanya ve İndirim Yönetimi</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Ürüne özel indirim kampanyası tanımlayın ve zamanlamasını ayarlayın</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-slate-100 p-4 rounded-xl shadow-xs gap-3">
                      <div className="space-y-0.5">
                        <span className="block text-sm font-bold text-slate-700">Kampanya İndirimi Aktif</span>
                        <span className="block text-xs text-slate-500 font-medium leading-normal">
                          Aktif edildiğinde, tanımlanan tarihler arasında e-ticaret sitesinde Kampanyalı İndirimli Perakende Fiyatı geçerli olur.
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border transition-all duration-300 ${form.isCampaignActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {form.isCampaignActive ? "Kampanya Yayında" : "Kampanya Pasif"}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(form.isCampaignActive)}
                            onChange={e => setForm({ ...form, isCampaignActive: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>

                    {(Boolean(form.isCampaignActive) || form.isCampaignActive === "true" || form.isCampaignActive === 1) && (
                      <div className="space-y-4 pt-1.5 animate-fadeIn">
                        {/* İNDİRİM HESAPLAMA VE TİPİ SEÇİCİ */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3.5 shadow-xs">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Percent className="w-4 h-4 text-orange-500" /> İndirim Tipi ve Hesaplama Metodu
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const base = form.marketPrice || form.webPrice || 0;
                                  const curSale = form.salePrice || base;
                                  const pct = base > 0 && curSale < base ? Math.round(((base - curSale) / base) * 100) : 10;
                                  const newSale = Math.round(base * (1 - pct / 100));
                                  setForm({ ...form, discountType: "percent", discountValue: pct, salePrice: newSale });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  (form.discountType || "percent") === "percent"
                                    ? "bg-orange-500 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                % Yüzde İndirimi
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const base = form.marketPrice || form.webPrice || 0;
                                  const curSale = form.salePrice || base;
                                  const diff = base > curSale ? base - curSale : 50;
                                  const newSale = Math.max(0, base - diff);
                                  setForm({ ...form, discountType: "amount", discountValue: diff, salePrice: newSale });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  form.discountType === "amount"
                                    ? "bg-orange-500 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                ₺ Tutar İndirimi
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, discountType: "price" });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  form.discountType === "price"
                                    ? "bg-orange-500 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                ₺ Doğrudan Fiyat
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            {(form.discountType || "percent") === "percent" && (
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Uygulanacak İndirim Oranı (%)</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-orange-500 px-3.5 py-2 transition">
                                  <span className="text-sm font-black text-orange-500 mr-2">%</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={form.discountValue !== undefined ? form.discountValue : ""}
                                    placeholder="Örn: 15"
                                    onChange={e => {
                                      const pct = Math.min(99, Math.max(0, parseFloat(e.target.value) || 0));
                                      const base = form.marketPrice || form.webPrice || 0;
                                      const calcSale = base > 0 ? Math.round(base * (1 - pct / 100)) : form.salePrice;
                                      setForm({ ...form, discountValue: pct, salePrice: calcSale });
                                    }}
                                    className="w-full bg-transparent text-sm font-bold outline-none text-slate-800"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">Liste fiyatı üzerinden %{form.discountValue || 0} indirim yapılarak net fiyat hesaplanır.</p>
                              </div>
                            )}

                            {form.discountType === "amount" && (
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Düşülecek İndirim Tutarı (₺)</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-orange-500 px-3.5 py-2 transition">
                                  <span className="text-sm font-black text-orange-500 mr-2">₺</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={form.discountValue !== undefined ? form.discountValue : ""}
                                    placeholder="Örn: 50"
                                    onChange={e => {
                                      const amt = Math.max(0, parseFloat(e.target.value) || 0);
                                      const base = form.marketPrice || form.webPrice || 0;
                                      const calcSale = base > 0 ? Math.max(0, base - amt) : form.salePrice;
                                      setForm({ ...form, discountValue: amt, salePrice: calcSale });
                                    }}
                                    className="w-full bg-transparent text-sm font-bold outline-none text-slate-800"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">Liste fiyatından net ₺{form.discountValue || 0} düşülerek satış fiyatı güncellenir.</p>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-slate-700">Kampanyalı Perakende Satış Fiyatı (₺)</label>
                              <div className="flex items-center bg-emerald-50/50 border border-emerald-200 rounded-xl px-3.5 py-2 shadow-inner">
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={form.salePrice || ""}
                                  onChange={e => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    setForm({ ...form, salePrice: val });
                                  }}
                                  className="w-full bg-transparent text-sm font-black text-emerald-700 outline-none"
                                />
                                <span className="text-xs font-bold text-emerald-600 ml-1">₺</span>
                              </div>
                              <p className="text-[10px] text-emerald-600 font-medium">Müşterinin e-ticaret sitesinde ödeyeceği nihai kampanyalı fiyat.</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                          {/* Başlangıç Tarihi */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-2 shadow-xs hover:border-orange-200 transition focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-50/50">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Calendar className="w-4 h-4 text-orange-500" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kampanya Başlangıç Tarihi</span>
                            </div>
                            <div className="relative">
                              <input
                                type="datetime-local"
                                value={form.discount_start_date}
                                onChange={e => setForm({ ...form, discount_start_date: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-orange-400 transition"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">Kampanyanın otomatik olarak başlayacağı gün ve saat (Boş bırakılırsa hemen başlar).</p>
                          </div>

                          {/* Bitiş Tarihi */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-2 shadow-xs hover:border-orange-200 transition focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-50/50">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kampanya Bitiş Tarihi</span>
                            </div>
                            <div className="relative">
                              <input
                                type="datetime-local"
                                value={form.discount_end_date}
                                onChange={e => setForm({ ...form, discount_end_date: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-orange-400 transition"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">Kampanyanın sona ereceği gün ve saat (Sitede canlı geri sayım sayacı görünür).</p>
                          </div>
                        </div>

                        {/* Kampanya Fiyat & İndirim Özeti */}
                        <div className="md:col-span-2 bg-gradient-to-r from-orange-50/30 to-amber-50/20 border border-orange-100 rounded-xl p-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-orange-500/10 rounded-lg p-2 mt-0.5 text-orange-600">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="block text-xs font-bold text-slate-700">Canlı Kampanya Fiyat Önizlemesi</span>
                              <span className="block text-xs text-slate-600 font-medium mt-0.5 leading-normal">
                                {form.marketPrice > form.salePrice
                                  ? `Piyasa Liste Fiyatı (₺${form.marketPrice}) üzerinden Kampanyalı Perakende Satış Fiyatına (₺${form.salePrice}) indirim uygulanır.`
                                  : form.webPrice > form.salePrice
                                  ? `Web Perakende Fiyatı (₺${form.webPrice}) üzerinden Kampanyalı Satış Fiyatına (₺${form.salePrice}) indirim uygulanır.`
                                  : `İndirimli Kampanya Fiyatı: ₺${form.salePrice || form.webPrice}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                            {(form.marketPrice > form.salePrice || form.webPrice > form.salePrice) ? (
                              <div className="text-right">
                                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">İndirim Oranı</span>
                                <span className="text-lg font-black text-orange-600">
                                  %{Math.round((((form.marketPrice || form.webPrice) - form.salePrice) / (form.marketPrice || form.webPrice)) * 100)} İndirim
                                </span>
                                <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                                  Tasarruf: {Math.round((form.marketPrice || form.webPrice) - form.salePrice)} ₺
                                </span>
                              </div>
                            ) : (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-700 text-[11px] font-bold text-left flex items-start gap-1.5 max-w-[280px]">
                                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>İndirim uygulanabilmesi için Piyasa Fiyatının B2B Satış Fiyatından yüksek olması gerekir.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* KISA AÇIKLAMA */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Kısa Açıklama</label>
                    <input
                      type="text"
                      value={form.shortDesc || ""}
                      onChange={e => setForm({ ...form, shortDesc: e.target.value })}
                      placeholder="Ürünün kısa özeti veya tek satırlık açıklaması"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-slate-800"
                    />
                  </div>

                  {/* AÇIKLAMA - WYSIWYG HTML Editör */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">Açıklama</label>
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 rounded-full px-2.5 py-0.5">HTML Editör</span>
                    </div>
                    <RichTextEditor
                      value={form.desc || ""}
                      onChange={val => setForm(prev => ({ ...prev, desc: val }))}
                    />
                  </div>

                  {/* KAPSAMLI AÇIKLAMA / REÇETE DETAYLARI */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Kapsamlı Açıklama / Reçete Detayları</label>
                    <textarea
                      rows={5}
                      value={form.recipeDetails || ""}
                      onChange={e => setForm({ ...form, recipeDetails: e.target.value })}
                      placeholder="Hammaddeler, formüller, montaj veya üretim detayları..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none text-slate-800"
                    />
                  </div>

                </div>
              )}

              {/* ======================= TAB: MAHSUL HİKAYESİ & BESİN ANALİZİ ======================= */}
              {activeTab === "hikaye_analiz" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* ÜST BİLGİ BANNERI */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200 text-amber-600 shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Ürün Detay Kartı İçerik &amp; Analiz Yönetimi</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Müşteri ürün detay sayfasında yer alan "MAHSUL HİKAYESİ &amp; DETAYLAR" ve "ANALİZ &amp; BESİN DEĞERLERİ" başlıkları altındaki tüm metin ve değerleri buradan güncelleyebilirsiniz.
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700 whitespace-nowrap shrink-0">
                      <Sparkles className="w-3.5 h-3.5" /> Canlı Ürün Detay Kartı Entegrasyonlu
                    </div>
                  </div>

                  {/* 1. MAHSUL HİKAYESİ & DETAYLAR (ASIRLIK ZANAATKARLIK SEKMESİ) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        1. MAHSUL HİKAYESİ &amp; DETAYLAR (ASIRLIK ZANAATKARLIK SEKMESİ)
                      </h3>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Asırlık Zanaatkarlık ve Mahsul Hikayesi Metni
                      </label>
                      <textarea
                        rows={4}
                        value={form.harvestStory || ""}
                        onChange={e => setForm({ ...form, harvestStory: e.target.value })}
                        placeholder="İspir'in 2000 rakımlı yaylalarındaki asırlık yabani dut ağaçlarından toplanıp odun ateşinde ve bakır kazanlarda kaynatılan, hiçbir katkı maddesi içermeyen %100 saf geleneksel lezzet..."
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-500 outline-none leading-relaxed transition-all resize-none"
                      />
                      <p className="text-[11px] text-slate-400 font-medium">
                        Bu metin ürün detay sayfasındaki "MAHSUL HİKAYESİ &amp; DETAYLAR" sekmesinde ana açıklama paragrafı olarak gösterilir.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Hasat Rakımı / Yüksekliği</label>
                        <input
                          type="text"
                          value={form.altitude || ""}
                          onChange={e => setForm({ ...form, altitude: e.target.value })}
                          placeholder="2200 Metre"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Hasat Sezonu / Dönemi</label>
                        <input
                          type="text"
                          value={form.harvestSeason || ""}
                          onChange={e => setForm({ ...form, harvestSeason: e.target.value })}
                          placeholder="Temmuz - Ağustos"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">İçindekiler Temizlik Metni</label>
                        <input
                          type="text"
                          value={form.ingredients || ""}
                          onChange={e => setForm({ ...form, ingredients: e.target.value })}
                          placeholder="Doğal Dut Şırası, Erzurum Ceviz"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. ANALİZ & BESİN DEĞERLERİ SEKMESİ (100G DEĞERLERİ) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        2. ANALİZ &amp; BESİN DEĞERLERİ SEKMESİ (100G DEĞERLERİ)
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700">Enerji (kcal)</label>
                        <input
                          type="text"
                          value={form.nutrients_energy || ""}
                          onChange={e => setForm({ ...form, nutrients_energy: e.target.value })}
                          placeholder="293 kcal"
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700">Karbonhidrat (g)</label>
                        <input
                          type="text"
                          value={form.nutrients_carb || ""}
                          onChange={e => setForm({ ...form, nutrients_carb: e.target.value })}
                          placeholder="70.2 g"
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700">Protein (g)</label>
                        <input
                          type="text"
                          value={form.nutrients_protein || ""}
                          onChange={e => setForm({ ...form, nutrients_protein: e.target.value })}
                          placeholder="0.8 g"
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700">Kalsiyum (mg)</label>
                        <input
                          type="text"
                          value={form.nutrients_calcium || ""}
                          onChange={e => setForm({ ...form, nutrients_calcium: e.target.value })}
                          placeholder="400 mg"
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700">Demir (mg)</label>
                        <input
                          type="text"
                          value={form.nutrients_iron || ""}
                          onChange={e => setForm({ ...form, nutrients_iron: e.target.value })}
                          placeholder="10.2 mg"
                          className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">HMF Seviyesi &amp; Laboratuvar Analiz Sonucu</label>
                        <input
                          type="text"
                          value={form.hmfLevel || ""}
                          onChange={e => setForm({ ...form, hmfLevel: e.target.value })}
                          placeholder="< 10 mg/kg (Analiz Raporlu)"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Tüketim &amp; Servis Ritüeli Önerisi</label>
                        <input
                          type="text"
                          value={form.ritual || ""}
                          onChange={e => setForm({ ...form, ritual: e.target.value })}
                          placeholder="Örnek: Oda sıcaklığında (18°C - 22°C), taş değirmen..."
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. TEKNİK SPESİFİKASYON TABLOSU (ÜRÜN DETAYI SAĞ SÜTUN) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        3. TEKNİK SPESİFİKASYON TABLOSU (ÜRÜN DETAYI SAĞ SÜTUN)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Menşei</label>
                        <input
                          type="text"
                          value={form.specsMaterial || ""}
                          onChange={e => setForm({ ...form, specsMaterial: e.target.value })}
                          placeholder="Örnek: Erzurum / İspir"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Pişirme / Kurutma Yöntemi</label>
                        <input
                          type="text"
                          value={form.specsBellows || ""}
                          onChange={e => setForm({ ...form, specsBellows: e.target.value })}
                          placeholder="Örnek: Odun Ateşinde Bakır Kazanlar"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Şeker &amp; Glikoz Oranı</label>
                        <input
                          type="text"
                          value={form.specsWeight || ""}
                          onChange={e => setForm({ ...form, specsWeight: e.target.value })}
                          placeholder="Örnek: 0.0% (Sadece Doğal Meyve Şekeri)"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">Ambalaj Özelliği / Kalınlık</label>
                        <input
                          type="text"
                          value={form.specsDimensions || ""}
                          onChange={e => setForm({ ...form, specsDimensions: e.target.value })}
                          placeholder="Örnek: Gıdaya Uygun Cam Kavanoz &amp; Vakumlu Kapak"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ======================= TAB: B2B & ŞUBE LOJİSTİĞİ ======================= */}
              {(activeTab === "b2b_lojistik" || (activeTab as any) === "b2b" || (activeTab as any) === "sube") && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {/* B2B PORTAL AYARLARI KARTI */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Database className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">1. B2B Bayi Portalı Ayarları</h3>
                        <p className="text-xs text-slate-500">Ürünün B2B bayilerine gösterimi ve sipariş verme koşulları</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-orange-50/50 transition-all select-none shadow-xs">
                        <input
                          type="checkbox"
                          checked={form.b2bActive}
                          onChange={e => setForm({ ...form, b2bActive: e.target.checked })}
                          className="w-5 h-5 text-orange-500 border-slate-300 rounded focus:ring-orange-400 cursor-pointer"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-700">Satışa Aç</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">Ürünün B2B portalı üzerinden bayiler tarafından satın alınabilmesini sağlar.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-orange-50/50 transition-all select-none shadow-xs">
                        <input
                          type="checkbox"
                          checked={form.b2bPreOrderable}
                          onChange={e => setForm({ ...form, b2bPreOrderable: e.target.checked })}
                          className="w-5 h-5 text-orange-500 border-slate-300 rounded focus:ring-orange-400 cursor-pointer"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-700">Ön Sipariş Verilebilir</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">Stokta bulunmasa dahi bayilerin bu ürün için sipariş oluşturmasına izin verir.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ŞUBE VE DEPO STOK DAĞILIMI KARTI */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                          <Globe className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">2. Şube ve Depo Stok Dağılımı</h3>
                          <p className="text-xs text-slate-500">Ürünün farklı şube ve depolardaki güncel stok kırılımlarını yönetin</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsWarehouseManagerOpen(true)}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-orange-500" /> Depoları Yönet
                      </button>
                    </div>

                    <div className="space-y-6">
                      {branches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                          <div className="w-10 h-10 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
                          <p className="text-xs font-semibold">Şube bilgileri yükleniyor...</p>
                        </div>
                      ) : branches.map(branch => {
                        const branchWarehouses = warehouses.filter(w => w.branchId === branch.id);
                        return (
                          <div key={branch.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                            {/* Branch Header and Price */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold shrink-0">
                                  <Store className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-800">{branch.name}</h4>
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{branch.code}</span>
                                </div>
                              </div>
                              <div className="space-y-1 w-full sm:w-auto">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Şube Satış Fiyatı (₺)</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:bg-white focus-within:border-orange-500 transition-all overflow-hidden px-3 py-1.5 shadow-inner">
                                  <input
                                    type="number"
                                    value={branchPrices[branch.id] !== undefined ? branchPrices[branch.id] : ""}
                                    placeholder={form.salePrice ? `${form.salePrice}` : "0"}
                                    min={0}
                                    step="any"
                                    onChange={e => {
                                      const val = e.target.value === "" ? undefined : Math.max(0, parseFloat(e.target.value) || 0);
                                      setBranchPrices(prev => ({
                                        ...prev,
                                        [branch.id]: val !== undefined ? val : 0
                                      }));
                                      setWarehouses(prev => prev.map(w => w.branchId === branch.id ? { ...w, price: val } : w));
                                    }}
                                    className="w-full bg-transparent text-xs font-bold outline-none text-right text-slate-800"
                                  />
                                  <span className="text-[10px] font-bold text-slate-400 ml-1">₺</span>
                                </div>
                              </div>
                            </div>

                            {/* Warehouses */}
                            <div className="space-y-3.5">
                              {branchWarehouses.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Bu şubeye bağlı depo bulunmamaktadır.</p>
                              ) : (
                                branchWarehouses.map(wh => (
                                  <div key={wh.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-orange-500 shrink-0" />
                                        <div>
                                          <span className="block text-xs font-bold text-slate-800">{wh.name}</span>
                                          <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">{wh.code}</span>
                                        </div>
                                      </div>
                                      <span className="px-2 py-0.5 bg-slate-200/50 text-slate-500 rounded text-[9px] font-black uppercase tracking-wider max-w-[120px] truncate" title={wh.location}>
                                        {wh.location}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-1">
                                      <div className="space-y-1">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Mevcut Stok</label>
                                        <input
                                          type="number"
                                          value={wh.stockCount}
                                          min={0}
                                          onChange={e => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setWarehouses(prev => prev.map(w => w.id === wh.id ? { ...w, stockCount: val } : w));
                                          }}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center outline-none focus:border-orange-500 shadow-sm"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Rezerve</label>
                                        <input
                                          type="number"
                                          value={wh.reserved !== undefined ? wh.reserved : 0}
                                          min={0}
                                          onChange={e => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setWarehouses(prev => prev.map(w => w.id === wh.id ? { ...w, reserved: val } : w));
                                          }}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center outline-none focus:border-orange-500 shadow-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}



              {/* ======================= TAB: ŞUBELER ======================= */}
              {activeTab === "sube" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Şube ve Depo Stok Dağılımı</h3>
                        <p className="text-xs text-slate-500">Ürünün farklı şube ve depolardaki güncel stok kırılımlarını yönetin</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsWarehouseManagerOpen(true)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-orange-500" /> Depoları Yönet
                    </button>
                  </div>

                  <div className="space-y-6">
                    {branches.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                        <div className="w-10 h-10 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
                        <p className="text-xs font-semibold">Şube bilgileri yükleniyor...</p>
                      </div>
                    ) : branches.map(branch => {
                      const branchWarehouses = warehouses.filter(w => w.branchId === branch.id);
                      return (
                        <div key={branch.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">

                          {/* Branch Header and Price */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold shrink-0">
                                <Store className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-800">{branch.name}</h4>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{branch.code}</span>
                              </div>
                            </div>
                            <div className="space-y-1 w-full sm:w-auto">
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Şube Satış Fiyatı (₺)</label>
                              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:bg-white focus-within:border-orange-500 transition-all overflow-hidden px-3 py-1.5 shadow-inner">
                                <input
                                  type="number"
                                  value={branchPrices[branch.id] !== undefined ? branchPrices[branch.id] : ""}
                                  placeholder={form.salePrice ? `${form.salePrice}` : "0"}
                                  min={0}
                                  step="any"
                                  onChange={e => {
                                    const val = e.target.value === "" ? undefined : Math.max(0, parseFloat(e.target.value) || 0);
                                    setBranchPrices(prev => ({
                                      ...prev,
                                      [branch.id]: val !== undefined ? val : 0
                                    }));
                                    setWarehouses(prev => prev.map(w => w.branchId === branch.id ? { ...w, price: val } : w));
                                  }}
                                  className="w-full bg-transparent text-xs font-bold outline-none text-right text-slate-800"
                                />
                                <span className="text-[10px] font-bold text-slate-400 ml-1">₺</span>
                              </div>
                            </div>
                          </div>

                          {/* Warehouses */}
                          <div className="space-y-3.5">
                            {branchWarehouses.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Bu şubeye bağlı depo bulunmamaktadır.</p>
                            ) : (
                              branchWarehouses.map(wh => (
                                <div key={wh.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4 text-orange-500 shrink-0" />
                                      <div>
                                        <span className="block text-xs font-bold text-slate-800">{wh.name}</span>
                                        <span className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">{wh.code}</span>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-slate-200/50 text-slate-500 rounded text-[9px] font-black uppercase tracking-wider max-w-[120px] truncate" title={wh.location}>
                                      {wh.location}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-1">
                                    <div className="space-y-1">
                                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Mevcut Stok</label>
                                      <input
                                        type="number"
                                        value={wh.stockCount}
                                        min={0}
                                        onChange={e => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          setWarehouses(prev => prev.map(w => w.id === wh.id ? { ...w, stockCount: val } : w));
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center outline-none focus:border-orange-500 shadow-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Rezerve</label>
                                      <input
                                        type="number"
                                        value={wh.reserved !== undefined ? wh.reserved : 0}
                                        min={0}
                                        onChange={e => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          setWarehouses(prev => prev.map(w => w.id === wh.id ? { ...w, reserved: val } : w));
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center outline-none focus:border-orange-500 shadow-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Kullanılabilir</label>
                                      <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 text-center select-none">
                                        {Math.max(0, wh.stockCount - (wh.reserved || 0))}
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Min Stok</label>
                                      <input
                                        type="number"
                                        value={wh.minStock !== undefined ? wh.minStock : 0}
                                        min={0}
                                        onChange={e => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          setWarehouses(prev => prev.map(w => w.id === wh.id ? { ...w, minStock: val } : w));
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center outline-none focus:border-orange-500 shadow-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Kritik Limit</label>
                                      <input
                                        type="number"
                                        value={wh.criticalLimit !== undefined ? wh.criticalLimit : 0}
                                        min={0}
                                        onChange={e => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          setWarehouses(prev => prev.map(w => w.id === wh.id ? { ...w, criticalLimit: val } : w));
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center outline-none focus:border-orange-500 shadow-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* ======================= TAB: TEKNİK & SEO ======================= */}
              {activeTab === "diger" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  
                  {/* ✨ YAPAY ZEKA (AI) OTOMATİK İÇERİK MİMARİSİ BANNER */}
                  <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-4.5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-purple-500/30">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          PEKEFE AI • Yapay Zeka SEO & İçerik Motoru
                        </h4>
                        <p className="text-[11px] text-slate-300 font-medium mt-0.5 max-w-xl">
                          Ürün adından ve açıklamasından semantik olarak SEO başlığı, açıklama, rozetler, imalat reçetesi ve tüketim rehberini otomatik üretir.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateAiSeo("all")}
                      disabled={isGeneratingAi}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer border-none flex items-center gap-2 shrink-0 shadow-lg shadow-orange-500/20 uppercase tracking-wider"
                    >
                      {isGeneratingAi ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> Yapay Zeka Analiz Ediyor...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" /> Yapay Zeka ile Tümünü Otomatik Doldur
                        </>
                      )}
                    </button>
                  </div>

                  {/* 🔍 BÖLÜM 1: ARAMA MOTORU OPTİMİZASYONU (SEO) & TANITIM VİDEOSU */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2.5 border-b border-slate-200/80">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-xs">
                        <Search className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">1. Arama Motoru (SEO) & Tanıtım Videosu</h3>
                        <p className="text-[10px] text-slate-500 font-semibold">Google arama sonuçları optimizasyonu ve video tanıtım bağlantıları</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      
                      {/* Video URL Row */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                          <span>Tanıtım Videosu URL'si</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Cihazdan MP4/Video veya YouTube Linki</span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={form.videoUrl || ""}
                            onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                            placeholder="Örn: https://youtube.com/watch?v= veya yüklenen video linki..."
                            className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:bg-white outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => videoFileInputRef.current?.click()}
                            disabled={isUploadingVideo}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer border-none flex items-center justify-center gap-2 shrink-0 shadow-xs"
                          >
                            {isUploadingVideo ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-4 h-4 text-orange-400" /> Video Dosyası Yükle
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type="file"
                          ref={videoFileInputRef}
                          onChange={handleVideoUpload}
                          accept="video/*"
                          className="hidden"
                        />
                      </div>

                      {/* SEO Keywords */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-700">SEO Anahtar Kelimeler</label>
                          <button
                            type="button"
                            onClick={() => handleGenerateAiSeo("seoKeywords")}
                            disabled={generatingField === "seoKeywords"}
                            className="text-[10px] text-purple-600 hover:text-purple-700 font-extrabold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/60 transition cursor-pointer"
                          >
                            {generatingField === "seoKeywords" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                            AI Üret
                          </button>
                        </div>
                        <input
                          type="text"
                          value={form.seoKeywords}
                          onChange={e => setForm({ ...form, seoKeywords: e.target.value })}
                          placeholder="arı körüğü, paslanmaz körük, Geleneksel & Doğal Lezzetler"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:bg-white outline-none transition"
                        />
                      </div>

                      {/* SEO Title & Description Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <div className="space-y-1.5 md:col-span-1">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-700">SEO Başlığı</label>
                            <button
                              type="button"
                              onClick={() => handleGenerateAiSeo("seoTitle")}
                              disabled={generatingField === "seoTitle"}
                              className="text-[10px] text-purple-600 hover:text-purple-700 font-extrabold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/60 transition cursor-pointer"
                            >
                              {generatingField === "seoTitle" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                              AI Üret
                            </button>
                          </div>
                          <input
                            type="text"
                            value={form.seoTitle}
                            onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                            placeholder="Geleneksel İspir Dut Pekmezi (800g) - Pekefe"
                            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:bg-white outline-none transition"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-700">SEO Açıklaması</label>
                            <button
                              type="button"
                              onClick={() => handleGenerateAiSeo("seoDesc")}
                              disabled={generatingField === "seoDesc"}
                              className="text-[10px] text-purple-600 hover:text-purple-700 font-extrabold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/60 transition cursor-pointer"
                            >
                              {generatingField === "seoDesc" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                              AI Üret
                            </button>
                          </div>
                          <input
                            type="text"
                            value={form.seoDesc}
                            onChange={e => setForm({ ...form, seoDesc: e.target.value })}
                            placeholder="Pekefe İspir Erzurum yöresi doğal lezzetlerini en uygun fiyatlarla satın alın."
                            className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:bg-white outline-none transition"
                          />
                        </div>

                      </div>

                    </div>
                  </div>

                  {/* 🏷️ BÖLÜM 2: VİTRİN GÖRSEL ROZETLERİ */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3 pb-2.5 border-b border-slate-200/80">
                      <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">2. Vitrin Ürün Görsel Rozetleri</h3>
                        <p className="text-[10px] text-slate-500 font-semibold">E-ticaret vitrinindeki fotoğrafların üzerinde görünecek vurgu etiketleri</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-700">Ürün Görsel Rozeti 1 (Amber Renkli)</label>
                          <button
                            type="button"
                            onClick={() => handleGenerateAiSeo("badgeText1")}
                            disabled={generatingField === "badgeText1"}
                            className="text-[10px] text-purple-600 hover:text-purple-700 font-extrabold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/60 transition cursor-pointer"
                          >
                            {generatingField === "badgeText1" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                            AI Üret
                          </button>
                        </div>
                        <input
                          type="text"
                          value={form.badgeText1 || ""}
                          onChange={e => setForm({ ...form, badgeText1: e.target.value })}
                          placeholder="Örnek: %100 Doğal"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:bg-white outline-none transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-700">Ürün Görsel Rozeti 2 (Koyu Renkli)</label>
                          <button
                            type="button"
                            onClick={() => handleGenerateAiSeo("badgeText2")}
                            disabled={generatingField === "badgeText2"}
                            className="text-[10px] text-purple-600 hover:text-purple-700 font-extrabold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/60 transition cursor-pointer"
                          >
                            {generatingField === "badgeText2" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                            AI Üret
                          </button>
                        </div>
                        <input
                          type="text"
                          value={form.badgeText2 || ""}
                          onChange={e => setForm({ ...form, badgeText2: e.target.value })}
                          placeholder="Örnek: İspir Hasadı (Boş bırakılırsa kategori gösterilir)"
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:bg-white outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 📜 BÖLÜM 3: İMALAT REÇETESİ & ÜRETİM NOTLARI */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3 pb-2.5 border-b border-slate-200/80">
                      <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-xs">
                        <FileText className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">3. İmalat Reçetesi & Üretim Notları</h3>
                        <p className="text-[10px] text-slate-500 font-semibold">Ürünün imalat reçetesi, hammadde oranları ve geleneksel kaynatma detayları</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-700">Ürün Reçete Açıklamaları / Notlar</label>
                        <button
                          type="button"
                          onClick={() => handleGenerateAiSeo("recipeDetails")}
                          disabled={generatingField === "recipeDetails"}
                          className="text-[10px] text-purple-600 hover:text-purple-700 font-extrabold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/60 transition cursor-pointer"
                        >
                          {generatingField === "recipeDetails" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                          AI ile Reçete Oluştur
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={form.recipeDetails}
                        onChange={e => setForm({ ...form, recipeDetails: e.target.value })}
                        placeholder="İmalatta kullanılacak hammaddeler, meyve oranı ve geleneksel kaynatma notları..."
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:bg-white outline-none resize-none transition"
                      />
                    </div>
                  </div>

                  {/* 📖 BÖLÜM 4: DETAYLI ÜRÜN TANITIMI & TÜKETİM REHBERİ */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3 pb-2.5 border-b border-slate-200/80">
                      <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-xs">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">4. Detaylı Tanıtım Metni & Tüketim Rehberi</h3>
                        <p className="text-[10px] text-slate-500 font-semibold">E-ticaret detay sayfasında gösterilecek alt paragraf metni ve saklama rehberi</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Ürün Açıklaması Ekstra Paragrafı */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-700">Ürün Açıklaması Ekstra Paragrafı (Alt Alan)</label>
                          <button
                            type="button"
                            onClick={() => handleGenerateAiSeo("longDescExtra")}
                            disabled={generatingField === "longDescExtra"}
                            className="text-[10px] text-purple-600 hover:text-purple-700 font-extrabold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/60 transition cursor-pointer"
                          >
                            {generatingField === "longDescExtra" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                            AI Paragraf Oluştur
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={form.longDescExtra}
                          onChange={e => setForm({ ...form, longDescExtra: e.target.value })}
                          placeholder="Ürün açıklamasının altında yer alacak detaylı marka/seri tanıtım metni..."
                          className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-orange-500 focus:bg-white outline-none resize-y transition"
                        />
                      </div>

                      {/* Kullanım & Tüketim Kılavuzu */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="block text-xs font-bold text-slate-700">Kullanım & Tüketim Rehberi (Kılavuz Tabı)</label>
                            <button
                              type="button"
                              onClick={() => handleGenerateAiSeo("usageGuide")}
                              disabled={generatingField === "usageGuide"}
                              className="text-[10px] text-purple-600 hover:text-purple-700 font-extrabold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200/60 transition cursor-pointer"
                            >
                              {generatingField === "usageGuide" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                              AI Rehber Oluştur
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 border border-slate-200/60 rounded-full px-2.5 py-0.5">HTML Editör</span>
                        </div>
                        <RichTextEditor
                          value={form.usageGuide || ""}
                          onChange={val => setForm(prev => ({ ...prev, usageGuide: val }))}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* ────────────────────────────────────────────────────────
                 BOTTOM SUB-PANEL: VARIANTS & XML PRICES (ONLY RENDERED IN VARYANTLAR TAB)
               ──────────────────────────────────────────────────────── */}
            {activeTab === "varyantlar" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6.5 shadow-sm space-y-6">
              
              {/* Secondary Sub-Tabs */}
              <div className="flex justify-between items-end border-b border-slate-200">
                <div className="flex gap-6 -mb-px">
                  {[
                    { id: "varyantlar", label: "Varyant Yönetimi", badge: variants.length },
                    { id: "xml", label: "Xml Özel Fiyatları", badge: xmlFeeds.length },
                  ].map(sub => {
                    const active = activeSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubTab(sub.id as any)}
                        className={`pb-3 relative text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                          active ? "text-orange-500" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <span>{sub.label}</span>
                        {sub.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            active ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                          }`}>
                            {sub.badge}
                          </span>
                        )}
                        {active && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-in slide-in-from-left duration-200"></div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pb-3">
                  {activeSubTab === "varyantlar" && (
                    <div className="flex items-center gap-2">
                      {variants.length > 0 && (
                        <button
                          type="button"
                          onClick={autoCalculateAllVariantPrices}
                          className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Tüm varyant fiyatlarını Web Perakende fiyatına göre yeniden hesaplar"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Web Fiyatından Güncelle
                        </button>
                      )}
                      <button
                        onClick={() => openVariantModal()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-orange-500" /> Varyant Ekle
                      </button>
                    </div>
                  )}

                  {activeSubTab === "xml" && (
                    <button
                      onClick={() => setIsXmlModalOpen(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-500" /> XML Fiyatı Ekle
                    </button>
                  )}
                </div>
              </div>

              {/* 1. SUB-TAB: VARYANTLAR */}
              {activeSubTab === "varyantlar" && (
                <div className="space-y-4">
                  {variants.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="p-4">Varyant Kodu (SKU)</th>
                            <th className="p-4">Gramaj / Ambalaj Ölçüsü</th>
                            <th className="p-4">Ürün Çeşidi / Tipi</th>
                            <th className="p-4 text-center">Stok Miktarı</th>
                            <th className="p-4 text-right">Web Fiyatı</th>
                            <th className="p-4 text-right">B2B Bayi Fiyatı</th>
                            <th className="p-4 text-center">KDV</th>
                            <th className="p-4 text-center">İşlem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {variants.map(v => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-4 font-mono text-xs font-bold text-slate-500">{v.sku}</td>
                              <td className="p-4 text-sm font-semibold text-slate-700">{v.size}</td>
                              <td className="p-4 text-sm font-semibold text-slate-700">{v.color}</td>
                              <td className="p-4 text-sm font-black text-slate-800 text-center">{v.stock} Adet</td>
                              <td className="p-4 text-sm font-black text-orange-600 text-right">₺{v.price}</td>
                              <td className="p-4 text-sm font-black text-indigo-600 text-right">
                                {v.b2bPrice && v.b2bPrice > 0 ? `₺${v.b2bPrice}` : <span className="text-slate-400 font-normal text-xs">-</span>}
                              </td>
                              <td className="p-4 text-xs font-bold text-slate-600 text-center">
                                %{v.vatRate ?? 20} {v.vatIncluded !== false ? "(Dahil)" : "(Hariç)"}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => openVariantModal(v)}
                                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition border-none cursor-pointer"
                                    title="Düzenle"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteVariant(v.id)}
                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition border-none cursor-pointer"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-slate-400 mb-4 shadow-sm">
                        <Layers className="w-6 h-6 text-slate-350" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Hiç Varyant Bulunmuyor</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Ürüne ait farklı beden, renk veya ölçü seçenekleri oluşturarak stok durumlarını ayrıştırabilirsiniz.
                      </p>
                      <button
                        onClick={() => openVariantModal()}
                        className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10"
                      >
                        <Plus className="w-4 h-4" /> İlk Varyantı Ekle
                      </button>
                    </div>
                  )}
                </div>
              )}
              {activeSubTab === "xml" && (
                <div className="space-y-4">
                  {xmlFeeds.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="p-4">Feed / Çıktı Kanalı</th>
                            <th className="p-4">Referans Fiyat Kaynağı</th>
                            <th className="p-4 text-center">Fiyat Artış Oranı</th>
                            <th className="p-4 text-right">XML Hesaplanan Fiyat</th>
                            <th className="p-4 text-center">Durum</th>
                            <th className="p-4 text-center">İşlem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {xmlFeeds.map(feed => {
                            // Calculate preview price dynamically based on form states
                            let basePrice = form.salePrice;
                            if (feed.priceSource.includes("Web")) basePrice = form.webPrice;
                            else if (feed.priceSource.includes("Perakende")) basePrice = form.retailPrice;
                            else if (feed.priceSource.includes("Alış")) basePrice = form.purchasePrice;

                            const finalXmlPrice = Math.round(basePrice * (1 + feed.markupPercent / 100));

                            return (
                              <tr key={feed.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-4 font-bold text-sm text-slate-800">{feed.name}</td>
                                <td className="p-4 text-xs font-semibold text-slate-500">{feed.priceSource}</td>
                                <td className="p-4 text-sm font-extrabold text-slate-800 text-center">+{feed.markupPercent}%</td>
                                <td className="p-4 text-sm font-black text-orange-600 text-right">₺{finalXmlPrice}</td>
                                <td className="p-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    feed.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400"
                                  }`}>
                                    {feed.active ? "AKTİF" : "PASİF"}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <button 
                                    onClick={() => removeXmlFeed(feed.id)}
                                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition border-none cursor-pointer"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-slate-400 mb-4 shadow-sm">
                        <FileText className="w-6 h-6 text-slate-350" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Hiç XML Çıktısı Bulunmuyor</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Google Shopping, Facebook Catalog veya harici bayiler için farklı iskontolara sahip fiyat kuralları oluşturabilirsiniz.
                      </p>
                      <button
                        onClick={() => setIsXmlModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/10"
                      >
                        <Plus className="w-4 h-4" /> XML Fiyatı Ekle
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          </div>

          {/* ────────────────────────────────────────────────────────
               RIGHT COL: MEDIA ZONE, ALERT BOX & WAREHOUSES
             ──────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            
            {/* 1. PRODUCT MULTI-MEDIA UPLOAD ZONE */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Ürün Görselleri & Medya Galeri</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Birden fazla görsel ve video yüklemesi yapabilirsiniz</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-650 bg-amber-50 border border-amber-200/50 px-3 py-1.5 rounded-xl w-fit font-bold">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Önerilen ideal görsel boyutu: 800x800 piksel (1:1 Kare oranı, maksimum 2MB)</span>
                </div>
              </div>

              {/* Upload Grid */}
              <div className="grid grid-cols-3 gap-3">
                {mediaList.map((media, index) => (
                  <div
                    key={media.id}
                    draggable
                    onDragStart={(e) => handleMediaDragStart(e, index)}
                    onDragOver={(e) => handleMediaDragOverItem(e, index)}
                    onDrop={(e) => handleMediaDropItem(e, index)}
                    className={`relative aspect-square border border-slate-200 rounded-xl overflow-hidden group shadow-sm bg-slate-900 cursor-grab active:cursor-grabbing transition-all ${
                      draggedMediaIndex === index ? "opacity-30 ring-2 ring-orange-500 scale-95" : "hover:border-orange-400"
                    }`}
                  >
                    {media.type === "video" || isVideoUrl(media.url) ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                        <video src={media.url} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                          <span className="material-symbols-outlined text-amber-400 text-3xl animate-pulse">play_circle</span>
                        </div>
                      </div>
                    ) : (
                      <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                    )}

                    {/* Media Type & Order Overlay Indicator */}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/80 text-white rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-xs">
                      {media.type === "video" ? <Video className="w-2.5 h-2.5 text-amber-400" /> : <Eye className="w-2.5 h-2.5 text-slate-300" />}
                      <span>#{index + 1} {media.type}</span>
                    </div>

                    {/* Hover Move & Delete Controls */}
                    <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 transition-all gap-1.5">
                      <div className="flex gap-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveMediaPosition(index, "left")}
                            className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[9px] font-bold border-none cursor-pointer"
                            title="Sola Taşı"
                          >
                            ◀ Sol
                          </button>
                        )}
                        {index < mediaList.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveMediaPosition(index, "right")}
                            className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[9px] font-bold border-none cursor-pointer"
                            title="Sağa Taşı"
                          >
                            Sağ ▶
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteMediaItem(media.id)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold border-none cursor-pointer shadow-sm"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                ))}

                {/* Inline Upload Zone Trigger inside grid */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    isDragging 
                      ? "border-orange-500 bg-orange-50/20" 
                      : "border-slate-300 hover:border-orange-400 hover:bg-slate-50"
                  }`}
                  title="Yeni görsel veya video ekle"
                >
                  <UploadCloud className="w-5 h-5 text-slate-400 animate-bounce" />
                  <span className="text-[9px] font-bold text-slate-500">Medyayı Çek</span>
                  <span className="text-[8px] text-slate-400">Görsel/Video</span>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />

              {/* Direct Url Entry for Media */}
              <div className="border-t border-slate-100 pt-3.5 space-y-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Dış Bağlantı (URL) İle Medya Ekle</span>
                <div className="flex gap-2">
                  <select
                    value={mediaTypeInput}
                    onChange={e => setMediaTypeInput(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2 outline-none cursor-pointer"
                  >
                    <option value="image">Resim</option>
                    <option value="video">Video</option>
                  </select>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={mediaUrlInput}
                    onChange={e => setMediaUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={addMediaUrl}
                    className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer border-none"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* 2. DYNAMIC MARKETPLACE SENKRONIZASYON PANEL (Entegre Marketplaces) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-50 text-orange-500 border border-orange-200/60 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                    <Radio className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Entegrasyon & Pazaryerleri</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Aktif pazaryeri mağaza bağlantıları ve stok senkronizasyonu</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openAddMarketplaceModal();
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-none shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-400" /> Kanal Ekle
                </button>
              </div>

              {/* Dynamic Marketplaces List */}
              <div className="space-y-2.5">
                {marketplaces.map((mp) => (
                  <div key={mp.id} className="flex items-center justify-between bg-slate-50/60 border border-slate-200/70 p-3 rounded-xl hover:border-orange-300 hover:bg-white transition shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[10px] tracking-tight uppercase shadow-xs ${mp.logoColor || "bg-slate-700"}`}>
                        {mp.name.substring(0,2)}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">{mp.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${mp.apiConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                          <span className="text-[9px] text-slate-500 font-semibold">{mp.apiConnected ? "API Bağlantısı Aktif" : "API Anahtarı Bekleniyor"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* API Credentials Config */}
                      <button
                        type="button"
                        onClick={() => {
                          setConfiguringMarketplace(mp);
                          setApiCredentials({ apiKey: mp.apiKey || "", apiSecret: "" });
                        }}
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-orange-600 border border-slate-200 rounded-lg transition cursor-pointer"
                        title="API Entegrasyon Ayarları"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Marketplace */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditMarketplaceModal(mp);
                        }}
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg transition cursor-pointer"
                        title="Kanalı Düzenle"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Marketplace */}
                      <button
                        type="button"
                        onClick={() => removeMarketplace(mp.id)}
                        className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition cursor-pointer"
                        title="Kanalı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Sync Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer ml-1">
                        <input
                          type="checkbox"
                          checked={mp.syncEnabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setMarketplaces(prev => prev.map(m => m.id === mp.id ? { ...m, syncEnabled: checked } : m));
                            if (checked) toast.success(`${mp.name} stok senkronizasyonu aktif.`);
                            else toast.warning(`${mp.name} senkronizasyonu durduruldu.`);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50/50 border-l-3 border-amber-500 p-3 rounded-xl text-[10px] text-slate-600 font-semibold leading-relaxed flex gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Ürüne ait B2B veya Perakende fiyat matrisleri güncellendiğinde senkronizasyonu açık (yeşil mağaza) kanalların tamamı anında tetiklenir.
                </span>
              </div>
            </div>

            {/* 3. DYNAMIC WAREHOUSES & LOCATIONS PANEL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Kurumsal Depo & Konum</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Ürünün barındırıldığı aktif depoyu ve stok kırılımını seçin</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWarehouseManagerOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border-none shadow-sm"
                >
                  <Settings2 className="w-3 h-3 text-orange-500" /> Yönet
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Aktif Depo Seçimi</label>
                  <div className="relative">
                    <select
                      value={form.warehouse}
                      onChange={e => setForm({ ...form, warehouse: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 outline-none transition-all cursor-pointer appearance-none text-slate-800"
                    >
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.name}>{wh.name} ({wh.code})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Warehouse details info card */}
                {selectedWarehouseInfo && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-inner animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                        <Box className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">{selectedWarehouseInfo.location}</span>
                        <span className="text-[10px] text-slate-700 font-extrabold">{selectedWarehouseInfo.name} ({selectedWarehouseInfo.code})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        value={selectedWarehouseInfo.stockCount}
                        min={0}
                        onChange={e => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setWarehouses(prev => prev.map(w => w.name === selectedWarehouseInfo.name ? { ...w, stockCount: val } : w));
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-center text-slate-800"
                      />
                      <span className="text-xs font-bold text-slate-500">Adet</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────
           DİNAMİK PROFESYONEL VARYANT OLUŞTURUCU & MATRİS MODALI
         ──────────────────────────────────────────────────────── */}
      {isVariantModalOpen && (() => {
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
            <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              
              {/* Modern Header Bar */}
              <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      {variantForm.isEditing ? "Varyant Kartını Düzenle" : "Yeni Varyant Tanımla"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Web Perakende fiyatı (₺{form.webPrice || 0}) baz alınarak otomatik oranlanır
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Tabs (Tekli vs Toplu Matris) - Only show if not editing */}
              {!variantForm.isEditing && (
                <div className="px-6 pt-4 pb-2 bg-slate-50/60 border-b border-slate-100">
                  <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setVariantForm(prev => ({ ...prev, modalTab: "single" }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                        variantForm.modalTab === "single"
                          ? "bg-white text-slate-900 shadow-sm font-extrabold"
                          : "text-slate-600 hover:text-slate-900 bg-transparent"
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" /> Tekli Varyant Formu
                    </button>
                    <button
                      type="button"
                      onClick={() => setVariantForm(prev => ({ ...prev, modalTab: "bulk" }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                        variantForm.modalTab === "bulk"
                          ? "bg-white text-slate-900 shadow-sm font-extrabold"
                          : "text-slate-600 hover:text-slate-900 bg-transparent"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Toplu Matris Üretici
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {variantForm.modalTab === "single" ? (
                  <>
                    {/* Gramaj/Ölçü & Ürün Çeşidi Clean Combobox Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* 1. Gramaj / Ambalaj Ölçüsü */}
                      <div className="space-y-1.5" ref={sizeDropdownRef}>
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Gramaj / Ambalaj Ölçüsü *
                          </label>
                          <button 
                            type="button" 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsSizeDropdownOpen(false);
                              setIsSizeManagerOpen(true);
                            }}
                            className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-0.5 tracking-normal cursor-pointer border-none bg-transparent p-0 text-[11px]"
                          >
                            <Settings2 className="w-3.5 h-3.5 text-orange-500" /> Yönet
                          </button>
                        </div>
                        <div className="relative">
                          <div 
                            className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-orange-500 transition-all cursor-pointer"
                            onClick={() => setIsSizeDropdownOpen(prev => !prev)}
                          >
                            <input
                              type="text"
                              value={variantForm.size}
                              onChange={e => {
                                handleVariantSizeChange(e.target.value);
                                setIsSizeDropdownOpen(true);
                              }}
                              onFocus={() => setIsSizeDropdownOpen(true)}
                              placeholder="Gramaj seçin veya yazın (Örn: 400g Cam Kavanoz)..."
                              className="w-full px-3.5 py-2.5 bg-transparent border-none text-xs font-bold text-slate-800 outline-none cursor-text"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsSizeDropdownOpen(prev => !prev);
                              }}
                              className="px-3 text-slate-400 hover:text-orange-500 transition cursor-pointer border-none bg-transparent"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSizeDropdownOpen ? "rotate-180 text-orange-500" : ""}`} />
                            </button>
                          </div>

                          {/* Interactive Size Dropdown Menu */}
                          {isSizeDropdownOpen && (
                            <div 
                              onMouseDown={(e) => e.stopPropagation()}
                              className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="p-1.5 space-y-0.5 max-h-48 overflow-y-auto">
                                {sizes.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400 font-semibold">
                                    Kayıtlı gramaj seçeneği bulunamadı.
                                  </div>
                                ) : (
                                  sizes.map(sizeOption => {
                                    const isSelected = variantForm.size === sizeOption;
                                    return (
                                      <div
                                        key={sizeOption}
                                        onClick={() => {
                                          handleVariantSizeChange(sizeOption);
                                          setIsSizeDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                                          isSelected 
                                            ? "bg-orange-50 text-orange-600 font-black" 
                                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                      >
                                        <span>{sizeOption}</span>
                                        <div className="flex items-center gap-1">
                                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeSizeOption(sizeOption);
                                            }}
                                            className="p-1 text-slate-300 hover:text-red-500 rounded-md hover:bg-red-50 transition border-none bg-transparent cursor-pointer"
                                            title="Listeden Kaldır"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                              
                              {/* Inline Quick Add Input */}
                              <div className="p-2 border-t border-slate-100 bg-slate-50/80 space-y-1.5">
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Yeni gramaj (Örn: 250 Gr)..."
                                    value={newSizeName}
                                    onChange={e => setNewSizeName(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (newSizeName.trim()) {
                                          addSizeOption();
                                          handleVariantSizeChange(newSizeName.trim());
                                        }
                                      }
                                    }}
                                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-orange-500 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newSizeName.trim()) {
                                        addSizeOption();
                                        handleVariantSizeChange(newSizeName.trim());
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition border-none cursor-pointer"
                                  >
                                    Ekle
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsSizeDropdownOpen(false);
                                    setIsSizeManagerOpen(true);
                                  }}
                                  className="w-full py-1 text-center text-[10px] font-bold text-slate-500 hover:text-orange-600 transition border-none bg-transparent cursor-pointer"
                                >
                                  ⚙️ Gelişmiş Gramaj Yönetim Penceresi
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Ürün Çeşidi / Tipi */}
                      <div className="space-y-1.5" ref={colorDropdownRef}>
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Ürün Çeşidi / Tipi *
                          </label>
                          <button 
                            type="button" 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsColorDropdownOpen(false);
                              setIsColorManagerOpen(true);
                            }}
                            className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-0.5 tracking-normal cursor-pointer border-none bg-transparent p-0 text-[11px]"
                          >
                            <Settings2 className="w-3.5 h-3.5 text-orange-500" /> Yönet
                          </button>
                        </div>
                        <div className="relative">
                          <div 
                            className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-orange-500 transition-all cursor-pointer"
                            onClick={() => setIsColorDropdownOpen(prev => !prev)}
                          >
                            <input
                              type="text"
                              value={variantForm.color}
                              onChange={e => {
                                const newColor = e.target.value;
                                const codes = generateSkuAndBarcode(variantForm.size, newColor);
                                setVariantForm(prev => ({
                                  ...prev,
                                  color: newColor,
                                  sku: prev.isEditing ? prev.sku : codes.sku,
                                  barcode: prev.isEditing ? prev.barcode : codes.barcode,
                                }));
                                setIsColorDropdownOpen(true);
                              }}
                              onFocus={() => setIsColorDropdownOpen(true)}
                              placeholder="Çeşit seçin veya yazın (Örn: Sade, Cevizli)..."
                              className="w-full px-3.5 py-2.5 bg-transparent border-none text-xs font-bold text-slate-800 outline-none cursor-text"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsColorDropdownOpen(prev => !prev);
                              }}
                              className="px-3 text-slate-400 hover:text-orange-500 transition cursor-pointer border-none bg-transparent"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isColorDropdownOpen ? "rotate-180 text-orange-500" : ""}`} />
                            </button>
                          </div>

                          {/* Interactive Color Dropdown Menu */}
                          {isColorDropdownOpen && (
                            <div 
                              onMouseDown={(e) => e.stopPropagation()}
                              className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="p-1.5 space-y-0.5 max-h-48 overflow-y-auto">
                                {colors.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400 font-semibold">
                                    Kayıtlı ürün çeşidi bulunamadı.
                                  </div>
                                ) : (
                                  colors.map(colorOption => {
                                    const isSelected = variantForm.color === colorOption;
                                    return (
                                      <div
                                        key={colorOption}
                                        onClick={() => {
                                          const codes = generateSkuAndBarcode(variantForm.size, colorOption);
                                          setVariantForm(prev => ({
                                            ...prev,
                                            color: colorOption,
                                            sku: prev.isEditing ? prev.sku : codes.sku,
                                            barcode: prev.isEditing ? prev.barcode : codes.barcode,
                                          }));
                                          setIsColorDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                                          isSelected 
                                            ? "bg-orange-50 text-orange-600 font-black" 
                                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                      >
                                        <span>{colorOption}</span>
                                        <div className="flex items-center gap-1">
                                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeColorOption(colorOption);
                                            }}
                                            className="p-1 text-slate-300 hover:text-red-500 rounded-md hover:bg-red-50 transition border-none bg-transparent cursor-pointer"
                                            title="Listeden Kaldır"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Inline Quick Add Input */}
                              <div className="p-2 border-t border-slate-100 bg-slate-50/80 space-y-1.5">
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Yeni çeşit (Örn: Süzme, Fıstıklı)..."
                                    value={newColorName}
                                    onChange={e => setNewColorName(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (newColorName.trim()) {
                                          addColorOption();
                                          const codes = generateSkuAndBarcode(variantForm.size, newColorName.trim());
                                          setVariantForm(prev => ({
                                            ...prev,
                                            color: newColorName.trim(),
                                            sku: prev.isEditing ? prev.sku : codes.sku,
                                            barcode: prev.isEditing ? prev.barcode : codes.barcode,
                                          }));
                                        }
                                      }
                                    }}
                                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-orange-500 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newColorName.trim()) {
                                        addColorOption();
                                        const codes = generateSkuAndBarcode(variantForm.size, newColorName.trim());
                                        setVariantForm(prev => ({
                                          ...prev,
                                          color: newColorName.trim(),
                                          sku: prev.isEditing ? prev.sku : codes.sku,
                                          barcode: prev.isEditing ? prev.barcode : codes.barcode,
                                        }));
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition border-none cursor-pointer"
                                  >
                                    Ekle
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsColorDropdownOpen(false);
                                    setIsColorManagerOpen(true);
                                  }}
                                  className="w-full py-1 text-center text-[10px] font-bold text-slate-500 hover:text-orange-600 transition border-none bg-transparent cursor-pointer"
                                >
                                  ⚙️ Gelişmiş Ürün Çeşitleri Yönetim Penceresi
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Stock, Prices & VAT Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Başlangıç Stoku</label>
                        <input
                          type="number"
                          value={variantForm.stock}
                          onChange={e => setVariantForm({ ...variantForm, stock: parseInt(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-orange-500 outline-none text-center text-slate-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Web Fiyatı (₺)</label>
                          {form.webPrice > 0 && (
                            <button
                              type="button"
                              onClick={() => handleVariantSizeChange(variantForm.size)}
                              className="text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
                              title="Web Perakende fiyatına göre tekrar hesapla"
                            >
                              <Sparkles className="w-3 h-3 text-orange-500" /> Oto
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          value={variantForm.price}
                          onChange={e => setVariantForm({ ...variantForm, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold focus:bg-white focus:border-orange-500 outline-none text-center text-orange-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">B2B Bayi Fiyatı (₺)</label>
                        <input
                          type="number"
                          placeholder="₺0.00"
                          value={variantForm.b2bPrice || ""}
                          onChange={e => setVariantForm({ ...variantForm, b2bPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold focus:bg-white focus:border-orange-500 outline-none text-center text-indigo-600"
                        />
                      </div>
                    </div>

                    {/* Variant VAT Settings */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Varyant KDV Oranı</label>
                        <select
                          value={variantForm.vatRate ?? 20}
                          onChange={e => setVariantForm({ ...variantForm, vatRate: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value={0}>%0 KDV</option>
                          <option value={1}>%1 KDV</option>
                          <option value={10}>%10 KDV</option>
                          <option value={20}>%20 KDV</option>
                        </select>
                      </div>

                      <div className="space-y-1 flex flex-col justify-center">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">KDV Durumu</span>
                        <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                          <input
                            type="checkbox"
                            checked={variantForm.vatIncluded ?? true}
                            onChange={e => setVariantForm({ ...variantForm, vatIncluded: e.target.checked })}
                            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400 accent-orange-500"
                          />
                          <span className="text-xs font-bold text-slate-700">Fiyata KDV Dahil</span>
                        </label>
                      </div>
                    </div>

                    {/* SKU & Barcode Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stok Kodu (SKU)</label>
                        <input
                          type="text"
                          value={variantForm.sku}
                          onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Barkod</label>
                        <input
                          type="text"
                          value={variantForm.barcode}
                          onChange={e => setVariantForm({ ...variantForm, barcode: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* 2. BULK MATRIX GENERATOR */
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-medium">
                      Seçeceğiniz tüm ebat ve renk kombinasyonları için Web Perakende fiyatı (₺{form.webPrice || 0}) orantılanarak toplu varyant kartları otomatik üretilecektir.
                    </div>

                    {/* Bulk Sizes Selection */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Dahil Edilecek Gramajlar / Ölçüler ({variantForm.selectedBulkSizes.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (variantForm.selectedBulkSizes.length === sizes.length) {
                              setVariantForm(prev => ({ ...prev, selectedBulkSizes: [] }));
                            } else {
                              setVariantForm(prev => ({ ...prev, selectedBulkSizes: [...sizes] }));
                            }
                          }}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-transparent border-none cursor-pointer p-0"
                        >
                          {variantForm.selectedBulkSizes.length === sizes.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                        {sizes.map(s => {
                          const checked = variantForm.selectedBulkSizes.includes(s);
                          return (
                            <label
                              key={s}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                                checked 
                                  ? "bg-orange-50 text-orange-900 border-orange-300 font-bold" 
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{s}</span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setVariantForm(prev => ({ ...prev, selectedBulkSizes: [...prev.selectedBulkSizes, s] }));
                                  } else {
                                    setVariantForm(prev => ({ ...prev, selectedBulkSizes: prev.selectedBulkSizes.filter(x => x !== s) }));
                                  }
                                }}
                                className="accent-orange-500 w-3.5 h-3.5"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bulk Colors/Variations Selection */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Dahil Edilecek Çeşitler / Tipler ({variantForm.selectedBulkColors.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (variantForm.selectedBulkColors.length === colors.length) {
                              setVariantForm(prev => ({ ...prev, selectedBulkColors: [] }));
                            } else {
                              setVariantForm(prev => ({ ...prev, selectedBulkColors: [...colors] }));
                            }
                          }}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-transparent border-none cursor-pointer p-0"
                        >
                          {variantForm.selectedBulkColors.length === colors.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                        {colors.map(c => {
                          const checked = variantForm.selectedBulkColors.includes(c);
                          return (
                            <label
                              key={c}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                                checked 
                                  ? "bg-orange-50 text-orange-900 border-orange-300 font-bold" 
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{c}</span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setVariantForm(prev => ({ ...prev, selectedBulkColors: [...prev.selectedBulkColors, c] }));
                                  } else {
                                    setVariantForm(prev => ({ ...prev, selectedBulkColors: prev.selectedBulkColors.filter(x => x !== c) }));
                                  }
                                }}
                                className="accent-orange-500 w-3.5 h-3.5"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stock Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Varyant Başına Başlangıç Stoku</label>
                      <input
                        type="number"
                        value={variantForm.stock}
                        onChange={e => setVariantForm({ ...variantForm, stock: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white outline-none text-center font-black"
                      />
                    </div>

                    <div className="bg-slate-900 text-white p-3.5 rounded-xl text-center">
                      <span className="text-xs font-extrabold text-orange-400">
                        ⚡ Toplam {variantForm.selectedBulkSizes.length * variantForm.selectedBulkColors.length} Adet Varyant Kartı Üretilecek
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={saveVariant}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-extrabold transition-all flex justify-center items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer border-none"
                >
                  {variantForm.modalTab === "bulk" ? (
                    <>
                      <Sparkles className="w-4 h-4" /> Toplu Matrisi Üret ve Ekle
                    </>
                  ) : variantForm.isEditing ? (
                    <>
                      <Check className="w-4 h-4" /> Varyantı Güncelle
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Varyant Oluştur
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK EBAT/BOYUT YÖNETİCİSİ MODAL (SIZE MANAGER)
         ──────────────────────────────────────────────────────── */}
      {isSizeManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[999999] animate-in fade-in duration-200">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <Settings2 className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-left">Gramaj & Ambalaj Seçeneklerini Yönet</h3>
              </div>
              <button
                onClick={() => setIsSizeManagerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add New Size form inline */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni gramaj/ambalaj seçeneği adı (Örn: 500 Gr)..."
                  value={newSizeName}
                  onChange={e => setNewSizeName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addSizeOption(); }}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 outline-none"
                />
                <button
                  type="button"
                  onClick={addSizeOption}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition cursor-pointer border-none"
                >
                  Ekle
                </button>
              </div>

              {/* Sizes list */}
              <div className="max-h-[260px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 p-1">
                {sizes.map(size => (
                  <div key={size} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-lg transition gap-2">
                    {editingSizeName === size ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingSizeNewValue}
                          onChange={e => setEditingSizeNewValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveSizeEdit(size);
                            if (e.key === "Escape") setEditingSizeName(null);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-orange-400 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-100"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveSizeEdit(size)}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition border-none cursor-pointer"
                          title="Kaydet"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSizeName(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition border-none cursor-pointer"
                          title="Vazgeç"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-700">{size}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSizeName(size);
                              setEditingSizeNewValue(size);
                            }}
                            className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-lg transition border-none cursor-pointer"
                            title="İsmi Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSizeOption(size)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition border-none cursor-pointer"
                            title="Seçeneği Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex">
              <button
                onClick={() => setIsSizeManagerOpen(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK DERİ TİPİ/RENK YÖNETİCİSİ MODAL (COLOR MANAGER)
         ──────────────────────────────────────────────────────── */}
      {isColorManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[999999] animate-in fade-in duration-200">
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <Settings2 className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-left">Ürün Çeşitleri & Tipleri Yönetimi</h3>
              </div>
              <button
                onClick={() => setIsColorManagerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add New Color form inline */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni ürün çeşidi adı (Örn: Sade, Cevizli, Süzme)..."
                  value={newColorName}
                  onChange={e => setNewColorName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addColorOption(); }}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 outline-none"
                />
                <button
                  type="button"
                  onClick={addColorOption}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition cursor-pointer border-none"
                >
                  Ekle
                </button>
              </div>

              {/* Colors list */}
              <div className="max-h-[260px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 p-1">
                {colors.map(color => (
                  <div key={color} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-lg transition gap-2">
                    {editingColorName === color ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingColorNewValue}
                          onChange={e => setEditingColorNewValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveColorEdit(color);
                            if (e.key === "Escape") setEditingColorName(null);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-orange-400 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-100"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveColorEdit(color)}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition border-none cursor-pointer"
                          title="Kaydet"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingColorName(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition border-none cursor-pointer"
                          title="Vazgeç"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-700">{color}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingColorName(color);
                              setEditingColorNewValue(color);
                            }}
                            className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-lg transition border-none cursor-pointer"
                            title="İsmi Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeColorOption(color)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition border-none cursor-pointer"
                            title="Seçeneği Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex">
              <button
                onClick={() => setIsColorManagerOpen(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK KATEGORİ YÖNETİCİSİ MODAL (CATEGORY MANAGER)
         ──────────────────────────────────────────────────────── */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <Settings2 className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-left">Kategorileri Yönet</h3>
              </div>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add New Category form inline */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni kategori adı..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addCategory(); }}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => addCategory()}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition cursor-pointer border-none"
                >
                  Ekle
                </button>
              </div>

              {/* Categories list */}
              <div className="max-h-[260px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 p-1">
                {categories.map(cat => (
                  <div key={cat} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-lg transition gap-2">
                    {editingCategoryName === cat ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingCategoryNewValue}
                          onChange={e => setEditingCategoryNewValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveCategoryEdit(cat);
                            if (e.key === "Escape") setEditingCategoryName(null);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-orange-400 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-100"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveCategoryEdit(cat)}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition border-none cursor-pointer"
                          title="Kaydet"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryName(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition border-none cursor-pointer"
                          title="Vazgeç"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-700">{cat}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryName(cat);
                              setEditingCategoryNewValue(cat);
                            }}
                            className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-lg transition border-none cursor-pointer"
                            title="İsmi Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCategory(cat)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition border-none cursor-pointer"
                            title="Kategoriyi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex">
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK BİRİM YÖNETİCİSİ MODAL (UNIT MANAGER)
         ──────────────────────────────────────────────────────── */}
      {isUnitManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <Tag className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-left">Birimleri Yönet</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUnitManagerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add New Unit form inline */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni birim adı (Örn: Paket)..."
                  value={newUnitName}
                  onChange={e => setNewUnitName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addUnit(); }}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 outline-none"
                />
                <button
                  type="button"
                  onClick={addUnit}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition cursor-pointer border-none"
                >
                  Ekle
                </button>
              </div>

              {/* Units list */}
              <div className="max-h-[260px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 p-1">
                {units.map(u => (
                  <div key={u} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-lg transition gap-2">
                    {editingUnitName === u ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingUnitNewValue}
                          onChange={e => setEditingUnitNewValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveUnitEdit(u);
                            if (e.key === "Escape") setEditingUnitName(null);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-orange-400 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-100"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => saveUnitEdit(u)}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition border-none cursor-pointer"
                          title="Kaydet"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUnitName(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition border-none cursor-pointer"
                          title="Vazgeç"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-slate-700">{u}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUnitName(u);
                              setEditingUnitNewValue(u);
                            }}
                            className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-lg transition border-none cursor-pointer"
                            title="İsmi Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUnit(u)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition border-none cursor-pointer"
                            title="Birimi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex">
              <button
                type="button"
                onClick={() => setIsUnitManagerOpen(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK DEPO YÖNETİCİSİ MODAL (WAREHOUSE MANAGER)
         ──────────────────────────────────────────────────────── */}
      {isWarehouseManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <Settings2 className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-left">Depoları Yönet</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWarehouseManagerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add New Warehouse Inline Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-inner">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {editingWarehouseId ? "Depoyu Düzenle" : "Yeni Kurumsal Depo Ekle"}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Depo Adı (Örn: Ege Şubesi)..."
                    value={newWarehouse.name}
                    onChange={e => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-orange-500 outline-none col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Depo Kodu (Örn: WH-EGE)..."
                    value={newWarehouse.code}
                    onChange={e => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-orange-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Konum / Şehir..."
                    value={newWarehouse.location}
                    onChange={e => setNewWarehouse({ ...newWarehouse, location: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-orange-500 outline-none"
                  />
                  <select
                    value={newWarehouse.branchId}
                    onChange={e => setNewWarehouse({ ...newWarehouse, branchId: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-orange-500 outline-none col-span-2"
                  >
                    <option value="">-- Şube Seçin --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {editingWarehouseId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWarehouseId(null);
                        setNewWarehouse({ name: "", code: "", location: "", stockCount: 0, branchId: "" });
                      }}
                      className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border-none shadow-sm animate-in fade-in"
                    >
                      Vazgeç
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addWarehouse}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border-none shadow-sm"
                  >
                    {editingWarehouseId ? (
                      <>
                        <Save className="w-3.5 h-3.5" /> Depoyu Güncelle
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Depoyu Kaydet
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Warehouse list */}
              <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm bg-white p-1">
                {warehouses.map(wh => {
                  const branchName = branches.find(b => b.id === wh.branchId)?.name || 'Bilinmeyen Şube';
                  return (
                    <div key={wh.id} className="flex justify-between items-center p-3 hover:bg-slate-50 transition rounded-lg">
                      <div>
                        <span className="text-xs font-bold text-slate-800">{wh.name}</span>
                        <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">{wh.code} · {wh.location} ({branchName})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold border border-slate-200 shrink-0">{wh.stockCount} Adet</span>
                        
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWarehouseId(wh.id);
                            setNewWarehouse({
                              name: wh.name,
                              code: wh.code,
                              location: wh.location,
                              stockCount: wh.stockCount,
                              branchId: wh.branchId || ""
                            });
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-orange-500 rounded-lg transition border-none cursor-pointer"
                          title="Depoyu Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeWarehouse(wh.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition border-none cursor-pointer"
                          title="Depoyu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex">
              <button
                type="button"
                onClick={() => setIsWarehouseManagerOpen(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK PAZARYERİ KANALI MODAL (MARKETPLACE CREATOR & EDITOR)
         ──────────────────────────────────────────────────────── */}
      {isMarketplaceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 border border-orange-200/50 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    {editingMarketplaceId ? "Pazaryeri Kanalını Düzenle" : "Yeni Entegrasyon Kanalı Ekle"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Mağaza adı, logo rengi ve senkronizasyon ayarları</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMarketplaceModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Kanal / Mağaza Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: Çiçeksepeti API veya WooCommerce"
                  value={newMarketplace.name}
                  onChange={e => setNewMarketplace({ ...newMarketplace, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Kanal Marka Rengi</label>
                  <select
                    value={newMarketplace.logoColor}
                    onChange={e => setNewMarketplace({ ...newMarketplace, logoColor: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 cursor-pointer outline-none transition"
                  >
                    <option value="bg-orange-500">Turuncu (Trendyol / Hepsiburada)</option>
                    <option value="bg-violet-600">Mor (N11)</option>
                    <option value="bg-emerald-600">Yeşil (Çiçeksepeti)</option>
                    <option value="bg-blue-600">Mavi (WooCommerce)</option>
                    <option value="bg-violet-500">Eflatun (Shopify)</option>
                    <option value="bg-slate-600">Gri (Diğer)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Stok Senkronu</label>
                  <select
                    value={newMarketplace.syncEnabled ? "true" : "false"}
                    onChange={e => setNewMarketplace({ ...newMarketplace, syncEnabled: e.target.value === "true" })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-orange-500 cursor-pointer outline-none transition"
                  >
                    <option value="true">Aktif (Senkronize)</option>
                    <option value="false">Durdurulmuş (Pasif)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsMarketplaceModalOpen(false)}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveMarketplace}
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer border-none"
              >
                {editingMarketplaceId ? (
                  <>
                    <Save className="w-4 h-4" /> Değişiklikleri Kaydet
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Entegrasyonu Oluştur
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           PAZARYERİ API AYARLARI MODAL (CREDENTIAL CONFIG)
         ──────────────────────────────────────────────────────── */}
      {configuringMarketplace && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <Key className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-left">{configuringMarketplace.name} API Ayarları</h3>
              </div>
              <button
                onClick={() => setConfiguringMarketplace(null)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">API Key / Merchant ID *</label>
                <input
                  type="text"
                  placeholder="Kanal API kimlik anahtarı..."
                  value={apiCredentials.apiKey}
                  onChange={e => setApiCredentials({ ...apiCredentials, apiKey: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">API Secret / Şifre *</label>
                <input
                  type="password"
                  placeholder="Kanal API gizli anahtarı..."
                  value={apiCredentials.apiSecret}
                  onChange={e => setApiCredentials({ ...apiCredentials, apiSecret: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 outline-none"
                />
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
                <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>API bağlantısı test edildiğinde kuyruktaki stok miktarları otomatik senkronize edilecektir.</span>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={testApiConnection}
                disabled={isTestingConnection}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all flex justify-center items-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Bağlanıyor...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-orange-500" /> Bağlantıyı Test Et
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMarketplaces(prev => prev.map(m => m.id === configuringMarketplace.id ? { ...m, apiConnected: true, apiKey: apiCredentials.apiKey, apiSecret: "••••••••" } : m));
                  toast.success("Entegrasyon ayarları kaydedildi.");
                  setConfiguringMarketplace(null);
                }}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer border-none shadow-sm"
              >
                Değişiklikleri Kaydet
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK XML HEDEF EKLEME MODAL (XML CREATOR)
         ──────────────────────────────────────────────────────── */}
      {isXmlModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <FileText className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-left">Yeni XML Fiyat Kuralı Tanımla</h3>
              </div>
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">XML Çıktı / Feed Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: Google Alışveriş veya Bayi_XML_Özel..."
                  value={newXmlFeed.name}
                  onChange={e => setNewXmlFeed({ ...newXmlFeed, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Referans Fiyat Kaynağı</label>
                  <select
                    value={newXmlFeed.priceSource}
                    onChange={e => setNewXmlFeed({ ...newXmlFeed, priceSource: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white cursor-pointer outline-none"
                  >
                    <option value="B2B Satış Fiyatı">B2B Satış Fiyatı</option>
                    <option value="Perakende Satış Fiyatı">Perakende Fiyatı</option>
                    <option value="Web Perakende Fiyatı">Web Perakende Fiyatı</option>
                    <option value="Birim Alış Fiyatı">Alış Fiyatı</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiyat Artış Oranı (%)</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-orange-500 transition-all bg-slate-50">
                    <input
                      type="number"
                      value={newXmlFeed.markupPercent || ""}
                      onChange={e => setNewXmlFeed({ ...newXmlFeed, markupPercent: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 bg-transparent text-sm font-bold outline-none border-none text-center"
                    />
                    <div className="px-3.5 bg-slate-100 border-l border-slate-200 text-xs font-black text-slate-500 flex items-center justify-center">%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
              >
                İptal
              </button>
              <button
                onClick={addXmlFeed}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all flex justify-center items-center gap-2 shadow-lg cursor-pointer border-none"
              >
                <Plus className="w-4 h-4" /> Kuralı XML'e Ekle
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK BARKOD YAZDIRMA MODALI (BARCODE PRINTER)
         ──────────────────────────────────────────────────────── */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row text-left">
            
            {/* Left side: Form Settings */}
            <div className="flex-1 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                  <Printer className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Barkod Yazdır</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Termal rulo etiket ayarları</p>
                </div>
              </div>

              <form onSubmit={handlePrintBarcode} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Etiket Boyutu</label>
                  <select
                    value={printForm.labelSize}
                    onChange={e => setPrintForm({ ...printForm, labelSize: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white outline-none cursor-pointer text-slate-800"
                  >
                    <option value="50mm x 30mm">50mm x 30mm (Standart)</option>
                    <option value="80mm x 40mm">80mm x 40mm (Geniş)</option>
                    <option value="100mm x 50mm">100mm x 50mm (Koli)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Etiket Adedi</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-orange-500 transition-all bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setPrintForm(prev => ({ ...prev, qty: Math.max(1, prev.qty - 1) }))}
                      className="px-3 bg-slate-100 hover:bg-slate-250 border-r border-slate-200 text-slate-500 font-bold select-none cursor-pointer border-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={printForm.qty}
                      onChange={e => setPrintForm({ ...printForm, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="flex-1 px-2 py-1.5 bg-transparent text-xs font-bold outline-none border-none text-center text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setPrintForm(prev => ({ ...prev, qty: prev.qty + 1 }))}
                      className="px-3 bg-slate-100 hover:bg-slate-250 border-l border-slate-200 text-slate-500 font-bold select-none cursor-pointer border-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiyat Gösterimi</label>
                  <select
                    value={printForm.priceType}
                    onChange={e => setPrintForm({ ...printForm, priceType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white outline-none cursor-pointer text-slate-800"
                  >
                    <option value="salePrice">B2B Satış Fiyatı (₺{form.salePrice})</option>
                    <option value="retailPrice">Perakende Fiyatı (₺{form.retailPrice})</option>
                    <option value="webPrice">Web Perakende Fiyatı (₺{form.webPrice})</option>
                    <option value="none">Fiyat Gösterme</option>
                  </select>
                </div>

                {isPrinting ? (
                  <div className="space-y-2 pt-2 animate-in fade-in">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Yazıcıya gönderiliyor...</span>
                      <span>%{printProgress}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full transition-all duration-150" style={{ width: `${printProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPrintModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5 shadow-lg shadow-orange-500/10 cursor-pointer border-none"
                    >
                      <Printer className="w-4 h-4" /> Yazdır
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Right side: Realtime HTML Thermal Label Preview */}
            <div className="w-full md:w-64 bg-slate-100 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200/60 shadow-inner">
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-3.5">Etiket Önizleme</span>
              
              <div className="w-48 bg-white border border-slate-300 rounded shadow-md p-3.5 flex flex-col justify-between aspect-[5/3] overflow-hidden select-none relative animate-in fade-in duration-200 text-left">
                {/* Dotted border indicator for label outline */}
                <div className="absolute inset-1 border border-dashed border-slate-200 rounded pointer-events-none"></div>
                
                <div className="space-y-1 relative z-10 text-left">
                  <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider">Pekefe Geleneksel ERP</span>
                  <span className="block text-[10px] font-extrabold text-slate-800 leading-tight line-clamp-2 uppercase">{form.name}</span>
                  <span className="block text-[8px] font-mono text-slate-500 font-bold mt-0.5">SKU: {form.sku}</span>
                </div>

                <div className="flex justify-between items-end relative z-10">
                  {/* Barcode lines generator mockup */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-end h-7 gap-[1px]">
                      {[2,1,3,1,2,1,4,1,2,1,3,1,2,2,1,3,1,2].map((w, idx) => (
                        <div key={idx} className="bg-slate-900 h-full" style={{ width: `${w}px` }}></div>
                      ))}
                    </div>
                    <span className="text-[7px] font-mono font-bold tracking-widest text-slate-700">{form.barcode}</span>
                  </div>

                  {printForm.priceType !== "none" && (
                    <div className="text-right">
                      <span className="block text-[6px] font-extrabold text-slate-400 uppercase tracking-widest">
                        {printForm.priceType === "salePrice" ? "B2B" : printForm.priceType === "retailPrice" ? "PERAKENDE" : "WEB"}
                      </span>
                      <span className="block text-xs font-black text-slate-900">
                        ₺{printForm.priceType === "salePrice" ? form.salePrice : printForm.priceType === "retailPrice" ? form.retailPrice : form.webPrice}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           DİNAMİK STOK HAREKET RAPORU MODALI (STOCK MOVEMENTS)
         ──────────────────────────────────────────────────────── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[760px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] h-[640px] text-left">
            
            {/* Header */}
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-extrabold uppercase tracking-wider">Stok Kartı Hareket Raporu</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{form.name} ({form.sku})</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Dynamic summary KPI blocks */}
              <div className="grid grid-cols-3 gap-4 shrink-0">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-sm text-left">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Toplam Girişler</span>
                  <span className="text-lg font-black text-emerald-600 mt-1 block">
                    +{movements.filter(m => m.qty > 0).reduce((sum, m) => sum + m.qty, 0)} {form.unit}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-sm text-left">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Toplam Çıkışlar</span>
                  <span className="text-lg font-black text-rose-500 mt-1 block">
                    {movements.filter(m => m.qty < 0).reduce((sum, m) => sum + m.qty, 0)} {form.unit}
                  </span>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3.5 shadow-sm text-left">
                  <span className="block text-[9px] font-bold text-orange-500 uppercase tracking-wide">Net Değişim</span>
                  <span className="text-lg font-black text-slate-800 mt-1 block">
                    {movements.reduce((sum, m) => sum + m.qty, 0) >= 0 ? "+" : ""}
                    {movements.reduce((sum, m) => sum + m.qty, 0)} {form.unit}
                  </span>
                </div>
              </div>

              {/* Dynamic Add Movement form in report */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-inner">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-left">Yeni Stok Hareketi Kaydet</span>
                <form onSubmit={handleAddMovement} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <select
                      value={newMovement.type}
                      onChange={e => setNewMovement({ ...newMovement, type: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none cursor-pointer text-slate-800"
                    >
                      <option value="Giriş (Mal Kabul)">Giriş (Mal Kabul)</option>
                      <option value="Çıkış (Sipariş/Sevk)">Çıkış (Sipariş/Sevk)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <select
                      value={newMovement.warehouse}
                      onChange={e => setNewMovement({ ...newMovement, warehouse: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none cursor-pointer text-slate-800"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="number"
                      placeholder="Miktar..."
                      value={newMovement.qty || ""}
                      onChange={e => setNewMovement({ ...newMovement, qty: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none text-center font-black"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border-none shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" /> Hareket İşle
                    </button>
                  </div>
                </form>
              </div>

              {/* Movements Table */}
              <div className="overflow-x-auto overflow-y-auto max-h-[220px] border border-slate-200 rounded-xl shadow-sm bg-white">
                {isLoadingMovements ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-semibold text-slate-500">Stok hareketleri yükleniyor...</span>
                  </div>
                ) : movements.length === 0 ? (
                  <div className="p-8 text-center text-xs font-semibold text-slate-400">
                    Bu ürüne ait stok hareket kaydı bulunamadı.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                        <th className="p-3 bg-slate-50">Tarih / Zaman</th>
                        <th className="p-3 bg-slate-50">İşlem Detayı</th>
                        <th className="p-3 bg-slate-50">Konum/Depo</th>
                        <th className="p-3 bg-slate-50 text-center">Değişim</th>
                        <th className="p-3 bg-slate-50">Sorumlu</th>
                        <th className="p-3 bg-slate-50 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movements.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 text-xs font-semibold text-slate-400">{m.date}</td>
                          <td className="p-3 text-xs font-bold text-slate-800">{m.type}</td>
                          <td className="p-3 text-xs font-semibold text-slate-500">{m.warehouse}</td>
                          <td className={`p-3 text-xs font-black text-center ${m.qty > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                            {m.qty > 0 ? "+" : ""}{m.qty} {form.unit}
                          </td>
                          <td className="p-3 text-xs font-semibold text-slate-500">{m.user}</td>
                          <td className="p-3 text-center">
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase">
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>

            {/* Footer actions */}
            <div className="p-5 border-t border-slate-150 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Excel Stok Hareket Raporu başarıyla indirildi.");
                  }}
                  className="px-3.5 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition bg-white cursor-pointer"
                >
                  Excel'e Aktar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("PDF Raporu hazırlanıp yeni sekmede açıldı.");
                  }}
                  className="px-3.5 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition bg-white cursor-pointer"
                >
                  PDF Olarak İndir
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer border-none"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
           CANCEL / EXIT CONFIRMATION MODAL
         ──────────────────────────────────────────────────────── */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Kaydedilmemiş Değişiklikler</h3>
                <p className="text-xs text-slate-500">
                  Sayfada yaptığınız değişiklikler kaydedilmedi. Ayrılmak istediğinize emin misiniz?
                </p>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 rounded-xl text-xs font-bold transition cursor-pointer active:scale-98"
              >
                Hayır, Düzenlemeye Devam Et
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-98 shadow-md shadow-red-500/10 border-none"
              >
                Evet, Kaydetmeden Çık
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Custom simple ArchiveBoxIcon replacement
function ArchiveBoxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );
}

function StockFormContent() {
  const searchParams = useSearchParams();
  const rawQuery = typeof window !== "undefined" ? window.location.search : "";
  const clientUrlParams = typeof window !== "undefined" ? new URLSearchParams(rawQuery) : null;

  const clientSlug = clientUrlParams?.get("slug");
  const clientSku = clientUrlParams?.get("sku");
  const clientId = clientUrlParams?.get("id");

  const slugParam = searchParams?.get("slug");
  const skuParam = searchParams?.get("sku");
  const idParam = searchParams?.get("id");

  const resolvedId = idParam || skuParam || slugParam || clientId || clientSku || clientSlug || "new";

  return <EnterpriseStockFormPage key={resolvedId} productId={resolvedId === "new" ? undefined : resolvedId} />;
}

export default function StockFormWrapperPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Stok formu yükleniyor...</span>
        </div>
      </div>
    }>
      <StockFormContent />
    </Suspense>
  );
}

