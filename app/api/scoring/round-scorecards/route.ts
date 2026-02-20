import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

function normStr(v: any) {
  return String(v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getBaseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tournamentId = normStr(searchParams.get("tournamentId"));
    const roundNo = Number(searchParams.get("round") ?? "1");
    const tdPin = normStr(searchParams.get("td_pin") ?? "");
    const requiredPin = normStr(process.env.TD_PIN || "");

    if (!tournamentId) return jsonError("Missing tournamentId", 400);
    if (![1, 2, 3].includes(roundNo)) return jsonError("round must be 1, 2, or 3", 400);

    if (requiredPin) {
      if (!tdPin || tdPin !== requiredPin) return jsonError("TD_PIN invalid", 401);
    }

    const supabase = getServiceSupabase();

    // Signaturen lesen und "finalized" pro registration ermitteln (player+marker+td)
    const { data: sigs, error: sErr } = await supabase
      .from("scorecard_signatures")
      .select("registration_id, role")
      .eq("tournament_id", tournamentId)
      .eq("round", roundNo);

    if (sErr) return jsonError(`scorecard_signatures read failed: ${sErr.message}`, 500);

    const need = new Set(["player", "marker", "td"]);
    const byReg = new Map<string, Set<string>>();

    for (const s of sigs || []) {
      const rid = String((s as any).registration_id || "").trim();
      const role = String((s as any).role || "").trim();
      if (!rid || !role) continue;
      if (!byReg.has(rid)) byReg.set(rid, new Set());
      byReg.get(rid)!.add(role);
    }

    const finalizedRegIds = Array.from(byReg.entries())
      .filter(([_, roles]) => Array.from(need).every((r) => roles.has(r)))
      .map(([rid]) => rid);

    if (!finalizedRegIds.length) {
      return jsonError("No finalized scorecards for this round yet", 404);
    }

    // Merge PDFs
    const baseUrl = getBaseUrl(req);
    const out = await PDFDocument.create();

    // stabile Reihenfolge: erst nach Registrierung-ID (kannst du später nach Flight/Startzeit sortieren)
    finalizedRegIds.sort((a, b) => a.localeCompare(b));

    for (const regId of finalizedRegIds) {
      const url =
        `${baseUrl}/api/scoring/scorecard-pdf` +
        `?tournamentId=${encodeURIComponent(tournamentId)}` +
        `&registrationId=${encodeURIComponent(regId)}` +
        `&round=${encodeURIComponent(String(roundNo))}` +
        (tdPin ? `&td_pin=${encodeURIComponent(tdPin)}` : "");

      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        return jsonError(`scorecard-pdf failed for ${regId}: ${r.status} ${txt}`, 500);
      }

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/pdf")) {
        const txt = await r.text().catch(() => "");
        return jsonError(`scorecard-pdf not pdf for ${regId}: ${txt}`, 500);
      }

      const bytes = new Uint8Array(await r.arrayBuffer());
      const doc = await PDFDocument.load(bytes);

      const pages = await out.copyPages(doc, doc.getPageIndices());
      for (const p of pages) out.addPage(p);
    }

    const merged = await out.save();

    return new NextResponse(Buffer.from(merged), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="round${roundNo}_scorecards.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}