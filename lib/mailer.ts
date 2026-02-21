type SendRegistrationMailArgs = {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
};

async function sendViaResend(args: SendRegistrationMailArgs) {
  // ✅ Build-sicher: Wenn kein Provider konfiguriert ist, einfach "ok" zurückgeben.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: true, skipped: true, reason: "RESEND_API_KEY missing" as const };
  }

  // ✅ Dynamischer Import: verhindert Build-Fail, falls Resend in irgendeinem Kontext fehlt
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const subject = args.subject ?? "PRO1PUTT Registrierung";
  const from = process.env.MAIL_FROM ?? "PRO1PUTT <noreply@pro1putt.com>";

  const res = await resend.emails.send({
    from,
    to: args.to,
    subject,
    html: args.html ?? undefined,
    text: args.text ?? undefined,
  });

  return { ok: true, provider: "resend" as const, id: (res as any)?.data?.id ?? null };
}

/**
 * ✅ Neuer "Haupt"-Export (dein aktueller Name)
 */
export async function sendRegistrationMail(args: SendRegistrationMailArgs) {
  return sendViaResend(args);
}

/**
 * ✅ Alias für alte Imports im Code (damit Vercel-Build nicht mehr knallt)
 * Einige Routes importieren noch sendRegistrationEmail.
 */
export async function sendRegistrationEmail(args: SendRegistrationMailArgs) {
  return sendViaResend(args);
}