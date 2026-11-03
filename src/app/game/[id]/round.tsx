import * as Haptics from "expo-haptics";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scoreRound, trumpBidValue, trumpOutcome, type SolKind } from "@/scoring";
import {
  PAHAENG_OPTIONS,
  SOL_LABELS,
  TRUMP_OPTIONS,
  draftFromRound,
  emptyDraft,
  roundFromDraft,
  systemById,
  type RoundDraft,
} from "@/game/model";
import { useGames } from "@/game/store";
import { Button, Chip, ChipRow, Points, Section } from "@/ui/components";
import { formatPoints, useTheme } from "@/ui/theme";

const LEVELS = [7, 8, 9, 10, 11, 12, 13];
const TRICKS = Array.from({ length: 14 }, (_, i) => i);
const SOL_KINDS: SolKind[] = ["sol", "renSol", "bordlaegger", "renBordlaegger"];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function RoundScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; index?: string }>();
  const { getGame, addRound, updateRound, deleteRound } = useGames();
  const game = getGame(params.id);
  const editIndex = params.index !== undefined ? Number(params.index) : null;
  const existing = editIndex !== null ? game?.rounds[editIndex] : undefined;

  const [draft, setDraft] = useState<RoundDraft>(() => (existing ? draftFromRound(existing) : emptyDraft()));

  if (!game) return null;
  const system = systemById(game.systemId);
  const perDoubling = system.pahaengMode === "perDoubling";
  const seated = game.players;
  const update = (patch: Partial<RoundDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const result = roundFromDraft(game.players, system, draft);
  const preview = result.ok ? scoreRound(system, result.round) : null;

  // Meldestige: hvad giver meldingen hjemme / ved bet (pr. spiller på melderens side, 2 mod 2)
  let ladder: string | null = null;
  if (draft.type === "trump" && draft.level !== null) {
    const bid = { level: draft.level, pahaeng: draft.pahaeng, vips: draft.vips, trump: draft.trump ?? undefined };
    const value = trumpBidValue(system, bid);
    const bet = trumpOutcome(system, bid, draft.level - 1);
    ladder = `Hjemme ${formatPoints(value)} · pr. overstik +${value} · ét bet ${formatPoints(bet)}`;
  }

  const save = () => {
    if (!result.ok) return;
    if (editIndex !== null) updateRound(game.id, editIndex, result.round);
    else addRound(game.id, result.round);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  const remove = () => {
    if (editIndex === null) return;
    Alert.alert("Slet runde?", undefined, [
      { text: "Annuller", style: "cancel" },
      {
        text: "Slet",
        style: "destructive",
        onPress: () => {
          deleteRound(game.id, editIndex);
          router.back();
        },
      },
    ]);
  };

  const setSol = (player: string, kind: SolKind | null) =>
    setDraft((d) => {
      const sols = { ...d.sols };
      if (kind === null) delete sols[player];
      else sols[player] = { kind, success: sols[player]?.success ?? true };
      return { ...d, sols };
    });

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: editIndex !== null ? `Ret runde ${editIndex + 1}` : `Runde ${game.rounds.length + 1}` }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Section title="Spil">
          <ChipRow>
            <Chip label="Melding" selected={draft.type === "trump"} onPress={() => update({ type: "trump" })} wide />
            <Chip label="Sol" selected={draft.type === "sol"} onPress={() => update({ type: "sol" })} wide />
            <Chip label="Alle pas" selected={draft.type === "pass"} onPress={() => update({ type: "pass" })} wide />
          </ChipRow>
        </Section>

        {draft.type === "trump" && (
          <>
            <Section title="Melder">
              <ChipRow>
                {seated.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={draft.bidder === p}
                    onPress={() => update({ bidder: p, partner: draft.partner === p ? null : draft.partner })}
                  />
                ))}
              </ChipRow>
            </Section>

            <Section title="Melding">
              <ChipRow>
                {LEVELS.map((l) => (
                  <Chip key={l} label={String(l)} selected={draft.level === l} onPress={() => update({ level: l })} />
                ))}
              </ChipRow>
              <View style={{ height: 8 }} />
              <ChipRow>
                {PAHAENG_OPTIONS.map((p) => (
                  <Chip
                    key={p}
                    label={p === "ingen" ? "Alm." : capitalize(p)}
                    selected={draft.pahaeng === p}
                    onPress={() =>
                      update({
                        pahaeng: p,
                        vips: p === "vip" ? Math.max(1, draft.vips) : draft.vips,
                        trump: p === "gode" ? "klør" : p === "sans" ? "sans" : draft.trump,
                      })
                    }
                  />
                ))}
              </ChipRow>
              {ladder && <Text style={[styles.ladder, { color: t.textMuted }]}>{ladder}</Text>}
            </Section>

            {perDoubling && (
              <>
                <Section title="Antal vip">
                  <ChipRow>
                    {[0, 1, 2, 3].map((v) => (
                      <Chip key={v} label={String(v)} selected={draft.vips === v} onPress={() => update({ vips: v })} />
                    ))}
                  </ChipRow>
                </Section>
                <Section title="Trumf (klør og sans fordobler)">
                  <ChipRow>
                    {TRUMP_OPTIONS.map((tr) => (
                      <Chip key={tr} label={capitalize(tr)} selected={draft.trump === tr} onPress={() => update({ trump: tr })} />
                    ))}
                  </ChipRow>
                </Section>
              </>
            )}

            <Section title="Makker">
              <ChipRow>
                {seated
                  .filter((p) => p !== draft.bidder)
                  .map((p) => (
                    <Chip key={p} label={p} selected={draft.partner === p} onPress={() => update({ partner: p })} />
                  ))}
                <Chip label="Selvmakker" selected={draft.partner === "self"} onPress={() => update({ partner: "self" })} />
              </ChipRow>
            </Section>

            <Section title="Stik taget af melderens side">
              <ChipRow>
                {TRICKS.map((n) => (
                  <Chip key={n} label={String(n)} selected={draft.tricks === n} onPress={() => update({ tricks: n })} />
                ))}
              </ChipRow>
            </Section>
          </>
        )}

        {draft.type === "sol" &&
          seated.map((p) => {
            const sol = draft.sols[p];
            return (
              <Section key={p} title={p}>
                <ChipRow>
                  {SOL_KINDS.filter((k) => system.sol[k] !== null).map((k) => (
                    <Chip key={k} label={SOL_LABELS[k]} selected={sol?.kind === k} onPress={() => setSol(p, sol?.kind === k ? null : k)} />
                  ))}
                </ChipRow>
                {sol && (
                  <>
                    <View style={{ height: 8 }} />
                    <ChipRow>
                      <Chip label="Gik hjem" selected={sol.success} onPress={() => update({ sols: { ...draft.sols, [p]: { ...sol, success: true } } })} wide />
                      <Chip label="Væltet" selected={!sol.success} onPress={() => update({ sols: { ...draft.sols, [p]: { ...sol, success: false } } })} wide />
                    </ChipRow>
                  </>
                )}
              </Section>
            );
          })}
      </ScrollView>

      <View style={[styles.footer, { borderColor: t.border, backgroundColor: t.bg, paddingBottom: Math.max(16, insets.bottom) }]}>
        {preview ? (
          <View style={styles.preview}>
            {game.players.map((p) => (
              <View key={p} style={styles.previewCell}>
                <Text numberOfLines={1} style={{ color: t.textMuted, fontSize: 12 }}>
                  {p}
                </Text>
                {p in preview ? <Points value={preview[p] ?? 0} bold /> : <Text style={{ color: t.textMuted }}>–</Text>}
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.missing, { color: t.textMuted }]}>{result.ok ? "" : result.missing}</Text>
        )}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {editIndex !== null && <Button label="Slet" variant="danger" onPress={remove} />}
          <Button label={editIndex !== null ? "Gem ændring" : "Gem runde"} onPress={save} disabled={!result.ok} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  ladder: { marginTop: 10, fontSize: 14 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  preview: { flexDirection: "row", gap: 6 },
  previewCell: { flex: 1, minWidth: 0, alignItems: "center" },
  missing: { textAlign: "center", fontSize: 15, minHeight: 20 },
});
