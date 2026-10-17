import type { WeeklyTask } from "@/types/protocol";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskRow } from "./TaskRow";
import type { useUpdateTask, useDeleteTask } from "./useWeeklyTasks";
import type { useCurrentTask } from "@/hooks/useCurrentTask";

interface Props {
  tasks: WeeklyTask[] | undefined;
  isLoading: boolean;
  updateTask: ReturnType<typeof useUpdateTask>;
  deleteTask: ReturnType<typeof useDeleteTask>;
  currentTaskHook: ReturnType<typeof useCurrentTask>;
}

export function TaskList({ tasks, isLoading, updateTask, deleteTask, currentTaskHook }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No tasks yet. Add your first task above.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          updateTask={updateTask}
          deleteTask={deleteTask}
          currentTaskHook={currentTaskHook}
        />
      ))}
    </div>
  );
}
