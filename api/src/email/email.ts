import { EmailClient } from "@azure/communication-email";

// ============================================================
// EMAIL FEATURE FLAG
// Set EMAIL_ENABLED=true in Azure Application Settings to enable
// ============================================================
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";

// Check if email feature is enabled
export function isEmailEnabled(): boolean {
  return EMAIL_ENABLED;
}

// Azure Communication Services Email configuration
const ACS_CONNECTION_STRING = process.env.ACS_CONNECTION_STRING;
const FROM_EMAIL = process.env.FROM_EMAIL || "DoNotReply@yourDomain.azurecomm.net";
const APP_URL = process.env.APP_URL || "https://gentle-forest-01e6b6010.azurestaticapps.net";

let emailClient: EmailClient | null = null;
if (ACS_CONNECTION_STRING) {
  emailClient = new EmailClient(ACS_CONNECTION_STRING);
}

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Check feature flag first
  if (!EMAIL_ENABLED) {
    console.log("Email feature disabled (EMAIL_ENABLED != true), skipping:", params.subject);
    return false;
  }

  if (!emailClient || !ACS_CONNECTION_STRING) {
    console.log("Azure Communication Services Email not configured, skipping:", params.subject);
    return false;
  }

  try {
    const message = {
      senderAddress: FROM_EMAIL,
      recipients: {
        to: [{ address: params.to }],
      },
      content: {
        subject: params.subject,
        plainText: params.text,
        html: params.html,
      },
    };

    const poller = await emailClient.beginSend(message);
    const result = await poller.pollUntilDone();
    
    if (result.status === "Succeeded") {
      console.log(`Email sent to ${params.to}: ${params.subject}`);
      return true;
    } else {
      console.error("Email send failed with status:", result.status);
      return false;
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Email templates

export async function sendNewTasksNotification(
  toEmail: string,
  fromName: string,
  fromEmail: string,
  taskCount: number,
  taskTitles: string[]
): Promise<boolean> {
  const taskList = taskTitles.map(t => `• ${t}`).join("\n");
  const taskListHtml = taskTitles.map(t => `<li>${t}</li>`).join("");

  return sendEmail({
    to: toEmail,
    subject: `📌 ${fromName} assigned you ${taskCount} new task${taskCount > 1 ? 's' : ''}`,
    text: `Hi,

${fromName} (${fromEmail}) has assigned you ${taskCount} new task${taskCount > 1 ? 's' : ''}:

${taskList}

View and manage your tasks at: ${APP_URL}

- BuddyTask`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0078d4;">📌 New Tasks Assigned</h2>
        <p><strong>${fromName}</strong> (${fromEmail}) has assigned you ${taskCount} new task${taskCount > 1 ? 's' : ''}:</p>
        <ul style="background: #f5f5f5; padding: 15px 30px; border-radius: 8px;">
          ${taskListHtml}
        </ul>
        <p><a href="${APP_URL}" style="display: inline-block; background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Tasks</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">- BuddyTask</p>
      </div>
    `,
  });
}

export async function sendTaskStartedNotification(
  toEmail: string,
  assigneeName: string,
  assigneeEmail: string,
  taskTitle: string
): Promise<boolean> {
  return sendEmail({
    to: toEmail,
    subject: `✅ ${assigneeName} started working on: ${taskTitle}`,
    text: `Hi,

${assigneeName} (${assigneeEmail}) has started working on the task:

"${taskTitle}"

View progress at: ${APP_URL}

- BuddyTask`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">✅ Task Started</h2>
        <p><strong>${assigneeName}</strong> (${assigneeEmail}) has started working on:</p>
        <div style="background: #f5f5f5; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #28a745;">
          <strong>${taskTitle}</strong>
        </div>
        <p><a href="${APP_URL}" style="display: inline-block; background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Progress</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">- BuddyTask</p>
      </div>
    `,
  });
}

export async function sendTaskCompletedNotification(
  toEmail: string,
  assigneeName: string,
  assigneeEmail: string,
  taskTitle: string,
  turnaroundMinutes: number
): Promise<boolean> {
  const timeText = turnaroundMinutes < 60 
    ? `${turnaroundMinutes} minute${turnaroundMinutes !== 1 ? 's' : ''}`
    : `${Math.round(turnaroundMinutes / 60 * 10) / 10} hour${turnaroundMinutes >= 120 ? 's' : ''}`;

  return sendEmail({
    to: toEmail,
    subject: `🎉 ${assigneeName} completed: ${taskTitle}`,
    text: `Hi,

Great news! ${assigneeName} (${assigneeEmail}) has completed the task:

"${taskTitle}"

Completed in: ${timeText}

View details at: ${APP_URL}

- BuddyTask`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🎉 Task Completed!</h2>
        <p><strong>${assigneeName}</strong> (${assigneeEmail}) has completed:</p>
        <div style="background: #d4edda; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #28a745;">
          <strong>${taskTitle}</strong>
          <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">⏱ Completed in ${timeText}</p>
        </div>
        <p><a href="${APP_URL}" style="display: inline-block; background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Details</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">- BuddyTask</p>
      </div>
    `,
  });
}
