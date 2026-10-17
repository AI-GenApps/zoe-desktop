import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { LocalMention } from "@/lib/local-db/mentions";

const RATE_LIMIT_MS = 5 * 60 * 1000;
let lastNotifiedAt = 0;

async function ensurePermission(): Promise<boolean> {
  let granted = await isPermissionGranted();
  if (!granted) {
    const perm = await requestPermission();
    granted = perm === "granted";
  }
  return granted;
}

function isRateLimited(): boolean {
  return Date.now() - lastNotifiedAt < RATE_LIMIT_MS;
}

function recordNotification() {
  lastNotifiedAt = Date.now();
}

async function openInbox() {
  const win = getCurrentWebviewWindow();
  await win.show();
  await win.setFocus();
  window.location.hash = "#/mentions";
}

export interface NotificationService {
  fireSingle(mention: LocalMention): Promise<void>;
  fireBundle(count: number): Promise<void>;
}

export const notificationService: NotificationService = {
  async fireSingle(mention) {
    if (isRateLimited()) return;
    const granted = await ensurePermission();
    if (!granted) return;

    const title = mention.author_name ? `@${mention.author_name} mentioned you` : "New Discord mention";
    const body = mention.message_preview
      ? mention.message_preview.slice(0, 100)
      : mention.channel_name
        ? `In #${mention.channel_name}`
        : "Tap to view";

    await sendNotification({ title, body });
    recordNotification();
  },

  async fireBundle(count) {
    if (count === 0) return;
    const granted = await ensurePermission();
    if (!granted) return;

    const title = `${count} Discord mention${count === 1 ? "" : "s"} while on break`;
    const body = "Open Mentions Inbox to review them.";

    await sendNotification({ title, body });
    recordNotification();
    await openInbox();
  }
};

export function _resetRateLimit() {
  lastNotifiedAt = 0;
}
