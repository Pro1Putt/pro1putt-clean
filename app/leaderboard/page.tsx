"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  hcp: number;
  nation: string;
  holes: number;
  gender: "Boys" | "Girls";
  age_group: "U8" | "U10" | "U12" | "U14" | "U16" | "U18" | "U21";
};

type FilterKey = "ALL_U12" | "ALL_U21" | string; // dynamic keys like "Girls-U14"

const AGE_ORDER: Record<string, number> = { U8: 1, U10: 2, U12: 3, U14: 4, U16: 5, U18: 6, U21: 7 };

function flagEmoji(iso2: string) {
  const code = (iso2 || "").trim().toUpperCase();
  if (code.length !== 2) return "";
  const A = 0x1f1e6;
  const a = "A".charCodeAt(0);
  return String.fromCodePoint(code.charCodeAt(0) - a + A) + String.fromCodePoint(code.charCodeAt(1) - a + A);
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

export default function LeaderboardPage() {
    function renderRow(r: any, idx: number) {
  const displayRank = idx + 1;

  return (
    <div
      key={r.id}
      style={{
        display: "grid",
        gridTemplateColumns: "70px 70px 1.6fr 110px 90px 90px 90px 110px 80px",
        padding: "12px 14px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        alignItems: "center",
        fontSize: 14,
      }}
    >
      <div style={{ fontWeight: 900, color: "#1e4620" }}>{displayRank}</div>
      <div style={{ fontSize: 16 }}>{medal(displayRank)}</div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>{flagEmoji(r.nation)}</span>
        <span style={{ fontWeight: 800 }}>
          {r.first_name} {r.last_name}
        </span>
        <span style={{ fontSize: 12, opacity: 0.6 }}>
          • {r.gender} • {r.age_group} • {r.holes}L
        </span>
      </div>

      <div style={{ opacity: 0.7 }}>-</div>
      <div style={{ opacity: 0.7 }}>-</div>
      <div style={{ opacity: 0.7 }}>-</div>
      <div style={{ opacity: 0.7 }}>-</div>
      <div style={{ opacity: 0.7 }}>-</div>

      <div style={{ fontWeight: 800 }}>
  {Number(r.hcp).toFixed(1)}
  <div style={{ fontSize: 12, opacity: 0.6 }}>
    {r.home_club}
  </div>
</div>
    </div>
  );
}
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<FilterKey>("ALL_U21");


  // 👉 HIER deine echte Turnier-ID einsetzen
  const tournamentId = "7716349a-8bb0-46c6-b60c-3594eb7ea60f";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?tournamentId=${tournamentId}`);
        const json = await res.json();
        if (!cancelled) setRows(json.ok ? (json.rows as Row[]) : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  const tabs = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.gender === "Boys" || r.gender === "Girls") {
  set.add(`${r.gender}-${r.age_group}`);
}
    }

    // Sort: Boys then Girls, and by age
    const arr = Array.from(set).sort((a, b) => {
      const [ga, aa] = a.split("-");
      const [gb, ab] = b.split("-");
      if (ga !== gb) return ga === "Boys" ? -1 : 1;
      return (AGE_ORDER[aa] ?? 999) - (AGE_ORDER[ab] ?? 999);
    });

    return arr;
  }, [rows]);

  const split = useMemo(() => {
  // Default: alles in einer Liste (für die Klassentabs)
  let list = rows;

  if (active === "ALL_U12") list = rows.filter((r) => r.holes === 9);
  if (active === "ALL_U21") list = rows.filter((r) => r.holes === 18);

  // Klassentab: "Boys-U14" etc.
  if (!active.startsWith("ALL_")) {
    const [g, ag] = String(active).split("-");
    if (g === "Boys" || g === "Girls") {
      list = rows.filter((r) => r.gender === g && r.age_group === ag);
    }
  }

  const boys = list.filter((r) => r.gender === "Boys");
  const girls = list.filter((r) => r.gender === "Girls");

  return { list, boys, girls };
}, [rows, active]);

  function Tab({ k, label }: { k: FilterKey; label: string }) {
    const selected = active === k;
    return (
      <button
        type="button"
        onClick={() => setActive(k)}
        style={{
          padding: "10px 14px",
          borderRadius: 999,
          border: selected ? "2px solid #1e4620" : "1px solid rgba(0,0,0,0.12)",
          background: selected ? "#e9f5ec" : "#ffffff",
          color: "#1e4620",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto" }}>
      {/* Header with logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 140, height: 40, position: "relative" }}>
          {/* Lege dein Logo als Datei an: public/pro1putt-logo.png */}
         <img
  src="https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png"
  alt="PRO1PUTT"
  style={{ height: 40, width: "auto", display: "block" }}
/>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1e4620", margin: 0 }}>
          Leaderboard
        </h1>
      </div>

      {/* Tabs */}
     <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
  <Tab k="ALL_U21" label="Allover • U21 (18 Loch)" />
  <Tab k="ALL_U12" label="Allover • U12 (9 Loch)" />
</div>

      {/* Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "70px 70px 1.6fr 110px 90px 90px 90px 110px 80px",
            padding: "12px 14px",
            fontWeight: 900,
            color: "#1e4620",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            background: "#f5f7f5",
            fontSize: 13,
          }}
        >
          <div>Rank</div>
          <div>Med.</div>
          <div>Name</div>
          <div>Score</div>
          <div>Thru</div>
          <div>To Par</div>
          <div>Flight</div>
          <div>Start</div>
          <div>HCP</div>
        </div>

        {loading && <div style={{ padding: 16, opacity: 0.7 }}>Lade Daten…</div>}

        {!loading && split.list.length === 0 && (
          <div style={{ padding: 16, opacity: 0.7 }}>Keine Spieler in dieser Ansicht.</div>
        )}

        {!loading && split.list.length === 0 && (
  <div style={{ padding: 16, opacity: 0.7 }}>
    Keine Spieler in dieser Ansicht.
  </div>
)}

{!loading && active.startsWith("ALL_") && (() => {
  const wanted =
    active === "ALL_U12" ? ["U8", "U10", "U12"] : ["U14", "U16", "U18", "U21"];

  const groupByAge = (list: any[]) => {
    const map = new Map<string, any[]>();
    for (const r of list) {
      const k = String(r.age_group || "").toUpperCase();
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    // nur gewünschte Reihenfolge + nur wenn Spieler vorhanden
    return wanted
      .map((ag) => ({ ag, list: map.get(ag) || [] }))
      .filter((g) => g.list.length > 0);
  };

  const boysGroups = groupByAge(split.boys);
  const girlsGroups = groupByAge(split.girls);

  const sectionTitle = (t: string) => (
    <div style={{ padding: "10px 14px", fontWeight: 900, color: "#1e4620" }}>{t}</div>
  );

  return (
    <>
      {sectionTitle("Boys • Allover")}
      {split.boys.map((r, idx) => renderRow(r, idx))}

      {boysGroups.map((g) => (
        <div key={`boys-${g.ag}`}>
          {sectionTitle(`Boys • ${g.ag}`)}
          {g.list.map((r, idx) => renderRow(r, idx))}
        </div>
      ))}

      {sectionTitle("Girls • Allover")}
      {split.girls.map((r, idx) => renderRow(r, idx))}

      {girlsGroups.map((g) => (
        <div key={`girls-${g.ag}`}>
          {sectionTitle(`Girls • ${g.ag}`)}
          {g.list.map((r, idx) => renderRow(r, idx))}
        </div>
      ))}
    </>
  );
})()}

{!loading && !active.startsWith("ALL_") &&
  split.list.map((r, idx) => renderRow(r, idx))}
      </div>
    </div>
  );
}