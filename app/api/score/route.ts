import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BAD_SAAROW = "d4a92ae2-6ecd-4043-8b5a-82414c597036";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function normStr(v: any) {
  return String(v ?? "").trim();
}

function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tournament_id = normStr(body.tournament_id);
    const player_id = normStr(body.player_id);
    const hole_number = toInt(body.hole_number);
    const strokes = toInt(body.strokes);

    const missing: string[] = [];
    if (!tournament_id) missing.push("tournament_id");
    if (!player_id) missing.push("player_id");
    if (!hole_number || hole_number < 1 || hole_number > 18)
      missing.push("hole_number(1..18)");
    if (!strokes || strokes < 1 || strokes > 25)
      missing.push("strokes(1..25)");

    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: `Missing/invalid fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Bad Saarow läuft aktuell in Runde 3.
    // Niemals alte R1/R2-Zeilen über den alten Conflict-Key überschreiben.
    if (tournament_id === BAD_SAAROW) {
      const { data: existing, error: findError } = await supabase
        .from("scores")
        .select("id")
        .eq("tournament_id", tournament_id)
        .eq("player_id", player_id)
        .eq("hole_number", hole_number)
        .eq("round_number", 3)
        .maybeSingle();

      if (findError) {
        return NextResponse.json(
          { ok: false, error: findError.message },
          { status: 400 }
        );
      }

      if (existing?.id) {
        const { data, error } = await supabase
          .from("scores")
          .update({
            strokes,
            round_number: 3,
            registration_id: player_id,
          })
          .eq("id", existing.id)
          .select("id,tournament_id,player_id,registration_id,hole_number,strokes,round_number,updated_at")
          .single();

        if (error) {
          return NextResponse.json(
            { ok: false, error: error.message },
            { status: 400 }
          );
        }

        return NextResponse.json({ ok: true, row: data });
      }

      const { data, error } = await supabase
        .from("scores")
        .insert({
          tournament_id,
          player_id,
          registration_id: player_id,
          hole_number,
          strokes,
          round_number: 3,
        })
        .select("id,tournament_id,player_id,registration_id,hole_number,strokes,round_number,updated_at")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ ok: true, row: data });
    }

    const { data, error } = await supabase
      .from("scores")
      .upsert(
        [{ tournament_id, player_id, hole_number, strokes }],
        { onConflict: "tournament_id,player_id,hole_number" }
      )
      .select("id,tournament_id,player_id,hole_number,strokes,updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
