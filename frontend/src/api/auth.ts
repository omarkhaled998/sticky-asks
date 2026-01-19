export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string; // email
  userRoles: string[];
}

export async function getUser(): Promise<ClientPrincipal | null> {
  const res = await fetch("/.auth/me");

  if (!res.ok) return null;

  const data = await res.json();

  return data?.clientPrincipal ?? null;
}
