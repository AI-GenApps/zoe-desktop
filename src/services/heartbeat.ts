import { invoke } from "@tauri-apps/api/core";
import { statusStore } from "@/stores/status-store";
import { APP_VERSION } from "@/lib/app-version";
import { apiFetch } from "@/lib/api-client";

const INTERVAL_MS = 5 * 60 * 1000;
const BACKOFF_STEPS = [30_000, 60_000, INTERVAL_MS];

let timerId: ReturnType<typeof setTimeout> | null = null;
let backoffIndex = 0;

async function getIdleSeconds(): Promise<number> {
  try {
    return await invoke<number>("get_idle_seconds");
  } catch {
    return 0;
  }
}

function getDeviceId(): string {
  return localStorage.getItem("znx.device_id") ?? "";
}

function getCurrentTaskId(): string | null {
  return localStorage.getItem("znx.current_task_id");
}

async function sendHeartbeat(event?: string): Promise<void> {
  const idleSeconds = await getIdleSeconds();
  statusStore.setIdleSeconds(idleSeconds);
  const { status, isOnBreak, isTrackingPaused } = statusStore.get();
  const derivedStatus = isTrackingPaused ? "paused" : status;

  const payload = {
    device_id: getDeviceId(),
    status: derivedStatus,
    current_task_id: isTrackingPaused ? null : getCurrentTaskId(),
    is_on_break: isOnBreak,
    is_tracking_paused: isTrackingPaused,
    idle_seconds: idleSeconds,
    app_version: APP_VERSION,
    sent_at: new Date().toISOString(),
    client_event_id: crypto.randomUUID(),
    event: event ?? null
  };

  const data = await apiFetch<{ server_time: string }>("/api/member/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const serverTime: string = data.server_time;
  localStorage.setItem("znx.last_synced_at", serverTime);

  if (Math.abs(Date.now() - new Date(serverTime).getTime()) > 60_000) {
    console.warn("[heartbeat] clock drift > 60s detected");
  }
}

function scheduleNext(): void {
  const delay = backoffIndex > 0 ? BACKOFF_STEPS[Math.min(backoffIndex - 1, BACKOFF_STEPS.length - 1)] : INTERVAL_MS;
  timerId = setTimeout(tick, delay);
}

async function tick(): Promise<void> {
  try {
    await sendHeartbeat();
    backoffIndex = 0;
  } catch (err) {
    backoffIndex += 1;
    console.error("[heartbeat] send failed, backoff step", backoffIndex, err);
  } finally {
    scheduleNext();
  }
}

export function startHeartbeatScheduler(): void {
  if (timerId !== null) return;
  scheduleNext();
}

export function stopHeartbeatScheduler(): void {
  if (timerId !== null) clearTimeout(timerId);
  timerId = null;
  backoffIndex = 0;
}

export async function flushHeartbeat(event?: string): Promise<void> {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  try {
    await sendHeartbeat(event);
    backoffIndex = 0;
  } catch (err) {
    console.error("[heartbeat] flush failed", err);
  } finally {
    scheduleNext();
  }
}
