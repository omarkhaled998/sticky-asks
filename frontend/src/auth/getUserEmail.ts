import { HttpRequest } from "@azure/functions";

type ClientPrincipal = {
  userDetails?: string;
};

export function getUserEmail(req: HttpRequest): string {
  const principalHeader = req.headers.get("x-ms-client-principal");
  if (!principalHeader) {
    throw new Error("Unauthenticated");
  }

  const decoded = Buffer.from(principalHeader, "base64").toString("utf-8");
  const principal = JSON.parse(decoded) as ClientPrincipal;

  if (!principal.userDetails) {
    throw new Error("User email not found");
  }

  return principal.userDetails.toLowerCase();
}
