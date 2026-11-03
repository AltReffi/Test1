import { describe, expect, it } from "vitest";
import {
  HJERTERES,
  JEBERG,
  PRESET_SYSTEMS,
  WHIST_DK,
  bidLadder,
  customizeSystem,
  isZeroSum,
  scoreRound,
  scoreSolRound,
  scoreTrumpRound,
  settle,
  totals,
  trumpBidValue,
  trumpOutcome,
  validateSystem,
  type Round,
  type TrumpBid,
} from "./index";

const seated: [string, string, string, string] = ["Anna", "Bo", "Carl", "Dorte"];
const bid = (level: number, pahaeng: TrumpBid["pahaeng"] = "ingen", extra: Partial<TrumpBid> = {}): TrumpBid => ({
  level,
  pahaeng,
  ...extra,
});

describe("whist.dk", () => {
  it("grundtakst fordobles pr. stik: 7=10 … 13=640", () => {
    expect([7, 8, 9, 10, 11, 12, 13].map((l) => trumpBidValue(WHIST_DK, bid(l)))).toEqual([
      10, 20, 40, 80, 160, 320, 640,
    ]);
  });

  it("overstik giver grundtaksten pr. stik: meld 8, tag 10 = 60", () => {
    expect(trumpOutcome(WHIST_DK, bid(8), 10)).toBe(60);
  });

  it("påhæng fordobler", () => {
    for (const p of ["vip", "gode", "sans", "halve"] as const) {
      expect(trumpBidValue(WHIST_DK, bid(8, p))).toBe(40);
    }
  });

  it("tabt melding koster dobbelt takst uanset understik", () => {
    expect(trumpOutcome(WHIST_DK, bid(9), 8)).toBe(-80);
    expect(trumpOutcome(WHIST_DK, bid(9), 2)).toBe(-80);
  });

  it("2 mod 2: melder og makker får beløbet hver, modspillere betaler hver", () => {
    const d = scoreTrumpRound(WHIST_DK, { type: "trump", seated, bidder: "Anna", partner: "Carl", bid: bid(8), tricks: 8 });
    expect(d).toEqual({ Anna: 20, Bo: -20, Carl: 20, Dorte: -20 });
  });

  it("selvmakker får tre gange beløbet", () => {
    const d = scoreTrumpRound(WHIST_DK, { type: "trump", seated, bidder: "Anna", partner: null, bid: bid(8), tricks: 8 });
    expect(d).toEqual({ Anna: 60, Bo: -20, Carl: -20, Dorte: -20 });
  });

  it("sol 50 / ren sol 100 / bordlægger 150 / ren bordlægger 200 fra hver", () => {
    const won = (kind: "sol" | "renSol" | "bordlaegger" | "renBordlaegger") =>
      scoreSolRound(WHIST_DK, { type: "sol", seated, sols: [{ player: "Bo", kind, success: true }] }).Bo;
    expect([won("sol"), won("renSol"), won("bordlaegger"), won("renBordlaegger")]).toEqual([150, 300, 450, 600]);
  });

  it("tabt sol betaler dobbelt til hver", () => {
    const d = scoreSolRound(WHIST_DK, { type: "sol", seated, sols: [{ player: "Bo", kind: "sol", success: false }] });
    expect(d).toEqual({ Anna: 100, Bo: -300, Carl: 100, Dorte: 100 });
  });
});

describe("hjerteres.dk", () => {
  it("bordlægger giver 200, ren bordlægger findes ikke", () => {
    const d = scoreSolRound(HJERTERES, { type: "sol", seated, sols: [{ player: "Bo", kind: "bordlaegger", success: true }] });
    expect(d.Bo).toBe(600);
    expect(() =>
      scoreSolRound(HJERTERES, { type: "sol", seated, sols: [{ player: "Bo", kind: "renBordlaegger", success: true }] }),
    ).toThrow();
  });

  it("maks tab ved nolo er 1200 (200 × 2 × 3)", () => {
    const d = scoreSolRound(HJERTERES, { type: "sol", seated, sols: [{ player: "Bo", kind: "bordlaegger", success: false }] });
    expect(d.Bo).toBe(-1200);
  });
});

describe("jeberg.eu (regneeksemplet fra siden)", () => {
  // "9 halve, vippet 3 gange, klør blev trumf" med G=1
  const G1 = customizeSystem(JEBERG, { baseRate: 1, slamBonus: 0 });
  const nineHalve = bid(9, "halve", { vips: 3, trump: "klør" });

  it("værdi 128G", () => expect(trumpBidValue(G1, nineHalve)).toBe(128));
  it("10 stik: 256G, 11 stik: 384G", () => {
    expect(trumpOutcome(G1, nineHalve, 10)).toBe(256);
    expect(trumpOutcome(G1, nineHalve, 11)).toBe(384);
  });
  it("8 stik: −256G, 7 stik: −512G", () => {
    expect(trumpOutcome(G1, nineHalve, 8)).toBe(-256);
    expect(trumpOutcome(G1, nineHalve, 7)).toBe(-512);
  });

  it("stor slem: meld 7, få 13 = 7G+SS, 12 = 6G+½SS, 1 = −(12G+½SS), 0 = −(14G+SS)", () => {
    const sys = customizeSystem(JEBERG, { baseRate: 1, slamBonus: 100 });
    expect(trumpOutcome(sys, bid(7), 13)).toBe(107);
    expect(trumpOutcome(sys, bid(7), 12)).toBe(56);
    expect(trumpOutcome(sys, bid(7), 1)).toBe(-62);
    expect(trumpOutcome(sys, bid(7), 0)).toBe(-114);
  });

  it("vundet sol giver 3S, tabt ren sol koster 12S", () => {
    const S = JEBERG.sol.sol!;
    const win = scoreSolRound(JEBERG, { type: "sol", seated, sols: [{ player: "Anna", kind: "sol", success: true }] });
    expect(win.Anna).toBe(3 * S);
    const lose = scoreSolRound(JEBERG, { type: "sol", seated, sols: [{ player: "Anna", kind: "renSol", success: false }] });
    expect(lose.Anna).toBe(-12 * S);
  });

  it("to sol samtidig: én går igennem (+5S), én væltes (−7S), modspillere +1S", () => {
    const S = JEBERG.sol.sol!;
    const d = scoreSolRound(JEBERG, {
      type: "sol",
      seated,
      sols: [
        { player: "Anna", kind: "sol", success: true },
        { player: "Bo", kind: "sol", success: false },
      ],
    });
    expect(d).toEqual({ Anna: 5 * S, Bo: -7 * S, Carl: S, Dorte: S });
  });

  it("to sol, begge går igennem: +2S hver; begge væltes: −4S hver", () => {
    const S = JEBERG.sol.sol!;
    const both = (success: boolean) =>
      scoreSolRound(JEBERG, {
        type: "sol",
        seated,
        sols: [
          { player: "Anna", kind: "sol", success },
          { player: "Bo", kind: "sol", success },
        ],
      });
    expect(both(true).Anna).toBe(2 * S);
    expect(both(false).Anna).toBe(-4 * S);
  });
});

describe("generelt", () => {
  it("alle systemer er nulsum for alle meldinger og stik", () => {
    for (const sys of PRESET_SYSTEMS) {
      for (let level = 7; level <= 13; level++) {
        for (const pahaeng of ["ingen", "vip", "gode", "sans", "halve"] as const) {
          for (let tricks = 0; tricks <= 13; tricks++) {
            for (const partner of ["Carl", null]) {
              const d = scoreTrumpRound(sys, { type: "trump", seated, bidder: "Anna", partner, bid: bid(level, pahaeng), tricks });
              expect(isZeroSum(d)).toBe(true);
            }
          }
        }
      }
    }
  });

  it("meldestige har 14 trin", () => {
    const ladder = bidLadder(WHIST_DK, bid(8));
    expect(ladder).toHaveLength(14);
    expect(ladder[8]).toEqual({ tricks: 8, amount: 20 });
  });

  it("afviser ugyldige input", () => {
    expect(() => trumpBidValue(WHIST_DK, bid(6))).toThrow();
    expect(() => trumpOutcome(WHIST_DK, bid(7), 14)).toThrow();
    expect(() =>
      scoreTrumpRound(WHIST_DK, { type: "trump", seated, bidder: "Erik", partner: "Bo", bid: bid(7), tricks: 7 }),
    ).toThrow();
  });

  it("fem spillere: den der sidder over får 0 i runden", () => {
    const players = ["Anna", "Bo", "Carl", "Dorte", "Erik"];
    const rounds: Round[] = [
      { type: "trump", seated, bidder: "Anna", partner: "Bo", bid: bid(8), tricks: 9 },
      { type: "sol", seated: ["Bo", "Carl", "Dorte", "Erik"], sols: [{ player: "Erik", kind: "sol", success: true }] },
      { type: "pass", seated },
    ];
    const t = totals(WHIST_DK, players, rounds);
    expect(t).toEqual({ Anna: 40, Bo: -10, Carl: -90, Dorte: -90, Erik: 150 });
    expect(isZeroSum(t)).toBe(true);
    expect(scoreRound(WHIST_DK, rounds[2]!)).toEqual({ Anna: 0, Bo: 0, Carl: 0, Dorte: 0 });
  });
});

describe("afregning", () => {
  it("højst n−1 overførsler og alle går i nul", () => {
    const t = { Anna: 40, Bo: -10, Carl: -90, Dorte: -90, Erik: 150 };
    const transfers = settle(t, 10); // 10 øre pr. point
    expect(transfers.length).toBeLessThanOrEqual(4);
    const net: Record<string, number> = { Anna: 0, Bo: 0, Carl: 0, Dorte: 0, Erik: 0 };
    for (const tr of transfers) {
      net[tr.from]! -= tr.oere;
      net[tr.to]! += tr.oere;
    }
    expect(net).toEqual({ Anna: 400, Bo: -100, Carl: -900, Dorte: -900, Erik: 1500 });
  });
});

describe("validering af regelsæt", () => {
  it("de forudindstillede systemer er gyldige", () => {
    for (const sys of PRESET_SYSTEMS) expect(validateSystem(sys)).toBeNull();
  });

  it("afviser ugyldige værdier", () => {
    expect(validateSystem(customizeSystem(WHIST_DK, { name: " " }))).not.toBeNull();
    expect(validateSystem(customizeSystem(WHIST_DK, { baseRate: 0 }))).not.toBeNull();
    expect(validateSystem(customizeSystem(WHIST_DK, { stepFactor: 0.5 }))).not.toBeNull();
    expect(validateSystem(customizeSystem(WHIST_DK, { lossFactor: Number.NaN }))).not.toBeNull();
    expect(validateSystem(customizeSystem(WHIST_DK, { slamBonus: -1 }))).not.toBeNull();
    expect(validateSystem(customizeSystem(WHIST_DK, { sol: { sol: 0 } }))).not.toBeNull();
  });

  it("tillader at slå solmeldinger fra og bruge egne takster", () => {
    const sys = customizeSystem(WHIST_DK, { name: "Klubben", baseRate: 5, sol: { bordlaegger: null, renBordlaegger: null } });
    expect(validateSystem(sys)).toBeNull();
    expect(trumpOutcome(sys, bid(8), 9)).toBe(20);
  });
});

describe("formatering", () => {
  it("bruger rigtigt minustegn og dansk komma", async () => {
    const { formatKroner, formatPoints } = await import("./index");
    expect(formatPoints(1340)).toBe("+1.340");
    expect(formatPoints(-380)).toBe("−380");
    expect(formatPoints(0)).toBe("0");
    expect(formatKroner(-600)).toBe("−6,00 kr.");
    expect(formatKroner(1250)).toBe("12,50 kr.");
  });
});
