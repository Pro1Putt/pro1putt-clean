import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";
import { getPayPalAccessToken } from "./paypal";

const PAYPAL_API = getPayPalApiBaseUrl();

export type PayPalOrder = {
  id: string;
  status: string;
  links?: Array<{
    href: string;
    rel: string;
  }>;
};

export class PayPalOrderError extends Error {
  constructor(
    message: string,
    public readonly outcome: "rejected" | "unknown",
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = "PayPalOrderError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createPayPalSandboxOrder(
  registrationId: string,
  amount: string,
  currency: string,
  paypalRequestId: string
): Promise<PayPalOrder> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    throw new PayPalOrderError(
      "Nur PayPal Sandbox ist erlaubt.",
      "rejected"
    );
  }

  if (
    !UUID_PATTERN.test(registrationId) ||
    !UUID_PATTERN.test(paypalRequestId)
  ) {
    throw new PayPalOrderError(
      "Ungültige PayPal-Bestelldaten.",
      "rejected"
    );
  }

  if (
    !/^\d+\.\d{2}$/.test(amount) ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0 ||
    currency !== "EUR"
  ) {
    throw new PayPalOrderError(
      "Ungültiger Zahlungsbetrag.",
      "rejected"
    );
  }

  let token: string;

  try {
    token = await getPayPalAccessToken();
  } catch {
    throw new PayPalOrderError(
      "PayPal-Authentifizierung fehlgeschlagen.",
      "rejected"
    );
  }

  let response: Response;

  try {
    response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": paypalRequestId,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        payment_source: {
          paypal: {
            experience_context: {
              user_action: "PAY_NOW",
              return_url: `${process.env.PRO1PUTT_SITE_URL || "http://localhost:3000"}/payment/return`,
              cancel_url: `${process.env.PRO1PUTT_SITE_URL || "http://localhost:3000"}/payment/cancel`,
            },
          },
        },
        purchase_units: [
          {
            reference_id: registrationId,
            custom_id: registrationId,
            amount: {
              currency_code: currency,
              value: amount,
            },
          },
        ],
      }),
      cache: "no-store",
    });
  } catch {
    throw new PayPalOrderError(
      "PayPal-Anfrage unterbrochen. Ergebnis unbekannt.",
      "unknown"
    );
  }

  if (!response.ok) {
    // Nur eine eindeutig beantwortete, nicht wiederholbare
    // Client-Anfrage wird als abgelehnt eingestuft.
    // Authentifizierungsfehler, Konflikte, Rate Limits
    // und Serverfehler bleiben vorsichtshalber unklar.
    const rejected = false;

    throw new PayPalOrderError(
      `PayPal-Bestellung fehlgeschlagen: HTTP ${response.status}`,
      rejected ? "rejected" : "unknown",
      response.status
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new PayPalOrderError(
      "PayPal-Antwort konnte nicht gelesen werden.",
      "unknown"
    );
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("id" in data) ||
    typeof data.id !== "string" ||
    !("status" in data) ||
    typeof data.status !== "string"
  ) {
    throw new PayPalOrderError(
      "Ungültige PayPal-Antwort.",
      "unknown"
    );
  }

  return data as PayPalOrder;
}
