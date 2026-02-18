import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function normStr(v: any) {
  return String(v ?? "").trim();
}
function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tournament_id = normStr(body.tournament_id);
    const round = toInt(body.round) ?? 1;

    // Minimal Schutz (unbedingt setzen!)
    const tdPin = normStr(body.td_pin);
    const required = process.env.TD_PIN || "";
    if (!required) {
      return NextResponse.json(
        { ok: false, error: "Missing TD_PIN on server (set env TD_PIN)" },
        { status: 500 }
      );
    }
    if (!tdPin || tdPin !== required) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!tournament_id) {
      return NextResponse.json({ ok: false, error: "Missing tournament_id" }, { status: 400 });
    }
    if (![1, 2, 3].includes(round)) {
      return NextResponse.json({ ok: false, error: "round must be 1,2,3" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Registrations laden
    const { data: regs, error: regErr } = await supabase
      .from("registrations")
      .select("id,holes,gender,hcp")
      .eq("tournament_id", tournament_id);

    if (regErr) return NextResponse.json({ ok: false, error: regErr.message }, { status: 500 });

    const list = (regs || []).filter(
      (r: any) =>
        (r.gender === "Boys" || r.gender === "Girls") &&
        (r.holes === 9 || r.holes === 18)
    );

    if (list.length === 0) {
      return NextResponse.json({ ok: false, error: "No registrations for flights" }, { status: 400 });
    }

    // Pools: Round 1 -> 18 Loch zuerst, dann 9 Loch. Innerhalb: HCP asc, Boys/Girls getrennt aber gemischt nach HCP.
    const by = (holes: number, gender: "Boys" | "Girls") =>
      list
        .filter((r: any) => r.holes === holes && r.gender === gender)
        .sort((a: any, b: any) => (toNum(a.hcp) ?? 999) - (toNum(b.hcp) ?? 999));

    const b18 = by(18, "Boys");
    const g18 = by(18, "Girls");
    const b9 = by(9, "Boys");
    const g9 = by(9, "Girls");

    // Merge zwei sortierte Listen nach HCP (damit nicht erst alle Boys dann alle Girls kommen)
    function merge(a: any[], b: any[]) {
      const out: any[] = [];
      let i = 0, j = 0;
      while (i < a.length || j < b.length) {
        const ah = i < a.length ? (toNum(a[i].hcp) ?? 999) : Infinity;
        const bh = j < b.length ? (toNum(b[j].hcp) ?? 999) : Infinity;
        if (ah <= bh) out.push(a[i++]);
        else out.push(b[j++]);
      }
      return out;
    }

    const ordered18 = merge(b18, g18);
    const ordered9 = merge(b9, g9);

    // Vorhandene Flights/Players für dieses Turnier+Round löschen
    const { data: existingFlights } = await supabase
      .from("flights")
      .select("id")
      .eq("tournament_id", tournament_id)
      .eq("round", round);

    const existingIds = (existingFlights || []).map((f: any) => f.id).filter(Boolean);

    if (existingIds.length) {
      await supabase.from("flight_players").delete().in("flight_id", existingIds);
      await supabase.from("flights").delete().in("id", existingIds);
    }

    // Flights bauen: erst 18, dann 9. flights.holes ist NOT NULL -> setzen!
    const flightsToInsert: any[] = [];
    let flightNumber = 1;

    function addFlightsFor(listX: any[], holes: 9 | 18) {
      for (let i = 0; i < listX.length; i += 3) {
        flightsToInsert.push({
          tournament_id,
          round,
          flight_number: flightNumber++,
          start_time: null,
          holes, // ✅ wichtig
        });
      }
    }

    addFlightsFor(ordered18, 18);
    addFlightsFor(ordered9, 9);

    const { data: flights, error: fErr } = await supabase
      .from("flights")
      .insert(flightsToInsert)
      .select("id,flight_number,holes");

    if (fErr) return NextResponse.json({ ok: false, error: fErr.message }, { status: 500 });

    // Map flight_number -> flight row
    const flightByNumber = new Map<number, any>();
    for (const f of flights || []) flightByNumber.set(f.flight_number, f);

    // FlightPlayers: pro Flight 3 Spieler, marks_registration_id = nächster im Flight (round robin)
    const flightPlayersToInsert: any[] = [];

    // Hilfsfunktion: legt Mitglieder in den passenden Flight ein (der Reihe nach)
    function assignPlayers(listX: any[], startFlightNumber: number) {
      let fn = startFlightNumber;
      for (let i = 0; i < listX.length; i += 3) {
        const members = listX.slice(i, i + 3);
        const flight = flightByNumber.get(fn);
        if (!flight) throw new Error(`Flight missing for flight_number=${fn}`);

        for (let m = 0; m < members.length; m++) {
          const me = members[m];
          const next = members[(m + 1) % members.length]; // 0->1,1->2,2->0
          flightPlayersToInsert.push({
  flight_id: flight.id,
  registration_id: me.id,
  marks_registration_id: next.id,
  seat: m + 1, // ✅ wichtig: 1..3
});
        }
        fn++;
      }
      return fn;
    }

    // 18 Flights starten bei 1
    let nextFn = assignPlayers(ordered18, 1);
    // 9 Flights starten danach
    assignPlayers(ordered9, nextFn);

    const { error: fpErr } = await supabase.from("flight_players").insert(flightPlayersToInsert);
    if (fpErr) return NextResponse.json({ ok: false, error: fpErr.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      created_flights: flightsToInsert.length,
      created_flight_players: flightPlayersToInsert.length,
      round,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}