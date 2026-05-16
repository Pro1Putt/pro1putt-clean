"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import LiveLeaderboard from "./LiveLeaderboard";

type Row = {
  id: string;
  rank: number;
  tie?: boolean;
  name: string;
  club: string;
  hcp?: string | null;
  round1: number;
  round2: number;
  round3: number;
  total: number;
  toPar: string;
};

type SectionData = {
  id: string;
  title: string;
  subtitle: string;
  rows: Row[];
  showHcp?: boolean;
};

type TabKey = "girls" | "boys" | "nine";

type TournamentConfig = {
  title: string;
  subtitle: string;
  dateLabel: string;
  hasStaticData: boolean;
  tournamentId?: string;
};

const TOURNAMENTS: Record<string, TournamentConfig> = {
  "winston-open": {
    title: "Winston Open",
    subtitle: "Official Results",
    dateLabel: "30.03.2026 – 01.04.2026",
    hasStaticData: true,
    tournamentId: "7716349a-8bb0-46c6-b60c-3594eb7ea60f",
  },
  "pro1putt-open": {
    title: "Pro1Putt Open",
    subtitle: "Official Results",
    dateLabel: "Termin folgt",
    hasStaticData: false,
  },
  "bad-saarow": {
    title: "Bad Saarow",
    subtitle: "Official Results",
    dateLabel: "Termin folgt",
    hasStaticData: false,
  },
  "green-eagle": {
    title: "Green Eagle",
    subtitle: "Official Results",
    dateLabel: "Termin folgt",
    hasStaticData: false,
  },
};

const girlsU14: Row[] = [
  { id: "c3364e8d-93be-472e-a8ff-b4458266a4c5", rank: 1, name: "Szymanska, Lena", club: "Ber GC Stolper Heide", hcp: "3,2", round1: 80, round2: 75, round3: 76, total: 231, toPar: "+15" },
  { id: "5d110f0e-2f85-4f21-bf6a-d8a96880f0f4", rank: 2, name: "Renting, Frieda Taisia", club: "Dortmunder GC", hcp: "4,0", round1: 74, round2: 91, round3: 81, total: 246, toPar: "+30" },
  { id: "c0fb8d2a-417b-4d68-918c-fc6d0b9b032c", rank: 3, name: "Menzel, Louiza Sofie", club: "Berlin-Wannsee, G&LC", hcp: "9,8", round1: 89, round2: 93, round3: 95, total: 277, toPar: "+61" },
  { id: "bd565cdc-2b20-4ee1-8358-1c3f10ec8acf", rank: 4, name: "Leonhardt, Sophie", club: "Ber GC Stolper Heide", hcp: "27,9", round1: 89, round2: 95, round3: 100, total: 284, toPar: "+68" },
];

const girls1516: Row[] = [
  { id: "639dea59-1a8d-409a-82c6-584dbb5f34e9", rank: 1, name: "Wöhler-Moorhoff, Linda", club: "Berlin-Wannsee, G&LC", hcp: "-1,7", round1: 76, round2: 77, round3: 66, total: 219, toPar: "+3" },
];

const girls1719: Row[] = [
  { id: "fd625cd4-90fe-4002-b0eb-95ff807080ba", rank: 1, name: "Seiffarth, Eleonor Madicken", club: "Berliner GC Gatow", hcp: "4,4", round1: 86, round2: 82, round3: 89, total: 257, toPar: "+41" },
  { id: "44447724-0cf2-4601-b0e6-e53714d03f63", rank: 2, name: "Anders, Emily", club: "WINSTONgolf", hcp: "25,2", round1: 99, round2: 107, round3: 104, total: 310, toPar: "+94" },
];

const boysU14: Row[] = [
  { id: "b0f8374f-c18d-461e-852b-dfa63ae011ac", rank: 1, name: "Behr, Luis", club: "Berlin-Wannsee, G&LC", hcp: "2,2", round1: 74, round2: 73, round3: 73, total: 220, toPar: "+4" },
  { id: "4d134271-956f-42fd-95ea-0a6b725123e6", rank: 2, name: "Könemund, Leonardo", club: "Berlin-Wannsee, G&LC", hcp: "3,2", round1: 83, round2: 79, round3: 76, total: 238, toPar: "+22" },
  { id: "9deefb00-181d-400a-906b-514b64341425", rank: 3, tie: true, name: "Cordes, Maddox", club: "Berlin-Wannsee, G&LC", hcp: "5,4", round1: 83, round2: 81, round3: 75, total: 239, toPar: "+23" },
  { id: "ee23d191-feba-4728-82f1-dc3429b95532", rank: 4, name: "Hauschild, Marlon", club: "Berlin-Wannsee, G&LC", hcp: "5,4", round1: 81, round2: 83, round3: 82, total: 246, toPar: "+30" },
  { id: "9d71aa32-e0cc-4394-b494-f2cca4e7d382", rank: 5, name: "Lanfermann, Noah", club: "Hamburger GC", hcp: "12,8", round1: 87, round2: 82, round3: 81, total: 250, toPar: "+34" },
  { id: "c9c44f56-2b25-4444-be7a-60dcb33140b2", rank: 6, name: "Arnold, Oskar", club: "Berlin-Wannsee, G&LC", hcp: "11,4", round1: 88, round2: 85, round3: 85, total: 258, toPar: "+42" },
  { id: "2e22731c-34b3-4726-937a-18e90d4213a7", rank: 7, tie: true, name: "Sharp, Maximilian Jackson", club: "Berlin-Wannsee, G&LC", hcp: "12,7", round1: 93, round2: 87, round3: 81, total: 261, toPar: "+45" },
  { id: "7eb8f5cb-1d68-4a8b-a52e-3c0ab48ff137", rank: 8, tie: true, name: "Klocke, Julian", club: "Bielefelder GC", hcp: "11,7", round1: 92, round2: 87, round3: 91, total: 270, toPar: "+54" },
  { id: "ee5ab7c6-0546-4277-8d04-5e6b48ea52a3", rank: 8, tie: true, name: "Ewers, Theo", club: "WINSTONgolf", hcp: "17,8", round1: 90, round2: 87, round3: 93, total: 270, toPar: "+54" },
  { id: "78fb4ed0-ba8e-4b98-a34b-b68fa7f01091", rank: 10, name: "Talke, Aaron", club: "Ber GC Stolper Heide", hcp: "15,9", round1: 99, round2: 98, round3: 86, total: 283, toPar: "+67" },
  { id: "06ccd75a-85fb-49da-b531-5ea45a09645f", rank: 11, name: "Pich, Rafael Freedom", club: "Berlin-Wannsee, G&LC", hcp: "20,6", round1: 101, round2: 108, round3: 98, total: 307, toPar: "+91" },
];

const boys1516: Row[] = [
  { id: "0d19a809-374b-46bc-ac56-5d1417af6bbf", rank: 1, name: "Kolessilov, Daniel Maximilian", club: "Berliner GC Gatow", hcp: "-1,4", round1: 68, round2: 76, round3: 75, total: 219, toPar: "+3" },
  { id: "19b44c8b-f73c-4644-a197-236e9f11225b", rank: 2, name: "Hövermann, Phillip", club: "Hamburger GC", hcp: "4,4", round1: 76, round2: 79, round3: 81, total: 236, toPar: "+20" },
  { id: "707a8d7f-4868-4aa2-ba77-aa822a334b283", rank: 3, name: "Beerli, Fabian", club: "Berlin-Wannsee, G&LC", hcp: "3,0", round1: 84, round2: 80, round3: 75, total: 239, toPar: "+23" },
  { id: "e5564605-a162-4973-b880-2fa22458ea54", rank: 4, name: "Balz, Carl", club: "Berlin-Wannsee, G&LC", hcp: "5,5", round1: 90, round2: 76, round3: 77, total: 243, toPar: "+27" },
  { id: "117030b2-c7c3-4bab-ac1d-2b3b81b2b9d1", rank: 5, tie: true, name: "Koglin, Felix", club: "Berlin-Wannsee, G&LC", hcp: "2,6", round1: 77, round2: 84, round3: 85, total: 246, toPar: "+30" },
  { id: "0a22a191-8264-4398-8468-2e96074d3366", rank: 6, name: "Gregg, Nicolas", club: "Berlin-Wannsee, G&LC", hcp: "5,8", round1: 82, round2: 83, round3: 86, total: 251, toPar: "+35" },
  { id: "f88170d0-1f22-42fc-b06f-f43ce3d2c8ff", rank: 7, tie: true, name: "Lehmann, Carl Friedrich", club: "Berlin-Wannsee, G&LC", hcp: "8,0", round1: 86, round2: 87, round3: 88, total: 261, toPar: "+45" },
];

const boys1719: Row[] = [
  { id: "3b88eb10-8515-40d0-8108-a94529c534cd", rank: 1, name: "Dzenis, Andris", club: "Zur Vahr, Club", hcp: "1,1", round1: 71, round2: 73, round3: 70, total: 214, toPar: "-2" },
  { id: "47b6392b-647e-4a2b-8976-2847b12f6ab8", rank: 2, name: "Schwarz, Julian", club: "Berlin-Wannsee, G&LC", hcp: "-2,6", round1: 72, round2: 71, round3: 75, total: 218, toPar: "+2" },
  { id: "07cfbc31-606f-4838-ba17-578e0720215d", rank: 3, name: "Kastein, Aaron", club: "Berlin-Wannsee, G&LC", hcp: "-1,0", round1: 76, round2: 78, round3: 73, total: 227, toPar: "+11" },
  { id: "6edb8902-3291-45fa-8851-a88b460512ad", rank: 4, name: "Kropat, Karsten", club: "Ber GC Stolper Heide", hcp: "1,3", round1: 80, round2: 79, round3: 71, total: 230, toPar: "+14" },
  { id: "7e4671ff-76e0-4d70-b912-6aa7354774ee", rank: 5, name: "Wienands, Leander", club: "Berlin-Wannsee, G&LC", hcp: "-1,1", round1: 77, round2: 77, round3: 77, total: 231, toPar: "+15" },
  { id: "e1cec61b-4c31-4d8e-8bee-b667ee5eca28", rank: 6, name: "Bund, Bent Laurenz", club: "Zur Vahr, Club", hcp: "2,9", round1: 72, round2: 77, round3: 83, total: 232, toPar: "+16" },
];

const hole9Overall: Row[] = [
  { id: "d3d57160-31bc-4e35-bb5c-de5a5f07d0e7", rank: 1, name: "Nischk, Henry Pete", club: "Berlin-Wannsee, G&LC", round1: 42, round2: 34, round3: 39, total: 115, toPar: "+14,5" },
  { id: "e0adbbeb-e7b5-42d4-9ba3-1d70e15bc9f5", rank: 2, name: "Schmitz, Jonathan", club: "Gut Brettberg Lohne", round1: 37, round2: 40, round3: 44, total: 121, toPar: "+20,5" },
  { id: "098132e4-eb31-43dd-b487-8f6aea7501e6", rank: 3, name: "Niermann, Linus", club: "Teutoburger Wald", round1: 39, round2: 42, round3: 42, total: 123, toPar: "+22,5" },
  { id: "885a2ebf-a33e-44a1-a5dd-ef1922c7778b", rank: 4, name: "Didjurgis, Elias", club: "Seddiner See, G&CC", round1: 46, round2: 41, round3: 40, total: 127, toPar: "+26,5" },
  { id: "db214db6-5b8e-432b-a14b-322a170f0720", rank: 5, name: "Nischk, Paul Jules", club: "Berlin-Wannsee, G&LC", round1: 44, round2: 50, round3: 45, total: 139, toPar: "+38,5" },
  { id: "21380286-b867-4919-83b5-08eaac386dfe", rank: 6, name: "Eirund, Louis - Maximilian", club: "Hösel, GC", round1: 54, round2: 48, round3: 42, total: 144, toPar: "+43,5" },
];

const hole9Age1112: Row[] = [
  { id: "e0adbbeb-e7b5-42d4-9ba3-1d70e15bc9f5", rank: 1, name: "Schmitz, Jonathan", club: "Gut Brettberg Lohne", round1: 37, round2: 40, round3: 44, total: 121, toPar: "+20,5" },
  { id: "885a2ebf-a33e-44a1-a5dd-ef1922c7778b", rank: 2, name: "Didjurgis, Elias", club: "Seddiner See, G&CC", round1: 46, round2: 41, round3: 40, total: 127, toPar: "+26,5" },
  { id: "21380286-b867-4919-83b5-08eaac386dfe", rank: 3, name: "Eirund, Louis - Maximilian", club: "Hösel, GC", round1: 54, round2: 48, round3: 42, total: 144, toPar: "+43,5" },
];

const hole9Age910: Row[] = [
  { id: "d3d57160-31bc-4e35-bb5c-de5a5f07d0e7", rank: 1, name: "Nischk, Henry Pete", club: "Berlin-Wannsee, G&LC", round1: 42, round2: 34, round3: 39, total: 115, toPar: "+14,5" },
  { id: "098132e4-eb31-43dd-b487-8f6aea7501e6", rank: 2, name: "Niermann, Linus", club: "Teutoburger Wald", round1: 39, round2: 42, round3: 42, total: 123, toPar: "+22,5" },
];

const hole9AgeU8: Row[] = [
  { id: "db214db6-5b8e-432b-a14b-322a170f0720", rank: 1, name: "Nischk, Paul Jules", club: "Berlin-Wannsee, G&LC", round1: 44, round2: 50, round3: 45, total: 139, toPar: "+38,5" },
];

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 18,
        padding: "14px 16px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.85,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "12px 18px",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 14,
        transition: "all 0.2s ease",
        background: active ? "#0b5d3b" : "#ffffff",
        color: active ? "#ffffff" : "#17362b",
        boxShadow: active
          ? "0 10px 24px rgba(11,93,59,0.18)"
          : "0 4px 14px rgba(8,33,22,0.06)",
        border: active
          ? "1px solid #0b5d3b"
          : "1px solid rgba(11,93,59,0.10)",
        outline: "none",
      }}
    >
      {children}
    </button>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#f8fbf9",
        border: "1px solid rgba(11,93,59,0.07)",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: "#668278",
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 15,
          fontWeight: 800,
          color: "#17362b",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ExpandablePlayerCard({
  row,
  showHcp,
  tournamentId,
}: {
  row: Row;
  showHcp?: boolean;
  tournamentId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [scorecard, setScorecard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function loadScorecard() {
    if (!tournamentId || scorecard || loading) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/player-scorecard?tournamentId=${tournamentId}&registrationId=${row.id}`
      );

      const json = await res.json();

      if (json.ok) {
        setScorecard(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid rgba(11,93,59,0.08)",
        background: open ? "#f7fbf8" : "#ffffff",
      }}
    >
      <button
        onClick={() => {
          setOpen((v) => !v);
          loadScorecard();
        }}
        style={{
          width: "100%",
          textAlign: "left",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 16,
          display: "grid",
          gridTemplateColumns:
            "64px 40px minmax(220px, 2fr) minmax(160px, 1.4fr) 90px 80px 80px 80px 90px 80px 36px",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 900, color: "#0b5d3b" }}>
          {row.rank}
          {row.tie ? "*" : ""}
        </div>
        <div style={{ fontSize: 18 }}>{medal(row.rank)}</div>
        <div style={{ fontWeight: 800, color: "#17362b", minWidth: 0 }}>{row.name}</div>
        <div style={{ color: "#4f675e", minWidth: 0 }}>{row.club}</div>
        <div style={{ textAlign: "center", color: "#17362b" }}>
          {showHcp ? row.hcp ?? "—" : "—"}
        </div>
        <div style={{ textAlign: "center", color: "#17362b" }}>{row.round1}</div>
        <div style={{ textAlign: "center", color: "#17362b" }}>{row.round2}</div>
        <div style={{ textAlign: "center", color: "#17362b" }}>{row.round3}</div>
        <div style={{ textAlign: "center", fontWeight: 900, color: "#17362b" }}>{row.total}</div>
        <div style={{ textAlign: "center", fontWeight: 900, color: "#17362b" }}>{row.toPar}</div>
        <div style={{ textAlign: "center", fontSize: 18, color: "#0b5d3b" }}>{open ? "−" : "+"}</div>
      </button>

      {open ? (
        <div style={{ padding: "0 16px 16px" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(11,93,59,0.08)",
              borderRadius: 18,
              padding: 16,
              boxShadow: "0 8px 20px rgba(8,33,22,0.04)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
              }}
            >
              <DetailBox label="Player" value={row.name} />
              <DetailBox label="Club" value={row.club} />
              {showHcp ? <DetailBox label="HCP" value={row.hcp ?? "—"} /> : null}
              <DetailBox label="Round 1" value={String(row.round1)} />
              <DetailBox label="Round 2" value={String(row.round2)} />
              <DetailBox label="Round 3" value={String(row.round3)} />
              <DetailBox label="Total" value={String(row.total)} />
              <DetailBox label="+/-" value={row.toPar} />
            </div>

            {scorecard && (
              <div style={{ marginTop: 16 }}>
                {[1, 2, 3].map((r) => {
                  const round = scorecard.rounds?.[r];
                  if (!round || round.holes_played === 0) return null;

                  return (
                    <div key={r} style={{ marginBottom: 18 }}>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>
                        Runde {r} – {round.total_strokes ?? "-"} Schläge
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(9, 1fr)",
                          gap: 6,
                        }}
                      >
                        {round.holes.map((h: any) => (
                          <div
                            key={h.hole_number}
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              background: "#f3f8f5",
                              textAlign: "center",
                              fontSize: 12,
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>{h.hole_number}</div>
                            <div>{h.strokes ?? "-"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {loading && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 14,
                  background: "#f3f8f5",
                  color: "#446057",
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontWeight: 700,
                }}
              >
                Lade Scorekarte...
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  subtitle,
  rows,
  showHcp = true,
  tournamentId,
}: {
  title: string;
  subtitle: string;
  rows: Row[];
  showHcp?: boolean;
  tournamentId?: string;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid rgba(11,93,59,0.08)",
        boxShadow: "0 10px 30px rgba(8,33,22,0.06)",
        borderRadius: 24,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 20px",
          background: "linear-gradient(135deg, #0b5d3b 0%, #147a52 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 900 }}>{title}</div>
        <div style={{ marginTop: 4, fontSize: 14, opacity: 0.9 }}>{subtitle}</div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 1080 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "64px 40px minmax(220px, 2fr) minmax(160px, 1.4fr) 90px 80px 80px 80px 90px 80px 36px",
              gap: 8,
              alignItems: "center",
              padding: "14px 16px",
              background: "#f3f8f5",
              borderBottom: "1px solid rgba(11,93,59,0.10)",
              fontSize: 13,
              fontWeight: 800,
              color: "#35524a",
            }}
          >
            <div>Pl.</div>
            <div></div>
            <div>Name</div>
            <div>Club</div>
            <div style={{ textAlign: "center" }}>{showHcp ? "HCP" : "—"}</div>
            <div style={{ textAlign: "center" }}>R1</div>
            <div style={{ textAlign: "center" }}>R2</div>
            <div style={{ textAlign: "center" }}>R3</div>
            <div style={{ textAlign: "center" }}>Total</div>
            <div style={{ textAlign: "center" }}>+/-</div>
            <div style={{ textAlign: "center" }}></div>
          </div>

          {rows.map((row, index) => (
            <ExpandablePlayerCard
              key={`${row.name}-${index}`}
              row={row}
              showHcp={showHcp}
              tournamentId={tournamentId}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "14px 20px 18px",
          fontSize: 12,
          color: "#5a6f65",
        }}
      >
        * Gleichstand im Gesamtergebnis.
      </div>
    </section>
  );
}

function PlaceholderTournament({
  title,
  dateLabel,
  tournamentId,
}: {
  title: string;
  dateLabel: string;
  tournamentId: string;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, rgba(20,122,82,0.10), transparent 30%), #f3f7f4",
        padding: "24px 14px 48px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 22 }}>
        <section
          style={{
            borderRadius: 28,
            padding: 24,
            background: "linear-gradient(135deg, #0b5d3b 0%, #147a52 52%, #1d9a68 100%)",
            color: "#ffffff",
            boxShadow: "0 18px 40px rgba(7,40,27,0.18)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            PRO1PUTT Official Results
          </div>

          <h1
            style={{
              margin: "16px 0 8px",
              fontSize: 38,
              lineHeight: 1.05,
              fontWeight: 900,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 900,
              fontSize: 16,
              lineHeight: 1.5,
              opacity: 0.94,
            }}
          >
            Leaderboard wird vorbereitet.
          </p>

          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            <StatCard label="Turnier" value={dateLabel} />
            <StatCard label="Status" value="In Vorbereitung" />
          </div>
        </section>

        <section style={{ display: "grid", gap: 16 }}>
  <LiveLeaderboard tournamentId={tournamentId} />
</section>
      </div>
    </main>
  );
}

export default function Page() {
  const params = useParams();
  const slug = String(params?.slug || "");
  const config = TOURNAMENTS[slug];
  const [activeTab, setActiveTab] = useState<TabKey>("girls");

  if (!config) {
    return (
      <main style={{ minHeight: "100vh", padding: 40 }}>
        <h1>Turnier nicht gefunden</h1>
        <p>Slug: {slug}</p>
      </main>
    );
  }

  if (!config.hasStaticData) {
    return <PlaceholderTournament title={config.title} dateLabel={config.dateLabel} tournamentId={config.tournamentId || slug} />;
  }

  const total18 =
    girlsU14.length +
    girls1516.length +
    girls1719.length +
    boysU14.length +
    boys1516.length +
    boys1719.length;

  const total9 = hole9Overall.length;

  const girlsSections: SectionData[] = useMemo(
    () => [
      {
        id: "girls-u14",
        title: "Girls U14",
        subtitle: "18 Loch · Brutto Girls Alter bis 14",
        rows: girlsU14,
        showHcp: true,
      },
      {
        id: "girls-1516",
        title: "Girls 15–16",
        subtitle: "18 Loch · Brutto Girls Alter 15 bis 16",
        rows: girls1516,
        showHcp: true,
      },
      {
        id: "girls-1719",
        title: "Girls 17–19",
        subtitle: "18 Loch · Brutto Girls Alter 17 bis 19",
        rows: girls1719,
        showHcp: true,
      },
    ],
    []
  );

  const boysSections: SectionData[] = useMemo(
    () => [
      {
        id: "boys-u14",
        title: "Boys U14",
        subtitle: "18 Loch · Brutto Boys Alter bis 14",
        rows: boysU14,
        showHcp: true,
      },
      {
        id: "boys-1516",
        title: "Boys 15–16",
        subtitle: "18 Loch · Brutto Boys Alter 15 bis 16",
        rows: boys1516,
        showHcp: true,
      },
      {
        id: "boys-1719",
        title: "Boys 17–19",
        subtitle: "18 Loch · Brutto Boys Alter 17 bis 19",
        rows: boys1719,
        showHcp: true,
      },
    ],
    []
  );

  const nineSections: SectionData[] = useMemo(
    () => [
      {
        id: "nine-overall",
        title: "9 Loch Gesamt",
        subtitle: "Alle 9 Loch Spieler",
        rows: hole9Overall,
        showHcp: false,
      },
      {
        id: "nine-1112",
        title: "9 Loch Alter 11–12",
        subtitle: "Brutto HCP bis -- Alter 11 bis 12",
        rows: hole9Age1112,
        showHcp: false,
      },
      {
        id: "nine-910",
        title: "9 Loch Alter 9–10",
        subtitle: "Brutto HCP bis -- Alter 9 bis 10",
        rows: hole9Age910,
        showHcp: false,
      },
      {
        id: "nine-u8",
        title: "9 Loch Alter bis 8",
        subtitle: "Brutto HCP bis -- Alter bis 8",
        rows: hole9AgeU8,
        showHcp: false,
      },
    ],
    []
  );

  const sections =
    activeTab === "girls"
      ? girlsSections
      : activeTab === "boys"
      ? boysSections
      : nineSections;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, rgba(20,122,82,0.10), transparent 30%), #f3f7f4",
        padding: "24px 14px 48px",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gap: 22 }}>
        <section
          style={{
            borderRadius: 28,
            padding: 24,
            background: "linear-gradient(135deg, #0b5d3b 0%, #147a52 52%, #1d9a68 100%)",
            color: "#ffffff",
            boxShadow: "0 18px 40px rgba(7,40,27,0.18)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            PRO1PUTT {config.subtitle}
          </div>

          <h1
            style={{
              margin: "16px 0 8px",
              fontSize: 38,
              lineHeight: 1.05,
              fontWeight: 900,
            }}
          >
            {config.title}
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 900,
              fontSize: 16,
              lineHeight: 1.5,
              opacity: 0.94,
            }}
          >
            Premium PDF Fallback mit Tabs, Altersklassen und klickbaren Player Cards.
          </p>

          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            <StatCard label="Turnier" value={config.dateLabel} />
            <StatCard label="18 Loch Spieler" value={total18} />
            <StatCard label="9 Loch Spieler" value={total9} />
          </div>
        </section>

        <section
          style={{
            position: "sticky",
            top: 12,
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              background: "rgba(243,247,244,0.8)",
              backdropFilter: "blur(10px)",
              padding: 8,
              borderRadius: 999,
            }}
          >
            <TabButton active={activeTab === "girls"} onClick={() => setActiveTab("girls")}>
              Girls
            </TabButton>
            <TabButton active={activeTab === "boys"} onClick={() => setActiveTab("boys")}>
              Boys
            </TabButton>
            <TabButton active={activeTab === "nine"} onClick={() => setActiveTab("nine")}>
              9 Loch
            </TabButton>
          </div>
        </section>

        <div style={{ display: "grid", gap: 22 }}>
          {sections.map((section) => (
            <Section
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              rows={section.rows}
              showHcp={section.showHcp}
              tournamentId={config.tournamentId}
            />
          ))}
        </div>
      </div>
    </main>
  );
}