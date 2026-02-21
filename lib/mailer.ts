import { Resend } from "resend";

export type RegistrationEmailArgs = {
  to: string;
  tournamentName: string;
  playerName: string;
  divisionName?: string | null;
  teeTime?: string | null;
  leaderboardUrl?: string | null;
};

export type GenericEmailArgs = {
  to: string;
  subject: string;
  html?: string | null;
  text?: string | null;
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

function buildRegistrationHtml(a: RegistrationEmailArgs) {
  const tournament = norm(a.tournamentName);
  const player = norm(a.playerName);
  const division = a.divisionName ?? "";
  const teeTime = a.teeTime ?? "";
  const leaderboardUrl = a.leaderboardUrl ?? "#";

  // Dummy PIN – falls du PIN später wieder reinreichen willst, ersetzen wir das
  const pin = "2553";

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f3f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <div style="max-width:720px;margin:40px auto;background:#ffffff;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,0.08);overflow:hidden;">

    <!-- HEADER -->
    <div style="padding:28px 32px;border-bottom:1px solid #e8ecea;">
      <h2 style="margin:0;color:#0f5132;font-size:22px;font-weight:700;">
        PRO1PUTT Registrierung bestätigt
      </h2>
      <div style="color:#6c757d;font-size:14px;margin-top:4px;">
        Live Scoring • PRO1PUTT
      </div>
    </div>

    <!-- BODY -->
    <div style="padding:32px;">

      <h3 style="margin-top:0;font-size:20px;">
        Hallo ${player},
      </h3>

      <p style="color:#444;margin-bottom:24px;">
        deine Registrierung ist eingegangen. Unten findest du deinen persönlichen PIN für Check-in & Scoring.
      </p>

      <!-- PIN CARD -->
      <div style="display:flex;justify-content:space-between;align-items:center;
                  background:#f8faf9;border:1px solid #e2e8e6;
                  border-radius:16px;padding:24px;margin-bottom:30px;">

        <div>
          <div style="font-size:14px;color:#6c757d;">Turnier</div>
          <div style="font-weight:600;font-size:16px;margin-top:4px;">
            ${tournament}
          </div>
          ${division ? `<div style="margin-top:6px;font-size:14px;color:#555;">Kategorie: ${division}</div>` : ""}
          ${teeTime ? `<div style="margin-top:4px;font-size:14px;color:#555;">Tee Time: ${teeTime}</div>` : ""}
        </div>

        <div style="text-align:right;">
          <div style="font-size:14px;color:#6c757d;">Dein persönlicher PIN</div>
          <div style="font-size:40px;font-weight:800;color:#0f5132;letter-spacing:2px;margin-top:6px;">
            ${pin}
          </div>
          <div style="font-size:12px;color:#888;margin-top:6px;">
            Bitte nicht weitergeben.
          </div>
        </div>

      </div>

      <!-- BUTTONS -->
      <div style="display:flex;gap:14px;flex-wrap:wrap;">

        <a href="${leaderboardUrl}"
           style="background:#0f5132;color:white;
                  padding:14px 22px;border-radius:30px;
                  text-decoration:none;font-weight:600;
                  display:inline-block;">
          Check-in / Scoring öffnen →
        </a>

        <a href="${leaderboardUrl}"
           style="background:#e8f3ee;color:#0f5132;
                  padding:14px 22px;border-radius:30px;
                  text-decoration:none;font-weight:600;
                  display:inline-block;">
          Leaderboard ansehen →
        </a>

      </div>

      <p style="font-size:12px;color:#888;margin-top:30px;">
        PRO1PUTT • Diese E-Mail wurde automatisch gesendet.
      </p>

    </div>
  </div>

</body>
</html>
`;
}

export async function sendEmail(args: GenericEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "PRO1PUTT <noreply@pro1putt.com>";

  const to = String(args.to ?? "").trim();
  const subject = String(args.subject ?? "").trim();
  const html = args.html ? String(args.html) : "";
  const text = args.text ? String(args.text) : "";

  if (!apiKey) {
    console.warn("[mailer] RESEND_API_KEY missing -> skipping email send", { to, subject });
    return { ok: false, skipped: true as const };
  }

  const resend = new Resend(apiKey);

  // WICHTIG: payload ohne optional-undefined Felder bauen (TS + Resend Union Types)
  const payload: any = { from, to, subject };
  if (html) payload.html = html;
  if (text) payload.text = text;

  const res = await resend.emails.send(payload);
  return { ok: true as const, res };
}

export async function sendRegistrationEmail(args: RegistrationEmailArgs) {
  const subject = `PRO1PUTT: Registrierung bestätigt – ${norm(args.tournamentName)}`;

  const html = buildRegistrationHtml(args);
  const text =
    `PRO1PUTT Registrierung bestätigt\n\n` +
    `Turnier: ${norm(args.tournamentName)}\n` +
    `Spieler: ${norm(args.playerName)}\n` +
    (args.divisionName ? `Division: ${norm(args.divisionName)}\n` : "") +
    (args.teeTime ? `Tee Time: ${norm(args.teeTime)}\n` : "") +
    (args.leaderboardUrl ? `Leaderboard: ${norm(args.leaderboardUrl)}\n` : "");

  return sendEmail({ to: args.to, subject, html, text });
}