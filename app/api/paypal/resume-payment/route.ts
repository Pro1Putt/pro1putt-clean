import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { hashPaymentResumeToken } from "@/lib/payment-resume-token";
import {
  createPayPalSandboxOrder,
  PayPalOrderError,
} from "@/lib/paypal-orders";
import { getPayPalSandboxOrder } from "@/lib/paypal-order-details";

export const runtime = "nodejs";

const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

type Reservation = {
  registration_id: string;
  payment_amount: number;
  payment_currency: string;
  existing_paypal_order_id: string | null;
  create_new_order: boolean;
  paypal_request_id: string;
};

function validOrder(
  order: Awaited<ReturnType<typeof getPayPalSandboxOrder>>,
  registrationId: string,
  amount: string
) {
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

export async function POST(req: Request) {
  if (
    process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live" ||
    process.env.PAYPAL_CHECKOUT_ENABLED !== "true"
  ) {
    return NextResponse.json(
      { ok: false, error: "Sandbox-Checkout deaktiviert." },
      { status: 503, headers }
    );
  }

  try {
    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("resume_token" in body) ||
      typeof body.resume_token !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "Ungültiger Zahlungslink." },
        { status: 400, headers }
      );
    }

    const tokenHash = hashPaymentResumeToken(body.resume_token);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Supabase-Konfiguration fehlt.");
    }

    const db = createClient(url, key, {
      auth: { persistSession: false },
    });

    const lockId = randomUUID();

    const { data, error } = await db.rpc(
      "pro1putt_reserve_paypal_order_by_resume",
      {
        p_resume_token_hash: tokenHash,
        p_lock_id: lockId,
      }
    );

    if (error || !data?.[0]) {
      return NextResponse.json(
        {
          ok: false,
          error: "Zahlungslink ungültig oder Zahlung nicht möglich.",
        },
        { status: 409, headers }
      );
    }

    const reservation = data[0] as Reservation;
    const registrationId = reservation.registration_id;
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
        throw new Error("Bestehende PayPal-Bestellung ungültig.");
      }

      return NextResponse.json(
        {
          ok: true,
          status: existing.status,
          links: existing.links ?? [],
        },
        { headers }
      );
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

      if (
        !created.id ||
        !["CREATED", "SAVED", "PAYER_ACTION_REQUIRED"].includes(created.status)
      ) {
        throw new Error("Unerwarteter PayPal-Bestellstatus.");
      }

      const details = await getPayPalSandboxOrder(created.id);

      if (!validOrder(details, registrationId, amount)) {
        throw new Error("PayPal-Bestelldaten stimmen nicht überein.");
      }

      const { data: finalized, error: finalizeError } = await db.rpc(
        "pro1putt_finalize_paypal_order",
        {
          p_registration_id: registrationId,
          p_lock_id: lockId,
          p_paypal_order_id: created.id,
        }
      );

      if (finalizeError || finalized !== true) {
        throw new Error("PayPal-Bestellung konnte nicht gespeichert werden.");
      }

      return NextResponse.json(
        {
          ok: true,
          status: details.status,
          links: details.links ?? created.links ?? [],
        },
        { headers }
      );
    } catch (error) {
      const rejected =
        error instanceof PayPalOrderError &&
        error.outcome === "rejected";

      if (rejected) {
        await db.rpc("pro1putt_release_paypal_order_lock", {
          p_registration_id: registrationId,
          p_lock_id: lockId,
        });
      } else {
        await db.rpc("pro1putt_mark_paypal_order_recovery", {
          p_registration_id: registrationId,
          p_lock_id: lockId,
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("[paypal/resume-payment]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Zahlung konnte nicht vorbereitet werden. Bitte nicht mehrfach versuchen.",
      },
      { status: 409, headers }
    );
  }
}
