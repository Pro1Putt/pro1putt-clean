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
    } = body;

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

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("hole_entries")
      .upsert(
        {
          tournament_id,
          round,
          hole_number,
          entered_by,
          for_registration_id,
          strokes,
          rule_ball: !!rule_ball,
          rule_note: rule_note || null,
        },
        {
          onConflict:
            "tournament_id,round,hole_number,entered_by,for_registration_id",
        }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}