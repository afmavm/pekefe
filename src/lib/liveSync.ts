"use client";

import { useEffect } from "react";

const CHANNEL_NAME = "pekefe_live_sync_channel";

/**
 * Notifies all browser tabs and client windows that a specific entity changed.
 * Types: "products" | "stock" | "categories" | "settings" | "orders" | "all"
 */
export function notifyLiveSync(type: string = "all") {
  if (typeof window === "undefined") return;

  try {
    // 1. Dispatch local window event
    window.dispatchEvent(new CustomEvent("pekefe_data_changed", { detail: { type, timestamp: Date.now() } }));

    // 2. Broadcast across browser tabs
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type, timestamp: Date.now() });
      channel.close();
    }

    // 3. Fallback localStorage trigger
    localStorage.setItem("pekefe_last_sync", `${type}_${Date.now()}`);
  } catch (err) {
    console.error("[LIVE SYNC] Broadcast error:", err);
  }
}

/**
 * React Hook to subscribe to real-time administrative changes
 */
export function useLiveSync(onSyncNeeded: (type: string) => void, dependencies: any[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Local custom event listener
    const handleLocalSync = (e: any) => {
      onSyncNeeded(e.detail?.type || "all");
    };

    // BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type) {
          onSyncNeeded(event.data.type);
        }
      };
    }

    // Window focus listener (re-fetch when user returns to tab)
    const handleFocus = () => {
      onSyncNeeded("focus");
    };

    window.addEventListener("pekefe_data_changed", handleLocalSync);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("pekefe_data_changed", handleLocalSync);
      window.removeEventListener("focus", handleFocus);
      if (channel) {
        channel.close();
      }
    };
  }, dependencies);
}
