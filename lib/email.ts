type SendMailArgs = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

/**
 * Sends an email via Resend API if configured.
 * If RESEND_API_KEY is missing, it will NO-OP (returns { ok: true, skipped: true }).
 */
export async function sendMailIfConfigured(args: SendMailArgs): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: true, skipped: true };

  const from =
    args.from ||
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "PRO1PUTT <info@pro1putt.com>";

  const payload = {
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  };

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const msg = await r.text().catch(() => "");
      return { ok: false, error: `Resend error ${r.status}: ${msg}` };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
