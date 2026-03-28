import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
if (!supabaseAnonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TOURNAMENT_ID = "7716349a-8bb0-46c6-b60c-3594eb7ea60f";
const ROUND_NO = 1;
const LOGO_URL =
  "https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png";

const COLORS = {
  green: "#00C46A",
  dark: "#00995A",
  text: "#111827",
  muted: "#6B7280",
  line: "#E5E7EB",
  soft: "#F8FAFC",
  white: "#FFFFFF",
};

function safe(v: any) {
  const s = String(v ?? "").trim();
  return s || "-";
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleTimeString("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function formatGeneratedAt() {
  return new Date().toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadLogoBuffer() {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const y = doc.page.height - 34;

  doc
    .strokeColor(COLORS.line)
    .lineWidth(1)
    .moveTo(40, y - 8)
    .lineTo(doc.page.width - 40, y - 8)
    .stroke();

  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8)
    .text(`Erstellt am ${formatGeneratedAt()}`, 40, y, {
      width: doc.page.width - 80,
      align: "right",
    });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - 70) {
    drawFooter(doc);
    doc.addPage();
    doc.y = 40;
  }
}

function drawLabelValue(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  value: string,
  width: number
) {
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(8).text(label, x, y, { width });
  doc.fillColor(COLORS.text).font("Helvetica").fontSize(11).text(value, x, y + 12, { width });
}

async function main() {
  const logoBuffer = await loadLogoBuffer();

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name, location, start_date")
    .eq("id", TOURNAMENT_ID)
    .single();

  if (tournamentError) {
    console.error("Fehler beim Laden des Turniers:", tournamentError);
    process.exit(1);
  }

  const { data: flights, error: flightsError } = await supabase
    .from("flights")
    .select(`
      id,
      round,
      flight_number,
      holes,
      gender,
      start_time,
      flight_players (
        seat,
        registration:registrations!flight_players_registration_id_fkey (
          first_name,
          last_name,
          hcp,
          home_club
        )
      )
    `)
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("round", ROUND_NO)
    .order("start_time", { ascending: true });

  if (flightsError) {
    console.error("Fehler beim Laden der Flights:", flightsError);
    process.exit(1);
  }

  const tournamentName = safe(tournament?.name);
  const location = safe(tournament?.location);
  const startDate = formatDate(tournament?.start_date);

  const filename = `startliste_${slugify(tournamentName)}_runde${ROUND_NO}.pdf`;
  const filePath = path.join(process.cwd(), filename);

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    autoFirstPage: true,
  });

  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc
    .roundedRect(40, 40, doc.page.width - 80, 110, 18)
    .fill(COLORS.dark);

  if (logoBuffer) {
    doc.image(logoBuffer, 58, 60, {
      fit: [88, 66],
      align: "left",
      valign: "center",
    });
  }

  const titleX = logoBuffer ? 162 : 58;

  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(13).text("PRO1PUTT", titleX, 62);

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("Startliste", titleX, 80);

  doc
    .font("Helvetica")
    .fontSize(13)
    .text(tournamentName, titleX, 110, {
      width: doc.page.width - titleX - 60,
    });

  doc.y = 170;

  // Meta section
  doc
    .roundedRect(40, doc.y, doc.page.width - 80, 56, 14)
    .fill(COLORS.soft);

  const metaY = doc.y + 10;
  drawLabelValue(doc, 56, metaY, "RUNDE", String(ROUND_NO), 60);
  drawLabelValue(doc, 126, metaY, "DATUM", startDate, 100);
  drawLabelValue(doc, 236, metaY, "ORT", location, 180);
  drawLabelValue(doc, 430, metaY, "FLIGHTS", String(flights?.length || 0), 80);

  doc.y += 78;

  for (const flight of flights || []) {
    const players = [...(flight.flight_players || [])].sort(
      (a: any, b: any) => Number(a.seat ?? 0) - Number(b.seat ?? 0)
    );

    const blockHeight = 56 + 26 + Math.max(players.length, 1) * 26 + 16;
    ensureSpace(doc, blockHeight);

    const x = 40;
    const y = doc.y;
    const w = doc.page.width - 80;
    const headerH = 42;

    doc
      .roundedRect(x, y, w, blockHeight, 14)
      .lineWidth(1)
      .strokeColor(COLORS.line)
      .stroke();

    doc
      .roundedRect(x, y, w, headerH, 14)
      .fill(COLORS.green);

    doc
      .fillColor(COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(`Flight ${safe(flight.flight_number)}`, x + 16, y + 13);

    doc
      .font("Helvetica")
      .fontSize(11)
      .text(
        `${formatTime(flight.start_time)} Uhr · ${safe(flight.gender)} · ${safe(flight.holes)} Loch`,
        x + 140,
        y + 14,
        {
          width: w - 156,
          align: "right",
        }
      );

    const tableY = y + headerH + 12;
    const colSeat = x + 16;
    const colName = x + 62;
    const colHcp = x + 320;
    const colClub = x + 380;

    doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(8);
    doc.text("SEAT", colSeat, tableY);
    doc.text("NAME", colName, tableY);
    doc.text("HCP", colHcp, tableY);
    doc.text("CLUB", colClub, tableY);

    doc
      .strokeColor(COLORS.line)
      .moveTo(x + 16, tableY + 14)
      .lineTo(x + w - 16, tableY + 14)
      .stroke();

    let rowY = tableY + 18;

    if (!players.length) {
      doc.fillColor(COLORS.text).font("Helvetica").fontSize(10);
      doc.text("Keine Spieler in diesem Flight", colName, rowY + 4);
    } else {
      players.forEach((entry: any) => {
        const p = entry.registration || {};
        const firstName = String(p.first_name || "").trim();
        const lastName = String(p.last_name || "").trim();
        const name = [firstName, lastName].filter(Boolean).join(" ") || "-";
        const hcp = p.hcp ?? "-";
        const club = safe(p.home_club);

        doc.fillColor(COLORS.text).font("Helvetica").fontSize(10);
        doc.text(String(entry.seat ?? "-"), colSeat, rowY + 4, { width: 30 });
        doc.text(name, colName, rowY + 4, { width: 245 });
        doc.text(String(hcp), colHcp, rowY + 4, { width: 45 });
        doc.text(club, colClub, rowY + 4, { width: 150 });

        rowY += 26;
      });
    }

    doc.y = y + blockHeight + 14;
  }

  drawFooter(doc);
  doc.end();

  console.log("Startliste erstellt:", filePath);
}

main().catch((err) => {
  console.error("Unerwarteter Fehler:", err);
  process.exit(1);
});