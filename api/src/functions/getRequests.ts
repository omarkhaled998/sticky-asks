import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js"

export async function getRequests(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {

  try {

    context.log("DB_SERVER:", process.env.DB_SERVER);
    context.log("DB_NAME:", process.env.DB_NAME);
    context.log("DB_USER:", process.env.DB_USER);
    context.log("DB_PASSWORD exists:", !!process.env.DB_PASSWORD);

    const userEmail = request.headers.get("x-ms-client-principal-email");

    if (!userEmail) {
      return {
        status: 401,
        body: "Unauthorized"
      };
    }

    const pool = await getPool();
    const result = await pool.request()
      .input("email", userEmail)
      .query(`
        SELECT *
        FROM Requests
        WHERE to_email = @email
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

app.http("getRequests", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getRequests
});
