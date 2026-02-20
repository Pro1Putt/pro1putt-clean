import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normStr(v: any) {
  return String(v ?? "").trim();
}
function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
function toInt(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Convert "YYYY-MM-DD" + "HH:MM" in Europe/Berlin to UTC ISO
const TZ = "Europe/Berlin";

function zonedToUtcISO(dateStr: string, timeStr: string, timeZone: string) {
  const [Y, M, D] = dateStr.split("-").map((x) => parseInt(x, 10));
  const [hh, mm] = timeStr.split(":").map((x) => parseInt(x, 10));

  const desiredUTC = Date.UTC(Y, M - 1, D, hh, mm, 0);

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  function partsToObj(d: Date) {
    const parts = fmt.formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return {
      year: parseInt(get("year"), 10),
      month: parseInt(get("month"), 10),
      day: parseInt(get("day"), 10),
      hour: parseInt(get("hour"), 10),
      minute: parseInt(get("minute"), 10),
      second: parseInt(get("second"), 10),
    };
  }

  let guess = new Date(desiredUTC);

  for (let i = 0; i < 3; i++) {
    const p = partsToObj(guess);
    const gotAsUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const diff = desiredUTC - gotAsUTC;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }

  return guess.toISOString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const tournamentId = normStr(body.tournamentId);
    const roundNo = toInt(body.round) ?? 1;
    const tdPin = normStr(body.td_pin);
    const startTime = normStr(body.start_time); // "HH:MM"
    const intervalMinutes = toInt(body.interval_minutes) ?? 10;
    const overwrite = Boolean(body.overwrite);

    const requiredPin = normStr(process.env.TD_PIN || "");
    if (requiredPin && (!tdPin || tdPin !== requiredPin)) return jsonError("TD_PIN invalid", 401);

    if (!tournamentId) return jsonError("Missing tournamentId", 400);
    if (![1, 2, 3].includes(roundNo)) return jsonError("round must be 1, 2, or 3", 400);
    if (!/^\d{2}:\d{2}$/.test(startTime)) return jsonError("start_time must be HH:MM", 400);
    if (!intervalMinutes || intervalMinutes < 1) return jsonError("interval_minutes invalid", 400);

    const supabase = getServiceSupabase();

    const { data: tour, error: tErr } = await supabase
      .from("tournaments")
      .select("id,start_date")
      .eq("id", tournamentId)
      .single();

    if (tErr) return jsonError(`tournaments read failed: ${tErr.message}`, 500);

    const startDate = normStr(tour?.start_date);
    if (!startDate) return jsonError("Tournament start_date missing", 400);

    const { data: flights, error: fErr } = await supabase
      .from("flights")
      .select("id,tournament_id,round,flight_number,start_time")
      .eq("tournament_id", tournamentId)
      .eq("round", roundNo)
      .order("flight_number", { ascending: true });

    if (fErr) return jsonError(`flights read failed: ${fErr.message}`, 500);

    const list = (flights || []).filter((f: any) => f?.id);
    const toUpdate = overwrite ? list : list.filter((f: any) => !f.start_time);

    const baseISO = zonedToUtcISO(startDate, startTime, TZ);
    const base = new Date(baseISO);

    let updated = 0;

    for (let idx = 0; idx < toUpdate.length; idx++) {
      const f: any = toUpdate[idx];
      const dt = new Date(base.getTime() + idx * intervalMinutes * 60_000);

      // IMPORTANT: update only, never upsert (prevents tournament_id null insert attempts)
      const { error: uErr } = await supabase
        .from("flights")
        .update({ start_time: dt.toISOString() })
        .eq("id", f.id)
        .eq("tournament_id", tournamentId)
        .eq("round", roundNo);

      if (uErr) return jsonError(`flights update failed: ${uErr.message}`, 500);
      updated++;
    }

    return NextResponse.json({
      ok: true,
      tournamentId,
      round: roundNo,
      interval_minutes: intervalMinutes,
      start_date: startDate,
      start_time: startTime,
      overwrite,
      updated,
      timezone: TZ,
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}