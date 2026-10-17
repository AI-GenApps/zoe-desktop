import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TRAY_EVENTS, type TrayEventName } from "@/lib/tray-events";

export type TrayEventHandlers = Partial<Record<TrayEventName, () => void>>;

export function useTrayEvents(handlers: TrayEventHandlers) {
  useEffect(() => {
    const defaultHandlers: TrayEventHandlers = {
      [TRAY_EVENTS.OPEN_APP]: async () => {
        const win = getCurrentWindow();
        await win.unminimize();
        await win.show();
        await win.setFocus();
      },
      [TRAY_EVENTS.QUIT]: () => {
        getCurrentWindow().close();
      }
    };

    const merged = { ...defaultHandlers, ...handlers };
    const events = Object.values(TRAY_EVENTS) as TrayEventName[];

    const unlisten = events.map((event) => {
      const handler = merged[event];
      if (!handler) return Promise.resolve(() => {});
      return listen(event, handler);
    });

    return () => {
      unlisten.forEach((p) => p.then((fn) => fn()));
    };
  }, [handlers]);
}
