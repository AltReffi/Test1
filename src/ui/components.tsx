import { Children, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { formatPoints, useTheme } from "./theme";

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: t.textMuted }]}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

/**
 * Chips i et fast antal kolonner med lige brede felter, fx meldinger 7–13 på én linje.
 * Fylder mindre i højden end ChipRow, så rundeskærmen kan ses uden at rulle.
 */
export function ChipGrid({ columns, children }: { columns: number; children: ReactNode }) {
  const items = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += columns) rows.push(items.slice(i, i + columns));
  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map((item, c) => (
            <View key={c} style={styles.gridCell}>
              {item}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, c) => (
            <View key={`tom-${c}`} style={styles.gridCell} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  disabled,
  wide,
  compact,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  wide?: boolean;
  /** Til ChipGrid: ingen minimumsbredde og lille indre margen. */
  compact?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        wide && styles.chipWide,
        compact && styles.chipCompact,
        {
          backgroundColor: selected ? t.accent : t.surface,
          borderColor: selected ? t.accent : t.border,
          opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? t.accentText : t.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  style?: ViewStyle;
}) {
  const t = useTheme();
  const bg = variant === "primary" ? t.accent : variant === "danger" ? "transparent" : t.surface;
  const fg = variant === "primary" ? t.accentText : variant === "danger" ? t.negative : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === "secondary" ? t.border : "transparent", opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Points({ value, size = 15, bold }: { value: number; size?: number; bold?: boolean }) {
  const t = useTheme();
  const color = value > 0 ? t.positive : value < 0 ? t.negative : t.textMuted;
  return (
    <Text style={{ color, fontSize: size, fontWeight: bold ? "700" : "500", fontVariant: ["tabular-nums"] }}>
      {formatPoints(value)}
    </Text>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minWidth: 48, minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chipWide: { flexGrow: 1 },
  chipCompact: { minWidth: 0, paddingHorizontal: 2 },
  grid: { gap: 6 },
  gridRow: { flexDirection: "row", gap: 6 },
  gridCell: { flex: 1, minWidth: 0 },
  chipText: { fontSize: 16, fontWeight: "600" },
  button: { minHeight: 52, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  buttonText: { fontSize: 17, fontWeight: "700" },
});
