type SendRegistrationMailArgs = {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
};

export async function sendRegistrationMail(args: SendRegistrationMailArgs) {
  // Build-sicher: Wenn kein Provider konfiguriert ist, einfach ok zurückgeben.
  // Kein UI/Design betroffen.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: true, skipped: true, reason: "RESEND_API_KEY missing" };
  }

  // Dynamischer Import: verhindert Build-Probleme, falls "resend" nicht installiert ist.
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

  return { ok: true, provider: "resend", id: (res as any)?.data?.id ?? null };
}