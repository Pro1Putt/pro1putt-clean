import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const fields = "id,name,course_name,start_date,end_date,location,slug,max_participants,registration_deadline,is_active,registration_open";
const err = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
const dateValid = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s + "T00:00:00Z").toISOString().slice(0,10) === s;
const textValue = (v: unknown) => typeof v === "string" ? v.trim() : "";
const slugValid = (s: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 100;

export async function GET() {
  if (!(await isAdminAuthenticated())) return err("Nicht autorisiert", 401);
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("tournaments").select(fields).order("start_date", { ascending: false });
    if (error) return err(error.message, 500);
    const tournaments = await Promise.all((data || []).map(async (t: any) => {
      const { count, error: countError } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("tournament_id", t.id);
      return { ...t, registrations_count: countError ? null : count };
    }));
    return NextResponse.json({ ok: true, tournaments });
  } catch { return err("Turniere konnten nicht geladen werden", 500); }
}

function parsePayload(raw: any, isCreate: boolean): { data?: Record<string, unknown>; error?: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "Ungültige Eingabe" };
  const name = textValue(raw.name);
  const course_name = textValue(raw.course_name);
  const location = textValue(raw.location);
  const slug = textValue(raw.slug);
  const start_date = raw.start_date;
  const end_date = raw.end_date;
  const registration_deadline = raw.registration_deadline;
  const max_participants = raw.max_participants;
  if (!name || name.length > 160 || !course_name || course_name.length > 160 || !location || location.length > 160) return { error: "Name, Golfplatz und Ort sind erforderlich (max. 160 Zeichen)" };
  if (!slugValid(slug)) return { error: "Slug: nur Kleinbuchstaben, Zahlen und Bindestriche" };
  if (!dateValid(start_date) || !dateValid(end_date) || end_date < start_date) return { error: "Ungültiger Turnierzeitraum" };
  if (registration_deadline !== null && registration_deadline !== "" && !dateValid(registration_deadline)) return { error: "Ungültiger Anmeldeschluss" };
  if (registration_deadline && registration_deadline > start_date) return { error: "Anmeldeschluss darf nicht nach Turnierbeginn liegen" };
  if (max_participants !== null && max_participants !== "" && (!Number.isInteger(max_participants) || max_participants < 1 || max_participants > 10000)) return { error: "Teilnehmerlimit muss zwischen 1 und 10000 liegen" };
  if (!isCreate && (typeof raw.is_active !== "boolean" || typeof raw.registration_open !== "boolean")) return { error: "Ungültiger Turnier- oder Anmeldestatus" };
  const is_active = isCreate ? false : raw.is_active;
  const registration_open = isCreate ? false : raw.registration_open;
  if (registration_open && !is_active) return { error: "Anmeldungen erfordern ein aktives Turnier" };
  return { data: { name, course_name, location, slug, start_date, end_date, registration_deadline: registration_deadline || null, max_participants: max_participants === "" ? null : max_participants, is_active, registration_open } };
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return err("Nicht autorisiert", 401);
  try {
    const raw = await req.json().catch(() => null);
    const parsed = parsePayload(raw, true);
    if (!parsed.data) return err(parsed.error || "Ungültige Eingabe");
    if (parsed.data.start_date && String(parsed.data.start_date).slice(0,4) < "2027") return err("Historische Turniere dürfen nicht angelegt werden");
    const supabase = getSupabase();
    const { data, error } = await supabase.from("tournaments").insert(parsed.data).select(fields).single();
    if (error) return err(error.code === "23505" ? "Turnier-Slug bereits vergeben" : error.message, error.code === "23505" ? 409 : 500);
    return NextResponse.json({ ok: true, tournament: data }, { status: 201 });
  } catch { return err("Turnier konnte nicht angelegt werden", 500); }
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) return err("Nicht autorisiert", 401);
  try {
    const raw = await req.json().catch(() => null);
    const id = textValue(raw?.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return err("Ungültige Turnier-ID");
    const parsed = parsePayload(raw, false);
    if (!parsed.data) return err(parsed.error || "Ungültige Eingabe");
    const supabase = getSupabase();
    const { data: existing, error: lookupError } = await supabase.from("tournaments").select("id,start_date").eq("id", id).maybeSingle();
    if (lookupError) return err(lookupError.message, 500);
    if (!existing) return err("Turnier nicht gefunden", 404);
    if (String(existing.start_date).slice(0,4) < "2027") return err("Historische Turniere sind schreibgeschützt", 403);
    if (String(parsed.data.start_date).slice(0,4) < "2027") return err("Turnier darf nicht in ein historisches Jahr verschoben werden", 403);
    const { data, error } = await supabase.from("tournaments").update(parsed.data).eq("id", id).gte("start_date", "2027-01-01").select(fields).maybeSingle();
    if (error) return err(error.code === "23505" ? "Turnier-Slug bereits vergeben" : error.message, error.code === "23505" ? 409 : 500);
    if (!data) return err("Turnier konnte nicht aktualisiert werden", 409);
    return NextResponse.json({ ok: true, tournament: data });
  } catch { return err("Turnier konnte nicht gespeichert werden", 500); }
}
