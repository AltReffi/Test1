import type { ScoringSystem } from "./types";

/**
 * whist.dk — faste point pr. melding. Standardsystemet.
 * 7=10, 8=20 … 13=640. Overstik = grundtakst pr. stik. Påhæng fordobler.
 * Tabt melding: dobbelt takst. Selvmakker: hver modspiller betaler.
 * Sol 50, ren sol 100, bordlægger 150, ren bordlægger 200.
 */
export const WHIST_DK: ScoringSystem = {
  id: "whist-dk",
  name: "whist.dk",
  description: "Faste point: 7 giver 10 og fordobles pr. stik. Påhæng fordobler. Sol 50 / 100 / 150 / 200.",
  source: "https://whist.dk/whist-regler",
  baseRate: 10,
  stepFactor: 2,
  pahaengMode: "single",
  pahaengFactor: 2,
  lossMode: "flat",
  lossFactor: 2,
  slamBonus: 0,
  sol: { sol: 50, renSol: 100, bordlaegger: 150, renBordlaegger: 200 },
  solLossFactor: 2,
};

/**
 * hjerteres.dk — som whist.dk, men bordlægger giver 200 og der er ingen ren bordlægger.
 * Antagelse: tabt trumfmelding koster dobbelt takst (siden nævner det kun for sol).
 */
export const HJERTERES: ScoringSystem = {
  ...WHIST_DK,
  id: "hjerteres",
  name: "Hjerteres.dk",
  description: "Som whist.dk, men bordlægger giver 200, og der er ingen ren bordlægger.",
  source: "https://hjerteres.dk/kortspil/es-makker-whist/",
  sol: { sol: 50, renSol: 100, bordlaegger: 200, renBordlaegger: null },
};

/**
 * jeberg.eu — klassisk takstsystem med grundtakst (G), soltakst (S) og stor slem (SS).
 * Fordobling for hvert stik, gode/sans (klør eller sans som trumf), halve, hver vip og bet.
 * Bet koster dobbelt pr. manglende stik. Sol S, ren sol 2S, bordlægger 4S.
 * Takster aftales ved bordet — standardværdierne her kan rettes.
 */
export const JEBERG: ScoringSystem = {
  id: "jeberg",
  name: "Klassisk takst (jeberg.eu)",
  description: "Grundtakst der fordobles for stik, gode/sans, halve og hver vip. Bet koster pr. manglende stik. Bonus for stor slem.",
  source: "https://www.jeberg.eu/whist/whist-regler/",
  baseRate: 10,
  stepFactor: 2,
  pahaengMode: "perDoubling",
  pahaengFactor: 2,
  lossMode: "perUndertrick",
  lossFactor: 2,
  slamBonus: 200,
  sol: { sol: 50, renSol: 100, bordlaegger: 200, renBordlaegger: null },
  solLossFactor: 2,
};

export const PRESET_SYSTEMS: readonly ScoringSystem[] = [WHIST_DK, HJERTERES, JEBERG];

export const DEFAULT_SYSTEM = WHIST_DK;

/** Lav et brugerdefineret system ud fra et eksisterende. */
export function customizeSystem(
  base: ScoringSystem,
  overrides: Partial<Omit<ScoringSystem, "sol">> & { sol?: Partial<ScoringSystem["sol"]> },
): ScoringSystem {
  return {
    ...base,
    ...overrides,
    id: overrides.id ?? `${base.id}-custom`,
    name: overrides.name ?? `${base.name} (tilpasset)`,
    sol: { ...base.sol, ...overrides.sol },
  };
}
