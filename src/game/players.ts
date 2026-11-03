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
