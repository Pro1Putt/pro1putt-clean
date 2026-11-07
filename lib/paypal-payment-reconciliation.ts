import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { checkExpiredPayPalOrder } from "@/lib/paypal-expired-order-check";
import { sendPaidRegistrationConfirmation } from "@/lib/payment-confirmation-email";

export type PaymentReconciliationResult =
  | { status: "paid" }
  | { status: "not_completed"; paypalStatus: string }
  | { status: "review_required"; reason: string };

export async function reconcilePayPalPayment(
  registrationId: string
): Promise<PaymentReconciliationResult> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    return {
      status: "review_required",
      reason: "Nur Sandbox-Prüfungen erlaubt.",
    };
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
      "id,tournament_id,payment_status,payment_amount,payment_currency,paypal_order_id,paypal_capture_id"
    )
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    return {
      status: "review_required",
      reason: "Anmeldung nicht gefunden.",
    };
  }

  if (registration.payment_status === "paid") {
    try {
      await sendPaidRegistrationConfirmation(registration.id);
    } catch (mailError) {
      console.error("[reconciliation-email]", mailError);
    }

    return { status: "paid" };
  }

  if (
    registration.payment_status !== "pending" ||
    !registration.paypal_order_id ||
    registration.payment_currency !== "EUR" ||
    !Number.isFinite(Number(registration.payment_amount)) ||
    Number(registration.payment_amount) <= 0
  ) {
    return {
      status: "review_required",
      reason: "Anmeldung ist nicht für den Zahlungsabgleich geeignet.",
    };
  }

  const check = await checkExpiredPayPalOrder({
    registrationId: registration.id,
    orderId: registration.paypal_order_id,
    amount: Number(registration.payment_amount),
    currency: registration.payment_currency,
  });

  if (check.status === "review_required") {
    return check;
  }

  if (check.status === "not_completed") {
    return check;
  }

  const { data: confirmed, error: confirmError } = await db.rpc(
    "pro1putt_reconcile_verified_payment",
    {
      p_registration_id: registration.id,
      p_paypal_order_id: registration.paypal_order_id,
      p_paypal_capture_id: check.captureId,
    }
  );

  if (confirmError || confirmed !== true) {
    return {
      status: "review_required",
      reason: "Verifizierte Zahlung konnte nicht gespeichert werden.",
    };
  }

  try {
    await sendPaidRegistrationConfirmation(registration.id);
  } catch (mailError) {
    console.error("[reconciliation-email]", mailError);
  }

  return { status: "paid" };
}
