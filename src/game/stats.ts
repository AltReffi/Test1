import { scoreRound, type PlayerId } from "@/scoring";
import { systemById, type Game } from "./model";

/** Spillere genkendes på tværs af spil ud fra navnet (uden forskel på store/små bogstaver). */
export function playerKey(name: string): string {
  return name.trim().toLocaleLowerCase("da");
}

export interface PlayerStats {
  key: string;
  /** Navnet som det blev skrevet i det seneste spil. */
  name: string;
  games: number;
  /** Spil hvor spilleren sluttede øverst (delt førsteplads tæller med). */
  wins: number;
  rounds: number;
  points: number;
  /** Vundet/tabt i øre (kun spil med indsats). */
  oere: number;

  /** Trumfmeldinger som melder. */
  bids: number;
  bidsMade: number;
  /** Gennemsnitligt meldt antal stik. */
  avgLevel: number | null;
  /** Gennemsnitlig forskel mellem tagne og meldte stik. Negativ = melder for højt. */
  avgTrickDiff: number | null;
  alone: number;
  aloneMade: number;

  /** Runder som makker. */
  asPartner: number;
  asPartnerMade: number;

  sols: number;
  solsMade: number;

  bestRound: number | null;
  worstRound: number | null;
}

export interface PairStats {
  /** Navnene i alfabetisk rækkefølge. */
  names: [string, string];
  rounds: number;
  made: number;
  /** Point pr. spiller for parret samlet. */
  points: number;
}

export interface StatsResult {
  games: number;
  rounds: number;
  players: PlayerStats[];
  pairs: PairStats[];
}

export type Period = "all" | "year" | "30d";

export function periodStart(period: Period, now: number = Date.now()): number {
  if (period === "all") return 0;
  if (period === "30d") return now - 30 * 24 * 60 * 60 * 1000;
  return new Date(new Date(now).getFullYear(), 0, 1).getTime();
}

function emptyPlayer(key: string, name: string): PlayerStats {
  return {
    key,
    name,
    games: 0,
    wins: 0,
    rounds: 0,
    points: 0,
    oere: 0,
    bids: 0,
    bidsMade: 0,
    avgLevel: null,
    avgTrickDiff: null,
    alone: 0,
    aloneMade: 0,
    asPartner: 0,
    asPartnerMade: 0,
    sols: 0,
    solsMade: 0,
    bestRound: null,
    worstRound: null,
  };
}

/** Statistik over alle spil, der er startet efter `since` (ms). Spil uden runder tæller ikke med. */
export function computeStats(games: readonly Game[], since = 0): StatsResult {
  const players = new Map<string, PlayerStats>();
  const levelSum = new Map<string, number>();
  const diffSum = new Map<string, number>();
  const pairs = new Map<string, PairStats & { keys: string[] }>();
  let gameCount = 0;
  let roundCount = 0;

  // Ældste først, så navnet fra det seneste spil vinder.
  const sorted = [...games].filter((g) => g.createdAt >= since && g.rounds.length > 0).sort((a, b) => a.createdAt - b.createdAt);

  for (const game of sorted) {
    gameCount++;
    roundCount += game.rounds.length;
    const system = systemById(game.systemId);
    const get = (name: PlayerId): PlayerStats => {
      const key = playerKey(name);
      let s = players.get(key);
      if (!s) {
        s = emptyPlayer(key, name);
        players.set(key, s);
      }
      s.name = name;
      return s;
    };

    const totals = new Map<PlayerId, number>(game.players.map((p) => [p, 0]));
    for (const p of game.players) get(p).games++;

    for (const round of game.rounds) {
      const deltas = scoreRound(system, round);
      for (const [p, d] of Object.entries(deltas)) {
        const s = get(p);
        s.rounds++;
        s.points += d;
        totals.set(p, (totals.get(p) ?? 0) + d);
        if (round.type !== "pass") {
          s.bestRound = s.bestRound === null ? d : Math.max(s.bestRound, d);
          s.worstRound = s.worstRound === null ? d : Math.min(s.worstRound, d);
        }
      }

      if (round.type === "trump") {
        const made = round.tricks >= round.bid.level;
        const b = get(round.bidder);
        b.bids++;
        if (made) b.bidsMade++;
        levelSum.set(b.key, (levelSum.get(b.key) ?? 0) + round.bid.level);
        diffSum.set(b.key, (diffSum.get(b.key) ?? 0) + (round.tricks - round.bid.level));
        if (round.partner === null) {
          b.alone++;
          if (made) b.aloneMade++;
        } else {
          const partner = get(round.partner);
          partner.asPartner++;
          if (made) partner.asPartnerMade++;

          const keys = [b.key, partner.key].sort();
          const pairKey = keys.join("|");
          const pair = pairs.get(pairKey) ?? { keys, names: ["", ""], rounds: 0, made: 0, points: 0 };
          pair.rounds++;
          if (made) pair.made++;
          pair.points += deltas[round.bidder] ?? 0;
          pairs.set(pairKey, pair);
        }
      } else if (round.type === "sol") {
        for (const sol of round.sols) {
          const s = get(sol.player);
          s.sols++;
          if (sol.success) s.solsMade++;
        }
      }
    }

    const best = Math.max(...totals.values());
    for (const [p, total] of totals) {
      const s = get(p);
      if (total === best) s.wins++;
      s.oere += Math.round(total * game.oerePerPoint);
    }
  }

  // Parrets navne sættes til sidst, så de følger spillernes seneste stavemåde.
  for (const pair of pairs.values()) {
    const names = pair.keys.map((k) => players.get(k)?.name ?? k);
    pair.names = names.sort((x, y) => x.localeCompare(y, "da")) as [string, string];
  }

  for (const s of players.values()) {
    if (s.bids > 0) {
      s.avgLevel = (levelSum.get(s.key) ?? 0) / s.bids;
      s.avgTrickDiff = (diffSum.get(s.key) ?? 0) / s.bids;
    }
  }

  return {
    games: gameCount,
    rounds: roundCount,
    players: [...players.values()].sort((a, b) => b.points - a.points),
    pairs: [...pairs.values()].map(({ keys: _keys, ...pair }) => pair).sort((a, b) => b.points - a.points),
  };
}

/** Andel i hele procent, eller null hvis der ikke er noget at regne på. */
export function percent(part: number, whole: number): number | null {
  return whole === 0 ? null : Math.round((part / whole) * 100);
}
