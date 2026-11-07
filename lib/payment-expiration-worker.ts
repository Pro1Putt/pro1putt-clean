import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { reconcilePayPalPayment } from "@/lib/paypal-payment-reconciliation";

export type ExpirationWorkerResult = {
  checked: number;
  paid: number;
  cancelled: number;
  reviewRequired: number;
  notCompleted: number;
  errors: number;
};

export async function processExpiredPayments(
  limit = 50
): Promise<ExpirationWorkerResult> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    throw new Error("Nur Sandbox-Verarbeitung erlaubt.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  const db = createClient(url, key, {
    auth: { persistSession: false },
  });

  const result: ExpirationWorkerResult = {
    checked: 0,
    paid: 0,
    cancelled: 0,
    reviewRequired: 0,
    notCompleted: 0,
    errors: 0,
  };

  const { data: registrations, error } = await db.rpc(
    "pro1putt_get_expired_payments",
    { p_limit: Math.min(Math.max(limit, 1), 100) }
  );

  if (error) {
    throw new Error("Abgelaufene Zahlungen konnten nicht geladen werden.");
  }

  for (const registration of registrations || []) {
    result.checked++;

    try {
      if (
        registration.payment_capture_locked ||
        registration.paypal_order_locked ||
        registration.paypal_recovery_required
      ) {
        result.reviewRequired++;
        continue;
      }

      if (!registration.paypal_order_id) {
        const { data: cancelled, error: cancelError } = await db.rpc(
          "pro1putt_cancel_expired_registration",
          { p_registration_id: registration.registration_id }
        );

        if (cancelError) {
          result.errors++;
        } else if (cancelled === true) {
          result.cancelled++;
        } else {
          result.reviewRequired++;
        }

        continue;
      }

      const payment = await reconcilePayPalPayment(
        registration.registration_id
      );

      if (payment.status === "paid") {
        result.paid++;
      } else if (payment.status === "not_completed") {
        // Eine offene PayPal-Bestellung kann möglicherweise
        // noch bezahlt werden. Deshalb niemals automatisch
        // den Startplatz freigeben.
        result.notCompleted++;
        result.reviewRequired++;

        console.warn(
          "[payment-expiration-worker] Offene PayPal-Bestellung:",
          registration.registration_id,
          payment.paypalStatus
        );
      } else {
        result.reviewRequired++;
      }
    } catch (error) {
      console.error(
        "[payment-expiration-worker]",
        registration.registration_id,
        error
      );

      result.errors++;
    }
  }

  return result;
}
