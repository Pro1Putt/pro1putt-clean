"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOURNAMENT_SLUGS: Record<string, string> = {
  "7716349a-8bb0-46c6-b60c-3594eb7ea60f": "winston-open",
  "d4a92ae2-6ecd-4043-8b5a-82414c597036": "bad-saarow",
  "36d5df41-5864-4103-b413-169bbd683077": "green-eagle",
};

const TOURNAMENT_IMAGES: Record<string, string> = {
  "winston-open": "/gallery/IMG_2484.jpeg",
  "bad-saarow": "/gallery/IMG_2510.jpeg",
  "green-eagle": "/gallery/IMG_2550.jpeg",
};

const TOURNAMENT_META: Record<string, { dateLabel: string; subtitle: string }> = {
  "winston-open": { dateLabel: "30.03. – 01.04.2026", subtitle: "WINSTONopen · Abgeschlossen" },
  "bad-saarow":   { dateLabel: "25. – 27.09.2026",   subtitle: "Bad Saarow Faldo Course" },
  "green-eagle":  { dateLabel: "02. – 04.10.2026",   subtitle: "Green Eagle North Course" },
};

type Tournament = {
  id: string;
  name: string;
  start_date: string;
  course_name: string;
};

export default function LeaderboardOverviewPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tournaments?select=id,name,start_date,course_name&order=start_date.desc`,
        { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}` } }
      );
      const data = await res.json();
      setTournaments((data || []).filter((t: any) => TOURNAMENT_SLUGS[t.id]));
      setLoading(false);
    };
    load();
  }, []);

  const getSlug = (id: string) => TOURNAMENT_SLUGS[id] || "";
  const getMeta = (id: string) => TOURNAMENT_META[getSlug(id)] || { dateLabel: "", subtitle: "" };

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, rgba(20,122,82,0.10), transparent 30%), #f6f7ef",
      padding: "65px 20px 100px",
      fontFamily: "Lato, sans-serif",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 30 }}>

        {/* Hero */}
        <section style={{
          borderRadius: 28,
          padding: "clamp(30px, 6vw, 65px)",
          background: "linear-gradient(135deg, #092b1c 0%, #083923 52%, #176b42 100%)",
          color: "#ffffff",
          boxShadow: "0 18px 40px rgba(7,40,27,0.18)",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 999,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.16)",
            fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
            marginBottom: 16,
          }}>
            PRO1PUTT Official Results
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: "clamp(38px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>
            THE LEADERBOARD.
          </h1>
          <p style={{ margin: 0, fontSize: 16, opacity: 0.9, maxWidth: 600 }}>
            Every shot counts. Entdecke die offiziellen Ergebnisse unserer PRO1PUTT-Turniere.
          </p>
        </section>

        {/* Turniere */}
        <div style={{ display: "grid", gap: 16 }}>
          {loading ? (
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, textAlign: "center", color: "#617469" }}>
              Lade Turniere...
            </div>
          ) : tournaments.map((t) => {
            const slug = getSlug(t.id);
            const meta = getMeta(t.id);
            const isFinished = slug === "winston-open" || slug === "bad-saarow" || slug === "green-eagle";

            return (
              <div
                key={t.id}
                onClick={() => router.push(`/leaderboard/${slug}`)}
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(11,93,59,0.08)",
                  borderRadius: 22,
                  padding: "clamp(20px, 3vw, 32px)",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(8,33,22,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                  gap: 16,
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(8,33,22,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(8,33,22,0.06)")}
              >
                <div
                  style={{
                    width: "clamp(150px, 27%, 270px)",
                    alignSelf: "stretch",
                    minHeight: 170,
                    flexShrink: 0,
                    borderRadius: 16,
                    backgroundImage: `url(${TOURNAMENT_IMAGES[slug]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  aria-hidden="true"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Status Badge */}
                  <div style={{ marginBottom: 10 }}>
                    {isFinished ? (
                      <span style={{
                        background: "#e4f6da", color: "#092b1c",
                        padding: "4px 12px", borderRadius: 999,
                        fontSize: 12, fontWeight: 800,
                      }}>✓ Abgeschlossen</span>
                    ) : (
                      <span style={{
                        background: "#fff3e0", color: "#e65100",
                        padding: "4px 12px", borderRadius: 999,
                        fontSize: 12, fontWeight: 800,
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e65100", display: "inline-block" }} />
                        Live Scoring (optional)
                      </span>
                    )}
                  </div>

                  <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "#092b1c" }}>
                    {t.name}
                  </h2>
                  <p style={{ margin: "0 0 4px", fontSize: 14, color: "#617469" }}>{meta.subtitle}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#999" }}>📅 {meta.dateLabel}</p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    flexShrink: 0,
                  }}
                >
                  {!isFinished && (
                    <a
                      href={`/public/startliste/${t.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: "#ffffff",
                        color: "#092b1c",
                        border: "2px solid #092b1c",
                        borderRadius: 14,
                        padding: "10px 18px",
                        fontWeight: 800,
                        fontSize: 14,
                        whiteSpace: "nowrap",
                        textDecoration: "none",
                      }}
                    >
                      Startliste →
                    </a>
                  )}

                  <div
                    style={{
                      background: "linear-gradient(135deg, #092b1c, #083923)",
                      color: "#fff",
                      borderRadius: 14,
                      padding: "12px 20px",
                      fontWeight: 800,
                      fontSize: 14,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Leaderboard →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
