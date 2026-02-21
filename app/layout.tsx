import TopBar from "./components/TopBar";
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
    <html lang="de">
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

        {/* Footer (clean + mobile-friendly) */}
        <footer
          style={{
            borderTop: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "18px 16px",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>
              © {new Date().getFullYear()} PRO1PUTT
            </div>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <a href="/impressum" style={footerLinkStyle}>
                Impressum
              </a>
              <span style={{ opacity: 0.35 }}>•</span>
              <a href="/datenschutz" style={footerLinkStyle}>
                Datenschutz
              </a>
              <span style={{ opacity: 0.35 }}>•</span>
              <a href="/agb" style={footerLinkStyle}>
                AGB
              </a>
            </div>
          </div>
        </footer>

        {/* Sticky CTA (global, auto-hidden on register/leaderboard/admin/live/tournament pages) */}
        <StickyCta />

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