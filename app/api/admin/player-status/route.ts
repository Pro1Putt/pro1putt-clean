import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { registrationId, status, hole, note } = await req.json();

  if (!registrationId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Status setzen
  const { error } = await supabase
    .from("registrations")
    .update({
      tournament_status: status,
      tournament_status_hole: hole ?? null,
      tournament_status_note: note ?? null,
    })
    .eq("id", registrationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Wenn DNF/DQ: Zähler neu zuweisen
  if (status === "dnf" || status === "dq") {
    // Wer zählt für den DNF-Spieler? (B marks A → B muss neuen Spieler bekommen)
    const { data: markerRow } = await supabase
      .from("flight_players")
      .select("registration_id, flight_id")
      .eq("marks_registration_id", registrationId)
      .maybeSingle();

    if (markerRow) {
      // Alle aktiven Spieler im Flight holen
      const { data: flightPlayers } = await supabase
        .from("flight_players")
        .select("registration_id, marks_registration_id")
        .eq("flight_id", markerRow.flight_id);

      const { data: regs } = await supabase
        .from("registrations")
        .select("id, tournament_status")
        .in("id", (flightPlayers || []).map((p: any) => p.registration_id));

      // Aktive Spieler (nicht DNF/DQ) außer dem DNF-Spieler selbst
      const active = (regs || []).filter(
        (r: any) => r.id !== registrationId && r.tournament_status !== "dnf" && r.tournament_status !== "dq"
      );

      if (active.length > 0) {
        // Nächsten aktiven Spieler zuweisen der noch keinen Zähler hat
        // oder einfach den ersten aktiven nehmen
        const newTarget = active[0];
        await supabase
          .from("flight_players")
          .update({ marks_registration_id: newTarget.id })
          .eq("registration_id", markerRow.registration_id)
          .eq("flight_id", markerRow.flight_id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}