import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { backupFileName, createBackup, describeMerge, parseBackup } from "@/game/backup";
import { pickBackupFile, shareBackupFile } from "@/game/backupFile";
import { useGames } from "@/game/store";
import { Button, Section } from "@/ui/components";
import { useTheme } from "@/ui/theme";

type Message = { kind: "ok" | "error"; text: string } | null;

export default function BackupScreen() {
  const t = useTheme();
  const { games, customSystems, importBackup } = useGames();
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);

  const roundCount = games.reduce((n, g) => n + g.rounds.length, 0);

  const exportBackup = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const now = Date.now();
      const json = JSON.stringify(createBackup(games, customSystems, now));
      await shareBackupFile(backupFileName(now), json);
    } catch (e) {
      setMessage({ kind: "error", text: `Backuppen kunne ikke gemmes: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await pickBackupFile();
      if (text === null) return;
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        setMessage({ kind: "error", text: parsed.error });
        return;
      }
      setMessage({ kind: "ok", text: describeMerge(importBackup(parsed.backup)) });
    } catch (e) {
      setMessage({ kind: "error", text: `Filen kunne ikke læses: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <Section title="Gem backup">
        <Text style={[styles.text, { color: t.text }]}>
          Alle spil ligger kun på denne telefon. Gem en backup i Filer, iCloud Drive eller send den til dig selv, så
          historikken ikke forsvinder, hvis appen slettes eller du skifter telefon.
        </Text>
        <Text style={[styles.help, { color: t.textMuted }]}>
          {games.length} spil · {roundCount} runder · {customSystems.length} egne regelsæt
        </Text>
        <Button label="Gem backup" onPress={exportBackup} disabled={busy} />
      </Section>

      <Section title="Hent backup">
        <Text style={[styles.text, { color: t.text }]}>
          Vælg en backupfil. Spillene lægges sammen med dem, der allerede er her. Intet bliver slettet, og et spil, der
          findes begge steder, får den nyeste udgave.
        </Text>
        <Button label="Hent backup" variant="secondary" onPress={restore} disabled={busy} />
      </Section>

      {message && (
        <Text style={[styles.message, { color: message.kind === "ok" ? t.positive : t.negative }]}>{message.text}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  text: { fontSize: 16, lineHeight: 22, marginBottom: 8 },
  help: { fontSize: 14, marginBottom: 12 },
  message: { fontSize: 16, fontWeight: "600", textAlign: "center" },
});
