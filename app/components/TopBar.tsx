"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

const GREEN = "#00C46A";

export default function TopBar() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const hide =
    pathname === "/" ||
    pathname === "/home-v2" ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/tour");

  if (hide) return null;

  // Galerie ABSICHTLICH ans Ende
  const links: { href: string; label: string }[] = [
    { href: "/", label: "Home" },
    { href: "/ausschreibung", label: "Ausschreibung" },
    { href: "/agb", label: "AGB" },
    { href: "/datenschutz", label: "Datenschutz" },
    { href: "/impressum", label: "Impressum" },
    { href: "/galerie", label: "Galerie" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const itemStyle = (active: boolean): React.CSSProperties => ({
    position: "relative",
    zIndex: 10001,
    pointerEvents: "auto",
    cursor: "pointer",
    color: active ? "white" : "rgba(255,255,255,0.78)",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.2,
    padding: "8px 10px",
    borderRadius: 999,
    border: active ? "1px solid rgba(255,255,255,0.20)" : "1px solid transparent",
    background: active ? "rgba(255,255,255,0.08)" : "transparent",
    boxShadow: active ? `0 0 0 2px rgba(0,196,106,0.10)` : "none",
  });

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10000,
        background: "#0E2A1F",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          justifyContent: "space-between",
          pointerEvents: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            textAlign: "left",
            pointerEvents: "auto",
            position: "relative",
            zIndex: 10001,
          }}
        >
          <img
            src="/pro1putt-logo-white.png"
            alt="PRO1PUTT"
            style={{ height: 36, width: "auto", display: "block" }}
          />
          <div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 18,
                letterSpacing: 0.5,
                color: "white",
                lineHeight: 1.1,
              }}
            >
              PRO1PUTT
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, color: "rgba(255,255,255,0.8)" }}>
              Tournament Registration & Live Scoring
            </div>
          </div>
        </button>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            pointerEvents: "auto",
            position: "relative",
            zIndex: 10001,
          }}
        >
          {links.map((l) => {
            const active = isActive(l.href);

            // Galerie: harter Wechsel (unkaputtbar)
            if (l.href === "/galerie") {
              return (
                <button
                  key={l.href}
                  type="button"
                  onMouseDown={() => {
                    window.location.href = "/galerie";
                  }}
                  onClick={() => {
                    window.location.href = "/galerie";
                  }}
                  style={itemStyle(active)}
                >
                  {l.label}
                </button>
              );
            }

            return (
              <button
                key={l.href}
                type="button"
                onClick={() => router.push(l.href)}
                style={itemStyle(active)}
              >
                {l.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, ${GREEN}, rgba(0,196,106,0))`,
          opacity: 0.9,
        }}
      />
    </header>
  );
}