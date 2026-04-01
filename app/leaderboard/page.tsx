"use client";

export default function LeaderboardPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f2d1c",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          fontWeight: 900,
          margin: 0,
          marginBottom: "16px",
        }}
      >
        PRO1PUTT Leaderboard
      </h1>

      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "20px",
        }}
      >
        🚧 Under Construction 🚧
      </div>

      <p
        style={{
          fontSize: "18px",
          lineHeight: 1.6,
          maxWidth: "700px",
          margin: 0,
          opacity: 0.9,
        }}
      >
        The leaderboard is currently being updated to ensure accurate scores.
        <br />
        Please check back shortly.
      </p>
    </div>
  );
}