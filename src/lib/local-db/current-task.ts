import { getDb } from "./db";

export interface LocalCurrentTask {
  task_id: string | null;
  selected_at: string | null;
}

export async function getCurrentTask(): Promise<LocalCurrentTask | null> {
  const db = await getDb();
  const rows = await db.select<LocalCurrentTask[]>("SELECT task_id, selected_at FROM local_current_task WHERE id = 1");
  return rows[0] ?? null;
}

export async function setCurrentTask(taskId: string, selectedAt: string): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT OR REPLACE INTO local_current_task (id, task_id, selected_at) VALUES (1, ?, ?)", [
    taskId,
    selectedAt
  ]);
}

export async function clearCurrentTask(): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT OR REPLACE INTO local_current_task (id, task_id, selected_at) VALUES (1, NULL, NULL)");
}
