import { StyleSheet, Switch, Text, View } from "react-native";
import { STAKE_OPTIONS, stakeLabel } from "@/game/model";
import { Chip, ChipRow } from "./components";
import { useTheme } from "./theme";

/** Slå kroner til/fra og vælg indsats pr. point. */
export function MoneyPicker({
  enabled,
  oerePerPoint,
  onChange,
}: {
  enabled: boolean;
  oerePerPoint: number;
  onChange: (next: { moneyEnabled: boolean; oerePerPoint: number }) => void;
}) {
  const t = useTheme();
  return (
    <View>
      <View style={styles.row}>
        <Text style={{ color: t.text, fontSize: 17, flex: 1 }}>Spil om kroner</Text>
        <Switch
          value={enabled}
          onValueChange={(on) => onChange({ moneyEnabled: on, oerePerPoint: oerePerPoint > 0 ? oerePerPoint : STAKE_OPTIONS[0] })}
          trackColor={{ true: t.accent }}
          accessibilityLabel="Spil om kroner"
        />
      </View>
      {enabled && (
        <>
          <Text style={[styles.help, { color: t.textMuted }]}>Indsats pr. point</Text>
          <ChipRow>
            {STAKE_OPTIONS.map((oere) => (
              <Chip key={oere} label={stakeLabel(oere)} selected={oerePerPoint === oere} onPress={() => onChange({ moneyEnabled: true, oerePerPoint: oere })} />
            ))}
          </ChipRow>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: 44 },
  help: { fontSize: 13, marginTop: 8, marginBottom: 8 },
});
