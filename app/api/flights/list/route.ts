import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function normStr(v: any) {
  return String(v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

function jsonOk(payload: any) {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
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
    if (![1, 2, 3].includes(roundNo)) {
      return jsonError("round must be 1, 2, or 3", 400);
    }

    const supabase = getServiceSupabase();

    const { data: flights, error: fErr } = await supabase
      .from("flights")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", roundNo)
      .order("flight_number", { ascending: true });

    if (fErr) return jsonError(`flights read failed: ${fErr.message}`, 500);

    const flightIds = (flights || []).map((f: any) => String(f.id)).filter(Boolean);

    let flightPlayers: any[] = [];
    if (flightIds.length) {
      const { data: fps, error: fpErr } = await supabase
        .from("flight_players")
        .select(`
          id,
          flight_id,
          registration_id,
          marks_registration_id,
          seat,
          registration:registrations!flight_players_registration_id_fkey (
            id,
            first_name,
            last_name,
            gender,
            hcp,
            home_club,
            holes
          ),
          marks_registration:registrations!flight_players_marks_registration_id_fkey (
            id,
            first_name,
            last_name
          )
        `)
        .in("flight_id", flightIds)
        .order("flight_id", { ascending: true })
        .order("seat", { ascending: true })
        .order("id", { ascending: true });

      if (fpErr) return jsonError(`flight_players read failed: ${fpErr.message}`, 500);

      flightPlayers = (fps || []).map((fp: any, index: number) => ({
        ...fp,
        _row_index: index + 1,
      }));
    }

    const assignedRegistrationIds = new Set(
      flightPlayers
        .map((fp: any) => String(fp.registration_id ?? ""))
        .filter(Boolean)
    );

    const { data: allRegs, error: regErr } = await supabase
      .from("registrations")
      .select("id, first_name, last_name, gender, hcp, home_club, holes")
      .eq("tournament_id", tournamentId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (regErr) return jsonError(`registrations read failed: ${regErr.message}`, 500);

    const unassigned_registrations = (allRegs || []).filter(
      (r: any) => !assignedRegistrationIds.has(String(r.id))
    );

    return jsonOk({
      ok: true,
      tournamentId,
      round: roundNo,
      flights: flights || [],
      flight_players: flightPlayers,
      unassigned_registrations,
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}