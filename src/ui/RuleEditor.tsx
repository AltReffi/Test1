import { useState } from "react";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { trumpOutcome, type ScoringSystem, type SolKind, type TrumpBid } from "@/scoring";
import { SOL_LABELS } from "@/game/model";
import { Chip, ChipRow, Section } from "./components";
import { formatPoints, useTheme } from "./theme";

const SOL_KINDS: SolKind[] = ["sol", "renSol", "bordlaegger", "renBordlaegger"];

function parseNumber(text: string): number {
  const n = Number(text.replace(/\s/g, "").replace(",", "."));
  return text.trim() === "" ? Number.NaN : n;
}

const formatNumber = (n: number) => (Number.isFinite(n) ? String(n).replace(".", ",") : "");

/** Talfelt der accepterer dansk komma og først melder værdien videre, når den kan læses. */
function NumberField({ label, value, onChange, help }: { label: string; value: number; onChange: (n: number) => void; help?: string }) {
  const t = useTheme();
  const [text, setText] = useState(formatNumber(value));
  const [prevValue, setPrevValue] = useState(value);

  // Hvis værdien ændres udefra, så vis den nye værdi. Object.is, så NaN (ugyldig tekst) ikke giver en løkke.
  if (!Object.is(value, prevValue)) {
    setPrevValue(value);
    if (!Object.is(parseNumber(text), value)) setText(formatNumber(value));
  }

  const invalid = !Number.isFinite(parseNumber(text));
  return (
    <View style={styles.field}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 16 }}>{label}</Text>
        {help && <Text style={{ color: t.textMuted, fontSize: 13 }}>{help}</Text>}
      </View>
      <TextInput
        value={text}
        onChangeText={(v) => {
          setText(v);
          onChange(parseNumber(v));
        }}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={[
          styles.numberInput,
          { color: t.text, backgroundColor: t.surface, borderColor: invalid ? t.negative : t.border },
        ]}
      />
    </View>
  );
}

function examples(system: ScoringSystem): string[] {
  const safe = (bid: TrumpBid, tricks: number) => {
    try {
      const n = trumpOutcome(system, bid, tricks);
      return Number.isFinite(n) ? formatPoints(n) : "–";
    } catch {
      return "–";
    }
  };
  return [
    `7 alm., 7 stik: ${safe({ level: 7, pahaeng: "ingen" }, 7)}`,
    `8 vip, 9 stik: ${safe({ level: 8, pahaeng: "vip", vips: 1 }, 9)}`,
    `9 alm., 7 stik: ${safe({ level: 9, pahaeng: "ingen" }, 7)}`,
    `10 gode, 13 stik: ${safe({ level: 10, pahaeng: "gode", trump: "klør" }, 13)}`,
  ];
}

export function RuleEditor({ value, onChange }: { value: ScoringSystem; onChange: (s: ScoringSystem) => void }) {
  const t = useTheme();
  const set = (patch: Partial<ScoringSystem>) => onChange({ ...value, ...patch });
  const setSol = (kind: SolKind, v: number | null) => onChange({ ...value, sol: { ...value.sol, [kind]: v } });

  return (
    <View>
      <Section title="Navn">
        <TextInput
          value={value.name}
          onChangeText={(name) => set({ name })}
          placeholder="Fx Klubbens regler"
          placeholderTextColor={t.textMuted}
          style={[styles.textInput, { color: t.text, backgroundColor: t.surface, borderColor: t.border }]}
        />
      </Section>

      <Section title="Meldinger">
        <NumberField label="Grundtakst" help="Point for 7 uden påhæng" value={value.baseRate} onChange={(baseRate) => set({ baseRate })} />
        <NumberField label="Faktor pr. stik" help="2 = fordobling: 7, 8, 9 giver 10, 20, 40" value={value.stepFactor} onChange={(stepFactor) => set({ stepFactor })} />
        <Text style={[styles.label, { color: t.text }]}>Påhæng (vip, gode, sans, halve)</Text>
        <ChipRow>
          <Chip label="Ganger én gang" selected={value.pahaengMode === "single"} onPress={() => set({ pahaengMode: "single" })} wide />
          <Chip label="Hver ganger for sig" selected={value.pahaengMode === "perDoubling"} onPress={() => set({ pahaengMode: "perDoubling" })} wide />
        </ChipRow>
        <Text style={[styles.help, { color: t.textMuted }]}>
          {value.pahaengMode === "single"
            ? "Ethvert påhæng ganger meldingen én gang."
            : "Gode/sans (eller klør/sans som trumf), halve og hver vip ganger hver for sig. Du angiver antal vip og trumf i runden."}
        </Text>
        <NumberField label="Faktor for påhæng" value={value.pahaengFactor} onChange={(pahaengFactor) => set({ pahaengFactor })} />
      </Section>

      <Section title="Tabt melding">
        <ChipRow>
          <Chip label="Fast pris" selected={value.lossMode === "flat"} onPress={() => set({ lossMode: "flat" })} wide />
          <Chip label="Pr. manglende stik" selected={value.lossMode === "perUndertrick"} onPress={() => set({ lossMode: "perUndertrick" })} wide />
        </ChipRow>
        <NumberField label="Faktor ved bet" help="2 = dobbelt takst" value={value.lossFactor} onChange={(lossFactor) => set({ lossFactor })} />
        <NumberField label="Bonus for stor slem" help="Ved 13 stik (halv ved 12). 0 = fra" value={value.slamBonus} onChange={(slamBonus) => set({ slamBonus })} />
      </Section>

      <Section title="Sol (fra hver modspiller)">
        {SOL_KINDS.map((kind) => {
          const v = value.sol[kind];
          return (
            <View key={kind} style={styles.solRow}>
              <Switch value={v !== null} onValueChange={(on) => setSol(kind, on ? 50 : null)} trackColor={{ true: t.accent }} />
              <View style={{ flex: 1 }}>
                {v === null ? (
                  <Text style={{ color: t.textMuted, fontSize: 16, paddingVertical: 12 }}>{SOL_LABELS[kind]} (bruges ikke)</Text>
                ) : (
                  <NumberField label={SOL_LABELS[kind]} value={v} onChange={(n) => setSol(kind, n)} />
                )}
              </View>
            </View>
          );
        })}
        <NumberField label="Faktor ved væltet sol" help="2 = betaler dobbelt til hver" value={value.solLossFactor} onChange={(solLossFactor) => set({ solLossFactor })} />
      </Section>

      <Section title="Eksempler (pr. spiller på melderens side)">
        {examples(value).map((line) => (
          <Text key={line} style={{ color: t.text, fontSize: 15, fontVariant: ["tabular-nums"], marginBottom: 2 }}>
            {line}
          </Text>
        ))}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  numberInput: { width: 96, minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 17, textAlign: "right" },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, minHeight: 48, fontSize: 17 },
  label: { fontSize: 16, marginTop: 10, marginBottom: 8 },
  help: { fontSize: 13, marginTop: 6, marginBottom: 4, lineHeight: 18 },
  solRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
