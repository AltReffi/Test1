import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { totals } from "@/scoring";
import { systemById } from "@/game/model";
import { useGames } from "@/game/store";
import { Button, Points } from "@/ui/components";
import { useTheme } from "@/ui/theme";

export default function HomeScreen() {
  const t = useTheme();
  const { games, loaded, deleteGame } = useGames();

  const confirmDelete = (id: string) =>
    Alert.alert("Slet spil?", "Spillet og alle runder slettes.", [
      { text: "Annuller", style: "cancel" },
      { text: "Slet", style: "destructive", onPress: () => deleteGame(id) },
    ]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <View style={styles.actions}>
        {games.some((g) => g.rounds.length > 0) && (
          <Button label="Statistik" variant="secondary" onPress={() => router.push("/stats")} style={{ flex: 1 }} />
        )}
        <Button label="Nyt spil" onPress={() => router.push("/new")} style={{ flex: 2 }} />
      </View>

      {loaded && games.length === 0 && (
        <Text style={[styles.empty, { color: t.textMuted }]}>
          Ingen spil endnu. Tryk “Nyt spil” for at skrive spillere ind og vælge regelsæt.
        </Text>
      )}

      {games.map((game) => {
        const system = systemById(game.systemId);
        const score = totals(system, game.players, game.rounds);
        const date = new Date(game.createdAt).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });
        return (
          <Pressable
            key={game.id}
            onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
            onLongPress={() => confirmDelete(game.id)}
            style={({ pressed }) => [styles.card, { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: t.text }]}>{date}</Text>
              <Text style={{ color: t.textMuted }}>
                {game.rounds.length} runder · {system.name}
              </Text>
            </View>
            <View style={styles.scoreRow}>
              {game.players.map((p) => (
                <View key={p} style={styles.scoreCell}>
                  <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: 13 }}>
                    {p}
                  </Text>
                  <Points value={score[p] ?? 0} bold />
                </View>
              ))}
            </View>
          </Pressable>
        );
      })}
      {games.length > 0 && (
        <Text style={[styles.hint, { color: t.textMuted }]}>Hold fingeren på et spil for at slette det.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  actions: { flexDirection: "row", gap: 10 },
  empty: { textAlign: "center", marginTop: 32, fontSize: 16, lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  cardHeader: { gap: 2 },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  scoreRow: { flexDirection: "row", gap: 6 },
  scoreCell: { flex: 1, minWidth: 0 },
  hint: { textAlign: "center", fontSize: 13, marginTop: 4 },
});
