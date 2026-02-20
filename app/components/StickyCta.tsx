"use client";

import { usePathname } from "next/navigation";

const GREEN = "#00C46A";
const DARK = "#0E2A1F";

export default function StickyCta() {
  const pathname = usePathname() || "/";

  // Hide CTA on flows/pages where it would be annoying or wrong
  const hide =
    pathname.startsWith("/register") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/live") ||
    pathname.startsWith("/t/");

  if (hide) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        padding: "12px 14px",
        background: "rgba(14, 42, 31, 0.92)",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
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
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 800, fontSize: 14 }}>
          Startplätze sichern • <span style={{ color: GREEN, fontWeight: 900 }}>WAGR & EGR</span>
        </div>

        <a
          href="/register"
          style={{
            padding: "12px 16px",
            background: GREEN,
            color: "#001a10",
            borderRadius: 12,
            fontWeight: 900,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Jetzt anmelden →
        </a>
      </div>
    </div>
  );
}