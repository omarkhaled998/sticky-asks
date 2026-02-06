import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getDb } from "../db/sql";
import { getUserEmail } from "../auth/getUserEmail";

app.http("createRequest", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const fromEmail = getUserEmail(req);
      const { to_email, tasks } = await req.json() as {
        to_email: string;
        tasks: { title: string; priority: number }[];
      };

      const db = await getDb();

      const requestResult = await db.request()
        .input("from", fromEmail)
        .input("to", to_email)
        .query(`
          INSERT INTO Requests (FromEmail, ToEmail)
          OUTPUT INSERTED.Id
          VALUES (@from, @to)
        `);

      const requestId = requestResult.recordset[0].Id;

      for (const task of tasks) {
        await db.request()
          .input("requestId", requestId)
          .input("title", task.title)
          .input("priority", task.priority)
          .query(`
            INSERT INTO Tasks (RequestId, Title, Priority)
            VALUES (@requestId, @title, @priority)
          `);
      }

      return { status: 201 };
    } catch (e: any) {
      return { status: 400, body: e.message };
    }
  }
});
