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

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const tdPin = normStr(body.td_pin ?? body.tdPin);
    const requiredPin = normStr(process.env.TD_PIN || "");

    if (requiredPin && tdPin !== requiredPin) {
      return jsonError("TD_PIN invalid", 401);
    }

    const flightPlayerId = normStr(body.flight_player_id);
    const markerRegistrationId = normStr(body.marker_registration_id);

    if (!flightPlayerId) {
      return jsonError("Missing flight_player_id", 400);
    }

    if (!markerRegistrationId) {
      return jsonError("Missing marker_registration_id", 400);
    }

    const supabase = getServiceSupabase();

    // Spieler laden, dessen Zähler geändert werden soll
    const { data: flightPlayer, error: flightPlayerErr } = await supabase
      .from("flight_players")
      .select("id, flight_id, registration_id, marks_registration_id")
      .eq("id", flightPlayerId)
      .maybeSingle();

    if (flightPlayerErr) {
      return jsonError(
        `flight player read failed: ${flightPlayerErr.message}`,
        500
      );
    }

    if (!flightPlayer) {
      return jsonError("Flight player not found", 404);
    }

    // Prüfen, ob der ausgewählte Zähler im selben Flight spielt
    const { data: markerPlayer, error: markerPlayerErr } = await supabase
      .from("flight_players")
      .select("id, flight_id, registration_id")
      .eq("flight_id", flightPlayer.flight_id)
      .eq("registration_id", markerRegistrationId)
      .maybeSingle();

    if (markerPlayerErr) {
      return jsonError(
        `marker player read failed: ${markerPlayerErr.message}`,
        500
      );
    }

    if (!markerPlayer) {
      return jsonError(
        "Der ausgewählte Zähler befindet sich nicht im selben Flight.",
        400
      );
    }

    // Ein Spieler soll sich nicht selbst zählen
    if (
      normStr(flightPlayer.registration_id) ===
      normStr(markerRegistrationId)
    ) {
      return jsonError(
        "Ein Spieler kann nicht sein eigener Zähler sein.",
        400
      );
    }

    // Zähler setzen
    const { error: updateErr } = await supabase
      .from("flight_players")
      .update({
        marks_registration_id: markerRegistrationId,
      })
      .eq("id", flightPlayerId);

    if (updateErr) {
      return jsonError(
        `marker update failed: ${updateErr.message}`,
        500
      );
    }

    return NextResponse.json({
      ok: true,
      flight_player_id: flightPlayerId,
      registration_id: flightPlayer.registration_id,
      marker_registration_id: markerRegistrationId,
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}
