import { listen } from "@tauri-apps/api/event";
import { TRAY_EVENTS } from "@/lib/tray-events";
import { statusStore } from "@/stores/status-store";
import { handleQuit } from "@/lib/quit";
import { stopHeartbeatScheduler } from "@/services/heartbeat";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function registerTrayListeners(): () => void {
  const unlisteners = [
    listen(TRAY_EVENTS.START_BREAK, () => statusStore.startBreak()),
    listen(TRAY_EVENTS.END_BREAK, () => statusStore.endBreak()),
    listen(TRAY_EVENTS.PAUSE_TRACKING, () => statusStore.pauseTracking()),
    listen(TRAY_EVENTS.RESUME_TRACKING, () => statusStore.resumeTracking()),
    listen(TRAY_EVENTS.OPEN_APP, async () => {
      const win = getCurrentWindow();
      await win.unminimize();
      await win.show();
      await win.setFocus();
    }),
    listen(TRAY_EVENTS.QUIT, async () => {
      stopHeartbeatScheduler();
      await handleQuit();
    })
  ];

  return () => {
    unlisteners.forEach((p) => p.then((fn) => fn()));
  };
}
