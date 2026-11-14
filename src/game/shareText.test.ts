import { describe, expect, it } from "vitest";
import { WHIST_DK } from "@/scoring";
import { createNewGame, type Game } from "./model";
import { resultText } from "./shareText";

const four = ["Anna", "Bo", "Carl", "Dorte"];
const seated = four as [string, string, string, string];

function game(money: { moneyEnabled: boolean; oerePerPoint: number }): Game {
  return {
    ...createNewGame(four, WHIST_DK, money),
    createdAt: new Date(2026, 10, 3, 20).getTime(),
    rounds: [
      // Carl 8 gode m. Anna, 12 stik: +200 til hver på melderens side
      { type: "trump", seated, bidder: "Carl", partner: "Anna", bid: { level: 8, pahaeng: "gode" }, tricks: 12 },
      { type: "pass", seated },
    ],
  };
}

describe("resultat som tekst", () => {
  it("viser stilling og afregning i kroner", () => {
    expect(resultText(game({ moneyEnabled: true, oerePerPoint: 10 }))).toBe(
      [
        "Whist 3. november 2026",
        "whist.dk · 2 runder",
        "",
        "1. Anna +200 (20,00 kr.)",
        "2. Carl +200 (20,00 kr.)",
        "3. Bo −200 (−20,00 kr.)",
        "4. Dorte −200 (−20,00 kr.)",
        "",
        "Hvem betaler hvem (10 øre pr. point):",
        "Bo → Anna: 20,00 kr.",
        "Dorte → Carl: 20,00 kr.",
      ].join("\n"),
    );
  });

  it("udelader kroner, når der ikke spilles om penge", () => {
    const text = resultText(game({ moneyEnabled: false, oerePerPoint: 10 }));
    expect(text).not.toMatch(/kr\.|betaler/);
    expect(text).toContain("1. Anna +200");
  });
});
