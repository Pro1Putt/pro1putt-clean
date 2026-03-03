"use client";

import Image from "next/image";
import { partners } from "../lib/partners";

export default function PartnerStrip() {
  const powered = partners.filter((p) => p.variant === "powered");
  const normal = partners.filter((p) => p.variant !== "powered");

  const LogoCard = ({
    logoSrc,
    name,
    href,
    large,
  }: {
    logoSrc: string;
    name: string;
    href?: string;
    large?: boolean;
  }) => {
    const card = (
      <div
        className="rounded-2xl border border-black/10 bg-white px-5 py-5 flex items-center justify-center hover:bg-black/[0.02]"
        style={{ minHeight: large ? 92 : 78 }}
        aria-label={name}
        title={name}
      >
        <div className="relative w-full" style={{ height: large ? 52 : 42 }}>
          <Image
            src={logoSrc}
            alt={name}
            fill
            className="object-contain"
            sizes="220px"
            priority={false}
          />
        </div>
      </div>
    );

    if (!href) return card;

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block"
        aria-label={name}
        title={name}
      >
        {card}
      </a>
    );
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        {/* Powered by (gleiches Design wie die anderen) */}
        {powered.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-widest text-black/40 mb-3">
              Powered by
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {powered.map((p) => (
                <LogoCard
                  key={p.key}
                  logoSrc={p.logoSrc}
                  name={p.name}
                  href={p.href}
                  large
                />
              ))}
            </div>
          </div>
        )}

        {/* Partner grid */}
        {normal.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {normal.map((p) => (
              <LogoCard
                key={p.key}
                logoSrc={p.logoSrc}
                name={p.name}
                href={p.href}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}