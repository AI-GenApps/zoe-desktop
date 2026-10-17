import { getDb } from "./db";

export interface LocalMention {
  id: string;
  author_name: string;
  channel_name: string;
  message_preview: string | null;
  deep_link: string | null;
  guild_id: string | null;
  guild_name: string | null;
  state: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

export async function cacheMentions(mentions: LocalMention[]): Promise<void> {
  const db = await getDb();
  for (const m of mentions) {
    await db.execute(
      `INSERT OR REPLACE INTO local_mentions
        (id, author_name, channel_name, message_preview, deep_link, guild_id, guild_name, state, created_at, delivered_at, read_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.id,
        m.author_name,
        m.channel_name,
        m.message_preview ?? null,
        m.deep_link ?? null,
        m.guild_id ?? null,
        m.guild_name ?? null,
        m.state,
        m.created_at,
        m.delivered_at ?? null,
        m.read_at ?? null
      ]
    );
  }
}

export async function getPendingMentions(): Promise<LocalMention[]> {
  const db = await getDb();
  return db.select<LocalMention[]>(
    "SELECT * FROM local_mentions WHERE state IN ('pending', 'queued') ORDER BY created_at ASC"
  );
}

export async function markMentionDelivered(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE local_mentions SET state = 'delivered', delivered_at = datetime('now') WHERE id = ?", [id]);
}

export async function markMentionRead(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE local_mentions SET state = 'read', read_at = datetime('now') WHERE id = ?", [id]);
}

export async function markMentionDismissed(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE local_mentions SET state = 'dismissed' WHERE id = ?", [id]);
}

export async function getAllMentionsLocal(): Promise<LocalMention[]> {
  const db = await getDb();
  return db.select<LocalMention[]>("SELECT * FROM local_mentions WHERE state != 'dismissed' ORDER BY created_at DESC");
}

export async function getUnreadCount(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) as count FROM local_mentions WHERE state IN ('pending','queued','delivered')"
  );
  return rows[0]?.count ?? 0;
}
