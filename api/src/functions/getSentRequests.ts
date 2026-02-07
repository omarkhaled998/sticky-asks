import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserEmail } from "../auth/auth.js";

export async function getSentRequests(
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

    const pool = await getPool();
    
    // Get requests sent BY the current user (find user_id first, then join)
    const result = await pool.request()
      .input("email", userEmail)
      .query(`
        SELECT 
          r.id,
          u.email AS from_email,
          r.to_email,
          r.status,
          r.created_at
        FROM Requests r
        LEFT JOIN Users u ON u.id = r.from_user_id
        WHERE u.email = @email
        ORDER BY r.created_at DESC
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

app.http("getSentRequests", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getSentRequests
});
