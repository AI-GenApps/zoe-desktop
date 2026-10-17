import { getDb } from "./db";

export interface LocalSetting {
  key: string;
  value: string;
  updated_at: string;
}

export async function getLocalSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<LocalSetting[]>("SELECT value FROM local_settings WHERE key = ?", [key]);
  return rows[0]?.value ?? null;
}

export async function setLocalSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT OR REPLACE INTO local_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))", [
    key,
    value
  ]);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.select<LocalSetting[]>("SELECT key, value FROM local_settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function resetSettings(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM local_settings");
  await db.execute(`
    INSERT OR IGNORE INTO local_settings (key, value, updated_at) VALUES
      ('idle_threshold_seconds', '300', datetime('now')),
      ('autostart_enabled', 'true', datetime('now')),
      ('notify_during_pause', 'false', datetime('now')),
      ('notifications_enabled', 'false', datetime('now')),
      ('mention_preview_enabled', 'true', datetime('now'))
  `);
}
