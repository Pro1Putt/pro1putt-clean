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

// Regel: Wer 18 Loch spielt, darf nicht unter U14 einsortiert werden -> dann U14
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
  holes: number; // 9|18
  home_club: string | null;
};

type FlightPlayerRow = {
  registration_id: string;
  marks_registration_id: string;
  flight: {
    flight_number: number;
    start_time: string | null;
  } | null;
};

type HoleEntryRow = {
  round: number;
  hole_number: number;
  entered_by: string;
  for_registration_id: string;
  strokes: number;
};

type ParRow = {
  hole: number;
  par: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tournamentId = String(searchParams.get("tournamentId") || "").trim();
    const round = Number(searchParams.get("round") || "1"); // default Round 1

    if (!tournamentId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId" }, { status: 400 });
    }
    if (![1, 2, 3].includes(round)) {
      return NextResponse.json({ ok: false, error: "round must be 1,2,3" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Tournament start_date (für Altersklasse)
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

    // Registrations (Spieler)
    const { data: regs, error: regErr } = await supabase
      .from("registrations")
      .select("id,tournament_id,first_name,last_name,hcp,nation,gender,birthdate,holes,home_club")
      .eq("tournament_id", tournamentId);

    if (regErr) {
      return NextResponse.json({ ok: false, error: regErr.message }, { status: 500 });
    }

    const registrations = (regs || []) as RegRow[];

    // Marker-Zuordnung + Flight/Startzeit (Round)
    const { data: fp, error: fpErr } = await supabase
      .from("flight_players")
      .select("registration_id,marks_registration_id,flight:flights(flight_number,start_time)")
      .eq("flight.tournament_id", tournamentId) // join filter
      .eq("flight.round", round);

    // Manche Supabase-Setups mögen join-filter nicht: fallback ohne join-filter
    let flightPlayers: FlightPlayerRow[] = [];
    if (!fpErr && fp) {
      flightPlayers = fp as any;
    } else {
      const { data: fp2, error: fp2Err } = await supabase
        .from("flight_players")
        .select("registration_id,marks_registration_id,flight_id");
      if (fp2Err) {
        // keine flights vorhanden -> ok, dann bleiben Flight/Start leer
        flightPlayers = [];
      } else {
        // flight details separat holen
        const flightIds = Array.from(new Set((fp2 || []).map((r: any) => r.flight_id).filter(Boolean)));
        const { data: fl, error: flErr } = await supabase
          .from("flights")
          .select("id,tournament_id,round,flight_number,start_time")
          .eq("tournament_id", tournamentId)
          .eq("round", round)
          .in("id", flightIds.length ? flightIds : ["00000000-0000-0000-0000-000000000000"]);

        const flightById = new Map<string, any>();
        if (!flErr && fl) for (const f of fl as any[]) flightById.set(f.id, f);

        flightPlayers = (fp2 || [])
          .map((r: any) => {
            const f = flightById.get(r.flight_id) || null;
            return {
              registration_id: r.registration_id,
              marks_registration_id: r.marks_registration_id,
              flight: f ? { flight_number: f.flight_number, start_time: f.start_time } : null,
            };
          })
          .filter((r: any) => r.flight !== null || true) as any;
      }
    }

    const markerOf = new Map<string, string>(); // player -> marker
    const flightInfo = new Map<string, { flight_number: number | null; start_time: string | null }>();

    for (const r of flightPlayers) {
      if (r?.registration_id && r?.marks_registration_id) {
        markerOf.set(r.registration_id, r.marks_registration_id);
      }
      if (r?.registration_id) {
        flightInfo.set(r.registration_id, {
          flight_number: r.flight?.flight_number ?? null,
          start_time: r.flight?.start_time ?? null,
        });
      }
    }

    // Pars (optional) – wir nutzen tournament_holes falls vorhanden
    const parByHole = new Map<number, number>();
    {
      const { data: pars, error: pErr } = await supabase
        .from("tournament_holes")
        .select("hole,par")
        .eq("tournament_id", tournamentId);

      if (!pErr && pars) {
        for (const p of pars as any as ParRow[]) {
          const h = safeNum((p as any).hole);
          const par = safeNum((p as any).par);
          if (h && par) parByHole.set(h, par);
        }
      }
    }

    // Hole entries (Round)
    const { data: he, error: heErr } = await supabase
      .from("hole_entries")
      .select("round,hole_number,entered_by,for_registration_id,strokes")
      .eq("tournament_id", tournamentId)
      .eq("round", round);

    const holeEntries: HoleEntryRow[] = (!heErr && he ? (he as any) : []) as any;

    // index: (entered_by + for_id + hole) -> strokes
    const entryKey = (enteredBy: string, forId: string, hole: number) => `${enteredBy}::${forId}::${hole}`;
    const strokesByKey = new Map<string, number>();

    for (const e of holeEntries) {
      const h = safeNum((e as any).hole_number);
      const s = safeNum((e as any).strokes);
      if (!h || !s) continue;
      const eb = String((e as any).entered_by || "");
      const fr = String((e as any).for_registration_id || "");
      if (!eb || !fr) continue;
      strokesByKey.set(entryKey(eb, fr, h), s);
    }

    // Build rows with confirmed scoring
    const rows = registrations.map((r) => {
      const holes = Number(r.holes || 18);
      const maxHole = holes === 9 ? 9 : 18;

      const age = calcAge(String(r.birthdate), String(tRow.start_date));
      const baseGroup = ageGroupFromAge(age);
      const age_group = normalizeGroupForHoles(baseGroup, holes);

      const markerId = markerOf.get(r.id) || null;

      let confirmedThru = 0;
      let strokesSum = 0;
      let parSum = 0;
      let hasAnyConfirmed = false;

      for (let h = 1; h <= maxHole; h++) {
        const self = strokesByKey.get(entryKey(r.id, r.id, h));
        const marker = markerId ? strokesByKey.get(entryKey(markerId, r.id, h)) : undefined;

        // Loch gilt als bestätigt nur wenn beide vorhanden & gleich
        if (self != null && marker != null && self === marker) {
          hasAnyConfirmed = true;
          confirmedThru = h;
          strokesSum += self;

          const par = parByHole.get(h);
          if (par != null) parSum += par;
        }
      }

      const score = hasAnyConfirmed ? strokesSum : null;
      const to_par = hasAnyConfirmed && parSum > 0 ? strokesSum - parSum : null;

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
        thru: hasAnyConfirmed ? confirmedThru : 0,
        to_par,

        flight_number: fi.flight_number,
        start_time: fi.start_time,
      };
    });

    // Sort: to_par asc (null last), then score asc, then thru desc, then hcp asc, then name
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