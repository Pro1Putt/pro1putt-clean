import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processPaymentReminders } from "@/lib/payment-reminder-worker";

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

function isAuthorized(request: NextRequest) {
  return authorized(
    request.headers.get("x-pro1putt-worker-secret"),
    process.env.PRO1PUTT_PAYMENT_WORKER_SECRET
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return respond({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    const result = await processPaymentReminders(50, true);
    return respond({ ok: true, ...result });
  } catch (error) {
    console.error("[payment-reminder-worker/preview]", error);
    return respond({ ok: false, error: "Vorschau fehlgeschlagen." }, 500);
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return respond({ ok: false, error: "Unauthorized" }, 401);
  }

  if (process.env.PRO1PUTT_REMINDER_EMAILS_ENABLED !== "true") {
    return respond(
      {
        ok: false,
        mode: "disabled",
        error: "Automatischer E-Mail-Versand ist deaktiviert.",
      },
      403
    );
  }

  try {
    const result = await processPaymentReminders(50, false);
    return respond({ ok: true, ...result });
  } catch (error) {
    console.error("[payment-reminder-worker/send]", error);
    return respond({ ok: false, error: "Versand fehlgeschlagen." }, 500);
  }
}
