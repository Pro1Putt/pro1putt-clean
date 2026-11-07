import { sendPaymentRegistrationConfirmation } from "@/lib/payment-registration-confirmation";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRegistrationEmail } from "@/lib/mailer";
import { createPaymentToken } from "@/lib/payment-token";

function getBaseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
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

function calculateAgeAtTournament(birthdate: string, startDate: string): number | null {
  const parseDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) return null;

    return { year, month, day };
  };

  const birth = parseDate(birthdate);
  const start = parseDate(startDate);

  if (!birth || !start) return null;

  let age = start.year - birth.year;

  if (
    start.month < birth.month ||
    (start.month === birth.month && start.day < birth.day)
  ) age--;

  return age;
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  // PRO1PUTT 2.0: Neue Anmeldungen erst nach bewusster Freigabe.
  // Standardmäßig geschlossen, auch auf der Live-Website.
  if (process.env.PRO1PUTT_REGISTRATION_ENABLED !== "true") {
    return NextResponse.json(
      {
        ok: false,
        error: "Die Anmeldung ist derzeit noch nicht freigeschaltet."
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const tournament_id = normStr(body.tournament_id);
    const holes = toInt(body.holes);
    const first_name = normStr(body.first_name);
    const last_name = normStr(body.last_name);
    const email = normEmail(body.email);
    const phone = normStr(body.phone);
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
    if (!phone) missing.push("phone");
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

    // Lokale Sandbox: ausschließlich das Testturnier zulassen
    if (
      process.env.NODE_ENV === "development" &&
      process.env.PRO1PUTT_LOCAL_SANDBOX_TEST === "true" &&
      tournament_id !== "37508244-09bd-4563-ad70-8082e20f633c"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Im lokalen Sandbox-Modus sind nur Testanmeldungen erlaubt.",
        },
        { status: 403 }
      );
    }

    // Turnier laden (PayPal + Name)
    const { data: tRow, error: tErr } = await supabase
      .from("tournaments")
      .select("name,start_date,is_active,registration_open,registration_deadline,paypal_url_9,paypal_url_18")
      .eq("id", tournament_id)
      .single();

    if (tErr || !tRow) {
      return NextResponse.json({ ok: false, error: "Turnier nicht gefunden." }, { status: 400 });
    }

    // Keine neuen Anmeldungen für bereits gestartete Turniere.
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const tournamentStart = String(tRow.start_date || "").slice(0, 10);

    if (!tournamentStart || tournamentStart < today) {
      return NextResponse.json(
        { ok: false, error: "Die Anmeldung für dieses Turnier ist geschlossen." },
        { status: 400 }
      );
    }

    // Neue Altersregeln gelten nur für Turniere ab dem 18.10.2026.
    // Historische Turniere behalten ihre bisherigen Anmelderegeln.
    if (String(tRow.start_date || "").slice(0, 10) >= "2026-10-18") {
    // Anmeldung nur für freigegebene Turniere
    if (!tRow.is_active || !tRow.registration_open) {
      return NextResponse.json(
        { ok: false, error: "Die Anmeldung für dieses Turnier ist noch nicht geöffnet." },
        { status: 403 }
      );
    }

    if (
      tRow.registration_deadline &&
      String(tRow.registration_deadline).slice(0, 10) < today
    ) {
      return NextResponse.json(
        { ok: false, error: "Der Anmeldeschluss ist abgelaufen." },
        { status: 403 }
      );
    }

    // Stichtag: erster Turniertag
    if (!tRow.start_date) {
      return NextResponse.json(
        { ok: false, error: "Für dieses Turnier ist kein Startdatum hinterlegt." },
        { status: 400 }
      );
    }

    const age = calculateAgeAtTournament(birthdate, String(tRow.start_date));

    if (age === null || age < 0) {
      return NextResponse.json(
        { ok: false, error: "Ungültiges Geburtsdatum." },
        { status: 400 }
      );
    }

    if (age >= 13 && holes !== 18) {
      return NextResponse.json(
        { ok: false, error: "U14, U16, U18 und U21 spielen ausschließlich 18 Loch." },
        { status: 400 }
      );
    }

    if (age > 21) {
      return NextResponse.json(
        {
          ok: false,
          error: "Eine Anmeldung ist nur bis einschließlich 21 Jahre am ersten Turniertag möglich."
        },
        { status: 400 }
      );
    }

    }

    const paypal_url =
      holes === 9 ? tRow.paypal_url_9 : holes === 18 ? tRow.paypal_url_18 : null;

    // 4-digit PIN
    const player_pin = Math.floor(1000 + Math.random() * 9000).toString();

    // Für Turniere ab 2027: atomare Datenbankregistrierung mit Kapazitäts- und Duplikatschutz.
    // Historische Turniere werden nicht verändert.
    let registrationId: string;
    let paymentToken: string | null = null;

    if (tournamentStart >= "2027-01-01") {
      const paymentCredentials = createPaymentToken();
      paymentToken = paymentCredentials.token;

      const { data: newId, error: rpcError } = await supabase.rpc("register_player_2027", {
        p_tournament_id: tournament_id,
        p_holes: holes,
        p_first_name: first_name,
        p_last_name: last_name,
        p_email: email,
        p_phone: phone,
        p_hcp: hcp,
        p_birthdate: birthdate,
        p_home_club: home_club,
        p_coach: coach,
        p_walkup_song: walkup_song,
        p_caddie: caddie,
        p_wagr: wagr,
        p_college_interest: college_interest,
        p_nation: nation,
        p_gender: gender,
        p_player_pin: player_pin,
        p_payment_token_hash: paymentCredentials.hash,
      });
      if (rpcError || typeof newId !== "string") {
        const message = rpcError?.message || "Anmeldung konnte nicht gespeichert werden.";
        const expected = [
          "Dieser Spieler ist bereits angemeldet",
          "Das Turnier ist ausgebucht",
          "Die Anmeldung ist geschlossen",
          "Der Anmeldezeitraum ist abgelaufen",
          "Alter außerhalb der zulässigen Altersklassen",
          "Ungültige Lochzahl für diese Altersklasse",
          "Ungültige Registrierungsdaten",
        ];
        return NextResponse.json(
          { ok: false, error: expected.find((value) => message.includes(value)) || "Anmeldung konnte nicht gespeichert werden." },
          { status: 400 }
        );
      }
      registrationId = newId;
    } else {
      // Der bestehende historische Pfad bleibt unverändert.
      const { data, error } = await supabase
        .from("registrations")
        .insert([{
          tournament_id, holes, first_name, last_name, email, phone, hcp,
          birthdate, home_club, coach, walkup_song, caddie, wagr,
          college_interest, nation, gender, player_pin,
        }])
        .select("id, player_pin")
        .single();
      if (error || !data) {
        return NextResponse.json({ ok: false, error: error?.message || "Anmeldung fehlgeschlagen." }, { status: 400 });
      }
      registrationId = data.id;
    }

    // Mail senden (nach erfolgreichem Insert)
 const baseUrl = getBaseUrl(req);

let emailSent = false;

try {
  if (tournamentStart < "2027-01-01") {
  await sendRegistrationEmail({
    to: email!,
    tournamentName: String(tRow?.name ?? "PRO1PUTT"),
    playerName: [first_name, last_name].filter(Boolean).join(" ").trim() || "Player",
    divisionName: null,
    pin: String(player_pin),
    pinUrl: `${baseUrl}/pin`,
    leaderboardUrl: `${baseUrl}/leaderboard`,
  });

  emailSent = true;
  } else {
    try {
      await sendPaymentRegistrationConfirmation(registrationId);
      emailSent = true;
    } catch (paymentMailError) {
      console.error(
        "[registration/payment-email]",
        paymentMailError
      );
    }
  }
} catch (mailError) {
  console.error("Registration saved, but confirmation email failed:", mailError);
}

    return NextResponse.json({
      ok: true,
      id: registrationId,
      player_pin: tournamentStart < "2027-01-01" ? player_pin : null,
      paypal_url: tournamentStart < "2027-01-01" ? paypal_url || null : null,
      payment_token: paymentToken,
      email_sent: emailSent,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}