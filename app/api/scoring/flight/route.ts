import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tournamentId = String(searchParams.get("tournamentId") || "");
    const registrationId = String(searchParams.get("registrationId") || "");
    const round = Number(searchParams.get("round") || 1);

    if (!tournamentId || !registrationId) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Flight finden
    const { data: fp, error: fpErr } = await supabase
      .from("flight_players")
      .select("flight_id, registration_id, marks_registration_id")
      .eq("registration_id", registrationId);

    if (fpErr || !fp || fp.length === 0) {
      return NextResponse.json({ ok: false, error: "Flight not found" }, { status: 404 });
    }

    const flightId = fp[0].flight_id;

    // Flight Infos
    const { data: flight, error: fErr } = await supabase
      .from("flights")
      .select("id, flight_number, start_time, round")
      .eq("id", flightId)
      .eq("round", round)
      .single();

    if (fErr || !flight) {
      return NextResponse.json({ ok: false, error: "Flight not found for round" }, { status: 404 });
    }

    // Alle Spieler im Flight
    const { data: members, error: mErr } = await supabase
      .from("flight_players")
      .select("registration_id")
      .eq("flight_id", flightId);

    if (mErr) {
      return NextResponse.json({ ok: false, error: mErr.message }, { status: 500 });
    }

    const regIds = members.map((m: any) => m.registration_id);

    const { data: regs } = await supabase
      .from("registrations")
      .select("id,first_name,last_name,gender")
      .in("id", regIds);

    const enriched = (regs || []).map((r: any) => ({
      registration_id: r.id,
      first_name: r.first_name,
      last_name: r.last_name,
      gender: r.gender,
    }));

    const marker = fp[0].marks_registration_id;
    const marksPlayer = enriched.find((m) => m.registration_id === marker);

    return NextResponse.json({
      ok: true,
      info: {
        flight_id: flight.id,
        flight_number: flight.flight_number,
        start_time: flight.start_time,
        round: flight.round,
        members: enriched,
        you_mark: {
          marks_registration_id: marker,
          marks_name: marksPlayer
            ? `${marksPlayer.first_name} ${marksPlayer.last_name}`
            : "Unbekannt",
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}