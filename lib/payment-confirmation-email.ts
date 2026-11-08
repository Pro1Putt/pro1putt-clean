import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { sendPaidRegistrationEmail } from "@/lib/paid-registration-email";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase-Konfiguration fehlt.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function sendPaidRegistrationConfirmation(
  registrationId: string
): Promise<boolean> {
  const db = getAdmin();

  const { data: registration, error } = await db
    .from("registrations")
    .select(
      "id,tournament_id,first_name,last_name,email,player_pin,email_language,payment_status,paypal_capture_id,payment_confirmation_email_sent_at"
    )
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    throw new Error("Anmeldung nicht gefunden.");
  }

  if (
    registration.payment_status !== "paid" ||
    !registration.paypal_capture_id
  ) {
    return false;
  }

  if (registration.payment_confirmation_email_sent_at) {
    return true;
  }

  if (!registration.email || !registration.player_pin) {
    throw new Error("E-Mail-Adresse oder Scoring-PIN fehlt.");
  }

  const { data: tournament, error: tournamentError } = await db
    .from("tournaments")
    .select("id,name")
    .eq("id", registration.tournament_id)
    .single();

  if (tournamentError || !tournament) {
    throw new Error("Turnier nicht gefunden.");
  }

  const lockId = randomUUID();

  const { data: reserved, error: reserveError } = await db.rpc(
    "pro1putt_reserve_confirmation_email",
    {
      p_registration_id: registrationId,
      p_lock_id: lockId,
    }
  );

  if (reserveError || reserved !== true) {
    return false;
  }

  const siteUrl =
    process.env.PRO1PUTT_SITE_URL || "http://localhost:3000";

  // Bei unbekanntem Versandstatus bleibt die Sperre bestehen.
  // So vermeiden wir unbeabsichtigte doppelte E-Mails.
  const result = await sendPaidRegistrationEmail({
    to: registration.email,
    tournamentName: tournament.name,
    playerName:
      [registration.first_name, registration.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Player",
    pin: String(registration.player_pin),
    language: registration.email_language === "de" ? "de" : "en",
    pinUrl: `${siteUrl}/pin`,
    leaderboardUrl: `${siteUrl}/leaderboard`,
  });

  if (!result.ok) {
    // Kein API-Key: Der Mailer hat ausdrücklich nicht versendet.
    if ("skipped" in result && result.skipped === true) {
      await db.rpc("pro1putt_complete_confirmation_email", {
        p_registration_id: registrationId,
        p_lock_id: lockId,
        p_sent: false,
      });
    }

    return false;
  }

  // Resend-Antwort auf einen tatsächlichen API-Fehler prüfen.
  const response = result.res as {
    data?: { id?: string } | null;
    error?: unknown;
  };

  if (response.error || !response.data?.id) {
    // Unklarer Versandstatus: Sperre zur Prüfung behalten.
    throw new Error(
      "E-Mail-Versandstatus unklar. Manuelle Prüfung erforderlich."
    );
  }

  const { data: completed, error: completeError } = await db.rpc(
    "pro1putt_complete_confirmation_email",
    {
      p_registration_id: registrationId,
      p_lock_id: lockId,
      p_sent: true,
    }
  );

  if (completeError || completed !== true) {
    throw new Error(
      "E-Mail angenommen, aber Versandstatus konnte nicht gespeichert werden."
    );
  }

  return true;
}
