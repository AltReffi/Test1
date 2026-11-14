import {
  DEFAULT_SYSTEM,
  PRESET_SYSTEMS,
  ScoringError,
  scoreRound,
  type Deltas,
  type Pahaeng,
  type PlayerId,
  type Round,
  type ScoringSystem,
  type SolKind,
  type Trump,
} from "@/scoring";

/** Es-makker whist spilles af præcis fire spillere. */
export const PLAYER_COUNT = 4;

export interface Game {
  id: string;
  createdAt: number;
  updatedAt: number;
  players: PlayerId[];
  /**
   * Fast ID pr. plads (samme rækkefølge som `players`), så statistikken kan følge en spiller på tværs af spil,
   * uanset stavemåde, og skelne to med samme navn. Mangler i ældre spil — se `gamePlayerIds`.
   */
  playerIds?: string[];
  systemId: string;
  /**
   * Spillets egen kopi af regelsættet. Kan rettes undervejs uden at påvirke andre spil.
   * Mangler i spil fra før regelsæt kunne rettes — så bruges det forudindstillede `systemId`.
   */
  system?: ScoringSystem;
  /** Indsats i øre pr. point. Huskes, selv når kroner er slået fra. */
  oerePerPoint: number;
  /** Spil om kroner. Mangler i ældre spil — der betyder oerePerPoint > 0 "til". */
  moneyEnabled?: boolean;
  /**
   * Plads (0–3) for den, der gav i første runde. Mangler = første spiller.
   * Giveren går én plads videre efter hver runde, også når alle melder pas.
   */
  firstDealer?: number;
  rounds: Round[];
}

/** Den spiller, der giver i næste runde. Spillerne står i den rækkefølge, de sidder. */
export function nextDealer(game: Pick<Game, "players" | "rounds" | "firstDealer">): PlayerId {
  const n = game.players.length;
  const index = (((game.firstDealer ?? 0) + game.rounds.length) % n + n) % n;
  return game.players[index]!;
}

/** Ny værdi for firstDealer, så `player` giver i næste runde. */
export function firstDealerFor(game: Pick<Game, "players" | "rounds">, player: PlayerId): number {
  const n = game.players.length;
  const seat = game.players.indexOf(player);
  return (((seat - game.rounds.length) % n) + n) % n;
}

export function systemById(id: string): ScoringSystem {
  return PRESET_SYSTEMS.find((s) => s.id === id) ?? DEFAULT_SYSTEM;
}

/** Regelsættet, et spil regnes efter. */
export function gameSystem(game: Pick<Game, "systemId" | "system">): ScoringSystem {
  return game.system ?? systemById(game.systemId);
}

/** Effektiv indsats i øre pr. point (0 når kroner er slået fra). */
export function stakeOere(game: Pick<Game, "oerePerPoint" | "moneyEnabled">): number {
  const enabled = game.moneyEnabled ?? game.oerePerPoint > 0;
  return enabled ? game.oerePerPoint : 0;
}

export const STAKE_OPTIONS = [1, 5, 10, 25, 50, 100] as const;

export function stakeLabel(oere: number): string {
  return oere >= 100 && oere % 100 === 0 ? `${oere / 100} kr.` : `${oere} øre`;
}

export function newCustomSystemId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function newGameId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Rens og valider spillernavne. Returnerer fejlbesked eller null. */
export function validatePlayers(names: string[]): string | null {
  const trimmed = names.map((n) => n.trim()).filter((n) => n.length > 0);
  if (trimmed.length !== PLAYER_COUNT) return `Der skal være ${PLAYER_COUNT} spillere.`;
  const lower = trimmed.map((n) => n.toLocaleLowerCase("da"));
  if (new Set(lower).size !== lower.length) return "To spillere har samme navn.";
  return null;
}

export function seatedPlayers(players: PlayerId[]): [PlayerId, PlayerId, PlayerId, PlayerId] {
  if (players.length !== PLAYER_COUNT) throw new ScoringError("Der skal være præcis fire spillere.");
  return players as [PlayerId, PlayerId, PlayerId, PlayerId];
}

/** Udkast fra indtastningsskærmen. Felter er null, indtil brugeren har valgt dem. */
export interface RoundDraft {
  type: "trump" | "sol" | "pass";
  bidder: PlayerId | null;
  /** "self" = selvmakker. */
  partner: PlayerId | "self" | null;
  level: number | null;
  pahaeng: Pahaeng;
  vips: number;
  trump: Trump | null;
  tricks: number | null;
  sols: Partial<Record<PlayerId, { kind: SolKind; success: boolean }>>;
}

export function emptyDraft(): RoundDraft {
  return {
    type: "trump",
    bidder: null,
    partner: null,
    level: null,
    pahaeng: "ingen",
    vips: 0,
    trump: null,
    tricks: null,
    sols: {},
  };
}

export function draftFromRound(round: Round): RoundDraft {
  const base = emptyDraft();
  if (round.type === "pass") return { ...base, type: "pass" };
  if (round.type === "sol") {
    const sols: RoundDraft["sols"] = {};
    for (const s of round.sols) sols[s.player] = { kind: s.kind, success: s.success };
    return { ...base, type: "sol", sols };
  }
  return {
    ...base,
    type: "trump",
    bidder: round.bidder,
    partner: round.partner ?? "self",
    level: round.bid.level,
    pahaeng: round.bid.pahaeng,
    vips: round.bid.vips ?? 0,
    trump: round.bid.trump ?? null,
    tricks: round.tricks,
  };
}

export type DraftResult = { ok: true; round: Round } | { ok: false; missing: string };

/** Lav en gyldig runde ud fra udkastet, eller fortæl hvad der mangler. */
export function roundFromDraft(players: PlayerId[], system: ScoringSystem, draft: RoundDraft): DraftResult {
  let seated: [PlayerId, PlayerId, PlayerId, PlayerId];
  try {
    seated = seatedPlayers(players);
  } catch {
    return { ok: false, missing: "Der skal være præcis fire spillere" };
  }

  if (draft.type === "pass") return { ok: true, round: { type: "pass", seated } };

  if (draft.type === "sol") {
    const sols = seated.flatMap((p) => {
      const s = draft.sols[p];
      return s ? [{ player: p, kind: s.kind, success: s.success }] : [];
    });
    if (sols.length === 0) return { ok: false, missing: "Vælg hvem der meldte sol" };
    for (const s of sols) {
      if (system.sol[s.kind] === null) return { ok: false, missing: "Solmeldingen findes ikke i dette regelsæt" };
    }
    return { ok: true, round: { type: "sol", seated, sols } };
  }

  if (!draft.bidder || !seated.includes(draft.bidder)) return { ok: false, missing: "Vælg melder" };
  if (draft.level === null) return { ok: false, missing: "Vælg melding" };
  if (draft.partner === null) return { ok: false, missing: "Vælg makker" };
  if (draft.partner !== "self" && (!seated.includes(draft.partner) || draft.partner === draft.bidder)) {
    return { ok: false, missing: "Vælg makker" };
  }
  if (draft.tricks === null) return { ok: false, missing: "Vælg antal stik" };

  const perDoubling = system.pahaengMode === "perDoubling";
  return {
    ok: true,
    round: {
      type: "trump",
      seated,
      bidder: draft.bidder,
      partner: draft.partner === "self" ? null : draft.partner,
      bid: {
        level: draft.level,
        pahaeng: draft.pahaeng,
        ...(perDoubling ? { vips: draft.vips, trump: draft.trump ?? undefined } : {}),
      },
      tricks: draft.tricks,
    },
  };
}

/** Kort beskrivelse af en runde til stillingstavlen, fx "Anna 8 vip m. Carl · 9 stik". */
export function describeRound(round: Round): string {
  if (round.type === "pass") return "Alle pas";
  if (round.type === "sol") {
    return round.sols.map((s) => `${s.player} ${SOL_LABELS[s.kind].toLowerCase()} ${s.success ? "✓" : "✗"}`).join(", ");
  }
  const pahaeng = round.bid.pahaeng === "ingen" ? "" : ` ${round.bid.pahaeng}`;
  const partner = round.partner === null ? " selvmakker" : ` m. ${round.partner}`;
  return `${round.bidder} ${round.bid.level}${pahaeng}${partner} · ${round.tricks} stik`;
}

export const SOL_LABELS: Record<SolKind, string> = {
  sol: "Sol",
  renSol: "Ren sol",
  bordlaegger: "Bordlægger",
  renBordlaegger: "Ren bordlægger",
};

export const PAHAENG_OPTIONS: Pahaeng[] = ["ingen", "vip", "gode", "sans", "halve"];
export const TRUMP_OPTIONS: Trump[] = ["spar", "hjerter", "ruder", "klør", "sans"];

/** Runder med løbende stilling — til stillingstavlen. */
export function roundsWithRunningTotals(
  system: ScoringSystem,
  game: Pick<Game, "players" | "rounds">,
): { round: Round; deltas: Deltas; running: Deltas }[] {
  const running: Deltas = Object.fromEntries(game.players.map((p) => [p, 0]));
  return game.rounds.map((round) => {
    const deltas = scoreRound(system, round);
    for (const [p, d] of Object.entries(deltas)) running[p] = (running[p] ?? 0) + d;
    return { round, deltas, running: { ...running } };
  });
}

/**
 * Kan alle runder regnes efter regelsættet? Fx fejler det, hvis en solmelding,
 * der er brugt i en runde, er slået fra. Returnerer fejlbesked eller null.
 */
export function checkRoundsAgainstSystem(system: ScoringSystem, rounds: readonly Round[]): string | null {
  for (const [i, round] of rounds.entries()) {
    if (round.type === "sol") {
      const missing = round.sols.find((s) => system.sol[s.kind] === null);
      if (missing) return `Runde ${i + 1} bruger ${SOL_LABELS[missing.kind].toLowerCase()}, som er slået fra.`;
    }
    try {
      scoreRound(system, round);
    } catch (e) {
      return `Runde ${i + 1} kan ikke regnes: ${(e as Error).message}`;
    }
  }
  return null;
}

/** Kort opsummering af et regelsæt, fx "7 = 10, ×2 pr. stik · påhæng ×2 · bet ×2 · sol 50/100/150/200". */
export function summarizeSystem(s: ScoringSystem): string {
  const n = (x: number) => String(x).replace(".", ",");
  const pahaeng = s.pahaengMode === "single" ? `påhæng ×${n(s.pahaengFactor)}` : `gode/sans, halve og vip ×${n(s.pahaengFactor)} hver`;
  const loss = s.lossMode === "flat" ? `bet ×${n(s.lossFactor)}` : `bet ×${n(s.lossFactor)} pr. stik`;
  const sols = (["sol", "renSol", "bordlaegger", "renBordlaegger"] as const)
    .map((k) => s.sol[k])
    .filter((v): v is number => v !== null)
    .map(n)
    .join("/");
  const parts = [`7 = ${n(s.baseRate)}, ×${n(s.stepFactor)} pr. stik`, pahaeng, loss];
  if (s.slamBonus > 0) parts.push(`stor slem +${n(s.slamBonus)}`);
  parts.push(sols ? `sol ${sols}` : "ingen sol");
  return parts.join(" · ");
}

/** Opret et nyt spil med sin egen kopi af regelsættet. `playerIds` er null (eller mangler) for nye spillere. */
export function createNewGame(
  players: PlayerId[],
  system: ScoringSystem,
  money: { moneyEnabled: boolean; oerePerPoint: number },
  playerIds: readonly (string | null)[] = [],
): Game {
  const now = Date.now();
  return {
    id: newGameId(),
    createdAt: now,
    updatedAt: now,
    players: players.map((p) => p.trim()),
    playerIds: players.map((_, i) => playerIds[i] ?? `p-${newGameId()}`),
    systemId: system.id,
    system,
    ...money,
    rounds: [],
  };
}
