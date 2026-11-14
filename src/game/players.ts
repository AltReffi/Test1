import type { Round } from "@/scoring";
import type { Game } from "./model";

/** Spillere genkendes i ældre spil (uden ID) ud fra navnet, uden forskel på store/små bogstaver. */
export function playerKey(name: string): string {
  return name.trim().toLocaleLowerCase("da");
}

/** ID for hver plads i spillet. Ældre spil uden ID bruger navnet, så de stadig tæller med i statistikken. */
export function gamePlayerIds(game: Pick<Game, "players" | "playerIds">): string[] {
  return game.players.map((name, i) => game.playerIds?.[i] ?? playerKey(name));
}

export interface KnownPlayer {
  id: string;
  /** Navnet fra det seneste spil. */
  name: string;
  lastPlayed: number;
  games: number;
}

/** Alle spillere fra tidligere spil, senest brugte først. */
export function knownPlayers(games: readonly Game[]): KnownPlayer[] {
  const byId = new Map<string, KnownPlayer>();
  for (const game of [...games].sort((a, b) => a.createdAt - b.createdAt)) {
    gamePlayerIds(game).forEach((id, i) => {
      const p = byId.get(id) ?? { id, name: "", lastPlayed: 0, games: 0 };
      p.name = game.players[i]!;
      p.lastPlayed = game.createdAt;
      p.games++;
      byId.set(id, p);
    });
  }
  return [...byId.values()].sort((a, b) => b.lastPlayed - a.lastPlayed);
}

/** Gemte spillere med præcis dette navn (uden forskel på store/små bogstaver), senest brugte først. */
export function playersNamed(known: readonly KnownPlayer[], name: string): KnownPlayer[] {
  const key = playerKey(name);
  return key ? known.filter((p) => playerKey(p.name) === key) : [];
}

export type RenameResult = { ok: true; games: Game[]; changed: number } | { ok: false; error: string };

/**
 * Omdøb spilleren med `id` i alle spil, også i runderne, hvor navnet er nøglen.
 * Afvises, hvis navnet er tomt, eller hvis en anden spiller i samme spil allerede hedder det.
 */
export function renamePlayer(games: readonly Game[], id: string, newName: string, now: number): RenameResult {
  const name = newName.trim();
  if (!name) return { ok: false, error: "Skriv et navn." };
  let changed = 0;
  const result: Game[] = [];
  for (const game of games) {
    const ids = gamePlayerIds(game);
    const seat = ids.indexOf(id);
    const old = game.players[seat];
    if (seat < 0 || old === undefined || old === name) {
      result.push(game);
      continue;
    }
    if (game.players.some((p, i) => i !== seat && playerKey(p) === playerKey(name))) {
      return { ok: false, error: `En anden spiller hedder allerede ${name} i et spil.` };
    }
    const swap = (p: string) => (p === old ? name : p);
    const rounds = game.rounds.map((r): Round => {
      const seated = r.seated.map(swap) as typeof r.seated;
      if (r.type === "trump") return { ...r, seated, bidder: swap(r.bidder), partner: r.partner === null ? null : swap(r.partner) };
      if (r.type === "sol") return { ...r, seated, sols: r.sols.map((s) => ({ ...s, player: swap(s.player) })) };
      return { ...r, seated };
    });
    // ID'et skrives ind, så ældre spil (hvor ID = navnet) beholder spilleren efter omdøbningen.
    result.push({ ...game, players: game.players.map(swap), playerIds: ids, rounds, updatedAt: now });
    changed++;
  }
  return { ok: true, games: result, changed };
}
