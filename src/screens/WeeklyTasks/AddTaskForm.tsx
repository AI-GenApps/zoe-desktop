import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useCreateTask } from "./useWeeklyTasks";

interface Props {
  weekStart: string;
  createTask: ReturnType<typeof useCreateTask>;
}

export function AddTaskForm({ weekStart, createTask }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate(
      { title: title.trim(), description: description.trim() || undefined, week_start_date: weekStart },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
        }
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
          disabled={createTask.isPending}
        />
        <Button type="submit" size="sm" disabled={!title.trim() || createTask.isPending}>
          Add
        </Button>
      </div>
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={createTask.isPending}
        className="text-sm"
      />
    </form>
  );
}
