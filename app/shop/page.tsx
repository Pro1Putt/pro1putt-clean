"use client";

import { useEffect, useMemo, useState } from "react";

type HoodieColor = {
  color: string;
  front?: string;
  back?: string;
};

type Hoodie = {
  id: string | number;
  name: string;
  colors?: HoodieColor[];
  front?: string;
  back?: string;
};

function colorButtonClass(active: boolean) {
  return active
    ? "border-neutral-900 bg-neutral-900 text-white"
    : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500";
}

export default function ShopPage() {
  const [hoodies, setHoodies] = useState<Hoodie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColors, setSelectedColors] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/hoodies", { cache: "no-store" });
        const json = await res.json();
        const items: Hoodie[] = Array.isArray(json?.data) ? json.data : [];

        const normalized = items.map((item) => {
          const safeColors =
            Array.isArray(item.colors) && item.colors.length > 0
              ? item.colors
              : [
                  {
                    color: "Standard",
                    front: item.front || "",
                    back: item.back || item.front || "",
                  },
                ];

          return {
            ...item,
            colors: safeColors,
          };
        });

        setHoodies(normalized);

        const initialSelections: Record<string, number> = {};
        for (const item of normalized) {
          initialSelections[String(item.id)] = 0;
        }
        setSelectedColors(initialSelections);
      } catch {
        setHoodies([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const preparedHoodies = useMemo(() => {
    return hoodies.map((hoodie) => {
      const safeColors =
        Array.isArray(hoodie.colors) && hoodie.colors.length > 0
          ? hoodie.colors
          : [
              {
                color: "Standard",
                front: hoodie.front || "",
                back: hoodie.back || hoodie.front || "",
              },
            ];

      const key = String(hoodie.id);
      const colorIndex = selectedColors[key] ?? 0;
      const activeColor =
        safeColors[colorIndex] || safeColors[0] || { color: "", front: "", back: "" };

      return {
        ...hoodie,
        colors: safeColors,
        activeIndex: colorIndex,
        activeColor,
      };
    });
  }, [hoodies, selectedColors]);

  function handleColorChange(hoodieId: string | number, index: number) {
    setSelectedColors((prev) => ({
      ...prev,
      [String(hoodieId)]: index,
    }));
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-10 text-4xl font-bold text-black md:text-5xl">
        PRO1PUTT Hoodies
      </h1>

      {loading ? (
        <p className="text-lg text-neutral-600">Produkte werden geladen…</p>
      ) : preparedHoodies.length === 0 ? (
        <p className="text-lg text-neutral-600">Keine Produkte gefunden.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {preparedHoodies.map((hoodie) => {
            const active = hoodie.activeColor;
            const front = active?.front || "";
            const back = active?.back || active?.front || "";
            const hasMultipleColors = (hoodie.colors?.length || 0) > 1;

            return (
              <div
                key={hoodie.id}
                className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="rounded-2xl bg-neutral-100 p-2">
                    {front ? (
                      <img
                        src={front}
                        alt={`${hoodie.name} ${active?.color || ""} Vorderseite`}
                        className="h-auto w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-400">
                        Kein Frontbild
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-neutral-100 p-2">
                    {back ? (
                      <img
                        src={back}
                        alt={`${hoodie.name} ${active?.color || ""} Rückseite`}
                        className="h-auto w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-400">
                        Kein Rückseitenbild
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <h2 className="mb-2 text-2xl font-bold text-neutral-900">
                    {hoodie.name}
                  </h2>

                  <p className="mb-1 text-sm text-neutral-500">
                    Vorderseite links • Rückseite rechts
                  </p>

                  <p className="mb-4 text-sm font-medium text-neutral-700">
                    Farbe: {active?.color || "—"}
                  </p>

                  {hasMultipleColors ? (
                    <div className="mb-5 flex flex-wrap gap-2">
                      {hoodie.colors!.map((colorItem, index) => (
                        <button
                          key={`${hoodie.id}-${colorItem.color}-${index}`}
                          type="button"
                          onClick={() => handleColorChange(hoodie.id, index)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${colorButtonClass(
                            hoodie.activeIndex === index
                          )}`}
                        >
                          {colorItem.color}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-5">
                      <span className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700">
                        {active?.color || "Standard"}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="w-full rounded-2xl bg-emerald-500 px-5 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Jetzt bestellen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}