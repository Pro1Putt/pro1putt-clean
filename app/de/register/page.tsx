"use client";



import React, { useEffect, useState } from "react";

type Tournament = {
  id: string;
  name: string | null;
  start_date: string | null;
  location: string | null;
  registration_open: boolean;
  is_active: boolean;
};

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "16px 17px",
    borderRadius: 14,
    background: "#f6f7ef",
    color: "#092b1c",
    fontSize: 15,
    border: "1px solid rgba(9,43,28,0.17)",
    outline: "none",
  };
}

function labelStyle(): React.CSSProperties {
  return { display: "block", fontWeight: 800, marginBottom: 9, color: "#092b1c", fontSize: 13, letterSpacing: 0.3 };
}

function calculateAge(birthdate: string, startDate: string): number | null {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) return null;
    return { year, month, day };
  };

  const birth = parse(birthdate);
  const start = parse(startDate);
  if (!birth || !start) return null;

  let age = start.year - birth.year;
  if (
    start.month < birth.month ||
    (start.month === birth.month && start.day < birth.day)
  ) age--;

  return age;
}

function getAgeGroup(age: number, holes: number): string {
  if (holes === 9) return age <= 10 ? "U10" : "U12";
  if (age <= 14) return "U14";
  if (age <= 16) return "U16";
  if (age <= 18) return "U18";
  return "U21";
}

export default function RegisterPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedBirthdate, setSelectedBirthdate] = useState("");
  const [selectedHoles, setSelectedHoles] = useState<number | null>(null);

  const tournament = tournaments.find((t) => t.id === selectedTournament);
  const registrationAvailable =
    tournament?.is_active === true &&
    tournament?.registration_open === true;
  const age =
    selectedBirthdate && tournament?.start_date
      ? calculateAge(selectedBirthdate, tournament.start_date)
      : null;

  const isNewTournament =
    !!tournament?.start_date &&
    tournament.start_date.slice(0, 10) >= "2026-10-18";

  const ageError =
    !isNewTournament
      ? null
      : age === null
      ? selectedBirthdate && selectedTournament
        ? "Invalid date of birth or tournament start date."
        : null
      : age < 0
        ? "Date of birth is after the first tournament day."
        : age > 21
          ? "Players must be 21 or younger on the first tournament day."
          : selectedHoles === 9 && age > 12
            ? "9-hole divisions are available only to players aged 12 or younger. Please select 18 holes."
            : null;

  const ageGroup =
    isNewTournament &&
    age !== null &&
    age >= 0 &&
    age <= 21 &&
    selectedHoles &&
    !ageError
      ? getAgeGroup(age, selectedHoles)
      : null;

  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [successPin, setSuccessPin] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/tournaments?view=tour2027");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Turniere konnten nicht geladen werden");
        if (!cancelled) {
          const today = new Date().toLocaleDateString("en-CA", {
            timeZone: "Europe/Berlin",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          setTournaments(
            (json.tournaments || [])
              .filter(
                (t: Tournament) => t.start_date && t.start_date.slice(0, 10) >= today
              )
              .sort((a: Tournament, b: Tournament) =>
                String(a.start_date).localeCompare(String(b.start_date))
              )
          );
        }
      } catch (e: any) {
        if (!cancelled) setLoadErr(e?.message || "Ladefehler");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);

    if (!registrationAvailable) {
      setSubmitErr("Die Anmeldung für dieses Turnier ist noch nicht geöffnet.");
      return;
    }

    if (ageError) {
      setSubmitErr(ageError);
      return;
    }

    setSubmitting(true);

    try {
      const form = e.target as HTMLFormElement;
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.email_language = "de";
      if (isNewTournament && (age === null || age < 0 || age > 21 ||
          (age >= 13 && selectedHoles !== 18))) {
        throw new Error("Please check the date of birth and playing format.");
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Anmeldung fehlgeschlagen");
      }

      setSuccessPin(null);
      form.reset();
      setSelectedTournament("");
      setSelectedBirthdate("");
      setSelectedHoles(null);

      const registrationId = String(json?.id ?? "");
      const paymentToken = String(json?.payment_token ?? "");

      if (!registrationId || !paymentToken) {
        throw new Error("Zahlung details are missing. Please contact PRO1PUTT.");
      }

      const paymentResponse = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          payment_token: paymentToken,
        }),
      });

      const payment = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          payment?.error || "Unable to create the PayPal order."
        );
      }

      const approvalUrl = Array.isArray(payment?.links)
        ? payment.links.find(
            (link: { rel?: string; href?: string }) =>
              (link.rel === "approve" || link.rel === "payer-action") &&
              typeof link.href === "string" &&
              (
                link.href.startsWith("https://www.sandbox.paypal.com/") ||
                link.href.startsWith("https://www.paypal.com/")
              )
          )?.href
        : null;

      if (!approvalUrl) {
        throw new Error("Unable to retrieve the PayPal payment link.");
      }

      sessionStorage.setItem("pro1putt_payment_language", "de");
      sessionStorage.removeItem("pro1putt_resume_token");
      sessionStorage.setItem(
        "pro1putt_pending_payment",
        JSON.stringify({
          registration_id: registrationId,
          payment_token: paymentToken,
        })
      );

      window.location.assign(approvalUrl);
      return;
    } catch (err: any) {
      setSubmitErr(err?.message || "Fehler beim Absenden");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>

    <div style={{ maxWidth: 960, margin: "0 auto", padding: "65px 20px 100px", fontFamily: "Lato, sans-serif" }}>
      <div style={{ color: "#55a64e", fontWeight: 900, fontSize: 12, letterSpacing: 3, marginBottom: 14 }}>PRO1PUTT · JUNIOR GOLF</div>
      <h1 style={{ fontSize: "clamp(34px, 6vw, 64px)", fontWeight: 900, color: "#092b1c", marginBottom: 12, letterSpacing: -2, lineHeight: 1.05 }}>
        DEIN NÄCHSTES TURNIER BEGINNT HIER.
      </h1>
      <p style={{ color: "#52665a", marginBottom: 35, fontSize: 16, lineHeight: 1.6 }}>Melde dich für dein nächstes PRO1PUTT-Turnier an. Mit * gekennzeichnete Felder sind Pflichtfelder.</p>

      {successPin && (
        <div
          style={{
            background: "#e9f5ec",
            border: "1px solid rgba(30,70,32,0.25)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 900, color: "#1e4620", marginBottom: 6 }}>
            Anmeldung gespeichert ✅
          </div>
          <div style={{ opacity: 0.85 }}>
            Your scoring PIN is:{" "}
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>
              {successPin}
            </span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
            PayPal checkout and your confirmation email are the next steps.
          </div>
        </div>
      )}

      {submitErr && (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid rgba(220,0,0,0.25)",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            color: "crimson",
            fontWeight: 700,
          }}
        >
          Error: {submitErr}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        style={{
          background: "#ffffff",
          borderRadius: 24,
          padding: "clamp(20px, 4vw, 42px)",
          boxShadow: "0 18px 55px rgba(9,43,28,0.07)",
          border: "1px solid rgba(9,43,28,0.09)",
        }}
      >
        {/* Turnier */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle()}>
            Turnier auswählen <span style={{ color: "crimson" }}>*</span>
          </label>

          {loadErr ? (
            <div style={{ color: "crimson", fontSize: 13 }}>
              Unable to load tournaments: {loadErr}
            </div>
          ) : (
            <select
              name="tournament_id"
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              style={inputStyle()}
              required
            >
              <option value="" disabled>
                Please select…
              </option>
              {tournaments
  .filter((t) => {
    const name = String(t.name || "").toLowerCase();
    return (
      t.id === "37508244-09bd-4563-ad70-8082e20f633c" ||
      (!name.includes("winston") &&
        !name.includes("faldo") &&
        !name.includes("test"))
    );
  })
  .map((t) => (
                <option key={t.id} value={t.id}>
                  {(t.name ?? "Turnier") +
                    (t.start_date ? ` • ${t.start_date}` : "") +
                    (t.location ? ` • ${t.location}` : "") +
                    (!t.is_active || !t.registration_open
                      ? " • Anmeldung noch nicht geöffnet"
                      : "")}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 9/18 */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle()}>
            Spielformat <span style={{ color: "crimson" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 12,
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="holes"
                value="9"
                checked={selectedHoles === 9}
                onChange={() => setSelectedHoles(9)}
                required
              />
              9 Holes (U10 / U12)
            </label>

            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 12,
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="holes"
                value="18"
                checked={selectedHoles === 18}
                onChange={() => setSelectedHoles(18)}
                required
              />
              18 Holes (U14 / U16 / U18 / U21)
            </label>
          </div>
        </div>

        {ageError && (
          <div style={{
            color: "crimson",
            background: "#fff0f0",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            fontWeight: 700
          }}>
            {ageError}
          </div>
        )}

        {ageGroup && (
          <div style={{
            color: "#1e4620",
            background: "#e9f5ec",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            fontWeight: 700
          }}>
            Age Wertungsklasse: {ageGroup} · Age on first tournament day: {age}
          </div>
        )}

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <div>
            <label style={labelStyle()}>
              Vorname <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="first_name" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Nachname <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="last_name" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              E-Mail <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="email" type="email" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Telefonnummer <span style={{ color: "crimson" }}>*</span>
            </label>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+49 170 1234567"
              style={inputStyle()}
              required
            />
          </div>

          <div>
            <label style={labelStyle()}>
              Handicap (HCP) <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="hcp" type="number" step="0.1" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Geburtsdatum <span style={{ color: "crimson" }}>*</span>
            </label>
            <input
              name="birthdate"
              type="date"
              value={selectedBirthdate}
              onChange={(e) => setSelectedBirthdate(e.target.value)}
              style={inputStyle()}
              required
            />
          </div>

          <div>
            <label style={labelStyle()}>
              Land (ISO-Code, z. B. DE) <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="nation" maxLength={2} style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Wertungsklasse <span style={{ color: "crimson" }}>*</span>
            </label>
            <select name="gender" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Please select…
              </option>
              <option value="Girls">Mädchen</option>
              <option value="Boys">Jungen</option>
            </select>
          </div>

          <div>
            <label style={labelStyle()}>
              Heimatgolfclub <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="home_club" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Trainer <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="coach" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Einlaufmusik <span style={{ color: "crimson" }}>*</span>
            </label>
            <input name="walkup_song" style={inputStyle()} required />
          </div>

          <div>
            <label style={labelStyle()}>
              Caddie <span style={{ color: "crimson" }}>*</span>
            </label>
            <select name="caddie" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Please select…
              </option>
              <option value="no">Without Caddie</option>
              <option value="yes">With Caddie</option>
            </select>
          </div>

          <div>
            <label style={labelStyle()}>
              WAGR Ranked? <span style={{ color: "crimson" }}>*</span>
            </label>
            <select name="wagr" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Please select…
              </option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div>
            <label style={labelStyle()}>
              Interested in College Golf? <span style={{ color: "crimson" }}>*</span>
            </label>
            <select name="college_interest" defaultValue="" style={inputStyle()} required>
              <option value="" disabled>
                Please select…
              </option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        <div style={{ height: 18 }} />


        <div style={{
          marginTop: 20,
          marginBottom: 20,
          padding: 20,
          borderRadius: 14,
          background: "#f6f7ef",
          color: "#092b1c",
          fontSize: 13,
          lineHeight: 1.6
        }}>
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
            <input type="checkbox" name="terms_accepted" value="true" required
              style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0 }} />
            <span dangerouslySetInnerHTML={{ __html: 'Als sorgeberechtigte oder zur Anmeldung bevollmächtigte Person bestätige ich, dass ich zur Anmeldung dieses Kindes berechtigt bin. Ich habe die <a href="/de/agb" target="_blank" rel="noopener noreferrer">AGB</a> und die <a href="/de/datenschutz" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a> gelesen und akzeptiere die AGB.' }} />
          </label>
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <input type="checkbox" name="public_listing_consent" value="true"
              style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0 }} />
            <span>Ich willige freiwillig ein, dass nach bestätigter Zahlung Vor- und Nachname, Landesflagge, Alters- und Wertungsklasse, Heimatgolfclub und Handicap des angemeldeten Kindes in der öffentlichen PRO1PUTT-Teilnehmerliste erscheinen. Diese Einwilligung kann ich jederzeit für die Zukunft widerrufen.</span>
          </label>
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 16 }}>
            <input type="checkbox" name="media_consent" value="true"
              style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0 }} />
            <span>Ich willige freiwillig ein, dass Foto- und Videoaufnahmen meines Kindes von PRO1PUTT zur Berichterstattung über Turniere sowie zur Bewerbung zukünftiger PRO1PUTT-Veranstaltungen auf der Website, auf Social Media (insbesondere Instagram) und in digitalen oder gedruckten Werbematerialien verwendet werden dürfen. Die Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden. Die Turnierteilnahme ist unabhängig von dieser Einwilligung möglich.</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "19px 22px",
            borderRadius: 14,
            background: submitting ? "#a7e78a" : "#80d65b",
            color: "#092b1c",
            fontWeight: 800,
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting..." : "REGISTER NOW →"}
        </button>

        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
          Next: PayPal checkout and a confirmation email with your scoring PIN.
        </div>
      </form>
    </div>
    </>
  );
}