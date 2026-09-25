import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GREEN = "#00C46A";
const DARK = "#18392B";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function safe(value: any) {
  const text = String(value ?? "").trim();
  return text || "–";
}

function playerName(registration: any) {
  if (!registration) return "–";

  const firstName = String(registration.first_name ?? "").trim();
  const lastName = String(registration.last_name ?? "").trim();

  return `${firstName} ${lastName}`.trim() || "–";
}

function formatDate(value: string | null) {
  if (!value) return "–";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
}

function formatTime(value: string | null) {
  if (!value) return "–";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function PublicStartlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ tournamentId: string }>;
  searchParams: Promise<{ round?: string }>;
}) {
  const { tournamentId } = await params;
  const query = await searchParams;

  const requestedRound = [1, 2, 3].includes(Number(query.round))
    ? Number(query.round)
    : null;

  const supabase = getSupabase();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id,name,start_date,location")
    .eq("id", tournamentId)
    .single();

  if (!tournament) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.empty}>
            <h1>Turnier nicht gefunden</h1>
            <p>Für dieses Turnier ist derzeit keine Startliste verfügbar.</p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Welche Runden wurden von der Turnierleitung veröffentlicht?
   * Die Startlistendaten selbst werden NICHT gespeichert.
   * Dadurch bleiben die angezeigten Flights immer dynamisch.
   */
  const { data: publications } = await supabase
    .from("startlist_publications")
    .select("round,published")
    .eq("tournament_id", tournamentId)
    .eq("published", true)
    .order("round", { ascending: true });

  const publishedRounds = (publications ?? [])
    .map((entry: any) => Number(entry.round))
    .filter((round: number) => [1, 2, 3].includes(round));

  /*
   * Wenn keine Runde veröffentlicht wurde, zeigen wir noch keine Startliste.
   */
  if (publishedRounds.length === 0) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <section style={styles.hero}>
            <div style={styles.brand}>PRO1PUTT</div>
            <h1 style={styles.title}>Startliste</h1>

            <div style={styles.tournamentName}>
              {safe(tournament.name)}
            </div>

            <div style={styles.meta}>
              <span>{formatDate(tournament.start_date)}</span>
              <span>•</span>
              <span>{safe(tournament.location)}</span>
            </div>
          </section>

          <div style={styles.empty}>
            <h2>Startliste noch nicht veröffentlicht</h2>
            <p>
              Die Startliste wird von der Turnierleitung vor dem jeweiligen
              Turniertag veröffentlicht.
            </p>
          </div>

          <div style={styles.footer}>
            PRO1PUTT · Tournament Registration & Live Scoring
          </div>
        </div>
      </main>
    );
  }

  /*
   * Ist eine konkrete veröffentlichte Runde über ?round= gewählt,
   * zeigen wir diese. Sonst automatisch die höchste veröffentlichte Runde.
   */
  const round =
    requestedRound && publishedRounds.includes(requestedRound)
      ? requestedRound
      : Math.max(...publishedRounds);

  /*
   * Die öffentliche Startliste verwendet exakt dieselbe Datenquelle
   * wie /scoring/flights: /api/flights/list
   */
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.pro1putt.com";

  const response = await fetch(
    `${baseUrl}/api/flights/list?tournamentId=${encodeURIComponent(
      tournamentId
    )}&round=${round}`,
    { cache: "no-store" }
  );

  const flightData = response.ok ? await response.json() : null;

  const flights = flightData?.flights ?? [];
  const flightPlayers = flightData?.flight_players ?? [];

  /*
   * /api/flights/list liefert die Registrierungsdaten bereits direkt
   * an jedem flight_player mit.
   */
  const registrationById = new Map<string, any>(
    flightPlayers
      .filter((entry: any) => entry.registration)
      .map((entry: any) => [
        String(entry.registration_id),
        entry.registration,
      ])
  );

  const sortedFlights = [...(flights ?? [])].sort((a: any, b: any) => {
    const timeA = a.start_time
      ? new Date(a.start_time).getTime()
      : Number.MAX_SAFE_INTEGER;

    const timeB = b.start_time
      ? new Date(b.start_time).getTime()
      : Number.MAX_SAFE_INTEGER;

    if (timeA !== timeB) return timeA - timeB;

    return (
      Number(a.flight_number ?? 9999) -
      Number(b.flight_number ?? 9999)
    );
  });

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.brand}>PRO1PUTT</div>

          <h1 style={styles.title}>Startliste</h1>

          <div style={styles.tournamentName}>
            {safe(tournament.name)}
          </div>

          <div style={styles.meta}>
            <span>{formatDate(tournament.start_date)}</span>
            <span>•</span>
            <span>{safe(tournament.location)}</span>
            <span>•</span>
            <span>Runde {round}</span>
          </div>
        </section>

        {publishedRounds.length > 1 && (
          <nav style={styles.roundNavigation}>
            <div style={styles.roundNavigationLabel}>
              Verfügbare Startlisten
            </div>

            <div style={styles.roundButtons}>
              {publishedRounds.map((publishedRound: number) => (
                <a
                  key={publishedRound}
                  href={`/public/startliste/${tournamentId}?round=${publishedRound}`}
                  style={{
                    ...styles.roundButton,
                    ...(publishedRound === round
                      ? styles.roundButtonActive
                      : {}),
                  }}
                >
                  Runde {publishedRound}
                </a>
              ))}
            </div>
          </nav>
        )}

        {sortedFlights.length === 0 ? (
          <div style={styles.empty}>
            <h2>Noch keine Startliste verfügbar</h2>
            <p>
              Die Startzeiten und Flights werden veröffentlicht,
              sobald die Turnierleitung die Einteilung abgeschlossen hat.
            </p>
          </div>
        ) : (
          <div style={styles.flightList}>
            {sortedFlights.map((flight: any) => {
              const members = flightPlayers
                .filter(
                  (entry: any) =>
                    String(entry.flight_id) === String(flight.id)
                )
                .sort(
                  (a: any, b: any) =>
                    Number(a.seat ?? 999) - Number(b.seat ?? 999)
                );

              return (
                <section key={flight.id} style={styles.flightCard}>
                  <div style={styles.flightHeader}>
                    <div>
                      <div style={styles.flightNumber}>
                        Flight {safe(flight.flight_number)}
                      </div>

                      <div style={styles.flightDetails}>
                        {safe(flight.gender)} · {safe(flight.holes)} Loch
                      </div>
                    </div>

                    <div style={styles.startTime}>
                      <div style={styles.startLabel}>START</div>
                      {formatTime(flight.start_time)} Uhr
                    </div>
                  </div>

                  <div style={styles.tableHeader}>
                    <div>Spieler</div>
                    <div>HCP</div>
                    <div>Club</div>
                  </div>

                  {members.map((member: any) => {
                    const registration = registrationById.get(
                      String(member.registration_id)
                    );

                    return (
                      <div
                        key={member.id ?? member.registration_id}
                        style={styles.playerRow}
                      >
                        <div style={styles.player}>
                          <div style={styles.seat}>
                            {safe(member.seat)}
                          </div>

                          <div style={styles.playerName}>
                            {playerName(registration)}
                          </div>
                        </div>

                        <div style={styles.hcp}>
                          {safe(registration?.hcp)}
                        </div>

                        <div style={styles.club}>
                          {safe(registration?.home_club)}
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
        )}

        <div style={styles.footer}>
          PRO1PUTT · Tournament Registration & Live Scoring
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F5F7F6",
    padding: "32px 16px 60px",
    fontFamily:
      'Lato, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#111827",
  },

  container: {
    width: "100%",
    maxWidth: 1000,
    margin: "0 auto",
  },

  hero: {
    background: DARK,
    borderRadius: 22,
    padding: "32px 36px",
    color: "white",
    marginBottom: 24,
    boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
  },

  brand: {
    color: GREEN,
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    margin: 0,
    fontSize: 38,
    fontWeight: 900,
    lineHeight: 1.1,
  },

  tournamentName: {
    marginTop: 10,
    fontSize: 19,
    fontWeight: 700,
  },

  meta: {
    marginTop: 16,
    display: "flex",
    gap: 9,
    flexWrap: "wrap",
    fontSize: 14,
    opacity: 0.85,
  },

  roundNavigation: {
    background: "white",
    borderRadius: 18,
    padding: "18px 20px",
    marginBottom: 20,
    border: "1px solid rgba(0,0,0,0.07)",
    boxShadow: "0 5px 18px rgba(0,0,0,0.05)",
  },

  roundNavigationLabel: {
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#6B7280",
    marginBottom: 10,
  },

  roundButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  roundButton: {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: 10,
    background: "#F1F5F3",
    color: DARK,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 900,
  },

  roundButtonActive: {
    background: GREEN,
    color: "white",
  },

  flightList: {
    display: "grid",
    gap: 16,
  },

  flightCard: {
    background: "white",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.07)",
    boxShadow: "0 5px 18px rgba(0,0,0,0.05)",
  },

  flightHeader: {
    background: GREEN,
    color: "white",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  flightNumber: {
    fontSize: 19,
    fontWeight: 900,
  },

  flightDetails: {
    marginTop: 3,
    fontSize: 12,
    opacity: 0.9,
  },

  startTime: {
    textAlign: "right",
    fontSize: 20,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  startLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    opacity: 0.85,
    marginBottom: 2,
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns:
      "minmax(260px, 1.2fr) 80px minmax(180px, 1fr)",
    gap: 14,
    padding: "12px 20px",
    background: "#F8FAF9",
    borderBottom: "1px solid #E5E7EB",
    fontSize: 10,
    fontWeight: 900,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  playerRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(260px, 1.2fr) 80px minmax(180px, 1fr)",
    gap: 14,
    alignItems: "center",
    padding: "14px 20px",
    borderBottom: "1px solid #F0F1F2",
  },

  player: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  seat: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "#EFFBF5",
    color: "#00894A",
    fontSize: 12,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  playerName: {
    fontSize: 15,
    fontWeight: 800,
  },

  hcp: {
    fontSize: 14,
    fontWeight: 700,
  },

  club: {
    fontSize: 13,
    color: "#4B5563",
  },

  empty: {
    background: "white",
    borderRadius: 18,
    padding: 36,
    textAlign: "center",
    border: "1px solid rgba(0,0,0,0.07)",
  },

  footer: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 11,
    marginTop: 28,
  },
};