"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useProduct } from "@/context/ProductContext";
import { Link } from "@/navigation";
import { slugify, resolveProductImage } from "@/lib/utils";
import Image from "next/image";
import { Search } from "lucide-react";

interface SearchAutocompleteDropdownProps {
  searchTerm: string;
  onSelect: (productName: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchAutocompleteDropdown({
  searchTerm,
  onSelect,
  isOpen,
  onClose,
}: SearchAutocompleteDropdownProps) {
  const { products } = useProduct();
  const [results, setResults] = useState<any[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  // Only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && searchTerm.trim().length >= 3) {
      const query = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          (p.name ?? "").toLowerCase().includes(query) ||
          (p.sku ?? "").toLowerCase().includes(query) ||
          (p.category ?? "").toLowerCase().includes(query)
      );
      setResults(filtered.slice(0, 6));
    } else {
      setResults([]);
    }
  }, [searchTerm, products, isOpen]);

  // Recalculate position on open or searchTerm change
  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const updatePosition = () => {
      const parent = anchorRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 300),
        zIndex: 2147483647, // max possible z-index
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, searchTerm]);

  // Invisible anchor inside the relative container to measure position
  const anchor = (
    <div ref={anchorRef} className="absolute inset-0 pointer-events-none" aria-hidden />
  );

  if (!isOpen || searchTerm.trim().length < 3) return anchor;

  const dropdown = (
    <div
      style={dropdownStyle}
      className="bg-white dark:bg-[#0f1420] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 max-h-[350px] overflow-y-auto text-left animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {results.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
          {results.map((p) => {
            const imageUrl =
              resolveProductImage(p.image, p.images) ||
              "https://placehold.co/100x100?text=Pekefe";
            return (
              <Link
                key={p.id}
                href={`/products/${slugify(p.name)}`}
                onClick={() => {
                  onSelect(p.name);
                  onClose();
                }}
                className="flex items-center gap-3.5 p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition cursor-pointer group"
              >
                <div className="relative w-11 h-11 bg-slate-100 dark:bg-zinc-900 border border-slate-200/40 dark:border-zinc-800 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={imageUrl}
                    alt={p.name}
                    fill
                    className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 group-hover:text-amber-500 transition-colors truncate">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {p.category}
                    </span>
                    {p.sku && (
                      <>
                        <span className="text-slate-300 dark:text-zinc-700 text-[10px]">•</span>
                        <span className="text-[9px] text-slate-400 font-mono">{p.sku}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-amber-500 dark:text-amber-400 font-black mt-1">
                    {(p.price || 0).toLocaleString("tr-TR")} ₺
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-8 px-4 text-center">
          <div className="w-10 h-10 bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-2.5">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
            Aranılan kriterlere ait ürün bulunamadı.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {anchor}
      {mounted && createPortal(dropdown, document.body)}
    </>
  );
}
