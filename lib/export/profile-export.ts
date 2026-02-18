import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import * as XLSX from "xlsx";

import { getAllContactsForExport, getAllLogsForExport } from "@/lib/db";
import { getDatabase } from "@/lib/db/sqlite";

const CONTACT_EXPORT_HEADERS = [
  "systemId",
  "fullName",
  "nickName",
  "imageUri",
  "description",
  "circleId",
  "customReminderDays",
  "createdAt",
  "updatedAt",
] as const;

const LOG_EXPORT_HEADERS = [
  "id",
  "contactSystemId",
  "contactFullName",
  "createdAt",
  "summary",
  "wasOverdue",
] as const;

function buildTimestampToken(now = new Date()) {
  return now.toISOString().replace(/[:.]/g, "-");
}

function toFileUri(pathOrUri: string) {
  if (pathOrUri.startsWith("file://")) return pathOrUri;
  return `file://${pathOrUri}`;
}

function buildCacheFileUri(fileName: string) {
  if (!FileSystem.cacheDirectory) {
    throw new Error("Cache directory is unavailable on this device.");
  }
  return `${FileSystem.cacheDirectory}${fileName}`;
}

export async function createDatabaseBackupFile(): Promise<{ uri: string; filename: string }> {
  const sourceDb = await getDatabase();
  const filename = `friendly-reminder-backup-${buildTimestampToken()}.db`;
  const destinationDb = await SQLite.openDatabaseAsync(filename);

  try {
    await SQLite.backupDatabaseAsync({
      sourceDatabase: sourceDb,
      destDatabase: destinationDb,
    });
    return { uri: toFileUri(destinationDb.databasePath), filename };
  } finally {
    await destinationDb.closeAsync();
  }
}

export async function createXlsxExportFile(): Promise<{ uri: string; filename: string }> {
  const [contacts, logs] = await Promise.all([getAllContactsForExport(), getAllLogsForExport()]);
  const workbook = XLSX.utils.book_new();

  const contactsSheet = XLSX.utils.json_to_sheet(contacts, {
    header: [...CONTACT_EXPORT_HEADERS],
  });
  const logsSheet = XLSX.utils.json_to_sheet(logs, {
    header: [...LOG_EXPORT_HEADERS],
  });

  XLSX.utils.book_append_sheet(workbook, contactsSheet, "Contacts");
  XLSX.utils.book_append_sheet(workbook, logsSheet, "Logs");

  const contentBase64 = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
  const filename = `friendly-reminder-export-${buildTimestampToken()}.xlsx`;
  const uri = buildCacheFileUri(filename);

  await FileSystem.writeAsStringAsync(uri, contentBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { uri: toFileUri(uri), filename };
}
