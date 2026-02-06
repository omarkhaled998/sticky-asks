import React, { useState } from "react";
import { addTaskToRequest } from "../api/requests";

interface AddTaskFormProps {
  requestId: string;
  onTaskAdded: () => void;
}

export function AddTaskForm({ requestId, onTaskAdded }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addTaskToRequest({
        request_id: requestId,
        tasks: [{ title: title.trim(), priority }]
      });
      setTitle("");
      setPriority(1);
      setShowForm(false);
      onTaskAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
        + Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="add-task-form">
      <div className="form-group">
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label>Priority:</label>
        <select
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="form-select"
        >
          <option value={1}>Low</option>
          <option value={2}>Medium</option>
          <option value={3}>High</option>
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="form-actions">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Adding..." : "Add Task"}
        </button>
        <button type="button" onClick={() => setShowForm(false)} className="btn btn-cancel">
          Cancel
        </button>
      </div>
    </form>
  );
}
