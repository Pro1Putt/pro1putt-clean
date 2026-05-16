"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type Tournament = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  location: string;
  status: string;
};

export default function LeaderboardOverviewPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: false });

      if (!error && data) {
        setTournaments(data);
      }

      setLoading(false);
    };

    load();
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>Alle Turniere</h1>

      {loading ? (
        <p>Lade...</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {tournaments.map((t) => (
            <Link key={t.id} href={`/leaderboard/${t.slug}`}>
              <div
                style={{
                  padding: 20,
                  border: "1px solid #ccc",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                <h2>{t.name}</h2>
                <p>{t.location}</p>
                <p>{t.start_date}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}