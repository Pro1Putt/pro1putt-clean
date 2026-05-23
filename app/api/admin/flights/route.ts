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

function calcStartTime(flightIndex: number): string {
  const totalMinutes = 10 * 60 + flightIndex * 10;
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

  const flights = (flightsData || []).map((f: any) => {
    const players = registrations.filter((r: any) => r.flight_id === f.id);
    return { ...f, players };
  });

  return NextResponse.json({ ok: true, registrations, flights });
}

export async function POST(req: Request) {
  const { tournamentId, round } = await req.json();
  const supabase = getSupabase();

  const { data: regs, error: regsError } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, hcp, gender, birthdate, holes, player_pin")
    .eq("tournament_id", tournamentId);

  if (regsError) return NextResponse.json({ ok: false, error: regsError.message });
  if (!regs || regs.length === 0) return NextResponse.json({ ok: false, error: "Keine Registrierungen" });

  await supabase.from("flights").delete().eq("tournament_id", tournamentId).eq("round", round);

  const registrations = regs.map((r: any) => ({
    ...r,
    gender: normalizeGender(r.gender || ""),
    hcp: r.hcp || 999,
  }));

  registrations.sort((a: any, b: any) => (a.hcp || 999) - (b.hcp || 999));

  const groups: any[][] = [];
  for (let i = 0; i < registrations.length; i += 3) {
    const group = registrations.slice(i, i + 3);
    if (group.length === 1 && groups.length > 0) {
      groups[groups.length - 1].push(group[0]);
    } else {
      groups.push(group);
    }
  }

  let flightsCreated = 0;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const h = group[0]?.holes || 18;
    const g = group[0]?.gender || "Boys";

    const { data: newFlight, error: insertError } = await supabase
      .from("flights")
      .insert({
        tournament_id: tournamentId,
        flight_number: i + 1,
        round: round,
        round_number: round,
        gender: g,
        status: "active",
        holes: h,
        start_time: calcStartTime(i),
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ ok: false, error: insertError.message });
    if (!newFlight) return NextResponse.json({ ok: false, error: "Flight konnte nicht erstellt werden" });

    for (const player of group) {
      await supabase.from("registrations").update({ flight_id: newFlight.id }).eq("id", player.id);
    }

    for (let j = 0; j < group.length; j++) {
      const player = group[j];
      const countsFor = group[(j + 1) % group.length];
      await supabase.from("flight_players").upsert({
        flight_id: newFlight.id,
        registration_id: player.id,
        marks_registration_id: countsFor.id,
        seat: j + 1,
      }, { onConflict: "flight_id,seat" });
    }

    for (const player of group) {
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

  return NextResponse.json({ ok: true, flights_created: flightsCreated });
}