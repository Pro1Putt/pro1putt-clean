import { Resend } from "resend";

type SendArgs = {
  to: string[];
  subject: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: Uint8Array;
    contentType: string;
  }>;
};

export async function sendMailIfConfigured(args: SendArgs) {
  const key = process.env.RESEND_API_KEY || "";
  const from = process.env.MAIL_FROM || "no-reply@pro1putt.com";

  if (!key) {
    return { ok: false, skipped: true, reason: "RESEND_API_KEY missing" as const };
  }

  const resend = new Resend(key);

  const attachments =
    args.attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content),
      content_type: a.contentType,
    })) || [];

  const r = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    text: args.text,
    attachments: attachments.length ? attachments : undefined,
  });

  // Resend gibt teils {data,error}
  // @ts-ignore
  if (r?.error) return { ok: false, skipped: false, reason: String(r.error?.message || r.error) as const };
  return { ok: true, skipped: false };
}