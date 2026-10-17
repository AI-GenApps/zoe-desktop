import { syncQueue, registerFlushTrigger, type SyncEvent } from "./SyncQueue";
import { apiFetch, ApiError } from "@/lib/api-client";
const POLL_INTERVAL_MS = 60_000;
const BATCH_SIZE = 50;

let timerId: ReturnType<typeof setTimeout> | null = null;

async function dispatchEvent(event: SyncEvent): Promise<void> {
  const payload = JSON.parse(event.payload) as Record<string, unknown>;
  const body = { ...payload, client_event_id: event.client_event_id };
  let url: string;
  let method = "POST";

  switch (event.event_type) {
    case "heartbeat":
      url = "/api/member/heartbeat";
      break;
    case "mention_ack":
      url = `/api/member/mentions/${payload["id"] as string}/ack`;
      break;
    case "task_select":
      url = `/api/member/weekly-tasks/${payload["id"] as string}/select`;
      break;
    case "task_clear":
      url = "/api/member/weekly-tasks/current/clear";
      break;
    case "task_create":
      url = "/api/member/weekly-tasks";
      break;
    case "task_update":
      method = "PATCH";
      url = `/api/member/weekly-tasks/${payload["id"] as string}`;
      break;
    default:
      throw new Error(`Unknown event_type: ${event.event_type}`);
  }

  try {
    await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json", "X-Idempotency-Key": event.client_event_id },
      body: JSON.stringify(body)
    });
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      throw Object.assign(error, { nonRetryable: true });
    }
    throw error;
  }
}

async function flushCycle(): Promise<void> {
  if (!navigator.onLine) return;

  const events = await syncQueue.peek(BATCH_SIZE);
  for (const event of events) {
    try {
      await dispatchEvent(event);
      await syncQueue.markSucceeded(event.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const forceFail = err instanceof Error && (err as Error & { nonRetryable?: boolean }).nonRetryable === true;
      await syncQueue.markFailed(event.id, msg, forceFail);
    }
  }
}

function scheduleNext(): void {
  timerId = setTimeout(async () => {
    await flushCycle();
    scheduleNext();
  }, POLL_INTERVAL_MS);
}

export function startFlushWorker(): void {
  if (timerId !== null) return;

  registerFlushTrigger(() => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    flushCycle()
      .then(() => scheduleNext())
      .catch(() => scheduleNext());
  });

  scheduleNext();
}

export function stopFlushWorker(): void {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

export function triggerFlush(): void {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  flushCycle()
    .then(() => scheduleNext())
    .catch(() => scheduleNext());
}
