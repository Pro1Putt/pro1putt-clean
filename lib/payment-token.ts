import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createPaymentToken(): {
  token: string;
  hash: string;
} {
  const token = randomBytes(32).toString("hex");

  return {
    token,
    hash: hashPaymentToken(token),
  };
}

export function hashPaymentToken(token: string): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

export function verifyPaymentToken(
  token: string,
  storedHash: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return false;
  }

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const calculated = Buffer.from(
    hashPaymentToken(token),
    "hex"
  );

  const expected = Buffer.from(storedHash, "hex");

  return timingSafeEqual(calculated, expected);
}
