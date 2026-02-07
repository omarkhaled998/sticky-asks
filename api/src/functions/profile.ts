import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../db.js";
import { getUserInfo } from "../auth/auth.js";

export async function updateProfile(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userInfo = getUserInfo(request);
    if (!userInfo) return { status: 401, body: "Unauthorized" };

    const { display_name } = await request.json() as { display_name: string };

    if (!display_name || typeof display_name !== 'string' || display_name.trim().length === 0) {
      return { status: 400, body: "Display name is required" };
    }

    const trimmedName = display_name.trim().substring(0, 100); // Max 100 chars

    const pool = await getPool();

    // Update or insert user with display name
    const existingUser = await pool.request()
      .input("email", userInfo.email)
      .query(`SELECT id FROM Users WHERE email = @email`);

    if (existingUser.recordset.length === 0) {
      // Create user
      await pool.request()
        .input("email", userInfo.email)
        .input("display_name", trimmedName)
        .query(`INSERT INTO Users (id, email, display_name, created_at) VALUES (NEWID(), @email, @display_name, SYSDATETIME())`);
    } else {
      // Update user
      await pool.request()
        .input("email", userInfo.email)
        .input("display_name", trimmedName)
        .query(`UPDATE Users SET display_name = @display_name WHERE email = @email`);
    }

    return {
      status: 200,
      jsonBody: { message: "Profile updated", display_name: trimmedName }
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: `Internal server error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function getProfile(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userInfo = getUserInfo(request);
    if (!userInfo) return { status: 401, body: "Unauthorized" };

    const pool = await getPool();

    const result = await pool.request()
      .input("email", userInfo.email)
      .query(`SELECT email, display_name, created_at FROM Users WHERE email = @email`);

    if (result.recordset.length === 0) {
      return {
        status: 200,
        jsonBody: { 
          email: userInfo.email, 
          display_name: userInfo.displayName, 
          created_at: null 
        }
      };
    }

    return {
      status: 200,
      jsonBody: result.recordset[0]
    };

  } catch (err) {
    context.error(err);
    return { status: 500, body: `Internal server error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

app.http("updateProfile", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "updateProfile",
  handler: updateProfile
});

app.http("getProfile", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "getProfile",
  handler: getProfile
});
