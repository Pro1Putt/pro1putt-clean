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
  first_name: string;
  last_name: string;
  hcp: number | null;
  home_club: string | null;
  gender: string;
  age_group: string;
  holes: number;
  flight_number: number | null;
  flight_status: string | null;
  round1: number | null;
  round2: number | null;
  round3: number | null;
  total_strokes: number | null;
  holes_played: number;
  is_live: boolean;
 is_finished: boolean;
  tournament_status: string | null;
  tournament_status_hole: number | null;
}

interface Props {
  tournamentId: string;
}

const AGE_GROUP_ORDER = ["U14", "U16", "U18", "U21", "U12", "U10", "U8"];

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

export default function LiveLeaderboard({ tournamentId }: Props) {
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"girls" | "boys" | "9hole">("girls");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-scoring?tournamentId=${tournamentId}`);
      const json = await res.json();
      if (json.ok) {
        setPlayers(json.players);
        setLive(json.live);
        setLastUpdate(json.updated_at);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel("live-lb")
      .on("postgres_changes", { event: "*", schema: "public", table: "hole_scores" }, fetchData)
      .subscribe();
    const interval = setInterval(fetchData, 30000);
    return () => { channel.unsubscribe(); clearInterval(interval); };
  }, [fetchData]);

  if (loading) return (
    <div style={{ background: "#ffffff", border: "1px solid rgba(11,93,59,0.08)", borderRadius: 24, padding: 32, textAlign: "center", color: "#668278" }}>
      Lade Live-Daten...
    </div>
  );

  const girls18 = players.filter(p => p.gender === "Girls" && p.holes === 18);
  const boys18 = players.filter(p => p.gender === "Boys" && p.holes === 18);
  const nine = players.filter(p => p.holes === 9);

  const groupByAge = (list: LivePlayer[]) => {
    const groups: Record<string, LivePlayer[]> = {};
    for (const p of list) {
      const key = p.age_group || "Offen";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  };

  const sortedKeys = (groups: Record<string, LivePlayer[]>) =>
    Object.keys(groups).sort((a, b) => {
      const ai = AGE_GROUP_ORDER.indexOf(a), bi = AGE_GROUP_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1; if (bi === -1) return -1;
      return ai - bi;
    });

  const renderSection = (title: string, subtitle: string, group: LivePlayer[]) => {
    // Rang berechnen
    const ranked = [...group].map((p, i) => ({ ...p, rank: i + 1 }));

    return (
      <div key={title} style={{ background: "#ffffff", border: "1px solid rgba(11,93,59,0.08)", borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 30px rgba(8,33,22,0.06)", marginBottom: 16 }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", background: "linear-gradient(135deg, #0b5d3b 0%, #147a52 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{title}</div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{subtitle}</div>
          </div>
          {live && group.some(p => p.is_live) && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4eff91", display: "inline-block" }} />
              LIVE
            </span>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            {/* Tabellen Header - genau wie Winston Open */}
            <div style={{ display: "grid", gridTemplateColumns: "64px 40px minmax(200px,2fr) minmax(150px,1.5fr) 80px 80px 80px 80px 90px 80px", gap: 8, padding: "14px 16px", background: "#f3f8f5", borderBottom: "1px solid rgba(11,93,59,0.10)", fontSize: 13, fontWeight: 800, color: "#35524a" }}>
              <div>Pl.</div>
              <div></div>
              <div>Name</div>
              <div>Club</div>
              <div style={{ textAlign: "center" }}>HCP</div>
              <div style={{ textAlign: "center" }}>R1</div>
              <div style={{ textAlign: "center" }}>R2</div>
              <div style={{ textAlign: "center" }}>R3</div>
              <div style={{ textAlign: "center" }}>Total</div>
              <div style={{ textAlign: "center" }}>+/-</div>
            </div>

            {/* Spieler Zeilen */}
            {ranked.map((player) => {
              const par = (player.holes === 9 ? 36 : 72);
              const totalPar = player.total_strokes != null ? player.total_strokes - (par * (player.round3 != null ? 3 : player.round2 != null ? 2 : 1)) : null;
              const toPar = player.total_strokes != null ? (player.total_strokes > par ? `+${player.total_strokes - par * (player.round3 != null ? 3 : player.round2 != null ? 2 : 1)}` : player.total_strokes === par ? "E" : `${player.total_strokes - par * (player.round3 != null ? 3 : player.round2 != null ? 2 : 1)}`) : "—";

              return (
                <div key={player.id} style={{ display: "grid", gridTemplateColumns: "64px 40px minmax(200px,2fr) minmax(150px,1.5fr) 80px 80px 80px 80px 90px 80px", gap: 8, padding: "14px 16px", borderTop: "1px solid rgba(11,93,59,0.08)", background: "#ffffff", alignItems: "center" }}>
                  <div style={{ fontWeight: 900, color: "#0b5d3b" }}>
                    {player.total_strokes != null ? player.rank : "—"}
                  </div>
                  <div style={{ fontSize: 18 }}>{player.total_strokes != null ? medal(player.rank) : ""}</div>
                  <div style={{ fontWeight: 800, color: "#17362b", display: "flex", alignItems: "center", gap: 6 }}>
  {player.name}
  {player.tournament_status === "dnf" && (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 999, background: "#fff3e0", color: "#e65100" }}>
      DNF {player.tournament_status_hole ? `ab Loch ${player.tournament_status_hole}` : ""}
    </span>
  )}
  {player.tournament_status === "dq" && (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 999, background: "#fde8e8", color: "#c00" }}>
      DQ
    </span>
  )}
</div>
                  <div style={{ color: "#4f675e" }}>{player.home_club || "—"}</div>
                  <div style={{ textAlign: "center", color: "#17362b" }}>{player.hcp ?? "—"}</div>
                  <div style={{ textAlign: "center", color: "#17362b" }}>
                    {player.round1 ?? <span style={{ color: "#ccc" }}>—</span>}
                  </div>
                  <div style={{ textAlign: "center", color: "#17362b" }}>
                    {player.round2 ?? <span style={{ color: "#ccc" }}>—</span>}
                  </div>
                  <div style={{ textAlign: "center", color: "#17362b" }}>
                    {player.round3 ?? <span style={{ color: "#ccc" }}>—</span>}
                  </div>
                  <div style={{ textAlign: "center", fontWeight: 900, color: "#17362b" }}>
                    {player.total_strokes ?? <span style={{ color: "#ccc" }}>—</span>}
                  </div>
                  <div style={{ textAlign: "center", fontWeight: 900, color: "#17362b" }}>
                    {player.total_strokes != null ? toPar : <span style={{ color: "#ccc" }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "14px 20px 18px", fontSize: 12, color: "#5a6f65" }}>
          * Gleichstand im Gesamtergebnis.
          {lastUpdate && <span style={{ marginLeft: 12, opacity: 0.7 }}>Aktualisiert: {new Date(lastUpdate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</span>}
        </div>
      </div>
    );
  };

  const renderGroups = (groups: Record<string, LivePlayer[]>, holeLabel: string, genderLabel: string) => {
    const keys = sortedKeys(groups);
    if (keys.length === 0) return (
      <div style={{ background: "#ffffff", border: "1px solid rgba(11,93,59,0.08)", borderRadius: 24, padding: 32, textAlign: "center", color: "#668278" }}>
        Noch keine Spieler angemeldet.
      </div>
    );
    return <>{keys.map(key => renderSection(`${genderLabel} ${key}`, `${holeLabel} · Brutto`, groups[key]))}</>;
  };

  const girlsGroups = groupByAge(girls18);
  const boysGroups = groupByAge(boys18);
  const nineGroups = groupByAge(nine);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Live Banner */}
      {live && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", background: "linear-gradient(135deg, #0b5d3b, #147a52)", borderRadius: 999, width: "fit-content", color: "#fff" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4eff91", display: "inline-block", boxShadow: "0 0 8px #4eff91" }} />
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 1 }}>LIVE SCORING AKTIV</span>
          {lastUpdate && <span style={{ fontSize: 12, opacity: 0.8 }}>· {new Date(lastUpdate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</span>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", background: "rgba(243,247,244,0.8)", backdropFilter: "blur(10px)", padding: 8, borderRadius: 999 }}>
        {[
          { key: "girls", label: `Girls (${girls18.length})` },
          { key: "boys", label: `Boys (${boys18.length})` },
          { key: "9hole", label: `9 Loch (${nine.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key as any)} style={{ padding: "12px 18px", borderRadius: 999, fontWeight: 800, fontSize: 14, cursor: "pointer", background: activeTab === key ? "#0b5d3b" : "#ffffff", color: activeTab === key ? "#ffffff" : "#17362b", border: activeTab === key ? "1px solid #0b5d3b" : "1px solid rgba(11,93,59,0.10)", outline: "none", boxShadow: activeTab === key ? "0 10px 24px rgba(11,93,59,0.18)" : "0 4px 14px rgba(8,33,22,0.06)" }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "girls" && renderGroups(girlsGroups, "18 Loch", "Girls")}
      {activeTab === "boys" && renderGroups(boysGroups, "18 Loch", "Boys")}
      {activeTab === "9hole" && renderGroups(nineGroups, "9 Loch", "9 Loch")}
    </div>
  );
}
