"use client";

import { useMemo, useRef, useState } from "react";

const GREEN = "#1e4620";

function qs(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

export default function SignPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDown, setIsDown] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tournamentId = useMemo(() => qs("tournamentId"), []);
  const registrationId = useMemo(() => qs("registrationId"), []);
  const round = useMemo(() => Number(qs("round") || "1"), []);
  const role = useMemo(() => qs("role") || "player", []);

  function getCtx() {
    const c = canvasRef.current;
    if (!c) return null;
    const ctx = c.getContext("2d");
    return ctx;
  }

  function clear() {
    const c = canvasRef.current;
    const ctx = getCtx();
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    setStatus(null);
  }

  function start(e: any) {
    const c = canvasRef.current;
    const ctx = getCtx();
    if (!c || !ctx) return;
    setIsDown(true);
    const r = c.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: any) {
    if (!isDown) return;
    const c = canvasRef.current;
    const ctx = getCtx();
    if (!c || !ctx) return;
    const r = c.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    setIsDown(false);
  }

  async function submit() {
    setStatus(null);

    if (!tournamentId || !registrationId) {
      setStatus("❌ Missing tournamentId/registrationId in URL");
      return;
    }
    if (!name.trim()) {
      setStatus("❌ Bitte Name eingeben");
      return;
    }

    const c = canvasRef.current;
    if (!c) return;

    const dataUrl = c.toDataURL("image/png");

    setBusy(true);
    try {
      // 1) save signature
      const r1 = await fetch("/api/scoring/signature", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tournament_id: tournamentId,
          registration_id: registrationId,
          round,
          role,
          signed_name: name.trim(),
          signature_data_url: dataUrl,
        }),
      });
      const j1 = await r1.json();
      if (!j1?.ok) throw new Error(j1?.error || "signature failed");

      // 2) finalize role (checks missing roles, triggers mail when all done)
      const r2 = await fetch("/api/scoring/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tournament_id: tournamentId,
          registration_id: registrationId,
          round,
          role,
          signed_name: name.trim(),
          signature_data_url: dataUrl,
          // td_pin nur wenn role=td gebraucht -> dann als query/field ergänzen, falls du willst
        }),
      });
      const j2 = await r2.json();
      if (!j2?.ok) throw new Error(j2?.error || "finalize failed");

      if (j2.finalized) {
        setStatus("✅ Scorecard finalisiert. PDF kann jetzt exportiert werden (und wurde ans Sekretariat gesendet, wenn konfiguriert).");
      } else {
        setStatus(`✅ Signiert. Es fehlen noch: ${(j2.missing || []).join(", ")}`);
      }
    } catch (e: any) {
      setStatus(`❌ ${e?.message || "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  // init canvas background
  function initOnce(el: HTMLCanvasElement | null) {
    if (!el) return;
    canvasRef.current = el;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, el.width, el.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Lato, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ margin: 0, color: GREEN }}>Scorecard Signatur</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        Role: <b>{role}</b> • Round: <b>{round}</b>
      </p>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vorname Nachname"
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #cfd6cf",
              outline: "none",
              fontSize: 16,
            }}
          />
        </label>

        <div style={{ border: "1px solid #cfd6cf", borderRadius: 14, padding: 12, background: "#fff" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Hier unterschreiben (Maus/Finger)</div>
          <canvas
            ref={initOnce}
            width={820}
            height={220}
            style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid #e5ebe5", touchAction: "none" }}
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button
              onClick={clear}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #cfd6cf",
                background: "#fff",
                fontWeight: 700,
              }}
            >
              Löschen
            </button>
            <button
              onClick={submit}
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "none",
                background: GREEN,
                color: "#fff",
                fontWeight: 800,
                opacity: busy ? 0.7 : 1,
              }}
            >
              Signieren & Speichern
            </button>
          </div>
        </div>

        {status ? (
          <div style={{ padding: 12, borderRadius: 12, background: "#f5f7f5", border: "1px solid #dfe6df" }}>
            {status}
          </div>
        ) : null}
      </div>
    </main>
  );
}