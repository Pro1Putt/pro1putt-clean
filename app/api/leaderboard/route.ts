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
  const b = new Date(birthdateISO + "T00:00:00");
  const d = new Date(onDateISO + "T00:00:00");
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
  gender: "Boys" | "Girls" | null;
  birthdate: string;
  holes: number;
  home_club: string | null;
};

type FlightPlayerRow = {
  registration_id: string;
  marks_registration_id: string | null;
  flight: {
    flight_number: number;
    start_time: string | null;
  } | null;
};

type ParRow = {
  hole: number;
  par: number;
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

    const { data: fp, error: fpErr } = await supabase
      .from("flight_players")
      .select("registration_id,marks_registration_id,flight:flights(flight_number,start_time)")
      .eq("flight.tournament_id", tournamentId)
      .eq("flight.round", round);

    let flightPlayers: FlightPlayerRow[] = [];
    if (!fpErr && fp) {
      flightPlayers = fp as any;
    } else {
      const { data: fp2, error: fp2Err } = await supabase
        .from("flight_players")
        .select("registration_id,marks_registration_id,flight_id");

      if (!fp2Err && fp2) {
        const flightIds = Array.from(new Set((fp2 as any[]).map((r) => r.flight_id).filter(Boolean)));

        const { data: fl } = await supabase
          .from("flights")
          .select("id,tournament_id,round,flight_number,start_time")
          .eq("tournament_id", tournamentId)
          .eq("round", round)
          .in("id", flightIds.length ? flightIds : ["00000000-0000-0000-0000-000000000000"]);

        const flightById = new Map<string, any>();
        for (const f of (fl || []) as any[]) flightById.set(f.id, f);

        flightPlayers = (fp2 as any[]).map((r) => {
          const f = flightById.get(r.flight_id) || null;
          return {
            registration_id: r.registration_id,
            marks_registration_id: r.marks_registration_id,
            flight: f ? { flight_number: f.flight_number, start_time: f.start_time } : null,
          };
        });
      }
    }

    const flightInfo = new Map<string, { flight_number: number | null; start_time: string | null }>();
    for (const r of flightPlayers) {
      if (r?.registration_id) {
        flightInfo.set(r.registration_id, {
          flight_number: r.flight?.flight_number ?? null,
          start_time: r.flight?.start_time ?? null,
        });
      }
    }

   const parByHole = new Map<number, number>();

const { data: pars, error: pErr } = await supabase
  .from("v_registration_holes")
  .select("hole_number, par")
  .eq("tournament_id", tournamentId);

const seen = new Set<number>();

for (const p of (pars || []) as any[]) {
  const h = safeNum((p as any).hole_number);
const par = safeNum((p as any).par);

if (h && par && !seen.has(h)) {
  parByHole.set(h, par);
  seen.add(h);
}
}

console.log(
  "PAR MAP SIZE",
  parByHole.size,
  Array.from(parByHole.entries()).slice(0, 5)
);

  const { data: scoreData, error: scoreErr } = await supabase
  .from("scores")
  .select("player_id,hole_number,strokes,updated_at,round_number")
  .eq("tournament_id", tournamentId)
  .order("updated_at", { ascending: false });

    if (scoreErr) {
      return NextResponse.json({ ok: false, error: scoreErr.message }, { status: 500 });
    }

    const scores = (scoreData || []) as ScoreRow[];
    console.log("LEADERBOARD scores found:", scores.length);

    // WICHTIG:
    // Bei dir enthält scores.player_id aktuell die registrations.id
    // Deshalb indexieren wir über registration_id.
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
          strokesSum += val;
          holesPlayed += 1;
          thru = h;

          const par = parByHole.get(h);
          if (par != null) parSum += par;
        }
      }

      const hasAnyScore = holesPlayed > 0;
      const score = hasAnyScore ? strokesSum : null;
      const to_par = hasAnyScore && parSum > 0 ? strokesSum - parSum : null;
      console.log("LB DEBUG", {
  player: `${r.first_name} ${r.last_name}`,
  holesPlayed,
  strokesSum,
  parSum,
  to_par,
});

      const fi = flightInfo.get(r.id) || { flight_number: null, start_time: null };

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

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}