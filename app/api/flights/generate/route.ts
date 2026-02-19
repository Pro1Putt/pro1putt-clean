import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Gender = "Boys" | "Girls";

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

type OpenApi = any;

let _openApiCache: { ts: number; doc: OpenApi } | null = null;

async function fetchOpenApiDoc(projectUrl: string, serviceKey: string) {
  const now = Date.now();
  if (_openApiCache && now - _openApiCache.ts < 5 * 60_000) return _openApiCache.doc;

  const res = await fetch(`${projectUrl}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/openapi+json",
    },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to fetch OpenAPI: ${res.status} ${t}`);
  }

  const doc = await res.json();
  _openApiCache = { ts: now, doc };
  return doc;
}

function tableColumns(openApi: OpenApi, tableName: string): Set<string> {
  const def = openApi?.definitions?.[tableName];
  const props = def?.properties || {};
  return new Set(Object.keys(props));
}

function pick<T extends Record<string, any>>(obj: T, allowed: Set<string>): Partial<T> {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}

function firstExisting(cols: Set<string>, candidates: string[]) {
  for (const c of candidates) if (cols.has(c)) return c;
  return null;
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type Registration = {
  id: string;
  tournament_id?: string | null;
  gender?: string | null;
  holes?: number | null;
  hcp?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  player_id?: string | null;
};

type TotalsRow = Record<string, any>;

function normalizeGender(v: any): Gender | null {
  const s = normStr(v).toLowerCase();
  if (!s) return null;
  if (["boys", "boy", "m", "male", "herren", "jungen"].includes(s)) return "Boys";
  if (["girls", "girl", "f", "female", "damen", "mädchen", "maedchen"].includes(s))
    return "Girls";
  return null;
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sortAscNullLast(a: number | null, b: number | null) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function sortDescNullLast(a: number | null, b: number | null) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function mergeFlightsByKey<T extends { key: number | null }>(a: T[], b: T[]) {
  const out: T[] = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    const A = i < a.length ? a[i] : null;
    const B = j < b.length ? b[j] : null;
    if (!A) {
      out.push(B!);
      j++;
      continue;
    }
    if (!B) {
      out.push(A);
      i++;
      continue;
    }
    const cmp = sortAscNullLast(A.key, B.key);
    if (cmp <= 0) {
      out.push(A);
      i++;
    } else {
      out.push(B);
      j++;
    }
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tournamentId = normStr(body.tournamentId);
    const roundNo = Number(body.round ?? body.round_no ?? body.day ?? 1);
    const tdPin = normStr(body.td_pin ?? body.tdPin ?? "");
    const requiredPin = normStr(process.env.TD_PIN || "");

    if (!tournamentId) return jsonError("Missing tournamentId", 400);
    if (![1, 2, 3].includes(roundNo)) return jsonError("round must be 1, 2, or 3", 400);
    if (!requiredPin) return jsonError("Missing TD_PIN on server (set env TD_PIN)", 500);
    if (!tdPin || tdPin !== requiredPin) return jsonError("TD_PIN invalid", 401);

    const supabase = await getServiceSupabase();

    // --- OpenAPI introspection so we only use columns that exist ---
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const openApi = await fetchOpenApiDoc(projectUrl, serviceKey);

    const regCols = tableColumns(openApi, "registrations");
    const flightsCols = tableColumns(openApi, "flights");
    const flightPlayersCols = tableColumns(openApi, "flight_players");

    // Determine the registration columns we can safely select
    const regIdCol = firstExisting(regCols, ["id"]) || "id";
    const regGenderCol = firstExisting(regCols, ["gender"]) || null;
    const regHolesCol = firstExisting(regCols, ["holes"]) || null;
    const regHcpCol = firstExisting(regCols, ["hcp", "handicap"]) || null;
    const regPlayerIdCol = firstExisting(regCols, ["player_id"]) || null;
    const regTournamentIdCol = firstExisting(regCols, ["tournament_id"]) || null;

    // Build select list dynamically (ONLY existing columns)
    const regSelectCols = [
      regIdCol,
      regGenderCol,
      regHolesCol,
      regHcpCol,
      regPlayerIdCol,
      regTournamentIdCol,
    ]
      .filter(Boolean)
      .join(",");

    if (!regTournamentIdCol) {
      return jsonError('registrations table missing "tournament_id" column', 500);
    }

    const { data: regsRaw, error: regsErr } = await supabase
      .from("registrations")
      .select(regSelectCols)
      .eq(regTournamentIdCol, tournamentId);

    if (regsErr) return jsonError(`registrations read failed: ${regsErr.message}`, 500);

    const registrations: Registration[] = (regsRaw || []).map((r: any) => ({
      id: String(r[regIdCol]),
      tournament_id: r[regTournamentIdCol],
      gender: regGenderCol ? r[regGenderCol] : null,
      holes: regHolesCol ? toNumber(r[regHolesCol]) : null,
      hcp: regHcpCol ? toNumber(r[regHcpCol]) : null,
      player_id: regPlayerIdCol ? r[regPlayerIdCol] : null,
    }));

    // --- Totals for sorting in round 2 / 3 ---
    const roundTotalsCols = tableColumns(openApi, "v_player_round_totals");
    const cumTotalsCols = tableColumns(openApi, "v_player_cum_totals");

    const totalsTournamentCol =
      firstExisting(roundTotalsCols, ["tournament_id"]) ||
      firstExisting(cumTotalsCols, ["tournament_id"]) ||
      null;

    const totalsRoundCol = firstExisting(roundTotalsCols, ["round", "round_no", "round_number"]) || null;

    const totalsRegIdCol =
      firstExisting(roundTotalsCols, ["registration_id"]) ||
      firstExisting(cumTotalsCols, ["registration_id"]) ||
      null;

    const totalsPlayerIdCol =
      firstExisting(roundTotalsCols, ["player_id"]) ||
      firstExisting(cumTotalsCols, ["player_id"]) ||
      null;

    const scoreCandidates = ["total", "gross_total", "strokes", "score", "total_strokes", "sum_strokes"];
    const roundScoreCol = firstExisting(roundTotalsCols, scoreCandidates);
    const cumScoreCol = firstExisting(cumTotalsCols, scoreCandidates);

    const scoreByRegId = new Map<string, number | null>();
    const scoreByPlayerId = new Map<string, number | null>();

    async function loadRound1Totals() {
      if (!totalsTournamentCol || !totalsRoundCol || !roundScoreCol) return;
      const { data, error } = await supabase
        .from("v_player_round_totals")
        .select("*")
        .eq(totalsTournamentCol, tournamentId)
        .eq(totalsRoundCol, 1);

      if (error) return;
      (data || []).forEach((row: TotalsRow) => {
        const score = toNumber(row[roundScoreCol]);
        if (totalsRegIdCol && row[totalsRegIdCol]) scoreByRegId.set(String(row[totalsRegIdCol]), score);
        if (totalsPlayerIdCol && row[totalsPlayerIdCol])
          scoreByPlayerId.set(String(row[totalsPlayerIdCol]), score);
      });
    }

    async function loadCumTotals() {
      if (!totalsTournamentCol || !cumScoreCol) return;
      const { data, error } = await supabase
        .from("v_player_cum_totals")
        .select("*")
        .eq(totalsTournamentCol, tournamentId);

      if (error) return;
      (data || []).forEach((row: TotalsRow) => {
        const score = toNumber(row[cumScoreCol]);
        if (totalsRegIdCol && row[totalsRegIdCol]) scoreByRegId.set(String(row[totalsRegIdCol]), score);
        if (totalsPlayerIdCol && row[totalsPlayerIdCol])
          scoreByPlayerId.set(String(row[totalsPlayerIdCol]), score);
      });
    }

    if (roundNo === 2) await loadRound1Totals();
    if (roundNo === 3) await loadCumTotals();

    function sortKeyForRegistration(r: Registration): number | null {
      if (roundNo === 1) return r.hcp ?? null;

      if (roundNo === 2) {
        const byReg = scoreByRegId.get(r.id);
        if (byReg !== undefined) return byReg;
        if (r.player_id) {
          const byPlayer = scoreByPlayerId.get(String(r.player_id));
          if (byPlayer !== undefined) return byPlayer;
        }
        return null;
      }

      if (roundNo === 3) {
        const byReg = scoreByRegId.get(r.id);
        if (byReg !== undefined) return byReg;
        if (r.player_id) {
          const byPlayer = scoreByPlayerId.get(String(r.player_id));
          if (byPlayer !== undefined) return byPlayer;
        }
        return null;
      }

      return null;
    }

    // --- Split by holes segment: 18 first then 9 ---
    const reg18 = registrations.filter((r) => (r.holes ?? 18) >= 18);
    const reg9 = registrations.filter((r) => (r.holes ?? 18) <= 9);

    const FLIGHT_SIZE = 3;

    function makeGenderFlights(
      regs: Registration[],
      gender: Gender
    ): { gender: Gender; holes: 9 | 18; members: Registration[]; key: number | null }[] {
      const list = regs
        .filter((r) => normalizeGender(r.gender) === gender)
        .map((r) => ({ r, key: sortKeyForRegistration(r) }));

      list.sort((a, b) => {
        if (roundNo === 3) return sortDescNullLast(a.key, b.key);
        return sortAscNullLast(a.key, b.key);
      });

      const regsSorted = list.map((x) => x.r);

      const flights = chunk(regsSorted, FLIGHT_SIZE).map((members) => ({
        gender,
        holes: ((members[0]?.holes ?? 18) >= 18 ? 18 : 9) as 9 | 18,
        members,
        key: sortKeyForRegistration(members[0] ?? ({} as any)),
      }));

      return flights;
    }

    function buildMergedFlightOrder(regs: Registration[], holes: 9 | 18) {
      const boysFlights = makeGenderFlights(regs, "Boys").filter((f) => f.holes === holes);
      const girlsFlights = makeGenderFlights(regs, "Girls").filter((f) => f.holes === holes);
      return mergeFlightsByKey(boysFlights, girlsFlights).map((f) => ({
        ...f,
        holes,
      }));
    }

    const orderedFlights = [...buildMergedFlightOrder(reg18, 18), ...buildMergedFlightOrder(reg9, 9)];

    // --- Clear existing flights for this tournament+round (idempotent) ---
    const flightTournamentCol = firstExisting(flightsCols, ["tournament_id"]) || null;
    const flightRoundCol = firstExisting(flightsCols, ["round", "round_no", "round_number"]) || null;

    if (!flightTournamentCol) return jsonError('flights table missing "tournament_id" column', 500);
    if (!flightRoundCol) return jsonError('flights table missing a round column (round/round_no)', 500);

    const { data: existingFlights, error: existingErr } = await supabase
      .from("flights")
      .select("id")
      .eq(flightTournamentCol, tournamentId)
      .eq(flightRoundCol, roundNo);

    if (existingErr) return jsonError(`flights read failed: ${existingErr.message}`, 500);

    const existingIds = (existingFlights || []).map((x: any) => String(x.id));

    const fpFlightIdCol = firstExisting(flightPlayersCols, ["flight_id"]) || null;
    if (existingIds.length && fpFlightIdCol) {
      await supabase.from("flight_players").delete().in(fpFlightIdCol, existingIds);
    }

    if (existingIds.length) {
      await supabase
        .from("flights")
        .delete()
        .eq(flightTournamentCol, tournamentId)
        .eq(flightRoundCol, roundNo);
    }

    // --- Insert flights ---
    const flightNoCol = firstExisting(flightsCols, ["flight_no", "flight_number", "no", "number"]) || null;
    const flightGenderCol = firstExisting(flightsCols, ["gender"]) || null;
    const flightHolesCol = firstExisting(flightsCols, ["holes"]) || null;

    const flightsToInsert = orderedFlights.map((f, idx) => {
      const base: any = {
        [flightTournamentCol]: tournamentId,
        [flightRoundCol]: roundNo,
      };
      if (flightNoCol) base[flightNoCol] = idx + 1;
      if (flightGenderCol) base[flightGenderCol] = f.gender;
      if (flightHolesCol) base[flightHolesCol] = f.holes;
      return pick(base, flightsCols);
    });

    const { data: createdFlights, error: insFlightsErr } = await supabase
      .from("flights")
      .insert(flightsToInsert)
      .select("id");

    if (insFlightsErr) return jsonError(`flights insert failed: ${insFlightsErr.message}`, 500);

    const createdIds = (createdFlights || []).map((x: any) => String(x.id));

    if (createdIds.length !== orderedFlights.length) {
      return jsonError(
        `Internal mismatch: createdFlights=${createdIds.length} orderedFlights=${orderedFlights.length}`,
        500
      );
    }

    // --- Insert flight_players (YOUR schema: flight_id, registration_id, seat, marks_registration_id) ---
    const fpRegIdCol = firstExisting(flightPlayersCols, ["registration_id"]) || null;
    const fpSeatCol = firstExisting(flightPlayersCols, ["seat"]) || null;
    const fpMarksRegIdCol = firstExisting(flightPlayersCols, ["marks_registration_id"]) || null;

    if (!fpFlightIdCol) return jsonError('flight_players table missing "flight_id" column', 500);
    if (!fpRegIdCol) return jsonError('flight_players table missing "registration_id" column', 500);
    if (!fpSeatCol) return jsonError('flight_players table missing "seat" column', 500);
    if (!fpMarksRegIdCol) return jsonError('flight_players table missing "marks_registration_id" column', 500);

    const flightPlayersToInsert: any[] = [];

    for (let i = 0; i < orderedFlights.length; i++) {
      const flightId = createdIds[i];
      const members = orderedFlights[i]?.members || [];
      if (!members.length) continue;

      members.forEach((r, idx) => {
        const marks = members[(idx + 1) % members.length]; // next marks this player (last marks first)

        const row: any = {
          [fpFlightIdCol]: flightId,
          [fpRegIdCol]: r.id,
          [fpSeatCol]: idx + 1,
          [fpMarksRegIdCol]: marks?.id ?? r.id,
        };

        flightPlayersToInsert.push(pick(row, flightPlayersCols));
      });
    }

    const { error: insFpErr } = await supabase.from("flight_players").insert(flightPlayersToInsert);
    if (insFpErr) return jsonError(`flight_players insert failed: ${insFpErr.message}`, 500);

    return NextResponse.json({
      ok: true,
      tournamentId,
      round: roundNo,
      flights_created: createdIds.length,
      players_assigned: flightPlayersToInsert.length,
      rules: {
        round1:
          "18 holes first, then 9 holes; lowest HCP first; no mixed gender flights; flight order interleaved by best key",
        round2:
          "best round-1 totals first (if totals view available); no mixed gender flights; 18 first then 9",
        round3:
          "leaders last using cumulative totals (if totals view available); no mixed gender flights; 18 first then 9",
        flight_size: FLIGHT_SIZE,
        marks_rule: "each player is marked by the next player in the flight (last marks first)",
      },
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}