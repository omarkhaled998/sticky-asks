// Types for the Sticky Asks application

export interface Task {
  id: string;
  request_id: string;
  title: string;
  priority: number;
  status: 'open' | 'started' | 'closed';
  created_at: string;
  started_at: string | null;
  closed_at: string | null;
}

export interface Request {
  id: string;
  from_email: string;
  from_display_name: string | null;
  to_email: string;
  status: 'open' | 'closed';
  created_at: string;
  tasks?: Task[];
}

export interface CreateRequestPayload {
  to_email: string;
  tasks: { title: string; priority: number }[];
}

export interface AddTaskPayload {
  request_id: string;
  tasks: { title: string; priority: number }[];
}

export interface UserStats {
  completed_tasks: number;
  avg_turnaround_minutes: number | null;
}

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string; // email
  userRoles: string[];
}
