"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

const STORAGE_KEY = "pekefe_cookie_consent_v1";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "";

export default function AnalyticsScripts() {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

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
    return () => window.removeEventListener("pekefe_cookie_consent_updated", handleConsentUpdate);
  }, []);

  if (!analyticsAllowed) return null;

  return (
    <>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="pekefe-ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
                anonymize_ip: true
              });
            `}
          </Script>
        </>
      )}

      {GTM_ID && (
        <Script id="pekefe-gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      )}
    </>
  );
}
