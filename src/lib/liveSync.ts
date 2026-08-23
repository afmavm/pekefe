"use client";

import { useEffect, useRef } from "react";

const CHANNEL_NAME = "pekefe_live_sync_channel";

/**
 * Notifies all browser tabs and client windows that a specific entity changed.
 */
export function notifyLiveSync(type: string = "all") {
  if (typeof window === "undefined") return;

  try {
    window.dispatchEvent(new CustomEvent("pekefe_data_changed", { detail: { type, timestamp: Date.now() } }));

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type, timestamp: Date.now() });
      channel.close();
    }
  } catch (err) {
    console.error("[LIVE SYNC] Broadcast error:", err);
  }
}

/**
 * React Hook to safely subscribe to real-time administrative changes without re-render memory leaks.
 */
export function useLiveSync(onSyncNeeded: (type: string) => void) {
  const cbRef = useRef(onSyncNeeded);
  useEffect(() => {
    cbRef.current = onSyncNeeded;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer: any = null;
    const safeSync = (type: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (cbRef.current) cbRef.current(type);
      }, 500);
    };

    const handleLocalSync = (e: any) => safeSync(e.detail?.type || "all");

    window.addEventListener("pekefe_data_changed", handleLocalSync);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("pekefe_data_changed", handleLocalSync);
    };
  }, []);
}
