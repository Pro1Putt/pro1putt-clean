import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function normStr(v: any) {
  return String(v ?? "").trim();
}

function roundCols(round: number) {
  if (round === 1) return { finalizedAt: "r1_finalized_at" };
  if (round === 2) return { finalizedAt: "r2_finalized_at" };
  return { finalizedAt: "r3_finalized_at" };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const tournamentId = normStr(searchParams.get("tournamentId"));
    const registrationId = normStr(searchParams.get("registrationId"));
    const round = Number(searchParams.get("round") || 1);

    if (!tournamentId || !registrationId) {
      return NextResponse.json({ ok: false, error: "Missing tournamentId/registrationId" }, { status: 400 });
    }
    if (![1, 2, 3].includes(round)) {
      return NextResponse.json({ ok: false, error: "round must be 1,2,3" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Tournament
    const { data: tRow, error: tErr } = await supabase
      .from("tournaments")
      .select("id,name,start_date,location")
      .eq("id", tournamentId)
      .single();

    if (tErr || !tRow) {
      return NextResponse.json({ ok: false, error: "Tournament not found" }, { status: 404 });
    }

    // Registration
    const cols = roundCols(round);
    const { data: rRow, error: rErr } = await supabase
      .from("registrations")
      .select(`id,first_name,last_name,holes,hcp,home_club,nation,${cols.finalizedAt}`)
      .eq("id", registrationId)
      .eq("tournament_id", tournamentId)
      .single();

    if (rErr || !rRow) {
      return NextResponse.json({ ok: false, error: "Registration not found" }, { status: 404 });
    }

    if (!(rRow as any)[cols.finalizedAt]) {
      return NextResponse.json({ ok: false, error: "Scorecard not finalized yet" }, { status: 409 });
    }

    const holes = Number((rRow as any).holes || 18);
    const maxHole = holes === 9 ? 9 : 18;

    // Determine marker for this player (who marks me)
    const { data: whoMarksMe, error: wmErr } = await supabase
      .from("flight_players")
      .select("registration_id")
      .eq("marks_registration_id", registrationId)
      .limit(1);

    if (wmErr) {
      return NextResponse.json({ ok: false, error: wmErr.message }, { status: 500 });
    }
    const markerId = whoMarksMe?.[0]?.registration_id ?? null;

    // Hole entries (Round)
    const { data: he, error: heErr } = await supabase
      .from("hole_entries")
      .select("hole_number,entered_by,for_registration_id,strokes")
      .eq("tournament_id", tournamentId)
      .eq("round", round);

    if (heErr) {
      return NextResponse.json({ ok: false, error: heErr.message }, { status: 500 });
    }

    const key = (enteredBy: string, forId: string, hole: number) => `${enteredBy}::${forId}::${hole}`;
    const map = new Map<string, number>();
    for (const e of (he || []) as any[]) {
      const h = Number(e.hole_number);
      const s = Number(e.strokes);
      if (!Number.isFinite(h) || !Number.isFinite(s)) continue;
      map.set(key(String(e.entered_by), String(e.for_registration_id), h), s);
    }

    const holesTable: { hole: number; strokes: number | null }[] = [];
    let total = 0;
    let thru = 0;

    for (let h = 1; h <= maxHole; h++) {
      const self = map.get(key(registrationId, registrationId, h));
      const marker = markerId ? map.get(key(markerId, registrationId, h)) : undefined;

      if (self != null && marker != null && self === marker) {
        holesTable.push({ hole: h, strokes: self });
        total += self;
        thru = h;
      } else {
        holesTable.push({ hole: h, strokes: null });
      }
    }

    // Signatures
    const { data: sigs, error: sigErr } = await supabase
      .from("scorecard_signatures")
      .select("role,signed_name,signed_at")
      .eq("tournament_id", tournamentId)
      .eq("registration_id", registrationId)
      .eq("round", round);

    if (sigErr) {
      return NextResponse.json({ ok: false, error: sigErr.message }, { status: 500 });
    }

    const sigByRole = new Map<string, any>();
    for (const s of (sigs || []) as any[]) sigByRole.set(s.role, s);

    const playerSig = sigByRole.get("player");
    const markerSig = sigByRole.get("marker");

    // -------- PDF (pdf-lib) --------
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 points
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const GREEN = rgb(30 / 255, 70 / 255, 32 / 255);
    const DARK = rgb(0.07, 0.07, 0.07);
    const GRAY = rgb(0.4, 0.4, 0.4);

    const margin = 48;
    let y = height - margin;

    const drawText = (text: string, x: number, y: number, size: number, bold = false, color = DARK) => {
      page.drawText(text, { x, y, size, font: bold ? fontBold : font, color });
    };

    // Header
    drawText("PRO1PUTT • Official Scorecard", margin, y, 18, true, GREEN);
    y -= 26;

    drawText(`Tournament: ${tRow.name || "Tournament"}`, margin, y, 11, true, DARK);
    y -= 16;

    const dateLine = `Dates: ${tRow.start_date || "—"}${tRow.location ? ` • ${tRow.location}` : ""}`;
    drawText(dateLine, margin, y, 10, false, DARK);
    y -= 14;

    drawText(`Round: ${round}`, margin, y, 10, false, DARK);
    y -= 18;

    // Player block
    const fullName = `${rRow.first_name} ${rRow.last_name}`.trim();
    drawText(`Player: ${fullName}`, margin, y, 11, true, DARK);
    y -= 16;

    drawText(`Category: ${holes} holes`, margin, y, 10, false, DARK);
    y -= 14;

    const meta = `HCP: ${(rRow as any).hcp ?? "—"}   Club: ${(rRow as any).home_club ?? "—"}   Nation: ${(rRow as any).nation ?? "—"}`;
    drawText(meta, margin, y, 10, false, DARK);
    y -= 14;

    const totals = `Thru: ${thru}/${maxHole}   Total: ${thru > 0 ? total : "—"}`;
    drawText(totals, margin, y, 10, false, DARK);
    y -= 22;

    // Holes grid
    drawText("Holes", margin, y, 11, true, GREEN);
    y -= 10;

    const colsPerRow = maxHole === 9 ? 3 : 6;
    const cellW = (width - margin * 2) / colsPerRow;
    const cellH = 26;

    const startY = y;
    const startX = margin;

    const strokeColor = rgb(0.82, 0.82, 0.82);

    for (let i = 0; i < holesTable.length; i++) {
      const r = holesTable[i];
      const row = Math.floor(i / colsPerRow);
      const col = i % colsPerRow;

      const x = startX + col * cellW;
      const yy = startY - row * cellH;

      // box
      page.drawRectangle({
        x,
        y: yy - cellH,
        width: cellW,
        height: cellH,
        borderColor: strokeColor,
        borderWidth: 1,
      });

      const val = r.strokes == null ? "—" : String(r.strokes);
      drawText(`${r.hole}: ${val}`, x + 8, yy - 18, 10, false, DARK);
    }

    y = startY - Math.ceil(holesTable.length / colsPerRow) * cellH - 18;

    // Signatures
    drawText("Signatures", margin, y, 11, true, GREEN);
    y -= 16;

    const pLine = `Player: ${playerSig?.signed_name || "—"}   (${playerSig?.signed_at ? new Date(playerSig.signed_at).toLocaleString() : "—"})`;
    const mLine = `Marker: ${markerSig?.signed_name || "—"}   (${markerSig?.signed_at ? new Date(markerSig.signed_at).toLocaleString() : "—"})`;

    drawText(pLine, margin, y, 10, false, DARK);
    y -= 14;
    drawText(mLine, margin, y, 10, false, DARK);
    y -= 18;

    drawText("This scorecard was finalized digitally in the PRO1PUTT scoring system.", margin, y, 9, false, GRAY);

    const pdfBytes = await pdfDoc.save();

    const filenameSafe =
      `${(tRow.name || "PRO1PUTT").replace(/[^\w\-]+/g, "_")}_R${round}_` +
      `${fullName.replace(/[^\w\-]+/g, "_")}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filenameSafe}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}