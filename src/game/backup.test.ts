import { describe, expect, it } from "vitest";
import { WHIST_DK, customizeSystem } from "@/scoring";
import { backupFileName, createBackup, describeMerge, mergeBackup, parseBackup } from "./backup";
import { createNewGame, firstDealerFor, nextDealer, type Game } from "./model";

const four = ["Anna", "Bo", "Carl", "Dorte"];
const money = { moneyEnabled: false, oerePerPoint: 1 };
const pass = { type: "pass" as const, seated: four as [string, string, string, string] };

function game(id: string, updatedAt: number, rounds = 0): Game {
  return { ...createNewGame(four, WHIST_DK, money), id, createdAt: updatedAt, updatedAt, rounds: Array(rounds).fill(pass) };
}

describe("giver", () => {
  it("starter hos første spiller og går videre efter hver runde, også alle pas", () => {
    expect(nextDealer(game("a", 1, 0))).toBe("Anna");
    expect(nextDealer(game("a", 1, 1))).toBe("Bo");
    expect(nextDealer(game("a", 1, 4))).toBe("Anna");
    expect(nextDealer(game("a", 1, 7))).toBe("Dorte");
  });

  it("kan flyttes til en bestemt spiller midt i spillet", () => {
    const g = game("a", 1, 5);
    for (const p of four) expect(nextDealer({ ...g, firstDealer: firstDealerFor(g, p) })).toBe(p);
  });
});

describe("backup", () => {
  it("kan læses igen", () => {
    const sys = customizeSystem(WHIST_DK, { name: "Vores regler" });
    const backup = createBackup([game("a", 1, 2)], [sys], 123);
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed).toEqual({ ok: true, backup });
  });

  it("afviser andre filer", () => {
    expect(parseBackup("ikke json").ok).toBe(false);
    expect(parseBackup(JSON.stringify({ hej: 1 })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ app: "whist-regnskab", version: 1, games: [{ id: "x" }] })).ok).toBe(false);
    const future = parseBackup(JSON.stringify({ app: "whist-regnskab", version: 99, games: [] }));
    expect(future.ok === false && future.error).toMatch(/nyere version/);
  });

  it("fletter uden at slette og beholder den nyeste udgave", () => {
    const local = [game("a", 10, 3), game("b", 20, 1)];
    const backup = createBackup([game("a", 5, 1), game("b", 30, 4), game("c", 40, 2)], [], 0);
    const r = mergeBackup(local, [], backup);
    expect(r.games.map((g) => g.id)).toEqual(["c", "b", "a"]);
    expect(r.games.find((g) => g.id === "a")!.rounds).toHaveLength(3);
    expect(r.games.find((g) => g.id === "b")!.rounds).toHaveLength(4);
    expect([r.added, r.updated, r.unchanged]).toEqual([1, 1, 1]);
    expect(describeMerge(r)).toBe("Hentet: 1 nyt spil, 1 opdateret.");
  });

  it("tilføjer kun nye regelsæt", () => {
    const sys = customizeSystem(WHIST_DK, { name: "Vores" });
    const r = mergeBackup([], [sys], createBackup([], [sys, { ...sys, id: "andet" }], 0));
    expect(r.customSystems.map((s) => s.id)).toEqual([sys.id, "andet"]);
    expect(r.addedSystems).toBe(1);
  });

  it("navngiver filen efter datoen", () => {
    expect(backupFileName(new Date(2026, 10, 3, 12).getTime())).toBe("whist-backup-2026-11-03.json");
  });
});
