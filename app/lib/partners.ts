export type Partner = {
  key: string;
  name: string;
  logoSrc: string; // path inside /public
  href?: string;
  variant?: "default" | "powered";
};

export const partners: Partner[] = [
  // Powered by
  {
    key: "vcg",
    name: "VCG",
    logoSrc: "/partners/vcg-logo.svg",
    href: "https://www.vcg.de",
    variant: "powered",
  },

  // Partner (aus deinem aktuellen app/page.tsx übernommen)
  {
    key: "callaway",
    name: "Callaway",
    logoSrc: "/partners/callaway.png",
    href: "https://fcgworldchampionship.com",
    variant: "default",
  },
  {
    key: "egr",
    name: "EGR",
    logoSrc: "/partners/egr.png",
    href: "https://www.europeangolfrankings.com",
    variant: "default",
  },
  {
    key: "golfhouse",
    name: "Golf House",
    logoSrc: "/partners/golfhouse.svg",
    href: "https://www.golfhouse.de",
    variant: "default",
  },
  {
    key: "golfkidsfun",
    name: "GolfKidsFun",
    logoSrc: "/partners/golfkidsfun.png",
    href: "https://www.golfkidsfun.com",
    variant: "default",
  },
  {
    key: "gsusa",
    name: "Golf Scholarship USA",
    logoSrc: "/partners/gsusa.png",
    href: "https://sportusa.co.uk/sport-overviews/golf",
    variant: "default",
  },
  {
    key: "jucad",
    name: "JuCad",
    logoSrc: "/partners/jucad.png",
    href: "https://www.jucad.de",
    variant: "default",
  },
  {
    key: "underarmour",
    name: "Under Armour",
    logoSrc: "/partners/underarmour.png",
    href: "https://www.ugolftour.com",
    variant: "default",
  },
  {
    key: "wagr",
    name: "WAGR",
    logoSrc: "/partners/wagr.png",
    href: "https://www.wagr.com",
    variant: "default",
  },
];