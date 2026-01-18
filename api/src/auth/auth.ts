import { HttpRequest } from "@azure/functions";

export function getUserEmail(request: HttpRequest): string | null {
  // Azure production
  const directEmail = request.headers.get("x-ms-client-principal-email");
  if (directEmail) return directEmail;

  // Local SWA + fallback
  const principal = request.headers.get("x-ms-client-principal");
  if (!principal) return null;

  try {
    const decoded = Buffer.from(principal, "base64").toString("utf-8");
    const clientPrincipal = JSON.parse(decoded);
    return clientPrincipal?.userDetails ?? null;
  } catch {
    return null;
  }
}
