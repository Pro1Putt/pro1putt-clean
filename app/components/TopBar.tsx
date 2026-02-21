"use client";

import { useEffect, useMemo, useState } from "react";

const GREEN = "#00C46A";
const DARK = "#0E2A1F";

type NavItem = { href: string; label: string };

export default function TopBar() {
  const [open, setOpen] = useState(false);

  const items: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/#tour", label: "Tour 2026" },
      { href: "/ausschreibung", label: "Ausschreibung" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/#partners", label: "Partner" }, // ✅ kein 404 mehr
      { href: "/galerie", label: "Galerie" },
    ],
    []
  );

  // ESC schließt Menü
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Body scroll lock wenn offen
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <style>{`
        .p1-topbar{
          position: sticky;
          top: 0;
          z-index: 80;
          background: rgba(14, 42, 31, 0.92);
          border-bottom: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .p1-inner{
          max-width: 1100px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-width: 0;
        }

        .p1-brand{
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 0 1 auto;
        }
        .p1-logo{
          width: 28px;
          height: 28px;
          object-fit: contain;
          flex: 0 0 auto;
        }
        .p1-brand-text{
          display: flex;
          flex-direction: column;
          line-height: 1.05;
          min-width: 0;
        }
        .p1-brand-title{
          color: rgba(255,255,255,0.95);
          font-weight: 900;
          font-size: 15px;
          letter-spacing: 0.3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 36vw;
        }
        .p1-brand-sub{
          color: rgba(255,255,255,0.72);
          font-weight: 700;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 46vw;
        }

        .p1-desktop{
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex: 1 1 auto;
          min-width: 0;
        }
        .p1-navlink{
          color: rgba(255,255,255,0.92);
          text-decoration: none;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.3px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          white-space: nowrap;
        }

        .p1-actions{
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 0 0 auto;
        }
        .p1-cta{
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          background: ${GREEN};
          color: #001a10;
          border-radius: 999px;
          font-weight: 900;
          text-decoration: none;
          font-size: 13px;
          box-shadow: 0 10px 30px rgba(0,196,106,0.25);
          white-space: nowrap;
        }
        .p1-burger{
          display: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
          font-weight: 900;
          cursor: pointer;
        }

        /* ✅ MOBILE */
        @media (max-width: 900px){
          .p1-desktop{ display: none !important; }  /* ✅ wirklich aus */
          .p1-burger{ display: inline-flex; align-items:center; justify-content:center; }
          .p1-inner{ padding: 10px 12px; }
          .p1-brand-title{ max-width: 42vw; }
          .p1-brand-sub{ display: none; }
          .p1-cta{ padding: 10px 12px; }
        }
        @media (max-width: 420px){
          .p1-brand-title{ max-width: 30vw; }
        }
        @media (max-width: 360px){
          .p1-brand-title{ display: none; }
        }

        /* ✅ MOBILE SHEET */
        .p1-overlay{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 200;
        }
        .p1-sheet{
          position: fixed;
          left: 12px;
          right: 12px;
          top: 70px;
          background: rgba(14, 42, 31, 0.98);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          padding: 12px;
          z-index: 210;
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        }
        .p1-sheet a{
          display: block;
          padding: 12px 12px;
          border-radius: 12px;
          text-decoration: none;
          color: rgba(255,255,255,0.92);
          font-weight: 900;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.06);
          margin-bottom: 10px;
        }
        .p1-sheet a:last-child{ margin-bottom: 0; }
      `}</style>

      <header className="p1-topbar">
        <div className="p1-inner">
          <a className="p1-brand" href="/" onClick={() => setOpen(false)} aria-label="PRO1PUTT Home">
            <img className="p1-logo" src={LOGO_URL()} alt="PRO1PUTT" />
            <span className="p1-brand-text">
              <span className="p1-brand-title">PRO1PUTT</span>
              <span className="p1-brand-sub">Tournament Registration & Live Scoring</span>
            </span>
          </a>

          <nav className="p1-desktop" aria-label="Hauptnavigation">
            {items.map((it) => (
              <a key={it.href} className="p1-navlink" href={it.href}>
                {it.label}
              </a>
            ))}
          </nav>

          <div className="p1-actions">
            <a className="p1-cta" href="/register">
              Jetzt anmelden
            </a>
            <button
              type="button"
              className="p1-burger"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menü"
              aria-expanded={open}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {open && (
        <>
          <div className="p1-overlay" onClick={() => setOpen(false)} />
          <div className="p1-sheet" role="dialog" aria-label="Mobile Menü">
            {items.map((it) => (
              <a key={it.href} href={it.href} onClick={() => setOpen(false)}>
                {it.label}
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function LOGO_URL() {
  // Nutzt dein bestehendes lokales Asset (wie bisher im Projekt)
  return "/pro1putt-logo-white.png";
}