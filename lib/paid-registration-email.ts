import "server-only";

import { sendEmail } from "@/lib/mailer";

type Language = "de" | "en";

export type PaidRegistrationEmailArgs = {
  to: string;
  tournamentName: string;
  playerName: string;
  pin: string;
  pinUrl: string;
  leaderboardUrl: string;
  language: Language;
};

const SITE = "https://pro1putt.com";
const LOGO = `${SITE}/pro1putt-logo-white.png`;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imageForTournament(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes("bad saarow")) {
    return `${SITE}/tournament-images/bad-saarow-original.jpg`;
  }

  return `${SITE}/tournament-images/green-eagle-original.jpg`;
}

export async function sendPaidRegistrationEmail(
  args: PaidRegistrationEmailArgs
) {
  const de = args.language === "de";

  const player = escapeHtml(args.playerName);
  const tournament = escapeHtml(args.tournamentName);
  const pin = escapeHtml(args.pin);
  const pinUrl = escapeHtml(args.pinUrl);
  const leaderboardUrl = escapeHtml(args.leaderboardUrl);
  const hero = imageForTournament(args.tournamentName);

  const copy = de
    ? {
        subject: `PRO1PUTT | Zahlung bestätigt – ${args.tournamentName}`,
        eyebrow: "ZAHLUNG BESTÄTIGT",
        heading: `Du bist dabei, ${player}!`,
        intro: "Deine Teilnahmegebühr wurde erfolgreich bezahlt. Dein Startplatz ist gesichert!",
        tournamentLabel: "DEIN TURNIER",
        pinLabel: "DEIN PERSÖNLICHER SCORING-PIN",
        pinHelp: "Mit diesem PIN meldest du dich beim Live-Scoring an. Bitte bewahre ihn sicher auf.",
        stepsTitle: "SO FUNKTIONIERT DAS LIVE-SCORING",
        step1: "Öffne die PRO1PUTT Scoring App.",
        step2: "Melde dich mit deinem persönlichen PIN an.",
        step3: "Erfasse deine Scores während des Turniers.",
        step4: "Bestätige deine Scorekarte digital.",
        scoringButton: "ZUM LIVE-SCORING",
        leaderboardButton: "LIVE-LEADERBOARD ANSEHEN",
        footer: "Diese E-Mail wurde automatisch nach bestätigter Zahlung versendet.",
      }
    : {
        subject: `PRO1PUTT | Payment confirmed – ${args.tournamentName}`,
        eyebrow: "PAYMENT CONFIRMED",
        heading: `You're in, ${player}!`,
        intro: "Your entry fee has been successfully paid. Your tournament spot is confirmed!",
        tournamentLabel: "YOUR TOURNAMENT",
        pinLabel: "YOUR PERSONAL SCORING PIN",
        pinHelp: "Use this PIN to access live scoring. Please keep it safe.",
        stepsTitle: "HOW LIVE SCORING WORKS",
        step1: "Open the PRO1PUTT Scoring App.",
        step2: "Sign in using your personal PIN.",
        step3: "Enter your scores during the tournament.",
        step4: "Confirm your scorecard digitally.",
        scoringButton: "OPEN LIVE SCORING",
        leaderboardButton: "VIEW LIVE LEADERBOARD",
        footer: "This email was sent automatically after payment confirmation.",
      };

  const html = `<!doctype html>
<html lang="${args.language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#09140e;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09140e;">
    <tr>
      <td align="center" style="padding:30px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111e16;border-radius:18px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:26px;background:#0b1710;">
              <img src="${LOGO}" alt="PRO1PUTT" width="155" style="display:block;max-width:155px;height:auto;">
            </td>
          </tr>
          <tr>
            <td>
              <img src="${hero}" alt="Golf tournament" width="600" style="display:block;width:100%;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:34px 30px;color:#ffffff;">
              <p style="margin:0 0 12px;color:#c8f03c;font-size:12px;font-weight:bold;letter-spacing:2px;">
                ${copy.eyebrow}
              </p>
              <h1 style="margin:0 0 16px;font-size:30px;line-height:1.2;color:#ffffff;">
                ${copy.heading}
              </h1>
              <p style="font-size:16px;line-height:1.7;color:#c7d5ca;margin:0 0 28px;">
                ${copy.intro}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#172a1d;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="font-size:11px;letter-spacing:2px;color:#8fa797;margin:0 0 8px;">
                      ${copy.tournamentLabel}
                    </p>
                    <p style="font-size:19px;font-weight:bold;color:#ffffff;margin:0;">
                      ${tournament}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;background:#08110b;border:1px solid #36543b;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:26px 16px;">
                    <p style="font-size:12px;letter-spacing:1px;color:#b4c5b8;margin:0 0 15px;">
                      ${copy.pinLabel}
                    </p>
                    <p style="font-size:54px;font-weight:900;letter-spacing:9px;color:#c8f03c;margin:0 0 15px;">
                      ${pin}
                    </p>
                    <p style="font-size:13px;line-height:1.6;color:#a9baae;margin:0;">
                      ${copy.pinHelp}
                    </p>
                  </td>
                </tr>
              </table>

              <h2 style="font-size:15px;letter-spacing:1px;color:#ffffff;margin:32px 0 16px;">
                ${copy.stepsTitle}
              </h2>

              <p style="font-size:14px;line-height:2;color:#c7d5ca;">
                1. ${copy.step1}<br>
                2. ${copy.step2}<br>
                3. ${copy.step3}<br>
                4. ${copy.step4}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td align="center" bgcolor="#c8f03c" style="border-radius:9px;">
                    <a href="${pinUrl}" style="display:block;padding:17px;color:#102015;font-size:14px;font-weight:bold;text-decoration:none;">
                      ${copy.scoringButton}
                    </a>
                  </td>
                </tr>
                <tr><td height="12"></td></tr>
                <tr>
                  <td align="center" bgcolor="#1c3e29" style="border-radius:9px;">
                    <a href="${leaderboardUrl}" style="display:block;padding:17px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">
                      ${copy.leaderboardButton}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px;background:#0b1710;color:#809487;font-size:11px;line-height:1.7;">
              PRO1PUTT · Tournament Registration &amp; Live Scoring<br>
              ${copy.footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    copy.eyebrow,
    "",
    de ? `Hallo ${args.playerName}!` : `Hello ${args.playerName}!`,
    copy.intro,
    `${copy.tournamentLabel}: ${args.tournamentName}`,
    `${copy.pinLabel}: ${args.pin}`,
    `${copy.scoringButton}: ${args.pinUrl}`,
    `${copy.leaderboardButton}: ${args.leaderboardUrl}`,
  ].join("\n");

  return sendEmail({
    to: args.to,
    subject: copy.subject,
    html,
    text,
  });
}
