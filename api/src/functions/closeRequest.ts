import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function closeRequest(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return { status: 401, body: "Unauthorized" };

    const { request_id } = await request.json() as { request_id: string };
    if (!request_id) return { status: 400, body: "Missing request_id" };

    const pool = await getPool();

    // Check request exists and user has permission (sender or receiver)
    const requestCheck = await pool.request()
      .input("request_id", request_id)
      .query(`
        SELECT r.*, u.email AS from_email
        FROM Requests r
        LEFT JOIN Users u ON u.id = r.from_user_id
        WHERE r.id = @request_id
      `);

    if (requestCheck.recordset.length === 0) {
      return { status: 404, body: "Request not found" };
    }

    const req = requestCheck.recordset[0];

    // Only sender or receiver can close the request
    const isSender = req.from_email?.toLowerCase() === userEmail.toLowerCase();
    const isReceiver = req.to_email?.toLowerCase() === userEmail.toLowerCase();

    if (!isSender && !isReceiver) {
      return { status: 403, body: "Only the sender or receiver can close this request" };
    }

    if (req.status === 'closed') {
      return { status: 400, body: "Request is already closed" };
    }

    // Close the request
    await pool.request()
      .input("request_id", request_id)
      .query(`UPDATE Requests SET status = 'closed' WHERE id = @request_id`);

    // Optionally close all open tasks as well
    await pool.request()
      .input("request_id", request_id)
      .query(`UPDATE Tasks SET status = 'closed', closed_at = SYSDATETIME() WHERE request_id = @request_id AND status != 'closed'`);

    return {
      status: 200,
      jsonBody: { message: "Request closed successfully", request_id }
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: `Internal server error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

app.http("closeRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "closeRequest",
  handler: closeRequest
});
