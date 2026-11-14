import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { knownPlayers, playersNamed, type KnownPlayer } from "@/game/players";
import { useGames } from "@/game/store";
import { Button } from "@/ui/components";
import { useTheme } from "@/ui/theme";

const shortDate = (ms: number) => new Date(ms).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

function PlayerRow({ p, duplicate }: { p: KnownPlayer; duplicate: boolean }) {
  const t = useTheme();
  const { renamePlayer } = useGames();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setDraft(null);
    setError(null);
  };
  const save = () => {
    if (draft === null) return;
    const result = renamePlayer(p.id, draft);
    if (result.ok) close();
    else setError(result.error);
  };

  return (
    <View style={[styles.row, { borderColor: t.border }]}>
      {draft === null ? (
        <View style={styles.line}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: t.text }]}>{p.name}</Text>
            <Text style={{ color: t.textMuted, fontSize: 13 }}>
              {p.games} spil · sidst {shortDate(p.lastPlayed)}
              {duplicate ? " · samme navn som en anden" : ""}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Omdøb ${p.name}`} hitSlop={10} onPress={() => setDraft(p.name)}>
            <Text style={{ color: t.accent, fontSize: 15, fontWeight: "600" }}>Omdøb</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={save}
            style={[styles.input, { color: t.text, backgroundColor: t.surface, borderColor: t.border }]}
          />
          {error && <Text style={{ color: t.negative, fontSize: 14 }}>{error}</Text>}
          <View style={styles.line}>
            <Button label="Annuller" variant="secondary" onPress={close} style={{ flex: 1 }} />
            <Button label="Gem" onPress={save} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function PlayersScreen() {
  const t = useTheme();
  const { games } = useGames();
  const known = knownPlayers(games);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
      <Text style={[styles.help, { color: t.textMuted }]}>Et nyt navn gælder i alle spil, også de gamle. Point og statistik følger med.</Text>
      {known.map((p) => (
        <PlayerRow key={p.id} p={p} duplicate={playersNamed(known, p.name).length > 1} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  help: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  row: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  line: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 17, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, minHeight: 48, fontSize: 17 },
});
