"use client";

import { useSearchParams } from "next/navigation";

export default function SignClient() {
  const sp = useSearchParams();
  const tournamentId = sp.get("tournamentId") ?? "";

  return (
    <main style={{ padding: 24 }}>
      <h1>Scoring Sign</h1>
      <p>tournamentId: {tournamentId || "-"}</p>
    </main>
  );
}