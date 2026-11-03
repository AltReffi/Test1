import { Stack, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { describeRound, firstDealerFor, gameSystem, nextDealer, roundsWithRunningTotals } from "@/game/model";
import { useGames } from "@/game/store";
import { Button, Points } from "@/ui/components";
import { useTheme } from "@/ui/theme";

export default function GameScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGame, updateGame } = useGames();
  const game = getGame(id);

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={{ color: t.textMuted }}>Spillet findes ikke.</Text>
      </View>
    );
  }

  const system = gameSystem(game);
  const rows = roundsWithRunningTotals(system, game);
  const current = rows.at(-1)?.running ?? Object.fromEntries(game.players.map((p) => [p, 0]));
  const dealer = nextDealer(game);
  // Tryk på "Skift" flytter giveren én plads videre, hvis appen og bordet er uenige.
  const shiftDealer = () => {
    const next = game.players[(game.players.indexOf(dealer) + 1) % game.players.length]!;
    updateGame(game.id, { firstDealer: firstDealerFor(game, next) });
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: system.name,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 18 }}>
              <Pressable
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => router.push({ pathname: "/game/[id]/stats", params: { id: game.id } })}
              >
                <Text style={{ color: t.accent, fontSize: 17, fontWeight: "600" }}>Statistik</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => router.push({ pathname: "/game/[id]/rules", params: { id: game.id } })}
              >
                <Text style={{ color: t.accent, fontSize: 17, fontWeight: "600" }}>Regler</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
        <View style={[styles.totals, { backgroundColor: t.surface, borderColor: t.border }]}>
          {game.players.map((p) => (
            <View key={p} style={styles.totalCell}>
              <Text numberOfLines={1} style={[styles.name, { color: t.text }]}>
                {p}
              </Text>
              <Points value={current[p] ?? 0} size={22} bold />
              <Text style={[styles.dealerMark, { color: t.accent }]}>{p === dealer ? "giver" : " "}</Text>
            </View>
          ))}
        </View>

        <View style={styles.dealerRow}>
          <Text style={[styles.dealerText, { color: t.text }]}>
            <Text style={{ fontWeight: "700" }}>{dealer}</Text> giver runde {game.rounds.length + 1}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Skift giver" hitSlop={10} onPress={shiftDealer}>
            <Text style={{ color: t.accent, fontSize: 15, fontWeight: "600" }}>Skift</Text>
          </Pressable>
        </View>

        {rows.length === 0 && (
          <Text style={[styles.empty, { color: t.textMuted }]}>Ingen runder endnu. Tryk “Ny runde” efter første spil.</Text>
        )}

        {rows
          .map((row, index) => ({ ...row, index }))
          .reverse()
          .map(({ round, deltas, index }) => (
            <Pressable
              key={index}
              onPress={() => router.push({ pathname: "/game/[id]/round", params: { id: game.id, index: String(index) } })}
              style={({ pressed }) => [styles.row, { borderColor: t.border, opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.rowTitle, { color: t.text }]}>
                <Text style={{ color: t.textMuted }}>#{index + 1} </Text>
                {describeRound(round)}
              </Text>
              <View style={styles.deltaRow}>
                {game.players.map((p) => (
                  <View key={p} style={styles.totalCell}>
                    {p in deltas ? <Points value={deltas[p] ?? 0} size={14} /> : <Text style={{ color: t.textMuted, fontSize: 14 }}>–</Text>}
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
      </ScrollView>

      <View style={[styles.footer, { borderColor: t.border, backgroundColor: t.bg }]}>
        <Button
          label="Afregning"
          variant="secondary"
          onPress={() => router.push({ pathname: "/game/[id]/settle", params: { id: game.id } })}
          style={{ flex: 1 }}
        />
        <Button
          label="Ny runde"
          onPress={() => router.push({ pathname: "/game/[id]/round", params: { id: game.id } })}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 24 },
  totals: { flexDirection: "row", borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  totalCell: { flex: 1, minWidth: 0, alignItems: "center" },
  name: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  dealerMark: { fontSize: 12, fontWeight: "700", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  dealerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  dealerText: { fontSize: 15 },
  empty: { textAlign: "center", marginTop: 24, fontSize: 16 },
  row: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10, gap: 6 },
  rowTitle: { fontSize: 15 },
  // Samme vandrette indryk som stillingskortet (kant 1 + padding 14), så kolonnerne flugter.
  deltaRow: { flexDirection: "row", gap: 6, paddingHorizontal: 15 },
  footer: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth },
});
