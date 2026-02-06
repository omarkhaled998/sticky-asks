import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function createRequest(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // 1️⃣ Get logged-in user
    const fromEmail = getUserEmail(request);
    if (!fromEmail) return { status: 401, body: "Unauthorized" };

    const { to_email, tasks } = await request.json() as {
      to_email: string;
      tasks: { title: string; priority: number }[];
    };

    if (!to_email || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return { status: 400, body: "Invalid input" };
    }

    const pool = await getPool();

    // 2️⃣ Insert request with from_email and to_email
    const insertRequestResult = await pool.request()
      .input("from_email", fromEmail)
      .input("to_email", to_email)
      .query(`
        INSERT INTO Requests (from_email, to_email, status)
        OUTPUT INSERTED.id
        VALUES (@from_email, @to_email, 'open')
      `);

    const requestId = insertRequestResult.recordset[0].id;

    // 3️⃣ Insert tasks
    for (const task of tasks) {
      await pool.request()
        .input("request_id", requestId)
        .input("title", task.title)
        .input("priority", task.priority)
        .query(`
          INSERT INTO Tasks (request_id, title, priority, status)
          VALUES (@request_id, @title, @priority, 'open')
        `);
    }

    return {
      status: 201,
      jsonBody: { requestId }
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: "Internal server error" };
  }
}

app.http("createRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createRequest
});
