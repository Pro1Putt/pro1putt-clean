import type { Metadata } from "next";
import TopBar from "./components/TopBar";
import SiteFooter from "./components/SiteFooter";
import "./globals.css";
import { Lato } from "next/font/google";

import Script from "next/script";
import GoogleAnalytics from "./components/GoogleAnalytics";
import CookieBanner from "./components/CookieBanner";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRO1PUTT – International Junior Golf Tournaments & Live Leaderboards",
  description:
    "PRO1PUTT hosts international junior golf tournaments, live leaderboards and pathways to world championship qualification.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
  },
};

const footerLinkStyle = {
  textDecoration: "none",
  fontWeight: 900,
  color: "#1e4620",
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={lato.className} style={{ background: "#f5f7f5", color: "#1a1a1a" }}>
        <TopBar />

        <main
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "28px 16px 40px",
          }}
        >
          {children}
        </main>

        <SiteFooter />

        {/* Sticky CTA (global, auto-hidden on register/leaderboard/admin/live/tournament pages) */}


        {typeof window !== "undefined" &&
          localStorage.getItem("pro1putt_cookie_consent") === "accepted" && (
            <>
              <Script strategy="afterInteractive" />
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
          )}

        <GoogleAnalytics />
        <CookieBanner />
      </body>
    </html>
  );
}