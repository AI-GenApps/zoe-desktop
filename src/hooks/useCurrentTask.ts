import { useState } from "react";
import type { WeeklyTask } from "@/types/protocol";
import { flushHeartbeat } from "@/services/heartbeat";
import { apiFetch } from "@/lib/api-client";

export interface CurrentTaskState {
  currentTask: WeeklyTask | null;
  selectTask: (taskId: string, deviceId?: string) => Promise<void>;
  clearCurrent: (deviceId?: string) => Promise<void>;
  isPending: boolean;
  error: string | null;
}

export function useCurrentTask(): CurrentTaskState {
  const [currentTask, setCurrentTask] = useState<WeeklyTask | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectTask(taskId: string, deviceId?: string) {
    setIsPending(true);
    setError(null);
    try {
      const res = await apiFetch<{ currentTaskId: string; task: WeeklyTask }>(
        `/api/member/weekly-tasks/${taskId}/select`,
        { method: "POST", body: deviceId ? JSON.stringify({ device_id: deviceId }) : undefined }
      );
      setCurrentTask(res.task);
      flushHeartbeat("task_selected").catch(console.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to select task");
    } finally {
      setIsPending(false);
    }
  }

  async function clearCurrent(deviceId?: string) {
    setIsPending(true);
    setError(null);
    try {
      await apiFetch<{ currentTaskId: null }>("/api/member/weekly-tasks/current/clear", {
        method: "POST",
        body: deviceId ? JSON.stringify({ device_id: deviceId }) : undefined
      });
      setCurrentTask(null);
      flushHeartbeat("task_cleared").catch(console.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear task");
    } finally {
      setIsPending(false);
    }
  }

  return { currentTask, selectTask, clearCurrent, isPending, error };
}
