import { Resend } from "resend";

export type RegistrationEmailArgs = {
  to: string;
  tournamentName: string;
  playerName: string;
  divisionName?: string | null;
  teeTime?: string | null;
  leaderboardUrl?: string | null;
};

function norm(v: unknown) {
  return String(v ?? "").trim();
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildHtml(a: RegistrationEmailArgs) {
  const tournament = escapeHtml(norm(a.tournamentName));
  const player = escapeHtml(norm(a.playerName));
  const division = a.divisionName ? escapeHtml(norm(a.divisionName)) : "";
  const teeTime = a.teeTime ? escapeHtml(norm(a.teeTime)) : "";
  const leaderboardUrl = a.leaderboardUrl ? norm(a.leaderboardUrl) : "";

  const divisionLine = division ? `<p style="margin:0 0 6px 0;"><b>Division:</b> ${division}</p>` : "";
  const teeTimeLine = teeTime ? `<p style="margin:0 0 6px 0;"><b>Tee Time:</b> ${teeTime}</p>` : "";
  const leaderboardLine = leaderboardUrl
    ? `<p style="margin:10px 0 0 0;"><a href="${leaderboardUrl}" style="color:#00C46A;text-decoration:none;"><b>Zum Leaderboard</b></a></p>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border-radius:14px;padding:22px;border:1px solid #e9ecef;">
        <h2 style="margin:0 0 10px 0;color:#111;">PRO1PUTT Registrierung bestätigt</h2>
        <p style="margin:0 0 14px 0;color:#333;">Hallo <b>${player}</b>,</p>
        <p style="margin:0 0 12px 0;color:#333;">du bist erfolgreich für folgendes Turnier registriert:</p>

        <div style="background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:14px;">
          <p style="margin:0 0 6px 0;"><b>Turnier:</b> ${tournament}</p>
          ${divisionLine}
          ${teeTimeLine}
        </div>

        ${leaderboardLine}

        <p style="margin:18px 0 0 0;color:#555;font-size:12px;">
          Wenn du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendRegistrationEmail(args: RegistrationEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "PRO1PUTT <noreply@pro1putt.com>";

  // Immer ein STRING (nie undefined) -> TypeScript-Fehler weg
  const subject = `PRO1PUTT: Registrierung bestätigt – ${norm(args.tournamentName)}`;
  const html = buildHtml(args);
  const text = `PRO1PUTT Registrierung bestätigt\n\nTurnier: ${norm(args.tournamentName)}\nSpieler: ${norm(
    args.playerName
  )}${args.divisionName ? `\nDivision: ${norm(args.divisionName)}` : ""}${args.teeTime ? `\nTee Time: ${norm(args.teeTime)}` : ""}${
    args.leaderboardUrl ? `\nLeaderboard: ${norm(args.leaderboardUrl)}` : ""
  }\n`;

  if (!apiKey) {
    console.warn("[mailer] RESEND_API_KEY missing -> skipping email send", {
      to: args.to,
      subject,
    });
    return { ok: false, skipped: true as const };
  }

  const resend = new Resend(apiKey);

  const res = await resend.emails.send({
    from,
    to: args.to,
    subject,
    html, // <- garantiert string
    text, // <- garantiert string
  });

  return { ok: true as const, res };
}