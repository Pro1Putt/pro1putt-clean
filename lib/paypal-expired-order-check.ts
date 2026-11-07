import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { getPayPalSandboxOrder } from "@/lib/paypal-order-details";

export type ExpiredOrderCheck =
  | {
      status: "paid";
      captureId: string;
    }
  | {
      status: "not_completed";
      paypalStatus: string;
    }
  | {
      status: "review_required";
      reason: string;
    };

export async function checkExpiredPayPalOrder(args: {
  registrationId: string;
  orderId: string;
  amount: number;
  currency: string;
}): Promise<ExpiredOrderCheck> {
  if (
    process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live" ||
    args.currency !== "EUR" ||
    !Number.isFinite(args.amount) ||
    args.amount <= 0
  ) {
    return {
      status: "review_required",
      reason: "Ungültige Zahlungsdaten oder PayPal-Umgebung.",
    };
  }

  try {
    const order = await getPayPalSandboxOrder(args.orderId);
    const unit = order.purchase_units?.[0];
    const expectedAmount = args.amount.toFixed(2);

    if (
      order.id !== args.orderId ||
      order.purchase_units?.length !== 1 ||
      unit?.reference_id !== args.registrationId ||
      unit?.custom_id !== args.registrationId ||
      unit?.amount?.currency_code !== "EUR" ||
      unit?.amount?.value !== expectedAmount
    ) {
      return {
        status: "review_required",
        reason: "PayPal-Auftrag stimmt nicht mit Anmeldung überein.",
      };
    }

    const captures = unit.payments?.captures || [];

    if (order.status === "COMPLETED") {
      if (captures.length !== 1) {
        return {
          status: "review_required",
          reason: "Abgeschlossene Zahlung ohne eindeutigen Capture.",
        };
      }

      const capture = captures[0];

      if (
        capture.status !== "COMPLETED" ||
        capture.amount?.currency_code !== "EUR" ||
        capture.amount?.value !== expectedAmount ||
        !capture.id
      ) {
        return {
          status: "review_required",
          reason: "Capture-Daten stimmen nicht überein.",
        };
      }

      return {
        status: "paid",
        captureId: capture.id,
      };
    }

    if (captures.length > 0) {
      return {
        status: "review_required",
        reason: "PayPal meldet einen Capture mit ungeklärtem Status.",
      };
    }

    if (
      order.status === "CREATED" ||
      order.status === "PAYER_ACTION_REQUIRED" ||
      order.status === "APPROVED"
    ) {
      return {
        status: "not_completed",
        paypalStatus: order.status,
      };
    }

    return {
      status: "review_required",
      reason: `Unbekannter PayPal-Status: ${order.status}`,
    };
  } catch (error) {
    console.error("[paypal-expired-order-check]", error);

    return {
      status: "review_required",
      reason: "PayPal-Auftrag konnte nicht zuverlässig geprüft werden.",
    };
  }
}
