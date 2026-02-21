"use client";

import { useEffect, useMemo, useState } from "react";

const GREEN = "#00C46A";
const DARK = "#0B2A1E";      // PRO1PUTT dark green vibe
const DARK2 = "#123626";

type Img = {
  name: string;
  url: string;
  created_at: string | null;
};

export default function GalleryClient({
  bucket,
  folders,
  activeFolder,
  images,
}: {
  bucket: string;
  folders: string[];
  activeFolder: string;
  images: Img[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const hasFolders = folders.length > 0;
  const imgs = useMemo(() => images ?? [], [images]);

  function close() {
    setOpenIndex(null);
  }

  function prev() {
    setOpenIndex((i) => {
      if (i === null) return null;
      return (i - 1 + imgs.length) % imgs.length;
    });
  }

  function next() {
    setOpenIndex((i) => {
      if (i === null) return null;
      return (i + 1) % imgs.length;
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (openIndex === null) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, imgs.length]);

  return (
    <div className="p1pWrap">
      <style>{`
        .p1pWrap{
  min-height: 100vh;
  padding: 60px 60px 80px;
  font-family: Lato, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  color: white;

  background:
    radial-gradient(circle at 20% 30%, rgba(0,196,106,0.18), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0,196,106,0.12), transparent 40%),
    linear-gradient(135deg, #0a1f17 0%, #0d2d21 45%, #071913 100%);
}
        .p1pHeader{
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:16px;
          margin-bottom: 18px;
        }
        .p1pTitle{
          font-size: 34px;
          line-height: 1.05;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .p1pSub{
          margin: 6px 0 0;
          opacity: .78;
          font-size: 14px;
        }

        .p1pControls{
          display:flex;
          align-items:center;
          gap:10px;
          flex-wrap:wrap;
        }
        .p1pSelect{
  background: linear-gradient(135deg, #00C46A 0%, #00A95C 100%);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  outline: none;
  cursor: pointer;

  box-shadow:
    0 12px 30px rgba(0,196,106,0.35),
    inset 0 0 0 1px rgba(255,255,255,0.15);

  transition: all .2s ease;
}

.p1pSelect:hover{
  transform: translateY(-1px);
  box-shadow:
    0 18px 40px rgba(0,196,106,0.45),
    inset 0 0 0 1px rgba(255,255,255,0.2);
}
        .p1pChip{
          display:inline-flex;
          align-items:center;
          gap:8px;
          background: ${DARK};
          color: white;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 12px 30px rgba(0,0,0,.18);
          border: 1px solid rgba(255,255,255,.14);
        }
        .p1pDot{
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${GREEN};
          box-shadow: 0 0 0 4px rgba(0,196,106,0.15);
        }

        .p1pGrid{
          margin-top: 18px;
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 18px;
        }
        .p1pCard{
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          background: #0d2d21;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.08);
          transform: translateZ(0);
        }
        .p1pCardBtn{
          display:block;
          width:100%;
          height:100%;
          cursor:pointer;
          border:0;
          background: transparent;
          padding:0;
        }
        .p1pImg{
          width:100%;
          height: 220px;
          object-fit: cover;
          display:block;
          transform: scale(1.01);
          transition: transform .25s ease, filter .25s ease;
          filter: saturate(1.02) contrast(1.02);
        }
        .p1pOverlay{
          pointer-events:none;
          position:absolute;
          inset:0;
          background: linear-gradient(180deg, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.28) 100%);
          opacity: 0.0;
          transition: opacity .25s ease;
        }
        .p1pBadge{
          pointer-events:none;
          position:absolute;
          left: 14px;
          top: 14px;
          background: rgba(13,45,33,0.86);
          color: white;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          padding: 8px 10px;
          display:flex;
          align-items:center;
          gap:8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .02em;
          backdrop-filter: blur(8px);
          opacity: 0;
          transform: translateY(-6px);
          transition: opacity .25s ease, transform .25s ease;
        }
        .p1pCard:hover .p1pImg{
          transform: scale(1.06);
        }
        .p1pCard:hover .p1pOverlay{
          opacity: 1;
        }
        .p1pCard:hover .p1pBadge{
          opacity: 1;
          transform: translateY(0);
        }

        /* Lightbox */
        .lbBack{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.72);
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 18px;
          z-index: 9999;
        }
        .lbPanel{
          width: min(1080px, 96vw);
          height: min(86vh, 760px);
          background: rgba(8,18,13,0.88);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          overflow:hidden;
          box-shadow: 0 30px 90px rgba(0,0,0,0.55);
          position: relative;
          backdrop-filter: blur(10px);
        }
        .lbTop{
          position:absolute;
          inset: 0 0 auto 0;
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding: 12px 12px;
          z-index: 2;
        }
        .lbLeft{
          display:flex;
          align-items:center;
          gap:10px;
          color:white;
          font-weight: 800;
          font-size: 13px;
          opacity: .92;
        }
        .lbBtn{
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(18,54,38,0.6);
          color: white;
          border-radius: 14px;
          padding: 10px 12px;
          cursor:pointer;
          font-weight: 800;
          display:inline-flex;
          align-items:center;
          gap:8px;
          transition: transform .15s ease, background .15s ease;
        }
        .lbBtn:hover{ transform: translateY(-1px); background: rgba(18,54,38,0.78); }
        .lbMain{
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .lbImg{
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display:block;
        }
        .lbNav{
          position:absolute;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 0 10px;
          pointer-events:none;
        }
        .lbNav > button{
          pointer-events:auto;
        }
        .lbGhost{
          opacity: .95;
        }
        .empty{
          margin-top: 18px;
          padding: 22px;
          border-radius: 18px;
          background: rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.06);
        }
      `}</style>

      <div className="p1pHeader">
        <div>
          <h1 className="p1pTitle">Galerie</h1>
          <p className="p1pSub">
            Bucket: <b>{bucket}</b> {activeFolder ? <>• Ordner: <b>{activeFolder}</b></> : null}
          </p>
        </div>

        <div className="p1pControls">
          {activeFolder ? (
            <span className="p1pChip">
              <span className="p1pDot" />
              {activeFolder}
            </span>
          ) : null}

          {hasFolders ? (
            <select
              className="p1pSelect"
              value={activeFolder}
              onChange={(e) => {
                const folder = e.target.value;
                const url = new URL(window.location.href);
                url.searchParams.set("folder", folder);
                window.location.href = url.toString();
              }}
            >
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      {imgs.length === 0 ? (
        <div className="empty">
          In diesem Ordner sind keine Bilder.
        </div>
      ) : (
        <div className="p1pGrid">
          {imgs.map((img, idx) => (
            <div className="p1pCard" key={img.url}>
              <button className="p1pCardBtn" onClick={() => setOpenIndex(idx)} aria-label="Bild öffnen">
                <img className="p1pImg" src={img.url} alt="" loading="lazy" />
                <div className="p1pOverlay" />
                <div className="p1pBadge">
                  <span className="p1pDot" />
                  PRO1PUTT
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {openIndex !== null && imgs[openIndex] ? (
        <div className="lbBack" onClick={close} role="dialog" aria-modal="true">
          <div className="lbPanel" onClick={(e) => e.stopPropagation()}>
            <div className="lbTop">
              <div className="lbLeft">
                <span className="p1pDot" />
                {activeFolder || "Galerie"} • {openIndex + 1}/{imgs.length}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="lbBtn lbGhost" onClick={prev} aria-label="Vorheriges Bild">
                  ←
                </button>
                <button className="lbBtn lbGhost" onClick={next} aria-label="Nächstes Bild">
                  →
                </button>
                <button className="lbBtn" onClick={close} aria-label="Schließen">
                  ✕
                </button>
              </div>
            </div>

            <div className="lbNav">
              <button className="lbBtn lbGhost" onClick={prev} aria-label="Vorheriges Bild">
                ←
              </button>
              <button className="lbBtn lbGhost" onClick={next} aria-label="Nächstes Bild">
                →
              </button>
            </div>

            <div className="lbMain">
              <img className="lbImg" src={imgs[openIndex].url} alt="" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}