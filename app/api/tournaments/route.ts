import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function GET(req: Request) {
  try {
    const supabase = getServiceSupabase();
    const registrationOnly = new URL(req.url).searchParams.get("registration") === "open";

    const tour2027 = new URL(req.url).searchParams.get("view") === "tour2027";

    const localSandboxPreview =
      process.env.NODE_ENV === "development" &&
      process.env.PRO1PUTT_LOCAL_SANDBOX_TEST === "true" &&
      new URL(req.url).searchParams.get("sandbox") === "local";

    let query = supabase
      .from("tournaments")
      .select(
        tour2027
          ? "id,name,course_name,start_date,end_date,location,slug,is_active,registration_open"
          : "id,name,start_date,location"
      )
      .order("start_date", { ascending: false });

    if (!localSandboxPreview) {
      query = query.neq(
        "id",
        "37508244-09bd-4563-ad70-8082e20f633c"
      );
    }

    if (registrationOnly) {
      query = query.eq("is_active", true).eq("registration_open", true);
    }

    if (tour2027) {
      query = query
        .gte("start_date", "2027-01-01")
        .lte("start_date", "2027-12-31");
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tournaments: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}