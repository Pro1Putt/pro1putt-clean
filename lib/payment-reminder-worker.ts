import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createPaymentResumeToken } from "@/lib/payment-resume-token";
import { buildPaymentReminderEmail } from "@/lib/payment-reminder-email";
import { sendEmail } from "@/lib/mailer";

type Reminder = {
  registration_id: string;
  reminder_type: "24h" | "48h";
  payment_due_at: string;
};

export async function processPaymentReminders(
  limit = 50,
  dryRun = true
) {
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

  const { data, error } = await db.rpc(
    "pro1putt_get_payment_reminders",
    { p_limit: Math.min(Math.max(limit, 1), 100) }
  );

  if (error) throw error;

  const reminders = (data ?? []) as Reminder[];

  if (dryRun) {
    return {
      mode: "preview",
      checked: reminders.length,
      processed: 0,
      reminders,
    };
  }

  if (process.env.PRO1PUTT_REMINDER_EMAILS_ENABLED !== "true") {
    throw new Error("Automatischer E-Mail-Versand ist deaktiviert.");
  }

  const results = [];

  for (const reminder of reminders) {
    const lockId = randomUUID();

    const { data: reserved, error: reserveError } = await db.rpc(
      "pro1putt_reserve_payment_reminder",
      {
        p_registration_id: reminder.registration_id,
        p_reminder_type: reminder.reminder_type,
        p_lock_id: lockId,
      }
    );

    if (reserveError || reserved !== true) {
      results.push({
        registration_id: reminder.registration_id,
        status: "skipped",
      });
      continue;
    }

    let sent = false;

    try {
      const { data: registration, error: registrationError } = await db
        .from("registrations")
        .select(
          "id,first_name,last_name,email,payment_status,payment_due_at,tournaments(name)"
        )
        .eq("id", reminder.registration_id)
        .single();

      if (registrationError || !registration) {
        throw new Error("Anmeldung nicht gefunden.");
      }

      if (
        registration.payment_status !== "pending" ||
        !registration.payment_due_at ||
        new Date(registration.payment_due_at).getTime() <= Date.now()
      ) {
        throw new Error("Anmeldung nicht mehr zahlungsberechtigt.");
      }

      const email = registration.email;

      const playerName = [
        registration.first_name,
        registration.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const tournamentData = registration.tournaments as
        | { name?: string }
        | { name?: string }[]
        | null;

      const tournamentName = Array.isArray(tournamentData)
        ? tournamentData[0]?.name
        : tournamentData?.name;

      if (
        typeof email !== "string" ||
        !email.includes("@") ||
        !playerName ||
        !tournamentName
      ) {
        throw new Error("Erforderliche Anmeldedaten fehlen.");
      }

      const resumeToken = await createPaymentResumeToken(
        reminder.registration_id
      );

      const origin =
        process.env.PRO1PUTT_SITE_URL || "http://localhost:3000";

      const paymentUrl = new URL("/payment/resume", origin);
      paymentUrl.hash = `token=${resumeToken}`;

      const message = buildPaymentReminderEmail({
        playerName,
        tournamentName,
        paymentDueAt: reminder.payment_due_at,
        reminderType: reminder.reminder_type,
        paymentUrl: paymentUrl.toString(),
      });

      const { data: current, error: currentError } = await db
        .from("registrations")
        .select("payment_status,payment_due_at,payment_cancelled_at")
        .eq("id", reminder.registration_id)
        .single();

      if (
        currentError ||
        !current ||
        current.payment_status !== "pending" ||
        current.payment_cancelled_at !== null ||
        !current.payment_due_at ||
        new Date(current.payment_due_at).getTime() <= Date.now()
      ) {
        throw new Error(
          "Anmeldung wurde bezahlt, storniert oder Zahlungsfrist abgelaufen."
        );
      }

      const result = await sendEmail({
        to: email,
        ...message,
      });

      if (!result.ok) {
        throw new Error("E-Mail-Versand nicht bestätigt.");
      }

      sent = true;

      results.push({
        registration_id: reminder.registration_id,
        status: "sent",
      });
    } catch (error) {
      console.error("[payment-reminder-worker]", error);

      results.push({
        registration_id: reminder.registration_id,
        status: "failed",
      });
    } finally {
      const { data: completed, error: completeError } = await db.rpc(
        "pro1putt_complete_payment_reminder",
        {
          p_registration_id: reminder.registration_id,
          p_reminder_type: reminder.reminder_type,
          p_lock_id: lockId,
          p_sent: sent,
        }
      );

      if (completeError || completed !== true) {
        console.error(
          "[payment-reminder-worker] Reminder-Abschluss fehlgeschlagen",
          reminder.registration_id,
          completeError
        );
      }
    }
  }

  return {
    mode: "send",
    checked: reminders.length,
    processed: results.length,
    results,
  };
}
