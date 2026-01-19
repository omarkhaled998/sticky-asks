import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function addTaskToRequest(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // 1️⃣ Get logged-in user
    const userEmail = getUserEmail(request);
    if (!userEmail) return { status: 401, body: "Unauthorized" };

    // 2️⃣ Parse JSON body with type assertion
    const { request_id, tasks } = await request.json() as {
      request_id: string;
      tasks: { title: string; priority: number }[];
    };

    // 3️⃣ Validate input
    if (!request_id || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return { status: 400, body: "Invalid input" };
    }

    const pool = await getPool();

    // 4️⃣ Verify request exists
    const requestCheck = await pool.request()
      .input("request_id", request_id)
      .query(`SELECT * FROM Requests WHERE id = @request_id`);

    if (requestCheck.recordset.length === 0) {
      return { status: 404, body: "Request not found" };
    }

    // Optional: check authorization (sender or receiver)
    const reqRow = requestCheck.recordset[0];
    if (reqRow.from_user_id !== null && reqRow.to_email !== userEmail && reqRow.from_user_id !== reqRow.to_user_id) {
      return { status: 403, body: "You are not allowed to add tasks to this request" };
    }

    // 5️⃣ Insert tasks
    for (const task of tasks) {
      await pool.request()
        .input("request_id", request_id)
        .input("title", task.title)
        .input("priority", task.priority)
        .query(`
          INSERT INTO Tasks (request_id, title, priority, status)
          VALUES (@request_id, @title, @priority, 'not_started')
        `);
    }

    // ✅ Return proper JSON
    return {
      status: 201,
      jsonBody: { message: `${tasks.length} task(s) added to request.`, request_id }
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: "Internal server error" };
  }
}

// Export HTTP trigger
app.http("addTaskToRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: addTaskToRequest
});
