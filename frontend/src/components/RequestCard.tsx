import React, { useState } from "react";
import { Request } from "../types";
import { TaskList } from "./TaskList";
import { AddTaskForm } from "./AddTaskForm";

interface RequestCardProps {
  request: Request;
  userEmail: string;
}

export function RequestCard({ request, userEmail }: RequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isAssignedToMe = request.to_email.toLowerCase() === userEmail.toLowerCase();
  const isSentByMe = request.from_email.toLowerCase() === userEmail.toLowerCase();

  const handleTaskAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className={`request-card ${request.status === 'closed' ? 'request-closed' : ''}`}>
      <div className="request-header" onClick={() => setExpanded(!expanded)}>
        <div className="request-info">
          {isAssignedToMe ? (
            <span className="request-label">From: <strong>{request.from_email}</strong></span>
          ) : (
            <span className="request-label">To: <strong>{request.to_email}</strong></span>
          )}
          <span className={`badge badge-${request.status}`}>{request.status}</span>
        </div>
        <div className="request-meta">
          <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
          <span className="expand-icon">{expanded ? "▼" : "▶"}</span>
        </div>
      </div>

      {expanded && (
        <div className="request-body">
          <TaskList
            requestId={request.id}
            isAssignedToMe={isAssignedToMe}
            refreshTrigger={refreshTrigger}
          />
          {isSentByMe && request.status === 'open' && (
            <div className="add-task-section">
              <AddTaskForm requestId={request.id} onTaskAdded={handleTaskAdded} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
