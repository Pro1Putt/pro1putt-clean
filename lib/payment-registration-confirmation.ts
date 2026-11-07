import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createPaymentResumeToken } from "@/lib/payment-resume-token";
import { buildPaymentRegistrationEmail } from "@/lib/payment-registration-email";
import { sendEmail } from "@/lib/mailer";

export async function sendPaymentRegistrationConfirmation(
  registrationId: string
): Promise<boolean> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    throw new Error("Nur in der PayPal-Sandbox erlaubt.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  const db = createClient(url, key, {
    auth: { persistSession: false },
  });

  const { data: registration, error } = await db
    .from("registrations")
    .select(
      "id,tournament_id,first_name,last_name,email,payment_status,payment_due_at,payment_cancelled_at"
    )
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    throw new Error("Anmeldung nicht gefunden.");
  }

  if (
    registration.payment_status !== "pending" ||
    registration.payment_cancelled_at !== null ||
    !registration.payment_due_at ||
    new Date(registration.payment_due_at).getTime() <= Date.now()
  ) {
    return false;
  }

  if (!registration.email) {
    throw new Error("E-Mail-Adresse fehlt.");
  }

  const { data: tournament, error: tournamentError } = await db
    .from("tournaments")
    .select("name,start_date")
    .eq("id", registration.tournament_id)
    .single();

  if (tournamentError || !tournament) {
    throw new Error("Turnier nicht gefunden.");
  }

  if (!tournament.start_date || tournament.start_date < "2027-01-01") {
    return false;
  }

  const resumeToken = await createPaymentResumeToken(registrationId);

  const origin =
    process.env.PRO1PUTT_SITE_URL || "http://localhost:3000";

  const paymentUrl = new URL("/payment/resume", origin);
  paymentUrl.hash = `token=${resumeToken}`;

  const message = buildPaymentRegistrationEmail({
    playerName:
      [registration.first_name, registration.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Player",
    tournamentName: tournament.name,
    paymentDueAt: registration.payment_due_at,
    paymentUrl: paymentUrl.toString(),
  });

  const result = await sendEmail({
    to: registration.email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  return result.ok === true;
}
