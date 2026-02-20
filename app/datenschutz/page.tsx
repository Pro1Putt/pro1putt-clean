export const dynamic = "force-dynamic";

const DARK = "#0E2A1F";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: DARK }}>
        {title}
      </h2>
      <div style={{ lineHeight: 1.75, opacity: 0.92 }}>
        {children}
      </div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <div style={{ padding: "32px 0" }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, color: DARK, marginBottom: 8 }}>
        Datenschutzerklärung
      </h1>

      <p style={{ marginBottom: 24, opacity: 0.7 }}>
        Letzte Aktualisierung: 11. April 2025
      </p>

      <div
        style={{
          background: "white",
          borderRadius: 22,
          padding: 34,
          boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
        }}
      >

        <Section title="1. Verantwortlicher">
          Pro1Putt UG<br />
          Jennifer Menzel & Tim-Florian Menzel<br />
          Zum Weiher 32<br />
          14552 Michendorf, Deutschland<br />
          E-Mail: info@pro1putt.com
        </Section>

        <Section title="2. Erhebung personenbezogener Daten">
          Wir verarbeiten personenbezogene Daten nur, soweit dies zur
          Durchführung unserer Turniere und zur Bereitstellung unserer
          Website erforderlich ist.
          <br /><br />
          Dies umfasst insbesondere:
          <ul style={{ marginTop: 8 }}>
            <li>Name, Geburtsdatum, Geschlecht</li>
            <li>Golfclub, Handicap</li>
            <li>E-Mail-Adresse, Telefonnummer</li>
            <li>Startlisten- und Ergebnisdaten</li>
            <li>Zahlungsinformationen (über externe Zahlungsdienstleister)</li>
          </ul>
        </Section>

        <Section title="3. Rechtsgrundlagen">
          Die Verarbeitung erfolgt gemäß Art. 6 DSGVO:
          <ul style={{ marginTop: 8 }}>
            <li>Art. 6 Abs. 1 lit. b (Vertragserfüllung)</li>
            <li>Art. 6 Abs. 1 lit. c (gesetzliche Verpflichtung)</li>
            <li>Art. 6 Abs. 1 lit. f (berechtigtes Interesse)</li>
            <li>Art. 6 Abs. 1 lit. a (Einwilligung)</li>
          </ul>
        </Section>

        <Section title="4. Veröffentlichung von Turnierergebnissen">
          Im Rahmen der Veranstaltung veröffentlichen wir Startlisten,
          Ranglisten und Ergebnisse (Name, Altersklasse, Club, Score)
          auf unserer Website sowie ggf. auf offiziellen Rankingplattformen.
        </Section>

        <Section title="5. Google Analytics">
          Diese Website nutzt Google Analytics, einen Webanalysedienst der
          Google Ireland Limited.
          <br /><br />
          Google Analytics verwendet Cookies, die eine Analyse der Benutzung
          der Website ermöglichen. Die erzeugten Informationen werden in der
          Regel an einen Server von Google übertragen und dort gespeichert.
          <br /><br />
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO
          (Einwilligung).
          <br /><br />
          Sie können Ihre Einwilligung jederzeit widerrufen.
        </Section>

        <Section title="6. Hosting und technische Dienstleister">
          Unsere Website wird betrieben über:
          <ul style={{ marginTop: 8 }}>
            <li>Vercel Inc. (Hosting)</li>
            <li>Supabase Inc. (Datenbank-Infrastruktur)</li>
            <li>GitHub Inc. (Code-Hosting und Deployment)</li>
          </ul>
          Mit diesen Anbietern bestehen Verträge zur Auftragsverarbeitung
          gemäß Art. 28 DSGVO.
        </Section>

        <Section title="7. Datenübermittlung in Drittländer">
          Eine Übermittlung personenbezogener Daten in Länder außerhalb der EU
          erfolgt nur unter Einhaltung der gesetzlichen Voraussetzungen,
          insbesondere auf Grundlage von Standardvertragsklauseln gemäß
          Art. 46 DSGVO.
        </Section>

        <Section title="8. Speicherdauer">
          Personenbezogene Daten werden nur so lange gespeichert,
          wie es für die Durchführung der Veranstaltung oder zur Erfüllung
          gesetzlicher Pflichten erforderlich ist.
        </Section>

        <Section title="9. Ihre Rechte">
          Sie haben folgende Rechte:
          <ul style={{ marginTop: 8 }}>
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch (Art. 21 DSGVO)</li>
          </ul>
          Zur Ausübung genügt eine E-Mail an info@pro1putt.com.
        </Section>

        <Section title="10. Beschwerderecht">
          Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde
          zu beschweren.
        </Section>

        <Section title="11. Datensicherheit">
          Wir setzen technische und organisatorische Maßnahmen ein,
          um Ihre Daten vor Verlust, Manipulation oder unbefugtem Zugriff zu schützen.
        </Section>

        <div style={{ marginTop: 40, fontSize: 14, opacity: 0.7 }}>
          Stand: 11. April 2025
        </div>

      </div>
    </div>
  );
}