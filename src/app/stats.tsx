import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { computeStats, periodStart, type Period } from "@/game/stats";
import { useGames } from "@/game/store";
import { Chip, ChipRow } from "@/ui/components";
import { StatsView } from "@/ui/StatsView";
import { useTheme } from "@/ui/theme";

const PERIODS: { id: Period; label: string }[] = [
  { id: "all", label: "Altid" },
  { id: "year", label: "I år" },
  { id: "30d", label: "30 dage" },
];

export default function StatsScreen() {
  const t = useTheme();
  const { games } = useGames();
  const [period, setPeriod] = useState<Period>("all");
  const stats = computeStats(games, periodStart(period));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <ChipRow>
        {PERIODS.map((p) => (
          <Chip key={p.id} label={p.label} selected={period === p.id} onPress={() => setPeriod(p.id)} wide />
        ))}
      </ChipRow>

      {stats.games === 0 ? (
        <Text style={[styles.empty, { color: t.textMuted }]}>Ingen spil med runder i perioden.</Text>
      ) : (
        <>
          <Text style={[styles.summary, { color: t.textMuted }]}>
            {stats.games} spil · {stats.rounds} runder
          </Text>
          <StatsView stats={stats} showStanding />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  empty: { textAlign: "center", marginTop: 32, fontSize: 16 },
  summary: { marginTop: 12, marginBottom: 16, textAlign: "center" },
});
