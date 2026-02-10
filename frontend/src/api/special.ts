export async function sendSpecialResponse(response: "yes" | "no"): Promise<void> {
  const res = await fetch("/api/special-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ response }),
  });

  if (!res.ok) {
    throw new Error("Failed to send response");
  }
}
