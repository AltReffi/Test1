import type {
  Deltas,
  PlayerId,
  Round,
  ScoringSystem,
  SolKind,
  SolRound,
  TrumpBid,
  TrumpRound,
} from "./types";

export class ScoringError extends Error {}

/** Meldingens værdi (V): det beløb, melder og makker hver vinder ved præcis opfyldt melding. */
export function trumpBidValue(system: ScoringSystem, bid: TrumpBid): number {
  if (!Number.isInteger(bid.level) || bid.level < 7 || bid.level > 13) {
    throw new ScoringError(`Ugyldig melding: ${bid.level}. Skal være 7–13.`);
  }
  let value = system.baseRate * system.stepFactor ** (bid.level - 7);

  if (system.pahaengMode === "single") {
    if (bid.pahaeng !== "ingen") value *= system.pahaengFactor;
    return value;
  }

  // perDoubling (jeberg.eu)
  const vips = bid.vips ?? (bid.pahaeng === "vip" ? 1 : 0);
  if (!Number.isInteger(vips) || vips < 0 || vips > 3) {
    throw new ScoringError(`Ugyldigt antal vip: ${vips}. Skal være 0–3.`);
  }
  const godeOrSans =
    bid.pahaeng === "gode" || bid.pahaeng === "sans" || bid.trump === "klør" || bid.trump === "sans";
  if (godeOrSans) value *= system.pahaengFactor;
  if (bid.pahaeng === "halve") value *= system.pahaengFactor;
  value *= system.pahaengFactor ** vips;
  return value;
}

/**
 * Beløb pr. spiller på melderens side for et givet antal stik.
 * Positivt = melderens side vinder, negativt = taber.
 */
export function trumpOutcome(system: ScoringSystem, bid: TrumpBid, tricks: number): number {
  if (!Number.isInteger(tricks) || tricks < 0 || tricks > 13) {
    throw new ScoringError(`Ugyldigt antal stik: ${tricks}. Skal være 0–13.`);
  }
  const value = trumpBidValue(system, bid);
  const slam = system.slamBonus;

  if (tricks >= bid.level) {
    const over = tricks - bid.level;
    let amount = value * (1 + over);
    if (tricks === 13) amount += slam;
    else if (tricks === 12) amount += slam / 2;
    return amount;
  }

  const under = bid.level - tricks;
  let loss =
    system.lossMode === "flat"
      ? system.lossFactor * value
      : system.lossFactor * value * under;
  if (tricks === 0) loss += slam;
  else if (tricks === 1) loss += slam / 2;
  return -loss;
}

/** Meldestige: udfaldet for hvert muligt antal stik 0–13 (pr. spiller på melderens side). */
export function bidLadder(system: ScoringSystem, bid: TrumpBid): { tricks: number; amount: number }[] {
  return Array.from({ length: 14 }, (_, tricks) => ({ tricks, amount: trumpOutcome(system, bid, tricks) }));
}

function emptyDeltas(seated: readonly PlayerId[]): Deltas {
  if (seated.length !== 4 || new Set(seated).size !== 4) {
    throw new ScoringError("Der skal sidde præcis fire forskellige spillere ved bordet.");
  }
  return Object.fromEntries(seated.map((p) => [p, 0]));
}

function assertSeated(seated: readonly PlayerId[], player: PlayerId, role: string): void {
  if (!seated.includes(player)) throw new ScoringError(`${role} (${player}) sidder ikke ved bordet.`);
}

export function scoreTrumpRound(system: ScoringSystem, round: TrumpRound): Deltas {
  const deltas = emptyDeltas(round.seated);
  assertSeated(round.seated, round.bidder, "Melderen");
  if (round.partner !== null) {
    assertSeated(round.seated, round.partner, "Makkeren");
    if (round.partner === round.bidder) {
      throw new ScoringError("Brug partner: null for selvmakker.");
    }
  }

  const amount = trumpOutcome(system, round.bid, round.tricks);
  const side = round.partner === null ? [round.bidder] : [round.bidder, round.partner];
  const opponents = round.seated.filter((p) => !side.includes(p));

  // Hver modspiller betaler/modtager `amount` fra/til hver spiller på melderens side,
  // fordelt så hver på melderens side netto får amount × (antal modspillere / antal på siden).
  // 2 mod 2: melder +A, makker +A, modspillere −A hver.
  // Selvmakker 1 mod 3: melder +3A, modspillere −A hver.
  for (const opp of opponents) deltas[opp]! -= amount;
  const perSide = (amount * opponents.length) / side.length;
  for (const p of side) deltas[p]! += perSide;
  return deltas;
}

export function solValue(system: ScoringSystem, kind: SolKind): number {
  const value = system.sol[kind];
  if (value === null) throw new ScoringError(`Meldingen "${kind}" findes ikke i systemet ${system.name}.`);
  return value;
}

export function scoreSolRound(system: ScoringSystem, round: SolRound): Deltas {
  const deltas = emptyDeltas(round.seated);
  if (round.sols.length === 0) throw new ScoringError("En solrunde skal have mindst én solmelding.");
  const declarers = new Set<PlayerId>();
  for (const sol of round.sols) {
    assertSeated(round.seated, sol.player, "Solmelderen");
    if (declarers.has(sol.player)) throw new ScoringError(`${sol.player} har meldt sol to gange.`);
    declarers.add(sol.player);

    const value = solValue(system, sol.kind);
    const perOpponent = sol.success ? value : -system.solLossFactor * value;
    for (const other of round.seated) {
      if (other === sol.player) continue;
      deltas[other]! -= perOpponent;
      deltas[sol.player]! += perOpponent;
    }
  }
  return deltas;
}

export function scoreRound(system: ScoringSystem, round: Round): Deltas {
  switch (round.type) {
    case "trump":
      return scoreTrumpRound(system, round);
    case "sol":
      return scoreSolRound(system, round);
    case "pass":
      return emptyDeltas(round.seated);
  }
}

/** Samlet stilling efter alle runder. Spillere der ikke har siddet med, får 0. */
export function totals(system: ScoringSystem, players: readonly PlayerId[], rounds: readonly Round[]): Deltas {
  const sum: Deltas = Object.fromEntries(players.map((p) => [p, 0]));
  for (const round of rounds) {
    for (const [p, d] of Object.entries(scoreRound(system, round))) {
      if (!(p in sum)) throw new ScoringError(`Ukendt spiller i runde: ${p}`);
      sum[p]! += d;
    }
  }
  return sum;
}

export function isZeroSum(deltas: Deltas): boolean {
  return Object.values(deltas).reduce((a, b) => a + b, 0) === 0;
}
