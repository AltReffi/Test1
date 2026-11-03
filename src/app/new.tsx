import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DEFAULT_SYSTEM, PRESET_SYSTEMS } from "@/scoring";
import { PLAYER_COUNT, newGameId, validatePlayers } from "@/game/model";
import { useGames } from "@/game/store";
import { Button, Chip, ChipRow, Section } from "@/ui/components";
import { useTheme } from "@/ui/theme";

const STAKES = [
  { oere: 0, label: "Ingen" },
  { oere: 1, label: "1 øre" },
  { oere: 5, label: "5 øre" },
  { oere: 10, label: "10 øre" },
  { oere: 25, label: "25 øre" },
];

export default function NewGameScreen() {
  const t = useTheme();
  const { createGame } = useGames();
  const [names, setNames] = useState<string[]>(Array(PLAYER_COUNT).fill(""));
  const [systemId, setSystemId] = useState(DEFAULT_SYSTEM.id);
  const [oerePerPoint, setOerePerPoint] = useState(0);

  const error = validatePlayers(names);
  const system = PRESET_SYSTEMS.find((s) => s.id === systemId) ?? DEFAULT_SYSTEM;

  const start = () => {
    if (error) return;
    const id = newGameId();
    const now = Date.now();
    createGame({
      id,
      createdAt: now,
      updatedAt: now,
      players: names.map((n) => n.trim()).filter(Boolean),
      systemId,
      oerePerPoint,
      rounds: [],
    });
    router.replace({ pathname: "/game/[id]", params: { id } });
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
      <Section title="Spillere">
        <View style={{ gap: 8 }}>
          {names.map((name, i) => (
            <TextInput
              key={i}
              value={name}
              onChangeText={(v) => setNames((prev) => prev.map((n, j) => (j === i ? v : n)))}
              placeholder={`Spiller ${i + 1}`}
              placeholderTextColor={t.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              style={[styles.input, { color: t.text, backgroundColor: t.surface, borderColor: t.border }]}
            />
          ))}
        </View>
        <Text style={[styles.help, { color: t.textMuted }]}>Skriv dem i den rækkefølge, I sidder.</Text>
      </Section>

      <Section title="Regelsæt">
        <View style={{ gap: 8 }}>
          {PRESET_SYSTEMS.map((s) => (
            <Chip key={s.id} label={s.name} selected={s.id === systemId} onPress={() => setSystemId(s.id)} wide />
          ))}
        </View>
        <Text style={[styles.help, { color: t.textMuted }]}>{system.description}</Text>
      </Section>

      <Section title="Indsats pr. point">
        <ChipRow>
          {STAKES.map((s) => (
            <Chip key={s.oere} label={s.label} selected={s.oere === oerePerPoint} onPress={() => setOerePerPoint(s.oere)} />
          ))}
        </ChipRow>
      </Section>

      {error && names.some((n) => n.trim()) && <Text style={[styles.error, { color: t.negative }]}>{error}</Text>}
      <Button label="Start spil" onPress={start} disabled={!!error} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, minHeight: 48, fontSize: 17 },
  help: { marginTop: 8, fontSize: 14, lineHeight: 20 },
  error: { marginBottom: 12, fontSize: 15 },
});
