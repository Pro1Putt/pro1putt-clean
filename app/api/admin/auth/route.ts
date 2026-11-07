import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const adminPin = process.env.TD_PIN || process.env.ADMIN_SECRET;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!adminPin || !sessionSecret) {
    return NextResponse.json(
      { ok: false, error: "Admin-Konfiguration fehlt." },
      { status: 503 }
    );
  }

  let pin: unknown;

  try {
    ({ pin } = await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof pin !== "string") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supplied = createHmac("sha256", sessionSecret)
    .update(pin)
    .digest();

  const expected = createHmac("sha256", sessionSecret)
    .update(adminPin)
    .digest();

  if (!timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const payload = String(expires);
  const signature = createHmac("sha256", sessionSecret)
    .update(payload)
    .digest("hex");

  const response = NextResponse.json({ ok: true });

  response.cookies.set("pro1putt_admin", `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return response;
}
