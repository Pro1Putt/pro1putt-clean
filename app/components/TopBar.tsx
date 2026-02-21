"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GREEN = "#00C46A";
const DARK = "#0E2A1F";

const LINKS: { href: string; label: string; match?: (p: string) => boolean }[] = [
  { href: "/", label: "Home", match: (p) => p === "/" },
  { href: "/#tour2026", label: "Tour 2026" },
  { href: "/ausschreibung", label: "Ausschreibung", match: (p) => p.startsWith("/ausschreibung") },
  { href: "/register", label: "Registrierung", match: (p) => p.startsWith("/register") },
  { href: "/leaderboard", label: "Leaderboard", match: (p) => p.startsWith("/leaderboard") },
  { href: "/#partners", label: "Partner" },
  { href: "/galerie", label: "Galerie", match: (p) => p.startsWith("/galerie") },
];

export default function TopBar() {
  const pathname = usePathname() || "/";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(14, 42, 31, 0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "12px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Link
          href="/"
          aria-label="PRO1PUTT Home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "white",
            fontWeight: 900,
            letterSpacing: 0.8,
          }}
        >
          <img
            src="/pro1putt-logo-white.png"
            alt="PRO1PUTT"
            style={{
              height: 26,
              width: "auto",
              display: "block",
              filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.25))",
            }}
          />
        </Link>

        <nav
          aria-label="Primary Navigation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {LINKS.map((l) => {
            const isActive = l.match ? l.match(pathname) : false;
            return (
              <Link
                key={l.label}
                href={l.href}
                style={{
                  color: "rgba(255,255,255,0.92)",
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: 0.4,
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: isActive ? `1.5px solid rgba(0,196,106,0.55)` : "1px solid rgba(255,255,255,0.12)",
                  background: isActive ? "rgba(0,196,106,0.10)" : "rgba(255,255,255,0.06)",
                  boxShadow: isActive ? "0 10px 30px rgba(0,196,106,0.18)" : "none",
                  transition: "all 160ms ease",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: isActive ? GREEN : "rgba(255,255,255,0.45)",
                    boxShadow: isActive ? "0 0 0 4px rgba(0,196,106,0.18)" : "none",
                    display: "inline-block",
                  }}
                />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/register"
          style={{
            padding: "10px 14px",
            background: GREEN,
            color: "#001a10",
            borderRadius: 999,
            fontWeight: 900,
            textDecoration: "none",
            fontSize: 14,
            boxShadow: "0 14px 30px rgba(0,0,0,0.18)",
            whiteSpace: "nowrap",
            display: "inline-block",
          }}
        >
          Jetzt anmelden
        </Link>
      </div>
    </header>
  );
}
