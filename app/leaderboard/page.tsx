"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Tournament = {
  id: string;
  name: string | null;
  start_date: string | null;
  location: string | null;
};

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  hcp: number | null;
  home_club: string | null;
  nation: string | null;
  holes: number;
  gender: "Boys" | "Girls";
  age_group: "U8" | "U10" | "U12" | "U14" | "U16" | "U18" | "U21";

  score: number | null;
  thru: number;
  to_par: number | null;
  flight_number: number | null;
  start_time: string | null;
};

type FilterKey = "ALL_U12" | "ALL_U21" | string;

const GREEN = "#1e4620";
const LOGO_URL =
  "https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png";

const AGE_ORDER: Record<string, number> = {
  U8: 1,
  U10: 2,
  U12: 3,
  U14: 4,
  U16: 5,
  U18: 6,
  U21: 7,
};

function flagEmoji(iso2: string | null | undefined) {
  const code = String(iso2 || "").trim().toUpperCase();
  if (code.length !== 2) return "";
  const A = 0x1f1e6;
  const a = "A".charCodeAt(0);
  return (
    String.fromCodePoint(code.charCodeAt(0) - a + A) +
    String.fromCodePoint(code.charCodeAt(1) - a + A)
  );
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtToPar(v: number | null | undefined) {
  if (v == null) return "–";
  if (v === 0) return "E";
  return v > 0 ? `+${v}` : `${v}`;
}

function fmtScore(score: number | null | undefined) {
  if (score == null) return "–";
  return String(score);
}

function fmtTournament(t: Tournament) {
  const parts = [
    t.name ?? "Turnier",
    t.start_date ? `• ${t.start_date}` : null,
    t.location ? `• ${t.location}` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

/** ✅ Wichtig: useSearchParams() ist jetzt NICHT mehr im Page-Root, sondern in diesem Inner-Component */
function LeaderboardInner() {
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

  const sp = useSearchParams();
  const tournamentIdFromUrl = (sp.get("tournamentId") || "").trim();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState<string>(tournamentIdFromUrl);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<FilterKey>("ALL_U21");

  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tournaments", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load tournaments");
        const list: Tournament[] = Array.isArray(json?.tournaments) ? json.tournaments : [];
        if (cancelled) return;

        const sorted = [...list].sort((a, b) => {
          const da = a.start_date || "9999-12-31";
          const db = b.start_date || "9999-12-31";
          return da.localeCompare(db);
        });

        setTournaments(sorted);

        if (!tournamentIdFromUrl && !tournamentId) {
          setTournamentId(sorted[0]?.id || "");
        }
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || "Load error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLeaderboard(tId: string) {
    if (!tId) {
      setRows([]);
      setLastUpdated(null);
      return;
    }

    setLoadErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?tournamentId=${encodeURIComponent(tId)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load leaderboard");
      const raw = Array.isArray(json?.rows) ? (json.rows as any[]) : [];

      const cleaned = raw.filter(
        (r) =>
          (r?.gender === "Boys" || r?.gender === "Girls") &&
          typeof r?.age_group === "string" &&
          r.age_group.length > 0
      );

      setRows(cleaned as Row[]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e: any) {
      setRows([]);
      setLoadErr(e?.message || "Load error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!tournamentId) return;
    loadLeaderboard(tournamentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  useEffect(() => {
  if (!tournamentId) return;

  const channel = supabase
    .channel(`scores-${tournamentId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "scores",
        filter: `tournament_id=eq.${tournamentId}`,
      },
      () => {
        loadLeaderboard(tournamentId);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [tournamentId]);

  const tabs = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if ((r.gender === "Boys" || r.gender === "Girls") && r.age_group) {
        set.add(`${r.gender}-${r.age_group}`);
      }
    }
    return Array.from(set).sort((a, b) => {
      const [ga, aa] = a.split("-");
      const [gb, ab] = b.split("-");
      if (ga !== gb) return ga === "Boys" ? -1 : 1;
      return (AGE_ORDER[aa] ?? 999) - (AGE_ORDER[ab] ?? 999);
    });
  }, [rows]);

  const split = useMemo(() => {
    let list = rows;

    if (active === "ALL_U12") list = rows.filter((r) => r.holes === 9);
    if (active === "ALL_U21") list = rows.filter((r) => r.holes === 18);

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
          border: selected ? `2px solid ${GREEN}` : "1px solid rgba(0,0,0,0.12)",
          background: selected ? "#e9f5ec" : "#ffffff",
          color: GREEN,
          fontWeight: 800,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    );
  }

  function renderRow(r: Row, idx: number) {
    const displayRank = idx + 1;
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;

    if (isMobile) {
  return (
    <div
      key={`${r.id}-${idx}`}
      style={{
        padding: "14px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 900, color: GREEN, fontSize: 18 }}>#{displayRank}</div>
          <div style={{ fontSize: 18 }}>{medal(displayRank)}</div>
        </div>

        <div
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            background: "rgba(30,70,32,0.12)",
            border: "1px solid rgba(30,70,32,0.25)",
            color: GREEN,
            fontWeight: 900,
            fontSize: 18,
          }}
        >
          {fmtScore(r.score)}
        </div>
      </div>

      <div style={{ fontWeight: 800 }}>
        {flagEmoji(r.nation)} {r.first_name} {r.last_name}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {r.gender} • {r.age_group} • {r.holes}L • HCP {r.hcp != null ? Number(r.hcp).toFixed(1) : "–"}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Thru {r.thru || "–"} • {fmtToPar(r.to_par)} • Flight {r.flight_number ?? "–"} • Start{" "}
        {fmtTime(r.start_time)}
      </div>

      {r.home_club ? (
        <div style={{ fontSize: 12, opacity: 0.6 }}>{r.home_club}</div>
      ) : null}
    </div>
  );
}
    return (
      <div
        key={`${r.id}-${idx}`}
        style={{
          display: "grid",
          gridTemplateColumns: "70px 70px 1.6fr 110px 90px 90px 90px 110px 120px",
          padding: "12px 14px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          alignItems: "center",
          fontSize: 14,
        }}
      >
        <div style={{ fontWeight: 900, color: GREEN }}>{displayRank}</div>
        <div style={{ fontSize: 16 }}>{medal(displayRank)}</div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <span style={{ fontSize: 18 }}>{flagEmoji(r.nation)}</span>
          <span
            style={{
              fontWeight: 800,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.first_name} {r.last_name}
          </span>
          <span style={{ fontSize: 12, opacity: 0.6, whiteSpace: "nowrap" }}>
            • {r.gender} • {r.age_group} • {r.holes}L
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <span
            style={{
              minWidth: 44,
              textAlign: "center",
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(30,70,32,0.10)",
              border: "1px solid rgba(30,70,32,0.25)",
              color: GREEN,
              fontWeight: 900,
              fontSize: 18,
              lineHeight: "20px",
              letterSpacing: 0.5,
            }}
          >
            {fmtScore(r.score)}
          </span>
        </div>

        <div style={{ opacity: 0.85 }}>{r.thru ? r.thru : "–"}</div>
        <div style={{ opacity: 0.85 }}>{fmtToPar(r.to_par)}</div>
        <div style={{ opacity: 0.85 }}>{r.flight_number ?? "–"}</div>
        <div style={{ opacity: 0.85 }}>{fmtTime(r.start_time)}</div>

        <div style={{ fontWeight: 800 }}>
          {r.hcp != null ? Number(r.hcp).toFixed(1) : "–"}
          <div
            style={{
              fontSize: 12,
              opacity: 0.6,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.home_club || ""}
          </div>
        </div>
      </div>
    );
  }

  const showDynamicTabs = tabs.length > 0;
  const alloverWanted = active === "ALL_U12" ? ["U8", "U10", "U12"] : ["U14", "U16", "U18", "U21"];

  function groupByAge(list: Row[]) {
    const map = new Map<string, Row[]>();
    for (const r of list) {
      const k = String(r.age_group || "").toUpperCase();
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return alloverWanted
      .map((ag) => ({ ag, list: map.get(ag) || [] }))
      .filter((g) => g.list.length > 0);
  }

  function SectionTitle({ title }: { title: string }) {
    return (
      <div style={{ padding: "10px 14px", fontWeight: 900, color: GREEN, background: "#ffffff" }}>
        {title}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 14px" }}>
      <style>{`
  /* MOBILE: Tabelle nicht abschneiden, sondern horizontal scrollen */
  .p1-lb-tablewrap {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Der Grid-"Table"-Block bekommt eine Mindestbreite, damit er nicht gequetscht wird */
  .p1-lb-minw {
    min-width: 860px;
  }

  @media (max-width: 420px) {
    .p1-lb-minw { min-width: 820px; }
  }
`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <img src={LOGO_URL} alt="PRO1PUTT" style={{ height: 40, width: "auto", display: "block" }} />

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: GREEN, margin: 0 }}>Leaderboard</h1>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
  {lastUpdated ? `Live · zuletzt aktualisiert ${lastUpdated}` : "Live"}
</div>
        </div>

        <button
          type="button"
          onClick={() => loadLeaderboard(tournamentId)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#ffffff",
            color: GREEN,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.08)",
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 900, color: GREEN, marginBottom: 6 }}>Turnier</div>
        <select
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            outline: "none",
          }}
        >
          <option value="" disabled>
            Bitte wählen…
          </option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {fmtTournament(t)}
            </option>
          ))}
        </select>

        {loadErr && (
          <div
            style={{
              marginTop: 10,
              background: "#fff0f0",
              border: "1px solid rgba(220,0,0,0.22)",
              color: "crimson",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            Fehler: {loadErr}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, marginBottom: 12 }}>
        <Tab k="ALL_U21" label="Allover • U21 (18 Loch)" />
        <Tab k="ALL_U12" label="Allover • U12 (9 Loch)" />

        {showDynamicTabs && (
          <div
            style={{
              width: "100%",
              height: 0,
              borderTop: "1px dashed rgba(0,0,0,0.12)",
              margin: "8px 0",
            }}
          />
        )}

        {showDynamicTabs &&
          tabs.map((k) => (
            <Tab
              key={k}
              k={k}
              label={k.replace("Boys-", "Boys • ").replace("Girls-", "Girls • ")}
            />
          ))}
      </div>

     <div
  style={{
    background: "#ffffff",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    overflow: "hidden",
  }}
>
  <div className="p1-lb-tablewrap">
    <div className="p1-lb-minw">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "70px 70px 1.6fr 110px 90px 90px 90px 110px 120px",
            padding: "12px 14px",
            fontWeight: 900,
            color: GREEN,
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
  </div>
</div>

        {loading && <div style={{ padding: 16, opacity: 0.7 }}>Lade Daten…</div>}

        {!loading && split.list.length === 0 && (
          <div style={{ padding: 16, opacity: 0.7 }}>Keine Spieler in dieser Ansicht.</div>
        )}

        {!loading && split.list.length > 0 && active.startsWith("ALL_") && (() => {
          const boysGroups = groupByAge(split.boys);
          const girlsGroups = groupByAge(split.girls);

          return (
            <>
              <SectionTitle title="Boys • Allover" />
              {split.boys.map((r, idx) => renderRow(r, idx))}

              {boysGroups.map((g) => (
                <div key={`boys-${g.ag}`}>
                  <SectionTitle title={`Boys • ${g.ag}`} />
                  {g.list.map((r, idx) => renderRow(r, idx))}
                </div>
              ))}

              <SectionTitle title="Girls • Allover" />
              {split.girls.map((r, idx) => renderRow(r, idx))}

              {girlsGroups.map((g) => (
                <div key={`girls-${g.ag}`}>
                  <SectionTitle title={`Girls • ${g.ag}`} />
                  {g.list.map((r, idx) => renderRow(r, idx))}
                </div>
              ))}
            </>
          );
        })()}

        {!loading && split.list.length > 0 && !active.startsWith("ALL_") &&
          split.list.map((r, idx) => renderRow(r, idx))}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, opacity: 0.7 }}>Lade Leaderboard…</div>}>
      <LeaderboardInner />
    </Suspense>
  );
}