import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getDb } from "../db/sql";
import { getUserEmail } from "../auth/getUserEmail";

app.http("getRequests", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const email = getUserEmail(req);
      const db = await getDb();

      const result = await db.request()
        .input("email", email)
        .query(`
          SELECT r.Id, r.ToEmail, r.CreatedAt
          FROM Requests r
          WHERE r.FromEmail = @email OR r.ToEmail = @email
          ORDER BY r.CreatedAt DESC
        `);

      return {
        status: 200,
        jsonBody: result.recordset
      };
    } catch (e: any) {
      return { status: 401, body: e.message };
    }
  }
});
