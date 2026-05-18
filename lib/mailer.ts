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
<body style="margin:0;padding:0;background:#f0f4f0;font-family:Arial,Helvetica,sans-serif;">

  <!-- Top Bar -->
  <div style="background:#1a3a1a;padding:16px 24px;text-align:center;">
    <img src="${LOGO_URL}" alt="PRO1PUTT" width="40" height="40"
         style="display:inline-block;vertical-align:middle;border-radius:8px;margin-right:10px;" />
    <span style="color:#ffffff;font-weight:900;font-size:18px;vertical-align:middle;letter-spacing:1px;">
      PRO1PUTT
    </span>
    <span style="color:rgba(255,255,255,0.6);font-size:12px;vertical-align:middle;margin-left:8px;">
      Tournament Registration & Live Scoring
    </span>
  </div>

  <!-- Main -->
  <div style="max-width:580px;margin:0 auto;padding:24px 16px 48px;">

    <!-- Hero Card -->
    <div style="background:#1a3a1a;border-radius:20px;padding:32px 28px;margin-bottom:16px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);color:#ffffff;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:6px 16px;border-radius:999px;margin-bottom:20px;">
        Registrierung bestätigt ✓
      </div>
      <div style="color:#ffffff;font-size:30px;font-weight:900;margin-bottom:8px;">
        Hallo ${player}!
      </div>
      <div style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.6;margin-bottom:16px;">
        Du bist erfolgreich angemeldet für:
      </div>
      <div style="color:#4ade6e;font-size:22px;font-weight:900;">
        ${tournament}
      </div>
    </div>

    <!-- PIN Card -->
    <div style="background:#ffffff;border-radius:20px;padding:28px;margin-bottom:16px;border:1px solid #e0e8e0;text-align:center;">
      <div style="color:#666;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">
        Dein persönlicher PIN
      </div>
      <div style="background:#f0f4f0;border-radius:16px;padding:24px;margin-bottom:16px;border:2px solid #d0e0d0;">
        <div style="color:#1a3a1a;font-size:64px;font-weight:900;letter-spacing:10px;line-height:1;">
          ${pin}
        </div>
      </div>
      <div style="color:#888;font-size:13px;line-height:1.6;">
        Diesen PIN benötigst du zum Einloggen in die<br/>
        <strong style="color:#1a3a1a;">PRO1PUTT Scoring App</strong>.<br/>
        Bitte nicht weitergeben.
      </div>
    </div>

    <!-- Info Card -->
    <div style="background:#ffffff;border-radius:20px;padding:24px;margin-bottom:16px;border:1px solid #e0e8e0;">
      <div style="color:#1a3a1a;font-size:16px;font-weight:900;margin-bottom:16px;">
        So funktioniert es
      </div>
      ${[
        ["1", "#1a3a1a", "PRO1PUTT App öffnen", "Lade die App aus dem App Store herunter"],
        ["2", "#1a3a1a", "PIN eingeben", `Gib deinen persönlichen PIN <strong>${pin}</strong> ein`],
        ["3", "#1a3a1a", "Score eingeben", "Trage deine Scores Loch für Loch ein"],
        ["4", "#1a3a1a", "Unterschreiben", "Bestätige deine Scorekarte digital am Ende der Runde"],
      ].map(([num, color, title, desc]) => `
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
        <div style="background:${color};color:#ffffff;min-width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-weight:900;font-size:13px;flex-shrink:0;">
          ${num}
        </div>
        <div>
          <div style="color:#1a3a1a;font-weight:800;font-size:14px;margin-bottom:2px;">${title}</div>
          <div style="color:#888;font-size:13px;line-height:1.5;">${desc}</div>
        </div>
      </div>`).join("")}
    </div>

    <!-- Leaderboard Button -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${escapeHtml(leaderboardUrl)}"
         style="display:inline-block;background:#3d9e4a;color:#ffffff;text-decoration:none;font-weight:900;padding:16px 32px;border-radius:12px;font-size:15px;">
        🏆 Leaderboard ansehen →
      </a>
    </div>

    <!-- Fallback -->
    <div style="text-align:center;font-size:11px;color:#999;line-height:1.8;">
      Leaderboard: <a href="${escapeHtml(leaderboardUrl)}" style="color:#3d9e4a;">${escapeHtml(leaderboardUrl)}</a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#1a3a1a;padding:20px 24px;text-align:center;">
    <div style="color:rgba(255,255,255,0.5);font-size:11px;line-height:1.8;">
      PRO1PUTT Tournament Registration &amp; Live Scoring<br/>
      Diese E-Mail wurde automatisch gesendet. Bitte nicht antworten.<br/>
      <a href="https://pro1putt.com" style="color:rgba(255,255,255,0.5);">pro1putt.com</a>
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
