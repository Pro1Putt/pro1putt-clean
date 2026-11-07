import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processExpiredPayments } from "@/lib/payment-expiration-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

function respond(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  if (
    !authorized(
      request.headers.get("x-pro1putt-worker-secret"),
      process.env.PRO1PUTT_PAYMENT_WORKER_SECRET
    )
  ) {
    return respond({ ok: false, error: "Unauthorized" }, 401);
  }

  if (process.env.PAYPAL_ENV !== "sandbox") {
    return respond(
      { ok: false, error: "Nur in der Sandbox verfügbar." },
      403
    );
  }

  return respond({
    ok: true,
    mode: "preview",
    message:
      "Stornierungs-Worker vorbereitet. Keine Stornierung ausgeführt.",
  });
}

export async function POST(request: NextRequest) {
  if (
    !authorized(
      request.headers.get("x-pro1putt-worker-secret"),
      process.env.PRO1PUTT_PAYMENT_WORKER_SECRET
    )
  ) {
    return respond({ ok: false, error: "Unauthorized" }, 401);
  }

  if (process.env.PRO1PUTT_EXPIRATION_WORKER_ENABLED !== "true") {
    return respond(
      {
        ok: false,
        mode: "disabled",
        error: "Automatische Stornierung ist deaktiviert.",
      },
      403
    );
  }

  if (process.env.PAYPAL_ENV !== "sandbox" && process.env.PAYPAL_ENV !== "live") {
    return respond(
      { ok: false, error: "PayPal-Umgebung nicht konfiguriert." },
      403
    );
  }

  try {
    const result = await processExpiredPayments(50);

    return respond({
      ok: true,
      mode: "process",
      result,
    });
  } catch (error) {
    console.error("[payment-expiration-worker]", error);

    return respond(
      { ok: false, error: "Stornierungsverarbeitung fehlgeschlagen." },
      500
    );
  }
}
