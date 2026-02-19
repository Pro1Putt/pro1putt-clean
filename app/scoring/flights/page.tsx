"use client";

import { useEffect, useMemo, useState } from "react";

const GREEN = "#00C46A";

type Tournament = {
  id: string;
  name: string | null;
  start_date: string | null;
  location: string | null;
};

export default function FlightsAdminPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [round, setRound] = useState<1 | 2 | 3>(1);
  const [tdPin, setTdPin] = useState<string>("1234");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [flights, setFlights] = useState<any[]>([]);
  const [flightPlayers, setFlightPlayers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tournaments");
        const json = await res.json();
        const list: Tournament[] = json?.tournaments ?? json ?? [];
        setTournaments(list);
        if (!tournamentId && list?.[0]?.id) setTournamentId(list[0].id);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reload() {
    if (!tournamentId) return;
    setMsg("Lade…");
    const res = await fetch(`/api/flights/list?tournamentId=${encodeURIComponent(tournamentId)}&round=${round}`);
    const json = await res.json();
    if (!res.ok || !json?.ok) {
      setMsg(json?.error || "Fehler beim Laden");
      setFlights([]);
      setFlightPlayers([]);
      return;
    }
    setFlights(json.flights || []);
    setFlightPlayers(json.flight_players || []);
    setMsg(`OK – Flights: ${json.flights?.length ?? 0} / Players: ${json.flight_players?.length ?? 0}`);
  }

  async function generate() {
    if (!tournamentId) return;
    setBusy(true);
    setMsg("Generiere…");
    try {
      const res = await fetch("/api/flights/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tournamentId, round, td_pin: tdPin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setMsg(json?.error || "Fehler beim Generieren");
        return;
      }
      setMsg(`✅ Generiert: flights_created=${json.flights_created} players_assigned=${json.players_assigned}`);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const playersByFlight = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const fp of flightPlayers) {
      const fid = String(fp.flight_id ?? "");
      if (!fid) continue;
      if (!m.has(fid)) m.set(fid, []);
      m.get(fid)!.push(fp);
    }
    // sort by seat if present
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => Number(a.seat ?? 0) - Number(b.seat ?? 0));
      m.set(k, arr);
    }
    return m;
  }, [flightPlayers]);

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f6f7f8",
    padding: 16,
    fontFamily: 'Lato, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
  };

  const card: React.CSSProperties = {
    maxWidth: 1100,
    margin: "0 auto",
    background: "white",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.06)",
  };

  const header: React.CSSProperties = {
    padding: "16px 16px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
  };

  const title: React.CSSProperties = { fontSize: 18, fontWeight: 800, letterSpacing: 0.2 };

  const controls: React.CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    padding: 16,
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  };

  const label: React.CSSProperties = { fontSize: 12, opacity: 0.75, marginBottom: 4 };
  const input: React.CSSProperties = {
    height: 38,
    padding: "0 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    outline: "none",
    minWidth: 240,
  };

  const smallInput: React.CSSProperties = { ...input, minWidth: 0, width: 90, textAlign: "center" };

  const btn: React.CSSProperties = {
    height: 38,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    fontWeight: 700,
    cursor: "pointer",
  };

  const btnPrimary: React.CSSProperties = {
    ...btn,
    background: GREEN,
    color: "white",
    border: "1px solid rgba(0,0,0,0.08)",
  };

  const grid: React.CSSProperties = {
    padding: 16,
    display: "grid",
    gap: 12,
  };

  const flightCard: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 16,
    padding: 14,
  };

  function safe(v: any) {
    const s = String(v ?? "").trim();
    return s || "-";
  }

  function flightNo(f: any) {
    return f.flight_no ?? f.flight_number ?? f.number ?? f.no ?? "-";
  }

  function flightGender(f: any) {
    return f.gender ?? "-";
  }

  function flightHoles(f: any) {
    return f.holes ?? "-";
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={header}>
          <div style={title}>Scoring Admin – Flights</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{msg}</div>
        </div>

        <div style={controls}>
          <div>
            <div style={label}>Turnier</div>
            <select
              style={input}
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name ?? t.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={label}>Runde</div>
            <select
              style={smallInput}
              value={round}
              onChange={(e) => setRound(Number(e.target.value) as 1 | 2 | 3)}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>

          <div>
            <div style={label}>TD PIN</div>
            <input
              style={smallInput}
              value={tdPin}
              onChange={(e) => setTdPin(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
              placeholder="1234"
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <button style={btn} onClick={reload} disabled={busy || !tournamentId}>
              Reload
            </button>
            <button style={btnPrimary} onClick={generate} disabled={busy || !tournamentId}>
              Generate Flights
            </button>
          </div>
        </div>

        <div style={grid}>
          {flights.length === 0 ? (
            <div style={{ opacity: 0.75, padding: 8 }}>Keine Flights vorhanden.</div>
          ) : (
            flights.map((f) => {
              const fid = String(f.id);
              const fps = playersByFlight.get(fid) || [];
              return (
                <div key={fid} style={flightCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900 }}>
                      Flight {flightNo(f)}
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>
                      Round: {safe(f.round)} · Holes: {safe(flightHoles(f))} · Gender: {safe(flightGender(f))}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10 }}>
                    {fps.length === 0 ? (
                      <div style={{ opacity: 0.75 }}>Keine Spieler im Flight.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 6 }}>
                        {fps.map((fp, idx) => (
                          <div key={fp.id ?? idx} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                            <div style={{ width: 70, fontWeight: 800 }}>Seat {safe(fp.seat)}</div>
                            <div style={{ flex: 1 }}>
                              reg: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{safe(fp.registration_id)}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              marks:{" "}
                              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                                {safe(fp.marks_registration_id)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
