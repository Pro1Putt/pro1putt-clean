// app/ausschreibung/page.tsx
export const dynamic = "force-dynamic";

const GREEN = "#00C46A";
const DARK = "#0E2A1F";
const BG = "#f8faf9";

// Lege die PDF hier ab: public/pro1putt-ausschreibung-2026.pdf
const PDF_URL = "/pro1putt-ausschreibung-2026.pdf";

function Badge({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.88)",
        fontWeight: 800,
        fontSize: 12.5,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",

        // wichtig: wirkt NICHT wie Button/Link
        cursor: "default",
        userSelect: "none",
        pointerEvents: "none",
        boxShadow: "none",
      }}
    >
      {children}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p1-card">
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10, color: DARK }}>{title}</div>
      <div style={{ opacity: 0.84, lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

function EventCard({
  title,
  date,
  location,
  intro,
  bullets,
}: {
  title: string;
  date: string;
  location: string;
  intro: string;
  bullets: string[];
}) {
  return (
    <div className="p1-eventcard">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 1,
            color: GREEN,
            textTransform: "uppercase",
          }}
        >
          LIMITED ENTRY
        </div>
        <span style={{ opacity: 0.55 }}>•</span>
        <div style={{ fontSize: 13, fontWeight: 900, color: DARK, opacity: 0.85 }}>{date}</div>
        <span style={{ opacity: 0.55 }}>•</span>
        <div style={{ fontSize: 13, fontWeight: 900, color: DARK, opacity: 0.85 }}>{location}</div>
      </div>

      <div style={{ fontWeight: 900, fontSize: 22, color: DARK, lineHeight: 1.15 }}>{title}</div>

      <div style={{ opacity: 0.82, lineHeight: 1.65 }}>{intro}</div>

      <ul style={{ margin: "6px 0 0", paddingLeft: 18, opacity: 0.86, lineHeight: 1.7 }}>
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      {/* BUTTONS — immer gleich hoch */}
      <div className="p1-event-actions">
        <a href="/register" className="p1-btn-primary">
          Jetzt anmelden →
        </a>
        <a href="#bedingungen" className="p1-btn-soft">
          Bedingungen ansehen
        </a>
      </div>

      <div className="p1-eventmeta">
        <div style={{ opacity: 0.85 }}>
          <span style={{ fontWeight: 900, color: DARK }}>Teilnahmegebühr:</span>{" "}
          <span style={{ fontWeight: 900 }}>9 Loch 165 €</span>{" "}
          <span style={{ opacity: 0.55 }}>•</span>{" "}
          <span style={{ fontWeight: 900 }}>18 Loch 215 €</span>
        </div>
        <div style={{ opacity: 0.85 }}>
          <span style={{ fontWeight: 900, color: DARK }}>Format:</span> 3 Runden ohne Cut • Die Runden sind handicaprelevant gemäß World Handicap System.
        </div>
      </div>
    </div>
  );
}

export default function AusschreibungPage() {
  return (
    <div style={{ fontFamily: "Lato, sans-serif", background: BG, color: "#111" }}>
      <style>{`
        .p1-topbar {
          position: sticky;
          top: 0;
          z-index: 60;
          background: rgba(14, 42, 31, 0.88);
          border-bottom: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .p1-navlink {
          color: rgba(255,255,255,0.92);
          text-decoration: none;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.4px;
          padding: 10px 10px;
          border-radius: 10px;
          transition: background 150ms ease, color 150ms ease;
          display: inline-block;
          white-space: nowrap;
        }
        .p1-navlink:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .p1-navcta {
          padding: 10px 14px;
          background: ${GREEN};
          color: #001a10;
          border-radius: 12px;
          font-weight: 900;
          text-decoration: none;
          font-size: 14px;
          box-shadow: 0 14px 30px rgba(0,0,0,0.18);
          white-space: nowrap;
          display: inline-block;
        }
        .p1-hero {
          position: relative;
          overflow: hidden;
          color: white;
          background: linear-gradient(135deg, #0E2A1F 0%, #123D2A 100%);
        }
        .p1-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(900px 520px at 50% 18%, rgba(255,255,255,0.10), transparent 60%),
            repeating-linear-gradient(135deg, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) 1px, transparent 1px, transparent 7px);
          opacity: 0.35;
          pointer-events: none;
        }
        .p1-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 25%, transparent 0%, rgba(0,0,0,0.36) 72%);
          pointer-events: none;
        }
        .p1-section-title {
          font-size: 30px;
          font-weight: 900;
          color: ${DARK};
          margin: 0 0 14px;
          letter-spacing: 0.2px;
        }
        .p1-subtitle {
          opacity: 0.78;
          margin: 0 auto;
          line-height: 1.65;
          max-width: 820px;
        }

        /* FEINSCHLIFF */
        .p1-card {
          background: white;
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 14px 40px rgba(0,0,0,0.07);
          border: 1px solid rgba(0,0,0,0.06);
        }

        .p1-eventcard {
          background: white;
          border-radius: 22px;
          padding: 26px;
          box-shadow: 0 18px 55px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          min-height: 520px; /* gleiche Höhe für alle Karten */
        }
        .p1-eventcard:hover {
          transform: translateY(-4px);
          box-shadow: 0 26px 70px rgba(0,0,0,0.12);
          border-color: rgba(0,196,106,0.35);
        }
        .p1-eventcard:focus-within {
          outline: 3px solid rgba(0,196,106,0.22);
          outline-offset: 2px;
        }

        .p1-event-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: auto; /* Buttons immer unten */
          padding-top: 18px;
        }

        .p1-btn-primary {
          display: inline-block;
          padding: 14px 18px;
          background: ${GREEN};
          color: #001a10;
          border-radius: 14px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 14px 34px rgba(0,0,0,0.18);
          white-space: nowrap;
          transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
        }
        .p1-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 44px rgba(0,0,0,0.22);
          filter: saturate(1.05);
        }

        .p1-btn-soft {
          display: inline-block;
          padding: 14px 18px;
          background: rgba(0,196,106,0.14);
          color: ${DARK};
          border-radius: 14px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
          transition: transform 160ms ease, background 160ms ease;
        }
        .p1-btn-soft:hover {
          transform: translateY(-1px);
          background: rgba(0,196,106,0.18);
        }

        .p1-eventmeta {
          margin-top: 8px;
          padding-top: 14px;
          border-top: 1px solid rgba(0,0,0,0.06);
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        @media (max-width: 860px) {
          .p1-topbar-inner { flex-direction: column; align-items: stretch; gap: 10px; }
          .p1-nav { justify-content: center; }
          .p1-cta { display: flex; justify-content: center; }
          .p1-eventcard { min-height: auto; } /* mobil: natürliche Höhe */
        }
      `}</style>{/* HERO */}
      <section className="p1-hero" style={{ padding: "64px 20px 60px" }}>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1050, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
  <Badge>WAGR & EGR</Badge>
  <Badge>Hole-in-One bis 10.000 €</Badge>
  <Badge>Caddies willkommen</Badge>
</div>

          <h1
style={{
  margin: "18px 0 10px",
  textAlign: "center",
  fontWeight: 900,
  fontSize: "clamp(30px, 8vw, 46px)",   // <- responsive
  letterSpacing: 0.6,
  lineHeight: 1.06,

  // <- sorgt dafür, dass lange Wörter nicht „abgeschnitten“ wirken
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  hyphens: "auto",
  padding: "0 6px",
}}
>
  PRO1PUTT Open
  <br />
  Turnierausschreibung
</h1>

          <p
            style={{
              textAlign: "center",
              maxWidth: 860,
              margin: "0 auto 22px",
              opacity: 0.92,
              lineHeight: 1.65,
              fontSize: 16,
            }}
          >
            Championship Courses. Internationale Standards. Drei Turniere – ein klares Ziel: Golf wie auf Profi-Niveau.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a
              href="/register"
              style={{
                display: "inline-block",
                padding: "16px 28px",
                background: GREEN,
                color: "#001a10",
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
                fontSize: 16,
                boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
              }}
            >
              Jetzt anmelden →
            </a>
            <a
              href={PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "16px 28px",
                border: "1.5px solid rgba(255,255,255,0.85)",
                color: "white",
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
                fontSize: 16,
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              Ausschreibung als PDF ↗
            </a>
            <a
              href="#events"
              style={{
                display: "inline-block",
                padding: "16px 28px",
                border: "1.5px solid rgba(255,255,255,0.22)",
                color: "rgba(255,255,255,0.95)",
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
                fontSize: 16,
                background: "rgba(0,0,0,0.10)",
              }}
            >
              Turniere ansehen
            </a>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" style={{ padding: "70px 20px 30px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="p1-section-title" style={{ textAlign: "center" }}>
            Die PRO1PUTT Tour 2026
          </h2>
          <p className="p1-subtitle" style={{ textAlign: "center" }}>
            Drei Stationen. Drei Top-Plätze. Drei Tage voller Spannung, Emotionen und Teamgeist – mit offizieller
            Anerkennung für WAGR & EGR.
          </p>

          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 18,
            }}
          >
            <EventCard
              title="PRO1PUTT Open Classics – WINSTONopen"
              date="30.03.–01.04.2026"
              location="WINSTONopen (WINSTONgolf)"
              intro="Auf dem renommierten WINSTONopen – sportlich anspruchsvoll, erstklassig gepflegt und bekannt aus internationalen Profi-Events. Jetzt sind die besten Juniorinnen & Junioren dran."
              bullets={[
                "WAGR & EGR zertifiziert – Punkte sichern",
                "Top-Bedingungen – internationaler Kurs",
                "Gemeinsames Abendessen am Finaltag",
                "Hole-in-One Preis",
              ]}
            />

            <EventCard
              title="PRO1PUTT Open – Faldo Course Bad Saarow"
              date="25.–27.09.2026"
              location="Faldo Course (Bad Saarow)"
              intro="Der Faldo Course – Design von Sir Nick Faldo, Championship-Anspruch, Turnierhistorie. Eine Bühne, auf der Junioren Golf-Geschichte schreiben."
              bullets={[
                "WAGR & EGR zertifiziert – wichtige Punkte",
                "Kurs-Setup auf Top-Niveau",
                "Gemeinsames Abendessen am Finaltag",
                "Hole-in-One Preis",
              ]}
            />

            <EventCard
              title="PRO1PUTT Open Finals – Green Eagle North Course"
              date="02.–04.10.2026"
              location="Green Eagle – North Course"
              intro="Der North Course: Länge, Wasser, Championship-Design – bekannt aus großen Profi-Events. Ein Finale, das jeder Spieler nie vergisst."
              bullets={[
                "WAGR & EGR zertifiziert – Punkte sichern",
                "Unvergessliches Erlebnis auf Pro-Level",
                "Gemeinsames Abendessen am Finaltag",
                "Hole-in-One Preis",
              ]}
            />
          </div>
        </div>
      </section>

      {/* OFFICIAL CONDITIONS */}
      <section id="bedingungen" style={{ padding: "60px 20px 70px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 className="p1-section-title" style={{ textAlign: "center" }}>
            Offizielle Teilnahme- & Spielbedingungen
          </h2>
          <p className="p1-subtitle" style={{ textAlign: "center" }}>
            Klar strukturiert für Spieler, Eltern, Clubs und Verbände. Änderungen vorbehalten.
          </p>

          <div
            style={{
              marginTop: 28,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            <Card title="Teilnahmebedingungen">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>
                  Teilnahmeberechtigt sind <strong>Amateure</strong>, Mitglied in einem national/international
                  anerkannten Verein, geboren <strong>nach dem 01.01.2005</strong>.
                </li>
                <li>
                  Startplätze nach <strong>„first come, first serve“</strong>.
                </li>
                <li>
                  <strong>Caddies</strong> sind willkommen.
                </li>
                <li>
                  <strong>Hole-in-One Award:</strong> bis zu <strong>10.000 €</strong> – bei mehreren Spielern faire
                  Aufteilung.
                </li>
              </ul>
            </Card>

            <Card title="Spielbedingungen (Regeln)">
              Gespielt wird nach den offiziellen Golfregeln (einschließlich Amateurstatut) des DGV und den jeweils
              veröffentlichten Platzregeln des Austragungsortes. Das Turnier wird nach dem{" "}
              <strong>World Handicap System</strong> ausgerichtet. Einsichtnahme in DGV-Verbandsordnungen ist im
              Sekretariat möglich.
            </Card>

            <Card title="Spielformat / Austragung">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>
                  <strong>Einzel-Zählspiel</strong>
                </li>
                <li>
                  <strong>3 Runden – ohne Cut</strong> (zusammenhängendes Wettspiel)
                </li>
                <li>
  9-Loch-Wettbewerb: 3 Runden à 9 Loch (Gesamt 27 Loch)
</li>
                <li>
                  18 Loch: <strong>54 Loch</strong> Gesamt
                </li>
                <li>
                  <strong>Die Runden sind handicaprelevant gemäß World Handicap System</strong>
                </li>
              </ul>
            </Card>

            <Card title="Abschläge (Tees)">
              <div style={{ fontWeight: 900, color: DARK, marginBottom: 6 }}>U12 (9 Loch)</div>
              <ul style={{ margin: "0 0 12px", paddingLeft: 18 }}>
                <li>Boys – Rot</li>
                <li>Girls – Orange</li>
              </ul>

              <div style={{ fontWeight: 900, color: DARK, marginBottom: 6 }}>U21 (18 Loch)</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Boys – Gelb</li>
                <li>Girls – Rot</li>
              </ul>
            </Card>

            <Card title="Startreihenfolge & Startlisten">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Startreihenfolge wird von der Spielleitung festgelegt.</li>
                <li>
                  <strong>Startlisten</strong> am Tag vor Turnierbeginn ab <strong>17:00 Uhr</strong>.
                </li>
              </ul>
            </Card>

            <Card title="Live-Scoring (verpflichtend)">
              Die Eingabe der Ergebnisse nach Beendigung <strong>jedes gespielten Loches</strong> direkt in das
              Live-Scoring ist verpflichtend.

              Trotz Live-Scoring bleibt die ordnungsgemäße Abgabe
und Gegenzeichnung der Scorekarte gemäß DGV-Regelwerk verpflichtend.
            </Card>

            <Card title="Caddies">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Ja</li>
                <li>Golfprofessionals als Caddies bis U-12 erlaubt</li>
              </ul>
            </Card>

            <Card title="Hilfsmittel / Anmerkungen">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Entfernungsmessgeräte sind gemäß Regel 4.3a erlaubt,
sofern ausschließlich Entfernungen gemessen werden.
Slope- oder Windfunktionen sind nicht zulässig.</li>
                <li>Electro-Trolleys nicht gestattet</li>
              </ul>
            </Card>

            <Card title="Stechen / Turnierende">
  <ul style={{ margin: 0, paddingLeft: 18 }}>
    <li>
  Grundlage ist die jeweils gültige DGV-Wettspielordnung.
</li>
    <li>
      Bei Schlaggleichheit um <strong>Platz 1</strong> erfolgt ein <strong>Sudden-Death-Playoff</strong>.
    </li>
    <li>
      Sollte ein Playoff nicht möglich sein (z. B. aus Zeit- oder Witterungsgründen),
      entscheidet das Kartenstechen.
    </li>
    <li>
      Für alle weiteren Platzierungen erfolgt das Kartenstechen nach folgender Systematik:
      <ul style={{ marginTop: 8, paddingLeft: 18 }}>
        <li>Letzte 9 Löcher (10–18 bei 18-Loch-Wettspiel)</li>
        <li>Bei weiterer Gleichheit: letzte 6 Löcher</li>
        <li>Bei weiterer Gleichheit: letzte 3 Löcher</li>
        <li>Bei weiterer Gleichheit: letztes Loch</li>
        <li>Besteht weiterhin Gleichstand, entscheidet das Los.</li>
      </ul>
    </li>
    <li>
      Maßgeblich ist das Bruttoergebnis gemäß DGV-Wettspielordnung.
    </li>
    <li>
      Die Siegerehrung findet direkt nach Eintreffen des letzten Flights statt.
      Mit der Siegerehrung ist das Turnier offiziell beendet.
    </li>
  </ul>
</Card>

            <Card title="Alterskategorien (Boys & Girls)">
              <div style={{ fontWeight: 900, color: DARK, marginBottom: 6 }}>Overall U21 (18 Loch)</div>
              <ul style={{ margin: "0 0 12px", paddingLeft: 18 }}>
                <li>Kategorie 20–21</li>
                <li>Kategorie 17–19</li>
                <li>Kategorie 15–16</li>
                <li>Kategorie 13–14</li>
              </ul>

              <div style={{ fontWeight: 900, color: DARK, marginBottom: 6 }}>Overall U12 (9 Loch)</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Kategorie 11–12</li>
                <li>Kategorie 9–10</li>
                <li>Kategorie U8</li>
              </ul>

              <div style={{ marginTop: 12, opacity: 0.85 }}>
                Spieler, die sich für den 18-Loch-Wettbewerb anmelden,
werden unabhängig vom Alter in der entsprechenden 18-Loch-Altersklasse gewertet.
              </div>
            </Card>

            <Card title="Teilnahmegebühr & Anmeldung">
              <div style={{ fontWeight: 900, color: DARK, marginBottom: 8 }}>Teilnahmegebühr</div>
              <div style={{ opacity: 0.9 }}>
                9 Loch – <strong>165 €</strong>
                <br />
                18 Loch – <strong>215 €</strong>
              </div>
              <div style={{ height: 12 }} />
              <div style={{ fontWeight: 900, color: DARK, marginBottom: 8 }}>Anmeldung</div>
              Anmeldungen sind nur über{" "}
              <a href="https://www.pro1putt.com" style={{ color: GREEN, fontWeight: 900, textDecoration: "none" }}>
                www.pro1putt.com
              </a>{" "}
              möglich.
              <div style={{ height: 12 }} />
              <div style={{ fontWeight: 900, color: DARK, marginBottom: 8 }}>Einspielrunde</div>
              Eine kostenlose Einspielrunde ist ausschließlich nach vorheriger Reservierung
über das jeweilige Clubsekretariat möglich.
            </Card>
            <Card title="Spielleitung">
  Die Spielleitung wird vor Turnierbeginn bekannt gegeben.
  Die Spielleitung entscheidet in allen Zweifelsfragen endgültig.
  Entscheidungen der Spielleitung sind unanfechtbar, soweit die DGV-Wettspielordnung nichts anderes vorsieht.
</Card>
<Card title="Regelverstöße / Disqualifikation">
  Bei Verstößen gegen die offiziellen Golfregeln,
  die DGV-Wettspielordnung oder diese Ausschreibung
  kann die Spielleitung Strafen verhängen oder eine
  Disqualifikation aussprechen.
</Card>

            <Card title="Definition anerkannter Club">
  Teilnahmeberechtigt sind Spielerinnen und Spieler, die Mitglied eines Golfclubs sind,
  der einem nationalen Golfverband angehört, welcher Mitglied der
  <strong>International Golf Federation (IGF)</strong> oder eines
  offiziell anerkannten nationalen Dachverbandes (z. B. DGV, ÖGV, Swiss Golf usw.) ist.
  <br /><br />
  Der Nachweis erfolgt über eine gültige Clubmitgliedschaft und ein
  offiziell geführtes Handicap nach dem World Handicap System.
</Card>

            <Card title="Abmeldung vom Turnier">
  <ul style={{ margin: 0, paddingLeft: 18 }}>
    <li>
      Eine Stornierung ist ausschließlich schriftlich per E-Mail an
      <strong> info@pro1putt.com </strong> möglich. Maßgeblich ist der Zeitpunkt
      des Eingangs beim Veranstalter.
    </li>
    <li>
      Bis 30 Tage vor Turnierbeginn: <strong>50 % Rückerstattung</strong>
    </li>
    <li>
      Weniger als 30 Tage vor Turnierbeginn: <strong>30 % Rückerstattung</strong>
    </li>
    <li>
      Weniger als 15 Tage vor Turnierbeginn: <strong>keine Rückerstattung</strong>
    </li>
    <li>
      Eine teilweise Teilnahme oder ein Nichtantritt („No-Show“) begründet keinen
      Erstattungsanspruch. Ein Anspruch auf Umbuchung besteht nicht.
    </li>
    <li>
      Auch im Falle von Krankheit, Verletzung oder sonstigen persönlichen Gründen
      besteht kein Anspruch auf Rückerstattung. Es wird der Abschluss einer privaten
      Reiserücktritts- oder Veranstaltungsausfallversicherung empfohlen.
    </li>
    <li>
      Es gelten ergänzend die veröffentlichten Allgemeinen Geschäftsbedingungen.
    </li>
  </ul>
</Card>
<Card title="Mindestteilnehmerzahl / Absage">
  Der Veranstalter behält sich vor, das Turnier oder einzelne Wertungsklassen
  bei unzureichender Teilnehmerzahl oder aus organisatorischen Gründen abzusagen.
  Bereits gezahlte Teilnahmegebühren werden in diesem Fall vollständig erstattet.
  Weitergehende Ansprüche sind ausgeschlossen.
</Card>
<Card title="Höhere Gewalt / Unbespielbarkeit">
  Bei witterungsbedingter Unbespielbarkeit des Platzes oder
  sonstigen Fällen höherer Gewalt kann die Spielleitung
  Runden verkürzen, unterbrechen oder absagen.
  Eine Wertung erfolgt gemäß DGV-Wettspielordnung.
  Ein Anspruch auf vollständige Durchführung aller Runden besteht nicht.
</Card>
<Card title="Datenschutz / Bildrechte">
  Mit der Anmeldung erklären sich die Teilnehmer bzw. deren Erziehungsberechtigte
  einverstanden, dass im Rahmen der Veranstaltung erhobene Daten
  für die Turnierabwicklung, Ergebnisveröffentlichung sowie
  für Berichterstattung und Öffentlichkeitsarbeit verwendet werden dürfen.
  Ergebnisse werden veröffentlicht (Startlisten, Ergebnislisten, Ranglisten).
  Foto- und Videoaufnahmen dürfen im Zusammenhang mit der Veranstaltung
  veröffentlicht werden.
  Es gelten ergänzend die Datenschutzbestimmungen des Veranstalters.
</Card>
<Card title="Haftung">
  Der Veranstalter haftet nur für Schäden, die auf vorsätzlichem oder grob fahrlässigem Verhalten beruhen.
  Die Teilnahme erfolgt auf eigene Gefahr.
  Für Sach- und Personenschäden wird keine Haftung übernommen,
  soweit gesetzlich zulässig.
</Card>
          </div>

          <div
            style={{
              marginTop: 28,
              background: "rgba(14, 42, 31, 0.06)",
              border: "1px solid rgba(14, 42, 31, 0.12)",
              borderRadius: 18,
              padding: 18,
              textAlign: "center",
              color: DARK,
              fontWeight: 800,
            }}
          >
            Änderungsvorbehalt • PRO1PUTT Open 2026
          </div>
          <div
  style={{
    marginTop: 18,
    textAlign: "center",
    fontSize: 13,
    opacity: 0.7,
  }}
>
  Diese Ausschreibung ist Bestandteil der Turnieranmeldung.
</div>

          <div style={{ marginTop: 26, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a
              href="/register"
              style={{
                display: "inline-block",
                padding: "16px 28px",
                background: GREEN,
                color: "#001a10",
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
                fontSize: 16,
                boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
              }}
            >
              Jetzt Startplatz sichern →
            </a>

            <a
              href={PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "16px 28px",
                background: "white",
                color: DARK,
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
                fontSize: 16,
                border: "1px solid rgba(0,0,0,0.10)",
              }}
            >
              PDF herunterladen ↗
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "26px 20px", textAlign: "center", opacity: 0.75, fontSize: 13 }}>
        © {new Date().getFullYear()} PRO1PUTT •{" "}
        <a href="/impressum" style={{ textDecoration: "none", fontWeight: 800 }}>
          Impressum
        </a>{" "}
        •{" "}
        <a href="/agb" style={{ textDecoration: "none", fontWeight: 800 }}>
          AGB
        </a>{" "}
        •{" "}
        <a href="/datenschutz" style={{ textDecoration: "none", fontWeight: 800 }}>
          Datenschutz
        </a>
      </footer>
    </div>
  );
}