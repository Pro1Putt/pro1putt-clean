import GalleryClient from "./GalleryClient";
import { createClient } from "@supabase/supabase-js";

function encodePath(path: string) {
  return path
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ folder?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const bucket = "Galerie";

  // 1) Top-level Ordner laden
  const { data: rootList, error: rootErr } = await supabase.storage
    .from(bucket)
    .list("", { limit: 200 });

  if (rootErr) {
    return <div style={{ padding: 24 }}>Fehler: {rootErr.message}</div>;
  }

  const folders =
    (rootList ?? [])
      .filter((x) => {
        // Supabase liefert Ordner meist als Eintrag OHNE metadata
        // (Dateien haben metadata)
        return x?.name && !x.name.endsWith("/") && !x.metadata;
      })
      .map((x) => x.name)
      .sort((a, b) => a.localeCompare(b)) ?? [];

  // Default Ordner: Query > "Pro1Putt Open" falls vorhanden > erster Ordner
  const requestedFolder = (sp.folder ?? "").trim();
  const defaultFolder = folders.includes("Pro1Putt Open")
    ? "Pro1Putt Open"
    : folders[0] ?? "";

  const activeFolder = requestedFolder && folders.includes(requestedFolder)
    ? requestedFolder
    : defaultFolder;

  // 2) Bilder im aktiven Ordner laden
  const { data: files, error: filesErr } = activeFolder
    ? await supabase.storage.from(bucket).list(activeFolder, {
        limit: 500,
        sortBy: { column: "created_at", order: "desc" },
      })
    : { data: [], error: null };

  if (filesErr) {
    return <div style={{ padding: 24 }}>Fehler: {filesErr.message}</div>;
  }

  const imageFiles =
    (files ?? [])
      .filter((f) => f?.name && f.metadata?.mimetype?.startsWith("image/"))
      .map((f) => {
        const path = `${bucket}/${activeFolder}/${f.name}`;
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${encodePath(
          path
        )}`;
        return {
          name: f.name,
          url,
          created_at: f.created_at ?? null,
        };
      }) ?? [];

  return (
    <GalleryClient
      bucket={bucket}
      folders={folders}
      activeFolder={activeFolder}
      images={imageFiles}
    />
  );
}