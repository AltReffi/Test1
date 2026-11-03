import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { computeStats } from "@/game/stats";
import { useGames } from "@/game/store";
import { StatsView } from "@/ui/StatsView";
import { useTheme } from "@/ui/theme";

export default function GameStatsScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGame } = useGames();
  const game = getGame(id);

  if (!game || game.rounds.length === 0) {
    return <Text style={[styles.empty, { color: t.textMuted }]}>Ingen runder endnu.</Text>;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <Text style={[styles.summary, { color: t.textMuted }]}>{game.rounds.length} runder i dette spil</Text>
      <StatsView stats={computeStats([game])} showStanding={false} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  empty: { textAlign: "center", marginTop: 32, fontSize: 16 },
  summary: { marginBottom: 16, textAlign: "center" },
});
