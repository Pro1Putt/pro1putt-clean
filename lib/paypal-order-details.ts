import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";
import { getPayPalAccessToken } from "./paypal";

const PAYPAL_API = getPayPalApiBaseUrl();

export type PayPalOrderDetails = {
  id: string;
  status: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: {
      currency_code: string;
      value: string;
    };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount?: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
  links?: Array<{
    href: string;
    rel: string;
  }>;
};

export async function getPayPalSandboxOrder(
  orderId: string
): Promise<PayPalOrderDetails> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    throw new Error("Nur PayPal Sandbox ist erlaubt.");
  }

  if (!/^[A-Za-z0-9]{5,64}$/.test(orderId)) {
    throw new Error("Ungültige PayPal-Bestellnummer.");
  }

  const token = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `PayPal-Bestellung konnte nicht abgerufen werden: HTTP ${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("id" in data) ||
    typeof data.id !== "string" ||
    data.id !== orderId ||
    !("status" in data) ||
    typeof data.status !== "string"
  ) {
    throw new Error("Ungültige PayPal-Bestellantwort.");
  }

  return data as PayPalOrderDetails;
}
