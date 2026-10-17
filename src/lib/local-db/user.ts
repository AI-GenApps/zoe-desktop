import { getDb } from "./db";

export interface LocalUser {
  id: string;
  email: string;
  name: string | null;
  updated_at: string;
}

export async function getCachedUser(): Promise<LocalUser | null> {
  const db = await getDb();
  const rows = await db.select<LocalUser[]>("SELECT * FROM local_user WHERE id = (SELECT id FROM local_user LIMIT 1)");
  return rows[0] ?? null;
}

export async function setCachedUser(user: Omit<LocalUser, "updated_at">): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT OR REPLACE INTO local_user (id, email, name, updated_at) VALUES (?, ?, ?, datetime('now'))",
    [user.id, user.email, user.name ?? null]
  );
}

export async function clearCachedUser(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM local_user");
}
