import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      registrationId,
      status,
      hole,
      note,
      tournamentId,
      round,
      td_pin,
      tdPin,
    } = await req.json();

    const requiredPin = String(process.env.TD_PIN || "").trim();
    const providedPin = String(td_pin ?? tdPin ?? "").trim();

    if (!requiredPin) {
      return NextResponse.json(
        { ok: false, error: "Missing TD_PIN on server" },
        { status: 500 }
      );
    }

    if (!providedPin || providedPin !== requiredPin) {
      return NextResponse.json(
        { ok: false, error: "TD_PIN invalid" },
        { status: 401 }
      );
    }

    if (!registrationId || !status) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    if (!["active", "dnf", "dq", "ns"].includes(String(status))) {
      return NextResponse.json(
        { ok: false, error: "Invalid player status" },
        { status: 400 }
      );
    }

    const { data: registration, error: registrationErr } = await supabase
      .from("registrations")
      .select("id, tournament_id")
      .eq("id", registrationId)
      .maybeSingle();

    if (registrationErr) {
      return NextResponse.json(
        { ok: false, error: registrationErr.message },
        { status: 500 }
      );
    }

    if (!registration) {
      return NextResponse.json(
        { ok: false, error: "Registration not found" },
        { status: 404 }
      );
    }

    if (
      tournamentId &&
      String(registration.tournament_id) !== String(tournamentId)
    ) {
      return NextResponse.json(
        { ok: false, error: "Registration does not belong to tournament" },
        { status: 409 }
      );
    }

    if (["dnf", "dq", "ns"].includes(String(status)) && round != null) {
      const roundNo = Number(round);

      if (![1, 2, 3].includes(roundNo)) {
        return NextResponse.json(
          { ok: false, error: "Invalid round" },
          { status: 400 }
        );
      }
    }

    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        tournament_status: status,
        tournament_status_hole: hole ?? null,
        tournament_status_note: note ?? null,
      })
      .eq("id", registrationId)
      .eq("tournament_id", registration.tournament_id);

    if (updateErr) {
      return NextResponse.json(
        { ok: false, error: updateErr.message },
        { status: 500 }
      );
    }

    if (["dnf", "dq", "ns"].includes(String(status)) && round != null) {
      const roundNo = Number(round);


      const { data: flights, error: flightsErr } = await supabase
        .from("flights")
        .select("id")
        .eq("tournament_id", registration.tournament_id)
        .gte("round", roundNo);

      if (flightsErr) {
        return NextResponse.json(
          { ok: false, error: flightsErr.message },
          { status: 500 }
        );
      }

      const flightIds = (flights || []).map((f: any) => String(f.id));

      if (flightIds.length) {
        const { data: playerRows, error: playerRowsErr } = await supabase
          .from("flight_players")
          .select("id, flight_id")
          .eq("registration_id", registrationId)
          .in("flight_id", flightIds);

        if (playerRowsErr) {
          return NextResponse.json(
            { ok: false, error: playerRowsErr.message },
            { status: 500 }
          );
        }

        for (const playerRow of playerRows || []) {
          const flightId = String(playerRow.flight_id);

          // Der ausgeschiedene Spieler zählt niemanden mehr.
          const { error: ownMarkerErr } = await supabase
            .from("flight_players")
            .update({ marks_registration_id: null })
            .eq("id", playerRow.id);

          if (ownMarkerErr) {
            return NextResponse.json(
              { ok: false, error: ownMarkerErr.message },
              { status: 500 }
            );
          }

          // Niemand in diesem Flight darf den ausgeschiedenen Spieler
          // weiterhin als Zähler eingetragen haben.
          const { error: otherMarkerErr } = await supabase
            .from("flight_players")
            .update({ marks_registration_id: null })
            .eq("flight_id", flightId)
            .eq("marks_registration_id", registrationId);

          if (otherMarkerErr) {
            return NextResponse.json(
              { ok: false, error: otherMarkerErr.message },
              { status: 500 }
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
