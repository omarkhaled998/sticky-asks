import sgMail from "@sendgrid/mail";

// ============================================================
// EMAIL FEATURE FLAG
// Set EMAIL_ENABLED=true in Azure Application Settings to enable
// ============================================================
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";

// Check if email feature is enabled
export function isEmailEnabled(): boolean {
  return EMAIL_ENABLED;
}

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@stickyasks.com";
const APP_URL = process.env.APP_URL || "https://gentle-forest-01e6b6010.azurestaticapps.net";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
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

  if (!SENDGRID_API_KEY) {
    console.log("SendGrid not configured, skipping email:", params.subject);
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: FROM_EMAIL,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent to ${params.to}: ${params.subject}`);
    return true;
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

- Sticky Asks`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0078d4;">📌 New Tasks Assigned</h2>
        <p><strong>${fromName}</strong> (${fromEmail}) has assigned you ${taskCount} new task${taskCount > 1 ? 's' : ''}:</p>
        <ul style="background: #f5f5f5; padding: 15px 30px; border-radius: 8px;">
          ${taskListHtml}
        </ul>
        <p><a href="${APP_URL}" style="display: inline-block; background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Tasks</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">- Sticky Asks</p>
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

- Sticky Asks`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">✅ Task Started</h2>
        <p><strong>${assigneeName}</strong> (${assigneeEmail}) has started working on:</p>
        <div style="background: #f5f5f5; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #28a745;">
          <strong>${taskTitle}</strong>
        </div>
        <p><a href="${APP_URL}" style="display: inline-block; background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Progress</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">- Sticky Asks</p>
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

- Sticky Asks`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🎉 Task Completed!</h2>
        <p><strong>${assigneeName}</strong> (${assigneeEmail}) has completed:</p>
        <div style="background: #d4edda; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #28a745;">
          <strong>${taskTitle}</strong>
          <p style="margin: 10px 0 0 0; color: #155724; font-size: 14px;">⏱ Completed in ${timeText}</p>
        </div>
        <p><a href="${APP_URL}" style="display: inline-block; background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Details</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">- Sticky Asks</p>
      </div>
    `,
  });
}
