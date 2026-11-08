import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TEST_ID = "37508244-09bd-4563-ad70-8082e20f633c";

function ageOn(birth: string, start: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  const [by, bm, bd] = birth.split("-").map(Number);
  const [sy, sm, sd] = start.split("-").map(Number);
  return sy - by - (sm < bm || (sm === bm && sd < bd) ? 1 : 0);
}

function division(reg: Record<string, unknown>, date: string): string {
  const age = ageOn(String(reg.birthdate || ""), date);
  if (age === null) return "";
  if (Number(reg.holes) === 18) {
    return age <= 13 ? "U14" : age <= 15 ? "U16" : age <= 17 ? "U18" : "U21";
  }
  return age <= 9 ? "U10" : "U12";
}

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Database unavailable");
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data: tournaments, error } = await db.from("tournaments")
      .select("id,name,start_date,end_date,course_name,location,registration_open,is_active")
      .gte("start_date", "2027-01-01").lt("start_date", "2028-01-01")
      .neq("id", TEST_ID).order("start_date", { ascending: true });
    if (error) throw error;
    const results = [];
    for (const tournament of tournaments || []) {
      const regs: Record<string, unknown>[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error: regError } = await db.from("registrations")
          .select("id,first_name,last_name,gender,holes,birthdate,hcp,home_club,tournament_status")
          .eq("tournament_id", tournament.id).order("id").range(from, from + 999);
        if (regError) throw regError;
        regs.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      const active = regs.filter(r => !["cancelled", "canceled", "storniert", "withdrawn", "deleted"].includes(String(r.tournament_status || "").toLowerCase()));
      results.push({
        id: tournament.id,
        name: tournament.name,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        course_name: tournament.course_name,
        location: tournament.location,
        registration_open: Boolean(tournament.registration_open && tournament.is_active),
        count: active.length,
        girls: active.filter(r => r.gender === "Girls").length,
        boys: active.filter(r => r.gender === "Boys").length,
        divisions: ["U10", "U12", "U14", "U16", "U18", "U21"].map(label => ({ label, count: active.filter(r => division(r, String(tournament.start_date).slice(0, 10)) === label).length })),
        // No names of minors are exposed until an explicit consent workflow exists.
      });
    }
    return NextResponse.json({ ok: true, tournaments: results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[tour-overview]", error);
    return NextResponse.json({ ok: false, error: "Turnierübersicht derzeit nicht verfügbar." }, { status: 500 });
  }
}
