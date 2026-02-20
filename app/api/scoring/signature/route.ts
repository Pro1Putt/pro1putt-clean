import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const tournament_id = normStr(body.tournament_id || body.tournamentId);
    const registration_id = normStr(body.registration_id || body.registrationId);
    const round = Number(body.round ?? 1);
    const role = normStr(body.role);
    const signed_name = normStr(body.signed_name || body.signedName);
    const signature_data_url = normStr(body.signature_data_url || body.signatureDataUrl);

    const requiredPin = normStr(process.env.TD_PIN || "");
    const td_pin = normStr(body.td_pin || body.tdPin || "");

    if (!tournament_id) return jsonError("Missing tournament_id", 400);
    if (!registration_id) return jsonError("Missing registration_id", 400);
    if (![1, 2, 3].includes(round)) return jsonError("round must be 1, 2, or 3", 400);
    if (!["player", "marker", "td"].includes(role)) return jsonError("role must be player|marker|td", 400);
    if (!signed_name) return jsonError("signed_name required", 400);

    // optional absichern: TD_PIN nur für td
    if (requiredPin && role === "td") {
      if (!td_pin || td_pin !== requiredPin) return jsonError("TD_PIN invalid", 401);
    }

    // signature_data_url optional, aber wenn da -> validieren
    if (signature_data_url) {
      if (!signature_data_url.startsWith("data:image/png;base64,")) {
        return jsonError("signature_data_url must be a PNG data URL (data:image/png;base64,...)", 400);
      }
      // grobe Größenbremse (ca. 400KB Base64)
      if (signature_data_url.length > 600_000) {
        return jsonError("signature_data_url too large", 400);
      }
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase.from("scorecard_signatures").upsert(
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

    if (error) return jsonError(`signature upsert failed: ${error.message}`, 500);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}