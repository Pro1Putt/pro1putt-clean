"use client";

import Link from "next/link";
import PartnerStrip from "../components/PartnerStrip";
import { useEffect, useRef, useState } from "react";

type TourEvent = {
  id: string;
  name: string;
  course_name: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  slug: string | null;
  is_active: boolean;
  registration_open: boolean;
};

export default function DesignPreview() {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    const start = () => { if (!document.hidden) void video.play().catch(() => {}); };
    video.addEventListener("loadeddata", start);
    video.addEventListener("canplay", start);
    window.addEventListener("pageshow", start);
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      video.removeEventListener("loadeddata", start);
      video.removeEventListener("canplay", start);
      window.removeEventListener("pageshow", start);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  const [events, setEvents] = useState<TourEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const response = await fetch("/api/tournaments?view=tour2027");
        const json = await response.json();

        if (!response.ok || !json.ok) {
          throw new Error("Tournaments could not be loaded.");
        }

        if (!cancelled) {
          setEvents(
            [...(json.tournaments || [])].sort(
              (a: TourEvent, b: TourEvent) =>
                a.start_date.localeCompare(b.start_date)
            )
          );
        }
      } catch {
        if (!cancelled) setEventsError(true);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p1-preview">
      <section className="p1-hero">
        <video
          ref={heroVideoRef}
          className="p1-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/gallery/IMG_2484.jpeg"
        >
          <source src="/Videos/walking.mp4" type="video/mp4" />

        </video>

        <div className="p1-hero-overlay" />

        <div className="p1-hero-content">
          <div className="p1-eyebrow">
            INTERNATIONALE JUNIOR GOLF TOUR
            <span className="p1-dot" />
            FÜR DIE NÄCHSTE GENERATION
          </div>

          <h1>
            SPIELE GOLF
            <br />
            <span>WIE EIN PROFI.</span>
          </h1>

          <p>
            Große Träume. Echter Wettkampf. Unvergessliche Momente.
            <br />
            Die Bühne für die nächste Golfgeneration.
          </p>

          <div className="p1-preview-buttons">
            <Link href="/de/register" className="p1-button-primary">
              TURNIERE ENTDECKEN <span>↗</span>
            </Link>
            <Link href="/de/leaderboard" className="p1-button-secondary">
              LIVE-ERGEBNISSE <span>↗</span>
            </Link>
          </div>
        </div>

        <div className="p1-hero-bottom">
          <span>MEHR ENTDECKEN ↓</span>
          <span>HIER BEGINNT DIE ZUKUNFT DES GOLFS.</span>
        </div>
      </section>

      <div className="p1-ticker">
        <div>
          <span>MUTIG SPIELEN</span><b>✳</b>
          <span>GROSS TRÄUMEN</span><b>✳</b>
          <span>GEMEINSAM ANTRETEN</span><b>✳</b>
          <span>MUTIG SPIELEN</span><b>✳</b>
          <span>GROSS TRÄUMEN</span><b>✳</b>
        </div>
      </div>

      <section className="p1-intro">
        <div className="p1-section-kicker">01 / DAS IST PRO1PUTT</div>
        <div className="p1-intro-grid">
          <h2>
            MEHR ALS
            <br />
            <span>EIN SPIEL.</span>
          </h2>
          <div className="p1-intro-right">
            <p>
              Wir glauben, dass die nächste Generation eine Bühne verdient, die so groß ist
              wie ihre Ambitionen.
            </p>
            <p className="p1-muted">
              PRO1PUTT bringt junge Golferinnen und Golfer zu spannenden
              Turnieren auf außergewöhnlichen Plätzen zusammen – mit Momenten, die
              lange über den letzten Putt hinaus bleiben.
            </p>
            <Link href="/de/register" className="p1-text-link">
              TOUR ENTDECKEN <span>↗</span>
            </Link>
          </div>
        </div>

        <div className="p1-feature-row">
          <div>
            <strong>03</strong>
            <span>RUNDEN. KEIN CUT.</span>
          </div>
          <div>
            <a href="/de/ausschreibung#wagr" style={{color:"inherit",textDecoration:"none",display:"grid"}}><strong>WAGR</strong><span>WELTRANGLISTE ↗</span></a>
          </div>
          <div>
            <strong>EGR</strong>
            <span>EUROPÄISCHE RANGLISTE</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>GOLFLEIDENSCHAFT</span>
          </div>
        </div>
      </section>

      <section className="p1-moments">
        <div className="p1-moments-heading">
          <div>
            <div className="p1-section-kicker p1-light-kicker">
              02 / DAS ERLEBNIS
            </div>
            <h2>
              ECHTE SPIELER.
              <br />
              <span>ECHTE MOMENTE.</span>
            </h2>
          </div>
          <p>
            Die Aufregung. Der Jubel. Die Freundschaften.
            <br />
            Das macht diesen Sport unvergesslich.
          </p>
        </div>

        <div className="p1-video-grid">
          <div className="p1-video-card p1-video-tall">
            <video autoPlay muted loop playsInline preload="auto">
              <source src="/Videos/Momente.mp4" type="video/mp4" />

            </video>
            <div className="p1-video-label">
              <span>01 / DIE MOMENTE</span>
              <strong>JEDER SCHLAG ERZÄHLT EINE GESCHICHTE.</strong>
            </div>
          </div>
          <div className="p1-video-card">
            <video autoPlay muted loop playsInline preload="auto">
              <source src="/Videos/DANKE.mp4" type="video/mp4" />

            </video>
            <div className="p1-video-label">
              <span>02 / DIE GEMEINSCHAFT</span>
              <strong>GEMEINSAM STÄRKER.</strong>
            </div>
          </div>
          <div className="p1-video-card">
            <video autoPlay muted loop playsInline preload="auto">
              <source src="/Videos/CATWALK.mp4" type="video/mp4" />

            </video>
            <div className="p1-video-label">
              <span>03 / DIE ENERGIE</span>
              <strong>DEIN MOMENT ZÄHLT.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="p1-events" id="tour">
        <div className="p1-section-kicker">03 / DIE TOUR</div>
        <div className="p1-events-heading">
          <h2>
            THE 2027
            <br />
            <span>TOUR.</span>
          </h2>
          <p>
            Legendäre Plätze. Echter Wettkampf.
            <br />
            Eine unvergessliche Saison.
          </p>
        </div>

        <div className="p1-event-grid p1-event-grid-2027">
          {loadingEvents && <p>Turniere werden geladen...</p>}
          {eventsError && <p>Turniere sind derzeit nicht verfügbar.</p>}
          {!loadingEvents && !eventsError && events.length === 0 && (
            <p>Neue Turniere werden bald bekanntgegeben.</p>
          )}

          {events.map((event, index) => {
            const registrationOpen =
              event.is_active && event.registration_open;

            const start = new Date(event.start_date + "T12:00:00");
            const end = event.end_date
              ? new Date(event.end_date + "T12:00:00")
              : start;

            const dateLabel =
              start.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "short",
              }).toUpperCase() +
              " — " +
              end.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).toUpperCase();

            const content = (
              <>
                <div
                  className="p1-event-photo"
                  style={{
                    backgroundImage: index === 0 ? 'url("/tournament-images/bad-saarow-original.jpg")' : 'url("/tournament-images/green-eagle-original.jpg")',
                  }}
                >
                  <span className="p1-event-number">
                    {String(index + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}
                  </span>
                  {registrationOpen && <span className="p1-event-arrow">↗</span>}
                </div>
                <div className="p1-event-details">
                  <span className="p1-event-date">{dateLabel}</span>
                  <h3>{event.name}</h3>
                  <strong>{event.course_name}</strong>
                  <span className="p1-event-location">{event.location}</span>
                  <span className="p1-event-link">
                    {registrationOpen
                      ? "JETZT ANMELDEN ↗"
                      : "ANMELDUNG ÖFFNET BALD"}
                  </span>
                </div>
              </>
            );

            return registrationOpen ? (
              <Link
                href="/de/register"
                className="p1-event"
                key={event.id}
              >
                {content}
              </Link>
            ) : (
              <div className="p1-event" key={event.id}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <section className="p1-qualification" id="qualification">
        <div className="p1-section-kicker">04 / INTERNATIONALE QUALIFIKATION</div>
        <h2>DEIN WEG ZU DEN <span>WELTMEISTERSCHAFTEN.</span></h2>
        <p>Drei Runden. Zwei Chancen auf eine Weltmeisterschaft. Die Erstplatzierten jeder Altersklasse qualifizieren sich; weitere Spielerinnen und Spieler können sich über ihren durchschnittlichen Score aus allen drei Tagen desselben PRO1PUTT Pro One Cup Turniers qualifizieren.</p>
        <div className="p1-qualification-grid">
          <article><h3>UNDER ARMOUR WELTMEISTERSCHAFT</h3><p>9 Loch: durchschnittlich 39 Schläge oder besser<br />18 Loch: durchschnittlich 79 Schläge oder besser</p></article>
          <article><h3>FCG CALLAWAY WELTMEISTERSCHAFT</h3><p>Deutschlands exklusives Qualifikationsturnier für die FCG Callaway Weltmeisterschaft.</p><p>9 Loch: durchschnittlich 45 Schläge oder besser<br />18 Loch: durchschnittlich 85 Schläge oder besser</p></article>
        </div>
        <p className="p1-qualification-note">Qualifikation und Teilnahme richten sich nach den offiziellen Voraussetzungen der jeweiligen Meisterschaft.</p>
        <Link href="/de/ausschreibung" className="p1-text-link">VOLLSTÄNDIGE AUSSCHREIBUNG ↗</Link>
      </section>

      <section className="p1-partners" id="partners">
        <div className="p1-section-kicker">05 / UNSERE PARTNER</div>
        <h2>UNTERSTÜTZT VON <span>DEN BESTEN.</span></h2>
        <PartnerStrip />
      </section>

      <section className="p1-gallery-teaser" id="gallery">
        <div className="p1-section-kicker p1-light-kicker">06 / DIE GALERIE</div>
        <h2>MOMENTE, DIE <span>BLEIBEN.</span></h2>
        <p>Erlebe die besonderen Momente von PRO1PUTT noch einmal.</p>
        <Link href="/de/galerie" className="p1-button-primary">GALERIE ENTDECKEN ↗</Link>
      </section>

      <section className="p1-preview-finale">
        <span className="p1-section-kicker p1-light-kicker">
          DEIN NÄCHSTES KAPITEL BEGINNT HIER
        </span>
        <h2>
          BEREIT,
          <br />
          <em>SPUREN ZU HINTERLASSEN?</em>
        </h2>
        <p>Sei Teil der nächsten Generation. Spiel dein Spiel. Schreib deine Geschichte.</p>
        <Link href="/de/register" className="p1-button-primary">
          WERDE TEIL DER TOUR <span>↗</span>
        </Link>
      </section>

      
      

      <style>{`
        .p1-qualification, .p1-partners, .p1-gallery-teaser, .p1-new-footer { position: relative; width: 100vw; margin-left: calc(50% - 50vw); padding: 90px max(6vw, 24px); font-family: Lato, Arial, sans-serif; }
        .p1-qualification { background: #f4f7f2; }
        .p1-qualification h2, .p1-partners h2, .p1-gallery-teaser h2 { font-size: clamp(38px, 5vw, 75px); line-height: 1; letter-spacing: -.055em; font-weight: 900; margin: 18px 0 25px; }
        .p1-qualification h2 span, .p1-partners h2 span { color: #589e3d; }
        .p1-qualification > p { max-width: 850px; line-height: 1.7; }
        .p1-qualification-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 22px; margin: 32px 0; }
        .p1-qualification-grid article { padding: 32px; border-radius: 16px; background: white; border: 1px solid #dce7d9; }
        .p1-qualification-grid h3 { font-size: 21px; margin: 0 0 16px; }
        .p1-qualification-grid p { line-height: 1.8; }
        .p1-qualification-note { font-size: 12px; opacity: .7; margin-bottom: 24px !important; }
        .p1-partners { background: #fff; }
        .p1-gallery-teaser { background: #092b1c; color: white; }
        .p1-gallery-teaser h2 span { color: #80d65b; }
        .p1-gallery-teaser p { margin-bottom: 25px; }
        .p1-new-footer { background: #061f15; color: white; display: flex; gap: 22px; flex-wrap: wrap; padding-top: 30px; padding-bottom: 30px; }
        .p1-new-footer a { color: #e2e9e2; font-size: 12px; letter-spacing: .08em; }
        @media(max-width:700px) { .p1-qualification-grid { grid-template-columns: 1fr; } .p1-qualification,.p1-partners,.p1-gallery-teaser { padding-top: 65px; padding-bottom: 65px; } }
        /* PRO1PUTT 2027: Einzelnes Turnier als Highlight */
        .p1-event-grid-2027 {
          display: flex;
          justify-content: center;
        }
        .p1-event-grid-2027 .p1-event {
          width: 100%;
          max-width: 650px;
        }
        .p1-event-grid-2027 .p1-event-photo {
          min-height: 390px;
        }
        @media (max-width: 700px) {
          .p1-event-grid-2027 .p1-event-photo {
            min-height: 260px;
          }
        }

        .p1-preview-brandbar {
          position: fixed;
          z-index: 20;
          top: 0;
          left: 0;
          width: 100%;
          padding: 10px 5vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(6, 28, 21, .94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .p1-preview-nav {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .p1-preview-register {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 22px;
          border-radius: 5px;
          background: #80d65b;
          color: #092b1c;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .07em;
          white-space: nowrap;
        }
        .p1-preview-register:hover {
          background: #a7e78a;
        }
        .p1-preview-brandbar img {
          display: block;
          width: auto;
          height: 50px;
          max-width: 200px;
          object-fit: contain;
        }
        .p1-preview-brandlink {
          color: white;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .1em;
        }
        @media (max-width: 600px) {
          .p1-preview-brandbar { padding: 10px 22px; }
          .p1-preview-brandbar img { height: 43px; max-width: 155px; }
          .p1-preview-brandlink { display: none; }
          .p1-preview-nav { gap: 8px; }
          .p1-preview-register {
            padding: 12px 14px;
            font-size: 10px;
          }
        }

        .p1-preview {
          --dark: #092b1c;
          --deep: #061f15;
          --lime: #80d65b;
          --cream: #f4f7f2;
          --ink: #12291f;
          width: 100%;
          overflow: hidden;
          color: var(--ink);
          font-family: Lato, Arial, sans-serif;
        }
        .p1-preview * { box-sizing: border-box; }
        .p1-preview a { text-decoration: none; }
        .p1-preview h1,
        .p1-preview h2,
        .p1-preview h3,
        .p1-preview p { margin: 0; }

        /* Full-width inside the existing global 1100px layout */
        .p1-hero,
        .p1-ticker,
        .p1-intro,
        .p1-moments,
        .p1-events,
        .p1-preview-finale,
        .p1-preview-note {
          position: relative;
          width: 100vw;
          margin-left: calc(50% - 50vw);
        }

        .p1-hero {
          min-height: min(790px, 90svh);
          display: flex;
          align-items: center;
          background: #173d2a;
          color: white;
          isolation: isolate;
        }
        .p1-hero-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 45%;
          z-index: -2;
        }
        .p1-hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(4,27,19,.89) 0%, rgba(4,27,19,.48) 60%, rgba(4,27,19,.15) 100%),
            linear-gradient(0deg, rgba(4,27,19,.6), transparent 40%);
          z-index: -1;
        }
        .p1-hero-content {
          width: min(1280px, 100%);
          padding: 100px 7vw 110px;
          margin: 0 auto;
        }
        .p1-eyebrow, .p1-section-kicker {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .2em;
        }
        .p1-eyebrow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 13px;
          color: #e6f8d6;
          margin-bottom: 30px;
        }
        .p1-dot {
          width: 6px;
          height: 6px;
          background: var(--lime);
          border-radius: 50%;
        }
        .p1-hero h1,
        .p1-intro h2,
        .p1-moments h2,
        .p1-events h2,
        .p1-preview-finale h2 {
          font-size: clamp(54px, 8.5vw, 126px);
          font-weight: 900;
          letter-spacing: -.075em;
          line-height: .91;
        }
        .p1-hero h1 span,
        .p1-moments h2 span { color: var(--lime); }
        .p1-hero-content > p {
          margin-top: 32px;
          font-size: clamp(16px, 1.5vw, 21px);
          line-height: 1.55;
          color: #e1e9e2;
        }
        .p1-preview-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 36px;
        }
        .p1-button-primary,
        .p1-button-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
          padding: 18px 24px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          transition: transform .2s, background .2s;
        }
        .p1-button-primary {
          background: var(--lime);
          color: var(--dark);
        }
        .p1-button-secondary {
          color: white;
          border: 1px solid rgba(255,255,255,.55);
        }
        .p1-button-primary:hover,
        .p1-button-secondary:hover { transform: translateY(-3px); }
        .p1-button-secondary:hover { background: rgba(255,255,255,.1); }
        .p1-hero-bottom {
          position: absolute;
          bottom: 24px;
          left: 7vw;
          right: 7vw;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .15em;
          color: #dce9df;
        }

        .p1-ticker {
          overflow: hidden;
          background: var(--lime);
          color: var(--dark);
          padding: 16px 0;
        }
        .p1-ticker > div {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 28px;
          min-width: 100%;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: .14em;
        }
        .p1-ticker b { font-size: 22px; }

        .p1-intro {
          background: var(--cream);
          padding: 110px max(7vw, calc((100vw - 1280px)/2)) 95px;
        }
        .p1-section-kicker { color: #56806b; margin-bottom: 32px; }
        .p1-intro-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          align-items: start;
          gap: 80px;
        }
        .p1-intro h2,
        .p1-events h2 { font-size: clamp(55px, 7.5vw, 105px); }
        .p1-intro h2 span,
        .p1-events h2 span { color: #7fbe63; }
        .p1-intro-right {
          padding-top: 10px;
          max-width: 450px;
        }
        .p1-intro-right > p:first-child {
          font-size: clamp(22px, 2.3vw, 31px);
          line-height: 1.25;
          font-weight: 700;
          letter-spacing: -.03em;
        }
        .p1-muted {
          color: #617267;
          line-height: 1.7;
          margin-top: 22px !important;
          font-size: 16px;
        }
        .p1-text-link {
          display: inline-flex;
          gap: 35px;
          color: var(--ink);
          border-bottom: 2px solid var(--ink);
          padding-bottom: 8px;
          margin-top: 30px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
        }
        .p1-feature-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 90px;
          padding-top: 32px;
          border-top: 1px solid #cdd8cd;
        }
        .p1-feature-row > div {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .p1-feature-row strong {
          font-size: clamp(31px, 4vw, 57px);
          letter-spacing: -.06em;
          font-weight: 900;
        }
        .p1-feature-row span {
          font-size: 10px;
          letter-spacing: .14em;
          font-weight: 900;
          color: #617267;
        }

        .p1-moments {
          background: var(--dark);
          color: white;
          padding: 105px max(7vw, calc((100vw - 1280px)/2)) 110px;
        }
        .p1-light-kicker { color: var(--lime); }
        .p1-moments-heading,
        .p1-events-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 35px;
          margin-bottom: 45px;
        }
        .p1-moments h2 { font-size: clamp(48px, 6.8vw, 92px); }
        .p1-moments-heading > p,
        .p1-events-heading > p {
          line-height: 1.7;
          font-size: 16px;
          color: #c0d0c4;
          padding-bottom: 6px;
        }
        .p1-video-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr 1fr;
          gap: 14px;
        }
        .p1-video-card {
          height: clamp(330px, 42vw, 530px);
          position: relative;
          overflow: hidden;
          background: #244c37;
        }
        .p1-video-card video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .p1-video-card::after {
          content: "";
          position: absolute;
          inset: 40% 0 0;
          background: linear-gradient(transparent, rgba(0,0,0,.8));
          pointer-events: none;
        }
        .p1-video-label {
          position: absolute;
          z-index: 1;
          bottom: 24px;
          left: 22px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .p1-video-label span {
          font-size: 10px;
          letter-spacing: .16em;
          color: var(--lime);
          font-weight: 900;
        }
        .p1-video-label strong {
          font-size: clamp(17px, 2vw, 27px);
          font-weight: 900;
          letter-spacing: -.04em;
        }

        .p1-events {
          padding: 105px max(7vw, calc((100vw - 1280px)/2)) 115px;
          background: #f4f7f2;
        }
        .p1-events-heading > p { color: #64776b; }
        .p1-event-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .p1-event-grid.p1-event-grid-2027 {
          display: flex;
          justify-content: center;
        }
        .p1-event-grid.p1-event-grid-2027 .p1-event {
          width: 100%;
          max-width: 650px;
        }
        .p1-event {
          background: white;
          color: var(--ink);
          transition: transform .25s;
        }
        .p1-event:hover { transform: translateY(-7px); }
        .p1-event-photo {
          height: clamp(205px, 25vw, 330px);
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .p1-event-photo::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0,0,0,.2), transparent 45%);
        }
        .p1-event-number,
        .p1-event-arrow {
          position: absolute;
          z-index: 1;
          top: 18px;
          font-size: 12px;
          font-weight: 900;
          color: white;
        }
        .p1-event-number { left: 18px; letter-spacing: .08em; }
        .p1-event-arrow {
          right: 18px;
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--lime);
          color: var(--dark);
          font-size: 18px;
        }
        .p1-event-details {
          padding: 26px 24px 28px;
          display: flex;
          flex-direction: column;
        }
        .p1-event-date {
          color: #5c8065;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .14em;
          margin-bottom: 16px;
        }
        .p1-event-details h3 {
          font-size: clamp(24px, 3vw, 35px);
          font-weight: 900;
          letter-spacing: -.055em;
          line-height: 1;
        }
        .p1-event-details > strong {
          margin-top: 8px;
          font-size: 17px;
        }
        .p1-event-location {
          margin-top: 7px;
          color: #718074;
          font-size: 13px;
        }
        .p1-event-link {
          margin-top: 35px;
          padding-top: 18px;
          border-top: 1px solid #e6eae3;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .p1-preview-finale {
          background: #083923;
          color: white;
          text-align: center;
          padding: 110px 20px 120px;
        }
        .p1-preview-finale h2 {
          font-size: clamp(50px, 8vw, 112px);
          margin: 30px 0;
        }
        .p1-preview-finale h2 em {
          color: var(--lime);
          font-style: normal;
        }
        .p1-preview-finale p {
          color: #c5d7ca;
          margin-bottom: 34px;
          font-size: 17px;
        }
        .p1-preview-note {
          padding: 16px;
          text-align: center;
          background: var(--lime);
          color: var(--dark);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        @media (max-width: 850px) {
          .p1-intro-grid { grid-template-columns: 1fr; gap: 30px; }
          .p1-feature-row { grid-template-columns: repeat(2, 1fr); gap: 32px; }
          .p1-moments-heading,
          .p1-events-heading { align-items: start; flex-direction: column; }
          .p1-video-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .p1-event-grid { grid-template-columns: 1fr; }
          .p1-event-photo { height: 310px; }
        }
        @media (max-width: 600px) {
          .p1-hero { min-height: 700px; min-height: 86svh; }
          .p1-hero-content { padding: 85px 23px 105px; }
          .p1-hero h1 { font-size: clamp(52px, 13vw, 78px); }
          .p1-hero-content > p br { display: none; }
          .p1-hero-bottom { left: 23px; right: 23px; }
          .p1-hero-bottom span:last-child { display: none; }
          .p1-eyebrow { font-size: 9px; }
          .p1-preview-buttons { flex-direction: column; align-items: stretch; }
          .p1-button-primary,
          .p1-button-secondary { justify-content: space-between; }
          .p1-ticker > div { justify-content: start; padding: 0 20px; }
          .p1-ticker > div span:nth-of-type(n+4),
          .p1-ticker > div b:nth-of-type(n+4) { display: none; }
          .p1-intro,
          .p1-moments,
          .p1-events { padding: 70px 22px 75px; }
          .p1-intro h2,
          .p1-events h2 { font-size: clamp(55px, 12vw, 76px); }
          .p1-moments h2 { font-size: clamp(42px, 10vw, 66px); }
          .p1-feature-row { margin-top: 55px; }
          .p1-video-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .p1-video-tall { grid-column: 1 / -1; height: 490px; }
          .p1-video-card:not(.p1-video-tall) { height: 280px; }
          .p1-video-label { left: 14px; bottom: 15px; right: 12px; }
          .p1-video-label strong { font-size: 17px; }
          .p1-video-label span { font-size: 8px; }
          .p1-event-photo { height: 270px; }
          .p1-preview-finale { padding: 85px 22px 95px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .p1-preview * { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
