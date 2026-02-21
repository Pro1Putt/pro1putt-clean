export const dynamic = "force-dynamic";

const GREEN = "#00C46A";
const DARK = "#0E2A1F";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="p1-navlink">
      {label}
    </a>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "rgba(255,255,255,0.7)",
        boxShadow: "0 10px 22px rgba(0,0,0,0.05)",
        fontWeight: 900,
        color: DARK,
        fontSize: 14,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: GREEN,
          boxShadow: "0 10px 18px rgba(0,0,0,0.10)",
          flex: "0 0 auto",
        }}
      />
      <span style={{ opacity: 0.9 }}>{children}</span>
    </div>
  );
}

export default function HomeV2() {
  return (
    <div style={{ fontFamily: "Lato, sans-serif", background: "#f8faf9", color: "#111" }}>
      <style>{`
      
        .p1-header {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          background: rgba(14, 42, 31, 0.25);
          border-bottom: 1px solid rgba(255,255,255,0.10);
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
        .p1-card {
          background: white;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
        }
        .p1-btn-soft {
          display: inline-block;
          padding: 10px 14px;
          background: rgba(0,196,106,0.14);
          color: ${DARK};
          border-radius: 12px;
          font-weight: 900;
          text-decoration: none;
          font-size: 14px;
        }
        .p1-btn-primary {
          display: inline-block;
          padding: 16px 30px;
          background: ${GREEN};
          color: #001a10;
          border-radius: 14px;
          font-weight: 900;
          text-decoration: none;
          font-size: 16px;
          box-shadow: 0 14px 34px rgba(0,0,0,0.22);
        }
          .p1-partnerlogo {
  opacity: 0.6;
  filter: grayscale(100%);
  transition: opacity 200ms ease, filter 200ms ease, transform 200ms ease;
}

.p1-partnerlogo:hover {
  opacity: 1;
  filter: grayscale(0%);
  transform: translateY(-2px);
}
        .p1-btn-ghost {
          display: inline-block;
          padding: 16px 30px;
          border: 1.5px solid rgba(255,255,255,0.9);
          color: white;
          border-radius: 14px;
          font-weight: 800;
          text-decoration: none;
          font-size: 16px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        @media (max-width: 720px) {
          .p1-header-inner { flex-direction: column; align-items: stretch; gap: 10px; }
          .p1-nav { justify-content: center; }
          .p1-cta-wrap { display: flex; justify-content: center; }
        }
      `}</style>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: "0 20px 90px",
          textAlign: "center",
          color: "white",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0E2A1F 0%, #123D2A 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(800px 500px at 50% 25%, rgba(255,255,255,0.08), transparent 60%), repeating-linear-gradient(135deg, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) 1px, transparent 1px, transparent 7px)",
            opacity: 0.35,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 25%, transparent 0%, rgba(0,0,0,0.35) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* HEADER */}
        <header className="p1-header">
          <div
            className="p1-header-inner"
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "14px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <a
              href="/home-v2"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "white",
                fontWeight: 900,
                letterSpacing: 0.8,
              }}
              aria-label="PRO1PUTT Home"
            >
              <img
                src="/pro1putt-logo-white-v2.png"
                alt="PRO1PUTT"
                style={{
                  height: 28,
                  width: "auto",
                  display: "block",
                  filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.25))",
                }}
              />
            </a>

            <nav
              className="p1-nav"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <NavLink href="/home-v2" label="Home" />
              <NavLink href="#tour" label="Tour 2026" />
              <NavLink href="#partners" label="Partner" />
             <NavLink href="/galerie" label="Galerie" />
              <NavLink href="/register" label="Registrierung" />
              <NavLink href="/leaderboard" label="Leaderboard" />
            </nav>

            <div className="p1-cta-wrap">
              <a href="/register" className="p1-navcta">
                Jetzt anmelden
              </a>
            </div>
          </div>
        </header>

        {/* HERO CONTENT */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 980, margin: "0 auto", paddingTop: 72 }}>
          <img
            src="/pro1putt-logo-white-v2.png"
            alt="PRO1PUTT"
            style={{
              width: 360,
              maxWidth: "92%",
              height: "auto",
              margin: "0 auto 30px",
              display: "block",
              filter: "drop-shadow(0 14px 30px rgba(0,0,0,0.35))",
            }}
          />

          <h1 style={{ fontSize: 54, fontWeight: 900, margin: "0 0 16px", letterSpacing: 1, lineHeight: 1.05 }}>
            PLAY GOLF LIKE A PRO
          </h1>

          <p style={{ maxWidth: 720, margin: "0 auto 36px", fontSize: 18, opacity: 0.92 }}>
            Jugend-Golfturniere auf Top-Niveau. 3 Runden ohne Cut. Live Leaderboard. Professionelle Organisation.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
            <a href="/register" className="p1-btn-primary">
              Jetzt anmelden
            </a>
            <a href="/leaderboard" className="p1-btn-ghost">
              Live Leaderboard
            </a>
          </div>

          <div
            style={{
              marginTop: 34,
              display: "flex",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
              opacity: 0.98,
            }}
          >
            <Pill>WAGR & EGR</Pill>
            <Pill>Qualifyingtour Under Armour World & FCG Callaway World</Pill>
            <Pill>Hole-in-One Preise</Pill>
          </div>
        </div>
      </section>

  {/* HIGHLIGHTS */}
<section id="highlights" style={{ padding: "72px 20px", textAlign: "center" }}>
  <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 14, color: DARK }}>
    PRO1PUTT Highlights
  </h2>

  <p style={{ maxWidth: 760, margin: "0 auto 40px", opacity: 0.78, lineHeight: 1.6 }}>
    Internationale Turnierstandards. Offizielle Rankings. Echte Incentives.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 20,
      maxWidth: 1000,
      margin: "0 auto",
      textAlign: "left",
    }}
  >
    {[
      {
        t: "Tour-Format",
        d: "3 Runden ohne Cut. Klare Flights. Struktur wie auf internationaler Ebene. Caddies erlaubt,",
      },
      {
        t: "Offizielles WAGR & EGR Event",
        d: "PRO1PUTT Turniere sind offiziell für das World Amateur Golf Ranking (WAGR) und European Golf Ranking (EGR) anerkannt.",
      },
      {
        t: "Hole-in-One Awards",
        d: "Preisgelder und Incentives bis 10.000€ – weitere Sonderwertungen und echte Highlights auf dem Platz.",
      },
    ].map((x) => (
      <div key={x.t} className="p1-card">
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8, color: DARK }}>
          {x.t}
        </div>
        <div style={{ opacity: 0.78, lineHeight: 1.55 }}>{x.d}</div>
      </div>
    ))}
  </div>
</section>

      {/* TOUR 2026 – CONVERSION BLOCK */}
<section id="tour" style={{ padding: "80px 20px", textAlign: "center" }}>
  <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, color: DARK }}>
    Tour 2026 – Jetzt Startplatz sichern
  </h2>

  <p style={{ maxWidth: 760, margin: "0 auto 50px", opacity: 0.8 }}>
  Limitierte Startplätze • 3 Runden ohne Cut • Offizielles WAGR & EGR Event
</p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 24,
      maxWidth: 1100,
      margin: "0 auto",
      textAlign: "left",
    }}
  >
    {[
      {
        title: "Open Classics WINSTONopen",
        date: "30.03.–01.04.2026",
        place: "WINSTONopen",
        status: "Limited Entry",
      },
      {
        title: "Open Faldo Course",
        date: "25.–27.09.2026",
        place: "Bad Saarow",
        status: "Limited Entry",
      },
      {
        title: "Open Finals – North Course",
        date: "02.–04.10.2026",
        place: "Green Eagle",
        status: "Limited Entry",
      },
    ].map((t) => (
      <div
        key={t.title}
        style={{
          background: "white",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 14px 40px rgba(0,0,0,0.07)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 1,
              color: GREEN,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {t.status}
          </div>

          <div
            style={{
              fontWeight: 900,
              fontSize: 20,
              marginBottom: 6,
              color: DARK,
            }}
          >
            {t.title}
          </div>

          <div style={{ opacity: 0.8, marginBottom: 20 }}>
            {t.date} • {t.place}
          </div>
        </div>

        <a
          href="/register"
          style={{
            padding: "14px 18px",
            background: GREEN,
            color: "#001a10",
            borderRadius: 14,
            fontWeight: 900,
            textDecoration: "none",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Jetzt anmelden →
        </a>
      </div>
    ))}
  </div>
</section>

      {/* SUPPORTED BY */}
<section id="partners" style={{ padding: "60px 20px", textAlign: "center" }}>
  <div style={{ opacity: 0.6, fontSize: 13, fontWeight: 900, letterSpacing: 1, marginBottom: 28 }}>
    SUPPORTED BY
  </div>

  <div
    style={{
      maxWidth: 1000,
      margin: "0 auto",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 40,
      flexWrap: "wrap",
    }}
  >
    {[
  "/partners/golfhouse.svg",
  "/partners/gsusa.jpg",
  "/partners/golfkidsfun.jpg",
  "/partners/juniortour.png",
  "/partners/wagr.png",
].map((src) => (
    <div
  key={src}
  style={{
    width: 200,
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <img
    src={src}
    alt="Partner"
    style={{
      maxHeight: 50,
      maxWidth: 180,
      width: "auto",
      height: "auto",
      objectFit: "contain",
      display: "block",
    }}
  />
</div>
    ))}
  </div>
</section>

      {/* CTA */}
      <section style={{ padding: "72px 20px", background: DARK, textAlign: "center", color: "white" }}>
        <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 18 }}>Sei Teil der PRO1PUTT Tour 2026</h2>
        <p style={{ maxWidth: 720, margin: "0 auto 28px", opacity: 0.9 }}>
          Sichere dir deinen Startplatz – Registration, Flights & Live Leaderboard in einem System.
        </p>
        <a
          href="/register"
          style={{
            padding: "18px 40px",
            background: GREEN,
            color: "#001a10",
            borderRadius: 16,
            fontWeight: 900,
            textDecoration: "none",
            fontSize: 18,
            boxShadow: "0 16px 36px rgba(0,0,0,0.25)",
            display: "inline-block",
          }}
        >
          Jetzt Startplatz sichern
        </a>
      </section>
<div style={{ height: 72 }} />
      {/* FOOTER */}
      <footer style={{ padding: "26px 20px", textAlign: "center", opacity: 0.7, fontSize: 13 }}>
        © {new Date().getFullYear()} PRO1PUTT
      </footer>
      {/* STICKY CTA */}
<div
  style={{
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    padding: "12px 14px",
    background: "rgba(14, 42, 31, 0.92)",
    borderTop: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  }}
>
  <div
    style={{
      maxWidth: 1100,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    }}
  >
    <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 800, fontSize: 14 }}>
      Startplätze sichern • <span style={{ color: GREEN, fontWeight: 900 }}>WAGR & EGR</span>
    </div>

    <a
      href="/register"
      style={{
        padding: "12px 16px",
        background: GREEN,
        color: "#001a10",
        borderRadius: 12,
        fontWeight: 900,
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      Jetzt anmelden →
    </a>
  </div>
</div>
    </div>
  );
}