import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { formatKroner, settle, totals } from "@/scoring";
import { systemById } from "@/game/model";
import { useGames } from "@/game/store";
import { Points, Section } from "@/ui/components";
import { useTheme } from "@/ui/theme";

export default function SettleScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useGames().getGame(id);
  if (!game) return null;

  const system = systemById(game.systemId);
  const score = totals(system, game.players, game.rounds);
  const ranked = [...game.players].sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0));
  const transfers = game.oerePerPoint > 0 ? settle(score, game.oerePerPoint) : [];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <Section title="Stilling">
        {ranked.map((p, i) => (
          <View key={p} style={[styles.row, { borderColor: t.border }]}>
            <Text style={[styles.name, { color: t.text }]}>
              {i + 1}. {p}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Points value={score[p] ?? 0} size={17} bold />
              {game.oerePerPoint > 0 && (
                <Text style={{ color: t.textMuted, fontSize: 13 }}>{formatKroner(Math.round((score[p] ?? 0) * game.oerePerPoint))}</Text>
              )}
            </View>
          </View>
        ))}
      </Section>

      <Section title="Hvem betaler hvem">
        {game.oerePerPoint === 0 ? (
          <Text style={{ color: t.textMuted }}>Spillet er uden indsats.</Text>
        ) : transfers.length === 0 ? (
          <Text style={{ color: t.textMuted }}>Ingen skylder noget.</Text>
        ) : (
          transfers.map((tr, i) => (
            <View key={i} style={[styles.row, { borderColor: t.border }]}>
              <Text style={[styles.name, { color: t.text }]}>
                {tr.from} → {tr.to}
              </Text>
              <Text style={[styles.amount, { color: t.text }]}>{formatKroner(tr.oere)}</Text>
            </View>
          ))
        )}
        {game.oerePerPoint > 0 && (
          <Text style={[styles.help, { color: t.textMuted }]}>
            {formatKroner(game.oerePerPoint)} pr. point. Færrest mulige overførsler.
          </Text>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { fontSize: 17, fontWeight: "600" },
  amount: { fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"] },
  help: { marginTop: 10, fontSize: 13 },
});
