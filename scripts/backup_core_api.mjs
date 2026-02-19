import fs from "fs";
import path from "path";
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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) val = val.slice(1, -1);
    process.env[key] = val;
  }
}
loadEnvFile(".env.local");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

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

async function dumpTable(table) {
  const PAGE = 1000;
  let from = 0;
  let all = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);

    if (error) return { table, ok: false, error: error.message };

    const rows = data ?? [];
    all = all.concat(rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }

  const stamp = ts();
  const outDir = path.join(process.cwd(), "backups", "supabase", table);
  fs.mkdirSync(outDir, { recursive: true });

  const jsonFile = path.join(outDir, `${table}_${stamp}.json`);
  const csvFile = path.join(outDir, `${table}_${stamp}.csv`);

  fs.writeFileSync(jsonFile, JSON.stringify(all, null, 2), "utf8");
  fs.writeFileSync(csvFile, toCSV(all), "utf8");

  // 🔁 Rotation: nur letzte 50 Snapshots behalten
  const files = fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith(`${table}_`))
    .sort()
    .reverse();

  const keep = 100; // 50 JSON + 50 CSV
  for (const f of files.slice(keep)) {
    try { fs.unlinkSync(path.join(outDir, f)); } catch {}
  }

  return { table, ok: true, rows: all.length };
}

async function getRestExposedTables() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`OpenAPI fetch failed: ${res.status}`);
  const spec = await res.json();

  const paths = spec?.paths || {};
  const tables = new Set();

  for (const p of Object.keys(paths)) {
    if (p === "/" || p.startsWith("/rpc/")) continue;
    const name = p.replace(/^\//, "").split("/")[0].trim();
    if (!name) continue;
    tables.add(name);
  }

  return Array.from(tables).sort();
}

const tables = await getRestExposedTables();

console.log(`Found ${tables.length} REST tables/views:`);
console.log(tables.join(", "));

for (const t of tables) {
  const res = await dumpTable(t);
  if (!res.ok) console.log(`❌ ${t}: ${res.error}`);
  else console.log(`✅ ${t}: ${res.rows} rows`);
}
