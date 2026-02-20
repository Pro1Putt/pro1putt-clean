import React from "react";

const LOGO_URL =
  "https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png";

const GREEN_DARK = "#0f3d2e";
const GREEN = "#00C46A";

const links = [
  { href: "/", label: "Home" },
  { href: "/tour-2026", label: "Tour 2026" },
  { href: "/ausschreibung", label: "Ausschreibung" },
  { href: "/register", label: "Registrierung" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/partner", label: "Partner" },
  { href: "/galerie", label: "Galerie" },
];

export default function TopBar() {
  return (
    <div style={{ background: GREEN_DARK, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Brand */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "white",
            fontWeight: 900,
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
          }}
          aria-label="PRO1PUTT"
        >
          <img src={LOGO_URL} alt="PRO1PUTT" style={{ height: 26, width: "auto", display: "block" }} />
          <span style={{ lineHeight: 1 }}>PRO1PUTT</span>
        </a>

        {/* Nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
            marginLeft: 8,
            flex: "1 1 auto",
          }}
          aria-label="Navigation"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                color: "rgba(255,255,255,0.92)",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 14,
                whiteSpace: "nowrap",
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="/register"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 14px",
            borderRadius: 12,
            background: GREEN,
            color: "#062414",
            fontWeight: 900,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Jetzt anmelden
        </a>
      </div>
    </div>
  );
}
