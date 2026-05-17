import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { pin } = await req.json();
  const adminPin = process.env.TD_PIN || process.env.ADMIN_SECRET || "1234";
  if (pin === adminPin) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
