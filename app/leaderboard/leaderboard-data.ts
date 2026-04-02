export type LeaderboardRow = {
  rank: number;
  tie?: boolean;
  name: string;
  club: string;
  hcp?: string | null;
  round1: number;
  round2: number;
  round3: number;
  total: number;
  toPar: string;
};

export const leaderboard18Girls = [
  { rank: 1, name: "Wöhler-Moorhoff, Linda", club: "Berlin-Wannsee", hcp: "-1,7", round1: 76, round2: 77, round3: 66, total: 219, toPar: "+3" },
  { rank: 2, name: "Szymanska, Lena", club: "Stolper Heide", hcp: "3,2", round1: 80, round2: 75, round3: 76, total: 231, toPar: "+15" },
  { rank: 3, name: "Renting, Frieda", club: "Dortmund", hcp: "4,0", round1: 74, round2: 91, round3: 81, total: 246, toPar: "+30" },
];

export const leaderboard18Boys = [
  { rank: 1, name: "Dzenis, Andris", club: "Zur Vahr", hcp: "1,1", round1: 71, round2: 73, round3: 70, total: 214, toPar: "-2" },
  { rank: 2, name: "Schwarz, Julian", club: "Wannsee", hcp: "-2,6", round1: 72, round2: 71, round3: 75, total: 218, toPar: "+2" },
  { rank: 3, name: "Kolessilov, Daniel", club: "Gatow", hcp: "-1,4", round1: 68, round2: 76, round3: 75, total: 219, toPar: "+3" },
];

export const leaderboard9Hole = [
  { rank: 1, name: "Nischk, Henry", club: "Wannsee", round1: 42, round2: 34, round3: 39, total: 115, toPar: "+14,5" },
  { rank: 2, name: "Schmitz, Jonathan", club: "Brettberg", round1: 37, round2: 40, round3: 44, total: 121, toPar: "+20,5" },
];