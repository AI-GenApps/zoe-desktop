import { getDb } from "@/lib/local-db/db";

export type SyncEventType = "heartbeat" | "mention_ack" | "task_select" | "task_clear" | "task_create" | "task_update";

export interface SyncEvent {
  id: string;
  client_event_id: string;
  event_type: SyncEventType;
  payload: string;
  created_at: string;
  attempts: number;
  last_error: string | null;
  status: "pending" | "failed" | "done";
}

const MAX_ATTEMPTS = 3;

export class SyncQueue {
  async enqueue(type: SyncEventType, payload: unknown): Promise<string> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const clientEventId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await db.execute(
      `INSERT INTO local_pending_sync_queue
        (id, client_event_id, event_type, payload, created_at, attempts, last_error, status)
       VALUES (?, ?, ?, ?, ?, 0, NULL, 'pending')`,
      [id, clientEventId, type, JSON.stringify(payload), createdAt]
    );
    return id;
  }

  async peek(limit: number): Promise<SyncEvent[]> {
    const db = await getDb();
    return db.select<SyncEvent[]>(
      `SELECT * FROM local_pending_sync_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
      [limit]
    );
  }

  async markSucceeded(id: string): Promise<void> {
    const db = await getDb();
    await db.execute(`UPDATE local_pending_sync_queue SET status = 'done' WHERE id = ?`, [id]);
  }

  async dequeue(id: string): Promise<void> {
    await this.markSucceeded(id);
  }

  async markFailed(id: string, error: string, forceFail = false): Promise<void> {
    const db = await getDb();
    const rows = await db.select<{ attempts: number }[]>(`SELECT attempts FROM local_pending_sync_queue WHERE id = ?`, [
      id
    ]);
    const current = rows[0]?.attempts ?? 0;
    const next = current + 1;
    const newStatus = forceFail || next >= MAX_ATTEMPTS ? "failed" : "pending";
    await db.execute(`UPDATE local_pending_sync_queue SET attempts = ?, last_error = ?, status = ? WHERE id = ?`, [
      next,
      error,
      newStatus,
      id
    ]);
  }

  async pendingCount(): Promise<number> {
    const db = await getDb();
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM local_pending_sync_queue WHERE status = 'pending'`
    );
    return rows[0]?.count ?? 0;
  }

  async flushAll(): Promise<void> {
    triggerFlush();
  }
}

export const syncQueue = new SyncQueue();

let _triggerFlush: (() => void) | null = null;

export function registerFlushTrigger(fn: () => void): void {
  _triggerFlush = fn;
}

export function triggerFlush(): void {
  _triggerFlush?.();
}
