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

    // 2️⃣ Get or create user for the sender
    let fromUserResult = await pool.request()
      .input("email", fromEmail)
      .query(`SELECT id FROM Users WHERE email = @email`);
    
    let fromUserId: string;
    if (fromUserResult.recordset.length === 0) {
      // Create user if doesn't exist
      const newUser = await pool.request()
        .input("email", fromEmail)
        .query(`INSERT INTO Users (id, email) OUTPUT INSERTED.id VALUES (NEWID(), @email)`);
      fromUserId = newUser.recordset[0].id;
    } else {
      fromUserId = fromUserResult.recordset[0].id;
    }

    // 3️⃣ Insert request with from_user_id and to_email
    const insertRequestResult = await pool.request()
      .input("from_user_id", fromUserId)
      .input("to_email", to_email)
      .query(`
        INSERT INTO Requests (id, from_user_id, to_email, status, created_at)
        OUTPUT INSERTED.id
        VALUES (NEWID(), @from_user_id, @to_email, 'open', SYSDATETIME())
      `);

    const requestId = insertRequestResult.recordset[0].id;

    // 4️⃣ Insert tasks
    for (const task of tasks) {
      await pool.request()
        .input("request_id", requestId)
        .input("title", task.title)
        .input("priority", task.priority)
        .query(`
          INSERT INTO Tasks (id, request_id, title, priority, status, created_at)
          VALUES (NEWID(), @request_id, @title, @priority, 'open', SYSDATETIME())
        `);
    }

    return {
      status: 201,
      jsonBody: { requestId }
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: `Internal server error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

app.http("createRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createRequest
});
