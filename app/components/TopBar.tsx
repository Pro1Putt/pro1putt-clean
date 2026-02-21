"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GREEN = "#00C46A";
const DARK = "#0b3a2c";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/ausschreibung", label: "Ausschreibung" },
  { href: "/agb", label: "AGB" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/impressum", label: "Impressum" },
  { href: "/galerie", label: "Galerie" },
];

export default function TopBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return (pathname || "").startsWith(href);
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10000,
        background: DARK,
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily:
            "Lato, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            color: "white",
          }}
          aria-label="PRO1PUTT Home"
        >
          <img
            src="/pro1putt-logo-white.png"
            alt="PRO1PUTT"
            style={{
              height: 28,
              width: "auto",
              display: "block",
              filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.25))",
            }}
          />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>PRO1PUTT</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Tournament Registration &amp; Live Scoring
            </div>
          </div>
        </Link>

        <nav style={{ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  color: "white",
                  fontWeight: 800,
                  fontSize: 14,
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: active
                    ? "1px solid rgba(0,196,106,0.70)"
                    : "1px solid rgba(255,255,255,0.18)",
                  background: active ? "rgba(0,196,106,0.12)" : "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/register"
          style={{
            marginLeft: 10,
            textDecoration: "none",
            background: GREEN,
            color: "#001a10",
            fontWeight: 900,
            padding: "10px 14px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            boxShadow: "0 10px 30px rgba(0,196,106,0.25)",
          }}
        >
          Jetzt anmelden
        </Link>
      </div>
    </header>
  );
}
