import { ClientPrincipal } from "../types";

export async function getUser(): Promise<ClientPrincipal | null> {
  try {
    const res = await fetch("/.auth/me", {
      credentials: "include"
    });

    if (!res.ok) return null;

    const data = await res.json();

    return data?.clientPrincipal ?? null;
  } catch {
    return null;
  }
}
