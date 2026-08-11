"use client";

import React, { useEffect, useRef } from "react";

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = "right" // right, left, bottom
}) {
  const drawerRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionClasses = {
    right: "top-0 right-0 h-full w-full sm:max-w-md animate-slide-in-right",
    left: "top-0 left-0 h-full w-full sm:max-w-md animate-slide-in-left",
    bottom: "bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl animate-slide-in-bottom"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-[#111C2D]/40 backdrop-blur-[3px] transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`absolute bg-white shadow-xl flex flex-col z-10 border-l border-outline-variant/10 ${positionClasses[position]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
          <h2 id="drawer-title" className="font-display-lg text-primary text-base font-bold uppercase tracking-wider">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center p-1"
            aria-label="Kapat"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 font-body-md text-sm text-on-surface">
          {children}
        </div>
      </div>
    </div>
  );
}
