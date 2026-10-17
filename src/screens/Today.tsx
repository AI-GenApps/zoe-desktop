import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TaskRow } from "@/types/protocol";
import { Building2, Home, Send } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type Guild = { id: string; name: string; iconUrl: string | null };
type Message = { role: "user" | "assistant" | "system"; content: string; timestamp: number };
type DailyResponse = { task: TaskRow | null; tasks: TaskRow[]; date: string };

/** The server switched the tasks plugin off: today's task is unavailable there (weekly personal tasks stay). */
const TASKS_DISABLED_MESSAGE = "Task tracking is not enabled on this server.";

/** Error code of the 409 answer when the tasks plugin is off. */
const TASKS_PLUGIN_DISABLED_CODE = "tasks_plugin_disabled";
/** @deprecated Pre-rename spelling that servers which predate the rename still send; accepted until they are gone. */
const LEGACY_TASKS_MODULE_DISABLED_CODE = "tasks_module_disabled";

function isTasksPluginDisabled(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === TASKS_PLUGIN_DISABLED_CODE || error.code === LEGACY_TASKS_MODULE_DISABLED_CODE)
  );
}

function taskItems(task: TaskRow): string[] {
  return task.tasks.filter((item): item is string => typeof item === "string");
}

export default function Today() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [data, setData] = useState<DailyResponse | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [workingFrom, setWorkingFrom] = useState<"WFH" | "Office">("WFH");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasksDisabled, setTasksDisabled] = useState(false);
  const controllersRef = useRef(new Set<AbortController>());

  const loadTask = useCallback(async (taskId: string, selectedGuildId: string, signal: AbortSignal) => {
    const detail = await apiFetch<{ task: TaskRow; messages: Message[] }>(
      `/api/member/daily-tasks/${encodeURIComponent(taskId)}?guild_id=${encodeURIComponent(selectedGuildId)}`,
      { signal }
    );
    if (!signal.aborted) setMessages(detail.messages ?? []);
  }, []);

  const loadGuildTasks = useCallback(
    async (selectedGuildId: string) => {
      const controller = new AbortController();
      controllersRef.current.add(controller);
      setLoading(true);
      setError(null);
      setTasksDisabled(false);
      setData(null);
      setMessages([]);
      setContent("");
      try {
        const result = await apiFetch<DailyResponse>(
          `/api/member/daily-tasks?guild_id=${encodeURIComponent(selectedGuildId)}`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        setData(result);
        if (result.task) await loadTask(result.task.id, selectedGuildId, controller.signal);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          if (isTasksPluginDisabled(loadError)) setTasksDisabled(true);
          else setError(loadError instanceof ApiError ? loadError.message : "Unable to load today’s task.");
        }
      } finally {
        controllersRef.current.delete(controller);
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [loadTask]
  );

  useEffect(() => {
    const controller = new AbortController();
    controllersRef.current.add(controller);
    apiFetch<{ guilds: Guild[] }>("/api/member/guilds", { signal: controller.signal })
      .then(({ guilds: eligibleGuilds }) => {
        if (controller.signal.aborted) return;
        setGuilds(eligibleGuilds);
        if (eligibleGuilds.length === 1) {
          const onlyGuild = eligibleGuilds[0];
          setGuildId(onlyGuild.id);
          void loadGuildTasks(onlyGuild.id);
        } else {
          setLoading(false);
        }
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof ApiError ? loadError.message : "Unable to load Discord servers.");
          setLoading(false);
        }
      })
      .finally(() => controllersRef.current.delete(controller));

    return () => {
      for (const activeController of controllersRef.current) activeController.abort();
      controllersRef.current.clear();
    };
  }, [loadGuildTasks]);

  function cancelActiveRequests() {
    for (const controller of controllersRef.current) controller.abort();
    controllersRef.current.clear();
  }

  function selectGuild(nextGuildId: string) {
    cancelActiveRequests();
    setGuildId(nextGuildId);
    setData(null);
    setMessages([]);
    setContent("");
    setBusy(false);
    setError(null);
    setTasksDisabled(false);
    if (nextGuildId) void loadGuildTasks(nextGuildId);
    else setLoading(false);
  }

  const task = data?.task ?? null;
  const selectedGuild = guilds.find((guild) => guild.id === guildId);
  const composerLabel = useMemo(() => {
    if (!task || task.tasks.length === 0) return "Submit plan";
    return task.followUp.length > 0 ? "Submit follow-up" : "Send update";
  }, [task]);

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!guildId || busy) return;
    const selectedGuildId = guildId;
    const controller = new AbortController();
    controllersRef.current.add(controller);
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{ task: TaskRow; date: string }>("/api/member/daily-tasks", {
        method: "POST",
        headers: { "x-task-source": "desktop" },
        body: JSON.stringify({ working_from: workingFrom, guild_id: selectedGuildId }),
        signal: controller.signal
      });
      if (controller.signal.aborted) return;
      setData((current) => ({
        task: result.task,
        tasks: [result.task, ...(current?.tasks ?? [])],
        date: result.date
      }));
      await loadTask(result.task.id, selectedGuildId, controller.signal);
    } catch (createError) {
      if (!controller.signal.aborted) {
        if (isTasksPluginDisabled(createError)) setTasksDisabled(true);
        else setError(createError instanceof ApiError ? createError.message : "Unable to create today’s task.");
      }
    } finally {
      controllersRef.current.delete(controller);
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!task || !guildId || !content.trim() || busy) return;
    const selectedGuildId = guildId;
    const controller = new AbortController();
    controllersRef.current.add(controller);
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{ task: TaskRow; messages: Message[] }>(
        `/api/member/daily-tasks/${encodeURIComponent(task.id)}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ guild_id: selectedGuildId, content: content.trim() }),
          signal: controller.signal
        }
      );
      if (controller.signal.aborted) return;
      setData((current) => (current && result.task ? { ...current, task: result.task } : current));
      setMessages(result.messages ?? []);
      setContent("");
    } catch (messageError) {
      if (!controller.signal.aborted) {
        if (isTasksPluginDisabled(messageError)) setTasksDisabled(true);
        else setError(messageError instanceof ApiError ? messageError.message : "Unable to process the message.");
      }
    } finally {
      controllersRef.current.delete(controller);
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  if (loading && guilds.length === 0)
    return <div className="p-6 text-sm text-muted-foreground">Loading Discord servers…</div>;

  return (
    <div className="space-y-5 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Guild workspace{data?.date ? ` · Today ${data.date}` : ""}</p>
        <h1 className="text-xl font-semibold">Daily task</h1>
        <p className="text-sm text-muted-foreground">Create one daily task for the selected Discord server.</p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {guilds.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          No Discord servers are available. Manage your Discord connection in your personal web Profile.
        </div>
      ) : (
        <label className="block max-w-xl space-y-1 text-sm">
          <span className="font-medium">Discord server</span>
          {guilds.length === 1 ? (
            <span className="flex h-10 items-center gap-2 rounded-md border bg-card px-3">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold"
              >
                {(selectedGuild?.name ?? selectedGuild?.id ?? "D").slice(0, 1).toUpperCase()}
              </span>
              {selectedGuild?.name ?? selectedGuild?.id}
            </span>
          ) : (
            <select
              className="h-10 w-full rounded-md border bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Discord server"
              value={guildId}
              onChange={(event) => selectGuild(event.target.value)}
            >
              <option value="">Choose a Discord server</option>
              {guilds.map((guild) => (
                <option key={guild.id} value={guild.id}>
                  {guild.name}
                </option>
              ))}
            </select>
          )}
        </label>
      )}

      {guildId && tasksDisabled ? (
        <div role="status" className="max-w-xl space-y-1 rounded-lg border border-dashed p-5 text-sm">
          <p className="font-medium">{TASKS_DISABLED_MESSAGE}</p>
          <p className="text-muted-foreground">
            An admin of {selectedGuild?.name ?? "this server"} turned daily task tracking off. Your personal weekly
            tasks are not affected.
          </p>
        </div>
      ) : null}
      {guildId && loading ? (
        <div role="status" className="text-sm text-muted-foreground">
          Loading this server’s task…
        </div>
      ) : null}
      {guildId && !loading && !task && !tasksDisabled ? (
        <form onSubmit={createTask} className="max-w-xl space-y-4 rounded-lg border bg-card p-5">
          <h2 className="font-medium">Start today’s task</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={workingFrom === "WFH" ? "default" : "outline"}
              onClick={() => setWorkingFrom("WFH")}
            >
              <Home size={16} /> WFH
            </Button>
            <Button
              type="button"
              variant={workingFrom === "Office" ? "default" : "outline"}
              onClick={() => setWorkingFrom("Office")}
            >
              <Building2 size={16} /> Office
            </Button>
          </div>
          <Button type="submit" disabled={busy || !guildId}>
            Create today’s task
          </Button>
        </form>
      ) : null}

      {task && !tasksDisabled && (
        <div className="max-w-3xl space-y-4 rounded-lg border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">
                {task.date} {task.wfh ? "· WFH" : "· Office"}
              </h2>
              <p className="text-sm text-muted-foreground">{taskItems(task).length} planned item(s)</p>
            </div>
            <Badge variant={task.status === "Completed" ? "secondary" : "default"}>{task.status}</Badge>
          </div>
          {messages.length > 0 && (
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-3">
              {messages.map((message) => (
                <div
                  key={`${message.timestamp}-${message.role}-${message.content}`}
                  className={message.role === "assistant" ? "rounded-md bg-muted p-3 text-sm" : "text-sm"}
                >
                  <p className="mb-1 text-xs uppercase text-muted-foreground">{message.role}</p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>
          )}
          {task.status === "Pending" ? (
            <form onSubmit={sendMessage} className="space-y-2">
              <label htmlFor="desktop-daily-message" className="text-sm font-medium">
                {composerLabel}
              </label>
              <textarea
                id="desktop-daily-message"
                className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={
                  task.tasks.length === 0
                    ? "List the work you plan to complete today…"
                    : "Share an update or your end-of-day follow-up…"
                }
                disabled={busy}
              />
              <Button type="submit" disabled={busy || !content.trim()}>
                <Send size={16} /> {busy ? "Processing…" : composerLabel}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">This task is complete and no longer accepts messages.</p>
          )}
        </div>
      )}
    </div>
  );
}
