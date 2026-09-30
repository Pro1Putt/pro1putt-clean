import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normStr(v: any) {
  return String(v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tournamentId = normStr(body.tournamentId);
    const roundNo = Number(body.round ?? 1);
    const tdPin = normStr(body.td_pin ?? body.tdPin ?? "");
    const requiredPin = normStr(process.env.TD_PIN || "");

    if (!tournamentId) return jsonError("Missing tournamentId", 400);
    if (![1, 2, 3].includes(roundNo)) return jsonError("round must be 1, 2, or 3", 400);
    if (!requiredPin) return jsonError("Missing TD_PIN on server", 500);
    if (!tdPin || tdPin !== requiredPin) return jsonError("TD_PIN invalid", 401);

    const supabase = await getServiceSupabase();

    const { data: flights, error: flightsErr } = await supabase
      .from("flights")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("round", roundNo)
      .order("flight_number", { ascending: true });

    if (flightsErr) return jsonError(`flights read failed: ${flightsErr.message}`, 500);

    const flightIds = (flights || []).map((f: any) => String(f.id)).filter(Boolean);

    if (!flightIds.length) {
      return NextResponse.json({
        ok: true,
        tournamentId,
        round: roundNo,
        flights_found: 0,
        players_updated: 0,
      });
    }

    const { data: flightPlayers, error: fpErr } = await supabase
      .from("flight_players")
      .select(`
          id,
          flight_id,
          registration_id,
          seat,
          registration:registrations!flight_players_registration_id_fkey (
            tournament_status
          )
        `)
      .in("flight_id", flightIds)
      .order("flight_id", { ascending: true })
      .order("seat", { ascending: true })
      .order("id", { ascending: true });

    if (fpErr) return jsonError(`flight_players read failed: ${fpErr.message}`, 500);

    const byFlight = new Map<string, any[]>();

    for (const fp of flightPlayers || []) {
      const fid = String(fp.flight_id || "");
      if (!fid) continue;
      if (!byFlight.has(fid)) byFlight.set(fid, []);
      byFlight.get(fid)!.push(fp);
    }

   const updates: any[] = [];
    let playersUpdated = 0;

    for (const fid of flightIds) {
      const members = byFlight.get(fid) || [];
      if (!members.length) continue;

      const activeMembers = members.filter((member: any) => {
        const registration = Array.isArray(member.registration)
          ? member.registration[0]
          : member.registration;

        const status = String(
          registration?.tournament_status || "active"
        ).toLowerCase();

        return !["ns", "dq", "dnf"].includes(status);
      });

      // Genau ein Update pro Spieler:
      // aktive Spieler erhalten ihren Zähler, ausgeschiedene Spieler NULL.
      const markerByPlayerId = new Map<string, string>();

      if (activeMembers.length >= 2) {
        for (let i = 0; i < activeMembers.length; i++) {
          const current = activeMembers[i];
          const next = activeMembers[(i + 1) % activeMembers.length];

          markerByPlayerId.set(
            String(current.id),
            String(next.registration_id)
          );
        }
      }

      for (const member of members) {
        const markerRegistrationId =
          markerByPlayerId.get(String(member.id)) ?? null;

        updates.push(
          supabase
            .from("flight_players")
            .update({
              marks_registration_id: markerRegistrationId,
            })
            .eq("id", member.id)
        );

        if (markerRegistrationId) {
          playersUpdated++;
        }
      }
    }

    const results = await Promise.all(updates);
    const failed = results.find((r: any) => r?.error);

    if (failed?.error) {
      return jsonError(`flight_players update failed: ${failed.error.message}`, 500);
    }

    return NextResponse.json({
      ok: true,
      tournamentId,
      round: roundNo,
      flights_found: flightIds.length,
      players_updated: playersUpdated,
      marks_rule: "next player in same flight marks this player; last marks first",
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}