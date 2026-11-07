import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get("pro1putt_admin")?.value;

  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;

  if (!/^\d+$/.test(payload) || !/^[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const expires = Number(payload);

  if (!Number.isSafeInteger(expires) || expires <= Date.now()) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  );
}
