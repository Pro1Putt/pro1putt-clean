import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPaymentResumeToken(
  registrationId: string
): Promise<string> {
  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    throw new Error("Nur PayPal-Sandbox erlaubt.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  const token = randomBytes(32).toString("hex");

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc(
    "pro1putt_add_payment_resume_link",
    {
      p_registration_id: registrationId,
      p_token_hash: hashToken(token),
    }
  );

  if (error || data !== true) {
    throw new Error(
      "Sicherer Zahlungslink konnte nicht vorbereitet werden."
    );
  }

  return token;
}

export function hashPaymentResumeToken(token: string): string {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("Ungültiger Zahlungstoken.");
  }

  return hashToken(token.toLowerCase());
}
