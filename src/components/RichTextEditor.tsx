"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Bold, Italic, Underline, Link as LinkIcon, Image as ImageIcon, Heading, Quote, Table, Check, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, RefreshCw } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  insertFields?: { label: string; tag: string }[];
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "İçeriği buraya yazıp biçimlendirebilirsiniz...",
  insertFields
}: RichTextEditorProps) {
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
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(cmd, false, arg);
    saveSelection();
    handleInput();
  };

  const applyStyle = (styleName: string, styleValue: string) => {
    editorRef.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      exec(styleName === "fontSize" ? "fontSize" : "fontName", styleValue);
      return;
    }

    document.execCommand("styleWithCSS", false, "true");
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    if (styleName === "fontSize") {
      span.style.fontSize = styleValue;
    } else if (styleName === "fontFamily") {
      span.style.fontFamily = styleValue;
    }
    
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } catch (err) {
      document.execCommand(styleName === "fontSize" ? "fontSize" : "fontName", false, styleValue);
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
    const useUrl = window.confirm("Görseli web URL adresi ile eklemek için TAMAM'a tıklayın. Cihazınızdan yerel bir dosya yüklemek için İPTAL'e tıklayın.");
    if (useUrl) {
      const url = prompt("Görselin URL adresini girin:", "https://");
      if (url) insertHTML(`<img src="${url}" alt="Resim" style="max-width:100%;border-radius:12px;margin:12px 0;display:block;" />`);
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
        insertHTML(`<img src="${data.url}" alt="${file.name}" style="max-width:100%;border-radius:12px;margin:12px 0;display:block;" />`);
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
    insertHTML(`<table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0"><thead><tr style="background:#f8fafc"><th style="border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13px;font-weight:bold;">Sütun 1</th><th style="border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13px;font-weight:bold;">Sütun 2</th><th style="border:1px solid #cbd5e1;padding:10px;text-align:left;font-size:13px;font-weight:bold;">Sütun 3</th></tr></thead><tbody><tr><td style="border:1px solid #e2e8f0;padding:10px;font-size:13px">Hücre 1</td><td style="border:1px solid #e2e8f0;padding:10px;font-size:13px">Hücre 2</td><td style="border:1px solid #e2e8f0;padding:10px;font-size:13px">Hücre 3</td></tr><tr><td style="border:1px solid #e2e8f0;padding:10px;font-size:13px">Hücre 4</td><td style="border:1px solid #e2e8f0;padding:10px;font-size:13px">Hücre 5</td><td style="border:1px solid #e2e8f0;padding:10px;font-size:13px">Hücre 6</td></tr></tbody></table>`);
  };

  // Formats and cleans pasted rich text while strictly preserving styles, headings, tables, links, colors, and lists
  const processPastedHtml = (rawHtml: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, "text/html");

      // 1. Remove dangerous and layout-breaking tags
      const dangerousTags = ["script", "style", "meta", "link", "title", "noscript", "xml", "object", "embed", "iframe"];
      dangerousTags.forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
      });

      // 2. Remove MS Word specific comments and wrappers
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
      const commentsToRemove: Node[] = [];
      while (walker.nextNode()) {
        commentsToRemove.push(walker.currentNode);
      }
      commentsToRemove.forEach(c => c.parentNode?.removeChild(c));

      // 3. Normalize all elements to preserve rich formatting
      doc.querySelectorAll("*").forEach(el => {
        // Strip out mso classes or office attributes
        const className = el.getAttribute("class");
        if (className && (className.includes("Mso") || className.includes("WordSection"))) {
          el.removeAttribute("class");
        }

        // Clean useless mso attributes
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith("o:") || attr.name.startsWith("w:") || attr.name.startsWith("v:") || attr.name.startsWith("mso-")) {
            el.removeAttribute(attr.name);
          }
        });

        // Ensure images are responsive & styled
        if (el.tagName.toLowerCase() === "img") {
          const img = el as HTMLImageElement;
          img.style.maxWidth = "100%";
          img.style.height = "auto";
          img.style.borderRadius = "8px";
          img.style.margin = "10px 0";
          img.style.display = "inline-block";
        }

        // Ensure tables have visible borders and spacing
        if (el.tagName.toLowerCase() === "table") {
          const tbl = el as HTMLTableElement;
          tbl.style.width = tbl.style.width || "100%";
          tbl.style.borderCollapse = "collapse";
          tbl.style.margin = "12px 0";
          if (!tbl.style.border) tbl.style.border = "1px solid #cbd5e1";
        }
        if (el.tagName.toLowerCase() === "td" || el.tagName.toLowerCase() === "th") {
          const cell = el as HTMLTableCellElement;
          cell.style.padding = cell.style.padding || "8px 12px";
          cell.style.border = cell.style.border || "1px solid #e2e8f0";
        }

        // Ensure links open safely
        if (el.tagName.toLowerCase() === "a") {
          const a = el as HTMLAnchorElement;
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
          a.style.color = a.style.color || "#d97706";
          a.style.textDecoration = "underline";
        }
      });

      return doc.body.innerHTML;
    } catch (err) {
      console.error("HTML parse error on paste:", err);
      return rawHtml;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const htmlData = clipboardData.getData("text/html");
    const plainText = clipboardData.getData("text/plain");

    if (htmlData && htmlData.trim().length > 0) {
      const formattedHtml = processPastedHtml(htmlData);
      insertHTML(formattedHtml);
    } else if (plainText && plainText.length > 0) {
      // Convert plain text newlines to rich paragraphs / breaks
      const formattedPlain = plainText
        .split(/\r?\n\r?\n/)
        .map(p => `<p style="margin: 6px 0;">${p.replace(/\r?\n/g, "<br/>")}</p>`)
        .join("");
      insertHTML(formattedPlain);
    }
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

  const ToolButton = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button" 
      onMouseDown={e => { e.preventDefault(); restoreSelection(); }}
      onClick={onClick} 
      title={title}
      className="p-1.5 hover:bg-slate-200/80 rounded-lg transition text-slate-600 cursor-pointer border-none bg-transparent flex items-center justify-center"
    >
      {children}
    </button>
  );

  const Separator = () => <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col focus-within:border-orange-400 transition-colors">
      
      {/* ── TOOLBAR ── */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap gap-y-1.5 gap-x-1 items-center select-none">
        
        {/* Dynamic Insert Fields */}
        {insertFields && insertFields.length > 0 && (
          <>
            <div className="relative group shrink-0">
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition text-slate-700"
              >
                Alan Ekle <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 hidden group-hover:block">
                {insertFields.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => insertHTML(`<strong>${item.tag}</strong>`)}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition border-none cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Heading Style Select */}
        <select 
          onFocus={saveSelection}
          onChange={e => {
            exec("formatBlock", e.target.value);
            e.target.value = "p";
          }}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none cursor-pointer text-slate-700 hover:border-slate-350 transition"
        >
          <option value="p">Normal Paragraf</option>
          <option value="h1">Büyük Başlık (H1)</option>
          <option value="h2">Orta Başlık (H2)</option>
          <option value="h3">Alt Başlık (H3)</option>
          <option value="h4">Küçük Başlık (H4)</option>
        </select>

        {/* Font Size Select */}
        <select 
          onFocus={saveSelection}
          onChange={e => {
            applyStyle("fontSize", e.target.value);
            e.target.value = "";
          }}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none cursor-pointer text-slate-700 hover:border-slate-350 transition"
        >
          <option value="">Yazı Boyutu</option>
          <option value="12px">Küçük (12px)</option>
          <option value="14px">Normal (14px)</option>
          <option value="16px">Orta (16px)</option>
          <option value="18px">Büyük (18px)</option>
          <option value="24px">Çok Büyük (24px)</option>
          <option value="32px">Manşet (32px)</option>
        </select>

        {/* Font Family Select */}
        <select 
          onFocus={saveSelection}
          onChange={e => {
            applyStyle("fontFamily", e.target.value);
            e.target.value = "";
          }}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none cursor-pointer text-slate-700 hover:border-slate-350 transition"
        >
          <option value="">Yazı Tipi</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Inter, sans-serif">Inter</option>
          <option value="Roboto, sans-serif">Roboto</option>
          <option value="Times New Roman, serif">Times New Roman</option>
          <option value="Courier New, monospace">Courier New</option>
        </select>

        <Separator />

        {/* Undo / Redo */}
        <ToolButton onClick={() => exec("undo")} title="Geri Al">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </ToolButton>
        <ToolButton onClick={() => exec("redo")} title="Yinele">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </ToolButton>

        <Separator />

        {/* Text Actions */}
        <ToolButton onClick={() => exec("bold")} title="Kalın (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("italic")} title="İtalik (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("underline")} title="Altı Çizili (Ctrl+U)">
          <Underline className="w-4 h-4" />
        </ToolButton>

        <Separator />

        {/* Lists */}
        <ToolButton onClick={() => exec("insertUnorderedList")} title="Madde İşaretli Liste">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" x2="21" y1="6" y2="6"/><line x1="9" x2="21" y1="12" y2="12"/><line x1="9" x2="21" y1="18" y2="18"/><line x1="5" x2="5.01" y1="6" y2="6"/><line x1="5" x2="5.01" y1="12" y2="12"/><line x1="5" x2="5.01" y1="18" y2="18"/></svg>
        </ToolButton>
        <ToolButton onClick={() => exec("insertOrderedList")} title="Numaralı Liste">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </ToolButton>

        <Separator />

        {/* Alignment */}
        <ToolButton onClick={() => exec("justifyLeft")} title="Sola Hizala">
          <AlignLeft className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("justifyCenter")} title="Ortala">
          <AlignCenter className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("justifyRight")} title="Sağa Hizala">
          <AlignRight className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("justifyFull")} title="İki Yana Yasla">
          <AlignJustify className="w-4 h-4" />
        </ToolButton>

        <Separator />

        {/* Color pickers */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-0.5 bg-white shrink-0">
          <Type className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="color"
            title="Yazı Rengi"
            onFocus={saveSelection}
            onChange={e => exec("foreColor", e.target.value)}
            className="w-4 h-4 p-0 border border-slate-200 rounded cursor-pointer bg-transparent"
          />
          <div className="h-3 w-px bg-slate-200 mx-1" />
          <span className="w-3.5 h-3.5 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center text-[9px] font-bold text-slate-500">V</span>
          <input
            type="color"
            title="Vurgu Arkaplan Rengi"
            onFocus={saveSelection}
            onChange={e => exec("backColor", e.target.value)}
            className="w-4 h-4 p-0 border border-slate-200 rounded cursor-pointer bg-transparent"
          />
        </div>

        <Separator />

        {/* Insert Elements */}
        <ToolButton onClick={handleLinkClick} title="Bağlantı URL Ekle">
          <LinkIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={handleImageClick} title="Görsel / Fotoğraf Ekle">
          <ImageIcon className="w-4 h-4" />
        </ToolButton>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        <ToolButton onClick={() => exec("formatBlock", "blockquote")} title="Alıntı Ekle">
          <Quote className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={insertTable} title="Tablo Ekle">
          <Table className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => exec("removeFormat")} title="Formatı Temizle">
          <RefreshCw className="w-4 h-4" />
        </ToolButton>

        <Separator />

        {/* Toggle Source Mode */}
        <button
          type="button"
          onClick={() => setIsSourceMode(v => !v)}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer border ${
            isSourceMode
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
          }`}
          title="HTML Kaynak Kodu Düzenle"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Kaynak
        </button>
      </div>

      {/* ── EDITOR AREA ── */}
      <div className="relative bg-white flex-1 min-h-[350px]">
        {isSourceMode ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full min-h-[350px] p-4 font-mono text-xs bg-slate-900 text-green-400 outline-none border-none resize-y leading-relaxed text-left"
            dir="ltr"
            placeholder="HTML kaynak kodunu buraya yazabilirsiniz..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onPaste={handlePaste}
            onBlur={() => { saveSelection(); handleInput(); }}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[350px] p-4 text-sm text-slate-800 outline-none overflow-y-auto leading-relaxed text-left prose prose-zinc dark:prose-invert max-w-none"
            dir="ltr"
            style={{ minHeight: "350px", direction: "ltr", textAlign: "left" }}
          />
        )}
        
        {/* Placeholder Overlay */}
        {!isSourceMode && !value && (
          <div className="absolute top-4 left-4 text-slate-400 text-xs pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
