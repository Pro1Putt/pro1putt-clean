"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function ScoreLoginPage() {
  const params = useParams();
const tournamentId = Array.isArray((params as any).tournamentId)
  ? (params as any).tournamentId[0]
  : String((params as any).tournamentId || "");
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/score/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId, pin }),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError("PIN ungültig");
      return;
    }

    router.push(`/t/${tournamentId}/score/${json.registrationId}`);
  }

  return (
    <div style={{ padding: 40 }}>
      {/* Logo */}
      <div style={{ marginBottom: 30 }}>
        <img
  src="https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png"
  alt="PRO1PUTT"
  style={{ height: 50, width: "auto", display: "block" }}
/>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1e4620" }}>
        Live Scoring
      </h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
        <input
          type="text"
          placeholder="4-stelliger PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          style={{
            padding: "12px 16px",
            fontSize: 18,
            borderRadius: 8,
            border: "1px solid #ccc",
            width: 200,
          }}
        />

        <button
          type="submit"
          style={{
            marginLeft: 15,
            padding: "12px 20px",
            background: "#1e4620",
            color: "#fff",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Start
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 15, color: "crimson" }}>{error}</div>
      )}
    </div>
  );
}