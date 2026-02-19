import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts } from "pdf-lib";

function normStr(v: any) {
  return String(v ?? "").trim();
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function toNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeName(r: any) {
  const fn = normStr(r?.first_name || r?.firstName || "");
  const ln = normStr(r?.last_name || r?.lastName || "");
  const n = `${fn} ${ln}`.trim();
  return n || `Reg ${normStr(r?.id)}`;
}

async function getServiceSupabase() {
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

    // optional absichern (empfohlen):
    if (requiredPin) {
      if (!tdPin || tdPin !== requiredPin) return jsonError("TD_PIN invalid", 401);
    }

    const supabase = await getServiceSupabase();

    // Tournament name (optional)
    const { data: tour, error: tErr } = await supabase
      .from("tournaments")
      .select("id,name,start_date,location")
      .eq("id", tournamentId)
      .single();

    if (tErr) return jsonError(`tournaments read failed: ${tErr.message}`, 500);

    // flights
    const { data: flights, error: fErr } = await supabase
      .from("flights")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", roundNo);

    if (fErr) return jsonError(`flights read failed: ${fErr.message}`, 500);

    const flightIds = (flights || []).map((f: any) => String(f.id));
    const { data: fps, error: fpErr } = flightIds.length
      ? await supabase.from("flight_players").select("*").in("flight_id", flightIds)
      : { data: [], error: null as any };

    if (fpErr) return jsonError(`flight_players read failed: ${fpErr.message}`, 500);

    // registrations für Namen/HCP/Gender/Holes
    const regIds = Array.from(new Set((fps || []).map((x: any) => x.registration_id).filter(Boolean)));
    const { data: regs, error: rErr } = regIds.length
      ? await supabase
          .from("registrations")
          .select("*")
          .in("id", regIds)
      : { data: [], error: null as any };

    if (rErr) return jsonError(`registrations read failed: ${rErr.message}`, 500);

    const regById = new Map<string, any>((regs || []).map((r: any) => [String(r.id), r]));

    // sort flights by flight_number / flight_no
    const getFlightNo = (f: any) => {
      const n =
        toNumber(f.flight_number) ??
        toNumber(f.flight_no) ??
        toNumber(f.number) ??
        toNumber(f.no) ??
        null;
      return n ?? 999999;
    };

    const flightsSorted = (flights || []).slice().sort((a: any, b: any) => getFlightNo(a) - getFlightNo(b));

    // PDF erstellen
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pageMargin = 40;
    const lineH = 14;

    function addPage() {
      const p = pdf.addPage([595.28, 841.89]); // A4
      return p;
    }

    let page = addPage();
    let y = page.getHeight() - pageMargin;

    const title = `Startliste – ${normStr(tour?.name) || "Turnier"} – Runde ${roundNo}`;
    page.drawText(title, { x: pageMargin, y, size: 16, font: fontBold });
    y -= 22;

    const subtitleParts = [
      normStr(tour?.start_date) ? `Datum: ${normStr(tour?.start_date)}` : "",
      normStr(tour?.location) ? `Ort: ${normStr(tour?.location)}` : "",
    ].filter(Boolean);

    if (subtitleParts.length) {
      page.drawText(subtitleParts.join("   |   "), { x: pageMargin, y, size: 10, font });
      y -= 18;
    }

    const now = new Date();
    page.drawText(`Export: ${now.toISOString().slice(0, 19).replace("T", " ")}`, {
      x: pageMargin,
      y,
      size: 9,
      font,
    });
    y -= 18;

    // Tabelle pro Flight
    for (const f of flightsSorted) {
      const flightNo = getFlightNo(f);
      const holes = toNumber(f.holes) ?? null;
      const gender = normStr(f.gender) || "";
      const startTime = normStr(f.start_time) || "";

      const header = `Flight ${flightNo}${gender ? " – " + gender : ""}${holes ? " – " + holes + " Loch" : ""}${
        startTime ? " – Start: " + startTime : ""
      }`;

      // Seitenumbruch wenn nötig
      if (y < pageMargin + 140) {
        page = addPage();
        y = page.getHeight() - pageMargin;
      }

      page.drawText(header, { x: pageMargin, y, size: 12, font: fontBold });
      y -= 16;

      // Spaltenkopf
      page.drawText("Seat", { x: pageMargin, y, size: 10, font: fontBold });
      page.drawText("Spieler", { x: pageMargin + 45, y, size: 10, font: fontBold });
      page.drawText("HCP", { x: pageMargin + 340, y, size: 10, font: fontBold });
      page.drawText("Markiert von", { x: pageMargin + 400, y, size: 10, font: fontBold });
      y -= 10;

      // Linie
      page.drawLine({
        start: { x: pageMargin, y },
        end: { x: page.getWidth() - pageMargin, y },
        thickness: 1,
      });
      y -= 12;

      const members = (fps || [])
        .filter((x: any) => String(x.flight_id) === String(f.id))
        .slice()
        .sort((a: any, b: any) => (toNumber(a.seat) ?? 999) - (toNumber(b.seat) ?? 999));

      if (!members.length) {
        page.drawText("— keine Spieler zugeordnet —", { x: pageMargin, y, size: 10, font });
        y -= 18;
        continue;
      }

      for (const m of members) {
        const reg = regById.get(String(m.registration_id)) || null;
        const seat = toNumber(m.seat) ?? "";
        const name = safeName(reg);
        const hcp = reg ? toNumber(reg.hcp) : null;

        const markerReg = regById.get(String(m.marks_registration_id)) || null;
        const markerName = markerReg ? safeName(markerReg) : "";

        if (y < pageMargin + 60) {
          page = addPage();
          y = page.getHeight() - pageMargin;
        }

        page.drawText(String(seat), { x: pageMargin, y, size: 10, font });
        page.drawText(name, { x: pageMargin + 45, y, size: 10, font });
        page.drawText(hcp === null ? "" : String(hcp), { x: pageMargin + 340, y, size: 10, font });
        page.drawText(markerName, { x: pageMargin + 400, y, size: 10, font });

        y -= lineH;
      }

      y -= 10;
    }

    const bytes = await pdf.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="startliste_${tournamentId}_round${roundNo}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unknown error", 500);
  }
}