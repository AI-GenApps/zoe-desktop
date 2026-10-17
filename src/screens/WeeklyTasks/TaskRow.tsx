import { useState, useRef, useEffect } from "react";
import type { WeeklyTask } from "@/types/protocol";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import type { useUpdateTask, useDeleteTask } from "./useWeeklyTasks";
import type { useCurrentTask } from "@/hooks/useCurrentTask";

const STATUS_BADGE_VARIANT: Record<WeeklyTask["status"], "default" | "secondary" | "destructive" | "outline"> = {
  planned: "outline",
  active: "default",
  done: "secondary",
  dropped: "destructive"
};

interface Props {
  task: WeeklyTask;
  updateTask: ReturnType<typeof useUpdateTask>;
  deleteTask: ReturnType<typeof useDeleteTask>;
  currentTaskHook: ReturnType<typeof useCurrentTask>;
}

export function TaskRow({ task, updateTask, deleteTask, currentTaskHook }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function saveEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask.mutate({ id: task.id, patch: { title: trimmed } });
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") {
      setEditValue(task.title);
      setEditing(false);
    }
  }

  const isDone = task.status === "done" || task.status === "dropped";
  const isCurrentTask = currentTaskHook.currentTask?.id === task.id;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/30">
      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm"
          />
        ) : (
          <span
            className={`cursor-pointer text-sm font-medium truncate ${isDone ? "line-through text-muted-foreground" : ""}`}
            onDoubleClick={() => !isDone && setEditing(true)}
            title="Double-click to edit"
          >
            {task.title}
          </span>
        )}
        {task.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>}
      </div>

      <Badge variant={STATUS_BADGE_VARIANT[task.status]} className="shrink-0 capitalize text-xs">
        {task.status}
      </Badge>

      {!isDone && (
        <Button
          variant={isCurrentTask ? "secondary" : "outline"}
          size="sm"
          className="shrink-0 text-xs"
          onClick={() => (isCurrentTask ? currentTaskHook.clearCurrent() : currentTaskHook.selectTask(task.id))}
          disabled={currentTaskHook.isPending}
        >
          {isCurrentTask ? "Clear" : "Focus"}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
            <span className="text-base leading-none">⋮</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isDone && (
            <>
              <DropdownMenuItem onClick={() => updateTask.mutate({ id: task.id, patch: { status: "done" } })}>
                Mark as done
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateTask.mutate({ id: task.id, patch: { status: "dropped" } })}>
                Drop task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => deleteTask.mutate(task.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
