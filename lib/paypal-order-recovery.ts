import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { validatePayPalSandboxOrder } from "./paypal-order-validation";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function recoverKnownPayPalSandboxOrder(
  registrationId: string,
  lockId: string,
  orderId: string
): Promise<boolean> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    throw new Error("Nur PayPal Sandbox ist erlaubt.");
  }

  if (
    !UUID_PATTERN.test(registrationId) ||
    !UUID_PATTERN.test(lockId) ||
    !/^[A-Za-z0-9]{5,64}$/.test(orderId)
  ) {
    throw new Error("Ungültige Wiederherstellungsdaten.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const { data: registration, error: lookupError } = await supabase
    .from("registrations")
    .select(
      "id, payment_amount, payment_currency, payment_status, payment_due_at, paypal_order_lock_id, paypal_order_id, paypal_order_recovery_required"
    )
    .eq("id", registrationId)
    .single();

  if (lookupError || !registration) {
    throw new Error("Registrierung nicht gefunden.");
  }

  if (
    registration.paypal_order_lock_id !== lockId ||
    registration.paypal_order_id !== null ||
    registration.paypal_order_recovery_required !== true ||
    registration.payment_status !== "pending" ||
    registration.payment_currency !== "EUR" ||
    !registration.payment_due_at ||
    new Date(registration.payment_due_at).getTime() <= Date.now()
  ) {
    throw new Error("Registrierung kann nicht wiederhergestellt werden.");
  }

  const amount = Number(registration.payment_amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Ungültiger Teilnahmebetrag.");
  }

  const valid = await validatePayPalSandboxOrder(
    orderId,
    registrationId,
    amount.toFixed(2)
  );

  if (!valid) {
    throw new Error("PayPal-Bestellung stimmt nicht mit der Registrierung überein.");
  }

  const { data: recovered, error: recoveryError } = await supabase.rpc(
    "pro1putt_recover_paypal_order",
    {
      p_registration_id: registrationId,
      p_lock_id: lockId,
      p_paypal_order_id: orderId,
    }
  );

  if (recoveryError || recovered !== true) {
    throw new Error("PayPal-Bestellung konnte nicht wiederhergestellt werden.");
  }

  return true;
}
