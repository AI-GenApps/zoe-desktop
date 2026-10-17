import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";

vi.mock("@/lib/local-db/mentions", () => ({
  getAllMentionsLocal: vi.fn().mockResolvedValue([]),
  markMentionRead: vi.fn().mockResolvedValue(undefined),
  markMentionDismissed: vi.fn().mockResolvedValue(undefined),
  cacheMentions: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("@/lib/app-events", () => ({
  appEvents: {
    on: vi.fn().mockReturnValue(() => {}),
    emit: vi.fn()
  }
}));

import { useMentions } from "../useMentions";
import MentionsInbox from "../index";
import { EmptyState } from "../EmptyState";
import { MentionCard } from "../MentionCard";
import * as localDb from "@/lib/local-db/mentions";
import type { LocalMention } from "@/lib/local-db/mentions";

const makeM = (overrides: Partial<LocalMention> = {}): LocalMention => ({
  id: "m1",
  author_name: "alice",
  channel_name: "general",
  message_preview: "hello world",
  deep_link: "discord://discord.com/channels/@me/ch1/msg1",
  guild_id: "guild-1",
  guild_name: "North Star",
  state: "delivered",
  created_at: "2024-01-01T00:00:00Z",
  delivered_at: null,
  read_at: null,
  ...overrides
});

global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mentions: [] }) });

describe("EmptyState", () => {
  it("renders heading and body", () => {
    render(<EmptyState />);
    expect(screen.getByText("No mentions yet")).toBeTruthy();
    expect(screen.getByText(/You'll be notified/)).toBeTruthy();
  });
});

describe("MentionCard", () => {
  it("renders author, channel, preview", () => {
    const onAck = vi.fn();
    render(<MentionCard mention={makeM()} onAck={onAck} />);
    expect(screen.getByText("@alice")).toBeTruthy();
    expect(screen.getByText("#general")).toBeTruthy();
    expect(screen.getByText("hello world")).toBeTruthy();
    expect(screen.getByText("North Star")).toBeTruthy();
  });

  it("shows queued badge for queued state", () => {
    render(<MentionCard mention={makeM({ state: "queued" })} onAck={vi.fn()} />);
    expect(screen.getByText("queued")).toBeTruthy();
  });

  it("calls onAck with read when Mark as read clicked", () => {
    const onAck = vi.fn();
    render(<MentionCard mention={makeM()} onAck={onAck} />);
    fireEvent.click(screen.getByText("Mark as read"));
    expect(onAck).toHaveBeenCalledWith("m1", "read");
  });

  it("calls onAck with dismissed when Dismiss clicked", () => {
    const onAck = vi.fn();
    render(<MentionCard mention={makeM()} onAck={onAck} />);
    fireEvent.click(screen.getByText("Dismiss"));
    expect(onAck).toHaveBeenCalledWith("m1", "dismissed");
  });

  it("calls shell.open when Open in Discord clicked", async () => {
    const { open } = await import("@tauri-apps/plugin-shell");
    render(<MentionCard mention={makeM()} onAck={vi.fn()} />);
    fireEvent.click(screen.getByText("Open in Discord"));
    await waitFor(() => expect(open).toHaveBeenCalledWith("discord://discord.com/channels/@me/ch1/msg1"));
  });
});

describe("MentionsInbox screen", () => {
  beforeEach(() => {
    vi.mocked(localDb.getAllMentionsLocal).mockResolvedValue([]);
    vi.mocked(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ mentions: [] })
    });
  });

  it("renders EmptyState when no mentions", async () => {
    render(<MentionsInbox />);
    await waitFor(() => expect(screen.getByText("No mentions yet")).toBeTruthy());
  });

  it("renders correct sections for queued + delivered + read", async () => {
    vi.mocked(localDb.getAllMentionsLocal).mockResolvedValue([
      makeM({ id: "q1", state: "queued", author_name: "bob" }),
      makeM({ id: "u1", state: "delivered", author_name: "carol" }),
      makeM({ id: "r1", state: "read", author_name: "dave" })
    ]);
    render(<MentionsInbox />);
    await waitFor(() => expect(screen.getByText(/Queued while on break/)).toBeTruthy());
    expect(screen.getByText("Unread")).toBeTruthy();
    expect(screen.getByText("Read")).toBeTruthy();
  });

  it("caches source server details from the account-wide mentions response", async () => {
    vi.mocked(localDb.cacheMentions).mockClear();
    vi.mocked(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        mentions: [
          {
            id: "server-mention",
            state: "delivered",
            created_at: 1_000,
            author_id: "user-1",
            author_username: "alice",
            channel_id: "channel-1",
            message_preview: "hello",
            deep_link: "discord://discord.com/channels/guild-1/channel-1/message-1",
            guild_id: "guild-1",
            guild_name: "North Star"
          }
        ]
      })
    });
    render(<MentionsInbox />);

    await waitFor(() =>
      expect(localDb.cacheMentions).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "server-mention",
          guild_id: "guild-1",
          guild_name: "North Star",
          deep_link: "discord://discord.com/channels/guild-1/channel-1/message-1"
        })
      ])
    );
  });

  it("mentionsUpdated event triggers re-render", async () => {
    const { appEvents } = await import("@/lib/app-events");
    let capturedHandler: (() => void) | undefined;
    vi.mocked(appEvents.on).mockImplementation((_evt: unknown, handler: unknown) => {
      capturedHandler = handler as () => void;
      return () => {};
    });

    vi.mocked(localDb.getAllMentionsLocal)
      .mockResolvedValueOnce([])
      .mockResolvedValue([makeM({ id: "new1", state: "delivered", author_name: "new-user" })]);

    render(<MentionsInbox />);
    await waitFor(() => expect(screen.getByText("No mentions yet")).toBeTruthy());

    await act(async () => {
      capturedHandler?.();
    });
    await waitFor(() => expect(screen.getByText("@new-user")).toBeTruthy());
  });
});
