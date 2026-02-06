import React, { useState } from "react";
import { Task } from "../types";
import { startTask, closeTask } from "../api/tasks";

interface TaskItemProps {
  task: Task;
  onTaskUpdated: () => void;
  isAssignedToMe: boolean;
}

export function TaskItem({ task, onTaskUpdated, isAssignedToMe }: TaskItemProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      await startTask(task.id);
      onTaskUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start task");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setLoading(true);
    setError("");
    try {
      await closeTask(task.id);
      onTaskUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close task");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Low";
      case 2: return "Medium";
      case 3: return "High";
      default: return "Normal";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "open": return "badge badge-open";
      case "started": return "badge badge-started";
      case "closed": return "badge badge-closed";
      default: return "badge";
    }
  };

  return (
    <div className="task-item">
      <div className="task-header">
        <span className="task-title">{task.title}</span>
        <span className={getStatusBadgeClass(task.status)}>{task.status}</span>
      </div>
      <div className="task-meta">
        <span className="task-priority">Priority: {getPriorityLabel(task.priority)}</span>
        <span className="task-date">Created: {new Date(task.created_at).toLocaleDateString()}</span>
      </div>
      {task.started_at && (
        <div className="task-meta">
          <span>Started: {new Date(task.started_at).toLocaleString()}</span>
        </div>
      )}
      {task.completed_at && (
        <div className="task-meta">
          <span>Completed: {new Date(task.completed_at).toLocaleString()}</span>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
      {isAssignedToMe && (
        <div className="task-actions">
          {task.status === "open" && (
            <button onClick={handleStart} disabled={loading} className="btn btn-primary">
              {loading ? "Starting..." : "Start Task"}
            </button>
          )}
          {task.status === "started" && (
            <button onClick={handleClose} disabled={loading} className="btn btn-success">
              {loading ? "Completing..." : "Complete Task"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
