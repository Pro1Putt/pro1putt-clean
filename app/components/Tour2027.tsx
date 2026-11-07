"use client";

import { useEffect, useState } from "react";

type Tournament = {
  id: string;
  name: string;
  course_name: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  registration_open: boolean;
  is_active: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

export default function Tour2027() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/tournaments?view=tour2027", {
          cache: "no-store"
        });

        if (!response.ok) throw new Error("API error");

        const result = await response.json();

        if (!result.ok || !Array.isArray(result.tournaments)) {
          throw new Error("Invalid response");
        }

        if (active) {
          setTournaments(
            result.tournaments
              .filter((t: Tournament) => t.is_active)
              .sort((a: Tournament, b: Tournament) =>
                a.start_date.localeCompare(b.start_date)
              )
          );
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p>Turniere werden geladen ...</p>;
  }

  if (error) {
    return <p>Die Turniere konnten momentan nicht geladen werden.</p>;
  }

  if (tournaments.length === 0) {
    return <p>Die Turniertermine werden in Kürze veröffentlicht.</p>;
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 24,
      maxWidth: 1100,
      margin: "0 auto",
      textAlign: "left"
    }}>
      {tournaments.map((t) => (
        <div key={t.id} style={{
          background: "white",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 14px 40px rgba(0,0,0,0.07)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 235
        }}>
          <div>
            <div style={{
              color: "#00A95C",
              fontSize: 13,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 10
            }}>
              {t.registration_open
                ? "Anmeldung geöffnet"
                : "Anmeldung noch geschlossen"}
            </div>

            <h3 style={{
              fontSize: 21,
              fontWeight: 900,
              color: "#0E2A1F",
              marginBottom: 12
            }}>
              {t.name}
            </h3>

            <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
              {formatDate(t.start_date)}
              {t.end_date && ` – ${formatDate(t.end_date)}`}
              <br />
              {t.course_name || t.location || ""}
            </p>
          </div>

          {t.registration_open ? (
            <a
              href="/register"
              style={{
                padding: "14px 18px",
                background: "#00C46A",
                color: "#001a10",
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
                textAlign: "center",
                marginTop: 20
              }}
            >
              Jetzt anmelden →
            </a>
          ) : (
            <div style={{
              padding: "14px 18px",
              background: "#edf2ef",
              color: "#51645a",
              borderRadius: 14,
              fontWeight: 800,
              textAlign: "center",
              marginTop: 20
            }}>
              Anmeldung folgt
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
