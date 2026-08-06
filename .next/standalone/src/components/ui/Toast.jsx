"use client";

import React, { useEffect } from "react";

export function Toast({
  message,
  isOpen,
  type = "success", // success, error, info
  onClose,
  duration = 3000
}) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const bgClasses = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-error/5 border-error/20 text-error",
    info: "bg-surface-container-high border-outline-variant/30 text-on-surface"
  };

  const iconNames = {
    success: "check_circle",
    error: "error",
    info: "info"
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-xl border shadow-lg font-body-md text-xs font-semibold ${bgClasses[type]}`}
        role="status"
        aria-live="polite"
      >
        <span className="material-symbols-outlined text-[18px]">
          {iconNames[type]}
        </span>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="hover:opacity-80 ml-2 cursor-pointer flex items-center justify-center"
          aria-label="Bildirimi Kapat"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
