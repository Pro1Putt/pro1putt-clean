import { Resend } from "resend";

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

export type GenericEmailArgs = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export async function sendEmail(args: GenericEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "PRO1PUTT <noreply@pro1putt.com>";

  const subject = norm(args.subject);
  const html = args.html ?? "";
  const text = args.text ?? "";

  if (!apiKey) {
    console.warn("[mailer] RESEND_API_KEY missing -> skipping email send", { to: args.to, subject });
    return { ok: false as const, skipped: true as const };
  }

  const resend = new Resend(apiKey);

  // kein undefined ins payload (Resend TS Union)
  const payload: any = { from, to: args.to, subject };
  if (html) payload.html = html;
  if (text) payload.text = text;

  const res = await resend.emails.send(payload);
  return { ok: true as const, res };
}

export type RegistrationEmailArgs = {
  to: string;

  tournamentName: string;
  playerName: string;

  // Screenshot-Felder
  divisionName?: string | null; // "Kategorie"
  pin: string; // 4-stellig, MUSS drin sein (Screenshot)
  pinUrl: string; // https://.../pin (Screenshot)

  // optional
  teeTime?: string | null;
  leaderboardUrl: string; // Button "Leaderboard ansehen" (Screenshot)
};

function buildPinEmailHtml(a: RegistrationEmailArgs) {
  const player = escapeHtml(norm(a.playerName));
  const tournament = escapeHtml(norm(a.tournamentName));
  const division = a.divisionName ? escapeHtml(norm(a.divisionName)) : "";
  const pin = escapeHtml(norm(a.pin));

  const pinUrl = norm(a.pinUrl);
  const leaderboardUrl = norm(a.leaderboardUrl);

  const divisionLine = division
    ? `<div style="margin-top:6px;"><span style="opacity:.75;">Kategorie:</span> <b>${division}</b></div>`
    : `<div style="margin-top:6px;"><span style="opacity:.75;">Kategorie:</span> <b></b></div>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#eef2ee;">
    <div style="max-width:860px;margin:0 auto;padding:26px;font-family:Arial,Helvetica,sans-serif;">
      <div style="background:#ffffff;border-radius:18px;padding:22px;border:1px solid rgba(0,0,0,.06);">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:12px;background:#eef2ee;display:flex;align-items:center;justify-content:center;">
              <span style="font-weight:900;color:#1e4620;">P</span>
            </div>
            <div>
              <div style="font-weight:900;color:#1e4620;font-size:18px;">PRO1PUTT Registrierung bestätigt</div>
              <div style="opacity:.7;font-size:12px;">Live Scoring • PRO1PUTT</div>
            </div>
          </div>
          <div style="background:#e9efe9;border:1px solid rgba(30,70,32,.2);color:#1e4620;font-weight:800;padding:8px 12px;border-radius:999px;font-size:12px;">
            PRO1PUTT Turnier
          </div>
        </div>

        <!-- Greeting -->
        <div style="font-size:28px;font-weight:900;color:#111;margin:0 0 6px 0;">
          Hallo ${player},
        </div>
        <div style="opacity:.75;margin-bottom:16px;">
          deine Registrierung ist eingegangen. Unten findest du deinen persönlichen PIN für Check-in &amp; Scoring.
        </div>

        <!-- Info Box -->
        <div style="background:#f6f8f6;border:1px solid rgba(0,0,0,.06);border-radius:16px;padding:16px;display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
          <div>
            <div style="opacity:.7;font-weight:800;margin-bottom:6px;">Turnier</div>
            <div style="font-weight:900;color:#111;">${tournament}</div>
            ${divisionLine}
          </div>

          <div style="text-align:right;min-width:240px;">
            <div style="opacity:.7;font-weight:800;">Dein persönlicher PIN</div>
            <div style="font-size:56px;line-height:1;font-weight:900;letter-spacing:2px;color:#111;margin-top:6px;">${pin}</div>
            <div style="font-size:12px;opacity:.65;margin-top:6px;">
              Bitte nicht weitergeben. Dieser PIN ist für<br/>Check-in und Score-Eingabe.
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div style="margin-top:16px;">
          <a href="${escapeHtml(pinUrl)}"
            style="display:inline-block;background:#1e4620;color:#fff;text-decoration:none;font-weight:900;padding:12px 18px;border-radius:999px;">
            Check-in / Scoring öffnen →
          </a>

          <a href="${escapeHtml(leaderboardUrl)}"
            style="display:inline-block;background:#e9efe9;color:#1e4620;text-decoration:none;font-weight:900;padding:12px 18px;border-radius:999px;border:1px solid rgba(30,70,32,.25);margin-left:10px;">
            Leaderboard ansehen →
          </a>

          <div style="font-size:12px;opacity:.75;margin-top:10px;">
            Falls die Buttons nicht funktionieren, kopiere diesen Link in deinen Browser:<br/>
            <a href="${escapeHtml(pinUrl)}" style="color:#1e4620;text-decoration:underline;">${escapeHtml(pinUrl)}</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top:18px;font-size:12px;opacity:.6;">
          PRO1PUTT • Diese E-Mail wurde automatisch gesendet. Wenn du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendRegistrationEmail(args: RegistrationEmailArgs) {
  const subject = `PRO1PUTT Registrierung bestätigt – dein PIN`;

  const html = buildPinEmailHtml(args);

  const text =
    `PRO1PUTT Registrierung bestätigt\n\n` +
    `Hallo ${norm(args.playerName)}\n` +
    `Turnier: ${norm(args.tournamentName)}\n` +
    (args.divisionName ? `Kategorie: ${norm(args.divisionName)}\n` : "") +
    `PIN: ${norm(args.pin)}\n` +
    `Check-in/Scoring: ${norm(args.pinUrl)}\n` +
    `Leaderboard: ${norm(args.leaderboardUrl)}\n`;

  return sendEmail({ to: args.to, subject, html, text });
}