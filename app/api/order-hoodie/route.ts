import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();

  const hoodieId = form.get("hoodieId");

  const res = await fetch(
    `${process.env.BRANDCANYON_API}/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BRANDCANYON_API_KEY}`,
      },
      body: JSON.stringify({
        product_id: hoodieId,
        quantity: 1,
      }),
    }
  );

  const data = await res.json();

  return NextResponse.json(data);
}
