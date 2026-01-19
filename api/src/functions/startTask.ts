import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function startTask(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return { status: 401, body: "Unauthorized" };

    // Parse JSON input
    const { task_id } = await request.json() as { task_id: string };

    if (!task_id) return { status: 400, body: "Missing task_id" };

    const pool = await getPool();

    // Optional: check that this task belongs to logged-in user
    const taskCheck = await pool.request()
      .input("task_id", task_id)
      .query(`SELECT t.*, r.to_email 
              FROM Tasks t 
              JOIN Requests r ON r.id = t.request_id
              WHERE t.id = @task_id`);

    if (taskCheck.recordset.length === 0) return { status: 404, body: "Task not found" };

    const task = taskCheck.recordset[0];
    if (task.to_email !== userEmail) return { status: 403, body: "Not authorized for this task" };

    // Update status and started_at
    await pool.request()
      .input("task_id", task_id)
      .query(`UPDATE Tasks SET status='started', started_at=SYSDATETIME() WHERE id=@task_id`);

    return {
      status: 200,
      jsonBody: { message: "Task started", task_id }
    };

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
