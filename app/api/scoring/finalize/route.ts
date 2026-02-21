import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/mailer";

function normStr(v: any) {
  return String(v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function fetchScorecardPdfBytes(baseUrl: string, tournamentId: string, registrationId: string, round: number, tdPin?: string) {
  const u = new URL(`${baseUrl}/api/scoring/scorecard-pdf`);
  u.searchParams.set("tournamentId", tournamentId);
  u.searchParams.set("registrationId", registrationId);
  u.searchParams.set("round", String(round));
  if (tdPin) u.searchParams.set("td_pin", tdPin);

  const res = await fetch(u.toString(), { cache: "no-store" });
  const ct = res.headers.get("content-type") || "";
  const buf = new Uint8Array(await res.arrayBuffer());

  // wenn API JSON zurückgibt -> Fehlertext
  if (!ct.includes("application/pdf")) {
    const txt = new TextDecoder().decode(buf);
    throw new Error(`scorecard-pdf not pdf: ${txt.slice(0, 250)}`);
  }
  return buf;
}

function getBaseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const tournament_id = normStr(body.tournament_id || body.tournamentId);
    const registration_id = normStr(body.registration_id || body.registrationId);
    const round = Number(body.round ?? 1);
    const role = normStr(body.role);
    const signed_name = normStr(body.signed_name || body.signedName);
    const signature_data_url = normStr(body.signature_data_url || body.signatureDataUrl); // optional

    const requiredPin = normStr(process.env.TD_PIN || "");
    const td_pin = normStr(body.td_pin || body.tdPin || "");

    if (!tournament_id) return jsonError("Missing tournament_id", 400);
    if (!registration_id) return jsonError("Missing registration_id", 400);
    if (![1, 2, 3].includes(round)) return jsonError("round must be 1, 2, or 3", 400);
    if (!["player", "marker", "td"].includes(role)) return jsonError("role must be player|marker|td", 400);
    if (!signed_name) return jsonError("signed_name required", 400);

    // TD Pin nur für TD (wenn gesetzt)
    if (requiredPin && role === "td") {
      if (!td_pin || td_pin !== requiredPin) return jsonError("TD_PIN invalid", 401);
    }

    // Signature data url optional
    if (signature_data_url) {
      if (!signature_data_url.startsWith("data:image/png;base64,")) {
        return jsonError("signature_data_url must be a PNG data URL (data:image/png;base64,...)", 400);
      }
      if (signature_data_url.length > 600_000) {
        return jsonError("signature_data_url too large", 400);
      }
    }

    const supabase = getServiceSupabase();

    // upsert signature row
    const { error: upErr } = await supabase.from("scorecard_signatures").upsert(
      [
        {
          tournament_id,
          registration_id,
          round,
          role,
          signed_name,
          signature_data_url: signature_data_url || null,
        },
      ],
      { onConflict: "tournament_id,registration_id,round,role" }
    );

    if (upErr) return jsonError(`signature upsert failed: ${upErr.message}`, 500);

    // check which roles exist
    const { data: sigs, error: sErr } = await supabase
      .from("scorecard_signatures")
      .select("role")
      .eq("tournament_id", tournament_id)
      .eq("registration_id", registration_id)
      .eq("round", round);

    if (sErr) return jsonError(`signature read failed: ${sErr.message}`, 500);

    const roles = new Set((sigs || []).map((r: any) => String(r.role)));
    const missing: string[] = [];
    if (!roles.has("player")) missing.push("player");
    if (!roles.has("marker")) missing.push("marker");
    if (!roles.has("td")) missing.push("td");

    const finalized = missing.length === 0;

    // optional: mark a "scorecard_finalized" flag somewhere later (wenn du willst)
    // fürs MVP reicht: finalized true/false zurückgeben

    // 🔥 Auto-mail only when it becomes finalized
    if (finalized) {
      const secretariat = normStr(process.env.CLUB_SECRETARIAT_EMAIL || "");
      const office = normStr(process.env.TOURNAMENT_OFFICE_EMAIL || "");

      const to = [secretariat, office].filter(Boolean);
      if (to.length) {
        const baseUrl = getBaseUrl(req);

        // tournament info for subject
        const { data: tRow } = await supabase
          .from("tournaments")
          .select("name,start_date,location")
          .eq("id", tournament_id)
          .single();

        const tName = normStr(tRow?.name) || "PRO1PUTT";
        const date = normStr(tRow?.start_date) || "";
        const loc = normStr(tRow?.location) || "";

        const pdfBytes = await fetchScorecardPdfBytes(baseUrl, tournament_id, registration_id, round, requiredPin ? td_pin : undefined);

       await sendEmail({
  to: Array.isArray(to) ? to[0] : to,
  subject: `Finalisierte Scorecard – ${tName} – Runde ${round}`,
  text:
    `Finalisierte Scorecard als PDF im Anhang.\n\n` +
    `Turnier: ${tName}\n` +
    `Runde: ${round}\n`,
});
      }
    }

    return NextResponse.json({ ok: true, finalized, missing });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}