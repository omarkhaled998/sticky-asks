import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function closeTask(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const taskId = req.query.get("taskId");
    if (!taskId) return { status: 400, body: "Missing taskId" };

    const userEmail = req.headers.get("x-ms-client-principal-email");
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
        SET status = 'closed', closed_at = SYSDATETIME()
        WHERE id = @taskId
      `);

    return { status: 200, body: "Task closed" };

  } catch (err) {
    context.error(err);
    return { status: 500, body: "Internal server error" };
  }
}

app.http("closeTask", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: closeTask
});
