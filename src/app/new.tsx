import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DEFAULT_SYSTEM, PRESET_SYSTEMS } from "@/scoring";
import { PLAYER_COUNT, createNewGame, summarizeSystem, validatePlayers } from "@/game/model";
import { useGames } from "@/game/store";
import { Button, Chip, Section } from "@/ui/components";
import { MoneyPicker } from "@/ui/MoneyPicker";
import { useTheme } from "@/ui/theme";

export default function NewGameScreen() {
  const t = useTheme();
  const { createGame, customSystems } = useGames();
  const [names, setNames] = useState<string[]>(Array(PLAYER_COUNT).fill(""));
  const [systemId, setSystemId] = useState(DEFAULT_SYSTEM.id);
  const [money, setMoney] = useState({ moneyEnabled: false, oerePerPoint: 1 });

  // Når et nyt eget regelsæt er oprettet, vælges det automatisk.
  const knownCustomIds = useRef(new Set(customSystems.map((s) => s.id)));
  useEffect(() => {
    const added = customSystems.find((s) => !knownCustomIds.current.has(s.id));
    knownCustomIds.current = new Set(customSystems.map((s) => s.id));
    if (added) setSystemId(added.id);
  }, [customSystems]);

  const allSystems = [...PRESET_SYSTEMS, ...customSystems];
  const system = allSystems.find((s) => s.id === systemId) ?? DEFAULT_SYSTEM;
  const isCustom = customSystems.some((s) => s.id === system.id);
  const error = validatePlayers(names);

  const start = () => {
    if (error) return;
    const game = createNewGame(names, system, money);
    createGame(game);
    router.replace({ pathname: "/game/[id]", params: { id: game.id } });
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
          {allSystems.map((s) => (
            <Chip key={s.id} label={s.name} selected={s.id === systemId} onPress={() => setSystemId(s.id)} wide />
          ))}
        </View>
        <Text style={[styles.help, { color: t.textMuted }]}>{summarizeSystem(system)}</Text>
        <View style={styles.ruleActions}>
          {isCustom && (
            <Button
              label="Ret"
              variant="secondary"
              onPress={() => router.push({ pathname: "/rules/[id]", params: { id: system.id } })}
              style={{ flex: 1 }}
            />
          )}
          <Button
            label={isCustom ? "Kopiér og tilpas" : "Tilpas regler"}
            variant="secondary"
            onPress={() => router.push({ pathname: "/rules/[id]", params: { id: "new", base: system.id } })}
            style={{ flex: 2 }}
          />
        </View>
      </Section>

      <Section title="Kroner">
        <MoneyPicker enabled={money.moneyEnabled} oerePerPoint={money.oerePerPoint} onChange={setMoney} />
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
  ruleActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  error: { marginBottom: 12, fontSize: 15 },
});
