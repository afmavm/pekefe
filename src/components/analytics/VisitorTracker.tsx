"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "pekefe_vid";
const SESSION_SOURCE_KEY = "pekefe_vsrc_logged";
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
    return "";
  }
}

function hasCampaignParams(search: string): boolean {
  if (!search) return false;
  return /(?:gclid|gbraid|wbraid|gad_source|fbclid|utm_source)=/i.test(search);
}

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);
  const lastTrackedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const sendPing = (type: "pageview" | "heartbeat") => {
      try {
        const visitorId = getOrCreateVisitorId();
        const search = typeof window !== "undefined" ? window.location.search || "" : "";
        const referrer = typeof document !== "undefined" ? document.referrer || "" : "";

        let isSessionEntry = false;
        if (type === "pageview") {
          try {
            const alreadyLogged = window.sessionStorage.getItem(SESSION_SOURCE_KEY) === "1";
            if (!alreadyLogged || hasCampaignParams(search)) {
              isSessionEntry = true;
              window.sessionStorage.setItem(SESSION_SOURCE_KEY, "1");
            }
          } catch {
            isSessionEntry = true;
          }
        }

        const payload = JSON.stringify({
          visitorId,
          path: pathname,
          type,
          referrer: isSessionEntry ? referrer : "",
          search: isSessionEntry ? search : "",
          isSessionEntry,
        });

        fetch("/api/analytics/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Silently ignore network errors
        });
      } catch {
        // ignore
      }
    };

    const now = Date.now();
    if (lastTrackedPathRef.current !== pathname || now - lastTrackedAtRef.current > 2500) {
      lastTrackedPathRef.current = pathname;
      lastTrackedAtRef.current = now;
      sendPing("pageview");
    }

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
