import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId") || "";

    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Alle aktiven Flights laden
    const { data: flights } = await supabase
      .from("flights")
      .select("id, flight_number, status, holes")
      .eq("tournament_id", tournamentId)
      .in("status", ["active", "completed"]);

    if (!flights || flights.length === 0) {
      return NextResponse.json({ ok: true, players: [], live: false });
    }

    const flightIds = flights.map((f: any) => f.id);

    // Alle hole_scores für diese Flights laden
    const { data: scores } = await supabase
      .from("hole_scores")
      .select("flight_id, player_id, pin, hole_number, strokes_self, penalty_strokes, rule_ball, confirmed")
      .in("flight_id", flightIds)
      .eq("confirmed", true);

    // Alle Registrierungen für dieses Turnier laden
    const { data: registrations } = await supabase
      .from("registrations")
      .select("id, first_name, last_name, hcp, home_club, gender, birthdate, holes, player_pin, flight_id")
      .eq("tournament_id", tournamentId);

    if (!registrations) {
      return NextResponse.json({ ok: true, players: [], live: false });
    }

    // Scores pro Spieler aggregieren
    const scoresByPlayer = new Map<string, { totalStrokes: number; holesPlayed: number; penalties: number }>();

    for (const score of (scores || [])) {
      const key = score.player_id;
      if (!scoresByPlayer.has(key)) {
        scoresByPlayer.set(key, { totalStrokes: 0, holesPlayed: 0, penalties: 0 });
      }
      const entry = scoresByPlayer.get(key)!;
      entry.totalStrokes += score.strokes_self || 0;
      entry.penalties += score.penalty_strokes || 0;
      entry.holesPlayed += 1;
    }

    // Spieler mit Scores zusammenführen
    const players = registrations.map((reg: any) => {
      const scoreData = scoresByPlayer.get(reg.id);
      const flight = flights.find((f: any) => f.id === reg.flight_id);

      return {
        id: reg.id,
        name: `${reg.first_name} ${reg.last_name}`,
        first_name: reg.first_name,
        last_name: reg.last_name,
        hcp: reg.hcp,
        home_club: reg.home_club,
        gender: reg.gender,
        holes: reg.holes || 9,
        flight_number: flight?.flight_number || null,
        flight_status: flight?.status || null,
        total_strokes: scoreData ? scoreData.totalStrokes + scoreData.penalties : null,
        holes_played: scoreData?.holesPlayed || 0,
        thru: scoreData?.holesPlayed || 0,
        is_live: !!scoreData && scoreData.holesPlayed > 0,
        is_finished: flight?.status === "completed",
      };
    });

    // Nach Score sortieren
    players.sort((a: any, b: any) => {
      if (a.total_strokes !== null && b.total_strokes !== null) {
        return a.total_strokes - b.total_strokes;
      }
      if (a.total_strokes !== null) return -1;
      if (b.total_strokes !== null) return 1;
      return 0;
    });

    const hasLiveData = players.some((p: any) => p.is_live);

    return NextResponse.json({
      ok: true,
      players,
      live: hasLiveData,
      updated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
