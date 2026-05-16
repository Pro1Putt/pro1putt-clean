"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LivePlayer {
  id: string;
  name: string;
  hcp: number | null;
  home_club: string | null;
  gender: string | null;
  holes: number;
  flight_number: number | null;
  flight_status: string | null;
  total_strokes: number | null;
  holes_played: number;
  thru: number;
  is_live: boolean;
  is_finished: boolean;
}

interface Props {
  tournamentId: string;
}

export default function LiveLeaderboard({ tournamentId }: Props) {
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "girls" | "boys" | "9hole" | "18hole">("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-scoring?tournamentId=${tournamentId}`);
      const json = await res.json();
      if (json.ok) {
        setPlayers(json.players);
        setLive(json.live);
        setLastUpdate(json.updated_at);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel("live-leaderboard")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "hole_scores",
      }, () => {
        fetchData();
      })
      .subscribe();

    // Auch alle 30 Sekunden refreshen
    const interval = setInterval(fetchData, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchData]);

  const filteredPlayers = players.filter((p) => {
    if (activeFilter === "girls") return p.gender?.toLowerCase() === "female" || p.gender?.toLowerCase() === "girl" || p.gender === "f" || p.gender === "w";
    if (activeFilter === "boys") return p.gender?.toLowerCase() === "male" || p.gender?.toLowerCase() === "boy" || p.gender === "m";
    if (activeFilter === "9hole") return p.holes === 9;
    if (activeFilter === "18hole") return p.holes === 18;
    return true;
  });

  const livePlayers = filteredPlayers.filter(p => p.is_live || p.is_finished);
  const registeredPlayers = filteredPlayers.filter(p => !p.is_live && !p.is_finished);

  if (loading) {
    return (
      <div style={{
        background: "#ffffff",
        border: "1px solid rgba(11,93,59,0.08)",
        borderRadius: 24,
        padding: 32,
        textAlign: "center",
        color: "#668278",
      }}>
        Lade Live-Daten...
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Live Banner */}
      {live && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 18px",
          background: "linear-gradient(135deg, #0b5d3b, #147a52)",
          borderRadius: 999,
          width: "fit-content",
          color: "#fff",
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "#4eff91",
            display: "inline-block",
            boxShadow: "0 0 8px #4eff91",
            animation: "pulse 1.5s infinite",
          }} />
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 1 }}>
            LIVE SCORING AKTIV
          </span>
          {lastUpdate && (
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              · zuletzt {new Date(lastUpdate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "Alle" },
          { key: "girls", label: "Girls" },
          { key: "boys", label: "Boys" },
          { key: "18hole", label: "18 Loch" },
          { key: "9hole", label: "9 Loch" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key as any)}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              background: activeFilter === key ? "#0b5d3b" : "#ffffff",
              color: activeFilter === key ? "#ffffff" : "#17362b",
              border: activeFilter === key ? "1px solid #0b5d3b" : "1px solid rgba(11,93,59,0.10)",
              outline: "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Live Scores Tabelle */}
      {livePlayers.length > 0 && (
        <div style={{
          background: "#ffffff",
          border: "1px solid rgba(11,93,59,0.08)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(8,33,22,0.06)",
        }}>
          <div style={{
            padding: "18px 20px",
            background: "linear-gradient(135deg, #0b5d3b 0%, #147a52 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#4eff91",
              display: "inline-block",
              boxShadow: "0 0 8px #4eff91",
            }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>Live Leaderboard</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
                {livePlayers.filter(p => p.is_live && !p.is_finished).length} Spieler aktiv ·{" "}
                {livePlayers.filter(p => p.is_finished).length} abgeschlossen
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 700 }}>
              {/* Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "60px 40px minmax(180px,2fr) minmax(140px,1.5fr) 80px 80px 80px 80px",
                gap: 8,
                padding: "12px 16px",
                background: "#f3f8f5",
                borderBottom: "1px solid rgba(11,93,59,0.10)",
                fontSize: 12,
                fontWeight: 800,
                color: "#35524a",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}>
                <div>Pl.</div>
                <div></div>
                <div>Name</div>
                <div>Club</div>
                <div style={{ textAlign: "center" }}>HCP</div>
                <div style={{ textAlign: "center" }}>Thru</div>
                <div style={{ textAlign: "center" }}>Score</div>
                <div style={{ textAlign: "center" }}>Status</div>
              </div>

              {/* Rows */}
              {livePlayers.map((player, index) => {
                const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
                return (
                  <div
                    key={player.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "60px 40px minmax(180px,2fr) minmax(140px,1.5fr) 80px 80px 80px 80px",
                      gap: 8,
                      padding: "14px 16px",
                      borderTop: "1px solid rgba(11,93,59,0.08)",
                      background: player.is_finished ? "#f7fbf8" : "#fff",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 900, color: "#0b5d3b", fontSize: 16 }}>
                      {index + 1}
                    </div>
                    <div style={{ fontSize: 18 }}>{medal}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#17362b" }}>{player.name}</div>
                      <div style={{ fontSize: 12, color: "#668278" }}>
                        {player.holes} Loch{player.flight_number ? ` · Flight ${player.flight_number}` : ""}
                      </div>
                    </div>
                    <div style={{ color: "#4f675e", fontSize: 14 }}>{player.home_club || "—"}</div>
                    <div style={{ textAlign: "center", color: "#17362b" }}>
                      {player.hcp != null ? player.hcp : "—"}
                    </div>
                    <div style={{ textAlign: "center", color: "#17362b", fontWeight: 700 }}>
                      {player.thru > 0 ? `${player.thru}/${player.holes}` : "—"}
                    </div>
                    <div style={{ textAlign: "center", fontWeight: 900, fontSize: 18, color: "#17362b" }}>
                      {player.total_strokes ?? "—"}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {player.is_finished ? (
                        <span style={{
                          background: "#e8f5ee", color: "#0b5d3b",
                          padding: "4px 10px", borderRadius: 999,
                          fontSize: 11, fontWeight: 800,
                        }}>✓ Fertig</span>
                      ) : (
                        <span style={{
                          background: "#fff3e0", color: "#e65100",
                          padding: "4px 10px", borderRadius: 999,
                          fontSize: 11, fontWeight: 800,
                          animation: "pulse 2s infinite",
                        }}>● Live</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Angemeldete Spieler (noch nicht gestartet) */}
      {registeredPlayers.length > 0 && (
        <div style={{
          background: "#ffffff",
          border: "1px solid rgba(11,93,59,0.08)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(8,33,22,0.06)",
        }}>
          <div style={{
            padding: "18px 20px",
            background: "#f3f8f5",
            borderBottom: "1px solid rgba(11,93,59,0.10)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#17362b" }}>
              Angemeldete Spieler
            </div>
            <div style={{ fontSize: 13, color: "#668278", marginTop: 2 }}>
              {registeredPlayers.length} Spieler noch nicht gestartet
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 600 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(180px,2fr) minmax(140px,1.5fr) 80px 80px",
                gap: 8,
                padding: "12px 16px",
                background: "#f8fbf9",
                borderBottom: "1px solid rgba(11,93,59,0.10)",
                fontSize: 12,
                fontWeight: 800,
                color: "#35524a",
                textTransform: "uppercase",
              }}>
                <div>Name</div>
                <div>Club</div>
                <div style={{ textAlign: "center" }}>HCP</div>
                <div style={{ textAlign: "center" }}>Loch</div>
              </div>

              {registeredPlayers.map((player) => (
                <div
                  key={player.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(180px,2fr) minmax(140px,1.5fr) 80px 80px",
                    gap: 8,
                    padding: "12px 16px",
                    borderTop: "1px solid rgba(11,93,59,0.06)",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#17362b" }}>{player.name}</div>
                  <div style={{ color: "#4f675e", fontSize: 14 }}>{player.home_club || "—"}</div>
                  <div style={{ textAlign: "center", color: "#17362b" }}>
                    {player.hcp != null ? player.hcp : "—"}
                  </div>
                  <div style={{ textAlign: "center", color: "#17362b", fontSize: 13 }}>
                    {player.holes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {players.length === 0 && (
        <div style={{
          background: "#ffffff",
          border: "1px solid rgba(11,93,59,0.08)",
          borderRadius: 24,
          padding: 32,
          textAlign: "center",
          color: "#668278",
        }}>
          Noch keine Spieler für dieses Turnier angemeldet.
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
