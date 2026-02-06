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

    // Check task exists and belongs to user (assigned to them)
    const taskCheck = await pool.request()
      .input("task_id", task_id)
      .query(`
        SELECT t.*, r.to_email, r.from_email
        FROM Tasks t 
        JOIN Requests r ON r.id = t.request_id
        WHERE t.id = @task_id
      `);

    if (taskCheck.recordset.length === 0) return { status: 404, body: "Task not found" };
    
    const task = taskCheck.recordset[0];
    
    // Only the assignee (to_email) can complete tasks
    if (task.to_email.toLowerCase() !== userEmail.toLowerCase()) {
      return { status: 403, body: "Only the assignee can complete tasks" };
    }

    if (task.status !== 'started') {
      return { status: 400, body: "Task must be started before it can be completed" };
    }

    // Update status and completed_at
    await pool.request()
      .input("task_id", task_id)
      .query(`UPDATE Tasks SET status='closed', completed_at=SYSDATETIME() WHERE id=@task_id`);

    // Calculate turnaround time in minutes
    const result = await pool.request()
      .input("task_id", task_id)
      .query(`SELECT DATEDIFF(MINUTE, started_at, completed_at) AS turnaround_minutes FROM Tasks WHERE id=@task_id`);

    const turnaround_minutes = result.recordset[0].turnaround_minutes;

    return {
      status: 200,
      jsonBody: { message: "Task completed", task_id, turnaround_minutes }
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: `Internal server error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

app.http("closeTask", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: closeTask
});