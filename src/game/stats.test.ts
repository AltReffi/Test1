import { describe, expect, it } from "vitest";
import type { Round } from "@/scoring";
import type { Game } from "./model";
import { computeStats, percent, periodStart } from "./stats";

const seated: [string, string, string, string] = ["Anna", "Bo", "Carl", "Dorte"];
const DAY = 24 * 60 * 60 * 1000;

function game(id: string, createdAt: number, rounds: Round[], players: string[] = seated, oerePerPoint = 0): Game {
  return { id, createdAt, updatedAt: createdAt, players, systemId: "whist-dk", oerePerPoint, rounds };
}

const r = {
  // Anna melder 8 m. Carl, tager 9 → +40 hver
  annaMade: { type: "trump", seated, bidder: "Anna", partner: "Carl", bid: { level: 8, pahaeng: "ingen" }, tricks: 9 } as Round,
  // Anna melder 9 selvmakker, tager 7 → bet: −80 × 3
  annaAloneBet: { type: "trump", seated, bidder: "Anna", partner: null, bid: { level: 9, pahaeng: "ingen" }, tricks: 7 } as Round,
  // Bo sol, går hjem → +150
  boSol: { type: "sol", seated, sols: [{ player: "Bo", kind: "sol", success: true }] } as Round,
  pass: { type: "pass", seated } as Round,
};

describe("statistik", () => {
  it("point, spil, sejre og meldinger", () => {
    const stats = computeStats([game("g1", 1000, [r.annaMade, r.annaAloneBet, r.boSol, r.pass], seated, 10)]);
    expect(stats.games).toBe(1);
    expect(stats.rounds).toBe(4);

    const anna = stats.players.find((p) => p.name === "Anna")!;
    // +40 −240 −50 = −250
    expect(anna.points).toBe(-250);
    expect(anna.oere).toBe(-2500);
    expect(anna.bids).toBe(2);
    expect(anna.bidsMade).toBe(1);
    expect(anna.avgLevel).toBe(8.5);
    expect(anna.avgTrickDiff).toBe(-0.5); // (+1 + −2) / 2
    expect(anna.alone).toBe(1);
    expect(anna.aloneMade).toBe(0);
    expect(anna.bestRound).toBe(40);
    expect(anna.worstRound).toBe(-240);
    expect(anna.bidPoints).toBe(-200); // +40 −240

    const bo = stats.players.find((p) => p.name === "Bo")!;
    // −40 +80 +150 = 190
    expect(bo.points).toBe(190);
    expect(bo.sols).toBe(1);
    expect(bo.solsMade).toBe(1);
    expect(bo.bidPoints).toBe(150);
    expect(bo.wins).toBe(1);
    expect(stats.players[0]!.name).toBe("Bo");

    const carl = stats.players.find((p) => p.name === "Carl")!;
    expect(carl.asPartner).toBe(1);
    expect(carl.asPartnerMade).toBe(1);
    expect(carl.partnerPoints).toBe(40);
    expect(stats.pairs).toEqual([{ names: ["Anna", "Carl"], rounds: 1, made: 1, points: 40 }]);
  });

  it("samler spillere på tværs af spil uanset store/små bogstaver og bruger seneste stavemåde", () => {
    const older = game("g1", 1000, [r.annaMade], ["anna", "Bo", "Carl", "Dorte"]);
    const olderRound = { ...(r.annaMade as Extract<Round, { type: "trump" }>), seated: ["anna", "Bo", "Carl", "Dorte"], bidder: "anna" } as Round;
    older.rounds = [olderRound];
    const stats = computeStats([game("g2", 2000, [r.annaMade]), older]);
    const anna = stats.players.filter((p) => p.key === "anna");
    expect(anna).toHaveLength(1);
    expect(anna[0]!.name).toBe("Anna");
    expect(anna[0]!.games).toBe(2);
    expect(anna[0]!.bids).toBe(2);
    expect(stats.pairs).toEqual([{ names: ["Anna", "Carl"], rounds: 2, made: 2, points: 80 }]);
  });

  it("delt førsteplads tæller som sejr for begge, og tomme spil tæller ikke", () => {
    const stats = computeStats([game("g1", 1000, [r.annaMade]), game("tom", 2000, [])]);
    expect(stats.games).toBe(1);
    expect(stats.players.find((p) => p.name === "Anna")!.wins).toBe(1);
    expect(stats.players.find((p) => p.name === "Carl")!.wins).toBe(1);
    expect(stats.players.find((p) => p.name === "Bo")!.wins).toBe(0);
  });

  it("periode filtrerer på spillets startdato", () => {
    const now = new Date(2026, 10, 3).getTime();
    const games = [game("gammel", now - 400 * DAY, [r.boSol]), game("ny", now - 2 * DAY, [r.annaMade])];
    expect(computeStats(games, periodStart("all", now)).games).toBe(2);
    expect(computeStats(games, periodStart("30d", now)).games).toBe(1);
    expect(computeStats(games, periodStart("year", now)).games).toBe(1);
  });

  it("kroner tæller kun med, når de er slået til", () => {
    const off = { ...game("g1", 1000, [r.annaMade], seated, 10), moneyEnabled: false };
    const stats = computeStats([off]);
    expect(stats.players.every((p) => p.oere === 0)).toBe(true);
  });

  it("procent", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBeNull();
  });
});
