import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const supabase = getSupabase();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, start_date")
    .order("start_date", { ascending: false });

  const result = await Promise.all((tournaments || []).map(async (t: any) => {
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", t.id);
    return { ...t, registrations_count: count || 0 };
  }));

  return NextResponse.json({ ok: true, tournaments: result });
}
