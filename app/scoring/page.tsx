"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Save, RefreshCw, CheckCircle2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TOURNAMENT_ID = "7716349a-8bb0-46c6-b60c-3594eb7ea60f";

type Registration = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  holes?: number | null;
};

type ScoreRow = {
  player_id: string;
  hole_number: number;
  strokes: number | null;
  tournament_id: string;
  round_number: number;
};

function fullName(p: Registration) {
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
}

export default function ScoreEntryMask() {
  const [holeCount, setHoleCount] = useState<number>(18);
  const [players, setPlayers] = useState<Registration[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function loadPlayers() {
      setLoadingPlayers(true);
      setMessage("");

      const { data, error } = await supabase
        .from("registrations")
        .select("id, first_name, last_name, holes")
        .eq("tournament_id", TOURNAMENT_ID)
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (!mounted) return;

      if (error) {
        setMessage(`Fehler beim Laden der Spieler: ${error.message}`);
        setPlayers([]);
      } else {
        setPlayers((data ?? []) as Registration[]);
      }

      setLoadingPlayers(false);
    }

    loadPlayers();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => fullName(p).toLowerCase().includes(q));
  }, [players, search]);

  useEffect(() => {
    if (!selectedPlayerId) {
      setScores({});
      return;
    }

    let mounted = true;

    async function loadScores() {
      setLoadingScores(true);
      setMessage("");

      const { data, error } = await supabase
        .from("scores")
        .select("player_id, hole_number, strokes, tournament_id, round_number")
        .eq("tournament_id", TOURNAMENT_ID)
        .eq("player_id", selectedPlayerId)
        .eq("round_number", selectedRound)
        .order("hole_number", { ascending: true });

      if (!mounted) return;

      if (error) {
        setMessage(`Fehler beim Laden der Scores: ${error.message}`);
        setScores({});
      } else {
        const next: Record<number, string> = {};
        ((data ?? []) as ScoreRow[]).forEach((row) => {
          next[row.hole_number] = row.strokes == null ? "" : String(row.strokes);
        });
        setScores(next);
      }

      setLoadingScores(false);
    }

    loadScores();

    return () => {
      mounted = false;
    };
  }, [selectedPlayerId, selectedRound]);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || null;

  useEffect(() => {
    if (!selectedPlayerId) return;

    const player = players.find((p) => p.id === selectedPlayerId);
    if (player?.holes) {
      setHoleCount(player.holes);
    } else {
      setHoleCount(18);
    }
  }, [selectedPlayerId, players]);

  function updateHole(hole: number, value: string) {
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 2);
    setScores((prev) => ({ ...prev, [hole]: cleaned }));
  }

  async function saveScores() {
    if (!selectedPlayerId) {
      setMessage("Bitte zuerst einen Spieler auswählen.");
      return;
    }

    const rows = Array.from({ length: holeCount }, (_, i) => i + 1)
      .filter((hole) => scores[hole] && scores[hole].trim() !== "")
      .map((hole) => ({
        tournament_id: TOURNAMENT_ID,
        player_id: selectedPlayerId,
        round_number: selectedRound, // 👈 DAS IST DER FIX
        hole_number: hole,
        strokes: Number(scores[hole]),
      }));

    if (!rows.length) {
      setMessage("Bitte mindestens einen Score eintragen.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("scores").upsert(rows, {
     onConflict: "tournament_id,player_id,round_number,hole_number"
    });

    if (error) {
      setMessage(`Fehler beim Speichern: ${error.message}`);
    } else {
      setMessage(`Scores für Runde ${selectedRound} erfolgreich gespeichert.`);
    }

    setSaving(false);
  }

  async function reloadScores() {
    if (!selectedPlayerId) return;

    setLoadingScores(true);
    setMessage("");

    const { data, error } = await supabase
      .from("scores")
     .select("player_id, hole_number, strokes, tournament_id, round_number")
      .eq("tournament_id", TOURNAMENT_ID)
      .eq("player_id", selectedPlayerId)
      .eq("round", selectedRound)
      .order("hole_number", { ascending: true });

    if (error) {
      setMessage(`Fehler beim Neuladen: ${error.message}`);
      setLoadingScores(false);
      return;
    }

    const next: Record<number, string> = {};
    ((data ?? []) as ScoreRow[]).forEach((row) => {
      next[row.hole_number] = row.strokes == null ? "" : String(row.strokes);
    });

    setScores(next);
    setLoadingScores(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                PRO1PUTT Score Eingabe
              </p>
              <h1 className="mt-1 text-3xl font-black text-slate-900">
                Eingabemaske für Spieler
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Spieler nach Namen suchen, Runde auswählen, Scores eintragen und direkt speichern.
              </p>
            </div>

            <div className="grid gap-3 md:min-w-[360px]">
              <label className="text-sm font-bold text-slate-700">Runde auswählen</label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(Number(e.target.value))}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
              >
                <option value={1}>Runde 1</option>
                <option value={2}>Runde 2</option>
                <option value={3}>Runde 3</option>
              </select>

              <label className="text-sm font-bold text-slate-700">Spieler suchen</label>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="z. B. Elias oder Eirund"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <label className="text-sm font-bold text-slate-700">Spieler auswählen</label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
              >
                <option value="">
                  {loadingPlayers ? "Spieler werden geladen ..." : "Bitte Spieler auswählen"}
                </option>
                {filteredPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {fullName(p)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Scores</h2>
                <p className="text-sm text-slate-600">
                  {selectedPlayer ? `${fullName(selectedPlayer)} · Runde ${selectedRound}` : "Noch kein Spieler ausgewählt"}
                </p>
              </div>
              <button
                type="button"
                onClick={reloadScores}
                disabled={!selectedPlayerId || loadingScores}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Neu laden
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: holeCount }, (_, i) => i + 1).map((hole) => (
                <div key={hole} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 text-sm font-bold text-slate-700">Loch {hole}</div>
                  <input
                    inputMode="numeric"
                    value={scores[hole] ?? ""}
                    onChange={(e) => updateHole(hole, e.target.value)}
                    placeholder="Schläge"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-black outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-900">Speichern</h2>
            <p className="mt-2 text-sm text-slate-600">
              Die Maske speichert per Upsert. Bestehende Scores derselben Runde werden überschrieben, andere Runden bleiben erhalten.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-700">Ausgewählter Spieler</div>
              <div className="mt-1 text-base font-black text-slate-900">
                {selectedPlayer ? fullName(selectedPlayer) : "Noch keiner ausgewählt"}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-700">Aktive Runde</div>
              <div className="mt-1 text-base font-black text-slate-900">
                Runde {selectedRound}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-700">Turnier</div>
              <div className="mt-1 break-all text-sm text-slate-600">{TOURNAMENT_ID}</div>
            </div>

            <button
              type="button"
              onClick={saveScores}
              disabled={saving || loadingScores || !selectedPlayerId}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Speichert ..." : `Scores für Runde ${selectedRound} speichern`}
            </button>

            {message ? (
              <div className="mt-4 inline-flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}