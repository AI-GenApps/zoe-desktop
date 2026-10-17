import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { getLocalSetting, setLocalSetting } from "@/lib/local-db/settings";

const SETTING_KEY = "notification_permission";

export async function checkAndRequestPermission(): Promise<boolean> {
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === "granted";
  }
  await setLocalSetting(SETTING_KEY, granted ? "granted" : "denied");
  return granted;
}

export async function getCachedPermission(): Promise<boolean> {
  const val = await getLocalSetting(SETTING_KEY);
  return val === "granted";
}
