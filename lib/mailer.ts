import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY || "";
const mailFrom = process.env.MAIL_FROM || "";

if (!resendKey) throw new Error("Missing RESEND_API_KEY");
if (!mailFrom) throw new Error("Missing MAIL_FROM");

const resend = new Resend(resendKey);

type SendRegistrationMailArgs = {
  to: string;
  firstName: string;
  lastName: string;
  tournamentName: string;
  holes: number;
  playerPin: string;
};

export async function sendRegistrationMail(args: SendRegistrationMailArgs) {
  const { to, firstName, lastName, tournamentName, holes, playerPin } = args;

  const html = `
  <div style="font-family: Lato, Arial, sans-serif; background:#f5f7f5; padding:30px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; padding:24px; border:1px solid rgba(0,0,0,0.08);">

      <div style="text-align:center; margin-bottom:20px;">
        <img 
          src="https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png" 
          alt="PRO1PUTT"
          style="height:48px;"
        />
      </div>

      <h2 style="color:#1e4620; margin-top:0;">
        Registrierung bestätigt ✅
      </h2>

        <p>Hallo ${firstName} ${lastName},</p>

        <p>
          Deine Registrierung für das Turnier <strong>${tournamentName}</strong> wurde erfolgreich gespeichert.
        </p>

        <p>
          Gespielte Kategorie: <strong>${holes} Loch</strong>
        </p>

        <div style="margin:20px 0; padding:16px; background:#e9f5ec; border-radius:12px; border:1px solid rgba(30,70,32,0.25);">
          <div style="font-size:14px;">Deine Scoring PIN:</div>
          <div style="font-size:22px; font-weight:900; letter-spacing:2px; color:#1e4620;">
            ${playerPin}
          </div>
        </div>

        <p style="font-size:13px; opacity:0.7;">
          Diese PIN benötigst du am Turniertag für das digitale Scoring.
        </p>

        <p>Viel Erfolg!</p>

        <p style="margin-top:30px; font-weight:700; color:#1e4620;">
          PRO1PUTT Tournament Team
        </p>

      </div>
    </div>
  `;

  await resend.emails.send({
    from: mailFrom,
    to,
    subject: "PRO1PUTT Registrierung bestätigt",
    html,
  });
}