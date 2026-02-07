import { apiFetch } from "./api";
import { Task } from "../types";

// Start a task (sets started_at)
export async function startTask(taskId: string): Promise<{ message: string; task_id: string }> {
  return apiFetch<{ message: string; task_id: string }>("/startTask", {
    method: "POST",
    body: JSON.stringify({ task_id: taskId })
  });
}

// Close/complete a task (sets closed_at)
export async function closeTask(taskId: string): Promise<{ message: string; task_id: string; turnaround_minutes: number }> {
  return apiFetch<{ message: string; task_id: string; turnaround_minutes: number }>("/closeTask", {
    method: "POST",
    body: JSON.stringify({ task_id: taskId })
  });
}

// Get all tasks for a request
export async function getTasksByRequest(requestId: string): Promise<Task[]> {
  return apiFetch<Task[]>(`/getTasks?request_id=${requestId}`);
}
