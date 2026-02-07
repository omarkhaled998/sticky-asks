import React, { useState } from "react";
import { createRequest } from "../api/requests";

interface CreateRequestFormProps {
  onRequestCreated: () => void;
}

interface TaskInput {
  title: string;
  priority: number;
}

export function CreateRequestForm({ onRequestCreated }: CreateRequestFormProps) {
  const [toEmail, setToEmail] = useState("");
  const [tasks, setTasks] = useState<TaskInput[]>([{ title: "", priority: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAddTask = () => {
    setTasks([...tasks, { title: "", priority: 1 }]);
  };

  const handleRemoveTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const handleTaskChange = (index: number, field: keyof TaskInput, value: string | number) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!toEmail.trim()) {
      setError("Recipient email is required");
      return;
    }

    const validTasks = tasks.filter((t) => t.title.trim());
    if (validTasks.length === 0) {
      setError("At least one task is required");
      return;
    }

    setLoading(true);
    try {
      await createRequest({
        to_email: toEmail.trim(),
        tasks: validTasks.map((t) => ({ title: t.title.trim(), priority: t.priority }))
      });
      setToEmail("");
      setTasks([{ title: "", priority: 1 }]);
      setShowForm(false);
      onRequestCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button className="btn btn-primary btn-large" onClick={() => setShowForm(true)}>
        + Add Tasks for Someone
      </button>
    );
  }

  return (
    <div className="create-request-form">
      <h3>Add Tasks</h3>
      <p className="form-hint">Tasks will be added to your existing request with this person, or a new request will be created.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Send to (email):</label>
          <input
            type="email"
            placeholder="recipient@example.com"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="tasks-section">
          <label>Tasks:</label>
          {tasks.map((task, index) => (
            <div key={index} className="task-input-row">
              <input
                type="text"
                placeholder="Task title"
                value={task.title}
                onChange={(e) => handleTaskChange(index, "title", e.target.value)}
                className="form-input task-title-input"
              />
              <select
                value={task.priority}
                onChange={(e) => handleTaskChange(index, "priority", Number(e.target.value))}
                className="form-select priority-select"
              >
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
              </select>
              {tasks.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTask(index)}
                  className="btn btn-remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddTask} className="btn btn-secondary btn-small">
            + Add Another Task
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Adding..." : "Add Tasks"}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="btn btn-cancel">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
