"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type AdminMode = "b2b" | "b2c" | "core";

interface AdminContextType {
  adminMode: AdminMode;
  setAdminMode: (mode: AdminMode) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminMode, setAdminMode] = useState<AdminMode>("core");

  // Sync with localStorage to persist mode on refresh
  useEffect(() => {
    const saved = localStorage.getItem("adminMode") as AdminMode;
    if (saved && ["b2b", "b2c", "core"].includes(saved)) {
      setAdminMode(saved);
    }
  }, []);

  const handleSetMode = (mode: AdminMode) => {
    setAdminMode(mode);
    localStorage.setItem("adminMode", mode);
  };

  return (
    <AdminContext.Provider value={{ adminMode, setAdminMode: handleSetMode }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
