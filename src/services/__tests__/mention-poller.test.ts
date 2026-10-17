import { describe, it, expect, vi, beforeEach } from "vitest";

const dbExecute = vi.fn().mockResolvedValue(undefined);
const dbSelect = vi.fn();

vi.mock("@/lib/local-db/db", () => ({
  getDb: async () => ({ execute: dbExecute, select: dbSelect })
}));

vi.mock("@tauri-apps/plugin-sql", () => ({
  default: { load: vi.fn() }
}));

const mockStatus = { isOnBreak: false };
vi.mock("@/stores/status-store", () => ({
  statusStore: { get: () => mockStatus }
}));

const breakEndHandlers: (() => void)[] = [];
vi.mock("@/lib/app-events", () => ({
  appEvents: {
    on: vi.fn((event: string, handler: () => void) => {
      if (event === "break:ended") breakEndHandlers.push(handler);
      return () => {};
    }),
    emit: vi.fn()
  }
}));

global.fetch = vi.fn();

const fireSingle = vi.fn().mockResolvedValue(undefined);
const fireBundle = vi.fn().mockResolvedValue(undefined);
const notificationService = { fireSingle, fireBundle };

const makeMention = (id = "m1") => ({
  id,
  discord_message_id: "dm1",
  state: "pending",
  created_at: 1000000,
  author_id: "u1",
  author_username: "alice",
  channel_id: "ch1",
  message_preview: "hello",
  deep_link: "discord://...",
  guild_id: "guild-1",
  guild_name: "North Star",
  timestamp: 1000000
});

function setupFetch(mentions: ReturnType<typeof makeMention>[]) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => ({ mentions })
  });
}

function setupCursor(sinceId: string | null) {
  dbSelect.mockImplementation((sql: string) => {
    if (sql.includes("mention_poller_cursor")) return Promise.resolve([{ since_id: sinceId }]);
    if (sql.includes("local_mentions")) return Promise.resolve([]);
    return Promise.resolve([]);
  });
}

describe("MentionPoller", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    breakEndHandlers.length = 0;
    mockStatus.isOnBreak = false;
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
    dbSelect.mockReset();
    dbExecute.mockReset().mockResolvedValue(undefined);
    const { mentionPoller } = await import("../mention-poller");
    mentionPoller.setNotificationService(notificationService);
  });

  it("normal poll: ack called, fireSingle called, cursor updated", async () => {
    setupFetch([makeMention("m1")]);
    setupCursor(null);

    const { MentionPoller } = await import("../mention-poller");
    const poller = new MentionPoller();
    poller.setNotificationService(notificationService);
    poller.start();
    await new Promise((r) => setTimeout(r, 50));
    poller.stop();

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    const ackCall = calls.find((c: unknown[]) => (c[0] as string).includes("/ack"));
    expect(ackCall).toBeTruthy();
    expect(fireSingle).toHaveBeenCalledOnce();
    const updateCall = dbExecute.mock.calls.find((c: unknown[]) =>
      (c[0] as string).includes("UPDATE mention_poller_cursor")
    );
    expect(updateCall).toBeTruthy();
  });

  it("poll while on break: ack NOT called, fireSingle NOT called, local state = queued", async () => {
    mockStatus.isOnBreak = true;
    setupFetch([makeMention("m2")]);
    setupCursor(null);

    const { MentionPoller } = await import("../mention-poller");
    const poller = new MentionPoller();
    poller.setNotificationService(notificationService);
    poller.start();
    await new Promise((r) => setTimeout(r, 50));
    poller.stop();

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const ackCall = calls.find((c: unknown[]) => (c[0] as string).includes("/ack"));
    expect(ackCall).toBeUndefined();
    expect(fireSingle).not.toHaveBeenCalled();

    const upsertCall = dbExecute.mock.calls.find((c: unknown[]) =>
      (c[0] as string).includes("INSERT OR REPLACE INTO local_mentions")
    );
    expect(Array.isArray(upsertCall?.[1])).toBe(true);
    expect((upsertCall?.[1] as unknown[]).includes("queued")).toBe(true);
    expect(upsertCall?.[1] as unknown[]).toContain("guild-1");
    expect(upsertCall?.[1] as unknown[]).toContain("North Star");
  });

  it("break:ended with 3 queued: fireBundle(3) called, all acked as delivered", async () => {
    const queued = [makeMention("q1"), makeMention("q2"), makeMention("q3")].map((m) => ({
      ...m,
      state: "queued",
      author_name: "alice",
      channel_name: "ch1",
      delivered_at: null,
      read_at: null,
      created_at: "2024-01-01T00:00:00.000Z"
    }));
    dbSelect.mockResolvedValue(queued);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({}) });

    const { MentionPoller } = await import("../mention-poller");
    const poller = new MentionPoller();
    poller.setNotificationService(notificationService);
    poller.start();
    await new Promise((r) => setTimeout(r, 10));

    breakEndHandlers.forEach((h) => h());
    await new Promise((r) => setTimeout(r, 50));
    poller.stop();

    expect(fireBundle).toHaveBeenCalledWith(3);
    const ackCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter((c: unknown[]) =>
      (c[0] as string).includes("/ack")
    );
    expect(ackCalls.length).toBe(3);
  });

  it("break:ended with 0 queued: fireBundle NOT called", async () => {
    dbSelect.mockResolvedValue([]);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ mentions: [] }) });

    const { MentionPoller } = await import("../mention-poller");
    const poller = new MentionPoller();
    poller.setNotificationService(notificationService);
    poller.start();
    await new Promise((r) => setTimeout(r, 10));

    breakEndHandlers.forEach((h) => h());
    await new Promise((r) => setTimeout(r, 50));
    poller.stop();

    expect(fireBundle).not.toHaveBeenCalled();
  });

  it("poll API error: logged, no crash, cursor not updated", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));
    setupCursor(null);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { MentionPoller } = await import("../mention-poller");
    const poller = new MentionPoller();
    poller.setNotificationService(notificationService);
    poller.start();
    await new Promise((r) => setTimeout(r, 50));
    poller.stop();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[mention-poller]"), expect.any(Error));
    const updateCall = dbExecute.mock.calls.find((c: unknown[]) =>
      (c[0] as string).includes("UPDATE mention_poller_cursor")
    );
    expect(updateCall).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it("empty response: cursor unchanged, no notifications", async () => {
    setupFetch([]);
    setupCursor("prev-id");

    const { MentionPoller } = await import("../mention-poller");
    const poller = new MentionPoller();
    poller.setNotificationService(notificationService);
    poller.start();
    await new Promise((r) => setTimeout(r, 50));
    poller.stop();

    expect(fireSingle).not.toHaveBeenCalled();
    const updateCall = dbExecute.mock.calls.find((c: unknown[]) =>
      (c[0] as string).includes("UPDATE mention_poller_cursor")
    );
    expect(updateCall).toBeUndefined();
  });
});
