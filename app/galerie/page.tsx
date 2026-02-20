import fs from "fs";
import path from "path";
import Image from "next/image";

const GREEN = "#00C46A";

function getGalleryImages(): string[] {
  const dir = path.join(process.cwd(), "public", "gallery");
  if (!fs.existsSync(dir)) return [];

  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  return fs
    .readdirSync(dir)
    .filter((f) => allowed.has(path.extname(f).toLowerCase()))
    .filter((f) => !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "de"));
}

export default function GaleriePage() {
  const files = getGalleryImages();

  return (
  <main
  style={{
    minHeight: "100vh",
    background: `
      radial-gradient(1200px 800px at 20% -10%, rgba(0,196,106,0.25), transparent 55%),
      radial-gradient(900px 600px at 90% 10%, rgba(0,196,106,0.18), transparent 60%),
      linear-gradient(180deg, #0E2A1F 0%, #0B241A 100%)
    `,
    padding: "80px 20px",
  }}
>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ color: "white", fontSize: 36, fontWeight: 800, marginBottom: 30 }}>
          PRO1PUTT Galerie
        </h1>

        {files.length === 0 ? (
          <div style={{ color: "white" }}>Keine Bilder in /public/gallery gefunden.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {files.map((file) => (
              <a
                key={file}
                href={`/gallery/${file}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  position: "relative",
                  width: "100%",
                  height: 250,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "block",
                }}
              >
                <Image src={`/gallery/${file}`} alt={file} fill style={{ objectFit: "cover" }} />
              </a>
            ))}
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            height: 2,
            width: 180,
            background: `linear-gradient(90deg, ${GREEN}, rgba(0,196,106,0))`,
            borderRadius: 999,
            opacity: 0.9,
          }}
        />
      </div>
    </main>
  );
}
