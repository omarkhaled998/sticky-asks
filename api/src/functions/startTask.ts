import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";
import { sendTaskStartedNotification } from "../email/email.js";

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

    // Check that this task belongs to logged-in user (assigned to them)
    const taskCheck = await pool.request()
      .input("task_id", task_id)
      .query(`
        SELECT t.*, r.to_email, u.email AS from_email
        FROM Tasks t 
        JOIN Requests r ON r.id = t.request_id
        LEFT JOIN Users u ON u.id = r.from_user_id
        WHERE t.id = @task_id
      `);

    if (taskCheck.recordset.length === 0) return { status: 404, body: "Task not found" };

    const task = taskCheck.recordset[0];
    
    // Only the assignee (to_email) can start tasks
    if (task.to_email.toLowerCase() !== userEmail.toLowerCase()) {
      return { status: 403, body: "Only the assignee can start tasks" };
    }

    if (task.status !== 'open') {
      return { status: 400, body: "Task is not in open status" };
    }

    // Update status and started_at
    await pool.request()
      .input("task_id", task_id)
      .query(`UPDATE Tasks SET status='started', started_at=SYSDATETIME() WHERE id=@task_id`);

    // Send email notification to task creator if they have an email
    if (task.from_email) {
      const assigneeName = userEmail.split("@")[0];
      sendTaskStartedNotification(
        task.from_email,
        assigneeName,
        userEmail,
        task.title
      ).catch(err => context.log("Email notification failed:", err));
    }

    return {
      status: 200,
      jsonBody: { message: "Task started", task_id }
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: `Internal server error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

app.http("startTask", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: startTask
});
