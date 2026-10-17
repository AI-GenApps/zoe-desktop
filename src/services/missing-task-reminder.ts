import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { reminderStore } from "@/stores/reminder-store";

type AppStatus = "active" | "idle" | "on_break" | "paused" | "offline";

const GRACE_MS = 5 * 60 * 1000;
const REPEAT_MS = 5 * 60 * 1000;
const LS_KEY = "znx.last_missing_task_notification";

let noTaskSeenAt: number | null = null;
let reminderTimerId: ReturnType<typeof setInterval> | null = null;

function getLastNotifiedAt(): number | null {
  const v = localStorage.getItem(LS_KEY);
  return v ? Number(v) : null;
}

function setLastNotifiedAt(ts: number | null): void {
  if (ts === null) localStorage.removeItem(LS_KEY);
  else localStorage.setItem(LS_KEY, String(ts));
}

async function fireReminder(): Promise<void> {
  let granted = await isPermissionGranted();
  if (!granted) {
    const perm = await requestPermission();
    granted = perm === "granted";
  }
  if (granted) {
    await sendNotification({
      title: "No task selected",
      body: "You've been active for 5+ minutes without a task. What are you working on?"
    });
  }
  reminderStore.setShowMissingTaskBanner(true);
}

async function checkAndNotify(): Promise<void> {
  if (noTaskSeenAt === null) return;
  const elapsed = Date.now() - noTaskSeenAt;
  if (elapsed < GRACE_MS) return;

  const lastNotifiedAt = getLastNotifiedAt();
  const sinceLastNotify = Date.now() - (lastNotifiedAt ?? 0);
  if (lastNotifiedAt === null || sinceLastNotify >= REPEAT_MS) {
    await fireReminder();
    setLastNotifiedAt(Date.now());
  }
}

function startReminderLoop(): void {
  if (reminderTimerId !== null) return;
  reminderTimerId = setInterval(() => {
    checkAndNotify().catch(console.error);
  }, 60_000);
}

export function resetReminder(): void {
  noTaskSeenAt = null;
  if (reminderTimerId !== null) {
    clearInterval(reminderTimerId);
    reminderTimerId = null;
  }
  setLastNotifiedAt(null);
  reminderStore.setShowMissingTaskBanner(false);
}

export function onStatusChange(status: AppStatus, currentTaskId: string | null): void {
  if (status === "active" && currentTaskId === null) {
    if (noTaskSeenAt === null) {
      noTaskSeenAt = Date.now();
      startReminderLoop();
    }
  } else {
    resetReminder();
  }
}
