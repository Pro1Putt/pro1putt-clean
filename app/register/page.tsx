"use client";

import React, { useEffect, useState } from "react";

type Tournament = {
  id: string;
  name: string | null;
  start_date: string | null;
  location: string | null;
};

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    outline: "none",
  };
}

function labelStyle(): React.CSSProperties {
  return { display: "block", fontWeight: 700, marginBottom: 8 };
}

export default function RegisterPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [successPin, setSuccessPin] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/tournaments");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load tournaments");
        if (!cancelled) setTournaments(json.tournaments || []);
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || "Load error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    setSubmitting(true);

    try {
      const form = e.target as HTMLFormElement;
      const payload = Object.fromEntries(new FormData(form).entries());

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Registration failed");
      }

      setSuccessPin(String(json.player_pin || ""));
      form.reset();

      if (json.paypal_url) {
        window.location.href = json.paypal_url;
        return;
      }

      setSubmitErr(
        "PayPal-Link ist für dieses Turnier noch nicht hinterlegt. Bitte Admin informieren."
      );
    } catch (err: any) {
      setSubmitErr(err?.message || "Submit error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "60px auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e4620", marginBottom: 10 }}>
        Turnier Registrierung
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>Bitte alle Pflichtfelder ausfüllen.</p>

      {successPin && (
        <div
          style={{
            background: "#e9f5ec",
            border: "1px solid rgba(30,70,32,0.25)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 900, color: "#1e4620", marginBottom: 6 }}>
            Registrierung gespeichert ✅
          </div>
          <div style={{ opacity: 0.85 }}>
            Deine PIN für das Scoring ist:{" "}
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>
              {successPin}
            </span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
            PayPal-Weiterleitung und Bestätigungsmail kommen als nächster Schritt.
          </div>
        </div>
      )}

      {submitErr && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid rgba(220,0,0,0.25)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            color: "crimson",
            fontWeight: 700,
          }}
        >
          Fehler: {submitErr}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 18,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Turnier */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle()}>
            Turnier auswählen <span style={{ color: "crimson" }}>*</span>
          </label>

          {loadErr ? (
            <div style={{ color: "crimson", fontSize: 13 }}>
              Fehler beim Laden der Turniere: {loadErr}
            </div>
          ) : (
            <select name="tournament_id" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Bitte wählen…
              </option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {(t.name ?? "Turnier") +
                    (t.start_date ? ` • ${t.start_date}` : "") +
                    (t.location ? ` • ${t.location}` : "")}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 9/18 */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle()}>
            Spielt <span style={{ color: "crimson" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 12,
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <input type="radio" name="holes" value="9" required />
              9 Loch (U12)
            </label>

            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 12,
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <input type="radio" name="holes" value="18" required />
              18 Loch (U21)
            </label>
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <div>
            <label style={labelStyle()}>
              Vorname <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="first_name" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Nachname <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="last_name" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              E-Mail <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="email" type="email" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Handicap (HCP) <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="hcp" type="number" step="0.1" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Geburtsdatum <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="birthdate" type="date" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Nation (ISO2, z.B. DE) <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="nation" maxLength={2} style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Kategorie <span style={{ color: "crimson" }}>*</span>
            </label>
            <select name="gender" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Bitte wählen…
              </option>
              <option value="Girls">Girls</option>
              <option value="Boys">Boys</option>
            </select>
          </div>

          <div>
            <label style={labelStyle()}>
              Heimatclub <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="home_club" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Trainer <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="coach" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Einlaufsong <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="walkup_song" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Caddie <span style={{ color: "crimson" }}>*</span>
            </label>
            <select name="caddie" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Bitte wählen…
              </option>
              <option value="no">Ohne Caddie</option>
              <option value="yes">Mit Caddie</option>
            </select>
          </div>

          <div>
            <label style={labelStyle()}>
              WAGR gelistet? <span style={{ color: "crimson" }}>*</span>
            </label>
            <select name="wagr" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Bitte wählen…
              </option>
              <option value="no">Nein</option>
              <option value="yes">Ja</option>
            </select>
          </div>

          <div>
            <label style={labelStyle()}>
              College Golf interessiert? <span style={{ color: "crimson" }}>*</span>
            </label>
            <select name="college_interest" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Bitte wählen…
              </option>
              <option value="no">Nein</option>
              <option value="yes">Ja</option>
            </select>
          </div>
        </div>

        <div style={{ height: 18 }} />

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 12,
            background: submitting ? "rgba(30,70,32,0.6)" : "#1e4620",
            color: "#fff",
            fontWeight: 800,
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Speichert..." : "Registrierung speichern"}
        </button>

        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
          Nächster Schritt: PayPal Redirect + Bestätigungsmail mit PIN.
        </div>
      </form>
    </div>
  );
}