"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const GREEN = "#1e4620";

const LOGO_URL =
  "https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png";

type Tournament = {
  id: string;
  name: string | null;
  start_date: string | null;
  location: string | null;
};

function fmtTournament(t: Tournament) {
  const parts = [
    t.name ?? "Turnier",
    t.start_date ? `• ${t.start_date}` : null,
    t.location ? `• ${t.location}` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

export default function PinPage() {
  const router = useRouter();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [tErr, setTErr] = useState<string | null>(null);

  const [tournamentId, setTournamentId] = useState<string>("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTournaments(true);
        setTErr(null);
        const res = await fetch("/api/tournaments", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load tournaments");

        const list: Tournament[] = Array.isArray(json?.tournaments) ? json.tournaments : [];
        if (!alive) return;

        setTournaments(list);

        // default: nächstes Turnier (nach start_date) oder erstes
        const sorted = [...list].sort((a, b) => {
          const da = a.start_date || "9999-12-31";
          const db = b.start_date || "9999-12-31";
          return da.localeCompare(db);
        });
        setTournamentId(sorted[0]?.id || "");
      } catch (e: any) {
        if (!alive) return;
        setTErr(e?.message || "Failed to load tournaments");
      } finally {
        if (!alive) return;
        setLoadingTournaments(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    const p = pin.trim();
    return !!tournamentId && /^\d{4}$/.test(p) && !busy;
  }, [tournamentId, pin, busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const p = pin.trim();
    if (!tournamentId) return setErr("Bitte Turnier auswählen.");
    if (!/^\d{4}$/.test(p)) return setErr("Bitte eine gültige 4-stellige PIN eingeben.");

    try {
      setBusy(true);
      const res = await fetch("/api/score/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, pin: p }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "PIN ungültig");

      // Erwartet: { ok:true, registrationId:"..." }
      const registrationId = json?.registrationId;
      if (!registrationId) throw new Error("Login ok, aber registrationId fehlt.");

      router.push(`/t/${tournamentId}/score/${registrationId}`);
    } catch (e: any) {
      setErr(e?.message || "PIN ungültig");
    } finally {
      setBusy(false);
    }
  }

  const pageWrap: React.CSSProperties = {
    maxWidth: 980,
    margin: "0 auto",
    padding: "30px 16px 60px",
    fontFamily:
      'Lato, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    color: "#0f172a",
  };

  const card: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    padding: 22,
    maxWidth: 640,
    margin: "0 auto",
  };

  const label: React.CSSProperties = {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 6,
    color: "#0f172a",
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    outline: "none",
    fontSize: 16,
    background: "#fff",
  };

  const btn: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    fontSize: 16,
    fontWeight: 900,
    cursor: canSubmit ? "pointer" : "not-allowed",
    background: canSubmit ? GREEN : "rgba(30,70,32,0.35)",
    color: "#fff",
  };

  const alert: React.CSSProperties = {
    background: "rgba(255,0,0,0.06)",
    border: "1px solid rgba(255,0,0,0.22)",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: 12,
    fontWeight: 700,
    marginBottom: 14,
  };

  return (
    <div style={pageWrap}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <img
          src={LOGO_URL}
          alt="PRO1PUTT"
          style={{ height: 52, width: "auto", display: "block", margin: "0 auto 10px" }}
        />
        <div style={{ fontSize: 22, fontWeight: 900, color: GREEN, marginBottom: 4 }}>
          PIN Eingabe
        </div>
        <div style={{ opacity: 0.75, fontSize: 14 }}>QR-Code → PIN → Scorekarte</div>
      </div>

      <div style={card}>
        {tErr && <div style={alert}>{tErr}</div>}
        {err && <div style={alert}>{err}</div>}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Turnier</label>
            <select
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              style={input}
              disabled={loadingTournaments || tournaments.length === 0}
            >
              {tournaments.length === 0 ? (
                <option value="">{loadingTournaments ? "Lade Turniere…" : "Keine Turniere gefunden"}</option>
              ) : (
                tournaments
                  .slice()
                  .sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {fmtTournament(t)}
                    </option>
                  ))
              )}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>PIN (4-stellig)</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              placeholder="z. B. 3949"
              inputMode="numeric"
              style={input}
            />
          </div>

          <button type="submit" style={btn} disabled={!canSubmit}>
            {busy ? "Bitte warten…" : "Weiter zur Scorekarte"}
          </button>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Hinweis: PIN kommt aus der Registrierungsmail / Registrierungserfolg.
          </div>
        </form>
      </div>
    </div>
  );
}