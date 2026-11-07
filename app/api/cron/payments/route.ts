import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processPaymentReminders } from "@/lib/payment-reminder-worker";
import { processExpiredPayments } from "@/lib/payment-expiration-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!authorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const remindersEnabled = process.env.PRO1PUTT_REMINDER_EMAILS_ENABLED === "true";
  const expirationEnabled = process.env.PRO1PUTT_EXPIRATION_WORKER_ENABLED === "true";
  const result: Record<string, unknown> = {
    ok: true,
    reminderMode: remindersEnabled ? "send" : "preview",
    expirationMode: expirationEnabled ? "process" : "disabled",
  };
  let failed = false;

  try {
    result.reminders = await processPaymentReminders(50, !remindersEnabled);
  } catch (error) {
    failed = true;
    console.error("[cron/payments/reminders]", error);
    result.remindersError = "Erinnerungsverarbeitung fehlgeschlagen";
  }

  if (expirationEnabled) {
    try {
      result.expiration = await processExpiredPayments(50);
    } catch (error) {
      failed = true;
      console.error("[cron/payments/expiration]", error);
      result.expirationError = "Stornierungsverarbeitung fehlgeschlagen";
    }
  }

  result.ok = !failed;
  return NextResponse.json(result, {
    status: failed ? 500 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
