import { sendNotification } from "@tauri-apps/plugin-notification";
import { getLocalSetting, setLocalSetting } from "@/lib/local-db/settings";

const THROTTLE_MS = 5 * 60 * 1000;

function throttleKey(type: string): string {
  return `notification_last_fired_${type}`;
}

async function isThrottled(type: string): Promise<boolean> {
  const val = await getLocalSetting(throttleKey(type));
  if (!val) return false;
  return Date.now() - Number(val) < THROTTLE_MS;
}

async function recordFired(type: string): Promise<void> {
  await setLocalSetting(throttleKey(type), String(Date.now()));
}

export async function fireNotification(title: string, body: string, type = "default"): Promise<void> {
  const permission = await getLocalSetting("notification_permission");
  if (permission !== "granted") return;

  const isOnBreak = (await getLocalSetting("is_on_break")) === "true";
  if (isOnBreak) return;

  const isPaused = (await getLocalSetting("is_tracking_paused")) === "true";
  if (isPaused) {
    const notifyDuringPause = (await getLocalSetting("notify_during_pause")) === "true";
    if (!notifyDuringPause) return;
  }

  if (await isThrottled(type)) return;

  await sendNotification({ title, body });
  await recordFired(type);
}
