import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const registrationId = String(searchParams.get("registrationId") || "").trim();

    if (!registrationId) {
      return NextResponse.json({ ok: false, error: "Missing registrationId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // ✅ nur nach ID laden (robust, egal welches Turnier in der URL steht)
    const { data, error } = await supabase
      .from("registrations")
      .select("id,tournament_id,first_name,last_name,holes,gender,home_club,nation")
      .eq("id", registrationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, player: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}