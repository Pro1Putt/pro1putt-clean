"use client";

import { useEffect, useMemo, useState } from "react";

const GREEN = "#00C46A";
const START_TIMES_API = "/api/flights/assign-start-times";
const GENERATE_MARKERS_API = "/api/flights/generate-markers";

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
  const [unassignedRegistrations, setUnassignedRegistrations] = useState<any[]>([]);

  const [moveBusy, setMoveBusy] = useState<string>("");
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tournaments", { cache: "no-store" });
        const json = await res.json();
        const list: Tournament[] = json?.tournaments ?? json ?? [];
        setTournaments(list);
        if (!tournamentId && list?.[0]?.id) setTournamentId(list[0].id);
      } catch {
        // ignore
      }
    })();
  }, [tournamentId]);

  async function reload() {
    if (!tournamentId) return;
    setMsg("Lade…");

    const res = await fetch(
      `/api/flights/list?tournamentId=${encodeURIComponent(
        tournamentId
      )}&round=${round}&_ts=${Date.now()}`,
      {
        cache: "no-store",
      }
    );

    const json = await res.json();

    if (!res.ok || !json?.ok) {
      setMsg(json?.error || "Fehler beim Laden");
      setFlights([]);
      setFlightPlayers([]);
      setUnassignedRegistrations([]);
      return;
    }

    setFlights(json.flights || []);
    setFlightPlayers(json.flight_players || []);
    setUnassignedRegistrations(json.unassigned_registrations || []);
    setMsg(
      `OK – Flights: ${json.flights?.length ?? 0} / Players: ${json.flight_players?.length ?? 0}`
    );
  }

  async function generateFlights() {
    if (!tournamentId) return;

    setBusy(true);
    setMsg("Generiere Flights…");

    try {
      const genRes = await fetch("/api/flights/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          round,
          td_pin: tdPin,
        }),
      });

      const genJson = await genRes.json().catch(() => ({}));

      if (!genRes.ok || !genJson?.ok) {
        setMsg(genJson?.error || "Fehler beim Generieren der Flights");
        return;
      }

      setMsg(
        `✅ Flights erstellt: flights_created=${genJson.flights_created} players_assigned=${genJson.players_assigned}`
      );

      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function generateStartTimes() {
    if (!tournamentId) return;

    setBusy(true);
    setMsg("Setze Startzeiten…");

    try {
      const timeRes = await fetch(START_TIMES_API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          round,
          td_pin: tdPin,
          start_time: "10:00",
          interval_minutes: 10,
          overwrite: true,
        }),
      });

      const timeJson = await timeRes.json().catch(() => ({}));

      if (!timeRes.ok || !timeJson?.ok) {
        setMsg(timeJson?.error || "Fehler beim Setzen der Startzeiten");
        return;
      }

      setMsg("✅ Startzeiten gesetzt ab 10:00");
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function generateMarkers() {
    if (!tournamentId) return;

    setBusy(true);
    setMsg("Generiere Zähler…");

    try {
      const res = await fetch(GENERATE_MARKERS_API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tournamentId,
          round,
          td_pin: tdPin,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setMsg(json?.error || "Fehler beim Generieren der Zähler");
        return;
      }

      setMsg(
        `✅ Zähler gesetzt: flights_found=${json.flights_found} players_updated=${json.players_updated}`
      );

      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function movePlayer(registrationId: string) {
    const targetFlightId = moveTargets[registrationId];
    if (!registrationId || !targetFlightId) return;

    setMoveBusy(registrationId);
    setMsg("Verschiebe Spieler…");

    try {
      const res = await fetch("/api/flights/move-player", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          target_flight_id: targetFlightId,
          td_pin: tdPin,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setMsg(json?.error || "Fehler beim Verschieben");
        return;
      }

      setMoveTargets((prev) => {
        const next = { ...prev };
        delete next[registrationId];
        return next;
      });

      await reload();
      setMsg("✅ Spieler verschoben");
    } finally {
      setMoveBusy("");
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

    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => {
        const aSeat = Number(a.seat ?? 0);
        const bSeat = Number(b.seat ?? 0);
        if (aSeat !== bSeat) return aSeat - bSeat;
        return String(a.id ?? "").localeCompare(String(b.id ?? ""));
      });
      m.set(k, arr);
    }

    return m;
  }, [flightPlayers]);

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f6f7f8",
    padding: 16,
    fontFamily:
      'Lato, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
  };

  const card: React.CSSProperties = {
    maxWidth: 1200,
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

  const title: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 0.2,
  };

  const controls: React.CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    padding: 16,
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  };

  const label: React.CSSProperties = {
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 4,
  };

  const input: React.CSSProperties = {
    height: 38,
    padding: "0 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    outline: "none",
    minWidth: 240,
  };

  const smallInput: React.CSSProperties = {
    ...input,
    minWidth: 0,
    width: 90,
    textAlign: "center",
  };

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

  const btnDark: React.CSSProperties = {
    ...btn,
    background: "#18392b",
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

  const playerRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns:
      "70px minmax(220px,1.2fr) minmax(180px,1fr) minmax(220px,1fr)",
    gap: 10,
    fontSize: 13,
    alignItems: "center",
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

  function flightStartTime(f: any) {
    const raw = f.start_time ?? f.tee_time ?? f.starts_at ?? null;
    if (!raw) return "-";

    try {
      return new Date(raw).toLocaleString("de-DE", {
        timeZone: "Europe/Berlin",
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return String(raw);
    }
  }

  function playerName(fp: any) {
    const p = fp?.registration;
    const name = `${p?.first_name || ""} ${p?.last_name || ""}`.trim();
    return name || safe(fp.registration_id);
  }

  function marksName(fp: any) {
    const p = fp?.marks_registration;
    const name = `${p?.first_name || ""} ${p?.last_name || ""}`.trim();
    return name || safe(fp.marks_registration_id);
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
              onChange={(e) =>
                setTdPin(e.target.value.replace(/[^\d]/g, "").slice(0, 8))
              }
              placeholder="1234"
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <button style={btn} onClick={reload} disabled={busy || !tournamentId}>
              Reload
            </button>

            <button
              style={btnPrimary}
              onClick={generateFlights}
              disabled={busy || !tournamentId}
            >
              Generate Flights
            </button>

            <button
              style={btn}
              onClick={generateStartTimes}
              disabled={busy || !tournamentId}
            >
              Generate Start Times
            </button>

            <button
              style={btnDark}
              onClick={generateMarkers}
              disabled={busy || !tournamentId}
            >
              Generate Zähler
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>
                      Flight {flightNo(f)} · Spieler: {fps.length}
                    </div>

                    <div style={{ opacity: 0.8, fontSize: 13 }}>
                      Round: {safe(f.round)} · Holes: {safe(flightHoles(f))} · Gender:{" "}
                      {safe(flightGender(f))} · Start: {flightStartTime(f)}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      borderTop: "1px solid rgba(0,0,0,0.06)",
                      paddingTop: 10,
                    }}
                  >
                    {fps.length === 0 ? (
                      <div style={{ opacity: 0.75 }}>Keine Spieler im Flight.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {fps.map((fp, idx) => (
                          <div key={fp.id ?? idx} style={playerRow}>
                            <div style={{ fontWeight: 800 }}>Seat {idx + 1}</div>

                            <div>
                              <div style={{ fontWeight: 700 }}>{playerName(fp)}</div>
                              <div style={{ opacity: 0.7, fontSize: 12 }}>
                                HCP: {safe(fp?.registration?.hcp)} · Club:{" "}
                                {safe(fp?.registration?.home_club)}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: 12, opacity: 0.7 }}>Marker</div>
                              <div>{marksName(fp)}</div>
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                              <select
                                style={{ ...input, minWidth: 0, width: "100%" }}
                                value={moveTargets[fp.registration_id] ?? ""}
                                onChange={(e) =>
                                  setMoveTargets((prev) => ({
                                    ...prev,
                                    [fp.registration_id]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">In Flight verschieben…</option>
                                {flights
                                  .filter((x) => String(x.id) !== String(fp.flight_id))
                                  .map((target) => (
                                    <option key={target.id} value={target.id}>
                                      Flight {flightNo(target)} · Spieler:{" "}
                                      {(playersByFlight.get(String(target.id)) || []).length} ·{" "}
                                      {safe(target.gender)} · {safe(target.holes)} Loch ·{" "}
                                      {flightStartTime(target)}
                                    </option>
                                  ))}
                              </select>

                              <button
                                style={btn}
                                disabled={
                                  moveBusy === fp.registration_id ||
                                  !moveTargets[fp.registration_id]
                                }
                                onClick={() => movePlayer(String(fp.registration_id))}
                              >
                                {moveBusy === fp.registration_id ? "..." : "Verschieben"}
                              </button>
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

          {unassignedRegistrations.length > 0 && (
            <div style={flightCard}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                Nicht zugewiesene Spieler
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {unassignedRegistrations.map((r: any) => (
                  <div
                    key={r.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(240px,1.2fr) minmax(220px,1fr)",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {`${r.first_name || ""} ${r.last_name || ""}`.trim() || r.id}
                      </div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>
                        Gender: {safe(r.gender)} · HCP: {safe(r.hcp)} · Holes:{" "}
                        {safe(r.holes)} · Club: {safe(r.home_club)}
                      </div>
                    </div>

                    <div style={{ opacity: 0.65, fontSize: 12 }}>
                      Noch nicht im Editor verschiebbar, weil dafür zuerst ein
                      Flight-Player-Eintrag angelegt werden müsste.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}