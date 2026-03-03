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

async function findRegistrationByPin(
  supabase: ReturnType<typeof getSupabase>,
  pin: string,
  tournamentId?: string
) {
  // tournament_registrations hat bei dir first_name/last_name etc.
  // Wir matchen über players (PIN) -> Name -> tournament_registrations
  if (tournamentId) {
    const { data: player } = await supabase
      .from("players")
      .select("first_name,last_name,tournament_id,created_at")
      .eq("tournament_id", tournamentId)
      .eq("player_pin", pin)
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

      if (reg) return { reg, player };
    }
  }

  // Fallback: PIN global -> newest player -> registration via name
  const { data: anyPlayer } = await supabase
    .from("players")
    .select("first_name,last_name,tournament_id,created_at")
    .eq("player_pin", pin)
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

  return { reg: anyReg, player: anyPlayer };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tournamentId = String(body.tournamentId ?? body.tournament_id ?? "").trim();
    const pin = normPin(body.pin);

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ ok: false, error: "PIN invalid" }, { status: 400 });
    }

    const supabase = getSupabase();

    const found = await findRegistrationByPin(supabase, pin, tournamentId || undefined);

    if (!found) {
      return NextResponse.json({ ok: false, error: "PIN not found" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      tournamentId: found.reg.tournament_id,
      registrationId: found.reg.id, // ✅ das braucht die App
      role: "player",
      name: `${found.reg.first_name ?? ""} ${found.reg.last_name ?? ""}`.trim(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}