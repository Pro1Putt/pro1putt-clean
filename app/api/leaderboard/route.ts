import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function safeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function calcAge(birthdateISO: string, onDateISO: string) {
  const b = new Date(`${birthdateISO}T00:00:00`);
  const d = new Date(`${onDateISO}T00:00:00`);
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return age;
}

function ageGroupFromAge(age: number): "U8" | "U10" | "U12" | "U14" | "U16" | "U18" | "U21" {
  if (age <= 8) return "U8";
  if (age <= 10) return "U10";
  if (age <= 12) return "U12";
  if (age <= 14) return "U14";
  if (age <= 16) return "U16";
  if (age <= 18) return "U18";
  return "U21";
}

function normalizeGroupForHoles(group: string, holes: number) {
  if (holes === 18 && (group === "U8" || group === "U10" || group === "U12")) return "U14";
  return group;
}

type RegRow = {
  id: string;
  tournament_id: string;
  first_name: string;
  last_name: string;
  hcp: number | null;
  nation: string | null;
  gender: string | null;
  home_club: string | null;
  birthdate: string | null;

  // 👉 DAS FEHLT:
  holes: number | null;
};

type ScoreRow = {
  player_id: string;
  hole_number: number;
  strokes: number;
  updated_at: string | null;
  round_number: number | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tournamentId = String(searchParams.get("tournamentId") || "").trim();
    const round = Number(searchParams.get("round") || "1");

    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });
    }

    if (![1, 2, 3].includes(round)) {
      return NextResponse.json({ ok: false, error: "round must be 1,2,3" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: tRow, error: tErr } = await supabase
      .from("tournaments")
      .select("id,start_date")
      .eq("id", tournamentId)
      .single();

    if (tErr || !tRow?.start_date) {
      return NextResponse.json(
        { ok: false, error: "Tournament not found / missing start_date" },
        { status: 400 }
      );
    }

   const { data: regs, error: regErr } = await supabase
  .from("registrations")
  .select("id,tournament_id,first_name,last_name,hcp,nation,gender,birthdate,holes,home_club")
  .eq("tournament_id", tournamentId);

    if (regErr) {
      return NextResponse.json({ ok: false, error: regErr.message }, { status: 500 });
    }

    const registrations = (regs || []) as RegRow[];

    // ------------------------------------------------------------
    // SCORES NUR FÜR DIE AKTUELLE RUNDE
    // ------------------------------------------------------------
    const { data: scoreData, error: scoreErr } = await supabase
      .from("scores")
      .select("player_id,hole_number,strokes,updated_at,round_number")
      .eq("tournament_id", tournamentId)
      .eq("round_number", round)
      .order("updated_at", { ascending: false });

    if (scoreErr) {
      return NextResponse.json({ ok: false, error: scoreErr.message }, { status: 500 });
    }

    const scores = (scoreData || []) as ScoreRow[];
    console.log("LEADERBOARD scores found:", scores.length, "round:", round);

    // neueste Score je Spieler + Loch
    const latestScoreByRegAndHole = new Map<string, number>();

    for (const s of scores) {
      const regId = String(s.player_id || "").trim();
      const hole = safeNum(s.hole_number);
      const strokes = safeNum(s.strokes);

      if (!regId || hole == null || strokes == null) continue;

      const key = `${regId}::${hole}`;

      if (!latestScoreByRegAndHole.has(key)) {
        latestScoreByRegAndHole.set(key, strokes);
      }
    }

    // ------------------------------------------------------------
    // FLIGHTS DER AKTUELLEN RUNDE SAUBER LADEN
    // ------------------------------------------------------------
    const { data: currentRoundFlights, error: currentFlightsErr } = await supabase
      .from("flights")
      .select(`
        id,
        round,
        start_time,
        flight_number,
        flight_players (
          registration_id,
          marks_registration_id
        )
      `)
      .eq("tournament_id", tournamentId)
      .eq("round", round)
      .order("start_time", { ascending: true })
      .order("flight_number", { ascending: true });

    if (currentFlightsErr) {
      console.error("currentRoundFlights error", currentFlightsErr);
      return NextResponse.json({ ok: false, error: currentFlightsErr.message }, { status: 500 });
    }

    const flightInfo = new Map<string, { flight_number: number | null; start_time: string | null }>();

    for (const flight of (currentRoundFlights || []) as any[]) {
      const startTime = flight?.start_time || null;
      const flightNumber = safeNum(flight?.flight_number) ?? null;
      const players = Array.isArray(flight?.flight_players) ? flight.flight_players : [];

      for (const fp of players) {
        const regId = String(fp?.registration_id || "").trim();
        if (!regId) continue;

        flightInfo.set(regId, {
          flight_number: flightNumber,
          start_time: startTime,
        });
      }
    }

    // ------------------------------------------------------------
    // RUNDE-2-STARTZEITEN LADEN
    // ------------------------------------------------------------
    const { data: round2Flights, error: round2Err } = await supabase
      .from("flights")
      .select(`
        id,
        round,
        start_time,
        flight_number,
        flight_players (
          registration_id
        )
      `)
      .eq("tournament_id", tournamentId)
      .eq("round", 2)
      .order("start_time", { ascending: true })
      .order("flight_number", { ascending: true });

    if (round2Err) {
      console.error("round2Flights error", round2Err);
    }

    const round2StartTimeByRegistrationId = new Map<string, string>();

    for (const flight of (round2Flights || []) as any[]) {
      const startTime = flight?.start_time || null;
      const players = Array.isArray(flight?.flight_players) ? flight.flight_players : [];

      for (const fp of players) {
        const regId = String(fp?.registration_id || "").trim();
        if (!regId || !startTime) continue;
        round2StartTimeByRegistrationId.set(regId, startTime);
      }
    }
const { data: round3Flights, error: round3Err } = await supabase
  .from("flights")
  .select(`
    id,
    round,
    start_time,
    flight_number,
    flight_players (
      registration_id
    )
  `)
  .eq("tournament_id", tournamentId)
  .eq("round", 3)
  .order("start_time", { ascending: true })
  .order("flight_number", { ascending: true });

if (round3Err) {
  console.error("round3Flights error", round3Err);
}

const round3StartTimeByRegistrationId = new Map<string, string>();

for (const flight of (round3Flights || []) as any[]) {
  const startTime = flight?.start_time || null;
  const players = Array.isArray(flight?.flight_players) ? flight.flight_players : [];

  for (const fp of players) {
    const regId = String(fp?.registration_id || "").trim();
    if (!regId || !startTime) continue;
    round3StartTimeByRegistrationId.set(regId, startTime);
  }
}
// ------------------------------------------------------------
// PARS (TEST DIREKT AUS holes)
// ------------------------------------------------------------
const parByHole = new Map<number, number>();

const { data: pars, error: pErr } = await supabase
  .from("holes")
  .select("hole_number, par")
  .eq("tournament_id", tournamentId)
  .order("hole_number", { ascending: true });

console.log("DIRECT holes PARS", pars);
console.log("DIRECT holes ERROR", pErr);

if (pErr) {
  return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
}

for (const p of (pars || []) as any[]) {
  const h = safeNum(p?.hole_number);
  const par = safeNum(p?.par);

  if (h != null && par != null) {
    parByHole.set(h, par);
  }
}

console.log("DIRECT PAR MAP SIZE", parByHole.size);
console.log("DIRECT PAR MAP", Array.from(parByHole.entries()));

    const rows = registrations.map((r) => {
    const holes = Number(r.holes || 18);
const maxHole = holes === 9 ? 9 : 18;

const age = calcAge(String(r.birthdate), String(tRow.start_date));
const baseGroup = ageGroupFromAge(age);
const age_group = normalizeGroupForHoles(baseGroup, holes);

      let strokesSum = 0;
      let parSum = 0;
      let holesPlayed = 0;
      let thru = 0;

    for (let h = 1; h <= maxHole; h++) {
 const val = latestScoreByRegAndHole.get(`${r.id}::${h}`);

  if (val != null) {
    strokesSum += Number(val);
    holesPlayed++;
    thru = h;

    const par = parByHole.get(Number(h));

    if (par != null) {
      parSum += Number(par);
    } else {
      console.log("❌ missing par for hole", h);
    }
  }
}

      const hasAnyScore = holesPlayed > 0;
      const score = hasAnyScore ? strokesSum : null;
      console.log("TO_PAR CHECK", {
  player: `${r.first_name} ${r.last_name}`,
  holesPlayed,
  strokesSum,
  parSum,
  hasAnyScore,
});
      const to_par = hasAnyScore && parSum > 0 ? strokesSum - parSum : null;

      console.log("LB DEBUG", {
        player: `${r.first_name} ${r.last_name}`,
        regId: String(r.id || "").trim(),
        round,
        holesPlayed,
        strokesSum,
        parSum,
        to_par,
      });

      const fi = flightInfo.get(String(r.id || "").trim()) || {
        flight_number: null,
        start_time: null,
      };

      return {
        id: r.id,
        tournament_id: r.tournament_id,
        first_name: r.first_name,
        last_name: r.last_name,
        hcp: r.hcp,
        nation: r.nation,
        gender: r.gender,
        holes,
        home_club: r.home_club,
        age_group,
        score,
        thru,
        holes_played: holesPlayed,
        to_par,
        flight_number: fi.flight_number,
        start_time: fi.start_time,
        round2_start_time:
          round2StartTimeByRegistrationId.get(String(r.id || "").trim()) || null,
          round3_start_time:
  round3StartTimeByRegistrationId.get(String(r.id || "").trim()) || null,
      };
    });

    rows.sort((a: any, b: any) => {
      const ap = a.to_par;
      const bp = b.to_par;

      if (ap != null && bp != null && ap !== bp) return ap - bp;
      if (ap != null && bp == null) return -1;
      if (ap == null && bp != null) return 1;

      const as = a.score;
      const bs = b.score;
      if (as != null && bs != null && as !== bs) return as - bs;
      if (as != null && bs == null) return -1;
      if (as == null && bs != null) return 1;

      if (a.thru !== b.thru) return b.thru - a.thru;

      const ah = Number(a.hcp ?? 999);
      const bh = Number(b.hcp ?? 999);
      if (ah !== bh) return ah - bh;

      const an = `${a.last_name || ""} ${a.first_name || ""}`.toLowerCase();
      const bn = `${b.last_name || ""} ${b.first_name || ""}`.toLowerCase();
      return an.localeCompare(bn);
    });
console.log("LB registrations count", registrations.length);
console.log("LB rows count", rows.length);
console.log("LB first rows", rows.slice(0, 5));
    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}