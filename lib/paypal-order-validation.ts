import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { getPayPalSandboxOrder } from "./paypal-order-details";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function validatePayPalSandboxOrder(
  orderId: string,
  registrationId: string,
  expectedAmount: string
): Promise<boolean> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    throw new Error("Nur PayPal Sandbox ist erlaubt.");
  }

  if (
    !UUID_PATTERN.test(registrationId) ||
    !/^\d+\.\d{2}$/.test(expectedAmount) ||
    Number(expectedAmount) <= 0
  ) {
    throw new Error("Ungültige Prüfparameter.");
  }

  const order = await getPayPalSandboxOrder(orderId);

  if (order.purchase_units?.length !== 1) {
    return false;
  }

  const unit = order.purchase_units[0];

  return (
    order.id === orderId &&
    unit.reference_id === registrationId &&
    unit.custom_id === registrationId &&
    unit.amount?.currency_code === "EUR" &&
    unit.amount?.value === expectedAmount &&
    ["CREATED", "SAVED", "APPROVED"].includes(order.status)
  );
}
