import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { hashPaymentToken } from "@/lib/payment-token";
import { createPayPalSandboxOrder, PayPalOrderError } from "@/lib/paypal-orders";
import { getPayPalSandboxOrder } from "@/lib/paypal-order-details";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Reservation = {
  registration_id: string;
  payment_amount: number;
  payment_currency: string;
  existing_paypal_order_id: string | null;
  create_new_order: boolean;
  paypal_request_id: string;
};

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function validOrder(
  order: {
    id: string;
    status: string;
    purchase_units?: Array<{
      reference_id?: string;
      custom_id?: string;
      amount?: {
        currency_code: string;
        value: string;
      };
    }>;
  },
  registrationId: string,
  amount: string
): boolean {
  const unit = order.purchase_units?.[0];

  return (
    order.purchase_units?.length === 1 &&
    unit?.reference_id === registrationId &&
    unit?.custom_id === registrationId &&
    unit?.amount?.currency_code === "EUR" &&
    unit?.amount?.value === amount &&
    ["CREATED", "SAVED", "APPROVED", "PAYER_ACTION_REQUIRED"].includes(order.status)
  );
}

async function processOrder(
  registrationId: string,
  paymentToken: string
) {
  const supabase = getServiceSupabase();
  const lockId = randomUUID();

  const { data, error } = await supabase.rpc(
    "pro1putt_reserve_paypal_order",
    {
      p_registration_id: registrationId,
      p_payment_token_hash: hashPaymentToken(paymentToken),
      p_lock_id: lockId,
    }
  );

  if (error) {
    throw new Error("PayPal-Bestellung konnte nicht reserviert werden.");
  }

  const reservation = data?.[0] as Reservation | undefined;

  if (!reservation) {
    throw new Error("Keine Zahlungsreservierung erhalten.");
  }

  const amount = Number(reservation.payment_amount).toFixed(2);

  if (
    !Number.isFinite(Number(reservation.payment_amount)) ||
    Number(reservation.payment_amount) <= 0 ||
    reservation.payment_currency !== "EUR"
  ) {
    throw new Error("Ungültiger Teilnahmebetrag.");
  }

  if (reservation.existing_paypal_order_id) {
    const existing = await getPayPalSandboxOrder(
      reservation.existing_paypal_order_id
    );

    if (!validOrder(existing, registrationId, amount)) {
      throw new Error("Bestehende PayPal-Bestellung ist ungültig.");
    }

    return {
      order_id: existing.id,
      status: existing.status,
      links: existing.links ?? [],
    };
  }

  if (!reservation.create_new_order) {
    throw new Error("PayPal-Bestellung kann nicht erstellt werden.");
  }

  try {
    const created = await createPayPalSandboxOrder(
      registrationId,
      amount,
      "EUR",
      reservation.paypal_request_id
    );

    if (!created.id || !["CREATED", "SAVED", "PAYER_ACTION_REQUIRED"].includes(created.status)) {
      throw new Error("Unerwarteter PayPal-Bestellstatus.");
    }

    const details = await getPayPalSandboxOrder(created.id);

    if (!validOrder(details, registrationId, amount)) {
      throw new Error("PayPal-Bestelldaten stimmen nicht überein.");
    }

    const { data: finalized, error: finalizeError } =
      await supabase.rpc("pro1putt_finalize_paypal_order", {
        p_registration_id: registrationId,
        p_lock_id: lockId,
        p_paypal_order_id: created.id,
      });

    if (finalizeError || finalized !== true) {
      throw new Error("PayPal-Bestellung konnte nicht gespeichert werden.");
    }

    return {
      order_id: details.id,
      status: details.status,
      links: details.links ?? created.links ?? [],
    };
  } catch (error) {
    const definitelyRejected =
      error instanceof PayPalOrderError &&
      error.outcome === "rejected";

    if (definitelyRejected) {
      const { data: released, error: releaseError } =
        await supabase.rpc("pro1putt_release_paypal_order_lock", {
          p_registration_id: registrationId,
          p_lock_id: lockId,
        });

      if (releaseError || released !== true) {
        throw new Error("PayPal-Bestellsperre konnte nicht freigegeben werden.");
      }

      throw new Error("PayPal hat die Bestellung abgelehnt.");
    }

    const { data: marked, error: markError } =
      await supabase.rpc("pro1putt_mark_paypal_order_recovery", {
        p_registration_id: registrationId,
        p_lock_id: lockId,
      });

    if (markError || marked !== true) {
      throw new Error("PayPal-Bestellung benötigt eine manuelle Überprüfung.");
    }

    throw new Error(
      "PayPal-Bestellung konnte nicht abgeschlossen werden. Eine Überprüfung ist erforderlich."
    );
  }
}

export async function POST(req: Request) {
  if (
    process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live" ||
    process.env.PAYPAL_CHECKOUT_ENABLED !== "true"
  ) {
    return NextResponse.json(
      { error: "PayPal-Sandbox-Checkout noch nicht freigeschaltet." },
      { status: 503 }
    );
  }

  try {
    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("registration_id" in body) ||
      !("payment_token" in body) ||
      typeof body.registration_id !== "string" ||
      typeof body.payment_token !== "string" ||
      !UUID_PATTERN.test(body.registration_id) ||
      !/^[a-f0-9]{64}$/i.test(body.payment_token)
    ) {
      return NextResponse.json(
        { error: "Ungültige Zahlungsanfrage." },
        { status: 400 }
      );
    }

    const result = await processOrder(
      body.registration_id,
      body.payment_token
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[PRO1PUTT PayPal Sandbox] Bestellerstellung fehlgeschlagen:",
        error instanceof Error ? error.message : "Unbekannter Fehler"
      );
    }

    return NextResponse.json(
      { error: "Zahlungsanfrage konnte nicht verarbeitet werden." },
      { status: 409 }
    );
  }
}
