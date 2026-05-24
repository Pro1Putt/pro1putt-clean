"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  hcp: number | null;
  gender: string;
  holes: number;
  age_group: string;
  flight_id: string | null;
  player_pin: string;
  tournament_status: string;
  tournament_status_hole: number | null;
}

interface Flight {
  id: string;
  flight_number: number;
  round: number;
  gender: string;
  status: string;
  start_time: string | null;
  players: Registration[];
}

export default function AdminTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params?.tournamentId as string;

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [message, setMessage] = useState("");
  const [dnfModal, setDnfModal] = useState<Registration | null>(null);
  const [dnfType, setDnfType] = useState<"dnf" | "dq">("dnf");
  const [dnfHole, setDnfHole] = useState(1);
  const [dnfNote, setDnfNote] = useState("");
  const [savingDnf, setSavingDnf] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("admin_authed")) {
      router.push("/admin");
      return;
    }
    loadData();
  }, [tournamentId]);

  const loadData = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/flights?tournamentId=${tournamentId}&round=${activeRound}`);
    const data = await res.json();
    if (data.ok) {
      setRegistrations(data.registrations);
      setFlights(data.flights);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [activeRound]);

  const generateFlights = async () => {
    setGenerating(true);
    setMessage("");
    const res = await fetch("/api/admin/flights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId, round: activeRound }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessage(`✅ ${data.flights_created} Flights erstellt!`);
      loadData();
    } else {
      setMessage(`❌ Fehler: ${data.error}`);
    }
    setGenerating(false);
  };

  const saveDnf = async () => {
    if (!dnfModal) return;
    setSavingDnf(true);
    try {
      const res = await fetch("/api/admin/player-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: dnfModal.id,
          status: dnfType,
          hole: dnfHole,
          note: dnfNote,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`✅ ${dnfModal.first_name} ${dnfModal.last_name} als ${dnfType.toUpperCase()} markiert`);
        setDnfModal(null);
        loadData();
      } else {
        setMessage(`❌ Fehler: ${data.error}`);
      }
    } catch (e) {
      setMessage("❌ Fehler beim Speichern");
    }
    setSavingDnf(false);
  };

  const resetStatus = async (reg: Registration) => {
    if (!confirm(`${reg.first_name} ${reg.last_name} wieder auf "aktiv" setzen?`)) return;
    try {
      await fetch("/api/admin/player-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: reg.id, status: "active", hole: null, note: "" }),
      });
      loadData();
    } catch (e) {}
  };

  const getStatusBadge = (status: string) => {
    if (status === "dnf") return { label: "DNF", bg: "#fff3e0", color: "#e65100" };
    if (status === "dq") return { label: "DQ", bg: "#fde8e8", color: "#c00" };
    return null;
  };

  const unassigned = registrations.filter(r => !r.flight_id);
  const girls18 = unassigned.filter(r => r.gender === "Girls" && r.holes === 18);
  const boys18 = unassigned.filter(r => r.gender === "Boys" && r.holes === 18);
  const nine = unassigned.filter(r => r.holes === 9);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Lade...</div>;

  return (
    <main style={{ minHeight: "100vh", background: "#f3f7f4", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* DNF/DQ Modal */}
        {dnfModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#17362b" }}>
                Spieler markieren
              </h2>
              <p style={{ margin: "0 0 20px", color: "#668278", fontSize: 14 }}>
                {dnfModal.first_name} {dnfModal.last_name}
              </p>

              {/* DNF / DQ Auswahl */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {(["dnf", "dq"] as const).map(t => (
                  <button key={t} onClick={() => setDnfType(t)} style={{
                    flex: 1, padding: "12px", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer",
                    background: dnfType === t ? (t === "dnf" ? "#fff3e0" : "#fde8e8") : "#f3f7f4",
                    color: dnfType === t ? (t === "dnf" ? "#e65100" : "#c00") : "#668278",
                    border: dnfType === t ? `2px solid ${t === "dnf" ? "#e65100" : "#c00"}` : "2px solid transparent",
                  }}>
                    {t.toUpperCase()} {t === "dnf" ? "– Did Not Finish" : "– Disqualified"}
                  </button>
                ))}
              </div>

              {/* Letztes Loch */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#668278", marginBottom: 6 }}>
                Letztes gespielte Loch
              </label>
              <select value={dnfHole} onChange={e => setDnfHole(parseInt(e.target.value))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, marginBottom: 16 }}>
                {Array.from({ length: dnfModal.holes || 18 }, (_, i) => i + 1).map(h => (
                  <option key={h} value={h}>Loch {h}</option>
                ))}
              </select>

              {/* Notiz */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#668278", marginBottom: 6 }}>
                Notiz (optional)
              </label>
              <input
                value={dnfNote}
                onChange={e => setDnfNote(e.target.value)}
                placeholder="z.B. Verletzung, Regelverstoß..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, marginBottom: 20, boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDnfModal(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "#f3f7f4", color: "#668278", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Abbrechen
                </button>
                <button onClick={saveDnf} disabled={savingDnf} style={{ flex: 1, padding: "12px", borderRadius: 10, background: dnfType === "dnf" ? "#e65100" : "#c00", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>
                  {savingDnf ? "Speichern..." : `Als ${dnfType.toUpperCase()} markieren`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0b5d3b,#147a52)", borderRadius: 20, padding: 24, color: "#fff", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <button onClick={() => router.push("/admin")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 8, fontSize: 13 }}>← Zurück</button>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Flight-Verwaltung</h1>
            <p style={{ margin: "4px 0 0", opacity: 0.9 }}>{registrations.length} Spieler angemeldet</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>
              {unassigned.length} ohne Flight · {flights.length} Flights erstellt
            </div>
            <button onClick={generateFlights} disabled={generating} style={{ padding: "12px 24px", borderRadius: 12, background: "#c8f03c", color: "#000", fontWeight: 800, border: "none", cursor: generating ? "not-allowed" : "pointer", fontSize: 15 }}>
              {generating ? "Erstelle..." : `🔀 Flights Runde ${activeRound} generieren`}
            </button>
          </div>
        </div>

        {message && (
          <div style={{ background: message.startsWith("✅") ? "#e8f5ee" : "#fde8e8", borderRadius: 12, padding: "12px 20px", marginBottom: 16, fontWeight: 700, color: message.startsWith("✅") ? "#0b5d3b" : "#c00" }}>
            {message}
          </div>
        )}

        {/* Runden Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[1, 2, 3].map(r => (
            <button key={r} onClick={() => setActiveRound(r)} style={{ padding: "10px 24px", borderRadius: 999, fontWeight: 800, fontSize: 14, cursor: "pointer", background: activeRound === r ? "#0b5d3b" : "#fff", color: activeRound === r ? "#fff" : "#17362b", border: activeRound === r ? "1px solid #0b5d3b" : "1px solid rgba(11,93,59,0.15)", outline: "none" }}>
              Runde {r}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Nicht zugeteilte Spieler */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#17362b", marginBottom: 12 }}>
              Ohne Flight ({unassigned.length})
            </h2>
            {[
              { label: `Girls 18 Loch (${girls18.length})`, list: girls18, color: "#e8f5ee" },
              { label: `Boys 18 Loch (${boys18.length})`, list: boys18, color: "#e8f0ff" },
              { label: `9 Loch (${nine.length})`, list: nine, color: "#fff8e8" },
            ].map(({ label, list, color }) => list.length > 0 && (
              <div key={label} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(11,93,59,0.08)", marginBottom: 12 }}>
                <div style={{ padding: "10px 16px", background: color, fontWeight: 800, fontSize: 14, color: "#17362b" }}>{label}</div>
                {list.map(r => (
                  <div key={r.id} style={{ padding: "10px 16px", borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.first_name} {r.last_name}</div>
                      <div style={{ fontSize: 12, color: "#668278" }}>HCP: {r.hcp ?? "—"} · PIN: {r.player_pin}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {unassigned.length === 0 && (
              <div style={{ background: "#e8f5ee", borderRadius: 12, padding: 20, textAlign: "center", color: "#0b5d3b", fontWeight: 700 }}>
                ✅ Alle Spieler haben einen Flight!
              </div>
            )}
          </div>

          {/* Flights */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#17362b", marginBottom: 12 }}>
              Flights Runde {activeRound} ({flights.length})
            </h2>
            {flights.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, textAlign: "center", color: "#668278", border: "1px solid rgba(11,93,59,0.08)" }}>
                Noch keine Flights für Runde {activeRound}.<br />
                Klicke "Flights generieren" um sie automatisch zu erstellen.
              </div>
            ) : (
              flights.map(flight => (
                <div key={flight.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(11,93,59,0.08)", marginBottom: 12 }}>
                  <div style={{ padding: "10px 16px", background: "linear-gradient(135deg,#0b5d3b,#147a52)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800 }}>Flight {flight.flight_number} · {flight.gender}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {flight.start_time && <span style={{ fontSize: 12, opacity: 0.9 }}>🕐 {flight.start_time}</span>}
                      <span style={{ fontSize: 12, opacity: 0.9, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 999 }}>{flight.status}</span>
                    </div>
                  </div>
                  {(flight.players || []).map((p, i) => {
                    const badge = getStatusBadge(p.tournament_status);
                    return (
                      <div key={p.id} style={{ padding: "10px 16px", borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{p.first_name} {p.last_name}</span>
                            {badge && (
                              <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: badge.bg, color: badge.color }}>
                                {badge.label} {p.tournament_status_hole ? `ab Loch ${p.tournament_status_hole}` : ""}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "#668278" }}>HCP: {p.hcp ?? "—"} · PIN: {p.player_pin} · {p.age_group}</div>
{p.marks_registration_id && (() => {
  const marksPlayer = flight.players.find((x: any) => x.id === p.marks_registration_id);
  return marksPlayer ? (
    <div style={{ fontSize: 11, color: "#0b5d3b", fontWeight: 700 }}>
      ✏️ Zählt für: {marksPlayer.first_name} {marksPlayer.last_name}
    </div>
  ) : null;
})()}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {badge ? (
                            <button onClick={() => resetStatus(p)} style={{ padding: "6px 10px", borderRadius: 8, background: "#e8f5ee", color: "#0b5d3b", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>
                              ↩ Aktiv
                            </button>
                          ) : (
                            <button onClick={() => { setDnfModal(p); setDnfType("dnf"); setDnfHole(1); setDnfNote(""); }} style={{ padding: "6px 10px", borderRadius: 8, background: "#fff3e0", color: "#e65100", fontWeight: 700, border: "1px solid #e65100", cursor: "pointer", fontSize: 12 }}>
                              DNF/DQ
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
