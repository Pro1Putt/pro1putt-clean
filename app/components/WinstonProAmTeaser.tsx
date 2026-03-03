export default function WinstonProAmTeaser() {
  const GREEN = "#00C46A";
  const DARK = "#0E2A1F";

  return (
    <section style={{ padding: "18px 20px", background: "#f8faf9" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.08)",
          background:
            "linear-gradient(135deg, rgba(14,42,31,0.06) 0%, rgba(0,196,106,0.06) 100%)",
          padding: "16px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              background: DARK,
              color: "white",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              boxShadow: "0 14px 30px rgba(0,0,0,0.10)",
            }}
          >
            🔥 Hammer Gewinn
          </span>

          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 900, color: DARK, fontSize: 15 }}>
              WINSTONopen: Top 3 Girls (18 Loch) sichern ProAm-Startplatz (LET Access Series)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.7 }}>Powered by</span>
              <a href="https://www.vcg.de" target="_blank" rel="noreferrer" style={{ display: "inline-flex" }}>
                <img
                  src="/partners/vcg-logo.svg"
                  alt="VCG"
                  style={{ height: 22, width: "auto", objectFit: "contain" }}
                />
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="#tour"
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: "white",
              border: "1px solid rgba(0,0,0,0.10)",
              fontWeight: 900,
              color: DARK,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Details ansehen →
          </a>
          <a
            href="/register"
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              background: GREEN,
              color: "#001a10",
              fontWeight: 900,
              textDecoration: "none",
              boxShadow: "0 14px 34px rgba(0,0,0,0.12)",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
          >
            Jetzt anmelden →
          </a>
        </div>
      </div>
    </section>
  );
}