import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  const { registrationId, status, hole, note } = await req.json();
  const supabase = getSupabase();

  const { error } = await supabase
    .from("registrations")
    .update({
      tournament_status: status,
      tournament_status_hole: hole || null,
      tournament_status_note: note || null,
    })
    .eq("id", registrationId);

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true });
}
