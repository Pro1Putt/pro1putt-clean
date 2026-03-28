import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId");

  if (!tournamentId) {
    return NextResponse.json({ ok: false, error: "Missing tournamentId" });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("v_completed_scorecards")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("player_name", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  const holes = Array.from({ length: 18 }, (_, i) => i + 1);

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
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
        }

        .sig-block {
          margin-top: 28px;
        }

        .line {
          border-top: 1px solid #000;
          width: 300px;
          height: 1px;
        }

        .sig-label {
          margin-top: 8px;
          font-size: 14px;
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
      ${(data ?? [])
        .map((p) => {
          const scores =
            p && typeof p.scores === "object" && p.scores !== null ? p.scores : {};

          const tournamentName = escapeHtml(p.tournament_name ?? "Turnier");
          const playerName = escapeHtml(p.player_name ?? "Unbekannter Spieler");
          const markerName = escapeHtml(p.marker_name ?? "");
          const round = escapeHtml(p.round ?? "");

          return `
            <div class="card">
              <div class="title">${tournamentName}</div>
              <div class="meta"><strong>Spieler:</strong> ${playerName}</div>
              <div class="meta"><strong>Runde:</strong> ${round}</div>
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
                      const value = scores[String(h)] ?? scores[h] ?? "";
                      return `<td>${escapeHtml(value)}</td>`;
                    })
                    .join("")}
                </tr>
              </table>

              <div class="signatures">
                <div class="sig-block">
                  <div class="line"></div>
                  <div class="sig-label">Spieler Unterschrift</div>
                </div>

                <div class="sig-block">
                  <div class="line"></div>
                  <div class="sig-label">Marker Unterschrift</div>
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
}