/**
 * Tauri updater helper.
 *
 * Static manifest format (hosted at the configured endpoint, used by Epic 11):
 * {
 *   "version": "0.2.0",
 *   "notes": "Bug fixes and improvements.",
 *   "pub_date": "2026-06-01T00:00:00Z",
 *   "platforms": {
 *     "darwin-aarch64": { "signature": "<sig>", "url": "<dmg-url>" },
 *     "darwin-x86_64":  { "signature": "<sig>", "url": "<dmg-url>" },
 *     "windows-x86_64": { "signature": "<sig>", "url": "<nsis-url>" }
 *   }
 * }
 */
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus = "idle" | "checking" | "up-to-date" | "available" | "downloading" | "relaunching" | "error";

export interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
}

export async function checkForUpdate(onStatus?: (status: UpdateStatus) => void): Promise<UpdateInfo> {
  onStatus?.("checking");
  try {
    const update = await check();
    if (!update?.available) {
      onStatus?.("up-to-date");
      return { available: false };
    }

    onStatus?.("available");
    return { available: true, version: update.version, body: update.body };
  } catch {
    onStatus?.("error");
    return { available: false };
  }
}

export async function downloadAndInstall(onStatus?: (status: UpdateStatus) => void): Promise<void> {
  onStatus?.("downloading");
  try {
    const update = await check();
    if (!update?.available) return;
    await update.downloadAndInstall();
    onStatus?.("relaunching");
    await relaunch();
  } catch (e) {
    console.warn("[updater] install failed:", e);
    onStatus?.("error");
  }
}
