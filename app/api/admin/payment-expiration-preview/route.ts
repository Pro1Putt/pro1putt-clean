import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.PRO1PUTT_PAYMENT_WORKER_SECRET;

  if (!secret || secret.length < 32) return false;

  const provided = req.headers.get("x-pro1putt-worker-secret") || "";

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (
    process.env.PAYPAL_ENV !== "sandbox" ||
    !authorized(req)
  ) {
    return NextResponse.json(
      { ok: false, error: "Nicht autorisiert." },
      { status: 403 }
    );
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Supabase-Konfiguration fehlt.");
    }

    const db = createClient(url, key, {
      auth: { persistSession: false },
    });

    const { data, error } = await db.rpc(
      "pro1putt_get_expired_payments",
      { p_limit: 50 }
    );

    if (error) throw error;

    const registrations = data || [];

    return NextResponse.json(
      {
        ok: true,
        mode: "preview",
        checked: registrations.length,
        registrations: registrations.map((r: {
          registration_id: string;
          paypal_order_id: string | null;
          payment_due_at: string;
          payment_capture_locked: boolean;
          paypal_order_locked: boolean;
          paypal_recovery_required: boolean;
        }) => ({
          registration_id: r.registration_id,
          payment_due_at: r.payment_due_at,
          has_paypal_order: Boolean(r.paypal_order_id),
          protected:
            r.payment_capture_locked ||
            r.paypal_order_locked ||
            r.paypal_recovery_required,
        })),
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[payment-expiration-preview]", error);

    return NextResponse.json(
      { ok: false, error: "Prüfung fehlgeschlagen." },
      { status: 500 }
    );
  }
}
