import React, { useState, useEffect, useCallback } from "react";
import { Task } from "../types";
import { getTasksByRequest } from "../api/tasks";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  requestId: string;
  isAssignedToMe: boolean;
  refreshTrigger?: number;
}

export function TaskList({ requestId, isAssignedToMe, refreshTrigger }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTasksByRequest(requestId);
      setTasks(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, refreshTrigger]);

  if (loading) return <div className="loading">Loading tasks...</div>;
  if (error) return <p className="error-text">{error}</p>;
  if (tasks.length === 0) return <p className="no-tasks">No tasks yet</p>;

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onTaskUpdated={loadTasks}
          isAssignedToMe={isAssignedToMe}
        />
      ))}
    </div>
  );
}
