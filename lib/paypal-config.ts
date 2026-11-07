import "server-only";

export type PayPalEnvironment = "sandbox" | "live";

export function getPayPalEnvironment(): PayPalEnvironment {
  const environment = process.env.PAYPAL_ENV;

  if (environment !== "sandbox" && environment !== "live") {
    throw new Error(
      "PAYPAL_ENV muss ausdrücklich sandbox oder live sein."
    );
  }

  return environment;
}

export function getPayPalApiBaseUrl(): string {
  return getPayPalEnvironment() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getPayPalCheckoutBaseUrl(): string {
  return getPayPalEnvironment() === "live"
    ? "https://www.paypal.com/"
    : "https://www.sandbox.paypal.com/";
}
