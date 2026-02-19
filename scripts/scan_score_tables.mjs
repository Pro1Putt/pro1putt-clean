import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\n/);
  for (let line of lines) {
    line = line.replace(/\r$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    process.env[key] = val;
  }
}

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const candidates = [
  // wahrscheinlich bei euch:
  "scores",
  "rounds",
  "round_scores",
  "hole_scores",
  "strokes",
  "score_entries",
  "scorecard_entries",
  "scorecards",
  "leaderboard",
  "leaderboard_rows",

  // eure app-tables (typisch pro1putt):
  "tournaments",
  "divisions",
  "players",
  "registrations",
];

for (const t of candidates) {
  const { error, count } = await supabase
    .from(t)
    .select("*", { count: "exact", head: true });

  if (!error) console.log(`${t}: ${count}`);
}
