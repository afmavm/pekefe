"use client";

import React, { useMemo } from "react";
import { 
  ChevronRight, ChevronDown, Layers, Edit, Trash2, Plus, 
  ArrowUp, ArrowDown, CornerDownRight, Move, ChevronLeft
} from "lucide-react";
import { CategoryDetail } from "@/context/ProductContext";

interface CategoryTreeProps {
  categories: CategoryDetail[];
  onEdit: (cat: CategoryDetail) => void;
  onDelete: (id: string) => void;
  onUpdateParent: (id: string, parentId: string | null) => void;
  onUpdateOrder?: (orderedIds: string[]) => void;
}

interface TreeItem extends CategoryDetail {
  children: TreeItem[];
  depth: number;
}

export default function CategoryTree({ 
  categories, 
  onEdit, 
  onDelete, 
  onUpdateParent,
  onUpdateOrder 
}: CategoryTreeProps) {

  // Build the hierarchical tree structure
  const treeData = useMemo(() => {
    const build = (parentId: string | null = null, depth = 0): TreeItem[] => {
      return categories
        .filter(cat => {
          if (parentId === null) {
            return !cat.parentId;
          }
          return cat.parentId === parentId;
        })
        .map(cat => ({
          ...cat,
          depth,
          children: build(cat.id, depth + 1)
        }));
    };
    return build(null);
  }, [categories]);

  // Flattened tree to help with sibling finding
  const flatTreeList = useMemo(() => {
    const list: { id: string; parentId?: string; prevSiblingId?: string; nextSiblingId?: string }[] = [];
    
    const traverse = (nodes: TreeItem[]) => {
      nodes.forEach((node, idx) => {
        const prevSiblingId = idx > 0 ? nodes[idx - 1].id : undefined;
        const nextSiblingId = idx < nodes.length - 1 ? nodes[idx + 1].id : undefined;
        
        list.push({
          id: node.id,
          parentId: node.parentId,
          prevSiblingId,
          nextSiblingId
        });
        
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(treeData);
    return list;
  }, [treeData]);

  // Helper functions for indentation/outdentation
  const handleIndent = (id: string) => {
    const item = flatTreeList.find(x => x.id === id);
    if (item && item.prevSiblingId) {
      // Make this item a child of its previous sibling
      onUpdateParent(id, item.prevSiblingId);
    }
  };

  const handleOutdent = (id: string) => {
    const item = flatTreeList.find(x => x.id === id);
    if (item && item.parentId) {
      // Find the parent's parentId to elevate this item
      const parentItem = flatTreeList.find(x => x.id === item.parentId);
      onUpdateParent(id, parentItem?.parentId || null);
    }
  };

  const renderNode = (node: TreeItem) => {
    const flatItem = flatTreeList.find(x => x.id === node.id);
    const canIndent = !!flatItem?.prevSiblingId;
    const canOutdent = !!node.parentId;

    return (
      <div key={node.id} className="space-y-2">
        {/* Category Row */}
        <div 
          className="flex items-center justify-between bg-white border border-zinc-200 hover:border-[#b45309] hover:shadow-md rounded-2xl p-4 transition-all duration-300 group"
          style={{ marginLeft: `${node.depth * 28}px` }}
        >
          <div className="flex items-center gap-3">
            {/* Visual connector lines for nested children */}
            {node.depth > 0 && (
              <CornerDownRight className="w-5 h-5 text-zinc-400 shrink-0" />
            )}
            
            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-100 shadow-sm shrink-0">
              <Layers className="w-5 h-5 group-hover:text-[#b45309] transition-colors" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-zinc-800 text-sm md:text-base">{node.name}</span>
                {node.children.length > 0 && (
                  <span className="bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full text-[9px] font-bold">
                    {node.children.length} Alt
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {node.attributes.length > 0 && (
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    {node.attributes.length} Kural • 
                  </span>
                )}
                {node.variants.length > 0 && (
                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">
                    {node.variants.join(", ")}
                  </span>
                )}
                {node.attributes.length === 0 && node.variants.length === 0 && (
                  <span className="text-[9px] font-medium text-zinc-400 italic">
                    Özellik tanımlanmamış
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center gap-2">
            {/* Indent / Outdent Controls */}
            <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
              <button 
                onClick={() => handleOutdent(node.id)}
                disabled={!canOutdent}
                title="Dışa Kaydır (Seviye Yükselt)"
                className={`p-1.5 rounded-md transition ${canOutdent ? 'text-zinc-600 hover:bg-white hover:text-zinc-900 shadow-sm' : 'text-zinc-300 cursor-not-allowed'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleIndent(node.id)}
                disabled={!canIndent}
                title="İçe Kaydır (Alt Kategori Yap)"
                className={`p-1.5 rounded-md transition ${canIndent ? 'text-zinc-600 hover:bg-white hover:text-[#b45309] shadow-sm' : 'text-zinc-300 cursor-not-allowed'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Sibling Reordering (Up/Down) */}
            <div className="flex items-center bg-zinc-50 rounded-lg p-0.5 border border-zinc-200">
              <button 
                onClick={() => {
                  if (flatItem?.prevSiblingId && onUpdateOrder) {
                    // Simple reordering logic
                    const currentIndex = categories.findIndex(x => x.id === node.id);
                    const prevIndex = categories.findIndex(x => x.id === flatItem.prevSiblingId);
                    const updated = [...categories];
                    // Swap
                    updated[currentIndex] = categories[prevIndex];
                    updated[prevIndex] = categories[currentIndex];
                    onUpdateOrder(updated.map(x => x.id));
                  }
                }}
                disabled={!flatItem?.prevSiblingId}
                className={`p-1.5 rounded-md transition ${flatItem?.prevSiblingId ? 'text-zinc-500 hover:bg-white hover:text-zinc-900 shadow-sm' : 'text-zinc-200 cursor-not-allowed'}`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => {
                  if (flatItem?.nextSiblingId && onUpdateOrder) {
                    const currentIndex = categories.findIndex(x => x.id === node.id);
                    const nextIndex = categories.findIndex(x => x.id === flatItem.nextSiblingId);
                    const updated = [...categories];
                    // Swap
                    updated[currentIndex] = categories[nextIndex];
                    updated[nextIndex] = categories[currentIndex];
                    onUpdateOrder(updated.map(x => x.id));
                  }
                }}
                disabled={!flatItem?.nextSiblingId}
                className={`p-1.5 rounded-md transition ${flatItem?.nextSiblingId ? 'text-zinc-500 hover:bg-white hover:text-zinc-900 shadow-sm' : 'text-zinc-200 cursor-not-allowed'}`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Edit / Delete Actions */}
            <button 
              onClick={() => onEdit(node)} 
              className="p-2 bg-zinc-50 text-zinc-500 hover:bg-zinc-900 hover:text-white rounded-xl border border-zinc-200 transition"
              title="Kategoriyi Düzenle"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(node.id)} 
              className="p-2 bg-amber-50 text-red-500 hover:bg-amber-600 hover:text-white rounded-xl border border-amber-100 transition"
              title="Kategoriyi Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Render children recursively */}
        {node.children.length > 0 && (
          <div className="space-y-2">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white border border-dashed border-zinc-300 rounded-3xl p-12 text-center text-zinc-400">
        <Layers className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-bold">Henüz kategori tanımlanmamış.</p>
        <p className="text-sm mt-1">Yeni kategori eklemek için sağ üstteki butona tıklayabilirsiniz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-200/80">
      {treeData.map(node => renderNode(node))}
    </div>
  );
}
