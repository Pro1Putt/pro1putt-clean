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
  return s.replace(/\D/g, "").slice(0, 4);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tournamentId = String(body.tournamentId ?? body.tournament_id ?? "").trim();
    const pin = normPin(body.pin);
    const requestedRoleRaw = body.role ?? body.requestedRole ?? null;
    const requestedRole = requestedRoleRaw ? String(requestedRoleRaw).trim() : null;

    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "tournamentId missing" }, { status: 400 });
    }
    if (!pin || pin.length !== 4) {
      return NextResponse.json({ ok: false, error: "PIN invalid" }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1) PIN muss in flight_pins existieren und zum Turnier passen
    const { data: fp, error: fpErr } = await supabase
      .from("flight_pins")
      .select("pin,tournament_id,role")
      .eq("pin", pin)
      .limit(1)
      .maybeSingle();

    if (fpErr) {
      return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
    }
    if (!fp) {
      return NextResponse.json({ ok: false, error: "PIN not found" }, { status: 401 });
    }
    if (String(fp.tournament_id) !== tournamentId) {
      return NextResponse.json({ ok: false, error: "PIN not for this tournament" }, { status: 403 });
    }
    if (requestedRole && fp.role && String(fp.role) !== requestedRole) {
      return NextResponse.json({ ok: false, error: "PIN role mismatch" }, { status: 403 });
    }

    // 2) Name + echte ID aus registrations holen
    // robust: nicht nur eq(player_pin), sondern Kandidaten laden und per normPin matchen
    const { data: regs, error: regsErr } = await supabase
      .from("registrations")
      .select("id,first_name,last_name,player_pin,created_at")
      .ilike("player_pin", `%${pin}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (regsErr) {
      return NextResponse.json({
        ok: true,
        tournamentId,
        registrationId: `pin:${pin}`,
        role: fp.role ?? "player",
        name: "",
        source: "flight_pins",
        note: "registrations lookup error",
      });
    }

    const match = (regs ?? []).find((r: any) => normPin(r?.player_pin) === pin) ?? null;

    const name = match ? `${match.first_name ?? ""} ${match.last_name ?? ""}`.trim() : "";

    return NextResponse.json({
      ok: true,
      tournamentId,
      registrationId: match?.id ? String(match.id) : `pin:${pin}`,
      role: fp.role ?? "player",
      name,
      source: "flight_pins",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}