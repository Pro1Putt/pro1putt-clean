"use client";

import React, { useEffect, useMemo, useState } from "react";

type Tournament = { id: string; name: string | null; start_date: string | null; location: string | null };
type Player = {
  id: string; // registrations.id
  first_name: string;
  last_name: string;
  gender: "Boys" | "Girls" | null;
  holes: number;
  nation: string | null;
  hcp: number | null;
  home_club: string | null;
};

function inputStyle(): React.CSSProperties {
  return { width: "100%", padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.15)" };
}
function labelStyle(): React.CSSProperties {
  return { display: "block", fontWeight: 800, marginBottom: 8, color: "#1e4620" };
}

export default function ScoringPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState("");

  const [hole, setHole] = useState(1);
  const [strokes, setStrokes] = useState<number>(5);

  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/tournaments");
      const json = await res.json();
      setTournaments(json.tournaments || []);
    })();
  }, []);

  // load players for selected tournament
  useEffect(() => {
    if (!tournamentId) {
      setPlayers([]);
      setPlayerId("");
      return;
    }
    (async () => {
      setErr(null);
      const res = await fetch(`/api/leaderboard?tournamentId=${encodeURIComponent(tournamentId)}`);
      const json = await res.json();
      if (!json.ok) {
        setErr(json.error || "Could not load players");
        setPlayers([]);
        setPlayerId("");
        return;
      }
      // rows kommen aus leaderboard api, enthält mind. id, first_name, last_name, holes, gender...
      setPlayers(json.rows || []);
      setPlayerId("");
    })();
  }, [tournamentId]);

  const selected = useMemo(() => players.find((p) => p.id === playerId) || null, [players, playerId]);

  async function saveScore() {
    setErr(null);
    setStatus(null);
    if (!tournamentId) return setErr("Bitte Turnier auswählen.");
    if (!playerId) return setErr("Bitte Spieler auswählen.");

    setSaving(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: tournamentId,
          player_id: playerId,
          hole_number: hole,
          strokes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Save failed");
      setStatus(`Gespeichert: Loch ${hole} = ${strokes}`);
    } catch (e: any) {
      setErr(e?.message || "Save error");
    } finally {
      setSaving(false);
    }
  }

  const maxHole = selected?.holes === 9 ? 9 : 18;

  return (
    <div style={{ maxWidth: 860, margin: "40px auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1e4620", marginBottom: 10 }}>
        Scoring (Admin)
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 20 }}>
        Minimal-Tool zum Testen: Spieler auswählen → Loch & Schläge speichern.
      </p>

      {err && (
        <div style={{ background: "#fff0f0", border: "1px solid rgba(220,0,0,0.2)", padding: 14, borderRadius: 14, color: "crimson", fontWeight: 800, marginBottom: 14 }}>
          {err}
        </div>
      )}
      {status && (
        <div style={{ background: "#e9f5ec", border: "1px solid rgba(30,70,32,0.25)", padding: 14, borderRadius: 14, color: "#1e4620", fontWeight: 900, marginBottom: 14 }}>
          {status}
        </div>
      )}

      <div style={{ background: "#ffffff", borderRadius: 16, padding: 18, border: "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle()}>Turnier</label>
          <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} style={inputStyle()}>
            <option value="">Bitte wählen…</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {(t.name ?? "Turnier") + (t.start_date ? ` • ${t.start_date}` : "") + (t.location ? ` • ${t.location}` : "")}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle()}>Spieler</label>
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} style={inputStyle()} disabled={!tournamentId}>
            <option value="">{tournamentId ? "Bitte wählen…" : "Erst Turnier auswählen"}</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.last_name} {p.first_name} • {p.gender ?? "?"} • {p.holes}L • HCP {p.hcp ?? "-"} • {p.home_club ?? ""}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div style={{ marginBottom: 14, fontSize: 13, opacity: 0.75 }}>
            Ausgewählt: <b>{selected.first_name} {selected.last_name}</b> • {selected.gender} • {selected.holes} Loch
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle()}>Loch</label>
            <input
              type="number"
              min={1}
              max={maxHole}
              value={hole}
              onChange={(e) => setHole(Number(e.target.value))}
              style={inputStyle()}
              disabled={!selected}
            />
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
              Max {maxHole} (abhängig von 9/18 Loch)
            </div>
          </div>

          <div>
            <label style={labelStyle()}>Schläge</label>
            <input
              type="number"
              min={1}
              max={25}
              value={strokes}
              onChange={(e) => setStrokes(Number(e.target.value))}
              style={inputStyle()}
              disabled={!selected}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={saveScore}
          disabled={saving || !selected}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 12,
            background: saving ? "rgba(30,70,32,0.6)" : "#1e4620",
            color: "#fff",
            fontWeight: 900,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Speichert..." : "Score speichern"}
        </button>

        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
          Tipp: Danach Leaderboard neu laden und prüfen, ob Score/Thru/To Par sichtbar werden.
        </div>
      </div>
    </div>
  );
}
