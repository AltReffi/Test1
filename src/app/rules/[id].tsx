import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { PRESET_SYSTEMS, validateSystem, type ScoringSystem } from "@/scoring";
import { newCustomSystemId, systemById } from "@/game/model";
import { useGames } from "@/game/store";
import { Button } from "@/ui/components";
import { RuleEditor } from "@/ui/RuleEditor";
import { useTheme } from "@/ui/theme";

/**
 * Opret eller ret et eget regelsæt.
 * /rules/new?base=<id> opretter et nyt ud fra et eksisterende. /rules/<id> retter et eget.
 */
export default function EditRulesScreen() {
  const t = useTheme();
  const { id, base } = useLocalSearchParams<{ id: string; base?: string }>();
  const { customSystems, saveCustomSystem, deleteCustomSystem } = useGames();
  const isNew = id === "new";

  const [draft, setDraft] = useState<ScoringSystem>(() => {
    if (!isNew) return customSystems.find((s) => s.id === id) ?? systemById(id);
    const from = customSystems.find((s) => s.id === base) ?? PRESET_SYSTEMS.find((s) => s.id === base) ?? systemById("");
    return { ...from, id: newCustomSystemId(), name: `${from.name} (egne)`, description: `Tilpasset ud fra ${from.name}.`, source: undefined };
  });

  const error = validateSystem(draft);

  const save = () => {
    if (error) return;
    saveCustomSystem({ ...draft, name: draft.name.trim() });
    router.back();
  };

  const remove = () =>
    Alert.alert("Slet regelsæt?", "Spil, der allerede bruger det, beholder deres egen kopi.", [
      { text: "Annuller", style: "cancel" },
      {
        text: "Slet",
        style: "destructive",
        onPress: () => {
          deleteCustomSystem(draft.id);
          router.back();
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: isNew ? "Nyt regelsæt" : "Ret regelsæt" }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <RuleEditor value={draft} onChange={setDraft} />
      </ScrollView>
      <View style={[styles.footer, { borderColor: t.border, backgroundColor: t.bg }]}>
        {error && <Text style={{ color: t.negative, textAlign: "center" }}>{error}</Text>}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {!isNew && <Button label="Slet" variant="danger" onPress={remove} />}
          <Button label="Gem regelsæt" onPress={save} disabled={!!error} style={{ flex: 1 }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16, paddingBottom: 32, gap: 8 },
});
