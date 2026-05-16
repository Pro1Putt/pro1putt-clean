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

function resolveRound(v: any): 1 | 2 | 3 {
  const n = safeNum(v);
  if (n === 2) return 2;
  if (n === 3) return 3;
  return 1;
}

type HoleRow = {
  hole_number: number | null;
  par: number | null;
};

type ScoreRow = {
  hole_number: number | null;
  strokes: number | null;
  round_number: number | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tournamentId = String(searchParams.get("tournamentId") || "").trim();
    const registrationId = String(searchParams.get("registrationId") || "").trim();

    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });
    }

    if (!registrationId) {
      return NextResponse.json({ ok: false, error: "Missing registrationId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("id, tournament_id, first_name, last_name, holes, home_club, hcp")
      .eq("id", registrationId)
      .eq("tournament_id", tournamentId)
      .single();

    if (regErr || !reg) {
      return NextResponse.json({ ok: false, error: "Player not found" }, { status: 404 });
    }

    const { data: holesData, error: holesErr } = await supabase
      .from("holes")
      .select("hole_number, par")
      .eq("tournament_id", tournamentId)
      .order("hole_number", { ascending: true });

    if (holesErr) {
      return NextResponse.json({ ok: false, error: holesErr.message }, { status: 500 });
    }

    const { data: scoresData, error: scoresErr } = await supabase
      .from("scores")
      .select("hole_number, strokes, round_number")
      .eq("tournament_id", tournamentId)
      .eq("registration_id", registrationId)
      .order("round_number", { ascending: true })
      .order("hole_number", { ascending: true });

    if (scoresErr) {
      return NextResponse.json({ ok: false, error: scoresErr.message }, { status: 500 });
    }

    const holes = (holesData || []) as HoleRow[];
    const scores = (scoresData || []) as ScoreRow[];

    const parByHole = new Map<number, number>();
    for (const h of holes) {
      const hole = safeNum(h.hole_number);
      const par = safeNum(h.par);
      if (hole != null && par != null) {
        parByHole.set(hole, par);
      }
    }

    const rounds: Record<
      1 | 2 | 3,
      {
        holes: Array<{
          hole_number: number;
          par: number | null;
          strokes: number | null;
          to_par: number | null;
        }>;
        total_strokes: number | null;
        total_to_par: number | null;
        holes_played: number;
      }
    > = {
      1: { holes: [], total_strokes: null, total_to_par: null, holes_played: 0 },
      2: { holes: [], total_strokes: null, total_to_par: null, holes_played: 0 },
      3: { holes: [], total_strokes: null, total_to_par: null, holes_played: 0 },
    };

    const scoreMap = new Map<string, number>();
    for (const s of scores) {
      const round = resolveRound(s.round_number);
      const hole = safeNum(s.hole_number);
      const strokes = safeNum(s.strokes);
      if (hole == null || strokes == null) continue;
      scoreMap.set(`${round}-${hole}`, strokes);
    }

    const holeNumbers = Array.from(parByHole.keys()).sort((a, b) => a - b);

    for (const round of [1, 2, 3] as const) {
      let totalStrokes = 0;
      let totalPar = 0;
      let holesPlayed = 0;

      for (const holeNumber of holeNumbers) {
        const par = parByHole.get(holeNumber) ?? null;
        const strokes = scoreMap.get(`${round}-${holeNumber}`) ?? null;
        const toPar = strokes != null && par != null ? strokes - par : null;

        if (strokes != null) {
          totalStrokes += strokes;
          holesPlayed += 1;
        }

        if (par != null && strokes != null) {
          totalPar += par;
        }

        rounds[round].holes.push({
          hole_number: holeNumber,
          par,
          strokes,
          to_par: toPar,
        });
      }

      rounds[round].holes_played = holesPlayed;
      rounds[round].total_strokes = holesPlayed > 0 ? totalStrokes : null;
      rounds[round].total_to_par = holesPlayed > 0 ? totalStrokes - totalPar : null;
    }

    return NextResponse.json({
      ok: true,
      player: {
        id: reg.id,
        first_name: reg.first_name,
        last_name: reg.last_name,
        holes: reg.holes,
        home_club: reg.home_club,
        hcp: reg.hcp,
      },
      rounds,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}