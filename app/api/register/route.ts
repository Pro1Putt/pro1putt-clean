import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRegistrationMail } from "@/lib/mailer";

function normStr(v: any) {
  return String(v ?? "").trim();
}
function normEmail(v: any) {
  const s = normStr(v).toLowerCase();
  return s || null;
}
function normNation(v: any) {
  const s = normStr(v).toUpperCase();
  return s.length === 2 ? s : null;
}
function toBool(v: any) {
  if (typeof v === "boolean") return v;
  const s = normStr(v).toLowerCase();
  if (["1", "true", "yes", "ja"].includes(s)) return true;
  if (["0", "false", "no", "nein"].includes(s)) return false;
  return null;
}
function toInt(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tournament_id = normStr(body.tournament_id);
    const holes = toInt(body.holes);
    const first_name = normStr(body.first_name);
    const last_name = normStr(body.last_name);
    const email = normEmail(body.email);
    const hcp = toNum(body.hcp);
    const birthdate = normStr(body.birthdate);

    const home_club = normStr(body.home_club);
    const coach = normStr(body.coach);
    const walkup_song = normStr(body.walkup_song);

    const caddie = toBool(body.caddie);
    const wagr = toBool(body.wagr);
    const college_interest = toBool(body.college_interest);

    const nation = normNation(body.nation);
    const gender = ["Boys", "Girls"].includes(normStr(body.gender))
  ? normStr(body.gender)
  : null;

    const missing: string[] = [];
    if (!tournament_id) missing.push("tournament_id");
    if (!holes || ![9, 18].includes(holes)) missing.push("holes");
    if (!first_name) missing.push("first_name");
    if (!last_name) missing.push("last_name");
    if (!email) missing.push("email");
    if (hcp === null) missing.push("hcp");
    if (!birthdate) missing.push("birthdate");
    if (!home_club) missing.push("home_club");
    if (!coach) missing.push("coach");
    if (!walkup_song) missing.push("walkup_song");
    if (caddie === null) missing.push("caddie");
    if (wagr === null) missing.push("wagr");
    if (college_interest === null) missing.push("college_interest");
    if (!nation) missing.push("nation");
    if (!gender) missing.push("gender");

    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: `Missing/invalid fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Turnier laden (PayPal + Name)
    const { data: tRow, error: tErr } = await supabase
      .from("tournaments")
      .select("name,paypal_url_9,paypal_url_18")
      .eq("id", tournament_id)
      .single();

    if (tErr || !tRow) {
      return NextResponse.json({ ok: false, error: "Turnier nicht gefunden." }, { status: 400 });
    }

    const paypal_url =
      holes === 9 ? tRow.paypal_url_9 : holes === 18 ? tRow.paypal_url_18 : null;

    // 4-digit PIN
    const player_pin = Math.floor(1000 + Math.random() * 9000).toString();

    // speichern
    const { data, error } = await supabase
      .from("registrations")
      .insert([
        {
          tournament_id,
          holes,
          first_name,
          last_name,
          email,
          hcp,
          birthdate,
          home_club,
          coach,
          walkup_song,
          caddie,
          wagr,
          college_interest,
          nation,
          gender,
          player_pin,
        },
      ])
      .select("id, player_pin")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    // Mail senden (nach erfolgreichem Insert)
    await sendRegistrationMail({
  to: email,
  firstName: first_name,
  lastName: last_name,
  tournamentName: tRow?.name || "PRO1PUTT",
  holes: holes!,
  playerPin: player_pin,
});

    return NextResponse.json({
      ok: true,
      id: data.id,
      player_pin: data.player_pin,
      paypal_url: paypal_url || null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}