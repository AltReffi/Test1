import type { ReactNode } from "react";
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

export function Chip({
  label,
  selected,
  onPress,
  disabled,
  wide,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  wide?: boolean;
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
  chipText: { fontSize: 16, fontWeight: "600" },
  button: { minHeight: 52, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  buttonText: { fontSize: 17, fontWeight: "700" },
});
