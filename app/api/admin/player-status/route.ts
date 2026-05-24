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

  if (status === "dnf" || status === "dq") {
    const { data: dnfRow } = await supabase
      .from("flight_players")
      .select("registration_id, flight_id, marks_registration_id")
      .eq("registration_id", registrationId)
      .maybeSingle();

    if (dnfRow) {
      const { data: markerRow } = await supabase
        .from("flight_players")
        .select("registration_id, flight_id")
        .eq("marks_registration_id", registrationId)
        .eq("flight_id", dnfRow.flight_id)
        .maybeSingle();

      if (markerRow) {
        const newTarget = dnfRow.marks_registration_id;
        if (newTarget && newTarget !== registrationId) {
          await supabase
            .from("flight_players")
            .update({ marks_registration_id: newTarget })
            .eq("registration_id", markerRow.registration_id)
            .eq("flight_id", dnfRow.flight_id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}