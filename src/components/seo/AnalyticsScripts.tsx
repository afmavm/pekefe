"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "pekefe_cookie_consent_v1";
const DEFAULT_GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-5G6JF6TV";
const DEFAULT_GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

const SAFE_ID_REGEX = /^(GTM-[A-Z0-9]+|G-[A-Z0-9]+|AW-[0-9]+)$/i;

function sanitizeTagId(val: unknown): string {
  if (!val || typeof val !== "string") return "";
  const cleaned = val.trim().toUpperCase();
  return SAFE_ID_REGEX.test(cleaned) ? cleaned : "";
}

export default function AnalyticsScripts() {
  const pathname = usePathname();
  const [gtmId, setGtmId] = useState<string>(sanitizeTagId(DEFAULT_GTM_ID));
  const [gaId, setGaId] = useState<string>(sanitizeTagId(DEFAULT_GA_ID));
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
        if (data.gtmId !== undefined) {
          setGtmId(sanitizeTagId(data.gtmId));
        }
        if (data.gaMeasurementId !== undefined) {
          setGaId(sanitizeTagId(data.gaMeasurementId));
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
  if (!gtmId && !gaId) return null;

  return (
    <>
      {gtmId && (
        <>
          <Script
            id="pekefe-gtm-loader"
            async
            src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
            strategy="afterInteractive"
          />
          <Script id="pekefe-gtm-datalayer" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
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
