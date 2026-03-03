export default function WinstonProAmBadge() {
  const GREEN = "#00C46A";
  const DARK = "#0E2A1F";

  return (
    <div
      style={{
        marginTop: 14,
        padding: "12px 14px",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "rgba(0,196,106,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: DARK,
              color: "white",
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            🔥 ProAm Gewinn
          </span>

          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 900, color: DARK, fontSize: 13 }}>
              Top 3 Girls (18 Loch) → ProAm-Startplatz (LET Access Series)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.7 }}>Powered by</span>
              <a href="https://www.vcg.de" target="_blank" rel="noreferrer" style={{ display: "inline-flex" }}>
                <img
                  src="/partners/vcg-logo.svg"
                  alt="VCG"
                  style={{ height: 18, width: "auto", objectFit: "contain" }}
                />
              </a>
            </div>
          </div>
        </div>

        <a
          href="/register"
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            background: GREEN,
            color: "#001a10",
            fontWeight: 900,
            textDecoration: "none",
            whiteSpace: "nowrap",
            display: "inline-block",
          }}
        >
          Anmelden →
        </a>
      </div>
    </div>
  );
}