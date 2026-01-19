import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function closeTask(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return { status: 401, body: "Unauthorized" };

    const { task_id } = await request.json() as { task_id: string };
    if (!task_id) return { status: 400, body: "Missing task_id" };

    const pool = await getPool();

    // Check task exists and belongs to user
    const taskCheck = await pool.request()
      .input("task_id", task_id)
      .query(`SELECT t.*, r.to_email 
              FROM Tasks t 
              JOIN Requests r ON r.id = t.request_id
              WHERE t.id = @task_id`);

    if (taskCheck.recordset.length === 0) return { status: 404, body: "Task not found" };
    const task = taskCheck.recordset[0];
    if (task.to_email !== userEmail) return { status: 403, body: "Not authorized" };

    if (!task.started_at) return { status: 400, body: "Task has not been started" };

    // Update status and closed_at
    await pool.request()
      .input("task_id", task_id)
      .query(`UPDATE Tasks SET status='closed', closed_at=SYSDATETIME() WHERE id=@task_id`);

    // Calculate turnaround time in minutes
    const result = await pool.request()
      .input("task_id", task_id)
      .query(`SELECT DATEDIFF(MINUTE, started_at, closed_at) AS turnaround_minutes FROM Tasks WHERE id=@task_id`);

    const turnaround_minutes = result.recordset[0].turnaround_minutes;

    return {
      status: 200,
      jsonBody: { message: "Task closed", task_id, turnaround_minutes }
    };

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