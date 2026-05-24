import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key, { auth: { persistSession: false } });
}

function calcAgeGroup(birthdate: string, holes: number): string {
  const today = new Date();
  const birth = new Date(birthdate);
  const age = today.getFullYear() - birth.getFullYear();
  if (holes === 9) {
    if (age <= 8) return "U8";
    if (age <= 10) return "U10";
    return "U12";
  } else {
    if (age <= 14) return "U14";
    if (age <= 16) return "U16";
    if (age <= 18) return "U18";
    return "U21";
  }
}

function normalizeGender(g: string): string {
  const lower = (g || "").toLowerCase();
  if (lower.includes("girl") || lower === "f" || lower === "w" || lower === "female") return "Girls";
  if (lower.includes("boy") || lower === "m" || lower === "male") return "Boys";
  return g;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId") || "";
    if (!tournamentId) return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });

    const supabase = getServiceSupabase();

    // Registrierungen laden
    const { data: registrations } = await supabase
      .from("registrations")
      .select("id, first_name, last_name, hcp, home_club, gender, birthdate, holes, player_pin, flight_id, tournament_status, tournament_status_hole")
      .eq("tournament_id", tournamentId);

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ ok: true, players: [], live: false });
    }

    // Flights laden
    const { data: flights } = await supabase
      .from("flights")
      .select("id, flight_number, status, holes, round_number")
      .eq("tournament_id", tournamentId);

    const flightMap = new Map((flights || []).map((f: any) => [f.id, f]));

    // Scores laden
    const flightIds = (flights || []).map((f: any) => f.id);
    let scores: any[] = [];
    if (flightIds.length > 0) {
      const { data: scoreData } = await supabase
        .from("hole_scores")
        .select("flight_id, player_id, hole_number, strokes_self, penalty_strokes, confirmed, round_number")
        .in("flight_id", flightIds)
        .eq("confirmed", true);
      scores = scoreData || [];
    }

    // Scores pro Spieler pro Runde aggregieren
    const scoresByPlayer = new Map<string, Record<number, { strokes: number; holes: number }>>();
    for (const score of scores) {
      if (!scoresByPlayer.has(score.player_id)) {
        scoresByPlayer.set(score.player_id, { 1: { strokes: 0, holes: 0 }, 2: { strokes: 0, holes: 0 }, 3: { strokes: 0, holes: 0 } });
      }
      const flight = flightMap.get(score.flight_id);
      const round = score.round_number || flight?.round_number || 1;
      const entry = scoresByPlayer.get(score.player_id)!;
      if (!entry[round]) entry[round] = { strokes: 0, holes: 0 };
      entry[round].strokes += (score.strokes_self || 0) + (score.penalty_strokes || 0);
      entry[round].holes += 1;
    }

    const players = registrations.map((reg: any) => {
      const roundData = scoresByPlayer.get(reg.id) || { 1: { strokes: 0, holes: 0 }, 2: { strokes: 0, holes: 0 }, 3: { strokes: 0, holes: 0 } };
      const flight = reg.flight_id ? flightMap.get(reg.flight_id) : null;

      const r1 = roundData[1]?.holes > 0 ? roundData[1].strokes : null;
      const r2 = roundData[2]?.holes > 0 ? roundData[2].strokes : null;
      const r3 = roundData[3]?.holes > 0 ? roundData[3].strokes : null;
      const total = (r1 || 0) + (r2 || 0) + (r3 || 0) || null;
      const holesPlayed = (roundData[1]?.holes || 0) + (roundData[2]?.holes || 0) + (roundData[3]?.holes || 0);

      return {
        id: reg.id,
        name: `${reg.first_name} ${reg.last_name}`,
        first_name: reg.first_name,
        last_name: reg.last_name,
        hcp: reg.hcp,
        home_club: reg.home_club,
        gender: normalizeGender(reg.gender || ""),
        age_group: reg.birthdate ? calcAgeGroup(reg.birthdate, reg.holes || 18) : "",
        holes: reg.holes || 18,
        flight_number: flight?.flight_number || null,
        flight_status: flight?.status || null,
        round1: r1,
        round2: r2,
        round3: r3,
        total_strokes: total,
        holes_played: holesPlayed,
        is_live: holesPlayed > 0,
        is_finished: flight?.status === "completed",
        tournament_status: reg.tournament_status || null,
        tournament_status_hole: reg.tournament_status_hole || null,
      };
    });

    // Sortieren: nach Total, dann nach Nachname
    players.sort((a: any, b: any) => {const aDnf = a.tournament_status === "dnf" || a.tournament_status === "dq";
      const bDnf = b.tournament_status === "dnf" || b.tournament_status === "dq";
      if (aDnf && !bDnf) return 1;
      if (!aDnf && bDnf) return -1;
      if (a.total_strokes !== null && b.total_strokes !== null) return a.total_strokes - b.total_strokes;
      if (a.total_strokes !== null) return -1;
      if (b.total_strokes !== null) return 1;
      return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
    });

    return NextResponse.json({
      ok: true,
      players,
      live: players.some((p: any) => p.is_live),
      updated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
