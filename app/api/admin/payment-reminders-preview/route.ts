import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function authorized(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return respond(
      { ok: false, error: "Supabase-Konfiguration fehlt." },
      500
    );
  }

  const db = createClient(url, key, {
    auth: { persistSession: false },
  });

  const { data, error } = await db.rpc(
    "pro1putt_get_payment_reminders",
    { p_limit: 50 }
  );

  if (error) {
    console.error("[payment-reminders-preview]", error);
    return respond(
      { ok: false, error: "Erinnerungen konnten nicht geladen werden." },
      500
    );
  }

  return respond({
    ok: true,
    mode: "preview",
    checked: data?.length ?? 0,
    reminders: (data ?? []).map(
      (item: {
        registration_id: string;
        reminder_type: string;
        payment_due_at: string;
      }) => ({
        registration_id: item.registration_id,
        reminder_type: item.reminder_type,
        payment_due_at: item.payment_due_at,
      })
    ),
  });
}
