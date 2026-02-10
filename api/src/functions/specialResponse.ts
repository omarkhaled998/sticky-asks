import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getUserEmail } from "../auth/auth.js";
import { sendEmail, isEmailEnabled } from "../email/email.js";

// Configuration - who can see the special prompt and who gets notified
const TARGET_EMAILS = [
  "smsaahk@gmail.com",
  "omarsaad@microsoft.com",
];
const NOTIFY_EMAIL = "omarkhaled98@hotmail.com";
const APP_URL = process.env.APP_URL || "https://gentle-forest-01e6b6010.azurestaticapps.net";

export async function specialResponse(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userEmail = getUserEmail(request);
    if (!userEmail) return { status: 401, body: "Unauthorized" };

    // Only the target emails can respond
    const isTargetEmail = TARGET_EMAILS.some(
      email => userEmail.toLowerCase() === email.toLowerCase()
    );
    if (!isTargetEmail) {
      return { status: 403, body: "Not authorized" };
    }

    const { response } = await request.json() as { response: "yes" | "no" };
    
    if (response !== "yes" && response !== "no") {
      return { status: 400, body: "Invalid response" };
    }

    const now = new Date();
    const formattedTime = now.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC"
    });

    // Send notification email
    if (isEmailEnabled()) {
      const emoji = response === "yes" ? "🎉💕" : "😢";
      const subject = response === "yes" 
        ? "🎉 She said YES to dinner!" 
        : "😢 She said no... (but keep trying!)";
      
      const textContent = response === "yes"
        ? `Great news! She said YES to dinner!\n\nResponse received at: ${formattedTime} UTC\n\nTime to plan that perfect evening! 💑`
        : `She said no to dinner.\n\nResponse received at: ${formattedTime} UTC\n\nDon't give up! Try again later. 💪`;

      const htmlContent = response === "yes"
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
            <h1 style="color: #e91e63;">${emoji} She Said YES! ${emoji}</h1>
            <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; border-radius: 16px; margin: 20px 0;">
              <p style="font-size: 24px; color: #333;">Time to plan that perfect dinner!</p>
              <p style="font-size: 18px; color: #666;">Response received at:<br><strong>${formattedTime} UTC</strong></p>
            </div>
            <p style="font-size: 48px;">💑🌹🍽️</p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
            <h1 style="color: #666;">${emoji} She said no...</h1>
            <div style="background: #f5f5f5; padding: 30px; border-radius: 16px; margin: 20px 0;">
              <p style="font-size: 18px; color: #666;">Response received at:<br><strong>${formattedTime} UTC</strong></p>
            </div>
            <p style="font-size: 20px; color: #333;">Don't give up! Try again later. 💪</p>
          </div>
        `;

      await sendEmail({
        to: NOTIFY_EMAIL,
        subject,
        text: textContent,
        html: htmlContent,
      });
    }

    console.log(`Special response received: ${response} from ${userEmail} at ${formattedTime}`);

    return {
      status: 200,
      jsonBody: { success: true, response }
    };
  } catch (error) {
    context.error("Error in specialResponse:", error);
    return { status: 500, body: "Internal server error" };
  }
}

app.http("specialResponse", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "special-response",
  handler: specialResponse,
});
