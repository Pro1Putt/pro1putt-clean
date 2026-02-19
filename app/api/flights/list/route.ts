import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normStr(v: any) {
  return String(v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const tournamentId = normStr(u.searchParams.get("tournamentId"));
    const roundNo = Number(u.searchParams.get("round") ?? "1");

    if (!tournamentId) return jsonError("Missing tournamentId", 400);
    if (![1, 2, 3].includes(roundNo)) return jsonError("round must be 1, 2, or 3", 400);

    const supabase = getServiceSupabase();

    // flights: try to order by flight_no if it exists, otherwise by created_at, otherwise no order
    // We'll just fetch all columns and order by id as a safe fallback.
    const { data: flights, error: fe } = await supabase
      .from("flights")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", roundNo)
      .order("id", { ascending: true });

    if (fe) return jsonError(`flights read failed: ${fe.message}`, 500);

    const flightIds = (flights || []).map((f: any) => String(f.id)).filter(Boolean);

    let flightPlayers: any[] = [];
    if (flightIds.length) {
      const { data: fps, error: pe } = await supabase
        .from("flight_players")
        .select("*")
        .in("flight_id", flightIds);

      if (pe) return jsonError(`flight_players read failed: ${pe.message}`, 500);
      flightPlayers = fps || [];
    }

    return NextResponse.json({
      ok: true,
      tournamentId,
      round: roundNo,
      flights: flights || [],
      flight_players: flightPlayers,
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}
