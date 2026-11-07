import "server-only";

type PaymentRegistrationEmailInput = {
  playerName: string;
  tournamentName: string;
  paymentDueAt: string;
  paymentUrl: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character];
  });
}

export function buildPaymentRegistrationEmail(
  input: PaymentRegistrationEmailInput
) {
  const deadline = new Date(input.paymentDueAt);

  if (Number.isNaN(deadline.getTime())) {
    throw new Error("Ungültige Zahlungsfrist.");
  }

  const paymentUrl = new URL(input.paymentUrl);

  if (
    paymentUrl.protocol !== "https:" &&
    !(
      paymentUrl.hostname === "localhost" &&
      paymentUrl.protocol === "http:"
    )
  ) {
    throw new Error("Ungültiger Zahlungslink.");
  }

  const formattedDeadline = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(deadline);

  const safeName = escapeHtml(input.playerName);
  const safeTournament = escapeHtml(input.tournamentName);
  const safeDeadline = escapeHtml(formattedDeadline);
  const safePaymentUrl = escapeHtml(paymentUrl.toString());

  const subject = `Deine Anmeldung ist eingegangen – ${input.tournamentName}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0E2A1F;">
      <div style="background:#0E2A1F;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:#00C46A;margin:0;">PRO1PUTT</h1>
        <p style="color:#ffffff;margin:8px 0 0;">JUNIOR GOLF</p>
      </div>

      <div style="padding:28px;border:1px solid #e0e8e0;border-radius:0 0 12px 12px;">
        <h2>Deine Anmeldung ist eingegangen!</h2>

        <p>Hallo ${safeName},</p>

        <p>
          vielen Dank für deine Anmeldung zum
          <strong>${safeTournament}</strong>.
        </p>

        <p>
          Wir haben deine Anmeldung erhalten.
          Damit dein Startplatz verbindlich bestätigt werden kann,
          muss die Teilnahmegebühr innerhalb von 72 Stunden
          nach der Anmeldung bezahlt werden.
        </p>

        <div style="background:#f0f6f1;padding:18px;border-radius:8px;margin:24px 0;">
          <p style="margin:0 0 8px;">
            <strong>Turnier:</strong> ${safeTournament}
          </p>
          <p style="margin:0;">
            <strong>Zahlungsfrist:</strong> ${safeDeadline}
          </p>
        </div>

        <p style="text-align:center;margin:30px 0;">
          <a href="${safePaymentUrl}"
             style="display:inline-block;background:#00C46A;color:#0E2A1F;padding:16px 28px;text-decoration:none;border-radius:8px;font-weight:bold;">
            Jetzt Teilnahmegebühr bezahlen
          </a>
        </p>

        <p>
          Nach erfolgreicher Zahlung erhältst du automatisch
          eine weitere E-Mail mit deiner Zahlungsbestätigung.
        </p>

        <p>
          Sollte die Zahlung nicht innerhalb der Frist eingehen,
          wird die Anmeldung storniert und der Startplatz
          wieder freigegeben.
        </p>

        <p>
          Falls du bereits bezahlt hast, musst du nichts weiter tun.
          Die Zahlungsbestätigung wird gegebenenfalls noch verarbeitet.
        </p>

        <p style="margin-top:28px;">
          Sportliche Grüße<br>
          Dein PRO1PUTT Team
        </p>
      </div>
    </div>
  `;

  const text = [
    `Hallo ${input.playerName},`,
    "",
    `vielen Dank für deine Anmeldung zum ${input.tournamentName}.`,
    "",
    "Deine Anmeldung ist eingegangen.",
    "Bitte bezahle die Teilnahmegebühr innerhalb von 72 Stunden.",
    "",
    `Zahlungsfrist: ${formattedDeadline}`,
    "",
    `Jetzt bezahlen: ${paymentUrl.toString()}`,
    "",
    "Dein Startplatz wird erst nach erfolgreicher Zahlung verbindlich bestätigt.",
    "Bei nicht rechtzeitiger Zahlung wird die Anmeldung storniert und der Startplatz wieder freigegeben.",
    "",
    "Sportliche Grüße",
    "Dein PRO1PUTT Team",
  ].join("\n");

  return { subject, html, text };
}
