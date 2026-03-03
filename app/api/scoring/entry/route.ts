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
      !strokes
    ) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const payload: any = {
      tournament_id,
      round,
      hole_number,
      entered_by,
      for_registration_id,
      strokes,
    };

    // IMPORTANT:
    // Only write rule_ball / rule_note if the client actually sent them.
    // Otherwise we would overwrite existing values on "strokes-only" saves.
    if (typeof rule_ball !== "undefined") {
      payload.rule_ball = !!rule_ball;
    }

    if (typeof rule_note !== "undefined") {
      const s = String(rule_note ?? "").trim();
      payload.rule_note = s ? s : null;
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("hole_entries")
      .upsert(payload, {
        onConflict: "tournament_id,round,hole_number,entered_by,for_registration_id",
      });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}