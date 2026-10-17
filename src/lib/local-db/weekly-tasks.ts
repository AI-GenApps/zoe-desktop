import { getDb } from "./db";

export interface LocalWeeklyTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  week_start_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export async function cacheWeeklyTasks(tasks: Omit<LocalWeeklyTask, "synced_at">[]): Promise<void> {
  const db = await getDb();
  for (const t of tasks) {
    await db.execute(
      `INSERT OR REPLACE INTO local_weekly_tasks
        (id, user_id, title, description, week_start_date, status, created_at, updated_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [t.id, t.user_id, t.title, t.description ?? null, t.week_start_date, t.status, t.created_at, t.updated_at]
    );
  }
}

export async function getWeeklyTasks(weekStart: string): Promise<LocalWeeklyTask[]> {
  const db = await getDb();
  return db.select<LocalWeeklyTask[]>("SELECT * FROM local_weekly_tasks WHERE week_start_date = ?", [weekStart]);
}

export async function upsertTask(task: Omit<LocalWeeklyTask, "synced_at">): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT OR REPLACE INTO local_weekly_tasks
      (id, user_id, title, description, week_start_date, status, created_at, updated_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      task.id,
      task.user_id,
      task.title,
      task.description ?? null,
      task.week_start_date,
      task.status,
      task.created_at,
      task.updated_at
    ]
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM local_weekly_tasks WHERE id = ?", [id]);
}
