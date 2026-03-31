"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ScoreRow = {
  hole_number: number | null;
  strokes: number | null;
};

export default function PlayerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const playerId = String(params.id || "");
  const tournamentId = searchParams.get("tournamentId") || "";

  const [playerName, setPlayerName] = useState("");
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        if (!playerId || !tournamentId) {
          setError("Fehlende Spieler- oder Turnier-ID.");
          return;
        }

        const { data: reg, error: regError } = await supabase
          .from("registrations")
          .select("first_name, last_name")
          .eq("id", playerId)
          .single();

        if (regError) {
          setError(regError.message);
          return;
        }

        setPlayerName(
          `${reg?.first_name || ""} ${reg?.last_name || ""}`.trim()
        );

        const { data: scoreData, error: scoreError } = await supabase
          .from("scores")
          .select("hole_number, strokes")
          .eq("player_id", playerId)
          .eq("tournament_id", tournamentId)
          .order("hole_number", { ascending: true });

        if (scoreError) {
          setError(scoreError.message);
          return;
        }

        setScores((scoreData || []) as ScoreRow[]);
      } catch (e: any) {
        setError(e?.message || "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [playerId, tournamentId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8f7",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <button
          onClick={() => window.history.back()}
          style={{
            marginBottom: 16,
            border: "none",
            background: "#e8efe9",
            padding: "10px 14px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ← Zurück
        </button>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            margin: "0 0 20px 0",
          }}
        >
          {playerName || "Spieler"}
        </h1>

        {loading ? (
          <div>Lade Scores...</div>
        ) : error ? (
          <div style={{ color: "red", fontWeight: 700 }}>{error}</div>
        ) : scores.length === 0 ? (
          <div>Keine Scores gefunden.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {scores.map((s, idx) => (
              <div
                key={`${s.hole_number}-${idx}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: "1px solid #e6e6e6",
                  borderRadius: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  Loch {s.hole_number ?? "-"}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  {s.strokes ?? "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}