import { apiFetch } from "./api";
import { UserStats } from "../types";

export async function getUserStats(): Promise<UserStats> {
  return apiFetch<UserStats>("/getUserStats");
}
