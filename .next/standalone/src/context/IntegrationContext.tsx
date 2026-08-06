"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface Integration {
  id: string;
  name: string;
  type: "Marketplace" | "Supplier" | "Bank" | "Courier";
  status: "Aktif" | "Pasif" | "Hata";
  lastSync?: string;
  logo: string;
  settings?: any;
}

interface IntegrationContextType {
  integrations: Integration[];
  logs: any[];
  updateIntegrationStatus: (id: string, status: Integration["status"]) => void;
  updateIntegrationSettings: (id: string, settings: any) => void;
  syncIntegration: (id: string) => Promise<void>;
  fetchLogs: () => Promise<void>;
}

// Initial mock, overridden by database
const initialIntegrations: Integration[] = [];

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

export function IntegrationProvider({ children }: { children: React.ReactNode }) {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchIntegrations();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/integrations/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setIntegrations(data);
        } else {
          // If no integrations in DB, seed defaults
          const defaults: Integration[] = [
            { id: "INT-001", name: "Trendyol", type: "Marketplace", status: "Pasif", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Trendyol_logo.svg/1024px-Trendyol_logo.svg.png" },
            { id: "INT-002", name: "Hepsiburada", type: "Marketplace", status: "Pasif", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Hepsiburada_logo_official.svg/1200px-Hepsiburada_logo_official.svg.png" }
          ];
          setIntegrations(defaults);
          defaults.forEach(d => saveToDatabase(d));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveToDatabase = async (integration: Integration) => {
    try {
      await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateIntegrationStatus = (id: string, status: Integration["status"]) => {
    const updated = integrations.map(i => i.id === id ? { ...i, status } : i);
    setIntegrations(updated);
    const item = updated.find(i => i.id === id);
    if (item) saveToDatabase(item);
  };

  const updateIntegrationSettings = (id: string, settings: any) => {
    const updated = integrations.map(i => i.id === id ? { ...i, settings } : i);
    setIntegrations(updated);
    const item = updated.find(i => i.id === id);
    if (item) saveToDatabase(item);
  };

  const syncIntegration = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    try {
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: integration.name })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const item = integrations.find(i => i.id === id);
        if (item) {
          const updatedItem = { ...item, lastSync: new Date().toLocaleString('tr-TR'), status: "Aktif" as const };
          setIntegrations(integrations.map(i => i.id === id ? updatedItem : i));
          saveToDatabase(updatedItem);
        }
        toast.success(data.message || "Senkronizasyon başarılı.");
        await fetchLogs();
      } else {
        toast.error("Hata: " + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Senkronizasyon sırasında bir hata oluştu.");
    }
  };

  return (
    <IntegrationContext.Provider value={{ integrations, logs, updateIntegrationStatus, updateIntegrationSettings, syncIntegration, fetchLogs }}>
      {children}
    </IntegrationContext.Provider>
  );
}

export function useIntegration() {
  const context = useContext(IntegrationContext);
  if (context === undefined) throw new Error("useIntegration must be used within IntegrationProvider");
  return context;
}
