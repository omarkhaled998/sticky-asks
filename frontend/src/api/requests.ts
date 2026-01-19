export interface Request {
  id: string;
  to_email: string;
  status: string;
  created_at: string;
}

export async function getRequests(): Promise<Request[]> {
  const res = await fetch("/api/getRequests");

  if (!res.ok) {
    throw new Error("Failed to fetch requests");
  }

  return res.json();
}
