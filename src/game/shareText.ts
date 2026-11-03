import { formatKroner, formatPoints, settle, totals } from "@/scoring";
import { gameSystem, stakeLabel, stakeOere, type Game } from "./model";

/**
 * Resultatet som almindelig tekst til Beskeder, Messenger osv.:
 * stilling, og hvis der spilles om kroner, hvem der betaler hvem.
 */
export function resultText(game: Game): string {
  const system = gameSystem(game);
  const score = totals(system, game.players, game.rounds);
  const ranked = [...game.players].sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0));
  const stake = stakeOere(game);
  const date = new Date(game.createdAt).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
  const rounds = game.rounds.length === 1 ? "1 runde" : `${game.rounds.length} runder`;

  const lines = [`Whist ${date}`, `${system.name} · ${rounds}`, ""];
  ranked.forEach((p, i) => {
    const points = score[p] ?? 0;
    const money = stake > 0 ? ` (${formatKroner(Math.round(points * stake))})` : "";
    lines.push(`${i + 1}. ${p} ${formatPoints(points)}${money}`);
  });

  if (stake > 0) {
    const transfers = settle(score, stake);
    lines.push("", `Hvem betaler hvem (${stakeLabel(stake)} pr. point):`);
    if (transfers.length === 0) lines.push("Ingen skylder noget.");
    for (const t of transfers) lines.push(`${t.from} → ${t.to}: ${formatKroner(t.oere)}`);
  }
  return lines.join("\n");
}
