"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tournament = {
  id: string; name: string; course_name: string | null; location: string | null;
  start_date: string; end_date: string | null; slug: string | null;
  max_participants: number | null; registration_deadline: string | null;
  is_active: boolean; registration_open: boolean; registrations_count: number | null;
};
type FormData = {
  name: string; course_name: string; location: string; start_date: string; end_date: string;
  slug: string; max_participants: string; registration_deadline: string;
  is_active: boolean; registration_open: boolean;
};
const emptyForm: FormData = { name: "", course_name: "", location: "", start_date: "", end_date: "", slug: "", max_participants: "", registration_deadline: "", is_active: false, registration_open: false };
const green = "#0b5d3b";
const fieldStyle: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #cbd9d0", borderRadius: 10, boxSizing: "border-box", fontSize: 15, background: "#fff", color: "#17362b" };
const buttonStyle: React.CSSProperties = { padding: "11px 17px", border: "none", borderRadius: 10, background: green, color: "white", fontWeight: 700, cursor: "pointer" };
const toForm = (t: Tournament): FormData => ({ name: t.name || "", course_name: t.course_name || "", location: t.location || "", start_date: t.start_date || "", end_date: t.end_date || t.start_date || "", slug: t.slug || "", max_participants: t.max_participants == null ? "" : String(t.max_participants), registration_deadline: t.registration_deadline || "", is_active: t.is_active, registration_open: t.registration_open });

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const loadTournaments = async () => {
    const res = await fetch("/api/admin/tournaments", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Turniere konnten nicht geladen werden");
    setTournaments(data.tournaments || []);
    return data;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/tournaments", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.ok) { setAuthed(true); setTournaments(data.tournaments || []); }
        }
      } catch { /* Anmeldung erforderlich */ }
      finally { if (mounted) setChecking(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const login = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("Falscher PIN");
      await loadTournaments();
      setAuthed(true); setPin("");
    } catch (e) { setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen"); }
    finally { setBusy(false); }
  };

  const update = (key: keyof FormData, value: string | boolean) => setForm(f => ({ ...f, [key]: value }));
  const save = async () => {
    setError(""); setNotice("");
    if (!form.name.trim() || !form.course_name.trim() || !form.location.trim() || !form.start_date || !form.end_date || !form.slug.trim()) { setError("Bitte alle Pflichtfelder ausfüllen."); return; }
    if (form.registration_open && !form.is_active) { setError("Vor Öffnung der Anmeldung muss das Turnier aktiviert werden."); return; }
    if (editing !== "new" && form.registration_open && !window.confirm("Anmeldungen für dieses Turnier wirklich öffnen?")) return;
    setBusy(true);
    try {
      const payload = { ...form, ...(editing === "new" ? {} : { id: editing }), max_participants: form.max_participants === "" ? null : Number(form.max_participants), registration_deadline: form.registration_deadline || null };
      const res = await fetch("/api/admin/tournaments", { method: editing === "new" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      await loadTournaments();
      setEditing(null); setNotice(editing === "new" ? "Turnier als geschlossener Entwurf angelegt." : "Turnier erfolgreich gespeichert.");
    } catch (e) { setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen"); }
    finally { setBusy(false); }
  };

  if (checking) return <main style={{ minHeight: "100vh", background: "#f3f7f4", display: "grid", placeItems: "center", color: green }}>Admin-Sitzung wird geprüft …</main>;
  if (!authed) return <main style={{ minHeight: "100vh", background: green, display: "grid", placeItems: "center", padding: 20 }}>
    <div style={{ background: "white", borderRadius: 22, padding: 32, width: "100%", maxWidth: 380 }}>
      <h1 style={{ color: green, marginTop: 0 }}>PRO1PUTT Admin</h1>
      <p>Admin-PIN eingeben</p>
      <input aria-label="Admin-PIN" type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void login(); }} style={fieldStyle} />
      {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
      <button disabled={busy} onClick={() => void login()} style={{ ...buttonStyle, marginTop: 14, width: "100%" }}>{busy ? "Bitte warten …" : "Anmelden"}</button>
    </div>
  </main>;

  return <main style={{ minHeight: "100vh", background: "#f3f7f4", padding: "32px 16px", color: "#17362b" }}>
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <header style={{ background: "linear-gradient(135deg,#0b5d3b,#147a52)", color: "white", padding: 26, borderRadius: 20, marginBottom: 22 }}>
        <h1 style={{ margin: 0 }}>PRO1PUTT Admin</h1><p style={{ marginBottom: 0 }}>Turnierverwaltung & Flight-Einteilung</p>
      </header>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Turniere</h2>
        <button style={buttonStyle} onClick={() => { setEditing("new"); setForm({ ...emptyForm }); setError(""); setNotice(""); }}>+ Neues Turnier</button>
      </div>
      {notice && <p role="status" style={{ color: green, fontWeight: 700 }}>{notice}</p>}
      {error && <p role="alert" style={{ color: "#b42318", fontWeight: 700 }}>{error}</p>}
      {editing && <section style={{ background: "white", padding: 24, borderRadius: 18, marginBottom: 22, border: "1px solid #dce9df" }}>
        <h3 style={{ marginTop: 0 }}>{editing === "new" ? "Neues Turnier anlegen" : "Turnier bearbeiten"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {([ ["name","Turniername"], ["course_name","Golfplatz"], ["location","Ort"], ["start_date","Startdatum"], ["end_date","Enddatum"], ["slug","URL-Kürzel (Slug)"], ["max_participants","Maximale Teilnehmer"], ["registration_deadline","Anmeldeschluss"] ] as [keyof FormData,string][]).map(([key,label]) => <label key={key} style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 700 }}>{label}
            <input style={fieldStyle} type={key === "start_date" || key === "end_date" || key === "registration_deadline" ? "date" : key === "max_participants" ? "number" : "text"} min={key === "max_participants" ? "1" : undefined} value={String(form[key])} onChange={e => update(key, e.target.value)} />
          </label>)}
        </div>
        {editing === "new" ? <p style={{ color: "#657d70" }}>Neue Turniere werden immer inaktiv und mit geschlossener Anmeldung erstellt.</p> : <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 20 }}>
          <label><input type="checkbox" checked={form.is_active} onChange={e => { update("is_active", e.target.checked); if (!e.target.checked) update("registration_open", false); }} /> Turnier aktiv</label>
          <label><input type="checkbox" checked={form.registration_open} onChange={e => { if (e.target.checked && !form.is_active) { setError("Bitte zuerst das Turnier aktivieren."); return; } update("registration_open", e.target.checked); }} /> Anmeldung geöffnet</label>
        </div>}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button disabled={busy} style={{ ...buttonStyle, opacity: busy ? .6 : 1 }} onClick={() => void save()}>{busy ? "Speichern …" : "Speichern"}</button>
          <button disabled={busy} style={{ ...buttonStyle, background: "#e9efea", color: green }} onClick={() => { setEditing(null); setError(""); }}>Abbrechen</button>
        </div>
      </section>}
      <div style={{ display: "grid", gap: 14 }}>
        {tournaments.map(t => <article key={t.id} style={{ background: "white", padding: 22, borderRadius: 16, border: "1px solid #e0e9e3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 19 }}>{t.name}</h3>
              <p style={{ margin: "0 0 6px", color: "#617c6c" }}>{t.course_name || "Golfplatz nicht angegeben"} · {t.start_date}{t.end_date && t.end_date !== t.start_date ? ` – ${t.end_date}` : ""}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#617c6c" }}>{t.registrations_count ?? "?"} Anmeldungen · {t.is_active ? "Aktiv" : "Inaktiv"} · {t.registration_open ? "Anmeldung geöffnet" : "Anmeldung geschlossen"}{t.max_participants ? ` · Limit ${t.max_participants}` : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {t.start_date >= "2027-01-01" && <button style={{ ...buttonStyle, background: "#e6f2e9", color: green }} onClick={() => { setEditing(t.id); setForm(toForm(t)); setError(""); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Bearbeiten</button>}
              <button style={buttonStyle} onClick={() => router.push(`/admin/${t.id}`)}>Verwalten →</button>
            </div>
          </div>
        </article>)}
        {tournaments.length === 0 && <p>Keine Turniere vorhanden.</p>}
      </div>
    </div>
  </main>;
}
