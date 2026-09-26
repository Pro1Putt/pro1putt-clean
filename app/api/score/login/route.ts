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

    const tournamentId = String(
      body.tournamentId ??
        body.tournament_id ??
        body.tid ??
        body.tournament ??
        ""
    ).trim();

    const pinRaw =
      body.pin ??
      body.player_pin ??
      body.playerPin ??
      body.activePin ??
      body.pinCode ??
      body.pincode ??
      body.code ??
      body.PIN ??
      null;

    const pin = normPin(pinRaw);

    const requestedRoleRaw =
      body.role ?? body.userRole ?? body.type ?? body.requestedRole ?? "player";
    const requestedRole = String(requestedRoleRaw).trim();

    if (!tournamentId) {
      return NextResponse.json(
        { ok: false, error: "tournamentId missing" },
        { status: 400 }
      );
    }

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { ok: false, error: "PIN invalid" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 1) Für PLAYER-Login zuerst die registrations prüfen
    if (requestedRole === "player") {
     const { data: regs, error: regErr } = await supabase
  .from("registrations")
  .select("id, tournament_id, first_name, last_name, player_pin")
  .eq("tournament_id", tournamentId);

if (regErr) {
  return NextResponse.json(
    { ok: false, error: "DB error (registrations)", details: regErr.message, code: regErr.code },
    { status: 500 }
  );
}

let match =
  (regs ?? []).find((r: any) => normPin(r?.player_pin) === pin) ?? null;

let resolvedTournamentId = tournamentId;

// Sofort-Fallback für das laufende Bad-Saarow-Turnier.
// Alte App-Versionen wählen nach dem Startdatum bereits das nächste Turnier.
if (!match) {
  const badSaarowTournamentId = "d4a92ae2-6ecd-4043-8b5a-82414c597036";

  const { data: fallbackRegs, error: fallbackErr } = await supabase
    .from("registrations")
    .select("id, tournament_id, first_name, last_name, player_pin")
    .eq("tournament_id", badSaarowTournamentId);

  if (fallbackErr) {
    return NextResponse.json(
      { ok: false, error: "DB error (registrations fallback)", details: fallbackErr.message },
      { status: 500 }
    );
  }

  match =
    (fallbackRegs ?? []).find((r: any) => normPin(r?.player_pin) === pin) ?? null;

  if (match) {
    resolvedTournamentId = badSaarowTournamentId;
  }
}

if (!match) {
  return NextResponse.json(
    { ok: false, error: "PIN not found" },
    { status: 401 }
  );
}

      const name = `${match.first_name ?? ""} ${match.last_name ?? ""}`.trim();

      return NextResponse.json({
        ok: true,
        tournamentId: resolvedTournamentId,
        registrationId: String(match.id),
        role: "player",
        name,
        source: "registrations",
      });
    }

    // 2) Für andere Rollen weiterhin flight_pins nutzen
    const { data: fp, error: fpErr } = await supabase
      .from("flight_pins")
      .select("pin,tournament_id,role,player_name,is_active")
      .eq("pin", pin)
      .eq("tournament_id", tournamentId)
      .limit(1)
      .maybeSingle();

    if (fpErr) {
      return NextResponse.json(
        { ok: false, error: "DB error (flight_pins)" },
        { status: 500 }
      );
    }

    if (!fp) {
      return NextResponse.json(
        { ok: false, error: "PIN not found" },
        { status: 401 }
      );
    }

    if (requestedRole && fp.role && String(fp.role) !== requestedRole) {
      return NextResponse.json(
        { ok: false, error: "PIN role mismatch" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      tournamentId,
      registrationId: `flight-pin:${pin}`,
      role: fp.role ?? requestedRole,
      name: fp.player_name ?? "",
      source: "flight_pins",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}