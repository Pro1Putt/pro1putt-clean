import "server-only";

import {
  getPayPalApiBaseUrl,
  getPayPalEnvironment,
} from "@/lib/paypal-config";

export async function getPayPalAccessToken(): Promise<string> {
  const mode = getPayPalEnvironment();
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal-Zugangsdaten fehlen.");
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${getPayPalApiBaseUrl()}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `PayPal-${mode}-Authentifizierung fehlgeschlagen: HTTP ${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("access_token" in data) ||
    typeof data.access_token !== "string"
  ) {
    throw new Error("PayPal hat keinen gültigen Access Token geliefert.");
  }

  return data.access_token;
}
