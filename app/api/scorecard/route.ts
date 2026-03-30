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

type ParRow = { hole: number; par: number };
type RegRow = { id: string; holes: number | null; first_name: string; last_name: string };
type HoleEntryRow = {
  round: number;
  hole_number: number;
  entered_by: string;
  for_registration_id: string;
  strokes: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tournamentId = String(searchParams.get("tournamentId") || "").trim();
    const registrationId = String(searchParams.get("registrationId") || "").trim();
    const round = Number(searchParams.get("round") || "1");

    if (!tournamentId || !registrationId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId or registrationId" }, { status: 400 });
    }
    if (![1, 2, 3].includes(round)) {
      return NextResponse.json({ ok: false, error: "round must be 1,2,3" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Player basics (holes + name)
    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("id,holes,first_name,last_name")
      .eq("id", registrationId)
      .eq("tournament_id", tournamentId)
      .single();

    if (regErr || !reg) {
      return NextResponse.json({ ok: false, error: "Registration not found" }, { status: 404 });
    }

    const player = reg as unknown as RegRow;
    const maxHole = Number(player.holes || 18);

    // Pars (optional)
    const parByHole = new Map<number, number>();
    {
      const { data: pars, error: pErr } = await supabase
 .from("v_registration_holes")
.select("hole_number, par")
.eq("tournament_id", tournamentId);

      if (!pErr && pars) {
        for (const p of pars as any as ParRow[]) {
          const h = safeNum((p as any).hole_number);
          const par = safeNum((p as any).par);
          if (h && par) parByHole.set(h, par);
        }
      }
    }

    // Hole entries for this player in this round (both entered_by variants)
    const { data: he, error: heErr } = await supabase
      .from("hole_entries")
      .select("round,hole_number,entered_by,for_registration_id,strokes")
      .eq("tournament_id", tournamentId)
      .eq("round", round)
      .eq("for_registration_id", registrationId);

    const entries: HoleEntryRow[] = (!heErr && he ? (he as any) : []) as any;

    // Group by hole
    const byHole = new Map<number, HoleEntryRow[]>();
    for (const e of entries) {
      const h = safeNum((e as any).hole_number);
      const s = safeNum((e as any).strokes);
      if (!h || !s) continue;
      if (!byHole.has(h)) byHole.set(h, []);
      byHole.get(h)!.push(e);
    }

    // Build scorecard rows 1..maxHole
    const rows = Array.from({ length: maxHole }, (_, i) => i + 1).map((hole) => {
      const list = byHole.get(hole) || [];

      // Find confirmed: at least two different entered_by with same strokes
      let confirmed = false;
      let strokes: number | null = null;

      if (list.length === 1) {
        strokes = safeNum(list[0].strokes);
        confirmed = false;
      } else if (list.length >= 2) {
        const uniqBy = new Map<string, number>();
        for (const e of list) {
          const eb = String((e as any).entered_by || "");
          const st = safeNum((e as any).strokes);
          if (!eb || !st) continue;
          if (!uniqBy.has(eb)) uniqBy.set(eb, st);
        }
        const vals = Array.from(uniqBy.values());
        if (vals.length >= 2) {
          const first = vals[0];
          const allSame = vals.every((v) => v === first);
          if (allSame) {
            confirmed = true;
            strokes = first;
          } else {
            confirmed = false;
            strokes = vals[0] ?? null;
          }
        } else if (vals.length === 1) {
          confirmed = false;
          strokes = vals[0] ?? null;
        }
      }

      const par = parByHole.get(hole) ?? null;

      return {
        hole,
        par,
        strokes,
        confirmed,
        entries: list.map((e) => ({
          entered_by: String((e as any).entered_by || ""),
          strokes: safeNum((e as any).strokes),
        })),
      };
    });

    // totals
    const totalStrokes = rows.reduce((sum, r) => sum + (typeof r.strokes === "number" ? r.strokes : 0), 0);
    const totalPar = rows.reduce((sum, r) => sum + (typeof r.par === "number" ? r.par : 0), 0);
    const holesWithScore = rows.filter((r) => typeof r.strokes === "number").length;

    const toPar =
      holesWithScore === 0 || totalPar === 0
        ? null
        : totalStrokes - totalPar;

    return NextResponse.json({
      ok: true,
      player: {
        registration_id: player.id,
        name: `${player.first_name} ${player.last_name}`.trim(),
        holes: maxHole,
      },
      round,
      totals: {
        holes_with_score: holesWithScore,
        strokes: holesWithScore ? totalStrokes : null,
        par: totalPar || null,
        to_par: typeof toPar === "number" ? toPar : null,
      },
      rows,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
