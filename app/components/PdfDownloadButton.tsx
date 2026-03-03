"use client";

import { useState } from "react";

type Props = {
  /** z.B. "/api/scorecard?tournament_id=...&registration_id=..." */
  href: string;
  /** z.B. "scorecard.pdf" */
  filename?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function PdfDownloadButton({
  href,
  filename = "download.pdf",
  className,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    // Wichtig: falls Button in einem <form> liegt -> kein Submit
    // (zusätzlich bitte type="button" beim Button, siehe unten)
    if (loading) return;

    try {
      setLoading(true);

      const res = await fetch(href, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `PDF download failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || "PDF-Download fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={className}
      aria-busy={loading}
    >
      {children ?? (loading ? "Lade PDF…" : "PDF downloaden")}
    </button>
  );
}