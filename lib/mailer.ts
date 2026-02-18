import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY || "";
const mailFrom = process.env.MAIL_FROM || "";

if (!resendKey) throw new Error("Missing RESEND_API_KEY");
if (!mailFrom) throw new Error("Missing MAIL_FROM");

const resend = new Resend(resendKey);

export type SendRegistrationMailArgs = {
  to: string;
  firstName: string;
  lastName: string;
  tournamentName: string;
  holes: number;
  playerPin: string;
};

  scoringUrl: string; // Button 1 + Fallback-Link
  leaderboardUrl: string; // Button 2
};

export async function sendRegistrationMail(args: SendRegistrationMailArgs) {
  const {
    to,
    firstName,
    lastName,
    tournamentName,
    tournamentStartDate,
    categoryLabel,
    playerPin,
    scoringUrl,
    leaderboardUrl,
  } = args;

  const GREEN = "#1e4620";
  const BG = "#f5f7f5";

  const safe = (v: any) => String(v ?? "");
  const startLine = tournamentStartDate ? `Start: ${tournamentStartDate}` : "";

  const html = `
  <div style="margin:0;padding:0;background:${BG};font-family:Lato,Arial,sans-serif;">
    <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
      <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:22px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="padding:18px 22px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(0,0,0,0.06);">
          <img src="https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png"
               alt="PRO1PUTT" style="height:38px;width:auto;display:block;" />
          <div style="flex:1;">
            <div style="font-weight:900;color:${GREEN};font-size:18px;line-height:1.1;">PRO1PUTT Registrierung bestätigt</div>
            <div style="opacity:.7;font-size:13px;margin-top:3px;">Live Scoring • PRO1PUTT</div>
          </div>
          <div style="padding:8px 12px;border-radius:999px;background:rgba(30,70,32,0.10);border:1px solid rgba(30,70,32,0.20);color:${GREEN};font-weight:900;font-size:12px;white-space:nowrap;">
            PRO1PUTT Turnier
          </div>
        </div>

        <!-- Body -->
        <div style="padding:22px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="font-size:22px;font-weight:1000;color:#0f172a;">Hallo ${safe(firstName)} ${safe(lastName)},</div>
          </div>

          <div style="font-size:14px;opacity:.85;line-height:1.5;margin-bottom:18px;">
            deine Registrierung ist eingegangen. Unten findest du deinen persönlichen PIN für Check-in & Scoring.
          </div>

          <!-- PIN / Tournament card -->
          <div style="display:flex;gap:14px;flex-wrap:wrap;background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:18px;padding:16px;">
            
            <div style="flex:1;min-width:240px;">
              <div style="font-size:12px;opacity:.7;font-weight:900;margin-bottom:6px;">Turnier</div>
              <div style="font-size:15px;font-weight:1000;color:#0f172a;line-height:1.2;margin-bottom:6px;">
                ${safe(tournamentName)}
              </div>
              <div style="font-size:13px;opacity:.75;line-height:1.4;">
                ${startLine ? `${safe(startLine)}<br/>` : ``}
                Kategorie: ${safe(categoryLabel)}
              </div>
            </div>

            <div style="min-width:240px;flex:0 0 auto;text-align:right;">
              <div style="font-size:12px;opacity:.7;font-weight:900;margin-bottom:6px;">Dein persönlicher PIN</div>
              <div style="font-size:46px;font-weight:1100;letter-spacing:2px;color:#0f172a;line-height:1;">
                ${safe(playerPin)}
              </div>
              <div style="font-size:12px;opacity:.65;margin-top:8px;max-width:260px;display:inline-block;">
                Bitte nicht weitergeben. Dieser PIN ist für Check-in und Score-Eingabe.
              </div>
            </div>

          </div>

          <!-- Buttons -->
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;">
            <a href="${safe(scoringUrl)}"
               style="display:inline-block;padding:12px 16px;border-radius:999px;background:${GREEN};color:#ffffff;text-decoration:none;font-weight:1000;font-size:14px;">
              Check-in / Scoring öffnen →
            </a>

            <a href="${safe(leaderboardUrl)}"
               style="display:inline-block;padding:12px 16px;border-radius:999px;background:rgba(30,70,32,0.10);border:1px solid rgba(30,70,32,0.25);color:${GREEN};text-decoration:none;font-weight:1000;font-size:14px;">
              Leaderboard ansehen →
            </a>
          </div>

          <!-- Fallback -->
          <div style="margin-top:14px;font-size:12px;opacity:.75;line-height:1.5;">
            Falls die Buttons nicht funktionieren, kopiere diesen Link in deinen Browser:<br/>
            <a href="${safe(scoringUrl)}" style="color:${GREEN};text-decoration:underline;word-break:break-all;">
              ${safe(scoringUrl)}
            </a>
          </div>

          <!-- Footer -->
          <div style="margin-top:22px;padding-top:14px;border-top:1px solid rgba(0,0,0,0.06);font-size:12px;opacity:.65;line-height:1.4;">
            PRO1PUTT • Diese E-Mail wurde automatisch gesendet. Wenn du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  await resend.emails.send({
    from: mailFrom,
    to,
    subject: "PRO1PUTT Registrierung bestätigt – dein PIN",
    html,
  });
}