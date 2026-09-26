import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("SCORING ENTRY HIT", JSON.stringify(body));

    const {
      tournament_id,
      round,
      hole_number,
      entered_by,
      for_registration_id,
      strokes,
      rule_ball,
      rule_note,
    } = body ?? {};

    if (
      !tournament_id ||
      !round ||
      !hole_number ||
      !entered_by ||
      !for_registration_id ||
      strokes === null ||
      typeof strokes === "undefined"
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing fields", body },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Alte installierte App sendet für Bad Saarow weiterhin Runde 1.
    // Server korrigiert diese Eingaben auf das laufende Turnier, Runde 2.
    const BAD_SAAROW_TOURNAMENT_ID = "d4a92ae2-6ecd-4043-8b5a-82414c597036";

    const { data: scoreRegistration } = await supabase
      .from("registrations")
      .select("tournament_id")
      .eq("id", for_registration_id)
      .maybeSingle();

    const isBadSaarow =
      scoreRegistration?.tournament_id === BAD_SAAROW_TOURNAMENT_ID;

    const effectiveTournamentId = isBadSaarow
      ? BAD_SAAROW_TOURNAMENT_ID
      : tournament_id;

    const effectiveRound =
      isBadSaarow && Number(round) === 1 ? 2 : Number(round);

    const holeEntryPayload: any = {
      tournament_id: effectiveTournamentId,
      round: effectiveRound,
      hole_number,
      entered_by,
      for_registration_id,
      strokes: Number(strokes),
    };

    if (typeof rule_ball !== "undefined") {
      holeEntryPayload.rule_ball = !!rule_ball;
    }

    if (typeof rule_note !== "undefined") {
      const s = String(rule_note ?? "").trim();
      holeEntryPayload.rule_note = s ? s : null;
    }

    const { error: holeEntryError } = await supabase
      .from("hole_entries")
      .upsert(holeEntryPayload, {
        onConflict: "tournament_id,round,hole_number,entered_by,for_registration_id",
      });

    if (holeEntryError) {
      console.log("HOLE_ENTRIES ERROR", holeEntryError.message);
      return NextResponse.json(
        { ok: false, error: holeEntryError.message, step: "hole_entries" },
        { status: 500 }
      );
    }

    const { error: scoreInsertError } = await supabase
      .from("scores")
      .insert({
        tournament_id: effectiveTournamentId,
        round_number: effectiveRound,
        hole_number: Number(hole_number),
        player_id: for_registration_id,
        registration_id: for_registration_id,
        entered_by,
        strokes: Number(strokes),
        ...(typeof rule_ball !== "undefined" ? { rule_ball_played: !!rule_ball } : {}),
        ...(typeof rule_note !== "undefined"
          ? { notes: String(rule_note ?? "").trim() || null }
          : {}),
      });

    if (scoreInsertError) {
      console.log("SCORES ERROR", scoreInsertError.message);
      return NextResponse.json(
        { ok: false, error: scoreInsertError.message, step: "scores" },
        { status: 500 }
      );
    }

    console.log("SCORING ENTRY SAVED OK");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.log("SCORING ENTRY CATCH", e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}