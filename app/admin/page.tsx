"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (data.ok) {
      sessionStorage.setItem("admin_authed", "1");
      setAuthed(true);
      loadTournaments();
    } else {
      setError("Falscher PIN");
    }
  };

  const loadTournaments = async () => {
    const res = await fetch("/api/admin/tournaments");
    const data = await res.json();
    if (data.ok) setTournaments(data.tournaments);
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_authed")) {
      setAuthed(true);
      loadTournaments();
    }
  }, []);

  if (!authed) {
    return (
      <main style={{ minHeight: "100vh", background: "#0b5d3b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: 40, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <h1 style={{ margin: "0 0 8px", color: "#0b5d3b", fontSize: 24, fontWeight: 900 }}>PRO1PUTT Admin</h1>
          <p style={{ margin: "0 0 24px", color: "#668278", fontSize: 14 }}>Admin-PIN eingeben</p>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="PIN"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #ddd", fontSize: 18, boxSizing: "border-box", marginBottom: 12 }}
          />
          {error && <p style={{ color: "red", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
          <button
            onClick={handleLogin}
            style={{ width: "100%", padding: "14px", borderRadius: 10, background: "#0b5d3b", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}
          >
            Anmelden
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f3f7f4", padding: "32px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(135deg,#0b5d3b,#147a52)", borderRadius: 20, padding: 24, color: "#fff", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>PRO1PUTT Admin</h1>
          <p style={{ margin: "8px 0 0", opacity: 0.9 }}>Turnierverwaltung & Flight-Einteilung</p>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {tournaments.map((t: any) => (
            <div key={t.id} style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid rgba(11,93,59,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#17362b" }}>{t.name}</div>
                <div style={{ color: "#668278", fontSize: 13, marginTop: 4 }}>
                  {t.start_date} · {t.registrations_count} Anmeldungen
                </div>
              </div>
              <button
                onClick={() => router.push(`/admin/${t.id}`)}
                style={{ padding: "10px 20px", borderRadius: 10, background: "#0b5d3b", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14 }}
              >
                Verwalten →
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
