import { Resend } from "resend";

const LOGO_URL = "https://pro1putt.com/pro1putt-logo.png";

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
  const from = process.env.MAIL_FROM ?? "PRO1PUTT <registration@contact.pro1putt.com>";
  const subject = norm(args.subject);
  const html = args.html ?? "";
  const text = args.text ?? "";

  if (!apiKey) {
    console.warn("[mailer] RESEND_API_KEY missing -> skipping email send", { to: args.to, subject });
    return { ok: false as const, skipped: true as const };
  }

  const resend = new Resend(apiKey);
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
  divisionName?: string | null;
  pin: string;
  pinUrl: string;
  leaderboardUrl: string;
  teeTime?: string | null;
};

function buildPinEmailHtml(a: RegistrationEmailArgs) {
  const player = escapeHtml(norm(a.playerName));
  const tournament = escapeHtml(norm(a.tournamentName));
  const pin = escapeHtml(norm(a.pin));
  const leaderboardUrl = norm(a.leaderboardUrl);
  const pinUrl = norm(a.pinUrl);

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0d1a0d;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Logo & Brand -->
    <div style="text-align:center;margin-bottom:32px;">
      <img src="${LOGO_URL}" alt="PRO1PUTT" width="56" height="56"
           style="display:inline-block;border-radius:14px;margin-bottom:12px;" />
      <div style="color:#4aaa4a;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">
        PRO1PUTT LIVE SCORING
      </div>
    </div>

    <!-- Main Card -->
    <div style="background:#131a13;border-radius:24px;overflow:hidden;border:1px solid #1e2a1e;">

      <!-- Green Header -->
      <div style="background:linear-gradient(135deg,#0b5d3b 0%,#147a52 100%);padding:32px 28px;">
        <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-bottom:8px;">
          Registrierung bestätigt ✓
        </div>
        <div style="color:#ffffff;font-size:28px;font-weight:900;line-height:1.2;margin-bottom:8px;">
          Hallo ${player}!
        </div>
        <div style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.5;">
          Du bist erfolgreich für das folgende Turnier angemeldet:
        </div>
        <div style="color:#c8f03c;font-size:20px;font-weight:900;margin-top:10px;">
          ${tournament}
        </div>
      </div>

      <!-- PIN Box -->
      <div style="padding:28px;">
        <div style="background:#0a0f0a;border-radius:16px;padding:24px;border:1px solid #1e2a1e;text-align:center;margin-bottom:24px;">
          <div style="color:#666;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
            Dein persönlicher PIN
          </div>
          <div style="color:#c8f03c;font-size:72px;font-weight:900;letter-spacing:8px;line-height:1;">
            ${pin}
          </div>
          <div style="color:#555;font-size:12px;margin-top:12px;line-height:1.6;">
            Diesen PIN benötigst du zum Einloggen in die PRO1PUTT Scoring App.<br/>
            <strong style="color:#666;">Bitte nicht weitergeben.</strong>
          </div>
        </div>

        <!-- Info -->
        <div style="background:#0d150d;border-radius:12px;padding:16px;border:1px solid #1a2a1a;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <div>
              <div style="color:#555;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Turnier</div>
              <div style="color:#fff;font-weight:700;font-size:14px;">${tournament}</div>
            </div>
            <div style="text-align:right;">
              <div style="color:#555;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Scoring App</div>
              <div style="color:#4aaa4a;font-weight:700;font-size:14px;">PRO1PUTT App</div>
            </div>
          </div>
        </div>

        <!-- How it works -->
        <div style="margin-bottom:24px;">
          <div style="color:#666;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
            So funktioniert es
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${[
              ["1", "PRO1PUTT App öffnen", "Lade die App aus dem App Store"],
              ["2", "PIN eingeben", `Gib deinen persönlichen PIN <strong style="color:#c8f03c;">${pin}</strong> ein`],
              ["3", "Score eingeben", "Trage deine Scores Loch für Loch ein"],
              ["4", "Unterschreiben", "Bestätige deine Scorekarte digital"],
            ].map(([num, title, desc]) => `
            <div style="display:flex;align-items:flex-start;gap:12px;">
              <div style="background:#0b5d3b;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex-shrink:0;text-align:center;line-height:24px;">
                ${num}
              </div>
              <div>
                <div style="color:#fff;font-weight:700;font-size:13px;">${title}</div>
                <div style="color:#666;font-size:12px;margin-top:2px;">${desc}</div>
              </div>
            </div>`).join("")}
          </div>
        </div>

        <!-- Leaderboard Button -->
        <a href="${escapeHtml(leaderboardUrl)}"
           style="display:block;background:linear-gradient(135deg,#0b5d3b,#147a52);color:#ffffff;text-decoration:none;font-weight:800;padding:16px;border-radius:12px;text-align:center;font-size:15px;">
          🏆 Leaderboard ansehen →
        </a>

        <!-- Fallback Link -->
        <div style="margin-top:16px;text-align:center;font-size:11px;color:#444;line-height:1.6;">
          Leaderboard: <a href="${escapeHtml(leaderboardUrl)}" style="color:#4aaa4a;">${escapeHtml(leaderboardUrl)}</a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:#333;font-size:11px;line-height:1.8;">
      PRO1PUTT Tournament Registration &amp; Live Scoring<br/>
      Diese E-Mail wurde automatisch gesendet. Bitte nicht antworten.
    </div>

  </div>
</body>
</html>`;
}

export async function sendRegistrationEmail(args: RegistrationEmailArgs) {
  const subject = `PRO1PUTT – ${norm(args.tournamentName)} – dein PIN: ${norm(args.pin)}`;
  const html = buildPinEmailHtml(args);
  const text =
    `PRO1PUTT Registrierung bestätigt\n\n` +
    `Hallo ${norm(args.playerName)}\n` +
    `Turnier: ${norm(args.tournamentName)}\n` +
    `Dein PIN: ${norm(args.pin)}\n` +
    `Leaderboard: ${norm(args.leaderboardUrl)}\n`;

  return sendEmail({ to: args.to, subject, html, text });
}
