export const dynamic = "force-dynamic";

const DARK = "#0E2A1F";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 900,
          marginBottom: 12,
          color: DARK,
          letterSpacing: 0.4,
        }}
      >
        {title}
      </h2>
      <div style={{ lineHeight: 1.75, opacity: 0.92 }}>{children}</div>
    </section>
  );
}

export default function AgbPage() {
  return (
    <div style={{ padding: "32px 0" }}>
      <h1
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: DARK,
          marginBottom: 8,
        }}
      >
        Allgemeine Geschäftsbedingungen (AGB)
      </h1>

      <p style={{ marginBottom: 28, opacity: 0.7 }}>
        der Jugend-Golfturnierorganisation <strong>Pro1Putt UG</strong>
      </p>

      <div
        style={{
          background: "white",
          borderRadius: 22,
          padding: 34,
          boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
        }}
      >
        <Section title="1. Geltungsbereich">
          Diese Allgemeinen Geschäftsbedingungen gelten für sämtliche
          Jugend-Golfturniere, die von der Pro1Putt UG (nachfolgend
          „Veranstalter“) organisiert und durchgeführt werden.
          <br /><br />
          Sie regeln das Vertragsverhältnis zwischen dem Veranstalter und
          den teilnehmenden Personen sowie deren gesetzlichen Vertretern.
        </Section>

        <Section title="2. Teilnahmeberechtigung">
          Teilnahmeberechtigt sind Kinder und Jugendliche bis einschließlich
          21 Jahre, die zum Zeitpunkt des Turniers im Besitz einer gültigen
          Golfmitgliedschaft sind und die jeweils ausgeschriebenen
          Teilnahmevoraussetzungen erfüllen.
          <br /><br />
          Die Anmeldung muss durch einen Erziehungsberechtigten erfolgen
          bzw. von diesem ausdrücklich genehmigt werden.
          <br /><br />
          Der Veranstalter behält sich das Recht vor, Anmeldungen ohne
          Angabe von Gründen abzulehnen.
        </Section>

        <Section title="3. Anmeldung, Vertragsabschluss und Zahlungsbedingungen">
          Die Anmeldung erfolgt online oder schriftlich über das offizielle
          Anmeldeformular.
          <br /><br />
          Der Vertrag kommt erst zustande, wenn:
          <ul style={{ marginTop: 10 }}>
            <li>die Anmeldung beim Veranstalter eingegangen ist und</li>
            <li>die Teilnahmegebühr vollständig bezahlt wurde.</li>
          </ul>
          Erst mit vollständigem Zahlungseingang besteht ein verbindlicher
          Anspruch auf einen Startplatz.
        </Section>

        <Section title="4. Rücktritt, Stornierung und Nichtantritt">
          <strong>4.1 Rücktritt durch Teilnehmer</strong>
          <br /><br />
          Eine Stornierung ist ausschließlich schriftlich per E-Mail an
          <strong> info@pro1putt.com</strong> möglich.
          Maßgeblich ist der Zeitpunkt des Eingangs beim Veranstalter.
          <br /><br />
          Es gelten folgende Regelungen:
          <ul style={{ marginTop: 10 }}>
            <li>Bis 30 Tage vor Turnierbeginn: 50 % Rückerstattung</li>
            <li>Weniger als 30 Tage vor Turnierbeginn: 30 % Rückerstattung</li>
            <li>Weniger als 15 Tage vor Turnierbeginn: keine Rückerstattung</li>
          </ul>
          Eine teilweise Teilnahme oder ein Nichtantritt (No-Show)
          begründet keinen Erstattungsanspruch.
          Ein Anspruch auf Umbuchung besteht nicht.
          <br /><br />
          <strong>4.2 Medizinische oder persönliche Gründe</strong>
          <br /><br />
          Auch im Falle von Krankheit, Verletzung oder sonstigen persönlichen
          Gründen besteht kein Anspruch auf Rückerstattung.
          Der Abschluss einer privaten Reiserücktritts- oder
          Veranstaltungsausfallversicherung wird ausdrücklich empfohlen.
        </Section>

        <Section title="5. Durchführung der Turniere">
          Die Durchführung erfolgt gemäß der jeweiligen Ausschreibung.
          Der Veranstalter ist berechtigt:
          <ul style={{ marginTop: 10 }}>
            <li>Startzeiten, Flights oder Spielmodus anzupassen</li>
            <li>organisatorische Änderungen vorzunehmen</li>
            <li>Turnierregeln im Rahmen der geltenden Golfregeln anzupassen</li>
          </ul>
          Hieraus entsteht kein Anspruch auf Rückerstattung.
        </Section>

        <Section title="6. Höhere Gewalt / Veranstalterabsage">
          Der Veranstalter ist berechtigt, die Veranstaltung aus wichtigem
          Grund abzusagen, zu verschieben, zu verkürzen oder im Ablauf
          anzupassen.
          <br /><br />
          Als wichtige Gründe gelten insbesondere:
          <ul style={{ marginTop: 10 }}>
            <li>höhere Gewalt</li>
            <li>extreme Wetterbedingungen</li>
            <li>behördliche Anordnungen</li>
            <li>Sicherheitsrisiken</li>
            <li>Platzsperrungen</li>
            <li>unvorhersehbare Ereignisse außerhalb des Einflussbereichs</li>
          </ul>
          In diesen Fällen besteht kein Anspruch auf Rückerstattung.
          <br /><br />
          Weitergehende Ansprüche – insbesondere Ersatz von Reise-,
          Übernachtungs- oder sonstigen Aufwendungen – sind ausgeschlossen,
          soweit keine vorsätzliche oder grob fahrlässige Pflichtverletzung
          des Veranstalters vorliegt.
        </Section>

        <Section title="7. Verhalten, Dresscode und Aufsicht">
          Die Teilnehmer verpflichten sich zu sportlich fairem Verhalten
          sowie zur Einhaltung der Golfregeln, Platzregeln und
          Anweisungen der Turnierleitung.
          <br /><br />
          Es gilt ein verbindlicher Dresscode. Angemessene Golfkleidung ist
          vorgeschrieben. Das Tragen von Jeans ist nicht gestattet.
          <br /><br />
          Bei schwerwiegenden Verstößen kann ein Ausschluss vom Turnier
          erfolgen. Ein Anspruch auf Rückerstattung besteht in diesem Fall nicht.
          <br /><br />
          Die Aufsichtspflicht verbleibt grundsätzlich bei den
          Erziehungsberechtigten, sofern keine ausdrückliche schriftliche
          Übernahme durch den Veranstalter erfolgt.
        </Section>

        <Section title="8. Hole-in-One-Preis">
          Ein Hole-in-One-Preis wird ausschließlich am Finaltag ausgeschüttet.
          Erzielen mehrere Spieler:innen am Finaltag ein Hole-in-One,
          wird der Gewinn gleichmäßig aufgeteilt.
          <br /><br />
          Es gelten die detaillierten Bedingungen der jeweiligen
          Turnierausschreibung. Ein Rechtsanspruch auf Sachpreise besteht nicht.
        </Section>

        <Section title="9. Haftung">
          Die Teilnahme erfolgt auf eigene Gefahr.
          <br /><br />
          Der Veranstalter haftet nur für Schäden, die auf vorsätzlichem
          oder grob fahrlässigem Verhalten beruhen.
          <br /><br />
          Bei einfacher Fahrlässigkeit haftet der Veranstalter nur bei
          Verletzung wesentlicher Vertragspflichten (Kardinalpflichten)
          und begrenzt auf den vorhersehbaren, vertragstypischen Schaden.
          <br /><br />
          Für Verlust oder Beschädigung persönlicher Gegenstände wird
          keine Haftung übernommen.
        </Section>

        <Section title="10. Datenschutz / Foto- und Videoaufnahmen">
          Im Rahmen der Veranstaltung können Foto- und Videoaufnahmen
          erstellt werden.
          <br /><br />
          Diese dürfen für Website, Social Media, Pressearbeit und
          Turnierdokumentation verwendet werden.
          <br /><br />
          Mit der Anmeldung erklären sich die Erziehungsberechtigten
          damit einverstanden, sofern kein schriftlicher Widerspruch
          vor Veranstaltungsbeginn erfolgt.
          <br /><br />
          Die Verarbeitung personenbezogener Daten erfolgt gemäß den
          geltenden Datenschutzbestimmungen.
        </Section>

        <Section title="11. Schlussbestimmungen">
          Es gilt deutsches Recht.
          <br /><br />
          Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise
          unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen
          unberührt.
          <br /><br />
          Gerichtsstand ist – soweit gesetzlich zulässig – der Sitz
          des Veranstalters.
        </Section>

        <div style={{ marginTop: 40, fontSize: 14, opacity: 0.75 }}>
          Michendorf, 01.01.2025<br />
          Pro1Putt UG<br />
          Jennifer Menzel & Tim-Florian Menzel<br />
          Kontakt: info@pro1putt.com
        </div>
      </div>
    </div>
  );
}