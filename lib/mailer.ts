import { Resend } from "resend";

export type GenericEmailArgs = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export type RegistrationEmailArgs = {
  to: string;
  tournamentName: string;
  playerName: string;
  playerPin: string; // <- WICHTIG: PIN kommt rein
  divisionName?: string | null;
  leaderboardUrl?: string | null;
  pinUrl?: string | null; // z.B. https://pro1putt-clean.vercel.app/pin
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

// Resend: niemals undefined Felder mitschicken
export async function sendEmail(args: GenericEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "PRO1PUTT <noreply@pro1putt.com>";

  const subject = norm(args.subject);
  const html = args.html ?? "";
  const text = args.text ?? "";

  if (!apiKey) {
    console.warn("[mailer] RESEND_API_KEY missing -> skipping email send", {
      to: args.to,
      subject,
    });
    return { ok: false, skipped: true as const };
  }

  const resend = new Resend(apiKey);

  const payload: any = { from, to: args.to, subject };
  if (html) payload.html = html;
  if (text) payload.text = text;

  const res = await resend.emails.send(payload);
  return { ok: true as const, res };
}

function buildPinMailHtml(a: RegistrationEmailArgs) {
  const tournament = escapeHtml(norm(a.tournamentName));
  const player = escapeHtml(norm(a.playerName));
  const division = a.divisionName ? escapeHtml(norm(a.divisionName)) : "";
  const pin = escapeHtml(norm(a.playerPin));

  const leaderboardUrl = a.leaderboardUrl ? norm(a.leaderboardUrl) : "";
  const pinUrl = a.pinUrl ? norm(a.pinUrl) : "";

  // Logo: wenn du später eine eigene URL willst, sag kurz Bescheid
  const logoUrl =
    "https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png";

  const topPill = `<span style="display:inline-block;padding:8px 12px;border-radius:999px;background:#e8efe9;color:#1e4620;font-weight:700;font-size:12px;">PRO1PUTT Turnier</span>`;

  const divisionLine = division
    ? `<div style="margin-top:6px;color:#3a3a3a;font-size:14px;"><b>Kategorie:</b> ${division}</div>`
    : `<div style="margin-top:6px;color:#3a3a3a;font-size:14px;"><b>Kategorie:</b> </div>`;

  const btnLeft = pinUrl
    ? `<a href="${pinUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1e4620;color:#ffffff;text-decoration:none;font-weight:800;">Check-in / Scoring öffnen →</a>`
    : "";

  const btnRight = leaderboardUrl
    ? `<a href="${leaderboardUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#e8efe9;color:#1e4620;text-decoration:none;font-weight:800;border:1px solid rgba(30,70,32,0.25);">Leaderboard ansehen →</a>`
    : "";

  const fallbackLink = pinUrl
    ? `<div style="margin-top:14px;color:#3a3a3a;font-size:13px;">
         Falls die Buttons nicht funktionieren, kopiere diesen Link in deinen Browser:<br/>
         <a href="${pinUrl}" style="color:#1e4620;text-decoration:underline;">${escapeHtml(pinUrl)}</a>
       </div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#eef3ef;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="max-width:760px;margin:0 auto;padding:26px;">
      <div style="background:#ffffff;border-radius:18px;border:1px solid rgba(0,0,0,0.08);overflow:hidden;">
        <div style="padding:20px 22px;border-bottom:1px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${logoUrl}" alt="PRO1PUTT" style="height:40px;width:auto;display:block;" />
            <div>
              <div style="font-weight:900;color:#1e4620;font-size:18px;line-height:1.2;">PRO1PUTT Registrierung bestätigt</div>
              <div style="color:#6b7280;font-size:13px;margin-top:2px;">Live Scoring • PRO1PUTT</div>
            </div>
          </div>
          <div>${topPill}</div>
        </div>

        <div style="padding:22px;">
          <div style="font-size:26px;font-weight:900;color:#0f172a;margin:0 0 8px 0;">Hallo ${player},</div>
          <div style="color:#334155;font-size:14px;line-height:1.5;margin-bottom:16px;">
            deine Registrierung ist eingegangen. Unten findest du deinen persönlichen PIN für Check-in &amp; Scoring.
          </div>

          <div style="border:1px solid rgba(0,0,0,0.08);border-radius:16px;padding:16px;display:flex;align-items:stretch;justify-content:space-between;gap:14px;">
            <div style="flex:1;">
              <div style="color:#6b7280;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Turnier</div>
              <div style="margin-top:4px;font-weight:900;color:#0f172a;font-size:16px;">${tournament}</div>
              ${divisionLine}
            </div>
            <div style="width:1px;background:rgba(0,0,0,0.08);"></div>
            <div style="min-width:220px;text-align:right;">
              <div style="color:#6b7280;font-weight:800;font-size:12px;">Dein persönlicher PIN</div>
              <div style="margin-top:6px;font-weight:1000;color:#0f172a;font-size:44px;letter-spacing:1px;">${pin}</div>
              <div style="margin-top:4px;color:#6b7280;font-size:12px;">
                Bitte nicht weitergeben. Dieser PIN ist für Check-in und Score-Eingabe.
              </div>
            </div>
          </div>

          <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap;">
            ${btnLeft}
            ${btnRight}
          </div>

          ${fallbackLink}

          <div style="margin-top:18px;color:#6b7280;font-size:12px;">
            PRO1PUTT • Diese E-Mail wurde automatisch gesendet. Wenn du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export async function sendRegistrationEmail(args: RegistrationEmailArgs) {
  const subject = `PRO1PUTT Registrierung bestätigt – dein PIN`;
  const html = buildPinMailHtml(args);

  const text =
    `PRO1PUTT Registrierung bestätigt\n\n` +
    `Spieler: ${norm(args.playerName)}\n` +
    `Turnier: ${norm(args.tournamentName)}\n` +
    `PIN: ${norm(args.playerPin)}\n` +
    (args.divisionName ? `Kategorie: ${norm(args.divisionName)}\n` : "") +
    (args.pinUrl ? `Check-in/Scoring: ${norm(args.pinUrl)}\n` : "") +
    (args.leaderboardUrl ? `Leaderboard: ${norm(args.leaderboardUrl)}\n` : "");

  return sendEmail({ to: args.to, subject, html, text });
}