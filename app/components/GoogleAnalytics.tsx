"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("pro1putt_cookie_consent");
    if (consent === "accepted") {
      setEnabled(true);
    }
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=DEINE_GA_ID"
        strategy="afterInteractive"
      />
      <Script id="ga-script" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-RGKHZL696C', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
