"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOURNAMENT_SLUGS: Record<string, string> = {
  "7716349a-8bb0-46c6-b60c-3594eb7ea60f": "winston-open",
  "d4a92ae2-6ecd-4043-8b5a-82414c597036": "bad-saarow",
  "36d5df41-5864-4103-b413-169bbd683077": "green-eagle",
  "e9b23d74-ab9d-4ba5-86bf-744915e1ee28": "test",
};

const TOURNAMENT_META: Record<string, { dateLabel: string; subtitle: string }> = {
  "winston-open": { dateLabel: "30.03. – 01.04.2026", subtitle: "WINSTONopen · Abgeschlossen" },
  "bad-saarow":   { dateLabel: "25. – 27.09.2026",   subtitle: "Bad Saarow Faldo Course" },
  "green-eagle":  { dateLabel: "02. – 04.10.2026",   subtitle: "Green Eagle North Course" },
  "test":         { dateLabel: "Immer verfügbar",     subtitle: "Internes Test-Turnier" },
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
      background: "radial-gradient(circle at top, rgba(20,122,82,0.10), transparent 30%), #f3f7f4",
      padding: "24px 14px 48px",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 24 }}>

        {/* Hero */}
        <section style={{
          borderRadius: 28,
          padding: 32,
          background: "linear-gradient(135deg, #0b5d3b 0%, #147a52 52%, #1d9a68 100%)",
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
          <h1 style={{ margin: "0 0 8px", fontSize: 36, fontWeight: 900, lineHeight: 1.1 }}>
            Leaderboard 2026
          </h1>
          <p style={{ margin: 0, fontSize: 16, opacity: 0.9, maxWidth: 600 }}>
            Live Scoring & offizielle Ergebnisse aller PRO1PUTT Turniere
          </p>
        </section>

        {/* Turniere */}
        <div style={{ display: "grid", gap: 16 }}>
          {loading ? (
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, textAlign: "center", color: "#668278" }}>
              Lade Turniere...
            </div>
          ) : tournaments.map((t) => {
            const slug = getSlug(t.id);
            const meta = getMeta(t.id);
            const isFinished = slug === "winston-open";

            return (
              <div
                key={t.id}
                onClick={() => router.push(`/leaderboard/${slug}`)}
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(11,93,59,0.08)",
                  borderRadius: 20,
                  padding: 24,
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
                <div>
                  {/* Status Badge */}
                  <div style={{ marginBottom: 10 }}>
                    {isFinished ? (
                      <span style={{
                        background: "#e8f5ee", color: "#0b5d3b",
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
                        Live Scoring
                      </span>
                    )}
                  </div>

                  <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#17362b" }}>
                    {t.name}
                  </h2>
                  <p style={{ margin: "0 0 4px", fontSize: 14, color: "#668278" }}>{meta.subtitle}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#999" }}>📅 {meta.dateLabel}</p>
                </div>

                <div style={{
                  background: "linear-gradient(135deg, #0b5d3b, #147a52)",
                  color: "#fff", borderRadius: 14,
                  padding: "12px 20px", fontWeight: 800, fontSize: 14,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  Leaderboard →
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
