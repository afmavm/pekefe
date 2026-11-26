"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "pekefe_vid";
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds

function getOrCreateVisitorId(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().replace(/-/g, "")
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(VISITOR_ID_KEY, generated);
    return generated;
  } catch {
    // Fallback if localStorage is disabled (private mode)
    return "";
  }
}

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);
  const lastTrackedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!pathname) return;
    // Never track admin panel or internal routes as storefront visitors
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const sendPing = (type: "pageview" | "heartbeat") => {
      try {
        const visitorId = getOrCreateVisitorId();
        const payload = JSON.stringify({
          visitorId,
          path: pathname,
          type,
        });

        fetch("/api/analytics/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Silently ignore network errors so storefront UX is never affected
        });
      } catch {
        // ignore
      }
    };

    const now = Date.now();
    // Avoid React Strict Mode double-fire on mount
    if (lastTrackedPathRef.current !== pathname || now - lastTrackedAtRef.current > 2500) {
      lastTrackedPathRef.current = pathname;
      lastTrackedAtRef.current = now;
      sendPing("pageview");
    }

    // Periodic heartbeat while tab is visible to keep "Anlık" online count accurate
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        sendPing("heartbeat");
      }
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendPing("heartbeat");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
