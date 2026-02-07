import React from "react";
import { Request } from "../types";
import { RequestCard } from "./RequestCard";

interface RequestListProps {
  requests: Request[];
  userEmail: string;
  title: string;
  emptyMessage: string;
  onRequestClosed?: () => void;
}

export function RequestList({ requests, userEmail, title, emptyMessage, onRequestClosed }: RequestListProps) {
  return (
    <div className="request-list">
      <h3>{title}</h3>
      {requests.length === 0 ? (
        <p className="empty-message">{emptyMessage}</p>
      ) : (
        requests.map((request) => (
          <RequestCard 
            key={request.id} 
            request={request} 
            userEmail={userEmail} 
            onRequestClosed={onRequestClosed}
          />
        ))
      )}
    </div>
  );
}
