import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";
import { SESSION_TYPES, LOCATIONS, AGE_GROUPS, PAYMENT_OPTIONS } from "@/lib/constants";
import { secureAlphanumericCode } from "@/lib/secure-random";

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

// Generate a simple booking reference
function generateBookingRef(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = secureAlphanumericCode(4);
  return `TTNTS-${dateStr}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // Session
      sessionType,
      location,
      ageGroup,
      // Child
      childFirstName,
      childLastName,
      childDob,
      medicalInfo,
      // Parent
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone,
      emergencyContact,
      emergencyPhone,
      // Payment
      paymentMethod,
      // Consent
      photoConsent,
      termsAccepted,
    } = body;

    // Validate required fields
    if (
      !sessionType ||
      !location ||
      !ageGroup ||
      !childFirstName ||
      !childLastName ||
      !childDob ||
      !parentFirstName ||
      !parentLastName ||
      !parentEmail ||
      !parentPhone ||
      !emergencyContact ||
      !emergencyPhone ||
      !paymentMethod ||
      !termsAccepted
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bookingRef = generateBookingRef();
    const timestamp = new Date().toISOString();

    // Get display names for selections
    const sessionName = SESSION_TYPES.find((s) => s.id === sessionType)?.name || sessionType;
    const locationName = LOCATIONS.find((l) => l.id === location)?.name || location;
    const ageGroupName = AGE_GROUPS.find((a) => a.id === ageGroup)?.name || ageGroup;
    const paymentMethodName = PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)?.name || paymentMethod;

    // Save to Google Sheets
    if (process.env.GOOGLE_SHEETS_ID) {
      try {
        const sheets = await getGoogleSheetsClient();
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEETS_ID,
          range: "Bookings!A:Q",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [
              [
                bookingRef,
                timestamp,
                sessionName,
                locationName,
                ageGroupName,
                childFirstName,
                childLastName,
                childDob,
                medicalInfo || "",
                parentFirstName,
                parentLastName,
                parentEmail,
                parentPhone,
                emergencyContact,
                emergencyPhone,
                paymentMethodName,
                photoConsent ? "Yes" : "No",
              ],
            ],
          },
        });
      } catch (sheetsError) {
        console.error("Google Sheets error:", sheetsError);
      }
    }

    // Send notification email to owner
    const resend = getResendClient();
    if (resend && process.env.OWNER_EMAIL) {
      try {
        await resend.emails.send({
          from: "TTNTS121 Bookings <noreply@takethenextstep121.co.uk>",
          to: process.env.OWNER_EMAIL,
          subject: `New Booking: ${childFirstName} ${childLastName} - ${sessionName}`,
          html: `
            <h2>New Booking Received</h2>
            <p><strong>Booking Reference:</strong> ${bookingRef}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString("en-GB")}</p>

            <h3>Session Details</h3>
            <ul>
              <li><strong>Type:</strong> ${sessionName}</li>
              <li><strong>Location:</strong> ${locationName}</li>
              <li><strong>Age Group:</strong> ${ageGroupName}</li>
            </ul>

            <h3>Child Details</h3>
            <ul>
              <li><strong>Name:</strong> ${childFirstName} ${childLastName}</li>
              <li><strong>DOB:</strong> ${childDob}</li>
              <li><strong>Medical Info:</strong> ${medicalInfo || "None provided"}</li>
            </ul>

            <h3>Parent/Guardian Details</h3>
            <ul>
              <li><strong>Name:</strong> ${parentFirstName} ${parentLastName}</li>
              <li><strong>Email:</strong> ${parentEmail}</li>
              <li><strong>Phone:</strong> ${parentPhone}</li>
            </ul>

            <h3>Emergency Contact</h3>
            <ul>
              <li><strong>Name:</strong> ${emergencyContact}</li>
              <li><strong>Phone:</strong> ${emergencyPhone}</li>
            </ul>

            <h3>Payment & Consent</h3>
            <ul>
              <li><strong>Payment Method:</strong> ${paymentMethodName}</li>
              <li><strong>Photo Consent:</strong> ${photoConsent ? "Yes" : "No"}</li>
            </ul>

            <hr>
            <p><em>Please confirm this booking and send payment details to the parent.</em></p>
          `,
        });
      } catch (emailError) {
        console.error("Owner email error:", emailError);
      }
    }

    // Send confirmation email to parent
    if (resend) {
      try {
        await resend.emails.send({
          from: "Take The Next Step 121 <noreply@takethenextstep121.co.uk>",
          to: parentEmail,
          subject: `Booking Confirmation - ${childFirstName}'s Football Session`,
          html: `
            <h2>Booking Confirmation</h2>
            <p>Hi ${parentFirstName},</p>
            <p>Thank you for booking ${childFirstName} onto our football sessions! Here are your booking details:</p>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Booking Reference:</strong> ${bookingRef}</p>
              <p><strong>Session:</strong> ${sessionName}</p>
              <p><strong>Location:</strong> ${locationName}</p>
              <p><strong>Age Group:</strong> ${ageGroupName}</p>
            </div>

            <h3>What Happens Next?</h3>
            <ol>
              <li>We'll review your booking and confirm the session dates</li>
              <li>We'll send you payment details for your chosen method (${paymentMethodName})</li>
              <li>Once payment is received, your place is secured</li>
            </ol>

            <h3>What to Bring</h3>
            <ul>
              <li>Football boots or trainers</li>
              <li>Shin pads</li>
              <li>Water bottle</li>
              <li>Weather-appropriate clothing</li>
            </ul>

            <p>If you have any questions, just reply to this email or call us.</p>

            <p>We're looking forward to seeing ${childFirstName} on the pitch!</p>

            <p>Best regards,<br>The Take The Next Step 121 Team</p>

            <hr>
            <p style="font-size: 12px; color: #666;">
              This booking is subject to our terms and conditions.
              Cancellations must be made at least 24 hours in advance for a full refund.
            </p>
          `,
        });
      } catch (emailError) {
        console.error("Confirmation email error:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking submitted successfully",
        bookingRef,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to submit booking" },
      { status: 500 }
    );
  }
}
