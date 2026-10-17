import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWeeklyTasks, useCreateTask, useUpdateTask, useDeleteTask } from "./useWeeklyTasks";
import { useCurrentTask } from "@/hooks/useCurrentTask";
import { MondayBanner } from "./MondayBanner";
import { AddTaskForm } from "./AddTaskForm";
import { TaskList } from "./TaskList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

const queryClient = new QueryClient();

export default function WeeklyTasks() {
  return (
    <QueryClientProvider client={queryClient}>
      <WeeklyTasksInner />
    </QueryClientProvider>
  );
}

function WeeklyTasksInner() {
  const [weekStart] = useState(getCurrentWeekStart);
  const [bannerKey, setBannerKey] = useState(0);

  const { data: tasks, isLoading, isError, refetch } = useWeeklyTasks(weekStart);
  const createTask = useCreateTask(weekStart);
  const updateTask = useUpdateTask(weekStart);
  const deleteTask = useDeleteTask(weekStart);
  const currentTaskHook = useCurrentTask();

  useEffect(() => {
    function handleDismiss() {
      setBannerKey((k) => k + 1);
    }
    window.addEventListener("znx-banner-dismiss", handleDismiss);
    return () => window.removeEventListener("znx-banner-dismiss", handleDismiss);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-lg font-semibold">Weekly Tasks</h1>
          <p className="text-xs text-muted-foreground">Week of {weekStart}</p>
        </div>
        {currentTaskHook.currentTask && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
            Focused: <span className="font-medium text-foreground">{currentTaskHook.currentTask.title}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <MondayBanner key={bannerKey} weekStart={weekStart} />

        <AddTaskForm weekStart={weekStart} createTask={createTask} />

        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load tasks.</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {currentTaskHook.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{currentTaskHook.error}</AlertDescription>
          </Alert>
        )}

        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          updateTask={updateTask}
          deleteTask={deleteTask}
          currentTaskHook={currentTaskHook}
        />
      </div>
    </div>
  );
}
