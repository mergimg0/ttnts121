import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { balanceReminderEmail } from "@/lib/email-templates";
import { formatPrice, getDayName } from "@/lib/booking-utils";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no cron secret is configured, allow in development
  if (!cronSecret && process.env.NODE_ENV === "development") {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    // Find bookings with deposit_paid status and balance due
    const bookingsSnapshot = await adminDb
      .collection("bookings")
      .where("paymentStatus", "==", "deposit_paid")
      .get();

    for (const bookingDoc of bookingsSnapshot.docs) {
      const bookingData = bookingDoc.data();

      // Skip if no balance due date
      if (!bookingData.balanceDueDate) {
        continue;
      }

      // Skip if reminder already sent
      if (bookingData.balanceReminderSent) {
        continue;
      }

      // Parse balance due date
      let balanceDueDate: Date;
      if (bookingData.balanceDueDate._seconds) {
        balanceDueDate = new Date(bookingData.balanceDueDate._seconds * 1000);
      } else if (bookingData.balanceDueDate instanceof Date) {
        balanceDueDate = bookingData.balanceDueDate;
      } else {
        balanceDueDate = new Date(bookingData.balanceDueDate);
      }

      // Calculate days until due
      const daysUntilDue = Math.ceil(
        (balanceDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminder 7 days before, 3 days before, and 1 day before
      const shouldSendReminder =
        daysUntilDue === 7 ||
        daysUntilDue === 3 ||
        daysUntilDue === 1 ||
        daysUntilDue === 0;

      // Also send if overdue (negative days) and not already reminded
      const isOverdue = daysUntilDue < 0;

      if (!shouldSendReminder && !isOverdue) {
        continue;
      }

      results.processed++;

      try {
        // Get session details
        const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
        const sessions: Array<{ name: string; dayOfWeek: string }> = [];

        for (const sessionId of sessionIds) {
          if (!sessionId) continue;
          const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
          const sessionData = sessionDoc.data();

          if (sessionData) {
            sessions.push({
              name: sessionData.name || "Football Session",
              dayOfWeek: getDayName(sessionData.dayOfWeek),
            });
          }
        }

        const formattedDueDate = balanceDueDate.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ttnts.co.uk";
        const payBalanceUrl = `${baseUrl}/portal/bookings/${bookingDoc.id}/pay-balance`;

        const emailContent = balanceReminderEmail({
          parentFirstName: bookingData.parentFirstName,
          childFirstName: bookingData.childFirstName,
          bookingRef: bookingData.bookingRef || bookingDoc.id.slice(0, 8).toUpperCase(),
          sessions,
          balanceDue: formatPrice(bookingData.balanceDue || 0),
          balanceDueDate: formattedDueDate,
          daysUntilDue: Math.max(0, daysUntilDue),
          payBalanceUrl,
        });

        const emailResult = await sendEmail({
          to: bookingData.parentEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        if (emailResult.success) {
          results.emailsSent++;

          // Mark reminder as sent (only for final reminder or overdue)
          if (daysUntilDue <= 1 || isOverdue) {
            await adminDb.collection("bookings").doc(bookingDoc.id).update({
              balanceReminderSent: true,
              lastReminderSentAt: now,
              updatedAt: now,
            });
          } else {
            // Just update last reminder time for earlier reminders
            await adminDb.collection("bookings").doc(bookingDoc.id).update({
              lastReminderSentAt: now,
              updatedAt: now,
            });
          }

          console.log(
            `Balance reminder sent for booking ${bookingDoc.id} (${daysUntilDue} days until due)`
          );
        } else {
          results.errors.push(
            `Failed to send email for booking ${bookingDoc.id}: ${emailResult.error}`
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Error processing booking ${bookingDoc.id}: ${errorMessage}`);
        console.error(`Error processing booking ${bookingDoc.id}:`, error);
      }
    }

    console.log(
      `Balance reminders cron completed: ${results.processed} processed, ${results.emailsSent} emails sent`
    );

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Error in balance reminders cron:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process balance reminders" },
      { status: 500 }
    );
  }
}
