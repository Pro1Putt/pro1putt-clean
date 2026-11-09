"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./tour.module.css";

const ARCHIVE = [
  { title: "WINSTONopen", date: "30.03. – 01.04.2026", href: "/leaderboard/winston-open", location: "WINSTONgolf", photo: "/gallery/IMG_2484.jpeg" },
  { title: "Open Faldo Course Bad Saarow", date: "25. – 27.09.2026", href: "/leaderboard/bad-saarow", location: "Bad Saarow", photo: "/gallery/IMG_2510.jpeg" },
  { title: "Open Finals – Green Eagle", date: "02. – 04.10.2026", href: "/leaderboard/green-eagle", location: "Green Eagle", photo: "/gallery/IMG_2550.jpeg" },
];

type Tournament = {
  id: string; name: string; start_date: string; end_date: string | null;
  course_name: string | null; location: string | null; registration_open: boolean;
  count: number; girls: number; boys: number;
  divisions: { label: string; count: number }[];
};

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
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}><span className={styles.eyebrowLine} /> PRO1PUTT JUNIOR GOLF TOUR</div>
            <h1 className={styles.heroTitle}>THE TOUR.<br /><span>THE PLAYERS.</span><br />THE RESULTS.</h1>
            <p className={styles.heroSubtitle}>The new season starts here. Explore the 2027 tournaments, current registrations and all official results from 2026.</p>
          </div>
          <div className={styles.heroSide}><span>EST. PRO1PUTT</span><span>2027 SEASON</span></div>
        </header>

        <section className={styles.content}>
          <div className={styles.sectionTop}>
            <div><div className={styles.kicker}>TOURNAMENT CENTER</div><h2 className={styles.sectionHeading}>Players <span>&</span> Results</h2></div>
            <div className={styles.seasonSwitcher} role="group" aria-label="Select season">
              <button type="button" className={`${styles.seasonButton} ${season === 2027 ? styles.active : ""}`} onClick={() => setSeason(2027)} aria-pressed={season === 2027}><span className={styles.seasonYear}>2027</span><span className={styles.seasonDetail}>Current Season</span></button>
              <button type="button" className={`${styles.seasonButton} ${season === 2026 ? styles.active : ""}`} onClick={() => setSeason(2026)} aria-pressed={season === 2026}><span className={styles.seasonYear}>2026</span><span className={styles.seasonDetail}>Results Archive</span></button>
            </div>
          </div>

          {season === 2027 ? (
            <section aria-label="2027 tournaments" className={styles.tournamentList}>
              <div className={styles.listIntro}><span><span className={styles.liveDot} /> SEASON 2027</span><span>{!loading && !error ? `${tournaments.length} TOURNAMENTS` : "CURRENT REGISTRATIONS"}</span></div>
              {loading && <div className={styles.message}>Loading tournaments …</div>}
              {error && !loading && <div className={styles.message}>Registration numbers are currently unavailable. Please try again later.</div>}
              {!loading && !error && tournaments.length === 0 && <div className={styles.message}>No tournaments have been published for 2027 yet.</div>}
              {!loading && !error && tournaments.map((t, index) => (
                <article key={t.id} className={styles.tournamentCard}>
                  <div className={styles.tournamentVisual} aria-hidden="true"><span className={styles.visualIndex}>{String(index + 1).padStart(2, "0")}</span><span className={styles.visualText}>PRO1PUTT<br />TOUR 2027</span></div>
                  <div className={styles.tournamentBody}>
                    <div className={styles.cardTop}><span className={`${styles.status} ${t.registration_open ? styles.open : ""}`}><span className={styles.statusDot} />{t.registration_open ? "REGISTRATION OPEN" : "TOUR 2027"}</span><span className={styles.cardDate}>{dateLabel(t.start_date, t.end_date)}</span></div>
                    <h3 className={styles.tournamentTitle}>{t.name}</h3>
                    <p className={styles.venue}>{t.course_name || t.location || "PRO1PUTT Junior Golf Tour"}</p>
                    <div className={styles.cardBottom}>
                      <div className={styles.countBlock}><strong>{t.count}</strong><span>REGISTERED</span></div>
                      <div className={styles.breakdown}><span>GIRLS <strong>{t.girls}</strong></span><span>BOYS <strong>{t.boys}</strong></span></div>
                      {t.registration_open && <Link className={styles.primaryLink} href="/register">REGISTER NOW <span aria-hidden="true">↗</span></Link>}
                    </div>
                    {t.divisions.some(d => d.count > 0) && <div className={styles.divisions}>{t.divisions.filter(d => d.count > 0).map(d => <span key={d.label}>{d.label} <strong>{d.count}</strong></span>)}</div>}
                  </div>
                </article>
              ))}
              <p className={styles.privacyNote}>Registration numbers are updated automatically. See who's already signed up for the tournament!</p>
            </section>
          ) : (
            <section aria-label="2026 results" className={styles.tournamentList}>
              <div className={styles.listIntro}><span>SEASON 2026 · ARCHIVE</span><span>{ARCHIVE.length} TOURNAMENTS</span></div>
              {ARCHIVE.map((t, index) => <Link key={t.href} href={t.href} className={styles.archiveCard}>
                <div className={styles.archiveImage} style={{ backgroundImage: `linear-gradient(0deg, rgba(3,31,19,.2), rgba(3,31,19,.2)), url("${t.photo}")` }}><span>{String(index + 1).padStart(2, "0")}</span></div>
                <div className={styles.archiveInfo}><div className={styles.archiveLabel}>OFFICIAL RESULTS · 2026</div><h3>{t.title}</h3><p>{t.date} <span>·</span> {t.location}</p></div>
                <span className={styles.archiveAction}>LEADERBOARD <span aria-hidden="true">↗</span></span>
              </Link>)}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
