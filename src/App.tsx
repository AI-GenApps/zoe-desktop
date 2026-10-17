import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { listen } from "@tauri-apps/api/event";
import { AuthProvider } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { router } from "@/router";
import { startHeartbeatScheduler, stopHeartbeatScheduler } from "@/services/heartbeat";
import { handleQuit } from "@/lib/quit";
import { registerTrayListeners } from "@/lib/tray-listener";
import { startTraySync } from "@/lib/tray-sync";
import { startFlushWorker } from "@/lib/sync-queue/flushWorker";
import { checkAndRequestPermission } from "@/lib/notifications/permission";
import { getLocalSetting } from "@/lib/local-db/settings";

export default function App() {
  useEffect(() => {
    startHeartbeatScheduler();
    startFlushWorker();
    const stopTraySync = startTraySync();
    const removeTrayListeners = registerTrayListeners();

    getLocalSetting("notification_permission").then((cached) => {
      if (!cached) checkAndRequestPermission();
    });

    const unlisten = listen("tauri://close-requested", async () => {
      stopHeartbeatScheduler();
      await handleQuit();
    });

    return () => {
      stopHeartbeatScheduler();
      stopTraySync();
      removeTrayListeners();
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  );
}
