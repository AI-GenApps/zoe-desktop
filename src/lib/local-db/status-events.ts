import { getDb } from "./db";

export interface LocalStatusEvent {
  id: string;
  status: string;
  current_task_id: string | null;
  is_on_break: number;
  is_tracking_paused: number;
  idle_seconds: number;
  sent_at: string;
  synced: number;
}

export async function appendStatusEvent(event: Omit<LocalStatusEvent, "synced">): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO local_status_events
      (id, status, current_task_id, is_on_break, is_tracking_paused, idle_seconds, sent_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      event.id,
      event.status,
      event.current_task_id ?? null,
      event.is_on_break,
      event.is_tracking_paused,
      event.idle_seconds,
      event.sent_at
    ]
  );
}

export async function getPendingStatusEvents(): Promise<LocalStatusEvent[]> {
  const db = await getDb();
  return db.select<LocalStatusEvent[]>("SELECT * FROM local_status_events WHERE synced = 0 ORDER BY sent_at ASC");
}

export async function markStatusEventSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE local_status_events SET synced = 1 WHERE id = ?", [id]);
}
