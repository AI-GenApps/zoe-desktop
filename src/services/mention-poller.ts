import { getDb } from "@/lib/local-db/db";
import { statusStore } from "@/stores/status-store";
import { appEvents } from "@/lib/app-events";
import type { LocalMention } from "@/lib/local-db/mentions";
import { apiFetch } from "@/lib/api-client";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

interface ServerMention {
  id: string;
  discord_message_id: string;
  state: string;
  created_at: number;
  author_id: string;
  author_username: string | null;
  channel_id: string;
  message_preview: string | null;
  deep_link: string | null;
  guild_id: string | null;
  guild_name: string | null;
  timestamp: number;
}

export interface NotificationService {
  fireSingle(mention: LocalMention): Promise<void>;
  fireBundle(count: number): Promise<void>;
}

const CURSOR_INIT = "INSERT OR IGNORE INTO mention_poller_cursor (id, since_id) VALUES (1, NULL)";
const CURSOR_SELECT = "SELECT since_id FROM mention_poller_cursor WHERE id = 1";
const CURSOR_UPDATE = "UPDATE mention_poller_cursor SET since_id = ? WHERE id = 1";
const MENTIONS_UPSERT = `INSERT OR REPLACE INTO local_mentions
  (id, author_name, channel_name, message_preview, deep_link, guild_id, guild_name, state, created_at, delivered_at, read_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`;
const MENTIONS_QUEUED_SELECT = "SELECT * FROM local_mentions WHERE state = 'queued'";
const MENTIONS_STATE_UPDATE = "UPDATE local_mentions SET state = ? WHERE id = ?";

async function getCursor(): Promise<string | null> {
  const db = await getDb();
  await db.execute(CURSOR_INIT);
  const rows = await db.select<{ since_id: string | null }[]>(CURSOR_SELECT);
  return rows[0]?.since_id ?? null;
}

async function updateCursor(sinceId: string): Promise<void> {
  const db = await getDb();
  await db.execute(CURSOR_UPDATE, [sinceId]);
}

async function upsertLocalMention(m: ServerMention, state: "delivered" | "queued"): Promise<void> {
  const db = await getDb();
  await db.execute(MENTIONS_UPSERT, [
    m.id,
    m.author_username ?? m.author_id,
    m.channel_id,
    m.message_preview ?? null,
    m.deep_link ?? null,
    m.guild_id,
    m.guild_name,
    state,
    new Date(m.created_at).toISOString()
  ]);
}

async function fetchPending(sinceId: string | null): Promise<ServerMention[]> {
  const qs = sinceId ? `?since_id=${encodeURIComponent(sinceId)}` : "";
  const data = await apiFetch<{ mentions: ServerMention[] }>(`/api/member/mentions/pending${qs}`);
  return data.mentions ?? [];
}

async function ackMention(id: string): Promise<void> {
  await apiFetch(`/api/member/mentions/${id}/ack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: "delivered", delivered_at: Date.now() })
  });
}

export class MentionPoller {
  private timer: ReturnType<typeof setInterval> | null = null;
  private notificationService: NotificationService | null = null;
  private unsubBreakEnd: (() => void) | null = null;

  setNotificationService(svc: NotificationService): void {
    this.notificationService = svc;
  }

  start(): void {
    if (this.timer !== null) return;
    void this.poll();
    this.timer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
    this.unsubBreakEnd = appEvents.on("break:ended", () => void this.onBreakEnd());
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.unsubBreakEnd?.();
    this.unsubBreakEnd = null;
  }

  private async poll(): Promise<void> {
    try {
      const sinceId = await getCursor();
      const mentions = await fetchPending(sinceId);
      if (mentions.length === 0) return;

      const { isOnBreak } = statusStore.get();
      for (const m of mentions) {
        const localState = isOnBreak ? "queued" : "delivered";
        await upsertLocalMention(m, localState);
        if (!isOnBreak) {
          await ackMention(m.id);
          const localMention = toLocalMention(m);
          await this.notificationService?.fireSingle(localMention);
        }
      }

      await updateCursor(mentions[mentions.length - 1].id);
      appEvents.emit("mentionsUpdated");
    } catch (err) {
      console.error("[mention-poller] poll failed", err);
    }
  }

  private async onBreakEnd(): Promise<void> {
    try {
      const db = await getDb();
      const queued = await db.select<LocalMention[]>(MENTIONS_QUEUED_SELECT);
      if (queued.length === 0) return;

      await this.notificationService?.fireBundle(queued.length);

      for (const m of queued) {
        await ackMention(m.id);
        await db.execute(MENTIONS_STATE_UPDATE, ["delivered", m.id]);
      }
      appEvents.emit("mentionsUpdated");
    } catch (err) {
      console.error("[mention-poller] break-end flush failed", err);
    }
  }
}

function toLocalMention(m: ServerMention): LocalMention {
  return {
    id: m.id,
    author_name: m.author_username ?? m.author_id,
    channel_name: m.channel_id,
    message_preview: m.message_preview ?? null,
    deep_link: m.deep_link ?? null,
    guild_id: m.guild_id,
    guild_name: m.guild_name,
    state: "delivered",
    created_at: new Date(m.created_at).toISOString(),
    delivered_at: new Date().toISOString(),
    read_at: null
  };
}

export const mentionPoller = new MentionPoller();
