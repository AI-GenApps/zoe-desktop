import Database from "@tauri-apps/plugin-sql";
import { m001_initial } from "./migrations/m001_initial";

const DB_PATH = "sqlite:zybernetix.db";

const migrations = [{ version: 1, sql: m001_initial }];

let _db: Database | null = null;
let _dbInitialization: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (_db) return Promise.resolve(_db);
  if (_dbInitialization) return _dbInitialization;

  _dbInitialization = initializeDb().catch((error: unknown) => {
    _dbInitialization = null;
    throw error;
  });
  return _dbInitialization;
}

async function initializeDb(): Promise<Database> {
  const db = await Database.load(DB_PATH);
  for (const migration of migrations) {
    await db.execute(migration.sql);
  }
  const mentionColumns = await db.select<Array<{ name: string }>>("PRAGMA table_info(local_mentions)");
  const existingMentionColumns = new Set(mentionColumns.map((column) => column.name));
  if (!existingMentionColumns.has("guild_id")) {
    await db.execute("ALTER TABLE local_mentions ADD COLUMN guild_id TEXT");
  }
  if (!existingMentionColumns.has("guild_name")) {
    await db.execute("ALTER TABLE local_mentions ADD COLUMN guild_name TEXT");
  }
  if (import.meta.env.DEV) {
    console.log("[db] opened", DB_PATH);
  }
  _db = db;
  return db;
}
