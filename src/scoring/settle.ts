import type { Deltas, PlayerId } from "./types";

export interface Transfer {
  from: PlayerId;
  to: PlayerId;
  /** Beløb i øre. */
  oere: number;
}

/**
 * Afregning: hvem skylder hvem, med højst (antal spillere − 1) overførsler.
 * @param oerePerPoint fx 1 = 1 øre pr. point, 100 = 1 kr. pr. point.
 */
export function settle(totals: Deltas, oerePerPoint: number): Transfer[] {
  const balances = Object.entries(totals).map(([player, points]) => ({
    player,
    oere: Math.round(points * oerePerPoint),
  }));
  const debtors = balances.filter((b) => b.oere < 0).sort((a, b) => a.oere - b.oere);
  const creditors = balances.filter((b) => b.oere > 0).sort((a, b) => b.oere - a.oere);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]!;
    const creditor = creditors[j]!;
    const amount = Math.min(-debtor.oere, creditor.oere);
    if (amount > 0) transfers.push({ from: debtor.player, to: creditor.player, oere: amount });
    debtor.oere += amount;
    creditor.oere -= amount;
    if (debtor.oere === 0) i++;
    if (creditor.oere === 0) j++;
  }
  return transfers;
}

export function formatKroner(oere: number): string {
  return `${(oere / 100).toFixed(2).replace(".", ",")} kr.`;
}
