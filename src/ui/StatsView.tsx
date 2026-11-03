import { StyleSheet, Text, View } from "react-native";
import { formatKroner } from "@/scoring";
import { percent, playerKey, type PairStats, type PlayerStats, type StatsResult } from "@/game/stats";
import { Points, Section } from "./components";
import { formatPoints, useTheme } from "./theme";

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

/** Spillerne med højeste værdi (delt førsteplads giver flere navne), eller null hvis ingen har noget. */
function leaders(players: PlayerStats[], value: (s: PlayerStats) => number): { names: string; value: number } | null {
  if (players.length === 0) return null;
  const best = Math.max(...players.map(value));
  if (best <= 0) return null;
  const names = players.filter((s) => value(s) === best).map((s) => s.name);
  const last = names.pop()!;
  return { names: names.length ? `${names.join(", ")} og ${last}` : last, value: best };
}

function bestPartner(s: PlayerStats, pairs: PairStats[]): string {
  // Parrene er sorteret efter point, så det første par med spilleren er det bedste.
  const pair = pairs.find((p) => p.names.some((n) => playerKey(n) === s.key));
  if (!pair) return "–";
  const other = playerKey(pair.names[0]) === s.key ? pair.names[1] : pair.names[0];
  return `${other} (${formatPoints(pair.points)})`;
}

function PlayerCard({ s, pairs, showGames }: { s: PlayerStats; pairs: PairStats[]; showGames: boolean }) {
  const t = useTheme();
  const rows: [string, string][] = [
    ["Meldinger", rate(s.bidsMade, s.bids)],
    ["Point på egne meldinger", s.bids + s.sols === 0 ? "–" : formatPoints(s.bidPoints)],
    ["Melder i snit", s.avgLevel === null ? "–" : `${num(s.avgLevel)} stik`],
    ["Melder typisk", bidTendency(s.avgTrickDiff)],
    ["Selvmakker", rate(s.aloneMade, s.alone)],
    ["Som makker", rate(s.asPartnerMade, s.asPartner)],
    ["Point som makker", s.asPartner === 0 ? "–" : formatPoints(s.partnerPoints)],
    ["Bedste makker", bestPartner(s, pairs)],
    ["Sol", rate(s.solsMade, s.sols)],
    ["Bedste runde", s.bestRound === null ? "–" : formatPoints(s.bestRound)],
    ["Værste runde", s.worstRound === null ? "–" : formatPoints(s.worstRound)],
  ];
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardName, { color: t.text }]}>{s.name}</Text>
        <Text style={{ color: t.textMuted }}>
          {showGames ? `${s.games} spil · ` : ""}
          {s.rounds} runder
        </Text>
      </View>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.kv}>
          <Text style={{ color: t.textMuted, fontSize: 15 }}>{label}</Text>
          <Text style={{ color: t.text, fontSize: 15, fontVariant: ["tabular-nums"], flexShrink: 1, textAlign: "right" }}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

/** Statistik for flere spil (`showStanding`) eller for ét spil, hvor stillingen allerede står på stillingstavlen. */
export function StatsView({ stats, showStanding }: { stats: StatsResult; showStanding: boolean }) {
  const t = useTheme();
  const anyMoney = stats.players.some((p) => p.oere !== 0);
  const ps = stats.players;

  const madeLeader = leaders(ps, (s) => s.bidsMade);
  const records: [string, string][] = [];
  if (madeLeader) records.push(["Flest meldinger hjem", `${madeLeader.names} · ${madeLeader.value}`]);
  const bidLeader = leaders(ps, (s) => s.bidPoints);
  if (bidLeader) records.push(["Flest point på egne meldinger", `${bidLeader.names} · ${formatPoints(bidLeader.value)}`]);
  const partnerLeader = leaders(ps, (s) => s.partnerPoints);
  if (partnerLeader) records.push(["Flest point som makker", `${partnerLeader.names} · ${formatPoints(partnerLeader.value)}`]);
  const pair = stats.pairs[0];
  if (pair && pair.points > 0) records.push(["Bedste makkerpar", `${pair.names[0]} & ${pair.names[1]} · ${formatPoints(pair.points)}`]);
  const solLeader = leaders(ps, (s) => s.solsMade);
  if (solLeader) records.push(["Flest sol hjem", `${solLeader.names} · ${solLeader.value}`]);
  const roundLeader = leaders(ps, (s) => s.bestRound ?? 0);
  if (roundLeader) records.push(["Bedste runde", `${roundLeader.names} · ${formatPoints(roundLeader.value)}`]);

  return (
    <>
      {showStanding && (
        <Section title="Samlet stilling">
          {ps.map((s, i) => (
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
      )}

      {records.length > 0 && (
        <Section title="Rekorder">
          {records.map(([label, value]) => (
            <View key={label} style={[styles.row, { borderColor: t.border }]}>
              <Text style={{ color: t.textMuted, fontSize: 15, flex: 1 }}>{label}</Text>
              <Text style={{ color: t.text, fontSize: 15, fontWeight: "600", fontVariant: ["tabular-nums"], flexShrink: 1, textAlign: "right" }}>{value}</Text>
            </View>
          ))}
        </Section>
      )}

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
          {ps.map((s) => (
            <PlayerCard key={s.key} s={s} pairs={stats.pairs} showGames={showStanding} />
          ))}
        </View>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  rowName: { fontSize: 17, fontWeight: "600" },
  help: { marginTop: 8, fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  cardName: { fontSize: 18, fontWeight: "700" },
  kv: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
});
