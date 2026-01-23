import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";

// Initialize Resend only when API key is available
function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// Google Sheets setup
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, subject, message } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Save to Google Sheets
    if (process.env.GOOGLE_SHEETS_ID) {
      try {
        const sheets = await getGoogleSheetsClient();
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEETS_ID,
          range: "Contact!A:G",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [
              [timestamp, firstName, lastName, email, phone || "", subject, message],
            ],
          },
        });
      } catch (sheetsError) {
        console.error("Google Sheets error:", sheetsError);
        // Continue even if Sheets fails - email notification is more important
      }
    }

    // Send notification email to owner
    const resend = getResendClient();
    if (resend && process.env.OWNER_EMAIL) {
      try {
        await resend.emails.send({
          from: "TTNTS121 Website <noreply@takethenextstep121.co.uk>",
          to: process.env.OWNER_EMAIL,
          subject: `New Contact Form: ${subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Date:</strong> ${new Date().toLocaleString("en-GB")}</p>
            <p><strong>From:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr />
            <h3>Message:</h3>
            <p>${message.replace(/\n/g, "<br>")}</p>
          `,
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
      }
    }

    // Send confirmation email to sender
    if (resend) {
      try {
        await resend.emails.send({
          from: "Take The Next Step 121 <noreply@takethenextstep121.co.uk>",
          to: email,
          subject: "Thanks for contacting Take The Next Step 121",
          html: `
            <h2>Thanks for getting in touch!</h2>
            <p>Hi ${firstName},</p>
            <p>We've received your message and will get back to you as soon as possible, usually within 24 hours.</p>
            <p>In the meantime, feel free to check out our sessions on our website or follow us on social media.</p>
            <p>Best regards,<br>The Take The Next Step 121 Team</p>
            <hr>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          `,
        });
      } catch (emailError) {
        console.error("Confirmation email error:", emailError);
      }
    }

    return NextResponse.json(
      { success: true, message: "Contact form submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
