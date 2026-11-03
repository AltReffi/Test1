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

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 5;

export interface Game {
  id: string;
  createdAt: number;
  updatedAt: number;
  players: PlayerId[];
  systemId: string;
  /** Øre pr. point ved afregning. 0 = spil uden penge. */
  oerePerPoint: number;
  rounds: Round[];
}

export function systemById(id: string): ScoringSystem {
  return PRESET_SYSTEMS.find((s) => s.id === id) ?? DEFAULT_SYSTEM;
}

export function newGameId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Rens og valider spillernavne. Returnerer fejlbesked eller null. */
export function validatePlayers(names: string[]): string | null {
  const trimmed = names.map((n) => n.trim()).filter((n) => n.length > 0);
  if (trimmed.length < MIN_PLAYERS) return `Der skal være mindst ${MIN_PLAYERS} spillere.`;
  if (trimmed.length > MAX_PLAYERS) return `Der kan højst være ${MAX_PLAYERS} spillere.`;
  const lower = trimmed.map((n) => n.toLocaleLowerCase("da"));
  if (new Set(lower).size !== lower.length) return "To spillere har samme navn.";
  return null;
}

/**
 * Hvem sidder over i runde nr. `roundIndex` (0-baseret)?
 * Med 5 spillere går det på skift (giveren sidder over). Med 4 sidder ingen over.
 */
export function defaultSittingOut(players: PlayerId[], roundIndex: number): PlayerId | null {
  if (players.length <= 4) return null;
  return players[roundIndex % players.length] ?? null;
}

export function seatedPlayers(players: PlayerId[], sittingOut: PlayerId | null): [PlayerId, PlayerId, PlayerId, PlayerId] {
  const seated = players.filter((p) => p !== sittingOut);
  if (seated.length !== 4) throw new ScoringError("Der skal sidde præcis fire spillere ved bordet.");
  return seated as [PlayerId, PlayerId, PlayerId, PlayerId];
}

/** Udkast fra indtastningsskærmen. Felter er null, indtil brugeren har valgt dem. */
export interface RoundDraft {
  type: "trump" | "sol" | "pass";
  sittingOut: PlayerId | null;
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

export function emptyDraft(players: PlayerId[], roundIndex: number): RoundDraft {
  return {
    type: "trump",
    sittingOut: defaultSittingOut(players, roundIndex),
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

export function draftFromRound(players: PlayerId[], round: Round): RoundDraft {
  const sittingOut = players.find((p) => !round.seated.includes(p)) ?? null;
  const base = emptyDraft(players, 0);
  base.sittingOut = sittingOut;
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
    seated = seatedPlayers(players, draft.sittingOut);
  } catch {
    return { ok: false, missing: "Vælg hvem der sidder over" };
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
