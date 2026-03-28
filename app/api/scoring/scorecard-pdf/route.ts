import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeNum(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type ScorecardRow = {
  tournament_id: string;
  tournament_name?: string | null;
  player_name?: string | null;
  marker_name?: string | null;
  registration_id?: string | null;
  round?: number | null;

  gender?: string | null;
  player_gender?: string | null;
  category_gender?: string | null;

  hole_count?: number | null;
  holes?: number | null;
  number_of_holes?: number | null;

  slope?: number | string | null;
  course_slope?: number | string | null;
  tee_slope?: number | string | null;

  course_rating?: number | string | null;
  courserating?: number | string | null;
  rating?: number | string | null;
    registrations?: {
    tee?: string | null;
    course_rating?: number | string | null;
    slope?: number | string | null;
  } | null;
};

type HoleEntryRow = {
  tournament_id: string;
  for_registration_id: string;
  round: number;
  hole_number: number;
  entered_by?: string | null;
  strokes: number;
};

type SignatureRow = {
  tournament_id: string;
  registration_id: string;
  round: number;
  role: string;
  signed_name?: string | null;
  signature_data_url?: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = String(searchParams.get("tournamentId") || "").trim();

    if (!tournamentId) {
      return NextResponse.json(
        { ok: false, error: "Missing tournamentId" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

   const { data: scorecards, error: scorecardsError } = await supabase
  .from("v_completed_scorecards")
  .select(`
    *,
    registrations (
      tee,
      course_rating,
      slope
    )
  `)
  .eq("tournament_id", tournamentId)
  .order("player_name", { ascending: true });

    if (scorecardsError) {
      return NextResponse.json(
        { ok: false, error: scorecardsError.message },
        { status: 500 }
      );
    }

    const { data: holeEntries, error: holeEntriesError } = await supabase
      .from("hole_entries")
      .select("tournament_id, for_registration_id, round, hole_number, entered_by, strokes")
      .eq("tournament_id", tournamentId)
      .order("hole_number", { ascending: true });

    if (holeEntriesError) {
      return NextResponse.json(
        { ok: false, error: holeEntriesError.message },
        { status: 500 }
      );
    }

        const { data: signatures, error: signaturesError } = await supabase
      .from("scorecard_signatures")
      .select(`
        tournament_id,
        registration_id,
        round,
        player_signature_data_url,
        marker_signature_data_url,
        player_signed_name,
        marker_signed_name
      `)
      .eq("tournament_id", tournamentId);

    if (signaturesError) {
      return NextResponse.json(
        { ok: false, error: signaturesError.message },
        { status: 500 }
      );
    }

    const holes = Array.from({ length: 18 }, (_, i) => i + 1);

    const entriesByPlayerRound = new Map<string, HoleEntryRow[]>();
    for (const raw of (holeEntries ?? []) as HoleEntryRow[]) {
      const registrationId = String(raw.for_registration_id || "").trim();
      const round = safeNum(raw.round);

      if (!registrationId || !round) continue;

      const key = `${registrationId}__${round}`;
      if (!entriesByPlayerRound.has(key)) {
        entriesByPlayerRound.set(key, []);
      }
      entriesByPlayerRound.get(key)!.push(raw);
    }
// 👉 Abschlag berechnen
function getTee(gender: string, holeCount: number) {
  if (holeCount === 18 && gender === "Boys") return "Gelb";
  if (holeCount === 18 && gender === "Girls") return "Rot";
  if (holeCount === 9 && gender === "Boys") return "Rot";
  if (holeCount === 9 && gender === "Girls") return "Orange";
  return "-";
}
    const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Scorecards</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #000;
          }

          .card {
            page-break-after: always;
            border: 2px solid #000;
            padding: 20px;
            margin-bottom: 20px;
          }

          .title {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
          }

          .meta {
            margin: 4px 0;
            font-size: 14px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th, td {
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            font-size: 12px;
          }

          th {
            background: #f3f3f3;
          }

          .signatures {
            margin-top: 40px;
            display: flex;
            gap: 40px;
            justify-content: space-between;
          }

          .sig-block {
            flex: 1;
            min-width: 0;
          }

          .sig-image-wrap {
            height: 90px;
            display: flex;
            align-items: end;
            margin-bottom: 8px;
          }

          .sig-image {
            max-height: 80px;
            max-width: 100%;
            object-fit: contain;
            display: block;
          }

          .line {
            border-top: 1px solid #000;
            width: 100%;
            height: 1px;
          }

          .sig-label {
            margin-top: 8px;
            font-size: 14px;
          }

          .sig-name {
            margin-top: 4px;
            font-size: 12px;
            color: #444;
          }

          @media print {
            body {
              padding: 0;
            }

            .card {
              margin-bottom: 0;
            }
          }
        </style>
      </head>
      <body>
        ${((scorecards ?? []) as ScorecardRow[])
          .map((p) => {
            const registrationId = String(p.registration_id || "").trim();
            const round = safeNum(p.round) ?? 1;
            const entryKey = `${registrationId}__${round}`;
            const rawEntries = entriesByPlayerRound.get(entryKey) || [];
const sig =
  (signatures ?? []).find(
    (s: any) =>
      String(s.registration_id || "").trim() === registrationId &&
      Number(s.round) === round
  ) || null;
const gender = String(
  p.gender ?? p.player_gender ?? p.category_gender ?? ""
).trim();

const holeCount =
  Number(
    p.hole_count ??
      p.holes ??
      p.number_of_holes ??
      (Array.isArray(holes) ? holes.length : 0)
  ) || 0;

const tee = String(
  p.registrations?.tee ?? getTee(gender, holeCount) ?? "-"
).trim();

const slope = String(
  p.registrations?.slope ?? "-"
).trim();

const courseRating = String(
  p.registrations?.course_rating ?? "-"
).trim();

console.log("PDF DATA CHECK:", {
  tee,
  slope,
  courseRating,
  raw: p
});
            const scoresByHole: Record<string, number | string> = {};

            for (const hole of holes) {
              const perHole = rawEntries.filter(
                (e) => safeNum(e.hole_number) === hole
              );

              if (perHole.length === 0) continue;

              const uniqueByEnteredBy = new Map<string, number>();

              for (const e of perHole) {
                const enteredBy =
                  String(e.entered_by || "").trim() || `entry_${hole}`;
                const strokes = safeNum(e.strokes);

                if (!strokes) continue;
                if (!uniqueByEnteredBy.has(enteredBy)) {
                  uniqueByEnteredBy.set(enteredBy, strokes);
                }
              }

              const values = Array.from(uniqueByEnteredBy.values());
              if (values.length === 0) continue;

              scoresByHole[String(hole)] = values[0];
            }

            const tournamentName = escapeHtml(p.tournament_name ?? "Turnier");
            const playerName = escapeHtml(
              p.player_name ?? "Unbekannter Spieler"
            );
            const markerName = escapeHtml(p.marker_name ?? "");
            const roundLabel = escapeHtml(round);
            const teeLabel = escapeHtml(tee || "-");
const slopeLabel = escapeHtml(slope || "-");
const courseRatingLabel = escapeHtml(courseRating || "-");

          const playerSigUrl =
  sig?.player_signature_data_url &&
  String(sig.player_signature_data_url).startsWith("data:image/")
    ? sig.player_signature_data_url
    : "";

const markerSigUrl =
  sig?.marker_signature_data_url &&
  String(sig.marker_signature_data_url).startsWith("data:image/")
    ? sig.marker_signature_data_url
    : "";

const playerSignedName = escapeHtml(sig?.player_signed_name ?? "");
const markerSignedName = escapeHtml(sig?.marker_signed_name ?? "");
const signaturesHtml = `
  <div style="margin-top:40px; display:flex; justify-content:space-between; gap:40px;">
    <div style="flex:1; text-align:center;">
      <div style="font-size:12px; color:#666;">Player Signature</div>
      ${
        playerSigUrl
          ? `<img src="${playerSigUrl}" style="height:80px; object-fit:contain;" />`
          : `<div style="height:80px;"></div>`
      }
      <div style="margin-top:6px; font-size:14px; font-weight:600;">
        ${playerSignedName}
      </div>
      <div style="border-top:1px solid #000; margin-top:8px;"></div>
    </div>

    <div style="flex:1; text-align:center;">
      <div style="font-size:12px; color:#666;">Marker Signature</div>
      ${
        markerSigUrl
          ? `<img src="${markerSigUrl}" style="height:80px; object-fit:contain;" />`
          : `<div style="height:80px;"></div>`
      }
      <div style="margin-top:6px; font-size:14px; font-weight:600;">
        ${markerSignedName}
      </div>
      <div style="border-top:1px solid #000; margin-top:8px;"></div>
    </div>
  </div>
`;

            return `
              <div class="card">
              <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.5;">
  <strong>Abschlag:</strong> ${tee}<br />
  <strong>Slope:</strong> ${slope}<br />
  <strong>Course Rating:</strong> ${courseRating}
</div>
                <div class="title">${tournamentName}</div>
                <div class="meta"><strong>Spieler:</strong> ${playerName}</div>
                <div class="meta"><strong>Runde:</strong> ${roundLabel}</div>
                ${
                  markerName
                    ? `<div class="meta"><strong>Marker:</strong> ${markerName}</div>`
                    : ""
                }

                <table>
                  <tr>
                    ${holes.map((h) => `<th>${h}</th>`).join("")}
                  </tr>
                  <tr>
                    ${holes
                      .map((h) => {
                        const value = scoresByHole[String(h)] ?? "";
                        return `<td>${escapeHtml(value)}</td>`;
                      })
                      .join("")}
                  </tr>
                </table>

                <div class="signatures">
                  <div class="sig-block">
                    <div class="sig-image-wrap">
                      ${
                        playerSigUrl
                          ? `<img class="sig-image" src="${playerSigUrl}" alt="Spieler Signatur" />`
                          : ``
                      }
                    </div>
                    <div class="line"></div>
                    <div class="sig-label">Spieler Unterschrift</div>
                    ${
                      playerSignedName
                        ? `<div class="sig-name">${playerSignedName}</div>`
                        : ``
                    }
                  </div>

                  <div class="sig-block">
                    <div class="sig-image-wrap">
                      ${
                        markerSigUrl
                          ? `<img class="sig-image" src="${markerSigUrl}" alt="Marker Signatur" />`
                          : ``
                      }
                    </div>
                    <div class="line"></div>
                    <div class="sig-label">Marker Unterschrift</div>
                    ${
                      markerSignedName
                        ? `<div class="sig-name">${markerSignedName}</div>`
                        : ``
                    }
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </body>
    </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}