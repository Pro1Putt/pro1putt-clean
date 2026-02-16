import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

type Row = {
  id: string;
  tournament_id: string;
  first_name: string;
  last_name: string;
  hcp: number;
  nation: string;
  gender: string;
  age_group: string;
  holes: number;
};

type ScoreRow = {
  tournament_id: string;
  player_id: string;
  hole: number;
  strokes: number;
};

type HoleParRow = {
  tournament_id: string;
  hole: number;
  par: number;
};
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

function safeNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");
    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
// 0) Tournament (für Startdatum → Altersklasse)
const { data: tRow, error: tErr } = await supabase
  .from("tournaments")
  .select("id,name,start_date")
  .eq("id", tournamentId)
  .single();

if (tErr || !tRow?.start_date) {
  return NextResponse.json(
    { ok: false, error: "Tournament not found / missing start_date" },
    { status: 400 }
  );
}
    // 1) Registrations
    const { data: regs, error: regErr } = await supabase
      .from("registrations")
     .select("id,tournament_id,first_name,last_name,hcp,nation,gender,birthdate,holes,home_club")
      .eq("tournament_id", tournamentId);

    if (regErr) {
      return NextResponse.json({ ok: false, error: regErr.message }, { status: 500 });
    }

    const registrations = (regs || []) as Row[];

    // 2) Scores (optional – wenn Tabelle noch nicht existiert, ignorieren)
    let scores: ScoreRow[] = [];
    {
      const { data, error } = await supabase
        .from("scores")
        .select("tournament_id,player_id,hole,strokes")
        .eq("tournament_id", tournamentId);

      if (!error && data) scores = data as any;
    }

    // 3) Pars (optional – wenn Tabelle noch nicht existiert, ignorieren)
    let pars: HoleParRow[] = [];
    {
      const { data, error } = await supabase
        .from("tournament_holes")
        .select("tournament_id,hole,par")
        .eq("tournament_id", tournamentId);

      if (!error && data) pars = data as any;
    }

    const parByHole = new Map<number, number>();
    for (const p of pars) {
      const h = safeNum(p.hole);
      const par = safeNum(p.par);
      if (h && par) parByHole.set(h, par);
    }

    // Build score aggregates per registration
    const scoreMap = new Map<
      string,
      { thru: number; strokesSum: number; parSum: number; hasAny: boolean }
    >();

    for (const s of scores) {
      const rid = String(s.player_id || "");
      const hole = safeNum(s.hole);
      const strokes = safeNum(s.strokes);
      if (!rid || !hole || !strokes) continue;

      const cur = scoreMap.get(rid) || { thru: 0, strokesSum: 0, parSum: 0, hasAny: false };
      cur.hasAny = true;
      cur.thru = Math.max(cur.thru, hole);
      cur.strokesSum += strokes;

      const par = parByHole.get(hole);
      if (par) cur.parSum += par;

      scoreMap.set(rid, cur);
    }

    // Merge
    const merged = registrations.map((r: any) => {
  const age = calcAge(String(r.birthdate), String(tRow.start_date));
  const baseGroup = ageGroupFromAge(age);
  const age_group = normalizeGroupForHoles(baseGroup, Number(r.holes));

        const agg = scoreMap.get(r.id);
      const thru = agg?.hasAny ? agg!.thru : 0;

      const score = agg?.hasAny ? agg!.strokesSum : null;

      // toPar nur wenn wir Pars haben (sonst "-")
      const toPar =
        agg?.hasAny && agg!.parSum > 0 ? agg!.strokesSum - agg!.parSum : null;

      return {
        ...r,
        age_group,
        score,
        thru,
        to_par: toPar,
        // flight/start kommen später aus flights-table – aktuell placeholder
        flight: null as any,
        start_time: null as any,
      };
    });

    // Sort: ToPar asc, dann Thru desc (mehr gespielt zuerst), dann HCP asc, dann Name
    merged.sort((a: any, b: any) => {
      const ap = a.to_par;
      const bp = b.to_par;

      if (ap != null && bp != null && ap !== bp) return ap - bp;
      if (ap != null && bp == null) return -1;
      if (ap == null && bp != null) return 1;

      const as = a.score;
      const bs = b.score;
      if (as != null && bs != null && as !== bs) return as - bs;

      if (a.thru !== b.thru) return b.thru - a.thru;

      const ah = Number(a.hcp ?? 999);
      const bh = Number(b.hcp ?? 999);
      if (ah !== bh) return ah - bh;

      const an = `${a.last_name || ""} ${a.first_name || ""}`.toLowerCase();
      const bn = `${b.last_name || ""} ${b.first_name || ""}`.toLowerCase();
      return an.localeCompare(bn);
    });

    return NextResponse.json({ ok: true, rows: merged });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}