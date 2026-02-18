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

    const tournamentId = String(searchParams.get("tournamentId") || "").trim();
    const registrationId = String(searchParams.get("registrationId") || "").trim();
    const round = Number(searchParams.get("round") || "1");
    const hole = Number(searchParams.get("hole") || "0");

    if (!tournamentId || !registrationId || !hole) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // wer zählt registrationId?
    const { data: whoMarksMe, error: wmErr } = await supabase
      .from("flight_players")
      .select("registration_id")
      .eq("marks_registration_id", registrationId)
      .limit(1);

    if (wmErr) {
      return NextResponse.json({ ok: false, error: wmErr.message }, { status: 500 });
    }

    const markerId = whoMarksMe?.[0]?.registration_id ?? null;

    // Eigener Eintrag (self)
    const { data: selfEntry } = await supabase
      .from("hole_entries")
      .select("strokes")
      .eq("tournament_id", tournamentId)
      .eq("round", round)
      .eq("hole_number", hole)
      .eq("entered_by", registrationId)
      .eq("for_registration_id", registrationId)
      .maybeSingle();

    // Marker-Eintrag (marker -> for me)
    const { data: markerEntry } = markerId
      ? await supabase
          .from("hole_entries")
          .select("strokes")
          .eq("tournament_id", tournamentId)
          .eq("round", round)
          .eq("hole_number", hole)
          .eq("entered_by", markerId)
          .eq("for_registration_id", registrationId)
          .maybeSingle()
      : { data: null as any };

    const self = selfEntry?.strokes ?? null;
    const marker = markerEntry?.strokes ?? null;

    const confirmed = self != null && marker != null && Number(self) === Number(marker);

    return NextResponse.json({
      ok: true,
      confirmed,
      self,
      marker,
      markerId,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}