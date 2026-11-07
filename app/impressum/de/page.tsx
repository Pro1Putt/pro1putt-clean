export const dynamic = "force-dynamic";

const DARK = "#0E2A1F";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontWeight: 900,
          fontSize: 15,
          letterSpacing: 0.4,
          color: DARK,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ opacity: 0.9, lineHeight: 1.7 }}>{value}</div>
    </div>
  );
}

export default function ImpressumPage() {
  return (
    <div style={{ padding: "32px 0" }}>
      <h1
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: DARK,
          marginBottom: 24,
        }}
      >
        Impressum
      </h1>

      <div
        style={{
          background: "white",
          borderRadius: 22,
          padding: 34,
          boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
        }}
      >
        <Row
          label="Verantwortlich gemäß § 5 TMG"
          value={
            <>
              Pro1Putt UG<br />
              Jennifer Menzel & Tim-Florian Menzel
            </>
          }
        />

        <Row
          label="Kontakt"
          value={
            <>
              E-Mail:{" "}
              <a
                href="mailto:info@pro1putt.com"
                style={{ fontWeight: 800, textDecoration: "none", color: DARK }}
              >
                info@pro1putt.com
              </a>
            </>
          }
        />

        <Row
          label="Registereintrag"
          value={
            <>
              Handelsregister: HRB 39765 P<br />
              Registergericht: Amtsgericht Potsdam
            </>
          }
        />

        <Row
          label="Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG"
          value="DE369634448"
        />

        <Row
          label="Aufsichtsbehörde"
          value="Amtsgericht Potsdam"
        />

        <div style={{ marginTop: 30, fontSize: 14, opacity: 0.75 }}>
          Stand: {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}