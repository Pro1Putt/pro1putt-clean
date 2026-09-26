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
    let round = Number(searchParams.get("round") || 1);

    // Sofortlösung für das laufende Bad-Saarow-Turnier:
    // Alte installierte Apps senden weiterhin round=1.
    // Für Registrierungen dieses Turniers muss aktuell Runde 2 geladen werden.
    const BAD_SAAROW_TOURNAMENT_ID = "d4a92ae2-6ecd-4043-8b5a-82414c597036";

    if (!tournamentId || !registrationId) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: currentRegistration } = await supabase
      .from("registrations")
      .select("tournament_id")
      .eq("id", registrationId)
      .maybeSingle();

    if (
      currentRegistration?.tournament_id === BAD_SAAROW_TOURNAMENT_ID &&
      round === 1
    ) {
      round = 3;
    }

    // Flight finden
    const { data: fp, error: fpErr } = await supabase
      .from("flight_players")
      .select("flight_id, registration_id, marks_registration_id")
      .eq("registration_id", registrationId);

    if (fpErr || !fp || fp.length === 0) {
      return NextResponse.json({ ok: false, error: "Flight not found" }, { status: 404 });
    }

    // Passenden Flight für die angefragte Runde und das Turnier finden
    const flightIds = fp.map((row: any) => row.flight_id);

    const { data: matchingFlights, error: fErr } = await supabase
      .from("flights")
      .select("id, flight_number, start_time, round, tournament_id")
      .in("id", flightIds)
      .eq("round", round);

    if (fErr) {
      return NextResponse.json({ ok: false, error: fErr.message }, { status: 500 });
    }

    // Bevorzugt das angefragte Turnier. Falls eine alte App noch die ID
    // des nächsten Turniers sendet, verwenden wir den Flight der Registration.
    const flight =
      (matchingFlights || []).find((f: any) => f.tournament_id === tournamentId) ||
      (matchingFlights || [])[0];

    if (!flight) {
      return NextResponse.json({ ok: false, error: "Flight not found for round" }, { status: 404 });
    }

    const flightId = flight.id;

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

    // Marker aus genau dem ausgewählten Flight verwenden
    const currentFlightPlayer = fp.find(
      (row: any) => row.flight_id === flightId
    );

    const marker = currentFlightPlayer?.marks_registration_id ?? null;

    // Marker kann in Runde 2 auch in einem anderen Flight spielen.
    // Deshalb den Namen direkt aus registrations laden.
    let marksPlayer = null;

    if (marker) {
      const { data: markerRegistration } = await supabase
        .from("registrations")
        .select("id, first_name, last_name")
        .eq("id", marker)
        .maybeSingle();

      if (markerRegistration) {
        marksPlayer = {
          registration_id: markerRegistration.id,
          first_name: markerRegistration.first_name,
          last_name: markerRegistration.last_name,
        };
      }
    }

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