import type { Metadata } from "next";
import "./globals.css";
import { Lato } from "next/font/google";
import StickyCta from "./components/StickyCta";
import Script from "next/script";
import GoogleAnalytics from "./components/GoogleAnalytics";
import CookieBanner from "./components/CookieBanner";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRO1PUTT Scoring",
  description: "PRO1PUTT Tournament Registration & Live Scoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={lato.className} style={{ background: "#f5f7f5", color: "#1a1a1a" }}>
        {/* Top Bar */}{/* Page Container */}
        <main
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "28px 16px 60px",
          }}
        >
          {children}
        </main>

        {/* Sticky CTA (global, auto-hidden on register/leaderboard/admin/live/tournament pages) */}
        <StickyCta />
        {typeof window !== "undefined" &&
  localStorage.getItem("pro1putt_cookie_consent") === "accepted" && (
    <>
      <Script
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
  )}
<GoogleAnalytics />
<CookieBanner />
      </body>
    </html>
  );
}