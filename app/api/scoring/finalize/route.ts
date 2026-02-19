import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function normStr(v: any) {
  return String(v ?? "").trim();
}

function roundCols(round: number) {
  if (round === 1) return { finalizedAt: "r1_finalized_at", pdfUrl: "r1_scorecard_pdf_url" };
  if (round === 2) return { finalizedAt: "r2_finalized_at", pdfUrl: "r2_scorecard_pdf_url" };
  return { finalizedAt: "r3_finalized_at", pdfUrl: "r3_scorecard_pdf_url" };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tournament_id = normStr(body.tournament_id);
    const registration_id = normStr(body.registration_id);
    const round = Number(body.round || 1);

    // role: player | marker | td
    const role = normStr(body.role);
    const signed_name = normStr(body.signed_name);
    const user_agent = normStr(body.user_agent || "");

    if (!tournament_id || !registration_id) {
      return NextResponse.json({ ok: false, error: "Missing tournament_id/registration_id" }, { status: 400 });
    }
    if (![1, 2, 3].includes(round)) {
      return NextResponse.json({ ok: false, error: "round must be 1,2,3" }, { status: 400 });
    }
    if (!["player", "marker", "td"].includes(role)) {
      return NextResponse.json({ ok: false, error: "role must be player|marker|td" }, { status: 400 });
    }
    if (!signed_name) {
      return NextResponse.json({ ok: false, error: "signed_name required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check: already finalized?
    const cols = roundCols(round);
    const { data: reg, error: rErr } = await supabase
      .from("registrations")
      .select(`id, ${cols.finalizedAt}`)
      .eq("id", registration_id)
      .eq("tournament_id", tournament_id)
      .single();

    if (rErr || !reg) {
      return NextResponse.json({ ok: false, error: "Registration not found" }, { status: 404 });
    }

    if ((reg as any)[cols.finalizedAt]) {
      // already finalized → still allow TD signature insert? no, lock.
      return NextResponse.json({ ok: false, error: "Scorecard already finalized" }, { status: 409 });
    }

    // Upsert signature for this role
    const ua = user_agent || req.headers.get("user-agent") || null;

    const { error: sErr } = await supabase
      .from("scorecard_signatures")
      .upsert(
        {
          tournament_id,
          registration_id,
          round,
          role,
          signed_name,
          user_agent: ua,
        },
        { onConflict: "tournament_id,registration_id,round,role" }
      );

    if (sErr) {
      return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });
    }

    // After inserting: do we have player+marker signatures?
    const { data: sigs, error: sigErr } = await supabase
      .from("scorecard_signatures")
      .select("role")
      .eq("tournament_id", tournament_id)
      .eq("registration_id", registration_id)
      .eq("round", round);

    if (sigErr) {
      return NextResponse.json({ ok: false, error: sigErr.message }, { status: 500 });
    }

    const roles = new Set((sigs || []).map((x: any) => x.role));
    const hasPlayer = roles.has("player");
    const hasMarker = roles.has("marker");

    // Only finalize if both are present
    if (hasPlayer && hasMarker) {
      const patch: any = {};
      patch[cols.finalizedAt] = new Date().toISOString();

      const { error: uErr } = await supabase
        .from("registrations")
        .update(patch)
        .eq("id", registration_id)
        .eq("tournament_id", tournament_id);

      if (uErr) {
        return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        finalized: true,
        missing: [],
      });
    }

    const missing: string[] = [];
    if (!hasPlayer) missing.push("player");
    if (!hasMarker) missing.push("marker");

    return NextResponse.json({
      ok: true,
      finalized: false,
      missing,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}