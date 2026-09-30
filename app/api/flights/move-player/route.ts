import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normStr(v: any) {
  return String(v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function renumberFlight(supabase: any, flightId: string) {
  const { data: rows, error } = await supabase
    .from("flight_players")
    .select("id, seat")
    .eq("flight_id", flightId)
    .order("seat", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`renumber flight read failed: ${error.message}`);
  }

  for (let i = 0; i < (rows || []).length; i++) {
    const row = rows[i];
    const nextSeat = i + 1;

    if (Number(row.seat ?? 0) === nextSeat) continue;

    const { error: updateErr } = await supabase
      .from("flight_players")
      .update({ seat: nextSeat })
      .eq("id", row.id);

    if (updateErr) {
      throw new Error(`renumber flight update failed: ${updateErr.message}`);
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const tdPin = normStr(body.td_pin ?? body.tdPin);
    const requiredPin = normStr(process.env.TD_PIN || "");

    if (!requiredPin) {
      return jsonError("Missing TD_PIN on server", 500);
    }

    if (!tdPin || tdPin !== requiredPin) {
      return jsonError("TD_PIN invalid", 401);
    }

    const registrationId = normStr(body.registration_id);
    const targetFlightId = normStr(body.target_flight_id);

    if (!registrationId) return jsonError("Missing registration_id", 400);
    if (!targetFlightId) return jsonError("Missing target_flight_id", 400);

    const supabase = getServiceSupabase();

    const { data: targetFlight, error: targetFlightErr } = await supabase
      .from("flights")
      .select("id, tournament_id, round, flight_number")
      .eq("id", targetFlightId)
      .maybeSingle();

    if (targetFlightErr) {
      return jsonError(`target flight read failed: ${targetFlightErr.message}`, 500);
    }

    if (!targetFlight) {
      return jsonError("Target flight not found", 404);
    }

    // Registrierung prüfen, bevor ein Spieler verschoben oder neu zugeordnet wird.
    const { data: registration, error: registrationErr } = await supabase
      .from("registrations")
      .select("id, tournament_id, tournament_status")
      .eq("id", registrationId)
      .maybeSingle();

    if (registrationErr) {
      return jsonError(
        `registration read failed: ${registrationErr.message}`,
        500
      );
    }

    if (!registration) {
      return jsonError("Registration not found", 404);
    }

    if (
      normStr(registration.tournament_id) !==
      normStr(targetFlight.tournament_id)
    ) {
      return jsonError(
        "Player and target flight belong to different tournaments",
        409
      );
    }

    const registrationStatus = normStr(
      registration.tournament_status || "active"
    ).toLowerCase();

    if (["ns", "dq", "dnf"].includes(registrationStatus)) {
      return jsonError(
        "NS-, DQ- oder DNF-Spieler können keinem Flight zugeordnet werden.",
        409
      );
    }

    const { data: registrationRows, error: registrationRowsErr } = await supabase
      .from("flight_players")
      .select("id, flight_id, registration_id, seat, marks_registration_id")
      .eq("registration_id", registrationId);

    if (registrationRowsErr) {
      return jsonError(`flight_players read failed: ${registrationRowsErr.message}`, 500);
    }

    if (!registrationRows || registrationRows.length === 0) {
      const { data: targetRows, error: targetRowsErr } = await supabase
        .from("flight_players")
        .select("id, seat")
        .eq("flight_id", targetFlightId)
        .order("seat", { ascending: true });

      if (targetRowsErr) {
        return jsonError(
          `target flight read failed: ${targetRowsErr.message}`,
          500
        );
      }

      const nextSeat =
        Math.max(
          0,
          ...(targetRows || []).map((r: any) => Number(r.seat ?? 0))
        ) + 1;

      const { data: insertedRow, error: insertErr } = await supabase
        .from("flight_players")
        .insert({
          flight_id: targetFlightId,
          registration_id: registrationId,
          seat: nextSeat,
          marks_registration_id: null,
        })
        .select("id, flight_id, registration_id, seat")
        .single();

      if (insertErr) {
        return jsonError(
          `flight_players insert failed: ${insertErr.message}`,
          500
        );
      }

      return NextResponse.json({
        ok: true,
        registration_id: registrationId,
        target_flight_id: targetFlightId,
        seat: insertedRow.seat,
        round: targetFlight.round,
        tournament_id: targetFlight.tournament_id,
        created: true,
      });
    }

    const candidateFlightIds = Array.from(
      new Set(
        registrationRows
          .map((r: any) => normStr(r.flight_id))
          .filter(Boolean)
      )
    );

    if (candidateFlightIds.length === 0) {
      return jsonError("Player has no valid flight assignment", 404);
    }

    const { data: candidateFlights, error: candidateFlightsErr } = await supabase
      .from("flights")
      .select("id, tournament_id, round, flight_number")
      .in("id", candidateFlightIds);

    if (candidateFlightsErr) {
      return jsonError(`candidate flights read failed: ${candidateFlightsErr.message}`, 500);
    }

    const candidateFlightMap = new Map(
      (candidateFlights || []).map((f: any) => [normStr(f.id), f])
    );

    const existingRow =
      (registrationRows || []).find((r: any) => {
        const f = candidateFlightMap.get(normStr(r.flight_id));
        if (!f) return false;
        return (
          normStr(f.tournament_id) === normStr(targetFlight.tournament_id) &&
          Number(f.round) === Number(targetFlight.round)
        );
      }) || null;

    if (!existingRow) {
      return jsonError(
        "No flight assignment found for this player in the same tournament/round as the target flight",
        404
      );
    }

    const oldFlightId = normStr(existingRow.flight_id);

    if (oldFlightId === targetFlightId) {
      await renumberFlight(supabase, targetFlightId);

      return NextResponse.json({
        ok: true,
        registration_id: registrationId,
        target_flight_id: targetFlightId,
        seat: existingRow.seat,
        message: "Player already in target flight",
      });
    }

    const { data: targetRows, error: targetErr } = await supabase
      .from("flight_players")
      .select("id, registration_id, seat")
      .eq("flight_id", targetFlightId)
      .order("seat", { ascending: true });

    if (targetErr) {
      return jsonError(`target flight read failed: ${targetErr.message}`, 500);
    }

    const nextSeat =
      Math.max(0, ...(targetRows || []).map((r: any) => Number(r.seat ?? 0))) + 1;

    const { error: updateErr } = await supabase
      .from("flight_players")
      .update({
        flight_id: targetFlightId,
        seat: nextSeat,
        marks_registration_id: null,
      })
      .eq("id", existingRow.id);

    if (updateErr) {
      return jsonError(`flight_players update failed: ${updateErr.message}`, 500);
    }

    // Im alten Flight darf niemand den verschobenen Spieler weiterhin
    // als Zähler eingetragen haben.
    const { error: oldMarkerErr } = await supabase
      .from("flight_players")
      .update({ marks_registration_id: null })
      .eq("flight_id", oldFlightId)
      .eq("marks_registration_id", registrationId);

    if (oldMarkerErr) {
      return jsonError(
        `old flight marker cleanup failed: ${oldMarkerErr.message}`,
        500
      );
    }

    await renumberFlight(supabase, oldFlightId);
    await renumberFlight(supabase, targetFlightId);

    const { data: movedRow, error: movedErr } = await supabase
      .from("flight_players")
      .select("id, flight_id, registration_id, seat")
      .eq("id", existingRow.id)
      .maybeSingle();

    if (movedErr) {
      return jsonError(`moved player read failed: ${movedErr.message}`, 500);
    }

    return NextResponse.json({
      ok: true,
      registration_id: registrationId,
      old_flight_id: oldFlightId,
      target_flight_id: targetFlightId,
      seat: movedRow?.seat ?? nextSeat,
      round: targetFlight.round,
      tournament_id: targetFlight.tournament_id,
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}