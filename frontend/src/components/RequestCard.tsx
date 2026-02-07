import React, { useState } from "react";
import { Request } from "../types";
import { TaskList } from "./TaskList";
import { AddTaskForm } from "./AddTaskForm";
import { closeRequest } from "../api/requests";

interface RequestCardProps {
  request: Request;
  userEmail: string;
  onRequestClosed?: () => void;
}

export function RequestCard({ request, userEmail, onRequestClosed }: RequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");

  const isAssignedToMe = request.to_email.toLowerCase() === userEmail.toLowerCase();
  const isSentByMe = request.from_email.toLowerCase() === userEmail.toLowerCase();

  const handleTaskAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCloseRequest = async () => {
    if (!window.confirm("Are you sure you want to close this request? All remaining tasks will be closed.")) {
      return;
    }
    setClosing(true);
    setError("");
    try {
      await closeRequest(request.id);
      onRequestClosed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close request");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className={`request-card ${request.status === 'closed' ? 'request-closed' : ''}`}>
      <div className="request-header" onClick={() => setExpanded(!expanded)}>
        <div className="request-info">
          {isAssignedToMe ? (
            <div className="request-user">
              <span className="request-direction">From</span>
              <span className="request-name">{request.from_display_name || request.from_email.split('@')[0]}</span>
              <span className="request-email">{request.from_email}</span>
            </div>
          ) : (
            <div className="request-user">
              <span className="request-direction">To</span>
              <span className="request-name">{request.to_email.split('@')[0]}</span>
              <span className="request-email">{request.to_email}</span>
            </div>
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
          {request.status === 'open' && (
            <div className="close-request-section">
              {error && <p className="error-text">{error}</p>}
              <button 
                onClick={handleCloseRequest} 
                disabled={closing}
                className="btn btn-danger"
              >
                {closing ? "Closing..." : "Close Request"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
