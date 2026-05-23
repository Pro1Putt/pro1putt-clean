import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function calcAgeGroup(birthdate: string, holes: number): string {
  const today = new Date();
  const birth = new Date(birthdate);
  const age = today.getFullYear() - birth.getFullYear();
  if (holes === 9) {
    if (age <= 8) return "U8";
    if (age <= 10) return "U10";
    return "U12";
  }
  if (age <= 14) return "U14";
  if (age <= 16) return "U16";
  if (age <= 18) return "U18";
  return "U21";
}

function normalizeGender(g: string): string {
  const lower = (g || "").toLowerCase();
  if (lower.includes("girl") || lower === "f" || lower === "w") return "Girls";
  if (lower.includes("boy") || lower === "m") return "Boys";
  return g;
}

function makeFlights(players: any[], flightNumberStart: number, gender: string, round: number) {
  if (players.length === 0) return [];
  
  const flights = [];
  let flightNum = flightNumberStart;

  for (let i = 0; i < players.length; i += 3) {
    const group = players.slice(i, i + 3);
    if (group.length === 1 && flights.length > 0) {
      flights[flights.length - 1].players.push(group[0]);
    } else {
      flights.push({ flightNum: flightNum++, gender, round, players: group });
    }
  }

  return flights;
}

// Startzeit berechnen: 10:00 Uhr + 10 Minuten pro Flight
function calcStartTime(flightIndex: number): string {
  const startHour = 10;
  const startMinute = 0;
  const totalMinutes = startHour * 60 + startMinute + flightIndex * 10;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId") || "";
  const round = parseInt(searchParams.get("round") || "1");

  const supabase = getSupabase();

  const { data: regs } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, hcp, gender, birthdate, holes, flight_id, player_pin, tournament_status, tournament_status_hole, tournament_status_note")
    .eq("tournament_id", tournamentId);

  const registrations = (regs || []).map((r: any) => ({
    ...r,
    gender: normalizeGender(r.gender || ""),
    age_group: r.birthdate ? calcAgeGroup(r.birthdate, r.holes || 18) : "",
  }));

  const { data: flightsData } = await supabase
    .from("flights")
    .select("id, flight_number, round, gender, status, holes, start_time")
    .eq("tournament_id", tournamentId)
    .eq("round", round)
    .order("flight_number");

  const flights = await Promise.all((flightsData || []).map(async (f: any) => {
    const players = registrations.filter((r: any) => r.flight_id === f.id);
    return { ...f, players };
  }));

  return NextResponse.json({ ok: true, registrations, flights });
}

export async function POST(req: Request) {
  const { tournamentId, round } = await req.json();
  const supabase = getSupabase();

  const { data: regs } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, hcp, gender, birthdate, holes, player_pin")
    .eq("tournament_id", tournamentId);

  if (!regs || regs.length === 0) {
    return NextResponse.json({ ok: false, error: "Keine Registrierungen gefunden" });
  }

  const registrations = regs.map((r: any) => ({
    ...r,
    gender: normalizeGender(r.gender || ""),
    age_group: r.birthdate ? calcAgeGroup(r.birthdate, r.holes || 18) : "",
    hcp: r.hcp || 999,
  }));

  // Bestehende Flights löschen
  const { data: existingFlights } = await supabase
    .from("flights")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("round", round);

  if (existingFlights && existingFlights.length > 0) {
    await supabase.from("flights").delete().eq("tournament_id", tournamentId).eq("round", round);
  }

  // Sortierung je nach Runde
  let sortedRegs = [...registrations];
  if (round === 1) {
    sortedRegs.sort((a, b) => (a.hcp || 999) - (b.hcp || 999));
  } else {
    const { data: scores } = await supabase
      .from("hole_scores")
      .select("player_id, strokes_self, penalty_strokes")
      .in("player_id", registrations.map((r: any) => r.id))
      .eq("confirmed", true);

    const totalByPlayer = new Map<string, number>();
    for (const s of (scores || [])) {
      const cur = totalByPlayer.get(s.player_id) || 0;
      totalByPlayer.set(s.player_id, cur + (s.strokes_self || 0) + (s.penalty_strokes || 0));
    }

    sortedRegs.sort((a, b) => {
      const aScore = totalByPlayer.get(a.id) || 999;
      const bScore = totalByPlayer.get(b.id) || 999;
      if (round === 2) return aScore - bScore;
      return bScore - aScore;
    });
  }

  // Girls/Boys/9Loch trennen
  const girls18 = sortedRegs.filter(r => r.gender === "Girls" && r.holes === 18);
  const boys18 = sortedRegs.filter(r => r.gender === "Boys" && r.holes === 18);
  const nine = sortedRegs.filter(r => r.holes === 9);

  let flightNum = 1;
  const allFlightGroups = [
    ...makeFlights(girls18, flightNum, "Girls", round),
    ...makeFlights(boys18, flightNum + Math.ceil(girls18.length / 3), "Boys", round),
    ...makeFlights(nine, flightNum + Math.ceil(girls18.length / 3) + Math.ceil(boys18.length / 3), "9Loch", round),
  ];

  // Flights speichern
  let flightsCreated = 0;
  let flightIndex = 0;

  for (const group of allFlightGroups) {
    const startTime = calcStartTime(flightIndex);
    // 9-Loch Flights starten nach allen 18-Loch Flights
    const is9hole = group.gender === "9Loch";
    const total18Flights = Math.ceil(girls18.length / 3) + Math.ceil(boys18.length / 3);
    const adjustedIndex = is9hole
      ? total18Flights + allFlightGroups.filter(g => g.gender === "9Loch").indexOf(group)
      : flightIndex;
    const finalStartTime = calcStartTime(adjustedIndex);

    const { data: newFlight, error: flightError } = await supabase
      .from("flights")
      .insert({
        tournament_id: tournamentId,
        flight_number: group.flightNum,
        round: group.round,
        round_number: group.round,
        gender: group.gender,
        status: "active",
        holes: group.players[0]?.holes || 18,
        start_time: finalStartTime,
      })
      .select()
      .single();
      if (flightError) {
  console.error("Flight insert error:", flightError);
  continue;
}

    if (newFlight) {
      // Spieler dem Flight zuweisen
      for (const player of group.players) {
        await supabase
          .from("registrations")
          .update({ flight_id: newFlight.id })
          .eq("id", player.id);
      }

      // flight_players mit Zähler-Zuweisung
      for (let i = 0; i < group.players.length; i++) {
        const player = group.players[i];
        const countsFor = group.players[(i + 1) % group.players.length];
        await supabase.from("flight_players").upsert({
          flight_id: newFlight.id,
          registration_id: player.id,
          marks_registration_id: countsFor.id,
          seat: i + 1,
        }, { onConflict: "flight_id,seat" });
      }

      // flight_pins befüllen (wichtig für hole_scores!)
      for (const player of group.players) {
        await supabase.from("flight_pins").upsert({
          tournament_id: tournamentId,
          flight_id: newFlight.id,
          role: "player",
          player_name: `${player.first_name} ${player.last_name}`,
          pin: player.player_pin,
        }, { onConflict: "pin,flight_id" });
      }

      flightsCreated++;
    }

    flightIndex++;
  }

  return NextResponse.json({ ok: true, flights_created: flightsCreated });
}
