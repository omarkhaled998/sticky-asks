import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function getUserStats(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return { status: 401, body: "Unauthorized" };

    const pool = await getPool();
    const result = await pool.request()
      .input("userEmail", userEmail)
      .query(`
        SELECT 
          COUNT(*) AS completed_tasks,
          AVG(DATEDIFF(MINUTE, started_at, closed_at)) AS avg_turnaround_minutes
        FROM Tasks t
        JOIN Requests r ON r.id = t.request_id
        WHERE r.to_email = @userEmail AND t.status='closed'
      `);

    return {
      status: 200,
      jsonBody: result.recordset[0]
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: "Internal server error" };
  }
}

app.http("getUserStats", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getUserStats
});
