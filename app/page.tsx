export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: 60 }}>
      <h1
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: "#1e4620",
          marginBottom: 20,
        }}
      >
        PRO1PUTT Tournament
      </h1>

      <p style={{ marginBottom: 40, opacity: 0.7 }}>
        Registrierung und Live Scoring
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <a
          href="/register"
          style={{
            padding: "14px 28px",
            background: "#1e4620",
            color: "white",
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Jetzt registrieren
        </a>

        <a
          href="/leaderboard"
          style={{
            padding: "14px 28px",
            border: "2px solid #1e4620",
            color: "#1e4620",
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Zum Leaderboard
        </a>
      </div>
    </div>
  );
}