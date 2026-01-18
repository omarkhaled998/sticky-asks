import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function startTask(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const taskId = req.query.get("taskId");
    if (!taskId) return { status: 400, body: "Missing taskId" };

    // Logged-in user
    const userEmail = getUserEmail(req);
    if (!userEmail) return { status: 401, body: "Unauthorized" };

    const pool = await getPool();

    // Ensure the task belongs to the current user
    const verify = await pool.request()
      .input("taskId", taskId)
      .input("email", userEmail)
      .query(`
        SELECT t.id
        FROM Tasks t
        JOIN Requests r ON t.request_id = r.id
        WHERE t.id = @taskId AND r.to_email = @email
      `);

    if (verify.recordset.length === 0) return { status: 403, body: "Forbidden" };

    await pool.request()
      .input("taskId", taskId)
      .query(`
        UPDATE Tasks
        SET status = 'started', started_at = SYSDATETIME()
        WHERE id = @taskId
      `);

    return { status: 200, body: "Task started" };

  } catch (err) {
    context.error(err);
    return { status: 500, body: "Internal server error" };
  }
}

app.http("startTask", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: startTask
});
