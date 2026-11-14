import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

/** Gem teksten som en fil og åbn telefonens dele-menu (Filer, Mail, AirDrop osv.). */
export async function shareBackupFile(fileName: string, json: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(json);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Deling er ikke tilgængelig på denne enhed.");
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: "Gem backup" });
}

/** Lad brugeren vælge en backupfil. Returnerer null, hvis brugeren fortryder. */
export async function pickBackupFile(): Promise<string | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ["application/json", "text/plain", "*/*"] });
  if (picked.canceled) return null;
  return picked.result.text();
}
