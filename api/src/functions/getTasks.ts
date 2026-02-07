import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function getTasks(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userEmail = getUserEmail(request);

    if (!userEmail) {
      return {
        status: 401,
        body: "Unauthorized"
      };
    }

    // Get request_id from query params
    const requestId = request.query.get("request_id");
    
    if (!requestId) {
      return {
        status: 400,
        body: "Missing request_id parameter"
      };
    }

    const pool = await getPool();
    
    // First verify the user has access to this request
    const requestCheck = await pool.request()
      .input("request_id", requestId)
      .input("email", userEmail)
      .query(`
        SELECT r.id FROM Requests r
        LEFT JOIN Users u ON u.id = r.from_user_id
        WHERE r.id = @request_id 
          AND (u.email = @email OR r.to_email = @email)
      `);

    if (requestCheck.recordset.length === 0) {
      return {
        status: 403,
        body: "You don't have access to this request"
      };
    }

    // Get all tasks for the request
    const result = await pool.request()
      .input("request_id", requestId)
      .query(`
        SELECT 
          id,
          request_id,
          title,
          priority,
          status,
          created_at,
          started_at,
          closed_at
        FROM Tasks
        WHERE request_id = @request_id
        ORDER BY priority DESC, created_at ASC
      `);

    return {
      status: 200,
      jsonBody: result.recordset
    };

  } catch (err) {
    context.error(err);
    return {
      status: 500,
      body: `Internal server error: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

app.http("getTasks", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getTasks
});
