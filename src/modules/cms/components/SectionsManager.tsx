"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, ChevronRight } from "lucide-react";
import { SectionBlock } from "../types";

interface SectionsManagerProps {
  sections: SectionBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onReorder: (newSections: SectionBlock[]) => void;
}

function SortableSectionRow({
  section,
  isSelected,
  onSelect,
  onToggleVisible,
}: {
  section: SectionBlock;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition border ${
        isSelected
          ? "bg-orange-500/5 border-[#f97316]/20"
          : "hover:bg-slate-50 border-transparent"
      } ${isDragging ? "shadow-lg bg-white" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-slate-350 hover:text-slate-500 cursor-grab active:cursor-grabbing p-0.5 shrink-0"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <span className="text-base shrink-0 leading-none">{section.icon}</span>

      <span
        className={`flex-1 text-[13px] font-semibold truncate ${
          isSelected ? "text-[#f97316]" : "text-slate-700"
        }`}
      >
        {section.label}
      </span>

      {isSelected && <ChevronRight className="w-3.5 h-3.5 text-[#f97316] shrink-0" />}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisible();
        }}
        className={`p-1 rounded transition shrink-0 ${
          section.visible
            ? "text-slate-400 hover:text-slate-700 hover:bg-slate-150"
            : "text-slate-300 hover:text-slate-500"
        }`}
        title={section.visible ? "Gizle" : "Göster"}
      >
        {section.visible ? (
          <Eye className="w-3.5 h-3.5" />
        ) : (
          <EyeOff className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

export default function SectionsManager({
  sections,
  selectedId,
  onSelect,
  onToggleVisible,
  onReorder,
}: SectionsManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = sections.findIndex((s) => s.id === active.id);
      const newIdx = sections.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(sections, oldIdx, newIdx);
      onReorder(reordered);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3.5 border-b border-slate-100 shrink-0">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Sayfa Yerleşim Sıralaması
        </h2>
        <p className="text-[9px] text-slate-500 mt-0.5 font-bold">
          Bölümleri sürükleyerek sıralayın
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableSectionRow
                key={section.id}
                section={section}
                isSelected={selectedId === section.id}
                onSelect={() => onSelect(section.id)}
                onToggleVisible={() => onToggleVisible(section.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
