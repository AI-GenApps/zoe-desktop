/**
 * API types shared with the Zoe server (next-dash `/api/member/*`).
 *
 * Mirrors the Zod schemas of the server's protocol package. The server repository checks these types against its
 * schemas, so change them together.
 */

export type UserStatus = "active" | "idle" | "on_break" | "paused" | "offline";

export type WeeklyTaskStatus = "planned" | "active" | "done" | "dropped";

export interface WeeklyTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: WeeklyTaskStatus;
  week_start_date: string;
  selected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWeeklyTask {
  title: string;
  description?: string | undefined;
  week_start_date: string;
}

export interface UpdateWeeklyTask {
  title?: string | undefined;
  description?: string | undefined;
  status?: WeeklyTaskStatus | undefined;
}

export interface Break {
  started_at: number;
  ended_at?: number | undefined;
}

export interface FollowUpEntry {
  content: string;
  timestamp: number;
}

export interface TaskRow {
  id: string;
  guildId: string | null;
  userId: string;
  username: string | null;
  threadId: string | null;
  date: string;
  channelId: string | null;
  messageId: string | null;
  source: "discord" | "dashboard" | "desktop";
  wfh: boolean;
  breaks: Break[];
  followUp: FollowUpEntry[];
  status: string;
  attendanceType: "full-day" | "half-day" | null;
  followupPostedAt: number;
  createdAt: number;
  tasks: string[];
}
