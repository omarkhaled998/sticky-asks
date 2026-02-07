import { HttpRequest } from "@azure/functions";

interface UserInfo {
  email: string;
  displayName: string | null;
}

export function getUserEmail(request: HttpRequest): string | null {
  const userInfo = getUserInfo(request);
  return userInfo?.email ?? null;
}

export function getUserInfo(request: HttpRequest): UserInfo | null {
  // Azure production - direct headers
  const directEmail = request.headers.get("x-ms-client-principal-email");
  const directName = request.headers.get("x-ms-client-principal-name");
  if (directEmail) {
    return { email: directEmail, displayName: directName };
  }

  // Local SWA + fallback - decode the principal
  const principal = request.headers.get("x-ms-client-principal");
  if (!principal) return null;

  try {
    const decoded = Buffer.from(principal, "base64").toString("utf-8");
    const clientPrincipal = JSON.parse(decoded);
    
    // Extract display name from claims if available
    let displayName: string | null = null;
    if (clientPrincipal.claims) {
      const nameClaim = clientPrincipal.claims.find(
        (c: { typ: string; val: string }) => 
          c.typ === "name" || 
          c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      );
      displayName = nameClaim?.val ?? null;
    }

    const email = clientPrincipal?.userDetails ?? null;
    if (!email) return null;

    return { email, displayName };
  } catch {
    return null;
  }
}
