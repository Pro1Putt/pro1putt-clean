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
  holes: number | null;
};

type ScoreRow = {
  registration_id: string | null;
  hole_number: number | null;
  strokes: number | null;
  round_number: number | null;
};

type RoundAgg = {
  score: number | null;
  to_par: number | null;
  holes_played: number;
  thru: number;
};

function emptyRoundAgg(): RoundAgg {
  return {
    score: null,
    to_par: null,
    holes_played: 0,
    thru: 0,
  };
}

function resolveRound(v: any): 1 | 2 | 3 {
  const n = safeNum(v);
  if (n === 2) return 2;
  if (n === 3) return 3;
  return 1;
}
const MANUAL_LEADERBOARD_OVERRIDES: Record<
  string,
  { round1: number; round2: number; total: number; round1Holes: number; round2Holes: number }
> = {
  "e0adbbeb-e7b5-42d4-9ba3-1d70e15bc9f5": { round1: 37, round2: 40, total: 77, round1Holes: 9, round2Holes: 9 },
  "098132e4-eb31-43dd-b487-8f6aea7501e6": { round1: 39, round2: 42, total: 81, round1Holes: 9, round2Holes: 9 },
  "d3d57160-31bc-4e35-bb5c-de5a5f07d0e7": { round1: 42, round2: 34, total: 76, round1Holes: 9, round2Holes: 9 },
  "db214db6-5b8e-432b-a14b-322a170f0720": { round1: 44, round2: 50, total: 94, round1Holes: 9, round2Holes: 9 },
  "885a2ebf-a33e-44a1-a5dd-ef1922c7778b": { round1: 46, round2: 41, total: 87, round1Holes: 9, round2Holes: 9 },
  "21380286-b867-4919-83b5-08eaac386dfe": { round1: 54, round2: 48, total: 102, round1Holes: 9, round2Holes: 9 },

  "0d19a809-374b-46bc-ac56-5d1417af6bbf": { round1: 68, round2: 76, total: 144, round1Holes: 18, round2Holes: 18 },
  "3b88eb10-8515-40d0-8108-a94529c534cd": { round1: 71, round2: 73, total: 144, round1Holes: 18, round2Holes: 18 },
  "e1cec61b-4c31-4d8e-8bee-b667ee5eca28": { round1: 72, round2: 77, total: 149, round1Holes: 18, round2Holes: 18 },
  "2ce97e7d-139e-4f27-ac2e-6969eecef670": { round1: 75, round2: 67, total: 142, round1Holes: 18, round2Holes: 18 },
  "639dea59-1a8d-409a-82c6-584dbb5f34e9": { round1: 76, round2: 77, total: 153, round1Holes: 18, round2Holes: 18 },
  "6edb8902-3291-45fa-8851-a88b460512ad": { round1: 80, round2: 79, total: 159, round1Holes: 18, round2Holes: 18 },
  "ee23d191-feba-4728-82f1-dc3429b95532": { round1: 81, round2: 83, total: 164, round1Holes: 18, round2Holes: 18 },
  "0a22a191-8264-4398-8468-2e96074d3366": { round1: 82, round2: 83, total: 165, round1Holes: 18, round2Holes: 18 },
  "9deefb00-181d-400a-906b-514b64341425": { round1: 83, round2: 81, total: 164, round1Holes: 18, round2Holes: 18 },
  "4d134271-956f-42fd-95ea-0a6b725123e6": { round1: 83, round2: 79, total: 162, round1Holes: 18, round2Holes: 18 },
  "707a8d7f-4868-4aa2-ba77-aa822a334b283": { round1: 84, round2: 80, total: 164, round1Holes: 18, round2Holes: 18 },
  "f88170d0-1f22-42fc-b06f-f43ce3d2c8ff": { round1: 86, round2: 87, total: 173, round1Holes: 18, round2Holes: 18 },
  "fd625cd4-90fe-4002-b0eb-95ff807080ba": { round1: 86, round2: 82, total: 168, round1Holes: 18, round2Holes: 18 },
  "9d71aa32-e0cc-4394-b494-f2cca4e7d382": { round1: 87, round2: 82, total: 169, round1Holes: 18, round2Holes: 18 },
  "c9c44f56-2b25-4444-be7a-60dcb33140b2": { round1: 88, round2: 85, total: 173, round1Holes: 18, round2Holes: 18 },
  "bd565cdc-2b20-4ee1-8358-1c3f10ec8acf": { round1: 89, round2: 95, total: 184, round1Holes: 18, round2Holes: 18 },
  "c0fb8d2a-417b-4d68-918c-fc6d0b9b032c": { round1: 89, round2: 93, total: 182, round1Holes: 18, round2Holes: 18 },
  "e5564605-a162-4973-b880-2fa22458ea54": { round1: 90, round2: 76, total: 166, round1Holes: 18, round2Holes: 18 },
  "ee5ab7c6-0546-4277-8d04-5e6b48ea52a3": { round1: 90, round2: 87, total: 177, round1Holes: 18, round2Holes: 18 },
  "7eb8f5cb-1d68-4a8b-a52e-3c0ab48ff137": { round1: 92, round2: 87, total: 179, round1Holes: 18, round2Holes: 18 },
  "44447724-0cf2-4601-b0e6-e53714d03f63": { round1: 99, round2: 107, total: 206, round1Holes: 18, round2Holes: 18 },
  "78fb4ed0-ba8e-4b98-a34b-b68fa7f01091": { round1: 99, round2: 98, total: 197, round1Holes: 18, round2Holes: 18 },
  "06ccd75a-85fb-49da-b531-5ea45a09645f": { round1: 101, round2: 108, total: 209, round1Holes: 18, round2Holes: 18 },
  "2e22731c-34b3-4726-937a-18e90d4213a7": { round1: 93, round2: 87, total: 180, round1Holes: 18, round2Holes: 18 },

  "47b6392b-647e-4a2b-8976-2847b12f6ab8": { round1: 72, round2: 71, total: 143, round1Holes: 18, round2Holes: 18 },
  "b0f8374f-c18d-461e-852b-dfa63ae011ac8": { round1: 74, round2: 73, total: 147, round1Holes: 18, round2Holes: 18 },
  "07cfbc31-606f-4838-ba17-578e0720215d": { round1: 76, round2: 78, total: 154, round1Holes: 18, round2Holes: 18 },
  "19b44c8b-f73c-4644-a197-236e9f11225b": { round1: 76, round2: 79, total: 155, round1Holes: 18, round2Holes: 18 },
  "7e4671ff-76e0-4d70-b912-6aa7354774ee": { round1: 77, round2: 77, total: 154, round1Holes: 18, round2Holes: 18 },
  "117030b2-c7c3-4bab-ac1d-2b3b81b2b9d1": { round1: 77, round2: 84, total: 161, round1Holes: 18, round2Holes: 18 },
  "c3364e8d-93be-472e-a8ff-b4458266a4c5": { round1: 80, round2: 75, total: 155, round1Holes: 18, round2Holes: 18 },
  "5d110f0e-2f85-4f21-bf6a-d8a96880f0f4": { round1: 74, round2: 91, total: 165, round1Holes: 18, round2Holes: 18 },
};
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tournamentId = String(searchParams.get("tournamentId") || "").trim();
    const roundParam = String(searchParams.get("round") || "overall").trim().toLowerCase();

    const isOverall =
      roundParam === "overall" ||
      roundParam === "gesamt" ||
      roundParam === "total" ||
      roundParam === "all";

    const selectedRound = isOverall ? null : Number(roundParam);

    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });
    }

    if (!isOverall && ![1, 2, 3].includes(Number(selectedRound))) {
      return NextResponse.json(
        { ok: false, error: "round must be 1, 2, 3 or overall" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: tournamentRow, error: tournamentErr } = await supabase
      .from("tournaments")
      .select("id,start_date")
      .eq("id", tournamentId)
      .single();

    if (tournamentErr || !tournamentRow?.start_date) {
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

    const { data: holesData, error: holesErr } = await supabase
      .from("holes")
      .select("hole_number, par")
      .eq("tournament_id", tournamentId)
      .order("hole_number", { ascending: true });

    if (holesErr) {
      return NextResponse.json({ ok: false, error: holesErr.message }, { status: 500 });
    }

    const parByHole = new Map<number, number>();
    for (const h of (holesData || []) as any[]) {
      const hole = safeNum(h?.hole_number);
      const par = safeNum(h?.par);
      if (hole != null && par != null) {
        parByHole.set(hole, par);
      }
    }

    const { data: scoreRowsData, error: scoreErr } = await supabase
      .from("scores")
      .select("registration_id,hole_number,strokes,round_number")
      .eq("tournament_id", tournamentId);

    if (scoreErr) {
      return NextResponse.json({ ok: false, error: scoreErr.message }, { status: 500 });
    }

    const scoreRows = (scoreRowsData || []) as ScoreRow[];

    const byRegistrationRound = new Map<
      string,
      Record<1 | 2 | 3, { scoreSum: number; parSum: number; holesPlayed: number; thru: number }>
    >();

    for (const r of registrations) {
      const regId = String(r.id || "").trim();
      if (!regId) continue;

      byRegistrationRound.set(regId, {
        1: { scoreSum: 0, parSum: 0, holesPlayed: 0, thru: 0 },
        2: { scoreSum: 0, parSum: 0, holesPlayed: 0, thru: 0 },
        3: { scoreSum: 0, parSum: 0, holesPlayed: 0, thru: 0 },
      });
    }

    for (const s of scoreRows) {
      const regId = String(s.registration_id || "").trim();
      const hole = safeNum(s.hole_number);
      const strokes = safeNum(s.strokes);
      const round = resolveRound(s.round_number);

      if (!regId || hole == null || strokes == null) continue;
      if (!byRegistrationRound.has(regId)) continue;

      const bucket = byRegistrationRound.get(regId)!;
      const roundBucket = bucket[round];

      roundBucket.scoreSum += strokes;
      roundBucket.holesPlayed += 1;
      roundBucket.thru = Math.max(roundBucket.thru, hole);

      const par = parByHole.get(hole);
      if (par != null) {
        roundBucket.parSum += par;
      }
    }

    const { data: flightsData, error: flightsErr } = await supabase
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
      .in("round", [1, 2, 3])
      .order("round", { ascending: true })
      .order("start_time", { ascending: true })
      .order("flight_number", { ascending: true });

    if (flightsErr) {
      return NextResponse.json({ ok: false, error: flightsErr.message }, { status: 500 });
    }

    const round1FlightInfo = new Map<string, { flight_number: number | null; start_time: string | null }>();
    const round2FlightInfo = new Map<string, { flight_number: number | null; start_time: string | null }>();
    const round3FlightInfo = new Map<string, { flight_number: number | null; start_time: string | null }>();

    for (const flight of (flightsData || []) as any[]) {
      const round = resolveRound(flight?.round);
      const flightNumber = safeNum(flight?.flight_number) ?? null;
      const startTime = flight?.start_time || null;
      const players = Array.isArray(flight?.flight_players) ? flight.flight_players : [];

      const target =
        round === 1 ? round1FlightInfo : round === 2 ? round2FlightInfo : round3FlightInfo;

      for (const fp of players) {
        const regId = String(fp?.registration_id || "").trim();
        if (!regId) continue;

        target.set(regId, {
          flight_number: flightNumber,
          start_time: startTime,
        });
      }
    }

    const rows = registrations.map((r) => {
      const regId = String(r.id || "").trim();
      const holes = Number(r.holes || 18) === 9 ? 9 : 18;

      let age_group: "U8" | "U10" | "U12" | "U14" | "U16" | "U18" | "U21" = "U21";

      if (r.birthdate) {
        const age = calcAge(String(r.birthdate), String(tournamentRow.start_date));
        const baseGroup = ageGroupFromAge(age);
        age_group = normalizeGroupForHoles(baseGroup, holes) as
          | "U8"
          | "U10"
          | "U12"
          | "U14"
          | "U16"
          | "U18"
          | "U21";
      }

      const roundData = byRegistrationRound.get(regId) || {
        1: { scoreSum: 0, parSum: 0, holesPlayed: 0, thru: 0 },
        2: { scoreSum: 0, parSum: 0, holesPlayed: 0, thru: 0 },
        3: { scoreSum: 0, parSum: 0, holesPlayed: 0, thru: 0 },
      };

      const r1Agg: RoundAgg =
        roundData[1].holesPlayed > 0
          ? {
              score: roundData[1].scoreSum,
              to_par: roundData[1].parSum > 0 ? roundData[1].scoreSum - roundData[1].parSum : null,
              holes_played: roundData[1].holesPlayed,
              thru: roundData[1].thru,
            }
          : emptyRoundAgg();

      const r2Agg: RoundAgg =
        roundData[2].holesPlayed > 0
          ? {
              score: roundData[2].scoreSum,
              to_par: roundData[2].parSum > 0 ? roundData[2].scoreSum - roundData[2].parSum : null,
              holes_played: roundData[2].holesPlayed,
              thru: roundData[2].thru,
            }
          : emptyRoundAgg();

      const r3Agg: RoundAgg =
        roundData[3].holesPlayed > 0
          ? {
              score: roundData[3].scoreSum,
              to_par: roundData[3].parSum > 0 ? roundData[3].scoreSum - roundData[3].parSum : null,
              holes_played: roundData[3].holesPlayed,
              thru: roundData[3].thru,
            }
          : emptyRoundAgg();

      const totalHolesPlayed = r1Agg.holes_played + r2Agg.holes_played + r3Agg.holes_played;
      const totalScore = (r1Agg.score ?? 0) + (r2Agg.score ?? 0) + (r3Agg.score ?? 0);
      const totalPar = roundData[1].parSum + roundData[2].parSum + roundData[3].parSum;

      const total_score = totalHolesPlayed > 0 ? totalScore : null;
      const overall_to_par =
        totalHolesPlayed > 0 && totalPar > 0 ? totalScore - totalPar : null;

      const activeRoundAgg =
        selectedRound === 1 ? r1Agg : selectedRound === 2 ? r2Agg : selectedRound === 3 ? r3Agg : emptyRoundAgg();

      const round1Flight = round1FlightInfo.get(regId) || { flight_number: null, start_time: null };
      const round2Flight = round2FlightInfo.get(regId) || { flight_number: null, start_time: null };
      const round3Flight = round3FlightInfo.get(regId) || { flight_number: null, start_time: null };

      const activeFlight =
        selectedRound === 1
          ? round1Flight
          : selectedRound === 2
          ? round2Flight
          : selectedRound === 3
          ? round3Flight
          : round1Flight;

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

        score: isOverall ? total_score : activeRoundAgg.score,
        to_par: isOverall ? overall_to_par : activeRoundAgg.to_par,
        thru: isOverall ? totalHolesPlayed : activeRoundAgg.thru,
        holes_played: isOverall ? totalHolesPlayed : activeRoundAgg.holes_played,

        flight_number: activeFlight.flight_number,
        start_time: round1Flight.start_time,
        round2_start_time: round2Flight.start_time,
        round3_start_time: round3Flight.start_time,

        round1_score: r1Agg.score,
        round2_score: r2Agg.score,
        round3_score: r3Agg.score,

        round1_to_par: r1Agg.to_par,
        round2_to_par: r2Agg.to_par,
        round3_to_par: r3Agg.to_par,

        round1_holes_played: r1Agg.holes_played,
        round2_holes_played: r2Agg.holes_played,
        round3_holes_played: r3Agg.holes_played,

        total_score,
        overall_to_par,
      };
    });

    rows.sort((a, b) => {
      if (isOverall) {
        const at = a.total_score;
        const bt = b.total_score;

        if (at != null && bt != null && at !== bt) return at - bt;
        if (at != null && bt == null) return -1;
        if (at == null && bt != null) return 1;

        const aPlayed = Number(a.holes_played || 0);
        const bPlayed = Number(b.holes_played || 0);
        if (aPlayed !== bPlayed) return bPlayed - aPlayed;
      } else {
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
      }

      const ah = Number(a.hcp ?? 999);
      const bh = Number(b.hcp ?? 999);
      if (ah !== bh) return ah - bh;

      const an = `${a.last_name || ""} ${a.first_name || ""}`.toLowerCase();
      const bn = `${b.last_name || ""} ${b.first_name || ""}`.toLowerCase();
      return an.localeCompare(bn);
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}