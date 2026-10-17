import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WeeklyTask, CreateWeeklyTask, UpdateWeeklyTask } from "@/types/protocol";
import { apiFetch } from "@/lib/api-client";

function tasksKey(weekStart: string) {
  return ["weekly-tasks", weekStart] as const;
}

export function useWeeklyTasks(weekStart: string) {
  return useQuery({
    queryKey: tasksKey(weekStart),
    queryFn: () =>
      apiFetch<{ tasks: WeeklyTask[] }>(`/api/member/weekly-tasks?week_start=${weekStart}`).then((r) => r.tasks),
    staleTime: 30_000
  });
}

export function useCreateTask(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWeeklyTask) =>
      apiFetch<{ task: WeeklyTask }>("/api/member/weekly-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      }).then((r) => r.task),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(weekStart) })
  });
}

export function useUpdateTask(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateWeeklyTask }) =>
      apiFetch<{ task: WeeklyTask }>(`/api/member/weekly-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      }).then((r) => r.task),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: tasksKey(weekStart) });
      const previous = qc.getQueryData<WeeklyTask[]>(tasksKey(weekStart));
      qc.setQueryData<WeeklyTask[]>(tasksKey(weekStart), (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(tasksKey(weekStart), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: tasksKey(weekStart) })
  });
}

export function useDeleteTask(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/member/weekly-tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(weekStart) })
  });
}
