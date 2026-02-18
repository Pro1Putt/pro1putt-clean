"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const LOGO_URL =
  "https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png";

const GREEN = "#1e4620";

type FlightMember = {
  registration_id: string;
  first_name: string;
  last_name: string;
  gender: string | null;
};

type FlightInfo = {
  flight_id: string;
  flight_number: number;
  start_time: string | null;
  round: number;
  members: FlightMember[];
  you_mark: {
    marks_registration_id: string;
    marks_name: string;
  };
};

function cardStyle(): React.CSSProperties {
  return {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
  };
}
function inputStyle(disabled?: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
    opacity: disabled ? 0.7 : 1,
    outline: "none",
  };
}
function labelStyle(): React.CSSProperties {
  return { display: "block", fontWeight: 900, marginBottom: 8, color: GREEN };
}
function smallPill(text: string, ok?: boolean) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 12,
        border: ok ? "1px solid rgba(30,70,32,0.28)" : "1px solid rgba(0,0,0,0.12)",
        background: ok ? "rgba(30,70,32,0.10)" : "rgba(0,0,0,0.04)",
        color: ok ? GREEN : "#0f172a",
      }}
    >
      {text}
    </span>
  );
}

export default function LiveScoringFlightPage() {
  const params = useParams();
  const tournamentId = String((params as any).tournamentId || "");
  const registrationId = String((params as any).registrationId || "");

  const [round] = useState(1);

  const [info, setInfo] = useState<FlightInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const marksId = info?.you_mark.marks_registration_id || "";

  // hole + entry values
  const [hole, setHole] = useState(1);
  const [myStrokes, setMyStrokes] = useState<number>(5);
  const [markStrokes, setMarkStrokes] = useState<number>(5);

  const [ruleBall, setRuleBall] = useState(false);
  const [ruleNote, setRuleNote] = useState("");

  // status/lock
  const [statusLoading, setStatusLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  // saving
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // load flight
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `/api/scoring/flight?tournamentId=${encodeURIComponent(
            tournamentId
          )}&round=${round}&registrationId=${encodeURIComponent(registrationId)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Flight not found");
        if (!cancelled) setInfo(json.info);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Load error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (tournamentId && registrationId) load();
    return () => {
      cancelled = true;
    };
  }, [tournamentId, registrationId, round]);

  const maxHole = useMemo(() => {
    // robust: wenn du später 9/18 pro Spieler nutzen willst, holen wir es über /api/player
    return 18;
  }, []);

  async function refreshHoleStatus(h: number) {
    if (!tournamentId || !registrationId) return;
    setStatusLoading(true);
    try {
      const res = await fetch(
        `/api/scoring/hole-status?tournamentId=${encodeURIComponent(
          tournamentId
        )}&registrationId=${encodeURIComponent(registrationId)}&round=${round}&hole=${h}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Status load failed");

      const isConfirmed = !!json.confirmed;
      setConfirmed(isConfirmed);

      if (isConfirmed) {
        setStatusMsg("Loch bestätigt ✅");
      } else {
        setStatusMsg("Warte auf Abgleich (beide Scores müssen gleich sein) …");
      }
    } catch (e: any) {
      setConfirmed(false);
      setStatusMsg(e?.message || "Status konnte nicht geladen werden");
    } finally {
      setStatusLoading(false);
    }
  }

  // whenever hole changes -> refresh status and unlock by default
  useEffect(() => {
    setOkMsg(null);
    setErr(null);
    setStatusMsg("");
    setConfirmed(false);

    refreshHoleStatus(hole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hole, tournamentId, registrationId, round]);

  async function saveHole() {
    if (!info) return;
    if (!marksId) return setErr("Marker-Zuordnung fehlt (marks_registration_id).");

    setSaving(true);
    setOkMsg(null);
    setErr(null);

    try {
      // 1) mein eigener Score (entered_by = ich, for = ich)
      let res = await fetch("/api/scoring/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: tournamentId,
          round,
          hole_number: hole,
          entered_by: registrationId,
          for_registration_id: registrationId,
          strokes: myStrokes,
          rule_ball: ruleBall,
          rule_note: ruleNote || null,
        }),
      });
      let json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Save self failed");

      // 2) Score für den Spieler den ich zähle (entered_by = ich, for = marksId)
      res = await fetch("/api/scoring/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: tournamentId,
          round,
          hole_number: hole,
          entered_by: registrationId,
          for_registration_id: marksId,
          strokes: markStrokes,
          rule_ball: ruleBall,
          rule_note: ruleNote || null,
        }),
      });
      json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Save marker failed");

      setOkMsg(`Gespeichert: Loch ${hole}`);

      // 3) Status prüfen
      await refreshHoleStatus(hole);

      // 4) Wenn bestätigt -> automatisch weiter
      // (kurzer Delay für UX)
      setTimeout(() => {
        if (confirmed) {
          setHole((h) => {
            if (h >= maxHole) return h;
            return h + 1;
          });
        }
      }, 350);
    } catch (e: any) {
      setErr(e?.message || "Save error");
    } finally {
      setSaving(false);
    }
  }

  const isLocked = confirmed; // confirmed => lock
  const canSave = !!info && !saving && !isLocked;

  return (
    <div style={{ maxWidth: 980, margin: "26px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <img src={LOGO_URL} alt="PRO1PUTT" style={{ height: 46, width: "auto", display: "block" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 1000, color: GREEN }}>Live Scoring</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Round {round}</div>
        </div>
        {statusLoading ? smallPill("Prüfe…") : confirmed ? smallPill("Bestätigt", true) : smallPill("Offen")}
      </div>

      {loading && <div style={{ opacity: 0.7 }}>Lade Flight…</div>}

      {!loading && err && (
        <div
          style={{
            ...cardStyle(),
            borderColor: "rgba(220,0,0,0.2)",
            background: "#fff0f0",
            color: "crimson",
            fontWeight: 900,
          }}
        >
          {err}
        </div>
      )}

      {!loading && info && (
        <>
          <div style={{ ...cardStyle(), marginBottom: 12 }}>
            <div style={{ fontWeight: 1000, color: GREEN, marginBottom: 6 }}>
              Flight #{info.flight_number}{" "}
              {info.start_time
                ? `• Start ${new Date(info.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </div>

            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
              Du zählst für: <b>{info.you_mark.marks_name}</b>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {info.members.map((m) => (
                <div
                  key={m.registration_id}
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: m.registration_id === registrationId ? "rgba(30,70,32,0.06)" : "#fff",
                  }}
                >
                  <div style={{ fontWeight: 1000 }}>
                    {m.first_name} {m.last_name}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>
                    {m.registration_id === registrationId ? "Du" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {okMsg && (
            <div
              style={{
                ...cardStyle(),
                background: "#e9f5ec",
                borderColor: "rgba(30,70,32,0.25)",
                color: GREEN,
                fontWeight: 1000,
                marginBottom: 12,
              }}
            >
              {okMsg}
            </div>
          )}

          <div style={cardStyle()}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div>
                <label style={labelStyle()}>Loch</label>
                <input
                  type="number"
                  min={1}
                  max={maxHole}
                  value={hole}
                  onChange={(e) => setHole(Number(e.target.value))}
                  style={inputStyle(false)}
                />
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
                  {confirmed ? "Dieses Loch ist bestätigt und gesperrt." : "Dieses Loch ist noch offen."}
                </div>
              </div>

              <div>
                <label style={labelStyle()}>Regelball?</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={ruleBall}
                    onChange={(e) => setRuleBall(e.target.checked)}
                    disabled={isLocked}
                  />
                  <span style={{ fontSize: 13, opacity: 0.8 }}>
                    Bei Regelball bitte möglichst Video aufnehmen.
                  </span>
                </div>
              </div>
            </div>

            {ruleBall && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle()}>Hinweis (optional)</label>
                <input
                  value={ruleNote}
                  onChange={(e) => setRuleNote(e.target.value)}
                  style={inputStyle(isLocked)}
                  placeholder="Kurz notieren, was passiert ist…"
                  disabled={isLocked}
                />
              </div>
            )}

            {statusMsg && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: confirmed ? "1px solid rgba(30,70,32,0.25)" : "1px solid rgba(0,0,0,0.12)",
                  background: confirmed ? "rgba(30,70,32,0.08)" : "rgba(0,0,0,0.03)",
                  color: confirmed ? GREEN : "#0f172a",
                  fontWeight: 900,
                }}
              >
                {statusMsg}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle()}>Dein Score (Loch {hole})</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={myStrokes}
                  onChange={(e) => setMyStrokes(Number(e.target.value))}
                  style={inputStyle(isLocked)}
                  disabled={isLocked}
                />
              </div>

              <div>
                <label style={labelStyle()}>Score für {info.you_mark.marks_name}</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={markStrokes}
                  onChange={(e) => setMarkStrokes(Number(e.target.value))}
                  style={inputStyle(isLocked)}
                  disabled={isLocked}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={saveHole}
              disabled={!canSave}
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: 14,
                background: !canSave ? "rgba(30,70,32,0.35)" : GREEN,
                color: "#fff",
                fontWeight: 1000,
                border: "none",
                cursor: !canSave ? "not-allowed" : "pointer",
              }}
            >
              {isLocked ? "Loch bestätigt ✅" : saving ? "Speichert..." : "Speichern"}
            </button>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              Regel: Loch gilt als <b>bestätigt</b>, wenn Spieler-Score und Marker-Score <b>identisch</b> sind. Dann wird das
              Loch gesperrt und es geht automatisch weiter.
            </div>
          </div>
        </>
      )}
    </div>
  );
}