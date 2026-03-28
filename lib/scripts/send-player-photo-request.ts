import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const TOURNAMENT_ID = "7716349a-8bb0-46c6-b60c-3594eb7ea60f";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "PRO1PUTT <onboarding@resend.dev>";
const PHOTO_EMAIL = "info@pro1putt.com";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = requireEnv("RESEND_API_KEY");

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const resend = new Resend(resendApiKey);

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", TOURNAMENT_ID)
    .single();

  if (tournamentError) {
    throw new Error(`Tournament query failed: ${tournamentError.message}`);
  }

  const tournamentName = tournament?.name || "PRO1PUTT Tournament";

  const { data: registrations, error: regError } = await supabase
    .from("registrations")
    .select("id, player_name, email")
    .eq("tournament_id", TOURNAMENT_ID)
    .not("email", "is", null);

  if (regError) {
    throw new Error(`Registrations query failed: ${regError.message}`);
  }

  const uniqueMap = new Map<string, { playerName: string; email: string }>();

  for (const row of registrations || []) {
    const email = String(row.email || "").trim().toLowerCase();
    if (!email) continue;

    if (!uniqueMap.has(email)) {
      uniqueMap.set(email, {
        email,
        playerName: String(row.player_name || "").trim(),
      });
    }
  }

  const recipients = Array.from(uniqueMap.values());

  if (recipients.length === 0) {
    console.log("Keine Empfänger gefunden.");
    return;
  }

  console.log(`Gefundene Empfänger: ${recipients.length}`);

  for (const recipient of recipients) {
    const safeName = recipient.playerName
      ? escapeHtml(recipient.playerName)
      : "Player";

    const subject = `PRO1PUTT – Fotos für die Player Card / Photos for the Player Card – ${tournamentName}`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1f2937;">
        <p>Liebe Spielerinnen und Spieler, liebe Eltern,</p>

        <p>
          für unsere <strong>PRO1PUTT Player Cards</strong> zum Turnier
          <strong>${escapeHtml(tournamentName)}</strong>
          möchten wir gerne für jeden Teilnehmer eine individuelle Karte erstellen.
        </p>

        <p>
          Dafür benötigen wir bitte <strong>zwei hochauflösende Fotos</strong> von
          <strong>${safeName}</strong>:
        </p>

        <ul>
          <li>1 Portraitfoto (Gesicht gut erkennbar)</li>
          <li>1 Actionfoto vom Golf (z. B. beim Schwung oder auf dem Platz)</li>
        </ul>

        <p>Bitte achtet darauf, dass die Fotos:</p>
        <ul>
          <li>hochauflösend sind</li>
          <li>gut ausgeleuchtet sind</li>
          <li>möglichst ohne Filter aufgenommen wurden</li>
        </ul>

        <p>
          Bitte sendet die Fotos möglichst zeitnah an:
          <br />
          <strong>${PHOTO_EMAIL}</strong>
        </p>

        <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />

        <p>Dear Players and Parents,</p>

        <p>
          for our <strong>PRO1PUTT Player Cards</strong> for the tournament
          <strong>${escapeHtml(tournamentName)}</strong>,
          we would like to create an individual card for each participant.
        </p>

        <p>
          For this, we kindly ask you to send <strong>two high-resolution photos</strong> of
          <strong>${safeName}</strong>:
        </p>

        <ul>
          <li>1 portrait photo (face clearly visible)</li>
          <li>1 action photo playing golf (for example during a swing or on the course)</li>
        </ul>

        <p>Please make sure that the photos are:</p>
        <ul>
          <li>high resolution</li>
          <li>well lit</li>
          <li>preferably without filters</li>
        </ul>

        <p>
          Please send the photos as soon as possible to:
          <br />
          <strong>${PHOTO_EMAIL}</strong>
        </p>

        <p style="margin-top:24px;">
          Vielen Dank / Thank you very much<br />
          <strong>Team PRO1PUTT</strong>
        </p>
      </div>
    `;

    const text = `Liebe Spielerinnen und Spieler, liebe Eltern,

für unsere PRO1PUTT Player Cards zum Turnier ${tournamentName} möchten wir gerne für jeden Teilnehmer eine individuelle Karte erstellen.

Dafür benötigen wir bitte zwei hochauflösende Fotos von ${recipient.playerName || "dem Spieler / der Spielerin"}:
- 1 Portraitfoto (Gesicht gut erkennbar)
- 1 Actionfoto vom Golf (z. B. beim Schwung oder auf dem Platz)

Bitte achtet darauf, dass die Fotos:
- hochauflösend sind
- gut ausgeleuchtet sind
- möglichst ohne Filter aufgenommen wurden

Bitte sendet die Fotos möglichst zeitnah an:
${PHOTO_EMAIL}

---

Dear Players and Parents,

for our PRO1PUTT Player Cards for the tournament ${tournamentName}, we would like to create an individual card for each participant.

For this, we kindly ask you to send two high-resolution photos of ${recipient.playerName || "the player"}:
- 1 portrait photo (face clearly visible)
- 1 action photo playing golf (for example during a swing or on the course)

Please make sure that the photos are:
- high resolution
- well lit
- preferably without filters

Please send the photos as soon as possible to:
${PHOTO_EMAIL}

Thank you very much
Team PRO1PUTT`;

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipient.email,
        subject,
        html,
        text,
      });

      console.log(`OK: ${recipient.email}`, result.data?.id || "");
    } catch (error) {
      console.error(`FEHLER bei ${recipient.email}:`, error);
    }
  }

  console.log("Fertig.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});