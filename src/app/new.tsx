import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DEFAULT_SYSTEM, PRESET_SYSTEMS } from "@/scoring";
import { PLAYER_COUNT, createNewGame, summarizeSystem, validatePlayers } from "@/game/model";
import { knownPlayers, playersNamed, type KnownPlayer } from "@/game/players";
import { useGames } from "@/game/store";
import { Button, Chip, ChipRow, Section } from "@/ui/components";
import { MoneyPicker } from "@/ui/MoneyPicker";
import { useTheme } from "@/ui/theme";

export default function NewGameScreen() {
  const t = useTheme();
  const { createGame, customSystems, games } = useGames();
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

  // Pladsens valg: undefined = den senest brugte gemte spiller med samme navn, "new" = ny spiller, ellers et bestemt ID.
  const known = useMemo(() => knownPlayers(games), [games]);
  const [choices, setChoices] = useState<(string | undefined)[]>(Array(PLAYER_COUNT).fill(undefined));
  const matches = names.map((n) => playersNamed(known, n));
  const ids = choices.map((c, i) => (c === "new" ? null : (c ?? matches[i]![0]?.id ?? null)));
  const chosenIds = ids.filter((id): id is string => id !== null);
  const error = validatePlayers(names) ?? (new Set(chosenIds).size !== chosenIds.length ? "Samme spiller er valgt to gange." : null);

  const setSlot = (i: number, name: string, choice?: string) => {
    setNames((prev) => prev.map((n, j) => (j === i ? name : n)));
    setChoices((prev) => prev.map((c, j) => (j === i ? choice : c)));
  };
  const pickKnown = (p: KnownPlayer) => {
    const i = names.findIndex((n) => !n.trim());
    if (i >= 0) setSlot(i, p.name, p.id);
  };
  const shortDate = (ms: number) => new Date(ms).toLocaleDateString("da-DK", { day: "numeric", month: "short" });

  const start = () => {
    if (error) return;
    const game = createNewGame(names, system, money, ids);
    createGame(game);
    router.replace({ pathname: "/game/[id]", params: { id: game.id } });
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
      <Section title="Spillere">
        <View style={{ gap: 8 }}>
          {names.map((name, i) => (
            <View key={i} style={{ gap: 6 }}>
              <TextInput
                value={name}
                onChangeText={(v) => setSlot(i, v)}
                placeholder={`Spiller ${i + 1}`}
                placeholderTextColor={t.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                style={[styles.input, { color: t.text, backgroundColor: t.surface, borderColor: t.border }]}
              />
              {matches[i]!.length === 1 && (
                <View style={styles.matchRow}>
                  <Text style={{ color: t.textMuted, fontSize: 14 }}>
                    {ids[i] ? `Gemt spiller · ${matches[i]![0]!.games} spil` : "Ny spiller med samme navn"}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => setChoices((prev) => prev.map((c, j) => (j === i ? (ids[i] ? "new" : undefined) : c)))}
                  >
                    <Text style={{ color: t.accent, fontSize: 14, fontWeight: "600" }}>{ids[i] ? "Det er en anden" : "Brug gemt"}</Text>
                  </Pressable>
                </View>
              )}
              {matches[i]!.length > 1 && (
                <ChipRow>
                  {matches[i]!.map((p) => (
                    <Chip
                      key={p.id}
                      label={`${p.name} · ${p.games} spil, sidst ${shortDate(p.lastPlayed)}`}
                      selected={ids[i] === p.id}
                      onPress={() => setChoices((prev) => prev.map((c, j) => (j === i ? p.id : c)))}
                    />
                  ))}
                  <Chip label="Ny spiller" selected={ids[i] === null} onPress={() => setChoices((prev) => prev.map((c, j) => (j === i ? "new" : c)))} />
                </ChipRow>
              )}
            </View>
          ))}
        </View>
        <Text style={[styles.help, { color: t.textMuted }]}>Skriv dem i den rækkefølge, I sidder.</Text>
      </Section>

      {known.some((p) => !ids.includes(p.id)) && names.some((n) => !n.trim()) && (
        <Section title="Gemte spillere">
          <ChipRow>
            {known
              .filter((p) => !ids.includes(p.id))
              .slice(0, 16)
              .map((p) => (
                <Chip
                  key={p.id}
                  label={playersNamed(known, p.name).length > 1 ? `${p.name} (${shortDate(p.lastPlayed)})` : p.name}
                  onPress={() => pickKnown(p)}
                />
              ))}
          </ChipRow>
          <Text style={[styles.help, { color: t.textMuted }]}>Tryk for at sætte spilleren på næste ledige plads.</Text>
        </Section>
      )}

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
  matchRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  ruleActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  error: { marginBottom: 12, fontSize: 15 },
});
