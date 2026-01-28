// Email service - uses Resend in production, logs in development
// To enable production emails:
// 1. npm install resend
// 2. Set RESEND_API_KEY in .env.local
// 3. Set EMAIL_FROM in .env.local (e.g., "TTNTS121 <noreply@yourdomain.com>")

import { SITE_CONFIG } from "./constants";

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  cc?: string | string[]; // CC recipients for secondary parent notifications
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, cc, subject, html, text, attachments } = options;

  // Check if Resend is configured
  const apiKey = process.env.RESEND_API_KEY;
  // Use Resend's test domain if no verified domain is set
  const fromEmail = process.env.EMAIL_FROM || "TTNTS <onboarding@resend.dev>";

  if (!apiKey) {
    // Development mode - just log the email
    console.log("📧 Email would be sent:");
    console.log(`  To: ${to}`);
    if (cc) console.log(`  CC: ${Array.isArray(cc) ? cc.join(", ") : cc}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  From: ${fromEmail}`);
    console.log("  (Set RESEND_API_KEY to enable actual email sending)");
    return { success: true, id: "dev-mode" };
  }

  try {
    // Use Resend API directly (no dependency needed)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        cc: cc || undefined,
        subject,
        html,
        text: text || stripHtml(html),
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          content: typeof att.content === "string"
            ? att.content
            : att.content.toString("base64"),
          content_type: att.contentType,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Simple HTML to text converter
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
