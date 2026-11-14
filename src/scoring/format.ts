/** Point med fortegn og dansk tusindtalsseparator, fx "+1.340" og "−380" (rigtigt minustegn). */
export function formatPoints(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  const s = rounded.toLocaleString("da-DK");
  // Rigtigt minustegn (U+2212) er lige så bredt som plus og står tættere på tallet.
  return rounded > 0 ? `+${s}` : s.replace(/^-/, "−");
}
