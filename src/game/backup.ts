import type { ScoringSystem } from "@/scoring";
import { PLAYER_COUNT, type Game } from "./model";

/** Kendetegn i backupfilen, så vi kan genkende den igen. */
export const BACKUP_APP = "whist-regnskab";
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: number;
  games: Game[];
  customSystems: ScoringSystem[];
}

export function createBackup(games: Game[], customSystems: ScoringSystem[], now: number): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now, games, customSystems };
}

/** Filnavn som "whist-backup-2026-11-03.json". */
export function backupFileName(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `whist-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function isGame(v: unknown): v is Game {
  return (
    isObject(v) &&
    typeof v.id === "string" &&
    typeof v.createdAt === "number" &&
    Array.isArray(v.players) &&
    v.players.length === PLAYER_COUNT &&
    v.players.every((p) => typeof p === "string") &&
    typeof v.systemId === "string" &&
    Array.isArray(v.rounds) &&
    v.rounds.every((r) => isObject(r) && typeof r.type === "string")
  );
}

function isSystem(v: unknown): v is ScoringSystem {
  return isObject(v) && typeof v.id === "string" && typeof v.name === "string" && typeof v.baseRate === "number" && isObject(v.sol);
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

/** Læs og kontroller en backupfil. Afviser alt, der ikke ligner en backup fra appen. */
export function parseBackup(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Filen er ikke en backup fra appen." };
  }
  if (!isObject(data) || data.app !== BACKUP_APP) return { ok: false, error: "Filen er ikke en backup fra appen." };
  if (typeof data.version !== "number" || data.version > BACKUP_VERSION) {
    return { ok: false, error: "Backuppen er lavet med en nyere version af appen. Opdater appen først." };
  }
  if (!Array.isArray(data.games) || !data.games.every(isGame)) return { ok: false, error: "Backuppen indeholder ugyldige spil." };
  const systems = data.customSystems ?? [];
  if (!Array.isArray(systems) || !systems.every(isSystem)) return { ok: false, error: "Backuppen indeholder ugyldige regelsæt." };
  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: data.version,
      exportedAt: typeof data.exportedAt === "number" ? data.exportedAt : 0,
      games: data.games,
      customSystems: systems,
    },
  };
}

export interface MergeResult {
  games: Game[];
  customSystems: ScoringSystem[];
  added: number;
  updated: number;
  unchanged: number;
  addedSystems: number;
}

/**
 * Flet en backup ind i de nuværende data. Intet slettes:
 * nye spil tilføjes, og et spil, der findes begge steder, erstattes kun, hvis backuppens udgave er nyere.
 * Regelsæt matches på id, og eksisterende regelsæt beholdes.
 */
export function mergeBackup(games: Game[], customSystems: ScoringSystem[], backup: Backup): MergeResult {
  const byId = new Map(games.map((g) => [g.id, g]));
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  for (const incoming of backup.games) {
    const current = byId.get(incoming.id);
    if (!current) {
      byId.set(incoming.id, incoming);
      added++;
    } else if ((incoming.updatedAt ?? 0) > (current.updatedAt ?? 0)) {
      byId.set(incoming.id, incoming);
      updated++;
    } else {
      unchanged++;
    }
  }
  const merged = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);

  const systemIds = new Set(customSystems.map((s) => s.id));
  const newSystems = backup.customSystems.filter((s) => !systemIds.has(s.id));
  return {
    games: merged,
    customSystems: [...customSystems, ...newSystems],
    added,
    updated,
    unchanged,
    addedSystems: newSystems.length,
  };
}

/** Kort besked efter indlæsning, fx "3 nye spil, 1 opdateret". */
export function describeMerge(r: MergeResult): string {
  const parts: string[] = [];
  if (r.added) parts.push(`${r.added} ${r.added === 1 ? "nyt spil" : "nye spil"}`);
  if (r.updated) parts.push(`${r.updated} opdateret`);
  if (r.addedSystems) parts.push(`${r.addedSystems} regelsæt`);
  if (parts.length === 0) return "Alt i backuppen fandtes allerede.";
  return `Hentet: ${parts.join(", ")}.`;
}
