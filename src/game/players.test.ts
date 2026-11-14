import { describe, expect, it } from "vitest";
import { WHIST_DK, type Round } from "@/scoring";
import { roundsWithRunningTotals, type Game } from "./model";
import { gamePlayerIds, renamePlayer } from "./players";
import { computeStats } from "./stats";

const seated: [string, string, string, string] = ["Anna", "Jakob", "Carl", "Dorte"];
const rounds: Round[] = [
  { type: "trump", seated, bidder: "Jakob", partner: "Anna", bid: { level: 8, pahaeng: "ingen" }, tricks: 9 },
  { type: "trump", seated, bidder: "Carl", partner: "Jakob", bid: { level: 9, pahaeng: "ingen" }, tricks: 7 },
  { type: "sol", seated, sols: [{ player: "Jakob", kind: "sol", success: true }] },
  { type: "pass", seated },
];
const legacy: Game = { id: "old", createdAt: 1, updatedAt: 1, players: [...seated], systemId: "whist-dk", oerePerPoint: 0, rounds };
const withIds: Game = { ...legacy, id: "new", createdAt: 2, updatedAt: 2, playerIds: ["a", "j2", "c", "d"] };

const totals = (g: Game) => roundsWithRunningTotals(WHIST_DK, g).at(-1)!.running;

describe("omdøb spiller", () => {
  it("ændrer navnet overalt, men point og statistik er de samme", () => {
    const before = computeStats([legacy, withIds]);
    const r = renamePlayer([legacy, withIds], "jakob", "Jakob H", 99);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [old, other] = r.games as [Game, Game];

    expect(r.changed).toBe(1);
    expect(old.players).toEqual(["Anna", "Jakob H", "Carl", "Dorte"]);
    expect(JSON.stringify(old.rounds)).not.toContain('"Jakob"');
    expect(gamePlayerIds(old)).toEqual(["anna", "jakob", "carl", "dorte"]);
    expect(old.updatedAt).toBe(99);
    expect(other).toBe(withIds); // den anden Jakob har et andet ID og røres ikke

    // Samme point pr. plads før og efter.
    expect(Object.values(totals(old))).toEqual(Object.values(totals(legacy)));
    const after = computeStats(r.games);
    expect(after.players.map((p) => [p.key, p.points, p.bids, p.sols])).toEqual(before.players.map((p) => [p.key, p.points, p.bids, p.sols]));
    expect(after.players.find((p) => p.key === "jakob")!.name).toBe("Jakob H");
  });

  it("afviser tomt navn og navn, som en anden har i samme spil", () => {
    expect(renamePlayer([legacy], "jakob", "  ", 9).ok).toBe(false);
    expect(renamePlayer([legacy], "jakob", "carl", 9).ok).toBe(false);
    // Samme navn som en spiller i et andet spil er tilladt.
    expect(renamePlayer([withIds], "j2", "Bo", 9).ok).toBe(true);
  });
});
