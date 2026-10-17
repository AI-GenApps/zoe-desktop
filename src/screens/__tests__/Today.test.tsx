import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TaskRow } from "@/types/protocol";
import { afterEach, describe, expect, it, vi } from "vitest";
import Today from "@/screens/Today";

const api = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock("@/lib/api-client", () => ({
  apiFetch: api.fetch,
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      readonly status = 400,
      readonly code?: string
    ) {
      super(message);
    }
  }
}));

function makeTask(): TaskRow {
  return {
    id: "task-guild-2",
    guildId: "guild-2",
    userId: "discord-user-1",
    username: "member",
    threadId: "thread-2",
    date: "2026-09-29",
    channelId: "channel-2",
    messageId: "message-2",
    source: "desktop",
    wfh: true,
    breaks: [],
    followUp: [],
    status: "Pending",
    attendanceType: null,
    followupPostedAt: 0,
    createdAt: Date.now(),
    tasks: []
  };
}

describe("Today", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires an explicit choice among multiple servers and scopes create and detail requests", async () => {
    const task = makeTask();
    api.fetch.mockImplementation((path: string, options?: RequestInit) => {
      if (path === "/api/member/guilds") {
        return Promise.resolve({
          guilds: [
            { id: "guild-1", name: "First server", iconUrl: null },
            { id: "guild-2", name: "Second server", iconUrl: null }
          ]
        });
      }
      if (path === "/api/member/daily-tasks?guild_id=guild-2" && !options?.method) {
        return Promise.resolve({ task: null, tasks: [], date: "2026-09-29" });
      }
      if (path === "/api/member/daily-tasks" && options?.method === "POST") {
        return Promise.resolve({ task, date: task.date });
      }
      if (path === "/api/member/daily-tasks/task-guild-2?guild_id=guild-2") {
        return Promise.resolve({ task, messages: [] });
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const user = userEvent.setup();
    render(<Today />);

    const serverSelect = await screen.findByRole("combobox", { name: "Discord server" });
    expect((serverSelect as HTMLSelectElement).value).toBe("");
    expect(api.fetch).toHaveBeenCalledTimes(1);
    expect(api.fetch.mock.calls[0][0]).toBe("/api/member/guilds");

    await user.selectOptions(serverSelect, "guild-2");
    await screen.findByRole("button", { name: "Create today’s task" });
    await user.click(screen.getByRole("button", { name: "Create today’s task" }));

    await waitFor(() =>
      expect(api.fetch).toHaveBeenCalledWith(
        "/api/member/daily-tasks?guild_id=guild-2",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    );
    const createCall = api.fetch.mock.calls.find(
      ([path, options]) => path === "/api/member/daily-tasks" && options?.method === "POST"
    );
    expect(JSON.parse(createCall?.[1].body as string)).toEqual({ working_from: "WFH", guild_id: "guild-2" });
    expect(api.fetch).toHaveBeenCalledWith(
      "/api/member/daily-tasks/task-guild-2?guild_id=guild-2",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(api.fetch.mock.calls.some(([path]) => path === "/api/member/daily-tasks?guild_id=guild-1")).toBe(false);
  });

  describe("tasks plugin switch", () => {
    const disabledError = async (code = "tasks_plugin_disabled") => {
      const { ApiError } = await import("@/lib/api-client");
      return new ApiError("Task tracking is not enabled on this server.", 409, code);
    };

    it.each(["tasks_plugin_disabled", "tasks_module_disabled"])(
      "shows a disabled state instead of the task form when the server switched tasks off (%s)",
      async (code) => {
        const error = await disabledError(code);
        api.fetch.mockImplementation((path: string) => {
          if (path === "/api/member/guilds") {
            return Promise.resolve({ guilds: [{ id: "guild-1", name: "First server", iconUrl: null }] });
          }
          if (path === "/api/member/daily-tasks?guild_id=guild-1") return Promise.reject(error);
          throw new Error(`Unexpected request: ${path}`);
        });

        render(<Today />);

        expect((await screen.findByRole("status")).textContent).toContain(
          "Task tracking is not enabled on this server."
        );
        expect(screen.queryByRole("button", { name: "Create today’s task" })).toBeNull();
        expect(screen.queryByRole("alert")).toBeNull();
      }
    );

    it("shows the disabled state when creating the task is rejected after a toggle", async () => {
      const error = await disabledError();
      api.fetch.mockImplementation((path: string, options?: RequestInit) => {
        if (path === "/api/member/guilds") {
          return Promise.resolve({ guilds: [{ id: "guild-1", name: "First server", iconUrl: null }] });
        }
        if (path === "/api/member/daily-tasks?guild_id=guild-1") {
          return Promise.resolve({ task: null, tasks: [], date: "2026-09-29" });
        }
        if (path === "/api/member/daily-tasks" && options?.method === "POST") return Promise.reject(error);
        throw new Error(`Unexpected request: ${path}`);
      });
      const user = userEvent.setup();

      render(<Today />);
      await user.click(await screen.findByRole("button", { name: "Create today’s task" }));

      expect((await screen.findByRole("status")).textContent).toContain("Task tracking is not enabled on this server.");
      expect(screen.queryByRole("button", { name: "Create today’s task" })).toBeNull();
    });

    it("clears the disabled state when another server is chosen, and other errors still use the alert", async () => {
      const error = await disabledError();
      api.fetch.mockImplementation((path: string) => {
        if (path === "/api/member/guilds") {
          return Promise.resolve({
            guilds: [
              { id: "guild-1", name: "First server", iconUrl: null },
              { id: "guild-2", name: "Second server", iconUrl: null }
            ]
          });
        }
        if (path === "/api/member/daily-tasks?guild_id=guild-1") return Promise.reject(error);
        if (path === "/api/member/daily-tasks?guild_id=guild-2") {
          return Promise.resolve({ task: null, tasks: [], date: "2026-09-29" });
        }
        throw new Error(`Unexpected request: ${path}`);
      });
      const user = userEvent.setup();

      render(<Today />);
      const select = await screen.findByRole("combobox", { name: "Discord server" });
      await user.selectOptions(select, "guild-1");
      expect((await screen.findByRole("status")).textContent).toContain("Task tracking is not enabled on this server.");

      await user.selectOptions(select, "guild-2");
      expect(await screen.findByRole("button", { name: "Create today’s task" })).toBeTruthy();
      expect(screen.queryByText("Task tracking is not enabled on this server.")).toBeNull();
    });

    it("still shows the normal task form for a server that runs tasks", async () => {
      api.fetch.mockImplementation((path: string) => {
        if (path === "/api/member/guilds") {
          return Promise.resolve({ guilds: [{ id: "guild-1", name: "First server", iconUrl: null }] });
        }
        if (path === "/api/member/daily-tasks?guild_id=guild-1") {
          return Promise.resolve({ task: null, tasks: [], date: "2026-09-29" });
        }
        throw new Error(`Unexpected request: ${path}`);
      });

      render(<Today />);

      expect(await screen.findByRole("button", { name: "Create today’s task" })).toBeTruthy();
      expect(screen.queryByRole("status", { name: /not enabled/ })).toBeNull();
    });
  });
});
