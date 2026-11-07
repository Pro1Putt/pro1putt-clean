import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { getPayPalAccessToken } from "./paypal";
import { createHash } from "node:crypto";

function sha256OrderId(orderId: string): string {
  return createHash("sha256")
    .update(orderId)
    .digest("hex")
    .slice(0, 32);
}

const PAYPAL_API = getPayPalApiBaseUrl();

export type PayPalCaptureResult = {
  id: string;
  status: string;
  purchase_units?: Array<{
    reference_id?: string;
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
};

export async function capturePayPalSandboxOrder(
  orderId: string
): Promise<PayPalCaptureResult> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    throw new Error("Nur PayPal Sandbox ist erlaubt.");
  }

  if (!/^[A-Za-z0-9]{5,64}$/.test(orderId)) {
    throw new Error("Ungültige PayPal-Bestellnummer.");
  }

  const token = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `p1p-capture-${sha256OrderId(orderId)}`,
      },
      body: "{}",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `PayPal-Zahlungsabschluss fehlgeschlagen: HTTP ${response.status}`
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
    throw new Error("Ungültige PayPal-Capture-Antwort.");
  }

  return data as PayPalCaptureResult;
}
