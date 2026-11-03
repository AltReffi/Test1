import { describe, expect, it } from "vitest";
import { JEBERG, WHIST_DK } from "@/scoring";
import {
  defaultSittingOut,
  describeRound,
  draftFromRound,
  emptyDraft,
  roundFromDraft,
  roundsWithRunningTotals,
  validatePlayers,
} from "./model";

const four = ["Anna", "Bo", "Carl", "Dorte"];
const five = [...four, "Erik"];

describe("spillere", () => {
  it("kræver 4–5 unikke navne", () => {
    expect(validatePlayers(["A", "B", "C"])).not.toBeNull();
    expect(validatePlayers(["A", "B", "C", "a"])).not.toBeNull();
    expect(validatePlayers(["A", "B", "C", "D", " "])).toBeNull();
    expect(validatePlayers(["A", "B", "C", "D", "E", "F"])).not.toBeNull();
  });

  it("med 5 spillere sidder én over på skift", () => {
    expect(defaultSittingOut(four, 3)).toBeNull();
    expect([0, 1, 5].map((i) => defaultSittingOut(five, i))).toEqual(["Anna", "Bo", "Anna"]);
  });
});

describe("udkast → runde", () => {
  it("fortæller hvad der mangler", () => {
    const d = emptyDraft(four, 0);
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
    const d = { ...emptyDraft(four, 0), bidder: "Anna", partner: "Bo" as const, level: 9, pahaeng: "halve" as const, vips: 3, trump: "klør" as const, tricks: 9 };
    const plain = roundFromDraft(four, WHIST_DK, d);
    const jeberg = roundFromDraft(four, JEBERG, d);
    expect(plain.ok && plain.round.type === "trump" && plain.round.bid).toEqual({ level: 9, pahaeng: "halve" });
    expect(jeberg.ok && jeberg.round.type === "trump" && jeberg.round.bid).toEqual({ level: 9, pahaeng: "halve", vips: 3, trump: "klør" });
  });

  it("sol: spillere der sidder over tæller ikke med", () => {
    const d = emptyDraft(five, 4); // Erik sidder over
    d.type = "sol";
    d.sols = { Erik: { kind: "sol", success: true } };
    expect(roundFromDraft(five, WHIST_DK, d)).toEqual({ ok: false, missing: "Vælg hvem der meldte sol" });
    d.sols = { Bo: { kind: "renBordlaegger", success: true } };
    expect(roundFromDraft(five, JEBERG, d).ok).toBe(false); // findes ikke i jeberg
    expect(roundFromDraft(five, WHIST_DK, d).ok).toBe(true);
  });

  it("runde → udkast → runde giver det samme", () => {
    const d = { ...emptyDraft(five, 1), bidder: "Carl", partner: "Erik" as const, level: 10, pahaeng: "sans" as const, tricks: 11 };
    const r = roundFromDraft(five, WHIST_DK, d);
    if (!r.ok) throw new Error(r.missing);
    expect(roundFromDraft(five, WHIST_DK, draftFromRound(five, r.round))).toEqual(r);
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
