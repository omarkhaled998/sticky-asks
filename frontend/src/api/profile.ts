import { apiFetch } from "./api";

export interface UserProfile {
  email: string;
  display_name: string | null;
  created_at: string | null;
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/getProfile");
}

export async function updateProfile(displayName: string): Promise<{ message: string; display_name: string }> {
  return apiFetch<{ message: string; display_name: string }>("/updateProfile", {
    method: "POST",
    body: JSON.stringify({ display_name: displayName })
  });
}
