import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LocalMention } from "@/lib/local-db/mentions";
import * as notifPlugin from "@tauri-apps/plugin-notification";
import * as webviewWindowMock from "@tauri-apps/api/webviewWindow";

const makeM = (overrides: Partial<LocalMention> = {}): LocalMention => ({
  id: "m1",
  author_name: "alice",
  channel_name: "general",
  message_preview: "hello world",
  deep_link: null,
  guild_id: "guild-1",
  guild_name: "North Star",
  state: "delivered",
  created_at: "2024-01-01T00:00:00Z",
  delivered_at: null,
  read_at: null,
  ...overrides
});

describe("notificationService", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(notifPlugin.isPermissionGranted).mockResolvedValue(true);
    const { _resetRateLimit } = await import("../notification-service");
    _resetRateLimit();
  });

  it("fireSingle — permission granted, no rate limit: sendNotification called", async () => {
    const { notificationService } = await import("../notification-service");
    await notificationService.fireSingle(makeM());
    expect(notifPlugin.sendNotification).toHaveBeenCalledOnce();
    const call = vi.mocked(notifPlugin.sendNotification).mock.calls[0][0] as { title: string; body: string };
    expect(call.title).toContain("alice");
  });

  it("fireSingle — called twice within 5 min: sendNotification called once", async () => {
    const { notificationService } = await import("../notification-service");
    await notificationService.fireSingle(makeM());
    await notificationService.fireSingle(makeM());
    expect(notifPlugin.sendNotification).toHaveBeenCalledOnce();
  });

  it("fireSingle — permission denied: sendNotification not called", async () => {
    vi.mocked(notifPlugin.isPermissionGranted).mockResolvedValue(false);
    vi.mocked(notifPlugin.requestPermission).mockResolvedValue("denied");
    const { notificationService } = await import("../notification-service");
    await notificationService.fireSingle(makeM());
    expect(notifPlugin.sendNotification).not.toHaveBeenCalled();
  });

  it("fireBundle(3) — calls sendNotification with count in title and opens inbox", async () => {
    const { notificationService } = await import("../notification-service");
    await notificationService.fireBundle(3);
    expect(notifPlugin.sendNotification).toHaveBeenCalledOnce();
    const call = vi.mocked(notifPlugin.sendNotification).mock.calls[0][0] as { title: string };
    expect(call.title).toContain("3");
    const win = vi.mocked(webviewWindowMock.getCurrentWebviewWindow)();
    expect(win.show).toHaveBeenCalled();
    expect(win.setFocus).toHaveBeenCalled();
  });

  it("fireBundle(0) — sendNotification not called", async () => {
    const { notificationService } = await import("../notification-service");
    await notificationService.fireBundle(0);
    expect(notifPlugin.sendNotification).not.toHaveBeenCalled();
  });

  it("fireBundle after fireSingle within 5 min: bundle still fires", async () => {
    const { notificationService } = await import("../notification-service");
    await notificationService.fireSingle(makeM());
    vi.clearAllMocks();
    vi.mocked(notifPlugin.isPermissionGranted).mockResolvedValue(true);
    await notificationService.fireBundle(2);
    expect(notifPlugin.sendNotification).toHaveBeenCalledOnce();
  });

  it("message_preview > 100 chars: body truncated to 100", async () => {
    const { notificationService } = await import("../notification-service");
    const longPreview = "a".repeat(200);
    await notificationService.fireSingle(makeM({ message_preview: longPreview }));
    const call = vi.mocked(notifPlugin.sendNotification).mock.calls[0][0] as { body: string };
    expect(call.body.length).toBe(100);
  });
});
