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

    // 2️⃣ Get from_user_id and optional to_user_id
    const fromUserResult = await pool.request()
      .input("email", fromEmail)
      .query("SELECT id FROM Users WHERE email = @email");

    if (fromUserResult.recordset.length === 0) {
      return { status: 404, body: "From user not found" };
    }

    const fromUserId = fromUserResult.recordset[0].id;

    const toUserResult = await pool.request()
      .input("email", to_email)
      .query("SELECT id FROM Users WHERE email = @email");

    const toUserId = toUserResult.recordset.length > 0
      ? toUserResult.recordset[0].id
      : null;

    // 3️⃣ Insert request
    const insertRequestResult = await pool.request()
      .input("from_user_id", fromUserId)
      .input("to_user_id", toUserId)
      .input("to_email", to_email)
      .query(`
        INSERT INTO Requests (from_user_id, to_user_id, to_email, status)
        OUTPUT INSERTED.id
        VALUES (@from_user_id, @to_user_id, @to_email, 'pending')
      `);

    const requestId = insertRequestResult.recordset[0].id;

    // 4️⃣ Insert tasks
    for (const task of tasks) {
      await pool.request()
        .input("request_id", requestId)
        .input("title", task.title)
        .input("priority", task.priority)
        .query(`
          INSERT INTO Tasks (request_id, title, priority, status)
          VALUES (@request_id, @title, @priority, 'not_started')
        `);
    }

            // After inserting the request

        return {
        status: 201,
        jsonBody: { requestId }  // <--- use jsonBody, not body
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
