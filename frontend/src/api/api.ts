const API_BASE = "/api";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `API error ${res.status}`);
  }

  return res.json();
}
