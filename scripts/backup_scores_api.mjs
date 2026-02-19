import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error("Missing env: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n") + "\n";
}

const OUT_DIR = path.join(process.cwd(), "backups", "supabase");
fs.mkdirSync(OUT_DIR, { recursive: true });

const stamp = ts();
const jsonFile = path.join(OUT_DIR, `scores_${stamp}.json`);
const csvFile = path.join(OUT_DIR, `scores_${stamp}.csv`);

const PAGE = 1000;
let from = 0;
let all = [];

while (true) {
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("updated_at", { ascending: true, nullsFirst: false })
    .range(from, from + PAGE - 1);

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  all = all.concat(rows);

  if (rows.length < PAGE) break;
  from += PAGE;
}

fs.writeFileSync(jsonFile, JSON.stringify(all, null, 2), "utf8");
fs.writeFileSync(csvFile, toCSV(all), "utf8");

console.log(`Saved ${all.length} rows:`);
console.log(jsonFile);
console.log(csvFile);
