import { invoke } from "@tauri-apps/api/core";
import { APP_VERSION } from "@/lib/app-version";
import { loadSessionToken } from "@/lib/secure-storage";

const API_BASE = () => (import.meta.env.VITE_API_BASE_URL as string) ?? "";

export async function handleQuit(): Promise<void> {
  const deviceId = localStorage.getItem("znx.device_id") ?? "";
  const payload = JSON.stringify({
    device_id: deviceId,
    status: "offline",
    current_task_id: null,
    is_on_break: false,
    is_tracking_paused: false,
    idle_seconds: 0,
    app_version: APP_VERSION,
    sent_at: new Date().toISOString(),
    client_event_id: crypto.randomUUID(),
    event: "app_quit"
  });

  try {
    const token = await loadSessionToken();
    await invoke("send_quit_heartbeat", {
      endpoint: `${API_BASE()}/api/member/heartbeat`,
      payloadJson: payload,
      authorizationHeader: token ? `Bearer ${token}` : ""
    });
  } catch {
    // best-effort
  }
}
