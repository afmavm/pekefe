"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "pekefe_cookie_consent_v1";
const DEFAULT_GTM_IDS = process.env.NEXT_PUBLIC_GTM_ID || "GTM-MVFDVLJL, GTM-5G6JF6TV";
const DEFAULT_GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

const SAFE_GTM_REGEX = /^GTM-[A-Z0-9]+$/i;
const SAFE_GA_REGEX = /^(G-[A-Z0-9]+|AW-[0-9]+)$/i;

function parseGtmIds(val: unknown): string[] {
  if (!val || typeof val !== "string") return [];
  const parts = val
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => SAFE_GTM_REGEX.test(s));
  return Array.from(new Set(parts));
}

function sanitizeGaId(val: unknown): string {
  if (!val || typeof val !== "string") return "";
  const cleaned = val.trim().toUpperCase();
  return SAFE_GA_REGEX.test(cleaned) ? cleaned : "";
}

export default function AnalyticsScripts() {
  const pathname = usePathname();
  const [gtmIds, setGtmIds] = useState<string[]>(parseGtmIds(DEFAULT_GTM_IDS));
  const [gaId, setGaId] = useState<string>(sanitizeGaId(DEFAULT_GA_ID));
  const [gtmEnabled, setGtmEnabled] = useState<boolean>(true);
  const [requireConsent, setRequireConsent] = useState<boolean>(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState<boolean>(false);

  // Yönetim panelinden (Admin > SEO > Google Tag Manager & Analitik) güncel ayarları çek
  useEffect(() => {
    let mounted = true;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data || data.error) return;
        if (data.gtmId !== undefined && data.gtmId !== null) {
          const parsed = parseGtmIds(String(data.gtmId));
          setGtmIds(parsed);
        }
        if (data.gaMeasurementId !== undefined) {
          setGaId(sanitizeGaId(data.gaMeasurementId));
        }
        if (data.gtmEnabled !== undefined) {
          setGtmEnabled(
            data.gtmEnabled === true ||
              data.gtmEnabled === "true" ||
              data.gtmEnabled === 1 ||
              data.gtmEnabled === "1"
          );
        }
        if (data.gtmRequireConsent !== undefined) {
          setRequireConsent(
            data.gtmRequireConsent === true ||
              data.gtmRequireConsent === "true" ||
              data.gtmRequireConsent === 1 ||
              data.gtmRequireConsent === "1"
          );
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Çerez onayı takibi (KVKK modu aktifse)
  useEffect(() => {
    const checkConsent = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setAnalyticsAllowed(Boolean(parsed.analytics));
        }
      } catch {}
    };

    checkConsent();

    const handleConsentUpdate = (e: any) => {
      if (e?.detail) {
        setAnalyticsAllowed(Boolean(e.detail.analytics));
      } else {
        checkConsent();
      }
    };

    window.addEventListener("pekefe_cookie_consent_updated", handleConsentUpdate);
    return () =>
      window.removeEventListener("pekefe_cookie_consent_updated", handleConsentUpdate);
  }, []);

  // Yönetim paneli trafiğini analitiğe karıştırma
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/muhasebe")) {
    return null;
  }

  if (!gtmEnabled) return null;
  if (requireConsent && !analyticsAllowed) return null;
  if (gtmIds.length === 0 && !gaId) return null;

  return (
    <>
      {gtmIds.length > 0 && (
        <>
          <Script id="pekefe-gtm-datalayer" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
            `}
          </Script>
          {gtmIds.map((id) => (
            <React.Fragment key={id}>
              <Script
                id={`pekefe-gtm-loader-${id}`}
                async
                src={`https://www.googletagmanager.com/gtm.js?id=${id}`}
                strategy="afterInteractive"
              />
              <noscript>
                <iframe
                  src={`https://www.googletagmanager.com/ns.html?id=${id}`}
                  height="0"
                  width="0"
                  style={{ display: "none", visibility: "hidden" }}
                />
              </noscript>
            </React.Fragment>
          ))}
        </>
      )}

      {gaId && (
        <>
          <Script
            id="pekefe-ga4-loader"
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="pekefe-ga4-config" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
                anonymize_ip: true
              });
            `}
          </Script>
        </>
      )}
    </>
  );
}
