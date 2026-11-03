import { useColorScheme } from "react-native";

const light = {
  bg: "#F4F1EA",
  surface: "#FFFFFF",
  surfaceAlt: "#ECE7DC",
  text: "#1B1B18",
  textMuted: "#6B675E",
  border: "#D9D3C5",
  accent: "#1F5C3F",
  accentText: "#FFFFFF",
  positive: "#1E7A46",
  negative: "#B3261E",
};

const dark: typeof light = {
  bg: "#121412",
  surface: "#1C1F1C",
  surfaceAlt: "#262A26",
  text: "#EDEBE4",
  textMuted: "#A19D93",
  border: "#343833",
  accent: "#5DBB8A",
  accentText: "#0D1A12",
  positive: "#6FD39A",
  negative: "#FF8A80",
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export function formatPoints(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  const s = rounded.toLocaleString("da-DK");
  // Rigtigt minustegn (U+2212) er lige så bredt som plus og står tættere på tallet.
  return rounded > 0 ? `+${s}` : s.replace(/^-/, "\u2212");
}
