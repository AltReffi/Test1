import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { formatKroner } from "@/scoring";
import { computeStats, percent, periodStart, type Period, type PlayerStats } from "@/game/stats";
import { useGames } from "@/game/store";
import { Chip, ChipRow, Points, Section } from "@/ui/components";
import { formatPoints, useTheme } from "@/ui/theme";

const PERIODS: { id: Period; label: string }[] = [
  { id: "all", label: "Altid" },
  { id: "year", label: "I år" },
  { id: "30d", label: "30 dage" },
];

const num = (n: number, digits = 1) => n.toLocaleString("da-DK", { maximumFractionDigits: digits, minimumFractionDigits: digits });

function rate(part: number, whole: number): string {
  const p = percent(part, whole);
  return p === null ? "–" : `${whole} ${whole === 1 ? "gang" : "gange"} · ${p} % hjemme`;
}

function bidTendency(diff: number | null): string {
  if (diff === null) return "–";
  if (Math.abs(diff) < 0.05) return "præcist";
  return diff < 0 ? `${num(-diff)} stik for højt` : `${num(diff)} stik for lavt`;
}

function PlayerCard({ s }: { s: PlayerStats }) {
  const t = useTheme();
  const rows: [string, string][] = [
    ["Meldinger", rate(s.bidsMade, s.bids)],
    ["Melder i snit", s.avgLevel === null ? "–" : `${num(s.avgLevel)} stik`],
    ["Melder typisk", bidTendency(s.avgTrickDiff)],
    ["Selvmakker", rate(s.aloneMade, s.alone)],
    ["Som makker", rate(s.asPartnerMade, s.asPartner)],
    ["Sol", rate(s.solsMade, s.sols)],
    ["Bedste runde", s.bestRound === null ? "–" : formatPoints(s.bestRound)],
    ["Værste runde", s.worstRound === null ? "–" : formatPoints(s.worstRound)],
  ];
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardName, { color: t.text }]}>{s.name}</Text>
        <Text style={{ color: t.textMuted }}>
          {s.games} spil · {s.rounds} runder
        </Text>
      </View>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.kv}>
          <Text style={{ color: t.textMuted, fontSize: 15 }}>{label}</Text>
          <Text style={{ color: t.text, fontSize: 15, fontVariant: ["tabular-nums"] }}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsScreen() {
  const t = useTheme();
  const { games } = useGames();
  const [period, setPeriod] = useState<Period>("all");
  const stats = computeStats(games, periodStart(period));
  const anyMoney = stats.players.some((p) => p.oere !== 0);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <ChipRow>
        {PERIODS.map((p) => (
          <Chip key={p.id} label={p.label} selected={period === p.id} onPress={() => setPeriod(p.id)} wide />
        ))}
      </ChipRow>

      {stats.games === 0 ? (
        <Text style={[styles.empty, { color: t.textMuted }]}>Ingen spil med runder i perioden.</Text>
      ) : (
        <>
          <Text style={[styles.summary, { color: t.textMuted }]}>
            {stats.games} spil · {stats.rounds} runder
          </Text>

          <Section title="Samlet stilling">
            {stats.players.map((s, i) => (
              <View key={s.key} style={[styles.row, { borderColor: t.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowName, { color: t.text }]}>
                    {i + 1}. {s.name}
                  </Text>
                  <Text style={{ color: t.textMuted, fontSize: 13 }}>
                    {s.wins} {s.wins === 1 ? "sejr" : "sejre"} i {s.games} spil
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Points value={s.points} size={17} bold />
                  {anyMoney && <Text style={{ color: t.textMuted, fontSize: 13 }}>{formatKroner(s.oere)}</Text>}
                </View>
              </View>
            ))}
          </Section>

          {stats.pairs.length > 0 && (
            <Section title="Makkerpar">
              {stats.pairs.slice(0, 6).map((p) => (
                <View key={p.names.join("|")} style={[styles.row, { borderColor: t.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: t.text }]}>
                      {p.names[0]} & {p.names[1]}
                    </Text>
                    <Text style={{ color: t.textMuted, fontSize: 13 }}>{rate(p.made, p.rounds)}</Text>
                  </View>
                  <Points value={p.points} size={17} bold />
                </View>
              ))}
              <Text style={[styles.help, { color: t.textMuted }]}>Melder og makker sammen. Point pr. spiller.</Text>
            </Section>
          )}

          <Section title="Spillere">
            <View style={{ gap: 12 }}>
              {stats.players.map((s) => (
                <PlayerCard key={s.key} s={s} />
              ))}
            </View>
          </Section>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  empty: { textAlign: "center", marginTop: 32, fontSize: 16 },
  summary: { marginTop: 12, marginBottom: 16, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  rowName: { fontSize: 17, fontWeight: "600" },
  help: { marginTop: 8, fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  cardName: { fontSize: 18, fontWeight: "700" },
  kv: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
});
