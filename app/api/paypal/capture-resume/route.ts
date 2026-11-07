import { getPayPalApiBaseUrl, getPayPalEnvironment } from "@/lib/paypal-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { hashPaymentResumeToken } from "@/lib/payment-resume-token";
import { getPayPalSandboxOrder } from "@/lib/paypal-order-details";
import { capturePayPalSandboxOrder } from "@/lib/paypal-capture";
import { sendPaidRegistrationConfirmation } from "@/lib/payment-confirmation-email";

export const runtime = "nodejs";

const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers });
}

async function sendConfirmation(registrationId: string) {
  try {
    await sendPaidRegistrationConfirmation(registrationId);
  } catch (error) {
    console.error("[capture-resume/email]", error);
  }
}

export async function POST(req: Request) {
  if (
    process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live" ||
    process.env.PAYPAL_CHECKOUT_ENABLED !== "true"
  ) {
    return reply({ ok: false, error: "Sandbox deaktiviert." }, 503);
  }

  try {
    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("resume_token" in body) ||
      typeof body.resume_token !== "string"
    ) {
      return reply({ ok: false, error: "Ungültige Anfrage." }, 400);
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

    const { data, error } = await db.rpc(
      "pro1putt_resolve_payment_resume_link",
      { p_token_hash: tokenHash }
    );

    if (error || !data?.[0]) {
      return reply(
        { ok: false, error: "Zahlungslink ungültig oder abgelaufen." },
        403
      );
    }

    const registrationId = data[0].registration_id;

    const { data: registration, error: registrationError } = await db
      .from("registrations")
      .select(
        "id,payment_status,payment_due_at,payment_amount,payment_currency,paypal_order_id,payment_capture_lock_id"
      )
      .eq("id", registrationId)
      .single();

    if (
      registrationError ||
      !registration ||
      registration.payment_status !== "pending" ||
      !registration.paypal_order_id ||
      registration.payment_currency !== "EUR" ||
      !Number.isFinite(Number(registration.payment_amount)) ||
      Number(registration.payment_amount) <= 0
    ) {
      return reply(
        { ok: false, error: "Zahlung kann nicht bestätigt werden." },
        409
      );
    }

    const amount = Number(registration.payment_amount).toFixed(2);

    let order = await getPayPalSandboxOrder(
      registration.paypal_order_id
    );

    const unit = order.purchase_units?.[0];

    if (
      order.id !== registration.paypal_order_id ||
      order.purchase_units?.length !== 1 ||
      unit?.reference_id !== registrationId ||
      unit?.custom_id !== registrationId ||
      unit?.amount?.currency_code !== "EUR" ||
      unit?.amount?.value !== amount
    ) {
      return reply(
        { ok: false, error: "PayPal-Bestellung stimmt nicht überein." },
        409
      );
    }

    function completedCaptureId(): string | null {
      const capture = order.purchase_units?.[0]?.payments?.captures;

      if (
        order.status !== "COMPLETED" ||
        capture?.length !== 1 ||
        capture[0]?.status !== "COMPLETED" ||
        capture[0]?.amount?.currency_code !== "EUR" ||
        capture[0]?.amount?.value !== amount ||
        !capture[0]?.id
      ) {
        return null;
      }

      return capture[0].id;
    }

    const alreadyCaptured = completedCaptureId();

    if (alreadyCaptured) {
      const { data: confirmed, error: confirmError } = await db.rpc(
        "pro1putt_reconcile_verified_payment",
        {
          p_registration_id: registrationId,
          p_paypal_order_id: order.id,
          p_paypal_capture_id: alreadyCaptured,
        }
      );

      if (confirmError || confirmed !== true) {
        throw new Error("Zahlungsabgleich erforderlich.");
      }

      await sendConfirmation(registrationId);
      return reply({ ok: true, status: "paid" });
    }

    if (
      order.status !== "APPROVED" ||
      registration.payment_capture_lock_id ||
      !registration.payment_due_at ||
      new Date(registration.payment_due_at).getTime() <= Date.now()
    ) {
      return reply(
        {
          ok: false,
          error: "Zahlung noch nicht freigegeben oder Frist abgelaufen.",
        },
        409
      );
    }

    const lockId = randomUUID();

    const { data: reserved, error: reserveError } = await db.rpc(
      "pro1putt_reserve_payment_capture_by_resume",
      {
        p_resume_token_hash: tokenHash,
        p_lock_id: lockId,
      }
    );

    if (reserveError || reserved !== true) {
      return reply(
        { ok: false, error: "Zahlung wird bereits verarbeitet." },
        409
      );
    }

    // Bei unklarem PayPal-Ergebnis bleibt die Sperre bestehen.
    // Niemals automatisch ein zweites Capture starten.
    await capturePayPalSandboxOrder(order.id);

    order = await getPayPalSandboxOrder(order.id);

    const captureId = completedCaptureId();

    if (!captureId) {
      throw new Error("PayPal-Zahlung muss überprüft werden.");
    }

    const { data: confirmed, error: confirmError } = await db.rpc(
      "pro1putt_confirm_payment",
      {
        p_registration_id: registrationId,
        p_paypal_order_id: order.id,
        p_paypal_capture_id: captureId,
        p_lock_id: lockId,
      }
    );

    if (confirmError || confirmed !== true) {
      throw new Error("Zahlung erfolgt, Datenbankabgleich erforderlich.");
    }

    await sendConfirmation(registrationId);

    return reply({ ok: true, status: "paid" });
  } catch (error) {
    console.error("[paypal/capture-resume]", error);

    return reply(
      {
        ok: false,
        error:
          "Zahlungsstatus unklar. Bitte keine zweite Zahlung durchführen.",
      },
      500
    );
  }
}
