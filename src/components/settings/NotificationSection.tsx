import { useState, useEffect } from "react";
import { checkAndRequestPermission, getCachedPermission } from "@/lib/notifications/permission";
import { fireNotification } from "@/lib/notifications/notify";

type PermState = "granted" | "denied" | "not_requested";

export function NotificationSection() {
  const [permState, setPermState] = useState<PermState>("not_requested");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getCachedPermission().then((granted) => {
      setPermState(granted ? "granted" : "not_requested");
    });
  }, []);

  async function handleTest() {
    const granted = await checkAndRequestPermission();
    setPermState(granted ? "granted" : "denied");
    if (granted) {
      await fireNotification("Test", "Notifications are working.", "test");
    } else {
      setMessage("Notifications are denied. Please enable them in your OS settings.");
    }
  }

  const stateLabel: Record<PermState, string> = {
    granted: "Granted",
    denied: "Denied",
    not_requested: "Not yet requested"
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Notification permission</p>
          <p className="text-xs text-muted-foreground">{stateLabel[permState]}</p>
        </div>
        <button
          type="button"
          onClick={handleTest}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          Test notification
        </button>
      </div>
      {message && <p className="text-sm text-destructive">{message}</p>}
    </div>
  );
}
