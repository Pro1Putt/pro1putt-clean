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

// OLD fallback: players(pin) -> tournament_registrations by name
async function findRegistrationByPlayersPin(
  supabase: ReturnType<typeof getSupabase>,
  pin: string,
  tournamentId?: string
) {
  if (tournamentId) {
    const { data: player } = await supabase
      .from("players")
      .select("first_name,last_name,tournament_id,created_at")
      .eq("tournament_id", tournamentId)
      .eq("pin", pin)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (player) {
      const { data: reg } = await supabase
        .from("tournament_registrations")
        .select("id,tournament_id,first_name,last_name")
        .eq("tournament_id", player.tournament_id)
        .eq("first_name", player.first_name)
        .eq("last_name", player.last_name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reg) return { reg, role: "player" as const };
    }
  }

  // global fallback: newest player with this pin
  const { data: anyPlayer } = await supabase
    .from("players")
    .select("first_name,last_name,tournament_id,created_at")
    .eq("pin", pin)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!anyPlayer) return null;

  const { data: anyReg } = await supabase
    .from("tournament_registrations")
    .select("id,tournament_id,first_name,last_name")
    .eq("tournament_id", anyPlayer.tournament_id)
    .eq("first_name", anyPlayer.first_name)
    .eq("last_name", anyPlayer.last_name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!anyReg) return null;

  return { reg: anyReg, role: "player" as const };
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

    // 1) NEW: Try flight_pins first
    const { data: fp, error: fpErr } = await supabase
      .from("flight_pins")
      .select("pin,tournament_id,role")
      .eq("pin", pin)
      .limit(1)
      .maybeSingle();

    if (fpErr) {
      // don't fail hard; fall back to old method
      // (keeps login working even if flight_pins isn't present in that env)
    }

    if (fp && String(fp.tournament_id) === tournamentId) {
      if (requestedRole && fp.role && String(fp.role) !== requestedRole) {
        return NextResponse.json({ ok: false, error: "PIN role mismatch" }, { status: 403 });
      }

      // Try to return a real registrationId; if not possible, use stable fallback
      // (the app wants registrationId)
      let registrationId: string | null = null;
      let name = "";

      // Best effort: if tournament_registrations has player_pin, match directly
      try {
        const { data: regByPin } = await supabase
          .from("tournament_registrations")
          .select("id,first_name,last_name,tournament_id")
          .eq("tournament_id", tournamentId)
          // @ts-ignore
          .eq("player_pin", pin)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (regByPin) {
          registrationId = regByPin.id;
          name = `${regByPin.first_name ?? ""} ${regByPin.last_name ?? ""}`.trim();
        }
      } catch {
        // ignore
      }

      return NextResponse.json({
        ok: true,
        tournamentId,
        registrationId: registrationId ?? `pin:${pin}`,
        role: fp.role ?? "player",
        name,
        source: "flight_pins",
      });
    }

    // 2) FALLBACK: Old method via players.pin -> tournament_registrations by name
    const found = await findRegistrationByPlayersPin(supabase, pin, tournamentId || undefined);

    if (!found) {
      return NextResponse.json({ ok: false, error: "PIN not found" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      tournamentId: found.reg.tournament_id,
      registrationId: found.reg.id,
      role: found.role,
      name: `${found.reg.first_name ?? ""} ${found.reg.last_name ?? ""}`.trim(),
      source: "players_fallback",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}