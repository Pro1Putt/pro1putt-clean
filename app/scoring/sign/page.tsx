"use client";

import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SignPage() {
  const sp = useSearchParams();

  const tournamentId = sp.get("tournamentId") ?? "";
  const registrationId = sp.get("registrationId") ?? "";
  const round = sp.get("round") ?? "";
  const role = sp.get("role") ?? "";

  return (
    <div style={{ padding: 20 }}>
      <h1>Scorecard Sign Page</h1>

      <p>
        <strong>Tournament:</strong> {tournamentId}
      </p>
      <p>
        <strong>Registration:</strong> {registrationId}
      </p>
      <p>
        <strong>Round:</strong> {round}
      </p>
      <p>
        <strong>Role:</strong> {role}
      </p>
    </div>
  );
}