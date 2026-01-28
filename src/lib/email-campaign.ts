// Email campaign batch sending service
import { SITE_CONFIG } from "./constants";
import { Contact } from "@/types/contact";

interface CampaignEmailOptions {
  subject: string;
  body: string;
  contacts: Contact[];
}

interface BatchSendResult {
  successCount: number;
  failedCount: number;
  results: Array<{
    email: string;
    success: boolean;
    id?: string;
    error?: string;
  }>;
}

// Campaign email wrapper template
function wrapCampaignEmail(body: string): string {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
    .content { padding: 30px; background: #fff; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f5f5f5; }
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${SITE_CONFIG.shortName}</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>${SITE_CONFIG.name}</p>
      <p>Email: ${SITE_CONFIG.email} | Phone: ${SITE_CONFIG.phone}</p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        You're receiving this because you opted in to marketing communications.
        <br>To unsubscribe, please reply with "UNSUBSCRIBE" in the subject line.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
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

// Personalize email content with contact data
function personalizeContent(content: string, contact: Contact): string {
  return content
    .replace(/\{\{firstName\}\}/g, contact.firstName || "")
    .replace(/\{\{lastName\}\}/g, contact.lastName || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{location\}\}/g, contact.location || "");
}

// Send campaign emails in batches
export async function sendCampaignEmails(
  options: CampaignEmailOptions
): Promise<BatchSendResult> {
  const { subject, body, contacts } = options;

  const apiKey = process.env.RESEND_API_KEY;
  // Use Resend's test domain if no verified domain is set
  const fromEmail =
    process.env.EMAIL_FROM || "TTNTS <onboarding@resend.dev>";

  const results: BatchSendResult["results"] = [];
  let successCount = 0;
  let failedCount = 0;

  // Development mode - just log
  if (!apiKey) {
    console.log("📧 Campaign would be sent:");
    console.log(`  Subject: ${subject}`);
    console.log(`  Recipients: ${contacts.length}`);
    console.log("  (Set RESEND_API_KEY to enable actual email sending)");

    return {
      successCount: contacts.length,
      failedCount: 0,
      results: contacts.map((c) => ({
        email: c.email,
        success: true,
        id: "dev-mode",
      })),
    };
  }

  // Resend batch API supports up to 100 emails per request
  const BATCH_SIZE = 100;
  const batches = [];

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    batches.push(contacts.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    // Prepare batch emails
    const batchEmails = batch.map((contact) => {
      const personalizedBody = personalizeContent(body, contact);
      const personalizedSubject = personalizeContent(subject, contact);
      const html = wrapCampaignEmail(personalizedBody);

      return {
        from: fromEmail,
        to: contact.email,
        subject: personalizedSubject,
        html,
        text: stripHtml(html),
      };
    });

    try {
      // Use Resend batch API
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(batchEmails),
      });

      const data = await response.json();

      if (!response.ok) {
        // Batch failed - mark all as failed
        for (const contact of batch) {
          results.push({
            email: contact.email,
            success: false,
            error: data.message || "Batch send failed",
          });
          failedCount++;
        }
      } else {
        // Process batch results
        // Resend batch API returns { data: [{ id: "..." }, ...] }
        const batchResults = data.data || [];
        for (let i = 0; i < batch.length; i++) {
          const contact = batch[i];
          const result = batchResults[i];

          if (result?.id) {
            results.push({
              email: contact.email,
              success: true,
              id: result.id,
            });
            successCount++;
          } else {
            results.push({
              email: contact.email,
              success: false,
              error: result?.error || "Unknown error",
            });
            failedCount++;
          }
        }
      }
    } catch (error) {
      // Network error - mark batch as failed
      for (const contact of batch) {
        results.push({
          email: contact.email,
          success: false,
          error: error instanceof Error ? error.message : "Network error",
        });
        failedCount++;
      }
    }

    // Small delay between batches to avoid rate limiting
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return {
    successCount,
    failedCount,
    results,
  };
}
