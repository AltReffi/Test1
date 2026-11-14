import { describe, expect, it } from "vitest";
import { HJERTERES, JEBERG, WHIST_DK, customizeSystem } from "@/scoring";
import {
  createNewGame,
  checkRoundsAgainstSystem,
  summarizeSystem,
  gameSystem,
  stakeLabel,
  stakeOere,
  describeRound,
  draftFromRound,
  emptyDraft,
  roundFromDraft,
  roundsWithRunningTotals,
  validatePlayers,
} from "./model";

const four = ["Anna", "Bo", "Carl", "Dorte"];

describe("spillere", () => {
  it("kræver præcis 4 unikke navne", () => {
    expect(validatePlayers(["A", "B", "C"])).not.toBeNull();
    expect(validatePlayers(["A", "B", "C", "a"])).not.toBeNull();
    expect(validatePlayers(["A", "B", "C", "D"])).toBeNull();
    expect(validatePlayers(["A", "B", "C", "D", "E"])).not.toBeNull();
    expect(validatePlayers([" A ", "B", "C", "D"])).toBeNull();
  });
});

describe("udkast → runde", () => {
  it("fortæller hvad der mangler", () => {
    const d = emptyDraft();
    expect(roundFromDraft(four, WHIST_DK, d)).toEqual({ ok: false, missing: "Vælg melder" });
    d.bidder = "Anna";
    d.level = 8;
    expect(roundFromDraft(four, WHIST_DK, d)).toEqual({ ok: false, missing: "Vælg makker" });
    d.partner = "Anna";
    expect(roundFromDraft(four, WHIST_DK, d)).toEqual({ ok: false, missing: "Vælg makker" });
    d.partner = "self";
    expect(roundFromDraft(four, WHIST_DK, d)).toEqual({ ok: false, missing: "Vælg antal stik" });
    d.tricks = 8;
    const r = roundFromDraft(four, WHIST_DK, d);
    expect(r.ok && r.round).toMatchObject({ type: "trump", bidder: "Anna", partner: null, tricks: 8 });
  });

  it("vip og trumf gemmes kun i systemer der bruger dem", () => {
    const d = { ...emptyDraft(), bidder: "Anna", partner: "Bo" as const, level: 9, pahaeng: "halve" as const, vips: 3, trump: "klør" as const, tricks: 9 };
    const plain = roundFromDraft(four, WHIST_DK, d);
    const jeberg = roundFromDraft(four, JEBERG, d);
    expect(plain.ok && plain.round.type === "trump" && plain.round.bid).toEqual({ level: 9, pahaeng: "halve" });
    expect(jeberg.ok && jeberg.round.type === "trump" && jeberg.round.bid).toEqual({ level: 9, pahaeng: "halve", vips: 3, trump: "klør" });
  });

  it("sol skal have mindst én melder, og meldingen skal findes i regelsættet", () => {
    const d = { ...emptyDraft(), type: "sol" as const };
    expect(roundFromDraft(four, WHIST_DK, d)).toEqual({ ok: false, missing: "Vælg hvem der meldte sol" });
    d.sols = { Bo: { kind: "renBordlaegger", success: true } };
    expect(roundFromDraft(four, JEBERG, d).ok).toBe(false); // findes ikke i jeberg
    expect(roundFromDraft(four, WHIST_DK, d).ok).toBe(true);
  });

  it("runde → udkast → runde giver det samme", () => {
    const d = { ...emptyDraft(), bidder: "Carl", partner: "Dorte" as const, level: 10, pahaeng: "sans" as const, tricks: 11 };
    const r = roundFromDraft(four, WHIST_DK, d);
    if (!r.ok) throw new Error(r.missing);
    expect(roundFromDraft(four, WHIST_DK, draftFromRound(r.round))).toEqual(r);
  });
});

describe("stillingstavle", () => {
  it("løbende stilling og beskrivelse", () => {
    const rows = roundsWithRunningTotals(WHIST_DK, {
      players: four,
      rounds: [
        { type: "trump", seated: ["Anna", "Bo", "Carl", "Dorte"], bidder: "Anna", partner: "Carl", bid: { level: 8, pahaeng: "vip" }, tricks: 9 },
        { type: "sol", seated: ["Anna", "Bo", "Carl", "Dorte"], sols: [{ player: "Bo", kind: "sol", success: false }] },
      ],
    });
    expect(rows[0]!.running).toEqual({ Anna: 80, Bo: -80, Carl: 80, Dorte: -80 });
    expect(rows[1]!.running).toEqual({ Anna: 180, Bo: -380, Carl: 180, Dorte: 20 });
    expect(describeRound(rows[0]!.round)).toBe("Anna 8 vip m. Carl · 9 stik");
    expect(describeRound(rows[1]!.round)).toBe("Bo sol ✗");
  });
});

describe("regelsæt og indsats pr. spil", () => {
  it("spillets egen kopi af regelsættet vinder over systemId", () => {
    expect(gameSystem({ systemId: "jeberg" }).id).toBe("jeberg");
    expect(gameSystem({ systemId: "ukendt" }).id).toBe(WHIST_DK.id);
    const own = { ...WHIST_DK, id: "custom-x", baseRate: 5 };
    expect(gameSystem({ systemId: "whist-dk", system: own }).baseRate).toBe(5);
  });

  it("kroner kan slås fra uden at glemme indsatsen; ældre spil uden flag virker", () => {
    expect(stakeOere({ oerePerPoint: 10, moneyEnabled: true })).toBe(10);
    expect(stakeOere({ oerePerPoint: 10, moneyEnabled: false })).toBe(0);
    expect(stakeOere({ oerePerPoint: 10 })).toBe(10);
    expect(stakeOere({ oerePerPoint: 0 })).toBe(0);
  });

  it("indsats vises i øre eller kroner", () => {
    expect(stakeLabel(5)).toBe("5 øre");
    expect(stakeLabel(100)).toBe("1 kr.");
  });
});

describe("rettelse af regelsæt i et spil", () => {
  const seated: [string, string, string, string] = ["Anna", "Bo", "Carl", "Dorte"];
  const rounds = [
    { type: "trump" as const, seated, bidder: "Anna", partner: "Bo", bid: { level: 8, pahaeng: "ingen" as const }, tricks: 8 },
    { type: "sol" as const, seated, sols: [{ player: "Bo", kind: "renBordlaegger" as const, success: true }] },
  ];

  it("fanger runder, der bruger en solmelding, som er slået fra", () => {
    expect(checkRoundsAgainstSystem(WHIST_DK, rounds)).toBeNull();
    expect(checkRoundsAgainstSystem(HJERTERES, rounds)).toBe("Runde 2 bruger ren bordlægger, som er slået fra.");
  });

  it("opsummering", () => {
    expect(summarizeSystem(WHIST_DK)).toBe("7 = 10, ×2 pr. stik · påhæng ×2 · bet ×2 · sol 50/100/150/200");
    expect(summarizeSystem(JEBERG)).toBe("7 = 10, ×2 pr. stik · gode/sans, halve og vip ×2 hver · bet ×2 pr. stik · stor slem +200 · sol 50/100/200");
    expect(summarizeSystem(customizeSystem(WHIST_DK, { baseRate: 2.5, sol: { sol: null, renSol: null, bordlaegger: null, renBordlaegger: null } }))).toBe(
      "7 = 2,5, ×2 pr. stik · påhæng ×2 · bet ×2 · ingen sol",
    );
  });
});

describe("nyt spil", () => {
  it("gemmer en kopi af regelsættet og kronevalget", () => {
    const g = createNewGame([" Anna ", "Bo", "Carl", "Dorte"], JEBERG, { moneyEnabled: true, oerePerPoint: 5 });
    expect(g.players[0]).toBe("Anna");
    expect(g.system).toEqual(JEBERG);
    expect(g.systemId).toBe("jeberg");
    expect(stakeOere(g)).toBe(5);
    expect(g.rounds).toEqual([]);
  });
});
