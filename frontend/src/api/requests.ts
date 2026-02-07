import { apiFetch } from "./api";
import { Request, CreateRequestPayload, AddTaskPayload } from "../types";

// Get requests sent TO the current user
export async function getMyRequests(): Promise<Request[]> {
  return apiFetch<Request[]>("/getRequests");
}

// Get requests sent BY the current user
export async function getSentRequests(): Promise<Request[]> {
  return apiFetch<Request[]>("/getSentRequests");
}

// Create a new request with tasks
export async function createRequest(payload: CreateRequestPayload): Promise<{ requestId: string }> {
  return apiFetch<{ requestId: string }>("/createRequest", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Add tasks to an existing request
export async function addTaskToRequest(payload: AddTaskPayload): Promise<{ message: string; request_id: string }> {
  return apiFetch<{ message: string; request_id: string }>("/addTaskToRequest", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Get tasks for a specific request
export async function getTasksForRequest(requestId: string): Promise<Request> {
  return apiFetch<Request>(`/getRequestWithTasks?request_id=${requestId}`);
}

// Close a request (available to sender or receiver)
export async function closeRequest(requestId: string): Promise<{ message: string; request_id: string }> {
  return apiFetch<{ message: string; request_id: string }>("/closeRequest", {
    method: "POST",
    body: JSON.stringify({ request_id: requestId })
  });
}
