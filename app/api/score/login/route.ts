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

async function findPlayerByPin(
  supabase: ReturnType<typeof getSupabase>,
  tournamentId: string,
  pin: string
) {
  const { data: player } = await supabase
    .from("players")
    .select("id,first_name,last_name,tournament_id,created_at")
    .eq("tournament_id", tournamentId)
    .eq("pin", pin)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return player ?? null;
}

async function findTournamentRegByName(
  supabase: ReturnType<typeof getSupabase>,
  tournamentId: string,
  firstName?: string | null,
  lastName?: string | null
) {
  if (!firstName || !lastName) return null;

  const { data: reg } = await supabase
    .from("tournament_registrations")
    .select("id,tournament_id,first_name,last_name")
    .eq("tournament_id", tournamentId)
    .eq("first_name", firstName)
    .eq("last_name", lastName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return reg ?? null;
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

    // 1) Try flight_pins first (new/robust source)
    let resolvedRole: string | null = null;
    let pinOkForTournament = false;

    const { data: fp } = await supabase
      .from("flight_pins")
      .select("pin,tournament_id,role")
      .eq("pin", pin)
      .limit(1)
      .maybeSingle();

    if (fp && String(fp.tournament_id) === tournamentId) {
      pinOkForTournament = true;
      resolvedRole = fp.role ? String(fp.role) : null;

      if (requestedRole && resolvedRole && requestedRole !== resolvedRole) {
        return NextResponse.json({ ok: false, error: "PIN role mismatch" }, { status: 403 });
      }
    }

    // 2) Fallback: old world (players) — important if flight_pins isn't filled on LIVE
    if (!pinOkForTournament) {
      const player = await findPlayerByPin(supabase, tournamentId, pin);
      if (!player) {
        return NextResponse.json({ ok: false, error: "PIN not found" }, { status: 401 });
      }
      pinOkForTournament = true;
      resolvedRole = "player";
    }

    // 3) Always try to fetch player to get name + stable id
    const player = await findPlayerByPin(supabase, tournamentId, pin);

    const name = player
      ? `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim()
      : "";

    // 4) Try to resolve registrationId (best) via tournament_registrations by name
    let registrationId: string | null = null;

    if (player) {
      const reg = await findTournamentRegByName(
        supabase,
        tournamentId,
        player.first_name,
        player.last_name
      );
      if (reg?.id) registrationId = reg.id;
    }

    // 5) Fallback registrationId: stable player id if available (better than pin:xxxx)
    if (!registrationId && player?.id) {
      registrationId = `player:${player.id}`;
    }

    if (!registrationId) {
      registrationId = `pin:${pin}`;
    }

    return NextResponse.json({
      ok: true,
      tournamentId,
      registrationId,
      role: resolvedRole ?? "player",
      name,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}