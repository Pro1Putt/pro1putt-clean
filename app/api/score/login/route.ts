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

// Try to fetch tournament_registration by (tournament_id + player_pin) if that column exists.
// If not, fall back to finding a player by pin and matching by name (previous behavior).
async function findTournamentRegistration(
  supabase: ReturnType<typeof getSupabase>,
  tournamentId: string,
  pin: string
) {
  // 1) If tournament_registrations has player_pin, use it directly (best)
  // We'll probe by attempting a select with player_pin and gracefully ignore errors.
  try {
    const { data: regByPin } = await supabase
      .from("tournament_registrations")
      .select("id,tournament_id,first_name,last_name")
      .eq("tournament_id", tournamentId)
      // @ts-ignore - column may not exist; handled by try/catch
      .eq("player_pin", pin)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (regByPin) return regByPin;
  } catch {
    // ignore (column likely doesn't exist)
  }

  // 2) Fallback: old logic via players.pin -> match by name into tournament_registrations
  const { data: player } = await supabase
    .from("players")
    .select("first_name,last_name,tournament_id,created_at")
    .eq("tournament_id", tournamentId)
    .eq("pin", pin)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!player) return null;

  const { data: regByName } = await supabase
    .from("tournament_registrations")
    .select("id,tournament_id,first_name,last_name")
    .eq("tournament_id", tournamentId)
    .eq("first_name", player.first_name)
    .eq("last_name", player.last_name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return regByName ?? null;
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

    // ✅ Primary source of truth for PIN validity
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
      return NextResponse.json(
        { ok: false, error: "PIN not for this tournament" },
        { status: 403 }
      );
    }

    if (requestedRole && fp.role && String(fp.role) !== requestedRole) {
      return NextResponse.json(
        { ok: false, error: "PIN role mismatch" },
        { status: 403 }
      );
    }

    // Find tournament registration (needed by the app)
    const reg = await findTournamentRegistration(supabase, tournamentId, pin);

    if (!reg) {
      // PIN is valid, but we couldn't map to a tournament_registration record.
      // Still return ok:true so scoring can proceed; app will get a stable fallback id.
      return NextResponse.json({
        ok: true,
        tournamentId,
        registrationId: `pin:${pin}`, // fallback stable id
        role: fp.role ?? "player",
        name: "",
      });
    }

    return NextResponse.json({
      ok: true,
      tournamentId: reg.tournament_id,
      registrationId: reg.id,
      role: fp.role ?? "player",
      name: `${reg.first_name ?? ""} ${reg.last_name ?? ""}`.trim(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}