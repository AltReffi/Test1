import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { formatKroner, settle, totals } from "@/scoring";
import { gameSystem, stakeLabel, stakeOere } from "@/game/model";
import { resultText } from "@/game/shareText";
import { useGames } from "@/game/store";
import { Button, Points, Section } from "@/ui/components";
import { MoneyPicker } from "@/ui/MoneyPicker";
import { useTheme } from "@/ui/theme";

export default function SettleScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGame, updateGame } = useGames();
  const game = getGame(id);
  const [shareError, setShareError] = useState<string | null>(null);
  if (!game) return null;

  const share = async () => {
    setShareError(null);
    try {
      await Share.share({ message: resultText(game) });
    } catch {
      setShareError("Deling er ikke tilgængelig her.");
    }
  };

  const score = totals(gameSystem(game), game.players, game.rounds);
  const ranked = [...game.players].sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0));
  const stake = stakeOere(game);
  const transfers = stake > 0 ? settle(score, stake) : [];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <Section title="Kroner">
        <MoneyPicker enabled={stake > 0} oerePerPoint={game.oerePerPoint} onChange={(next) => updateGame(game.id, next)} />
      </Section>

      <Section title="Stilling">
        {ranked.map((p, i) => (
          <View key={p} style={[styles.row, { borderColor: t.border }]}>
            <Text style={[styles.name, { color: t.text }]}>
              {i + 1}. {p}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Points value={score[p] ?? 0} size={17} bold />
              {stake > 0 && <Text style={{ color: t.textMuted, fontSize: 13 }}>{formatKroner(Math.round((score[p] ?? 0) * stake))}</Text>}
            </View>
          </View>
        ))}
      </Section>

      {stake > 0 && (
        <Section title="Hvem betaler hvem">
          {transfers.length === 0 ? (
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
          <Text style={[styles.help, { color: t.textMuted }]}>{stakeLabel(stake)} pr. point. Færrest mulige overførsler.</Text>
        </Section>
      )}

      <Button label="Del resultat" variant="secondary" onPress={share} />
      {shareError && <Text style={[styles.help, { color: t.negative, textAlign: "center" }]}>{shareError}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { fontSize: 17, fontWeight: "600" },
  amount: { fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"] },
  help: { marginTop: 10, fontSize: 13 },
});
