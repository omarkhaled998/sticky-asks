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
    
    // Get requests sent BY the current user
    const result = await pool.request()
      .input("email", userEmail)
      .query(`
        SELECT 
          id,
          from_email,
          to_email,
          status,
          created_at,
          closed_at
        FROM Requests
        WHERE from_email = @email
        ORDER BY created_at DESC
      `);

    return {
      status: 200,
      jsonBody: result.recordset
    };

  } catch (err) {
    context.error(err);
    return {
      status: 500,
      body: "Internal server error"
    };
  }
}

app.http("getSentRequests", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getSentRequests
});
