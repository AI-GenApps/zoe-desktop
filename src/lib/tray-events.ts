export const TRAY_EVENTS = {
  START_BREAK: "tray:start-break",
  END_BREAK: "tray:end-break",
  SELECT_TASK: "tray:select-task",
  OPEN_MENTIONS: "tray:open-mentions",
  PAUSE_TRACKING: "tray:pause-tracking",
  RESUME_TRACKING: "tray:resume-tracking",
  OPEN_APP: "tray:open-app",
  QUIT: "tray:quit"
} as const;

export type TrayEventName = (typeof TRAY_EVENTS)[keyof typeof TRAY_EVENTS];
