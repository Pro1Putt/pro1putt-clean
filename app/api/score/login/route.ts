import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function normPin(v: any) {
  const s = String(v ?? "").trim();
  // nur Ziffern, max 4
  const digits = s.replace(/\D/g, "").slice(0, 4);
  return digits;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // akzeptiere beide Namen
    const tournamentId = String(body.tournamentId ?? body.tournament_id ?? "").trim();
    const pin = normPin(body.pin);

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ ok: false, error: "PIN invalid" }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1) Wenn tournamentId vorhanden: erst dort suchen
    if (tournamentId) {
      const { data, error } = await supabase
        .from("registrations")
        .select("id,tournament_id")
        .eq("tournament_id", tournamentId)
        .eq("player_pin", pin)
        .single();

      if (data && !error) {
        return NextResponse.json({ ok: true, registrationId: data.id });
      }
    }

    // 2) Fallback: PIN global suchen (hilft, wenn falsches Turnier geöffnet wurde)
    const { data: anyRow, error: anyErr } = await supabase
      .from("registrations")
      .select("id,tournament_id")
      .eq("player_pin", pin)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (anyErr || !anyRow) {
      return NextResponse.json({ ok: false, error: "PIN not found" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, registrationId: anyRow.id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}