"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ARCHIVE = [
  { title: "WINSTONopen", date: "30.03. – 01.04.2026", href: "/leaderboard/winston-open", location: "WINSTONgolf" },
  { title: "Open Faldo Course Bad Saarow", date: "25. – 27.09.2026", href: "/leaderboard/bad-saarow", location: "Bad Saarow" },
  { title: "Open Finals – Green Eagle", date: "02. – 04.10.2026", href: "/leaderboard/green-eagle", location: "Green Eagle" },
];

type Tournament = {
  id: string; name: string; start_date: string; end_date: string | null;
  course_name: string | null; location: string | null; registration_open: boolean;
  count: number; girls: number; boys: number;
  divisions: { label: string; count: number }[];
};

const green = "#0b5d3b";
const card: React.CSSProperties = { background: "#fff", borderRadius: 20, padding: "clamp(20px,3vw,30px)", border: "1px solid #e4ece7", boxShadow: "0 4px 16px rgba(8,33,22,.05)" };

function dateLabel(start: string, end: string | null) {
  const fmt = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  return end && end.slice(0, 10) !== start.slice(0, 10) ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

export default function LeaderboardOverviewPage() {
  const [season, setSeason] = useState<2027 | 2026>(2027);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/public/tour-overview", { cache: "no-store" })
      .then(async res => { if (!res.ok) throw new Error("fetch failed"); return res.json(); })
      .then(data => { if (mounted) { setTournaments(data.tournaments || []); setError(!data.ok); } })
      .catch(() => { if (mounted) setError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7f5", padding: "36px 16px 80px", fontFamily: "Lato, sans-serif" }}>
      <div style={{ maxWidth: 1050, margin: "auto" }}>
        <header style={{ background: "linear-gradient(120deg,#092b1c,#146b44)", borderRadius: 28, color: "white", padding: "clamp(30px,5vw,58px)", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, opacity: .8, marginBottom: 12 }}>PRO1PUTT TOUR</div>
          <h1 style={{ fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.08, margin: "0 0 14px", fontWeight: 900 }}>Teilnehmer & Ergebnisse</h1>
          <p style={{ fontSize: 17, opacity: .9, margin: 0 }}>Entdecke die Turniere der Saison 2027 und die offiziellen Ergebnisse aus 2026.</p>
        </header>
        <nav aria-label="Saison auswählen" style={{ display: "flex", gap: 10, marginBottom: 25 }}>
          {([2027, 2026] as const).map(year => (
            <button key={year} onClick={() => setSeason(year)} aria-pressed={season === year} style={{ padding: "12px 28px", borderRadius: 999, border: `1px solid ${green}`, background: season === year ? green : "white", color: season === year ? "white" : green, fontWeight: 800, cursor: "pointer", fontSize: 15 }}>
              {year === 2027 ? "2027 · Aktuelle Saison" : "2026 · Ergebnisse"}
            </button>
          ))}
        </nav>
        {season === 2027 ? (
          <section aria-label="Turniere 2027" style={{ display: "grid", gap: 16 }}>
            {loading && <div style={card}>Turniere werden geladen …</div>}
            {error && !loading && <div style={card}>Die Teilnehmerzahlen können momentan nicht geladen werden. Bitte versuche es später erneut.</div>}
            {!loading && !error && tournaments.length === 0 && <div style={card}>Für 2027 sind noch keine Turniere veröffentlicht.</div>}
            {!loading && !error && tournaments.map(t => (
              <article key={t.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
                  <div>
                    <div style={{ color: green, fontWeight: 800, fontSize: 12, marginBottom: 8 }}>{t.registration_open ? "ANMELDUNG GEÖFFNET" : "TOUR 2027"}</div>
                    <h2 style={{ fontSize: 23, margin: "0 0 8px", color: "#17362b" }}>{t.name}</h2>
                    <p style={{ color: "#60776b", margin: 0 }}>{dateLabel(t.start_date, t.end_date)}{t.course_name || t.location ? ` · ${t.course_name || t.location}` : ""}</p>
                  </div>
                  <div style={{ textAlign: "center", background: "#e8f5ee", borderRadius: 16, padding: "12px 22px", minWidth: 110 }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: green }}>{t.count}</div>
                    <div style={{ color: green, fontSize: 12, fontWeight: 700 }}>Anmeldungen</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
                  <span style={{ background: "#f1f5f2", padding: "8px 13px", borderRadius: 10, fontWeight: 700, color: "#17362b" }}>Girls: {t.girls}</span>
                  <span style={{ background: "#f1f5f2", padding: "8px 13px", borderRadius: 10, fontWeight: 700, color: "#17362b" }}>Boys: {t.boys}</span>
                  {t.divisions.filter(d => d.count > 0).map(d => <span key={d.label} style={{ background: "#f1f5f2", padding: "8px 13px", borderRadius: 10, color: "#17362b" }}>{d.label}: {d.count}</span>)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 22 }}>
                  {t.registration_open && <Link href="/register" style={{ display: "inline-block", background: green, color: "white", borderRadius: 12, padding: "12px 19px", fontWeight: 800, textDecoration: "none" }}>Jetzt anmelden →</Link>}
                  <span style={{ fontSize: 12, color: "#73867b" }}>Namen werden erst nach ausdrücklicher Freigabe veröffentlicht.</span>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section aria-label="Ergebnisse 2026" style={{ display: "grid", gap: 15 }}>
            {ARCHIVE.map(t => <Link key={t.href} href={t.href} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, textDecoration: "none" }}>
              <div><div style={{ fontSize: 12, fontWeight: 800, color: green, marginBottom: 7 }}>OFFIZIELLE ERGEBNISSE</div><h2 style={{ margin: "0 0 7px", color: "#17362b", fontSize: 21 }}>{t.title}</h2><div style={{ color: "#60776b" }}>{t.date} · {t.location}</div></div>
              <span style={{ color: green, fontWeight: 900, whiteSpace: "nowrap" }}>Leaderboard →</span>
            </Link>)}
          </section>
        )}
      </div>
    </main>
  );
}
