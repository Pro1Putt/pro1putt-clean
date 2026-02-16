import type { Metadata } from "next";
import "./globals.css";
import { Lato } from "next/font/google";

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
        
        {/* Top Bar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "#ffffff",
            borderBottom: "2px solid #1e4620",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: "#1e4620",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                letterSpacing: 0.5,
              }}
            >
              P1
            </div>

            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: 0.5,
                  color: "#1e4620",
                }}
              >
                PRO1PUTT
              </div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>
                Tournament Registration & Live Scoring
              </div>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "28px 16px 60px",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}