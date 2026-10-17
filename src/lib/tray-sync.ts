import { invoke } from "@tauri-apps/api/core";
import { statusStore } from "@/stores/status-store";
import type { UserStatus } from "@/types/protocol";

function statusDisplayLabel(status: UserStatus): string {
  const map: Record<UserStatus, string> = {
    active: "Active",
    idle: "Idle",
    on_break: "On Break",
    paused: "Paused",
    offline: "Offline"
  };
  return map[status];
}

let lastKey = "";

async function sync(isOnBreak: boolean, isTrackingPaused: boolean, status: UserStatus, taskTitle: string | null) {
  const key = `${isOnBreak}|${isTrackingPaused}|${status}|${taskTitle}`;
  if (key === lastKey) return;
  lastKey = key;
  await invoke("update_tray_menu", {
    isOnBreak,
    isTrackingPaused,
    statusLabel: statusDisplayLabel(status),
    taskLabel: taskTitle ?? "No task selected"
  }).catch(console.error);
}

export function startTraySync(): () => void {
  const initial = statusStore.get();
  sync(initial.isOnBreak, initial.isTrackingPaused, initial.status, initial.currentTaskTitle);

  return statusStore.subscribe((s) => {
    sync(s.isOnBreak, s.isTrackingPaused, s.status, s.currentTaskTitle);
  });
}
