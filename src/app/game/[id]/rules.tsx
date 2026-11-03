import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { validateSystem, type ScoringSystem } from "@/scoring";
import { checkRoundsAgainstSystem, gameSystem, newCustomSystemId } from "@/game/model";
import { useGames } from "@/game/store";
import { Button } from "@/ui/components";
import { RuleEditor } from "@/ui/RuleEditor";
import { useTheme } from "@/ui/theme";

/** Ret regelsættet for ét spil. Alle runder regnes om. */
export default function GameRulesScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGame, updateGame, saveCustomSystem } = useGames();
  const game = getGame(id);
  const [draft, setDraft] = useState<ScoringSystem | null>(() => (game ? gameSystem(game) : null));
  const [alsoSave, setAlsoSave] = useState(false);

  if (!game || !draft) return null;

  const error = validateSystem(draft) ?? checkRoundsAgainstSystem(draft, game.rounds);

  const save = () => {
    if (error) return;
    const system = { ...draft, name: draft.name.trim() };
    updateGame(game.id, { system });
    if (alsoSave) {
      saveCustomSystem({ ...system, id: system.id.startsWith("custom-") ? system.id : newCustomSystemId() });
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {game.rounds.length > 0 && (
          <Text style={[styles.note, { color: t.textMuted }]}>
            Ændringer gælder hele spillet. Alle {game.rounds.length} runder regnes om.
          </Text>
        )}
        <RuleEditor value={draft} onChange={setDraft} />
        <View style={styles.saveRow}>
          <Text style={{ color: t.text, fontSize: 16, flex: 1 }}>Gem også som eget regelsæt til nye spil</Text>
          <Switch value={alsoSave} onValueChange={setAlsoSave} trackColor={{ true: t.accent }} />
        </View>
      </ScrollView>
      <View style={[styles.footer, { borderColor: t.border, backgroundColor: t.bg }]}>
        {error && <Text style={{ color: t.negative, textAlign: "center" }}>{error}</Text>}
        <Button label="Gem regler for spillet" onPress={save} disabled={!!error} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  note: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  saveRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16, paddingBottom: 32, gap: 8 },
});
