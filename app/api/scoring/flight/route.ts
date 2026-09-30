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
    const requestedRound = searchParams.get("round");
    let round = requestedRound ? Number(requestedRound) : null;

    if (!tournamentId || !registrationId) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
    }

    if (round !== null && (![1, 2, 3].includes(round))) {
      return NextResponse.json({ ok: false, error: "Invalid round" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Spielerstatus prüfen, bevor irgendein Scoring gestartet wird.
    const { data: playerRegistration, error: playerRegistrationErr } =
      await supabase
        .from("registrations")
        .select("id, tournament_id, tournament_status")
        .eq("id", registrationId)
        .eq("tournament_id", tournamentId)
        .maybeSingle();

    if (playerRegistrationErr) {
      return NextResponse.json(
        { ok: false, error: playerRegistrationErr.message },
        { status: 500 }
      );
    }

    if (!playerRegistration) {
      return NextResponse.json(
        { ok: false, error: "Registration not found for tournament" },
        { status: 404 }
      );
    }

    const playerStatus = String(
      playerRegistration.tournament_status || "active"
    ).toLowerCase();

    if (["ns", "dq", "dnf"].includes(playerStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            playerStatus === "ns"
              ? "Spieler ist als NS gemeldet"
              : playerStatus === "dq"
              ? "Spieler ist disqualifiziert"
              : "Spieler ist als DNF gemeldet",
        },
        { status: 409 }
      );
    }

    // Alle Flight-Zuordnungen dieses Spielers laden.
    // Daraus wird anschließend der aktuelle Flight für dieses Turnier
    // und den tatsächlichen Spieltag bestimmt.
    const { data: fp, error: fpErr } = await supabase
      .from("flight_players")
      .select("flight_id, registration_id, marks_registration_id")
      .eq("registration_id", registrationId);

    if (fpErr || !fp || fp.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Flight not found" },
        { status: 404 }
      );
    }

    const flightIds = fp.map((row: any) => row.flight_id);

    // Wenn keine Runde übergeben wurde, bestimmt der Server die Runde
    // anhand des play_date der Flights dieses Turniers.
    if (round === null) {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      // Beim Apple-Review-Testturnier darf der vorbereitete Testflight
      // unabhängig vom Prüfungstag verwendet werden.
      const APPLE_REVIEW_TOURNAMENT_ID = "e9b23d74-ab9d-4ba5-86bf-744915e1ee28";

      let todayFlightsQuery = supabase
        .from("flights")
        .select("round")
        .in("id", flightIds)
        .eq("tournament_id", tournamentId);

      if (tournamentId !== APPLE_REVIEW_TOURNAMENT_ID) {
        todayFlightsQuery = todayFlightsQuery.eq("play_date", today);
      }

      const { data: todayFlights, error: todayFlightsErr } = await todayFlightsQuery
        .order("round", { ascending: true })
        .limit(1);

      if (todayFlightsErr) {
        return NextResponse.json(
          { ok: false, error: todayFlightsErr.message },
          { status: 500 }
        );
      }

      if (!todayFlights?.length) {
        return NextResponse.json(
          { ok: false, error: "No round scheduled for today" },
          { status: 404 }
        );
      }

      round = Number(todayFlights[0].round);
    }

    // Passenden Flight für die angefragte Runde und das Turnier finden
    const { data: matchingFlights, error: fErr } = await supabase
      .from("flights")
      .select("id, flight_number, start_time, round, tournament_id, play_date")
      .in("id", flightIds)
      .eq("tournament_id", tournamentId)
      .eq("round", round);

    if (fErr) {
      return NextResponse.json({ ok: false, error: fErr.message }, { status: 500 });
    }

    if (!matchingFlights?.length) {
      return NextResponse.json(
        { ok: false, error: "Flight not found for round" },
        { status: 404 }
      );
    }

    if (matchingFlights.length !== 1) {
      return NextResponse.json(
        {
          ok: false,
          error: "Multiple flights found for player in tournament and round",
        },
        { status: 409 }
      );
    }

    const flight = matchingFlights[0];
    const flightId = flight.id;

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

    // Sicherheitsprüfung:
    // Scoring darf nur starten, wenn ein echter Zähler im selben Flight
    // dieser Runde eingeteilt ist.
    if (!marker) {
      return NextResponse.json(
        { ok: false, error: "Kein Zähler für diesen Spieler festgelegt" },
        { status: 409 }
      );
    }

    if (String(marker) === String(registrationId)) {
      return NextResponse.json(
        { ok: false, error: "Ungültige Zählerzuordnung: Spieler kann nicht sich selbst zählen" },
        { status: 409 }
      );
    }

    const markerIsInSameFlight = regIds.some(
      (id: any) => String(id) === String(marker)
    );

    if (!markerIsInSameFlight) {
      return NextResponse.json(
        { ok: false, error: "Ungültige Zählerzuordnung: Zähler ist nicht im selben Flight" },
        { status: 409 }
      );
    }

    // Namen des bereits validierten Zählers laden.
    let marksPlayer = null;

    if (marker) {
      const { data: markerRegistration } = await supabase
        .from("registrations")
        .select("id, first_name, last_name, tournament_status")
        .eq("id", marker)
        .maybeSingle();

      if (!markerRegistration) {
        return NextResponse.json(
          { ok: false, error: "Zähler-Registrierung nicht gefunden" },
          { status: 409 }
        );
      }

      const markerStatus = String(
        markerRegistration.tournament_status || "active"
      ).toLowerCase();

      if (["ns", "dq", "dnf"].includes(markerStatus)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Ungültige Zählerzuordnung: Zähler ist nicht aktiv",
          },
          { status: 409 }
        );
      }

      marksPlayer = {
        registration_id: markerRegistration.id,
        first_name: markerRegistration.first_name,
        last_name: markerRegistration.last_name,
      };
    }

    return NextResponse.json({
      ok: true,
      info: {
        flight_id: flight.id,
        flight_number: flight.flight_number,
        start_time: flight.start_time,
        round: flight.round,
        play_date: flight.play_date,
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
