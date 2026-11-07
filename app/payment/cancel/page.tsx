export default function PaymentCancelPage() {
  return (
    <main
      style={{
        maxWidth: 650,
        margin: "100px auto",
        padding: 30,
        textAlign: "center",
        fontFamily: "Lato, sans-serif",
      }}
    >
      <h1 style={{ color: "#0E2A1F" }}>
        Zahlung nicht abgeschlossen
      </h1>

      <p style={{ lineHeight: 1.7 }}>
        Deine PayPal-Zahlung wurde nicht abgeschlossen.
        Dein Startplatz bleibt zunächst bis zum Ablauf der
        Zahlungsfrist reserviert.
      </p>

      <p>
        Du kannst die Zahlung innerhalb der Zahlungsfrist
        erneut versuchen.
      </p>

      <a href="/" style={{ color: "#00A65A" }}>
        Zurück zu PRO1PUTT
      </a>
    </main>
  );
}
