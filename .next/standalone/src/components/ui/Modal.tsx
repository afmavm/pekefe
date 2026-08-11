"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({ isOpen, open, onClose, title, children, maxWidth, size = "md" }: ModalProps) {
  const visible = isOpen ?? open ?? false;
  const widthClass = maxWidth ?? sizeMap[size];

  useEffect(() => {
    if (visible) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className={`bg-background rounded-2xl shadow-xl w-full ${widthClass} flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-border`}>
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
