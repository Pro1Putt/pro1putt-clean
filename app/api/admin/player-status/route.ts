import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { registrationId, status, hole, note } = await req.json();

  if (!registrationId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("registrations")
    .update({
      tournament_status: status,
      tournament_status_hole: hole ?? null,
      tournament_status_note: note ?? null,
    })
    .eq("id", registrationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
