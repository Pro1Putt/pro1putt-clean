import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { hashPaymentToken } from "@/lib/payment-token";
import { getPayPalSandboxOrder } from "@/lib/paypal-order-details";
import { capturePayPalSandboxOrder } from "@/lib/paypal-capture";
import { sendPaidRegistrationConfirmation } from "@/lib/payment-confirmation-email";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Supabase-Konfiguration fehlt.");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

type PayPalOrder = Awaited<ReturnType<typeof getPayPalSandboxOrder>>;

function verifiedCapture(
  order: PayPalOrder,
  registrationId: string,
  amount: string
): string | null {
  const unit = order.purchase_units?.[0];
  const captures = unit?.payments?.captures;

  if (
    order.purchase_units?.length !== 1 ||
    unit?.reference_id !== registrationId ||
    unit?.custom_id !== registrationId ||
    unit?.amount?.currency_code !== "EUR" ||
    unit?.amount?.value !== amount ||
    order.status !== "COMPLETED" ||
    captures?.length !== 1
  ) {
    return null;
  }

  const capture = captures[0];

  if (
    capture.status !== "COMPLETED" ||
    capture.amount?.currency_code !== "EUR" ||
    capture.amount?.value !== amount ||
    !capture.id
  ) {
    return null;
  }

  return capture.id;
}

export async function POST(req: Request) {
  if (
    process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live" ||
    process.env.PAYPAL_CHECKOUT_ENABLED !== "true"
  ) {
    return NextResponse.json(
      { ok: false, error: "Sandbox-Checkout deaktiviert." },
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
      !UUID.test(body.registration_id) ||
      !/^[a-f0-9]{64}$/i.test(body.payment_token)
    ) {
      return NextResponse.json(
        { ok: false, error: "Ungültige Zahlungsanfrage." },
        { status: 400 }
      );
    }

    const db = admin();

    const { data: registration, error } = await db
      .from("registrations")
      .select(
        "id,payment_token_hash,payment_status,payment_due_at,payment_amount,payment_currency,paypal_order_id,paypal_capture_id,payment_capture_lock_id"
      )
      .eq("id", body.registration_id)
      .single();

    if (error || !registration) {
      return NextResponse.json(
        { ok: false, error: "Anmeldung nicht gefunden." },
        { status: 404 }
      );
    }

    if (
      registration.payment_token_hash !==
      hashPaymentToken(body.payment_token)
    ) {
      return NextResponse.json(
        { ok: false, error: "Ungültiger Zahlungstoken." },
        { status: 403 }
      );
    }

    if (registration.payment_status === "paid") {
      try {
        await sendPaidRegistrationConfirmation(registration.id);
      } catch (mailError) {
        console.error("[payment-confirmation-email]", mailError);
      }

      return NextResponse.json({ ok: true, status: "paid" });
    }

    if (
      registration.payment_status !== "pending" ||
      !registration.paypal_order_id ||
      registration.payment_currency !== "EUR" ||
      !Number.isFinite(Number(registration.payment_amount)) ||
      Number(registration.payment_amount) <= 0
    ) {
      return NextResponse.json(
        { ok: false, error: "Zahlung nicht möglich." },
        { status: 409 }
      );
    }

    const amount = Number(registration.payment_amount).toFixed(2);

    let order = await getPayPalSandboxOrder(registration.paypal_order_id);

    if (
      order.id !== registration.paypal_order_id ||
      order.purchase_units?.length !== 1 ||
      order.purchase_units[0]?.reference_id !== registration.id ||
      order.purchase_units[0]?.custom_id !== registration.id ||
      order.purchase_units[0]?.amount?.currency_code !== "EUR" ||
      order.purchase_units[0]?.amount?.value !== amount
    ) {
      return NextResponse.json(
        { ok: false, error: "PayPal-Bestellung stimmt nicht überein." },
        { status: 409 }
      );
    }

    const completedCapture = verifiedCapture(
      order,
      registration.id,
      amount
    );

    if (completedCapture) {
      const { data: confirmed, error: confirmError } = await db.rpc(
        "pro1putt_reconcile_verified_payment",
        {
          p_registration_id: registration.id,
          p_paypal_order_id: order.id,
          p_paypal_capture_id: completedCapture,
        }
      );

      if (confirmError || confirmed !== true) {
        throw new Error("Bereits abgeschlossene Zahlung muss abgeglichen werden.");
      }

      try {
        await sendPaidRegistrationConfirmation(registration.id);
      } catch (mailError) {
        console.error("[payment-confirmation-email]", mailError);
      }

      return NextResponse.json({ ok: true, status: "paid" });
    }

    if (
      registration.payment_capture_lock_id ||
      !registration.payment_due_at ||
      new Date(registration.payment_due_at).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Zahlung wird geprüft oder Zahlungsfrist abgelaufen.",
        },
        { status: 409 }
      );
    }

    if (order.status !== "APPROVED") {
      return NextResponse.json(
        { ok: false, error: "PayPal-Zahlung noch nicht freigegeben." },
        { status: 409 }
      );
    }

    const lockId = randomUUID();

    const { data: reserved, error: reserveError } = await db.rpc(
      "pro1putt_reserve_payment_capture",
      {
        p_registration_id: registration.id,
        p_payment_token_hash: hashPaymentToken(body.payment_token),
        p_lock_id: lockId,
      }
    );

    if (reserveError || reserved !== true) {
      return NextResponse.json(
        { ok: false, error: "Zahlung wird bereits verarbeitet." },
        { status: 409 }
      );
    }

    // Nach erfolgreicher Reservierung bleibt die Sperre bei
    // unklarem PayPal-Ausgang bestehen, bis eine Prüfung erfolgt.
    await capturePayPalSandboxOrder(order.id);

    order = await getPayPalSandboxOrder(order.id);

    const captureId = verifiedCapture(
      order,
      registration.id,
      amount
    );

    if (!captureId) {
      throw new Error("PayPal-Capture benötigt eine erneute Überprüfung.");
    }

    const { data: confirmed, error: confirmError } = await db.rpc(
      "pro1putt_confirm_payment",
      {
        p_registration_id: registration.id,
        p_paypal_order_id: order.id,
        p_paypal_capture_id: captureId,
        p_lock_id: lockId,
      }
    );

    if (confirmError || confirmed !== true) {
      throw new Error("PayPal-Zahlung erfolgt, Datenbankabgleich erforderlich.");
    }

    try {
      await sendPaidRegistrationConfirmation(registration.id);
    } catch (mailError) {
      console.error("[payment-confirmation-email]", mailError);
    }

    return NextResponse.json(
      { ok: true, status: "paid" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[paypal/capture-order]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Zahlungsstatus unklar. Bitte keine zweite Zahlung durchführen.",
      },
      { status: 500 }
    );
  }
}
