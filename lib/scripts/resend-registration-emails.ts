import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { sendRegistrationEmail } from "../mailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt in .env.local");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const { data, error } = await supabase
    .from("registrations")
    .select(`
      email,
      first_name,
      last_name,
      player_pin,
      tournament_id,
      tournaments (
        name
      )
    `);

  if (error) {
    console.error(error);
    return;
  }

  for (const r of data ?? []) {
 

    const email = String(r.email ?? "").trim();
    const pin = String(r.player_pin ?? "").trim();

    if (!email || !pin) continue;

    const playerName = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();

    const tournamentName =
      Array.isArray(r.tournaments)
        ? String(r.tournaments[0]?.name ?? "").trim()
        : String((r.tournaments as { name?: string } | null)?.name ?? "").trim();

    await sendRegistrationEmail({
      to: email,
      playerName,
      tournamentName: tournamentName || "PRO1PUTT Tournament",
      pin,
      pinUrl: "https://pro1putt.com/pin",
      leaderboardUrl: "https://pro1putt.com/leaderboard",
    });

    console.log(`Mail erneut gesendet an ${email} | PIN ${pin} | Turnier: ${tournamentName}`);
  }

  console.log("Alle Mails erneut versendet.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});