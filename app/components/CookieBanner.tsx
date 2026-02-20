"use client";

import { useEffect, useState } from "react";

const GREEN = "#00C46A";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("pro1putt_cookie_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("pro1putt_cookie_consent", "accepted");
    window.location.reload();
  };

  const decline = () => {
    localStorage.setItem("pro1putt_cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        right: 20,
        background: "white",
        borderRadius: 18,
        padding: 20,
        boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: 12, fontWeight: 700 }}>
        Wir verwenden Cookies
      </div>

      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>
        Wir nutzen Google Analytics zur Verbesserung unserer Website.
        Sie können zustimmen oder ablehnen.
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={accept}
          style={{
            background: GREEN,
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Akzeptieren
        </button>

        <button
          onClick={decline}
          style={{
            background: "transparent",
            border: "1px solid #ccc",
            padding: "8px 16px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
