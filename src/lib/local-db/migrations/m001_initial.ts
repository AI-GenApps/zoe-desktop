export const m001_initial = `
CREATE TABLE IF NOT EXISTS local_user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_weekly_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  week_start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS local_current_task (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  task_id TEXT,
  selected_at TEXT
);

CREATE TABLE IF NOT EXISTS local_status_events (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  current_task_id TEXT,
  is_on_break INTEGER NOT NULL DEFAULT 0,
  is_tracking_paused INTEGER NOT NULL DEFAULT 0,
  idle_seconds INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS local_pending_sync_queue (
  id TEXT PRIMARY KEY,
  client_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS local_mentions (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  message_preview TEXT,
  deep_link TEXT,
  guild_id TEXT,
  guild_name TEXT,
  state TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  delivered_at TEXT,
  read_at TEXT
);

INSERT OR IGNORE INTO local_settings (key, value, updated_at) VALUES
  ('idle_threshold_seconds', '300', datetime('now')),
  ('autostart_enabled', 'true', datetime('now')),
  ('notify_during_pause', 'false', datetime('now')),
  ('notifications_enabled', 'false', datetime('now')),
  ('mention_preview_enabled', 'true', datetime('now'));
`;

// Rollback:
// DROP TABLE IF EXISTS local_mentions;
// DROP TABLE IF EXISTS local_pending_sync_queue;
// DROP TABLE IF EXISTS local_status_events;
// DROP TABLE IF EXISTS local_current_task;
// DROP TABLE IF EXISTS local_weekly_tasks;
// DROP TABLE IF EXISTS local_settings;
// DROP TABLE IF EXISTS local_user;
