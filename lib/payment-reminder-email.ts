import "server-only";

type PaymentReminderType = "24h" | "48h";

type PaymentReminderEmailInput = {
  playerName: string;
  tournamentName: string;
  paymentDueAt: string;
  reminderType: PaymentReminderType;
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

export function buildPaymentReminderEmail(
  input: PaymentReminderEmailInput
) {
  const isSecondReminder = input.reminderType === "48h";

  const subject = isSecondReminder
    ? `Letzte Zahlungserinnerung – ${input.tournamentName}`
    : `Zahlungserinnerung – ${input.tournamentName}`;

  const deadline = new Date(input.paymentDueAt);

  if (Number.isNaN(deadline.getTime())) {
    throw new Error("Ungültige Zahlungsfrist.");
  }

  const formattedDeadline = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(deadline);

  const message = isSecondReminder
    ? "Deine Anmeldung ist weiterhin nicht bezahlt. Bitte schließe die Zahlung innerhalb der verbleibenden Frist ab."
    : "Für deine Turnieranmeldung ist bisher noch keine abgeschlossene Zahlung hinterlegt.";

  const safeName = escapeHtml(input.playerName);
  const safeTournament = escapeHtml(input.tournamentName);
  const safeDeadline = escapeHtml(formattedDeadline);

  const paymentUrl = new URL(input.paymentUrl);

  if (paymentUrl.protocol !== "https:" &&
      !(paymentUrl.hostname === "localhost" &&
        paymentUrl.protocol === "http:")) {
    throw new Error("Ungültiger Zahlungslink.");
  }

  const safePaymentUrl = escapeHtml(paymentUrl.toString());

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0E2A1F;">
      <h1 style="color:#00C46A;">PRO1PUTT</h1>
      <h2>${isSecondReminder ? "Letzte Zahlungserinnerung" : "Zahlungserinnerung"}</h2>
      <p>Hallo ${safeName},</p>
      <p>${message}</p>
      <p><strong>Turnier:</strong> ${safeTournament}</p>
      <p><strong>Zahlungsfrist:</strong> ${safeDeadline}</p>
      <p>
        <a href="${safePaymentUrl}"
           style="display:inline-block;background:#00C46A;color:#0E2A1F;padding:14px 22px;text-decoration:none;border-radius:6px;font-weight:bold;">
          Zahlung abschließen
        </a>
      </p>
      <p>Wenn deine Zahlung nicht rechtzeitig eingeht, kann deine Anmeldung storniert und dein Startplatz wieder freigegeben werden.</p>
      <p>Falls du bereits bezahlt hast, wird die Zahlung möglicherweise noch verarbeitet.</p>
      <p>Sportliche Grüße<br>Dein PRO1PUTT Team</p>
    </div>
  `;

  const text = [
    `Hallo ${input.playerName},`,
    "",
    message,
    "",
    `Turnier: ${input.tournamentName}`,
    `Zahlungsfrist: ${formattedDeadline}`,
    "",
    `Zahlung abschließen: ${paymentUrl.toString()}`,
    "",
    "Wenn deine Zahlung nicht rechtzeitig eingeht, kann deine Anmeldung storniert und dein Startplatz wieder freigegeben werden.",
    "",
    "Sportliche Grüße",
    "Dein PRO1PUTT Team",
  ].join("\n");

  return { subject, html, text };
}
