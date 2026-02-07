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

    // 3️⃣ Check if a request already exists between sender and receiver
    const existingRequest = await pool.request()
      .input("from_user_id", fromUserId)
      .input("to_email", to_email)
      .query(`
        SELECT id, status FROM Requests 
        WHERE from_user_id = @from_user_id AND to_email = @to_email
      `);

    let requestId: string;
    let isNewRequest = false;

    if (existingRequest.recordset.length > 0) {
      // Use existing request
      requestId = existingRequest.recordset[0].id;
      
      // Reopen the request if it was closed
      if (existingRequest.recordset[0].status === 'closed') {
        await pool.request()
          .input("request_id", requestId)
          .query(`UPDATE Requests SET status = 'open' WHERE id = @request_id`);
      }
    } else {
      // Create new request
      const insertRequestResult = await pool.request()
        .input("from_user_id", fromUserId)
        .input("to_email", to_email)
        .query(`
          INSERT INTO Requests (id, from_user_id, to_email, status, created_at)
          OUTPUT INSERTED.id
          VALUES (NEWID(), @from_user_id, @to_email, 'open', SYSDATETIME())
        `);
      requestId = insertRequestResult.recordset[0].id;
      isNewRequest = true;
    }

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
      jsonBody: { requestId, isNewRequest, tasksAdded: tasks.length }
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
